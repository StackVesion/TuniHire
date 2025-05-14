import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import LoadingScreen from '../../components/LoadingScreen';
import { getCurrentUser, createAuthAxios } from '../../utils/authUtils';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faThLarge, 
  faCheckCircle, 
  faTimesCircle, 
  faClock, 
  faUser, 
  faBriefcase 
} from '@fortawesome/free-solid-svg-icons';

// Set up the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

export default function MeetingsPage() {
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [allMeetings, setAllMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('grid'); // 'grid' or 'calendar'
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
    
    // Function to fetch jobs and meetings
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // First get the user's company
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
        
        // For each job, fetch meeting counts using Promise.all
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
        
        // Collect all meetings for the calendar view
        const allMeetingsArray = jobsWithMeetings.reduce((acc, job) => {
          // Map each meeting to include job information
          const formattedMeetings = job.meetings.map(meeting => ({
            ...meeting,
            jobTitle: job.title,
            jobId: job._id,
            // Format for the Calendar component
            id: meeting._id,
            title: `${meeting.candidate_id?.firstName || 'Candidate'} ${meeting.candidate_id?.lastName || ''} - ${job.title}`,
            start: new Date(meeting.meetingDate),
            end: new Date(new Date(meeting.meetingDate).getTime() + 60*60*1000), // 1 hour duration
            status: meeting.status,
            candidateName: `${meeting.candidate_id?.firstName || 'Candidate'} ${meeting.candidate_id?.lastName || ''}`,
            candidateEmail: meeting.candidate_id?.email || 'No email',
            candidateId: meeting.candidate_id?._id || meeting.candidate_id,
            notes: meeting.notes || 'No notes'
          }));
          return [...acc, ...formattedMeetings];
        }, []);
        
        setAllMeetings(allMeetingsArray);
        console.log('All meetings for calendar:', allMeetingsArray.length);
      } catch (error) {
        console.error('Error fetching data:', error);
        
        if (error.response && error.response.status === 404) {
          setError('You don\'t have a company yet. Please create one first.');
        } else if (error.response && error.response.status === 400) {
          setError('Authentication error. Please login again.');
          router.push('/login');
        } else {
          setError('Failed to load data: ' + (error.response?.data?.message || error.message));
        }
      } finally {
        setLoading(false);
      }
    };

    // Call the fetch function
    fetchData();
  }, [router]);

  // Helper function to get workplace badge style
  const getWorkplaceStyle = (type) => {
    switch (type) {
      case 'Remote':
        return 'bg-primary text-white';
      case 'On-site':
        return 'bg-warning text-white';
      case 'Hybrid':
        return 'bg-success text-white';
      default:
        return 'bg-light text-dark';
    }
  };
  
  // Helper function to get color based on meeting count
  const getMeetingCountClass = (count) => {
    if (count >= 5) return 'text-success';
    if (count >= 1) return 'text-primary';
    return 'text-warning';
  };

  // Helper function to get event style based on meeting status
  const getEventStyle = (event) => {
    switch (event.status) {
      case 'Completed':
        return {
          backgroundColor: '#28a745', // green
          borderColor: '#218838',
          color: 'white'
        };
      case 'Scheduled':
        return {
          backgroundColor: '#007bff', // blue
          borderColor: '#0069d9',
          color: 'white'
        };
      case 'Cancelled':
        return {
          backgroundColor: '#dc3545', // red
          borderColor: '#c82333',
          color: 'white'
        };
      case 'Pending':
        return {
          backgroundColor: '#ffc107', // yellow
          borderColor: '#e0a800',
          color: 'black'
        };
      default:
        return {
          backgroundColor: '#6c757d', // gray
          borderColor: '#5a6268',
          color: 'white'
        };
    }
  };

  // Custom event component for the calendar
  const EventComponent = ({ event }) => {
    return (
      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <div style={{ fontWeight: 'bold' }}>{event.title}</div>
        <div style={{ fontSize: '0.85em' }}>
          <FontAwesomeIcon icon={faClock} className="mr-1" /> {moment(event.start).format('h:mm A')}
        </div>
        <div style={{ fontSize: '0.85em' }}>
          <FontAwesomeIcon icon={faUser} className="mr-1" /> {event.candidateName}
        </div>
      </div>
    );
  };

  if (loading) {
    return <LoadingScreen message="Loading meetings..." />;
  }

  // Function to handle click on calendar event
  const handleEventClick = (event) => {
    console.log('Clicked event:', event);
    alert(`Meeting Details:\nCandidate: ${event.candidateName}\nJob: ${event.jobTitle}\nStatus: ${event.status}\nTime: ${moment(event.start).format('MMMM Do YYYY, h:mm A')}`);
  };

  // Function to customize the calendar event component
  const eventStyleGetter = (event) => {
    return {
      style: getEventStyle(event)
    };
  };

  return (
    <Layout>
      <div className="box-content">
        <div className="box-heading">
          <div className="box-title">
            <h3 className="mb-35">Meetings Dashboard</h3>
          </div>
        </div>
      
        <div className="row mb-4">
          <div className="col-lg-12 d-flex justify-content-end">
            <div className="view-toggle-buttons">
              <button 
                className={`btn ${activeView === 'grid' ? 'btn-primary' : 'btn-outline-primary'} me-2`}
                onClick={() => setActiveView('grid')}
              >
                <FontAwesomeIcon icon={faThLarge} className="me-2" /> Grid View
              </button>
              <button 
                className={`btn ${activeView === 'calendar' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setActiveView('calendar')}
              >
                <FontAwesomeIcon icon={faCalendarAlt} className="me-2" /> Calendar View
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        
        {activeView === 'calendar' ? (
          <div className="container">
            <div className="section-box">
              <div className="container">
                <div className="panel-white mb-30">
                  <div className="box-padding">
                    <h6 className="color-text-paragraph-2 mb-4">All scheduled meetings across your job postings. Click on an event for more details.</h6>
                    
                    <div className="calendar-container" style={{ height: '700px' }}>
                      <Calendar
                        localizer={localizer}
                        events={allMeetings}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        eventPropGetter={eventStyleGetter}
                        onSelectEvent={handleEventClick}
                        views={['month', 'week', 'day', 'agenda']}
                        components={{
                          event: EventComponent,
                        }}
                        popup
                        popupOffset={30}
                        tooltipAccessor={null}
                        formats={{
                          timeGutterFormat: (date) => moment(date).format('h A'),
                          dayFormat: (date) => moment(date).format('ddd D'),
                          dayHeaderFormat: (date) => moment(date).format('dddd MMM D, YYYY')
                        }}
                      />
                    </div>
                    
                    <div className="calendar-legend mt-4 d-flex justify-content-center flex-wrap">
                      <div className="legend-item d-flex align-items-center me-4 mb-2">
                        <div style={{ 
                          width: '20px', 
                          height: '20px', 
                          borderRadius: '4px', 
                          backgroundColor: '#007bff',
                          marginRight: '8px'
                        }}></div>
                        <span>Scheduled</span>
                      </div>
                      <div className="legend-item d-flex align-items-center me-4 mb-2">
                        <div style={{ 
                          width: '20px', 
                          height: '20px', 
                          borderRadius: '4px', 
                          backgroundColor: '#28a745',
                          marginRight: '8px'
                        }}></div>
                        <span>Completed</span>
                      </div>
                      <div className="legend-item d-flex align-items-center me-4 mb-2">
                        <div style={{ 
                          width: '20px', 
                          height: '20px', 
                          borderRadius: '4px', 
                          backgroundColor: '#dc3545',
                          marginRight: '8px'
                        }}></div>
                        <span>Cancelled</span>
                      </div>
                      <div className="legend-item d-flex align-items-center mb-2">
                        <div style={{ 
                          width: '20px', 
                          height: '20px', 
                          borderRadius: '4px', 
                          backgroundColor: '#ffc107',
                          marginRight: '8px'
                        }}></div>
                        <span>Pending</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
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
                  <div className="alert alert-info">
                    <h5>No job postings found</h5>
                    <p>You need to create job postings before you can schedule meetings.</p>
                  </div>
                </div>
              ) : (
                jobs.map((job) => {
                  const workplaceType = job.workplaceType || 'On-site';
                  const meetingCountClass = getMeetingCountClass(job.meetingsCount);
                  
                  return (
                    <div className="col-xl-4 col-lg-4 col-md-6 col-sm-12 col-12" key={job._id}>
                      <div className="card-grid-2 hover-up">
                        <div className="card-grid-2-image-left">
                          <div className="card-grid-2-image-rd online">
                            <Link href={`/company-profile/${job.companyId?._id || job.companyId}`}>
                              <img
                                src={job.companyId?.logo || '/assets/imgs/page/dashboard/avata1.png'}
                                alt="company logo"
                              />
                            </Link>
                          </div>
                          <div className="card-profile pt-10">
                            <h5>
                              <Link href={`/job/${job._id}`} legacyBehavior>
                                <a className="name-job">{job.title}</a>
                              </Link>
                            </h5>
                            <span className="text-muted">{job.companyId?.name || 'Company name not available'}</span>
                          </div>
                        </div>
                        
                        <div className="card-block-info">
                          <div className="d-flex justify-content-between mb-3">
                            <span
                              style={{
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
        )}

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
      </div>
    </Layout>
  );
}
