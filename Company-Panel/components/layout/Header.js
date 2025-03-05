import { Menu } from '@headlessui/react'
import Link from "next/link"
import { useEffect, useState } from 'react'

export default function Header() {
    const [scroll, setScroll] = useState(0)
    useEffect(() => {
        document.addEventListener("scroll", () => {
            const scrollCheck = window.scrollY > 100
            if (scrollCheck !== scroll) {
                setScroll(scrollCheck)
            }
        })
    })
    return (
        <>
            <header className={`header sticky-bar ${scroll? "stick":""}`}>
                <div className="container">
                    <div className="main-header">
                        <div className="header-left">
                            <div className="header-logo"><Link className="d-flex" href="/"><img alt="jobBox" src="assets/imgs/page/dashboard/logo.svg" /></Link></div><span className="btn btn-grey-small ml-10">Admin area</span>
                        </div>
                        <div className="header-search">
                            <div className="box-search">
                                <form>
                                    <input className="form-control input-search" type="text" name="keyword" placeholder="Search" />
                                </form>
                            </div>
                        </div>
                        <div className="header-menu d-none d-md-block">
                            <ul>
                                <li> <Link href="#">Home </Link></li>
                                <li> <Link href="#">About us </Link></li>
                                <li> <Link href="#">Contact</Link></li>
                            </ul>
                        </div>
                        <div className="header-right">
                            <div className="block-signin"><Link className="btn btn-default icon-edit hover-up" href="/post-job">Post
                                Job</Link>
                                <Menu as="div" className="dropdown d-inline-block">
                                    <Menu.Button as="a" className="btn btn-notify" />
                                    <Menu.Items as="ul" className="dropdown-menu dropdown-menu-light dropdown-menu-end show" style={{ right: "0", left: "auto" }}>
                                        <li><Link className="dropdown-item active" href="#">10 notifications</Link></li>
                                        <li><Link className="dropdown-item" href="#">12 messages</Link></li>
                                        <li><Link className="dropdown-item" href="#">20 replies</Link></li>
                                    </Menu.Items>
                                </Menu>


                                <div className="member-login"><img alt="" src="assets/imgs/page/dashboard/profile.png" />
                                    <div className="info-member"> <strong className="color-brand-1">Steven Jobs</strong>
                                        <Menu as="div" className="dropdown">
                                            <Menu.Button as="a" className="font-xs color-text-paragraph-2 icon-down">Super Admin</Menu.Button>
                                            <Menu.Items as="ul" className="dropdown-menu dropdown-menu-light dropdown-menu-end show" style={{ right: "0", left: "auto" }}>
                                                <li><Link className="dropdown-item" href="/profile">Profiles</Link></li>
                                                <li><Link className="dropdown-item" href="/my-resume">CV Manager</Link></li>
                                                <li><Link className="dropdown-item" href="/login">Logout</Link></li>
                                            </Menu.Items>
                                        </Menu>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        </>
    )
}
