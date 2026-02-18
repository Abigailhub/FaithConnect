import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

export interface Contribution {
  id: number;
  membreId: string;
  membre: string;
  type: string;
  montant: number;
  date: string;
  methode: string;
  statut: 'En attente' | 'Validé' | 'Rejeté';
  description?: string;
  reference?: string;
}

export const useContributions = (searchTerm?: string) => {
  return useQuery({
    queryKey: ['contributions', searchTerm],
    queryFn: async () => {
      const params = searchTerm ? { search: searchTerm } : {};
      const { data } = await apiClient.get('/contributions', { params });
      return data.data as Contribution[];
    },
  });
};

export const useAddContribution = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newContribution: Omit<Contribution, 'id' | 'reference'>) => {
      const { data } = await apiClient.post('/contributions', newContribution);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributions'] });
      toast.success('Contribution enregistrée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    },
  });
};

export const useUpdateContribution = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Contribution> & { id: number }) => {
      const { data: response } = await apiClient.put(`/contributions/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributions'] });
      toast.success('Contribution modifiée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    },
  });
};

export const useDeleteContribution = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/contributions/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributions'] });
      toast.success('Contribution supprimée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    },
  });
};

export const useValidateContribution = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post(`/contributions/${id}/verify`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributions'] });
      toast.success('Contribution validée');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la validation');
    },
  });
};
