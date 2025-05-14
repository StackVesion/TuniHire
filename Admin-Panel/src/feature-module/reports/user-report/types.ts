export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt?: string;
  status?: string;
  lastLogin?: string | null;
  isOnline?: boolean;
  isVerified?: boolean;
  isEmailVerified?: boolean;
  subscription?: string;
  skills?: any[];
  languagePreferences?: any[];
  projects?: any[];
  education?: any[];
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  online: number;
  admins: number;
  recruiters: number;
  candidates: number;
  recentlyActive: number;
  onlinePercentage: number;
  lastUpdate?: string;
}
