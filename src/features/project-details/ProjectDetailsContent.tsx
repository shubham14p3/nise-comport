import { Link } from "react-router-dom";
import ProjectDetailsImg1 from "@/assets/images/project/project-details-img-1.jpg";
import ProjectDetailsTextImg from "@/assets/images/project/project-details-text-img.jpg";
import ProjectDetailsPointsImg from "@/assets/images/project/project-details-points-img.jpg";

export default function ProjectDetailsContent() {
    return (
        <>
            {/*Project Details Start*/}
            <section className="project-details">
                <div className="container">
                    <div className="row">
                        <div className="col-xl-8 col-lg-7">
                            <div className="project-details__left">
                                <div className="project-details__img">
                                    <img src={ProjectDetailsImg1} />
                                </div>
                                <h3 className="project-details__title-1">
                                    About The Project Overview
                                </h3>
                                <p className="project-details__text-1">
                                    Consectetur adipiscing elit, sed do eiusmod
                                    tempor incididunt ut laborer et dolore magna
                                    aliqua. Out enigma ad minim veniam, quis
                                    nostrud exercitation ullamco laboris nisi ut
                                    aliquip ex ea commodo consequat. Duis aute
                                    inure dolor in the reprehenderit in
                                    voluptate velit esse cillum dolore eu fugiat
                                    null pariatur. Excepteur snit occaecat
                                    cupidatat non proident, sunt in culpa qui
                                    officia deserunt mollit anim id est laborum.
                                </p>
                                <h3 className="project-details__title-2">
                                    The Project Challenge
                                </h3>
                                <p className="project-details__text-2">
                                    Out enigma ad minim veniam, quis nostrud
                                    exercitation ullamco laboris nisi ut aliquip
                                    ex ea commodo consequat. Duis aute inure
                                    dolor in the reprehenderit in voluptate
                                    velit esse cillum dolore eu fugiat null
                                    pariatur. Excepteur snit occaecat cupidatat
                                    non proident, sunt in culpa qui officia
                                    deserunt mollit anim id est laborum.
                                </p>
                                <div className="project-details__text-and-img">
                                    <p className="project-details__text-3">
                                        The wise man therefore always holds in
                                        these matters to this principle of
                                        selection. He rejects pleasures to
                                        secure other greater pleasures, or else
                                        he endures pains to avoid worse pains to
                                        the selection point. But in certain to
                                        all this circumstances
                                    </p>
                                    <div className="project-details__text-img">
                                        <img src={ProjectDetailsTextImg} />
                                    </div>
                                </div>
                                <h3 className="project-details__title-3">
                                    The Result Of Our Project
                                </h3>
                                <p className="project-details__text-4">
                                    Out enigma ad minim veniam, quis nostrud
                                    exercitation ullamco laboris nisi ut aliquip
                                    ex ea commodo consequat. Duis aute inure
                                    dolor in the reprehenderit in voluptate
                                    velit esse cillum dolore eu fugiat null
                                    pariatur. Excepteur snit occaecat cupidatat
                                    non proident, sunt in culpa qui officia
                                    deserunt mollit anim id est laborum.
                                </p>
                                <div className="project-details__img-and-points">
                                    <div className="project-details__points-img">
                                        <img src={ProjectDetailsPointsImg} />
                                    </div>
                                    <ul className="project-details__points list-unstyled">
                                        <li>
                                            <div className="icon">
                                                <span className="icon-right-arrow"></span>
                                            </div>
                                            <p>
                                                Fact that a reader will be distr
                                                acted bioiiy dablea
                                            </p>
                                        </li>
                                        <li>
                                            <div className="icon">
                                                <span className="icon-right-arrow"></span>
                                            </div>
                                            <p>
                                                Acted bioiiy the rea dablea
                                                content of a page
                                            </p>
                                        </li>
                                        <li>
                                            <div className="icon">
                                                <span className="icon-right-arrow"></span>
                                            </div>
                                            <p>
                                                When looking at its layout toile
                                                point
                                            </p>
                                        </li>
                                        <li>
                                            <div className="icon">
                                                <span className="icon-right-arrow"></span>
                                            </div>
                                            <p>
                                                Bioiiy the rea dablea content of
                                                a page looking
                                            </p>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-4 col-lg-5">
                            <div className="project-details__sidebar">
                                <div className="project-details__information">
                                    <h3 className="project-details__information-title">
                                        Project Information
                                    </h3>
                                    <ul className="project-details__information-list list-unstyled">
                                        <li>
                                            <h4>Client :</h4>
                                            <p>Jonathan Smith</p>
                                        </li>
                                        <li>
                                            <h4>Category :</h4>
                                            <p>Upgrade Old Wiring</p>
                                        </li>
                                        <li>
                                            <h4>date :</h4>
                                            <p>02 June 2024</p>
                                        </li>
                                        <li>
                                            <h4>location :</h4>
                                            <p>12 Green Road 05 New Yark</p>
                                        </li>
                                    </ul>
                                </div>
                                <div className="service-details__get-started">
                                    <h3 className="service-details__get-started-title">
                                        Get Started Today
                                    </h3>
                                    <p className="service-details__get-started-text">
                                        Pianissimos of dulcimers qui therefore
                                        always holds in these matters to this
                                        principle
                                    </p>
                                    <ul className="service-details__get-started-points list-unstyled">
                                        <li>
                                            <div className="icon">
                                                <span className="icon-call"></span>
                                            </div>
                                            <p>
                                                <a href="tel:585858575084">
                                                    +91 9771219893
                                                </a>
                                            </p>
                                        </li>
                                        <li>
                                            <div className="icon">
                                                <span className="icon-email"></span>
                                            </div>
                                            <p>
                                                <a href="mailto:info@nisecomport.com">
                                                    info@nisecomport.com
                                                </a>
                                            </p>
                                        </li>
                                        <li>
                                            <div className="icon">
                                                <span className="icon-pin"></span>
                                            </div>
                                            <p>
                                                Shop No 3, Kharangajhar, Telco,
                                                <br /> Jharkhand, IN, 831004
                                            </p>
                                        </li>
                                    </ul>
                                    <div className="service-details__get-started-btn-box">
                                        <Link to="/contact" className="thm-btn">
                                            get in touch
                                            <span className="fas fa-arrow-right"></span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-xl-12">
                            <div className="project-details__previous-next">
                                <ul>
                                    <li>
                                        <div className="icon">
                                            <Link to="#">
                                                <span className="icon-right-arrow"></span>
                                            </Link>
                                        </div>
                                        <div className="text-box">
                                            <Link to="#">Previous Project</Link>
                                        </div>
                                    </li>

                                    <li>
                                        <div className="text-box">
                                            <Link to="#">Next Project</Link>
                                        </div>
                                        <div className="icon">
                                            <Link to="#">
                                                <span className="icon-right-arrow"></span>
                                            </Link>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/*Project Details End*/}
        </>
    );
}
