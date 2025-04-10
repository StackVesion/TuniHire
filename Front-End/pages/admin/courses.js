import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../components/layout/admin/AdminLayout";

export default function AdminCourses() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructor: "",
    duration: ""
  });

  useEffect(() => {
    // Check if user is logged in and is admin
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
    
    if (!token || !user || user.role !== "admin") {
      router.push("/page-signin");
      return;
    }

    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/course`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch courses");
        }
        
        const data = await response.json();
        setCourses(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    
    if (!formData.title) {
      const Swal = (await import('sweetalert2')).default;
      Swal.fire({
        title: 'Error!',
        text: 'Le titre du cours est obligatoire',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/course`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error("Failed to add course");
      }

      const newCourse = await response.json();
      
      // Update the courses list with the new one
      setCourses([...courses, newCourse]);
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        instructor: "",
        duration: ""
      });

      // Show success message
      const Swal = (await import('sweetalert2')).default;
      Swal.fire({
        title: 'Success!',
        text: 'Le cours a été ajouté avec succès',
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

  const handleDeleteCourse = async (id) => {
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/course/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la suppression du cours");
        }

        // Update the courses list by removing the deleted course
        setCourses(courses.filter(course => course._id !== id));

        Swal.fire(
          'Supprimé!',
          'Le cours a été supprimé.',
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
              <h2>Gestion des Cours</h2>
              <p>Créez et gérez les cours de formation</p>
            </div>
          </div>
        </div>

        <div className="row mb-30">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5>Ajouter un nouveau cours</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleAddCourse}>
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">Titre*</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="title" 
                      name="title" 
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">Description</label>
                    <textarea 
                      className="form-control" 
                      id="description" 
                      name="description" 
                      rows="3"
                      value={formData.description}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="instructor" className="form-label">Instructeur</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="instructor" 
                        name="instructor" 
                        value={formData.instructor}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="duration" className="form-label">Durée</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="duration" 
                        name="duration" 
                        placeholder="Ex: 2 heures, 5 jours"
                        value={formData.duration}
                        onChange={handleInputChange}
                      />
                    </div>
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
                        <th>Titre</th>
                        <th>Description</th>
                        <th>Instructeur</th>
                        <th>Durée</th>
                        <th>Date de création</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.length > 0 ? (
                        courses.map((course) => (
                          <tr key={course._id}>
                            <td>{course.title}</td>
                            <td>
                              {course.description && course.description.length > 50 
                                ? `${course.description.substring(0, 50)}...` 
                                : course.description || 'Non spécifié'}
                            </td>
                            <td>{course.instructor || 'Non spécifié'}</td>
                            <td>{course.duration || 'Non spécifié'}</td>
                            <td>{new Date(course.createdAt).toLocaleDateString()}</td>
                            <td>
                              <button 
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDeleteCourse(course._id)}
                              >
                                Supprimer
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center">Aucun cours trouvé</td>
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
