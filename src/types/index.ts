export interface ExpenseWithCategory {
  id: string;
  date: string;
  vendor: string;
  description: string | null;
  amount: string; // Decimal comes as string from Prisma
  categoryId: string | null;
  category: {
    id: string;
    name: string;
    color: string;
    scheduleCCode: string | null;
  } | null;
  paymentMethod: string | null;
  notes: string | null;
  receiptPath: string | null;
  receiptName: string | null;
  tags: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategorySummary {
  id: string;
  name: string;
  color: string;
  scheduleCCode: string | null;
  total: number;
  count: number;
}

export interface DashboardData {
  totalExpenses: number;
  expenseCount: number;
  avgExpense: number;
  topCategories: CategorySummary[];
  monthlyTotals: { month: string; total: number }[];
  recentExpenses: ExpenseWithCategory[];
}

export interface ExpenseFilters {
  search?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: string;
  amountMax?: string;
  paymentMethod?: string;
}
