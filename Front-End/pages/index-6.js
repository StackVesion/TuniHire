import Link from "next/link";
import Layout from "../components/Layout/Layout";
import CategoryTab2 from "./../components/elements/CategoryTab2";
import BlogSlider from "./../components/sliders/Blog";
import CategorySlider from "./../components/sliders/Category";
import TestimonialSlider1 from "./../components/sliders/Testimonial1";

export default function Index6() {
    return (
        <>
            <Layout>
                <div>
                    <section className="section-box mb-70">
                        <div className="banner-hero hero-1 banner-homepage6">
                            <div className="banner-inner">
                                <div className="row">
                                    <div className="col-xl-12 col-lg-12">
                                        <div className="block-banner text-center pb-40 pt-40">
                                            <h1 className="heading-banner wow animate__animated animate__fadeInUp">
                                                There Are <span className="color-brand-2">102,256 </span>Postings
                                                <br className="d-none d-lg-block" />
                                                Here For you!
                                            </h1>
                                            <p className="font-lg color-text-paragraph mt-20">Find Jobs, Employment &amp; Career Opportunities</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="box-search-2">
                                    <div className="block-banner form-none-shadow">
                                        <div className="form-find wow animate__animated animate__fadeIn" data-wow-delay=".2s">
                                            <form>
                                                <input className="form-input input-keysearch mr-10" type="text" placeholder="Your keyword... " />
                                                <div className="box-industry">
                                                    <select className="form-input mr-10 select-active input-location">
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
                                                <div className="box-industry  style-2">
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
                                                <button className="btn btn-default btn-find font-sm">Search</button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="list-tags-banner list-tags-banner-2 mt-20 wow animate__animated animate__fadeInUp" data-wow-delay=".3s">
                                        <strong>Popular Searches: </strong>
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
                        </div>
                    </section>
                    <section className="section-box">
                        <div className="container">
                            <div className="d-flex flex-wrap flex-lg-nowrap">
                                <div className="block-banner-1">
                                    <div className="block-image-1">
                                        {" "}
                                        <img src="assets/imgs/page/homepage6/img1.png" alt="jobBox" />
                                    </div>
                                    <div className="block-image-2">
                                        {" "}
                                        <img src="assets/imgs/page/homepage6/img2.png" alt="jobBox" />
                                    </div>
                                </div>
                                <div className="block-banner-2">
                                    <div className="block-image-3">
                                        <img src="assets/imgs/page/homepage6/img3.png" alt="jobBox" />
                                    </div>
                                </div>
                                <div className="block-banner-3">
                                    <div className="block-image-4">
                                        {" "}
                                        <img src="assets/imgs/page/homepage6/img4.png" alt="jobBox" />
                                    </div>
                                    <div className="block-image-5">
                                        {" "}
                                        <img src="assets/imgs/page/homepage6/img5.png" alt="jobBox" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="section-box mt-80">
                        <div className="section-box wow animate__animated animate__fadeIn">
                            <div className="container">
                                <div className="text-center">
                                    <h2 className="section-title mb-10 wow animate__animated animate__fadeInUp">Browse by category</h2>
                                    <p className="font-lg color-text-paragraph-2 wow animate__animated animate__fadeInUp">Find the job that’s perfect for you. about 800+ new jobs everyday</p>
                                </div>
                                <div className="box-swiper mt-50">
                                    <CategorySlider />
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="section-box mt-50 mb-30 bg-border-3 pt-100 pb-100">
                        <div className="container">
                            <div className="row">
                                <div className="col-lg-6">
                                    <img className="bdrd-10" src="assets/imgs/page/homepage5/img-profile.png" alt="jobBox" />
                                </div>
                                <div className="col-lg-6">
                                    <div className="pl-30">
                                        <h5 className="color-brand-2 mb-15 mt-15">Create Profile</h5>
                                        <h2 className="color-brand-1 mt-0 mb-15">Create Your Personal Account Profile</h2>
                                        <p className="font-lg color-text-paragraph-2">Work Profile is a personality assessment that measures an individual's work personality through their workplace traits, social and emotional traits; as well as the values and aspirations that drive them forward.</p>
                                        <div className="mt-20">
                                            <a className="btn btn-default">Create Profile</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="section-box mt-50">
                        <div className="section-box wow animate__animated animate__fadeIn">
                            <div className="container">
                                <div className="text-start">
                                    <h2 className="section-title mb-10 wow animate__animated animate__fadeInUp">Latest Jobs Post</h2>
                                    <p className="font-lg color-text-paragraph-2 wow animate__animated animate__fadeInUp">
                                        Explore the different types of available jobs to apply
                                        <br className="d-none d-lg-block" />
                                        discover which is right for you.
                                    </p>
                                </div>
                                <div className="mt-50">
                                    <CategoryTab2 />
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="section-box bg-15 pt-50 pb-50 mt-80">
                        <div className="container">
                            <div className="row">
                                <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12 text-center mb-30">
                                    <img className="img-job-search mt-20" src="assets/imgs/page/homepage3/img-job-search.png" alt="jobBox" />
                                </div>
                                <div className="col-xl-5 col-lg-6 col-md-12 col-sm-12">
                                    <h2 className="mb-40">Job search for people passionate about startup</h2>
                                    <div className="box-checkbox mb-30">
                                        <h6>Create an account</h6>
                                        <p className="font-md color-text-paragraph-2">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec nec justo a quam varius maximus. Maecenas sodales tortor quis tincidunt commodo.</p>
                                    </div>
                                    <div className="box-checkbox mb-30">
                                        <h6>Search for Jobs</h6>
                                        <p className="font-md color-text-paragraph-2">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec nec justo a quam varius maximus. Maecenas sodales tortor quis tincidunt commodo.</p>
                                    </div>
                                    <div className="box-checkbox mb-30">
                                        <h6>Save &amp; Apply</h6>
                                        <p className="font-md color-text-paragraph-2">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec nec justo a quam varius maximus. Maecenas sodales tortor quis tincidunt commodo.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    <div className="mt-100" />
                    <section className="section-box mt-0">
                        <div className="section-box wow animate__animated animate__fadeIn">
                            <div className="container">
                                <div className="text-center">
                                    <h2 className="section-title mb-10 wow animate__animated animate__fadeInUp">See Some Words</h2>
                                    <p className="font-lg color-text-paragraph-2 wow animate__animated animate__fadeInUp">
                                        Thousands of employee get their ideal jobs
                                        <br className="d-none d-lg-block" />
                                        and feed back to us!
                                    </p>
                                </div>
                                <div className="box-swiper mt-50">
                                    <TestimonialSlider1 />
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="section-box mt-70 mb-40">
                        <div className="container">
                            <div className="text-start">
                                <h2 className="section-title mb-10 wow animate__animated animate__fadeInUp">How It Works</h2>
                                <p className="font-lg color-text-paragraph-2 wow animate__animated animate__fadeInUp">Just via some simple steps, you will find your ideal candidates you’r looking for!</p>
                            </div>
                            <div className="mt-70">
                                <div className="row">
                                    <div className="col-lg-4">
                                        <div className="box-step step-1">
                                            <h1 className="number-element">1</h1>
                                            <h4 className="mb-20">
                                                Register an
                                                <br className="d-none d-lg-block" />
                                                account to start
                                            </h4>
                                            <p className="font-lg color-text-paragraph-2">
                                                Lorem ipsum dolor sit amet,
                                                <br className="d-none d-lg-block" />
                                                consectetur adipisicing elit, sed do{" "}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="col-lg-4">
                                        <div className="box-step step-2">
                                            <h1 className="number-element">2</h1>
                                            <h4 className="mb-20">
                                                Explore over
                                                <br className="d-none d-lg-block" />
                                                thousands of resumes
                                            </h4>
                                            <p className="font-lg color-text-paragraph-2">
                                                Lorem ipsum dolor sit amet,
                                                <br className="d-none d-lg-block" />
                                                consectetur adipisicing elit, sed do{" "}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="col-lg-4">
                                        <div className="box-step">
                                            <h1 className="number-element">3</h1>
                                            <h4 className="mb-20">
                                                Find the most
                                                <br className="d-none d-lg-block" />
                                                suitable candidate
                                            </h4>
                                            <p className="font-lg color-text-paragraph-2">
                                                Lorem ipsum dolor sit amet,
                                                <br className="d-none d-lg-block" />
                                                consectetur adipisicing elit, sed do{" "}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-50 text-center">
                                <a className="btn btn-default">Get Started</a>
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
                    <section className="section-box mt-50 mb-20">
                        <div className="container">
                            <div className="box-newsletter box-newsletter-3">
                                <div className="row">
                                    <div className="col-xl-12 text-center">
                                        <div className="d-inline-block">
                                            <h2 className="color-white mt-30">Subscribe our newsletter</h2>
                                            <p className="mt-10 font-lg color-white">New Things Will Always Update Regularl</p>
                                            <div className="box-form-newsletter mt-30">
                                                <form className="form-newsletter">
                                                    <input className="input-newsletter" type="text" placeholder="Enter your email here" />
                                                    <button className="btn btn-default font-heading icon-send-letter">Subscribe</button>
                                                </form>
                                            </div>
                                        </div>
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
