import axios from 'axios';
import { getSession } from 'next-auth/react';

// Vérifier si on est côté client ou serveur
const isBrowser = typeof window !== 'undefined';

// Configuration de base
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Intercepteur pour ajouter le token JWT (uniquement côté client)
apiClient.interceptors.request.use(async (config) => {
  // Ne pas exécuter côté serveur
  if (!isBrowser) {
    return config;
  }
  
  try {
    const session = await getSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de la session:', error);
  }
  
  return config;
});

// Intercepteur pour gérer les erreurs (uniquement côté client)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Ne pas rediriger côté serveur
    if (isBrowser && error.response?.status === 401) {
      // Token expiré ou non valide
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;