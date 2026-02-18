'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useContributions, useAddContribution, useUpdateContribution, useDeleteContribution, useValidateContribution } from '@/hooks/use-contributions';
import { useMembers } from '@/hooks/use-members';
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
  CreditCard, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ArrowLeft,
  DollarSign,
  Calendar,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Wallet,
  TrendingUp,
  Users,
  RefreshCw,
  Heart
} from 'lucide-react';

export default function ContributionsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentContribution, setCurrentContribution] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // Hooks API
  const { data: members = [], refetch: refetchMembers } = useMembers();
  const { data: contributions = [], isLoading, refetch: refetchContributions } = useContributions(searchTerm);
  const addContribution = useAddContribution();
  const updateContribution = useUpdateContribution();
  const deleteContribution = useDeleteContribution();
  const validateContribution = useValidateContribution();

  // Rafraîchir toutes les données
  const refreshAll = () => {
    refetchContributions();
    refetchMembers();
    setLastUpdate(new Date());
  };

  // Rafraîchir automatiquement toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAll();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const [formData, setFormData] = useState({
    membreId: '',
    type: '',
    montant: '',
    date: new Date().toISOString().split('T')[0],
    methode: '',
    description: '',
    statut: 'En attente'
  });

  // CALCULS DYNAMIQUES
  const totalMontant = contributions.reduce((acc: number, curr: any) => acc + (curr.montant || 0), 0);
  const montantValide = contributions
    .filter((c: any) => c.statut === 'Validé')
    .reduce((acc: number, curr: any) => acc + (curr.montant || 0), 0);
  const montantEnAttente = contributions
    .filter((c: any) => c.statut === 'En attente')
    .reduce((acc: number, curr: any) => acc + (curr.montant || 0), 0);
  
  const moyenneParContribution = contributions.length > 0 
    ? (totalMontant / contributions.length).toFixed(2) 
    : 0;

  // AJOUTER
  const handleAdd = async () => {
    if (!formData.membreId || !formData.type || !formData.montant || !formData.methode) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const membre = members.find((m: any) => m.id.toString() === formData.membreId);
    const membreNom = membre ? `${membre.prenom} ${membre.nom}` : 'Membre inconnu';

    await addContribution.mutateAsync({
      ...formData,
      membre: membreNom,
      montant: parseFloat(formData.montant) || 0
    });
    
    setIsAddOpen(false);
    setFormData({ membreId: '', type: '', montant: '', date: new Date().toISOString().split('T')[0], methode: '', description: '', statut: 'En attente' });
    setTimeout(() => refreshAll(), 500);
  };

  // MODIFIER
  const handleEdit = async () => {
    if (!currentContribution) return;
    
    const membre = members.find((m: any) => m.id.toString() === formData.membreId);
    const membreNom = membre ? `${membre.prenom} ${membre.nom}` : currentContribution.membre;

    await updateContribution.mutateAsync({ 
      id: currentContribution.id, 
      ...formData,
      membre: membreNom,
      montant: parseFloat(formData.montant) || 0
    });
    setIsEditOpen(false);
    setTimeout(() => refreshAll(), 500);
  };

  // SUPPRIMER
  const handleDelete = async () => {
    if (!currentContribution) return;
    await deleteContribution.mutateAsync(currentContribution.id);
    setIsDeleteOpen(false);
    setTimeout(() => refreshAll(), 500);
  };

  // VALIDER
  const handleValidate = async (id: number) => {
    await validateContribution.mutateAsync(id);
    setTimeout(() => refreshAll(), 500);
  };

  // REJETER
  const handleReject = async (id: number) => {
    await updateContribution.mutateAsync({ id, statut: 'Rejeté' });
    setTimeout(() => refreshAll(), 500);
  };

  // OUVRIR MODIFICATION
  const openEditDialog = (contribution: any) => {
    setCurrentContribution(contribution);
    setFormData({
      membreId: contribution.membreId?.toString() || '',
      type: contribution.type || '',
      montant: contribution.montant?.toString() || '',
      date: contribution.date || new Date().toISOString().split('T')[0],
      methode: contribution.methode || '',
      description: contribution.description || '',
      statut: contribution.statut || 'En attente'
    });
    setIsEditOpen(true);
  };

  // FORMAT MONTANT
  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(montant || 0);
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <div className="text-center relative">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          </div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Chargement des contributions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden">
      {/* 🌟 ARRIÈRE-PLAN BLEU & BLANC */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-blue-200 to-white rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-white to-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-blue-100 to-white rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        
        <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full opacity-30"></div>
        <div className="absolute top-40 right-40 w-3 h-3 bg-blue-300 rounded-full opacity-30"></div>
        <div className="absolute bottom-20 right-20 w-4 h-4 bg-blue-200 rounded-full opacity-30"></div>
        <div className="absolute bottom-40 left-40 w-2 h-2 bg-blue-400 rounded-full opacity-30"></div>
        
        <svg className="absolute inset-0 w-full h-full opacity-5">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3B82F6" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* HEADER avec design bleu & blanc */}
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => router.push('/dashboard')}
              className="h-10 w-10 rounded-full hover:bg-blue-50 bg-white shadow-md border border-blue-100"
            >
              <ArrowLeft className="h-5 w-5 text-blue-600" />
            </Button>
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg blur opacity-30"></div>
              <div className="relative bg-white rounded-lg p-4 shadow-md flex items-center gap-3 border border-blue-100">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    Gestion des contributions
                  </h1>
                  <p className="text-gray-500 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    {contributions.length} contributions · Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={refreshAll}
              className="ml-auto bg-white shadow-md hover:bg-blue-50 border border-blue-100"
              title="Rafraîchir"
            >
              <RefreshCw className="h-4 w-4 text-blue-600" />
            </Button>
          </div>

          {/* STATS en bleu & blanc */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition"></div>
              <Card className="relative bg-white border-blue-100 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <Wallet className="h-5 w-5 text-blue-600" />
                    </div>
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                      Total
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-4">{formatMontant(totalMontant)}</p>
                  <p className="text-sm text-blue-600">contributions totales</p>
                </CardContent>
              </Card>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition"></div>
              <Card className="relative bg-white border-blue-100 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                      Validé
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-4">{formatMontant(montantValide)}</p>
                  <p className="text-sm text-blue-600">montant validé</p>
                </CardContent>
              </Card>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition"></div>
              <Card className="relative bg-white border-blue-100 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                      En attente
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-4">{formatMontant(montantEnAttente)}</p>
                  <p className="text-sm text-blue-600">en attente</p>
                </CardContent>
              </Card>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition"></div>
              <Card className="relative bg-white border-blue-100 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                      Membres
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-4">
                    {new Set(contributions.map((c: any) => c.membreId).filter(Boolean)).size}
                  </p>
                  <p className="text-sm text-blue-600">contributeurs</p>
                </CardContent>
              </Card>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition"></div>
              <Card className="relative bg-white border-blue-100 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                      Moyenne
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-4">{formatMontant(Number(moyenneParContribution))}</p>
                  <p className="text-sm text-blue-600">par contribution</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ACTIONS et RECHERCHE */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-auto">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg blur opacity-20"></div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-blue-400" />
                <Input 
                  placeholder="Rechercher une contribution..." 
                  className="pl-10 w-full md:w-80 bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* BOUTON AJOUTER */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30">
                  <Plus className="h-4 w-4 mr-2" />
                  Enregistrer une contribution
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <Heart className="h-4 w-4 text-white" />
                    </div>
                    Nouvelle contribution
                  </DialogTitle>
                  <DialogDescription>
                    Enregistrez un don ou une contribution. Les champs avec * sont obligatoires.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  {/* Membre */}
                  <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    <h3 className="font-medium text-blue-700 mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Membre contributeur
                    </h3>
                    <select 
                      className="w-full p-2 border border-blue-200 rounded-md bg-white focus:border-blue-400 focus:ring-blue-400"
                      value={formData.membreId}
                      onChange={e => setFormData({...formData, membreId: e.target.value})}
                    >
                      <option value="">Sélectionner un membre</option>
                      {members.map((membre: any) => (
                        <option key={membre.id} value={membre.id}>
                          {membre.prenom} {membre.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Montant et type */}
                  <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    <h3 className="font-medium text-blue-700 mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Montant et type
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Montant (€) *</Label>
                        <Input 
                          type="number"
                          placeholder="150"
                          className="border-blue-200 focus:border-blue-400"
                          value={formData.montant} 
                          onChange={e => setFormData({...formData, montant: e.target.value})} 
                        />
                      </div>
                      <div>
                        <Label>Type *</Label>
                        <select 
                          className="w-full p-2 border border-blue-200 rounded-md bg-white focus:border-blue-400"
                          value={formData.type}
                          onChange={e => setFormData({...formData, type: e.target.value})}
                        >
                          <option value="">Sélectionner</option>
                          <option value="Dîme">Dîme</option>
                          <option value="Offrande">Offrande</option>
                          <option value="Projet">Projet</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Méthode et date */}
                  <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    <h3 className="font-medium text-blue-700 mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Paiement
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Méthode *</Label>
                        <select 
                          className="w-full p-2 border border-blue-200 rounded-md bg-white focus:border-blue-400"
                          value={formData.methode}
                          onChange={e => setFormData({...formData, methode: e.target.value})}
                        >
                          <option value="">Sélectionner</option>
                          <option value="Espèces">Espèces</option>
                          <option value="Carte bancaire">Carte bancaire</option>
                          <option value="Virement">Virement</option>
                        </select>
                      </div>
                      <div>
                        <Label>Date</Label>
                        <Input 
                          type="date"
                          className="border-blue-200 focus:border-blue-400"
                          value={formData.date} 
                          onChange={e => setFormData({...formData, date: e.target.value})} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    <h3 className="font-medium text-blue-700 mb-3">Description</h3>
                    <Input 
                      placeholder="Motif du don"
                      className="border-blue-200 focus:border-blue-400"
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})} 
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleAdd} 
                    disabled={addContribution.isPending}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    {addContribution.isPending ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* TABLEAU */}
          <Card className="bg-white border-blue-100 shadow-xl">
            <CardHeader className="pb-2 border-b border-blue-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="h-6 w-1 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full"></div>
                Liste des contributions ({contributions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contributions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-blue-50 to-white">
                      <TableHead className="font-semibold text-blue-900">Réf.</TableHead>
                      <TableHead className="font-semibold text-blue-900">Membre</TableHead>
                      <TableHead className="font-semibold text-blue-900">Type</TableHead>
                      <TableHead className="font-semibold text-blue-900">Montant</TableHead>
                      <TableHead className="font-semibold text-blue-900">Date</TableHead>
                      <TableHead className="font-semibold text-blue-900">Statut</TableHead>
                      <TableHead className="font-semibold text-blue-900 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contributions.map((contribution: any) => (
                      <TableRow key={contribution.id} className="hover:bg-blue-50/50 transition-colors">
                        <TableCell>
                          <div className="font-mono text-sm bg-blue-50 px-2 py-1 rounded text-blue-700">
                            {contribution.reference || '—'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-900">{contribution.membre}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {contribution.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-blue-600">
                            {formatMontant(contribution.montant)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-700">{formatDate(contribution.date)}</div>
                          <div className="text-xs text-blue-500">{contribution.methode}</div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              contribution.statut === 'Validé' 
                                ? 'bg-blue-100 text-blue-800 border-blue-200' 
                                : contribution.statut === 'Rejeté'
                                ? 'bg-gray-100 text-gray-800 border-gray-200'
                                : 'bg-blue-50 text-blue-600 border-blue-200'
                            }
                          >
                            {contribution.statut}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {contribution.statut === 'En attente' && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="hover:bg-blue-100"
                                  onClick={() => handleValidate(contribution.id)}
                                  disabled={validateContribution.isPending}
                                  title="Valider"
                                >
                                  <CheckCircle className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="hover:bg-gray-100"
                                  onClick={() => handleReject(contribution.id)}
                                  title="Rejeter"
                                >
                                  <XCircle className="h-4 w-4 text-gray-600" />
                                </Button>
                              </>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="hover:bg-blue-100"
                              onClick={() => {
                                setCurrentContribution(contribution);
                                setIsDetailsOpen(true);
                              }}
                              title="Détails"
                            >
                              <FileText className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="hover:bg-blue-100"
                              onClick={() => openEditDialog(contribution)}
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="hover:bg-red-100"
                              onClick={() => {
                                setCurrentContribution(contribution);
                                setIsDeleteOpen(true);
                              }}
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-white mb-4">
                    <Heart className="h-10 w-10 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune contribution</h3>
                  <p className="text-blue-500">Commencez par enregistrer votre première contribution</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* DIALOGUE DÉTAILS */}
          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Détails de la contribution
                </DialogTitle>
              </DialogHeader>
              {currentContribution && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-white p-4 rounded-lg border border-blue-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-blue-500">Référence</p>
                        <p className="font-mono font-medium text-lg text-gray-900">
                          {currentContribution.reference || 'Non générée'}
                        </p>
                      </div>
                      <Badge 
                        className={
                          currentContribution.statut === 'Validé' 
                            ? 'bg-blue-100 text-blue-800' 
                            : currentContribution.statut === 'Rejeté'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-blue-50 text-blue-600'
                        }
                      >
                        {currentContribution.statut}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <p className="text-sm text-blue-500 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Membre
                      </p>
                      <p className="font-medium text-gray-900 mt-1">{currentContribution.membre}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <p className="text-sm text-blue-500 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Montant
                      </p>
                      <p className="text-xl font-bold text-blue-600 mt-1">
                        {formatMontant(currentContribution.montant)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <p className="text-sm text-blue-500">Type</p>
                      <Badge variant="outline" className="mt-1 bg-white text-blue-700 border-blue-200">
                        {currentContribution.type}
                      </Badge>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <p className="text-sm text-blue-500 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Date
                      </p>
                      <p className="font-medium text-gray-900 mt-1">{formatDate(currentContribution.date)}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-500">Méthode de paiement</p>
                    <p className="font-medium text-gray-900 mt-1">{currentContribution.methode}</p>
                  </div>

                  {currentContribution.description && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <p className="text-sm text-blue-500">Description</p>
                      <p className="text-gray-700 mt-1">{currentContribution.description}</p>
                    </div>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Fermer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* DIALOGUE MODIFICATION */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-blue-600" />
                  Modifier la contribution
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label>Membre</Label>
                  <select 
                    className="w-full p-2 border border-blue-200 rounded-md focus:border-blue-400"
                    value={formData.membreId}
                    onChange={e => setFormData({...formData, membreId: e.target.value})}
                  >
                    {members.map((membre: any) => (
                      <option key={membre.id} value={membre.id}>
                        {membre.prenom} {membre.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Montant (€)</Label>
                    <Input 
                      type="number"
                      className="border-blue-200 focus:border-blue-400"
                      value={formData.montant} 
                      onChange={e => setFormData({...formData, montant: e.target.value})} 
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <select 
                      className="w-full p-2 border border-blue-200 rounded-md focus:border-blue-400"
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="Dîme">Dîme</option>
                      <option value="Offrande">Offrande</option>
                      <option value="Projet">Projet</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Méthode</Label>
                    <select 
                      className="w-full p-2 border border-blue-200 rounded-md focus:border-blue-400"
                      value={formData.methode}
                      onChange={e => setFormData({...formData, methode: e.target.value})}
                    >
                      <option value="Espèces">Espèces</option>
                      <option value="Carte bancaire">Carte bancaire</option>
                      <option value="Virement">Virement</option>
                    </select>
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input 
                      type="date"
                      className="border-blue-200 focus:border-blue-400"
                      value={formData.date} 
                      onChange={e => setFormData({...formData, date: e.target.value})} 
                    />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Input 
                    className="border-blue-200 focus:border-blue-400"
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                  />
                </div>
                <div>
                  <Label>Statut</Label>
                  <select 
                    className="w-full p-2 border border-blue-200 rounded-md focus:border-blue-400"
                    value={formData.statut}
                    onChange={e => setFormData({...formData, statut: e.target.value})}
                  >
                    <option value="En attente">En attente</option>
                    <option value="Validé">Validé</option>
                    <option value="Rejeté">Rejeté</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleEdit} 
                  disabled={updateContribution.isPending}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  {updateContribution.isPending ? 'Modification...' : 'Enregistrer'}
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
                  Êtes-vous sûr de vouloir supprimer cette contribution de {currentContribution?.membre} ?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={deleteContribution.isPending}
                >
                  {deleteContribution.isPending ? 'Suppression...' : 'Supprimer'}
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