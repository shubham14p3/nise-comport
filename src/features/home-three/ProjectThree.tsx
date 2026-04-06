import { Link } from "react-router-dom";
import TextAnimation from "@/components/elements/TextAnimation";
import FadeInAdvanced from "@/components/elements/FadeInAdvanced";
import Project31 from "@/assets/images/project/project-3-1.jpg";
import Project32 from "@/assets/images/project/project-3-2.jpg";
import Project33 from "@/assets/images/project/project-3-3.jpg";
import Project34 from "@/assets/images/project/project-3-4.jpg";
import ProjectThreeBgShape from "@/assets/images/shapes/project-three-bg-shape.png";

export default function ProjectThree() {
    return (
        <>
            {/*Project Three Start */}
            <section className="project-three" id="project">
                <div
                    className="project-three__bg-shape"
                    style={{ backgroundImage: `url(${ProjectThreeBgShape})` }}
                ></div>
                <div className="container">
                    <div className="project-three__top">
                        <div className="section-title text-leftcenter sec-title-animation animation-style2">
                            <div className="section-title__tagline-box">
                                <span className="section-title__tagline">
                                    See Our Project
                                </span>
                            </div>
                            <h2 className="section-title__title">
                                <TextAnimation style="s2">
                                    Explore Our Recent <span>Work</span>
                                </TextAnimation>
                            </h2>
                        </div>
                        <div className="project-three__btn-box">
                            <Link to="/projects" className="thm-btn">
                                view all projects
                                <span className="fas fa-arrow-right"></span>
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="project-three__bottom">
                    <div className="container">
                        <div className="row">
                            {/*Project Three Single Start*/}
                            <div className="col-xl-3 col-lg-6 col-md-6">
                                <FadeInAdvanced
                                    variant={"fadeInLeft"}
                                    delay={100}
                                >
                                    <div className="project-three__single">
                                        <div className="project-three__img-box">
                                            <div className="project-three__img">
                                                <img src={Project31} />
                                            </div>
                                            <div className="project-three__content">
                                                <div className="project-three__title-box">
                                                    <p className="project-three__sub-title">
                                                        Itzone
                                                    </p>
                                                    <h3 className="project-three__title">
                                                        <Link to="/project-details">
                                                            Hosting Solution
                                                        </Link>
                                                    </h3>
                                                </div>
                                                <div className="project-three__arrow">
                                                    <a
                                                        href="assets/images/project/project-3-1.jpg"
                                                        className="img-popup"
                                                    >
                                                        <span className="icon-right-arrow"></span>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </FadeInAdvanced>
                            </div>
                            {/*Project Three Single End*/}
                            {/*Project Three Single Start*/}
                            <div className="col-xl-3 col-lg-6 col-md-6">
                                <FadeInAdvanced
                                    variant={"fadeInLeft"}
                                    delay={300}
                                >
                                    <div className="project-three__single">
                                        <div className="project-three__img-box">
                                            <div className="project-three__img">
                                                <img src={Project32} />
                                            </div>
                                            <div className="project-three__content">
                                                <div className="project-three__title-box">
                                                    <p className="project-three__sub-title">
                                                        Itzone
                                                    </p>
                                                    <h3 className="project-three__title">
                                                        <Link to="/project-details">
                                                            Technology Growth
                                                        </Link>
                                                    </h3>
                                                </div>
                                                <div className="project-three__arrow">
                                                    <a
                                                        href="assets/images/project/project-3-2.jpg"
                                                        className="img-popup"
                                                    >
                                                        <span className="icon-right-arrow"></span>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </FadeInAdvanced>
                            </div>
                            {/*Project Three Single End*/}
                            {/*Project Three Single Start*/}
                            <div className="col-xl-3 col-lg-6 col-md-6">
                                <FadeInAdvanced
                                    variant={"fadeInRight"}
                                    delay={600}
                                >
                                    <div className="project-three__single">
                                        <div className="project-three__img-box">
                                            <div className="project-three__img">
                                                <img src={Project33} />
                                            </div>
                                            <div className="project-three__content">
                                                <div className="project-three__title-box">
                                                    <p className="project-three__sub-title">
                                                        Itzone
                                                    </p>
                                                    <h3 className="project-three__title">
                                                        <Link to="/project-details">
                                                            Safety Gurranted
                                                        </Link>
                                                    </h3>
                                                </div>
                                                <div className="project-three__arrow">
                                                    <a
                                                        href="assets/images/project/project-3-3.jpg"
                                                        className="img-popup"
                                                    >
                                                        <span className="icon-right-arrow"></span>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </FadeInAdvanced>
                            </div>
                            {/*Project Three Single End*/}
                            {/*Project Three Single Start*/}
                            <div className="col-xl-3 col-lg-6 col-md-6">
                                <FadeInAdvanced
                                    variant={"fadeInRight"}
                                    delay={900}
                                >
                                    <div className="project-three__single">
                                        <div className="project-three__img-box">
                                            <div className="project-three__img">
                                                <img src={Project34} />
                                            </div>
                                            <div className="project-three__content">
                                                <div className="project-three__title-box">
                                                    <p className="project-three__sub-title">
                                                        Itzone
                                                    </p>
                                                    <h3 className="project-three__title">
                                                        <Link to="/project-details">
                                                            It Consultency
                                                        </Link>
                                                    </h3>
                                                </div>
                                                <div className="project-three__arrow">
                                                    <a
                                                        href="assets/images/project/project-3-4.jpg"
                                                        className="img-popup"
                                                    >
                                                        <span className="icon-right-arrow"></span>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </FadeInAdvanced>
                            </div>
                            {/*Project Three Single End*/}
                        </div>
                    </div>
                </div>
            </section>
            {/*Project Three End */}
        </>
    );
}
