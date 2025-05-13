import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import axios from "axios";
import Swal from "sweetalert2";

const ForgotPassword = () => {
  const routes = all_routes;
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      Swal.fire({
        title: "Erreur",
        text: "Veuillez entrer votre adresse email",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Send request to the server
      const response = await axios.post("http://localhost:5000/api/users/forgot-password", {
        email: email
      });
      
      // Set email sent state to true
      setEmailSent(true);
      
      // Show success message
      Swal.fire({
        title: "Email envoyé !",
        text: "Les instructions pour réinitialiser votre mot de passe ont été envoyées à votre adresse email. Veuillez vérifier votre boîte de réception et vos spams.",
        icon: "success",
        confirmButtonText: "OK"
      });
      
    } catch (error: any) {
      let errorMessage = "Impossible d'envoyer l'email de réinitialisation";
      
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
                <form className="vh-100" onSubmit={handleSubmit}>
                  <div className="vh-100 d-flex flex-column justify-content-between p-4 pb-0">
                    <div className=" mx-auto mb-5 text-center">
                      <ImageWithBasePath
                        src="assets/logoBanner.png"
                        className="img-fluid"
                        alt="Logo"
                      />
                    </div>
                    <div className="">
                      {emailSent ? (
                        <div className="alert alert-success text-center">
                          <h2 className="mb-2">Email Envoyé!</h2>
                          <p className="mb-4">
                            Nous avons envoyé un email à <strong>{email}</strong> avec les instructions pour réinitialiser votre mot de passe.
                          </p>
                          <p className="mb-4">
                            Veuillez vérifier votre boîte de réception et suivre les instructions dans l'email.
                          </p>
                          <div className="mt-4">
                            <Link to={all_routes.login} className="btn btn-outline-primary">
                              Retour à la connexion
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="text-center mb-3">
                            <h2 className="mb-2">Mot de passe oublié?</h2>
                            <p className="mb-0">
                              Entrez votre adresse email et nous vous enverrons un lien
                              pour réinitialiser votre mot de passe.
                            </p>
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Adresse Email</label>
                            <div className="input-group">
                              <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-control border-end-0"
                                required
                              />
                              <span className="input-group-text border-start-0">
                                <i className="ti ti-mail" />
                              </span>
                            </div>
                          </div>
                          <div className="mb-3">
                            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                              {loading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
                            </button>
                          </div>
                          <div className="text-center">
                            <h6 className="fw-normal text-dark mb-0">
                              Retour à la
                              <Link to={all_routes.login} className="hover-a ms-1">
                                Connexion
                              </Link>
                            </h6>
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

export default ForgotPassword;
