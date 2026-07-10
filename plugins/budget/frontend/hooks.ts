import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import budgetAPI from './api';

export function useEventBudget(eventId: string) {
  return useQuery({
    queryKey: ['events', eventId, 'budget'],
    queryFn: () => budgetAPI.getEventBudget(eventId),
    enabled: !!eventId,
  });
}

export function useBudgetSummary(budgetId: string) {
  return useQuery({
    queryKey: ['budgets', budgetId, 'summary'],
    queryFn: () => budgetAPI.getBudgetSummary(budgetId),
    enabled: !!budgetId,
  });
}
