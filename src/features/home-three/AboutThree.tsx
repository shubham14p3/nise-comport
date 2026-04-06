import { Link } from "react-router-dom";
import CounterUp from "@/components/elements/CounterUp";
import TextAnimation from "@/components/elements/TextAnimation";
import FadeInAdvanced from "@/components/elements/FadeInAdvanced";
import AboutThreeImg1 from "@/assets/images/resources/about-three-img-1.jpg";
import AboutThreeImg2 from "@/assets/images/resources/about-three-img-2.jpg";
import AboutThreeClientImg11 from "@/assets/images/resources/about-three-client-img-1-1.jpg";
import AboutThreeClientImg12 from "@/assets/images/resources/about-three-client-img-1-2.jpg";
import AboutThreeClientImg13 from "@/assets/images/resources/about-three-client-img-1-3.jpg";
import AboutThreePointsListImg from "@/assets/images/resources/about-three-points-list-img.jpg";
import AboutThreeBgShape from "@/assets/images/shapes/about-three-bg-shape.png";

export default function AboutThree() {
    return (
        <>
            {/*About Three Start*/}
            <section className="about-three" id="about">
                <div
                    className="about-three__bg-shape"
                    style={{ backgroundImage: `url(${AboutThreeBgShape})` }}
                ></div>
                <div className="container">
                    <div className="row">
                        <div className="col-xl-6">
                            <div className="about-three__left">
                                <FadeInAdvanced
                                    variant={"slideInLeft"}
                                    delay={100}
                                    duration={2500}
                                >
                                    <div className="about-three__img-box">
                                        <div className="about-three__img">
                                            <img src={AboutThreeImg1} />
                                        </div>
                                        <div className="about-three__img-2">
                                            <img src={AboutThreeImg2} />
                                        </div>
                                        <div className="about-three__experience">
                                            <div className="about-three__experience-count-box">
                                                <h3>
                                                    <CounterUp ending={25} />
                                                </h3>
                                                <span>+</span>
                                            </div>
                                            <p className="about-three__experience-count-text">
                                                Years of Experience
                                            </p>
                                        </div>
                                    </div>
                                    <div className="about-three__client-box">
                                        <ul className="about-three__client-img-list list-unstyled">
                                            <li>
                                                <div className="about-three__client-img">
                                                    <img
                                                        src={
                                                            AboutThreeClientImg11
                                                        }
                                                    />
                                                </div>
                                            </li>
                                            <li>
                                                <div className="about-three__client-img">
                                                    <img
                                                        src={
                                                            AboutThreeClientImg12
                                                        }
                                                    />
                                                </div>
                                            </li>
                                            <li>
                                                <div className="about-three__client-img">
                                                    <img
                                                        src={
                                                            AboutThreeClientImg13
                                                        }
                                                    />
                                                </div>
                                            </li>
                                            <li>
                                                <Link to="#">
                                                    <span className="fas fa-plus"></span>
                                                </Link>
                                            </li>
                                        </ul>
                                        <p className="about-three__client-text">
                                            <span className="count-text-1">
                                                <CounterUp ending={120} />
                                            </span>
                                            <span className="count-text">
                                                K
                                            </span>
                                            Satisfied Client
                                        </p>
                                    </div>
                                </FadeInAdvanced>
                            </div>
                        </div>
                        <div className="col-xl-6">
                            <div className="about-three__right">
                                <div className="section-title text-left sec-title-animation animation-style2">
                                    <div className="section-title__tagline-box">
                                        <span className="section-title__tagline">
                                            About Us
                                        </span>
                                    </div>
                                    <h2 className="section-title__title">
                                        <TextAnimation style="s2">
                                            Your Business Growth with Our
                                            Cutting-Edge
                                            <span>IT Solutions</span>
                                        </TextAnimation>
                                    </h2>
                                </div>
                                <p className="about-three__text">
                                    Transform your business with our innovative
                                    IT solutions, tailored to address your
                                    unique challenges and drive growth in
                                    today’s digital landscape.
                                </p>
                                <div className="about-three__points-box">
                                    <ul className="about-three__points-list list-unstyled">
                                        <li>
                                            <div className="icon">
                                                <span className="icon-checked"></span>
                                            </div>
                                            <p>
                                                Innovative IT Solutions Expert
                                                <br /> Support & Consulting
                                            </p>
                                        </li>
                                        <li>
                                            <div className="icon">
                                                <span className="icon-checked"></span>
                                            </div>
                                            <p>
                                                Cloud Solutions for Modern
                                                <br /> Enterprises
                                            </p>
                                        </li>
                                    </ul>
                                    <ul className="about-three__points-list about-three__points-list-2 list-unstyled">
                                        <li>
                                            <div className="icon">
                                                <span className="icon-checked"></span>
                                            </div>
                                            <p>
                                                Seamless Digital
                                                <br /> Transformation AI-Driven
                                            </p>
                                        </li>
                                        <li>
                                            <div className="about-three__points-list-img">
                                                <img
                                                    src={
                                                        AboutThreePointsListImg
                                                    }
                                                />
                                            </div>
                                            <div className="about-three__points-list-content">
                                                <h5>Thomas Alison</h5>
                                                <p>Founder & SEO</p>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                                <ul className="about-three__points list-unstyled">
                                    <li>
                                        <div className="icon">
                                            <span className="icon-check"></span>
                                        </div>
                                        <p>
                                            Professional User Experince &
                                            Interface researching
                                        </p>
                                    </li>
                                    <li>
                                        <div className="icon">
                                            <span className="icon-check"></span>
                                        </div>
                                        <p>
                                            We provide 24/7 monitoring and
                                            support to ensure your systems.
                                        </p>
                                    </li>
                                    <li>
                                        <div className="icon">
                                            <span className="icon-check"></span>
                                        </div>
                                        <p>
                                            Dramatically re-engineer value added
                                            IT systems via mission
                                        </p>
                                    </li>
                                </ul>
                                <div className="about-three__btn-box-and-call-box">
                                    <div className="about-three__btn-box">
                                        <Link
                                            to="/about"
                                            className="about-three__btn thm-btn"
                                        >
                                            Discover More
                                            <span className="fas fa-arrow-right"></span>
                                        </Link>
                                    </div>
                                    <div className="about-three__call-box">
                                        <div className="about-three__call-box-icon">
                                            <span className="icon-call"></span>
                                        </div>
                                        <div className="about-three__call-box-content">
                                            <p>Call to Anytime</p>
                                            <h4>
                                                <a href="tel:15502505260">
                                                    +1 (550) 250 5260
                                                </a>
                                            </h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/*About Three End*/}
        </>
    );
}
