import CounterUp from "@/components/elements/CounterUp";
import FadeInAdvanced from "@/components/elements/FadeInAdvanced";
import CounterTwoBgShape from "@/assets/images/shapes/counter-two-bg-shape.png";

export default function CounterTwo() {
    return (
        <>
            {/* Counter Two Start */}
            <section className="counter-two">
                <div
                    className="counter-two__bg-shape float-bob-y"
                    style={{ backgroundImage: `url(${CounterTwoBgShape})` }}
                ></div>
                <div className="container">
                    <div className="row">
                        {/*Counter Two Single Start*/}
                        <div className="col-xl-3 col-lg-6 col-md-6">
                            <FadeInAdvanced variant={"fadeInLeft"} delay={100}>
                                <div className="counter-two__single">
                                    <div className="counter-two__icon">
                                        <span className="icon-trophy"></span>
                                    </div>
                                    <div className="counter-two__content">
                                        <div className="counter-two__count-box">
                                            <h3>
                                                <CounterUp ending={120} />
                                            </h3>
                                            <span>+</span>
                                        </div>
                                        <p className="counter-two__text">
                                            award Winning
                                        </p>
                                    </div>
                                </div>
                            </FadeInAdvanced>
                        </div>
                        {/*Counter Two Single End*/}
                        {/*Counter Two Single Start*/}
                        <div className="col-xl-3 col-lg-6 col-md-6">
                            <FadeInAdvanced variant={"fadeInLeft"} delay={200}>
                                <div className="counter-two__single">
                                    <div className="counter-two__icon">
                                        <span className="icon-costumer"></span>
                                    </div>
                                    <div className="counter-two__content">
                                        <div className="counter-two__count-box">
                                            <h3>
                                                <CounterUp ending={99} />
                                            </h3>
                                            <span>%</span>
                                        </div>
                                        <p className="counter-two__text">
                                            Satisfied client
                                        </p>
                                    </div>
                                </div>
                            </FadeInAdvanced>
                        </div>
                        {/*Counter Two Single End*/}
                        {/*Counter Two Single Start*/}
                        <div className="col-xl-3 col-lg-6 col-md-6">
                            <FadeInAdvanced variant={"fadeInRight"} delay={300}>
                                <div className="counter-two__single">
                                    <div className="counter-two__icon">
                                        <span className="icon-rating"></span>
                                    </div>
                                    <div className="counter-two__content">
                                        <div className="counter-two__count-box">
                                            <h3>
                                                <CounterUp ending={10} />
                                            </h3>
                                            <span>M</span>
                                        </div>
                                        <p className="counter-two__text">
                                            worldwide reviews
                                        </p>
                                    </div>
                                </div>
                            </FadeInAdvanced>
                        </div>
                        {/*Counter Two Single End*/}
                        {/*Counter Two Single Start*/}
                        <div className="col-xl-3 col-lg-6 col-md-6">
                            <FadeInAdvanced variant={"fadeInRight"} delay={400}>
                                <div className="counter-two__single">
                                    <div className="counter-two__icon">
                                        <span className="icon-customer"></span>
                                    </div>
                                    <div className="counter-two__content">
                                        <div className="counter-two__count-box">
                                            <h3>
                                                <CounterUp ending={200} />
                                            </h3>
                                            <span>+</span>
                                        </div>
                                        <p className="counter-two__text">
                                            Happy Clients
                                        </p>
                                    </div>
                                </div>
                            </FadeInAdvanced>
                        </div>
                        {/*Counter Two Single End*/}
                    </div>
                </div>
            </section>
            {/* Counter Two End */}
        </>
    );
}
