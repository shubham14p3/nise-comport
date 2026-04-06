import { Link } from "react-router-dom";

export default function LoginOne() {
    return (
        <>
            {/*Start Login One*/}
            <section className="login-one">
                <div className="container">
                    <div className="login-one__form">
                        <div className="inner-title text-center">
                            <h2>Login Here</h2>
                        </div>
                        <form id="login-one__form" name="Login-one_form">
                            <div className="row">
                                <div className="col-xl-12">
                                    <div className="form-group">
                                        <div className="input-box">
                                            <input
                                                type="email"
                                                name="form_email"
                                                id="formEmail"
                                                placeholder="Email..."
                                                value=""
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-xl-12">
                                    <div className="form-group">
                                        <div className="input-box">
                                            <input
                                                type="text"
                                                name="form_password"
                                                id="formPassword"
                                                placeholder="Password..."
                                                value=""
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-xl-12">
                                    <div className="form-group">
                                        <button
                                            className="thm-btn"
                                            type="submit"
                                            data-loading-text="Please wait..."
                                        >
                                            Login Here
                                            <span>
                                                <i className="icon-right-arrow"></i>
                                            </span>
                                        </button>
                                    </div>
                                </div>
                                <div className="remember-forget">
                                    <div className="checked-box1">
                                        <input
                                            type="checkbox"
                                            name="saveMyInfo"
                                            id="saveinfo"
                                        />
                                        <label htmlFor="saveinfo">
                                            <span></span>
                                            Remember me
                                        </label>
                                    </div>
                                    <div className="forget">
                                        <Link to="#">Forget password?</Link>
                                    </div>
                                </div>

                                <div className="create-account text-center">
                                    <p>
                                        Not registered yet?
                                        <Link to="/sign-up">
                                            Create an Account
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
            {/*End Login One*/}
        </>
    );
}
