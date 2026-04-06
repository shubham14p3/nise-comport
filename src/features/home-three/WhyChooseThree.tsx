import { Link } from "react-router-dom";
import TextAnimation from "@/components/elements/TextAnimation";
import WhyChooseThreeImg1 from "@/assets/images/resources/why-choose-three-img-1.png";
import WhyChooseThreeShape1 from "@/assets/images/shapes/why-choose-three-shape-1.png";

export default function WhyChooseThree() {
    return (
        <>
            {/*Why Choose Three Start*/}
            <section className="why-choose-three">
                <div className="why-choose-three__bg-color"></div>
                <div className="container">
                    <div className="why-choose-three__inner">
                        <div className="why-choose-three__img-1">
                            <img
                                src={WhyChooseThreeImg1}
                                className="float-bob-x"
                            />
                            <div className="why-choose-three__shape-1 rotate-me">
                                <img src={WhyChooseThreeShape1} />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-xl-6">
                                <div className="why-choose-three__left">
                                    <div className="section-title text-left sec-title-animation animation-style2">
                                        <div className="section-title__tagline-box">
                                            <span className="section-title__tagline">
                                                Why Chooses Us
                                            </span>
                                        </div>
                                        <h2 className="section-title__title">
                                            <TextAnimation style="s2">
                                                Why People Are Very loved
                                                <br /> To Working
                                                <span>With Us?</span>
                                            </TextAnimation>
                                        </h2>
                                    </div>
                                    <p className="why-choose-three__text">
                                        nnovating and empowering businesses with
                                        tailored solutions for success
                                        <br /> and growth. Innovating and
                                        empowering
                                    </p>
                                    <div className="why-choose-three__points-list-box">
                                        <ul className="why-choose-three__points-list list-unstyled">
                                            <li>
                                                <div className="icon">
                                                    <span className="icon-check"></span>
                                                </div>
                                                <h3>
                                                    Reliability and Consistency
                                                </h3>
                                            </li>
                                            <li>
                                                <div className="icon">
                                                    <span className="icon-check"></span>
                                                </div>
                                                <h3>Commitment to Safety</h3>
                                            </li>
                                        </ul>
                                        <ul className="why-choose-three__points-list list-unstyled">
                                            <li>
                                                <div className="icon">
                                                    <span className="icon-check"></span>
                                                </div>
                                                <h3>Quality Workmanship</h3>
                                            </li>
                                            <li>
                                                <div className="icon">
                                                    <span className="icon-check"></span>
                                                </div>
                                                <h3>
                                                    Expertise and Experience
                                                </h3>
                                            </li>
                                        </ul>
                                    </div>
                                    <ul className="why-choose-three__points list-unstyled">
                                        <li>
                                            <div className="icon">
                                                <span className="icon-check-1"></span>
                                            </div>
                                            <p>
                                                Dramatically re-engineer value
                                                added IT systems via mission
                                            </p>
                                        </li>
                                        <li>
                                            <div className="icon">
                                                <span className="icon-check-1"></span>
                                            </div>
                                            <p>
                                                We provide 24/7 monitoring and
                                                support to ensure your systems.
                                            </p>
                                        </li>
                                        <li>
                                            <div className="icon">
                                                <span className="icon-check-1"></span>
                                            </div>
                                            <p>
                                                Professional User Experince &
                                                Interface researching
                                            </p>
                                        </li>
                                    </ul>
                                    <div className="why-choose-three__btn-box">
                                        <Link to="/about" className="thm-btn">
                                            Get Started
                                            <span className="fas fa-arrow-right"></span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/*Why Choose Three End*/}
        </>
    );
}
