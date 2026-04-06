import { Link } from "react-router-dom";
import CounterUp from "@/components/elements/CounterUp";
import Progresbar from "@/components/elements/Progressbar";
import TextAnimation from "@/components/elements/TextAnimation";
import FadeInAdvanced from "@/components/elements/FadeInAdvanced";
import WhyChooseOneImg1 from "@/assets/images/resources/why-choose-one-img-1.jpg";
import WhyChooseOneImg2 from "@/assets/images/resources/why-choose-one-img-2.jpg";
import WhyChooseOneBgShape1 from "@/assets/images/shapes/why-choose-one-bg-shape-1.png";
import WhyChooseOneCstomerServicesBgShape from "@/assets/images/shapes/why-choose-one-cstomer-services-bg-shape.png";

export default function WhyChooseOne() {
    return (
        <>
            {/*Why Choose One Start */}
            <section className="why-choose-one">
                <div
                    className="why-choose-one__bg-shape-1"
                    style={{ backgroundImage: `url(${WhyChooseOneBgShape1})` }}
                ></div>
                <div className="container">
                    <div className="row">
                        <div className="col-xl-6">
                            <div className="why-choose-one__left">
                                <div className="section-title text-left sec-title-animation animation-style2">
                                    <div className="section-title__tagline-box">
                                        <span className="section-title__tagline">
                                            WHY CHOOSE US
                                        </span>
                                    </div>
                                    <h2 className="section-title__title">
                                        <TextAnimation style="s2">
                                            Elevate Growth With Our IT Solutions
                                            <span> For Success.</span>
                                        </TextAnimation>
                                    </h2>
                                </div>
                                <p className="why-choose-one__text">
                                    Innovating and empowering businesses with
                                    tailored solutions for success
                                    <br /> and growth. Innovating and empowering
                                </p>
                                <div className="why-choose-one__progress-box">
                                    <ul className="why-choose-one__progress-list list-unstyled">
                                        <Progresbar
                                            variant="bar-inner"
                                            title="Business Grow"
                                            value={90}
                                            wrapperClassName="why-choose-one__progress"
                                            titleClassName="why-choose-one__progress-title"
                                        />
                                        <Progresbar
                                            variant="bar-inner"
                                            title="Quality Products"
                                            value={85}
                                            wrapperClassName="why-choose-one__progress"
                                            titleClassName="why-choose-one__progress-title"
                                        />
                                        <Progresbar
                                            variant="bar-inner"
                                            title="Innovation Design"
                                            value={96}
                                            wrapperClassName="why-choose-one__progress"
                                            titleClassName="why-choose-one__progress-title"
                                        />
                                    </ul>
                                </div>
                                <div className="why-choose-one__btn-and-call-box">
                                    <div className="why-choose-one__btn-box">
                                        <Link to="/about" className="thm-btn">
                                            Learn More
                                            <span className="fas fa-arrow-right"></span>
                                        </Link>
                                    </div>
                                    <div className="why-choose-one__call-box">
                                        <div className="why-choose-one__call-icon">
                                            <span className="icon-call"></span>
                                        </div>
                                        <div className="why-choose-one__call-content">
                                            <p>Call Us Any Time</p>
                                            <h5>
                                                <a href="tel:0882466422710">
                                                    +088 (246) 642-27-10
                                                </a>
                                            </h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-6">
                            <div className="why-choose-one__right">
                                <FadeInAdvanced
                                    variant={"slideInRight"}
                                    delay={100}
                                    duration={2500}
                                >
                                    <div className="why-choose-one__img-box">
                                        <div className="why-choose-one__img">
                                            <img src={WhyChooseOneImg1} />
                                        </div>
                                        <div className="why-choose-one__img-2">
                                            <img src={WhyChooseOneImg2} />
                                        </div>
                                        <div className="why-choose-one__shape-1 rotate-me"></div>
                                        <div className="why-choose-one__cstomer-services">
                                            <div
                                                className="why-choose-one__cstomer-services-bg float-bob-x"
                                                style={{
                                                    backgroundImage: `url(${WhyChooseOneCstomerServicesBgShape})`,
                                                }}
                                            ></div>
                                            <h4>24/7 Customer Service</h4>
                                        </div>
                                        <div className="why-choose-one__client-active">
                                            <div className="why-choose-one__client-count-box">
                                                <h3>
                                                    <CounterUp ending={13} />
                                                </h3>
                                                <span>K</span>
                                                <span>+</span>
                                            </div>
                                            <p className="why-choose-one__client-text">
                                                Active Clients
                                            </p>
                                        </div>
                                    </div>
                                </FadeInAdvanced>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/*Why Choose One End */}
        </>
    );
}
