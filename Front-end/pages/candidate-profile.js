import Link from "next/link";
import React, { useState } from "react";
import Layout from "../components/Layout/Layout";

export default function CandidateProfile() {
    const [activeIndex, setActiveIndex] = useState(1);

    const handleOnClick = (index) => {
        setActiveIndex(index); // remove the curly braces
    };
    return (
        <>
            <Layout>
                <div>
                    <section className="section-box-2">
                        <div className="container">
                            <div className="banner-hero banner-image-single">
                                <img src="assets/imgs/page/candidates/img.png" alt="jobbox" />
                                <a className="btn-editor" href="#" />
                            </div>
                            <div className="box-company-profile">
                                <div className="image-compay">
                                    <img src="assets/imgs/page/candidates/candidate-profile.png" alt="jobbox" />
                                </div>
                                <div className="row mt-10">
                                    <div className="col-lg-8 col-md-12">
                                        <h5 className="f-18">
                                            Steven Jobs <span className="card-location font-regular ml-20">New York, US</span>
                                        </h5>
                                        <p className="mt-0 font-md color-text-paragraph-2 mb-15">UI/UX Designer. Front end Developer</p>
                                    </div>
                                    <div className="col-lg-4 col-md-12 text-lg-end">
                                        <Link legacyBehavior href="page-contact">
                                            <a className="btn btn-preview-icon btn-apply btn-apply-big">Preview</a>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                            <div className="border-bottom pt-10 pb-10" />
                        </div>
                    </section>
                    <section className="section-box mt-50">
                        <div className="container">
                            <div className="row">
                                <div className="col-lg-3 col-md-4 col-sm-12">
                                    <div className="box-nav-tabs nav-tavs-profile mb-5">
                                        <ul className="nav" role="tablist">
                                            <li>
                                                <a className="btn btn-border aboutus-icon mb-20 active" onClick={() => handleOnClick(1)}>
                                                    My Profile
                                                </a>
                                            </li>
                                            <li>
                                                <a className="btn btn-border recruitment-icon mb-20" onClick={() => handleOnClick(2)}>
                                                    My Jobs
                                                </a>
                                            </li>
                                            <li>
                                                <a className="btn btn-border people-icon mb-20" onClick={() => handleOnClick(3)}>
                                                    Saved Jobs
                                                </a>
                                            </li>
                                        </ul>
                                        <div className="border-bottom pt-10 pb-10" />
                                        <div className="mt-20 mb-20">
                                            <Link legacyBehavior href="#">
                                                <a className="link-red">Delete Account</a>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-9 col-md-8 col-sm-12 col-12 mb-50">
                                    <div className="content-single">
                                        <div className="tab-content">
                                            <div className={`tab-pane fade ${activeIndex === 1 && "show active"}`}>
                                                <h3 className="mt-0 mb-15 color-brand-1">My Account</h3>
                                                <Link legacyBehavior href="#">
                                                    <a className="font-md color-text-paragraph-2">Update your profile</a>
                                                </Link>

                                                <div className="mt-35 mb-40 box-info-profie">
                                                    <div className="image-profile">
                                                        <img src="assets/imgs/page/candidates/candidate-profile.png" alt="jobbox" />
                                                    </div>
                                                    <a className="btn btn-apply">Upload Avatar</a>

                                                    <a className="btn btn-link">Delete</a>
                                                </div>
                                                <div className="row form-contact">
                                                    <div className="col-lg-6 col-md-12">
                                                        <div className="form-group">
                                                            <label className="font-sm color-text-mutted mb-10">Full Name *</label>
                                                            <input className="form-control" type="text" defaultValue="Steven Job" />
                                                        </div>
                                                        <div className="form-group">
                                                            <label className="font-sm color-text-mutted mb-10">Email *</label>
                                                            <input className="form-control" type="text" defaultValue="stevenjob@gmail.com" />
                                                        </div>
                                                        <div className="form-group">
                                                            <label className="font-sm color-text-mutted mb-10">Contact number</label>
                                                            <input className="form-control" type="text" defaultValue="01 - 234 567 89" />
                                                        </div>
                                                        <div className="form-group">
                                                            <label className="font-sm color-text-mutted mb-10">Bio</label>
                                                            <textarea className="form-control" rows={4} defaultValue={"We are AliThemes , a creative and dedicated group of individuals who love web development almost as much as we love our customers. We are passionate team with the mission for achieving the perfection in web design."} />
                                                        </div>
                                                        <div className="form-group">
                                                            <label className="font-sm color-text-mutted mb-10">Personal website</label>
                                                            <input className="form-control" type="url" defaultValue="https://alithemes.com" />
                                                        </div>
                                                        <div className="row">
                                                            <div className="col-lg-6">
                                                                <div className="form-group">
                                                                    <label className="font-sm color-text-mutted mb-10">Country</label>
                                                                    <input className="form-control" type="text" defaultValue="United States" />
                                                                </div>
                                                            </div>
                                                            <div className="col-lg-6">
                                                                <div className="form-group">
                                                                    <label className="font-sm color-text-mutted mb-10">State</label>
                                                                    <input className="form-control" type="text" defaultValue="New York" />
                                                                </div>
                                                            </div>
                                                            <div className="col-lg-6">
                                                                <div className="form-group">
                                                                    <label className="font-sm color-text-mutted mb-10">City</label>
                                                                    <input className="form-control" type="text" defaultValue="Mcallen" />
                                                                </div>
                                                            </div>
                                                            <div className="col-lg-6">
                                                                <div className="form-group">
                                                                    <label className="font-sm color-text-mutted mb-10">Zip code</label>
                                                                    <input className="form-control" type="text" defaultValue={82356} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="border-bottom pt-10 pb-10 mb-30" />
                                                        <h6 className="color-orange mb-20">Change your password</h6>
                                                        <div className="row">
                                                            <div className="col-lg-6">
                                                                <div className="form-group">
                                                                    <label className="font-sm color-text-mutted mb-10">Password</label>
                                                                    <input className="form-control" type="password" defaultValue={123456789} />
                                                                </div>
                                                            </div>
                                                            <div className="col-lg-6">
                                                                <div className="form-group">
                                                                    <label className="font-sm color-text-mutted mb-10">Re-Password *</label>
                                                                    <input className="form-control" type="password" defaultValue={123456789} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="border-bottom pt-10 pb-10" />
                                                        <div className="box-agree mt-30">
                                                            <label className="lbl-agree font-xs color-text-paragraph-2">
                                                                <input className="lbl-checkbox" type="checkbox" defaultValue={1} />
                                                                Available for freelancers
                                                            </label>
                                                        </div>
                                                        <div className="box-button mt-15">
                                                            <button className="btn btn-apply-big font-md font-bold">Save All Changes</button>
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-6 col-md-12">
                                                        <div className="box-skills">
                                                            <h5 className="mt-0 color-brand-1">Skills</h5>
                                                            <div className="form-contact">
                                                                <div className="form-group">
                                                                    <input className="form-control search-icon" type="text" placeholder="E.g. Angular, Laravel..." />
                                                                </div>
                                                            </div>
                                                            <div className="box-tags mt-30">
                                                                <a className="btn btn-grey-small mr-10">
                                                                    Figma
                                                                    <span className="close-icon" />
                                                                </a>

                                                                <a className="btn btn-grey-small mr-10">
                                                                    Adobe XD
                                                                    <span className="close-icon" />
                                                                </a>

                                                                <a className="btn btn-grey-small mr-10">
                                                                    NextJS
                                                                    <span className="close-icon" />
                                                                </a>

                                                                <a className="btn btn-grey-small mr-10">
                                                                    React
                                                                    <span className="close-icon" />
                                                                </a>

                                                                <a className="btn btn-grey-small mr-10">
                                                                    App
                                                                    <span className="close-icon" />
                                                                </a>

                                                                <a className="btn btn-grey-small mr-10">
                                                                    Digital
                                                                    <span className="close-icon" />
                                                                </a>

                                                                <a className="btn btn-grey-small mr-10">
                                                                    NodeJS
                                                                    <span className="close-icon" />
                                                                </a>
                                                            </div>
                                                            <div className="mt-40">
                                                                {" "}
                                                                <span className="card-info font-sm color-text-paragraph-2">You can add up to 15 skills</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`tab-pane fade ${activeIndex === 2 && "show active"}`}>
                                                <h3 className="mt-0 color-brand-1 mb-50">My Jobs</h3>
                                                <div className="row display-list">
                                                    <div className="col-xl-12 col-12">
                                                        <div className="card-grid-2 hover-up">
                                                            <span className="flash" />
                                                            <div className="row">
                                                                <div className="col-lg-6 col-md-6 col-sm-12">
                                                                    <div className="card-grid-2-image-left">
                                                                        <div className="image-box">
                                                                            <img src="assets/imgs/brands/brand-5.png" alt="jobBox" />
                                                                        </div>
                                                                        <div className="right-info">
                                                                            <Link legacyBehavior href="#">
                                                                                <a className="name-job">Linkedin</a>
                                                                            </Link>
                                                                            <span className="location-small">New York, US</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="col-lg-6 text-start text-md-end pr-60 col-md-6 col-sm-12">
                                                                    <div className="pl-15 mb-15 mt-30">
                                                                        <Link legacyBehavior href="#">
                                                                            <a className="btn btn-grey-small mr-5">Adobe XD</a>
                                                                        </Link>

                                                                        <Link legacyBehavior href="#">
                                                                            <a className="btn btn-grey-small mr-5">Figma</a>
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="card-block-info">
                                                                <h4>
                                                                    <Link legacyBehavior href="/job-details">
                                                                        <a>React Native Web Developer</a>
                                                                    </Link>
                                                                </h4>
                                                                <div className="mt-5">
                                                                    <span className="card-briefcase">Fulltime</span>
                                                                    <span className="card-time">
                                                                        <span>4</span>
                                                                        <span> mins ago</span>
                                                                    </span>
                                                                </div>
                                                                <p className="font-sm color-text-paragraph mt-10">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Recusandae architecto eveniet, dolor quo repellendus pariatur</p>
                                                                <div className="card-2-bottom mt-20">
                                                                    <div className="row">
                                                                        <div className="col-lg-7 col-7">
                                                                            <span className="card-text-price">$500</span>
                                                                            <span className="text-muted">/Hour</span>
                                                                        </div>
                                                                        <div className="col-lg-5 col-5 text-end">
                                                                            <div className="btn btn-apply-now" data-bs-toggle="modal" data-bs-target="#ModalApplyJobForm">
                                                                                Apply now
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-xl-12 col-12">
                                                        <div className="card-grid-2 hover-up">
                                                            <span className="flash" />
                                                            <div className="row">
                                                                <div className="col-lg-6 col-md-6 col-sm-12">
                                                                    <div className="card-grid-2-image-left">
                                                                        <div className="image-box">
                                                                            <img src="assets/imgs/brands/brand-6.png" alt="jobBox" />
                                                                        </div>
                                                                        <div className="right-info">
                                                                            <Link legacyBehavior href="#">
                                                                                <a className="name-job">Quora JSC</a>
                                                                            </Link>
                                                                            <span className="location-small">New York, US</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="col-lg-6 text-start text-md-end pr-60 col-md-6 col-sm-12">
                                                                    <div className="pl-15 mb-15 mt-30">
                                                                        <Link legacyBehavior href="#">
                                                                            <a className="btn btn-grey-small mr-5">Adobe XD</a>
                                                                        </Link>

                                                                        <Link legacyBehavior href="#">
                                                                            <a className="btn btn-grey-small mr-5">Figma</a>
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="card-block-info">
                                                                <h4>
                                                                    <Link legacyBehavior href="/job-details">
                                                                        <a>Senior System Engineer</a>
                                                                    </Link>
                                                                </h4>
                                                                <div className="mt-5">
                                                                    <span className="card-briefcase">Part time</span>
                                                                    <span className="card-time">
                                                                        <span>5</span>
                                                                        <span> mins ago</span>
                                                                    </span>
                                                                </div>
                                                                <p className="font-sm color-text-paragraph mt-10">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Recusandae architecto eveniet, dolor quo repellendus pariatur.</p>
                                                                <div className="card-2-bottom mt-20">
                                                                    <div className="row">
                                                                        <div className="col-lg-7 col-7">
                                                                            <span className="card-text-price">$800</span>
                                                                            <span className="text-muted">/Hour</span>
                                                                        </div>
                                                                        <div className="col-lg-5 col-5 text-end">
                                                                            <div className="btn btn-apply-now" data-bs-toggle="modal" data-bs-target="#ModalApplyJobForm">
                                                                                Apply now
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-xl-12 col-12">
                                                        <div className="card-grid-2 hover-up">
                                                            <span className="flash" />
                                                            <div className="row">
                                                                <div className="col-lg-6 col-md-6 col-sm-12">
                                                                    <div className="card-grid-2-image-left">
                                                                        <div className="image-box">
                                                                            <img src="assets/imgs/brands/brand-7.png" alt="jobBox" />
                                                                        </div>
                                                                        <div className="right-info">
                                                                            <Link legacyBehavior href="#">
                                                                                <a className="name-job">Nintendo</a>
                                                                            </Link>
                                                                            <span className="location-small">New York, US</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="col-lg-6 text-start text-md-end pr-60 col-md-6 col-sm-12">
                                                                    <div className="pl-15 mb-15 mt-30">
                                                                        <Link legacyBehavior href="#">
                                                                            <a className="btn btn-grey-small mr-5">Adobe XD</a>
                                                                        </Link>

                                                                        <Link legacyBehavior href="#">
                                                                            <a className="btn btn-grey-small mr-5">Figma</a>
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="card-block-info">
                                                                <h4>
                                                                    <Link legacyBehavior href="/job-details">
                                                                        <a>Products Manager</a>
                                                                    </Link>
                                                                </h4>
                                                                <div className="mt-5">
                                                                    <span className="card-briefcase">Full time</span>
                                                                    <span className="card-time">
                                                                        <span>6</span>
                                                                        <span> mins ago</span>
                                                                    </span>
                                                                </div>
                                                                <p className="font-sm color-text-paragraph mt-10">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Recusandae architecto eveniet, dolor quo repellendus pariatur.</p>
                                                                <div className="card-2-bottom mt-20">
                                                                    <div className="row">
                                                                        <div className="col-lg-7 col-7">
                                                                            <span className="card-text-price">$250</span>
                                                                            <span className="text-muted">/Hour</span>
                                                                        </div>
                                                                        <div className="col-lg-5 col-5 text-end">
                                                                            <div className="btn btn-apply-now" data-bs-toggle="modal" data-bs-target="#ModalApplyJobForm">
                                                                                Apply now
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-xl-12 col-12">
                                                        <div className="card-grid-2 hover-up">
                                                            <span className="flash" />
                                                            <div className="row">
                                                                <div className="col-lg-6 col-md-6 col-sm-12">
                                                                    <div className="card-grid-2-image-left">
                                                                        <div className="image-box">
                                                                            <img src="assets/imgs/brands/brand-8.png" alt="jobBox" />
                                                                        </div>
                                                                        <div className="right-info">
                                                                            <Link legacyBehavior href="#">
                                                                                <a className="name-job">Periscope</a>
                                                                            </Link>
                                                                            <span className="location-small">New York, US</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="col-lg-6 text-start text-md-end pr-60 col-md-6 col-sm-12">
                                                                    <div className="pl-15 mb-15 mt-30">
                                                                        <Link legacyBehavior href="#">
                                                                            <a className="btn btn-grey-small mr-5">Adobe XD</a>
                                                                        </Link>

                                                                        <Link legacyBehavior href="#">
                                                                            <a className="btn btn-grey-small mr-5">Figma</a>
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="card-block-info">
                                                                <h4>
                                                                    <Link legacyBehavior href="/job-details">
                                                                        <a>Lead Quality Control QA</a>
                                                                    </Link>
                                                                </h4>
                                                                <div className="mt-5">
                                                                    <span className="card-briefcase">Full time</span>
                                                                    <span className="card-time">
                                                                        <span>6</span>
                                                                        <span> mins ago</span>
                                                                    </span>
                                                                </div>
                                                                <p className="font-sm color-text-paragraph mt-10">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Recusandae architecto eveniet, dolor quo repellendus pariatur.</p>
                                                                <div className="card-2-bottom mt-20">
                                                                    <div className="row">
                                                                        <div className="col-lg-7 col-7">
                                                                            <span className="card-text-price">$250</span>
                                                                            <span className="text-muted">/Hour</span>
                                                                        </div>
                                                                        <div className="col-lg-5 col-5 text-end">
                                                                            <div className="btn btn-apply-now" data-bs-toggle="modal" data-bs-target="#ModalApplyJobForm">
                                                                                Apply now
                                                                            </div>
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
                                            <div className={`tab-pane fade ${activeIndex === 3 && "show active"}`}>
                                                <h3 className="mt-0 color-brand-1 mb-50">Saved Jobs</h3>
                                                <div className="row">
                                                    <div className="col-xl-4 col-lg-4 col-md-6 col-sm-12 col-12">
                                                        <div className="card-grid-2 hover-up">
                                                            <div className="card-grid-2-image-left">
                                                                <span className="flash" />
                                                                <div className="image-box">
                                                                    <img src="assets/imgs/brands/brand-1.png" alt="jobBox" />
                                                                </div>
                                                                <div className="right-info">
                                                                    <Link legacyBehavior href="#">
                                                                        <a className="name-job">LinkedIn</a>
                                                                    </Link>
                                                                    <span className="location-small">New York, US</span>
                                                                </div>
                                                            </div>
                                                            <div className="card-block-info">
                                                                <h6>
                                                                    <Link legacyBehavior href="/job-details">
                                                                        <a>UI / UX Designer fulltime</a>
                                                                    </Link>
                                                                </h6>
                                                                <div className="mt-5">
                                                                    <span className="card-briefcase">Fulltime</span>
                                                                    <span className="card-time">
                                                                        4<span> minutes ago</span>
                                                                    </span>
                                                                </div>
                                                                <p className="font-sm color-text-paragraph mt-15">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Recusandae architecto eveniet, dolor quo repellendus pariatur</p>
                                                                <div className="mt-30">
                                                                    <Link legacyBehavior href="/jobs-grid">
                                                                        <a className="btn btn-grey-small mr-5">Adobe XD</a>
                                                                    </Link>

                                                                    <Link legacyBehavior href="/jobs-grid">
                                                                        <a className="btn btn-grey-small mr-5">Figma</a>
                                                                    </Link>

                                                                    <Link legacyBehavior href="/jobs-grid">
                                                                        <a className="btn btn-grey-small mr-5">Photoshop</a>
                                                                    </Link>
                                                                </div>
                                                                <div className="card-2-bottom mt-30">
                                                                    <div className="row">
                                                                        <div className="col-lg-7 col-7">
                                                                            <span className="card-text-price">$500</span>
                                                                            <span className="text-muted">/Hour</span>
                                                                        </div>
                                                                        <div className="col-lg-5 col-5 text-end">
                                                                            <div className="btn btn-apply-now" data-bs-toggle="modal" data-bs-target="#ModalApplyJobForm">
                                                                                Apply now
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-xl-4 col-lg-4 col-md-6 col-sm-12 col-12">
                                                        <div className="card-grid-2 hover-up">
                                                            <div className="card-grid-2-image-left">
                                                                <span className="flash" />
                                                                <div className="image-box">
                                                                    <img src="assets/imgs/brands/brand-2.png" alt="jobBox" />
                                                                </div>
                                                                <div className="right-info">
                                                                    <Link legacyBehavior href="#">
                                                                        <a className="name-job">Adobe Ilustrator</a>
                                                                    </Link>
                                                                    <span className="location-small">New York, US</span>
                                                                </div>
                                                            </div>
                                                            <div className="card-block-info">
                                                                <h6>
                                                                    <Link legacyBehavior href="/job-details">
                                                                        <a>Full Stack Engineer</a>
                                                                    </Link>
                                                                </h6>
                                                                <div className="mt-5">
                                                                    <span className="card-briefcase">Part time</span>
                                                                    <span className="card-time">
                                                                        5<span> minutes ago</span>
                                                                    </span>
                                                                </div>
                                                                <p className="font-sm color-text-paragraph mt-15">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Recusandae architecto eveniet, dolor quo repellendus pariatur.</p>
                                                                <div className="mt-30">
                                                                    <Link legacyBehavior href="/jobs-grid">
                                                                        <a className="btn btn-grey-small mr-5">React</a>
                                                                    </Link>

                                                                    <Link legacyBehavior href="/jobs-grid">
                                                                        <a className="btn btn-grey-small mr-5">NodeJS</a>
                                                                    </Link>
                                                                </div>
                                                                <div className="card-2-bottom mt-30">
                                                                    <div className="row">
                                                                        <div className="col-lg-7 col-7">
                                                                            <span className="card-text-price">$800</span>
                                                                            <span className="text-muted">/Hour</span>
                                                                        </div>
                                                                        <div className="col-lg-5 col-5 text-end">
                                                                            <div className="btn btn-apply-now" data-bs-toggle="modal" data-bs-target="#ModalApplyJobForm">
                                                                                Apply now
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-xl-4 col-lg-4 col-md-6 col-sm-12 col-12">
                                                        <div className="card-grid-2 hover-up">
                                                            <div className="card-grid-2-image-left">
                                                                <span className="flash" />
                                                                <div className="image-box">
                                                                    <img src="assets/imgs/brands/brand-3.png" alt="jobBox" />
                                                                </div>
                                                                <div className="right-info">
                                                                    <Link legacyBehavior href="#">
                                                                        <a className="name-job">Bing Search</a>
                                                                    </Link>
                                                                    <span className="location-small">New York, US</span>
                                                                </div>
                                                            </div>
                                                            <div className="card-block-info">
                                                                <h6>
                                                                    <Link legacyBehavior href="/job-details">
                                                                        <a>Java Software Engineer</a>
                                                                    </Link>
                                                                </h6>
                                                                <div className="mt-5">
                                                                    <span className="card-briefcase">Full time</span>
                                                                    <span className="card-time">
                                                                        6<span> minutes ago</span>
                                                                    </span>
                                                                </div>
                                                                <p className="font-sm color-text-paragraph mt-15">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Recusandae architecto eveniet, dolor quo repellendus pariatur.</p>
                                                                <div className="mt-30">
                                                                    <Link legacyBehavior href="/jobs-grid">
                                                                        <a className="btn btn-grey-small mr-5">Python</a>
                                                                    </Link>

                                                                    <Link legacyBehavior href="/jobs-grid">
                                                                        <a className="btn btn-grey-small mr-5">AWS</a>
                                                                    </Link>

                                                                    <Link legacyBehavior href="/jobs-grid">
                                                                        <a className="btn btn-grey-small mr-5">Photoshop</a>
                                                                    </Link>
                                                                </div>
                                                                <div className="card-2-bottom mt-30">
                                                                    <div className="row">
                                                                        <div className="col-lg-7 col-7">
                                                                            <span className="card-text-price">$250</span>
                                                                            <span className="text-muted">/Hour</span>
                                                                        </div>
                                                                        <div className="col-lg-5 col-5 text-end">
                                                                            <div className="btn btn-apply-now" data-bs-toggle="modal" data-bs-target="#ModalApplyJobForm">
                                                                                Apply now
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-xl-4 col-lg-4 col-md-6 col-sm-12 col-12">
                                                        <div className="card-grid-2 hover-up">
                                                            <div className="card-grid-2-image-left">
                                                                <span className="flash" />
                                                                <div className="image-box">
                                                                    <img src="assets/imgs/brands/brand-4.png" alt="jobBox" />
                                                                </div>
                                                                <div className="right-info">
                                                                    <Link legacyBehavior href="#">
                                                                        <a className="name-job">Dailymotion</a>
                                                                    </Link>
                                                                    <span className="location-small">New York, US</span>
                                                                </div>
                                                            </div>
                                                            <div className="card-block-info">
                                                                <h6>
                                                                    <Link legacyBehavior href="/job-details">
                                                                        <a>Frontend Developer</a>
                                                                    </Link>
                                                                </h6>
                                                                <div className="mt-5">
                                                                    <span className="card-briefcase">Full time</span>
                                                                    <span className="card-time">
                                                                        6<span> minutes ago</span>
                                                                    </span>
                                                                </div>
                                                                <p className="font-sm color-text-paragraph mt-15">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Recusandae architecto eveniet, dolor quo repellendus pariatur.</p>
                                                                <div className="mt-30">
                                                                    <Link legacyBehavior href="/jobs-grid">
                                                                        <a className="btn btn-grey-small mr-5">Typescript</a>
                                                                    </Link>

                                                                    <Link legacyBehavior href="/jobs-grid">
                                                                        <a className="btn btn-grey-small mr-5">Java</a>
                                                                    </Link>
                                                                </div>
                                                                <div className="card-2-bottom mt-30">
                                                                    <div className="row">
                                                                        <div className="col-lg-7 col-7">
                                                                            <span className="card-text-price">$250</span>
                                                                            <span className="text-muted">/Hour</span>
                                                                        </div>
                                                                        <div className="col-lg-5 col-5 text-end">
                                                                            <div className="btn btn-apply-now" data-bs-toggle="modal" data-bs-target="#ModalApplyJobForm">
                                                                                Apply now
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-xl-4 col-lg-4 col-md-6 col-sm-12 col-12">
                                                        <div className="card-grid-2 hover-up">
                                                            <div className="card-grid-2-image-left">
                                                                <span className="flash" />
                                                                <div className="image-box">
                                                                    <img src="assets/imgs/brands/brand-5.png" alt="jobBox" />
                                                                </div>
                                                                <div className="right-info">
                                                                    <Link legacyBehavior href="#">
                                                                        <a className="name-job">Linkedin</a>
                                                                    </Link>
                                                                    <span className="location-small">New York, US</span>
                                                                </div>
                                                            </div>
                                                            <div className="card-block-info">
                                                                <h6>
                                                                    <Link legacyBehavior href="/job-details">
                                                                        <a>React Native Web Developer</a>
                                                                    </Link>
                                                                </h6>
                                                                <div className="mt-5">
                                                                    <span className="card-briefcase">Fulltime</span>
                                                                    <span className="card-time">
                                                                        4<span> minutes ago</span>
                                                                    </span>
                                                                </div>
                                                                <p className="font-sm color-text-paragraph mt-15">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Recusandae architecto eveniet, dolor quo repellendus pariatur</p>
                                                                <div className="mt-30">
                                                                    <Link legacyBehavior href="/jobs-grid">
                                                                        <a className="btn btn-grey-small mr-5">Angular</a>
                                                                    </Link>
                                                                </div>
                                                                <div className="card-2-bottom mt-30">
                                                                    <div className="row">
                                                                        <div className="col-lg-7 col-7">
                                                                            <span className="card-text-price">$500</span>
                                                                            <span className="text-muted">/Hour</span>
                                                                        </div>
                                                                        <div className="col-lg-5 col-5 text-end">
                                                                            <div className="btn btn-apply-now" data-bs-toggle="modal" data-bs-target="#ModalApplyJobForm">
                                                                                Apply now
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-xl-4 col-lg-4 col-md-6 col-sm-12 col-12">
                                                        <div className="card-grid-2 hover-up">
                                                            <div className="card-grid-2-image-left">
                                                                <span className="flash" />
                                                                <div className="image-box">
                                                                    <img src="assets/imgs/brands/brand-6.png" alt="jobBox" />
                                                                </div>
                                                                <div className="right-info">
                                                                    <Link legacyBehavior href="#">
                                                                        <a className="name-job">Quora JSC</a>
                                                                    </Link>
                                                                    <span className="location-small">New York, US</span>
                                                                </div>
                                                            </div>
                                                            <div className="card-block-info">
                                                                <h6>
                                                                    <Link legacyBehavior href="/job-details">
                                                                        <a>Senior System Engineer</a>
                                                                    </Link>
                                                                </h6>
                                                                <div className="mt-5">
                                                                    <span className="card-briefcase">Part time</span>
                                                                    <span className="card-time">
                                                                        5<span> minutes ago</span>
                                                                    </span>
                                                                </div>
                                                                <p className="font-sm color-text-paragraph mt-15">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Recusandae architecto eveniet, dolor quo repellendus pariatur.</p>
                                                                <div className="mt-30">
                                                                    <Link legacyBehavior href="/job-details">
                                                                        <a className="btn btn-grey-small mr-5">PHP</a>
                                                                    </Link>

                                                                    <Link legacyBehavior href="/job-details">
                                                                        <a className="btn btn-grey-small mr-5">Android</a>
                                                                    </Link>
                                                                </div>
                                                                <div className="card-2-bottom mt-30">
                                                                    <div className="row">
                                                                        <div className="col-lg-7 col-7">
                                                                            <span className="card-text-price">$800</span>
                                                                            <span className="text-muted">/Hour</span>
                                                                        </div>
                                                                        <div className="col-lg-5 col-5 text-end">
                                                                            <div className="btn btn-apply-now" data-bs-toggle="modal" data-bs-target="#ModalApplyJobForm">
                                                                                Apply now
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-xl-4 col-lg-4 col-md-6 col-sm-12 col-12">
                                                        <div className="card-grid-2 hover-up">
                                                            <div className="card-grid-2-image-left">
                                                                <span className="flash" />
                                                                <div className="image-box">
                                                                    <img src="assets/imgs/brands/brand-7.png" alt="jobBox" />
                                                                </div>
                                                                <div className="right-info">
                                                                    <Link legacyBehavior href="#">
                                                                        <a className="name-job">Nintendo</a>
                                                                    </Link>
                                                                    <span className="location-small">New York, US</span>
                                                                </div>
                                                            </div>
                                                            <div className="card-block-info">
                                                                <h6>
                                                                    <Link legacyBehavior href="/job-details">
                                                                        <a>Products Manager</a>
                                                                    </Link>
                                                                </h6>
                                                                <div className="mt-5">
                                                                    <span className="card-briefcase">Full time</span>
                                                                    <span className="card-time">
                                                                        6<span> minutes ago</span>
                                                                    </span>
                                                                </div>
                                                                <p className="font-sm color-text-paragraph mt-15">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Recusandae architecto eveniet, dolor quo repellendus pariatur.</p>
                                                                <div className="mt-30">
                                                                    <Link legacyBehavior href="/job-details">
                                                                        <a className="btn btn-grey-small mr-5">ASP .Net</a>
                                                                    </Link>

                                                                    <Link legacyBehavior href="/job-details">
                                                                        <a className="btn btn-grey-small mr-5">Figma</a>
                                                                    </Link>
                                                                </div>
                                                                <div className="card-2-bottom mt-30">
                                                                    <div className="row">
                                                                        <div className="col-lg-7 col-7">
                                                                            <span className="card-text-price">$250</span>
                                                                            <span className="text-muted">/Hour</span>
                                                                        </div>
                                                                        <div className="col-lg-5 col-5 text-end">
                                                                            <div className="btn btn-apply-now" data-bs-toggle="modal" data-bs-target="#ModalApplyJobForm">
                                                                                Apply now
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-xl-4 col-lg-4 col-md-6 col-sm-12 col-12">
                                                        <div className="card-grid-2 hover-up">
                                                            <div className="card-grid-2-image-left">
                                                                <span className="flash" />
                                                                <div className="image-box">
                                                                    <img src="assets/imgs/brands/brand-8.png" alt="jobBox" />
                                                                </div>
                                                                <div className="right-info">
                                                                    <Link legacyBehavior href="#">
                                                                        <a className="name-job">Periscope</a>
                                                                    </Link>
                                                                    <span className="location-small">New York, US</span>
                                                                </div>
                                                            </div>
                                                            <div className="card-block-info">
                                                                <h6>
                                                                    <Link legacyBehavior href="/job-details">
                                                                        <a>Lead Quality Control QA</a>
                                                                    </Link>
                                                                </h6>
                                                                <div className="mt-5">
                                                                    <span className="card-briefcase">Full time</span>
                                                                    <span className="card-time">
                                                                        6<span> minutes ago</span>
                                                                    </span>
                                                                </div>
                                                                <p className="font-sm color-text-paragraph mt-15">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Recusandae architecto eveniet, dolor quo repellendus pariatur.</p>
                                                                <div className="mt-30">
                                                                    <Link legacyBehavior href="/job-details">
                                                                        <a className="btn btn-grey-small mr-5">iOS</a>
                                                                    </Link>

                                                                    <Link legacyBehavior href="/job-details">
                                                                        <a className="btn btn-grey-small mr-5">Laravel</a>
                                                                    </Link>

                                                                    <Link legacyBehavior href="/job-details">
                                                                        <a className="btn btn-grey-small mr-5">Golang</a>
                                                                    </Link>
                                                                </div>
                                                                <div className="card-2-bottom mt-30">
                                                                    <div className="row">
                                                                        <div className="col-lg-7 col-7">
                                                                            <span className="card-text-price">$250</span>
                                                                            <span className="text-muted">/Hour</span>
                                                                        </div>
                                                                        <div className="col-lg-5 col-5 text-end">
                                                                            <div className="btn btn-apply-now" data-bs-toggle="modal" data-bs-target="#ModalApplyJobForm">
                                                                                Apply now
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-xl-4 col-lg-4 col-md-6 col-sm-12 col-12">
                                                        <div className="card-grid-2 hover-up">
                                                            <div className="card-grid-2-image-left">
                                                                <span className="flash" />
                                                                <div className="image-box">
                                                                    <img src="assets/imgs/brands/brand-8.png" alt="jobBox" />
                                                                </div>
                                                                <div className="right-info">
                                                                    <Link legacyBehavior href="#">
                                                                        <a className="name-job">Periscope</a>
                                                                    </Link>
                                                                    <span className="location-small">New York, US</span>
                                                                </div>
                                                            </div>
                                                            <div className="card-block-info">
                                                                <h6>
                                                                    <Link legacyBehavior href="/job-details">
                                                                        <a>Lead Quality Control QA</a>
                                                                    </Link>
                                                                </h6>
                                                                <div className="mt-5">
                                                                    <span className="card-briefcase">Full time</span>
                                                                    <span className="card-time">
                                                                        6<span> minutes ago</span>
                                                                    </span>
                                                                </div>
                                                                <p className="font-sm color-text-paragraph mt-15">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Recusandae architecto eveniet, dolor quo repellendus pariatur.</p>
                                                                <div className="mt-30">
                                                                    <Link legacyBehavior href="/job-details">
                                                                        <a className="btn btn-grey-small mr-5">iOS</a>
                                                                    </Link>

                                                                    <Link legacyBehavior href="/job-details">
                                                                        <a className="btn btn-grey-small mr-5">Laravel</a>
                                                                    </Link>

                                                                    <Link legacyBehavior href="/job-details">
                                                                        <a className="btn btn-grey-small mr-5">Golang</a>
                                                                    </Link>
                                                                </div>
                                                                <div className="card-2-bottom mt-30">
                                                                    <div className="row">
                                                                        <div className="col-lg-7 col-7">
                                                                            <span className="card-text-price">$250</span>
                                                                            <span className="text-muted">/Hour</span>
                                                                        </div>
                                                                        <div className="col-lg-5 col-5 text-end">
                                                                            <div className="btn btn-apply-now" data-bs-toggle="modal" data-bs-target="#ModalApplyJobForm">
                                                                                Apply now
                                                                            </div>
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
