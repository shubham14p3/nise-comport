import MarqueeSlider from "@/components/elements/MarqueeSlider";

export default function SlidingTextOne() {
    return (
        <>
            {/* Sliding Text One Start */}
            <section className="sliding-text-one">
                <div className="sliding-text-one__wrap">
                    <ul className="sliding-text-one__list list-unstyled marquee_mode-1">
                        <MarqueeSlider
                            mode="1"
                            className="sliding-text-one__list list-unstyled marquee_mode-1"
                        >
                            <li className="sliding-text-one__item">
                                <h2
                                    data-hover="Banking"
                                    className="sliding-text-one__title"
                                >
                                    Banking
                                </h2>
                                <span className="icon-star"></span>
                            </li>
                            <li className="sliding-text-one__item">
                                <h2
                                    data-hover="Insurance"
                                    className="sliding-text-one__title"
                                >
                                    Insurance
                                </h2>
                                <span className="icon-star"></span>
                            </li>
                            <li className="sliding-text-one__item">
                                <h2
                                    data-hover="Education"
                                    className="sliding-text-one__title"
                                >
                                    Education
                                </h2>
                                <span className="icon-star"></span>
                            </li>
                            <li className="sliding-text-one__item">
                                <h2
                                    data-hover="BRANDING"
                                    className="sliding-text-one__title"
                                >
                                    BRANDING
                                </h2>
                                <span className="icon-star"></span>
                            </li>
                            <li className="sliding-text-one__item">
                                <h2
                                    data-hover="Cyber Security"
                                    className="sliding-text-one__title"
                                >
                                    Cyber Security
                                </h2>
                                <span className="icon-star"></span>
                            </li>
                            <li className="sliding-text-one__item">
                                <h2
                                    data-hover="Website design"
                                    className="sliding-text-one__title"
                                >
                                    Website design
                                </h2>
                                <span className="icon-star"></span>
                            </li>
                            <li className="sliding-text-one__item">
                                <h2
                                    data-hover="Form Filing"
                                    className="sliding-text-one__title"
                                >
                                    Form Filing
                                </h2>
                                <span className="icon-star"></span>
                            </li>
                            <li className="sliding-text-one__item">
                                <h2
                                    data-hover="Website design"
                                    className="sliding-text-one__title"
                                >
                                    Website design
                                </h2>
                                <span className="icon-star"></span>
                            </li>
                        </MarqueeSlider>
                    </ul>
                </div>
            </section>
            {/* Sliding Text One End */}
        </>
    );
}
