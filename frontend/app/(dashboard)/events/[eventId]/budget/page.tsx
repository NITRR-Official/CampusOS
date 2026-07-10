'use client';

import { useParams } from 'next/navigation';
import {
  useEventBudget,
  useBudgetSummary
} from '@plugins/budget/frontend/hooks';

export default function BudgetPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const {
    data: budget,
    isLoading: isLoadingBudget,
    error: budgetError
  } = useEventBudget(eventId);

  const {
    data: summary,
    isLoading: isLoadingSummary,
    error: summaryError
  } = useBudgetSummary(budget?.id || '');

  const loading = isLoadingBudget || (budget && isLoadingSummary);
  const error = budgetError || summaryError;

  if (loading) return <div className="p-4">Loading budget...</div>;
  if (error)
    return (
      <div className="p-4 text-red-600">
        Error: {error instanceof Error ? error.message : String(error)}
      </div>
    );
  if (!budget)
    return <div className="p-4">No budget found for this event.</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Event Budget</h1>

      {summary && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded">
              <p className="text-gray-600 text-sm">Total Allocation</p>
              <p className="text-2xl font-bold">₹{summary.totalAllocation}</p>
            </div>
            <div className="bg-red-50 p-4 rounded">
              <p className="text-gray-600 text-sm">Total Expenses</p>
              <p className="text-2xl font-bold">₹{summary.totalExpenses}</p>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <p className="text-gray-600 text-sm">Remaining</p>
              <p className="text-2xl font-bold">₹{summary.remaining}</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-2">Budget Utilisation</p>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full"
                style={{
                  width: `${Math.min(summary.utilisationPercent, 100)}%`
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {summary.utilisationPercent}% utilised
            </p>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Expenses by Category</h2>
            <div className="space-y-2">
              {Object.entries(summary.expensesByCategory || {}).map(
                ([category, amount]) => (
                  <div
                    key={category}
                    className="flex justify-between border p-2 rounded"
                  >
                    <span className="capitalize">{category}</span>
                    <span className="font-semibold">₹{amount as number}</span>
                  </div>
                )
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">Payment Status</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="border p-4 rounded">
                <p className="text-gray-600 text-sm">Paid</p>
                <p className="text-2xl font-bold">₹{summary.paidExpenses}</p>
              </div>
              <div className="border p-4 rounded">
                <p className="text-gray-600 text-sm">Pending</p>
                <p className="text-2xl font-bold">₹{summary.pendingExpenses}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
