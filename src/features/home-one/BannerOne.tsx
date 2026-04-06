import { Link } from "react-router-dom";
import FadeInAdvanced from '@/components/elements/FadeInAdvanced';
import BannerOneShape4 from "@/assets/images/shapes/banner-one-shape-4.png";
import BannerOneShape6 from "@/assets/images/shapes/banner-one-shape-6.png";
import BannerOneImg1 from "@/assets/images/resources/banner-one-img-1.png";
import BannerOneImgShape5 from "@/assets/images/shapes/banner-one-img-shape-5.png";
import YoutubeFrem from "@/components/elements/YoutubeFrem";

export default function BannerOne() {
    return (
        <>
            {/* Banner One Start */}
            <section className="banner-one" id="home">

                <FadeInAdvanced
                    variant="fadeInUp"
                    duration={1000}
                    delay={800}
                >
                    <div
                        className="banner-one__shape-1"
                    >

                    </div>
                </FadeInAdvanced>
                <FadeInAdvanced
                    variant="fadeInUp"
                    duration={1000}
                    delay={1000}
                >
                    <div
                        className="banner-one__shape-2"
                    ></div>
                </FadeInAdvanced>

                <div className="banner-one__shape-3 img-bounce-two"></div>
                <div className="banner-one__shape-4 float-bob-x">
                    <img src={BannerOneShape4} />
                </div>
                <div className="banner-one__shape-5 float-bob-y"></div>
                <div className="banner-one__shape-6 float-bob-y">
                    <img src={BannerOneShape6} className="rotate-me" />
                </div>
                <div className="container">
                    <div className="banner-one__inner">
                        <div className="banner-one__img-box">
                            <FadeInAdvanced
                                variant="fadeInLeft"
                                duration={1000}
                                delay={1000}
                            >
                                <div
                                    className="banner-one__img"
                                >
                                    <img src={BannerOneImg1} />
                                </div>
                            </FadeInAdvanced>
                            <div className="banner-one__img-shape-1"></div>
                            <div className="banner-one__img-shape-2 float-bob"></div>
                            <div className="banner-one__img-shape-3 float-bob-y"></div>
                            <div className="banner-one__img-shape-4 float-bob-x"></div>
                            <div className="banner-one__img-shape-5 float-bob-y">
                                <img
                                    src={BannerOneImgShape5}
                                    className="rotate-me"
                                />
                            </div>
                        </div>
                        <div className="banner-one__content">

                            <FadeInAdvanced
                                variant="fadeInRight"
                                duration={1000}
                                delay={0}>
                                <div
                                    className="banner-one__sub-title-box"
                                >
                                    <p className="banner-one__sub-title">
                                        Best it Solution Service
                                    </p>
                                </div>
                            </FadeInAdvanced>


                            <FadeInAdvanced
                                variant="fadeInLeft"
                                duration={1000}
                                delay={500}>

                                <h2
                                    className="banner-one__title"
                                >
                                    Modern Your Business
                                    <br /> With <span>IT service.</span>
                                </h2>
                            </FadeInAdvanced>
                            <FadeInAdvanced

                                variant="fadeInUp"
                                duration={1000}
                                delay={800}>
                                <p
                                    className="banner-one__text"
                                >
                                    IT solutions refer to a broad range of services
                                    and technologies designed to address
                                    <br /> specific business needs, streamline
                                    operations, and drive growth.
                                </p>
                            </FadeInAdvanced>
                            <FadeInAdvanced
                                variant="fadeInUp"
                                duration={1000}
                                delay={1000}>
                                <div
                                    className="banner-one__btn-box"
                                >
                                    <div className="banner-one__btn">
                                        <Link to="/about" className="thm-btn">
                                            Discover More
                                            <span className="fas fa-arrow-right"></span>
                                        </Link>
                                    </div>
                                    <div className="banner-one__btn">
                                        <Link to="/contact" className="thm-btn">
                                            Let's Talk
                                            <span className="fas fa-arrow-right"></span>
                                        </Link>
                                    </div>
                                </div>
                            </FadeInAdvanced>

                        </div>
                        <div className="banner-one__video-link">
                            <YoutubeFrem className="video-popup" video="https://www.youtube.com/watch?v=rbFoRH2deeY">
                                <div className="banner-one__video-icon">
                                    <span className="fa fa-play"></span>
                                    <i className="ripple"></i>
                                </div>
                            </YoutubeFrem>
                        </div>
                    </div>
                </div>
            </section>
            {/*Banner One End */}
        </>
    );
}
