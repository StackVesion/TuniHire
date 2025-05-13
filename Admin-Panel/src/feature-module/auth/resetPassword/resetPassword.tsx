import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { resetPassword } from "../../../services/authService";

const ResetPassword = () => {
  const routes = all_routes;
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract token from URL path or query parameters
  const { token: pathToken } = useParams<{ token: string }>();
  const queryParams = new URLSearchParams(location.search);
  const queryToken = queryParams.get("token");
  const token = pathToken || queryToken;
  
  // State
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", isError: false });
  
  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
    confirmPassword: false,
  });
  
  const [passwordResponse, setPasswordResponse] = useState({
    passwordResponseText: "Use 8 or more characters with a mix of letters, numbers, and symbols.",
    passwordResponseKey: "",
  });

  // Check if token exists
  useEffect(() => {
    if (!token) {
      setMessage({
        text: "Invalid or missing reset token. Please request a new password reset link.",
        isError: true
      });
    }
  }, [token]);

  const togglePasswordVisibility = (field: "password" | "confirmPassword") => {
    setPasswordVisibility((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  const onChangePassword = (password: string) => {
    setPassword(password);
    if (password.match(/^$|\s+/)) {
      setPasswordResponse({
        passwordResponseText: "Use 8 or more characters with a mix of letters, numbers & symbols",
        passwordResponseKey: "",
      });
    } else if (password.length === 0) {
      setPasswordResponse({
        passwordResponseText: "",
        passwordResponseKey: "",
      });
    } else if (password.length < 8) {
      setPasswordResponse({
        passwordResponseText: "Weak. Must contain at least 8 characters",
        passwordResponseKey: "0",
      });
    } else if (
      password.search(/[a-z]/) < 0 ||
      password.search(/[A-Z]/) < 0 ||
      password.search(/[0-9]/) < 0
    ) {
      setPasswordResponse({
        passwordResponseText: "Average. Must contain at least 1 upper case and number",
        passwordResponseKey: "1",
      });
    } else if (password.search(/(?=.*?[#?!@$%^&*-])/) < 0) {
      setPasswordResponse({
        passwordResponseText: "Almost. Must contain a special symbol",
        passwordResponseKey: "2",
      });
    } else {
      setPasswordResponse({
        passwordResponseText: "Awesome! You have a secure password.",
        passwordResponseKey: "3",
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!token) {
      setMessage({
        text: "Reset token is missing. Please request a new password reset link.",
        isError: true
      });
      return;
    }
    
    if (!password || password.length < 8) {
      setMessage({
        text: "Please enter a strong password (at least 8 characters)",
        isError: true
      });
      return;
    }
    
    if (password !== confirmPassword) {
      setMessage({
        text: "Passwords do not match",
        isError: true
      });
      return;
    }
    
    // Submit form
    setIsSubmitting(true);
    setMessage({ text: "", isError: false });
    
    try {
      const response = await resetPassword(token, password);
      
      if (response.success) {
        setMessage({ text: response.message, isError: false });
        // Redirect after successful password reset
        setTimeout(() => {
          navigate(routes.resetPasswordSuccess);
        }, 2000);
      } else {
        setMessage({ text: response.message, isError: true });
      }
    } catch (error) {
      setMessage({ text: "An unexpected error occurred", isError: true });
      console.error("Password reset error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-fuild">
      <div className="w-100 overflow-hidden position-relative flex-wrap d-block vh-100">
        <div className="row">
          <div className="col-lg-5">
            <div className="login-background position-relative d-lg-flex align-items-center justify-content-center d-none flex-wrap vh-100">
              <div className="bg-overlay-img">
                <ImageWithBasePath src="assets/img/bg/bg-01.png" className="bg-1" alt="Img" />
                <ImageWithBasePath src="assets/img/bg/bg-02.png" className="bg-2" alt="Img" />
                <ImageWithBasePath src="assets/img/bg/bg-03.png" className="bg-3" alt="Img" />
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
                <form onSubmit={handleSubmit} className="vh-100">
                  <div className="vh-100 d-flex flex-column justify-content-between p-4 pb-0">
                    <div className=" mx-auto mb-5 text-center">
                      <ImageWithBasePath
                        src="assets/img/logo.svg"
                        className="img-fluid"
                        alt="Logo"
                      />
                    </div>
                    <div className="">
                      <div className="text-center mb-3">
                        <h2 className="mb-2">Reset Password</h2>
                        <p className="mb-0">
                          Your new password must be different from previous used
                          passwords.
                        </p>
                      </div>
                      
                      {/* Display error or success message */}
                      {message.text && (
                        <div className={`alert ${message.isError ? 'alert-danger' : 'alert-success'} alert-dismissible fade show`} role="alert">
                          {message.text}
                          <button 
                            type="button" 
                            className="btn-close" 
                            data-bs-dismiss="alert" 
                            aria-label="Close"
                            onClick={() => setMessage({ text: "", isError: false })}
                          ></button>
                        </div>
                      )}
                      
                      <div>
                        <div className="input-block mb-3">
                          <div className="mb-3">
                            <label className="form-label">Password</label>
                            <div className="pass-group" id="passwordInput">
                              <input
                                type={passwordVisibility.password ? "text" : "password"}
                                value={password}
                                onChange={(e) => onChangePassword(e.target.value)}
                                className="form-control pass-input"
                                placeholder="Enter your password"
                                required
                              />
                              <span
                                className={`ti toggle-passwords ${passwordVisibility.password ? "ti-eye" : "ti-eye-off"
                                  }`}
                                onClick={() => togglePasswordVisibility("password")}
                                style={{ cursor: "pointer" }}
                              ></span>
                            </div>
                          </div>
                          <div
                            className={`password-strength d-flex ${passwordResponse.passwordResponseKey === "0"
                                ? "poor-active"
                                : passwordResponse.passwordResponseKey === "1"
                                  ? "avg-active"
                                  : passwordResponse.passwordResponseKey === "2"
                                    ? "strong-active"
                                    : passwordResponse.passwordResponseKey === "3"
                                      ? "heavy-active"
                                      : ""
                              }`}
                            id="passwordStrength"
                          >
                            <span id="poor" className="active" />
                            <span id="weak" className="active" />
                            <span id="strong" className="active" />
                            <span id="heavy" className="active" />
                          </div>
                         
                        </div>
                        <p className="fs-12">{passwordResponse.passwordResponseText}</p>
                        <div className="mb-3">
                          <label className="form-label">Confirm Password</label>
                          <div className="pass-group">
                           <input
                            type={
                              passwordVisibility.confirmPassword
                                ? "text"
                                : "password"
                            }
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pass-input form-control"
                            required
                          />
                          <span
                            className={`ti toggle-passwords ${passwordVisibility.confirmPassword
                                ? "ti-eye"
                                : "ti-eye-off"
                              }`}
                            onClick={() =>
                              togglePasswordVisibility("confirmPassword")
                            }
                          ></span>
                          </div>
                        </div>
                        <div className="mb-3">
                          <button 
                            type="submit" 
                            className="btn btn-primary w-100"
                            disabled={isSubmitting || !token}
                          >
                            {isSubmitting ? 'Processing...' : 'Reset Password'}
                          </button>
                        </div>
                        <div className="text-center">
                          <h6 className="fw-normal text-dark mb-0">
                            Remember your password?
                             <Link to={all_routes.login} className="hover-a ms-1">
                              Sign In
                            </Link>
                          </h6>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 pb-4 text-center">
                      <p className="mb-0 text-gray-9">Copyright © 2024 - Smarthr</p>
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

export default ResetPassword;
