import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

export interface Event {
  id: number;
  titre: string;
  description?: string;
  date: string;
  heure: string;
  lieu: string;
  organisateur?: string;
  maxParticipants?: number;
  participants: number;
  statut: 'À venir' | 'Terminé' | 'Annulé' | 'Reporté';
  type: string;
}

export const useEvents = (searchTerm?: string) => {
  return useQuery({
    queryKey: ['events', searchTerm],
    queryFn: async () => {
      const params = searchTerm ? { search: searchTerm } : {};
      const { data } = await apiClient.get('/events', { params });
      return data.data as Event[];
    },
  });
};

export const useAddEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newEvent: Omit<Event, 'id' | 'participants'>) => {
      const { data } = await apiClient.post('/events', newEvent);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Événement créé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Event> & { id: number }) => {
      const { data: response } = await apiClient.put(`/events/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Événement modifié avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/events/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Événement supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    },
  });
};
