import { Link } from "react-router-dom";
import CounterUp from "@/components/elements/CounterUp";
import TextAnimation from "@/components/elements/TextAnimation";
import FadeInAdvanced from "@/components/elements/FadeInAdvanced";
import CirculaProgressOnView from "@/components/elements/CirculaProgressOnView";
import AboutTwoShape3 from "@/assets/images/shapes/about-two-shape-3.png";
import AboutTwoShape4 from "@/assets/images/shapes/about-two-shape-4.png";
import AboutTwoImg1 from "@/assets/images/resources/about-two-img-1.jpg";
import AboutTwoImg2 from "@/assets/images/resources/about-two-img-2.jpg";
import YoutubeFrem from "@/components/elements/YoutubeFrem";

export default function AboutTwo() {
    return (
        <>
            {/*About Two Start */}
            <section className="about-two" id="about">
                <div className="about-two__shape-1"></div>
                <div className="about-two__shape-2"></div>
                <div className="about-two__shape-3 float-bob-x">
                    <img src={AboutTwoShape3} />
                </div>
                <div className="about-two__shape-4 float-bob-y">
                    <img src={AboutTwoShape4} />
                </div>
                <div className="container">
                    <div className="row">
                        <div className="col-xl-6">
                            <div className="about-two__left">
                                <div className="section-title text-left sec-title-animation animation-style2">
                                    <div className="section-title__tagline-box">
                                        <span className="section-title__tagline">
                                            About Us
                                        </span>
                                    </div>
                                    <h2 className="section-title__title">
                                        <TextAnimation style="s2">
                                            Preparing for your Business success
                                            we provide <span>IT solutions</span>
                                        </TextAnimation>
                                    </h2>
                                </div>
                                <p className="about-two__text-1">
                                    Lorem ipsum is simply ipun txns mane so
                                    dummy text of free available in market the
                                    printing and typesetting industry has been
                                    the industry's standard dummy text ever.
                                </p>
                                <ul className="about-two__points list-unstyled">
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
                                <div className="about-two__progress-box">
                                    <div className="about-two__progress-single">
                                        <div className="graph-outer">
                                            <CirculaProgressOnView
                                                endValue={100}
                                                size={90}
                                                strokeWidth={6}
                                                duration={20}
                                                pathColor="#6e54f3"
                                                trailColor="#070d1a"
                                                textColor="#070d1a"
                                                suffix="%"
                                            />
                                        </div>
                                        <div className="about-two__progress-text-box">
                                            <h4>Satisfice Service</h4>
                                        </div>
                                    </div>
                                    <div className="about-two__progress-single">
                                        <div className="graph-outer">
                                            <CirculaProgressOnView
                                                endValue={99}
                                                size={90}
                                                strokeWidth={6}
                                                duration={20}
                                                pathColor="#6e54f3"
                                                trailColor="#070d1a"
                                                textColor="#070d1a"
                                                suffix="k"
                                                counterUpEnding={99.8}
                                                counterUpDuration={2000}
                                            />
                                        </div>
                                        <div className="about-two__progress-text-box">
                                            <h4>Satisfied Customer</h4>
                                        </div>
                                    </div>
                                </div>
                                <div className="about-two__btn-box-and-call-box">
                                    <div className="about-two__btn-box">
                                        <Link
                                            to="/about"
                                            className="about-two__btn thm-btn"
                                        >
                                            Discover More
                                            <span className="fas fa-arrow-right"></span>
                                        </Link>
                                    </div>
                                    <div className="about-two__call-box">
                                        <div className="about-two__call-box-icon">
                                            <span className="icon-call"></span>
                                        </div>
                                        <div className="about-two__call-box-content">
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
                        <div className="col-xl-6">
                            <div className="about-two__right">
                                <FadeInAdvanced
                                    variant={"slideInRight"}
                                    delay={100}
                                    duration={2500}
                                >
                                    <div className="about-two__img-box">
                                        <div className="about-two__img">
                                            <img src={AboutTwoImg1} />
                                        </div>
                                        <div className="about-two__img-2">
                                            <img src={AboutTwoImg2} />
                                            <div className="about-two__award">
                                                <div className="about-two__award-icon">
                                                    <span className="icon-award-1"></span>
                                                </div>
                                                <h5 className="about-two__award-title">
                                                    Award Winning Agency
                                                </h5>
                                            </div>
                                        </div>
                                        <div className="about-two__video-link">
                                            <YoutubeFrem className="video-popup" video="https://www.youtube.com/watch?v=rbFoRH2deeY">
                                                <div className="about-two__video-icon">
                                                    <span className="fa fa-play"></span>
                                                    <i className="ripple"></i>
                                                </div>
                                            </YoutubeFrem>
                                        </div>
                                        <div className="about-two__experience-box">
                                            <div className="about-two__experience-count-box">
                                                <h3>
                                                    <CounterUp ending={25} />
                                                </h3>
                                                <span>+</span>
                                            </div>
                                            <p className="about-two__experience-text">
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
            {/*About Two End */}
        </>
    );
}
