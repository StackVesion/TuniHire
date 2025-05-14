import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import LoadingScreen from '../../components/LoadingScreen';
import { getCurrentUser, createAuthAxios } from '../../utils/authUtils';

export default function MeetingsPage() {
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // This check ensures we're running on the client side
    if (typeof window === 'undefined') {
      return; // Don't execute on server side
    }

    // Check if user is logged in and is HR
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (currentUser.role.toString().toUpperCase() !== 'HR') {
      router.push('/');
      return;
    }

    setUser(currentUser);
    
    // Create authAxios instance
    const authAxios = createAuthAxios();
    if (!authAxios) {
      router.push('/login');
      return;
    }
    
    // Fetch jobs associated with this HR's company
    const fetchJobs = async () => {
      try {
        setLoading(true);
        
        try {
          // First get the user's company - same logic as in my-job-grid
          const companyResponse = await authAxios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/companies/user/my-company`
          );
          
          // The API returns the company inside a 'company' property
          const companyData = companyResponse.data.company;
          
          if (!companyData || !companyData._id) {
            console.error('Company data structure:', companyResponse.data);
            setError('No company found for your account. Please create a company first.');
            setLoading(false);
            return;
          }
          
          console.log('Found company:', companyData.name, 'with ID:', companyData._id);
          const companyId = companyData._id;
          
          // Get all jobs for this company
          const jobsResponse = await authAxios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/jobs/company/${companyId}`
          );
          
          console.log('Found jobs:', jobsResponse.data.length);
          
          // For each job, fetch meeting counts
          const jobsWithMeetings = await Promise.all(
            jobsResponse.data.map(async (job) => {
              try {
                const meetingsResponse = await authAxios.get(
                  `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/meetings/job/${job._id}`
                );
                
                return {
                  ...job,
                  meetingsCount: meetingsResponse.data.count || 0,
                  meetings: meetingsResponse.data.data || []
                };
              } catch (error) {
                console.error(`Error fetching meetings for job ${job._id}:`, error);
                return {
                  ...job,
                  meetingsCount: 0,
                  meetings: []
                };
              }
            })
          );
          
          setJobs(jobsWithMeetings);
        } catch (err) {
          console.error('Error fetching company data:', err);
          
          if (err.response && err.response.status === 404) {
            setError('You don\'t have a company yet. Please create one first.');
          } else if (err.response && err.response.status === 400) {
            setError('Authentication error. Please login again.');
            router.push('/login');
          } else {
            setError('Failed to load company data: ' + (err.response?.data?.message || err.message));
          }
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setError('Failed to load jobs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobs();
  }, [router]);

  // Helper function to get workplace badge style
  const getWorkplaceStyle = (type) => {
    switch(type?.toLowerCase()) {
      case 'remote':
        return { bgColor: '#e1f5fe', textColor: '#0288d1' };
      case 'hybrid':
        return { bgColor: '#fff8e1', textColor: '#ff8f00' };
      case 'office':
        return { bgColor: '#e8f5e9', textColor: '#388e3c' };
      default:
        return { bgColor: '#e8f5e9', textColor: '#388e3c' };
    }
  };
  
  // Helper function to get color based on meeting count
  const getMeetingCountClass = (count) => {
    if (count === 0) return 'text-muted';
    if (count < 3) return 'text-primary';
    if (count < 5) return 'text-success';
    return 'text-warning';
  };

  if (loading) {
    return <LoadingScreen message="Loading meetings..." />;
  }
  
  return (
    <Layout>
      <div className="box-heading">
        <div className="box-title">
          <h3 className="mb-35">Meetings Dashboard</h3>
        </div>
        <div className="box-breadcrumb">
          <div className="breadcrumbs">
            <ul>
              <li><a className="icon-home" href="/dashboard">Admin</a></li>
              <li><span>Meetings</span></li>
            </ul>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      <div className="container">
        <div className="text-center mb-4">
          <h2 className="section-title mb-10 wow animate__animated animate__fadeIn">View and manage meetings for your job postings</h2>
          <p className="font-lg color-text-paragraph-2 wow animate__animated animate__fadeIn">
            Schedule and monitor candidate interviews for each of your job postings
          </p>
        </div>
        
        <div className="row mt-4">
          {jobs.length === 0 ? (
            <div className="col-12 text-center">
              <div className="card shadow-sm rounded p-5 wow animate__animated animate__fadeIn">
                <div className="d-flex flex-column align-items-center">
                  <div className="alert alert-info mb-4" role="alert">
                    No jobs found. Please post some jobs before scheduling meetings.
                  </div>
                  <Link href="/job-post" className="btn btn-primary">
                    Create a New Job
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            jobs.map((job, index) => {
              const workplaceStyle = getWorkplaceStyle(job.workplaceType);
              const meetingCountClass = getMeetingCountClass(job.meetingsCount);
              
              return (
                <div 
                  key={job._id} 
                  className="col-xl-4 col-lg-4 col-md-6 col-sm-12 mb-30"
                >
                  <div 
                    className="card-grid-2 hover-up" 
                    style={{ 
                      animationDelay: `${index * 0.1}s`, 
                      animation: 'fadeIn 0.5s ease-in-out'
                    }}
                  >
                    <div className="card-grid-2-image-left">
                      <div className="card-grid-2-image-rd online">
                        <div 
                          style={{ 
                            width: '50px', 
                            height: '50px', 
                            backgroundColor: workplaceStyle.bgColor,
                            color: workplaceStyle.textColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            fontWeight: 'bold',
                            fontSize: '18px'
                          }}
                        >
                          {job.workplaceType?.[0] || 'O'}
                        </div>
                      </div>
                      <div className="card-grid-2-image-main">
                        <h5 className="font-md">
                          <Link href={`/job-details/${job._id}`}>{job.title}</Link>
                        </h5>
                        <div className="rate-reviews-small">
                          <span>
                            <span className="location-small">{job.location || 'Not specified'}</span>
                          </span>
                          {job.datePosted && (
                            <span className="text-muted ml-20">
                              Posted: {new Date(job.datePosted).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="card-block-info">
                      <div className="d-flex justify-content-between mb-3">
                        <span 
                          className="card-briefcase" 
                          style={{
                            backgroundColor: workplaceStyle.bgColor,
                            color: workplaceStyle.textColor,
                            padding: '5px 12px',
                            borderRadius: '15px',
                            fontWeight: '600',
                            fontSize: '14px'
                          }}
                        >
                          {job.workplaceType || 'On-site'}
                        </span>
                        <span className={`card-time ${meetingCountClass}`}>
                          <span style={{ 
                            fontWeight: 'bold', 
                            fontSize: '16px', 
                            marginRight: '5px',
                            transition: 'all 0.3s ease'
                          }}>
                            {job.meetingsCount}
                          </span>
                          {job.meetingsCount === 1 ? 'Meeting' : 'Meetings'}
                        </span>
                      </div>
                      
                      <p className="font-sm color-text-paragraph mt-15" style={{ minHeight: '60px' }}>
                        {job.shortDescription || job.description?.substring(0, 100) || 
                          `We are looking for a ${job.title} to join our team. You will be responsible for various tasks and projects.`}
                      </p>
                      
                      <div className="mt-30">
                        <div className="card-2-bottom">
                          <div className="row">
                            <div className="col-6">
                              <Link 
                                href={`/meetings/job/${job._id}`}
                                className="btn btn-tags-sm btn-outline-primary w-100"
                                style={{ transition: 'all 0.3s ease' }}
                              >
                                View Meetings
                              </Link>
                            </div>
                            <div className="col-6">
                              <Link 
                                href={`/meetings/schedule/${job._id}`}
                                className="btn btn-tags-sm btn-primary w-100"
                                style={{ transition: 'all 0.3s ease' }}
                              >
                                Schedule
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style jsx>{`
        .card-grid-2 {
          transition: all 0.25s cubic-bezier(0.02, 0.01, 0.47, 1);
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
          border-radius: 10px;
          overflow: hidden;
          padding: 20px;
        }
        
        .card-grid-2:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        .card-time.text-primary {
          color: #0d6efd !important;
          font-weight: 600;
        }
        
        .card-time.text-success {
          color: #198754 !important;
          font-weight: 600;
        }
        
        .card-time.text-warning {
          color: #ffc107 !important;
          font-weight: 600;
        }
        
        .card-grid-2-image-rd.online {
          border: none;
          margin-right: 15px;
        }
        
        .btn-tags-sm {
          transition: all 0.3s ease;
          border-radius: 8px;
          font-weight: 600;
          padding: 10px 15px;
        }
        
        .btn-tags-sm:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 12px rgba(0,0,0,0.12);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .card-grid-2:hover .card-time span {
          transform: scale(1.1);
        }
      `}</style>
    </Layout>
  );
}
