import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../components/Layout/admin/AdminLayout";

export default function AdminReclamations() {
  const router = useRouter();
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);

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
        
        // Fetch reclamations, users and companies in parallel
        const [reclamationsResponse, usersResponse, companiesResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reclamation`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        if (!reclamationsResponse.ok) {
          throw new Error("Failed to fetch reclamations");
        }
        
        if (!usersResponse.ok) {
          throw new Error("Failed to fetch users");
        }
        
        if (!companiesResponse.ok) {
          throw new Error("Failed to fetch companies");
        }
        
        const reclamationsData = await reclamationsResponse.json();
        const usersData = await usersResponse.json();
        const companiesData = await companiesResponse.json();
        
        setReclamations(reclamationsData);
        setUsers(usersData);
        setCompanies(companiesData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getTargetName = (reclamation) => {
    if (reclamation.targetType === "User") {
      const targetUser = users.find(user => user._id === reclamation.targetId);
      return targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : "Utilisateur inconnu";
    } else if (reclamation.targetType === "Company") {
      const targetCompany = companies.find(company => company._id === reclamation.targetId);
      return targetCompany ? targetCompany.name : "Entreprise inconnue";
    } else if (reclamation.targetType === "Post") {
      return "Publication";
    }
    return "Inconnu";
  };

  const getUserName = (userId) => {
    const user = users.find(u => u._id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "Utilisateur inconnu";
  };

  const handleDeleteReclamation = async (id) => {
    try {
      const Swal = (await import('sweetalert2')).default;
      
      const result = await Swal.fire({
        title: 'Êtes-vous sûr?',
        text: "Cette action est irréversible!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui, supprimer!',
        cancelButtonText: 'Annuler',
        reverseButtons: true
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem("token");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reclamation/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la suppression de la réclamation");
        }

        // Update the reclamations list by removing the deleted reclamation
        setReclamations(reclamations.filter(reclamation => reclamation._id !== id));

        Swal.fire(
          'Supprimée!',
          'La réclamation a été supprimée.',
          'success'
        );
      }
    } catch (err) {
      console.error(err);
      const Swal = (await import('sweetalert2')).default;
      Swal.fire({
        title: 'Erreur!',
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
            <span className="visually-hidden">Chargement...</span>
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
              <h2>Gestion des Réclamations</h2>
              <p>Liste des réclamations soumises par les utilisateurs</p>
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
                        <th>Utilisateur</th>
                        <th>Type de cible</th>
                        <th>Cible</th>
                        <th>Raison</th>
                        <th>Date de soumission</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reclamations.length > 0 ? (
                        reclamations.map((reclamation) => (
                          <tr key={reclamation._id}>
                            <td>{getUserName(reclamation.userId)}</td>
                            <td>{reclamation.targetType}</td>
                            <td>{getTargetName(reclamation)}</td>
                            <td>
                              {reclamation.reason && reclamation.reason.length > 50 
                                ? `${reclamation.reason.substring(0, 50)}...` 
                                : reclamation.reason || 'Non spécifiée'}
                            </td>
                            <td>{new Date(reclamation.createdAt).toLocaleDateString()}</td>
                            <td>
                              <button 
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDeleteReclamation(reclamation._id)}
                              >
                                Supprimer
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center">Aucune réclamation trouvée</td>
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
