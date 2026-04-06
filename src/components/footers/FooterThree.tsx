import { Link } from "react-router-dom";
import FadeInAdvanced from "@/components/elements/FadeInAdvanced";
import Logo2 from "@/assets/images/resources/logo-2.png";
import SiteFooterThreeShapeBg from "@/assets/images/shapes/site-footer-three-shape-bg.png";
export default function FooterThree() {
    return (
        <>
            {/*Site Footer Three Start*/}
            <footer className="site-footer-three">
                <div
                    className="site-footer-three__shape-bg"
                    style={{
                        backgroundImage: `url(${SiteFooterThreeShapeBg})`,
                    }}
                ></div>
                <div className="container">
                    <div className="site-footer-three__top">
                        <div className="row">
                            <div className="col-xl-12">
                                <div className="footer-widget-three__column footer-widget-three__newsletter">
                                    <h3 className="footer-widget-three__newsletter-title">
                                        Subscribe To Our Newsletter To
                                        <br />
                                        Get Latest Update
                                    </h3>
                                    <form className="contact-form-validated footer-widget-three__newsletter-form">
                                        <div className="footer-widget-three__newsletter-form-input-box">
                                            <input
                                                type="email"
                                                placeholder="Enter email"
                                                name="email"
                                                required={true}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="thm-btn"
                                        >
                                            Subscribe
                                            <span className="fas fa-arrow-right"></span>
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="site-footer-three__middle">
                        <div className="row">
                            <div className="col-xl-3 col-lg-6 col-md-6">
                                <FadeInAdvanced
                                    variant={"fadeInUp"}
                                    delay={100}
                                >
                                    <div className="footer-widget-three__column footer-widget-three__about">
                                        <div className="footer-widget-three__logo">
                                            <Link to="/">
                                                <img src={Logo2} />
                                            </Link>
                                        </div>
                                        <p className="footer-widget-three__about-text">
                                            Secure other greater pleasures, or
                                            else he endures pains to avoid worse
                                            pains selection
                                        </p>
                                        <div className="site-footer-three__social">
                                            <Link to="#">
                                                <i className="icon-facebook-app-symbol"></i>
                                            </Link>
                                            <Link to="#">
                                                <i className="icon-twitter-1"></i>
                                            </Link>
                                            <Link to="#">
                                                <i className="icon-pinterest"></i>
                                            </Link>
                                            <Link to="#">
                                                <i className="icon-linkedin"></i>
                                            </Link>
                                        </div>
                                    </div>
                                </FadeInAdvanced>
                            </div>
                            <div className="col-xl-3 col-lg-6 col-md-6">
                                <FadeInAdvanced
                                    variant={"fadeInUp"}
                                    delay={200}
                                >
                                    <div className="footer-widget-three__column footer-widget-three__usefull-link">
                                        <div className="footer-widget-three__title-box">
                                            <h3 className="footer-widget-three__title">
                                                Quick Links
                                            </h3>
                                        </div>
                                        <div className="footer-widget-three__link-box">
                                            <ul className="footer-widget-three__link list-unstyled">
                                                <li>
                                                    <Link to="/about">
                                                        About Us
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to="/team">
                                                        Meet Our Team
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to="/projects">
                                                        Our Projects
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to="/faq">
                                                        Help & FAQs
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to="/contact">
                                                        Contact Us
                                                    </Link>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </FadeInAdvanced>
                            </div>
                            <div className="col-xl-3 col-lg-6 col-md-6">
                                <FadeInAdvanced
                                    variant={"fadeInUp"}
                                    delay={300}
                                >
                                    <div className="footer-widget-three__column footer-widget-three__services">
                                        <div className="footer-widget-three__title-box">
                                            <h3 className="footer-widget-three__title">
                                                Our Services
                                            </h3>
                                        </div>
                                        <ul className="footer-widget-three__link list-unstyled">
                                            <li>
                                                <Link to="/web-development">
                                                    Web Development
                                                </Link>
                                            </li>
                                            <li>
                                                <Link to="/ui-ux-design">
                                                    Cloud services
                                                </Link>
                                            </li>
                                            <li>
                                                <Link to="/product-design">
                                                    Product Management
                                                </Link>
                                            </li>
                                            <li>
                                                <Link to="/ui-ux-design">
                                                    UI/UX Design
                                                </Link>
                                            </li>
                                            <li>
                                                <Link to="/business-analysis">
                                                    Business Development
                                                </Link>
                                            </li>
                                        </ul>
                                    </div>
                                </FadeInAdvanced>
                            </div>
                            <div className="col-xl-3 col-lg-6 col-md-6">
                                <FadeInAdvanced
                                    variant={"fadeInUp"}
                                    delay={400}
                                >
                                    <div className="footer-widget-three__contact-box">
                                        <div className="footer-widget-three__title-box">
                                            <h3 className="footer-widget-three__title">
                                                Official info
                                            </h3>
                                        </div>
                                        <ul className="footer-widget-three__contact list-unstyled">
                                            <li>
                                                <div className="icon">
                                                    <span className="icon-call"></span>
                                                </div>
                                                <div className="content">
                                                    <p>
                                                        <a href="tel:885747546027">
                                                            (88) 574 7546 027
                                                        </a>
                                                    </p>
                                                    <p>
                                                        <a href="tel:885747546027">
                                                            (88) 574 7546 027
                                                        </a>
                                                    </p>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="icon">
                                                    <span className="icon-email"></span>
                                                </div>
                                                <div className="content">
                                                    <p>
                                                        <a href="mailto:example@gmail.com">
                                                            example@gmail.com
                                                        </a>
                                                    </p>
                                                    <p>
                                                        <a href="mailto:example@gmail.com">
                                                            example@gmail.com
                                                        </a>
                                                    </p>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="icon">
                                                    <span className="icon-pin"></span>
                                                </div>
                                                <div className="content">
                                                    <p>
                                                        4517 Washington Ave.
                                                        Manchester, 95
                                                    </p>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </FadeInAdvanced>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="site-footer-three__bottom">
                    <div className="container">
                        <div className="site-footer-three__bottom-inner">
                            <p className="site-footer-three__bottom-text">
                                © Copywright 2025 by
                                <a href="https://themeforest.net/user/dreamlayout">
                                    Itzone.com
                                </a>
                                All Rights Reserved.
                            </p>
                            <ul className="list-unstyled site-footer-three__bottom-menu">
                                <li>
                                    <Link to="/contact">Support</Link>
                                </li>
                                <li>
                                    <Link to="/about">Terms and Condition</Link>
                                </li>
                                <li>
                                    <Link to="/about">Privacy and Policy</Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </footer>
            {/*Site Footer Three End*/}
        </>
    );
}
