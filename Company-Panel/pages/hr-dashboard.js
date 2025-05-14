import VacancyChart from "@/components/elements/VacancyChart"
import Layout from "@/components/layout/Layout"
import BrandSlider from "@/components/slider/BrandSlider"
import { Menu } from '@headlessui/react'
import Link from "next/link"
import withAuth from "@/utils/withAuth"
import { useEffect, useState } from "react"
import { getToken, createAuthAxios } from '../utils/authUtils'
import { useRouter } from 'next/router'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Enregistrez les composants Chart.js nécessaires
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title);

function HrDashboard({ user }) {
    const router = useRouter();
    const [roleDisplay, setRoleDisplay] = useState('');
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalJobs: 0,
        activeJobs: 0,
        totalApplications: 0,
        newApplications: 0,
        applicationGrowth: 0,
        applicationsByStatus: {
            pending: 0,
            accepted: 0,
            rejected: 0
        }
    });
    const [topCandidates, setTopCandidates] = useState([]);
    const [recentApplications, setRecentApplications] = useState([]);
    const [candidatesLoading, setCandidatesLoading] = useState(false);
    const [applicationsLoading, setApplicationsLoading] = useState(false);
    const authAxios = createAuthAxios();
    
    // États pour les données des graphiques
    const [applicationTrend, setApplicationTrend] = useState({
        labels: [],
        datasets: []
    });
    
    const [jobDistribution, setJobDistribution] = useState({
        labels: [],
        datasets: []
    });
    
    const [applicationStatusChart, setApplicationStatusChart] = useState({
        labels: [],
        datasets: []
    });
    
    // Nouvel état pour la répartition géographique
    const [geographicDistribution, setGeographicDistribution] = useState({
        regions: {
            'Tunis': 0,
            'Sousse': 0,
            'Sfax': 0,
            'Autres régions': 0
        },
        topCities: []
    });
    
    // Ajouter les métriques de performance de recrutement
    const [recruitmentMetrics, setRecruitmentMetrics] = useState({
        timeToHire: 0,         // Jours en moyenne pour embaucher
        conversionRate: 0,     // Pourcentage de candidats embauchés
        interviewToHire: 0,    // Ratio entretiens/embauches
        topJobsource: '',      // Source principale de candidats
        costPerHire: 0         // Coût par recrutement
    });
    
    // État pour l'analyse des compétences
    const [skillsAnalysis, setSkillsAnalysis] = useState({
        topSkills: [
            { name: 'JavaScript', count: 0, level: 0 },
            { name: 'React', count: 0, level: 0 },
            { name: 'Node.js', count: 0, level: 0 },
            { name: 'SQL', count: 0, level: 0 },
            { name: 'Python', count: 0, level: 0 },
            { name: 'Java', count: 0, level: 0 },
            { name: 'PHP', count: 0, level: 0 },
            { name: 'UI/UX', count: 0, level: 0 }
        ],
        skillGaps: []
    });
    
    // État pour l'activité de recrutement
    const [recruitmentActivity, setRecruitmentActivity] = useState({
        weekdayActivity: [0, 0, 0, 0, 0, 0, 0], // [Dim, Lun, Mar, Mer, Jeu, Ven, Sam]
        hourlyActivity: Array(24).fill(0), // 24 heures
        bestTimeToPost: {
            day: 'Lundi',
            time: '10:00'
        },
        averageResponseTime: 48 // Heures
    });
    
    useEffect(() => {
        // Générer des données de base pour le graphique lors du premier rendu
        const initialChartData = generateInitialChartData();
        setApplicationTrend(initialChartData);
    }, []);
    
    // Fonction pour générer des données de base pour le graphique
    const generateInitialChartData = () => {
        const days = [];
        const randomData = [];
        
        // Générer les labels pour les 7 derniers jours
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toLocaleDateString('fr-FR', { weekday: 'short' }));
            
            // Générer des données aléatoires pour le test initial
            randomData.push(Math.floor(Math.random() * 10));
        }
        
        return {
            labels: days,
            datasets: [
                {
                    label: 'Candidatures',
                    data: randomData,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    tension: 0.4,
                    fill: true
                }
            ]
        };
    };
    
    useEffect(() => {
        // Redirect if not HR role
        if (user && user.role.toString().toUpperCase() !== 'HR') {
            router.push('/candidate-dashboard');
            return;
        }
        
        // Set role display text based on user role
        if (user) {
            const role = user.role.toString().toUpperCase();
            setRoleDisplay(role === 'HR' ? 'HR Dashboard' : 'Candidate Dashboard');
            
            // Fetch dashboard data if user is HR
            if (role === 'HR') {
                fetchHrDashboardData();
            }
        }
    }, [user]);
    
    // Function to fetch all HR dashboard data in one call
    const fetchHrDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);
            setCandidatesLoading(true);
            setApplicationsLoading(true);
            
            console.log('Fetching HR dashboard data...');
            // Use the new consolidated API endpoint
            const response = await authAxios.get('/api/dashboard/hr-dashboard');
            
            if (response.data.success) {
                console.log('HR dashboard data fetched:', response.data);
                
                // Set company data
                setCompany(response.data.company);
                
                // Debugging application status data
                console.log('Application status from backend:', response.data.stats.applicationsByStatus);
                console.log('Total applications:', response.data.stats.totalApplications);
                
                // Set statistics, directly use applicationsByStatus from backend
                setStats({
                    totalJobs: response.data.stats.totalJobs,
                    activeJobs: response.data.stats.activeJobs,
                    totalApplications: response.data.stats.totalApplications,
                    newApplications: response.data.stats.newApplications,
                    applicationGrowth: response.data.stats.applicationGrowth,
                    // Utiliser les données de statut du backend ou initialiser avec des valeurs vides si elles ne sont pas disponibles
                    applicationsByStatus: response.data.stats.applicationsByStatus || {
                        pending: 0,
                        accepted: 0,
                        rejected: 0
                    }
                });
                
                // Check data after setting state
                console.log('Stats state after update:', stats);
                
                // Set top candidates
                setTopCandidates(response.data.topCandidates || []);
                
                // Set recent applications
                setRecentApplications(response.data.recentApplications || []);
                
                // Calculer la répartition géographique
                calculateGeographicDistribution(response.data);
                
                // Préparer les données pour les graphiques
                prepareGraphData(response.data);
                
                // Simuler des métriques de recrutement
                // Dans une implémentation réelle, ces données viendraient de l'API
                const acceptedCount = response.data.stats.applicationsByStatus?.accepted || 0;
                const pendingCount = response.data.stats.applicationsByStatus?.pending || 0;
                
                setRecruitmentMetrics({
                    timeToHire: Math.floor(Math.random() * 20) + 10, // Entre 10-30 jours
                    conversionRate: response.data.stats.totalApplications > 0 
                        ? Math.floor((acceptedCount / response.data.stats.totalApplications) * 100) 
                        : 0,
                    interviewToHire: pendingCount > 0 
                        ? Math.round((acceptedCount / pendingCount) * 10) / 10 
                        : 0,
                    topJobsource: ['LinkedIn', 'Site web', 'Référence', 'Indeed'][Math.floor(Math.random() * 4)],
                    costPerHire: Math.floor(Math.random() * 500) + 500
                });
            } else {
                throw new Error(response.data.message || "Failed to load dashboard data");
            }
        } catch (err) {
            console.error('Error fetching HR dashboard data:', err);
            
            if (err.response && err.response.status === 404) {
                // User doesn't have a company yet
                setError("You don't have a company yet. Please create one.");
            } else {
                setError("Failed to load dashboard data. " + (err.response?.data?.message || err.message));
            }
        } finally {
            setLoading(false);
            setCandidatesLoading(false);
            setApplicationsLoading(false);
        }
    };
    
    // Fonction pour calculer la répartition géographique des candidats
    const calculateGeographicDistribution = (data) => {
        const regions = {
            'Tunis': 0,
            'Sousse': 0,
            'Sfax': 0,
            'Autres régions': 0
        };
        
        const cityCount = {};
        
        // Utiliser les candidats et les candidatures pour analyser leur emplacement
        const applications = data.recentApplications || [];
        const candidates = data.topCandidates || [];
        
        // Traiter les candidatures récentes
        applications.forEach(app => {
            if (app.user && app.user.location) {
                processLocation(app.user.location);
            }
        });
        
        // Traiter les meilleurs candidats
        candidates.forEach(candidate => {
            if (candidate.location) {
                processLocation(candidate.location);
            }
        });
        
        // Fonction interne pour traiter la localisation
        function processLocation(location) {
            const locationLower = location.toLowerCase();
            
            // Compter par ville
            if (!cityCount[location]) {
                cityCount[location] = 0;
            }
            cityCount[location]++;
            
            // Compter par région
            if (locationLower.includes('tunis')) {
                regions['Tunis']++;
            } else if (locationLower.includes('sousse')) {
                regions['Sousse']++;
            } else if (locationLower.includes('sfax')) {
                regions['Sfax']++;
            } else {
                regions['Autres régions']++;
            }
        }
        
        // Obtenir les 5 meilleures villes
        const topCities = Object.keys(cityCount)
            .map(city => ({ name: city, count: cityCount[city] }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        
        // Si nous n'avons pas de données, générer des données fictives
        if (Object.values(regions).reduce((sum, count) => sum + count, 0) === 0) {
            const total = data.stats.totalApplications || 20;
            regions['Tunis'] = Math.round(total * 0.5); // 50% Tunis
            regions['Sousse'] = Math.round(total * 0.2); // 20% Sousse
            regions['Sfax'] = Math.round(total * 0.15); // 15% Sfax
            regions['Autres régions'] = Math.round(total * 0.15); // 15% Autres
            
            // Villes fictives
            topCities.push({ name: 'Tunis', count: Math.round(total * 0.35) });
            topCities.push({ name: 'Ariana', count: Math.round(total * 0.15) });
            topCities.push({ name: 'Sousse', count: Math.round(total * 0.2) });
            topCities.push({ name: 'Sfax', count: Math.round(total * 0.15) });
            topCities.push({ name: 'Monastir', count: Math.round(total * 0.1) });
        }
        
        console.log('Répartition géographique:', { regions, topCities });
        
        setGeographicDistribution({
            regions,
            topCities
        });
    };
    
    // Fonction modifiée pour préparer les données des graphiques
    const prepareGraphData = (data) => {
        // Mettre à jour recentApplications
        const applications = data.recentApplications || [];
        setRecentApplications(applications);
        
        // Préparer les données pour le graphique de tendance
        const days = [];
        const appCounts = [];
        
        // Générer les labels pour les 7 derniers jours
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toLocaleDateString('fr-FR', { weekday: 'short' }));
            appCounts[6 - i] = 0; // Initialiser les compteurs à 0
        }
        
        // Compter les candidatures pour chaque jour
        if (applications.length > 0) {
            const today = new Date();
            
            applications.forEach(app => {
                try {
                    const appDate = new Date(app.createdAt);
                    const diffTime = Math.abs(today - appDate);
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays < 7) {
                        appCounts[6 - diffDays]++;
                    }
                } catch (error) {
                    console.error("Erreur lors du traitement de la date:", error);
                }
            });
        } else {
            // Si pas de données, générer des valeurs aléatoires pour le test
            for (let i = 0; i < 7; i++) {
                appCounts[i] = Math.floor(Math.random() * 8);
            }
        }
        
        // Mettre à jour le graphique
        setApplicationTrend({
            labels: days,
            datasets: [
                {
                    label: 'Candidatures',
                    data: appCounts,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    tension: 0.4,
                    fill: true
                }
            ]
        });
        
        // Graphique de distribution des emplois (Actifs vs Inactifs)
        // Remplaçons par une distribution des candidatures par source de recrutement
        
        // Calculer les statistiques des candidats par département/domaine
        const departmentCounts = {
            'Informatique': 0,
            'Marketing': 0,
            'Finance': 0,
            'RH': 0,
            'Autre': 0
        };
        
        // Utiliser les données des candidats pour compter par département
        if (data.topCandidates && data.topCandidates.length > 0) {
            data.topCandidates.forEach(candidate => {
                const jobTitle = candidate.jobTitle ? candidate.jobTitle.toLowerCase() : '';
                
                if (jobTitle.includes('dev') || jobTitle.includes('web') || jobTitle.includes('tech') || jobTitle.includes('data')) {
                    departmentCounts['Informatique']++;
                } else if (jobTitle.includes('market') || jobTitle.includes('social') || jobTitle.includes('digital')) {
                    departmentCounts['Marketing']++;
                } else if (jobTitle.includes('finance') || jobTitle.includes('account') || jobTitle.includes('comptable')) {
                    departmentCounts['Finance']++;
                } else if (jobTitle.includes('hr') || jobTitle.includes('rh') || jobTitle.includes('recrut')) {
                    departmentCounts['RH']++;
                } else {
                    departmentCounts['Autre']++;
                }
            });
        } else {
            // Données simulées si nous n'avons pas de candidats
            const totalApplications = data.stats.totalApplications || 10;
            departmentCounts['Informatique'] = Math.round(totalApplications * 0.4);
            departmentCounts['Marketing'] = Math.round(totalApplications * 0.25);
            departmentCounts['Finance'] = Math.round(totalApplications * 0.15);
            departmentCounts['RH'] = Math.round(totalApplications * 0.1);
            departmentCounts['Autre'] = Math.round(totalApplications * 0.1);
        }
        
        console.log('Statistiques par département:', departmentCounts);
        
        setJobDistribution({
            labels: Object.keys(departmentCounts),
            datasets: [
                {
                    data: Object.values(departmentCounts),
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.8)',  // Bleu - Informatique
                        'rgba(255, 99, 132, 0.8)',  // Rouge - Marketing
                        'rgba(75, 192, 192, 0.8)',  // Vert - Finance
                        'rgba(153, 102, 255, 0.8)', // Violet - RH
                        'rgba(201, 203, 207, 0.8)'  // Gris - Autre
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(201, 203, 207, 1)'
                    ],
                    borderWidth: 1,
                }
            ]
        });
        
        // Applications par statut pour visualisation (simplifiée)
        // Utiliser les données directement depuis la réponse API plutôt que depuis l'état local
        const applicationsByStatus = data.stats.applicationsByStatus || { pending: 0, accepted: 0, rejected: 0 };
        console.log('Using application status data for chart:', applicationsByStatus);
        
        const statusData = {
            labels: ['En attente', 'Acceptés', 'Rejetés'],
            datasets: [
                {
                    label: 'Candidatures par statut',
                    data: [
                        applicationsByStatus.pending,
                        applicationsByStatus.accepted,
                        applicationsByStatus.rejected
                    ],
                    backgroundColor: [
                        'rgba(255, 159, 64, 0.8)',  // orange
                        'rgba(54, 162, 235, 0.8)',  // bleu
                        'rgba(255, 99, 132, 0.8)',  // rouge
                    ],
                    borderColor: [
                        'rgba(255, 159, 64, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 99, 132, 1)',
                    ],
                    borderWidth: 1
                }
            ]
        };
        
        setApplicationStatusChart(statusData);
        
        // Analyser l'activité de recrutement par jour de la semaine et heure
        const weekdayActivity = [0, 0, 0, 0, 0, 0, 0]; // [Dim, Lun, Mar, Mer, Jeu, Ven, Sam]
        const hourlyActivity = Array(24).fill(0); // 24 heures
        
        // Traiter les candidatures pour l'activité
        if (applications.length > 0) {
            applications.forEach(app => {
                try {
                    const appDate = new Date(app.createdAt);
                    const dayOfWeek = appDate.getDay(); // 0 = dimanche, 1 = lundi, etc.
                    const hourOfDay = appDate.getHours(); // 0-23
                    
                    weekdayActivity[dayOfWeek]++;
                    hourlyActivity[hourOfDay]++;
                } catch (error) {
                    console.error("Erreur lors du traitement de la date pour l'activité:", error);
                }
            });
        } else {
            // Si pas de données, utiliser des valeurs simulées
            const simulatedWeekdayActivity = [2, 8, 5, 6, 4, 3, 1]; // Plus d'activité le lundi
            const simulatedHourlyActivity = [
                0, 0, 0, 0, 0, 1, 2, 4, 7, 9, 8, 5,  // 0h-11h
                6, 8, 7, 6, 5, 4, 3, 2, 1, 1, 0, 0   // 12h-23h
            ];
            
            for (let i = 0; i < 7; i++) {
                weekdayActivity[i] = simulatedWeekdayActivity[i];
            }
            
            for (let i = 0; i < 24; i++) {
                hourlyActivity[i] = simulatedHourlyActivity[i];
            }
        }
        
        // Trouver le meilleur jour et heure pour poster
        let bestDay = 0;
        let bestHour = 9; // Par défaut, 9h du matin
        
        let maxDayCount = 0;
        for (let i = 0; i < 7; i++) {
            if (weekdayActivity[i] > maxDayCount) {
                maxDayCount = weekdayActivity[i];
                bestDay = i;
            }
        }
        
        let maxHourCount = 0;
        for (let i = 0; i < 24; i++) {
            if (hourlyActivity[i] > maxHourCount) {
                maxHourCount = hourlyActivity[i];
                bestHour = i;
            }
        }
        
        // Convertir l'indice du jour en nom du jour
        const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const bestDayName = dayNames[bestDay];
        
        // Formater l'heure (9 -> "09:00")
        const bestTimeFormatted = `${bestHour.toString().padStart(2, '0')}:00`;
        
        setRecruitmentActivity({
            weekdayActivity: weekdayActivity,
            hourlyActivity: hourlyActivity,
            bestTimeToPost: {
                day: bestDayName,
                time: bestTimeFormatted
            },
            averageResponseTime: 48 // Valeur fixe pour l'instant
        });
    };
    
    // Helper function to format date
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('fr-FR', options);
    };
    
    // Helper function to get status badge class
    const getStatusBadgeClass = (status) => {
        switch(status.toLowerCase()) {
            case 'accepted':
                return 'bg-soft-success text-success';
            case 'rejected':
                return 'bg-soft-danger text-danger';
            case 'pending':
            default:
                return 'bg-soft-warning text-warning';
        }
    };
    
    // Helper function to get star rating 
    const renderStarRating = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars.push(<i key={i} className="fi-rr-star text-warning"></i>);
            } else {
                stars.push(<i key={i} className="fi-rr-star text-muted"></i>);
            }
        }
        return stars;
    };
    
    // Métriques prédictives basées sur les tendances actuelles
    const getPredictiveMetrics = () => {
        const projectedHires = Math.ceil(stats.totalApplications * 0.15);  // Estimation de 15% d'embauches
        const timeToFillAll = recruitmentMetrics.timeToHire * 1.5;         // Estimation du temps pour remplir tous les postes
        
        return {
            projectedHires,
            timeToFillAll: Math.ceil(timeToFillAll),
            estimatedCompletionDate: new Date(Date.now() + (timeToFillAll * 24 * 60 * 60 * 1000)).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }),
            nextMilestone: Math.ceil(projectedHires * 0.5)                 // Prochain palier (50% des embauches prévues)
        };
    };
    
    return (
        <>
            <Layout breadcrumbTitle="HR Dashboard" breadcrumbActive="Dashboard">
                <div className="dashboard-header mb-30">
                    <div className="bg-primary-light rounded-top p-4">
                        <div className="container-fluid">
                            <div className="row align-items-center">
                                <div className="col-lg-6">
                                    <div className="d-flex align-items-center">
                                        <div className="dashboard-avatar bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', minWidth: '60px' }}>
                                            <i className="fi-rr-user text-white" style={{ fontSize: '24px' }}></i>
                                        </div>
                                        <div className="ms-3">
                                            <h4 className="text-dark mb-1">Welcome, {user?.firstName} {user?.lastName}!</h4>
                                            <p className="text-muted mb-0">Here's what's happening with your company today.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-6 mt-3 mt-lg-0">
                                    <div className="d-flex justify-content-lg-end align-items-center">
                                        <div className="d-flex align-items-center me-4">
                                            <div className="d-flex align-items-center justify-content-center bg-white rounded-circle shadow-sm" style={{ width: '40px', height: '40px' }}>
                                                <i className="fi-rr-calendar text-primary"></i>
                                            </div>
                                            <div className="ms-2">
                                                <span className="text-muted small">Today</span>
                                                <p className="mb-0 font-bold">{new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</p>
                                            </div>
                                        </div>
                                        <Link href="/post-job" className="btn btn-primary">
                                            <i className="fi-rr-plus-small me-2"></i>Post New Job
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Company Information Section - Only for HR users */}
                {user && user.role.toString().toUpperCase() === 'HR' && (
                    <div className="section-box mb-30">
                        <div className="container">
                            <div className="panel-white pt-30 pb-30 pl-30 pr-30">
                                <div className="d-flex justify-content-between align-items-center mb-30">
                                    <h5 className="mb-0">Company Dashboard</h5>
                                    {company && (
                                        <Link href="/settings" className="btn btn-outline-primary btn-sm">
                                            <i className="fi-rr-settings me-2"></i>Manage Company
                                        </Link>
                                    )}
                                </div>
                                
                                {loading && (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="mt-2">Loading company information...</p>
                                    </div>
                                )}
                                
                                {error && (
                                    <div className="alert alert-warning mb-20">
                                        <div className="d-flex">
                                            <div className="me-3">
                                                <i className="fi-rr-exclamation text-warning" style={{ fontSize: '2rem' }}></i>
                                            </div>
                                            <div>
                                                <h5 className="alert-heading">Company Profile Required</h5>
                                                <p>{error}</p>
                                                <div className="mt-15">
                                                    <Link href="/apply-company" className="btn btn-primary">
                                                        <i className="fi-rr-briefcase me-2"></i>Create Company Profile
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {company && (
                                    <>
                                        {/* Company Summary Card */}
                                        <div className="company-card mb-30">
                                            <div className="card border-0 shadow-sm">
                                                <div className="card-body p-4">
                                                    <div className="row align-items-center">
                                                        <div className="col-lg-2 col-md-3 text-center mb-3 mb-md-0">
                                                            <div className="company-logo-wrapper rounded-circle bg-light d-inline-flex align-items-center justify-content-center p-3 mb-2" style={{ width: '120px', height: '120px' }}>
                                                                <img 
                                                                    src={company.logo || "assets/imgs/page/dashboard/building.svg"} 
                                                                    alt={company.name}
                                                                    className="img-fluid"
                                                                    style={{ maxWidth: '80px', maxHeight: '80px', objectFit: 'contain' }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-lg-6 col-md-9">
                                                            <h3 className="mt-0 mb-2">{company.name}</h3>
                                                            <div className="d-flex align-items-center mb-3 flex-wrap">
                                                                <span className={`badge me-3 ${
                                                                    company.status === 'Approved' ? 'bg-success' : 
                                                                    company.status === 'Pending' ? 'bg-warning' : 'bg-danger'
                                                                }`}>
                                                                    {company.status}
                                                                </span>
                                                                {company.category && (
                                                                    <span className="badge bg-light text-dark me-3">
                                                                        <i className="fi-rr-briefcase me-1"></i> {company.category}
                                                                    </span>
                                                                )}
                                                                {company.foundedYear && (
                                                                    <span className="badge bg-light text-dark">
                                                                        <i className="fi-rr-calendar me-1"></i> Est. {company.foundedYear}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="company-details">
                                                                <p className="mb-2">
                                                                    <i className="fi-rr-marker me-2 text-primary"></i> 
                                                                    {company.location || 'No location specified'}
                                                                </p>
                                                                <p className="mb-2">
                                                                    <i className="fi-rr-envelope me-2 text-primary"></i> 
                                                                    {company.email}
                                                                </p>
                                                                {company.website && (
                                                                    <p className="mb-2">
                                                                        <i className="fi-rr-globe me-2 text-primary"></i> 
                                                                        <a href={company.website} target="_blank" rel="noopener noreferrer">{company.website}</a>
                                                                    </p>
                                                                )}
                                                                {company.phone && (
                                                                    <p className="mb-0">
                                                                        <i className="fi-rr-phone-call me-2 text-primary"></i> 
                                                                        {company.phone}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="col-lg-4 mt-4 mt-lg-0">
                                                            <div className="company-actions d-flex flex-column">
                                                                <Link href="/post-job" className="btn btn-primary mb-2">
                                                                    <i className="fi-rr-briefcase me-2"></i> Post New Job
                                                                </Link>
                                                                <Link href="/my-job-grid" className="btn btn-outline-primary mb-2">
                                                                    <i className="fi-rr-document-signed me-2"></i> Manage Jobs
                                                                </Link>
                                                                <Link href="/CampanyApplications" className="btn btn-outline-primary">
                                                                    <i className="fi-rr-users me-2"></i> View Applications
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Stats Cards */}
                                        <div className="row mb-30">
                                            <div className="col-xxl-3 col-xl-6 col-lg-6 col-md-4 col-sm-6">
                                                <div className="card hover-up p-4 shadow-sm h-100 border-0">
                                                    <div className="d-flex align-items-center">
                                                        <div className="card-image flex-shrink-0 d-flex align-items-center justify-content-center bg-primary-light rounded-circle" style={{width: '64px', height: '64px'}}>
                                                            <i className="fi-rr-briefcase text-primary" style={{fontSize: '24px'}}></i>
                                                        </div>
                                                        <div className="card-info ms-3">
                                                            <div className="card-title">
                                                                <h3 className="mb-0 fw-bold">{stats.totalJobs}
                                                                    {stats.totalJobs > 0 && (
                                                                        <span className={`font-sm status ${stats.activeJobs / stats.totalJobs > 0.5 ? 'up' : 'down'} ms-1`}>
                                                                            {Math.round((stats.activeJobs / stats.totalJobs) * 100)}<span>%</span>
                                                                        </span>
                                                                    )}
                                                                </h3>
                                                            </div>
                                                            <p className="font-sm color-text-paragraph-2 mb-0">Total des offres d'emploi</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-xxl-3 col-xl-6 col-lg-6 col-md-4 col-sm-6">
                                                <div className="card hover-up p-4 shadow-sm h-100 border-0">
                                                    <div className="d-flex align-items-center">
                                                        <div className="card-image flex-shrink-0 d-flex align-items-center justify-content-center bg-success-light rounded-circle" style={{width: '64px', height: '64px'}}>
                                                            <i className="fi-rr-check text-success" style={{fontSize: '24px'}}></i>
                                                        </div>
                                                        <div className="card-info ms-3">
                                                            <div className="card-title">
                                                                <h3 className="mb-0 fw-bold">{stats.activeJobs}
                                                                    {stats.totalJobs > 0 && (
                                                                        <span className={`font-sm status ${stats.activeJobs / stats.totalJobs > 0.3 ? 'up' : 'down'} ms-1`}>
                                                                            {Math.round((stats.activeJobs / stats.totalJobs) * 100)}<span>%</span>
                                                                        </span>
                                                                    )}
                                                                </h3>
                                                            </div>
                                                            <p className="font-sm color-text-paragraph-2 mb-0">Offres d'emploi actives</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-xxl-3 col-xl-6 col-lg-6 col-md-4 col-sm-6">
                                                <div className="card hover-up p-4 shadow-sm h-100 border-0">
                                                    <div className="d-flex align-items-center">
                                                        <div className="card-image flex-shrink-0 d-flex align-items-center justify-content-center bg-info-light rounded-circle" style={{width: '64px', height: '64px'}}>
                                                            <i className="fi-rr-file-add text-info" style={{fontSize: '24px'}}></i>
                                                        </div>
                                                        <div className="card-info ms-3">
                                                            <div className="card-title">
                                                                <h3 className="mb-0 fw-bold">{stats.totalApplications}
                                                                    <span className={`font-sm status ${stats.applicationGrowth >= 0 ? 'up' : 'down'} ms-1`}>
                                                                        {stats.applicationGrowth || 0}<span>%</span>
                                                                    </span>
                                                                </h3>
                                                            </div>
                                                            <p className="font-sm color-text-paragraph-2 mb-0">Total des candidatures</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-xxl-3 col-xl-6 col-lg-6 col-md-4 col-sm-6">
                                                <div className="card hover-up p-4 shadow-sm h-100 border-0">
                                                    <div className="d-flex align-items-center">
                                                        <div className="card-image flex-shrink-0 d-flex align-items-center justify-content-center bg-warning-light rounded-circle" style={{width: '64px', height: '64px'}}>
                                                            <i className="fi-rr-time-fast text-warning" style={{fontSize: '24px'}}></i>
                                                        </div>
                                                        <div className="card-info ms-3">
                                                            <div className="card-title">
                                                                <h3 className="mb-0 fw-bold">{stats.newApplications}
                                                                    {stats.totalApplications > 0 && (
                                                                        <span className={`font-sm status ${stats.newApplications / stats.totalApplications > 0.1 ? 'up' : 'down'} ms-1`}>
                                                                            {Math.round((stats.newApplications / stats.totalApplications) * 100)}<span>%</span>
                                                                        </span>
                                                                    )}
                                                                </h3>
                                                            </div>
                                                            <p className="font-sm color-text-paragraph-2 mb-0">Nouvelles candidatures (7j)</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Analytics Charts Section */}
                                        <div className="row mb-30">
                                            <div className="col-xl-8 col-lg-8">
                                                <div className="card shadow-sm hover-up h-100">
                                                    <div className="card-header bg-primary-light py-3 px-4 border-0 d-flex justify-content-between align-items-center">
                                                        <h5 className="mb-0 font-bold">Tendance des candidatures</h5>
                                                        <div className="badge bg-white text-primary px-3 py-2">
                                                            <i className="fi-rr-calendar me-1"></i>
                                                            Derniers 7 jours
                                                        </div>
                                                    </div>
                                                    <div className="card-body p-4">
                                                        <Line 
                                                            data={applicationTrend}
                                                            options={{
                                                                responsive: true,
                                                                plugins: {
                                                                    legend: {
                                                                        position: 'top',
                                                                    },
                                                                    title: {
                                                                        display: false
                                                                    },
                                                                    tooltip: {
                                                                        callbacks: {
                                                                            title: function(context) {
                                                                                return context[0].label;
                                                                            },
                                                                            label: function(context) {
                                                                                return `${context.raw} candidature${context.raw > 1 ? 's' : ''}`;
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                scales: {
                                                                    y: {
                                                                        beginAtZero: true,
                                                                        ticks: {
                                                                            precision: 0
                                                                        }
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-xl-4 col-lg-4">
                                                <div className="card shadow-sm hover-up h-100">
                                                    <div className="card-header bg-primary-light py-3 px-4 border-0">
                                                        <h5 className="mb-0 font-bold">Domaines d'expertise des candidats</h5>
                                                    </div>
                                                    <div className="card-body p-4 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "260px" }}>
                                                        <p className="text-muted small mb-3 text-center">Répartition des candidats par secteur professionnel</p>
                                                        <Doughnut 
                                                            data={jobDistribution}
                                                            options={{
                                                                responsive: true,
                                                                plugins: {
                                                                    legend: {
                                                                        position: 'bottom',
                                                                    },
                                                                    tooltip: {
                                                                        callbacks: {
                                                                            label: function(context) {
                                                                                const value = context.raw;
                                                                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                                                const percentage = Math.round((value / total) * 100);
                                                                                return `${context.label}: ${value} (${percentage}%)`;
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                cutout: '60%'
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Applications Summary Section - After Analytics Charts */}
                                        <div className="row mb-30">
                                            <div className="col-12">
                                                <div className="card shadow-sm hover-up">
                                                    <div className="card-header bg-primary-light py-3 px-4 border-0">
                                                        <h5 className="mb-0 font-bold">Synthèse des candidatures</h5>
                                                    </div>
                                                    <div className="card-body p-4">
                                                        <div className="row">
                                                            <div className="col-lg-8">
                                                                <div className="table-responsive">
                                                                    <table className="table table-bordered table-hover">
                                                                        <thead className="bg-light">
                                                                            <tr>
                                                                                <th className="py-2">Statut</th>
                                                                                <th className="py-2 text-center">Nombre</th>
                                                                                <th className="py-2 text-center">Pourcentage</th>
                                                                                <th className="py-2">Progression</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            <tr>
                                                                                <td>
                                                                                    <span className="badge bg-soft-warning text-warning me-2">●</span>
                                                                                    En attente
                                                                                </td>
                                                                                <td className="text-center">{stats.applicationsByStatus.pending}</td>
                                                                                <td className="text-center">
                                                                                    {stats.totalApplications > 0 ? 
                                                                                        Math.round((stats.applicationsByStatus.pending / stats.totalApplications) * 100) : 0}%
                                                                                </td>
                                                                                <td>
                                                                                    <div className="progress" style={{ height: "8px" }}>
                                                                                        <div 
                                                                                            className="progress-bar bg-warning" 
                                                                                            role="progressbar" 
                                                                                            style={{ 
                                                                                                width: `${stats.totalApplications > 0 ? 
                                                                                                    Math.round((stats.applicationsByStatus.pending / stats.totalApplications) * 100) : 0}%` 
                                                                                            }}
                                                                                            aria-valuenow={stats.applicationsByStatus.pending} 
                                                                                            aria-valuemin="0" 
                                                                                            aria-valuemax={stats.totalApplications}
                                                                                        ></div>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                            <tr>
                                                                                <td>
                                                                                    <span className="badge bg-soft-success text-success me-2">●</span>
                                                                                    Acceptés
                                                                                </td>
                                                                                <td className="text-center">{stats.applicationsByStatus.accepted}</td>
                                                                                <td className="text-center">
                                                                                    {stats.totalApplications > 0 ? 
                                                                                        Math.round((stats.applicationsByStatus.accepted / stats.totalApplications) * 100) : 0}%
                                                                                </td>
                                                                                <td>
                                                                                    <div className="progress" style={{ height: "8px" }}>
                                                                                        <div 
                                                                                            className="progress-bar bg-success" 
                                                                                            role="progressbar" 
                                                                                            style={{ 
                                                                                                width: `${stats.totalApplications > 0 ? 
                                                                                                    Math.round((stats.applicationsByStatus.accepted / stats.totalApplications) * 100) : 0}%` 
                                                                                            }}
                                                                                            aria-valuenow={stats.applicationsByStatus.accepted} 
                                                                                            aria-valuemin="0" 
                                                                                            aria-valuemax={stats.totalApplications}
                                                                                        ></div>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                            <tr>
                                                                                <td>
                                                                                    <span className="badge bg-soft-danger text-danger me-2">●</span>
                                                                                    Rejetés
                                                                                </td>
                                                                                <td className="text-center">{stats.applicationsByStatus.rejected}</td>
                                                                                <td className="text-center">
                                                                                    {stats.totalApplications > 0 ? 
                                                                                        Math.round((stats.applicationsByStatus.rejected / stats.totalApplications) * 100) : 0}%
                                                                                </td>
                                                                                <td>
                                                                                    <div className="progress" style={{ height: "8px" }}>
                                                                                        <div 
                                                                                            className="progress-bar bg-danger" 
                                                                                            role="progressbar" 
                                                                                            style={{ 
                                                                                                width: `${stats.totalApplications > 0 ? 
                                                                                                    Math.round((stats.applicationsByStatus.rejected / stats.totalApplications) * 100) : 0}%` 
                                                                                            }}
                                                                                            aria-valuenow={stats.applicationsByStatus.rejected} 
                                                                                            aria-valuemin="0" 
                                                                                            aria-valuemax={stats.totalApplications}
                                                                                        ></div>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                        <tfoot className="bg-light">
                                                                            <tr>
                                                                                <td className="fw-bold">Total</td>
                                                                                <td className="text-center fw-bold">{stats.totalApplications}</td>
                                                                                <td className="text-center fw-bold">100%</td>
                                                                                <td>
                                                                                    <div className="progress" style={{ height: "8px" }}>
                                                                                        <div 
                                                                                            className="progress-bar bg-primary" 
                                                                                            role="progressbar" 
                                                                                            style={{ width: "100%" }}
                                                                                            aria-valuenow={stats.totalApplications} 
                                                                                            aria-valuemin="0" 
                                                                                            aria-valuemax={stats.totalApplications}
                                                                                        ></div>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        </tfoot>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                            <div className="col-lg-4">
                                                                <div className="chart-container" style={{ position: 'relative', height: '260px' }}>
                                                                    <Bar 
                                                                        data={applicationStatusChart}
                                                                        options={{
                                                                            indexAxis: 'y',
                                                                            responsive: true,
                                                                            maintainAspectRatio: false,
                                                                            plugins: {
                                                                                legend: {
                                                                                    display: false
                                                                                },
                                                                                tooltip: {
                                                                                    callbacks: {
                                                                                        label: function(context) {
                                                                                            let label = context.dataset.label || '';
                                                                                            if (label) {
                                                                                                label += ': ';
                                                                                            }
                                                                                            if (context.parsed.x !== null) {
                                                                                                label += context.parsed.x;
                                                                                            }
                                                                                            return label;
                                                                                        }
                                                                                    }
                                                                                }
                                                                            },
                                                                            scales: {
                                                                                x: {
                                                                                    beginAtZero: true,
                                                                                    ticks: {
                                                                                        precision: 0
                                                                                    }
                                                                                }
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Geographic Distribution Section */}
                                        <div className="row mb-30">
                                            <div className="col-12">
                                                <div className="card shadow-sm hover-up">
                                                    <div className="card-header bg-primary-light py-3 px-4 border-0 d-flex justify-content-between align-items-center">
                                                        <h5 className="mb-0 font-bold">Activité de recrutement</h5>
                                                    </div>
                                                    <div className="card-body p-4">
                                                        <div className="row">
                                                            {/* Map/Chart View */}
                                                            <div className="col-lg-7 mb-4 mb-lg-0">
                                                                <div className="p-3 bg-light rounded">
                                                                    <h6 className="mb-3">Activité par jour de la semaine</h6>
                                                                    <div style={{ height: '300px' }}>
                                                                        <Bar 
                                                                            data={{
                                                                                labels: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
                                                                                datasets: [{
                                                                                    label: 'Nombre de candidatures',
                                                                                    data: recruitmentActivity.weekdayActivity,
                                                                                    backgroundColor: [
                                                                                        'rgba(54, 162, 235, 0.7)', // Bleu - Lundi
                                                                                        'rgba(75, 192, 192, 0.7)', // Vert - Mardi
                                                                                        'rgba(153, 102, 255, 0.7)', // Violet - Mercredi
                                                                                        'rgba(201, 203, 207, 0.7)'  // Gris - Jeudi
                                                                                    ],
                                                                                    borderColor: [
                                                                                        'rgba(54, 162, 235, 1)',
                                                                                        'rgba(75, 192, 192, 1)',
                                                                                        'rgba(153, 102, 255, 1)',
                                                                                        'rgba(201, 203, 207, 1)'
                                                                                    ],
                                                                                    borderWidth: 1
                                                                                }]
                                                                            }}
                                                                            options={{
                                                                                responsive: true,
                                                                                maintainAspectRatio: false,
                                                                                scales: {
                                                                                    y: {
                                                                                        beginAtZero: true,
                                                                                        ticks: {
                                                                                            precision: 0
                                                                                        }
                                                                                    }
                                                                                },
                                                                                plugins: {
                                                                                    legend: {
                                                                                        display: false
                                                                                    },
                                                                                    tooltip: {
                                                                                        callbacks: {
                                                                                            label: function(context) {
                                                                                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                                                                const percentage = Math.round((context.parsed.y / total) * 100);
                                                                                                return `${context.parsed.y} candidatures (${percentage}%)`;
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Top Cities List */}
                                                            <div className="col-lg-5">
                                                                <div className="p-3 bg-light rounded h-100">
                                                                    <h6 className="mb-3">Meilleur temps pour poster une offre</h6>
                                                                    <div className="table-responsive">
                                                                        <table className="table table-borderless mb-0">
                                                                            <thead className="bg-white rounded">
                                                                                <tr>
                                                                                    <th>Jour</th>
                                                                                    <th className="text-center">Heures</th>
                                                                                    <th className="text-end">%</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {Object.entries({
                                                                                    "8h-10h": recruitmentActivity.hourlyActivity[8] + recruitmentActivity.hourlyActivity[9],
                                                                                    "10h-12h": recruitmentActivity.hourlyActivity[10] + recruitmentActivity.hourlyActivity[11],
                                                                                    "12h-14h": recruitmentActivity.hourlyActivity[12] + recruitmentActivity.hourlyActivity[13],
                                                                                    "14h-16h": recruitmentActivity.hourlyActivity[14] + recruitmentActivity.hourlyActivity[15],
                                                                                    "16h-18h": recruitmentActivity.hourlyActivity[16] + recruitmentActivity.hourlyActivity[17]
                                                                                }).map(([hourRange, count]) => {
                                                                                    const total = recruitmentActivity.hourlyActivity.reduce((a, b) => a + b, 0) || 1; // Éviter division par zéro
                                                                                    const percentage = Math.round((count / total) * 100);
                                                                                    
                                                                                    return (
                                                                                        <tr key={hourRange}>
                                                                                            <td className="fw-medium">{hourRange}</td>
                                                                                            <td className="text-center">{count}</td>
                                                                                            <td className="text-end">
                                                                                                <div className="d-flex align-items-center justify-content-end">
                                                                                                    <div className="progress flex-grow-1 me-2" style={{ height: '6px', maxWidth: '80px' }}>
                                                                                                        <div 
                                                                                                            className="progress-bar bg-primary" 
                                                                                                            style={{ width: `${percentage}%` }}
                                                                                                            role="progressbar" 
                                                                                                        ></div>
                                                                                                    </div>
                                                                                                    <span>{percentage}%</span>
                                                                                                </div>
                                                                                            </td>
                                                                                        </tr>
                                                                                    );
                                                                                })}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                    
                                                                    <div className="mt-4 pt-3 border-top">
                                                                        <h6 className="text-muted mb-2 small">Perspectives</h6>
                                                                        <p className="small mb-0">Les candidatures sont principalement concentrées entre {recruitmentActivity.bestTimeToPost.day} à {recruitmentActivity.bestTimeToPost.time}.</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Top Candidates Section */}
                                        <div className="row mb-30">
                                            <div className="col-12">
                                                <div className="card shadow-sm hover-up">
                                                    <div className="card-header bg-primary-light py-3 px-4 border-0 d-flex justify-content-between align-items-center">
                                                        <h5 className="mb-0 font-bold">Top Candidates</h5>
                                                        <Link href="/recruiters" className="btn btn-sm btn-outline-primary rounded-pill">
                                                            View All <i className="fi-rr-arrow-small-right ms-1"></i>
                                                        </Link>
                                                    </div>
                                                    <div className="card-body p-4">
                                                        {candidatesLoading ? (
                                                            <div className="text-center py-5">
                                                                <div className="spinner-border text-primary" role="status">
                                                                    <span className="visually-hidden">Loading...</span>
                                                                </div>
                                                                <p className="mt-2">Loading top candidates...</p>
                                                            </div>
                                                        ) : topCandidates.length === 0 ? (
                                                            <div className="text-center py-5">
                                                                <i className="fi-rr-user-add" style={{ fontSize: '3rem', color: '#d9d9d9' }}></i>
                                                                <p className="mt-2">No candidates have applied yet.</p>
                                                                <div className="mt-3">
                                                                    <Link href="/post-job" className="btn btn-sm btn-primary">
                                                                        <i className="fi-rr-plus me-1"></i> Post a New Job
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="row g-4">
                                                                {topCandidates.map((candidate, index) => (
                                                                    <div className="col-xl-4 col-md-6" key={candidate._id || index}>
                                                                        <div className="card-style-3 hover-up h-100 shadow-sm border rounded">
                                                                            <div className="card-body p-4">
                                                                                <div className="d-flex">
                                                                                    <div className={`card-image ${candidate.isOnline ? 'online' : ''}`}>
                                                                                        <img src={candidate.avatar} alt={`${candidate.firstName} ${candidate.lastName}`} className="rounded-circle" width="64" />
                                                                                    </div>
                                                                                    <div className="card-title ms-3">
                                                                                        <h6 className="mb-1">{candidate.firstName} {candidate.lastName}</h6>
                                                                                        <span className="job-position d-block text-muted small mb-2">{candidate.jobTitle}</span>
                                                                                        <div className="card-location mb-2"> 
                                                                                            <i className="fi-rr-marker me-1 text-muted"></i>
                                                                                            <span className="location font-sm">{candidate.location}</span>
                                                                                        </div>
                                                                                        <div className="card-rating">
                                                                                            {renderStarRating(candidate.rating)}
                                                                                            <span className="font-xs color-text-mutted ms-1">({candidate.reviewCount})</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="mt-3 d-flex">
                                                                                    <Link href={`/user-portfolio?id=${candidate._id}`} className="btn btn-sm btn-outline-primary rounded-pill w-50 me-2">
                                                                                        <i className="fi-rr-eye me-1"></i>View
                                                                                    </Link>
                                                                                    <Link href="#" className="btn btn-sm btn-primary rounded-pill w-50">
                                                                                        <i className="fi-rr-paper-plane me-1"></i>Contact
                                                                                    </Link>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Recent Applications Section */}
                                        <div className="row mb-30">
                                            <div className="col-12">
                                                <div className="card shadow-sm hover-up">
                                                    <div className="card-header bg-primary-light py-3 px-4 border-0 d-flex justify-content-between align-items-center">
                                                        <h5 className="mb-0 font-bold">Recent Applications</h5>
                                                        <Link href="/CampanyApplications" className="btn btn-sm btn-outline-primary rounded-pill">
                                                            View All <i className="fi-rr-arrow-small-right ms-1"></i>
                                                        </Link>
                                                    </div>
                                                    <div className="card-body p-0">
                                                        {applicationsLoading ? (
                                                            <div className="text-center py-5">
                                                                <div className="spinner-border text-primary" role="status">
                                                                    <span className="visually-hidden">Loading...</span>
                                                                </div>
                                                                <p className="mt-2">Loading recent applications...</p>
                                                            </div>
                                                        ) : recentApplications.length === 0 ? (
                                                            <div className="text-center py-5">
                                                                <i className="fi-rr-file-add" style={{ fontSize: '3rem', color: '#d9d9d9' }}></i>
                                                                <p className="mt-2">No applications received yet.</p>
                                                                <div className="mt-3">
                                                                    <p className="text-muted small mb-2">Share your job listings to attract more candidates:</p>
                                                                    <div className="d-flex justify-content-center gap-2">
                                                                        <button className="btn btn-sm btn-outline-primary" title="Share on LinkedIn">
                                                                            <i className="fi-rr-social-network"></i>
                                                                        </button>
                                                                        <button className="btn btn-sm btn-outline-primary" title="Share via Email">
                                                                            <i className="fi-rr-envelope"></i>
                                                                        </button>
                                                                        <button className="btn btn-sm btn-outline-primary" title="Copy Link">
                                                                            <i className="fi-rr-link"></i>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="table-responsive">
                                                                <table className="table table-hover mb-0">
                                                                    <thead className="bg-light">
                                                                        <tr>
                                                                            <th className="py-3 px-4" style={{ minWidth: '250px' }}>Candidate</th>
                                                                            <th className="py-3 px-4" style={{ minWidth: '180px' }}>Applied For</th>
                                                                            <th className="py-3 px-4">Date</th>
                                                                            <th className="py-3 px-4">Status</th>
                                                                            <th className="py-3 px-4 text-end">Action</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {recentApplications.map((application, index) => (
                                                                            <tr key={application._id || index}>
                                                                                <td className="py-3 px-4">
                                                                                    <div className="d-flex align-items-center">
                                                                                        <img src={application.user.avatar} alt={`${application.user.firstName} ${application.user.lastName}`} className="rounded-circle" width="40" />
                                                                                        <div className="ms-3">
                                                                                            <h6 className="mb-0 font-md">{application.user.firstName} {application.user.lastName}</h6>
                                                                                            <span className="text-muted font-sm">{application.user.jobTitle}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-3 px-4">
                                                                                    <span className="font-md">{application.job.title}</span>
                                                                                </td>
                                                                                <td className="py-3 px-4">
                                                                                    <span className="font-sm">{formatDate(application.createdAt)}</span>
                                                                                </td>
                                                                                <td className="py-3 px-4">
                                                                                    <span className={`badge ${getStatusBadgeClass(application.status)}`}>
                                                                                        {application.status}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="py-3 px-4 text-end">
                                                                                    <div className="dropdown">
                                                                                        <button className="btn btn-outline-primary btn-sm dropdown-toggle" type="button" id={`dropdownAction${index}`} data-bs-toggle="dropdown" aria-expanded="false">
                                                                                            <i className="fi-rr-menu-dots-vertical"></i>
                                                                                        </button>
                                                                                        <ul className="dropdown-menu dropdown-menu-end" aria-labelledby={`dropdownAction${index}`}>
                                                                                            <li><Link className="dropdown-item" href={`/CampanyApplications?id=${application._id}`}>View Details</Link></li>
                                                                                            {application.status !== 'Shortlisted' && (
                                                                                                <li><Link className="dropdown-item" href="#">Shortlist</Link></li>
                                                                                            )}
                                                                                            {application.status !== 'Rejected' && (
                                                                                                <li><Link className="dropdown-item" href="#">Reject</Link></li>
                                                                                            )}
                                                                                        </ul>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Company About Section */}
                                        {company.description && (
                                            <div className="row mb-30">
                                                <div className="col-12">
                                                    <div className="card shadow-sm">
                                                        <div className="card-header bg-light">
                                                            <h6 className="mb-0">About {company.name}</h6>
                                                        </div>
                                                        <div className="card-body">
                                                            <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>{company.description}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                
             
                <div className="mt-10">
                    <div className="section-box">
                        <div className="container">
                            <div className="panel-white pt-30 pb-30 pl-15 pr-15">
                                <div className="box-swiper">
                                    <div className="swiper-container swiper-group-10">
                                        <BrandSlider />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        </>
    )
}

// Export with auth HOC
// Allow both HR and Candidate roles to access the dashboard
export default withAuth(HrDashboard, ['HR', 'candidate'])