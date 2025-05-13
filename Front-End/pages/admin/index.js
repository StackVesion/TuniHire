import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import AdminLayout from "../../components/Layout/admin/AdminLayout";

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    companies: 0,
    newsletters: 0,
    courses: 0,
    reclamations: 0
  });

  useEffect(() => {
    // Check if user is logged in and is admin
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
    
    if (!token || !user || user.role !== "admin") {
      router.push("/page-signin");
      return;
    }

    // Fetch statistics
    const fetchStats = async () => {
      try {
        const fetchCompanies = fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const fetchNewsletters = fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/newsletter`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const fetchCourses = fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/course`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const fetchReclamations = fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reclamation`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const [companiesRes, newslettersRes, coursesRes, reclamationsRes] = await Promise.all([
          fetchCompanies,
          fetchNewsletters,
          fetchCourses,
          fetchReclamations
        ]);

        const companies = await companiesRes.json();
        const newsletters = await newslettersRes.json();
        const courses = await coursesRes.json();
        const reclamations = await reclamationsRes.json();

        setStats({
          companies: companies.length || 0,
          newsletters: newsletters.length || 0,
          courses: courses.length || 0,
          reclamations: reclamations.length || 0
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <div className="container mt-50 mb-50">
        <div className="row">
          <div className="col-12">
            <div className="section-title">
              <h2 className="text-center mb-30">Tableau de Bord Admin</h2>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-3 col-md-6 col-sm-12 mb-30">
            <Link href="/admin/companies">
              <div className="card-grid-2 hover-up">
                <div className="card-grid-2-image-left">
                  <div className="card-grid-2-image-rd online">
                    <i className="fi-rr-building font-size-24"></i>
                  </div>
                </div>
                <div className="card-block-info">
                  <h6>Entreprises</h6>
                  <div className="mt-5">
                    <span className="font-size-30 text-bold">{stats.companies}</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="col-lg-3 col-md-6 col-sm-12 mb-30">
            <Link href="/admin/newsletters">
              <div className="card-grid-2 hover-up">
                <div className="card-grid-2-image-left">
                  <div className="card-grid-2-image-rd online">
                    <i className="fi-rr-envelope font-size-24"></i>
                  </div>
                </div>
                <div className="card-block-info">
                  <h6>Newsletters</h6>
                  <div className="mt-5">
                    <span className="font-size-30 text-bold">{stats.newsletters}</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="col-lg-3 col-md-6 col-sm-12 mb-30">
            <Link href="/admin/courses">
              <div className="card-grid-2 hover-up">
                <div className="card-grid-2-image-left">
                  <div className="card-grid-2-image-rd online">
                    <i className="fi-rr-book font-size-24"></i>
                  </div>
                </div>
                <div className="card-block-info">
                  <h6>Cours</h6>
                  <div className="mt-5">
                    <span className="font-size-30 text-bold">{stats.courses}</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="col-lg-3 col-md-6 col-sm-12 mb-30">
            <Link href="/admin/reclamations">
              <div className="card-grid-2 hover-up">
                <div className="card-grid-2-image-left">
                  <div className="card-grid-2-image-rd online">
                    <i className="fi-rr-flag font-size-24"></i>
                  </div>
                </div>
                <div className="card-block-info">
                  <h6>Réclamations</h6>
                  <div className="mt-5">
                    <span className="font-size-30 text-bold">{stats.reclamations}</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
