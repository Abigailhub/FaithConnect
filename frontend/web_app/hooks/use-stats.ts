import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface DashboardStats {
  members: {
    total: number;
    active: number;
    new: number;
    growth: number;
  };
  events: {
    total: number;
    upcoming: number;
    participants: number;
  };
  contributions: {
    total: number;
    verified: number;
    pending: number;
    growth: number;
  };
  engagement: {
    rate: number;
    evolution: number;
  };
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await apiClient.get('/stats/dashboard');
      return data.data as DashboardStats;
    },
  });
};

export const useFinancialReport = (period: string = 'month') => {
  return useQuery({
    queryKey: ['financial-report', period],
    queryFn: async () => {
      const { data } = await apiClient.get('/reports/financial', {
        params: { period }
      });
      return data.data;
    },
  });
};

export const useMembersReport = () => {
  return useQuery({
    queryKey: ['members-report'],
    queryFn: async () => {
      const { data } = await apiClient.get('/reports/members');
      return data.data;
    },
  });
};
