import Layout from "@/components/layout/Layout"
import Link from "next/link"

export default function Home() {
    return (
        <>
            <Layout breadcrumbTitle="Authentication" breadcrumbActive="Authentication">
                <div className="row">
                    <div className="col-lg-12">
                        <div className="section-box">
                        <div className="container">
                            <div className="panel-white mb-30">
                            <div className="box-padding">
                                <div className="login-register">
                                <div className="row login-register-cover pb-250">
                                    <div className="col-lg-4 col-md-6 col-sm-12 mx-auto">
                                    <div className="form-login-cover">
                                        <div className="text-center">
                                        <img
                                            src="assets/imgs/page/login-register/img-6.svg"
                                            alt="JobBox"
                                        />
                                        <h2 className="mt-10 mb-5 text-brand-1">
                                            Protected Content
                                        </h2>
                                        <p className="font-sm text-muted mb-30">
                                            This content is password protected. <br />
                                            To view it please enter your password below
                                        </p>
                                        </div>
                                        <form
                                        className="login-register text-start mt-20"
                                        action="#"
                                        >
                                        <div className="form-group">
                                            <label className="form-label" htmlFor="input-1">
                                            Your Password *
                                            </label>
                                            <input
                                            className="form-control"
                                            id="input-1"
                                            type="password"
                                            required=""
                                            name="password"
                                            placeholder="************"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <button
                                            className="btn btn-brand-1 hover-up w-100"
                                            type="submit"
                                            name="login"
                                            >
                                            Submit
                                            </button>
                                        </div>
                                        <div className="text-muted text-center">
                                            Don't Have Passoword?
                                            <Link href="#"> Contact Us</Link>
                                        </div>
                                        </form>
                                    </div>
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
    )
}