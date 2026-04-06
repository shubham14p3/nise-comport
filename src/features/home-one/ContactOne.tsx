import TextAnimation from "@/components/elements/TextAnimation";
import ContactOneShape1 from "@/assets/images/shapes/contact-one-shape-1.png";
import ContactOneImg1 from "@/assets/images/resources/contact-one-img-1.jpg";

export default function ContactOne() {
    return (
        <>
            {/* Contact One Start */}
            <section className="contact-one" id="contact">
                <div className="contact-one__shape-1 float-bob-x">
                    <img src={ContactOneShape1} />
                </div>
                <div className="contact-one__shape-2"></div>
                <div className="container">
                    <div className="row">
                        {/*Contact One Left Start*/}
                        <div className="col-xl-6 col-lg-6">
                            <div className="contact-one__left">
                                <div className="section-title text-left sec-title-animation animation-style2">
                                    <div className="section-title__tagline-box">
                                        <span className="section-title__tagline">
                                            Get In Touch
                                        </span>
                                    </div>
                                    <h2 className="section-title__title">
                                        <TextAnimation style="s2">
                                            Let’s Talk About Business
                                            <span>Solutions</span> With Us
                                        </TextAnimation>
                                    </h2>
                                </div>
                                <div className="contact-one__img-and-content">
                                    <div className="contact-one__img">
                                        <img src={ContactOneImg1} />
                                    </div>
                                    <div className="contact-one__content">
                                        <p className="contact-one__text">
                                            We're here to listen! Whether you
                                            have questions, feedback, or just
                                            want to say hello, feel free to
                                            reach out.
                                        </p>
                                        <div className="contact-one__call-box">
                                            <div className="icon">
                                                <span className="icon-call"></span>
                                            </div>
                                            <div className="content">
                                                <p>Call Us Any Time</p>
                                                <h3>
                                                    <a href="tel:0882466422710">
                                                        +088 (246) 642-27-10
                                                    </a>
                                                </h3>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/*Contact One Left End*/}
                        {/*Contact One Right Start*/}
                        <div className="col-xl-6 col-lg-6">
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
                        {/*Contact One Right End*/}
                    </div>
                </div>
            </section>
            {/* Contact One End */}
        </>
    );
}
