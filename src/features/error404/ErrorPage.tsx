import { Link } from "react-router-dom";
import ErrorPageImg1 from "@/assets/images/resources/error-page-img1.png";

export default function ErrorPage() {
    return (
        <>
            {/*Start Error Page*/}
            <section className="error-page">
                <div className="container">
                    <div className="error-page__inner text-center">
                        <div className="error-page__img float-bob-y">
                            <img src={ErrorPageImg1} />
                        </div>

                        <div className="error-page__content">
                            <h2>Oops! Page Not Found!</h2>
                            <p>
                                The page you are looking for does not exist. It
                                might have been moved or deleted.
                            </p>
                            <div className="btn-box">
                                <Link to="/" className="thm-btn">
                                    Back To Home
                                    <span className="fas fa-arrow-right"></span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/*End Error Page*/}
        </>
    );
}
