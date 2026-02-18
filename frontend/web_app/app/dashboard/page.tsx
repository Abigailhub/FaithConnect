'use client';

import { useRouter } from 'next/navigation';
import { useDashboardStats } from '@/hooks/use-stats';
import { useMembers } from '@/hooks/use-members';
import { useEvents } from '@/hooks/use-events';
import { useContributions } from '@/hooks/use-contributions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  CreditCard, 
  TrendingUp,
  Bell,
  Heart,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  RefreshCw,
  Sparkles,
  Church,
  Star
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // Toutes les données sont automatiquement mises à jour via React Query
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { data: members = [], refetch: refetchMembers } = useMembers();
  const { data: events = [], refetch: refetchEvents } = useEvents();
  const { data: contributions = [], refetch: refetchContributions } = useContributions();

  // Rafraîchir toutes les données
  const refreshAll = () => {
    refetchStats();
    refetchMembers();
    refetchEvents();
    refetchContributions();
    setLastUpdate(new Date());
  };

  // Rafraîchir automatiquement toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAll();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Calculs en temps réel
  const membresActifs = members.filter((m: any) => m.statut === 'Actif').length;
  const totalMembres = members.length;
  const nouveauxMembres = members.filter((m: any) => {
    const dateInscription = new Date(m.date_inscription || m.dateInscription);
    const maintenant = new Date();
    const diffJours = (maintenant.getTime() - dateInscription.getTime()) / (1000 * 3600 * 24);
    return diffJours <= 30;
  }).length;

  const evenementsAVenir = events.filter((e: any) => e.statut === 'À venir').length;
  const totalEvenements = events.length;

  const totalContributions = contributions.reduce((acc: number, c: any) => acc + (c.montant || 0), 0);
  const contributionsEnAttente = contributions.filter((c: any) => c.statut === 'En attente').length;
  const croissanceContributions = stats?.contributions?.growth || 0;

  const tauxEngagement = totalMembres > 0 ? Math.round((membresActifs / totalMembres) * 100) : 0;

  const croissanceMembres = (() => {
    const moisDernier = members.filter((m: any) => {
      const dateInscription = new Date(m.date_inscription || m.dateInscription);
      const maintenant = new Date();
      const moisDernierDate = new Date(maintenant.setMonth(maintenant.getMonth() - 1));
      return dateInscription > moisDernierDate;
    }).length;
    return totalMembres > 0 ? Math.round((nouveauxMembres / totalMembres) * 100) : 0;
  })();

  // Activités récentes
  const recentActivities = [
    ...members.slice(0, 3).map((m: any) => ({
      type: 'member',
      icon: Users,
      color: 'bg-blue-100',
      iconColor: 'text-blue-600',
      title: `Nouveau membre : ${m.prenom} ${m.nom}`,
      time: new Date(m.date_inscription || m.dateInscription).toLocaleDateString('fr-FR'),
      date: new Date(m.date_inscription || m.dateInscription)
    })),
    ...events.slice(0, 3).map((e: any) => ({
      type: 'event',
      icon: Calendar,
      color: 'bg-green-100',
      iconColor: 'text-green-600',
      title: `Événement : ${e.titre}`,
      time: new Date(e.date).toLocaleDateString('fr-FR'),
      date: new Date(e.date)
    })),
    ...contributions.slice(0, 3).map((c: any) => ({
      type: 'contribution',
      icon: CreditCard,
      color: 'bg-purple-100',
      iconColor: 'text-purple-600',
      title: `Contribution de ${c.membre || 'membre'}`,
      amount: c.montant,
      time: new Date(c.date).toLocaleDateString('fr-FR'),
      date: new Date(c.date)
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center relative">
          {/* Animation de fond */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          </div>
          
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Chargement de votre espace...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Éléments de décoration de fond */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Cercles flous */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        
        {/* Motifs géométriques */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full opacity-20"></div>
        <div className="absolute top-40 right-40 w-3 h-3 bg-purple-400 rounded-full opacity-20"></div>
        <div className="absolute bottom-20 right-20 w-4 h-4 bg-indigo-400 rounded-full opacity-20"></div>
        
        {/* Lignes de grille */}
        <svg className="absolute inset-0 w-full h-full opacity-5">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Header avec effet de verre */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b border-white/20 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                  FaithConnect
                </h1>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Church className="h-3 w-3" />
                  Espace d'administration
                </p>
              </div>
              <Badge variant="outline" className="ml-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 shadow-sm">
                <Star className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative hover:bg-white/80 rounded-xl"
                onClick={refreshAll}
                title="Rafraîchir les données"
              >
                <RefreshCw className="h-5 w-5 text-gray-600" />
              </Button>
              
              <Button variant="ghost" size="icon" className="relative hover:bg-white/80 rounded-xl">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 rounded-full ring-2 ring-white" />
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium shadow-md">
                    AD
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-semibold text-gray-900">Admin</p>
                  <p className="text-xs text-gray-500">Super Admin</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-2">
            <div className="bg-white/50 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-gray-500 border border-white/50 shadow-sm flex items-center gap-2">
              <RefreshCw className="h-3 w-3" />
              Dernière mise à jour : {lastUpdate.toLocaleTimeString('fr-FR')}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 relative z-10">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Welcome Section avec effet de verre */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 rounded-2xl blur-2xl"></div>
            <div className="relative bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      Dashboard
                    </h2>
                    <Sparkles className="h-6 w-6 text-yellow-500" />
                  </div>
                  <p className="text-gray-600 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    {new Date().toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full opacity-20"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards avec effets améliorés */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Carte Membres */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
              <Card className="relative bg-white/80 backdrop-blur-sm border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-3 rounded-xl shadow-lg shadow-blue-500/30">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      +{croissanceMembres}%
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 font-medium">Membres actifs</p>
                    <div className="flex items-baseline justify-between mt-1">
                      <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        {membresActifs}
                      </p>
                      <p className="text-sm text-gray-500">/ {totalMembres}</p>
                    </div>
                    <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                        style={{ width: `${(membresActifs / totalMembres) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                      +{nouveauxMembres} nouveaux ce mois
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Carte Événements */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
              <Card className="relative bg-white/80 backdrop-blur-sm border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-xl shadow-lg shadow-green-500/30">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      +{evenementsAVenir}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 font-medium">Événements</p>
                    <div className="flex items-baseline justify-between mt-1">
                      <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        {totalEvenements}
                      </p>
                    </div>
                    <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                        style={{ width: `${(evenementsAVenir / totalEvenements) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                      {evenementsAVenir} à venir
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Carte Contributions */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
              <Card className="relative bg-white/80 backdrop-blur-sm border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl shadow-lg shadow-purple-500/30">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      +{croissanceContributions}%
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 font-medium">Contributions</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      {new Intl.NumberFormat('fr-FR', { 
                        style: 'currency', 
                        currency: 'EUR' 
                      }).format(totalContributions)}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-gray-500">En attente</span>
                      <span className="font-medium text-gray-900">{contributionsEnAttente}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Carte Engagement */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
              <Card className="relative bg-white/80 backdrop-blur-sm border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="bg-gradient-to-br from-orange-500 to-red-500 p-3 rounded-xl shadow-lg shadow-orange-500/30">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <Badge className={`${tauxEngagement > 70 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-orange-500 to-red-500'} text-white border-0 shadow-lg`}>
                      {tauxEngagement > 70 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                      {Math.abs(stats?.engagement?.evolution || 0)}%
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 font-medium">Taux d'engagement</p>
                    <div className="flex items-baseline justify-between mt-1">
                      <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        {tauxEngagement}%
                      </p>
                    </div>
                    <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          tauxEngagement > 70 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-orange-500 to-red-500'
                        }`}
                        style={{ width: `${tauxEngagement}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Actions avec effets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Users, label: 'Membres', color: 'blue', count: totalMembres, path: '/dashboard/members' },
              { icon: Calendar, label: 'Événements', color: 'green', count: evenementsAVenir, path: '/dashboard/events' },
              { icon: CreditCard, label: 'Contributions', color: 'purple', count: totalContributions, path: '/dashboard/contributions' },
              { icon: TrendingUp, label: 'Rapports', color: 'orange', count: 'Analyses', path: '/dashboard/reports' }
            ].map((item, index) => (
              <div key={index} className="group relative">
                <div className={`absolute -inset-0.5 bg-gradient-to-r from-${item.color}-600 to-${item.color}-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-1000`}></div>
                <Button 
                  variant="outline" 
                  className="relative w-full h-auto py-6 flex flex-col items-center gap-2 bg-white/80 backdrop-blur-sm border-white/50 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  onClick={() => router.push(item.path)}
                >
                  <div className={`p-3 rounded-xl bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 text-white shadow-lg`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="font-medium text-gray-900">Gérer les {item.label}</span>
                  <Badge variant="outline" className={`bg-${item.color}-50 text-${item.color}-700 border-${item.color}-200`}>
                    {typeof item.count === 'number' 
                      ? (item.label === 'Contributions' ? `${item.count.toFixed(0)} €` : item.count) 
                      : item.count}
                  </Badge>
                </Button>
              </div>
            ))}
          </div>

          {/* Recent Activity - DYNAMIQUE */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
            <Card className="relative bg-white/80 backdrop-blur-sm border-white/50 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100/50">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg">
                      <Activity className="h-5 w-5" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Activités récentes
                    </span>
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    Les dernières actions sur votre plateforme
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={refreshAll} className="gap-2 hover:bg-white/80">
                  <RefreshCw className="h-4 w-4" />
                  Rafraîchir
                </Button>
              </CardHeader>
              <CardContent>
                {recentActivities.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/50 transition-all duration-300 group/item">
                        <div className={`h-10 w-10 rounded-xl ${activity.color} flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform`}>
                          <activity.icon className={`h-5 w-5 ${activity.iconColor}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                            {activity.time}
                          </p>
                        </div>
                        {'amount' in activity && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 shadow-sm">
                            {activity.amount} €
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                      <Activity className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">Aucune activité récente</p>
                    <p className="text-sm text-gray-400 mt-1">Les nouvelles actions apparaîtront ici</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Styles pour les animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(10px, -10px) rotate(5deg); }
          50% { transform: translate(0, -20px) rotate(0deg); }
          75% { transform: translate(-10px, -10px) rotate(-5deg); }
        }
        
        @keyframes blob {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
        
        .animate-float {
          animation: float 15s ease-in-out infinite;
        }
        
        .animate-blob {
          animation: blob 20s ease-in-out infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}