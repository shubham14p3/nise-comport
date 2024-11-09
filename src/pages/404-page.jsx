import React from "react";
import { Link } from "react-router-dom";
import "./PageNotFound.css"; // Make sure to import the CSS file

const PageNotFound = () => {
    return (
        <div className="PageNotFound">
            <main>
                <div className="intro-text-container">
                    <p className="intro-text">404 NOT FOUND</p>
                </div>
                <section className="container">
                    <div className="Scarecrow">
                        <img
                            src="https://raw.githubusercontent.com/Petsamuel/error-page/main/assets/images/Scarecrow.png"
                            alt="404"
                        />
                    </div>
                    <div className="error-message-container">
                        <p className="error-heading">I have bad news for you</p>
                        <p className="error-text">
                            The page you are looking for might be removed or is temporarily unavailable.
                        </p>
                        <div className="button">
                            <Link className="footer-link" to={process.env.PUBLIC_URL + "/"}>
                                Back to homepage
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
            <footer className="footer">
                <p className="footer-text">created by Bieefilled - devChallenges.io</p>
            </footer>
        </div>
    );
};

export default PageNotFound;
