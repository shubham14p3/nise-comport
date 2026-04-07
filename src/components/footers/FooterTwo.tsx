import { Link } from "react-router-dom";
import FadeInAdvanced from "@/components/elements/FadeInAdvanced";
import Logo2 from "@/assets/images/resources/logo-2.png";
import FooterWidgetPostImg1 from "@/assets/images/blog/footer-widget-post-img-1.jpg";
import FooterWidgetPostImg2 from "@/assets/images/blog/footer-widget-post-img-2.jpg";
import SiteFooterBg from "@/assets/images/backgrounds/site-footer-bg.jpg";
export default function FooterTwo() {
    return (
        <>
            {/*Site Footer Start*/}
            <footer className="site-footer site-footer-two">
                <div
                    className="site-footer__bg"
                    style={{ backgroundImage: `url(${SiteFooterBg})` }}
                ></div>
                <div className="site-footer__shape-1 img-bounce-two"></div>
                <div className="site-footer__shape-2 float-bob-y"></div>
                <div className="site-footer__top">
                    <div className="container">
                        <div className="site-footer__top-inner">
                            <div className="row">
                                <div className="col-xl-4 col-lg-6 col-md-6">
                                    <FadeInAdvanced
                                        variant={"fadeInUp"}
                                        delay={100}
                                    >
                                        <div className="footer-widget__about">
                                            <div className="footer-widget__about-logo">
                                                <Link to="/">
                                                    <img src={Logo2} />
                                                </Link>
                                            </div>
                                            <p className="footer-widget__about-text">
                                                Car Is Where Early Adopters And
                                                Innovation Seekers FindGet the
                                                latest SEO tips and software
                                                Lively Imaginative Tech.
                                            </p>
                                            <div className="footer-widget__social">
                                                <Link to="#">
                                                    <i className="fab fa-twitter"></i>
                                                </Link>
                                                <Link to="#">
                                                    <i className="fab fa-facebook"></i>
                                                </Link>
                                                <Link to="#">
                                                    <i className="fab fa-pinterest-p"></i>
                                                </Link>
                                                <Link to="#">
                                                    <i className="fab fa-instagram"></i>
                                                </Link>
                                            </div>
                                        </div>
                                    </FadeInAdvanced>
                                </div>
                                <div className="col-xl-2 col-lg-6 col-md-6">
                                    <FadeInAdvanced
                                        variant={"fadeInUp"}
                                        delay={200}
                                    >
                                        <div className="footer-widget__links">
                                            <h4 className="footer-widget__title">
                                                Quick links
                                            </h4>
                                            <ul className="footer-widget__links-list list-unstyled">
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
                                    </FadeInAdvanced>
                                </div>
                                <div className="col-xl-3 col-lg-6 col-md-6">
                                    <FadeInAdvanced
                                        variant={"fadeInUp"}
                                        delay={400}
                                    >
                                        <div className="footer-widget__post-box">
                                            <h4 className="footer-widget__title">
                                                Recent Posts
                                            </h4>
                                            <ul className="footer-widget__post list-unstyled">
                                                <li>
                                                    <div className="footer-widget__post-img">
                                                        <img
                                                            src={
                                                                FooterWidgetPostImg1
                                                            }
                                                        />
                                                    </div>
                                                    <div className="footer-widget__post-content">
                                                        <h3 className="footer-widget__post-title">
                                                            <Link to="/blog-details">
                                                                The Surfing Man
                                                                Will Blow Your
                                                                Mind
                                                            </Link>
                                                        </h3>
                                                        <p className="footer-widget__post-date">
                                                            <span className="fas fa-calendar-alt"></span>
                                                            March 22, 2025
                                                        </p>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div className="footer-widget__post-img">
                                                        <img
                                                            src={
                                                                FooterWidgetPostImg2
                                                            }
                                                        />
                                                    </div>
                                                    <div className="footer-widget__post-content">
                                                        <h3 className="footer-widget__post-title">
                                                            <Link to="/blog-details">
                                                                Top 5 Most
                                                                Famous
                                                                Technology Trend
                                                                In 2025
                                                            </Link>
                                                        </h3>
                                                        <p className="footer-widget__post-date">

                                                            <span className="fas fa-calendar-alt"></span>
                                                            Feb 17, 2025
                                                        </p>
                                                    </div>
                                                </li>
                                            </ul>
                                        </div>
                                    </FadeInAdvanced>
                                </div>
                                <div className="col-xl-3 col-lg-6 col-md-6">
                                    <FadeInAdvanced
                                        variant={"fadeInUp"}
                                        delay={300}
                                    >
                                        <div className="footer-widget__contact">
                                            <h3 className="footer-widget__title">
                                                Contact Us
                                            </h3>
                                            <ul className="footer-widget__contact-list list-unstyled">
                                                <li>
                                                    <div className="icon">
                                                        <span className="icon-pin"></span>
                                                    </div>
                                                    <p>
                                                        Shop No 3, Singh Building, H M Rd, Kharangajhar
                                                        Telco, Jamshedpur
                                                        <br /> Jharkhand, IN, 831004
                                                    </p>
                                                </li>
                                                <li>
                                                    <div className="icon">
                                                        <span className="icon-call"></span>
                                                    </div>
                                                    <p>
                                                        <a href="tel:+919771219893">
                                                            (+91) 9771219893
                                                        </a>
                                                    </p>
                                                </li>
                                                <li>
                                                    <div className="icon">
                                                        <span className="icon-email"></span>
                                                    </div>
                                                    <p>
                                                        <a href="mailto:info@nisecomport.com">
                                                            info@nisecomport.com
                                                        </a>
                                                    </p>
                                                </li>
                                            </ul>
                                        </div>
                                    </FadeInAdvanced>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="site-footer__bottom">
                    <div className="container">
                        <div className="row">
                            <div className="col-xl-12">
                                <div className="site-footer__bottom-inner">
                                    <div className="site-footer__copyright">
                                        <p className="site-footer__copyright-text">
                                            © 2026 By -
                                            <a href="https://www.nisecomport.com">
                                                NISE COMPORT.
                                            </a>
                                            All Rights Reserved.
                                        </p>
                                    </div>
                                    <div className="site-footer__bottom-menu-box">
                                        <ul className="list-unstyled site-footer__bottom-menu">
                                            <li>
                                                <Link to="/term-conditions">
                                                    Terms of Service
                                                </Link>
                                            </li>
                                            <li>
                                                <Link to="/about">
                                                    Privacy policy
                                                </Link>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
            {/*Site Footer End*/}
        </>
    );
}
