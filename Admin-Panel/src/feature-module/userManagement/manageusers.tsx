import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Datatable from "../../core/common/dataTable/index";
import { TableData } from "../../core/data/interface";
import PredefinedDateRanges from "../../core/common/datePicker";
import CommonSelect from "../../core/common/commonSelect";
import { Reason } from "../../core/common/selectoption/selectoption";
import { all_routes } from "../router/all_routes";
import TooltipOption from "../../core/common/tooltipOption";
import axios from "axios";
import Swal from 'sweetalert2';

/**
 * User Management Page
 * @author haythem
 * @description This component displays a list of users with filtering, pagination and search capabilities
 * @date March 2025
 */

// Interface for User data
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profilePicture?: string;
  isEmailVerified: boolean;
  isActive?: boolean;
  createdAt: string;
}

interface ApiResponse {
  users: User[];
}

const Manageusers = () => {
  const routes = all_routes;
  const [userData, setUserData] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Function to fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/users/allusers`
      );
      
      // Ensure userData is always an array
      if (response.data && response.data.users && Array.isArray(response.data.users)) {
        // Prenez le tableau users à l'intérieur de l'objet response.data
        setUserData(response.data.users);
      } else if (Array.isArray(response.data)) {
        // Si la réponse est déjà un tableau
        setUserData(response.data);
      } else {
        // Si response.data n'est pas au format attendu
        console.error("API response format is unexpected:", response.data);
        setUserData([]);
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Please try again later.");
      setUserData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fonction pour trier les données
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Si on clique sur le même champ, on inverse l'ordre
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Si nouveau champ, on trie par défaut en ordre ascendant
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Fonction pour appliquer le tri aux données
  const sortedData = [...userData].sort((a, b) => {
    let aValue: any = a[sortField as keyof User];
    let bValue: any = b[sortField as keyof User];
    
    // Cas spéciaux pour certains champs
    if (sortField === 'firstName') {
      aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
      bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Fonction pour filtrer par statut (actif/inactif)
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(e.target.value);
    fetchUsers(); // Idéalement, adaptez fetchUsers pour prendre en compte filterStatus
  };

  // Fonction pour mettre à jour le statut actif/inactif d'un utilisateur
  const updateUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/users/${userId}`,
        { isActive }
      );
      
      if (response.data.success) {
        // Mise à jour réussie
        Swal.fire({
          title: 'Updated!',
          text: `User status changed to ${isActive ? 'Active' : 'Inactive'}`,
          icon: 'success',
          timer: 1500
        });
        
        // Rafraîchir la liste des utilisateurs
        fetchUsers();
      } else {
        throw new Error(response.data.message || 'Error updating user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      
      Swal.fire({
        title: 'Error!',
        text: error instanceof Error ? error.message : 'Failed to update user status',
        icon: 'error'
      });
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Removed the implementation of this function
  };

  // Handle role filter change
  const handleRoleFilterChange = (selectedOption: any) => {
    // Removed the implementation of this function
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    // Removed the implementation of this function
  };

  // Reset filters
  const handleResetFilters = () => {
    // Removed the implementation of this function
  };

  const columns = [
    {
      title: "User",
      dataIndex: "firstName",
      render: (firstName: string, record: User) => (
        <div className="table-avatar user-profile">
          <a href="#" className="avatar">
            <img src={record.profilePicture || "/assets/img/profiles/default-avatar.jpg"} alt="User Image" />
          </a>
          <div>
            <h5>
              <a href="#">
                {record.firstName} {record.lastName}
              </a>
            </h5>
            <p>{record.email}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Email Verified",
      dataIndex: "isEmailVerified",
      render: (isVerified: boolean) => (
        <span className={`badge ${isVerified ? "bg-success" : "bg-danger"}`}>
          {isVerified ? "Verified" : "Not Verified"}
        </span>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      render: (role: string, record: User) => (
        <div className="dropdown">
          <button 
            className={`btn btn-sm dropdown-toggle ${getRoleButtonClass(role)}`} 
            type="button" 
            data-bs-toggle="dropdown" 
            aria-expanded="false"
          >
            {capitalizeFirstLetter(role)}
          </button>
          <ul className="dropdown-menu">
            <li>
              <a 
                className="dropdown-item" 
                href="#" 
                onClick={(e) => updateUserRole(record._id, 'admin', e)}
              >
                Admin
              </a>
            </li>
            <li>
              <a 
                className="dropdown-item" 
                href="#" 
                onClick={(e) => updateUserRole(record._id, 'HR', e)}
              >
                HR
              </a>
            </li>
            <li>
              <a 
                className="dropdown-item" 
                href="#" 
                onClick={(e) => updateUserRole(record._id, 'candidate', e)}
              >
                Candidate
              </a>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (isActive: boolean, record: User) => (
        <div className="form-check form-switch">
          <input 
            className="form-check-input" 
            type="checkbox" 
            id={`status-${record._id}`}
            checked={isActive !== false} // Traite undefined comme actif (pour les utilisateurs existants)
            onChange={(e) => updateUserStatus(record._id, e.target.checked)}
          />
          <label 
            className={`badge ${isActive !== false ? 'bg-success' : 'bg-danger'}`} 
            htmlFor={`status-${record._id}`}
          >
            {isActive !== false ? 'Active' : 'Inactive'}
          </label>
        </div>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      render: (date: string) => (
        <span>{date ? new Date(date).toLocaleDateString() : "N/A"}</span>
      ),
    },
    {
      title: "Actions",
      dataIndex: "_id",
      render: (id: string, record: User) => (
        <div className="d-flex align-items-center">
          <Link
            to="#"
            className="btn btn-sm btn-secondary me-2"
            title="Edit"
            onClick={() => handleEditClick(record)}
          >
            <i className="feather-edit"></i>
          </Link>
          <Link
            to="#"
            className="btn btn-sm btn-danger"
            title="Delete"
            onClick={() => handleDeleteUser(id)}
          >
            <i className="feather-trash-2"></i>
          </Link>
        </div>
      ),
    },
  ];

  // Helper function pour obtenir la classe du bouton en fonction du rôle
  const getRoleButtonClass = (role: string): string => {
    switch (role) {
      case 'admin':
        return 'btn-danger';
      case 'hr':
        return 'btn-info';
      case 'employer':
        return 'btn-primary';
      case 'candidate':
        return 'btn-success';
      default:
        return 'btn-secondary';
    }
  };

  // Helper function pour capitaliser la première lettre
  const capitalizeFirstLetter = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Fonction pour mettre à jour le rôle d'un utilisateur
  const updateUserRole = async (userId: string, newRole: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    
    try {
      const response = await axios.put(
        `http://localhost:5000/api/users/${userId}`,
        { role: newRole }
      );
      
      if (response.data.success) {
        // Mise à jour réussie
        Swal.fire({
          title: 'Updated!',
          text: `User role changed to ${capitalizeFirstLetter(newRole)}`,
          icon: 'success',
          timer: 1500
        });
        
        // Rafraîchir la liste des utilisateurs
        fetchUsers();
      } else {
        throw new Error(response.data.message || 'Error updating user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      
      Swal.fire({
        title: 'Error!',
        text: error instanceof Error ? error.message : 'Failed to update user role',
        icon: 'error'
      });
    }
  };

  // Function to handle user deletion
  const handleDeleteUser = async (userId: string) => {
    try {
      // Show confirmation dialog
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      });

      // If user confirms deletion
      if (result.isConfirmed) {
        // Call API to delete user
        const response = await axios.delete(`http://localhost:5000/api/users/${userId}`);
        
        if (response.data.success) {
          // Show success message
          Swal.fire({
            title: 'Deleted!',
            text: 'User has been deleted.',
            icon: 'success',
            timer: 1500
          });
          
          // Refresh user list
          fetchUsers();
        } else {
          throw new Error(response.data.message || 'Error deleting user');
        }
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      
      // Show error message
      Swal.fire({
        title: 'Error!',
        text: error instanceof Error ? error.message : 'Failed to delete user',
        icon: 'error'
      });
    }
  };

  // State for managing the edit user modal
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    isActive: true
  });

  // Open edit modal with user data
  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || '',
      isActive: user.isActive !== false
    });
    setShowEditModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle user update
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;
    
    try {
      const response = await axios.put(
        `http://localhost:5000/api/users/${selectedUser._id}`,
        formData
      );
      
      if (response.data.success) {
        // Close modal
        setShowEditModal(false);
        
        // Show success message
        Swal.fire({
          title: 'Updated!',
          text: 'User information has been updated.',
          icon: 'success',
          timer: 1500
        });
        
        // Refresh user list
        fetchUsers();
      } else {
        throw new Error(response.data.message || 'Error updating user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      
      // Show error message
      Swal.fire({
        title: 'Error!',
        text: error instanceof Error ? error.message : 'Failed to update user',
        icon: 'error'
      });
    }
  };

  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const handleApplyClick = () => {
    if (dropdownMenuRef.current) {
      dropdownMenuRef.current.classList.remove("show");
    }
  };

  // Role options for the dropdown
  const roleOptions = [
    { value: "", label: "All Roles" },
    { value: "admin", label: "Admin" },
    { value: "hr", label: "HR" },
    { value: "candidate", label: "Candidate" },
  ];

  return (
    <div>
      <>
        {/* Page Wrapper */}
        <div className="page-wrapper">
          <div className="content">
            {/* Page Header */}
            <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
              <div className="my-auto mb-2">
                <h3 className="page-title mb-1">Users</h3>
                <nav>
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link to={routes.adminDashboard}>Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="#">User Management</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Users
                    </li>
                  </ol>
                </nav>
              </div>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
                <TooltipOption />
                <div className="mb-2">
                  <Link
                    to="/add-user"
                    className="btn btn-primary d-flex align-items-center"
                  >
                    <i className="ti ti-square-rounded-plus me-2" />
                    Add User
                  </Link>
                </div>
              </div>
            </div>
            {/* /Page Header */}
            {/* Filter Section */}
            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
                <h4 className="mb-3">Users List</h4>
                <div className="d-flex align-items-center flex-wrap">
                  <div className="mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search users..."
                      // Removed the implementation of this input
                    />
                  </div>
                  <div className="dropdown mb-3 me-2">
                    <Link
                      to="#"
                      className="btn btn-outline-light bg-white dropdown-toggle"
                      data-bs-toggle="dropdown"
                      data-bs-auto-close="outside"
                    >
                      <i className="ti ti-filter me-2" />
                      Filter
                    </Link>
                    <div
                      className="dropdown-menu drop-width"
                      ref={dropdownMenuRef}
                    >
                      <form>
                        <div className="d-flex align-items-center border-bottom p-3">
                          <h4>Filter</h4>
                        </div>
                        <div className="p-3 border-bottom">
                          <div className="row">
                            <div className="col-md-12">
                              <div className="mb-0">
                                <label className="form-label">Role</label>
                                <CommonSelect
                                  className="select"
                                  options={roleOptions}
                                  onChange={handleRoleFilterChange}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 d-flex align-items-center justify-content-end">
                          <Link 
                            to="#" 
                            className="btn btn-light me-3"
                            // Removed the implementation of this link
                          >
                            Reset
                          </Link>
                          <Link
                            to="#"
                            className="btn btn-primary"
                            onClick={handleApplyClick}
                          >
                            Apply
                          </Link>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading users...</p>
                  </div>
                ) : error ? (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                ) : userData.length === 0 ? (
                  <div className="alert alert-info" role="alert">
                    No users found.
                  </div>
                ) : (
                  <>
                    <div className="table-sorting-section mb-3">
                      <div className="row align-items-center">
                        <div className="col-md-6">
                          <h5 className="card-title">Users List</h5>
                        </div>
                        <div className="col-md-6">
                          <div className="sort-options text-end">
                            <button 
                              className={`btn btn-sm ${sortField === 'firstName' ? (sortOrder === 'asc' ? 'btn-primary' : 'btn-info') : 'btn-outline-secondary'}`}
                              onClick={() => handleSort('firstName')}
                            >
                              Name {sortField === 'firstName' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </button>
                            <button 
                              className={`btn btn-sm ms-2 ${sortField === 'email' ? (sortOrder === 'asc' ? 'btn-primary' : 'btn-info') : 'btn-outline-secondary'}`}
                              onClick={() => handleSort('email')}
                            >
                              Email {sortField === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </button>
                            <button 
                              className={`btn btn-sm ms-2 ${sortField === 'role' ? (sortOrder === 'asc' ? 'btn-primary' : 'btn-info') : 'btn-outline-secondary'}`}
                              onClick={() => handleSort('role')}
                            >
                              Role {sortField === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </button>
                            <button 
                              className={`btn btn-sm ms-2 ${sortField === 'createdAt' ? (sortOrder === 'asc' ? 'btn-primary' : 'btn-info') : 'btn-outline-secondary'}`}
                              onClick={() => handleSort('createdAt')}
                            >
                              Date {sortField === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="table-responsive">
                      <Datatable columns={columns} dataSource={sortedData} Selection={false} />
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* /Filter Section */}
          </div>
        </div>
        {/* /Page Wrapper */}
        <div className="mt-4">
          {/* Edit User Modal */}
          {showEditModal && selectedUser && (
            <div className="modal fade show" style={{ display: 'block' }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Edit User</h5>
                    <button 
                      type="button" 
                      className="btn-close" 
                      onClick={() => setShowEditModal(false)}
                    ></button>
                  </div>
                  <form onSubmit={handleUpdateUser}>
                    <div className="modal-body">
                      <div className="mb-3">
                        <label className="form-label">First Name</label>
                        <input
                          type="text"
                          className="form-control"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Last Name</label>
                        <input
                          type="text"
                          className="form-control"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Role</label>
                        <select 
                          className="form-select" 
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Role</option>
                          <option value="admin">Admin</option>
                          <option value="hr">HR</option>
                          <option value="user">User</option>
                          <option value="employer">Employer</option>
                          <option value="candidate">Candidate</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            name="isActive"
                            checked={formData.isActive !== false}
                            onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                            id="statusToggle"
                          />
                          <label className="form-check-label" htmlFor="statusToggle">
                            {formData.isActive !== false ? 'Active' : 'Inactive'}
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={() => setShowEditModal(false)}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
              <div className="modal-backdrop fade show"></div>
            </div>
          )}
        </div>
        <div className="col-sm-12 col-md-3">
          <div className="dataTables_length" id="status_filter">
            <label>
              Status
              <select
                className="form-select form-control-sm"
                onChange={handleStatusFilterChange}
                value={filterStatus}
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>
        </div>
      </>
    </div>
  );
};

export default Manageusers;
