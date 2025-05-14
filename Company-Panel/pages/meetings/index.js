import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import axios from 'axios';
import { getCurrentUser, getToken, createAuthAxios } from '../../utils/authUtils';
import LoadingScreen from '../../components/LoadingScreen';

export default function MeetingsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const [user, setUser] = useState(null);
  const authAxios = createAuthAxios();

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
    
    // Fetch jobs associated with this HR's company
    const fetchJobs = async () => {
      try {
        setLoading(true);
        
        // First get the user's company - same approach as my-job-grid
        const companyResponse = await authAxios.get('/api/companies/user/my-company');
        
        // Check if we received valid company data
        if (!companyResponse.data || !companyResponse.data.company || !companyResponse.data.company._id) {
          console.error('Company data structure:', companyResponse.data);
          setError('No company found for your account. Please create a company first.');
          setLoading(false);
          return;
        }
        
        console.log('Found company:', companyResponse.data.company.name, 'with ID:', companyResponse.data.company._id);
        const companyId = companyResponse.data.company._id;
        
        // Get all jobs for this company
        const jobsResponse = await authAxios.get(`/api/jobs/company/${companyId}`);
        
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
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setError('Failed to load jobs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobs();
  }, [router]);

  // Format date function
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Layout>
      <div>
        <div className="box-heading">
          <div className="box-title">
            <h3 className="mb-35">Meetings Management</h3>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-12">
            <div className="section-box">
              <div className="container">
                <div className="panel-white mb-30">
                  <div className="box-padding">
                    <h6 className="color-text-paragraph-2">
                      View and manage meetings for your job postings
                    </h6>
                    
                    {error && (
                      <div className="alert alert-danger" role="alert">
                        {error}
                      </div>
                    )}
                    
                    {!loading && jobs.length === 0 ? (
                      <div className="text-center py-5">
                        <img
                          src="/assets/imgs/page/dashboard/no-data.svg"
                          alt="No jobs found"
                          className="mb-3"
                          style={{ maxWidth: '150px' }}
                        />
                        <h6 className="color-text-paragraph-2">
                          You don't have any job postings yet
                        </h6>
                        <Link className="btn btn-primary mt-4" href="/job-post">
                          Create a Job Post
                        </Link>
                      </div>
                    ) : (
                      <div className="row">
                        {jobs.map((job) => (
                          <div key={job._id} className="col-xl-4 col-lg-6 col-md-6">
                            <div className="card-grid-2 hover-up">
                              <div className="card-grid-2-image-left">
                                <div className="card-grid-2-image-rd online">
                                  <Link href={`/job-details/${job._id}`}>
                                    <img
                                      src="/assets/imgs/page/job/job-logo.png"
                                      alt="Job logo"
                                    />
                                  </Link>
                                </div>
                                <div className="card-grid-2-image-main">
                                  <h5 className="font-md">
                                    <Link href={`/job-details/${job._id}`}>{job.title}</Link>
                                  </h5>
                                  <div className="rate-reviews-small">
                                    <span>
                                      <img
                                        src="/assets/imgs/page/dashboard/location.svg"
                                        alt="location"
                                      />
                                      {job.location}
                                    </span>
                                    <span className="ml-20">
                                      <img
                                        src="/assets/imgs/template/icons/time.svg"
                                        alt="time"
                                      />
                                      Posted: {formatDate(job.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="card-block-info">
                                <div className="d-flex justify-content-between mb-3">
                                  <span className={`card-briefcase ${job.workplaceType?.toLowerCase()}`}>
                                    {job.workplaceType}
                                  </span>
                                  <span className="card-time">
                                    {job.meetingsCount} {job.meetingsCount === 1 ? 'Meeting' : 'Meetings'}
                                  </span>
                                </div>
                                <p className="font-sm color-text-paragraph mt-10">
                                  {job.description.length > 100
                                    ? `${job.description.substring(0, 100)}...`
                                    : job.description}
                                </p>
                                <div className="card-2-bottom mt-20">
                                  <div className="row">
                                    <div className="col-lg-7 col-md-7 text-left">
                                      <Link
                                        className="btn btn-apply-now"
                                        href={`/meetings/job/${job._id}`}
                                      >
                                        View Meetings
                                      </Link>
                                    </div>
                                    <div className="col-lg-5 col-md-5 text-right">
                                      <Link
                                        className="btn btn-apply-now btn-apply"
                                        href={`/meetings/schedule/${job._id}`}
                                      >
                                        Schedule
                                      </Link>
                                    </div>
                                  </div>
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
          </div>
        </div>
      </div>
    </Layout>
  );
}
