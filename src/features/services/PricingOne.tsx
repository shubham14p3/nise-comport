import { Link } from "react-router-dom";
import TextAnimation from "@/components/elements/TextAnimation";
import FadeInAdvanced from "@/components/elements/FadeInAdvanced";
import PricingOneShape2 from "@/assets/images/shapes/pricing-one-shape-2.png";
import PricingOnePriceBoxShape1 from "@/assets/images/shapes/pricing-one-price-box-shape-1.png";

export default function PricingOne() {
    return (
        <>
            {/* Pricing One Start */}
            <section className="pricing-one">
                <div className="pricing-one__shape-1"></div>
                <div className="pricing-one__shape-2 float-bob-y">
                    <img src={PricingOneShape2} />
                </div>
                <div className="container">
                    <div className="section-title text-center sec-title-animation animation-style1">
                        <div className="section-title__tagline-box">
                            <span className="section-title__tagline">
                                Our Pricing Plan
                            </span>
                        </div>
                        <h2 className="section-title__title">
                            <TextAnimation style="s1">
                                Popular Pricing <span>Package</span>
                            </TextAnimation>
                        </h2>
                    </div>
                    <div className="row">
                        {/*Pricing One Single Start*/}
                        <div className="col-xl-4 col-lg-4 col-md-6">
                            <FadeInAdvanced variant={"fadeInLeft"} delay={100}>
                                <div className="pricing-one__single">
                                    <div className="pricing-one__price-box">
                                        <div
                                            className="pricing-one__price-box-shape"
                                            style={{
                                                backgroundImage: `url(${PricingOnePriceBoxShape1})`,
                                            }}
                                        ></div>
                                        <span>Basic Plan</span>
                                        <h3 className="pricing-one__price">
                                            $35.00
                                        </h3>
                                        <p className="pricing-one__price-sub-title">
                                            Get Popular Plan From Us
                                        </p>
                                    </div>
                                    <div className="pricing-one__points-and-btn">
                                        <ul className="pricing-one__price-points list-unstyled">
                                            <li>
                                                <div className="icon">
                                                    <span className="icon-check"></span>
                                                </div>
                                                <p>Multi-Language Content</p>
                                            </li>
                                            <li>
                                                <div className="icon">
                                                    <span className="icon-check"></span>
                                                </div>
                                                <p>Programmable Chatbots</p>
                                            </li>
                                            <li>
                                                <div className="icon">
                                                    <span className="icon-check"></span>
                                                </div>
                                                <p>Digital Analysis</p>
                                            </li>
                                            <li>
                                                <div className="icon">
                                                    <span className="icon-check"></span>
                                                </div>
                                                <p>Social Media Marketing</p>
                                            </li>
                                            <li>
                                                <div className="icon">
                                                    <span className="icon-check"></span>
                                                </div>
                                                <p>Technical Support</p>
                                            </li>
                                        </ul>
                                        <div className="pricing-one__btn-box">
                                            <Link
                                                to="/pricing"
                                                className="thm-btn"
                                            >
                                                Choose Plan
                                                <span className="fas fa-arrow-right"></span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </FadeInAdvanced>
                        </div>
                        {/*Pricing One Single End*/}
                        {/*Pricing One Single Start*/}
                        <div className="col-xl-4 col-lg-4 col-md-6">
                            <FadeInAdvanced variant={"fadeInUp"} delay={200}>
                                <div className="pricing-one__single">
                                    <div className="pricing-one__single-shape-1"></div>
                                    <div className="pricing-one__price-box">
                                        <div
                                            className="pricing-one__price-box-shape"
                                            style={{
                                                backgroundImage: `url(${PricingOnePriceBoxShape1})`,
                                            }}
                                        ></div>
                                        <div className="pricing-one__recomanded">
                                            <span>Recommended</span>
                                        </div>
                                        <span>Standard Plan</span>
                                        <h3 className="pricing-one__price">
                                            $75.00
                                        </h3>
                                        <p className="pricing-one__price-sub-title">
                                            Get Popular Plan From Us
                                        </p>
                                    </div>
                                    <div className="pricing-one__points-and-btn">
                                        <ul className="pricing-one__price-points list-unstyled">
                                            <li>
                                                <div className="icon">
                                                    <span className="icon-check"></span>
                                                </div>
                                                <p>Multi-Language Content</p>
                                            </li>
                                            <li>
                                                <div className="icon">
                                                    <span className="icon-check"></span>
                                                </div>
                                                <p>Programmable Chatbots</p>
                                            </li>
                                            <li>
                                                <div className="icon">
                                                    <span className="icon-check"></span>
                                                </div>
                                                <p>Digital Analysis</p>
                                            </li>
                                            <li>
                                                <div className="icon">
                                                    <span className="icon-check"></span>
                                                </div>
                                                <p>Social Media Marketing</p>
                                            </li>
                                            <li>
                                                <div className="icon">
                                                    <span className="icon-check"></span>
                                                </div>
                                                <p>Technical Support</p>
                                            </li>
                                        </ul>
                                        <div className="pricing-one__btn-box">
                                            <Link
                                                to="/pricing"
                                                className="thm-btn"
                                            >
                                                Choose Plan
                                                <span className="fas fa-arrow-right"></span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </FadeInAdvanced>
                        </div>
                        {/*Pricing One Single End*/}
                        {/*Pricing One Single Start*/}
                        <div className="col-xl-4 col-lg-4 col-md-6">
                            <FadeInAdvanced variant={"fadeInRight"} delay={300}>
                                <div className="pricing-one__single">
                                    <div className="pricing-one__price-box">
                                        <div
                                            className="pricing-one__price-box-shape"
                                            style={{
                                                backgroundImage: `url(${PricingOnePriceBoxShape1})`,
                                            }}
                                        ></div>
                                        <span>Premium Plan</span>
                                        <h3 className="pricing-one__price">
                                            $93.00
                                        </h3>
                                        <p className="pricing-one__price-sub-title">
                                            Get Popular Plan From Us
                                        </p>
                                    </div>
                                    <div className="pricing-one__points-and-btn">
                                        <ul className="pricing-one__price-points list-unstyled">
                                            <li>
                                                <div className="icon">
                                                    <span className="icon-check"></span>
                                                </div>
                                                <p>Multi-Language Content</p>
                                            </li>
                                            <li>
                                                <div className="icon">
                                                    <span className="icon-check"></span>
                                                </div>
                                                <p>Programmable Chatbots</p>
                                            </li>
                                            <li>
                                                <div className="icon">
                                                    <span className="icon-check"></span>
                                                </div>
                                                <p>Digital Analysis</p>
                                            </li>
                                            <li>
                                                <div className="icon">
                                                    <span className="icon-check"></span>
                                                </div>
                                                <p>Social Media Marketing</p>
                                            </li>
                                            <li>
                                                <div className="icon">
                                                    <span className="icon-check"></span>
                                                </div>
                                                <p>Technical Support</p>
                                            </li>
                                        </ul>
                                        <div className="pricing-one__btn-box">
                                            <Link
                                                to="/pricing"
                                                className="thm-btn"
                                            >
                                                Choose Plan
                                                <span className="fas fa-arrow-right"></span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </FadeInAdvanced>
                        </div>
                        {/*Pricing One Single End*/}
                    </div>
                </div>
            </section>
            {/* Pricing One End */}
        </>
    );
}
