/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import Layout from "../components/Layout/Layout";
import BlogSlider from "./../components/sliders/Blog";
import TestimonialSlider1 from "./../components/sliders/Testimonial1";

export default function About() {
    return (
        <>
            <Layout>
                <div>
                    <section className="section-box">
                        <div className="breacrumb-cover bg-img-about">
                            <div className="container">
                                <div className="row">
                                    <div className="col-lg-6">
                                        <h2 className="mb-10">About Us</h2>
                                        <p className="font-lg color-text-paragraph-2">Get the latest news, updates and tips</p>
                                    </div>
                                    <div className="col-lg-6 text-lg-end">
                                        <ul className="breadcrumbs mt-40">
                                            <li>
                                                <a className="home-icon" href="#">
                                                    Home
                                                </a>
                                            </li>
                                            <li>About Us</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="section-box mt-50">
                        <div className="post-loop-grid">
                            <div className="container">
                                <div className="text-center">
                                    <h6 className="f-18 color-text-mutted text-uppercase">Our company</h6>
                                    <h2 className="section-title mb-10 wow animate__animated animate__fadeInUp">About Our Company</h2>
                                    <p className="font-sm color-text-paragraph wow animate__animated animate__fadeInUp w-lg-50 mx-auto">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque ligula ante, dictum non aliquet eu, dapibus ac quam. Morbi vel ante viverra orci tincidunt tempor eu id ipsum. Sed consectetur, risus a blandit tempor, velit magna pellentesque risus, at congue tellus dui quis nisl.</p>
                                </div>
                                <div className="row mt-70">
                                    <div className="col-lg-6 col-md-12 col-sm-12">
                                        <img src="assets/imgs/page/about/img-about2.png" alt="joxBox" />
                                    </div>
                                    <div className="col-lg-6 col-md-12 col-sm-12">
                                        <h3 className="mt-15">What we can do?</h3>
                                        <div className="mt-20">
                                            <p className="font-md color-text-paragraph mt-20">Aenean sollicituin, lorem quis bibendum auctor nisi elit consequat ipsum sagittis sem nibh id elit. Duis sed odio sit amet nibh vulputate cursus a sit amet maurisorbi accumsan ipsum velit. Nam nec tellus a odio tincidunt auctora ornare odio.</p>
                                            <p className="font-md color-text-paragraph mt-20">Aenean sollicituin, lorem quis bibendum auctor nisi elit consequat ipsum sagittis sem nibh id elit. Duis sed odio sit amet nibh vulputate cursus a sit amet maurisorbi accumsan ipsum velit. Nam nec tellus a odio tincidunt auctora ornare odio.</p>
                                            <p className="font-md color-text-paragraph mt-20">Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Duis non nisi purus. Integer sit nostra, per inceptos himenaeos.</p>
                                            <p className="font-md color-text-paragraph mt-20">Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Duis non nisi purus. Integer sit nostra, per inceptos himenaeos.</p>
                                        </div>
                                        <div className="mt-30">
                                            <a className="btn btn-brand-1" href="#">
                                                Read More
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="section-box mt-80">
                        <div className="post-loop-grid">
                            <div className="container">
                                <div className="text-center">
                                    <h6 className="f-18 color-text-mutted text-uppercase">Our company</h6>
                                    <h2 className="section-title mb-10 wow animate__animated animate__fadeInUp">Meet Our Team</h2>
                                    <p className="font-sm color-text-paragraph w-lg-50 mx-auto wow animate__animated animate__fadeInUp">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque ligula ante, dictum non aliquet eu, dapibus ac quam. Morbi vel ante viverra orci tincidunt tempor eu id ipsum. Sed consectetur, risus a blandit tempor, velit magna pellentesque risus, at congue tellus dui quis nisl.</p>
                                </div>
                                <div className="row mt-70">
                                    <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6 col-12 mb-md-30">
                                        <div className="card-grid-4 text-center hover-up">
                                            <div className="image-top-feature">
                                                <figure>
                                                    <img alt="jobBox" src="assets/imgs/page/about/team1.png" />
                                                </figure>
                                            </div>
                                            <div className="card-grid-4-info">
                                                <h5 className="mt-10">Arlene McCoy</h5>
                                                <p className="font-xs color-text-paragraph-2 mt-5 mb-5">Frontend Developer</p>
                                                <div className="rate-reviews-small pt-5">
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span className="ml-10 color-text-mutted font-xs">
                                                        <span>(</span>
                                                        <span>65</span>
                                                        <span>)</span>
                                                    </span>
                                                </div>
                                                <span className="card-location">New York, US</span>
                                                <div className="text-center mt-30">
                                                    <a className="share-facebook social-share-link" href="#" />
                                                    <a className="share-twitter social-share-link" href="#" />
                                                    <a className="share-instagram social-share-link" href="#" />
                                                    <a className="share-linkedin social-share-link" href="#" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6 col-12 mb-md-30">
                                        <div className="card-grid-4 text-center hover-up">
                                            <div className="image-top-feature">
                                                <figure>
                                                    <img alt="jobBox" src="assets/imgs/page/about/team2.png" />
                                                </figure>
                                            </div>
                                            <div className="card-grid-4-info">
                                                <h5 className="mt-10">Floyd Miles</h5>
                                                <p className="font-xs color-text-paragraph-2 mt-5 mb-5">UI/UX Designer</p>
                                                <div className="rate-reviews-small pt-5">
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span className="ml-10 color-text-mutted font-xs">
                                                        <span>(</span>
                                                        <span>28</span>
                                                        <span>)</span>
                                                    </span>
                                                </div>
                                                <span className="card-location">Chicago, US</span>
                                                <div className="text-center mt-30">
                                                    <a className="share-facebook social-share-link" href="#" />
                                                    <a className="share-twitter social-share-link" href="#" />
                                                    <a className="share-instagram social-share-link" href="#" />
                                                    <a className="share-linkedin social-share-link" href="#" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6 col-12 mb-md-30">
                                        <div className="card-grid-4 text-center hover-up">
                                            <div className="image-top-feature">
                                                <figure>
                                                    <img alt="jobBox" src="assets/imgs/page/about/team3.png" />
                                                </figure>
                                            </div>
                                            <div className="card-grid-4-info">
                                                <h5 className="mt-10">Devon Lane</h5>
                                                <p className="font-xs color-text-paragraph-2 mt-5 mb-5">Frontend Developer</p>
                                                <div className="rate-reviews-small pt-5">
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span className="ml-10 color-text-mutted font-xs">
                                                        <span>(</span>
                                                        <span>65</span>
                                                        <span>)</span>
                                                    </span>
                                                </div>
                                                <span className="card-location">New York, US</span>
                                                <div className="text-center mt-30">
                                                    <a className="share-facebook social-share-link" href="#" />
                                                    <a className="share-twitter social-share-link" href="#" />
                                                    <a className="share-instagram social-share-link" href="#" />
                                                    <a className="share-linkedin social-share-link" href="#" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6 col-12 mb-md-30">
                                        <div className="card-grid-4 text-center hover-up">
                                            <div className="image-top-feature">
                                                <figure>
                                                    <img alt="jobBox" src="assets/imgs/page/about/team4.png" />
                                                </figure>
                                            </div>
                                            <div className="card-grid-4-info">
                                                <h5 className="mt-10">Jerome Bell</h5>
                                                <p className="font-xs color-text-paragraph-2 mt-5 mb-5">Frontend Developer</p>
                                                <div className="rate-reviews-small pt-5">
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span className="ml-10 color-text-mutted font-xs">
                                                        <span>(</span>
                                                        <span>65</span>
                                                        <span>)</span>
                                                    </span>
                                                </div>
                                                <span className="card-location">New York, US</span>
                                                <div className="text-center mt-30">
                                                    <a className="share-facebook social-share-link" href="#" />
                                                    <a className="share-twitter social-share-link" href="#" />
                                                    <a className="share-instagram social-share-link" href="#" />
                                                    <a className="share-linkedin social-share-link" href="#" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6 col-12 mb-md-30">
                                        <div className="card-grid-4 text-center hover-up">
                                            <div className="image-top-feature">
                                                <figure>
                                                    <img alt="jobBox" src="assets/imgs/page/about/team5.png" />
                                                </figure>
                                            </div>
                                            <div className="card-grid-4-info">
                                                <h5 className="mt-10">Theresa</h5>
                                                <p className="font-xs color-text-paragraph-2 mt-5 mb-5">Frontend Developer</p>
                                                <div className="rate-reviews-small pt-5">
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span className="ml-10 color-text-mutted font-xs">
                                                        <span>(</span>
                                                        <span>65</span>
                                                        <span>)</span>
                                                    </span>
                                                </div>
                                                <span className="card-location">New York, US</span>
                                                <div className="text-center mt-30">
                                                    <a className="share-facebook social-share-link" href="#" />
                                                    <a className="share-twitter social-share-link" href="#" />
                                                    <a className="share-instagram social-share-link" href="#" />
                                                    <a className="share-linkedin social-share-link" href="#" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6 col-12 mb-md-30">
                                        <div className="card-grid-4 text-center hover-up">
                                            <div className="image-top-feature">
                                                <figure>
                                                    <img alt="jobBox" src="assets/imgs/page/about/team6.png" />
                                                </figure>
                                            </div>
                                            <div className="card-grid-4-info">
                                                <h5 className="mt-10">Cameron</h5>
                                                <p className="font-xs color-text-paragraph-2 mt-5 mb-5">Frontend Developer</p>
                                                <div className="rate-reviews-small pt-5">
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span className="ml-10 color-text-mutted font-xs">
                                                        <span>(</span>
                                                        <span>65</span>
                                                        <span>)</span>
                                                    </span>
                                                </div>
                                                <span className="card-location">New York, US</span>
                                                <div className="text-center mt-30">
                                                    <a className="share-facebook social-share-link" href="#" />
                                                    <a className="share-twitter social-share-link" href="#" />
                                                    <a className="share-instagram social-share-link" href="#" />
                                                    <a className="share-linkedin social-share-link" href="#" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6 col-12 mb-md-30">
                                        <div className="card-grid-4 text-center hover-up">
                                            <div className="image-top-feature">
                                                <figure>
                                                    <img alt="jobBox" src="assets/imgs/page/about/team7.png" />
                                                </figure>
                                            </div>
                                            <div className="card-grid-4-info">
                                                <h5 className="mt-10">Jacob Jones</h5>
                                                <p className="font-xs color-text-paragraph-2 mt-5 mb-5">Frontend Developer</p>
                                                <div className="rate-reviews-small pt-5">
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span className="ml-10 color-text-mutted font-xs">
                                                        <span>(</span>
                                                        <span>65</span>
                                                        <span>)</span>
                                                    </span>
                                                </div>
                                                <span className="card-location">New York, US</span>
                                                <div className="text-center mt-30">
                                                    <a className="share-facebook social-share-link" href="#" />
                                                    <a className="share-twitter social-share-link" href="#" />
                                                    <a className="share-instagram social-share-link" href="#" />
                                                    <a className="share-linkedin social-share-link" href="#" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6 col-12 mb-md-30">
                                        <div className="card-grid-4 text-center hover-up">
                                            <div className="image-top-feature">
                                                <figure>
                                                    <img alt="jobBox" src="assets/imgs/page/about/team8.png" />
                                                </figure>
                                            </div>
                                            <div className="card-grid-4-info">
                                                <h5 className="mt-10">Court Henry</h5>
                                                <p className="font-xs color-text-paragraph-2 mt-5 mb-5">Frontend Developer</p>
                                                <div className="rate-reviews-small pt-5">
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span>
                                                        <img src="assets/imgs/template/icons/star.svg" alt="jobBox" />
                                                    </span>
                                                    <span className="ml-10 color-text-mutted font-xs">
                                                        <span>(</span>
                                                        <span>65</span>
                                                        <span>)</span>
                                                    </span>
                                                </div>
                                                <span className="card-location">New York, US</span>
                                                <div className="text-center mt-30">
                                                    <a className="share-facebook social-share-link" href="#" />
                                                    <a className="share-twitter social-share-link" href="#" />
                                                    <a className="share-instagram social-share-link" href="#" />
                                                    <a className="share-linkedin social-share-link" href="#" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
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
                                    <Link legacyBehavior href="/blog-grid">
                                        <a className="btn btn-brand-1 btn-icon-load mt--30 hover-up">Load More Posts</a>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="section-box mt-30 mb-40">
                        <div className="container">
                            <h2 className="text-center mb-15 wow animate__animated animate__fadeInUp">Our Happy Customer</h2>
                            <div className="font-lg color-text-paragraph-2 text-center wow animate__animated animate__fadeInUp">
                                When it comes to choosing the right web hosting provider, we know how easy it
                                <br className="d-none d-lg-block" /> is to get overwhelmed with the number.
                            </div>
                            <div className="row mt-50">
                                <div className="box-swiper">
                                    <TestimonialSlider1 />
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
