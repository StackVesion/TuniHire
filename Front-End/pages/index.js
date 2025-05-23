/* eslint-disable @next/next/no-img-element */
import Layout from "../components/Layout/Layout";
import TopRekruterSlider from "./../components/sliders/TopRekruter";
import BlogSlider from "./../components/sliders/Blog";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";

export default function Home() {
    const router = useRouter();
    const [authMessage, setAuthMessage] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [companyJobs, setCompanyJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCompanyIndex, setActiveCompanyIndex] = useState(0);
    const [locationStats, setLocationStats] = useState([]);

    useEffect(() => {
        // Check if there's a token in the URL (from Google OAuth)
        const { token, userData, error } = router.query;

        // Handle authentication errors
        if (error) {
            setAuthMessage({ type: 'error', text: decodeURIComponent(error) });
            return;
        }

        if (token && userData) {
            try {
                // Store token
                localStorage.setItem("token", token);
                
                // Parse and store user data
                const userInfo = JSON.parse(decodeURIComponent(userData));
                localStorage.setItem("user", JSON.stringify(userInfo));
                
                // Show success message
                setAuthMessage({ type: 'success', text: 'Successfully signed in!' });
                
                // Clear URL parameters without reloading page
                router.replace('/', undefined, { shallow: true });
            } catch (error) {
                console.error('Error processing auth data:', error);
                setAuthMessage({ type: 'error', text: 'Failed to process authentication data' });
            }
        }
    }, [router.query, router]);

    // Fetch companies and jobs from database
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Fetch companies
                const companiesResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/companies`);
                const companiesData = companiesResponse.data.companies || [];
                
                // Get all companies with Approved or Pending status
                const availableCompanies = companiesData.filter(company => 
                    company.status === "Approved" || company.status === "Pending"
                );
                setCompanies(availableCompanies);
                
                if (availableCompanies.length > 0) {
                    // Fetch jobs for each company
                    const jobsPromises = availableCompanies.map(company => 
                        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/jobs/company/${company._id}`)
                    );
                    
                    const jobsResponses = await Promise.all(jobsPromises);
                    
                    // Organize jobs by company
                    const jobsByCompany = availableCompanies.map((company, index) => {
                        return {
                            company,
                            jobs: jobsResponses[index].data || []
                        };
                    });
                    
                    setCompanyJobs(jobsByCompany);
                }

                // Fetch location statistics
                try {
                    const locationsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/jobs/locations`);
                    setLocationStats(locationsResponse.data || []);
                } catch (locationError) {
                    console.error("Error fetching location data:", locationError);
                    // Set empty array if API fails - don't let this error prevent other parts from loading
                    setLocationStats([]);
                }
                
                setLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                setLoading(false);
            }
        };
        
        fetchData();
    }, []);

    const handleSelectCompany = (index) => {
        setActiveCompanyIndex(index);
    };

    return (
        <>
            <Layout>
                {authMessage && (
                    <div className={`alert alert-${authMessage.type === 'success' ? 'success' : 'danger'} text-center`}
                         style={{ margin: '0', borderRadius: '0' }}>
                        {authMessage.text}
                    </div>
                )}
                <div className="bg-homepage1" />
                <br></br>
                <section className="section-box">
                    <div className="banner-hero hero-1">
                        <div className="banner-inner">
                            <div className="row">
                                <div className="col-xl-8 col-lg-12">
                                    <div className="block-banner">
                                        <h1 className="heading-banner wow animate__animated animate__fadeInUp">
                                            The <span className="color-brand-2">Easiest Way</span>
                                            <br className="d-none d-lg-block" />
                                            to Get Your New Job
                                        </h1>
                                        <div className="banner-description mt-20 wow animate__animated animate__fadeInUp" data-wow-delay=".1s">
                                            Each month, more than 3 million job seekers turn to <br className="d-none d-lg-block" />
                                            website in their search for work, making over 140,000 <br className="d-none d-lg-block" />
                                            applications every single day
                                        </div>
                                        <div className="form-find mt-40 wow animate__animated animate__fadeIn" data-wow-delay=".2s">
                                            <form>
                                                <div className="box-industry">
                                                    <select className="form-input mr-10 select-active input-industry">
                                                        <option value={0}>Industry</option>
                                                        <option value={1}>Software</option>
                                                        <option value={2}>Finance</option>
                                                        <option value={3}>Recruting</option>
                                                        <option value={4}>Management</option>
                                                        <option value={5}>Advertising</option>
                                                        <option value={6}>Development</option>
                                                    </select>
                                                </div>
                                                <div className="box-industry">
                                                    <select className="form-input mr-10 select-active  input-location">
                                                        <option value>Location</option>
                                                        <option value="AX">Aland Islands</option>
                                                        <option value="AF">Afghanistan</option>
                                                        <option value="AL">Albania</option>
                                                        <option value="DZ">Algeria</option>
                                                        <option value="AD">Andorra</option>
                                                        <option value="AO">Angola</option>
                                                        <option value="AI">Anguilla</option>
                                                        <option value="AQ">Antarctica</option>
                                                        <option value="AG">Antigua and Barbuda</option>
                                                        <option value="AR">Argentina</option>
                                                        <option value="AM">Armenia</option>
                                                        <option value="AW">Aruba</option>
                                                        <option value="AU">Australia</option>
                                                        <option value="AT">Austria</option>
                                                        <option value="AZ">Azerbaijan</option>
                                                        <option value="BS">Bahamas</option>
                                                        <option value="BH">Bahrain</option>
                                                        <option value="BD">Bangladesh</option>
                                                        <option value="BB">Barbados</option>
                                                        <option value="BY">Belarus</option>
                                                        <option value="PW">Belau</option>
                                                        <option value="BE">Belgium</option>
                                                        <option value="BZ">Belize</option>
                                                        <option value="BJ">Benin</option>
                                                        <option value="BM">Bermuda</option>
                                                        <option value="BT">Bhutan</option>
                                                        <option value="BO">Bolivia</option>
                                                        <option value="BQ">Bonaire, Saint Eustatius and Saba</option>
                                                        <option value="BA">Bosnia and Herzegovina</option>
                                                        <option value="BW">Botswana</option>
                                                        <option value="BV">Bouvet Island</option>
                                                        <option value="BR">Brazil</option>
                                                        <option value="IO">British Indian Ocean Territory</option>
                                                        <option value="VG">British Virgin Islands</option>
                                                        <option value="BN">Brunei</option>
                                                        <option value="BG">Bulgaria</option>
                                                        <option value="BF">Burkina Faso</option>
                                                        <option value="BI">Burundi</option>
                                                        <option value="KH">Cambodia</option>
                                                        <option value="CM">Cameroon</option>
                                                        <option value="CA">Canada</option>
                                                        <option value="CV">Cape Verde</option>
                                                        <option value="KY">Cayman Islands</option>
                                                        <option value="CF">Central African Republic</option>
                                                        <option value="TD">Chad</option>
                                                        <option value="CL">Chile</option>
                                                        <option value="CN">China</option>
                                                        <option value="CX">Christmas Island</option>
                                                        <option value="CC">Cocos (Keeling) Islands</option>
                                                        <option value="CO">Colombia</option>
                                                        <option value="KM">Comoros</option>
                                                        <option value="CG">Congo (Brazzaville)</option>
                                                        <option value="CD">Congo (Kinshasa)</option>
                                                        <option value="CK">Cook Islands</option>
                                                        <option value="CR">Costa Rica</option>
                                                        <option value="HR">Croatia</option>
                                                        <option value="CU">Cuba</option>
                                                        <option value="CW">CuraÇao</option>
                                                        <option value="CY">Cyprus</option>
                                                        <option value="CZ">Czech Republic</option>
                                                        <option value="DK">Denmark</option>
                                                        <option value="DJ">Djibouti</option>
                                                        <option value="DM">Dominica</option>
                                                        <option value="DO">Dominican Republic</option>
                                                        <option value="EC">Ecuador</option>
                                                        <option value="EG">Egypt</option>
                                                        <option value="SV">El Salvador</option>
                                                        <option value="GQ">Equatorial Guinea</option>
                                                        <option value="ER">Eritrea</option>
                                                        <option value="EE">Estonia</option>
                                                        <option value="ET">Ethiopia</option>
                                                        <option value="FK">Falkland Islands</option>
                                                        <option value="FO">Faroe Islands</option>
                                                        <option value="FJ">Fiji</option>
                                                        <option value="FI">Finland</option>
                                                        <option value="FR">France</option>
                                                        <option value="GF">French Guiana</option>
                                                        <option value="PF">French Polynesia</option>
                                                        <option value="TF">French Southern Territories</option>
                                                        <option value="GA">Gabon</option>
                                                        <option value="GM">Gambia</option>
                                                        <option value="GE">Georgia</option>
                                                        <option value="DE">Germany</option>
                                                        <option value="GH">Ghana</option>
                                                        <option value="GI">Gibraltar</option>
                                                        <option value="GR">Greece</option>
                                                        <option value="GL">Greenland</option>
                                                        <option value="GD">Grenada</option>
                                                        <option value="GP">Guadeloupe</option>
                                                        <option value="GT">Guatemala</option>
                                                        <option value="GG">Guernsey</option>
                                                        <option value="GN">Guinea</option>
                                                        <option value="GW">Guinea-Bissau</option>
                                                        <option value="GY">Guyana</option>
                                                        <option value="HT">Haiti</option>
                                                        <option value="HM">Heard Island and McDonald Islands</option>
                                                        <option value="HN">Honduras</option>
                                                        <option value="HK">Hong Kong</option>
                                                        <option value="HU">Hungary</option>
                                                        <option value="IS">Iceland</option>
                                                        <option value="IN">India</option>
                                                        <option value="ID">Indonesia</option>
                                                        <option value="IR">Iran</option>
                                                        <option value="IQ">Iraq</option>
                                                        <option value="IM">Isle of Man</option>
                                                        <option value="IL">Israel</option>
                                                        <option value="IT">Italy</option>
                                                        <option value="CI">Ivory Coast</option>
                                                        <option value="JM">Jamaica</option>
                                                        <option value="JP">Japan</option>
                                                        <option value="JE">Jersey</option>
                                                        <option value="JO">Jordan</option>
                                                        <option value="KZ">Kazakhstan</option>
                                                        <option value="KE">Kenya</option>
                                                        <option value="KI">Kiribati</option>
                                                        <option value="KW">Kuwait</option>
                                                        <option value="KG">Kyrgyzstan</option>
                                                        <option value="LA">Laos</option>
                                                        <option value="LV">Latvia</option>
                                                        <option value="LB">Lebanon</option>
                                                        <option value="LS">Lesotho</option>
                                                        <option value="LR">Liberia</option>
                                                        <option value="LY">Libya</option>
                                                        <option value="LI">Liechtenstein</option>
                                                        <option value="LT">Lithuania</option>
                                                        <option value="LU">Luxembourg</option>
                                                        <option value="MO">Macao S.A.R., China</option>
                                                        <option value="MK">Macedonia</option>
                                                        <option value="MG">Madagascar</option>
                                                        <option value="MW">Malawi</option>
                                                        <option value="MY">Malaysia</option>
                                                        <option value="MV">Maldives</option>
                                                        <option value="ML">Mali</option>
                                                        <option value="MT">Malta</option>
                                                        <option value="MH">Marshall Islands</option>
                                                        <option value="MQ">Martinique</option>
                                                        <option value="MR">Mauritania</option>
                                                        <option value="MU">Mauritius</option>
                                                        <option value="YT">Mayotte</option>
                                                        <option value="MX">Mexico</option>
                                                        <option value="FM">Micronesia</option>
                                                        <option value="MD">Moldova</option>
                                                        <option value="MC">Monaco</option>
                                                        <option value="MN">Mongolia</option>
                                                        <option value="ME">Montenegro</option>
                                                        <option value="MS">Montserrat</option>
                                                        <option value="MA">Morocco</option>
                                                        <option value="MZ">Mozambique</option>
                                                        <option value="MM">Myanmar</option>
                                                        <option value="NA">Namibia</option>
                                                        <option value="NR">Nauru</option>
                                                        <option value="NP">Nepal</option>
                                                        <option value="NL">Netherlands</option>
                                                        <option value="AN">Netherlands Antilles</option>
                                                        <option value="NC">New Caledonia</option>
                                                        <option value="NZ">New Zealand</option>
                                                        <option value="NI">Nicaragua</option>
                                                        <option value="NE">Niger</option>
                                                        <option value="NG">Nigeria</option>
                                                        <option value="NU">Niue</option>
                                                        <option value="NF">Norfolk Island</option>
                                                        <option value="KP">North Korea</option>
                                                        <option value="NO">Norway</option>
                                                        <option value="OM">Oman</option>
                                                        <option value="PK">Pakistan</option>
                                                        <option value="PS">Palestinian Territory</option>
                                                        <option value="PA">Panama</option>
                                                        <option value="PG">Papua New Guinea</option>
                                                        <option value="PY">Paraguay</option>
                                                        <option value="PE">Peru</option>
                                                        <option value="PH">Philippines</option>
                                                        <option value="PN">Pitcairn</option>
                                                        <option value="PL">Poland</option>
                                                        <option value="PT">Portugal</option>
                                                        <option value="QA">Qatar</option>
                                                        <option value="IE">Republic of Ireland</option>
                                                        <option value="RE">Reunion</option>
                                                        <option value="RO">Romania</option>
                                                        <option value="RU">Russia</option>
                                                        <option value="RW">Rwanda</option>
                                                        <option value="ST">São Tomé and Príncipe</option>
                                                        <option value="BL">Saint Barthélemy</option>
                                                        <option value="SH">Saint Helena</option>
                                                        <option value="KN">Saint Kitts and Nevis</option>
                                                        <option value="LC">Saint Lucia</option>
                                                        <option value="SX">Saint Martin (Dutch part)</option>
                                                        <option value="MF">Saint Martin (French part)</option>
                                                        <option value="PM">Saint Pierre and Miquelon</option>
                                                        <option value="VC">Saint Vincent and the Grenadines</option>
                                                        <option value="SM">San Marino</option>
                                                        <option value="SA">Saudi Arabia</option>
                                                        <option value="SN">Senegal</option>
                                                        <option value="RS">Serbia</option>
                                                        <option value="SC">Seychelles</option>
                                                        <option value="SL">Sierra Leone</option>
                                                        <option value="SG">Singapore</option>
                                                        <option value="SK">Slovakia</option>
                                                        <option value="SI">Slovenia</option>
                                                        <option value="SB">Solomon Islands</option>
                                                        <option value="SO">Somalia</option>
                                                        <option value="ZA">South Africa</option>
                                                        <option value="GS">South Georgia/Sandwich Islands</option>
                                                        <option value="KR">South Korea</option>
                                                        <option value="SS">South Sudan</option>
                                                        <option value="ES">Spain</option>
                                                        <option value="LK">Sri Lanka</option>
                                                        <option value="SD">Sudan</option>
                                                        <option value="SR">Suriname</option>
                                                        <option value="SJ">Svalbard and Jan Mayen</option>
                                                        <option value="SZ">Swaziland</option>
                                                        <option value="SE">Sweden</option>
                                                        <option value="CH">Switzerland</option>
                                                        <option value="SY">Syria</option>
                                                        <option value="TW">Taiwan</option>
                                                        <option value="TJ">Tajikistan</option>
                                                        <option value="TZ">Tanzania</option>
                                                        <option value="TH">Thailand</option>
                                                        <option value="TL">Timor-Leste</option>
                                                        <option value="TG">Togo</option>
                                                        <option value="TK">Tokelau</option>
                                                        <option value="TO">Tonga</option>
                                                        <option value="TT">Trinidad and Tobago</option>
                                                        <option value="TN">Tunisia</option>
                                                        <option value="TR">Turkey</option>
                                                        <option value="TM">Turkmenistan</option>
                                                        <option value="TC">Turks and Caicos Islands</option>
                                                        <option value="TV">Tuvalu</option>
                                                        <option value="UG">Uganda</option>
                                                        <option value="UA">Ukraine</option>
                                                        <option value="AE">United Arab Emirates</option>
                                                        <option value="GB">United Kingdom (UK)</option>
                                                        <option value="US">USA (US)</option>
                                                        <option value="UY">Uruguay</option>
                                                        <option value="UZ">Uzbekistan</option>
                                                        <option value="VU">Vanuatu</option>
                                                        <option value="VA">Vatican</option>
                                                        <option value="VE">Venezuela</option>
                                                        <option value="VN">Vietnam</option>
                                                        <option value="WF">Wallis and Futuna</option>
                                                        <option value="EH">Western Sahara</option>
                                                        <option value="WS">Western Samoa</option>
                                                        <option value="YE">Yemen</option>
                                                        <option value="ZM">Zambia</option>
                                                        <option value="ZW">Zimbabwe</option>
                                                    </select>
                                                </div>
                                                <input className="form-input input-keysearch mr-10" type="text" placeholder="Your keyword... " />
                                                <button className="btn btn-default btn-find font-sm">Search</button>
                                            </form>
                                        </div>
                                        <div className="list-tags-banner mt-60 wow animate__animated animate__fadeInUp" data-wow-delay=".3s">
                                            <strong>Popular Searches:</strong>
                                            <Link legacyBehavior href="#">
                                                <a>Designer, </a>
                                            </Link>
                                            <Link legacyBehavior href="#">
                                                <a>Web, </a>
                                            </Link>
                                            <Link legacyBehavior href="#">
                                                <a>IOS, </a>
                                            </Link>
                                            <Link legacyBehavior href="#">
                                                <a>Developer, </a>
                                            </Link>
                                            <Link legacyBehavior href="#">
                                                <a>PHP, </a>
                                            </Link>
                                            <Link legacyBehavior href="#">
                                                <a>Senior, </a>
                                            </Link>
                                            <Link legacyBehavior href="#">
                                                <a>Engineer, </a>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-xl-4 col-lg-12 d-none d-xl-block col-md-6">
                                    <div className="banner-imgs">
                                        <div className="block-1 shape-1">
                                            <img className="img-responsive" alt="jobBox" src="assets/imgs/page/homepage1/banner1.png" />
                                        </div>
                                        <div className="block-2 shape-2">
                                            <img className="img-responsive" alt="jobBox" src="assets/imgs/page/homepage1/banner2.png" />
                                        </div>
                                        <div className="block-3 shape-3">
                                            <img className="img-responsive" alt="jobBox" src="assets/imgs/page/homepage1/icon-top-banner.png" />
                                        </div>
                                        <div className="block-4 shape-3">
                                            <img className="img-responsive" alt="jobBox" src="assets/imgs/page/homepage1/icon-bottom-banner.png" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <div className="mt-100" />
                <section className="section-box mt-80">
                    <div className="section-box wow animate__animated animate__fadeIn">
                        <div className="container">
                            <div className="text-center">
                                <h2 className="section-title mb-10 wow animate__animated animate__fadeInUp">Browse by Companies</h2>
                                <p className="font-lg color-text-paragraph-2 wow animate__animated animate__fadeInUp">Discover top employers hiring in Tunisia</p>
                            </div>
                            {loading ? (
                                <div className="text-center mt-50">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : companies.length > 0 ? (
                                <div className="mt-50">
                                    <div className="row">
                                        {companies.map((company, index) => (
                                            <div className="col-xl-3 col-lg-3 col-md-4 col-sm-6 col-12 mb-30" key={index}>
                                                <div className="card-grid-1 hover-up">
                                                    <div className="text-center card-grid-1-image">
                                                        <Link legacyBehavior href={`/company-details?id=${company._id}`}>
                                                            <a>
                                                                <img 
                                                                    src={company.logo || "assets/imgs/brands/brand-1.png"}
                                                                    alt={company.name}
                                                                    style={{ width: '80px', height: '80px', objectFit: 'contain' }}
                                                                />
                                                            </a>
                                                        </Link>
                                                    </div>
                                                    <div className="text-center card-grid-1-content">
                                                        <Link legacyBehavior href={`/company-details?id=${company._id}`}>
                                                            <a>
                                                                <h5 className="font-bold mb-5">{company.name}</h5>
                                                            </a>
                                                        </Link>
                                                        <p className="font-xs color-text-paragraph-2 mb-10">{company.category || "Technology"}</p>
                                                        <div className="text-center mt-5">
                                                            <span className="card-location font-regular font-sm mr-10">
                                                                <i className="fi-rr-marker mr-5 ml-0" />{company.location || "Tunisia"}
                                                            </span>
                                                            <span className="card-time font-regular font-sm">
                                                                <i className="fi-rr-briefcase mr-5 ml-15" />
                                                                {companyJobs.find(item => item.company._id === company._id)?.jobs.length || 0} jobs
                                                            </span>
                                                        </div>
                                                        <div className="mt-20">
                                                            <Link legacyBehavior href={`/company-details?id=${company._id}`}>
                                                                <a className="btn btn-border btn-sm">View Company</a>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center mt-50">
                                    <p>No companies found. Check back soon for new employers!</p>
                            </div>
                            )}
                        </div>
                    </div>
                </section>
                <div className="section-box mb-30">
                    <div className="container">
                        <div className="box-we-hiring">
                            <div className="text-1">
                                <span className="text-we-are">We are</span>
                                <span className="text-hiring">Hiring</span>
                            </div>
                            <div className="text-2">
                                Let's <span className="color-brand-1">Work</span> Together
                                <br /> &amp; <span className="color-brand-1">Explore</span> Opportunities
                            </div>
                            <div className="text-3">
                                <div className="btn btn-apply btn-apply-icon" data-bs-toggle="modal" data-bs-target="#ModalApplyJobForm">
                                    Apply now
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <section className="section-box mt-50">
                    <div className="container">
                        <div className="text-center">
                            <h2 className="section-title mb-10 wow animate__animated animate__fadeInUp">Jobs by Company</h2>
                            <p className="font-lg color-text-paragraph-2 wow animate__animated animate__fadeInUp">Find opportunities with top companies in Tunisia</p>
                        </div>
                        
                        {loading ? (
                            <div className="text-center mt-50">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : companyJobs.length > 0 ? (
                            <div className="mt-50">
                                <div className="list-tabs mt-40 text-center">
                                    <ul className="nav nav-tabs" role="tablist">
                                        {companyJobs.map((item, index) => (
                                            <li key={index}>
                                                <a 
                                                    className={activeCompanyIndex === index ? "active" : ""} 
                                                    onClick={() => handleSelectCompany(index)}
                                                >
                                                    <img 
                                                        src={item.company.logo || "/assets/imgs/page/homepage1/management.svg"} 
                                                        alt={item.company.name} 
                                                        style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                                                    /> 
                                                    {item.company.name}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                
                                <div className="tab-content mt-70" id="myTabContent-1">
                                    <div className="tab-pane fade show active">
                                        <div className="row">
                                            {companyJobs[activeCompanyIndex]?.jobs.length > 0 ? (
                                                companyJobs[activeCompanyIndex].jobs.map((job, index) => (
                                                    <div className="col-xl-3 col-lg-4 col-md-6 col-sm-12 col-12" key={index}>
                                                        <div className="card-grid-2 hover-up">
                                                            <div className="card-grid-2-image-left">
                                                                <span className="flash" />
                                                                <div className="image-box">
                                                                    <img 
                                                                        src={companyJobs[activeCompanyIndex].company.logo || "assets/imgs/brands/brand-1.png"} 
                                                                        alt={companyJobs[activeCompanyIndex].company.name} 
                                                                    />
                                                                </div>
                                                                <div className="right-info">
                                                                    <Link legacyBehavior href={`/company-details?id=${companyJobs[activeCompanyIndex].company._id}`}>
                                                                        <a className="name-job">{companyJobs[activeCompanyIndex].company.name}</a>
                                                                    </Link>
                                                                    <span className="location-small">{job.location || "Tunisia"}</span>
                                                                </div>
                                                            </div>
                                                            <div className="card-block-info">
                                                                <h6>
                                                                    <Link legacyBehavior href={`/job-details?id=${job._id}`}>
                                                                        <a>{job.title}</a>
                                                                    </Link>
                                                                </h6>
                                                                <div className="mt-5">
                                                                    <span className="card-briefcase">{job.workplaceType}</span>
                                                                    <span className="card-time">
                                                                        <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                                                                    </span>
                                                                </div>
                                                                <p className="font-sm color-text-paragraph mt-15">
                                                                    {job.description ? job.description.substring(0, 100) + "..." : "No description available"}
                                                                </p>
                                                                <div className="mt-30">
                                                                    {job.requirements && job.requirements.slice(0, 3).map((req, reqIndex) => (
                                                                        <Link legacyBehavior href="/jobs-grid" key={reqIndex}>
                                                                            <a className="btn btn-grey-small mr-5">{req}</a>
                                                                        </Link>
                                                                    ))}
                                                                </div>
                                                                <div className="card-2-bottom mt-30">
                                                                    <div className="row">
                                                                        <div className="col-lg-7 col-7">
                                                                            <span className="card-text-price">{job.salaryRange || "Competitive"}</span>
                                                                        </div>
                                                                        <div className="col-lg-5 col-5 text-end">
                                                                            <Link legacyBehavior href={`/job-details?id=${job._id}`}>
                                                                                <a className="btn btn-apply-now">
                                                                                    Apply now
                                                                                </a>
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-12 text-center">
                                                    <p>No jobs available for this company.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center mt-50">
                                <p>No companies or jobs found. Check back soon for new opportunities!</p>
                        </div>
                        )}
                    </div>
                </section>
                <section className="section-box overflow-visible mt-100 mb-100">
                    <div className="container">
                        <div className="row">
                            <div className="col-lg-6 col-sm-12">
                                <div className="box-image-job">
                                    <img className="img-job-1" alt="jobBox" src="assets/imgs/page/homepage1/img-chart.png" />
                                    <img className="img-job-2" alt="jobBox" src="assets/imgs/page/homepage1/controlcard.png" />
                                    <figure className="wow animate__animated animate__fadeIn">
                                        <img alt="jobBox" src="assets/imgs/page/homepage1/img1.png" />
                                    </figure>
                                </div>
                            </div>
                            <div className="col-lg-6 col-sm-12">
                                <div className="content-job-inner">
                                    <span className="color-text-mutted text-32">Millions Of Jobs. </span>
                                    <h2 className="text-52 wow animate__animated animate__fadeInUp">
                                        Find The One That's <span className="color-brand-2">Right</span> For You
                                    </h2>
                                    <div className="mt-40 pr-50 text-md-lh28 wow animate__animated animate__fadeInUp">Search all the open positions on the web. Get your own personalized salary estimate. Read reviews on over 600,000 companies worldwide. The right job is out there.</div>
                                    <div className="mt-40">
                                        <div className="wow animate__animated animate__fadeInUp">
                                            <Link legacyBehavior href="/jobs-grid">
                                                <a className="btn btn-default">Search Jobs</a>
                                            </Link>

                                            <Link legacyBehavior href="/page-about">
                                                <a className="btn btn-link">Learn More</a>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="section-box overflow-visible mt-50 mb-50">
                    <div className="container">
                        <div className="row">
                            <div className="col-xl-3 col-lg-3 col-md-6 col-sm-6 col-12">
                                <div className="text-center">
                                    <h1 className="color-brand-2">
                                        <span className="count">25</span>
                                        <span> K+</span>
                                    </h1>
                                    <h5>Completed Cases</h5>
                                    <p className="font-sm color-text-paragraph mt-10">
                                        We always provide people a <br className="d-none d-lg-block" />
                                        complete solution upon focused of
                                        <br className="d-none d-lg-block" /> any business
                                    </p>
                                </div>
                            </div>
                            <div className="col-xl-3 col-lg-3 col-md-6 col-sm-6 col-12">
                                <div className="text-center">
                                    <h1 className="color-brand-2">
                                        <span className="count">17</span>
                                        <span> +</span>
                                    </h1>
                                    <h5>Our Office</h5>
                                    <p className="font-sm color-text-paragraph mt-10">
                                        We always provide people a <br className="d-none d-lg-block" />
                                        complete solution upon focused of <br className="d-none d-lg-block" />
                                        any business
                                    </p>
                                </div>
                            </div>
                            <div className="col-xl-3 col-lg-3 col-md-6 col-sm-6 col-12">
                                <div className="text-center">
                                    <h1 className="color-brand-2">
                                        <span className="count">86</span>
                                        <span> +</span>
                                    </h1>
                                    <h5>Skilled People</h5>
                                    <p className="font-sm color-text-paragraph mt-10">
                                        We always provide people a <br className="d-none d-lg-block" />
                                        complete solution upon focused of <br className="d-none d-lg-block" />
                                        any business
                                    </p>
                                </div>
                            </div>
                            <div className="col-xl-3 col-lg-3 col-md-6 col-sm-6 col-12">
                                <div className="text-center">
                                    <h1 className="color-brand-2">
                                        <span className="count">28</span>
                                        <span> +</span>
                                    </h1>
                                    <h5>CHappy Clients</h5>
                                    <p className="font-sm color-text-paragraph mt-10">
                                        We always provide people a <br className="d-none d-lg-block" />
                                        complete solution upon focused of <br className="d-none d-lg-block" />
                                        any business
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="section-box mt-50">
                    <div className="container">
                        <div className="text-center">
                            <h2 className="section-title mb-10 wow animate__animated animate__fadeInUp">Jobs by Location</h2>
                            <p className="font-lg color-text-paragraph-2 wow animate__animated animate__fadeInUp">Find jobs available in different locations across Tunisia</p>
                        </div>
                    </div>
                    <div className="container">
                        <div className="row mt-50">
                            {loading ? (
                                <div className="text-center mt-50">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : locationStats.length > 0 ? (
                                locationStats.map((location, index) => (
                                    <div 
                                        key={index}
                                        className={`col-xl-${index % 3 === 0 ? '3' : (index % 3 === 1 ? '4' : '5')} col-lg-${index % 3 === 0 ? '3' : (index % 3 === 1 ? '4' : '5')} col-md-${index % 2 === 0 ? '5' : '7'} col-sm-12 col-12`}
                                    >
                                <div className="card-image-top hover-up">
                                            <Link legacyBehavior href={`/jobs-grid?location=${encodeURIComponent(location.location)}`}>
                                                <a>
                                                    <div 
                                                        className="image" 
                                                        style={{ 
                                                            backgroundImage: `url(assets/imgs/page/homepage1/location${(index % 6) + 1}.png)`
                                                        }}
                                                    >
                                                        {index < 2 && <span className="lbl-hot">{index === 0 ? 'Hot' : 'Trending'}</span>}
                                            </div>
                                        </a>
                                    </Link>

                                    <div className="informations">
                                                <Link legacyBehavior href={`/jobs-grid?location=${encodeURIComponent(location.location)}`}>
                                            <a>
                                                        <h5>{location.location}</h5>
                                            </a>
                                        </Link>

                                        <div className="row">
                                            <div className="col-lg-6 col-6">
                                                        <span className="text-14 color-text-paragraph-2">{location.count} Vacancy</span>
                                            </div>
                                            <div className="col-lg-6 col-6 text-end">
                                                        <span className="color-text-paragraph-2 text-14">{location.companiesCount} companies</span>
                                </div>
                            </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center mt-30">
                                    <p>No location data available yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
                <section className="section-box mt-50 mb-50">
                    <div className="container">
                        <div className="text-center">
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
            </Layout>
        </>
    );
}
