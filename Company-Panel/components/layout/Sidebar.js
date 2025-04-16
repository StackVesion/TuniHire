import Link from "next/link"
import { useRouter } from "next/router"
import { useState, useEffect } from "react"
import { buildStyles, CircularProgressbar } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import { getCurrentUser } from "../../utils/authUtils"

const percentage = 67;
export default function Sidebar() {
    const [isToggled, setToggled] = useState(false);
    const [user, setUser] = useState(null);
    const toggleTrueFalse = () => setToggled(!isToggled);
    const router = useRouter();
    
    useEffect(() => {
        // Use our auth utility to get the current user
        const currentUser = getCurrentUser();
        if (currentUser) {
            console.log('Sidebar: Found user', currentUser.firstName, currentUser.role);
            setUser(currentUser);
        } else {
            console.warn('Sidebar: No user found in localStorage');
        }
    }, []);
    return (
        <>
            <div className={`nav ${isToggled ? "close-nav" : ""}`}><a className={`btn btn-expanded ${isToggled ? "btn-collapsed" : ""}`} onClick={toggleTrueFalse} />
                <nav className="nav-main-menu">
                    <ul className="main-menu">
                        {/* CANDIDATE ROLE: Candidate-specific menu items */}
                        {user && user.role && user.role.toString().toUpperCase() === 'CANDIDATE' && (
                            <>
                                <li><Link className={router.pathname === "/" ? "dashboard2 active" : "dashboard2"} href="/"><img src="assets/imgs/page/dashboard/dashboard.svg" alt="jobBox" /><span className="name">Dashboard</span></Link></li>
                                <li><Link className={router.pathname === "/courses" ? "dashboard2 active" : "dashboard2"} href="/Course"><img src="assets/imgs/page/dashboard/jobs.svg" alt="jobBox" /><span className="name">Courses</span></Link></li>
                                <li><Link className={router.pathname === "/my-resume" ? "dashboard2 active" : "dashboard2"} href="/my-resume"><img src="assets/imgs/page/dashboard/cv-manage.svg" alt="jobBox" /><span className="name">My Resume</span></Link></li>
                                <li><Link className={router.pathname === "/applications" ? "dashboard2 active" : "dashboard2"} href="/applications"><img src="assets/imgs/page/dashboard/tasks.svg" alt="jobBox" /><span className="name">My Applications</span></Link></li>
                                <li><Link className={router.pathname === "/apply-for-jobs" ? "dashboard2 active" : "dashboard2"} href="/apply-for-jobs"><img src="assets/imgs/page/dashboard/recruiters.svg" alt="jobBox" /><span className="name">Apply for Job</span></Link></li>
                                <li><Link className={router.pathname === "/profile" ? "dashboard2 active" : "dashboard2"} href="/profile"><img src="assets/imgs/page/dashboard/profiles.svg" alt="jobBox" /><span className="name">My Profile</span></Link></li>
                                <li><Link className={router.pathname === "/settings" ? "dashboard2 active" : "dashboard2"} href="/settings"><img src="assets/imgs/page/dashboard/settings.svg" alt="jobBox" /><span className="name">Settings</span></Link></li>
                            </>
                        )}
                        
                        {/* HR ROLE: HR-specific menu items */}
                        {user && user.role && user.role.toString().toUpperCase() === 'HR' && (
                            <>
                                <li><Link className={router.pathname === "/" ? "dashboard2 active" : "dashboard2"} href="/"><img src="assets/imgs/page/dashboard/dashboard.svg" alt="jobBox" /><span className="name">Company Dashboard</span></Link></li>
                                <li><Link className={router.pathname === "/my-job-grid" ? "dashboard2 active" : "dashboard2"} href="/my-job-grid"><img src="assets/imgs/page/dashboard/jobs.svg" alt="jobBox" /><span className="name">Manage Jobs</span></Link></li>
                                <li><Link className={router.pathname === "/CampanyApplications" ? "dashboard2 active" : "dashboard2"} href="/CampanyApplications"><img src="assets/imgs/page/dashboard/candidates.svg" alt="jobBox" /><span className="name">Applications</span></Link></li>
                                <li><Link className={router.pathname === "/company-settings" ? "dashboard2 active" : "dashboard2"} href="/company-settings"><img src="assets/imgs/page/dashboard/profiles.svg" alt="jobBox" /><span className="name">Company Profile</span></Link></li>
                                <li><Link className={router.pathname === "/profile" ? "dashboard2 active" : "dashboard2"} href="/profile"><img src="assets/imgs/page/dashboard/profiles.svg" alt="jobBox" /><span className="name">My Profile</span></Link></li>
                                <li><Link className={router.pathname === "/settings" ? "dashboard2 active" : "dashboard2"} href="/settings"><img src="assets/imgs/page/dashboard/settings.svg" alt="jobBox" /><span className="name">Settings</span></Link></li>
                            </>
                        )}
                        
                        {/* Default menu if no user or role not recognized */}
                        {(!user || !user.role) && (
                            <>
                                <li><Link className={router.pathname === "/" ? "dashboard2 active" : "dashboard2"} href="/"><img src="assets/imgs/page/dashboard/dashboard.svg" alt="jobBox" /><span className="name">Dashboard</span></Link></li>
                                <li><Link className={router.pathname === "/login" ? "dashboard2 active" : "dashboard2"} href="/login"><img src="assets/imgs/page/dashboard/login.svg" alt="jobBox" /><span className="name">Login</span></Link></li>
                            </>
                        )}
                        {user && (
                            <li onClick={() => {
                                localStorage.removeItem('token');
                                localStorage.removeItem('user');
                                window.location.href = '/login';
                            }} className="cursor-pointer">
                                <a className="dashboard2">
                                    <img src="assets/imgs/page/dashboard/logout.svg" alt="jobBox" />
                                    <span className="name">Logout</span>
                                </a>
                            </li>
                        )}
                    </ul>
                </nav>
                <div className="border-bottom mb-20 mt-20" />
                <div className="box-profile-completed text-center mb-30">
                    <div style={{ width: "50%", margin: "0 auto" }} className="mt-30 mb-30">
                        <CircularProgressbar
                            value={percentage}
                            text={`${percentage}%`}
                            background
                            backgroundPadding={0}
                            styles={buildStyles({
                                backgroundColor: "#D8E0FD",
                                textColor: "#05264E",
                                pathColor: "#3498DB",
                                trailColor: "transparent",
                                strokeLinecap: "butt"
                            })}
                        />
                    </div>
                    <h6 className="mb-10">Profile Completed</h6>
                    <p className="font-xs color-text-mutted">Please add detailed information to your profile. This will help you
                        develop your career more quickly.</p>
                </div>
                <div className="sidebar-border-bg mt-50">
                    <span className="text-grey">WE ARE</span><span className="text-hiring">HIRING</span>
                    <p className="font-xxs color-text-paragraph mt-5">
                        Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                        Recusandae architecto
                    </p>
                    <div className="mt-15">
                        <Link className="btn btn-paragraph-2" href="#">Know More</Link>
                    </div>
                </div>
            </div>
        </>
    )
}
