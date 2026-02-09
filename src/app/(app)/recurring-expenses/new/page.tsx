import RecurringExpenseForm from "@/components/RecurringExpenseForm";

export default function NewRecurringExpensePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          New Recurring Expense
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Set up a recurring payment that automatically generates expenses on
          schedule.
        </p>
      </div>

      <div className="card p-6">
        <RecurringExpenseForm />
      </div>
    </div>
  );
}
