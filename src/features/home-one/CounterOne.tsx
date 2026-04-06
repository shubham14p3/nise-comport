import CounterUp from "@/components/elements/CounterUp";
import FadeInAdvanced from "@/components/elements/FadeInAdvanced";
import CounterOneBgShape from "@/assets/images/shapes/counter-one-bg-shape.png";

export default function CounterOne() {
    return (
        <>
            {/*Counter One Start */}
            <section className="counter-one">
                <div
                    className="counter-one__bg-shape float-bob-y"
                    style={{ backgroundImage: `url(${CounterOneBgShape})` }}
                ></div>
                <div className="container">
                    <div className="row">
                        {/*Counter One Single Start*/}
                        <div className="col-xl-3 col-lg-6 col-md-6">
                            <FadeInAdvanced variant={"fadeInLeft"} delay={100}>
                                <div className="counter-one__single">
                                    <div className="counter-one__icon">
                                        <span className="icon-complete"></span>
                                    </div>
                                    <div className="counter-one__content count-box">
                                        <h3 className="counter-one__count">
                                            <span>
                                                <CounterUp
                                                    ending={1.9}
                                                    duration={1500}
                                                />
                                            </span>
                                            K
                                        </h3>
                                        <p className="counter-one__text">
                                            Project Completed
                                        </p>
                                    </div>
                                </div>
                            </FadeInAdvanced>
                        </div>
                        {/*Counter One Single End*/}
                        {/*Counter One Single Start*/}
                        <div className="col-xl-3 col-lg-6 col-md-6">
                            <FadeInAdvanced variant={"fadeInLeft"} delay={200}>
                                <div className="counter-one__single">
                                    <div className="counter-one__icon">
                                        <span className="icon-costumer"></span>
                                    </div>
                                    <div className="counter-one__content count-box">
                                        <h3 className="counter-one__count">
                                            <span>
                                                <CounterUp
                                                    ending={25}
                                                    duration={1500}
                                                />
                                            </span>
                                            M
                                        </h3>
                                        <p className="counter-one__text">
                                            Happy Clients Review
                                        </p>
                                    </div>
                                </div>
                            </FadeInAdvanced>
                        </div>
                        {/*Counter One Single End*/}
                        {/*Counter One Single Start*/}
                        <div className="col-xl-3 col-lg-6 col-md-6">
                            <FadeInAdvanced variant={"fadeInRight"} delay={300}>
                                <div className="counter-one__single">
                                    <div className="counter-one__icon">
                                        <span className="icon-customer"></span>
                                    </div>
                                    <div className="counter-one__content count-box">
                                        <h3 className="counter-one__count">
                                            <span>
                                                <CounterUp
                                                    ending={350}
                                                    duration={1500}
                                                />
                                            </span>
                                            +
                                        </h3>
                                        <p className="counter-one__text">
                                            Expert Team Members
                                        </p>
                                    </div>
                                </div>
                            </FadeInAdvanced>
                        </div>
                        {/*Counter One Single End*/}
                        {/*Counter One Single Start*/}
                        <div className="col-xl-3 col-lg-6 col-md-6">
                            <FadeInAdvanced variant={"fadeInRight"} delay={400}>
                                <div className="counter-one__single">
                                    <div className="counter-one__icon">
                                        <span className="icon-trophy"></span>
                                    </div>
                                    <div className="counter-one__content count-box">
                                        <h3 className="counter-one__count">
                                            <span>
                                                <CounterUp
                                                    ending={458}
                                                    duration={1500}
                                                />
                                            </span>
                                            +
                                        </h3>
                                        <p className="counter-one__text">
                                            Creative Plus award
                                        </p>
                                    </div>
                                </div>
                            </FadeInAdvanced>
                        </div>
                        {/*Counter One Single End*/}
                    </div>
                </div>
                <div id="particles-js"></div>
            </section>
            {/*Counter One End */}
        </>
    );
}
