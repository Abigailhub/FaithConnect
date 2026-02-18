'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEvents, useAddEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/use-events';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Calendar, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  FileText,
  UserPlus,
  UserMinus,
  Sparkles,
  CalendarDays,
  LayoutGrid
} from 'lucide-react';

export default function EventsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  
  // Hooks API
  const { data: events = [], isLoading, refetch } = useEvents(searchTerm);
  const addEvent = useAddEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    date: '',
    heure: '',
    lieu: '',
    organisateur: '',
    maxParticipants: '50',
    type: 'Culte',
    statut: 'À venir'
  });

  // AJOUTER
  const handleAdd = async () => {
    if (!formData.titre || !formData.date || !formData.heure || !formData.lieu) {
      alert('Veuillez remplir le titre, la date, l\'heure et le lieu');
      return;
    }
    try {
      await addEvent.mutateAsync({
        ...formData,
        maxParticipants: parseInt(formData.maxParticipants) || 50
      });
      setIsAddOpen(false);
      setFormData({ titre: '', description: '', date: '', heure: '', lieu: '', organisateur: '', maxParticipants: '50', type: 'Culte', statut: 'À venir' });
      await refetch(); // Rafraîchir la liste
    } catch (error) {
      console.error('Erreur ajout:', error);
    }
  };

  // MODIFIER
  const handleEdit = async () => {
    if (!currentEvent) return;
    try {
      const updatedData: any = {};
      if (formData.titre !== currentEvent.titre) updatedData.titre = formData.titre;
      if (formData.description !== currentEvent.description) updatedData.description = formData.description;
      if (formData.date !== currentEvent.date) updatedData.date = formData.date;
      if (formData.heure !== currentEvent.heure) updatedData.heure = formData.heure;
      if (formData.lieu !== currentEvent.lieu) updatedData.lieu = formData.lieu;
      if (formData.organisateur !== currentEvent.organisateur) updatedData.organisateur = formData.organisateur;
      if (parseInt(formData.maxParticipants) !== currentEvent.maxParticipants) {
        updatedData.maxParticipants = parseInt(formData.maxParticipants) || 50;
      }
      if (formData.type !== currentEvent.type) updatedData.type = formData.type;
      if (formData.statut !== currentEvent.statut) updatedData.statut = formData.statut;

      if (Object.keys(updatedData).length > 0) {
        await updateEvent.mutateAsync({ 
          id: currentEvent.id, 
          ...updatedData
        });
        await refetch(); // Rafraîchir après modification
      }
      setIsEditOpen(false);
    } catch (error) {
      console.error('Erreur modification:', error);
    }
  };

  // SUPPRIMER
  const handleDelete = async () => {
    if (!currentEvent) return;
    try {
      await deleteEvent.mutateAsync(currentEvent.id);
      setIsDeleteOpen(false);
      await refetch(); // Rafraîchir après suppression
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  // CHANGER STATUT
  const toggleStatut = async (event: any) => {
    try {
      const newStatut = event.statut === 'À venir' ? 'Terminé' : 'À venir';
      console.log('🔄 Changement statut:', event.id, 'de', event.statut, 'à', newStatut);
      
      await updateEvent.mutateAsync({ 
        id: event.id, 
        statut: newStatut 
      });
      
      // Force le rafraîchissement
      setTimeout(async () => {
        await refetch();
      }, 100);
      
    } catch (error) {
      console.error('❌ Erreur changement statut:', error);
    }
  };

  // AJOUTER UN PARTICIPANT
  const addParticipant = async (event: any) => {
    if (event.maxParticipants && event.participants >= event.maxParticipants) {
      alert('Nombre maximum de participants atteint');
      return;
    }
    try {
      const newParticipants = (event.participants || 0) + 1;
      console.log('➕ Ajout participant:', event.id, 'nouveau total:', newParticipants);
      
      await updateEvent.mutateAsync({ 
        id: event.id, 
        participants: newParticipants 
      });
      
      // Force le rafraîchissement
      setTimeout(async () => {
        await refetch();
      }, 100);
      
    } catch (error) {
      console.error('❌ Erreur ajout participant:', error);
    }
  };

  // RETIRER UN PARTICIPANT
  const removeParticipant = async (event: any) => {
    if (event.participants <= 0) return;
    try {
      const newParticipants = (event.participants || 0) - 1;
      console.log('➖ Retrait participant:', event.id, 'nouveau total:', newParticipants);
      
      await updateEvent.mutateAsync({ 
        id: event.id, 
        participants: newParticipants 
      });
      
      // Force le rafraîchissement
      setTimeout(async () => {
        await refetch();
      }, 100);
      
    } catch (error) {
      console.error('❌ Erreur retrait participant:', error);
    }
  };

  // OUVRIR MODIFICATION
  const openEditDialog = (event: any) => {
    setCurrentEvent(event);
    setFormData({
      titre: event.titre || '',
      description: event.description || '',
      date: event.date || '',
      heure: event.heure || '',
      lieu: event.lieu || '',
      organisateur: event.organisateur || '',
      maxParticipants: event.maxParticipants?.toString() || '50',
      type: event.type || 'Culte',
      statut: event.statut || 'À venir'
    });
    setIsEditOpen(true);
  };

  // FORMAT DATE
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="text-center relative">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          </div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Chargement des événements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 relative overflow-hidden">
      {/* 🌟 ARRIÈRE-PLAN AMÉLIORÉ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-green-300 to-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-teal-300 to-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-green-200 to-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        
        <div className="absolute top-20 left-20 w-2 h-2 bg-green-400 rounded-full opacity-40"></div>
        <div className="absolute top-40 right-40 w-3 h-3 bg-emerald-400 rounded-full opacity-40"></div>
        <div className="absolute bottom-20 right-20 w-4 h-4 bg-teal-400 rounded-full opacity-40"></div>
        <div className="absolute bottom-40 left-40 w-2 h-2 bg-cyan-400 rounded-full opacity-40"></div>
        
        <svg className="absolute inset-0 w-full h-full opacity-10">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* HEADER */}
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => router.push('/dashboard')}
              className="h-10 w-10 rounded-full hover:bg-white/80 bg-white shadow-md"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg blur opacity-30"></div>
              <div className="relative bg-white rounded-lg p-4 shadow-md flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Gestion des événements
                  </h1>
                  <p className="text-gray-500 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    {events.length} événements au total
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition"></div>
              <Card className="relative bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <Calendar className="h-5 w-5 text-green-600" />
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Total
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mt-4">{events.length}</p>
                  <p className="text-sm text-gray-500">événements créés</p>
                </CardContent>
              </Card>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition"></div>
              <Card className="relative bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      À venir
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mt-4">
                    {events.filter((e: any) => e.statut === 'À venir').length}
                  </p>
                  <p className="text-sm text-gray-500">événements à venir</p>
                </CardContent>
              </Card>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition"></div>
              <Card className="relative bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                      Participants
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mt-4">
                    {events.reduce((acc: number, e: any) => acc + (e.participants || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-500">participants inscrits</p>
                </CardContent>
              </Card>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600 to-amber-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition"></div>
              <Card className="relative bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="bg-orange-100 p-3 rounded-lg">
                      <MapPin className="h-5 w-5 text-orange-600" />
                    </div>
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                      Lieux
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mt-4">
                    {new Set(events.map((e: any) => e.lieu).filter(Boolean)).size}
                  </p>
                  <p className="text-sm text-gray-500">lieux différents</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ACTIONS et RECHERCHE */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-auto">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg blur opacity-20"></div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Rechercher un événement..." 
                  className="pl-10 w-full md:w-80 bg-white/80 backdrop-blur-sm border-white/50"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* BOUTON AJOUTER */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un événement
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    Créer un événement
                  </DialogTitle>
                  <DialogDescription>
                    Remplissez les informations de l'événement. Les champs avec * sont obligatoires.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="bg-green-50/50 backdrop-blur-sm p-3 rounded-lg border border-green-100">
                    <h3 className="font-medium text-green-700 mb-3 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Informations générales
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Titre *</Label>
                        <Input 
                          placeholder="Culte dominical"
                          value={formData.titre} 
                          onChange={e => setFormData({...formData, titre: e.target.value})} 
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Input 
                          placeholder="Description de l'événement"
                          value={formData.description} 
                          onChange={e => setFormData({...formData, description: e.target.value})} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50/50 backdrop-blur-sm p-3 rounded-lg border border-blue-100">
                    <h3 className="font-medium text-blue-700 mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Date et lieu
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Date *</Label>
                        <Input 
                          type="date"
                          value={formData.date} 
                          onChange={e => setFormData({...formData, date: e.target.value})} 
                        />
                      </div>
                      <div>
                        <Label>Heure *</Label>
                        <Input 
                          type="time"
                          value={formData.heure} 
                          onChange={e => setFormData({...formData, heure: e.target.value})} 
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label>Lieu *</Label>
                      <Input 
                        placeholder="Salle principale"
                        value={formData.lieu} 
                        onChange={e => setFormData({...formData, lieu: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="bg-purple-50/50 backdrop-blur-sm p-3 rounded-lg border border-purple-100">
                    <h3 className="font-medium text-purple-700 mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Participants
                    </h3>
                    <div>
                      <Label>Max participants</Label>
                      <Input 
                        type="number"
                        placeholder="50"
                        value={formData.maxParticipants} 
                        onChange={e => setFormData({...formData, maxParticipants: e.target.value})} 
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleAdd} 
                    disabled={addEvent.isPending}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {addEvent.isPending ? 'Création...' : 'Créer'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* TABLEAU */}
          <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-xl">
            <CardHeader className="pb-2 border-b border-gray-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="h-6 w-1 bg-gradient-to-b from-green-600 to-emerald-600 rounded-full"></div>
                Liste des événements ({events.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {events.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-white">
                      <TableHead className="font-semibold">Titre</TableHead>
                      <TableHead className="font-semibold">Date & Heure</TableHead>
                      <TableHead className="font-semibold">Lieu</TableHead>
                      <TableHead className="font-semibold">Participants</TableHead>
                      <TableHead className="font-semibold">Statut</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event: any) => (
                      <TableRow key={event.id} className="hover:bg-gradient-to-r hover:from-green-50/50 hover:to-emerald-50/50 transition-colors">
                        <TableCell>
                          <div className="font-medium flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                              {event.titre?.[0]}
                            </div>
                            <div>
                              <div>{event.titre}</div>
                              <div className="text-xs text-gray-500">{event.type || 'Événement'}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{formatDate(event.date)}</div>
                          <div className="text-xs text-gray-500">{event.heure}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{event.lieu}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6 rounded-full hover:bg-red-50"
                              onClick={() => removeParticipant(event)}
                              disabled={event.participants <= 0}
                            >
                              <UserMinus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium min-w-[60px] text-center">
                              {event.participants || 0} / {event.maxParticipants || '∞'}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6 rounded-full hover:bg-green-50"
                              onClick={() => addParticipant(event)}
                              disabled={event.maxParticipants && event.participants >= event.maxParticipants}
                            >
                              <UserPlus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStatut(event)}
                            className="p-0 h-auto hover:bg-transparent"
                          >
                            <Badge 
                              className={
                                event.statut === 'À venir' 
                                  ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer px-3 py-1' 
                                  : event.statut === 'Terminé'
                                  ? 'bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-pointer px-3 py-1'
                                  : 'bg-red-100 text-red-800 hover:bg-red-200 cursor-pointer px-3 py-1'
                              }
                            >
                              {event.statut}
                            </Badge>
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="hover:bg-blue-50"
                              onClick={() => {
                                setCurrentEvent(event);
                                setIsDetailsOpen(true);
                              }}
                            >
                              <FileText className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="hover:bg-green-50"
                              onClick={() => openEditDialog(event)}
                            >
                              <Edit className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="hover:bg-red-50"
                              onClick={() => {
                                setCurrentEvent(event);
                                setIsDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 mb-4">
                    <Calendar className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun événement</h3>
                  <p className="text-gray-500">Commencez par créer votre premier événement</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* DIALOGUE DÉTAILS */}
          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Détails de l'événement</DialogTitle>
              </DialogHeader>
              {currentEvent && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg text-green-800">{currentEvent.titre}</h3>
                    <p className="text-gray-600 mt-2">{currentEvent.description || 'Aucune description'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Date
                      </p>
                      <p className="font-medium mt-1">{formatDate(currentEvent.date)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Heure
                      </p>
                      <p className="font-medium mt-1">{currentEvent.heure}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Lieu
                    </p>
                    <p className="font-medium mt-1">{currentEvent.lieu}</p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Participants
                    </p>
                    <p className="font-medium mt-1">{currentEvent.participants || 0} / {currentEvent.maxParticipants || 'Illimité'}</p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4" />
                      Statut
                    </p>
                    <Badge 
                      className={
                        currentEvent.statut === 'À venir' 
                          ? 'bg-blue-100 text-blue-800 mt-2' 
                          : currentEvent.statut === 'Terminé'
                          ? 'bg-gray-100 text-gray-800 mt-2'
                          : 'bg-red-100 text-red-800 mt-2'
                      }
                    >
                      {currentEvent.statut}
                    </Badge>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button onClick={() => setIsDetailsOpen(false)}>Fermer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* DIALOGUE MODIFICATION */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Modifier l'événement</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="bg-green-50/50 p-3 rounded-lg">
                  <h3 className="font-medium text-green-700 mb-3">Informations générales</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Titre</Label>
                      <Input value={formData.titre} onChange={e => setFormData({...formData, titre: e.target.value})} />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/50 p-3 rounded-lg">
                  <h3 className="font-medium text-blue-700 mb-3">Date et lieu</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Date</Label>
                      <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                    </div>
                    <div>
                      <Label>Heure</Label>
                      <Input type="time" value={formData.heure} onChange={e => setFormData({...formData, heure: e.target.value})} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label>Lieu</Label>
                    <Input value={formData.lieu} onChange={e => setFormData({...formData, lieu: e.target.value})} />
                  </div>
                </div>

                <div className="bg-purple-50/50 p-3 rounded-lg">
                  <h3 className="font-medium text-purple-700 mb-3">Participants</h3>
                  <div>
                    <Label>Max participants</Label>
                    <Input 
                      type="number"
                      value={formData.maxParticipants} 
                      onChange={e => setFormData({...formData, maxParticipants: e.target.value})} 
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleEdit} 
                  disabled={updateEvent.isPending}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {updateEvent.isPending ? 'Modification...' : 'Enregistrer'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* DIALOGUE SUPPRESSION */}
          <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-red-600">Confirmer la suppression</DialogTitle>
                <DialogDescription>
                  Êtes-vous sûr de vouloir supprimer l'événement "{currentEvent?.titre}" ?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={deleteEvent.isPending}
                >
                  {deleteEvent.isPending ? 'Suppression...' : 'Supprimer'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Styles pour les animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(20px, -20px) rotate(5deg); }
          50% { transform: translate(0, -40px) rotate(0deg); }
          75% { transform: translate(-20px, -20px) rotate(-5deg); }
        }
        
        @keyframes blob {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
        
        .animate-float {
          animation: float 20s ease-in-out infinite;
        }
        
        .animate-blob {
          animation: blob 25s ease-in-out infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}