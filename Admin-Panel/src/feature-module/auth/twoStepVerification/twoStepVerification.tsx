import React, { useState, useEffect, useCallback } from "react";
import { all_routes } from "../../router/all_routes";
import { useNavigate } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { Link } from "react-router-dom";
import { InputOtp } from 'primereact/inputotp';
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../core/data/redux/store";
import { loginStart, loginSuccess, loginFailure, clearError } from "../../../core/data/redux/authSlice";
import axios from "axios";
import Swal from "sweetalert2";

const TwoStepVerification = () => {
  const routes = all_routes;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { verificationEmail, loading, error } = useSelector((state: RootState) => state.auth);
  const [otp, setOtp] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(600); // 10 minutes in seconds
  const [maskedEmail, setMaskedEmail] = useState<string>("");

  // Redirect to login if no verification email is set
  useEffect(() => {
    console.log("TwoStepVerification - verificationEmail:", verificationEmail);
    
    if (!verificationEmail) {
      console.log("No verification email found, redirecting to login");
      navigate(routes.login);
    } else {
      console.log("Verification email found, creating masked email");
      // Create masked email (e.g., j***@example.com)
      const parts = verificationEmail.split('@');
      if (parts.length === 2) {
        const name = parts[0];
        const domain = parts[1];
        const maskedName = name.substring(0, 1) + '*'.repeat(Math.min(name.length - 1, 3));
        setMaskedEmail(`${maskedName}@${domain}`);
      }
    }
  }, [verificationEmail, navigate, routes.login]);

  // Handle countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [countdown]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Show error if verification fails
  useEffect(() => {
    if (error) {
      Swal.fire({
        title: "Verification Failed",
        text: error,
        icon: "error",
        confirmButtonText: "Try Again"
      }).then(() => {
        dispatch(clearError());
      });
    }
  }, [error, dispatch]);

  // Verify OTP
  const verifyOtp = useCallback(async () => {
    if (!otp || otp.length < 4) {
      Swal.fire({
        title: "Invalid Code",
        text: "Please enter a valid 4-digit verification code",
        icon: "warning",
        confirmButtonText: "OK"
      });
      return;
    }

    try {
      dispatch(loginStart());

      // Call the backend API to verify OTP
      const response = await axios.post("http://localhost:5000/api/users/verify-otp", {
        email: verificationEmail,
        otp
      });

      // Check if user is admin
      if (response.data.role !== "admin") {
        dispatch(loginFailure("Access denied. Admin privileges required."));
        return;
      }

      // Successful verification
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

      Swal.fire({
        title: "Verification Successful",
        text: "Welcome to the Admin Panel",
        icon: "success",
        timer: 1500,
        showConfirmButton: false
      });
      navigate(routes.adminDashboard, { replace: true });
    } catch (error: any) {
      let errorMessage = "Verification failed";
      
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      dispatch(loginFailure(errorMessage));
    }
  }, [otp, verificationEmail, dispatch, navigate, routes.adminDashboard]);

  // Resend OTP
  const resendOtp = useCallback(async () => {
    if (!verificationEmail) return;

    try {
      const response = await axios.post("http://localhost:5000/api/users/resend-otp", {
        email: verificationEmail
      });

      // Reset the countdown
      setCountdown(600);

      Swal.fire({
        title: "Code Resent",
        text: "A new verification code has been sent to your email",
        icon: "success",
        confirmButtonText: "OK"
      });
    } catch (error: any) {
      let errorMessage = "Failed to resend verification code";
      
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  }, [verificationEmail]);

  // Go back to login
  const goBackToLogin = () => {
    navigate(routes.login);
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
                <form className="vh-100">
                  <div className="vh-100 d-flex flex-column justify-content-between p-4 pb-0">
                    <div className=" mx-auto mb-5 text-center">
                      <ImageWithBasePath
                        src="assets/logoBanner.png"
                        className="img-fluid"
                        alt="Logo"
                      />
                    </div>
                    <div className="">
                      <div className="text-center mb-3">
                        <h2 className="mb-2">2 Step Verification</h2>
                        <p className="mb-0">
                          Please enter the OTP received to confirm your account
                          ownership. A code has been sent to {maskedEmail}
                        </p>
                      </div>
                      <div className="text-center otp-input">
                        <div className="d-flex justify-content-center align-items-center mb-3">
                          <InputOtp 
                            value={otp} 
                            onChange={(e) => setOtp(e.value?.toString() || "")} 
                            integerOnly 
                            length={4}
                          />
                        </div>
                        <div>
                          <div className="badge bg-danger-transparent mb-3">
                            <p className="d-flex align-items-center ">
                              <i className="ti ti-clock me-1" />
                              {formatTime(countdown)}
                            </p>
                          </div>
                          <div className="mb-3 d-flex justify-content-center">
                            <p className="text-gray-9">
                              Didn't get the OTP?{" "}
                              <button
                                type="button"
                                onClick={resendOtp}
                                className="btn btn-link text-primary p-0"
                                disabled={countdown > 540} // Disable for first minute
                              >
                                Resend OTP
                              </button>
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <button 
                          type="button" 
                          onClick={verifyOtp} 
                          className="btn btn-primary w-100"
                          disabled={loading || !otp || otp.length < 4}
                        >
                          {loading ? 'Verifying...' : 'Verify & Proceed'}
                        </button>
                      </div>
                      <div className="text-center">
                        <button 
                          type="button" 
                          onClick={goBackToLogin} 
                          className="btn btn-link"
                        >
                          Back to Login
                        </button>
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

export default TwoStepVerification;
