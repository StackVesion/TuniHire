import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import { Application } from './types';
import ApplicationCard from './ApplicationCard';
import FilterBar from './FilterBar';

const ApplicationsList: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      // Récupérer le token d'authentification du stockage local
      const token = localStorage.getItem('token');
      
      // Faire l'appel API avec le token dans les en-têtes
      const response = await axios.get('http://localhost:5000/api/applications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setApplications(response.data);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: 'Accepted' | 'Rejected') => {
    try {
      // Récupérer le token d'authentification
      const token = localStorage.getItem('token');
      
      await axios.patch(`http://localhost:5000/api/applications/${applicationId}/status`, {
        status: newStatus
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      // Mettre à jour l'état local après le changement de statut
      setApplications(applications.map(app => 
        app._id === applicationId ? { ...app, status: newStatus } : app
      ));
    } catch (err) {
      console.error('Error updating application status:', err);
      // Afficher une notification d'erreur si nécessaire
    }
  };

  const getFilteredApplications = () => {
    if (statusFilter === 'all') return applications;
    return applications.filter(app => 
      app.status.toLowerCase() === statusFilter.toLowerCase()
    );
  };

  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Applications List</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Administration</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Applications List
                  </li>
                </ol>
              </nav>
            </div>

            {/* Filter Controls */}
            <FilterBar 
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              onRefresh={fetchApplications}
            />
          </div>

          {/* Applications Grid */}
          <div className="row">
            {loading ? (
              <div className="col-12 text-center p-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : error ? (
              <div className="col-12">
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              </div>
            ) : getFilteredApplications().length === 0 ? (
              <div className="col-12 text-center p-5">
                <h4>No applications found</h4>
              </div>
            ) : (
              getFilteredApplications().map((application) => (
                <div key={application._id} className="col-xl-3 col-lg-4 col-md-6">
                  <ApplicationCard 
                    application={application}
                    onStatusChange={handleStatusChange}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ApplicationsList; 