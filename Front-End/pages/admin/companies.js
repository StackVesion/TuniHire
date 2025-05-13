import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/Layout/admin/AdminLayout";
import Link from "next/link";

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in and is admin
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
    
    if (!token || !user || user.role !== "admin") {
      router.push("/page-signin");
      return;
    }

    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch companies");
        }
        
        const data = await response.json();
        setCompanies(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const handleApproveCompany = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company/admin/approve/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to approve company");
      }

      // Update the companies list
      setCompanies(companies.map(company => 
        company._id === id ? { ...company, status: "Approved" } : company
      ));

      // Show success message
      const Swal = (await import('sweetalert2')).default;
      Swal.fire({
        title: 'Success!',
        text: 'Company has been approved',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error(err);
      const Swal = (await import('sweetalert2')).default;
      Swal.fire({
        title: 'Error!',
        text: err.message,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleDeleteCompany = async (id) => {
    try {
      const Swal = (await import('sweetalert2')).default;
      
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, cancel!',
        reverseButtons: true
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem("token");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error("Failed to delete company");
        }

        // Update the companies list by removing the deleted company
        setCompanies(companies.filter(company => company._id !== id));

        Swal.fire(
          'Deleted!',
          'The company has been deleted.',
          'success'
        );
      }
    } catch (err) {
      console.error(err);
      const Swal = (await import('sweetalert2')).default;
      Swal.fire({
        title: 'Error!',
        text: err.message,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center mt-100">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mt-30">
        <div className="row mb-30">
          <div className="col-12">
            <div className="section-title">
              <h2>Gestion des Entreprises</h2>
              <p>Liste de toutes les entreprises enregistrées</p>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Email</th>
                        <th>Catégorie</th>
                        <th>Nombre d'employés</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies.length > 0 ? (
                        companies.map((company) => (
                          <tr key={company._id}>
                            <td>{company.name}</td>
                            <td>{company.email}</td>
                            <td>{company.category || 'Non spécifié'}</td>
                            <td>{company.numberOfEmployees || 'Non spécifié'}</td>
                            <td>
                              <span className={`badge ${company.status === 'Approved' ? 'bg-success' : 'bg-warning'}`}>
                                {company.status}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex">
                                {company.status === 'Pending' && (
                                  <button 
                                    className="btn btn-sm btn-success me-2"
                                    onClick={() => handleApproveCompany(company._id)}
                                  >
                                    Approuver
                                  </button>
                                )}
                                <Link href={`/company-details?id=${company._id}`} className="btn btn-sm btn-primary me-2">
                                  Voir
                                </Link>
                                <button 
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDeleteCompany(company._id)}
                                >
                                  Supprimer
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center">Aucune entreprise trouvée</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
