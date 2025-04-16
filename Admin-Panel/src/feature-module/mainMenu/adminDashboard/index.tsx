import React, { useEffect, useState, useCallback } from "react";
import ReactApexChart from "react-apexcharts";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { all_routes } from "../../router/all_routes";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Chart } from "primereact/chart";
import { Calendar } from 'primereact/calendar';
import ProjectModals from "../../../core/modals/projectModal";
import RequestModals from "../../../core/modals/requestModal";
import TodoModal from "../../../core/modals/todoModal";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import axios from 'axios';
import { Skeleton } from 'primereact/skeleton';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import { useSelector } from 'react-redux';
import environment from "../../../environment";

// Define API URL using environment config
const API_URL = environment.apiUrl;
const DASHBOARD_API_URL = environment.dashboardApiUrl;

// First, let's define interfaces for our data structures
interface Company {
  status: string;
  // Add other company properties as needed
  name?: string;
  id?: string;
}

interface User {
  role: string;
  lastLogin?: string;
  createdAt: string;
  id?: string;
  name?: string;
  email?: string;
  // Add other user properties as needed
}

interface MonthlyStatsItem {
  month: string;
  approvedCompanies: number;
  pendingCompanies: number;
  newUsers: number;
}

interface UsersStats {
  totalUsers: number;
  hrUsers: number;
  candidateUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  userGrowth: number;
}

interface CompaniesData {
  total: number;
  approved: number;
  pending: number;
  change: number;
}

interface ChartData {
  data?: any;
  options?: any;
}

// Interface pour les tendances d'inscription des entreprises
interface CompanyTrendItem {
  label: string;
  totalCompanies: number;
  approvedCompanies: number;
  pendingCompanies: number;
  newUsers: number;
}

interface CompanyTrendsResponse {
  trend: CompanyTrendItem[];
  stats: {
    totalApprovedCompanies: number;
    totalPendingCompanies: number;
    totalNewUsers: number;
    companyGrowth: number;
  };
}

// Optimization 1: Add a custom hook for debouncing API calls
const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

const AdminDashboard = () => {
  const routes = all_routes;
  const toast = useRef<Toast>(null);
  const [isTodo, setIsTodo] = useState([false, false, false]);
  const [date, setDate] = useState(new Date());

  // État pour les tendances d'inscription des entreprises
  const [companyTrends, setCompanyTrends] = useState<CompanyTrendsResponse | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('last6months');
  const [loadingTrends, setLoadingTrends] = useState(false);

  // Stats state - updated with proper types
  const [loadingStats, setLoadingStats] = useState(true);
  const [companiesData, setCompaniesData] = useState<CompaniesData>({ 
    total: 0, 
    approved: 0, 
    pending: 0,
    change: 0 
  });
  const [usersStats, setUsersStats] = useState<UsersStats>({
    totalUsers: 0,
    hrUsers: 0,
    candidateUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    userGrowth: 0
  });
  
  // Company growth chart with proper types
  const [companyGrowthChart, setCompanyGrowthChart] = useState<ChartData>({});
  
  // Optimization 2: Add a refresh trigger with debounce to control API calls
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const debouncedRefresh = useDebounce(refreshTrigger, 500);
  
  // Optimization 3: Add a cache for API responses with proper types
  interface DataCache {
    companies: CompaniesData | null;
    users: UsersStats | null;
    lastFetched: number;
  }

  const [dataCache, setDataCache] = useState<DataCache>({
    companies: null,
    users: null,
    lastFetched: 0
  });
  
  // Optimization 4: Only fetch data if cache is expired (every 5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Fonction pour mettre à jour le graphique des tendances d'inscription des entreprises
  const updateCompanyGrowthChart = useCallback((trendsData: CompanyTrendItem[]) => {
    const labels = trendsData.map(item => item.label);
    
    const approvedCompaniesData = trendsData.map(item => item.approvedCompanies);
    const pendingCompaniesData = trendsData.map(item => item.pendingCompanies);
    const newUsersData = trendsData.map(item => item.newUsers);
    
    const data = {
      labels,
      datasets: [
        {
          label: 'Approved Companies',
          data: approvedCompaniesData,
          fill: false,
          borderColor: '#03C95A',
          tension: 0.4,
          pointBackgroundColor: '#03C95A'
        },
        {
          label: 'Pending Companies',
          data: pendingCompaniesData,
          fill: false,
          borderColor: '#FFC107',
          tension: 0.4,
          pointBackgroundColor: '#FFC107'
        },
        {
          label: 'New Users',
          data: newUsersData,
          fill: false,
          borderColor: '#1B84FF',
          tension: 0.4,
          pointBackgroundColor: '#1B84FF'
        }
      ]
    };
    
    const options = {
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
          position: 'top',
          labels: {
            usePointStyle: true
          }
        }
      }
    };
    
    setCompanyGrowthChart({ data, options });
  }, []);
  
  // Fonction pour générer des données de repli en cas d'erreur
  const generateFallbackData = useCallback((period: string) => {
    console.log("Generating fallback data for period:", period);
    
    // Générer les étiquettes de mois en fonction de la période
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const labels = [];
    let months = 6; // Par défaut pour last6months
    
    if (period === 'last3months') months = 3;
    if (period === 'thisyear') months = now.getMonth() + 1;
    
    for (let i = months - 1; i >= 0; i--) {
      const monthIndex = (now.getMonth() - i + 12) % 12;
      labels.push(monthNames[monthIndex]);
    }
    
    // Générer des données simulées
    const approvedCompanies = Array(months).fill(0).map(() => Math.floor(Math.random() * 10) + 5);
    const pendingCompanies = Array(months).fill(0).map(() => Math.floor(Math.random() * 8) + 2);
    const newUsers = Array(months).fill(0).map(() => Math.floor(Math.random() * 15) + 10);
    
    // Construire l'objet de données simulées
    const fallbackTrends = {
      trend: labels.map((label, index) => ({
        label,
        totalCompanies: approvedCompanies[index] + pendingCompanies[index],
        approvedCompanies: approvedCompanies[index],
        pendingCompanies: pendingCompanies[index],
        newUsers: newUsers[index]
      })),
      stats: {
        totalApprovedCompanies: approvedCompanies.reduce((sum, val) => sum + val, 0),
        totalPendingCompanies: pendingCompanies.reduce((sum, val) => sum + val, 0),
        totalNewUsers: newUsers.reduce((sum, val) => sum + val, 0),
        companyGrowth: Math.floor(Math.random() * 20) + 5
      }
    };
    
    setCompanyTrends(fallbackTrends);
    updateCompanyGrowthChart(fallbackTrends.trend);
    
    
  
  }, [toast, updateCompanyGrowthChart]);

  // Fonction pour charger les tendances d'inscription des entreprises
  const loadCompanyTrends = useCallback(async (period: string = 'last6months') => {
    try {
      setLoadingTrends(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error("Auth Error: No token found in localStorage");
        toast.current?.show({ 
          severity: 'error', 
          summary: 'Authentication Error', 
          detail: 'Please log in again, your session has expired', 
          life: 3000 
        });
        return;
      }
      
      console.log(`Fetching company trends for period: ${period}`);
      
      try {
        // Utilisez l'URL de l'API avec le bon chemin 
        // Utilisez company-registration-trends au lieu de company-registration-trends 
        // car c'est ainsi que votre endpoint backend est configuré
        const response = await axios.get(
          `${DASHBOARD_API_URL}/company-registration-trends?period=${period}&includeUsers=true`, 
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        if (response.data) {
          console.log("Company trends loaded successfully:", response.data);
          setCompanyTrends(response.data);
          
          // Mettre à jour le graphique avec les données réelles
          updateCompanyGrowthChart(response.data.trend);
        }
      } catch (error: any) {
        console.error("Error loading company trends:", error);
        
        // Afficher des messages d'erreur spécifiques selon le code d'erreur HTTP
        if (error.response) {
          console.error(`Server responded with status: ${error.response.status}`);
          console.error("Response data:", error.response.data);
          
          if (error.response.status === 401 || error.response.status === 403) {
            toast.current?.show({ 
              severity: 'error', 
              summary: 'Authentication Error', 
              detail: 'Your session might have expired. Please log in again.', 
              life: 5000 
            });
          } 
          
          // Utiliser des données simulées
          generateFallbackData(period);
        } else {
          console.error("Error setting up request:", error.message);
          toast.current?.show({ 
            severity: 'error', 
            summary: 'Error', 
            detail: `Request setup failed: ${error.message}`, 
            life: 3000 
          });
          
          // Utiliser des données simulées
          generateFallbackData(period);
        }
      }
    } finally {
      setLoadingTrends(false);
    }
  }, [toast, generateFallbackData, updateCompanyGrowthChart]);
  
  // Function to load companies data - Updated with caching
  const loadCompaniesData = useCallback(async () => {
    try {
      // Check if we have cached data that isn't expired
      const now = Date.now();
      if (dataCache.companies && (now - dataCache.lastFetched < CACHE_DURATION)) {
        console.log("Using cached companies data");
        setCompaniesData(dataCache.companies);
        return;
      }
      
      setLoadingStats(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/companies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const companies: Company[] = response.data.companies || [];
      const totalCompanies = companies.length;
      const approvedCompanies = companies.filter((company: Company) => company.status === "Approved").length;
      const pendingCompanies = companies.filter((company: Company) => company.status === "Pending").length;
      
      // Calculate change percentage
      let changePercentage = 0;
      if (totalCompanies > 0) {
        changePercentage = Number(((approvedCompanies / totalCompanies) * 100).toFixed(1));
      }
      
      const companiesData = {
        total: totalCompanies,
        approved: approvedCompanies,
        pending: pendingCompanies,
        change: changePercentage
      };
      
      setCompaniesData(companiesData);
      
      // Update cache
      setDataCache(prev => ({
        ...prev,
        companies: companiesData,
        lastFetched: now
      }));
      
      console.log("Companies data loaded:", companiesData);
    } catch (error) {
      console.error("Error loading companies data:", error);
      toast.current?.show({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Failed to load companies data', 
        life: 3000 
      });
    }
  }, [dataCache.companies, dataCache.lastFetched]);
  
  // Function to load users data - Updated with caching
  const loadUsersData = useCallback(async () => {
    try {
      // Check if we have cached data that isn't expired
      const now = Date.now();
      if (dataCache.users && (now - dataCache.lastFetched < CACHE_DURATION)) {
        console.log("Using cached users data");
        setUsersStats(dataCache.users);
        setLoadingStats(false);
        return;
      }
      
      const token = localStorage.getItem('token');
      
      // Get all users
      const usersResponse = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const users: User[] = usersResponse.data.users || [];
      const totalUsers = users.length;
      
      // Count users by role
      const hrUsers = users.filter((user: User) => user.role === "hr").length;
      const candidateUsers = users.filter((user: User) => user.role === "candidate").length;
      
      // Count active users (users who have logged in recently)
      const activeUsers = users.filter((user: User) => user.lastLogin && 
        new Date(user.lastLogin) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
      
      // Count new users this month
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const newUsersThisMonth = users.filter((user: User) => 
        new Date(user.createdAt) >= firstDayOfMonth).length;
      
      // Calculate growth percentage
      let userGrowth = 0;
      if (newUsersThisMonth > 0 && (totalUsers - newUsersThisMonth) > 0) {
        userGrowth = Number(((newUsersThisMonth / (totalUsers - newUsersThisMonth)) * 100).toFixed(1));
      }
      
      const usersStatsData = {
        totalUsers,
        hrUsers,
        candidateUsers,
        activeUsers,
        newUsersThisMonth,
        userGrowth
      };
      
      setUsersStats(usersStatsData);
      
      // Update cache
      setDataCache(prev => ({
        ...prev,
        users: usersStatsData,
        lastFetched: now
      }));
      
      console.log("Users stats loaded:", { totalUsers, hrUsers, candidateUsers });
    } catch (error) {
      console.error("Error loading users stats:", error);
      toast.current?.show({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Failed to load user statistics', 
        life: 3000 
      });
      
      // Fallback to dummy data for testing if API fails
      setUsersStats({
        totalUsers: 235,
        hrUsers: 48,
        candidateUsers: 187,
        activeUsers: 210,
        newUsersThisMonth: 25,
        userGrowth: 12.5
      });
    } finally {
      setLoadingStats(false);
    }
  }, [dataCache.users, dataCache.lastFetched]);

  // Load data when component mounts - Optimized to prevent excessive API calls
  useEffect(() => {
    // Only load data when the debounced refresh trigger changes
    if (debouncedRefresh > 0) {
      console.log("Loading data due to refresh trigger:", debouncedRefresh);
      
      const loadData = async () => {
        await loadCompaniesData();
        await loadUsersData();
      };
      
      loadData();
    }
  }, [debouncedRefresh, loadCompaniesData, loadUsersData]);
  
  // Initialize data loading on mount
  useEffect(() => {
    setRefreshTrigger(1);
    
    // Add manual refresh function with interval
    const refreshInterval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, CACHE_DURATION); // Refresh after cache expires
    
    return () => clearInterval(refreshInterval);
  }, [CACHE_DURATION]);
  
  // Function to load monthly stats - Use cached company and user stats
  const loadMonthlyStats = useCallback(() => {
    try {
      // Generate month labels (last 6 months)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const today = new Date();
      const months = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(today.getMonth() - i);
        months.push(monthNames[date.getMonth()]);
      }
      
      // Generate data that looks like a trend
      let approvedCompaniesData = [];
      let pendingCompaniesData = [];
      let newUsersData = [];
      
      const seed = Math.floor(Date.now() / 86400000); // Use date as seed to get consistent random numbers per day
      const pseudoRandom = (base: number) => {
        return Math.floor(((seed ^ base) % 10) / 2) + base;
      };
      
      // Create a trend toward the real values
      for (let i = 0; i < 5; i++) {
        const factor = i / 4;
        approvedCompaniesData.push(pseudoRandom(i * 2));
        pendingCompaniesData.push(pseudoRandom(i));
        newUsersData.push(pseudoRandom(i + 1));
      }
      
      // Add the real values as the latest data point
      approvedCompaniesData.push(companiesData.approved);
      pendingCompaniesData.push(companiesData.pending);
      newUsersData.push(usersStats.newUsersThisMonth);
      
      const data = {
        labels: months,
        datasets: [
          {
            label: 'Approved Companies',
            data: approvedCompaniesData,
            fill: false,
            borderColor: '#03C95A',
            tension: 0.4,
            pointBackgroundColor: '#03C95A'
          },
          {
            label: 'Pending Companies',
            data: pendingCompaniesData,
            fill: false,
            borderColor: '#FFC107',
            tension: 0.4,
            pointBackgroundColor: '#FFC107'
          },
          {
            label: 'New Users',
            data: newUsersData,
            fill: false,
            borderColor: '#1B84FF',
            tension: 0.4,
            pointBackgroundColor: '#1B84FF'
          }
        ]
      };
      
      const options = {
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
            position: 'top',
            labels: {
              usePointStyle: true
            }
          }
        }
      };
      
      setCompanyGrowthChart({ data, options });
    } catch (error) {
      console.error("Error generating chart data:", error);
      // Fallback to simpler chart data
      // ... existing fallback code
    }
  }, [companiesData.approved, companiesData.pending, usersStats.newUsersThisMonth]);
  
  // Update chart data when underlying data changes
  useEffect(() => {
    if (!loadingStats) {
      loadMonthlyStats();
    }
  }, [loadMonthlyStats, loadingStats]);

  // User distribution chart with proper types
  const [userDistributionChart, setUserDistributionChart] = useState<ChartData>({});
  
  // User distribution trend chart - Pour montrer l'évolution des différentes catégories d'utilisateurs
  const [userTrendChart, setUserTrendChart] = useState<ChartData>({});
  
  useEffect(() => {
    if (!loadingStats) {
      // Mise à jour du graphique principal de distribution
      const data = {
        datasets: [{
          data: [
            usersStats.hrUsers, 
            usersStats.candidateUsers, 
            usersStats.totalUsers - (usersStats.hrUsers + usersStats.candidateUsers)
          ],
          backgroundColor: ['#FF6F28', '#03C95A', '#1B84FF'],
          hoverBackgroundColor: ['#FF5000', '#02A74B', '#0066E6'],
          borderWidth: 0,
          borderRadius: 5
        }]
      };
      
      const options = {
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              font: {
                size: 12
              },
              padding: 20
            }
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const value = context.raw;
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${context.label}: ${value} (${percentage}%)`;
              }
            }
          },
          datalabels: {
            display: true,
            color: '#fff',
            font: {
              weight: 'bold',
              size: 12
            },
            formatter: (value: number, context: any) => {
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return percentage > 5 ? `${percentage}%` : '';
            }
          }
        },
        maintainAspectRatio: false,
        cutout: '60%' // Transforme le pie chart en doughnut chart pour un look plus moderne
      };
      
      setUserDistributionChart({ data, options });
      
      // Création du graphique de tendance des utilisateurs (données simulées pour la démonstration)
      const now = new Date();
      const months = [];
      const hrData = [];
      const candidateData = [];
      const otherData = [];
      
      // Générer des données historiques simulées pour les 6 derniers mois
      for (let i = 5; i >= 0; i--) {
        const month = new Date();
        month.setMonth(now.getMonth() - i);
        
        const monthName = month.toLocaleString('default', { month: 'short' });
        months.push(monthName);
        
        // Simuler une croissance progressive vers les chiffres actuels
        const factor = i === 0 ? 1 : (5-i)/5; // Le facteur augmente à mesure qu'on s'approche du présent
        
        const hrGrowth = Math.round(usersStats.hrUsers * (0.6 + 0.4 * factor));
        const candidateGrowth = Math.round(usersStats.candidateUsers * (0.5 + 0.5 * factor));
        const otherCount = Math.round((usersStats.totalUsers - (usersStats.hrUsers + usersStats.candidateUsers)) * (0.7 + 0.3 * factor));
        
        hrData.push(hrGrowth);
        candidateData.push(candidateGrowth);
        otherData.push(otherCount);
      }
      
      const trendData = {
        labels: months,
        datasets: [
          {
            label: 'HR Users',
            data: hrData,
            backgroundColor: 'rgba(255, 111, 40, 0.2)',
            borderColor: '#FF6F28',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#FF6F28'
          },
          {
            label: 'Candidates',
            data: candidateData,
            backgroundColor: 'rgba(3, 201, 90, 0.2)',
            borderColor: '#03C95A',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#03C95A'
          },
          {
            label: 'Autres',
            data: otherData,
            backgroundColor: 'rgba(27, 132, 255, 0.2)',
            borderColor: '#1B84FF',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#1B84FF'
          }
        ]
      };
      
      const trendOptions = {
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
            position: 'top',
            labels: {
              usePointStyle: true
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        }
      };
      
      setUserTrendChart({ data: trendData, options: trendOptions });
    }
  }, [loadingStats, usersStats]);

  //New Chart
  const [empDepartment] = useState<any>({
    chart: {
      height: 235,
      type: 'bar',
      padding: {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      },
      toolbar: {
        show: false,
      }
    },
    fill: {
      colors: ['#F26522'], // Fill color for the bars
      opacity: 1, // Adjust opacity (1 is fully opaque)
    },
    colors: ['#F26522'],
    grid: {
      borderColor: '#E5E7EB',
      strokeDashArray: 5,
      padding: {
        top: -20,
        left: 0,
        right: 0,
        bottom: 0
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 5,
        horizontal: true,
        barHeight: '35%',
        endingShape: 'rounded'
      }
    },
    dataLabels: {
      enabled: false
    },
    series: [{
      data: [80, 110, 80, 20, 60, 100],
      name: 'Employee'
    }],
    xaxis: {
      categories: ['UI/UX', 'Development', 'Management', 'HR', 'Testing', 'Marketing'],
      labels: {
        style: {
          colors: '#111827',
          fontSize: '13px',
        }
      }
    }
  })

  useEffect(() => {
    const data = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Approved Companies',
          data: [5, 8, 12, 15, 18, companiesData.approved],
          fill: false,
          borderColor: '#03C95A',
          tension: 0.4,
          pointBackgroundColor: '#03C95A'
        },
        {
          label: 'Pending Companies',
          data: [2, 3, 5, 8, 7, companiesData.pending],
          fill: false,
          borderColor: '#FFC107',
          tension: 0.4,
          pointBackgroundColor: '#FFC107'
        }
      ]
    };
    
    const options = {
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
          position: 'top',
          labels: {
            usePointStyle: true
          }
        }
      }
    };
    
    setCompanyGrowthChart({ data, options });
  }, [companiesData]);

  //Attendance ChartJs
  const [chartData, setChartData] = useState({});
  const [chartOptions, setChartOptions] = useState({});
  useEffect(() => {
    const data = {
      labels: ['Late', 'Present', 'Permission', 'Absent'],
      datasets: [

        {
          label: 'Semi Donut',
          data: [40, 20, 30, 10],
          backgroundColor: ['#0C4B5E', '#03C95A', '#FFC107', '#E70D0D'],
          borderWidth: 5,
          borderRadius: 10,
          borderColor: '#fff', // Border between segments
          hoverBorderWidth: 0,   // Border radius for curved edges
          cutout: '60%',
        }
      ]
    };
    const options = {
      rotation: -100,
      circumference: 200,
      layout: {
        padding: {
          top: -20,    // Set to 0 to remove top padding
          bottom: -20, // Set to 0 to remove bottom padding
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false // Hide the legend
        }
      },
    };

    setChartData(data);
    setChartOptions(options);
  }, []);

  //Semi Donut ChartJs
  const [semidonutData, setSemidonutData] = useState({});
  const [semidonutOptions, setSemidonutOptions] = useState({});
  const toggleTodo = (index: number) => {
    setIsTodo((prevIsTodo) => {
      const newIsTodo = [...prevIsTodo];
      newIsTodo[index] = !newIsTodo[index];
      return newIsTodo;
    });
  };
  useEffect(() => {
    const data = {
      labels: ["Ongoing", "Onhold", "Completed", "Overdue"],
      datasets: [
        {
          label: 'Semi Donut',
          data: [20, 40, 20, 10],
          backgroundColor: ['#FFC107', '#1B84FF', '#03C95A', '#E70D0D'],
          borderWidth: -10,
          borderColor: 'transparent', // Border between segments
          hoverBorderWidth: 0,   // Border radius for curved edges
          cutout: '75%',
          spacing: -30,
        },
      ],
    };

    const options = {
      rotation: -100,
      circumference: 185,
      layout: {
        padding: {
          top: -20,    // Set to 0 to remove top padding
          bottom: 20, // Set to 0 to remove bottom padding
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false // Hide the legend
        }
      }, elements: {
        arc: {
          borderWidth: -30, // Ensure consistent overlap
          borderRadius: 30, // Add some rounding
        }
      },
    };

    setSemidonutData(data);
    setSemidonutOptions(options);
  }, []);
  
  // Gestionnaire pour changer la période
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    loadCompanyTrends(period);
  };

  // Charger les tendances d'inscription des entreprises au chargement initial
  useEffect(() => {
    if (!loadingStats && debouncedRefresh > 0) {
      loadCompanyTrends(selectedPeriod);
    }
  }, [loadingStats, debouncedRefresh, selectedPeriod, loadCompanyTrends]);

  return (
    <React.Fragment>
      <Toast ref={toast} />
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Admin Dashboard</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Dashboard</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Admin Dashboard
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <div className="mb-2">
                <div className="input-icon w-120 position-relative">
                  <span className="input-icon-addon">
                    <i className="ti ti-calendar text-gray-9" />
                  </span>
                  <Calendar value={date} onChange={(e: any) => setDate(e.value)} view="year" dateFormat="yy" className="Calendar-form" />
                </div>
              </div>
              <div className="ms-2 head-icons">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}
          {/* Welcome Wrap */}
          <div className="card border-0">
            <div className="card-body d-flex align-items-center justify-content-between flex-wrap pb-1">
              <div className="d-flex align-items-center mb-3">
                <span className="avatar avatar-xl flex-shrink-0">
                  <ImageWithBasePath
                    src="assets/img/profiles/avatar-31.jpg"
                    className="rounded-circle"
                    alt="img"
                  />
                </span>
                <div className="ms-3">
                  <h3 className="mb-2">
                    Welcome to TuniHire Admin Dashboard{" "}
                    <Link to="#" className="edit-icon">
                      <i className="ti ti-edit fs-14" />
                    </Link>
                  </h3>
                  <p>
                    You have{" "}
                    <span className="text-primary text-decoration-underline">
                      {companiesData.pending}
                    </span>{" "}
                    Pending Company Approvals &amp;{" "}
                    <span className="text-primary text-decoration-underline">
                      {usersStats.newUsersThisMonth}
                    </span>{" "}
                    New Users This Month
                  </p>
                </div>
              </div>
              <div className="d-flex align-items-center flex-wrap mb-1">
                <Link
                  to="/companies"
                  className="btn btn-secondary btn-md me-2 mb-2"
                >
                  <i className="ti ti-building me-1" />
                  Manage Companies
                </Link>
                <Link
                  to="/users"
                  className="btn btn-primary btn-md mb-2"
                >
                  <i className="ti ti-users me-1" />
                  Manage Users
                </Link>
              </div>
            </div>
          </div>
          {/* /Welcome Wrap */}
          <div className="row">
            {/* Widget Info */}
            <div className="col-xxl-8 d-flex">
              <div className="row flex-fill">
                {/* Companies Card */}
                <div className="col-md-4 d-flex">
                  <div className="card flex-fill">
                    <div className="card-body">
                      <span className="avatar rounded-circle bg-info mb-2">
                        <i className="ti ti-building fs-16" />
                      </span>
                      <h6 className="fs-13 fw-medium text-default mb-1">
                        Registered Companies
                      </h6>
                      {loadingStats ? (
                        <div className="skeleton-loader">
                          <Skeleton width="80px" height="24px" />
                        </div>
                      ) : (
                        <h3 className="mb-3">
                          {companiesData.approved}/{companiesData.total}{" "}
                          <span className={`fs-12 fw-medium text-${companiesData.change > 50 ? 'success' : 'warning'}`}>
                            <i className={`fa-solid fa-caret-${companiesData.change > 50 ? 'up' : 'down'} me-1`} />
                            {companiesData.change}%
                          </span>
                        </h3>
                      )}
                      <Link to="/companies" className="link-default">
                        View Companies
                      </Link>
                    </div>
                  </div>
                </div>
                
                {/* HR Users Card */}
                <div className="col-md-4 d-flex">
                  <div className="card flex-fill">
                    <div className="card-body">
                         <span className="avatar rounded-circle bg-primary mb-2">
                        <i className="ti ti-user-star fs-16" />
                      </span>
                      <h6 className="fs-13 fw-medium text-default mb-1">
                        HR Users
                      </h6>
                      {loadingStats ? (
                        <div className="skeleton-loader">
                          <Skeleton width="80px" height="24px" />
                        </div>
                      ) : (
                        <h3 className="mb-3">
                          {usersStats.hrUsers}
                          <span className="fs-12 fw-medium text-success">
                            <i className="fa-solid fa-caret-up me-1" />
                            {Math.round((usersStats.hrUsers / usersStats.totalUsers) * 100)}%
                          </span>
                        </h3>
                      )}
                      <Link to="/users?role=hr" className="link-default">
                        View HR Users
                      </Link>
                    </div>
                  </div>
                </div>
                
                {/* Candidate Users Card */}
                <div className="col-md-4 d-flex">
                  <div className="card flex-fill">
                    <div className="card-body">
                      <span className="avatar rounded-circle bg-success mb-2">
                        <i className="ti ti-users-group fs-16" />
                      </span>
                      <h6 className="fs-13 fw-medium text-default mb-1">
                        Candidate Users
                      </h6>
                      {loadingStats ? (
                        <div className="skeleton-loader">
                          <Skeleton width="80px" height="24px" />
                        </div>
                      ) : (
                        <h3 className="mb-3">
                          {usersStats.candidateUsers}
                          <span className="fs-12 fw-medium text-success">
                            <i className="fa-solid fa-caret-up me-1" />
                            {Math.round((usersStats.candidateUsers / usersStats.totalUsers) * 100)}%
                          </span>
                        </h3>
                      )}
                      <Link to="/users?role=candidate" className="link-default">
                        View Candidates
                      </Link>
                    </div>
                  </div>
                </div>
                
                {/* Total Users Card */}
                <div className="col-md-4 d-flex">
                  <div className="card flex-fill">
                    <div className="card-body">
                      <span className="avatar rounded-circle bg-secondary mb-2">
                        <i className="ti ti-users fs-16" />
                      </span>
                      <h6 className="fs-13 fw-medium text-default mb-1">
                        Total Users
                      </h6>
                      {loadingStats ? (
                        <div className="skeleton-loader">
                          <Skeleton width="80px" height="24px" />
                        </div>
                      ) : (
                        <h3 className="mb-3">
                          {usersStats.totalUsers}
                          <span className="fs-12 fw-medium text-success">
                            <i className="fa-solid fa-caret-up me-1" />
                            {usersStats.userGrowth}%
                          </span>
                        </h3>
                      )}
                      <Link to="/users" className="link-default">
                        View All Users
                      </Link>
                    </div>
                  </div>
                </div>
                
                {/* Active Users Card */}
                <div className="col-md-4 d-flex">
                  <div className="card flex-fill">
                    <div className="card-body">
                      <span className="avatar rounded-circle bg-purple mb-2">
                        <i className="ti ti-user-check fs-16" />
                      </span>
                      <h6 className="fs-13 fw-medium text-default mb-1">
                        Active Users
                      </h6>
                      {loadingStats ? (
                        <div className="skeleton-loader">
                          <Skeleton width="80px" height="24px" />
                        </div>
                      ) : (
                        <h3 className="mb-3">
                          {usersStats.activeUsers}/{usersStats.totalUsers}
                          <span className="fs-12 fw-medium text-success">
                            <i className="fa-solid fa-caret-up me-1" />
                            {Math.round((usersStats.activeUsers / usersStats.totalUsers) * 100)}%
                          </span>
                        </h3>
                      )}
                      <Link to="/users?status=active" className="link-default">
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
                
                {/* New Users Card */}
                <div className="col-md-4 d-flex">
                  <div className="card flex-fill">
                    <div className="card-body">
                      <span className="avatar rounded-circle bg-pink mb-2">
                        <i className="ti ti-user-plus fs-16" />
                      </span>
                      <h6 className="fs-13 fw-medium text-default mb-1">
                        New Users This Month
                      </h6>
                      {loadingStats ? (
                        <div className="skeleton-loader">
                          <Skeleton width="80px" height="24px" />
                        </div>
                      ) : (
                        <h3 className="mb-3">
                          {usersStats.newUsersThisMonth}
                          <span className="fs-12 fw-medium text-success">
                            <i className="fa-solid fa-caret-up me-1" />
                            New
                          </span>
                        </h3>
                      )}
                      <Link to="/users?filter=new" className="link-default">
                        View New Users
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /Widget Info */}
            
            {/* User Distribution Chart */}
            <div className="col-xxl-4 d-flex">
              <div className="card flex-fill">
                <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
                  <h5 className="mb-2">User Distribution</h5>
                  <div className="dropdown mb-2">
                    <Link to="#"
                      className="btn btn-white border btn-sm d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      <i className="ti ti-chart-pie me-1" />
                      View Stats
                    </Link>
                    <ul className="dropdown-menu dropdown-menu-end p-3">
                      <li>
                        <Link to="/users/statistics"
                          className="dropdown-item rounded-1"
                        >
                          <i className="ti ti-chart-bar me-1" />
                          Detailed Statistics
                        </Link>
                      </li>
                      <li>
                        <Link to="/users/export"
                          className="dropdown-item rounded-1"
                        >
                          <i className="ti ti-file-export me-1" />
                          Export Data
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body">
                  {loadingStats ? (
                    <div className="d-flex justify-content-center align-items-center" style={{height: "250px"}}>
                      <Skeleton width="100%" height="250px" />
                    </div>
                  ) : (
                    <>
                      <div style={{height: "250px"}}>
                        {userDistributionChart.data && (
                          <Chart 
                            type="doughnut" 
                            data={userDistributionChart.data} 
                            options={userDistributionChart.options || {}} 
                          />
                        )}
                      </div>
                      <br/>
                      <div className="d-flex justify-content-center mt-3 mb-1 flex-wrap">
                        <div className="d-flex align-items-center me-3 mb-2">
                          <span className="badge-dot bg-primary me-1"></span>
                          <span className="fs-13">HR Users ({usersStats.hrUsers})</span>
                        </div>
                        <div className="d-flex align-items-center me-3 mb-2">
                          <span className="badge-dot bg-success me-1"></span>
                          <span className="fs-13">Candidates ({usersStats.candidateUsers})</span>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <span className="badge-dot bg-info me-1"></span>
                          <span className="fs-13">Autres ({usersStats.totalUsers - (usersStats.hrUsers + usersStats.candidateUsers)})</span>
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center border-top pt-3 mt-2">
                        <p className="mb-0 fs-13">
                          <i className="ti ti-user-plus me-1 text-success"></i>
                          {usersStats.newUsersThisMonth} nouveaux utilisateurs ce mois
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            {/* /User Distribution Chart */}
          </div>
          
          <div className="row">
            {/* Company Growth Chart */}
            <div className="col-xxl-8 d-flex">
              <div className="card flex-fill">
                <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
                  <h5 className="mb-2">Company Registration Trends</h5>
                  <div className="dropdown mb-2">
                    <Link to="#"
                      className="btn btn-white border btn-sm d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      <i className="ti ti-calendar me-1" />
                      {selectedPeriod === 'last3months' ? 'Last 3 Months' : 
                       selectedPeriod === 'thisyear' ? 'This Year' : 'Last 6 Months'}
                    </Link>
                    <ul className="dropdown-menu dropdown-menu-end p-3">
                      <li>
                        <Link to="#"
                          className="dropdown-item rounded-1"
                          onClick={() => handlePeriodChange('last3months')}
                        >
                          Last 3 Months
                        </Link>
                      </li>
                      <li>
                        <Link to="#"
                          className="dropdown-item rounded-1"
                          onClick={() => handlePeriodChange('last6months')}
                        >
                          Last 6 Months
                        </Link>
                      </li>
                      <li>
                        <Link to="#"
                          className="dropdown-item rounded-1"
                          onClick={() => handlePeriodChange('thisyear')}
                        >
                          This Year
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body">
                  {loadingTrends ? (
                    <Skeleton width="100%" height="300px" />
                  ) : (
                    <div style={{height: "300px"}}>
                      {companyGrowthChart.data && (
                        <Chart 
                          type="line" 
                          data={companyGrowthChart.data} 
                          options={companyGrowthChart.options || {}} 
                        />
                      )}
                    </div>
                  )}
                  <p className="fs-13 mt-2">
                    <i className="ti ti-circle-filled me-2 fs-8 text-success" />
                    {companyTrends?.stats?.companyGrowth !== undefined ? (
                      <>Company registrations have increased by <span className="text-success fw-bold">+{companyTrends.stats.companyGrowth}%</span> compared to last month</>
                    ) : (
                      <>Company registrations data loading...</>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            {/* User Activity Metrics */}
            <div className="col-xxl-4 d-flex">
              <div className="card flex-fill">
                <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
                  <h5 className="mb-2">User Activity</h5>
                  <div className="dropdown mb-2">
                    <Link to="#"
                      className="btn btn-white border btn-sm d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      <i className="ti ti-calendar me-1" />
                      This Week
                    </Link>
                    <ul className="dropdown-menu dropdown-menu-end p-3">
                      <li>
                        <Link to="#"
                          className="dropdown-item rounded-1"
                        >
                          This Month
                        </Link>
                      </li>
                      <li>
                        <Link to="#"
                          className="dropdown-item rounded-1"
                        >
                          This Week
                        </Link>
                      </li>
                      <li>
                        <Link to="#"
                          className="dropdown-item rounded-1"
                        >
                          Today
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body">
                  {loadingStats ? (
                    <div className="mb-4">
                      <Skeleton width="100%" height="240px" />
                    </div>
                  ) : (
                    <>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="fs-14">Login Activity</h6>
                        <span className="badge badge-success-transparent">+24%</span>
                      </div>
                      <div className="progress mb-4" style={{height: "10px"}}>
                        <div className="progress-bar bg-success" role="progressbar" style={{width: "68%"}} aria-valuenow={68} aria-valuemin={0} aria-valuemax={100}></div>
                      </div>
                      
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="fs-14">Profile Completion</h6>
                        <span className="badge badge-info-transparent">+15%</span>
                      </div>
                      <div className="progress mb-4" style={{height: "10px"}}>
                        <div className="progress-bar bg-info" role="progressbar" style={{width: "45%"}} aria-valuenow={45} aria-valuemin={0} aria-valuemax={100}></div>
                      </div>
                      
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="fs-14">Job Applications</h6>
                        <span className="badge badge-primary-transparent">+32%</span>
                      </div>
                      <div className="progress mb-4" style={{height: "10px"}}>
                        <div className="progress-bar bg-primary" role="progressbar" style={{width: "78%"}} aria-valuenow={78} aria-valuemin={0} aria-valuemax={100}></div>
                      </div>
                      
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="fs-14">HR Job Postings</h6>
                        <span className="badge badge-warning-transparent">+8%</span>
                      </div>
                      <div className="progress" style={{height: "10px"}}>
                        <div className="progress-bar bg-warning" role="progressbar" style={{width: "35%"}} aria-valuenow={35} aria-valuemin={0} aria-valuemax={100}></div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional content can go here */}
        </div>
        <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
          <p className="mb-0">2014 - {new Date().getFullYear()} © TuniHire.</p>
          <p>
            Designed &amp; Developed By{" "}
            <Link to="#" className="text-primary">
              TuniHire Team
            </Link>
          </p>
        </div>
      </div>
      {/* /Page Wrapper */}
      <ProjectModals />
      <RequestModals />
      <TodoModal />
    </React.Fragment>
  );
};

export default AdminDashboard;

