import axios from 'axios';
import environment from '../environment';

// Use backend API URL
const API_URL = environment.apiUrl;

// Interface pour les plans d'abonnement
export interface SubscriptionPlan {
  _id?: string;
  name: string;
  price: number;
  features: string[];
  duration: number;
  description?: string;
  isPopular: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Récupérer tous les plans d'abonnement
export const getAllSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const response = await axios.get(`${API_URL}/subscription/plans`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des plans d\'abonnement:', error);
    throw error;
  }
};

// Récupérer un plan d'abonnement par ID
export const getSubscriptionPlanById = async (id: string): Promise<SubscriptionPlan> => {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const response = await axios.get(`${API_URL}/subscription/plans/${id}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération du plan d'abonnement ${id}:`, error);
    throw error;
  }
};

// Créer un nouveau plan d'abonnement
export const createSubscriptionPlan = async (planData: Omit<SubscriptionPlan, '_id'>): Promise<SubscriptionPlan> => {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const response = await axios.post(`${API_URL}/subscription/plans`, planData, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la création du plan d\'abonnement:', error);
    throw error;
  }
};

// Mettre à jour un plan d'abonnement
export const updateSubscriptionPlan = async (id: string, planData: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const response = await axios.put(`${API_URL}/subscription/plans/${id}`, planData, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du plan d'abonnement ${id}:`, error);
    throw error;
  }
};

// Supprimer un plan d'abonnement
export const deleteSubscriptionPlan = async (id: string): Promise<void> => {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    await axios.delete(`${API_URL}/subscription/plans/${id}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error(`Erreur lors de la suppression du plan d'abonnement ${id}:`, error);
    throw error;
  }
}; 