import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar
} from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28BDB', '#FF6666'];

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        
       const baseUrl =
       process.env.REACT_APP_API_URL ||
       process.env.NEXT_PUBLIC_FRONT_API_URL ||
       process.env.NEXT_PUBLIC_COMPANY_API_URL;
      const response = await axios.get(
      `${baseUrl}/companies/admin/analytics`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
        
        setAnalytics(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data');
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const formatMonthData = () => {
    if (!analytics?.monthlyGrowth) return [];
    
    return analytics.monthlyGrowth.map(item => {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return {
        name: `${monthNames[item._id.month - 1]} ${item._id.year}`,
        companies: item.count
      };
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#1976d2' }}>
        Companies Analytics Dashboard
      </Typography>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Companies
              </Typography>
              <Typography variant="h3">
                {analytics?.summary.totalCompanies}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 2, bgcolor: '#e3f2fd' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Approval
              </Typography>
              <Typography variant="h3">
                {analytics?.summary.pendingCompanies}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 2, bgcolor: '#e8f5e9' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Approved Companies
              </Typography>
              <Typography variant="h3">
                {analytics?.summary.approvedCompanies}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 2, bgcolor: '#ffebee' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Rejected Companies
              </Typography>
              <Typography variant="h3">
                {analytics?.summary.rejectedCompanies}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Company Growth Over Time */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, boxShadow: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Company Growth (Last 6 Months)
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={formatMonthData()}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="companies" stroke="#1976d2" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        {/* Companies by Industry */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, boxShadow: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Companies by Industry
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.companiesByIndustry.map(item => ({
                      name: item._id,
                      value: item.count
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {analytics?.companiesByIndustry.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Companies by Location */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, boxShadow: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Companies by Location
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics?.companiesByLocation.map(item => ({
                    location: item._id,
                    companies: item.count
                  }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="location" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="companies" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Companies Table */}
      <Paper sx={{ p: 3, boxShadow: 3, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Recently Added Companies
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Company</TableCell>
                <TableCell>Industry</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Added Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analytics?.recentCompanies.map((company) => (
                <TableRow key={company._id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar src={company.logo} alt={company.name} sx={{ mr: 2 }} />
                      <Typography>{company.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{company.industry}</TableCell>
                  <TableCell>{company.location}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        bgcolor: 
                          company.status === 'approved' ? '#e8f5e9' : 
                          company.status === 'rejected' ? '#ffebee' : '#e3f2fd',
                        color: 
                          company.status === 'approved' ? 'success.main' : 
                          company.status === 'rejected' ? 'error.main' : 'info.main',
                        p: 0.5,
                        px: 1,
                        borderRadius: 1,
                        display: 'inline-block',
                        textTransform: 'capitalize'
                      }}
                    >
                      {company.status}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {new Date(company.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default AnalyticsDashboard;
