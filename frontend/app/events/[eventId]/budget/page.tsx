'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import budgetAPI from '@/lib/budget-api';

interface BudgetSummary {
  totalAllocation: number;
  totalExpenses: number;
  remaining: number;
  utilisationPercent: number;
  expensesByCategory: Record<string, number>;
  paidExpenses: number;
  pendingExpenses: number;
}

export default function BudgetPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBudget() {
      try {
        setLoading(true);
        const budget = (await budgetAPI.getEventBudget(eventId)) as {
          id: string;
        };
        const budgetSummary = (await budgetAPI.getBudgetSummary(
          budget.id
        )) as BudgetSummary;
        setSummary(budgetSummary);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }

    loadBudget();
  }, [eventId]);

  if (loading) return <div className="p-4">Loading budget...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

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
              {Object.entries(summary.expensesByCategory).map(
                ([category, amount]) => (
                  <div
                    key={category}
                    className="flex justify-between border p-2 rounded"
                  >
                    <span className="capitalize">{category}</span>
                    <span className="font-semibold">₹{amount}</span>
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
