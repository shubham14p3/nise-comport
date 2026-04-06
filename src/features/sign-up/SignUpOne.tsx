import { Link } from "react-router-dom";
import IconGoogle2 from "@/assets/images/icon/icon-google-2.png";
import IconFacebook from "@/assets/images/icon/icon-facebook.png";

export default function SignUpOne() {
    return (
        <>
            {/*Start Sign Up One*/}
            <section className="sign-up-one">
                <div className="container">
                    <div className="sign-up-one__form">
                        <div className="inner-title text-center">
                            <h2>Sing Up</h2>
                        </div>
                        <form id="sign-up-one__form" name="sign-up-one_form">
                            <div className="row">
                                <div className="col-xl-12">
                                    <div className="form-group">
                                        <div className="input-box">
                                            <input
                                                type="text"
                                                name="form_name"
                                                id="formName"
                                                placeholder="Name..."
                                                value=""
                                            />
                                        </div>
                                    </div>
                                </div>
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
                                                name="form_phone"
                                                id="formPhone"
                                                placeholder="Phone..."
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
                                            Sign UP
                                            <span>
                                                <i className="icon-right-arrow"></i>
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="google-facebook">
                                <a href="https://www.google.com/">
                                    <div className="icon">
                                        <img src={IconGoogle2} alt="Google" />
                                    </div>
                                    Continue with Google
                                </a>
                                <a href="https://www.facebook.com/">
                                    <div className="icon">
                                        <img src={IconFacebook} alt="Google" />
                                    </div>
                                    Continue with Facebook
                                </a>
                            </div>
                            <div className="create-account text-center">
                                <p>
                                    Already have an account?
                                    <Link to="/login">Login Here</Link>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
            {/*End Sign Up One*/}
        </>
    );
}
