import React, { useState, useEffect } from "react";

import { Link, useNavigate, useLocation } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import axios from "axios";
import Swal from "sweetalert2";

type PasswordField = "password";


const ResetPassword = () => {
  const routes = all_routes;
  const navigate = useNavigate();
  const location = useLocation();

  const [token, setToken] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const [resetSuccess, setResetSuccess] = useState(false);

  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
    confirmPassword: false,
  });

  const [password, setPassword] = useState("");  const [passwordResponce, setPasswordResponce] = useState({
    passwordResponceText: "Utilisez 8 caractères ou plus avec des lettres, des chiffres et des symboles.",
    passwordResponceKey: "",
  });
  const [message, setMessage] = useState({ text: "", isError: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Get token from URL query parameters (e.g., ?token=abc123)
    const queryParams = new URLSearchParams(location.search);
    const tokenParam = queryParams.get("token");
    
    if (tokenParam) {
      setToken(tokenParam);
      // Vérifier la validité du token
      verifyToken(tokenParam);
    } else {
      setTokenValid(false);
    }
  }, [location]);

  const verifyToken = async (token: string) => {
    try {
      console.log('Vérification du token:', token);
      // Appel à l'API pour vérifier si le token est valide
      const response = await axios.get(`http://localhost:5000/api/users/verify-reset-token?token=${token}`);
      console.log('Réponse de vérification du token:', response.data);
      
      if (response.data.valid) {
        setTokenValid(true);
        console.log('Token valide');
      } else {
        console.log('Token invalide selon la réponse du serveur');
        setTokenValid(false);
        
        Swal.fire({
          title: "Lien expiré",
          text: "Le lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.",
          icon: "error",
          confirmButtonText: "OK"
        });
      }
    } catch (error: any) {
      console.error('Erreur lors de la vérification du token:', error);
      setTokenValid(false);
      
      Swal.fire({
        title: "Lien expiré",
        text: "Le lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.",
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  };


  const togglePasswordVisibility = (field: "password" | "confirmPassword") => {
    setPasswordVisibility((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };


  const onChangePassword = (password: string) => {
    setPassword(password);
    if (password.match(/^$|\s+/)) {
      setPasswordResponce({
        passwordResponceText: "Utilisez 8 caractères ou plus avec des lettres, des chiffres et des symboles",
        passwordResponceKey: "",
      });
    } else if (password.length === 0) {
      setPasswordResponce({
        passwordResponceText: "",
        passwordResponceKey: "",
      });
    } else if (password.length < 8) {
      setPasswordResponce({
        passwordResponceText: "Faible. Doit contenir au moins 8 caractères",
        passwordResponceKey: "0",
      });
    } else if (
      password.search(/[a-z]/) < 0 ||
      password.search(/[A-Z]/) < 0 ||
      password.search(/[0-9]/) < 0
    ) {
      setPasswordResponce({
        passwordResponceText: "Moyen. Doit contenir au moins 1 majuscule et 1 chiffre",
        passwordResponceKey: "1",
      });
    } else if (password.search(/(?=.*?[#?!@$%^&*-])/) < 0) {
      setPasswordResponce({
        passwordResponceText: "Presque. Doit contenir un symbole spécial",
        passwordResponceKey: "2",
      });
    } else {
      setPasswordResponce({
        passwordResponceText: "Excellent! Votre mot de passe est sécurisé.",
        passwordResponceKey: "3",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!password) {
      Swal.fire({
        title: "Erreur",
        text: "Veuillez entrer un nouveau mot de passe",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }
    
    if (password !== confirmPassword) {
      Swal.fire({
        title: "Erreur",
        text: "Les mots de passe ne correspondent pas",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }
    
    if (password.length < 8) {
      Swal.fire({
        title: "Erreur",
        text: "Le mot de passe doit contenir au moins 8 caractères",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }
    
    if (!token) {
      Swal.fire({
        title: "Erreur",
        text: "Le token de réinitialisation est manquant. Veuillez utiliser le lien de l'email.",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }
    
    try {
      setLoading(true);
      console.log('Envoi de la demande de réinitialisation avec token:', token);
      
      // Send reset request to server
      const response = await axios.post("http://localhost:5000/api/users/reset-password", {
        token: token,
        newPassword: password
      });
      
      console.log('Réponse de réinitialisation:', response.data);
      
      // Set reset success
      setResetSuccess(true);
      
      // Show success message
      Swal.fire({
        title: "Succès!",
        text: "Votre mot de passe a été réinitialisé avec succès",
        icon: "success",
        confirmButtonText: "OK"
      }).then(() => {
        // Navigate to login
        navigate(routes.login);
      });
      
    } catch (error: any) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      let errorMessage = "Échec de la réinitialisation du mot de passe";
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      Swal.fire({
        title: "Erreur",
        text: errorMessage,
        icon: "error",
        confirmButtonText: "Réessayer"
      });
    } finally {
      setLoading(false);
    }
  };

  const InvalidTokenView = () => {
    const handleRequestNewLink = () => {
      navigate(routes.forgotPassword);
    };

    return (
      <div className="text-center">
        <div className="mb-4">
          <img src="/assets/img/icons/error-icon.svg" alt="Error" width="100" />
        </div>
        <h3 className="mb-3">Lien invalide ou expiré</h3>
        <p className="mb-4">Le lien de réinitialisation que vous avez utilisé est invalide ou a expiré.</p>
        <p className="mb-2">Raisons possibles :</p>
        <ul className="list-unstyled mb-4">
          <li>• Le lien a déjà été utilisé</li>
          <li>• Le délai d'une heure est écoulé</li>
          <li>• Le token est incorrect</li>
        </ul>
        <button 
          onClick={handleRequestNewLink} 
          className="btn btn-primary"
        >
          Demander un nouveau lien
        </button>
      </div>
    );
  };

  const SuccessView = () => {
    return (
      <div className="text-center">
        <div className="mb-4">
          <img src="/assets/img/icons/check-circle.svg" alt="Success" width="100" />
        </div>
        <h3 className="mb-3">Mot de passe réinitialisé avec succès!</h3>
        <p className="mb-4">Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
        <button 
          onClick={() => navigate(routes.login)} 
          className="btn btn-primary"
        >
          Se connecter
        </button>
      </div>
    );
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
                        src="assets/logoBanner.png"
                        className="img-fluid"
                        alt="Logo"
                      />
                    </div>
                    <div className="">

                      {resetSuccess ? (
                        <SuccessView />
                      ) : !tokenValid ? (
                        <InvalidTokenView />
                      ) : (
                        <>
                          <div className="text-center mb-3">
                            <h2 className="mb-2">Réinitialiser le mot de passe</h2>
                            <p className="mb-0">
                              Votre nouveau mot de passe doit être différent des mots de passe précédents.
                            </p>
                          </div>
                          <div>
                            <div className="input-block mb-3">
                              <div className="mb-3">
                                <label className="form-label">Nouveau mot de passe</label>
                                <div className="pass-group" id="passwordInput">
                                  <input
                                    type={passwordVisibility.password ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => onChangePassword(e.target.value)}
                                    className="form-control pass-input"
                                    placeholder="Entrez votre mot de passe"
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
                                className={`password-strength d-flex ${passwordResponce.passwordResponceKey === "0"
                                    ? "poor-active"
                                    : passwordResponce.passwordResponceKey === "1"
                                      ? "avg-active"
                                      : passwordResponce.passwordResponceKey === "2"
                                        ? "strong-active"
                                        : passwordResponce.passwordResponceKey === "3"
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
                            <p className="fs-12">{passwordResponce.passwordResponceText}</p>
                            <div className="mb-3">
                              <label className="form-label">Confirmer le mot de passe</label>
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
                                placeholder="Confirmez votre mot de passe"

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
                              <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                                {loading ? "Réinitialisation en cours..." : "Réinitialiser le mot de passe"}
                              </button>
                            </div>
                            <div className="text-center">
                              <h6 className="fw-normal text-dark mb-0">
                                Vous vous souvenez de votre mot de passe?
                                <Link to={routes.login} className="hover-a ms-1">
                                  Se connecter
                                </Link>
                              </h6>
                            </div>
                          </div>

                        </>
                      )}

                    </div>
                    <div className="mt-5 pb-4 text-center">
                      <p className="mb-0 text-gray-9">Copyright © 2024 - TuniHire</p>
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
