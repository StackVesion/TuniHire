import React, { useState, useEffect } from 'react';
import Layout from '../../../components/layout/Layout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import axios from 'axios';
import { getCurrentUser, getToken, createAuthAxios } from '../../../utils/authUtils';
import LoadingScreen from '../../../components/LoadingScreen';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function ScheduleMeetingPage() {
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { id } = router.query; // job ID
  const [user, setUser] = useState(null);
  const authAxios = createAuthAxios();
  
  // Form state
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [meetingDate, setMeetingDate] = useState(new Date());
  const [meetingTime, setMeetingTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

    // Only proceed if we have the job ID
    if (!id) return;

    // Fetch job and candidates
    const fetchJobAndCandidates = async () => {
      try {
        setLoading(true);
        
        try {
          // Fetch job details with detailed information
          const jobResponse = await authAxios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/jobs/${id}`
          );
          
          if (!jobResponse.data) {
            setError('Job information not found.');
            setLoading(false);
            return;
          }
          
          setJob(jobResponse.data);
          console.log('Job details loaded:', jobResponse.data.title);
          
          // Fetch candidates who applied to this job
          const applicantsResponse = await authAxios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/jobs/${id}/applicants`
          );
          
          // Check if we have valid candidates data
          if (applicantsResponse.data && applicantsResponse.data.data) {
            setCandidates(applicantsResponse.data.data);
            console.log(`Found ${applicantsResponse.data.data.length} candidates for this job`);
          } else {
            console.log('No candidates found or unexpected response format');
            console.log('Response:', applicantsResponse.data);
            setCandidates([]);
          }
        } catch (err) {
          console.error('Error fetching job or candidates:', err);
          if (err.response && err.response.status === 404) {
            setError('Job post or candidate information not found.');
          } else if (err.response && err.response.status === 403) {
            setError('You do not have permission to access this job information.');
          } else {
            setError('Failed to load job information: ' + (err.response?.data?.message || err.message));
          }
        }
      } catch (error) {
        console.error('Error in fetchJobAndCandidates:', error);
        setError('Failed to load job information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobAndCandidates();
  }, [id, router]);

  // Format date function
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCandidate) {
      const Swal = (await import('sweetalert2')).default;
      Swal.fire({
        title: 'Error',
        text: 'Please select a candidate',
        icon: 'error',
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Combine date and time for meeting date
      const [hours, minutes] = meetingTime.split(':').map(Number);
      const meetingDateTime = new Date(meetingDate);
      meetingDateTime.setHours(hours, minutes, 0, 0);
      
      // Create meeting using authAxios
      const response = await authAxios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/meetings`,
        {
          job_id: id,
          candidate_id: selectedCandidate,
          hr_id: user._id,
          meetingDate: meetingDateTime,
          notes
        }
      );
      
      // Show success message
      const Swal = (await import('sweetalert2')).default;
      await Swal.fire({
        title: 'Success',
        text: 'Meeting scheduled successfully',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      
      // Redirect to job meetings page
      router.push(`/meetings/job/${id}`);
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      
      // Show error message
      const Swal = (await import('sweetalert2')).default;
      await Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Failed to schedule meeting',
        icon: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Layout>
      <div>
        <div className="box-heading">
          <div className="box-title">
            <h3 className="mb-35">Schedule Meeting - {job?.title}</h3>
          </div>
          <div className="box-breadcrumb">
            <div className="breadcrumbs">
              <ul>
                <li><Link href="/">Dashboard</Link></li>
                <li><Link href="/meetings">Meetings</Link></li>
                <li><Link href={`/meetings/job/${id}`}>{job?.title}</Link></li>
                <li>Schedule Meeting</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-12">
            <div className="section-box">
              <div className="container">
                <div className="panel-white mb-30">
                  <div className="box-padding">
                    <h6 className="color-text-paragraph-2">
                      Schedule a new meeting for {job?.title}
                    </h6>
                    
                    {error && (
                      <div className="alert alert-danger" role="alert">
                        {error}
                      </div>
                    )}
                    
                    {!loading && candidates.length === 0 ? (
                      <div className="text-center py-5">
                        <img
                          src="/assets/imgs/page/dashboard/no-data.svg"
                          alt="No candidates found"
                          className="mb-3"
                          style={{ maxWidth: '150px' }}
                        />
                        <h6 className="color-text-paragraph-2">
                          No candidates have applied to this job yet
                        </h6>
                        <Link className="btn btn-primary mt-4" href={`/meetings/job/${id}`}>
                          Back to Meetings
                        </Link>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit}>
                        <div className="row">
                          <div className="col-lg-6">
                            <div className="form-group">
                              <label className="font-sm color-text-mutted mb-10">Select Candidate*</label>
                              <select 
                                className="form-control"
                                value={selectedCandidate}
                                onChange={(e) => setSelectedCandidate(e.target.value)}
                                required
                              >
                                <option value="">Select a candidate</option>
                                {candidates.map((candidate) => (
                                  <option key={candidate._id} value={candidate._id}>
                                    {candidate.firstName} {candidate.lastName} ({candidate.email})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="col-lg-6">
                            <div className="form-group">
                              <label className="font-sm color-text-mutted mb-10">Meeting Date*</label>
                              <DatePicker
                                selected={meetingDate}
                                onChange={(date) => setMeetingDate(date)}
                                className="form-control"
                                minDate={new Date()}
                                required
                              />
                            </div>
                          </div>
                          <div className="col-lg-6">
                            <div className="form-group">
                              <label className="font-sm color-text-mutted mb-10">Meeting Time*</label>
                              <input
                                type="time"
                                className="form-control"
                                value={meetingTime}
                                onChange={(e) => setMeetingTime(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                          <div className="col-lg-12">
                            <div className="form-group">
                              <label className="font-sm color-text-mutted mb-10">Notes (Optional)</label>
                              <textarea
                                className="form-control"
                                rows="4"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add any additional notes or agenda items for the meeting"
                              ></textarea>
                            </div>
                          </div>
                          <div className="col-lg-12 mt-15">
                            <div className="form-group">
                              <button 
                                type="submit" 
                                className="btn btn-default btn-brand icon-tick" 
                                disabled={submitting}
                              >
                                {submitting ? 'Scheduling...' : 'Schedule Meeting'}
                              </button>
                              <Link 
                                href={`/meetings/job/${id}`} 
                                className="btn btn-outline-primary ml-20"
                              >
                                Cancel
                              </Link>
                            </div>
                          </div>
                        </div>
                      </form>
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
