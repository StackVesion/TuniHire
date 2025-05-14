import React, { useState, useEffect } from 'react';
import Layout from '../../../components/layout/Layout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import axios from 'axios';
import { getCurrentUser, getToken, createAuthAxios } from '../../../utils/authUtils';
import LoadingScreen from '../../../components/LoadingScreen';

export default function JobMeetingsPage() {
  const [meetings, setMeetings] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { id } = router.query;
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

    // Only proceed if we have the job ID
    if (!id) return;

    // Fetch job and its meetings
    const fetchJobAndMeetings = async () => {
      try {
        setLoading(true);
        
        // Fetch job details using authAxios
        const jobResponse = await authAxios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/jobs/${id}`
        );
        
        // Fetch meetings for this job
        const meetingsResponse = await authAxios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/meetings/job/${id}`
        );
        
        setJob(jobResponse.data.data);
        setMeetings(meetingsResponse.data.data);
      } catch (error) {
        console.error('Error fetching job and meetings:', error);
        setError('Failed to load meetings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobAndMeetings();
  }, [id, router]);

  // Format date function
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to update meeting status
  const handleStatusUpdate = async (meetingId, newStatus) => {
    try {
      // Update meeting status using authAxios
      await authAxios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/meetings/${meetingId}/status`,
        { status: newStatus }
      );
      
      // Update UI
      setMeetings(meetings.map(meeting => 
        meeting._id === meetingId ? { ...meeting, status: newStatus } : meeting
      ));
      
      // Show success message
      const Swal = (await import('sweetalert2')).default;
      await Swal.fire({
        title: 'Success',
        text: 'Meeting status updated successfully',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error updating meeting status:', error);
      
      // Show error message
      const Swal = (await import('sweetalert2')).default;
      await Swal.fire({
        title: 'Error',
        text: 'Failed to update meeting status',
        icon: 'error',
      });
    }
  };

  // Function to add room URL to meeting
  const handleAddRoomUrl = async (meetingId) => {
    try {
      // Show input dialog
      const Swal = (await import('sweetalert2')).default;
      const { value: roomUrl } = await Swal.fire({
        title: 'Add Meeting Room URL',
        input: 'url',
        inputLabel: 'Enter the virtual meeting room URL',
        inputPlaceholder: 'https://meet.google.com/abc-defg-hij',
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value) {
            return 'Please enter a valid URL';
          }
        }
      });
      
      if (!roomUrl) return;
      
      // Update meeting room URL using authAxios
      await authAxios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/meetings/${meetingId}/room`,
        { roomUrl }
      );
      
      // Update UI
      setMeetings(meetings.map(meeting => 
        meeting._id === meetingId ? { ...meeting, roomUrl } : meeting
      ));
      
      // Show success message
      await Swal.fire({
        title: 'Success',
        text: 'Meeting room URL added successfully',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error adding room URL:', error);
      
      // Show error message
      const Swal = (await import('sweetalert2')).default;
      await Swal.fire({
        title: 'Error',
        text: 'Failed to add meeting room URL',
        icon: 'error',
      });
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  // Status badge style function
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-soft-primary text-primary';
      case 'Completed':
        return 'bg-soft-success text-success';
      case 'Cancelled':
        return 'bg-soft-danger text-danger';
      case 'Pending':
        return 'bg-soft-warning text-warning';
      default:
        return 'bg-soft-secondary text-secondary';
    }
  };

  return (
    <Layout>
      <div>
        <div className="box-heading">
          <div className="box-title">
            <h3 className="mb-35">Meetings for {job?.title}</h3>
          </div>
          <div className="box-breadcrumb">
            <div className="breadcrumbs">
              <ul>
                <li><Link href="/">Dashboard</Link></li>
                <li><Link href="/meetings">Meetings</Link></li>
                <li>{job?.title}</li>
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
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h6 className="color-text-paragraph-2">
                        {meetings.length} {meetings.length === 1 ? 'Meeting' : 'Meetings'} for this job
                      </h6>
                      <Link 
                        href={`/meetings/schedule/${id}`}
                        className="btn btn-default btn-brand icon-tick"
                      >
                        Schedule New Meeting
                      </Link>
                    </div>
                    
                    {error && (
                      <div className="alert alert-danger" role="alert">
                        {error}
                      </div>
                    )}
                    
                    {!loading && meetings.length === 0 ? (
                      <div className="text-center py-5">
                        <img
                          src="/assets/imgs/page/dashboard/no-data.svg"
                          alt="No meetings found"
                          className="mb-3"
                          style={{ maxWidth: '150px' }}
                        />
                        <h6 className="color-text-paragraph-2">
                          No meetings scheduled for this job yet
                        </h6>
                        <Link className="btn btn-primary mt-4" href={`/meetings/schedule/${id}`}>
                          Schedule a Meeting
                        </Link>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-striped">
                          <thead>
                            <tr>
                              <th>Candidate</th>
                              <th>Meeting Date</th>
                              <th>Created</th>
                              <th>Status</th>
                              <th>Virtual Room</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {meetings.map((meeting) => (
                              <tr key={meeting._id}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div className="employer-image mr-15">
                                      <img 
                                        src={meeting.candidate_id?.profilePicture || "/assets/imgs/page/candidates/user.png"} 
                                        alt={`${meeting.candidate_id?.firstName} ${meeting.candidate_id?.lastName}`}
                                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                      />
                                    </div>
                                    <div>
                                      <h6 className="mb-0">{meeting.candidate_id?.firstName} {meeting.candidate_id?.lastName}</h6>
                                      <p className="text-muted small mb-0">{meeting.candidate_id?.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td>{formatDate(meeting.meetingDate)}</td>
                                <td>{formatDate(meeting.dateCreation)}</td>
                                <td>
                                  <span className={`badge ${getStatusBadgeClass(meeting.status)}`}>
                                    {meeting.status}
                                  </span>
                                </td>
                                <td>
                                  {meeting.roomUrl ? (
                                    <a 
                                      href={meeting.roomUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="btn btn-sm btn-outline-primary"
                                    >
                                      Join Meeting
                                    </a>
                                  ) : (
                                    <button 
                                      onClick={() => handleAddRoomUrl(meeting._id)}
                                      className="btn btn-sm btn-outline-secondary"
                                    >
                                      Add Room URL
                                    </button>
                                  )}
                                </td>
                                <td>
                                  <div className="dropdown">
                                    <button 
                                      className="btn btn-outline-primary dropdown-toggle btn-sm" 
                                      type="button" 
                                      id={`dropdownMenu-${meeting._id}`} 
                                      data-bs-toggle="dropdown" 
                                      aria-expanded="false"
                                    >
                                      Actions
                                    </button>
                                    <ul className="dropdown-menu" aria-labelledby={`dropdownMenu-${meeting._id}`}>
                                      <li>
                                        <button 
                                          className="dropdown-item" 
                                          onClick={() => handleStatusUpdate(meeting._id, 'Completed')}
                                        >
                                          Mark as Completed
                                        </button>
                                      </li>
                                      <li>
                                        <button 
                                          className="dropdown-item" 
                                          onClick={() => handleStatusUpdate(meeting._id, 'Cancelled')}
                                        >
                                          Cancel Meeting
                                        </button>
                                      </li>
                                      <li>
                                        <button 
                                          className="dropdown-item" 
                                          onClick={() => handleStatusUpdate(meeting._id, 'Scheduled')}
                                        >
                                          Reschedule
                                        </button>
                                      </li>
                                      <li><hr className="dropdown-divider" /></li>
                                      <li>
                                        <button 
                                          className="dropdown-item" 
                                          onClick={() => handleAddRoomUrl(meeting._id)}
                                        >
                                          Update Meeting URL
                                        </button>
                                      </li>
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
          </div>
        </div>
      </div>
    </Layout>
  );
}
