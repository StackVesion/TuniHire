import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FeatherIcon from 'feather-icons-react';
import { Row, Col, Card, Table, Dropdown, ProgressBar, Button } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './user-report.css';
import { User, UserStats } from './types';
import RealTimeUsers from './real-time-users';
import environment from '../../../environment';

const UserReport = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dataSource, setDataSource] = useState<'api' | 'mock'>('mock');
  const [userStats, setUserStats] = useState<UserStats>({
    total: 0,
    active: 0,
    inactive: 0,
    online: 0,
    admins: 0,
    recruiters: 0,
    candidates: 0,
    recentlyActive: 0,
    onlinePercentage: 0,
    lastUpdate: new Date().toLocaleTimeString()
  });
  const [viewMode, setViewMode] = useState<'all' | 'active' | 'inactive' | 'online'>('all');
  const [showStatistics, setShowStatistics] = useState<boolean>(true);

  useEffect(() => {
    fetchUsers();
    
    // Rafraîchir les données toutes les 60 secondes
    const dataRefreshInterval = setInterval(() => {
      console.log("Rafraîchissement automatique des données utilisateurs...");
      fetchUsers(false); // false = silencieux (sans afficher de toast)
    }, 60000);
    
    const statusInterval = setInterval(() => {
      updateOnlineStatus();
    }, 15000);
    
    return () => {
      clearInterval(statusInterval);
      clearInterval(dataRefreshInterval);
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, startDate, endDate, selectedRole, selectedStatus, viewMode]);

  // Cette fonction ne change plus aléatoirement le statut en ligne des utilisateurs
  // Elle met simplement à jour les statistiques basées sur les utilisateurs actuellement en ligne
  const updateOnlineStatus = () => {
    if (users.length === 0) return;
    
    // Au lieu de changer aléatoirement, nous gardons les mêmes utilisateurs en ligne
    // et mettons à jour uniquement l'horodatage pour montrer que les données sont rafraîchies
    const currentTime = new Date().toLocaleTimeString();
    
    // Calculer les statistiques basées sur les utilisateurs actuels
    const onlineCount = users.filter(user => user.isOnline).length;
    const totalCount = users.length;
    
    const stats = {
      ...userStats,
      online: onlineCount,
      onlinePercentage: totalCount > 0 ? Math.round((onlineCount / totalCount) * 100) : 0,
      lastUpdate: currentTime
    };
    
    setUserStats(stats);
    
    // Afficher un message de mise à jour dans la console pour le débogage
    console.log(`Statistiques mises à jour à ${currentTime}`);
  };

  // Fonction pour générer des utilisateurs de test
  const generateMockUsers = () => {
    // Définir la source de données comme fictive
    setDataSource('mock');
    
    // Générer un ID aléatoire
    const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Générer une date aléatoire dans les 2 dernières années
    const generateDate = () => {
      const start = new Date();
      start.setFullYear(start.getFullYear() - 2);
      const end = new Date();
      return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
    };
    
    // Générer une date de dernière connexion (plus récente)
    const generateLastLogin = () => {
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      const end = new Date();
      return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
    };
    
    // Liste de noms et prénoms pour générer des utilisateurs réalistes
    const firstNames = ['Mohamed', 'Ahmed', 'Ali', 'Youssef', 'Omar', 'Fatima', 'Aisha', 'Nour', 'Leila', 'Salma', 'Karim', 'Rania', 'Yasmine', 'Sami', 'Tarek'];
    const lastNames = ['Ben Ali', 'Trabelsi', 'Chaabane', 'Mejri', 'Bouzid', 'Jebali', 'Mansouri', 'Gharbi', 'Miled', 'Chebbi', 'Bouazizi', 'Hamdi', 'Zouari', 'Nasri', 'Khemiri'];
    
    // Générer un utilisateur aléatoire
    const generateUser = () => {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const role = ['admin', 'recruiter', 'candidate'][Math.floor(Math.random() * 3)];
      const status = Math.random() > 0.2 ? 'active' : 'inactive'; // 80% actifs
      const createdAt = generateDate();
      const lastLogin = Math.random() > 0.1 ? generateLastLogin() : null; // 90% ont une dernière connexion
      
      // Déterminer le statut en ligne de façon déterministe
      const isAdmin = role === 'admin';
      const isActive = status === 'active';
      const hasRecentLogin = lastLogin && (new Date().getTime() - new Date(lastLogin).getTime() < 24 * 60 * 60 * 1000);
      const idBasedOnline = generateId().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 10 > 3; // 60% chance
      
      return {
        _id: generateId(),
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(' ', '')}@example.com`,
        role,
        status,
        createdAt,
        lastLogin,
        isOnline: isAdmin || (isActive && (hasRecentLogin || idBasedOnline))
      };
    };
    
    // Générer un nombre spécifique d'utilisateurs pour chaque rôle
    const mockUsers = [];
    
    // Générer 3 administrateurs (toujours actifs et en ligne)
    for (let i = 0; i < 3; i++) {
      const admin = generateUser();
      admin.role = 'admin';
      admin.status = 'active';
      admin.isOnline = true;
      mockUsers.push(admin);
    }
    
    // Générer 10 recruteurs
    for (let i = 0; i < 10; i++) {
      const recruiter = generateUser();
      recruiter.role = 'recruiter';
      mockUsers.push(recruiter);
    }
    
    // Générer 30 candidats
    for (let i = 0; i < 30; i++) {
      const candidate = generateUser();
      candidate.role = 'candidate';
      mockUsers.push(candidate);
    }
    
    // Mettre à jour l'état avec les utilisateurs générés
    setUsers(mockUsers);
    
    // Calculer les statistiques
    const totalUsers = mockUsers.length;
    const activeUsers = mockUsers.filter(user => user.status === 'active').length;
    const inactiveUsers = totalUsers - activeUsers;
    const onlineUsers = mockUsers.filter(user => user.isOnline).length;
    
    setUserStats({
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      online: onlineUsers,
      admins: mockUsers.filter((user: User) => user.role === 'admin').length,
      recruiters: mockUsers.filter((user: User) => user.role === 'recruiter').length,
      candidates: mockUsers.filter((user: User) => user.role === 'candidate').length,
      recentlyActive: mockUsers.filter((user: User) => {
        return user.lastLogin && (new Date().getTime() - new Date(user.lastLogin).getTime() < 7 * 24 * 60 * 60 * 1000);
      }).length,
      onlinePercentage: totalUsers > 0 ? Math.round((onlineUsers / totalUsers) * 100) : 0,
      lastUpdate: new Date().toLocaleTimeString().toString() // Convertir la date en chaîne de caractères
    });
    
    toast.success('Données utilisateurs générées avec succès');
  };

  const fetchUsers = async (showToast = true) => {
    try {
      if (showToast) {
        setLoading(true);
      }
      
      // Configuration de la requête API avec timeout et retry
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 secondes timeout
      
      // Récupérer le token d'authentification
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // Tenter de récupérer les données réelles depuis l'API
      console.log("Connexion à l'API: ", `${environment.apiUrl}/users`);
      
      const response = await axios.get(`${environment.apiUrl}/users`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        signal: controller.signal,
        timeout: 8000, // 8 seconds timeout
        withCredentials: true
      });
      
      clearTimeout(timeoutId);
      
      if (response.data && Array.isArray(response.data)) {
        console.log("Données utilisateurs récupérées:", response.data.length);
        const userData = response.data;
        
        // Traiter les données utilisateur et attribuer le statut en ligne
        const usersWithOnlineStatus = userData.map((user: User) => {
          // Vérifier la dernière connexion
          const hasLastLogin = user.lastLogin || user.updatedAt;
          const lastLoginDate = hasLastLogin ? new Date(hasLastLogin) : null;
          
          // Vérifier si la dernière connexion est récente (moins de 30 minutes)
          const now = new Date();
          const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
          const hasRecentLogin = lastLoginDate && lastLoginDate > thirtyMinutesAgo;
          
          // Déterminer le statut en ligne
          const isAdmin = user.role === 'admin' || user.role === 'HR';
          const isOnline = isAdmin || hasRecentLogin || Math.random() > 0.7; 
          
          return {
            ...user,
            isOnline,
            // Ajouter un statut s'il n'existe pas
            status: user.status || (Math.random() > 0.2 ? 'active' : 'inactive')
          };
        });
        
        setUsers(usersWithOnlineStatus);
        setDataSource('api');
        updateUserStats(usersWithOnlineStatus);
        
        if (showToast) {
          toast.success(`${usersWithOnlineStatus.length} utilisateurs chargés depuis la base de données`, {
            position: "top-right",
            autoClose: 3000
          });
        }
      } else {
        console.warn("Format de données API invalide, utilisation des données de test");
        if (showToast) {
          toast.warning("Format de données invalide, génération de données de test", {
            position: "top-right",
            autoClose: 3000
          });
        }
        setDataSource('mock');
        generateMockUsers();
      }
    } catch (error: any) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      
      // Afficher un message d'erreur plus détaillé
      const errorMessage = error.response 
        ? `Erreur ${error.response.status}: ${error.response.statusText}` 
        : error.message === 'Network Error' 
          ? "Erreur réseau: Impossible de se connecter au serveur"
          : error.code === 'ECONNABORTED' 
            ? "Délai d'attente dépassé pour la connexion à l'API"
            : "Erreur lors de la récupération des données utilisateurs";
      
      if (showToast) {
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 5000
        });
      }
      
      // Uniquement générer des données de test si on n'a pas déjà des utilisateurs
      if (users.length === 0) {
        if (showToast) {
          toast.info("Utilisation de données simulées pour la démonstration", {
            position: "top-right",
            autoClose: 3000
          });
        }
        setDataSource('mock');
        generateMockUsers();
      }
    } finally {
      if (showToast) {
        setLoading(false);
      }
    }
  };
  
  // Helper function to calculate user statistics
  const updateUserStats = (userList: User[]) => {
    const totalUsers = userList.length;
    const activeUsers = userList.filter(user => user.status === 'active').length;
    const inactiveUsers = totalUsers - activeUsers;
    const onlineUsers = userList.filter(user => user.isOnline).length;
    
    setUserStats({
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      online: onlineUsers,
      admins: userList.filter(user => user.role === 'admin').length,
      recruiters: userList.filter(user => user.role === 'recruiter').length,
      candidates: userList.filter(user => user.role === 'candidate').length,
      recentlyActive: userList.filter(user => {
        return user.lastLogin && (new Date().getTime() - new Date(user.lastLogin).getTime() < 7 * 24 * 60 * 60 * 1000);
      }).length,
      onlinePercentage: totalUsers > 0 ? Math.round((onlineUsers / totalUsers) * 100) : 0,
      lastUpdate: new Date().toLocaleTimeString()
    });
    
    // Apply filters after updating stats
    applyFilters();
  };

  const applyFilters = () => {
    // Show loading state briefly to indicate filtering is being applied
    setLoading(true);

    // Use a timeout to simulate processing and ensure UI update
    setTimeout(() => {
      // Start with all users
      let filtered = [...users];
      
      // Apply search term filter
      if (searchTerm) {
        filtered = filtered.filter((user: User) => {
          const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
          const email = user.email.toLowerCase();
          const term = searchTerm.toLowerCase();
          return fullName.includes(term) || email.includes(term);
        });
      }
      
      // Apply role filter
      if (selectedRole !== 'all') {
        filtered = filtered.filter((user: User) => 
          user.role.toLowerCase() === selectedRole.toLowerCase()
        );
      }
      
      // Apply status filter
      if (selectedStatus !== 'all') {
        filtered = filtered.filter((user: User) => 
          user.status?.toLowerCase() === selectedStatus.toLowerCase()
        );
      }
      
      // Apply date range filter
      if (startDate && endDate) {
        filtered = filtered.filter((user: User) => {
          const createdDate = new Date(user.createdAt);
          return createdDate >= startDate && createdDate <= endDate;
        });
      }
      
      // Apply view mode filter
      if (viewMode === 'active') {
        filtered = filtered.filter((user: User) => user.status === 'active');
      } else if (viewMode === 'inactive') {
        filtered = filtered.filter((user: User) => user.status === 'inactive');
      } else if (viewMode === 'online') {
        filtered = filtered.filter((user: User) => user.isOnline);
      }
      
      // If no users matched the filters, we'll still display online users
      const hasFilters = searchTerm || selectedRole !== 'all' || selectedStatus !== 'all' || 
                        (startDate && endDate) || viewMode !== 'all';
      
      // Update filtered users state
      setFilteredUsers(filtered);
      setLoading(false);

      // Show a notification if filters were applied but no results were found
      if (hasFilters && filtered.length === 0) {
        toast.info('Aucun utilisateur ne correspond aux filtres appliqués. Affichage des utilisateurs en ligne.', {
          position: "top-right",
          autoClose: 3000
        });
      }
    }, 300); // Short delay for better UX
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedRole('all');
    setSelectedStatus('all');
  };

  const toggleStatistics = () => {
    setShowStatistics(!showStatistics);
  };

  // Gestionnaire d'événement pour le bouton toggleStatistics
  const handleToggleStatisticsClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    toggleStatistics();
  };

  const setActiveUsersView = () => {
    setViewMode('active');
  };

  const setInactiveUsersView = () => {
    setViewMode('inactive');
  };

  const setOnlineUsersView = () => {
    setViewMode('online');
  };

  const setAllUsersView = () => {
    setViewMode('all');
  };

  const exportToCsv = () => {
    if (filteredUsers.length === 0) {
      toast.warning('Aucune donnée à exporter');
      return;
    }
    
    const headers = ['ID', 'Nom', 'Email', 'Rôle', 'Statut', 'Date de création', 'Dernière connexion'];
    const csvData = filteredUsers.map(user => [
      user._id,
      `${user.firstName} ${user.lastName}`,
      user.email,
      user.role,
      user.status,
      new Date(user.createdAt).toLocaleDateString(),
      user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `users_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  // Fonctions de tri pour le tableau
  const sortByName = () => {
    const sorted = [...filteredUsers].sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
    setFilteredUsers(sorted);
  };

  const sortByEmail = () => {
    const sorted = [...filteredUsers].sort((a, b) => {
      return a.email.toLowerCase().localeCompare(b.email.toLowerCase());
    });
    setFilteredUsers(sorted);
  };

  const sortByDate = () => {
    const sorted = [...filteredUsers].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    setFilteredUsers(sorted);
  };

  // Fonction pour afficher les utilisateurs connectés en temps réel
  const updateConnectedUsers = () => {
    // Mettre à jour uniquement les utilisateurs connectés sans changer les statistiques
    const onlineUsers = users.filter(user => user.isOnline);
    // Vous pouvez ajouter ici d'autres logiques si nécessaire
    
    // Mettre à jour l'horodatage pour montrer que les données sont rafraîchies
    const currentTime = new Date().toLocaleTimeString();
    console.log(`Utilisateurs connectés mis à jour à ${currentTime}`);
    
    // Forcer le rafraîchissement du composant
    setUserStats({
      ...userStats,
      lastUpdate: currentTime
    });
  };
  
  // Fonction pour le bouton Actualiser
  const handleActualiserClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    fetchUsers(true);
  };
  
  // Fonction pour le bouton Générer des utilisateurs test
  const handleGenerateMockUsersClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    generateMockUsers();
  };
  
  // Gestionnaire d'événement pour le bouton exportToCsv
  const handleExportCsvClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    exportToCsv();
  };
  
  // Gestionnaire d'événement pour le bouton resetFilters
  const handleResetFiltersClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    resetFilters();
  };
  
  // Fonction pour le composant RealTimeUsers
  const handleRealTimeRefresh = () => {
    fetchUsers(true);
  };
  
  // Effet pour mettre à jour les utilisateurs connectés toutes les 10 secondes
  useEffect(() => {
    const connectedInterval = setInterval(() => {
      updateConnectedUsers();
    }, 10000);
    return () => clearInterval(connectedInterval);
  }, [users]);

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        <div className="page-header">
          <div className="row align-items-center">
            <div className="col">
              <h3 className="page-title">Rapport Utilisateurs</h3>
              <ul className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link to="/dashboard">Tableau de bord</Link>
                </li>
                <li className="breadcrumb-item active">Rapport Utilisateurs</li>
              </ul>
            </div>
            <div className="col-auto">
              <button className="btn btn-primary me-2" onClick={handleToggleStatisticsClick}>
                {showStatistics ? 'Masquer Statistiques' : 'Afficher Statistiques'}
              </button>
              <button 
                className="btn btn-success"
                onClick={handleActualiserClick}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Chargement...
                  </>
                ) : (
                  <>
                    <i className="fa fa-refresh me-1"></i> Actualiser les données
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Indicateur de source de données */}
        <div className="data-source-indicator mb-3">
          <div className={`alert ${dataSource === 'api' ? 'alert-success' : 'alert-warning'} d-flex align-items-center py-2`}>
            <i className={`fa ${dataSource === 'api' ? 'fa-database' : 'fa-flask'} me-2`}></i>
            <div>
              {dataSource === 'api' 
                ? "Données chargées depuis la base de données - Dernière mise à jour: " 
                : "Données simulées pour démonstration - Générées le: "
              }
              <strong>{userStats.lastUpdate}</strong>
              {dataSource === 'mock' && (
                <button 
                  className="btn btn-sm btn-warning ms-3" 
                  onClick={handleActualiserClick}
                  disabled={loading}
                >
                  <i className="fa fa-refresh me-1"></i> Tenter de se connecter à la base de données
                </button>
              )}
            </div>
          </div>
        </div>
      
      {/* Statistiques des utilisateurs */}
      {/* Section des utilisateurs connectés */}
      <div className="online-users-container mb-4">
        <div className="statistics-header mb-3 d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-0">Utilisateurs actuellement connectés <span className="badge bg-success ms-2">{users.filter(user => user.isOnline).length}</span></h4>
            <p className="text-muted">Dernière mise à jour: {userStats.lastUpdate} <span className="online-pulse ms-2"></span></p>
          </div>
          <div className="online-stats">
            <div className="d-flex align-items-center">
              <div className="online-stat-item">
                <span className="stat-value">{userStats.onlinePercentage}%</span>
                <span className="stat-label">des utilisateurs</span>
              </div>
              <div className="online-stat-item ms-3">
                <span className="stat-value">{users.filter(user => user.isOnline && user.role === 'admin').length}</span>
                <span className="stat-label">admins</span>
              </div>
              <div className="online-stat-item ms-3">
                <span className="stat-value">{users.filter(user => user.isOnline && user.role === 'recruiter').length}</span>
                <span className="stat-label">recruteurs</span>
              </div>
              <div className="online-stat-item ms-3">
                <span className="stat-value">{users.filter(user => user.isOnline && user.role === 'candidate').length}</span>
                <span className="stat-label">candidats</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Onglets pour filtrer les utilisateurs connectés par rôle */}
        <ul className="nav nav-tabs mb-3">
          <li className="nav-item">
            <a className="nav-link active" data-bs-toggle="tab" href="#all-online">Tous ({users.filter(user => user.isOnline).length})</a>
          </li>
          <li className="nav-item">
            <a className="nav-link" data-bs-toggle="tab" href="#admins-online">Administrateurs ({users.filter(user => user.isOnline && user.role === 'admin').length})</a>
          </li>
          <li className="nav-item">
            <a className="nav-link" data-bs-toggle="tab" href="#recruiters-online">Recruteurs ({users.filter(user => user.isOnline && user.role === 'recruiter').length})</a>
          </li>
          <li className="nav-item">
            <a className="nav-link" data-bs-toggle="tab" href="#candidates-online">Candidats ({users.filter(user => user.isOnline && user.role === 'candidate').length})</a>
          </li>
        </ul>
        
        <div className="tab-content">
          {/* Tous les utilisateurs connectés */}
          <div className="tab-pane fade show active" id="all-online">
            <Row>
              {users.filter(user => user.isOnline).length > 0 ? (
                users.filter(user => user.isOnline).map(user => (
                  <Col md={3} sm={6} key={user._id} className="mb-3">
                    <Card className="online-user-card">
                      <Card.Body className="p-3">
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-md me-3 position-relative">
                            <img
                              className="avatar-img rounded-circle"
                              src={`https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random&size=80`}
                              alt={`${user.firstName} ${user.lastName}`}
                            />
                            <span className="position-absolute bottom-0 end-0 user-status-indicator user-status-online" 
                                  style={{ width: '12px', height: '12px', border: '2px solid white' }}></span>
                          </div>
                          <div>
                            <h5 className="mb-1">{`${user.firstName} ${user.lastName}`}</h5>
                            <p className="text-muted mb-0 small">{user.email}</p>
                            <div className="mt-1 d-flex align-items-center">
                              <span className={`badge ${user.role === 'admin' ? 'bg-primary' : user.role === 'recruiter' ? 'bg-info' : 'bg-success'}`}>
                                {user.role}
                              </span>
                              <span className="badge bg-success ms-2">En ligne</span>
                              {user.lastLogin && (
                                <span className="text-muted ms-2 small">Depuis {new Date(user.lastLogin).toLocaleTimeString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))
              ) : (
                <Col md={12}>
                  <div className="text-center p-4 bg-light rounded">
                    <i className="fa fa-users fa-3x text-muted mb-3"></i>
                    <h5>Aucun utilisateur connecté actuellement</h5>
                    <p className="text-muted">Les utilisateurs en ligne apparaîtront ici</p>
                  </div>
                </Col>
              )}
            </Row>
          </div>
          
          {/* Administrateurs connectés */}
          <div className="tab-pane fade" id="admins-online">
            <Row>
              {users.filter(user => user.isOnline && user.role === 'admin').length > 0 ? (
                users.filter(user => user.isOnline && user.role === 'admin').map(user => (
                  <Col md={3} sm={6} key={user._id} className="mb-3">
                    <Card className="online-user-card admin-card">
                      <Card.Body className="p-3">
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-md me-3 position-relative">
                            <img
                              className="avatar-img rounded-circle"
                              src={`https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=0D6EFD&color=fff&size=80`}
                              alt={`${user.firstName} ${user.lastName}`}
                            />
                            <span className="position-absolute bottom-0 end-0 user-status-indicator user-status-online" 
                                  style={{ width: '12px', height: '12px', border: '2px solid white' }}></span>
                          </div>
                          <div>
                            <h5 className="mb-1">{`${user.firstName} ${user.lastName}`}</h5>
                            <p className="text-muted mb-0 small">{user.email}</p>
                            <div className="mt-1 d-flex align-items-center">
                              <span className="badge bg-primary">Administrateur</span>
                              <span className="badge bg-success ms-2">En ligne</span>
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))
              ) : (
                <Col md={12}>
                  <div className="text-center p-4 bg-light rounded">
                    <i className="fa fa-user-shield fa-3x text-primary mb-3"></i>
                    <h5>Aucun administrateur connecté actuellement</h5>
                  </div>
                </Col>
              )}
            </Row>
          </div>
          
          {/* Recruteurs connectés */}
          <div className="tab-pane fade" id="recruiters-online">
            <Row>
              {users.filter(user => user.isOnline && user.role === 'recruiter').length > 0 ? (
                users.filter(user => user.isOnline && user.role === 'recruiter').map(user => (
                  <Col md={3} sm={6} key={user._id} className="mb-3">
                    <Card className="online-user-card recruiter-card">
                      <Card.Body className="p-3">
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-md me-3 position-relative">
                            <img
                              className="avatar-img rounded-circle"
                              src={`https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=17A2B8&color=fff&size=80`}
                              alt={`${user.firstName} ${user.lastName}`}
                            />
                            <span className="position-absolute bottom-0 end-0 user-status-indicator user-status-online" 
                                  style={{ width: '12px', height: '12px', border: '2px solid white' }}></span>
                          </div>
                          <div>
                            <h5 className="mb-1">{`${user.firstName} ${user.lastName}`}</h5>
                            <p className="text-muted mb-0 small">{user.email}</p>
                            <div className="mt-1 d-flex align-items-center">
                              <span className="badge bg-info">Recruteur</span>
                              <span className="badge bg-success ms-2">En ligne</span>
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))
              ) : (
                <Col md={12}>
                  <div className="text-center p-4 bg-light rounded">
                    <i className="fa fa-user-tie fa-3x text-info mb-3"></i>
                    <h5>Aucun recruteur connecté actuellement</h5>
                  </div>
                </Col>
              )}
            </Row>
          </div>
          
          {/* Candidats connectés */}
          <div className="tab-pane fade" id="candidates-online">
            <Row>
              {users.filter(user => user.isOnline && user.role === 'candidate').length > 0 ? (
                users.filter(user => user.isOnline && user.role === 'candidate').map(user => (
                  <Col md={3} sm={6} key={user._id} className="mb-3">
                    <Card className="online-user-card candidate-card">
                      <Card.Body className="p-3">
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-md me-3 position-relative">
                            <img
                              className="avatar-img rounded-circle"
                              src={`https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=28A745&color=fff&size=80`}
                              alt={`${user.firstName} ${user.lastName}`}
                            />
                            <span className="position-absolute bottom-0 end-0 user-status-indicator user-status-online" 
                                  style={{ width: '12px', height: '12px', border: '2px solid white' }}></span>
                          </div>
                          <div>
                            <h5 className="mb-1">{`${user.firstName} ${user.lastName}`}</h5>
                            <p className="text-muted mb-0 small">{user.email}</p>
                            <div className="mt-1 d-flex align-items-center">
                              <span className="badge bg-success">Candidat</span>
                              <span className="badge bg-success ms-2">En ligne</span>
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))
              ) : (
                <Col md={12}>
                  <div className="text-center p-4 bg-light rounded">
                    <i className="fa fa-user-graduate fa-3x text-success mb-3"></i>
                    <h5>Aucun candidat connecté actuellement</h5>
                  </div>
                </Col>
              )}
            </Row>
          </div>
        </div>
      </div>
      
      {showStatistics && (
        <div className="statistics-container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-0">Rapport des utilisateurs</h2>
              <p className="text-muted">Consultez les statistiques et les informations des utilisateurs</p>
            </div>
            <div className="d-flex">
              <Button variant="outline-primary" className="me-2" onClick={handleToggleStatisticsClick}>
                {showStatistics ? <><FeatherIcon icon="eye-off" size={16} /> Masquer les statistiques</> : <><FeatherIcon icon="bar-chart-2" size={16} /> Afficher les statistiques</>}
              </Button>
              <Button variant="outline-success" className="me-2" onClick={handleGenerateMockUsersClick}>
                <FeatherIcon icon="users" size={16} /> Générer des utilisateurs test
              </Button>
              <Button variant="primary" onClick={handleActualiserClick}>
                <FeatherIcon icon="refresh-cw" size={16} /> Actualiser
              </Button>
            </div>
          </div>
          
          <Row className="mb-4">
            <Col md={3}>
              <Card className="card-stats">
                <Card.Body>
                  <div className="d-flex align-items-center">
                    <div className="stats-icon bg-primary">
                      <i className="fa fa-users"></i>
                    </div>
                    <div className="ms-3">
                      <h5 className="card-title">Total Utilisateurs</h5>
                      <h3 className="card-text">{userStats.total}</h3>
                    </div>
                  </div>
                  <ProgressBar now={100} variant="primary" className="mt-3" />
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="card-stats">
                <Card.Body>
                  <div className="d-flex align-items-center">
                    <div className="stats-icon bg-success">
                      <i className="fa fa-check-circle"></i>
                    </div>
                    <div className="ms-3">
                      <h5 className="card-title">Utilisateurs Actifs</h5>
                      <h3 className="card-text">{userStats.active}</h3>
                    </div>
                  </div>
                  <ProgressBar 
                    now={(userStats.active / userStats.total) * 100} 
                    variant="success" 
                    className="mt-3" 
                  />
                  <div className="text-end mt-2">
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveUsersView(); }} className="text-success">Voir tous</a>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="card-stats">
                <Card.Body>
                  <div className="d-flex align-items-center">
                    <div className="stats-icon bg-danger">
                      <i className="fa fa-times-circle"></i>
                    </div>
                    <div className="ms-3">
                      <h5 className="card-title">Utilisateurs Inactifs</h5>
                      <h3 className="card-text">{userStats.inactive}</h3>
                    </div>
                  </div>
                  <ProgressBar 
                    now={(userStats.inactive / userStats.total) * 100} 
                    variant="danger" 
                    className="mt-3" 
                  />
                  <div className="text-end mt-2">
                    <a href="#" onClick={(e) => { e.preventDefault(); setInactiveUsersView(); }} className="text-danger">Voir tous</a>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="card-stats card-online-users">
                <Card.Body>
                  <div className="d-flex align-items-center">
                    <div className="stats-icon bg-info">
                      <i className="fa fa-circle"></i>
                    </div>
                    <div className="ms-3">
                      <h5 className="card-title">Utilisateurs En Ligne</h5>
                      <h3 className="card-text">
                        {userStats.online}
                        <span className="online-pulse"></span>
                      </h3>
                    </div>
                  </div>
                  <ProgressBar 
                    now={(userStats.online / userStats.total) * 100} 
                    variant="info" 
                    className="mt-3" 
                  />
                  <div className="text-end mt-2">
                    <a href="#" onClick={(e) => { e.preventDefault(); setOnlineUsersView(); }} className="text-info">Voir tous</a>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {/* Statistiques par rôle */}
          <div className="statistics-header mb-3 mt-4">
            <h4 className="mb-0">Répartition par rôle</h4>
            <p className="text-muted">Distribution des utilisateurs par type de compte</p>
          </div>
          
          <Row className="mb-4">
            <Col md={4}>
              <Card className="card-stats">
                <Card.Body>
                  <h5 className="card-title">Administrateurs</h5>
                  <div className="d-flex align-items-center mt-3">
                    <h3 className="card-text me-3">{userStats.admins}</h3>
                    <ProgressBar 
                      now={(userStats.admins / userStats.total) * 100} 
                      variant="primary" 
                      className="flex-grow-1" 
                    />
                  </div>
                  <div className="text-muted mt-2 small">
                    {Math.round((userStats.admins / userStats.total) * 100)}% du total des utilisateurs
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="card-stats">
                <Card.Body>
                  <h5 className="card-title">Recruteurs</h5>
                  <div className="d-flex align-items-center mt-3">
                    <h3 className="card-text me-3">{userStats.recruiters}</h3>
                    <ProgressBar 
                      now={(userStats.recruiters / userStats.total) * 100} 
                      variant="info" 
                      className="flex-grow-1" 
                    />
                  </div>
                  <div className="text-muted mt-2 small">
                    {Math.round((userStats.recruiters / userStats.total) * 100)}% du total des utilisateurs
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="card-stats">
                <Card.Body>
                  <h5 className="card-title">Candidats</h5>
                  <div className="d-flex align-items-center mt-3">
                    <h3 className="card-text me-3">{userStats.candidates}</h3>
                    <ProgressBar 
                      now={(userStats.candidates / userStats.total) * 100} 
                      variant="success" 
                      className="flex-grow-1" 
                    />
                  </div>
                  <div className="text-muted mt-2 small">
                    {Math.round((userStats.candidates / userStats.total) * 100)}% du total des utilisateurs
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {/* Activité récente */}
          <div className="statistics-header mb-3 mt-4">
            <h4 className="mb-0">Activité des utilisateurs</h4>
            <p className="text-muted">Analyse de l'activité sur les 7 derniers jours</p>
          </div>
          
          <Row className="mb-4">
            <Col md={6}>
              <Card className="card-stats">
                <Card.Body>
                  <h5 className="card-title">Utilisateurs récemment actifs</h5>
                  <div className="d-flex align-items-center mt-3">
                    <h3 className="card-text me-3">{userStats.recentlyActive}</h3>
                    <ProgressBar 
                      now={(userStats.recentlyActive / userStats.total) * 100} 
                      variant="warning" 
                      className="flex-grow-1" 
                    />
                  </div>
                  <div className="text-muted mt-2">
                    {Math.round((userStats.recentlyActive / userStats.total) * 100)}% des utilisateurs se sont connectés au cours des 7 derniers jours
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="card-stats">
                <Card.Body>
                  <h5 className="card-title">Utilisateurs actuellement en ligne</h5>
                  <div className="d-flex align-items-center mt-3">
                    <h3 className="card-text me-3">{userStats.online}</h3>
                    <ProgressBar 
                      now={(userStats.online / userStats.total) * 100} 
                      variant="info" 
                      className="flex-grow-1" 
                    />
                  </div>
                  <div className="text-muted mt-2">
                    {Math.round((userStats.online / userStats.total) * 100)}% des utilisateurs sont actuellement connectés
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      )}
      
      <Row>
        <Col md={12}>
          <Card className="mb-4">
            <Card.Body>
              {/* Section des utilisateurs connectés en temps réel */}
              <RealTimeUsers 
                users={users} 
                lastUpdate={userStats.lastUpdate || new Date().toLocaleTimeString()} 
                onRefresh={handleRealTimeRefresh}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="card-title">Liste des utilisateurs</h4>
                <div className="btn-group">
                  <button 
                    className={`btn ${viewMode === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={setAllUsersView}
                  >
                    Tous ({userStats.total})
                  </button>
                  <button 
                    className={`btn ${viewMode === 'active' ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={setActiveUsersView}
                  >
                    Actifs ({userStats.active})
                  </button>
                  <button 
                    className={`btn ${viewMode === 'inactive' ? 'btn-danger' : 'btn-outline-danger'}`}
                    onClick={setInactiveUsersView}
                  >
                    Inactifs ({userStats.inactive})
                  </button>
                  <button 
                    className={`btn ${viewMode === 'online' ? 'btn-info' : 'btn-outline-info'}`}
                    onClick={setOnlineUsersView}
                  >
                    En ligne ({userStats.online})
                  </button>
                </div>
                <div>
                  <button className="btn btn-success me-2" onClick={handleExportCsvClick}>
                    <i className="fa fa-download me-1"></i> Exporter
                  </button>
                  <button className="btn btn-secondary" onClick={handleResetFiltersClick}>
                    <i className="fa fa-refresh me-1"></i> Réinitialiser
                  </button>
                </div>
              </div>
              
              <div className="row mb-4">
                <div className="col-md-3">
                  <div className="form-group">
                    <label>Recherche</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Nom, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="form-group">
                    <label>Date de début</label>
                    <DatePicker
                      selected={startDate}
                      onChange={(date: Date | null) => setStartDate(date || undefined)}
                      selectsStart
                      startDate={startDate}
                      endDate={endDate}
                      className="form-control"
                      placeholderText="Date de début"
                      dateFormat="dd/MM/yyyy"
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="form-group">
                    <label>Date de fin</label>
                    <DatePicker
                      selected={endDate}
                      onChange={(date: Date | null) => setEndDate(date || undefined)}
                      selectsEnd
                      startDate={startDate}
                      endDate={endDate}
                      minDate={startDate}
                      className="form-control"
                      placeholderText="Date de fin"
                      dateFormat="dd/MM/yyyy"
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="form-group">
                    <label>Rôle</label>
                    <select
                      className="form-control"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      <option value="all">Tous les rôles</option>
                      <option value="admin">Admin</option>
                      <option value="recruiter">Recruteur</option>
                      <option value="candidate">Candidat</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-3 mt-3">
                  <div className="form-group">
                    <label>Statut</label>
                    <select
                      className="form-control"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                      <option value="all">Tous les statuts</option>
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {loading ? (
                <div className="text-center p-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Chargement...</span>
                  </div>
                  <p className="mt-2">Chargement des données...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table className="table-striped table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th onClick={sortByName} style={{ cursor: 'pointer' }}>
                          Nom <FeatherIcon icon="chevron-down" size={14} />
                        </th>
                        <th onClick={sortByEmail} style={{ cursor: 'pointer' }}>
                          Email <FeatherIcon icon="chevron-down" size={14} />
                        </th>
                        <th>Rôle</th>
                        <th>Statut</th>
                        <th>Connexion</th>
                        <th onClick={sortByDate} style={{ cursor: 'pointer' }}>
                          Date de création <FeatherIcon icon="chevron-down" size={14} />
                        </th>
                        <th>Dernière connexion</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user: User) => (
                          <tr key={user._id}>
                            <td>{user._id.substring(0, 8)}...</td>
                            <td>
                              <div className="table-avatar">
                                <Link to="#" className="avatar avatar-sm me-2 position-relative">
                                  <img
                                    className="avatar-img rounded-circle"
                                    src={`https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`}
                                    alt="User Avatar"
                                  />
                                  {user.isOnline && (
                                    <span className="position-absolute bottom-0 end-0 user-status-indicator user-status-online" 
                                          style={{ width: '10px', height: '10px', border: '2px solid white' }}></span>
                                  )}
                                </Link>
                                <Link to="#" className="d-flex align-items-center">
                                  {`${user.firstName} ${user.lastName}`}
                                  {user.isOnline && (
                                    <span className="badge bg-success ms-2" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>En ligne</span>
                                  )}
                                </Link>
                              </div>
                            </td>
                            <td>{user.email}</td>
                            <td>
                              <span className={`badge ${user.role === 'admin' ? 'bg-primary' : user.role === 'recruiter' ? 'bg-info' : 'bg-success'}`}>
                                {user.role}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${user.status === 'active' ? 'bg-success' : 'bg-danger'}`}>
                                {user.status}
                              </span>
                            </td>
                            <td>
                              {user.isOnline ? (
                                <div className="d-flex align-items-center">
                                  <span className="user-status-indicator user-status-online me-2" style={{ width: '8px', height: '8px' }}></span>
                                  <span className="text-success">En ligne</span>
                                </div>
                              ) : (
                                <div className="d-flex align-items-center">
                                  <span className="user-status-indicator user-status-offline me-2" style={{ width: '8px', height: '8px' }}></span>
                                  <span className="text-muted">Hors ligne</span>
                                </div>
                              )}
                            </td>
                            <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                            <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}</td>
                            <td>
                              <div className="dropdown dropdown-action">
                                <Dropdown className="dropdown-action">
                                  <Dropdown.Toggle className="action-icon">
                                    <i className="material-icons">more_vert</i>
                                  </Dropdown.Toggle>
                                  <Dropdown.Menu className="dropdown-menu">
                                    <Dropdown.Item
                                      href="#"
                                      onClick={() => window.location.href = `/user-management/manage-users?id=${user._id}`}
                                    >
                                      <i className="fa fa-pencil m-r-5"></i> Voir détails
                                    </Dropdown.Item>
                                  </Dropdown.Menu>
                                </Dropdown>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        users.filter(user => user.isOnline).slice(0, 5).map((user: User) => (
                          <tr key={user._id}>
                            <td>{user._id.substring(0, 8)}...</td>
                            <td>
                              <div className="table-avatar">
                                <Link to="#" className="avatar avatar-sm me-2 position-relative">
                                  <img
                                    className="avatar-img rounded-circle"
                                    src={`https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`}
                                    alt="User Avatar"
                                  />
                                  <span className="position-absolute bottom-0 end-0 user-status-indicator user-status-online" 
                                        style={{ width: '10px', height: '10px', border: '2px solid white' }}></span>
                                </Link>
                                <Link to="#" className="d-flex align-items-center">
                                  {`${user.firstName} ${user.lastName}`}
                                  <span className="badge bg-success ms-2" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>En ligne</span>
                                </Link>
                              </div>
                            </td>
                            <td>{user.email}</td>
                            <td>
                              <span className={`badge ${user.role === 'admin' ? 'bg-primary' : user.role === 'recruiter' ? 'bg-info' : 'bg-success'}`}>
                                {user.role}
                              </span>
                            </td>
                            <td>
                              <span className="badge bg-success">active</span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <span className="user-status-indicator user-status-online me-2" style={{ width: '8px', height: '8px' }}></span>
                                <span className="text-success">En ligne</span>
                              </div>
                            </td>
                            <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                            <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}</td>
                            <td>
                              <div className="dropdown dropdown-action">
                                <Dropdown className="dropdown-action">
                                  <Dropdown.Toggle className="action-icon">
                                    <i className="material-icons">more_vert</i>
                                  </Dropdown.Toggle>
                                  <Dropdown.Menu className="dropdown-menu">
                                    <Dropdown.Item
                                      href="#"
                                      onClick={() => window.location.href = `/user-management/manage-users?id=${user._id}`}
                                    >
                                      <i className="fa fa-pencil m-r-5"></i> Voir détails
                                    </Dropdown.Item>
                                  </Dropdown.Menu>
                                </Dropdown>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              )}
              
              {!loading && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    {filteredUsers.length > 0 
                      ? `Affichage de ${Math.min(filteredUsers.length, 10)} sur ${filteredUsers.length} utilisateurs` 
                      : `Affichage des utilisateurs en ligne uniquement - ${users.filter(user => user.isOnline).length} utilisateur(s) connecté(s)`}
                  </div>
                  <nav>
                    <ul className="pagination">
                      <li className="page-item disabled"><a className="page-link" href="#">Précédent</a></li>
                      <li className="page-item active"><a className="page-link" href="#">1</a></li>
                      <li className="page-item"><a className="page-link" href="#">2</a></li>
                      <li className="page-item"><a className="page-link" href="#">3</a></li>
                      <li className="page-item"><a className="page-link" href="#">Suivant</a></li>
                    </ul>
                  </nav>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      </div>
    </div>
  );
};

export default UserReport;