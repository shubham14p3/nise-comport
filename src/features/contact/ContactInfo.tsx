import FadeInAdvanced from "@/components/elements/FadeInAdvanced";

export default function ContactInfo() {
    return (
        <>
            <section className="contact-info">
                <div className="container">
                    <div className="contact-info__section-head text-center">
                        <span className="contact-info__tagline">Get In Touch</span>
                        <h2 className="contact-info__title">
                            Connect with NISE COMPORT
                        </h2>
                        <p className="contact-info__desc">
                            Visit our office, call us directly, or write to us anytime.
                            We are here to help with digital services, banking support,
                            form filing, insurance, and more.
                        </p>
                    </div>

                    <div className="row">
                        <div className="col-xl-4 col-lg-4 col-md-6">
                            <FadeInAdvanced variant={"fadeInLeft"} delay={100}>
                                <div className="contact-info__single contact-info__single--featured">
                                    <div className="contact-info__icon">
                                        <span className="icon-call"></span>
                                    </div>
                                    <p>Call Us</p>
                                    <h3>
                                        <a href="tel:+919771219893">
                                            (+91) 9771219893
                                        </a>
                                    </h3>
                                    <span className="contact-info__meta">
                                        Quick help and support
                                    </span>
                                </div>
                            </FadeInAdvanced>
                        </div>

                        <div className="col-xl-4 col-lg-4 col-md-6">
                            <FadeInAdvanced variant={"fadeInUp"} delay={200}>
                                <div className="contact-info__single">
                                    <div className="contact-info__icon">
                                        <span className="icon-email"></span>
                                    </div>
                                    <p>Email Us</p>
                                    <h3>
                                        <a href="mailto:info@nisecomport.com">
                                            info@nisecomport.com
                                        </a>
                                    </h3>
                                    <span className="contact-info__meta">
                                        We usually respond promptly
                                    </span>
                                </div>
                            </FadeInAdvanced>
                        </div>

                        <div className="col-xl-4 col-lg-4 col-md-12">
                            <FadeInAdvanced variant={"fadeInRight"} delay={300}>
                                <div className="contact-info__single">
                                    <div className="contact-info__icon">
                                        <span className="icon-pin"></span>
                                    </div>
                                    <p>Our Office Location</p>
                                    <h3>
                                        Shop No 3, Singh Building,
                                        <br />
                                        H M Rd, Kharangajhar Telco,
                                        <br />
                                        Jamshedpur, Jharkhand - 831004
                                    </h3>
                                    <span className="contact-info__meta">
                                        India
                                    </span>
                                </div>
                            </FadeInAdvanced>
                        </div>
                    </div>

                    <div className="contact-info__action-row">
                        <a
                            href="https://g.page/r/Ce3e83XKf9SZEBM/review"
                            target="_blank"
                            rel="noreferrer"
                            className="thm-btn contact-info__action-btn"
                        >
                            Write a Google Review
                            <span className="fas fa-arrow-right"></span>
                        </a>

                        <a
                            href="https://api.whatsapp.com/send?text=NISE%20COMPORT%20would%20love%20your%20feedback.%20Post%20a%20review%20to%20our%20profile.%0Ahttps%3A%2F%2Fg.page%2Fr%2FCe3e83XKf9SZEBM%2Freview"
                            target="_blank"
                            rel="noreferrer"
                            className="thm-btn contact-info__action-btn contact-info__action-btn--alt"
                        >
                            Share Review on WhatsApp
                            <span className="fab fa-whatsapp"></span>
                        </a>
                    </div>
                </div>
            </section>
        </>
    );
}