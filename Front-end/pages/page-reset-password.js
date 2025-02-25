/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
import Layout from "../components/Layout/Layout";
import Link from "next/link";

export default function Reset() {
    return (
        <>
            <Layout>
                <section className="pt-100 login-register">
                    <div className="container">
                        <div className="row login-register-cover">
                            <div className="col-lg-4 col-md-6 col-sm-12 mx-auto">
                                <div className="text-center">
                                    <p className="font-sm text-brand-2">Forgot Password</p>
                                    <h2 className="mt-10 mb-5 text-brand-1">Reset Your Password</h2>
                                    <p className="font-sm text-muted mb-30">Enter email address associated with your account and we'll send you a link to reset your password</p>
                                </div>
                                <form className="login-register text-start mt-20">
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="input-1">
                                            Email address *
                                        </label>
                                        <input className="form-control" id="input-1" type="text" required name="emaill" placeholder="stevenjob@gmail.com" />
                                    </div>
                                    <div className="form-group">
                                        <button className="btn btn-brand-1 hover-up w-100" type="submit" name="continue">
                                            Continue
                                        </button>
                                    </div>
                                    <div className="text-muted text-center">
                                        Don't have an Account?
                                        <Link legacyBehavior href="/page-signin">
                                            <a>Sign up</a>
                                        </Link>
                                    </div>
                                </form>
                            </div>
                            <div className="img-1 d-none d-lg-block">
                                <img className="shape-1" src="assets/imgs/page/login-register/img-5.svg" alt="JobBox" />
                            </div>
                            <div className="img-2">
                                <img src="assets/imgs/page/login-register/img-3.svg" alt="JobBox" />
                            </div>
                        </div>
                    </div>
                </section>
            </Layout>
        </>
    );
}
