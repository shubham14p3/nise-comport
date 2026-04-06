import TextAnimation from "@/components/elements/TextAnimation";
import ProcessTwoBgShape from "@/assets/images/shapes/process-two-bg-shape.png";

export default function ProcessTwo() {
    return (
        <>
            {/* Process Two Start */}
            <section className="process-two">
                <div
                    className="process-two__bg-shape"
                    style={{ backgroundImage: `url(${ProcessTwoBgShape})` }}
                ></div>
                <div className="container">
                    <div className="section-title text-center sec-title-animation animation-style1">
                        <div className="section-title__tagline-box">
                            <span className="section-title__tagline">
                                Working Process
                            </span>
                        </div>
                        <h2 className="section-title__title">
                            <TextAnimation style="s1">
                                How we <span>works</span>
                            </TextAnimation>
                        </h2>
                    </div>
                    <ul className="row list-unstyled">
                        {/* Process One Single Start */}
                        <li
                            className="col-xl-3 col-lg-6 col-md-6 wow fadeInLeft"
                            data-wow-delay="100ms"
                            data-wow-duration="1500ms"
                        >
                            <div className="process-two__single">
                                <div className="process-two__single-shape-1"></div>
                                <div className="process-two__single-shape-2"></div>
                                <div className="process-two__icon">
                                    <span className="icon-self-service"></span>
                                </div>
                                <div className="process-two__count"></div>
                                <h3 className="process-two__title">
                                    Choose a Service
                                </h3>
                                <p className="process-two__text">
                                    Continua scale empowered metrics with cost
                                    effective innovation.
                                </p>
                            </div>
                        </li>
                        {/* Process One Single End */}
                        {/* Process One Single Start */}
                        <li
                            className="col-xl-3 col-lg-6 col-md-6 wow fadeInLeft"
                            data-wow-delay="300ms"
                            data-wow-duration="1500ms"
                        >
                            <div className="process-two__single process-two__single-margin">
                                <div className="process-two__single-shape-1"></div>
                                <div className="process-two__single-shape-2"></div>
                                <div className="process-two__icon">
                                    <span className="icon-conference"></span>
                                </div>
                                <div className="process-two__count"></div>
                                <h3 className="process-two__title">
                                    Request a Meeting
                                </h3>
                                <p className="process-two__text">
                                    Continua scale empowered metrics with cost
                                    effective innovation.
                                </p>
                            </div>
                        </li>
                        {/* Process One Single End */}
                        {/* Process One Single Start */}
                        <li
                            className="col-xl-3 col-lg-6 col-md-6 wow fadeInRight"
                            data-wow-delay="500ms"
                            data-wow-duration="1500ms"
                        >
                            <div className="process-two__single">
                                <div className="process-two__single-shape-1"></div>
                                <div className="process-two__single-shape-2"></div>
                                <div className="process-two__icon">
                                    <span className="icon-execution"></span>
                                </div>
                                <div className="process-two__count"></div>
                                <h3 className="process-two__title">
                                    Receive Custom Plan
                                </h3>
                                <p className="process-two__text">
                                    Continua scale empowered metrics with cost
                                    effective innovation.
                                </p>
                            </div>
                        </li>
                        {/* Process One Single End */}
                        {/* Process One Single Start */}
                        <li
                            className="col-xl-3 col-lg-6 col-md-6 wow fadeInRight"
                            data-wow-delay="700ms"
                            data-wow-duration="1500ms"
                        >
                            <div className="process-two__single process-two__single-margin">
                                <div className="process-two__single-shape-1"></div>
                                <div className="process-two__single-shape-2"></div>
                                <div className="process-two__icon">
                                    <span className="icon-results"></span>
                                </div>
                                <div className="process-two__count"></div>
                                <h3 className="process-two__title">
                                    Let’s Make it Happen
                                </h3>
                                <p className="process-two__text">
                                    Continua scale empowered metrics with cost
                                    effective innovation.
                                </p>
                            </div>
                        </li>
                        {/* Process One Single End */}
                    </ul>
                </div>
            </section>
            {/* Process One End */}
        </>
    );
}
