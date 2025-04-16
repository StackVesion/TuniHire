import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import ProjectForm from './ProjectForm';
import ItemPagination from './ItemPagination';
import { createAuthAxios } from '@/utils/authUtils';

const ProjectSection = ({ portfolio, userId, onUpdate, onRemove }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingProject, setEditingProject] = useState(null);

    const handleAddProject = () => {
        setEditingProject(null);
        setShowForm(true);
    };

    const handleEditProject = (project, index) => {
        setEditingProject({ ...project, index });
        setShowForm(true);
    };

    const handleProjectSuccess = (response) => {
        // Project endpoint may return different structure
        if (response.portfolio) {
            onUpdate(response.portfolio);
        } else {
            // Force a refresh
            onUpdate(null, true);
        }
        setShowForm(false);
        setEditingProject(null);
    };

    const handleRemove = (index) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const authAxios = createAuthAxios();
                    const response = await authAxios.delete(`http://localhost:5000/api/portfolios/${portfolio._id}/projects/${index}`);
                    
                    if (response.data.success) {
                        onRemove(index);
                        Swal.fire({
                            icon: 'success',
                            title: 'Deleted!',
                            text: 'Your project has been deleted.',
                            timer: 1500,
                            showConfirmButton: false
                        });
                    }
                } catch (error) {
                    console.error('Error removing project:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to delete project'
                    });
                }
            }
        });
    };

    // Project item renderer for pagination
    const renderProjectItem = (project, localIndex) => {
        const index = portfolio.projects.findIndex(p => p === project);
        return (
            <div key={localIndex} className="project-card-container animate__animated animate__fadeIn">
                <div className="card h-100 portfolio-item project-card">
                    {project.image && (
                        <img 
                            src={project.image} 
                            className="card-img-top" 
                            alt={project.title}
                            onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/300x150?text=Project+Image';
                            }}
                        />
                    )}
                    <div className="card-body">
                        <h5 className="card-title">{project.title}</h5>
                        {project.description && (
                            <p className="card-text text-muted">
                                {project.description}
                            </p>
                        )}
                        {project.technologies && project.technologies.length > 0 && (
                            <div className="mb-3">
                                <div className="d-flex flex-wrap gap-1">
                                    {project.technologies.map((tech, techIndex) => (
                                        <span key={techIndex} className="badge bg-light text-dark border">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {project.link && (
                            <a 
                                href={project.link} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="btn btn-sm btn-outline-primary"
                            >
                                <i className="fi-rr-link me-1"></i> View Project
                            </a>
                        )}
                    </div>
                    <div className="card-footer">
                        <div className="d-flex justify-content-end">
                            <button 
                                onClick={() => handleEditProject(project, index)} 
                                className="btn btn-sm btn-outline-primary me-2"
                            >
                                <i className="fi-rr-edit"></i>
                            </button>
                            <button 
                                onClick={() => handleRemove(index)} 
                                className="btn btn-sm btn-outline-danger"
                            >
                                <i className="fi-rr-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="dashboard-list-block section-block mt-5">
            <div className="section-header d-flex justify-content-between align-items-center mb-4">
                <h4>Projects</h4>
                <button onClick={handleAddProject} className="btn btn-primary btn-sm">
                    <i className="fi-rr-plus me-1"></i> Add Project
                </button>
            </div>
            
            {/* Display Project Form when adding/editing */}
            {showForm && (
                <ProjectForm 
                    portfolioId={portfolio._id}
                    project={editingProject}
                    onSuccess={handleProjectSuccess}
                    onCancel={() => setShowForm(false)}
                />
            )}
            
            {/* Display Project Grid with Pagination */}
            {portfolio.projects && portfolio.projects.length > 0 ? (
                <ItemPagination
                    items={portfolio.projects}
                    renderItem={renderProjectItem}
                    itemsPerPage={1}
                    autoScroll={true}
                    autoScrollInterval={3000}
                />
            ) : (
                <div className="text-center py-4 border rounded">
                    <p className="mb-0 text-muted">No projects added yet. Click "Add Project" to get started.</p>
                </div>
            )}

            <style jsx>{`
                .project-card {
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    overflow: hidden;
                    height: 100%;
                }
                .project-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
                }
                .project-card .card-img-top {
                    height: 200px;
                    object-fit: cover;
                }
                .section-block {
                    position: relative;
                    padding: 25px;
                    border-radius: 10px;
                    background-color: white;
                    box-shadow: 0 2px 15px rgba(0, 0, 0, 0.04);
                    margin-bottom: 30px;
                }
                .section-header {
                    padding-bottom: 15px;
                    border-bottom: 1px solid #eee;
                    margin-bottom: 25px;
                }
                .section-header h4 {
                    font-weight: 600;
                    margin-bottom: 0;
                    color: #333;
                }
                .portfolio-item {
                    position: relative;
                }
                .portfolio-item .btn-outline-primary {
                    transition: all 0.3s ease;
                }
                .portfolio-item .btn-outline-primary:hover {
                    background-color: #007bff;
                    color: white;
                }
                .portfolio-item .btn-outline-danger {
                    transition: all 0.3s ease;
                }
                .portfolio-item .btn-outline-danger:hover {
                    background-color: #dc3545;
                    color: white;
                }
                .project-card-container {
                    min-height: 450px;
                }
            `}</style>
        </div>
    );
};

export default ProjectSection;
