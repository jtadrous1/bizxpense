import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

// Default categories based on IRS Schedule C
const DEFAULT_CATEGORIES = [
  { name: "Advertising", color: "#EF4444", scheduleCCode: "Line 8" },
  { name: "Car & Truck Expenses", color: "#F97316", scheduleCCode: "Line 9" },
  { name: "Commissions & Fees", color: "#F59E0B", scheduleCCode: "Line 10" },
  { name: "Contract Labor", color: "#EAB308", scheduleCCode: "Line 11" },
  { name: "Depreciation", color: "#84CC16", scheduleCCode: "Line 13" },
  { name: "Insurance", color: "#22C55E", scheduleCCode: "Line 15" },
  { name: "Interest (Mortgage)", color: "#10B981", scheduleCCode: "Line 16a" },
  { name: "Interest (Other)", color: "#14B8A6", scheduleCCode: "Line 16b" },
  { name: "Legal & Professional Services", color: "#06B6D4", scheduleCCode: "Line 17" },
  { name: "Office Expense", color: "#0EA5E9", scheduleCCode: "Line 18" },
  { name: "Rent/Lease (Vehicles & Equipment)", color: "#3B82F6", scheduleCCode: "Line 20a" },
  { name: "Rent/Lease (Other)", color: "#6366F1", scheduleCCode: "Line 20b" },
  { name: "Repairs & Maintenance", color: "#8B5CF6", scheduleCCode: "Line 21" },
  { name: "Supplies", color: "#A855F7", scheduleCCode: "Line 22" },
  { name: "Taxes & Licenses", color: "#D946EF", scheduleCCode: "Line 23" },
  { name: "Travel", color: "#EC4899", scheduleCCode: "Line 24a" },
  { name: "Deductible Meals", color: "#F43F5E", scheduleCCode: "Line 24b" },
  { name: "Utilities", color: "#78716C", scheduleCCode: "Line 25" },
  { name: "Wages", color: "#64748B", scheduleCCode: "Line 26" },
  { name: "Other Expenses", color: "#6B7280", scheduleCCode: "Line 27a" },
  { name: "Software & Subscriptions", color: "#0891B2", scheduleCCode: null },
  { name: "Tools & Equipment", color: "#059669", scheduleCCode: null },
  { name: "Education & Training", color: "#7C3AED", scheduleCCode: null },
  { name: "Phone & Internet", color: "#2563EB", scheduleCCode: null },
  { name: "Bank & Merchant Fees", color: "#DC2626", scheduleCCode: null },
];

async function main() {
  console.log("Seeding database...");

  // Create a demo user
  const passwordHash = await hash("demo1234", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
      passwordHash,
    },
  });

  console.log(`Created user: ${user.email}`);

  // Create default categories for the demo user
  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { name_userId: { name: cat.name, userId: user.id } },
      update: {},
      create: {
        name: cat.name,
        color: cat.color,
        scheduleCCode: cat.scheduleCCode,
        userId: user.id,
      },
    });
  }

  console.log(`Created ${DEFAULT_CATEGORIES.length} categories`);

  // Create a few sample expenses
  const categories = await prisma.category.findMany({
    where: { userId: user.id },
  });

  const catMap = new Map(categories.map((c) => [c.name, c.id]));

  const sampleExpenses = [
    { date: new Date("2026-01-05"), vendor: "Amazon Web Services", amount: 45.99, categoryName: "Software & Subscriptions", paymentMethod: "Credit Card", notes: "Monthly hosting" },
    { date: new Date("2026-01-08"), vendor: "Office Depot", amount: 127.50, categoryName: "Office Expense", paymentMethod: "Credit Card", notes: "Printer paper and toner" },
    { date: new Date("2026-01-12"), vendor: "Shell Gas Station", amount: 52.30, categoryName: "Car & Truck Expenses", paymentMethod: "Debit Card", notes: "Client visit fuel" },
    { date: new Date("2026-01-15"), vendor: "Zoom", amount: 14.99, categoryName: "Software & Subscriptions", paymentMethod: "Credit Card", notes: "Monthly subscription" },
    { date: new Date("2026-01-20"), vendor: "Hilton Hotels", amount: 189.00, categoryName: "Travel", paymentMethod: "Credit Card", notes: "Business conference" },
    { date: new Date("2026-01-22"), vendor: "Uber", amount: 34.50, categoryName: "Travel", paymentMethod: "Credit Card", notes: "Airport transfer" },
    { date: new Date("2026-01-25"), vendor: "Home Depot", amount: 87.42, categoryName: "Tools & Equipment", paymentMethod: "Cash", notes: "Job site supplies" },
    { date: new Date("2026-02-01"), vendor: "Google Workspace", amount: 12.00, categoryName: "Software & Subscriptions", paymentMethod: "Credit Card", notes: "Business email" },
    { date: new Date("2026-02-03"), vendor: "Chipotle", amount: 18.75, categoryName: "Deductible Meals", paymentMethod: "Credit Card", notes: "Client lunch" },
    { date: new Date("2026-02-05"), vendor: "Verizon", amount: 85.00, categoryName: "Phone & Internet", paymentMethod: "Auto-Pay", notes: "Business phone line" },
  ];

  for (const exp of sampleExpenses) {
    await prisma.expense.create({
      data: {
        date: exp.date,
        vendor: exp.vendor,
        amount: exp.amount,
        categoryId: catMap.get(exp.categoryName) || null,
        paymentMethod: exp.paymentMethod,
        notes: exp.notes,
        userId: user.id,
      },
    });
  }

  console.log(`Created ${sampleExpenses.length} sample expenses`);
  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
