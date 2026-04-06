import TextAnimation from "@/components/elements/TextAnimation";

export default function TeamDetailsContact() {
    return (
        <>
            {/*Team Details Contact Start*/}
            <section className="team-details-contact">
                <div className="container">
                    <div className="section-title text-center sec-title-animation animation-style1">
                        <div className="section-title__tagline-box">
                            <span className="section-title__tagline">
                                Contact Our Team
                            </span>
                        </div>
                        <h2 className="section-title__title">
                            <TextAnimation style="s1">
                                Give Us A <span>Message</span>
                            </TextAnimation>
                        </h2>
                    </div>
                    <div className="team-details-contact__inner">
                        <form className="contact-form-validated team-details-contact__form">
                            <div className="row">
                                <div className="col-xl-6 col-lg-6 col-md-6">
                                    <div className="team-details-contact__input-box">
                                        <input
                                            type="text"
                                            name="name"
                                            placeholder="Your Name"
                                        />
                                    </div>
                                </div>
                                <div className="col-xl-6 col-lg-6 col-md-6">
                                    <div className="team-details-contact__input-box">
                                        <input
                                            type="email"
                                            name="Email"
                                            placeholder="Email Address"
                                        />
                                    </div>
                                </div>
                                <div className="col-xl-6 col-lg-6 col-md-6">
                                    <div className="team-details-contact__input-box">
                                        <input
                                            type="text"
                                            name="Phone"
                                            placeholder="Phone Number"
                                        />
                                    </div>
                                </div>
                                <div className="col-xl-6 col-lg-6 col-md-6">
                                    <div className="team-details-contact__input-box">
                                        <input
                                            type="text"
                                            name="subject"
                                            placeholder="Subject"
                                        />
                                    </div>
                                </div>
                                <div className="col-xl-12">
                                    <div className="team-details-contact__input-box text-message-box">
                                        <textarea
                                            name="message"
                                            placeholder="Messege"
                                        ></textarea>
                                    </div>
                                    <div className="team-details-contact__btn-box">
                                        <button
                                            type="submit"
                                            className="thm-btn"
                                        >
                                            send a message
                                            <span className="fas fa-arrow-right"></span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="result"></div>
                        </form>
                    </div>
                </div>
            </section>
            {/*Team Details Contact End*/}
        </>
    );
}
