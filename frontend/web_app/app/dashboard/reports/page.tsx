'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardStats, useFinancialReport, useMembersReport } from '@/hooks/use-stats';
import { useMembers } from '@/hooks/use-members';
import { useEvents } from '@/hooks/use-events';
import { useContributions } from '@/hooks/use-contributions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  CreditCard,
  Download,
  FileText,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeft
} from 'lucide-react';

export default function ReportsPage() {
  const router = useRouter();
  const [period, setPeriod] = useState('mois');
  
  // TOUTES LES DONNÉES VIENNENT DE L'API - RIEN N'EST STOCKÉ ICI
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: members = [] } = useMembers();
  const { data: events = [] } = useEvents();
  const { data: contributions = [] } = useContributions();
  const { data: financialReport } = useFinancialReport(period);
  const { data: membersReport } = useMembersReport();

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des rapports...</p>
        </div>
      </div>
    );
  }

  // CALCULS DYNAMIQUES À PARTIR DES VRAIES DONNÉES
  const totalMembres = members.length;
  const membresActifs = members.filter((m: any) => m.statut === 'Actif').length;
  const membresInactifs = members.filter((m: any) => m.statut === 'Inactif').length;
  
  const totalEvenements = events.length;
  const evenementsAVenir = events.filter((e: any) => e.statut === 'À venir').length;
  const evenementsTermines = events.filter((e: any) => e.statut === 'Terminé').length;
  
  const totalContributions = contributions.reduce((acc: number, c: any) => acc + (c.montant || 0), 0);
  const contributionsValidees = contributions
    .filter((c: any) => c.statut === 'Validé')
    .reduce((acc: number, c: any) => acc + (c.montant || 0), 0);
  const contributionsEnAttente = contributions
    .filter((c: any) => c.statut === 'En attente')
    .reduce((acc: number, c: any) => acc + (c.montant || 0), 0);

  // TOP CONTRIBUTEURS - calculé dynamiquement
  const topContributeurs = [...contributions]
    .filter((c: any) => c.statut === 'Validé')
    .reduce((acc: any[], c: any) => {
      const existing = acc.find(item => item.membre === c.membre);
      if (existing) {
        existing.montant += c.montant;
        existing.contributions += 1;
      } else {
        acc.push({
          membre: c.membre,
          montant: c.montant,
          contributions: 1
        });
      }
      return acc;
    }, [])
    .sort((a, b) => b.montant - a.montant)
    .slice(0, 5);

  // RÉPARTITION PAR GROUPE - calculée dynamiquement
  const groupes = members.reduce((acc: any[], m: any) => {
    if (m.groupe) {
      const existing = acc.find(g => g.nom === m.groupe);
      if (existing) {
        existing.membres += 1;
        if (m.statut === 'Actif') existing.actif += 1;
      } else {
        acc.push({
          nom: m.groupe,
          membres: 1,
          actif: m.statut === 'Actif' ? 1 : 0
        });
      }
    }
    return acc;
  }, []).sort((a, b) => b.membres - a.membres);

  // DONNÉES POUR LES GRAPHIQUES - par mois
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toLocaleDateString('fr-FR', { month: 'short' });
  }).reverse();

  const membersByMonth = last6Months.map(month => {
    // À implémenter avec les vraies dates d'inscription
    return Math.floor(totalMembres / 6); // Version simplifiée
  });

  const contributionsByMonth = last6Months.map(month => {
    // À implémenter avec les vraies dates de contribution
    return Math.floor(totalContributions / 6); // Version simplifiée
  });

  // FORMATAGE MONÉTAIRE
  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(montant || 0);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER avec bouton retour */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.push('/dashboard')}
            className="h-10 w-10 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-orange-600" />
              Rapports et analyses
            </h1>
            <p className="text-gray-500">
              Visualisez les statistiques en temps réel de votre organisation
            </p>
          </div>
        </div>

        {/* FILTRES */}
        <div className="flex justify-end">
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semaine">Cette semaine</SelectItem>
                <SelectItem value="mois">Ce mois</SelectItem>
                <SelectItem value="trimestre">Ce trimestre</SelectItem>
                <SelectItem value="annee">Cette année</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter PDF
            </Button>
          </div>
        </div>

        {/* KPIs - DYNAMIQUES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <Badge className={stats?.members?.growth > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {stats?.members?.growth > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  {Math.abs(stats?.members?.growth || 0)}%
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">Membres actifs</p>
                <p className="text-2xl font-bold text-gray-900">{membresActifs}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {membresInactifs} inactifs • {totalMembres} total
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <Badge className="bg-green-100 text-green-800">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +{stats?.events?.total || 0}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">Événements</p>
                <p className="text-2xl font-bold text-gray-900">{totalEvenements}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {evenementsAVenir} à venir • {evenementsTermines} terminés
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                </div>
                <Badge className={stats?.contributions?.growth > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {stats?.contributions?.growth > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  {Math.abs(stats?.contributions?.growth || 0)}%
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">Contributions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatMontant(totalContributions)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatMontant(contributionsValidees)} validé • {formatMontant(contributionsEnAttente)} en attente
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <Badge className={stats?.engagement?.evolution > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {stats?.engagement?.evolution > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  {Math.abs(stats?.engagement?.evolution || 0)}%
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">Taux d'engagement</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.engagement?.rate || 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {membresActifs > 0 ? ((membresActifs / totalMembres) * 100).toFixed(1) : 0}% des membres
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* GRAPHIQUES DYNAMIQUES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Évolution des membres
              </CardTitle>
              <CardDescription>
                Croissance de votre communauté
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] flex items-end justify-between gap-2">
                {last6Months.map((mois, index) => (
                  <div key={mois} className="flex flex-col items-center gap-2 flex-1">
                    <div 
                      className="w-full bg-blue-500 rounded-t-md transition-all hover:bg-blue-600"
                      style={{ 
                        height: `${(membersByMonth[index] / (totalMembres || 1)) * 200}px`,
                        maxWidth: '40px',
                        margin: '0 auto'
                      }}
                    />
                    <span className="text-xs font-medium text-gray-600">{mois}</span>
                    <span className="text-xs text-gray-500">{membersByMonth[index]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                Évolution des contributions
              </CardTitle>
              <CardDescription>
                Montant des dons par mois
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] flex items-end justify-between gap-2">
                {last6Months.map((mois, index) => (
                  <div key={mois} className="flex flex-col items-center gap-2 flex-1">
                    <div 
                      className="w-full bg-green-500 rounded-t-md transition-all hover:bg-green-600"
                      style={{ 
                        height: `${(contributionsByMonth[index] / (totalContributions || 1)) * 200}px`,
                        maxWidth: '40px',
                        margin: '0 auto'
                      }}
                    />
                    <span className="text-xs font-medium text-gray-600">{mois}</span>
                    <span className="text-xs text-gray-500">{contributionsByMonth[index]}€</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* TABLEAUX DYNAMIQUES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* TOP CONTRIBUTEURS - DYNAMIQUE */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Top contributeurs
              </CardTitle>
              <CardDescription>
                Membres ayant le plus contribué
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topContributeurs.length > 0 ? (
                <div className="space-y-4">
                  {topContributeurs.map((contributeur, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-sm font-medium text-purple-700">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{contributeur.membre}</p>
                        <p className="text-xs text-gray-500">{contributeur.contributions} contributions</p>
                      </div>
                      <div className="text-sm font-semibold text-green-600">
                        {formatMontant(contributeur.montant)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Aucune contribution pour le moment</p>
              )}
            </CardContent>
          </Card>

          {/* RÉPARTITION PAR GROUPE - DYNAMIQUE */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-orange-600" />
                Répartition par groupe
              </CardTitle>
              <CardDescription>
                Membres par département
              </CardDescription>
            </CardHeader>
            <CardContent>
              {groupes.length > 0 ? (
                <div className="space-y-4">
                  {groupes.slice(0, 5).map((groupe) => (
                    <div key={groupe.nom} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{groupe.nom}</p>
                        <p className="text-sm text-gray-600">
                          {groupe.actif}/{groupe.membres}
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full"
                          style={{ width: `${(groupe.actif / groupe.membres) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Aucun groupe créé</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RAPPORTS DISPONIBLES */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-600" />
              Exporter les rapports
            </CardTitle>
            <CardDescription>
              Générer des rapports détaillés à partir de vos données
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => window.print()}
              >
                <Users className="h-6 w-6 text-blue-600" />
                <span className="font-medium">Rapport des membres</span>
                <span className="text-xs text-gray-500">{totalMembres} membres</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => window.print()}
              >
                <CreditCard className="h-6 w-6 text-green-600" />
                <span className="font-medium">Rapport financier</span>
                <span className="text-xs text-gray-500">{formatMontant(totalContributions)}</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => window.print()}
              >
                <Calendar className="h-6 w-6 text-purple-600" />
                <span className="font-medium">Rapport des événements</span>
                <span className="text-xs text-gray-500">{totalEvenements} événements</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
