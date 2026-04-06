import { Link } from "react-router-dom";
import CounterUp from "@/components/elements/CounterUp";
import FadeInAdvanced from "@/components/elements/FadeInAdvanced";
import BannerTwoShape3 from "@/assets/images/shapes/banner-two-shape-3.png";
import BannerTwoShape4 from "@/assets/images/shapes/banner-two-shape-4.png";
import BannerTwoTrustpilotLogo from "@/assets/images/resources/banner-two-trustpilot-logo.png";
import BannerTwoImg1 from "@/assets/images/resources/banner-two-img-1.png";
import BrandTwoTrustpilotImg1 from "@/assets/images/resources/brand-two-trustpilot-img-1.jpg";
import BrandTwoTrustpilotImg2 from "@/assets/images/resources/brand-two-trustpilot-img-2.jpg";

export default function BannerTwo() {
    return (
        <>
            {/* Banner Two Start */}
            <section className="banner-two" id="home">
                <div className="banner-two__shape-1"></div>
                <div className="banner-two__shape-2 img-bounce-two"></div>
                <div className="banner-two__shape-3 rotate-me">
                    <img src={BannerTwoShape3} />
                </div>
                <div className="banner-two__shape-4 float-bob-x">
                    <img src={BannerTwoShape4} />
                </div>
                <div className="container">
                    <div className="banner-two__inner">
                        <div className="banner-two__content">
                            <FadeInAdvanced
                                variant="fadeInRight"
                                duration={1500}
                                delay={100}
                            >
                                <div className="banner-two__sub-title-box">
                                    <p className="banner-two__sub-title">
                                        Best it Solution Service
                                    </p>
                                </div>
                            </FadeInAdvanced>
                            <FadeInAdvanced
                                variant="fadeInLeft"
                                duration={1500}
                                delay={500}
                            >
                                <h2 className="banner-two__title">
                                    Boost <span>Business</span> with Our Innovative
                                    IT Solutions for <span>Success story</span>
                                </h2>
                            </FadeInAdvanced>
                            <FadeInAdvanced
                                variant="fadeInUp"
                                duration={1500}
                                delay={800}
                            >
                                <p className="banner-two__text">
                                    IT solutions refer to a broad range of services
                                    and technologies designed to address
                                    <br /> specific business needs, streamline
                                    operations, and drive growth.
                                </p>
                            </FadeInAdvanced>

                            <FadeInAdvanced
                                variant="fadeInUp"
                                duration={1500}
                                delay={1000}
                            >
                                <div className="banner-two__btn-box">
                                    <div className="banner-two__trustpilot-box">
                                        <ul className="list-unstyled banner-two__trustpilot-img-list">
                                            <li>
                                                <div className="banner-two__trustpilot-img">
                                                    <img
                                                        src={BrandTwoTrustpilotImg1}
                                                    />
                                                </div>
                                            </li>
                                            <li>
                                                <div className="banner-two__trustpilot-img">
                                                    <img
                                                        src={BrandTwoTrustpilotImg2}
                                                    />
                                                </div>
                                            </li>
                                        </ul>
                                        <div className="banner-two__trustpilot-content-box">
                                            <div className="banner-two__trustpilot-logo">
                                                <img
                                                    src={BannerTwoTrustpilotLogo}
                                                />
                                            </div>
                                            <div className="banner-two__trustpilot-rating-review">
                                                <p className="banner-two__trustpilot-rating">
                                                    5.0 Excellent
                                                </p>
                                                <p className="banner-two__trustpilot-review">
                                                    Reviews
                                                    <span>
                                                        <CounterUp ending={4170} />
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="banner-two__btn">
                                        <Link to="/about" className="thm-btn">
                                            Discover More
                                            <span className="fas fa-arrow-right"></span>
                                        </Link>
                                    </div>
                                </div>
                            </FadeInAdvanced>
                        </div>
                        <div className="banner-two__img-box">
                            <FadeInAdvanced
                                variant={"slideInLeft"}
                                delay={100}
                                duration={2500}
                            >
                                <div className="banner-two__img">
                                    <img src={BannerTwoImg1} />
                                </div>
                            </FadeInAdvanced>
                        </div>
                    </div>
                </div>
            </section>
            {/*Banner Two End */}
        </>
    );
}
