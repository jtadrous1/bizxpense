import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized } from "@/lib/auth-helpers";

// POST /api/recurring-expenses/process - Generate expenses for all due recurring payments
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  try {
    const now = new Date();
    // Set to end of today so we capture anything due today
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Find all active recurring expenses that are due
    const dueRecurring = await prisma.recurringExpense.findMany({
      where: {
        userId: user.id,
        isActive: true,
        nextDueDate: { lte: today },
        // Only include if no end date or end date hasn't passed
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      },
    });

    const generatedExpenses = [];

    for (const recurring of dueRecurring) {
      // Generate expenses for each missed period (in case multiple months were missed)
      let dueDate = new Date(recurring.nextDueDate);

      while (dueDate <= today) {
        // Check if an expense was already generated for this exact date
        const existingExpense = await prisma.expense.findFirst({
          where: {
            recurringExpenseId: recurring.id,
            date: dueDate,
          },
        });

        if (!existingExpense) {
          const expense = await prisma.expense.create({
            data: {
              date: dueDate,
              vendor: recurring.vendor,
              description: recurring.description
                ? `${recurring.description} (recurring)`
                : `Recurring payment - ${recurring.vendor}`,
              amount: recurring.amount,
              categoryId: recurring.categoryId,
              paymentMethod: recurring.paymentMethod,
              notes: recurring.notes,
              tags: recurring.tags,
              recurringExpenseId: recurring.id,
              userId: recurring.userId,
            },
            include: { category: true },
          });
          generatedExpenses.push(expense);
        }

        // Move to next period
        dueDate = getNextDate(dueDate, recurring.frequency);
      }

      // Update the next due date and deactivate if past end date
      const nextDue = dueDate; // Already advanced past today
      const shouldDeactivate =
        recurring.endDate && nextDue > recurring.endDate;

      await prisma.recurringExpense.update({
        where: { id: recurring.id },
        data: {
          nextDueDate: nextDue,
          ...(shouldDeactivate ? { isActive: false } : {}),
        },
      });
    }

    return NextResponse.json({
      processed: dueRecurring.length,
      generated: generatedExpenses.length,
      expenses: generatedExpenses,
    });
  } catch (error) {
    console.error("Error processing recurring expenses:", error);
    return NextResponse.json(
      { error: "Failed to process recurring expenses" },
      { status: 500 }
    );
  }
}

function getNextDate(current: Date, frequency: string): Date {
  const next = new Date(current);
  switch (frequency) {
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
    case "monthly":
    default:
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
}
