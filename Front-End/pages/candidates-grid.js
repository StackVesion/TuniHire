import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "../components/Layout/Layout";
import BlogSlider from "./../components/sliders/Blog";

export default function CandidateGrid() {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCandidates, setTotalCandidates] = useState(0);

    const fetchCandidates = async (page) => {
        try {
            setLoading(true);
            setError(null);

            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const url = `${baseUrl}/api/users?page=${page}&limit=12`;

            console.log('Fetching from:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received data:', data);

            if (!data || typeof data !== 'object') {
                throw new Error('Invalid response format');
            }

            if (!data.success || !Array.isArray(data.users)) {
                throw new Error('Invalid data structure');
            }

            console.log('Total users received:', data.users.length);
            
            setCandidates(data.users);
            setTotalPages(Math.max(1, data.pagination?.totalPages || 1));
            setTotalCandidates(data.users.length || data.pagination?.total || 0);

        } catch (err) {
            console.error('Fetch error:', err);
            setError(err.message);
            setCandidates([]);
            setTotalPages(1);
            setTotalCandidates(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCandidates(currentPage);
    }, [currentPage]);

    const handlePageChange = (newPage) => {
        if (newPage === currentPage) return;
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <Layout>
            {error && (
                <div className="alert alert-danger m-3">
                    {error}
                    <button 
                        className="btn btn-link"
                        onClick={() => fetchCandidates(currentPage)}
                    >
                        Retry
                    </button>
                </div>
            )}
            
            <div>
                <section className="section-box-2">
                    <div className="container">
                        <div className="banner-hero banner-company">
                            <div className="block-banner text-center">
                                <h3 className="wow animate__animated animate__fadeInUp">
                                    Liste des candidats
                                </h3>
                                <div className="font-sm color-text-paragraph-2 mt-10 wow animate__animated animate__fadeInUp">
                                    {totalCandidates} candidats disponibles
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="section-box mt-30">
                    <div className="container">
                        <div className="content-page">
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="row">
                                    {candidates.map((candidate) => (
                                        <div key={candidate._id} className="col-xl-3 col-lg-4 col-md-6 mb-4">
                                            <div className="card hover-up h-100 shadow-sm">
                                                {/* Badge de statut */}
                                                <div className="position-absolute top-0 end-0 mt-2 me-2">
                                                    <span className="badge bg-success">Candidat</span>
                                                </div>
                                                
                                                {/* Photo et identité - section supérieure */}
                                                <div className="text-center p-3 bg-light border-bottom">
                                                    <Link href={`/candidate-details/${candidate._id}`}>
                                                        <img 
                                                            alt={`${candidate.firstName} ${candidate.lastName}`}
                                                            src={candidate.profilePicture || "/assets/imgs/avatar/default-avatar.png"}
                                                            className="rounded-circle border border-3 border-white shadow-sm"
                                                            style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                                        />
                                                    </Link>
                                                    <h5 className="mt-2 mb-0">
                                                        <Link href={`/candidate-details/${candidate._id}`} className="text-decoration-none text-primary">
                                                            {candidate.firstName} {candidate.lastName}
                                                        </Link>
                                                    </h5>
                                                    {candidate.title && (
                                                        <p className="font-sm color-text-paragraph mb-0">
                                                            {candidate.title}
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                {/* Corps de la carte avec informations structurées */}
                                                <div className="card-body p-0">
                                                    {/* Contact */}
                                                    <div className="p-3 border-bottom">
                                                        <h6 className="fw-bold mb-2 text-uppercase small text-muted">
                                                            <i className="fi-rr-address-book me-1"></i> Contact
                                                        </h6>
                                                        <div className="d-flex align-items-center mb-2">
                                                            <i className="fi-rr-envelope me-2 text-primary"></i>
                                                            <span className="text-truncate small">
                                                                {candidate.email || 'Email non disponible'}
                                                            </span>
                                                        </div>
                                                        {candidate.phone && (
                                                            <div className="d-flex align-items-center">
                                                                <i className="fi-rr-phone-call me-2 text-primary"></i>
                                                                <span className="small">{candidate.phone}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Informations */}
                                                    <div className="p-3 border-bottom">
                                                        <h6 className="fw-bold mb-2 text-uppercase small text-muted">
                                                            <i className="fi-rr-info me-1"></i> Informations
                                                        </h6>
                                                        {candidate.location && (
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="fi-rr-marker me-2 text-primary"></i>
                                                                <span className="small">{candidate.location}</span>
                                                            </div>
                                                        )}
                                                        {candidate.experienceYears && (
                                                            <div className="d-flex align-items-center">
                                                                <i className="fi-rr-briefcase me-2 text-primary"></i>
                                                                <span className="small">{candidate.experienceYears} ans d'expérience</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Compétences */}
                                                    <div className="p-3">
                                                        <h6 className="fw-bold mb-2 text-uppercase small text-muted">
                                                            <i className="fi-rr-star me-1"></i> Compétences
                                                        </h6>
                                                        {candidate.skills && candidate.skills.length > 0 ? (
                                                            <div>
                                                                {candidate.skills.slice(0, 3).map((skill, index) => (
                                                                    <span key={index} className="badge bg-primary bg-opacity-10 text-primary me-1 mb-1">
                                                                        {skill}
                                                                    </span>
                                                                ))}
                                                                {candidate.skills.length > 3 && (
                                                                    <span className="badge bg-secondary bg-opacity-10 text-secondary">
                                                                        +{candidate.skills.length - 3}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted small fst-italic">Aucune compétence listée</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {!loading && candidates.length === 0 && (
                                <div className="text-center py-5">
                                    <div className="alert alert-info">
                                        <h4><i className="fi-rr-info"></i> Aucun candidat trouvé</h4>
                                        <p>Aucun utilisateur avec le rôle "candidate" n'est disponible dans la base de données.</p>
                                        <button 
                                            className="btn btn-primary mt-2"
                                            onClick={() => fetchCandidates(1)}
                                        >
                                            <i className="fi-rr-refresh"></i> Actualiser
                                        </button>
                                    </div>
                                </div>
                            )}

                            {totalPages > 1 && (
                                <div className="paginations mt-4">
                                    <ul className="pager">
                                        <li>
                                            <button 
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="pager-prev"
                                            >
                                                Previous
                                            </button>
                                        </li>
                                        {[...Array(totalPages)].map((_, i) => (
                                            <li key={i + 1}>
                                                <button
                                                    onClick={() => handlePageChange(i + 1)}
                                                    className={`page-link ${currentPage === i + 1 ? 'active' : ''}`}
                                                >
                                                    {i + 1}
                                                </button>
                                            </li>
                                        ))}
                                        <li>
                                            <button 
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="pager-next"
                                            >
                                                Next
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
                <section className="section-box mt-50 mb-50">
                    <div className="container">
                        <div className="text-start">
                            <h2 className="section-title mb-10 wow animate__animated animate__fadeInUp">News and Blog</h2>
                            <p className="font-lg color-text-paragraph-2 wow animate__animated animate__fadeInUp">Get the latest news, updates and tips</p>
                        </div>
                    </div>
                    <div className="container">
                        <div className="mt-50">
                            <div className="box-swiper style-nav-top">
                                <BlogSlider />
                            </div>
                            <div className="text-center">
                                <Link legacyBehavior href="blog-grid">
                                    <a className="btn btn-brand-1 btn-icon-load mt--30 hover-up">Load More Posts</a>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="section-box mt-50 mb-20">
                    <div className="container">
                        <div className="box-newsletter">
                            <div className="row">
                                <div className="col-xl-3 col-12 text-center d-none d-xl-block">
                                    <img src="assets/imgs/template/newsletter-left.png" alt="joxBox" />
                                </div>
                                <div className="col-lg-12 col-xl-6 col-12">
                                    <h2 className="text-md-newsletter text-center">
                                        New Things Will Always
                                        <br /> Update Regularly
                                    </h2>
                                    <div className="box-form-newsletter mt-40">
                                        <form className="form-newsletter">
                                            <input className="input-newsletter" type="text" placeholder="Enter your email here" />
                                            <button className="btn btn-default font-heading icon-send-letter">Subscribe</button>
                                        </form>
                                    </div>
                                </div>
                                <div className="col-xl-3 col-12 text-center d-none d-xl-block">
                                    <img src="assets/imgs/template/newsletter-right.png" alt="joxBox" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </Layout>
    );
}