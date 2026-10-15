import React from "react";
import { Link } from "react-router-dom";
import "./PageNotFound.css";
import Footer from "../layouts/footer";

const PageNotFound = () => {
    return (
        <div className="PageNotFound">
            <main>
                <div className="intro-text-container">
                    <p className="intro-text">404 NOT FOUND</p>
                </div>
                <section className="content-container">
                    <div className="scarecrow-container">
                        <img
                            src="https://raw.githubusercontent.com/Petsamuel/error-page/main/assets/images/Scarecrow.png"
                            alt="404 Scarecrow"
                            className="scarecrow-image"
                        />
                    </div>
                    <div className="message-container">
                        <p className="error-heading">I have bad news for you</p>
                        <p className="error-text">
                            The page you are looking for might be removed or is temporarily unavailable.
                        </p>
                        <div className="button-container">
                            <Link className="back-button" to={import.meta.env.BASE_URL + "/home"}>
                                Back to homepage
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
            <Footer/>
        </div>
    );
};

export default PageNotFound;
