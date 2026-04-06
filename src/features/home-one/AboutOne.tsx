import { Link } from "react-router-dom";
import CounterUp from "@/components/elements/CounterUp";
import TextAnimation from "@/components/elements/TextAnimation";
import FadeInAdvanced from "@/components/elements/FadeInAdvanced";
import AboutOneShape2 from "@/assets/images/shapes/about-one-shape-2.png";
import AboutOneShape3 from "@/assets/images/shapes/about-one-shape-3.png";
import AboutOneClientSign from "@/assets/images/resources/about-one-client-sign.png";
import AboutOneShape1 from "@/assets/images/shapes/about-one-shape-1.png";
import AboutOneClientImg1 from "@/assets/images/resources/about-one-client-img-1.jpg";
import AboutOneImg1 from "@/assets/images/resources/about-one-img-1.jpg";
import AboutOneImg2 from "@/assets/images/resources/about-one-img-2.jpg";
import AboutOneClientImg11 from "@/assets/images/resources/about-one-client-img-1-1.jpg";
import AboutOneClientImg12 from "@/assets/images/resources/about-one-client-img-1-2.jpg";
import AboutOneClientImg13 from "@/assets/images/resources/about-one-client-img-1-3.jpg";
import YoutubeFrem from "@/components/elements/YoutubeFrem";

export default function AboutOne() {
    return (
        <>
            {/*About One Start */}
            <section className="about-one" id="about">
                <div className="about-one__shape-2 float-bob">
                    <img src={AboutOneShape2} />
                </div>
                <div className="about-one__shape-3 float-bob-y">
                    <img src={AboutOneShape3} />
                </div>
                <div className="container">
                    <div className="row">
                        <div className="col-xl-6">
                            <div className="about-one__left">
                                <div className="section-title text-left sec-title-animation animation-style2">
                                    <div className="section-title__tagline-box">
                                        <span className="section-title__tagline">
                                            About Us
                                        </span>
                                    </div>
                                    <h2 className="section-title__title">
                                        <TextAnimation style="s2">
                                            Boost Business with Our <br />
                                            Innovative
                                            <span> IT Solutions</span>
                                        </TextAnimation>
                                    </h2>
                                </div>
                                <p className="about-one__text">
                                    Innovating and empowering businesses with
                                    tailored solutions for success
                                    <br /> and growth. Empowering businesses to
                                    create meaningful innovation.
                                </p>
                                <ul className="about-one__points list-unstyled">
                                    <li>
                                        <div className="icon">
                                            <span className="icon-award"></span>
                                        </div>
                                        <div className="content">
                                            <h4>Award-Winning Company.</h4>
                                            <p>
                                                Partner with us to unlock new
                                                possibilities, drive progress,
                                                and shape
                                                <br /> a future filled with
                                                success
                                            </p>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="icon">
                                            <span className="icon-certified"></span>
                                        </div>
                                        <div className="content">
                                            <h4>Certified Company</h4>
                                            <p>
                                                Partner with us to unlock new
                                                possibilities, drive progress,
                                                and shape
                                                <br /> a future filled with
                                                success
                                            </p>
                                        </div>
                                    </li>
                                </ul>
                                <div className="about-one__btn-and-client-info">
                                    <div className="about-one__btn-box">
                                        <Link to="/about" className="thm-btn">
                                            Learn More
                                            <span className="fas fa-arrow-right"></span>
                                        </Link>
                                    </div>
                                    <div className="about-one__client-info-inner">
                                        <div className="about-one__client-info">
                                            <div className="about-one__client-img-inner">
                                                <div className="about-one__client-img">
                                                    <img
                                                        src={AboutOneClientImg1}
                                                    />
                                                </div>
                                            </div>
                                            <div className="about-one__client-details">
                                                <h5>Adam Smith</h5>
                                                <p>ceo,Itzone</p>
                                            </div>
                                        </div>
                                        <div className="about-one__client-sign">
                                            <img src={AboutOneClientSign} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-6">
                            <div className="about-one__right">
                                <FadeInAdvanced
                                    variant={"slideInRight"}
                                    delay={100}
                                    duration={2500}
                                >
                                    <div className="about-one__img-box">
                                        <div className="about-one__shape-1 float-bob-x">
                                            <img src={AboutOneShape1} />
                                        </div>
                                        <div className="about-one__img">
                                            <img src={AboutOneImg1} />
                                        </div>
                                        <div className="about-one__img-2">
                                            <img src={AboutOneImg2} />
                                        </div>
                                        <div className="about-one__video-link">
                                            <YoutubeFrem className="video-popup" video="https://www.youtube.com/watch?v=rbFoRH2deeY">
                                                <div className="about-one__video-icon">
                                                    <span className="fa fa-play"></span>
                                                    <i className="ripple"></i>
                                                </div>
                                            </YoutubeFrem>
                                        </div>
                                        <div className="about-one__client-box">
                                            <ul className="about-one__client-box-img-list list-unstyled">
                                                <li>
                                                    <div className="about-one__client-box-img">
                                                        <img
                                                            src={
                                                                AboutOneClientImg11
                                                            }
                                                        />
                                                    </div>
                                                </li>
                                                <li>
                                                    <div className="about-one__client-box-img">
                                                        <img
                                                            src={
                                                                AboutOneClientImg12
                                                            }
                                                        />
                                                    </div>
                                                </li>
                                                <li>
                                                    <div className="about-one__client-box-img">
                                                        <img
                                                            src={
                                                                AboutOneClientImg13
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
                                            <p className="about-one__client-text">
                                                <span>
                                                    <CounterUp ending={120} />
                                                </span>
                                                <span className="about-one__client-text-letter">
                                                    K
                                                </span>
                                                Satisfied Client
                                            </p>
                                        </div>
                                        <div className="about-one__experience-box">
                                            <div className="about-one__experience-count-box">
                                                <h3>
                                                    <CounterUp ending={25} />
                                                </h3>
                                                <span>+</span>
                                            </div>
                                            <p className="about-one__experience-text">
                                                Years of Experience
                                            </p>
                                        </div>
                                    </div>
                                </FadeInAdvanced>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/*About One End */}
        </>
    );
}
