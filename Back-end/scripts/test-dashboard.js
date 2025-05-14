/**
 * Script pour tester l'API dashboard
 * 
 * Exécutez ce script avec Node.js:
 * node scripts/test-dashboard.js
 */

const axios = require('axios');
require('dotenv').config();

// Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET;

// Fonction pour créer un token JWT de test
const createTestToken = () => {
  const jwt = require('jsonwebtoken');
  // Créer un token de test avec un userId valide
  return jwt.sign({ userId: '648ac7f34652f8527b2720d8' }, JWT_SECRET, {
    expiresIn: '1h',
  });
};

// Fonction principale de test
const testDashboardAPI = async () => {
  const token = createTestToken();
  console.log('Token de test généré:', token);

  try {
    console.log('1. Test de ping pour vérifier que le serveur est en cours d\'exécution...');
    await axios.get(`${API_URL}/health/ping`);
    console.log('✅ Le serveur répond');

    console.log('\n2. Test de la route GET /api/dashboard/stats...');
    try {
      const statsResponse = await axios.get(`${API_URL}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('✅ Succès! Réponse:', statsResponse.status);
      console.log('📊 Données:', JSON.stringify(statsResponse.data, null, 2).substring(0, 300) + '...');
    } catch (error) {
      console.error('❌ Échec!', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Message:', error.response.data.message);
      } else if (error.request) {
        console.error('Aucune réponse reçue');
      }
    }

    console.log('\n3. Test de la route GET /api/dashboard/company-registration-trends...');
    try {
      const trendsResponse = await axios.get(`${API_URL}/dashboard/company-registration-trends`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { period: 'last6months', includeUsers: true },
      });
      console.log('✅ Succès! Réponse:', trendsResponse.status);
      console.log('📊 Données:', JSON.stringify(trendsResponse.data, null, 2).substring(0, 300) + '...');
    } catch (error) {
      console.error('❌ Échec!', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Message:', error.response.data.message || error.response.data);
      } else if (error.request) {
        console.error('Aucune réponse reçue');
      }
    }

  } catch (error) {
    console.error('Erreur lors du test de l\'API:', error.message);
  }
};

// Exécution du test
testDashboardAPI();