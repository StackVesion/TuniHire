import React, { useEffect, useState, useCallback } from "react";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import { useDispatch, useSelector } from "react-redux";
import { loginStart, loginSuccess, loginFailure, clearError, setVerificationEmail } from "../../../core/data/redux/authSlice";
import axios from "axios";
import Swal from "sweetalert2";
import { RootState } from "../../../core/data/redux/store";

type PasswordField = "password";

const Login = () => {
  const routes = all_routes;
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated, loading, error, user } = useSelector((state: RootState) => state.auth);
  const from = location.state?.from?.pathname || routes.adminDashboard;

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });

  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
  });

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Redirect if already authenticated - only execute once per auth change
  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      // Use setTimeout to prevent immediate state updates causing render issues
      setTimeout(() => {
        Swal.fire({
          title: "Login Successful!",
          text: "Welcome to the Admin Panel",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
        // Use replace to avoid back button issues
        navigate(from, { replace: true });
      }, 300);
    }
  }, [isAuthenticated, user, navigate, from]);

  // Show error if authentication fails - only when error changes
  useEffect(() => {
    if (error) {
      Swal.fire({
        title: "Login Failed",
        text: error,
        icon: "error",
        confirmButtonText: "Try Again"
      }).then(() => {
        // Clear error after alert is dismissed
        dispatch(clearError());
      });
    }
  }, [error, dispatch]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value
    }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      Swal.fire({
        title: "Validation Error",
        text: "Email and password are required",
        icon: "warning",
        confirmButtonText: "OK"
      });
      return;
    }

    try {
      dispatch(loginStart());
      
      // Call the backend API
      const response = await axios.post("http://localhost:5000/api/users/signinn", {
        email: formData.email,
        password: formData.password
      });

      console.log("Login API response:", response.data);

      // Check if OTP verification is required - this should be true from the backend
      if (response.data.requiresOtp) {
        console.log("OTP required, redirecting to verification page");
        dispatch(clearError()); // Clear any previous errors
        dispatch(setVerificationEmail(formData.email)); // Store email for verification
        
        Swal.fire({
          title: "Verification Required",
          text: "A verification code has been sent to your email",
          icon: "info",
          confirmButtonText: "Continue"
        }).then(() => {
          // Force navigation to two-step verification
          navigate(routes.twoStepVerification, { replace: true });
        });
        return;
      } else {
        console.log("No OTP required in response, but two-step verification is mandatory");
        // Force two-step verification anyway if backend doesn't set the flag correctly
        dispatch(setVerificationEmail(formData.email));
        navigate(routes.twoStepVerification, { replace: true });
        return;
      }

      // This code should never be reached if two-step verification is working properly
      // Check if user is admin
      if (response.data.role !== "admin") {
        dispatch(loginFailure("Access denied. Admin privileges required."));
        return;
      }

      // Successful login (this would only happen if OTP is not required)
      dispatch(loginSuccess({
        token: response.data.token,
        user: {
          id: response.data.userId,
          email: response.data.email,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          role: response.data.role
        }
      }));
    } catch (error: any) {
      let errorMessage = "Authentication failed";
      
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      dispatch(loginFailure(errorMessage));
    }
  }, [formData.email, formData.password, dispatch, navigate, routes.twoStepVerification]);

  const handleGoogleLogin = useCallback(async () => {
    try {
      dispatch(loginStart());
      
      // Redirect to Google OAuth (this is just a placeholder - you'll need to implement Google OAuth)
      window.location.href = "http://localhost:5000/api/auth/google";
    } catch (error: any) {
      dispatch(loginFailure("Google authentication failed"));
    }
  }, [dispatch]);

  const togglePasswordVisibility = useCallback((field: PasswordField) => {
    setPasswordVisibility((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  }, []);

  return (
    <div className="container-fuild">
      <div className="w-100 overflow-hidden position-relative flex-wrap d-block vh-100">
        <div className="row">
          <div className="col-lg-5">
            <div className="login-background position-relative d-lg-flex align-items-center justify-content-center d-none flex-wrap vh-100">
              <div className="bg-overlay-img">
                <ImageWithBasePath src="assets/img/bg/bg-01.png" className="bg-1" alt="Img" />
                <ImageWithBasePath src="assets/img/bg/bg-02.png" className="bg-2" alt="Img" />
                </div>
              <div className="authentication-card w-100">
                <div className="authen-overlay-item border w-100">
                  <h1 className="text-white display-1">
                    Empowering people <br /> through seamless HR <br /> management.
                  </h1>
                  <div className="my-4 mx-auto authen-overlay-img">
                    <ImageWithBasePath src="assets/img/bg/authentication-bg-01.png" alt="Img" />
                  </div>
                  <div>
                    <p className="text-white fs-20 fw-semibold text-center">
                      Efficiently manage your workforce, streamline <br />{" "}
                      operations effortlessly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-7 col-md-12 col-sm-12">
            <div className="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap">
              <div className="col-md-7 mx-auto vh-100">
                <form className="vh-100" onSubmit={handleSubmit}>
                  <div className="vh-100 d-flex flex-column justify-content-between p-4 pb-0">
                    <div className="mx-auto mb-5 text-center">
                      <div style={{ maxWidth: '300px', margin: '0 auto' }}>
                        <h1 className="display-4 text-primary fw-bold">TuniHire</h1>
                        <p className="text-muted">Your contract is here!</p>
                      </div>
                    </div>
                    <div className="">
                      <div className="text-center mb-3">
                        <h2 className="mb-2">Admin Sign In</h2>
                        <p className="mb-0">Please enter your details to sign in</p>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Email Address</label>
                        <div className="input-group">
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="form-control border-end-0"
                            required
                          />
                          <span className="input-group-text border-start-0">
                            <i className="ti ti-mail" />
                          </span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Password</label>
                        <div className="pass-group">
                        <input
                            type={
                              passwordVisibility.password
                                ? "text"
                                : "password"
                            }
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="pass-input form-control"
                            required
                          />
                          <span
                            className={`ti toggle-passwords ${passwordVisibility.password
                              ? "ti-eye"
                              : "ti-eye-off"
                              }`}
                            onClick={() =>
                              togglePasswordVisibility("password")
                            }
                          ></span>
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center">
                          <div className="form-check form-check-md mb-0">
                            <input
                              className="form-check-input"
                              id="remember_me"
                              type="checkbox"
                              name="rememberMe"
                              checked={formData.rememberMe}
                              onChange={handleInputChange}
                            />
                            <label
                              htmlFor="remember_me"
                              className="form-check-label mt-0"
                            >
                              Remember Me
                            </label>
                          </div>
                        </div>
                        <div className="text-end">
                          <Link to={all_routes.forgotPassword} className="link-danger">
                            Forgot Password?
                          </Link>
                        </div>
                      </div>
                      <div className="mb-3">
                      <button
                          type="submit"
                          className="btn btn-primary w-100"
                          disabled={loading}
                        >
                          {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                      </div>
                      
                      <div className="login-or">
                        <span className="span-or">Or</span>
                      </div>
                      <div className="mt-2">
                        <div className="d-flex align-items-center justify-content-center flex-wrap">
                          
                          <div className="text-center me-2 flex-fill">
                            <button
                              type="button"
                              onClick={handleGoogleLogin}
                              className="br-10 p-2 btn btn-outline-light border d-flex align-items-center justify-content-center"
                              disabled={loading}
                            >
                              <ImageWithBasePath
                                className="img-fluid m-1"
                                src="assets/img/icons/google-logo.svg"
                                alt="Google"
                              />
                            </button>
                          </div>
                          
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 pb-4 text-center">
                      <p className="mb-0 text-gray-9">Copyright 2024 - TuniHire</p>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
