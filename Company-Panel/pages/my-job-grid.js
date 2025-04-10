import GridView from "@/components/elements/GridView"
import ListView from "@/components/elements/ListView"
import Pagination from "@/components/filter/Pagination"
import ShowSelect from "@/components/filter/ShowSelect"
import Layout from "@/components/layout/Layout"
import BrandSlider from "@/components/slider/BrandSlider"
import { useEffect, useState } from "react"
import axios from "axios"
import { useRouter } from "next/router"
import Swal from "sweetalert2"

export default function JobGrid() {
    const [sortType, setSortType] = useState('title')
    const [sortedData, setSortedData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    let [currentPage, setCurrentPage] = useState(1)
    let showLimit = 4,
        showPagination = 3

    let [pagination, setPagination] = useState([])
    let [limit, setLimit] = useState(showLimit)
    let [pages, setPages] = useState(1)
    
    const router = useRouter()

    // Fetch jobs from the backend
    const fetchJobs = async () => {
        try {
            setLoading(true)
            // Get token from localStorage
            const token = localStorage.getItem('token')
            
            if (!token) {
                router.push('/page-signin')
                return
            }

            // Directly get company by looking up the company where the user is the HR
            try {
                // Get the current user details
                const userResponse = await axios.get('http://localhost:5000/api/users/me', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                
                // Get the user's company directly
                const companyResponse = await axios.get('http://localhost:5000/api/companies/user/my-company', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                
                // The API returns the company inside a 'company' property
                const companyData = companyResponse.data.company || companyResponse.data
                
                if (!companyData || !companyData._id) {
                    console.error('Company data structure:', companyResponse.data)
                    setError('No company found for your account. Please contact an administrator.')
                    setLoading(false)
                    return
                }
                
                console.log('Found company:', companyData.name, 'with ID:', companyData._id)
                const companyId = companyData._id
                
                // Get all jobs for this company
                const response = await axios.get(`http://localhost:5000/api/jobs/company/${companyId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                
                console.log('Found jobs:', response.data.length)
                processJobData(response.data)
            } catch (err) {
                console.error('Error fetching user or company data:', err)
                setError('Failed to load company data. Please try again.')
                setLoading(false)
            }
        } catch (err) {
            console.error('Error fetching jobs:', err)
            setError('Failed to load jobs. Please try again.')
            setLoading(false)
        }
    }
    
    // Process job data and apply sorting
    const processJobData = (jobData) => {
        // Transform API data to match the expected format for the UI components
        const transformedData = jobData.map(job => ({
            id: job._id,
            title: job.title,
            description: job.description,
            category: 'Development',
            location: job.location || 'Remote',
            salary: job.salaryRange || '$0',
            company: { name: job.companyId?.name || 'Facebook' },
            workplaceType: job.workplaceType || 'Remote',
            requirements: job.requirements || [],
            date: new Date(job.createdAt).toISOString(),
            image: '/assets/imgs/brands/brand-1.png'
        }))
        
        sortJobData(transformedData, sortType)
        setLoading(false)
    }
    
    // Sort job data based on sort type
    const sortJobData = (data, type) => {
        const types = {
            title: 'title',
            date: 'date',
            salary: 'salary'
        }
        const sortProperty = types[type]
        const sorted = [...data].sort((a, b) => {
            if (sortProperty === 'date') {
                return new Date(b[sortProperty]) - new Date(a[sortProperty])
            } else {
                return a[sortProperty] > b[sortProperty] ? 1 : -1
            }
        })
        setSortedData(sorted)
    }

    useEffect(() => {
        fetchJobs()
    }, [])
    
    useEffect(() => {
        cratePagination()
        if (sortedData.length > 0) {
            sortJobData(sortedData, sortType)
        }
    }, [limit, sortType, sortedData.length]);

    const cratePagination = () => {
        // set pagination
        let arr = new Array(Math.ceil(sortedData.length / limit))
            .fill()
            .map((_, idx) => idx + 1);

        setPagination(arr);
        setPages(Math.ceil(sortedData.length / limit));
    };
    
    // Handle delete job
    const handleDeleteJob = (jobId) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const token = localStorage.getItem('token')
                    if (!token) {
                        router.push('/page-signin')
                        return
                    }
                    
                    await axios.delete(`http://localhost:5000/api/jobs/${jobId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    
                    Swal.fire(
                        'Deleted!',
                        'Your job has been deleted.',
                        'success'
                    )
                    
                    // Refresh job list
                    fetchJobs()
                } catch (err) {
                    console.error('Error deleting job:', err)
                    Swal.fire(
                        'Error!',
                        'Failed to delete the job.',
                        'error'
                    )
                }
            }
        })
    };

    const startIndex = currentPage * limit - limit;
    const endIndex = startIndex + limit;

    const getPaginatedProducts = sortedData.slice(startIndex, endIndex);


    let start = Math.floor((currentPage - 1) / showPagination) * showPagination;
    let end = start + showPagination;
    const getPaginationGroup = pagination.slice(start, end);

    const next = () => {
        setCurrentPage((page) => page + 1);
    };

    const prev = () => {
        setCurrentPage((page) => page - 1);
    };

    const handleActive = (item) => {
        setCurrentPage(item);
    };

    const selectChange = (e) => {
        setLimit(Number(e.target.value));
        setPages(Math.ceil(sortedData.length / Number(e.target.value)));
    };

    // List view and grid view tab

    const [activeTab, setActiveTab] = useState(1);
    const handleTab = (index) => {
        // Always use grid view (index 1)
        setActiveTab(1);
    };

    return (
        <>
            <Layout breadcrumbTitle="My Jobs" breadcrumbActive="My Jobs">
                <div className="col-lg-12">
                    <div className="section-box">
                        <div className="container">
                            <div className="panel-white mb-30">
                                <div className="box-padding">
                                    <div className="box-filters-job">
                                        <div className="row mb-30">
                                            <div className="col-xl-6 col-lg-5">
                                                {getPaginationGroup.length <= 0 ? null : (
                                                    <span className="font-sm text-showing color-text-paragraph">
                                                        Showing {currentPage} of {pages} Pages
                                                    </span>
                                                )}
                                            </div>

                                            <div className="col-xl-6 col-lg-7 text-lg-end mt-sm-15">
                                                <div className="d-flex justify-content-end">
                                                    <div className="mr-10"><span className="text-sortby">Show:</span>
                                                        <ShowSelect
                                                            selectChange={selectChange}
                                                            showLimit={showLimit}
                                                        />
                                                    </div>
                                                    <div className="box2"><span className="text-sortby">Sort by:</span>
                                                        <select onChange={e => setSortType(e.target.value)}>
                                                            <option value="title">Title</option>
                                                            <option value="date">Date</option>
                                                            <option value="salary">Salary</option>
                                                        </select>
                                                    </div>
                                                    {/* View type selector removed - always showing grid view */}
                                                </div>
                                            </div>
                                        </div>

                                        {loading ? (
                                            <div className="text-center py-5">
                                                <div className="spinner-border text-primary" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                <p className="mt-2">Loading jobs...</p>
                                            </div>
                                        ) : error ? (
                                            <div className="text-center py-5">
                                                <div className="alert alert-danger">{error}</div>
                                            </div>
                                        ) : sortedData.length === 0 ? (
                                            <div className="text-center py-5">
                                                <div className="alert alert-info">No jobs found. Click "Post a Job" to create your first job listing.</div>
                                            </div>
                                        ) : (
                                            <>
                                                {activeTab === 1 &&
                                                    <div className="row">
                                                        {getPaginatedProducts.map((job, i) => (
                                                            <div
                                                                className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12"
                                                                key={i}
                                                            >
                                                                <div className="card-grid-2 hover-up" style={{boxShadow: '0 5px 15px rgba(0,0,0,0.1)', borderRadius: '10px', border: '1px solid #eee', marginBottom: '20px'}}>
                                                                    <div className="card-grid-2-image-left">
                                                                        <div className="image-box">
                                                                            <img src="/assets/imgs/brands/brand-1.png" alt="jobBox" />
                                                                        </div>
                                                                        <div className="right-info">
                                                                            <a className="name-job" href={`/job-details/${job.id}`} title={job.title} style={{color: '#3C65F5', fontWeight: 'bold'}}>
                                                                                {job.title.length > 30 ? `${job.title.substring(0, 30)}...` : job.title}
                                                                            </a>
                                                                            <div className="company-info mt-5">
                                                                                <span><i className="fi-rr-building mr-5" style={{color: '#3C65F5'}}></i>{job.company?.name || 'Facebook'}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="card-block-info">
                                                                        <div className="mt-5 d-flex justify-content-between">
                                                                            <span className="card-briefcase"><i className="fi-rr-briefcase mr-5"></i>{job.workplaceType || 'Remote'}</span>
                                                                            <span className="card-time">
                                                                                <i className="fi-rr-clock mr-5"></i>{new Date(job.date).toLocaleDateString()}
                                                                            </span>
                                                                        </div>
                                                                        <p className="font-sm color-text-paragraph mt-10" title={job.description}>
                                                                            {job.description.length > 75 ? `${job.description.substring(0, 75)}...` : job.description}
                                                                        </p>
                                                                        <div className="mt-15">
                                                                            <div className="d-flex align-items-center">
                                                                                <i className="fi-rr-marker mr-5 text-mutted" style={{color: '#F58A3C'}}></i>
                                                                                <span className="font-sm color-text-mutted">{job.location}</span>
                                                                            </div>
                                                                            <div className="d-flex align-items-center mt-10">
                                                                                <i className="fi-rr-dollar mr-5 text-mutted" style={{color: '#38B653'}}></i>
                                                                                <span className="font-sm color-text-mutted">{job.salary}</span>
                                                                            </div>
                                                                            <div className="d-flex align-items-center mt-10">
                                                                                <i className="fi-rr-list-check mr-5 text-mutted" style={{color: '#8E74FF'}}></i>
                                                                                <span className="font-sm color-text-mutted">{job.requirements ? (job.requirements.length > 3 ? `${job.requirements.slice(0, 3).join(', ')}...` : job.requirements.join(', ')) : ''}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="card-2-bottom mt-20">
                                                                            <div className="row">
                                                                                <div className="col-6">
                                                                                    <a href={`/edit-job?id=${job.id}`} className="btn btn-primary-outline btn-sm" style={{borderRadius: '50px', border: '2px solid #3C65F5', padding: '8px 20px', transition: 'all 0.3s'}} title="Edit job">
                                                                                        <i className="fi-rr-edit" style={{color: '#3C65F5'}}></i>
                                                                                        <span style={{marginLeft: '5px', color: '#3C65F5', fontWeight: 'bold'}}>Edit</span>
                                                                                    </a>
                                                                                </div>
                                                                                <div className="col-6 text-end">
                                                                                    <button
                                                                                        className="btn btn-danger-outline btn-sm" 
                                                                                        style={{borderRadius: '50px', border: '2px solid #dc3545', padding: '8px 20px', transition: 'all 0.3s'}} 
                                                                                        onClick={() => handleDeleteJob(job.id)}
                                                                                        title="Delete job"
                                                                                    >
                                                                                        <i className="fi-rr-trash" style={{color: '#dc3545'}}></i>
                                                                                        <span style={{marginLeft: '5px', color: '#dc3545', fontWeight: 'bold'}}>Delete</span>
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                }
                                                {activeTab === 2 &&
                                                    <div className="row display-list">
                                                        {getPaginatedProducts.map((job, i) => (
                                                            <div
                                                                className="col-lg-6"
                                                                key={i}
                                                            >
                                                                <div className="card-grid-2 hover-up" style={{boxShadow: '0 5px 15px rgba(0,0,0,0.1)', borderRadius: '10px', border: '1px solid #eee', marginBottom: '20px'}}>
                                                                    <div className="card-grid-2-image-left">
                                                                        <div className="image-box">
                                                                            <img src="/assets/imgs/brands/brand-1.png" alt="jobBox" />
                                                                        </div>
                                                                        <div className="right-info">
                                                                            <a className="name-job" href={`/job-details/${job.id}`} title={job.title} style={{color: '#3C65F5', fontWeight: 'bold'}}>
                                                                                {job.title.length > 30 ? `${job.title.substring(0, 30)}...` : job.title}
                                                                            </a>
                                                                            <div className="company-info mt-5">
                                                                                <span><i className="fi-rr-building mr-5" style={{color: '#3C65F5'}}></i>{job.company?.name || 'Facebook'}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="card-block-info">
                                                                        <div className="mt-5 d-flex justify-content-between">
                                                                            <span className="card-briefcase"><i className="fi-rr-briefcase mr-5"></i>{job.workplaceType || 'Remote'}</span>
                                                                            <span className="card-time">
                                                                                <i className="fi-rr-clock mr-5"></i>{new Date(job.date).toLocaleDateString()}
                                                                            </span>
                                                                        </div>
                                                                        <p className="font-sm color-text-paragraph mt-10" title={job.description}>
                                                                            {job.description.length > 100 ? `${job.description.substring(0, 100)}...` : job.description}
                                                                        </p>
                                                                        <div className="mt-15">
                                                                            <div className="d-flex align-items-center">
                                                                                <i className="fi-rr-marker mr-5 text-mutted" style={{color: '#F58A3C'}}></i>
                                                                                <span className="font-sm color-text-mutted">{job.location}</span>
                                                                            </div>
                                                                            <div className="d-flex align-items-center mt-10">
                                                                                <i className="fi-rr-dollar mr-5 text-mutted" style={{color: '#38B653'}}></i>
                                                                                <span className="font-sm color-text-mutted">{job.salary}</span>
                                                                            </div>
                                                                            <div className="d-flex align-items-center mt-10">
                                                                                <i className="fi-rr-list-check mr-5 text-mutted" style={{color: '#8E74FF'}}></i>
                                                                                <span className="font-sm color-text-mutted">{job.requirements ? (job.requirements.length > 3 ? `${job.requirements.slice(0, 3).join(', ')}...` : job.requirements.join(', ')) : ''}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="card-2-bottom mt-20">
                                                                            <div className="row">
                                                                                <div className="col-6">
                                                                                    <a href={`/edit-job?id=${job.id}`} className="btn btn-primary-outline btn-sm" style={{borderRadius: '50px', border: '2px solid #3C65F5', padding: '8px 20px', transition: 'all 0.3s'}} title="Edit job">
                                                                                        <i className="fi-rr-edit" style={{color: '#3C65F5'}}></i>
                                                                                        <span style={{marginLeft: '5px', color: '#3C65F5', fontWeight: 'bold'}}>Edit</span>
                                                                                    </a>
                                                                                </div>
                                                                                <div className="col-6 text-end">
                                                                                    <button
                                                                                        className="btn btn-danger-outline btn-sm" 
                                                                                        style={{borderRadius: '50px', border: '2px solid #dc3545', padding: '8px 20px', transition: 'all 0.3s'}} 
                                                                                        onClick={() => handleDeleteJob(job.id)}
                                                                                        title="Delete job"
                                                                                    >
                                                                                        <i className="fi-rr-trash" style={{color: '#dc3545'}}></i>
                                                                                        <span style={{marginLeft: '5px', color: '#dc3545', fontWeight: 'bold'}}>Delete</span>
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                }
                                            </>
                                        )}
                                    </div>

                                    <div className="paginations">
                                        <Pagination
                                            getPaginationGroup={
                                                getPaginationGroup
                                            }
                                            currentPage={currentPage}
                                            pages={pages}
                                            next={next}
                                            prev={prev}
                                            handleActive={handleActive}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-10">
                    <div className="section-box">
                        <div className="container">
                            <div className="panel-white pt-30 pb-30 pl-15 pr-15">
                                <div className="box-swiper">
                                    <div className="swiper-container swiper-group-10">
                                        <BrandSlider />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        </>
    )
}