import React from "react";
import "../assets/css/custom.css";
import { Link } from "react-router-dom";

const PageNotFound = () => {
    return (
        <div className="mail-div-404">
            <aside className="mail-div-aside-404">
                <img
                    src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/4424790/Mirror.png"
                    alt="404"
                />
            </aside>
            <main className="main-div-404">
                <h1>Sorry!</h1>
                <p>
                    Uh oh! Looks like you got lost.
                    <em>. . . Go back to the homepage if you start fresh!</em>
                </p>
                <Link className="footer-link" to={process.env.PUBLIC_URL + "/"}>
                    Go back now!
                </Link>
            </main>
        </div>
    );
};

export default PageNotFound;
