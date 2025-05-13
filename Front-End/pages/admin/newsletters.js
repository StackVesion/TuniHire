import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../components/Layout/admin/AdminLayout";

export default function AdminNewsletters() {
  const router = useRouter();
  const [newsletters, setNewsletters] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    companyId: "",
    content: ""
  });

  useEffect(() => {
    // Check if user is logged in and is admin
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
    
    if (!token || !user || user.role !== "admin") {
      router.push("/page-signin");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch newsletters and companies in parallel
        const [newslettersResponse, companiesResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/newsletter`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        if (!newslettersResponse.ok) {
          throw new Error("Failed to fetch newsletters");
        }
        
        if (!companiesResponse.ok) {
          throw new Error("Failed to fetch companies");
        }
        
        const newslettersData = await newslettersResponse.json();
        const companiesData = await companiesResponse.json();
        
        setNewsletters(newslettersData);
        setCompanies(companiesData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddNewsletter = async (e) => {
    e.preventDefault();
    
    if (!formData.companyId || !formData.content) {
      const Swal = (await import('sweetalert2')).default;
      Swal.fire({
        title: 'Error!',
        text: 'Please select a company and provide content',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/newsletter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error("Failed to add newsletter");
      }

      const newNewsletter = await response.json();
      
      // Update the newsletters list with the new one
      setNewsletters([...newsletters, newNewsletter]);
      
      // Reset form
      setFormData({
        companyId: "",
        content: ""
      });

      // Show success message
      const Swal = (await import('sweetalert2')).default;
      Swal.fire({
        title: 'Success!',
        text: 'Newsletter has been added',
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

  const handleDeleteNewsletter = async (id) => {
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/newsletter/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error("Failed to delete newsletter");
        }

        // Update the newsletters list by removing the deleted newsletter
        setNewsletters(newsletters.filter(newsletter => newsletter._id !== id));

        Swal.fire(
          'Deleted!',
          'The newsletter has been deleted.',
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
              <h2>Gestion des Newsletters</h2>
              <p>Créez et gérez les newsletters pour les entreprises</p>
            </div>
          </div>
        </div>

        <div className="row mb-30">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5>Ajouter une nouvelle newsletter</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleAddNewsletter}>
                  <div className="mb-3">
                    <label htmlFor="companyId" className="form-label">Entreprise</label>
                    <select 
                      className="form-select" 
                      id="companyId" 
                      name="companyId" 
                      value={formData.companyId}
                      onChange={handleInputChange}
                    >
                      <option value="">Sélectionner une entreprise</option>
                      {companies.map(company => (
                        <option key={company._id} value={company._id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="content" className="form-label">Contenu</label>
                    <textarea 
                      className="form-control" 
                      id="content" 
                      name="content" 
                      rows="5"
                      value={formData.content}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary">Ajouter</button>
                </form>
              </div>
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
                        <th>Entreprise</th>
                        <th>Contenu</th>
                        <th>Date de création</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newsletters.length > 0 ? (
                        newsletters.map((newsletter) => {
                          // Find the company name for this newsletter
                          const company = companies.find(c => c._id === newsletter.companyId);
                          const companyName = company ? company.name : 'Entreprise inconnue';
                          
                          return (
                            <tr key={newsletter._id}>
                              <td>{companyName}</td>
                              <td>
                                {newsletter.content.length > 100 
                                  ? `${newsletter.content.substring(0, 100)}...` 
                                  : newsletter.content}
                              </td>
                              <td>{new Date(newsletter.createdAt).toLocaleDateString()}</td>
                              <td>
                                <button 
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDeleteNewsletter(newsletter._id)}
                                >
                                  Supprimer
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center">Aucune newsletter trouvée</td>
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
