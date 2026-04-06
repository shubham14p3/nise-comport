import TextAnimation from "@/components/elements/TextAnimation";
import MarqueeSlider from "@/components/elements/MarqueeSlider";
import ContactThreeImg1 from "@/assets/images/resources/contact-three-img-1.png";
import ContactThreeBgShape from "@/assets/images/shapes/contact-three-bg-shape.png";

export default function ContactThree() {
    return (
        <>
            {/* Contact Three Start */}
            <section className="contact-three">
                <div className="contact-three__bg-color">
                    <div
                        className="contact-three__bg-shape"
                        style={{
                            backgroundImage: `url(${ContactThreeBgShape})`,
                        }}
                    ></div>
                </div>
                <ul className="contact-three__sliding-text-list list-unstyled marquee_mode-3">
                    <MarqueeSlider
                        mode="3"
                        className="contact-three__sliding-text-list list-unstyled marquee_mode-3"
                    >
                        <li className="sliding-text-one__item">
                            <h2
                                data-hover="Branding"
                                className="contact-three__sliding-text-title"
                            >
                                GET IN TOUCH *
                            </h2>
                        </li>
                        <li className="sliding-text-one__item">
                            <h2
                                data-hover="Branding"
                                className="contact-three__sliding-text-title"
                            >
                                GET IN TOUCH *
                            </h2>
                        </li>
                        <li className="sliding-text-one__item">
                            <h2
                                data-hover="Branding"
                                className="contact-three__sliding-text-title"
                            >
                                GET IN TOUCH *
                            </h2>
                        </li>
                    </MarqueeSlider>
                </ul>
                <div className="container">
                    <div className="row">
                        <div className="col-xl-6">
                            <div className="contact-three__left">
                                <div className="section-title text-left sec-title-animation animation-style2">
                                    <div className="section-title__tagline-box">
                                        <span className="section-title__tagline">
                                            Get In Touch
                                        </span>
                                    </div>
                                    <h2 className="section-title__title">
                                        <TextAnimation style="s2">
                                            Conversation
                                            <span>– Reach</span>
                                            <br />
                                            <span>Out Anytime</span>
                                        </TextAnimation>
                                    </h2>
                                </div>
                                <p className="contact-three__text">
                                    We're here to listen! Whether you have
                                    questions, feedback,
                                    <br />
                                    or just want to say hello, feel free to
                                    reach out.
                                </p>
                                <ul className="contact-three__contact-list list-unstyled">
                                    <li>
                                        <div className="icon">
                                            <span className="icon-email"></span>
                                        </div>
                                        <div className="content">
                                            <span>Email Us</span>
                                            <p>
                                                <a href="mailto:info@domain.com">
                                                    info@domain.com
                                                </a>
                                            </p>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="icon">
                                            <span className="icon-call"></span>
                                        </div>
                                        <div className="content">
                                            <span>Contact US</span>
                                            <p>
                                                <a href="tel:9900567780">
                                                    +99 (00) 567 780
                                                </a>
                                            </p>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="icon">
                                            <span className="icon-pin"></span>
                                        </div>
                                        <div className="content">
                                            <span>Our Address</span>
                                            <p>
                                                1629 N. Dixie Avenue,
                                                <br /> Kentucky, 42701
                                            </p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="col-xl-6">
                            <div className="contact-three__right">
                                <div className="contact-three__img-1">
                                    <img src={ContactThreeImg1} />
                                </div>
                                <div className="contact-one__right">
                                    <form className="contact-form-validated contact-one__form">
                                        <div className="row">
                                            <div className="col-xl-6 col-lg-6 col-md-6">
                                                <h4 className="contact-one__input-title">
                                                    Full Name
                                                </h4>
                                                <div className="contact-one__input-box">
                                                    <div className="contact-one__input-icon">
                                                        <span className="icon-user"></span>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        placeholder="Thomas Alison"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-xl-6 col-lg-6 col-md-6">
                                                <h4 className="contact-one__input-title">
                                                    Email Address
                                                </h4>
                                                <div className="contact-one__input-box">
                                                    <div className="contact-one__input-icon">
                                                        <span className="icon-mail"></span>
                                                    </div>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        placeholder="thomas@domain.com"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-xl-6 col-lg-6 col-md-6">
                                                <h4 className="contact-one__input-title">
                                                    Phone Number
                                                </h4>
                                                <div className="contact-one__input-box">
                                                    <div className="contact-one__input-icon">
                                                        <span className="icon-phone-call"></span>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        name="Phone"
                                                        placeholder="+12 (00) 123 4567 890"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-xl-6 col-lg-6 col-md-6">
                                                <h4 className="contact-one__input-title">
                                                    Subject
                                                </h4>
                                                <div className="contact-one__input-box">
                                                    <div className="contact-one__input-icon">
                                                        <span className="icon-edit"></span>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        name="subject"
                                                        placeholder="Subject"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-xl-12">
                                            <h4 className="contact-one__input-title">
                                                Inquiry about
                                            </h4>
                                            <div className="contact-one__input-box text-message-box">
                                                <div className="contact-one__input-icon">
                                                    <span className="icon-edit"></span>
                                                </div>
                                                <textarea
                                                    name="message"
                                                    placeholder="Write your message"
                                                ></textarea>
                                            </div>
                                            <div className="contact-one__btn-box">
                                                <button
                                                    type="submit"
                                                    className="thm-btn"
                                                >
                                                    Submit Now
                                                    <span className="fas fa-arrow-right"></span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="result"></div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* Contact Three End */}
        </>
    );
}
