import ExpenseForm from "@/components/ExpenseForm";

export default function NewExpensePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Add Expense</h1>
        <p className="mt-1 text-sm text-gray-500">
          Record a new business expense
        </p>
      </div>

      <div className="card p-6 max-w-3xl">
        <ExpenseForm />
      </div>
    </div>
  );
}
