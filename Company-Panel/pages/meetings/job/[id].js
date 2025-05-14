import React, { useState, useEffect } from 'react';
import Layout from '../../../components/layout/Layout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getCurrentUser, getToken, createAuthAxios } from '../../../utils/authUtils';
import LoadingScreen from '../../../components/LoadingScreen';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarPlus, faSearch, faFilter, faSortAmountDown, faClock, faVideo, faCheckCircle, faTimesCircle, faCalendarAlt, faMagic, faFileAlt, faEdit, faPlusCircle } from '@fortawesome/free-solid-svg-icons';

export default function JobMeetingsPage() {
  const [meetings, setMeetings] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortOption, setSortOption] = useState('name-asc');
  const [autoScheduleLoading, setAutoScheduleLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const authAxios = createAuthAxios();
  const [applicantsWithMeetings, setApplicantsWithMeetings] = useState([]);
  const [filteredApplicants, setFilteredApplicants] = useState([]);
  
  // WhiteTest related states
  const [whiteTest, setWhiteTest] = useState(null);
  const [showWhiteTestDialog, setShowWhiteTestDialog] = useState(false);
  const [whiteTestContent, setWhiteTestContent] = useState('');
  const [isEditingWhiteTest, setIsEditingWhiteTest] = useState(false);
  const [generatingWhiteTest, setGeneratingWhiteTest] = useState(false);

  // Fetch job, applicants and meetings - defined outside useEffect to be accessible to other functions
  const fetchJobAndMeetings = async () => {
    try {
      setLoading(true);
      
      try {
        // Fetch job details using authAxios
        const jobResponse = await authAxios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/jobs/${id}`
        );
        
        // Handle different response formats from API
        let jobData;
        if (jobResponse.data && jobResponse.data.data) {
          jobData = jobResponse.data.data;
        } else if (jobResponse.data) {
          jobData = jobResponse.data;
        } else {
          throw new Error('Invalid job response format');
        }
        
        setJob(jobData);
        console.log('Job details loaded:', jobData.title);
        
        // Fetch all applicants for this job
        const applicantsResponse = await authAxios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/jobs/${id}/applicants`
        );
        
        // Process applicants data
        let applicantsData = [];
        if (applicantsResponse.data && applicantsResponse.data.data) {
          applicantsData = applicantsResponse.data.data;
          setApplicants(applicantsData);
          console.log(`Found ${applicantsData.length} applicants for this job`);
        } else if (applicantsResponse.data) {
          applicantsData = applicantsResponse.data;
          setApplicants(applicantsData);
          console.log(`Found ${applicantsData.length} applicants for this job`);
        } else {
          console.warn('No applicants found or unexpected response format');
          console.log('Applicants Response:', applicantsResponse.data);
          setApplicants([]);
        }
        
        // Fetch meetings for this job
        const meetingsResponse = await authAxios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/meetings/job/${id}`
        );
        
        // Process meetings data
        let meetingsData = [];
        if (meetingsResponse.data && meetingsResponse.data.data) {
          meetingsData = meetingsResponse.data.data;
          setMeetings(meetingsData);
          console.log(`Found ${meetingsResponse.data.count} meetings for this job`);
        } else {
          console.warn('No meetings found or unexpected response format');
          console.log('Meetings Response:', meetingsResponse.data);
          setMeetings([]);
        }
        
        // Combine applicants with their meetings status
        const combinedData = applicantsData.map(applicant => {
          // Try to find if this applicant already has a meeting
          const existingMeeting = meetingsData.find(
            meeting => meeting.candidate_id._id === applicant._id || 
                      meeting.candidate_id === applicant._id
          );
          
          return {
            applicant: applicant,
            meeting: existingMeeting || null,
            hasScheduledMeeting: Boolean(existingMeeting)
          };
        });
        
        setApplicantsWithMeetings(combinedData);
        console.log('Combined applicants with meetings data:', combinedData.length);
        
        // If the job data includes company information, store it for reference
        if (jobData.companyId) {
          console.log('Company data found:', jobData.companyId.name || jobData.companyId);
        }
        
        // Fetch white test for this job if it exists
        try {
          const whiteTestResponse = await authAxios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/whitetests/job/${id}`
          );
          
          if (whiteTestResponse.data && whiteTestResponse.data.success) {
            console.log('White test found:', whiteTestResponse.data.data);
            setWhiteTest(whiteTestResponse.data.data);
            setWhiteTestContent(whiteTestResponse.data.data.content);
          } else {
            console.log('No white test found for this job');
            setWhiteTest(null);
            setWhiteTestContent('');
          }
        } catch (whiteTestError) {
          // If 404, it means no white test exists yet (which is normal)
          if (whiteTestError.response && whiteTestError.response.status === 404) {
            setWhiteTest(null);
            setWhiteTestContent('');
            console.log('No white test exists for this job yet');
          } else {
            console.error('Error fetching white test:', whiteTestError);
          }
        }
        
      } catch (err) {
        console.error('Error fetching job, applicants or meetings:', err);
        if (err.response && err.response.status === 404) {
          setError('Job post not found.');
        } else if (err.response && err.response.status === 403) {
          setError('You do not have permission to access this job information.');
        } else {
          setError('Failed to load job information: ' + (err.response?.data?.message || err.message));
        }
      }
    } catch (error) {
      console.error('Error in main fetchJobAndMeetings:', error);
      setError('Failed to load job information. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

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
    
    // Call the fetchJobAndMeetings function
    fetchJobAndMeetings();
  }, [id, router]);

  // Format date function
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Function to check if a date is a weekend
  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
  };
  
  // Function to check if a date is between business hours (9 AM to 5 PM)
  const isBusinessHours = (date) => {
    const hours = date.getHours();
    return hours >= 9 && hours <= 17;
  };
  
  // Function to find the next available meeting slot
  const findNextAvailableSlot = (startDate, existingMeetings, durationInMinutes = 60) => {
    let currentDate = new Date(startDate);
    
    // Ensure we're starting with a valid date
    if (!currentDate || isNaN(currentDate.getTime())) {
      currentDate = new Date();
    }
    
    // Set initial time to 9 AM
    currentDate.setHours(9, 0, 0, 0);
    
    // If it's already past 5 PM, move to next day
    if (currentDate.getHours() >= 17) {
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(9, 0, 0, 0);
    }
    
    // Skip to next business day if it's a weekend
    while (isWeekend(currentDate)) {
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(9, 0, 0, 0);
    }
    
    let slotFound = false;
    let maxTries = 100; // Safety mechanism to prevent infinite loops
    
    while (!slotFound && maxTries > 0) {
      // Check if this slot conflicts with any existing meetings
      const slotEndTime = new Date(currentDate.getTime() + durationInMinutes * 60000);
      const hasConflict = existingMeetings.some(meeting => {
        if (!meeting.meetingDate) return false;
        
        const meetingStart = new Date(meeting.meetingDate);
        const meetingEnd = new Date(meetingStart.getTime() + durationInMinutes * 60000);
        
        // Check if the time ranges overlap
        return (currentDate < meetingEnd && slotEndTime > meetingStart);
      });
      
      // If there's no conflict, we found a slot
      if (!hasConflict) {
        slotFound = true;
      } else {
        // Move to the next slot (increment by duration)
        currentDate = new Date(currentDate.getTime() + durationInMinutes * 60000);
        
        // If we've moved past 5 PM, go to the next day at 9 AM
        if (currentDate.getHours() >= 17) {
          currentDate.setDate(currentDate.getDate() + 1);
          currentDate.setHours(9, 0, 0, 0);
          
          // Skip weekends
          while (isWeekend(currentDate)) {
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      }
      
      maxTries--;
    }
    
    return slotFound ? currentDate : null;
  };
  
  // Auto-schedule meetings for all applicants without meetings
  const handleAutoSchedule = async () => {
    try {
      const Swal = (await import('sweetalert2')).default;
      
      // Confirm before proceeding
      const confirmResult = await Swal.fire({
        title: 'Auto-Schedule Meetings',
        html: `This will automatically schedule meetings for <b>${applicantsWithMeetings.filter(a => !a.hasScheduledMeeting).length}</b> candidates without meetings.<br><br>Meetings will be scheduled on weekdays between 9 AM and 5 PM with no conflicts.<br><br>Do you want to continue?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Schedule Meetings',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#3085d6',
      });
      
      if (!confirmResult.isConfirmed) return;
      
      setAutoScheduleLoading(true);
      
      // Get applicants without meetings
      const applicantsWithoutMeetings = applicantsWithMeetings.filter(a => !a.hasScheduledMeeting);
      
      if (applicantsWithoutMeetings.length === 0) {
        setAutoScheduleLoading(false);
        await Swal.fire('No Applicants', 'All applicants already have scheduled meetings', 'info');
        return;
      }
      
      // Get existing meetings for this job to avoid conflicts
      const existingMeetings = meetings;
      
      // Start scheduling from tomorrow
      let startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      
      // Track successful creations
      let scheduledCount = 0;
      let failedCount = 0;
      
      // Loop through each applicant and schedule a meeting
      for (const item of applicantsWithoutMeetings) {
        const { applicant } = item;
        
        // Find the next available slot
        const meetingDate = findNextAvailableSlot(startDate, existingMeetings);
        
        if (!meetingDate) {
          console.error('Could not find an available meeting slot');
          failedCount++;
          continue;
        }
        
        try {
          // Create a new meeting
          const response = await authAxios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/meetings`,
            {
              job_id: id,
              candidate_id: applicant._id,
              hr_id: user._id, // Adding the HR user ID (current user)
              meetingDate: meetingDate,
              status: 'Scheduled'
            }
          );
          
          // Add to existing meetings to avoid future conflicts
          if (response.data && response.data.data) {
            existingMeetings.push(response.data.data);
            scheduledCount++;
            
            // Update the next start date to be after this meeting
            startDate = new Date(meetingDate.getTime() + 60 * 60000); // 60 minutes later
          }
        } catch (error) {
          console.error('Error scheduling meeting for candidate:', applicant._id, error);
          failedCount++;
        }
      }
      
      // Refresh the data
      await fetchJobAndMeetings();
      
      // Show completion message
      // Reload the current page to refresh data
      router.reload();
      
      await Swal.fire({
        title: 'Auto-Scheduling Complete',
        html: `Successfully scheduled <b>${scheduledCount}</b> meetings.<br>${failedCount > 0 ? `Failed to schedule <b>${failedCount}</b> meetings.` : ''}`,
        icon: scheduledCount > 0 ? 'success' : 'warning',
      });
      
    } catch (error) {
      console.error('Error in auto-scheduling:', error);
      const Swal = (await import('sweetalert2')).default;
      await Swal.fire('Error', 'Failed to auto-schedule meetings: ' + error.message, 'error');
    } finally {
      setAutoScheduleLoading(false);
    }
  };
  
  // Filter and search applicants
  useEffect(() => {
    if (!applicantsWithMeetings.length) {
      setFilteredApplicants([]);
      return;
    }
    
    // Filter applicants based on selected filter
    let filtered = [...applicantsWithMeetings];
    
    if (selectedFilter === 'with-meetings') {
      filtered = filtered.filter(item => item.hasScheduledMeeting);
    } else if (selectedFilter === 'without-meetings') {
      filtered = filtered.filter(item => !item.hasScheduledMeeting);
    } else if (selectedFilter === 'scheduled') {
      filtered = filtered.filter(item => item.hasScheduledMeeting && item.meeting.status === 'Scheduled');
    } else if (selectedFilter === 'completed') {
      filtered = filtered.filter(item => item.hasScheduledMeeting && item.meeting.status === 'Completed');
    } else if (selectedFilter === 'cancelled') {
      filtered = filtered.filter(item => item.hasScheduledMeeting && item.meeting.status === 'Cancelled');
    }
    
    // Apply search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        const { applicant } = item;
        return (
          applicant.firstName?.toLowerCase().includes(term) ||
          applicant.lastName?.toLowerCase().includes(term) ||
          applicant.email?.toLowerCase().includes(term) ||
          `${applicant.firstName} ${applicant.lastName}`.toLowerCase().includes(term)
        );
      });
    }
    
    // Sort results
    filtered.sort((a, b) => {
      const { applicant: appA } = a;
      const { applicant: appB } = b;
      
      switch (sortOption) {
        case 'name-asc':
          return `${appA.firstName} ${appA.lastName}`.localeCompare(`${appB.firstName} ${appB.lastName}`);
        case 'name-desc':
          return `${appB.firstName} ${appB.lastName}`.localeCompare(`${appA.firstName} ${appA.lastName}`);
        case 'date-asc':
          return new Date(appA.createdAt || 0) - new Date(appB.createdAt || 0);
        case 'date-desc':
          return new Date(appB.createdAt || 0) - new Date(appA.createdAt || 0);
        default:
          return 0;
      }
    });
    
    setFilteredApplicants(filtered);
  }, [applicantsWithMeetings, selectedFilter, searchTerm, sortOption]);

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

  // Function to schedule a new meeting
  const handleScheduleMeeting = (candidateId) => {
    router.push(`/meetings/schedule/${id}?candidate=${candidateId}`);
  };
  
  // Function to generate a white test using AI
  const handleGenerateWhiteTest = async () => {
    try {
      setGeneratingWhiteTest(true);
      console.log('Generating white test for job ID:', id);
      
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
      console.log(`Using API URL: ${baseUrl}/api/whitetests/generate/${id}`);
      
      const response = await authAxios.get(
        `${baseUrl}/api/whitetests/generate/${id}`
      );
      
      if (response.data && response.data.success) {
        setWhiteTestContent(response.data.data.generatedContent);
        console.log('White test generated successfully');
        // Show success message
        const Swal = (await import('sweetalert2')).default;
        await Swal.fire({
          title: 'Success!',
          text: 'White test was successfully generated using AI',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        console.error('Failed to generate white test:', response.data);
        const Swal = (await import('sweetalert2')).default;
        await Swal.fire({
          title: 'Generation Failed',
          text: 'Could not generate the white test. Please try again.',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('Error generating white test:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      console.log('Error details:', errorMsg);
      
      const Swal = (await import('sweetalert2')).default;
      await Swal.fire({
        title: 'Error',
        html: `Failed to generate white test.<br>Error: ${errorMsg}<br><br>Please ensure your API key is configured correctly.`,
        icon: 'error'
      });
    } finally {
      setGeneratingWhiteTest(false);
    }
  };
  
  // Function to save a white test
  const handleSaveWhiteTest = async () => {
    try {
      if (!whiteTestContent.trim()) {
        alert('White test content cannot be empty');
        return;
      }
      
      if (whiteTest && whiteTest._id) {
        // Update existing white test
        const response = await authAxios.put(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/whitetests/${whiteTest._id}`,
          { content: whiteTestContent }
        );
        
        if (response.data && response.data.success) {
          setWhiteTest(response.data.data);
          setShowWhiteTestDialog(false);
          alert('White test updated successfully');
        } else {
          alert('Failed to update white test');
        }
      } else {
        // Create new white test
        const response = await authAxios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/whitetests`,
          {
            job_id: id,
            content: whiteTestContent
          }
        );
        
        if (response.data && response.data.success) {
          setWhiteTest(response.data.data);
          setShowWhiteTestDialog(false);
          alert('White test created successfully');
        } else {
          alert('Failed to create white test');
        }
      }
    } catch (error) {
      console.error('Error saving white test:', error);
      alert('Error saving white test: ' + (error.response?.data?.message || error.message));
    }
  };
  
  // Function to open the white test dialog in edit mode
  const handleEditWhiteTest = () => {
    setIsEditingWhiteTest(true);
    setShowWhiteTestDialog(true);
  };
  
  // Function to open the white test dialog in create mode
  const handleOpenWhiteTestDialog = () => {
    setIsEditingWhiteTest(false);
    setShowWhiteTestDialog(true);
  };



// Filter and search applicants
useEffect(() => {
  if (!applicantsWithMeetings.length) {
    setFilteredApplicants([]);
    return;
  }
  
  // Filter applicants based on selected filter
  let filtered = [...applicantsWithMeetings];
  
  if (selectedFilter === 'with-meetings') {
    filtered = filtered.filter(item => item.hasScheduledMeeting);
  } else if (selectedFilter === 'without-meetings') {
    filtered = filtered.filter(item => !item.hasScheduledMeeting);
  } else if (selectedFilter === 'scheduled') {
    filtered = filtered.filter(item => item.hasScheduledMeeting && item.meeting.status === 'Scheduled');
  } else if (selectedFilter === 'completed') {
    filtered = filtered.filter(item => item.hasScheduledMeeting && item.meeting.status === 'Completed');
  } else if (selectedFilter === 'cancelled') {
    filtered = filtered.filter(item => item.hasScheduledMeeting && item.meeting.status === 'Cancelled');
  }
  
  // Apply search term
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(item => {
      const { applicant } = item;
      return (
        applicant.firstName?.toLowerCase().includes(term) ||
        applicant.lastName?.toLowerCase().includes(term) ||
        applicant.email?.toLowerCase().includes(term) ||
        `${applicant.firstName} ${applicant.lastName}`.toLowerCase().includes(term)
      );
    });
  }
  
  // Sort results
  filtered.sort((a, b) => {
    const { applicant: appA } = a;
    const { applicant: appB } = b;
    
    switch (sortOption) {
      case 'name-asc':
        return `${appA.firstName} ${appA.lastName}`.localeCompare(`${appB.firstName} ${appB.lastName}`);
      case 'name-desc':
        return `${appB.firstName} ${appB.lastName}`.localeCompare(`${appA.firstName} ${appA.lastName}`);
      case 'date-asc':
        return new Date(appA.createdAt || 0) - new Date(appB.createdAt || 0);
      case 'date-desc':
        return new Date(appB.createdAt || 0) - new Date(appA.createdAt || 0);
      default:
        return 0;
    }
  });
  
  setFilteredApplicants(filtered);
}, [applicantsWithMeetings, selectedFilter, searchTerm, sortOption]);







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
        </div>
        <div className="d-flex flex-wrap gap-2 my-3">
          {!whiteTest ? (
            <button 
              onClick={handleOpenWhiteTestDialog} 
              className="btn btn-primary" 
              title="Generate a white test for this job">
              <FontAwesomeIcon icon={faFileAlt} className="me-2" />
              Generate White Test
            </button>
          ) : (
            <button 
              onClick={handleEditWhiteTest} 
              className="btn btn-outline-primary" 
              title="Edit existing white test">
              <FontAwesomeIcon icon={faEdit} className="me-2" />
              Edit White Test
            </button>
          )}
        </div>
      </div>
      
      {/* White Test Modal */}
      {showWhiteTestDialog && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{isEditingWhiteTest ? 'Edit White Test' : 'Create White Test'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowWhiteTestDialog(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="whiteTestContent" className="form-label fw-bold">Test Content</label>
                  <div className="d-flex mb-2 justify-content-end">
                    <button 
                      className="btn btn-sm btn-primary" 
                      onClick={handleGenerateWhiteTest}
                      disabled={generatingWhiteTest}>
                      <FontAwesomeIcon icon={faMagic} className="me-1" />
                      {generatingWhiteTest ? 'Generating...' : 'Generate with AI'}
                    </button>
                  </div>
                  <textarea 
                    id="whiteTestContent"
                    className="form-control" 
                    rows="15" 
                    value={whiteTestContent}
                    onChange={(e) => setWhiteTestContent(e.target.value)}
                    placeholder="Enter white test content or generate it using AI"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowWhiteTestDialog(false)}>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleSaveWhiteTest}
                  disabled={!whiteTestContent.trim()}>
                  Save White Test
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
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
        
        {autoScheduleLoading && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
            <div className="card p-4 text-center">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <h5 className="mb-0">Auto-scheduling meetings...</h5>
              <p className="text-muted">This may take a moment</p>
            </div>
          </div>
        )}
        <div className="row">
          <div className="col-lg-12">
            <div className="section-box">
              <div className="container">
                <div className="panel-white mb-30">
                  <div className="box-padding">
                    {/* Search and Filter Controls */}
                    <div className="search-filter-controls mb-4 p-3 bg-light rounded animate__animated animate__fadeIn">
                      <div className="row align-items-center">
                        <div className="col-lg-5 mb-2 mb-lg-0">
                          <div className="input-group">
                            <span className="input-group-text bg-white border-end-0">
                              <FontAwesomeIcon icon={faSearch} className="text-muted" />
                            </span>
                            <input 
                              type="text" 
                              className="form-control border-start-0" 
                              placeholder="Search candidates by name or email..." 
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div className="col-lg-3 mb-2 mb-lg-0">
                          <div className="input-group">
                            <span className="input-group-text bg-white border-end-0">
                              <FontAwesomeIcon icon={faFilter} className="text-muted" />
                            </span>
                            <select 
                              className="form-select border-start-0" 
                              value={selectedFilter}
                              onChange={(e) => setSelectedFilter(e.target.value)}
                            >
                              <option value="all">All Applicants</option>
                              <option value="with-meetings">With Meetings</option>
                              <option value="without-meetings">Without Meetings</option>
                              <option value="scheduled">Scheduled Meetings</option>
                              <option value="completed">Completed Meetings</option>
                              <option value="cancelled">Cancelled Meetings</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="col-lg-2 mb-2 mb-lg-0">
                          <div className="input-group">
                            <span className="input-group-text bg-white border-end-0">
                              <FontAwesomeIcon icon={faSortAmountDown} className="text-muted" />
                            </span>
                            <select 
                              className="form-select border-start-0" 
                              value={sortOption}
                              onChange={(e) => setSortOption(e.target.value)}
                            >
                              <option value="name-asc">Name (A-Z)</option>
                              <option value="name-desc">Name (Z-A)</option>
                              <option value="date-asc">Date (Oldest first)</option>
                              <option value="date-desc">Date (Newest first)</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="col-lg-2 text-lg-end d-flex justify-content-between align-items-center">
                          <div className="btn-group ms-lg-auto">
                            <button 
                              type="button" 
                              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-primary'}`}
                              onClick={() => setViewMode('grid')}
                            >
                              <i className="fas fa-th-large"></i>
                            </button>
                            <button 
                              type="button" 
                              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
                              onClick={() => setViewMode('list')}
                            >
                              <i className="fas fa-list"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="row mt-3">
                        <div className="col-12 d-flex justify-content-between align-items-center">
                          <div>
                            <span className="badge bg-light text-dark me-2">
                              <FontAwesomeIcon icon={faFilter} className="me-1" />
                              {filteredApplicants.length} {filteredApplicants.length === 1 ? 'Applicant' : 'Applicants'} found
                            </span>
                            
                            {searchTerm && (
                              <span className="badge bg-info text-white me-2">
                                <FontAwesomeIcon icon={faSearch} className="me-1" />
                                Search: "{searchTerm}"
                                <button 
                                  className="btn-close btn-close-white ms-2" 
                                  style={{ fontSize: '0.5rem' }}
                                  onClick={() => setSearchTerm('')}
                                ></button>
                              </span>
                            )}
                            
                            {selectedFilter !== 'all' && (
                              <span className="badge bg-primary text-white me-2">
                                Filter: {selectedFilter.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                <button 
                                  className="btn-close btn-close-white ms-2" 
                                  style={{ fontSize: '0.5rem' }}
                                  onClick={() => setSelectedFilter('all')}
                                ></button>
                              </span>
                            )}
                          </div>
                          
                          <button 
                            className={`btn ${whiteTest ? 'btn-primary' : 'btn-secondary'} ${whiteTest ? 'animate__animated animate__pulse animate__infinite' : ''}`}
                            style={{ animationDuration: '2s' }}
                            onClick={handleAutoSchedule}
                            disabled={autoScheduleLoading || applicantsWithMeetings.filter(a => !a.hasScheduledMeeting).length === 0 || !whiteTest}
                            title={!whiteTest ? 'You must create a White Test first before scheduling meetings' : 'Automatically schedule meetings for all applicants'}
                          >
                            <FontAwesomeIcon icon={faMagic} className="me-2" />
                            {whiteTest ? `Auto-Schedule ${applicantsWithMeetings.filter(a => !a.hasScheduledMeeting).length > 0 ? `(${applicantsWithMeetings.filter(a => !a.hasScheduledMeeting).length})` : ''}` : 'Create White Test First'}
                          </button>
                        </div>
                      </div>
                    </div>
                    {error && (
                      <div className="alert alert-danger" role="alert">
                        {error}
                      </div>
                    )}
                    
                    {!loading && filteredApplicants.length === 0 ? (
                      <div className="text-center py-5 animate__animated animate__fadeIn">
                        <div className="mb-3 text-center text-muted">
                          <FontAwesomeIcon 
                            icon={faSearch} 
                            style={{ fontSize: '60px', opacity: 0.5 }} 
                            className="mb-3" 
                          />
                        </div>
                        <h6 className="color-text-paragraph-2">
                          {searchTerm || selectedFilter !== 'all' ? 
                            'No applicants match your search criteria' : 
                            'No applicants found for this job yet'}
                        </h6>
                        {searchTerm || selectedFilter !== 'all' ? (
                          <button 
                            className="btn btn-outline-primary mt-4"
                            onClick={() => {
                              setSearchTerm('');
                              setSelectedFilter('all');
                            }}
                          >
                            <FontAwesomeIcon icon={faFilter} className="me-2" />
                            Clear Filters
                          </button>
                        ) : (
                          <Link className="btn btn-primary mt-4" href="/my-job-grid">
                            Back to Jobs
                          </Link>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* Grid View */}
                        {viewMode === 'grid' && (
                          <div className="row">
                            {filteredApplicants.map((item, index) => {
                              const { applicant, meeting, hasScheduledMeeting } = item;
                              return (
                                <div 
                                  key={applicant._id} 
                                  className="col-xl-4 col-lg-6 col-md-6 col-sm-12 mb-4"
                                >
                                  <div 
                                    className={`card applicant-card animate__animated animate__fadeIn ${hasScheduledMeeting ? 'has-meeting' : ''}`}
                                    style={{ 
                                      animationDelay: `${index * 0.05}s`,
                                      borderTop: hasScheduledMeeting ? '4px solid #0d6efd' : '4px solid #e9ecef'
                                    }}
                                  >
                                    <div className="card-body">
                                      {/* Top row - Photo and status */}
                                      <div className="d-flex justify-content-between mb-3">
                                        <div className="d-flex align-items-center">
                                          <div className="employer-image me-3 position-relative">
                                            <img 
                                              src={applicant.profilePicture || "/assets/imgs/page/candidates/user.png"} 
                                              alt={`${applicant.firstName} ${applicant.lastName}`}
                                              style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
                                              className="border shadow-sm"
                                            />
                                            {hasScheduledMeeting && (
                                              <div className="status-indicator position-absolute bottom-0 end-0">
                                                <span 
                                                  className={`badge ${getStatusBadgeClass(meeting.status)} rounded-circle p-2 border border-white shadow-sm`}
                                                  data-bs-toggle="tooltip" 
                                                  data-bs-placement="top" 
                                                  title={`Status: ${meeting.status}`}
                                                >
                                                  <FontAwesomeIcon 
                                                    icon={meeting.status === 'Completed' ? faCheckCircle : meeting.status === 'Cancelled' ? faTimesCircle : faCalendarAlt} 
                                                    size="xs"
                                                  />
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                          <div>
                                            <h5 className="mb-1 font-weight-bold">{applicant.firstName} {applicant.lastName}</h5>
                                            <p className="text-muted small mb-0">
                                              <i className="far fa-envelope me-1"></i> {applicant.email}
                                            </p>
                                            <p className="text-muted small mb-0">
                                              <i className="far fa-calendar-alt me-1"></i> Applied: {formatDate(applicant.createdAt || new Date()).split(',')[0]}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Meeting details or schedule button */}
                                      <div className={`meeting-section p-3 mt-3 rounded ${hasScheduledMeeting ? 'bg-light border-start border-4 border-primary' : 'bg-soft-light'}`}>
                                        {hasScheduledMeeting ? (
                                          <>
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                              <h6 className="mb-0 text-primary">
                                                <FontAwesomeIcon icon={faClock} className="me-2" />
                                                Meeting Details
                                              </h6>
                                              <span className={`badge ${getStatusBadgeClass(meeting.status)}`}>
                                                {meeting.status}
                                              </span>
                                            </div>
                                            <div className="meeting-info mb-2">
                                              <small className="text-muted d-block">Schedule:</small>
                                              <p className="mb-1 font-weight-medium">{formatDate(meeting.meetingDate)}</p>
                                            </div>
                                            <div className="d-flex gap-2 mt-3">
                                              {meeting.roomUrl ? (
                                                <a 
                                                  href={meeting.roomUrl} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer"
                                                  className="btn btn-sm btn-outline-primary flex-grow-1"
                                                >
                                                  <FontAwesomeIcon icon={faVideo} className="me-2" />
                                                  Join Meeting
                                                </a>
                                              ) : (
                                                <button 
                                                  onClick={() => handleAddRoomUrl(meeting._id)}
                                                  className="btn btn-sm btn-outline-primary flex-grow-1"
                                                >
                                                  <FontAwesomeIcon icon={faVideo} className="me-2" />
                                                  Add Room URL
                                                </button>
                                              )}
                                              <div className="dropdown">
                                                <button 
                                                  className="btn btn-sm btn-outline-secondary dropdown-toggle" 
                                                  type="button" 
                                                  id={`dropdownMenu-${meeting._id}`} 
                                                  data-bs-toggle="dropdown" 
                                                  aria-expanded="false"
                                                >
                                                  Actions
                                                </button>
                                                <ul className="dropdown-menu shadow-sm" aria-labelledby={`dropdownMenu-${meeting._id}`}>
                                                  <li>
                                                    <button 
                                                      className="dropdown-item" 
                                                      onClick={() => handleStatusUpdate(meeting._id, 'Completed')}
                                                    >
                                                      <FontAwesomeIcon icon={faCheckCircle} className="me-2 text-success" />
                                                      Mark as Completed
                                                    </button>
                                                  </li>
                                                  <li>
                                                    <button 
                                                      className="dropdown-item" 
                                                      onClick={() => handleStatusUpdate(meeting._id, 'Cancelled')}
                                                    >
                                                      <FontAwesomeIcon icon={faTimesCircle} className="me-2 text-danger" />
                                                      Cancel Meeting
                                                    </button>
                                                  </li>
                                                  <li>
                                                    <button 
                                                      className="dropdown-item" 
                                                      onClick={() => handleStatusUpdate(meeting._id, 'Scheduled')}
                                                    >
                                                      <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                                                      Reschedule
                                                    </button>
                                                  </li>
                                                </ul>
                                              </div>
                                            </div>
                                          </>
                                        ) : (
                                          <div className="text-center py-2">
                                            <p className="mb-3">No meeting scheduled yet</p>
                                            <button 
                                              onClick={() => handleScheduleMeeting(applicant._id)}
                                              className={`btn ${whiteTest ? 'btn-primary' : 'btn-secondary'} w-100 ${whiteTest ? 'animate__animated animate__pulse animate__infinite' : ''}`}
                                              style={{ animationDuration: '2s' }}
                                              disabled={!whiteTest}
                                              title={!whiteTest ? 'You must create a White Test first before scheduling meetings' : 'Schedule a meeting with this candidate'}
                                            >
                                              <FontAwesomeIcon icon={faCalendarPlus} className="me-2" />
                                              {whiteTest ? 'Schedule Meeting' : 'Create White Test First'}
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* List View */}
                        {viewMode === 'list' && (
                          <div className="table-responsive">
                            <table className="table table-hover">
                              <thead>
                                <tr>
                                  <th>Candidate</th>
                                  <th>Application Date</th>
                                  <th>Status</th>
                                  <th>Meeting</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredApplicants.map((item) => {
                                  const { applicant, meeting, hasScheduledMeeting } = item;
                                  return (
                                    <tr key={applicant._id} className={`animate__animated animate__fadeIn ${hasScheduledMeeting ? 'has-meeting' : ''}`}>
                                      <td>
                                        <div className="d-flex align-items-center">
                                          <div className="employer-image me-3">
                                            <img 
                                              src={applicant.profilePicture || "/assets/imgs/page/candidates/user.png"} 
                                              alt={`${applicant.firstName} ${applicant.lastName}`}
                                              style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                                              className="shadow-sm"
                                            />
                                          </div>
                                          <div>
                                            <h6 className="mb-1">{applicant.firstName} {applicant.lastName}</h6>
                                            <p className="text-muted small mb-0">{applicant.email}</p>
                                          </div>
                                        </div>
                                      </td>
                                      <td>{formatDate(applicant.createdAt || new Date()).split(',')[0]}</td>
                                      <td>
                                        {hasScheduledMeeting ? (
                                          <span className={`badge ${getStatusBadgeClass(meeting.status)}`}>
                                            {meeting.status}
                                          </span>
                                        ) : (
                                          <span className="badge bg-soft-secondary text-secondary">No Meeting</span>
                                        )}
                                      </td>
                                      <td>
                                        {hasScheduledMeeting ? (
                                          <div className="meeting-info">
                                            <div className="mb-1"><strong>Date:</strong> {formatDate(meeting.meetingDate)}</div>
                                            {meeting.roomUrl ? (
                                              <a 
                                                href={meeting.roomUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="btn btn-sm btn-outline-primary"
                                              >
                                                <FontAwesomeIcon icon={faVideo} className="me-1" /> Join Meeting
                                              </a>
                                            ) : (
                                              <button 
                                                onClick={() => handleAddRoomUrl(meeting._id)}
                                                className="btn btn-sm btn-outline-secondary"
                                              >
                                                <FontAwesomeIcon icon={faVideo} className="me-1" /> Add Room URL
                                              </button>
                                            )}
                                          </div>
                                        ) : (
                                          <button 
                                            onClick={() => handleScheduleMeeting(applicant._id)}
                                            className="btn btn-sm btn-primary animate__animated animate__pulse animate__infinite"
                                            style={{ animationDuration: '2s' }}
                                          >
                                            <FontAwesomeIcon icon={faCalendarPlus} className="me-1" /> Schedule Meeting
                                          </button>
                                        )}
                                      </td>
                                      <td>
                                        {hasScheduledMeeting ? (
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
                                            <ul className="dropdown-menu shadow-sm" aria-labelledby={`dropdownMenu-${meeting._id}`}>
                                              <li>
                                                <button 
                                                  className="dropdown-item" 
                                                  onClick={() => handleStatusUpdate(meeting._id, 'Completed')}
                                                >
                                                  <FontAwesomeIcon icon={faCheckCircle} className="me-2 text-success" />
                                                  Mark as Completed
                                                </button>
                                              </li>
                                              <li>
                                                <button 
                                                  className="dropdown-item" 
                                                  onClick={() => handleStatusUpdate(meeting._id, 'Cancelled')}
                                                >
                                                  <FontAwesomeIcon icon={faTimesCircle} className="me-2 text-danger" />
                                                  Cancel Meeting
                                                </button>
                                              </li>
                                              <li>
                                                <button 
                                                  className="dropdown-item" 
                                                  onClick={() => handleStatusUpdate(meeting._id, 'Scheduled')}
                                                >
                                                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                                                  Reschedule
                                                </button>
                                              </li>
                                              <li><hr className="dropdown-divider" /></li>
                                              <li>
                                                <button 
                                                  className="dropdown-item" 
                                                  onClick={() => handleAddRoomUrl(meeting._id)}
                                                >
                                                  <FontAwesomeIcon icon={faVideo} className="me-2 text-info" />
                                                  Update Meeting URL
                                                </button>
                                              </li>
                                            </ul>
                                          </div>
                                        ) : (
                                          <button 
                                            onClick={() => handleScheduleMeeting(applicant._id)}
                                            className={`btn btn-sm ${whiteTest ? 'btn-outline-primary' : 'btn-outline-secondary'}`}
                                            disabled={!whiteTest}
                                            title={!whiteTest ? 'You must create a White Test first before scheduling meetings' : 'Schedule a meeting with this candidate'}
                                          >
                                            <FontAwesomeIcon icon={faCalendarPlus} className="me-1" /> 
                                            {whiteTest ? 'Schedule' : 'Create Test First'}
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        /* Card Styling */
        .applicant-card {
          transition: all 0.3s ease;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 5px 15px rgba(0,0,0,0.05);
          height: 100%;
          position: relative;
        }
        
        .applicant-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.1);
        }
        
        .has-meeting {
          background-color: rgba(238, 249, 255, 0.5) !important;
        }
        
        .meeting-info {
          border-left: 3px solid #0d6efd;
          padding-left: 10px;
        }
        
        .meeting-section {
          transition: all 0.3s ease;
        }
        
        .meeting-section:hover {
          box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }
        
        .bg-soft-light {
          background-color: #f8f9fa;
        }
        
        /* Table Styling */
        table tr {
          transition: all 0.3s ease;
        }
        
        table tr:hover {
          background-color: rgba(238, 249, 255, 0.5) !important;
          box-shadow: 0 3px 10px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }
        
        /* Badge Styling */
        .badge {
          font-size: 12px;
          padding: 6px 10px;
          border-radius: 20px;
          transition: all 0.3s ease;
        }
        
        .badge:hover {
          transform: scale(1.05);
        }
        
        .badge.bg-soft-primary {
          background-color: rgba(13, 110, 253, 0.15);
          color: #0d6efd;
        }
        
        .badge.bg-soft-success {
          background-color: rgba(25, 135, 84, 0.15);
          color: #198754;
        }
        
        .badge.bg-soft-warning {
          background-color: rgba(255, 193, 7, 0.15);
          color: #ffc107;
        }
        
        .badge.bg-soft-danger {
          background-color: rgba(220, 53, 69, 0.15);
          color: #dc3545;
        }
        
        .badge.bg-soft-secondary {
          background-color: rgba(108, 117, 125, 0.15);
          color: #6c757d;
        }
        
        /* Button Styling */
        .btn {
          transition: all 0.3s ease;
          border-radius: 8px;
        }
        
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .btn-primary {
          background-color: #0d6efd;
          border-color: #0d6efd;
        }
        
        .dropdown-item {
          transition: all 0.2s ease;
          border-radius: 4px;
          margin: 2px 0;
        }
        
        .dropdown-item:hover {
          background-color: rgba(13, 110, 253, 0.1);
          transform: translateX(3px);
        }
        
        .dropdown-menu {
          border-radius: 8px;
          border: none;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          padding: 8px;
        }
        
        /* Animation Keyframes */
        @keyframes shadow-pulse {
          0% {
            box-shadow: 0 0 0 0px rgba(13, 110, 253, 0.3);
          }
          100% {
            box-shadow: 0 0 0 10px rgba(13, 110, 253, 0);
          }
        }
        
        .animate__pulse {
          animation: shadow-pulse 1.5s infinite;
        }
        
        /* Filter Controls Styling */
        .search-filter-controls {
          border-radius: 12px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
        }
        
        .search-filter-controls:hover {
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .input-group {
          box-shadow: 0 3px 10px rgba(0,0,0,0.03);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .form-control:focus, .form-select:focus {
          box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.15);
          border-color: #0d6efd;
        }
        
        /* Animation classes */
        .animate__animated {
          animation-duration: 0.5s;
        }
        
        .btn-group .btn {
          overflow: hidden;
          position: relative;
        }
        
        .btn-group .btn::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 5px;
          height: 5px;
          background: rgba(255, 255, 255, 0.5);
          opacity: 0;
          border-radius: 100%;
          transform: scale(1, 1) translate(-50%);
          transform-origin: 50% 50%;
        }
        
        .btn-group .btn:focus:not(:active)::after {
          animation: ripple 1s ease-out;
        }
        
        @keyframes ripple {
          0% {
            transform: scale(0, 0);
            opacity: 0.5;
          }
          100% {
            transform: scale(20, 20);
            opacity: 0;
          }
        }
      `}</style>
    </div>
    </Layout>
  );
}
