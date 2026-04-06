import TextAnimation from "@/components/elements/TextAnimation";
import FadeInAdvanced from "@/components/elements/FadeInAdvanced";

export default function ProcessOne() {
    return (
        <>
            {/*Process One Start */}
            <section className="process-one">
                <div className="process-one__shape-1"></div>
                <div className="container">
                    <div className="section-title text-center sec-title-animation animation-style1">
                        <div className="section-title__tagline-box">
                            <span className="section-title__tagline">
                                Working Process
                            </span>
                        </div>
                        <h2 className="section-title__title">
                            <TextAnimation style="s1">
                                How To Work <span>It</span>
                            </TextAnimation>
                        </h2>
                    </div>
                    <div className="row">
                        {/*Process One Single Start*/}
                        <div className="col-xl-3 col-lg-6 col-md-6">
                            <FadeInAdvanced variant={"fadeInLeft"} delay={100}>
                                <div className="process-one__single-inner">
                                    <div className="process-one__single">
                                        <div className="process-one__icon">
                                            <span className="icon-complete"></span>
                                        </div>
                                        <h3 className="process-one__title">
                                            Choose a project
                                        </h3>
                                        <p className="process-one__text">
                                            Once the strategy is in place, we
                                            move to designing and developing
                                            your vision.
                                        </p>
                                    </div>
                                    <div className="process-one__count"></div>
                                </div>
                            </FadeInAdvanced>
                        </div>
                        {/*Process One Single End*/}
                        {/*Process One Single Start*/}
                        <div className="col-xl-3 col-lg-6 col-md-6">
                            <FadeInAdvanced variant={"fadeInLeft"} delay={200}>
                                <div className="process-one__single-inner">
                                    <div className="process-one__single">
                                        <div className="process-one__icon">
                                            <span className="icon-social-media-marketing"></span>
                                        </div>
                                        <h3 className="process-one__title">
                                            Project analysis
                                        </h3>
                                        <p className="process-one__text">
                                            Once the strategy is in place, we
                                            move to designing and developing
                                            your vision.
                                        </p>
                                    </div>
                                    <div className="process-one__count"></div>
                                </div>
                            </FadeInAdvanced>
                        </div>
                        {/*Process One Single End*/}
                        {/*Process One Single Start*/}
                        <div className="col-xl-3 col-lg-6 col-md-6">
                            <FadeInAdvanced variant={"fadeInRight"} delay={300}>
                                <div className="process-one__single-inner">
                                    <div className="process-one__single">
                                        <div className="process-one__icon">
                                            <span className="icon-execution"></span>
                                        </div>
                                        <h3 className="process-one__title">
                                            Plan Execute
                                        </h3>
                                        <p className="process-one__text">
                                            Once the strategy is in place, we
                                            move to designing and developing
                                            your vision.
                                        </p>
                                    </div>
                                    <div className="process-one__count"></div>
                                </div>
                            </FadeInAdvanced>
                        </div>
                        {/*Process One Single End*/}
                        {/*Process One Single Start*/}
                        <div className="col-xl-3 col-lg-6 col-md-6">
                            <FadeInAdvanced variant={"fadeInRight"} delay={400}>
                                <div className="process-one__single-inner">
                                    <div className="process-one__single">
                                        <div className="process-one__icon">
                                            <span className="icon-results"></span>
                                        </div>
                                        <h3 className="process-one__title">
                                            Deliver result
                                        </h3>
                                        <p className="process-one__text">
                                            Once the strategy is in place, we
                                            move to designing and developing
                                            your vision.
                                        </p>
                                    </div>
                                    <div className="process-one__count"></div>
                                </div>
                            </FadeInAdvanced>
                        </div>
                        {/*Process One Single End*/}
                    </div>
                </div>
            </section>
            {/*Process One End */}
        </>
    );
}
