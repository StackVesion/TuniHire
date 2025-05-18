import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import { getCurrentUser, clearUserData } from '../../../utils/authUtils';

const AdminSidebar = () => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [isActive, setIsActive] = useState({
        status: false,
        key: "",
    });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        // Load user data from localStorage
        const currentUser = getCurrentUser();
        if (currentUser) {
            if (currentUser.role !== 'admin' && currentUser.role !== 'Admin') {
                router.push('/page-signin');
            }
            setUser(currentUser);
        } else {
            router.push('/page-signin');
        }
    }, []);

    const handleToggle = (key) => {
        if (isActive.key === key) {
            setIsActive({
                status: false,
            });
        } else {
            setIsActive({
                status: true,
                key,
            });
        }
    };

    const handleLogout = async (e) => {
        e.preventDefault();
        try {
            // Dynamically import SweetAlert2
            const Swal = (await import('sweetalert2')).default;
            
            // Show confirmation dialog
            const result = await Swal.fire({
                title: 'Logout',
                text: 'Are you sure you want to logout?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, Logout',
                cancelButtonText: 'Cancel'
            });

            if (result.isConfirmed) {
                // Clear localStorage
                clearUserData();
                
                // Show success message
                Swal.fire({
                    title: 'Logged Out!',
                    text: 'You have been successfully logged out',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });

                // Redirect to sign-in page
                router.push("/page-signin");
            }
        } catch (error) {
            console.error("Logout error:", error);
            // If SweetAlert2 failed to load, show a basic alert
            alert('Failed to log out. Please try again.');
        }
    };

    const isCurrentPath = (path) => {
        return router.pathname === path;
    };

    return (
        <>
            {/* Mobile Toggle Button */}
            <div className="admin-mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <i className={`fi-rr-${mobileMenuOpen ? 'cross' : 'menu-burger'}`}></i>
            </div>
            
            {/* Overlay for mobile */}
            {mobileMenuOpen && (
                <div className="admin-sidebar-overlay" onClick={() => setMobileMenuOpen(false)}></div>
            )}
            
            <div className={`admin-sidebar bg-white shadow-sm ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                <div className="admin-sidebar-header">
                    <Link href="/admin" className="admin-logo">
                        <img src="/assets/imgs/logo/logo-tunihire.svg" alt="TuniHire" />
                    </Link>
                    <h3>Panel Admin</h3>
                </div>
                
                <div className="admin-sidebar-menu">
                    <div className="menu-category">
                        <span>Principal</span>
                    </div>
                    <ul className="admin-menu">
                        <li className={isCurrentPath('/admin') ? 'active' : ''}>
                            <Link href="/admin">
                                <span className="menu-item">
                                    <i className="fi-rr-dashboard me-2"></i>
                                    Tableau de bord
                                </span>
                            </Link>
                        </li>
                    </ul>
                    
                    <div className="menu-category">
                        <span>Gestion</span>
                    </div>
                    <ul className="admin-menu">
                        <li className={isCurrentPath('/admin/companies') ? 'active' : ''}>
                            <Link href="/admin/companies">
                                <span className="menu-item">
                                    <i className="fi-rr-building me-2"></i>
                                    Entreprises
                                </span>
                            </Link>
                        </li>
                        <li className={isCurrentPath('/admin/newsletters') ? 'active' : ''}>
                            <Link href="/admin/newsletters">
                                <span className="menu-item">
                                    <i className="fi-rr-envelope me-2"></i>
                                    Newsletters
                                </span>
                            </Link>
                        </li>
                        <li className={isCurrentPath('/admin/courses') ? 'active' : ''}>
                            <Link href="/admin/courses">
                                <span className="menu-item">
                                    <i className="fi-rr-book me-2"></i>
                                    Cours
                                </span>
                            </Link>
                        </li>
                        <li className={isCurrentPath('/admin/reclamations') ? 'active' : ''}>
                            <Link href="/admin/reclamations">
                                <span className="menu-item">
                                    <i className="fi-rr-flag me-2"></i>
                                    Réclamations
                                </span>
                            </Link>
                        </li>
                    </ul>
                    
                    <div className="menu-category">
                        <span>Compte</span>
                    </div>
                    <ul className="admin-menu">
                        <li>
                            <Link href="/">
                                <span className="menu-item">
                                    <i className="fi-rr-home me-2"></i>
                                    Accueil site
                                </span>
                            </Link>
                        </li>
                        <li>
                            <a href="#" onClick={handleLogout} className="menu-item">
                                <i className="fi-rr-sign-out me-2"></i>
                                Déconnexion
                            </a>
                        </li>
                    </ul>
                </div>
                
                {/* Admin Info */}
                {user && (
                    <div className="admin-user-info">
                        <div className="admin-user-avatar">
                            {user.profilePicture ? (
                                <img src={user.profilePicture} alt={user.firstName} />
                            ) : (
                                <div className="admin-avatar-placeholder">
                                    {user.firstName?.charAt(0) || 'A'}
                                </div>
                            )}
                        </div>
                        <div className="admin-user-details">
                            <h5>{user.firstName} {user.lastName}</h5>
                            <p>Administrateur</p>
                        </div>
                    </div>
                )}
            <style jsx>{`
                .admin-mobile-toggle {
                    display: none;
                    position: fixed;
                    top: 15px;
                    left: 15px;
                    z-index: 1001;
                    background: #3c65f5;
                    color: white;
                    width: 40px;
                    height: 40px;
                    border-radius: 8px;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }
                
                .admin-sidebar-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 999;
                    display: none;
                }
                
                .admin-sidebar {
                    width: 280px;
                    height: 100vh;
                    position: fixed;
                    left: 0;
                    top: 0;
                    overflow-y: auto;
                    z-index: 1000;
                    padding: 0 0 20px 0;
                    transition: all 0.3s ease;
                    display: flex;
                    flex-direction: column;
                }
                
                .admin-sidebar-header {
                    padding: 20px;
                    border-bottom: 1px solid #f0f0f0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                
                .admin-logo {
                    margin-bottom: 10px;
                    display: block;
                }
                
                .admin-logo img {
                    height: 40px;
                }
                
                .admin-sidebar-header h3 {
                    margin: 10px 0 0 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: #333;
                }
                
                .admin-sidebar-menu {
                    padding: 20px 0;
                    flex: 1;
                }
                
                .menu-category {
                    padding: 10px 20px;
                    font-size: 12px;
                    font-weight: 500;
                    text-transform: uppercase;
                    color: #888;
                    letter-spacing: 1px;
                }
                
                .admin-menu {
                    list-style: none;
                    padding: 0;
                    margin: 0 0 15px 0;
                }
                
                .admin-menu li {
                    margin-bottom: 2px;
                }
                
                .admin-menu li.active {
                    background-color: #f0f5ff;
                    border-left: 3px solid #3c65f5;
                }
                
                .admin-menu li.active .menu-item {
                    color: #3c65f5;
                    font-weight: 500;
                    padding-left: 17px;
                }
                
                .menu-item {
                    display: flex;
                    align-items: center;
                    padding: 12px 20px;
                    color: #4f5e64;
                    transition: all 0.2s ease;
                    cursor: pointer;
                    font-size: 14px;
                    border-radius: 0;
                }
                
                .menu-item:hover {
                    color: #3c65f5;
                    background-color: #f8f9fa;
                }
                
                .menu-item i {
                    margin-right: 10px;
                    font-size: 16px;
                    width: 20px;
                    text-align: center;
                }
                
                .admin-user-info {
                    padding: 15px 20px;
                    border-top: 1px solid #f0f0f0;
                    display: flex;
                    align-items: center;
                    margin-top: auto;
                }
                
                .admin-user-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    overflow: hidden;
                    margin-right: 12px;
                }
                
                .admin-user-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .admin-avatar-placeholder {
                    width: 100%;
                    height: 100%;
                    background-color: #3c65f5;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 16px;
                }
                
                .admin-user-details h5 {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 600;
                    color: #333;
                }
                
                .admin-user-details p {
                    margin: 0;
                    font-size: 12px;
                    color: #999;
                }
                
                @media (max-width: 991px) {
                    .admin-mobile-toggle {
                        display: flex;
                    }
                    
                    .admin-sidebar-overlay {
                        display: block;
                    }
                    
                    .admin-sidebar {
                        transform: translateX(-100%);
                        box-shadow: 5px 0 15px rgba(0, 0, 0, 0.05);
                    }
                    
                    .admin-sidebar.mobile-open {
                        transform: translateX(0);
                    }
                }
            `}</style>
        </>
    );
};
};

export default AdminSidebar;
