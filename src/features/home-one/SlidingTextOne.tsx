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
                                    data-hover="UI/UX Design"
                                    className="sliding-text-one__title"
                                >
                                    UI/UX Design
                                </h2>
                                <span className="icon-star"></span>
                            </li>
                            <li className="sliding-text-one__item">
                                <h2
                                    data-hover="Product Design"
                                    className="sliding-text-one__title"
                                >
                                    Product Design
                                </h2>
                                <span className="icon-star"></span>
                            </li>
                            <li className="sliding-text-one__item">
                                <h2
                                    data-hover="Web Development"
                                    className="sliding-text-one__title"
                                >
                                    Web Development
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
                                    data-hover="Digital Marketing"
                                    className="sliding-text-one__title"
                                >
                                    Digital Marketing
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
