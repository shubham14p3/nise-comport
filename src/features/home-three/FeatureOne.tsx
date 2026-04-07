import { Link } from "react-router-dom";
import FadeInAdvanced from "@/components/elements/FadeInAdvanced";
import FeatureOneShape3 from "@/assets/images/shapes/feature-one-shape-3.png";
import FeatureOneImg11 from "@/assets/images/resources/feature-one-img-1-1.png";
import FeatureOneImg12 from "@/assets/images/resources/feature-one-img-1-2.png";
import FeatureOneImg13 from "@/assets/images/resources/feature-one-img-1-3.png";

export default function FeatureOne() {
    return (
        <>
            {/*Feature One Start*/}
            <section className="feature-one">
                <div className="feature-one__shape-1"></div>
                <div className="feature-one__shape-2"></div>
                <div className="feature-one__shape-3 float-bob-y">
                    <img src={FeatureOneShape3} />
                </div>
                <div className="container">
                    <div className="row">
                        {/*Feature One Single Start */}
                        <div className="col-xl-4 col-lg-4">
                            <FadeInAdvanced variant={"fadeInUp"} delay={100}>
                                <div className="feature-one__single">
                                    <div className="feature-one__img">
                                        <img src={FeatureOneImg11} />
                                    </div>
                                    <h3 className="feature-one__title">
                                        <Link to="/fee-payment">
                                            Security Services
                                        </Link>
                                    </h3>
                                    <p className="feature-one__text">
                                        Innovating and empowering businesses
                                        with tailored solutions for success and
                                        growth. Innovating and empowering
                                    </p>
                                </div>
                            </FadeInAdvanced>
                        </div>
                        {/*Feature One Single End */}
                        {/*Feature One Single Start */}
                        <div className="col-xl-4 col-lg-4">
                            <FadeInAdvanced variant={"fadeInUp"} delay={300}>
                                <div className="feature-one__single">
                                    <div className="feature-one__img">
                                        <img src={FeatureOneImg12} />
                                    </div>
                                    <h3 className="feature-one__title">
                                        <Link to="/form-filing">
                                            Data Privacy
                                        </Link>
                                    </h3>
                                    <p className="feature-one__text">
                                        Innovating and empowering businesses
                                        with tailored solutions for success and
                                        growth. Innovating and empowering
                                    </p>
                                </div>
                            </FadeInAdvanced>
                        </div>
                        {/*Feature One Single End */}
                        {/*Feature One Single Start */}
                        <div className="col-xl-4 col-lg-4">
                            <FadeInAdvanced variant={"fadeInUp"} delay={500}>
                                <div className="feature-one__single">
                                    <div className="feature-one__img">
                                        <img src={FeatureOneImg13} />
                                    </div>
                                    <h3 className="feature-one__title">
                                        <Link to="/insurance">
                                            Industry Certified
                                        </Link>
                                    </h3>
                                    <p className="feature-one__text">
                                        Innovating and empowering businesses
                                        with tailored solutions for success and
                                        growth. Innovating and empowering
                                    </p>
                                </div>
                            </FadeInAdvanced>
                        </div>
                        {/*Feature One Single End */}
                    </div>
                </div>
            </section>
            {/*Feature One End*/}
        </>
    );
}
