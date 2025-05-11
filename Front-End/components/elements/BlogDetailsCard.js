import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';

// Backend API URL
const API_URL = 'http://localhost:5000/api';

const BlogDetailsCard = ({ blog, user, refreshBlog }) => {
  const [commentContent, setCommentContent] = useState('');
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [allCommentsVisible, setAllCommentsVisible] = useState(false);
  const [allReviewsVisible, setAllReviewsVisible] = useState(false);
  const router = useRouter();

  // Check if the user has already reviewed the blog
  useEffect(() => {
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

    if (isLiking) return;

    try {
      setIsLiking(true);
      await axios.post(`${API_URL}/blogs/${blog._id}/like`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      refreshBlog();
      toast.success(userHasLiked ? 'Vous n\'aimez plus ce post' : 'Vous aimez ce post');
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
      refreshBlog();
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
      refreshBlog();
      toast.success('Commentaire ajouté avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
      toast.error('Erreur lors de l\'ajout du commentaire');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Veuillez vous connecter pour donner votre avis');
      router.push('/page-login');
      return;
    }

    if (rating < 1 || rating > 5) {
      toast.error('Veuillez sélectionner une note entre 1 et 5 étoiles');
      return;
    }

    try {
      await axios.post(`${API_URL}/blogs/${blog._id}/review`, {
        rating,
        comment: reviewComment
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      refreshBlog();
      toast.success('Avis ajouté avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'avis:', error);
      toast.error('Erreur lors de l\'ajout de l\'avis');
    }
  };

  // Calculate average rating
  const averageRating = blog?.reviews && blog.reviews.length > 0
    ? (blog.reviews.reduce((sum, review) => sum + review.rating, 0) / blog.reviews.length).toFixed(1)
    : 0;

  const reviewCount = blog?.reviews?.length || 0;
  const userHasLiked = user && blog?.likes && blog.likes.some(like => like._id === user._id);
  
  // For displaying limited comments/reviews initially
  const visibleComments = allCommentsVisible ? blog?.comments : blog?.comments?.slice(0, 3);
  const visibleReviews = allReviewsVisible ? blog?.reviews : blog?.reviews?.slice(0, 3);

  // Rating distribution data
  const getRatingDistribution = () => {
    if (!blog?.reviews || blog.reviews.length === 0) return [];
    
    const distribution = [0, 0, 0, 0, 0]; // 5 stars, 4 stars, 3 stars, 2 stars, 1 star
    
    blog.reviews.forEach(review => {
      distribution[5 - review.rating]++;
    });
    
    return distribution.map((count, index) => {
      const stars = 5 - index;
      const percentage = (count / blog.reviews.length) * 100;
      return { stars, count, percentage };
    });
  };
  
  const ratingDistribution = getRatingDistribution();

  if (!blog) return <div>Chargement...</div>;

  return (
    <div className="single-body">
      <div className="max-width-single">
        <div className="font-lg mb-30">
          <p>{blog.content}</p>
        </div>
      </div>
      
      {/* Social interaction section */}
      <div className="social-interaction mt-50 mb-40 pt-30 pb-30 border-top border-bottom">
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
          
          <a href="#comments" className="interaction-button">
            <i className="fa fa-comment-o"></i>
            <span className="interaction-text">Comment</span>
            {blog.comments?.length > 0 && (
              <span className="interaction-count">{blog.comments?.length}</span>
            )}
          </a>
          
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
          
          <a href="#reviews" className="interaction-button">
            <i className="fa fa-star"></i>
            <span className="interaction-text">Rate</span>
            {blog.reviews?.length > 0 && (
              <span className="interaction-count">{blog.reviews?.length}</span>
            )}
          </a>
        </div>
      </div>

      {/* Tags section */}
      <div className="single-apply-jobs mt-20 mb-50">
        <div className="row">
          <div className="col-lg-7">
            {blog.tags?.map((tag, index) => (
              <Link legacyBehavior key={index} href={`/blog-grid?tag=${tag}`}>
                <a className="btn btn-border-3 mr-10 hover-up">#{tag}</a>
              </Link>
            ))}
          </div>
          <div className="col-md-5 text-lg-end">
            <span className="font-xs color-text-paragraph-2">
              <i className="fa fa-eye mr-5"></i> {blog.viewCount} vues
            </span>
          </div>
        </div>
      </div>
      
      {/* Reviews section - Enhanced with ratings distribution */}
      <div id="reviews" className="reviews-section mb-50">
        <div className="section-title-with-line mb-20">
          <h3>Avis et évaluations ({blog.reviews?.length || 0})</h3>
          <div className="line"></div>
        </div>
        
        {/* Rating summary */}
        <div className="rating-summary bg-light p-4 rounded mb-40">
          <div className="row">
            <div className="col-lg-4 col-md-5 mb-md-0 mb-4">
              <div className="text-center">
                <div className="rating-large mb-10">
                  {averageRating > 0 ? (
                    <div>
                      <span className="font-xl font-bold color-brand-1">{averageRating}</span>
                      <span className="font-lg color-text-paragraph-2">/5</span>
                    </div>
                  ) : (
                    <span className="font-md color-text-paragraph-2">Aucun avis</span>
                  )}
                </div>
                {averageRating > 0 && (
                  <div className="rating-stars mb-10">
                    {[1, 2, 3, 4, 5].map(star => (
                      <i key={star} className={`fa fa-star fa-lg ${star <= Math.round(averageRating) ? 'text-warning' : 'text-muted'}`}></i>
                    ))}
                  </div>
                )}
                <div className="review-count font-sm">
                  {reviewCount === 0 
                    ? "Aucun avis" 
                    : reviewCount === 1 
                      ? "1 avis" 
                      : `${reviewCount} avis`}
                </div>
              </div>
            </div>
            {reviewCount > 0 && (
              <div className="col-lg-8 col-md-7">
                <div className="rating-distribution">
                  {ratingDistribution.map((item) => (
                    <div key={item.stars} className="rating-bar-row mb-10 d-flex align-items-center">
                      <div className="rating-label mr-15" style={{width: '60px'}}>
                        <span className="font-sm">{item.stars} étoiles</span>
                      </div>
                      <div className="progress flex-grow-1" style={{height: '8px'}}>
                        <div 
                          className="progress-bar bg-warning" 
                          role="progressbar" 
                          style={{width: `${item.percentage}%`}} 
                          aria-valuenow={item.percentage} 
                          aria-valuemin="0" 
                          aria-valuemax="100"
                        ></div>
                      </div>
                      <div className="rating-count ml-15" style={{width: '30px'}}>
                        <span className="font-sm">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Reviews list */}
        {blog.reviews && blog.reviews.length > 0 ? (
          <div className="reviews-list mt-30">
            {visibleReviews.map((review, index) => (
              <div key={index} className="review-item">
                <div className="review-header">
                  <div className="user-info">
                    <Link legacyBehavior href={`/candidate-profile?id=${review.user?._id}`}>
                      <a>
                        <img className="avatar" src={review.user?.profilePicture || "assets/imgs/page/candidates/user5.png"} alt="user" />
                      </a>
                    </Link>
                    <div className="author-info">
                      <h6 className="author-name">{review.user?.firstName} {review.user?.lastName}</h6>
                      <p className="review-date">{formatDate(review.createdAt)}</p>
                    </div>
                  </div>
                  <div className="rating">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} className={`star-icon ${star <= review.rating ? 'filled' : 'empty'}`}>★</span>
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <div className="review-content">
                    <p className="review-text">{review.comment}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-reviews text-center">
            <div className="empty-reviews-icon mb-3">
              <i className="fa fa-star-o fa-3x text-muted"></i>
            </div>
            <h5 className="mb-3">Be the first to review!</h5>
            <p className="font-md color-text-paragraph mb-4">Your opinion matters and helps others discover this content.</p>
            
            <div className="quick-rating-stars mb-4">
              <div className="d-flex justify-content-center">
                {[1, 2, 3, 4, 5].map(star => (
                  <span 
                    key={star} 
                    className={`star-icon quick-star ${star <= rating ? 'filled' : 'empty'}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={(e) => {
                      // Preview effect on hover
                      const stars = e.currentTarget.parentNode.querySelectorAll('.star-icon');
                      for (let i = 0; i < stars.length; i++) {
                        if (i < star) {
                          stars[i].classList.add('hover');
                        } else {
                          stars[i].classList.remove('hover');
                        }
                      }
                    }}
                    onMouseLeave={(e) => {
                      // Reset preview
                      const stars = e.currentTarget.parentNode.querySelectorAll('.star-icon');
                      for (let i = 0; i < stars.length; i++) {
                        stars[i].classList.remove('hover');
                      }
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
              {rating > 0 && (
                <div className="mt-3 text-center">
                  <span className="rating-label font-md">
                    {rating === 1 && 'Poor'}
                    {rating === 2 && 'Fair'}
                    {rating === 3 && 'Average'}
                    {rating === 4 && 'Good'}
                    {rating === 5 && 'Excellent!'}
                  </span>
                </div>
              )}
            </div>
            
            {rating > 0 && (
              <div className="quick-review-form mb-3">
                <textarea 
                  className="form-control mb-3" 
                  placeholder="Share your experience... (optional)" 
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows="3"
                ></textarea>
                <button 
                  className="btn btn-primary"
                  onClick={handleReviewSubmit}
                  disabled={isLiking}
                >
                  Post review
                </button>
              </div>
            )}
          </div>
        )}

        {/* Show more reviews button */}
        {blog.reviews && blog.reviews.length > 3 && !allReviewsVisible && (
          <div className="text-center mt-30">
            <button 
              className="btn btn-outline-primary" 
              onClick={() => setAllReviewsVisible(true)}
            >
              View all reviews ({blog.reviews.length})
            </button>
          </div>
        )}

        <div className="border-bottom mt-40 mb-40" />
        
        {/* Leave a review form */}
        <div className="mt-30">
          <h4>Give your review</h4>
          <form onSubmit={handleReviewSubmit} className="form-review mt-30">
            <div className="form-group mb-20">
              <label className="mb-10 font-md">Your rating</label>
              
              <div className="star-rating-container py-4">
                {/* Star rating display */}
                <div className="star-rating-display text-center my-3">
                  <div className="d-inline-block star-container">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span 
                        key={star} 
                        className={`star-icon ${star <= rating ? 'filled' : 'empty'}`} 
                        onClick={() => setRating(star)}
                        onMouseEnter={(e) => {
                          // Preview effect on hover
                          const stars = e.currentTarget.parentNode.querySelectorAll('.star-icon');
                          for (let i = 0; i < stars.length; i++) {
                            if (i < star) {
                              stars[i].classList.add('hover');
                            } else {
                              stars[i].classList.remove('hover');
                            }
                          }
                        }}
                        onMouseLeave={(e) => {
                          // Reset preview
                          const stars = e.currentTarget.parentNode.querySelectorAll('.star-icon');
                          for (let i = 0; i < stars.length; i++) {
                            stars[i].classList.remove('hover');
                          }
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Rating label display */}
                <div className="rating-value text-center mt-2 mb-3">
                  {rating > 0 && (
                    <span className="selected-rating font-md">
                      {rating === 1 && 'Poor'}
                      {rating === 2 && 'Fair'}
                      {rating === 3 && 'Average'}
                      {rating === 4 && 'Good'}
                      {rating === 5 && 'Excellent'}
                      <span className="text-muted ml-2">({rating}/5)</span>
                    </span>
                  )}
                </div>
                
                {rating === 0 && (
                  <div className="rating-error text-center mt-2">
                    <p className="text-danger">
                      Please select a rating between 1 and 5 stars
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="form-group mb-20">
              <textarea 
                className="input-comment" 
                placeholder="Your review (optional)" 
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
            </div>
            <div className="text-end">
              <button className="btn btn-primary font-bold" disabled={rating === 0}>Submit</button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Comments section */}
      <div id="comments" className="comments-section mt-50">
        <div className="section-title-with-line mb-20">
          <h3>Comments ({blog.comments?.length || 0})</h3>
          <div className="line"></div>
        </div>
        
        {blog.comments && blog.comments.length > 0 ? (
          <div className="comments-container">
            <ul className="list-comments mt-30">
              {visibleComments.map((comment, index) => (
                <li key={index} className="comment-item">
                  <div className="author-info-container">
                    <div className="author-image-container">
                      <Link legacyBehavior href={`/candidate-profile?id=${comment.user?._id}`}>
                        <a>
                          <img className="avatar" src={comment.user?.profilePicture || "assets/imgs/page/candidates/user5.png"} alt="user" />
                        </a>
                      </Link>
                      <div className="author-info">
                        <h6 className="author-name">{comment.user?.firstName} {comment.user?.lastName}</h6>
                        <p className="comment-date">{formatDate(comment.createdAt)}</p>
                      </div>
                    </div>
                    <div className="comment-content">
                      <p className="comment-text">{comment.content}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            
            {/* Show more comments button */}
            {blog.comments && blog.comments.length > 3 && !allCommentsVisible && (
              <div className="text-center mt-30">
                <button 
                  className="btn btn-outline-primary" 
                  onClick={() => setAllCommentsVisible(true)}
                >
                  View all comments ({blog.comments.length})
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="no-comments text-center">
            <i className="fa fa-comments-o fa-3x text-muted mb-3"></i>
            <p className="mt-20 font-md color-text-paragraph">No comments yet. Be the first to comment!</p>
          </div>
        )}
        
        <div className="border-bottom mt-50 mb-50" />
        
        {/* Leave a comment form */}
        <div className="mt-30">
          <h3>Leave a comment</h3>
          <div className="form-comment mt-20">
            <form onSubmit={handleCommentSubmit} className="comment-form">
              <div className="form-group">
                <textarea 
                  className="input-comment" 
                  placeholder="Write a comment" 
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                />
              </div>
              <div className="row">
                <div className="col-lg-12 text-end">
                  <button className="btn btn-primary font-bold">Post</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Custom CSS for section titles and animations */}
      <style jsx>{`
        .section-title-with-line {
          position: relative;
          display: flex;
          align-items: center;
        }
        .section-title-with-line h3 {
          margin-right: 15px;
          margin-bottom: 0;
        }
        .section-title-with-line .line {
          flex-grow: 1;
          height: 1px;
          background-color: #e9e9e9;
        }
        .author-info {
          margin-left: 15px;
        }
        .star-rating-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #f8f9fa;
          border-radius: 8px;
        }
        .star-icon {
          display: inline-block;
          font-size: 40px;
          margin: 0 15px;
          cursor: pointer;
          transition: transform 0.2s ease, color 0.2s ease;
          user-select: none;
        }
        .star-icon.empty {
          color: #d1d1d1;
        }
        .star-icon.filled, .star-icon.hover {
          color: #ffc107;
        }
        .star-icon:hover {
          transform: scale(1.2);
        }
        .selected-rating {
          color: #0d6efd;
          font-weight: bold;
        }
        .ml-2 {
          margin-left: 0.5rem;
        }
        
        /* Comment Styles */
        .comment-item {
          margin-bottom: 25px;
          list-style: none;
        }
        .author-info-container {
          padding: 20px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .author-image-container {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
        }
        .avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          object-fit: cover;
        }
        .author-info {
          margin-left: 15px;
        }
        .author-name {
          margin: 0;
          font-weight: 600;
          color: #333;
        }
        .comment-date {
          margin: 0;
          font-size: 12px;
          color: #777;
        }
        .comment-content {
          padding-left: 65px;
        }
        .comment-text {
          margin: 0;
          line-height: 1.6;
          color: #333;
        }
        .no-comments {
          padding: 30px 0;
        }
        .comment-form {
          padding: 20px 0;
          border-radius: 0;
          background: transparent;
        }
        .input-comment {
          width: 100%;
          padding: 15px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background-color: #fff;
          resize: vertical;
          min-height: 120px;
          transition: border-color 0.2s;
        }
        .input-comment:focus {
          border-color: #0d6efd;
          outline: none;
        }
        
        /* Review Styles */
        .review-item {
          padding: 20px 0;
          border-bottom: 1px solid #f0f0f0;
          margin-bottom: 15px;
        }
        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }
        .user-info {
          display: flex;
          align-items: center;
        }
        .review-date {
          margin: 0;
          font-size: 12px;
          color: #777;
        }
        .review-content {
          padding-left: 65px;
        }
        .review-text {
          margin: 0;
          line-height: 1.6;
          color: #333;
        }
        .no-reviews {
          padding: 30px 0;
        }
        .form-review {
          padding: 20px 0;
          border-radius: 0;
          background: transparent;
        }
        .rating .star-icon {
          font-size: 18px;
          margin: 0 2px;
          cursor: default;
        }
        .pulse {
          animation: pulse 0.3s ease-in-out;
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .quick-star {
          font-size: 30px;
          margin: 0 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .quick-star:hover {
          transform: scale(1.2);
        }
        
        /* Social Interaction Styles */
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
          text-decoration: none;
        }
        .interaction-button:hover {
          color: #3c65f5;
          text-decoration: none;
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
      `}</style>
    </div>
  );
};

export default BlogDetailsCard; 