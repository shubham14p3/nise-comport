import TextAnimation from "@/components/elements/TextAnimation";
import MarqueeSlider from "@/components/elements/MarqueeSlider";
import FadeInAdvanced from "@/components/elements/FadeInAdvanced";
import WhyChooseTwoShape1 from "@/assets/images/shapes/why-choose-two-shape-1.png";
import WhyChooseTwoImg1 from "@/assets/images/resources/why-choose-two-img-1.png";
import WhyChooseTwoBgShape from "@/assets/images/shapes/why-choose-two-bg-shape.png";

export default function WhyChooseTwo() {
    return (
        <>
            {/*Why Choose Two Start */}
            <section className="why-choose-two">
                <ul className="why-choose-two__sliding-text-list list-unstyled marquee_mode-2">
                    <MarqueeSlider
                        mode="2"
                        className="why-choose-two__sliding-text-list list-unstyled marquee_mode-2"
                    >
                        <li className="sliding-text-one__item">
                            <h2
                                data-hover="Branding"
                                className="why-choose-two__sliding-text-title"
                            >
                                Why Chooses Us *
                            </h2>
                        </li>
                        <li className="sliding-text-one__item">
                            <h2
                                data-hover="Branding"
                                className="why-choose-two__sliding-text-title"
                            >
                                Why Chooses Us *
                            </h2>
                        </li>
                        <li className="sliding-text-one__item">
                            <h2
                                data-hover="Branding"
                                className="why-choose-two__sliding-text-title"
                            >
                                Why Chooses Us *
                            </h2>
                        </li>
                    </MarqueeSlider>
                </ul>
                <div
                    className="why-choose-two__bg-shape"
                    style={{ backgroundImage: `url(${WhyChooseTwoBgShape})` }}
                >
                    <div className="why-choose-two__shape-2"></div>
                    <div className="why-choose-two__shape-3"></div>
                </div>
                <div className="why-choose-two__shape-1 float-bob-y">
                    <img src={WhyChooseTwoShape1} />
                </div>
                <div className="container">
                    <div className="row">
                        <div className="col-xl-6">
                            <div className="why-choose-two__left">
                                <div className="section-title text-left sec-title-animation animation-style2">
                                    <div className="section-title__tagline-box">
                                        <span className="section-title__tagline">
                                            Why Chooses Us
                                        </span>
                                    </div>
                                    <h2 className="section-title__title">
                                        <TextAnimation style="s2">
                                            Why You should Choose Our Technology
                                            Company?
                                        </TextAnimation>
                                    </h2>
                                </div>
                                <ul className="why-choose-two__list list-unstyled">
                                    <li>
                                        <div className="why-choose-two__icon">
                                            <span className="icon-financial"></span>
                                        </div>
                                        <div className="why-choose-two__content">
                                            <h3 className="why-choose-two__title">
                                                Industry Experience
                                            </h3>
                                            <p className="why-choose-two__text">
                                                Innovating and empowering
                                                businesses with tailored
                                                solutions for success and
                                                growth. Innovating and
                                                empowering
                                            </p>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="why-choose-two__icon">
                                            <span className="icon-implement"></span>
                                        </div>
                                        <div className="why-choose-two__content">
                                            <h3 className="why-choose-two__title">
                                                Executing the Right Strategies
                                                with Precision
                                            </h3>
                                            <p className="why-choose-two__text">
                                                Innovating and empowering
                                                businesses with tailored
                                                solutions for success and
                                                growth. Innovating and
                                                empowering
                                            </p>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="why-choose-two__icon">
                                            <span className="icon-digital-service"></span>
                                        </div>
                                        <div className="why-choose-two__content">
                                            <h3 className="why-choose-two__title">
                                                Smooth Solutions for Your Tech
                                                Troubles
                                            </h3>
                                            <p className="why-choose-two__text">
                                                Innovating and empowering
                                                businesses with tailored
                                                solutions for success and
                                                growth. Innovating and
                                                empowering
                                            </p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="col-xl-6">
                            <div className="why-choose-two__right">
                                <div className="why-choose-two__img">
                                    <FadeInAdvanced
                                        variant={"slideInRight"}
                                        delay={100}
                                        duration={2500}
                                    >
                                        <img
                                            src={WhyChooseTwoImg1}
                                            className="float-bob-x"
                                        />
                                    </FadeInAdvanced>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/*Why Choose Two End */}
        </>
    );
}
