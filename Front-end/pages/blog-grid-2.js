import Link from "next/link";
import Layout from "../components/Layout/Layout";

export default function BlogGrid2() {
    return (
        <>
            <Layout>
                <div>
                    <section className="section-box">
                        <div className="breacrumb-cover">
                            <div className="container">
                                <div className="row">
                                    <div className="col-lg-6">
                                        <h2 className="mb-10">Articles / News</h2>
                                        <p className="font-lg color-text-paragraph-2">Get the latest news, updates and tips</p>
                                    </div>
                                    <div className="col-lg-6 text-end">
                                        <ul className="breadcrumbs mt-40">
                                            <li>
                                                <Link legacyBehavior href="index">
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
                            <div className="box-improve">
                                <div className="row">
                                    <div className="col-lg-5 col-md-12 col-sm-12">
                                        <Link legacyBehavior href="blog-details">
                                            <a>
                                                <img src="assets/imgs/page/job-single-2/img2.png" alt="jobBox" />
                                            </a>
                                        </Link>
                                    </div>
                                    <div className="col-lg-7 col-md-12 col-sm-12">
                                        <div className="pt-40 pb-30 pl-30 pr-30">
                                            <Link legacyBehavior href="blog-grid">
                                                <a className="btn btn-tag">Marketing</a>
                                            </Link>

                                            <h2 className="mt-20 mb-20">
                                                <Link legacyBehavior href="blog-details">
                                                    <a>Improve Your Business With These 8 Simple Tricks</a>
                                                </Link>
                                            </h2>
                                            <p className="font-md mb-20">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam laoreet rutrum quam, id faucibus erat interdum a. Curabitur eget tortor a nulla interdum semper. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam laoreet rutrum quam, id faucibus erat interdum a. Curabitur eget tortor a nulla interdum semper.</p>
                                            <div>
                                                <Link legacyBehavior href="blog-details">
                                                    <a className="btn btn-arrow-right">Read More</a>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="section-box mt-50">
                        <div className="post-loop-grid">
                            <div className="container">
                                <div className="text-left">
                                    <h2 className="section-title mb-10 wow animate__animated animate__fadeInUp">Latest Posts</h2>
                                    <p className="font-lg color-text-paragraph-2 wow animate__animated animate__fadeInUp">Don't miss the trending news</p>
                                </div>
                                <div className="row mt-30">
                                    <div className="col-lg-8">
                                        <div className="row">
                                            <div className="col-lg-6 mb-30">
                                                <div className="card-grid-3 hover-up">
                                                    <div className="text-center card-grid-3-image">
                                                        <Link legacyBehavior href="blog-details">
                                                            <a>
                                                                <figure>
                                                                    <img alt="jobBox" src="assets/imgs/page/job-single-2/img3.png" />
                                                                </figure>
                                                            </a>
                                                        </Link>
                                                    </div>
                                                    <div className="card-block-info">
                                                        <div className="tags mb-15">
                                                            <Link legacyBehavior href="blog-grid">
                                                                <a className="btn btn-tag">News</a>
                                                            </Link>
                                                        </div>
                                                        <h5>
                                                            <Link legacyBehavior href="blog-details">
                                                                <a>21 Job Interview Tips: How To Make a Great Impression</a>
                                                            </Link>
                                                        </h5>
                                                        <p className="mt-10 color-text-paragraph font-sm">Our mission is to create the world&amp;rsquo;s most sustainable healthcare company by creating high-quality healthcare products in iconic, sustainable packaging.</p>
                                                        <div className="card-2-bottom mt-20">
                                                            <div className="row">
                                                                <div className="col-lg-6 col-6">
                                                                    <div className="d-flex">
                                                                        <img className="img-rounded" src="assets/imgs/page/homepage1/user1.png" />
                                                                        <div className="info-right-img">
                                                                            <span className="font-sm font-bold color-brand-1 op-70">Azumi Rose</span>
                                                                            <br />
                                                                            <span className="font-xs color-text-paragraph-2">25 April 2022</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="col-lg-6 text-end col-6 pt-15">
                                                                    <span className="color-text-paragraph-2 font-xs">8 mins to read</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-lg-6 mb-30">
                                                <div className="card-grid-3 hover-up">
                                                    <div className="text-center card-grid-3-image">
                                                        <Link legacyBehavior href="blog-details">
                                                            <a>
                                                                <figure>
                                                                    <img alt="jobBox" src="assets/imgs/page/job-single-2/img4.png" />
                                                                </figure>
                                                            </a>
                                                        </Link>
                                                    </div>
                                                    <div className="card-block-info">
                                                        <div className="tags mb-15">
                                                            <Link legacyBehavior href="blog-grid">
                                                                <a className="btn btn-tag">Events</a>
                                                            </Link>
                                                        </div>
                                                        <h5>
                                                            <Link legacyBehavior href="blog-details">
                                                                <a>Email Examples: How To Respond to Employer Interview Requests</a>
                                                            </Link>
                                                        </h5>
                                                        <p className="mt-10 color-text-paragraph font-sm">Our mission is to create the world&amp;rsquo;s most sustainable healthcare company by creating high-quality healthcare products in iconic, sustainable packaging.</p>
                                                        <div className="card-2-bottom mt-20">
                                                            <div className="row">
                                                                <div className="col-lg-6 col-6">
                                                                    <div className="d-flex">
                                                                        <img className="img-rounded" src="assets/imgs/page/homepage1/user2.png" />
                                                                        <div className="info-right-img">
                                                                            <span className="font-sm font-bold color-brand-1 op-70">Azumi Rose</span>
                                                                            <br />
                                                                            <span className="font-xs color-text-paragraph-2">25 April 2022</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="col-lg-6 text-end col-6 pt-15">
                                                                    <span className="color-text-paragraph-2 font-xs">8 mins to read</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-lg-6 mb-30">
                                                <div className="card-grid-3 hover-up">
                                                    <div className="text-center card-grid-3-image">
                                                        <Link legacyBehavior href="blog-details">
                                                            <a>
                                                                <figure>
                                                                    <img alt="jobBox" src="assets/imgs/page/job-single-2/img5.png" />
                                                                </figure>
                                                            </a>
                                                        </Link>
                                                    </div>
                                                    <div className="card-block-info">
                                                        <div className="tags mb-15">
                                                            <Link legacyBehavior href="blog-grid">
                                                                <a className="btn btn-tag">Events</a>
                                                            </Link>
                                                        </div>
                                                        <h5>
                                                            <Link legacyBehavior href="blog-details">
                                                                <a>How To Write an Application Letter (With Examples)</a>
                                                            </Link>
                                                        </h5>
                                                        <p className="mt-10 color-text-paragraph font-sm">Our mission is to create the world&amp;rsquo;s most sustainable healthcare company by creating high-quality healthcare products in iconic, sustainable packaging.</p>
                                                        <div className="card-2-bottom mt-20">
                                                            <div className="row">
                                                                <div className="col-lg-6 col-6">
                                                                    <div className="d-flex">
                                                                        <img className="img-rounded" src="assets/imgs/page/homepage1/user3.png" />
                                                                        <div className="info-right-img">
                                                                            <span className="font-sm font-bold color-brand-1 op-70">Azumi Rose</span>
                                                                            <br />
                                                                            <span className="font-xs color-text-paragraph-2">25 April 2022</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="col-lg-6 text-end col-6 pt-15">
                                                                    <span className="color-text-paragraph-2 font-xs">8 mins to read</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-lg-6 mb-30">
                                                <div className="card-grid-3 hover-up">
                                                    <div className="text-center card-grid-3-image">
                                                        <Link legacyBehavior href="blog-details">
                                                            <a>
                                                                <figure>
                                                                    <img alt="jobBox" src="assets/imgs/page/job-single-2/img6.png" />
                                                                </figure>
                                                            </a>
                                                        </Link>
                                                    </div>
                                                    <div className="card-block-info">
                                                        <div className="tags mb-15">
                                                            <Link legacyBehavior href="blog-grid">
                                                                <a className="btn btn-tag">Events</a>
                                                            </Link>
                                                        </div>
                                                        <h5>
                                                            <Link legacyBehavior href="blog-details">
                                                                <a>17 jobs hired at 15 (and even 14) you should know</a>
                                                            </Link>
                                                        </h5>
                                                        <p className="mt-10 color-text-paragraph font-sm">Our mission is to create the world&amp;rsquo;s most sustainable healthcare company by creating high-quality healthcare products in iconic, sustainable packaging.</p>
                                                        <div className="card-2-bottom mt-20">
                                                            <div className="row">
                                                                <div className="col-lg-6 col-6">
                                                                    <div className="d-flex">
                                                                        <img className="img-rounded" src="assets/imgs/page/about/user1.png" />
                                                                        <div className="info-right-img">
                                                                            <span className="font-sm font-bold color-brand-1 op-70">Azumi Rose</span>
                                                                            <br />
                                                                            <span className="font-xs color-text-paragraph-2">25 April 2022</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="col-lg-6 text-end col-6 pt-15">
                                                                    <span className="color-text-paragraph-2 font-xs">8 mins to read</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-lg-6 mb-30">
                                                <div className="card-grid-3 hover-up">
                                                    <div className="text-center card-grid-3-image">
                                                        <Link legacyBehavior href="blog-details">
                                                            <a>
                                                                <figure>
                                                                    <img alt="jobBox" src="assets/imgs/page/job-single-2/img7.png" />
                                                                </figure>
                                                            </a>
                                                        </Link>
                                                    </div>
                                                    <div className="card-block-info">
                                                        <div className="tags mb-15">
                                                            <Link legacyBehavior href="blog-grid">
                                                                <a className="btn btn-tag">Events</a>
                                                            </Link>
                                                        </div>
                                                        <h5>
                                                            <Link legacyBehavior href="blog-details">
                                                                <a>How To Write a Cover Letter (Plus Tips and Examples)</a>
                                                            </Link>
                                                        </h5>
                                                        <p className="mt-10 color-text-paragraph font-sm">Our mission is to create the world&amp;rsquo;s most sustainable healthcare company by creating high-quality healthcare products in iconic, sustainable packaging.</p>
                                                        <div className="card-2-bottom mt-20">
                                                            <div className="row">
                                                                <div className="col-lg-6 col-6">
                                                                    <div className="d-flex">
                                                                        <img className="img-rounded" src="assets/imgs/page/about/user2.png" />
                                                                        <div className="info-right-img">
                                                                            <span className="font-sm font-bold color-brand-1 op-70">Azumi Rose</span>
                                                                            <br />
                                                                            <span className="font-xs color-text-paragraph-2">25 April 2022</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="col-lg-6 text-end col-6 pt-15">
                                                                    <span className="color-text-paragraph-2 font-xs">8 mins to read</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-lg-6 mb-30">
                                                <div className="card-grid-3 hover-up">
                                                    <div className="text-center card-grid-3-image">
                                                        <Link legacyBehavior href="blog-details">
                                                            <a>
                                                                <figure>
                                                                    <img alt="jobBox" src="assets/imgs/page/job-single-2/img8.png" />
                                                                </figure>
                                                            </a>
                                                        </Link>
                                                    </div>
                                                    <div className="card-block-info">
                                                        <div className="tags mb-15">
                                                            <Link legacyBehavior href="blog-grid">
                                                                <a className="btn btn-tag">Events</a>
                                                            </Link>
                                                        </div>
                                                        <h5>
                                                            <Link legacyBehavior href="blog-details">
                                                                <a>10 Best Skills To Include on a Resume in 2022</a>
                                                            </Link>
                                                        </h5>
                                                        <p className="mt-10 color-text-paragraph font-sm">Our mission is to create the world&amp;rsquo;s most sustainable healthcare company by creating high-quality healthcare products in iconic, sustainable packaging.</p>
                                                        <div className="card-2-bottom mt-20">
                                                            <div className="row">
                                                                <div className="col-lg-6 col-6">
                                                                    <div className="d-flex">
                                                                        <img className="img-rounded" src="assets/imgs/page/about/user3.png" />
                                                                        <div className="info-right-img">
                                                                            <span className="font-sm font-bold color-brand-1 op-70">Azumi Rose</span>
                                                                            <br />
                                                                            <span className="font-xs color-text-paragraph-2">25 April 2022</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="col-lg-6 text-end col-6 pt-15">
                                                                    <span className="color-text-paragraph-2 font-xs">8 mins to read</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-lg-6 mb-30">
                                                <div className="card-grid-3 hover-up">
                                                    <div className="text-center card-grid-3-image">
                                                        <Link legacyBehavior href="blog-details">
                                                            <a>
                                                                <figure>
                                                                    <img alt="jobBox" src="assets/imgs/page/job-single-2/img4.png" />
                                                                </figure>
                                                            </a>
                                                        </Link>
                                                    </div>
                                                    <div className="card-block-info">
                                                        <div className="tags mb-15">
                                                            <Link legacyBehavior href="blog-grid">
                                                                <a className="btn btn-tag">Events</a>
                                                            </Link>
                                                        </div>
                                                        <h5>
                                                            <Link legacyBehavior href="blog-details">
                                                                <a>39 Strengths and Weaknesses To Discuss in a Job Interview</a>
                                                            </Link>
                                                        </h5>
                                                        <p className="mt-10 color-text-paragraph font-sm">Our mission is to create the world&amp;rsquo;s most sustainable healthcare company by creating high-quality healthcare products in iconic, sustainable packaging.</p>
                                                        <div className="card-2-bottom mt-20">
                                                            <div className="row">
                                                                <div className="col-lg-6 col-6">
                                                                    <div className="d-flex">
                                                                        <img className="img-rounded" src="assets/imgs/page/homepage1/user1.png" />
                                                                        <div className="info-right-img">
                                                                            <span className="font-sm font-bold color-brand-1 op-70">Azumi Rose</span>
                                                                            <br />
                                                                            <span className="font-xs color-text-paragraph-2">25 April 2022</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="col-lg-6 text-end col-6 pt-15">
                                                                    <span className="color-text-paragraph-2 font-xs">8 mins to read</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-lg-6 mb-30">
                                                <div className="card-grid-3 hover-up">
                                                    <div className="text-center card-grid-3-image">
                                                        <Link legacyBehavior href="blog-details">
                                                            <a>
                                                                <figure>
                                                                    <img alt="jobBox" src="assets/imgs/page/job-single-2/img5.png" />
                                                                </figure>
                                                            </a>
                                                        </Link>
                                                    </div>
                                                    <div className="card-block-info">
                                                        <div className="tags mb-15">
                                                            <Link legacyBehavior href="blog-grid">
                                                                <a className="btn btn-tag">Events</a>
                                                            </Link>
                                                        </div>
                                                        <h5>
                                                            <Link legacyBehavior href="blog-details">
                                                                <a>List of Weaknesses: 10 Things To Say in an Interview</a>
                                                            </Link>
                                                        </h5>
                                                        <p className="mt-10 color-text-paragraph font-sm">Our mission is to create the world&amp;rsquo;s most sustainable healthcare company by creating high-quality healthcare products in iconic, sustainable packaging.</p>
                                                        <div className="card-2-bottom mt-20">
                                                            <div className="row">
                                                                <div className="col-lg-6 col-6">
                                                                    <div className="d-flex">
                                                                        <img className="img-rounded" src="assets/imgs/page/homepage1/user1.png" />
                                                                        <div className="info-right-img">
                                                                            <span className="font-sm font-bold color-brand-1 op-70">Azumi Rose</span>
                                                                            <br />
                                                                            <span className="font-xs color-text-paragraph-2">25 April 2022</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="col-lg-6 text-end col-6 pt-15">
                                                                    <span className="color-text-paragraph-2 font-xs">8 mins to read</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="paginations">
                                            <ul className="pager">
                                                <li>
                                                    <a className="pager-prev" href="#" />
                                                </li>
                                                <li>
                                                    <Link legacyBehavior href="#">
                                                        <a className="pager-number">1</a>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link legacyBehavior href="#">
                                                        <a className="pager-number">2</a>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link legacyBehavior href="#">
                                                        <a className="pager-number">3</a>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link legacyBehavior href="#">
                                                        <a className="pager-number">4</a>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link legacyBehavior href="#">
                                                        <a className="pager-number">5</a>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link legacyBehavior href="#">
                                                        <a className="pager-number active">6</a>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link legacyBehavior href="#">
                                                        <a className="pager-number">7</a>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <a className="pager-next" href="#" />
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="col-lg-4 col-md-12 col-sm-12 col-12 pl-40 pl-lg-15 mt-lg-30">
                                        <div className="widget_search mb-40">
                                            <div className="search-form">
                                                <form action="#">
                                                    <input type="text" placeholder="Search" />
                                                    <button type="submit">
                                                        <i className="fi-rr-search" />
                                                    </button>
                                                </form>
                                            </div>
                                        </div>
                                        <div className="sidebar-shadow sidebar-news-small">
                                            <h5 className="sidebar-title">Trending Now</h5>
                                            <div className="post-list-small">
                                                <div className="post-list-small-item d-flex align-items-center">
                                                    <figure className="thumb mr-15">
                                                        <a href="/blog-details">
                                                            <img src="assets/imgs/page/blog/img-trending.png" alt="jobBox" />
                                                        </a>
                                                    </figure>
                                                    <div className="content">
                                                        <h5>
                                                            <a href="/blog-details">How to get better agents in New York, USA</a>
                                                        </h5>
                                                        <div className="post-meta text-muted d-flex align-items-center mb-15">
                                                            <div className="author d-flex align-items-center mr-20">
                                                                <img alt="jobBox" src="assets/imgs/page/homepage1/user1.png" />
                                                                <span>Sugar Rosie</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="post-list-small-item d-flex align-items-center">
                                                    <figure className="thumb mr-15">
                                                        <a href="/blog-details">
                                                            <img src="assets/imgs/page/blog/gallery1.png" alt />
                                                        </a>
                                                    </figure>
                                                    <div className="content">
                                                        <h5>
                                                            <a href="/blog-details">How To Create a Resume for a Job in Social</a>
                                                        </h5>
                                                        <div className="post-meta text-muted d-flex align-items-center mb-15">
                                                            <div className="author d-flex align-items-center mr-20">
                                                                <img alt="jobBox" src="assets/imgs/page/homepage1/user3.png" />
                                                                <span>Harding</span>
                                                            </div>
                                                            <div className="date">
                                                                <span>17 Sep</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="post-list-small-item d-flex align-items-center">
                                                    <figure className="thumb mr-15">
                                                        <a href="/blog-details">
                                                            <img src="assets/imgs/page/blog/gallery2.png" alt />
                                                        </a>
                                                    </figure>
                                                    <div className="content">
                                                        <h5>
                                                            <a href="/blog-details">10 Ways to Avoid a Referee Disaster Zone</a>
                                                        </h5>
                                                        <div className="post-meta text-muted d-flex align-items-center mb-15">
                                                            <div className="author d-flex align-items-center mr-20">
                                                                <img alt="jobBox" src="assets/imgs/page/homepage1/user2.png" />
                                                                <span>Steven</span>
                                                            </div>
                                                            <div className="date">
                                                                <span>23 Sep</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="post-list-small-item d-flex align-items-center">
                                                    <figure className="thumb mr-15">
                                                        <a href="/blog-details">
                                                            <img src="assets/imgs/page/blog/gallery4.png" alt />
                                                        </a>
                                                    </figure>
                                                    <div className="content">
                                                        <h5>
                                                            <a href="/blog-details">How To Set Work-Life Boundaries From Any Location</a>
                                                        </h5>
                                                        <div className="post-meta text-muted d-flex align-items-center mb-15">
                                                            <div className="author d-flex align-items-center mr-20">
                                                                <img alt="jobBox" src="assets/imgs/page/homepage1/user3.png" />
                                                                <span>Merias</span>
                                                            </div>
                                                            <div className="date">
                                                                <span>14 Sep</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="post-list-small-item d-flex align-items-center">
                                                    <figure className="thumb mr-15">
                                                        <a href="/blog-details">
                                                            <img src="assets/imgs/page/blog/gallery5.png" alt />
                                                        </a>
                                                    </figure>
                                                    <div className="content">
                                                        <h5> <a href="/blog-details">How to Land Your Dream Marketing Job</a></h5>
                                                        <div className="post-meta text-muted d-flex align-items-center mb-15">
                                                            <div className="author d-flex align-items-center mr-20">
                                                                <img alt="jobBox" src="assets/imgs/page/homepage1/user1.png" />
                                                                <span>Rosie</span>
                                                            </div>
                                                            <div className="date">
                                                                <span>12 Sep</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="sidebar-border-bg bg-right">
                                            <span className="text-grey">WE ARE</span>
                                            <span className="text-hiring">HIRING</span>
                                            <p className="font-xxs color-text-paragraph mt-5">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Recusandae architecto</p>
                                            <div className="mt-15">
                                                <Link legacyBehavior href="#">
                                                    <a className="btn btn-paragraph-2">Know More</a>
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="sidebar-shadow sidebar-news-small">
                                            <h5 className="sidebar-title">Gallery</h5>
                                            <div className="post-list-small">
                                                <ul className="gallery-3">
                                                    <li>
                                                        <Link legacyBehavior href="#">
                                                            <a>
                                                                <img src="assets/imgs/page/blog/gallery1.png" />
                                                            </a>
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link legacyBehavior href="#">
                                                            <a>
                                                                <img src="assets/imgs/page/blog/gallery2.png" />
                                                            </a>
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link legacyBehavior href="#">
                                                            <a>
                                                                <img src="assets/imgs/page/blog/gallery3.png" />
                                                            </a>
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link legacyBehavior href="#">
                                                            <a>
                                                                <img src="assets/imgs/page/blog/gallery4.png" />
                                                            </a>
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link legacyBehavior href="#">
                                                            <a>
                                                                <img src="assets/imgs/page/blog/gallery5.png" />
                                                            </a>
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link legacyBehavior href="#">
                                                            <a>
                                                                <img src="assets/imgs/page/blog/gallery6.png" />
                                                            </a>
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link legacyBehavior href="#">
                                                            <a>
                                                                <img src="assets/imgs/page/blog/gallery7.png" />
                                                            </a>
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link legacyBehavior href="#">
                                                            <a>
                                                                <img src="assets/imgs/page/blog/gallery8.png" />
                                                            </a>
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link legacyBehavior href="#">
                                                            <a>
                                                                <img src="assets/imgs/page/blog/gallery9.png" />
                                                            </a>
                                                        </Link>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
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
        </>
    );
}
