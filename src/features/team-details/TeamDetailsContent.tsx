import { Link } from "react-router-dom";
import Progresbar from "@/components/elements/Progressbar";
import TeamDetailsImg1 from "@/assets/images/team/team-details-img-1.jpg";

export default function TeamDetailsContent() {
    return (
        <>
            {/*Team Details Start*/}
            <section className="team-details">
                <div className="container">
                    <div className="team-details__top">
                        <div className="row">
                            <div className="col-xl-5 col-lg-5">
                                <div className="team-details__top-left">
                                    <div className="team-details__img-1">
                                        <img src={TeamDetailsImg1} />
                                    </div>
                                </div>
                            </div>
                            <div className="col-xl-7 col-lg-7">
                                <div className="team-details__top-right">
                                    <div className="team-details__client-box">
                                        <h3 className="team-details__client-name">
                                            Amaina Anne
                                        </h3>
                                        <span className="team-details__client-sub-title">
                                            Professional Banking
                                        </span>
                                        <div className="team-details__social">
                                            <Link to="#">
                                                <i className="icon-facebook-app-symbol"></i>
                                            </Link>
                                            <Link to="#">
                                                <i className="icon-twitter-1"></i>
                                            </Link>
                                            <Link to="#">
                                                <i className="icon-linkedin"></i>
                                            </Link>
                                            <Link to="#">
                                                <i className="icon-pinterest"></i>
                                            </Link>
                                        </div>
                                        <p className="team-details__client-text">
                                            Neque porro quisquam est, qui
                                            dolorem ipsum quia dolor sit amet,
                                            consectetur, adipisci velit, sed
                                            quia non numquam eius modi tempora
                                            incidunt ut labore et dolore ma gnam
                                            aliquam quaerat voluptatem. Ut enim
                                            ad minima veniam
                                        </p>
                                        <ul className="team-details__client-address list-unstyled">
                                            <li>
                                                <p>
                                                    <span className="icon-pin"></span>
                                                    Address
                                                </p>
                                                <h5>
                                                    Shop No 3,Singh Building, Kharangajhar, Telco, JSR, 
                                                    Jharkhand, IN, 831004
                                                </h5>
                                            </li>
                                            <li>
                                                <p>
                                                    <span className="icon-call"></span>
                                                    Phone Number
                                                </p>
                                                <h5>
                                                    <a href="tel:+919771219893">
                                                        (+91) 9771219893
                                                    </a>
                                                </h5>
                                            </li>
                                            <li>
                                                <p>
                                                    <span className="icon-email"></span>
                                                    Email
                                                </p>
                                                <h5>
                                                    <a href="mailto:michael.mitc@example.com">
                                                        michael.mitc@example.com
                                                    </a>
                                                </h5>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="team-details__bottom">
                        <div className="row">
                            <div className="col-xl-6 col-lg-6">
                                <div className="team-details__bottom-left">
                                    <h3 className="team-details__bottom-title">
                                        Biography
                                    </h3>
                                    <p className="team-details__bottom-text">
                                        Neque porro quisquam est, qui dolorem
                                        ipsum quia dolor sit amet, consectetur,
                                        adipisci velit, sed quia non numquam
                                        eius modi tempora incidunt ut labore et
                                        dolore ma gnam aliquam quaerat
                                        voluptatem. Ut enim ad minima veniam
                                    </p>
                                    <div className="team-details__practice-area">
                                        <h4 className="team-details__practice-area-title">
                                            Practice Area
                                        </h4>
                                        <div className="team-details__practice-area-list-box">
                                            <ul className="list-unstyled team-details__practice-area-list">
                                                <li>
                                                    <div className="icon"></div>
                                                    <div className="text">
                                                        <p>Banking</p>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div className="icon"></div>
                                                    <div className="text">
                                                        <p>APP Development</p>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div className="icon"></div>
                                                    <div className="text">
                                                        <p>Insurance</p>
                                                    </div>
                                                </li>
                                            </ul>
                                            <ul className="list-unstyled team-details__practice-area-list team-details__practice-area-list--two">
                                                <li>
                                                    <div className="icon"></div>
                                                    <div className="text">
                                                        <p>Website Design</p>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div className="icon"></div>
                                                    <div className="text">
                                                        <p>Fee Payment</p>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div className="icon"></div>
                                                    <div className="text">
                                                        <p>Web Devolopment</p>
                                                    </div>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xl-6 col-lg-6">
                                <div className="team-details__bottom-right">
                                    <h3 className="team-details__progress-title-1">
                                        Skills
                                    </h3>
                                    <ul className="team-details__progress-list list-unstyled">
                                        <Progresbar
                                            variant="bar-inner"
                                            title="Repair Device"
                                            value={80}
                                            wrapperClassName="team-details__progress"
                                            titleClassName="team-details__progress-title"
                                        />
                                        <Progresbar
                                            variant="bar-inner"
                                            title="Replace Device"
                                            value={95}
                                            wrapperClassName="team-details__progress"
                                            titleClassName="team-details__progress-title"
                                        />
                                        <Progresbar
                                            variant="bar-inner"
                                            title="Diagnostics"
                                            value={65}
                                            wrapperClassName="team-details__progress"
                                            titleClassName="team-details__progress-title"
                                        />
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/*Team Details End*/}
        </>
    );
}
