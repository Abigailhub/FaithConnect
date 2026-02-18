import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

export interface Member {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  dateNaissance?: string;
  profession?: string;
  groupe?: string;
  statut: 'Actif' | 'Inactif';
  dateInscription: string;
}

export const useMembers = (searchTerm?: string) => {
  return useQuery({
    queryKey: ['members', searchTerm],
    queryFn: async () => {
      const params = searchTerm ? { search: searchTerm } : {};
      const { data } = await apiClient.get('/members', { params });
      return data.data as Member[];
    },
  });
};

export const useMember = (id: number) => {
  return useQuery({
    queryKey: ['member', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/members/${id}`);
      return data.data as Member;
    },
    enabled: !!id,
  });
};

export const useAddMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newMember: Omit<Member, 'id' | 'dateInscription'>) => {
      const { data } = await apiClient.post('/members', newMember);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Membre ajouté avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'ajout');
    },
  });
};

export const useUpdateMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Member> & { id: number }) => {
      const { data: response } = await apiClient.put(`/members/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member', variables.id] });
      toast.success('Membre modifié avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    },
  });
};

export const useDeleteMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/members/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Membre supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    },
  });
};
