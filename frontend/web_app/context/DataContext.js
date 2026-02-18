// context/DataContext.js
"use client";
import { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

// Données de démonstration
const demoData = {
  members: [
    { id: 1, name: "John Doe", email: "john@example.com", phone: "+1 234 567 890", status: "active", joinDate: "2024-01-15" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", phone: "+1 234 567 891", status: "active", joinDate: "2024-02-20" },
    { id: 3, name: "Robert Johnson", email: "robert@example.com", phone: "+1 234 567 892", status: "inactive", joinDate: "2024-03-10" },
    { id: 4, name: "Maria Garcia", email: "maria@example.com", phone: "+1 234 567 893", status: "active", joinDate: "2024-04-05" }
  ],
  events: [
    { id: 1, title: "Sunday Service", date: "2024-12-01", time: "09:00", location: "Main Hall", attendees: 120 },
    { id: 2, title: "Bible Study", date: "2024-12-03", time: "18:00", location: "Room 101", attendees: 45 },
    { id: 3, title: "Youth Group", date: "2024-12-05", time: "17:00", location: "Youth Center", attendees: 60 }
  ],
  contributions: [
    { id: 1, memberName: "John Doe", amount: 5000, date: "2024-11-28", type: "tithe" },
    { id: 2, memberName: "Jane Smith", amount: 7500, date: "2024-11-27", type: "offering" },
    { id: 3, memberName: "Robert Johnson", amount: 3000, date: "2024-11-25", type: "donation" },
    { id: 4, memberName: "Maria Garcia", amount: 10000, date: "2024-11-20", type: "tithe" }
  ]
};

export function DataProvider({ children }) {
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Simuler un chargement initial
    setLoading(true);
    
    // Mode démo - charger immédiatement les données
    setTimeout(() => {
      setMembers(demoData.members);
      setEvents(demoData.events);
      setContributions(demoData.contributions);
      setCurrentUser({
        id: 0,
        name: "Admin User",
        email: "admin@example.com",
        role: "admin",
        avatar: "👨‍💼"
      });
      setLoading(false);
    }, 500); // Petit délai pour simuler le chargement
  }, []);

  const login = async (email, password) => {
    // Validation simple pour le mode démo
    if (email && password && password.length >= 6) {
      setCurrentUser({
        id: 0,
        name: "Demo User",
        email: email,
        role: "admin",
        avatar: "👨‍💼"
      });
      return { success: true, message: "Login successful" };
    }
    return { success: false, message: "Invalid credentials" };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addMember = async (memberData) => {
    const newMember = {
      id: members.length + 1,
      ...memberData,
      joinDate: new Date().toISOString().split('T')[0],
      status: "active"
    };
    setMembers([...members, newMember]);
    return { success: true, data: newMember };
  };

  const addEvent = async (eventData) => {
    const newEvent = {
      id: events.length + 1,
      ...eventData,
      attendees: 0
    };
    setEvents([...events, newEvent]);
    return { success: true, data: newEvent };
  };

  const addContribution = async (contributionData) => {
    const newContribution = {
      id: contributions.length + 1,
      ...contributionData,
      date: new Date().toISOString().split('T')[0]
    };
    setContributions([...contributions, newContribution]);
    return { success: true, data: newContribution };
  };

  const getStats = () => {
    const monthlyContributions = contributions
      .filter(c => {
        const date = new Date(c.date);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, c) => sum + (c.amount || 0), 0);

    return {
      totalMembers: members.length,
      totalEvents: events.length,
      totalContributions: contributions.length,
      monthlyContributions: monthlyContributions,
      activeMembers: members.filter(m => m.status === 'active').length
    };
  };

  const value = {
    // Données
    members,
    events,
    contributions,
    currentUser,
    loading,
    
    // Auth
    login,
    logout,
    
    // Operations
    addMember,
    addEvent,
    addContribution,
    getStats,
    
    // Pour compatibilité
    admins: members.filter(m => m.role === 'admin'),
    refreshData: () => {
      // Simuler un refresh
      setLoading(true);
      setTimeout(() => setLoading(false), 300);
    }
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
