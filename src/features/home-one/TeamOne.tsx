import { Link } from "react-router-dom";
import TextAnimation from "@/components/elements/TextAnimation";
import FadeInAdvanced from "@/components/elements/FadeInAdvanced";
import TeamOneShape1 from "@/assets/images/shapes/team-one-shape-1.png";
import TeamOneShape2 from "@/assets/images/shapes/team-one-shape-2.png";
import Team11 from "@/assets/images/team/team-1-1.jpg";
import Team12 from "@/assets/images/team/team-1-2.jpg";
import Team13 from "@/assets/images/team/team-1-3.jpg";
import Team14 from "@/assets/images/team/team-1-4.jpg";
import TeamOneContentBgShape from "@/assets/images/shapes/team-one-content-bg-shape.png";

export default function TeamOne() {
    return (
        <>
            {/*Team One Start */}
            <section className="team-one" id="team">
                <div className="team-one__shape-1 rotate-me">
                    <img src={TeamOneShape1} />
                </div>
                <div className="team-one__shape-2 float-bob-x">
                    <img src={TeamOneShape2} />
                </div>
                <div className="container">
                    <div className="section-title text-center sec-title-animation animation-style1">
                        <div className="section-title__tagline-box">
                            <span className="section-title__tagline">
                                Our expert team
                            </span>
                        </div>
                        <h2 className="section-title__title">
                            <TextAnimation style="s1">
                                We have world expert <span>team</span>
                            </TextAnimation>
                        </h2>
                    </div>
                    <div className="row">
                        {/*Team One Single Start*/}
                        <div className="col-xl-3 col-lg-6 col-md-6">
                            <FadeInAdvanced variant={"fadeInLeft"} delay={100}>
                                <div className="team-one__single">
                                    <div className="team-one__img-box">
                                        <div className="team-one__img">
                                            <img src={Team11} />
                                        </div>
                                        <div className="team-one__arrow-and-social">
                                            <div className="team-one__arrow">
                                                <span className="icon-share"></span>
                                            </div>
                                            <ul className="team-one__social list-unstyled">
                                                <li>
                                                    <Link to="#">
                                                        <span className="icon-facebook-app-symbol"></span>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to="#">
                                                        <span className="icon-twitter"></span>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to="#">
                                                        <span className="icon-pinterest"></span>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to="#">
                                                        <span className="icon-linkedin"></span>
                                                    </Link>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="team-one__content">
                                        <div
                                            className="team-one__content-bg-shape"
                                            style={{
                                                backgroundImage: `url(${TeamOneContentBgShape})`,
                                            }}
                                        ></div>
                                        <h3 className="team-one__name">
                                            <Link to="/team-details">
                                                James Carter
                                            </Link>
                                        </h3>
                                        <p className="team-one__sub-title">
                                            CEO & Founder
                                        </p>
                                    </div>
                                </div>
                            </FadeInAdvanced>
                        </div>
                        {/*Team One Single End*/}
                        {/*Team One Single Start*/}
                        <div className="col-xl-3 col-lg-6 col-md-6">
                            <FadeInAdvanced variant={"fadeInLeft"} delay={200}>
                                <div className="team-one__single">
                                    <div className="team-one__img-box">
                                        <div className="team-one__img">
                                            <img src={Team12} />
                                        </div>
                                        <div className="team-one__arrow-and-social">
                                            <div className="team-one__arrow">
                                                <span className="icon-share"></span>
                                            </div>
                                            <ul className="team-one__social list-unstyled">
                                                <li>
                                                    <Link to="#">
                                                        <span className="icon-facebook-app-symbol"></span>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to="#">
                                                        <span className="icon-twitter"></span>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to="#">
                                                        <span className="icon-pinterest"></span>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to="#">
                                                        <span className="icon-linkedin"></span>
                                                    </Link>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="team-one__content">
                                        <div
                                            className="team-one__content-bg-shape"
                                            style={{
                                                backgroundImage: `url(${TeamOneContentBgShape})`,
                                            }}
                                        ></div>
                                        <h3 className="team-one__name">
                                            <Link to="/team-details">
                                                Emma Brooks
                                            </Link>
                                        </h3>
                                        <p className="team-one__sub-title">
                                            Project Manager
                                        </p>
                                    </div>
                                </div>
                            </FadeInAdvanced>
                        </div>
                        {/*Team One Single End*/}
                        {/*Team One Single Start*/}
                        <div className="col-xl-3 col-lg-6 col-md-6">
                            <FadeInAdvanced variant={"fadeInRight"} delay={300}>
                                <div className="team-one__single">
                                    <div className="team-one__img-box">
                                        <div className="team-one__img">
                                            <img src={Team13} />
                                        </div>
                                        <div className="team-one__arrow-and-social">
                                            <div className="team-one__arrow">
                                                <span className="icon-share"></span>
                                            </div>
                                            <ul className="team-one__social list-unstyled">
                                                <li>
                                                    <Link to="#">
                                                        <span className="icon-facebook-app-symbol"></span>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to="#">
                                                        <span className="icon-twitter"></span>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to="#">
                                                        <span className="icon-pinterest"></span>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to="#">
                                                        <span className="icon-linkedin"></span>
                                                    </Link>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="team-one__content">
                                        <div
                                            className="team-one__content-bg-shape"
                                            style={{
                                                backgroundImage: `url(${TeamOneContentBgShape})`,
                                            }}
                                        ></div>
                                        <h3 className="team-one__name">
                                            <Link to="/team-details">
                                                Jecika Brown
                                            </Link>
                                        </h3>
                                        <p className="team-one__sub-title">
                                            Cheif Expert
                                        </p>
                                    </div>
                                </div>
                            </FadeInAdvanced>
                        </div>
                        {/*Team One Single End*/}
                        {/*Team One Single Start*/}
                        <div className="col-xl-3 col-lg-6 col-md-6">
                            <FadeInAdvanced variant={"fadeInRight"} delay={400}>
                                <div className="team-one__single">
                                    <div className="team-one__img-box">
                                        <div className="team-one__img">
                                            <img src={Team14} />
                                        </div>
                                        <div className="team-one__arrow-and-social">
                                            <div className="team-one__arrow">
                                                <span className="icon-share"></span>
                                            </div>
                                            <ul className="team-one__social list-unstyled">
                                                <li>
                                                    <Link to="#">
                                                        <span className="icon-facebook-app-symbol"></span>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to="#">
                                                        <span className="icon-twitter"></span>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to="#">
                                                        <span className="icon-pinterest"></span>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to="#">
                                                        <span className="icon-linkedin"></span>
                                                    </Link>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="team-one__content">
                                        <div
                                            className="team-one__content-bg-shape"
                                            style={{
                                                backgroundImage: `url(${TeamOneContentBgShape})`,
                                            }}
                                        ></div>
                                        <h3 className="team-one__name">
                                            <Link to="/team-details">
                                                Adam Smith
                                            </Link>
                                        </h3>
                                        <p className="team-one__sub-title">
                                            UI/UX Designer
                                        </p>
                                    </div>
                                </div>
                            </FadeInAdvanced>
                        </div>
                        {/*Team One Single End*/}
                    </div>
                </div>
            </section>
            {/*Team One End */}
        </>
    );
}
