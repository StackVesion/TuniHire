import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';

// Backend API URL
const API_URL = 'http://localhost:5000/api';

const BlogCard = ({ blog, user, refreshBlogs }) => {
  const [showComments, setShowComments] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [rating, setRating] = useState(0);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user has already reviewed
    if (user && blog?.reviews) {
      const userReview = blog.reviews.find(review => review.user?._id === user._id);
      if (userReview) {
        setRating(userReview.rating);
        setReviewComment(userReview.comment || '');
      }
    }
  }, [blog, user]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Veuillez vous connecter pour aimer ce post');
      router.push('/page-login');
      return;
    }

    if (isLiking) return; // Éviter les clics multiples

    try {
      setIsLiking(true);
      await axios.post(`${API_URL}/blogs/${blog._id}/like`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      refreshBlogs();
      toast.success(userHasLiked ? 'Je n\'aime plus' : 'J\'aime');
    } catch (error) {
      console.error('Erreur lors du like:', error);
      toast.error('Erreur lors de l\'action');
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async (platform) => {
    if (!user) {
      toast.error('Veuillez vous connecter pour partager');
      router.push('/page-login');
      return;
    }

    try {
      await axios.post(`${API_URL}/blogs/${blog._id}/share`, {
        platform
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      toast.success(`Post partagé sur ${platform}`);
      refreshBlogs();
    } catch (error) {
      console.error('Erreur lors du partage:', error);
      toast.error('Erreur lors du partage');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Veuillez vous connecter pour commenter');
      router.push('/page-login');
      return;
    }

    if (!commentContent.trim()) {
      toast.error('Le commentaire ne peut pas être vide');
      return;
    }

    try {
      await axios.post(`${API_URL}/blogs/${blog._id}/comment`, {
        content: commentContent
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setCommentContent('');
      refreshBlogs();
      toast.success('Commentaire ajouté avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
      toast.error('Erreur lors de l\'ajout du commentaire');
    }
  };

  const handleReviewSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!user) {
      toast.error('Veuillez vous connecter pour donner votre avis');
      router.push('/page-login');
      return;
    }

    if (rating < 1 || rating > 5) {
      toast.error('Veuillez sélectionner une note entre 1 et 5 étoiles');
      return;
    }

    if (isSubmittingReview) return;

    try {
      setIsSubmittingReview(true);
      await axios.post(`${API_URL}/blogs/${blog._id}/review`, {
        rating,
        comment: reviewComment
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      refreshBlogs();
      setShowRatingForm(false);
      toast.success('Avis ajouté avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'avis:', error);
      toast.error('Erreur lors de l\'ajout de l\'avis');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Handle star rating click directly in the card
  const handleStarClick = async (selectedRating) => {
    if (!user) {
      toast.error('Veuillez vous connecter pour donner votre avis');
      router.push('/page-login');
      return;
    }

    // Toggle rating form if user clicked on the same star
    if (rating === selectedRating && showRatingForm) {
      setShowRatingForm(false);
      return;
    }

    setRating(selectedRating);
    setShowRatingForm(true);
  };

  const handleQuickRate = async (selectedRating) => {
    if (!user) {
      toast.error('Veuillez vous connecter pour donner votre avis');
      router.push('/page-login');
      return;
    }

    // If user just wants to quickly rate without comment
    setRating(selectedRating);
    
    try {
      setIsSubmittingReview(true);
      await axios.post(`${API_URL}/blogs/${blog._id}/review`, {
        rating: selectedRating,
        comment: ""
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      refreshBlogs();
      toast.success('Avis ajouté avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'avis:', error);
      toast.error('Erreur lors de l\'ajout de l\'avis');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Calculate average rating
  const averageRating = blog.reviews && blog.reviews.length > 0
    ? (blog.reviews.reduce((sum, review) => sum + review.rating, 0) / blog.reviews.length).toFixed(1)
    : 0;

  const reviewCount = blog.reviews?.length || 0;
  const userHasLiked = user && blog.likes && blog.likes.some(like => like._id === user._id);
  const userHasReviewed = user && blog.reviews && blog.reviews.some(review => review.user?._id === user._id);

  return (
    <div className="card-grid-3 hover-up mb-30">
      <div className="text-center card-grid-3-image">
        <Link legacyBehavior href={`/blog-details?id=${blog._id}`}>
          <a>
            <figure>
              <img alt={blog.title} src={blog.image || 'assets/imgs/page/blog/img1.png'} />
            </figure>
          </a>
        </Link>
      </div>
      <div className="card-block-info">
        <div className="tags mb-15">
          <Link legacyBehavior href={`/blog-grid?category=${blog.category}`}>
            <a className="btn btn-tag">{blog.category}</a>
          </Link>
        </div>
        <h5>
          <Link legacyBehavior href={`/blog-details?id=${blog._id}`}>
            <a>{blog.title}</a>
          </Link>
        </h5>
        <p className="mt-10 color-text-paragraph font-sm">{blog.summary}</p>
        
        <div className="card-2-bottom mt-20">
          <div className="row">
            <div className="col-lg-6 col-6">
              <div className="d-flex">
                <img className="img-rounded" src={blog.author?.profilePicture || "assets/imgs/page/homepage1/user1.png"} />
                <div className="info-right-img">
                  <span className="font-sm font-bold color-brand-1 op-70">
                    {blog.author?.firstName} {blog.author?.lastName}
                  </span>
                  <br />
                  <span className="font-xs color-text-paragraph-2">{formatDate(blog.createdAt)}</span>
                </div>
              </div>
            </div>
            <div className="col-lg-6 text-end col-6">
              <div className="d-flex justify-content-end align-items-center">
                <span className="color-text-paragraph-2 font-xs mr-15">
                  <i className="fa fa-eye mr-5"></i> {blog.viewCount} views
                </span>
                {averageRating > 0 && (
                  <div className="d-flex align-items-center">
                    <div className="star-rating">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} className={`star-icon ${star <= Math.round(averageRating) ? 'filled' : 'empty'}`}>★</span>
                      ))}
                    </div>
                    <span className="color-text-paragraph-2 font-xs ml-5">{averageRating} ({reviewCount})</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Social interaction section */}
        <div className="social-interaction">
          <div className="interaction-wrapper">
            <button 
              className={`interaction-button ${userHasLiked ? 'active' : ''}`}
              onClick={handleLike}
              disabled={isLiking}
            >
              <i className={`fa ${userHasLiked ? 'fa-thumbs-up' : 'fa-thumbs-o-up'}`}></i>
              <span className="interaction-text">Like</span>
              {blog.likes?.length > 0 && (
                <span className="interaction-count">{blog.likes?.length}</span>
              )}
            </button>
            
            <Link legacyBehavior href={`/blog-details?id=${blog._id}#comments`}>
              <a className="interaction-button">
                <i className="fa fa-comment-o"></i>
                <span className="interaction-text">Comment</span>
                {blog.comments?.length > 0 && (
                  <span className="interaction-count">{blog.comments?.length}</span>
                )}
              </a>
            </Link>
            
            <div className="dropdown">
              <button className="interaction-button" type="button" id="dropdownShare" data-bs-toggle="dropdown" aria-expanded="false">
                <i className="fa fa-share-alt"></i>
                <span className="interaction-text">Share</span>
                {blog.shares?.length > 0 && (
                  <span className="interaction-count">{blog.shares?.length}</span>
                )}
              </button>
              <ul className="dropdown-menu" aria-labelledby="dropdownShare">
                <li><a className="dropdown-item" onClick={() => handleShare('facebook')}><i className="fa fa-facebook mr-5"></i> Facebook</a></li>
                <li><a className="dropdown-item" onClick={() => handleShare('twitter')}><i className="fa fa-twitter mr-5"></i> Twitter</a></li>
                <li><a className="dropdown-item" onClick={() => handleShare('linkedin')}><i className="fa fa-linkedin mr-5"></i> LinkedIn</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Review summary */}
        <div className="review-summary mt-20 pt-15 border-top">
          <div className="d-flex justify-content-between align-items-center mb-10">
            <h6 className="m-0">Rating</h6>
            <Link legacyBehavior href={`/blog-details?id=${blog._id}#reviews`}>
              <a className="font-sm color-brand-1">See all reviews</a>
            </Link>
          </div>

          <div className="review-rating-summary">
            <div className="d-flex align-items-center">
              <div className="rating-large mr-15">
                {averageRating > 0 ? (
                  <span className="font-lg font-bold color-brand-1">{averageRating}</span>
                ) : (
                  <span className="font-sm color-text-paragraph-2">No reviews</span>
                )}
              </div>
              {averageRating > 0 && (
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span 
                      key={star} 
                      className={`star-icon ${star <= Math.round(averageRating) ? 'filled' : 'empty'}`}
                    >★</span>
                  ))}
                  <span className="ml-10 font-xs color-text-paragraph-2">({reviewCount} reviews)</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-15 text-center">
            <Link legacyBehavior href={`/blog-details?id=${blog._id}`}>
              <a className="btn btn-sm btn-primary w-100">View Details</a>
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .star-icon {
          display: inline-block;
          font-size: 16px;
          margin: 0 2px;
          color: #d1d1d1;
          user-select: none;
        }
        .star-icon.filled {
          color: #ffc107;
        }
        .rating-stars .star-icon {
          font-size: 20px;
          margin: 0 3px;
        }
        .social-interaction {
          padding-top: 12px;
          margin-top: 15px;
          border-top: 1px solid #eaeaea;
        }
        .interaction-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }
        .interaction-button {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: #6e6e6e;
          cursor: pointer;
          padding: 8px 12px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
          width: auto;
          flex: 1;
        }
        .interaction-button:hover {
          color: #3c65f5;
        }
        .interaction-button.active {
          color: #3c65f5;
        }
        .interaction-button i {
          font-size: 18px;
          margin-right: 6px;
          color: #909090;
        }
        .interaction-button:hover i {
          color: #3c65f5;
        }
        .interaction-button.active i {
          color: #3c65f5;
        }
        .interaction-text {
          margin-left: 6px;
        }
        .interaction-count {
          margin-left: 5px;
          font-size: 12px;
          color: #909090;
          background-color: #f5f5f5;
          border-radius: 10px;
          padding: 1px 6px;
          min-width: 20px;
          text-align: center;
          font-weight: 500;
        }
        .active .interaction-count {
          background-color: #e6f0ff;
          color: #3c65f5;
        }
        .dropdown-menu {
          min-width: 180px;
          border-radius: 8px;
          box-shadow: 0 5px 12px rgba(0, 0, 0, 0.12);
          border: none;
          padding: 8px 0;
        }
        .dropdown-item {
          padding: 8px 16px;
          font-size: 14px;
          color: #6e6e6e;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .dropdown-item:hover {
          background-color: #f5f7fc;
          color: #3c65f5;
        }
      `}</style>
    </div>
  );
};

export default BlogCard; 