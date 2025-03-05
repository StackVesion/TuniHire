import Link from "next/link"
import { useRouter } from "next/router"
import { useState } from "react"
import { buildStyles, CircularProgressbar } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'

const percentage = 67;
export default function Sidebar() {
    const [isToggled, setToggled] = useState(false);
    const toggleTrueFalse = () => setToggled(!isToggled);
    const router = useRouter();
    return (
        <>
            <div className={`nav ${isToggled ? "close-nav" : ""}`}><a className={`btn btn-expanded ${isToggled ? "btn-collapsed" : ""}`} onClick={toggleTrueFalse} />
                <nav className="nav-main-menu">
                    <ul className="main-menu">
                        <li> <Link className={router.pathname == "/" ? "dashboard2 active" : "dashboard2"} href="/"><img src="assets/imgs/page/dashboard/dashboard.svg" alt="jobBox" /><span className="name">Dashboard</span></Link>
                        </li>
                        <li> <Link className={router.pathname == "/candidates" ? "dashboard2 active" : "dashboard2"} href="/candidates"><img src="assets/imgs/page/dashboard/candidates.svg" alt="jobBox" /><span className="name">Candidates</span></Link>
                        </li>
                        <li> <Link className={router.pathname == "/recruiters" ? "dashboard2 active" : "dashboard2"} href="/recruiters"><img src="assets/imgs/page/dashboard/recruiters.svg" alt="jobBox" /><span className="name">Recruiters</span></Link>
                        </li>
                        <li> <Link className={router.pathname == "/my-job-grid" ? "dashboard2 active" : "dashboard2"} href="/my-job-grid"><img src="assets/imgs/page/dashboard/jobs.svg" alt="jobBox" /><span className="name">My Jobs</span></Link>
                        </li>
                        <li> <Link className={router.pathname == "/my-tasks-list" ? "dashboard2 active" : "dashboard2"} href="/my-tasks-list"><img src="assets/imgs/page/dashboard/tasks.svg" alt="jobBox" /><span className="name">Tasks List</span></Link>
                        </li>
                        <li> <Link className={router.pathname == "/profile" ? "dashboard2 active" : "dashboard2"} href="/profile"><img src="assets/imgs/page/dashboard/profiles.svg" alt="jobBox" /><span className="name">My Profiles</span></Link>
                        </li>
                        <li> <Link className={router.pathname == "/my-resume" ? "dashboard2 active" : "dashboard2"} href="/my-resume"><img src="assets/imgs/page/dashboard/cv-manage.svg" alt="jobBox" /><span className="name">CV Manage</span></Link>
                        </li>
                        <li> <Link className={router.pathname == "/settings" ? "dashboard2 active" : "dashboard2"} href="/settings"><img src="assets/imgs/page/dashboard/settings.svg" alt="jobBox" /><span className="name">Setting</span></Link>
                        </li>
                        <li> <Link className={router.pathname == "/authentication" ? "dashboard2 active" : "dashboard2"} href="/authentication"><img src="assets/imgs/page/dashboard/authentication.svg" alt="jobBox" /><span className="name">Authentication</span></Link>
                        </li>
                        <li> <Link className={router.pathname == "/login" ? "dashboard2 active" : "dashboard2"} href="/login"><img src="assets/imgs/page/dashboard/logout.svg" alt="jobBox" /><span className="name">Logout</span></Link>
                        </li>
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
