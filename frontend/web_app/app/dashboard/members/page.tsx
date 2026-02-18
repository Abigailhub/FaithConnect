'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMembers, useAddMember, useUpdateMember, useDeleteMember } from '@/hooks/use-members';
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
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Heart,
  Sparkles,
  UsersRound,
  UserCog
} from 'lucide-react';

export default function MembersPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState<any>(null);
  
  // Hooks API
  const { data: members = [], isLoading } = useMembers(searchTerm);
  const addMember = useAddMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    dateNaissance: '',
    profession: '',
    groupe: '',
    statut: 'Actif'
  });

  // AJOUTER
  const handleAdd = async () => {
    if (!formData.nom || !formData.prenom || !formData.email) {
      alert('Veuillez remplir le nom, prénom et email');
      return;
    }
    await addMember.mutateAsync(formData);
    setIsAddOpen(false);
    setFormData({ nom: '', prenom: '', email: '', telephone: '', dateNaissance: '', profession: '', groupe: '', statut: 'Actif' });
  };

  // MODIFIER
  const handleEdit = async () => {
    if (!currentMember) return;
    await updateMember.mutateAsync({ id: currentMember.id, ...formData });
    setIsEditOpen(false);
  };

  // SUPPRIMER
  const handleDelete = async () => {
    if (!currentMember) return;
    await deleteMember.mutateAsync(currentMember.id);
    setIsDeleteOpen(false);
  };

  // CHANGER STATUT
  const toggleStatut = async (member: any) => {
    const newStatut = member.statut === 'Actif' ? 'Inactif' : 'Actif';
    await updateMember.mutateAsync({ id: member.id, statut: newStatut });
  };

  // OUVRIR MODIFICATION
  const openEditDialog = (member: any) => {
    setCurrentMember(member);
    setFormData({
      nom: member.nom || '',
      prenom: member.prenom || '',
      email: member.email || '',
      telephone: member.telephone || '',
      dateNaissance: member.dateNaissance || '',
      profession: member.profession || '',
      groupe: member.groupe || '',
      statut: member.statut || 'Actif'
    });
    setIsEditOpen(true);
  };

  // FILTRER
  const filteredMembers = members.filter((member: any) => 
    member.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center relative">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          </div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Chargement des membres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* ARRIÈRE-PLAN AMÉLIORÉ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grands cercles flous */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-blue-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-indigo-200 to-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        
        {/* Points décoratifs */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full opacity-40"></div>
        <div className="absolute top-40 right-40 w-3 h-3 bg-purple-400 rounded-full opacity-40"></div>
        <div className="absolute bottom-20 right-20 w-4 h-4 bg-indigo-400 rounded-full opacity-40"></div>
        <div className="absolute bottom-40 left-40 w-2 h-2 bg-pink-400 rounded-full opacity-40"></div>
        
        {/* Grille subtile */}
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
          
          {/* HEADER avec design amélioré */}
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
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-30"></div>
              <div className="relative bg-white rounded-lg p-4 shadow-md flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Gestion des membres
                  </h1>
                  <p className="text-gray-500 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    {members.length} membres au total
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* STATS RAPIDES améliorées */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition"></div>
              <Card className="relative bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Actifs
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mt-4">
                    {members.filter((m: any) => m.statut === 'Actif').length}
                  </p>
                  <p className="text-sm text-gray-500">membres actifs</p>
                </CardContent>
              </Card>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl blur opacity-20 group-hover:opacity-30 transition"></div>
              <Card className="relative bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <UserCog className="h-5 w-5 text-gray-600" />
                    </div>
                    <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                      Inactifs
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mt-4">
                    {members.filter((m: any) => m.statut === 'Inactif').length}
                  </p>
                  <p className="text-sm text-gray-500">membres inactifs</p>
                </CardContent>
              </Card>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition"></div>
              <Card className="relative bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <UsersRound className="h-5 w-5 text-blue-600" />
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      Total
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mt-4">
                    {members.length}
                  </p>
                  <p className="text-sm text-gray-500">membres inscrits</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ACTIONS et RECHERCHE */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-auto">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-20"></div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Rechercher un membre..." 
                  className="pl-10 w-full md:w-80 bg-white/80 backdrop-blur-sm border-white/50"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* BOUTON AJOUTER */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Ajouter un membre
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                      <UserPlus className="h-4 w-4 text-white" />
                    </div>
                    Ajouter un membre
                  </DialogTitle>
                  <DialogDescription>
                    Remplissez les informations du membre. Les champs avec * sont obligatoires.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  {/* Identité */}
                  <div className="bg-blue-50/50 backdrop-blur-sm p-3 rounded-lg border border-blue-100">
                    <h3 className="font-medium text-blue-700 mb-3 flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Identité
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nom *</Label>
                        <Input 
                          placeholder=""
                          value={formData.nom} 
                          onChange={e => setFormData({...formData, nom: e.target.value})} 
                        />
                      </div>
                      <div>
                        <Label>Prénom *</Label>
                        <Input 
                          placeholder=""
                          value={formData.prenom} 
                          onChange={e => setFormData({...formData, prenom: e.target.value})} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="bg-gray-50/50 backdrop-blur-sm p-3 rounded-lg border border-gray-100">
                    <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Contact
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Email *</Label>
                        <Input 
                          type="email"
                          placeholder=""
                          value={formData.email} 
                          onChange={e => setFormData({...formData, email: e.target.value})} 
                        />
                      </div>
                      <div>
                        <Label>Téléphone</Label>
                        <Input 
                          placeholder=""
                          value={formData.telephone} 
                          onChange={e => setFormData({...formData, telephone: e.target.value})} 
                        />
                      </div>
              
                    </div>
                  </div>

                  {/* Infos supplémentaires */}
                  <div className="bg-purple-50/50 backdrop-blur-sm p-3 rounded-lg border border-purple-100">
                    <h3 className="font-medium text-purple-700 mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Informations
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Date naissance</Label>
                        <Input 
                          type="date"
                          value={formData.dateNaissance} 
                          onChange={e => setFormData({...formData, dateNaissance: e.target.value})} 
                        />
                      </div>
                      <div>
                        <Label>Profession</Label>
                        <Input 
                          placeholder="Enseignant"
                          value={formData.profession} 
                          onChange={e => setFormData({...formData, profession: e.target.value})} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Organisation */}
                  <div className="bg-green-50/50 backdrop-blur-sm p-3 rounded-lg border border-green-100">
                    <h3 className="font-medium text-green-700 mb-3">Organisation</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Groupe</Label>
                        <select 
                          className="w-full p-2 border rounded-md bg-white"
                          value={formData.groupe}
                          onChange={e => setFormData({...formData, groupe: e.target.value})}
                        >
                          <option value="">Sélectionner</option>
                          <option value="Chorale">Chorale</option>
                          <option value="Jeunesse">Jeunesse</option>
                          <option value="Bénévolat">Bénévolat</option>
                          <option value="Étude biblique">Étude biblique</option>
                        </select>
                      </div>
                      <div>
                        <Label>Statut</Label>
                        <select 
                          className="w-full p-2 border rounded-md bg-white"
                          value={formData.statut}
                          onChange={e => setFormData({...formData, statut: e.target.value})}
                        >
                          <option value="Actif">Actif</option>
                          <option value="Inactif">Inactif</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleAdd} 
                    disabled={addMember.isPending}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {addMember.isPending ? 'Ajout...' : 'Ajouter'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* TABLEAU avec design amélioré */}
          <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-xl">
            <CardHeader className="pb-2 border-b border-gray-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="h-6 w-1 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></div>
                Liste des membres ({filteredMembers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredMembers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-white">
                      <TableHead className="font-semibold">Membre</TableHead>
                      <TableHead className="font-semibold">Contact</TableHead>
                      <TableHead className="font-semibold">Groupe</TableHead>
                      <TableHead className="font-semibold">Statut</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member: any) => (
                      <TableRow key={member.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-colors">
                        <TableCell>
                          <div className="font-medium flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                              {member.prenom?.[0]}{member.nom?.[0]}
                            </div>
                            <div>
                              <div>{member.prenom} {member.nom}</div>
                              <div className="text-xs text-gray-500">{member.profession || '—'}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{member.email}</div>
                          <div className="text-xs text-gray-500">{member.telephone || '—'}</div>
                        </TableCell>
                        <TableCell>
                          {member.groupe ? (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                              {member.groupe}
                            </Badge>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStatut(member)}
                            className="p-0 h-auto hover:bg-transparent"
                          >
                            <Badge 
                              className={member.statut === 'Actif' 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer transition-colors' 
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-pointer transition-colors'
                              }
                            >
                              {member.statut}
                            </Badge>
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="hover:bg-blue-50"
                              onClick={() => openEditDialog(member)}
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="hover:bg-red-50"
                              onClick={() => {
                                setCurrentMember(member);
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
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-4">
                    <Users className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun membre</h3>
                  <p className="text-gray-500">Commencez par ajouter votre premier membre</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* DIALOGUES (inchangés) */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Modifier le membre</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nom</Label>
                    <Input value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} />
                  </div>
                  <div>
                    <Label>Prénom</Label>
                    <Input value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <Label>Téléphone</Label>
                  <Input value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} />
                </div>
                <div>
                  <Label>Statut</Label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={formData.statut}
                    onChange={e => setFormData({...formData, statut: e.target.value})}
                  >
                    <option value="Actif">Actif</option>
                    <option value="Inactif">Inactif</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleEdit} 
                  disabled={updateMember.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateMember.isPending ? 'Modification...' : 'Enregistrer'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-red-600">Confirmer la suppression</DialogTitle>
                <DialogDescription>
                  Êtes-vous sûr de vouloir supprimer {currentMember?.prenom} {currentMember?.nom} ?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={deleteMember.isPending}
                >
                  {deleteMember.isPending ? 'Suppression...' : 'Supprimer'}
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