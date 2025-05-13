import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import CommonSelect from "../../../core/common/commonSelect";
import { profilecity, profilesel, profilestate } from "../../../core/common/selectoption/selectoption";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { getUserProfile, updateUserProfile, uploadProfilePicture, UserProfile } from "../../../services/userService";
import { logout, refreshToken } from "../../../services/authService";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch } from "react-redux";
import { updateUserProfile as updateReduxUserProfile } from "../../../core/data/redux/authSlice";

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  state: string;
  city: string;
  zip: string;
  profilePicture?: string;
}

const Profilesettings = () => {
  const routes = all_routes;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [authError, setAuthError] = useState<boolean>(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    country: "",
    state: "",
    city: "",
    zip: ""
  });
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch user profile data when component mounts
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        setAuthError(false);
        const userData = await getUserProfile();
        setFormData({
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          email: userData.email || "",
          phone: userData.phone || "",
          address: userData.address || "",
          country: userData.country || "",
          state: userData.state || "",
          city: userData.city || "",
          zip: userData.zipCode || ""
        });
        if (userData.profilePicture) {
          setImagePreview(userData.profilePicture);
        }
      } catch (error: any) {
        console.error("Failed to load user profile:", error);
        if (error?.response?.status === 401) {
          setAuthError(true);
          toast.error(
            "Authentication error. Please try refreshing your session.",
            {
              autoClose: 5000,
              closeButton: true,
              position: "top-right",
            }
          );
        } else {
          toast.warning("Using demo data for profile. Connect backend to use real data.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  // Function to handle session refresh
  const handleRefreshSession = async () => {
    try {
      setLoading(true);
      
        toast.success("Session refreshed successfully!");
        setAuthError(false);
        // Reload user profile
        const userData = await getUserProfile();
        setFormData({
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          email: userData.email || "",
          phone: userData.phone || "",
          address: userData.address || "",
          country: userData.country || "",
          state: userData.state || "",
          city: userData.city || "",
          zip: userData.zipCode || ""
        });
        if (userData.profilePicture) {
          setImagePreview(userData.profilePicture);
        }
       else {
        toast.error("Unable to refresh session. Please log in again.");
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate(routes.login);
        }, 2000);
      }
    } catch (error) {
      console.error("Session refresh failed:", error);
      toast.error("Session refresh failed. Please log in again.");
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate(routes.login);
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: any) => {
    setFormData({
      ...formData,
      [name]: value.value
    });
  };

  // Handle file input change
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Preview the image
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      // Upload profile picture if a new one was selected
      let profilePictureUrl = formData.profilePicture;
      if (selectedFile) {
        profilePictureUrl = await uploadProfilePicture(selectedFile);
        
        // Set the profile picture URL in the form data
        setFormData(prev => ({
          ...prev,
          profilePicture: profilePictureUrl
        }));
      }
      
      // Prepare user profile data for update
      const profileUpdateData: Partial<UserProfile> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        zipCode: formData.zip,
        profilePicture: profilePictureUrl
      };
      
      // Update user profile on the backend
      // Redux state is automatically updated in the service
      await updateUserProfile(profileUpdateData);
      
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      if (error?.response?.status === 401) {
        setAuthError(true);
        toast.error("Authentication error. Your session may have expired.");
      } else {
        toast.error("Failed to update profile. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <ToastContainer />
      <>
        {/* Page Wrapper */}
        <div className="page-wrapper">
          <div className="content">
            {/* Breadcrumb */}
            <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
              <div className="my-auto mb-2">
                <h2 className="mb-1">Settings</h2>
                <nav>
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link to={routes.adminDashboard}>
                        <i className="ti ti-smart-home" />
                      </Link>
                    </li>
                    <li className="breadcrumb-item">Administration</li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Settings
                    </li>
                  </ol>
                </nav>
              </div>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
            {/* /Breadcrumb */}
            <ul className="nav nav-tabs nav-tabs-solid bg-transparent border-bottom mb-3">
              <li className="nav-item">
                <Link className="nav-link active" to={routes.profilesettings}>
                  <i className="ti ti-settings me-2" />
                  General Settings
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to={routes.bussinessSettings}>
                  <i className="ti ti-world-cog me-2" />
                  Website Settings
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to={routes.salarySettings}>
                  <i className="ti ti-device-ipad-horizontal-cog me-2" />
                  App Settings
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to={routes.emailSettings}>
                  <i className="ti ti-server-cog me-2" />
                  System Settings
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to={routes.paymentGateways}>
                  <i className="ti ti-settings-dollar me-2" />
                  Financial Settings
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to={routes.customCss}>
                  <i className="ti ti-settings-2 me-2" />
                  Other Settings
                </Link>
              </li>
            </ul>
            <div className="row">
              <div className="col-xl-3 theiaStickySidebar">
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex flex-column list-group settings-list">
                      <Link
                        to={routes.profilesettings}
                        className="d-inline-flex align-items-center rounded active py-2 px-3"
                      >
                        <i className="ti ti-arrow-badge-right me-2" />
                        Profile Settings
                      </Link>
                      <Link
                        to={routes.securitysettings}
                        className="d-inline-flex align-items-center rounded py-2 px-3"
                      >
                        Security Settings
                      </Link>
                      <Link
                        to={routes.notificationssettings}
                        className="d-inline-flex align-items-center rounded py-2 px-3"
                      >
                        Notifications
                      </Link>
                      <Link
                        to={routes.connectedApps}
                        className="d-inline-flex align-items-center rounded py-2 px-3"
                      >
                        Connected Apps
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-9">
                <div className="card">
                  <div className="card-body">
                    <div className="border-bottom mb-3 pb-3">
                      <h4>Profile Settings</h4>
                    </div>
                    {loading ? (
                      <div className="text-center my-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2">Loading profile data...</p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit}>
                        <div className="border-bottom mb-3">
                          <div className="row">
                            <div className="col-md-12">
                              <div>
                                <h6 className="mb-3">Basic Information</h6>
                                <div className="d-flex align-items-center flex-wrap row-gap-3 bg-light w-100 rounded p-3 mb-4">
                                  <div className="d-flex align-items-center justify-content-center avatar avatar-xxl rounded-circle border border-dashed me-2 flex-shrink-0 text-dark frames">
                                    {imagePreview ? (
                                      <img 
                                        src={imagePreview} 
                                        alt="Profile" 
                                        className="img-fluid rounded-circle" 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      />
                                    ) : (
                                      <i className="ti ti-photo text-gray-3 fs-16" />
                                    )}
                                  </div>
                                  <div className="profile-upload">
                                    <div className="mb-2">
                                      <h6 className="mb-1">Profile Photo</h6>
                                      <p className="fs-12">
                                        Recommended image size is 40px x 40px
                                      </p>
                                    </div>
                                    <div className="profile-uploader d-flex align-items-center">
                                      <div className="drag-upload-btn btn btn-sm btn-primary me-2">
                                        Upload
                                        <input
                                          type="file"
                                          className="form-control image-sign"
                                          multiple
                                          accept="image/*"
                                          onChange={handleFileChange}
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        className="btn btn-light btn-sm"
                                        onClick={() => {
                                          setImagePreview("");
                                          setSelectedFile(null);
                                        }}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="row">
                            <div className="col-md-6">
                              <div className="row align-items-center mb-3">
                                <div className="col-md-4">
                                  <label className="form-label mb-md-0">
                                    First Name
                                  </label>
                                </div>
                                <div className="col-md-8">
                                  <input 
                                    type="text" 
                                    className="form-control" 
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="row align-items-center mb-3">
                                <div className="col-md-4">
                                  <label className="form-label mb-md-0">
                                    Last Name
                                  </label>
                                </div>
                                <div className="col-md-8">
                                  <input 
                                    type="text" 
                                    className="form-control" 
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="row align-items-center mb-3">
                                <div className="col-md-4">
                                  <label className="form-label mb-md-0">Email</label>
                                </div>
                                <div className="col-md-8">
                                  <input 
                                    type="email" 
                                    className="form-control" 
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="row align-items-center mb-3">
                                <div className="col-md-4">
                                  <label className="form-label mb-md-0">Phone</label>
                                </div>
                                <div className="col-md-8">
                                  <input 
                                    type="text" 
                                    className="form-control" 
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="d-flex justify-content-end gap-2">
                          <button
                            type="button"
                            className="btn btn-light btn-cancel"
                            onClick={() => {
                              // Reset form to initial values
                              window.location.reload();
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary btn-save"
                            disabled={saving}
                          >
                            {saving ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Saving...
                              </>
                            ) : (
                              "Save Changes"
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Auth Error Alert */}
            {authError && (
              <div className="alert alert-warning alert-dismissible fade show" role="alert">
                <strong>Authentication Error!</strong> Your session may have expired.
                <div className="mt-2">
                  <button 
                    type="button" 
                    className="btn btn-sm btn-primary me-2"
                    onClick={handleRefreshSession}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Refreshing...
                      </>
                    ) : (
                      "Refresh Session"
                    )}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => {
                      navigate(routes.login);
                    }}
                  >
                    Log In Again
                  </button>
                </div>
                <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
              </div>
            )}
          </div>
          <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
            <p className="mb-0">2014 - 2025 © SmartHR.</p>
            <p>
              Designed &amp; Developed By{" "}
              <Link to="#" className="text-primary">
                Dreams
              </Link>
            </p>
          </div>
        </div>
        {/* /Page Wrapper */}
      </>
    </div>
  );
};

export default Profilesettings;
