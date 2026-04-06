import { Link } from "react-router-dom";
import TextAnimation from "@/components/elements/TextAnimation";
import ContactTwoImg1 from "@/assets/images/resources/contact-two-img-1.png";
import ContactTwoBgShape1 from "@/assets/images/shapes/contact-two-bg-shape-1.png";

export default function ContactTwo() {
    return (
        <>
            {/* Contact Two Start */}
            <section className="contact-two">
                <div className="container">
                    <div className="contact-two__inner">
                        <div
                            className="contact-two__bg-shape-1 float-bob-y"
                            style={{
                                backgroundImage: `url(${ContactTwoBgShape1})`,
                            }}
                        ></div>
                        <div className="section-title text-left sec-title-animation animation-style2">
                            <div className="section-title__tagline-box">
                                <span className="section-title__tagline">
                                    Contact US
                                </span>
                            </div>
                            <h2 className="section-title__title">
                                <TextAnimation style="s2">
                                    24/7 Expert Hosting Support <br />
                                    Our Customers Love
                                </TextAnimation>
                            </h2>
                        </div>
                        <div className="contact-two__btn-box">
                            <Link to="/contact" className="thm-btn">
                                Talk to a Specialist
                                <span className="fas fa-arrow-right"></span>
                            </Link>
                        </div>
                        <div className="contact-two__img-1">
                            <img src={ContactTwoImg1} />
                        </div>
                    </div>
                </div>
            </section>
            {/* Contact Two End */}
        </>
    );
}
