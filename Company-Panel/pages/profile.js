import Layout from "@/components/layout/Layout"
import { useState, useEffect, useRef } from "react"
import { getCurrentUser, createAuthAxios } from "../utils/authUtils"
import Swal from "sweetalert2"
import { useRouter } from "next/router"
import withAuth from "@/utils/withAuth"

function Profile({ user }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        website: '',
        bio: '',
        address: '',
        city: '',
        skills: []
    });
    const [profileImage, setProfileImage] = useState(null);
    const [profileImageUrl, setProfileImageUrl] = useState('/assets/imgs/page/dashboard/profile.png');
    const fileInputRef = useRef(null);
    const authAxios = createAuthAxios();
    
    useEffect(() => {
        if (user) {
            // Initialize form with user data
            setFormData({
                fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                email: user.email || '',
                phone: user.phone || '',
                website: user.website || '',
                bio: user.bio || '',
                address: user.address || '',
                city: user.city || '',
                skills: user.skills || []
            });
            
            // Set profile image if available
            if (user.profilePicture) {
                setProfileImageUrl(user.profilePicture);
            }
        }
    }, [user]);
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleImageClick = () => {
        fileInputRef.current.click();
    };
    
    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid File Type',
                text: 'Please upload a valid image file (JPEG, PNG, JPG, GIF)'
            });
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            Swal.fire({
                icon: 'error',
                title: 'File Too Large',
                text: 'Please upload an image smaller than 5MB'
            });
            return;
        }
        
        setProfileImage(file);
        
        // Create a preview URL
        const reader = new FileReader();
        reader.onload = () => {
            setProfileImageUrl(reader.result);
        };
        reader.readAsDataURL(file);
    };
    
    const uploadImage = async () => {
        if (!profileImage) return null;
        
        try {
            setImageLoading(true);
            
            const formData = new FormData();
            formData.append('profileImage', profileImage);
            
            const response = await authAxios.post('/api/users/upload-profile-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (response.data && response.data.imageUrl) {
                return response.data.imageUrl;
            }
            return null;
        } catch (error) {
            console.error('Error uploading image:', error);
            Swal.fire({
                icon: 'error',
                title: 'Upload Failed',
                text: 'Failed to upload profile image. Please try again.'
            });
            return null;
        } finally {
            setImageLoading(false);
        }
    };
    
    const handleDeleteImage = () => {
        setProfileImage(null);
        setProfileImageUrl('/assets/imgs/page/dashboard/profile.png');
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            
            // Upload image first if there's a new one
            let imageUrl = null;
            if (profileImage) {
                imageUrl = await uploadImage();
            }
            
            // Split full name into first and last name
            const nameParts = formData.fullName.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            // Prepare update data
            const updateData = {
                firstName,
                lastName,
                email: formData.email,
                phone: formData.phone,
                website: formData.website,
                bio: formData.bio,
                address: formData.address,
                city: formData.city,
                skills: formData.skills
            };
            
            // Add profile picture URL if uploaded
            if (imageUrl) {
                updateData.profilePicture = imageUrl;
            }
            
            // Update user profile
            const response = await authAxios.put('/api/users/update-profile', updateData);
            
            if (response.data && response.data.success) {
                // Update local storage with new user data
                const currentUser = getCurrentUser();
                if (currentUser) {
                    const updatedUser = {
                        ...currentUser,
                        ...updateData,
                        profilePicture: imageUrl || currentUser.profilePicture
                    };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                }
                
                Swal.fire({
                    icon: 'success',
                    title: 'Profile Updated',
                    text: 'Your profile has been updated successfully!'
                });
                
                // Refresh the page to show updated data
                setTimeout(() => {
                    router.reload();
                }, 1500);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: 'Failed to update profile. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <>
            <Layout breadcrumbTitle="My Profile" breadcrumbActive="My Profile">
                <div className="row">
                    <div className="col-xxl-9 col-xl-8 col-lg-8">
                        <div className="section-box">
                            <div className="container">
                                <form onSubmit={handleSubmit}>
                                    <div className="panel-white mb-30">
                                        <div className="box-padding">
                                            <h6 className="color-text-paragraph-2">Update your profile</h6>
                                            <div className="box-profile-image">
                                                <div className="img-profile" onClick={handleImageClick} style={{ cursor: 'pointer' }}>
                                                    {/* Hidden file input */}
                                                    <input 
                                                        type="file" 
                                                        ref={fileInputRef} 
                                                        style={{ display: 'none' }} 
                                                        onChange={handleImageChange} 
                                                        accept="image/jpeg,image/png,image/jpg,image/gif"
                                                    />
                                                    
                                                    <img
                                                        src={profileImageUrl}
                                                        alt="Profile"
                                                        style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%' }}
                                                    />
                                                    {imageLoading && (
                                                        <div className="image-loading-overlay">
                                                            <div className="spinner-border text-primary" role="status">
                                                                <span className="visually-hidden">Loading...</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="info-profile">
                                                    <button type="button" className="btn btn-default" onClick={handleImageClick}>
                                                        <i className="fi-rr-camera me-2"></i>
                                                        Upload Avatar
                                                    </button>
                                                    <button type="button" className="btn btn-link" onClick={handleDeleteImage}>
                                                        <i className="fi-rr-trash me-2"></i>
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-lg-6 col-md-6">
                                                    <div className="form-group mb-30">
                                                        <label className="font-sm color-text-mutted mb-10">
                                                            Full Name *
                                                        </label>
                                                        <input
                                                            className="form-control"
                                                            type="text"
                                                            placeholder="John Doe"
                                                            name="fullName"
                                                            value={formData.fullName}
                                                            onChange={handleInputChange}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-lg-6 col-md-6">
                                                    <div className="form-group mb-30">
                                                        <label className="font-sm color-text-mutted mb-10">
                                                            Email *
                                                        </label>
                                                        <input
                                                            className="form-control"
                                                            type="email"
                                                            placeholder="example@domain.com"
                                                            name="email"
                                                            value={formData.email}
                                                            onChange={handleInputChange}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-lg-6 col-md-6">
                                                    <div className="form-group mb-30">
                                                        <label className="font-sm color-text-mutted mb-10">
                                                            Contact number
                                                        </label>
                                                        <input
                                                            className="form-control"
                                                            type="text"
                                                            placeholder="+1 234 567 890"
                                                            name="phone"
                                                            value={formData.phone}
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-lg-6 col-md-6">
                                                    <div className="form-group mb-30">
                                                        <label className="font-sm color-text-mutted mb-10">
                                                            Personal website
                                                        </label>
                                                        <input
                                                            className="form-control"
                                                            type="url"
                                                            placeholder="https://yourwebsite.com"
                                                            name="website"
                                                            value={formData.website}
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-lg-12">
                                                    <div className="form-group mb-30">
                                                        <label className="font-sm color-text-mutted mb-10">Bio</label>
                                                        <textarea
                                                            className="form-control"
                                                            name="bio"
                                                            rows={5}
                                                            placeholder="Tell us about yourself"
                                                            value={formData.bio}
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-lg-6 col-md-6">
                                                    <div className="form-group mb-30">
                                                        <label className="font-sm color-text-mutted mb-10">
                                                            Experience
                                                        </label>
                                                        <input
                                                            className="form-control"
                                                            type="text"
                                                            name="experience"
                                                            placeholder="1 - 5 Years"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-lg-6 col-md-6">
                                                    <div className="form-group mb-30">
                                                        <label className="font-sm color-text-mutted mb-10">
                                                            Education Levels
                                                        </label>
                                                        <input
                                                            className="form-control"
                                                            type="text"
                                                            name="education"
                                                            placeholder="Certificate"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-lg-6 col-md-6">
                                                    <div className="form-group mb-30">
                                                        <label className="font-sm color-text-mutted mb-10">
                                                            Languages
                                                        </label>
                                                        <input
                                                            className="form-control"
                                                            type="text"
                                                            name="languages"
                                                            placeholder="English, French"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-lg-6 col-md-6">
                                                    <div className="form-group mb-30">
                                                        <label className="font-sm color-text-mutted mb-10">
                                                            Skills
                                                        </label>
                                                        <input
                                                            className="form-control"
                                                            type="text"
                                                            name="skills"
                                                            placeholder="UI/UX design, JavaScript, React"
                                                            value={formData.skills.join(', ')}
                                                            onChange={(e) => {
                                                                const skillsArray = e.target.value.split(',').map(skill => skill.trim()).filter(Boolean);
                                                                setFormData(prev => ({ ...prev, skills: skillsArray }));
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-lg-12">
                                                    <div className="form-group mt-10">
                                                        <button 
                                                            type="submit" 
                                                            className="btn btn-default btn-brand icon-tick"
                                                            disabled={loading}
                                                        >
                                                            {loading ? 'Saving...' : 'Save Changes'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="panel-white mb-30">
                                        <div className="box-padding">
                                            <h6 className="color-text-paragraph-2">Contact Information</h6>
                                            <div className="row mt-30">
                                                <div className="col-lg-6 col-md-6">
                                                    <div className="form-group mb-30">
                                                        <label className="font-sm color-text-mutted mb-10">
                                                            Country
                                                        </label>
                                                        <input
                                                            className="form-control"
                                                            type="text"
                                                            name="country"
                                                            placeholder="United States of America"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-lg-6 col-md-6">
                                                    <div className="form-group mb-30">
                                                        <label className="font-sm color-text-mutted mb-10">
                                                            City
                                                        </label>
                                                        <input
                                                            className="form-control"
                                                            type="text"
                                                            name="city"
                                                            value={formData.city}
                                                            onChange={handleInputChange}
                                                            placeholder="Chicago"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-lg-12">
                                                    <div className="form-group mb-30">
                                                        <label className="font-sm color-text-mutted mb-10">
                                                            Complete Address
                                                        </label>
                                                        <input
                                                            className="form-control"
                                                            type="text"
                                                            name="address"
                                                            value={formData.address}
                                                            onChange={handleInputChange}
                                                            placeholder="205 North Michigan Avenue, Suite 810, Chicago, 60601, USA"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    
                    <div className="col-xxl-3 col-xl-4 col-lg-4">
                        <div className="section-box">
                            <div className="container">
                                <div className="panel-white">
                                    <div className="panel-head">
                                        <h5>Social Network</h5>
                                    </div>
                                    <div className="panel-body pt-20">
                                        <div className="row">
                                            <div className="col-lg-12">
                                                <div className="form-group mb-30">
                                                    <label className="font-sm color-text-mutted mb-10">
                                                        Facebook
                                                    </label>
                                                    <input
                                                        className="form-control"
                                                        type="text"
                                                        placeholder="https://www.facebook.com"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-lg-12">
                                                <div className="form-group mb-30">
                                                    <label className="font-sm color-text-mutted mb-10">
                                                        Twitter
                                                    </label>
                                                    <input
                                                        className="form-control"
                                                        type="text"
                                                        placeholder="https://twitter.com"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-lg-12">
                                                <div className="form-group mb-30">
                                                    <label className="font-sm color-text-mutted mb-10">
                                                        LinkedIn
                                                    </label>
                                                    <input
                                                        className="form-control"
                                                        type="text"
                                                        placeholder="https://www.linkedin.com"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        </>
    );
}

export default withAuth(Profile);
