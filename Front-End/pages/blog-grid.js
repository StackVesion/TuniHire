import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "../components/Layout/Layout";
import BlogCard from "../components/elements/BlogCard";
import axios from "axios";
import { toast } from "react-toastify";
import { useRouter } from "next/router";

// Backend API URL
const API_URL = 'http://localhost:5000/api';

export default function BlogGrid() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [user, setUser] = useState(null);
    const router = useRouter();
    const { category, tag } = router.query;

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    const response = await axios.get(`${API_URL}/users/profile`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    setUser(response.data);
                }
            } catch (error) {
                console.error('Error fetching user profile:', error);
            }
        };

        fetchUser();
    }, []);

    useEffect(() => {
        fetchBlogs();
    }, [currentPage, category, tag]);

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            let url = `${API_URL}/blogs?page=${currentPage}&limit=9`;
            
            if (category) {
                url += `&category=${category}`;
            }
            
            if (tag) {
                url += `&tag=${tag}`;
            }
            
            const response = await axios.get(url);
            setBlogs(response.data.blogs);
            setTotalPages(response.data.totalPages);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching blogs:', error);
            toast.error('Error loading blogs');
            setLoading(false);
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo(0, 0);
    };

    return (
        <>
            <Layout>
                <div>
                    <section className="section-box">
                        <div className="breacrumb-cover">
                            <div className="container">
                                <div className="row">
                                    <div className="col-lg-6">
                                        <h2 className="mb-10">Blog</h2>
                                        <p className="font-lg color-text-paragraph-2">Get the latest news, updates and tips</p>
                                    </div>
                                    <div className="col-lg-6 text-end">
                                        <ul className="breadcrumbs mt-40">
                                            <li>
                                                <Link legacyBehavior href="/">
                                                    <a className="home-icon">Home</a>
                                                </Link>
                                            </li>
                                            <li>Blog</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    
                    <section className="section-box mt-50">
                        <div className="container">
                            {category && (
                                <div className="text-center mb-30">
                                    <h3>Category: {category}</h3>
                                </div>
                            )}
                            
                            {tag && (
                                <div className="text-center mb-30">
                                    <h3>Tag: #{tag}</h3>
                                </div>
                            )}
                            
                        <div className="post-loop-grid">
                                <div className="text-left">
                                    <h2 className="section-title mb-10 wow animate__animated animate__fadeInUp">Latest Posts</h2>
                                    <p className="font-lg color-text-paragraph-2 wow animate__animated animate__fadeInUp">Don't miss the trending news</p>
                                </div>
                                
                                {loading ? (
                                    <div className="text-center mt-50">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                                                        </div>
                                                                    </div>
                                ) : blogs.length > 0 ? (
                                    <div className="row mt-30">
                                        {blogs.map((blog) => (
                                            <div className="col-lg-4 col-md-6 col-sm-12 col-12" key={blog._id}>
                                                <BlogCard blog={blog} user={user} refreshBlogs={fetchBlogs} />
                                            </div>
                                        ))}
                                                    </div>
                                ) : (
                                    <div className="text-center mt-50">
                                        <h4>No blogs found</h4>
                                        <p>Try a different search or check back later</p>
                                                        </div>
                                )}
                                
                                {/* Pagination */}
                                {totalPages > 1 && (
                                        <div className="paginations">
                                            <ul className="pager">
                                                <li>
                                                <a 
                                                    className={`pager-prev ${currentPage === 1 ? 'disabled' : ''}`}
                                                    onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                                                ></a>
                                                </li>
                                            {[...Array(totalPages)].map((_, i) => (
                                                <li key={i}>
                                                    <a 
                                                        className={`pager-number ${currentPage === i + 1 ? 'active' : ''}`}
                                                        onClick={() => handlePageChange(i + 1)}
                                                    >
                                                        {i + 1}
                                                    </a>
                                                </li>
                                            ))}
                                            <li>
                                                <a 
                                                    className={`pager-next ${currentPage === totalPages ? 'disabled' : ''}`}
                                                    onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                                                ></a>
                                                </li>
                                            </ul>
                                    </div>
                                )}
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
        </>
    );
}
