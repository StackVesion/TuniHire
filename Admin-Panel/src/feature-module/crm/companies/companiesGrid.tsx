import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { all_routes } from '../../router/all_routes';
import CollapseHeader from '../../../core/common/collapse-header/collapse-header';
import CrmsModal from '../../../core/modals/crms_modal';
import { toast } from 'react-toastify';

const CompaniesGrid = () => {
  interface Company {
    _id: string;
    name: string;
    email: string;
    website?: string;
    category?: string;
    status: string;
    createdBy: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Add a function to refresh token or redirect to login if token is expired
  const getValidToken = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication required. Please log in.');
      navigate('/login');
      return null;
    }

    try {
      // Check if token is valid by making a request to validate endpoint
      await axios.get('http://localhost:5000/api/users/validate-token', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Token is valid
      return token;
    } catch (error) {
      console.error('Token validation error:', error);
      // If token is expired or invalid, redirect to login
      toast.error('Your session has expired. Please log in again.');
      localStorage.removeItem('token');
      navigate('/login');
      return null;
    }
  };

  const fetchCompanies = () => {
    setLoading(true);
    axios.get('http://localhost:5000/api/companies/')
      .then(response => {
        if (Array.isArray(response.data.companies)) {
          setCompanies(response.data.companies);
        } else {
          console.error('API did not return a valid companies array:', response.data);
          setCompanies([]);
        }
      })
      .catch(error => {
        console.error('Error fetching companies:', error);
        setCompanies([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleApproveCompany = async (companyId: string, userId: string) => {
    setLoading(true);
    try {
      console.log('Approving company with ID:', companyId); // Log the companyId for debugging
      const token = await getValidToken();
      console.log('Retrieved token:', token); // Log the token for debugging
      if (!token) {
        setLoading(false);
        return;
      }

      const approveResponse = await axios.put(
        `http://localhost:5000/api/companies/approve/${companyId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (approveResponse.status !== 200) {
        throw new Error(`Failed to approve company. Status: ${approveResponse.status}`);
      }

      const roleUpdateResponse = await axios.put(
        `http://localhost:5000/api/users/update-role/${userId}`,
        { role: 'HR' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (roleUpdateResponse.status !== 200) {
        throw new Error(`Failed to update user role. Status: ${roleUpdateResponse.status}`);
      }

      toast.success('Company approved and user role updated to HR');
      fetchCompanies();
    } catch (error: any) {
      console.error('Error approving company:', error);
      if (error.response) {
        console.error('Server response:', error.response.data); // Log server response for debugging
        if (error.response.status === 404) {
          toast.error('User not found. Please check the user ID.');
        } else {
          toast.error(`Failed to approve company: ${error.response.data.message || 'Internal Server Error'}`);
        }
      } else {
        toast.error('Failed to approve company. Please check the console for more details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRejectCompany = async (companyId: string) => {
    setLoading(true);
    try {
      const token = await getValidToken();
      if (!token) {
        setLoading(false);
        return;
      }

      await axios.put(
        `http://localhost:5000/api/companies/reject/${companyId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Company rejected');
      fetchCompanies();
    } catch (error) {
      console.error('Error rejecting company:', error);
      toast.error('Failed to reject company');
    } finally {
      setLoading(false);
    }
  };

  const routes = all_routes;

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Companies</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">CRM</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Companies Grid
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <div className="me-2 mb-2">
                <div className="d-flex align-items-center border bg-white rounded p-1 me-2 icon-list">
                  <Link to={routes.companiesList} className="btn btn-icon btn-sm me-1">
                    <i className="ti ti-list-tree" />
                  </Link>
                  <Link to={routes.companiesGrid} className="btn btn-icon btn-sm active bg-primary text-white">
                    <i className="ti ti-layout-grid" />
                  </Link>
                </div>
              </div>
              <div className="me-2 mb-2">
                <div className="dropdown">
                  <Link to="#" className="dropdown-toggle btn btn-white d-inline-flex align-items-center" data-bs-toggle="dropdown">
                    <i className="ti ti-file-export me-1" />
                    Export
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li><Link to="#" className="dropdown-item rounded-1"><i className="ti ti-file-type-pdf me-1" />Export as PDF</Link></li>
                    <li><Link to="#" className="dropdown-item rounded-1"><i className="ti ti-file-type-xls me-1" />Export as Excel</Link></li>
                  </ul>
                </div>
              </div>
              <div className="mb-2">
                <Link to="#" data-bs-toggle="modal" data-bs-target="#add_company" className="btn btn-primary d-flex align-items-center">
                  <i className="ti ti-circle-plus me-2" />
                  Add Company
                </Link>
              </div>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}

          <div className="card">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <h5>Companies Grid</h5>
                <div className="dropdown">
                  <Link to="#" className="dropdown-toggle btn btn-sm btn-white d-inline-flex align-items-center" data-bs-toggle="dropdown">
                    Sort By : Last 7 Days
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li><Link to="#" className="dropdown-item rounded-1">Recently Added</Link></li>
                    <li><Link to="#" className="dropdown-item rounded-1">Ascending</Link></li>
                    <li><Link to="#" className="dropdown-item rounded-1">Descending</Link></li>
                    <li><Link to="#" className="dropdown-item rounded-1">Last Month</Link></li>
                    <li><Link to="#" className="dropdown-item rounded-1">Last 7 Days</Link></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            {loading ? (
              <div className="col-12 text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : companies.length > 0 ? (
              companies.map(company => (
                <div className="col-xl-3 col-lg-4 col-md-6" key={company._id}>
                  <div className="card">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                        <div>
                          <Link
                            to={`${routes.companiesDetails}/${company._id}`}
                            className="avatar avatar-xl avatar-rounded online border rounded-circle"
                          >
                            <ImageWithBasePath
                              src="assets/img/company/company-12.svg"
                              className="img-fluid h-auto w-auto"
                              alt="img"
                            />
                          </Link>
                        </div>
                        <div className="dropdown">
                          <button
                            className="btn btn-icon btn-sm rounded-circle"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            <i className="ti ti-dots-vertical" />
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end p-3">
                            <li>
                              <Link
                                className="dropdown-item rounded-1 text-success"
                                to="#"
                                onClick={() => handleApproveCompany(company._id, company.createdBy._id)}
                              >
                                <i className="ti ti-check me-1" />
                                Approve
                              </Link>
                            </li>
                            <li>
                              <Link
                                className="dropdown-item rounded-1 text-danger"
                                to="#"
                                onClick={() => handleRejectCompany(company._id)}
                              >
                                <i className="ti ti-x me-1" />
                                Reject
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="text-center mb-3">
                        <h6 className="mb-1">
                          <Link to={`${routes.companiesDetails}/${company._id}`}>{company.name}</Link>
                        </h6>
                        <div className="avatar-list-stacked avatar-group-sm">
                          <span className="avatar avatar-rounded">
                            <ImageWithBasePath
                              className="border border-white"
                              src="assets/img/profiles/avatar-05.jpg"
                              alt="img"
                            />
                          </span>
                          <span className="avatar avatar-rounded">
                            <ImageWithBasePath
                              className="border border-white"
                              src="assets/img/profiles/avatar-06.jpg"
                              alt="img"
                            />
                          </span>
                          <span className="avatar avatar-rounded">
                            <ImageWithBasePath
                              className="border border-white"
                              src="assets/img/profiles/avatar-07.jpg"
                              alt="img"
                            />
                          </span>
                          <Link
                            to="#"
                            className="avatar bg-primary avatar-rounded text-fixed-white fs-12"
                          >
                            +
                          </Link>
                        </div>
                      </div>
                      <div className="d-flex flex-column">
                        <p className="text-dark d-inline-flex align-items-center mb-2">
                          <i className="ti ti-mail-forward text-gray-5 me-2" />
                          {company.email}
                        </p>
                        {company.website && (
                          <p className="text-dark d-inline-flex align-items-center mb-2">
                            <i className="ti ti-world text-gray-5 me-2" />
                            {company.website}
                          </p>
                        )}
                        {company.category && (
                          <p className="text-dark d-inline-flex align-items-center">
                            <i className="ti ti-category text-gray-5 me-2" />
                            {company.category}
                          </p>
                        )}
                      </div>
                      <div className="d-flex align-items-center justify-content-between border-top pt-3 mt-3">
                        <div className="icons-social d-flex align-items-center">
                          <Link to="#" className="avatar avatar-rounded avatar-sm me-1">
                            <i className="ti ti-mail" />
                          </Link>
                          <Link to="#" className="avatar avatar-rounded avatar-sm me-1">
                            <i className="ti ti-phone-call" />
                          </Link>
                          <Link to="#" className="avatar avatar-rounded avatar-sm me-1">
                            <i className="ti ti-message-2" />
                          </Link>
                        </div>
                        <span className={`badge ${company.status === 'Approved' ? 'bg-success-transparent' : company.status === 'Rejected' ? 'bg-danger-transparent' : 'bg-warning-transparent'}`}>
                          {company.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>No companies available.</p>
            )}
          </div>
        </div>
        <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
          <p className="mb-0">2014 - 2025 © SmartHR.</p>
          <p>
            Designed &amp; Developed By{" "}
            <Link to="#" className="text-primary">
              Dreams
            </Link>
          </p>
        </div>
      </div>
      <CrmsModal />
    </>
  );
};

export default CompaniesGrid;
