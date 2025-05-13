import axios from 'axios';

// Use hardcoded API URL
const API_URL = 'http://localhost:5000/api';

// Set to true during backend development to use mock data
const MOCK_MODE = true;

// Define interfaces for our data types
interface DepartmentData {
  department: string;
  count: number;
}

interface DashboardStats {
  user: {
    name: string;
    email: string;
  };
  stats: Array<{
    title: string;
    value: string;
    change?: number;
    icon: string;
    color: string;
    link: string;
    view: string;
  }>;
  pendingApprovals: number;
  leaveRequests: number;
  employeeGrowth: number;
}

interface SalesData {
  months: string[];
  income: number[];
  expenses: number[];
}

interface AttendanceData {
  late: number;
  present: number;
  permission: number;
  absent: number;
  total: number;
}

interface ActivityData {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  action: string;
  target?: string;
  timestamp: string;
  date: Date;
}

// Add User interfaces
interface UserProfile {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profilePicture?: string;
  role: string;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  zipCode?: string;
}

// Mock data functions
const getMockDashboardStats = (): DashboardStats => {
  return {
    user: { name: 'Admin User', email: 'admin@tunihire.com' },
    stats: [
      {
        title: "Companies",
        value: "48",
        change: 2.1,
        icon: "building",
        color: "primary",
        link: "/companies",
        view: "All"
      },
      {
        title: "Active Applications List",
        value: "92/99",
        change: 2.1,
        icon: "briefcase",
        color: "secondary",
        link: "/Applications List",
        view: "All"
      },
      {
        title: "Total Clients",
        value: "69/86",
        change: -11.2,
        icon: "users-group",
        color: "info",
        link: "/clients",
        view: "All"
      },
      {
        title: "Total Tasks",
        value: "25/28",
        change: 11.2,
        icon: "checklist",
        color: "pink",
        link: "/tasks",
        view: "All"
      },
      {
        title: "Earnings",
        value: "$2144",
        change: 10.2,
        icon: "moneybag",
        color: "purple",
        link: "/expenses",
        view: "All"
      },
      {
        title: "Profit This Week",
        value: "$5,544",
        change: 2.1,
        icon: "browser",
        color: "danger",
        link: "/transactions",
        view: "All"
      },
      {
        title: "Job Applicants",
        value: "98",
        change: 2.1,
        icon: "users-group", 
        color: "success",
        link: "/job-list",
        view: "All"
      },
      {
        title: "New Hire",
        value: "45/48",
        change: -11.2,
        icon: "user-star",
        color: "dark",
        link: "/candidates",
        view: "All"
      }
    ],
    pendingApprovals: 21,
    leaveRequests: 14,
    employeeGrowth: 20,
  };
};

const getMockEmployeesByDepartment = (timeframe: string): DepartmentData[] => {
  if (timeframe === 'month') {
    return [
      { department: 'UI/UX', count: 95 },
      { department: 'Development', count: 120 },
      { department: 'Management', count: 75 },
      { department: 'HR', count: 30 },
      { department: 'Testing', count: 45 },
      { department: 'Marketing', count: 60 }
    ];
  } else if (timeframe === 'year') {
    return [
      { department: 'UI/UX', count: 150 },
      { department: 'Development', count: 200 },
      { department: 'Management', count: 100 },
      { department: 'HR', count: 50 },
      { department: 'Testing', count: 80 },
      { department: 'Marketing', count: 120 }
    ];
  }
  
  // Default: week
  return [
    { department: 'UI/UX', count: 80 },
    { department: 'Development', count: 110 },
    { department: 'Management', count: 80 },
    { department: 'HR', count: 20 },
    { department: 'Testing', count: 60 },
    { department: 'Marketing', count: 100 }
  ];
};

const getMockSalesOverview = (timeframe: string): SalesData => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  if (timeframe === 'month') {
    const days = Array.from({ length: 31 }, (_, i) => `${i+1}`);
    return {
      months: days,
      income: Array.from({ length: 31 }, () => Math.floor(Math.random() * 50) + 20),
      expenses: Array.from({ length: 31 }, () => Math.floor(Math.random() * 30) + 10)
    };
  } else if (timeframe === 'year') {
    return {
      months: ['Q1', 'Q2', 'Q3', 'Q4'],
      income: [350, 420, 380, 450],
      expenses: [200, 180, 220, 190]
    };
  }
  
  // Default: week
  return {
    months,
    income: [40, 30, 45, 80, 85, 90, 80, 80, 80, 85, 20, 80],
    expenses: [60, 70, 55, 20, 15, 10, 20, 20, 20, 15, 80, 20]
  };
};

const getMockAttendanceOverview = (timeframe: string): AttendanceData => {
  if (timeframe === 'month') {
    return {
      late: 45,
      present: 650,
      permission: 32,
      absent: 28,
      total: 755
    };
  } else if (timeframe === 'week') {
    return {
      late: 15,
      present: 120,
      permission: 8,
      absent: 7,
      total: 150
    };
  }
  
  // Default: day
  return {
    late: 40,
    present: 20,
    permission: 30,
    absent: 10,
    total: 100
  };
};

const getMockRecentActivities = (): ActivityData[] => {
  return [
    {
      id: '1',
      user: {
        name: "Matt Morgan",
        avatar: "assets/img/users/user-38.jpg"
      },
      action: "Added New Project",
      target: "HRMS Dashboard",
      timestamp: "05:30 PM",
      date: new Date()
    },
    {
      id: '2',
      user: {
        name: "Jay Ze",
        avatar: "assets/img/users/user-01.jpg"
      },
      action: "Commented on Uploaded Document",
      timestamp: "05:00 PM",
      date: new Date()
    },
    {
      id: '3',
      user: {
        name: "Mary Donald",
        avatar: "assets/img/users/user-19.jpg"
      },
      action: "Approved Task Projects",
      timestamp: "05:30 PM",
      date: new Date()
    },
    {
      id: '4',
      user: {
        name: "George David",
        avatar: "assets/img/users/user-11.jpg"
      },
      action: "Requesting Access to Module Tickets",
      timestamp: "06:00 PM",
      date: new Date()
    },
    {
      id: '5',
      user: {
        name: "Aaron Zeen",
        avatar: "assets/img/users/user-20.jpg"
      },
      action: "Downloaded App Reports",
      timestamp: "06:30 PM",
      date: new Date()
    }
  ];
};

// Mock user profile data
const getMockUserProfile = (): UserProfile => {
  return {
    userId: '1',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@tunihire.com',
    phone: '+216 123 456 789',
    profilePicture: '/assets/img/profiles/avatar-01.jpg',
    role: 'admin',
    address: '123 TuniHire St',
    country: 'Tunisia',
    state: 'Tunis',
    city: 'Tunis City',
    zipCode: '1001'
  };
};

// Actual service functions that connect to MongoDB
export const fetchDashboardStats = async () => {
  if (MOCK_MODE) {
    return Promise.resolve(getMockDashboardStats());
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Fallback to mock data on error
    console.warn('Falling back to mock data for dashboard stats');
    return getMockDashboardStats();
  }
};

export const fetchEmployeesByDepartment = async (timeframe = 'week') => {
  if (MOCK_MODE) {
    return Promise.resolve(getMockEmployeesByDepartment(timeframe));
  }

  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/dashboard/employees-by-department?timeframe=${timeframe}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching employees by department:', error);
    // Fallback to mock data on error
    console.warn('Falling back to mock data for employees by department');
    return getMockEmployeesByDepartment(timeframe);
  }
};

export const fetchSalesOverview = async (timeframe = 'week') => {
  if (MOCK_MODE) {
    return Promise.resolve(getMockSalesOverview(timeframe));
  }

  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/dashboard/sales-overview?timeframe=${timeframe}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching sales overview:', error);
    // Fallback to mock data on error
    console.warn('Falling back to mock data for sales overview');
    return getMockSalesOverview(timeframe);
  }
};

export const fetchAttendanceOverview = async (timeframe = 'day') => {
  if (MOCK_MODE) {
    return Promise.resolve(getMockAttendanceOverview(timeframe));
  }

  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/dashboard/attendance-overview?timeframe=${timeframe}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance overview:', error);
    // Fallback to mock data on error
    console.warn('Falling back to mock data for attendance overview');
    return getMockAttendanceOverview(timeframe);
  }
};

export const fetchRecentActivities = async () => {
  if (MOCK_MODE) {
    return Promise.resolve(getMockRecentActivities());
  }

  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/dashboard/recent-activities`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    // Fallback to mock data on error
    console.warn('Falling back to mock data for recent activities');
    return getMockRecentActivities();
  }
};

// User profile services
export const fetchUserProfile = async (): Promise<UserProfile> => {
  if (MOCK_MODE) {
    return getMockUserProfile();
  }
  
  try {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    // Make API request with authorization header
    const response = await axios.get(`${API_URL}/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data.user;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (profileData: Partial<UserProfile>): Promise<UserProfile> => {
  if (MOCK_MODE) {
    // Return updated mock data
    return {
      ...getMockUserProfile(),
      ...profileData
    };
  }
  
  try {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    // Make API request with authorization header
    const response = await axios.put(`${API_URL}/users/update-profile`, profileData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data.user;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Upload profile picture
export const uploadProfilePicture = async (file: File): Promise<string> => {
  if (MOCK_MODE) {
    // Return a mock URL
    return '/assets/img/profiles/avatar-01.jpg';
  }
  
  try {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    // Create form data
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    // Make API request with authorization header
    const response = await axios.post(`${API_URL}/users/upload-profile-picture`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data.profilePicture;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};
