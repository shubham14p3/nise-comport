import FadeInAdvanced from "@/components/elements/FadeInAdvanced";

export default function ContactInfo() {
    return (
        <>
            {/*Contact Info Start*/}
            <section className="contact-info">
                <div className="container">
                    <div className="row">
                        {/*Contact Two Single Start*/}
                        <div className="col-xl-4 col-lg-4">
                            <FadeInAdvanced variant={"fadeInLeft"} delay={100}>
                                <div className="contact-info__single">
                                    <div className="contact-info__icon">
                                        <span className="icon-call"></span>
                                    </div>
                                    <p>Contact Us</p>
                                    <h3>
                                        <a href="tel:558270575405">
                                            +55 827 057 5405
                                        </a>
                                    </h3>
                                </div>
                            </FadeInAdvanced>
                        </div>
                        {/*Contact Two Single End*/}
                        {/*Contact Two Single Start*/}
                        <div className="col-xl-4 col-lg-4">
                            <FadeInAdvanced variant={"fadeInUp"} delay={200}>
                                <div className="contact-info__single">
                                    <div className="contact-info__icon">
                                        <span className="icon-email"></span>
                                    </div>
                                    <p>Email Us</p>
                                    <h3>
                                        <a href="mailto:example@gamil.com">
                                            example@gamil.com
                                        </a>
                                    </h3>
                                </div>
                            </FadeInAdvanced>
                        </div>
                        {/*Contact Two Single End*/}
                        {/*Contact Two Single Start*/}
                        <div className="col-xl-4 col-lg-4">
                            <FadeInAdvanced variant={"fadeInRight"} delay={300}>
                                <div className="contact-info__single">
                                    <div className="contact-info__icon">
                                        <span className="icon-pin"></span>
                                    </div>
                                    <p>Our Office Location</p>
                                    <h3>12 Green Road 05 New Yark</h3>
                                </div>
                            </FadeInAdvanced>
                        </div>
                        {/*Contact Two Single End*/}
                    </div>
                </div>
            </section>
            {/*Contact Info End*/}
        </>
    );
}
