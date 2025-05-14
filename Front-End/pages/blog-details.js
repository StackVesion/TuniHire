import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "../components/Layout/Layout";
import BlogDetailsCard from "../components/elements/BlogDetailsCard";
import axios from "axios";
import { toast } from "react-toastify";
import { useRouter } from "next/router";

// Backend API URL
const API_URL = 'http://localhost:5000/api';

export default function BlogDetails() {
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const router = useRouter();
    const { id } = router.query;

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
        if (id) {
            fetchBlog();
        }
    }, [id]);

    const fetchBlog = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/blogs/${id}`);
            setBlog(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching blog details:', error);
            toast.error('Error loading blog post');
            setLoading(false);
        }
    };

    return (
        <>
            <Layout>
                {loading ? (
                    <div className="text-center py-50">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : blog ? (
                    <>
                        <section className="section-box">
                            <div>
                                <img src={blog.image || "assets/imgs/page/blog/img-single.png"} alt={blog.title} />
                            </div>
                        </section>
                        <section className="section-box">
                            <div className="archive-header pt-50 text-center">
                                <div className="container">
                                    <div className="box-white">
                                        <div className="max-width-single">
                                            <Link legacyBehavior href={`/blog-grid?category=${blog.category}`}>
                                                <a className="btn btn-tag">{blog.category}</a>
                                            </Link>

                                            <h2 className="mb-30 mt-20 text-center">{blog.title}</h2>
                                            <div className="post-meta text-muted d-flex align-items-center mx-auto justify-content-center">
                                                <div className="author d-flex align-items-center mr-30">
                                                    <img alt="author" src={blog.author?.profilePicture || "assets/imgs/page/homepage1/user3.png"} />
                                                    <span>{blog.author?.firstName} {blog.author?.lastName}</span>
                                                </div>
                                                <div className="date">
                                                    <span className="font-xs color-text-paragraph-2 mr-20 d-inline-block">
                                                        <img className="img-middle mr-5" src="assets/imgs/page/blog/calendar.svg" /> {new Date(blog.createdAt).toLocaleDateString()}
                                                    </span>
                                                    <span className="font-xs color-text-paragraph-2 d-inline-block">
                                                        <img className="img-middle mr-5" src="assets/imgs/template/icons/time.svg" /> {blog.viewCount} views
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                        <div className="post-loop-grid">
                            <div className="container">
                                <div className="row">
                                    <div className="col-lg-10 mx-auto">
                                        <BlogDetailsCard blog={blog} user={user} refreshBlog={fetchBlog} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-50">
                        <h3>Blog post not found</h3>
                        <p>The blog post you're looking for may have been removed or doesn't exist.</p>
                        <Link legacyBehavior href="/blog-grid">
                            <a className="btn btn-primary mt-20">Return to Blog</a>
                        </Link>
                    </div>
                )}
                
                <section className="section-box mt-50 mb-20">
                    <div className="container">
                        <div className="box-newsletter">
                            <div className="row">
                                <div className="col-xl-3 col-12 text-center d-none d-xl-block">
                                    <img src="assets/imgs/template/newsletter-left.png" alt="newsletter" />
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
                                    <img src="assets/imgs/template/newsletter-right.png" alt="newsletter" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </Layout>
        </>
    );
}
