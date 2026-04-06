import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { servicesData } from "@/data/services";

export default function ServicesDetails() {
    const { pathname } = useLocation();
    const [activeFaq, setActiveFaq] = useState(1);

    // Find the service that matches the current path
    // Remove trailing slash if present for comparison (though typical paths don't have it)
    const currentService = servicesData.find((service) => service.slug === pathname.replace(/\/$/, ""));

    // If no service found (shouldn't happen if routes are correct), default to first or show nothing
    if (!currentService) return null;

    useEffect(() => {
        // Reset active FAQ when service changes
        setActiveFaq(1);
    }, [currentService]);

    return (
        <>
            {/*Service Details Start*/}
            <section className="service-details">
                <div className="container">
                    <div className="row">
                        <div className="col-xl-4 col-lg-5">
                            <div className="service-details__sidebar">
                                <div className="service-details__services-box">
                                    <h3 className="service-details__services-title">
                                        Our Services
                                    </h3>
                                    <ul className="service-details__services-list list-unstyled">
                                        {servicesData.map((service) => (
                                            <li
                                                key={service.id}
                                                className={
                                                    service.slug === pathname
                                                        ? "active"
                                                        : ""
                                                }
                                            >
                                                <Link to={service.slug}>
                                                    {service.title}
                                                    <span className="icon-arrow-right"></span>
                                                </Link>
                                            </li>
                                        ))}
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
                                                    +58 585 857 5084
                                                </a>
                                            </p>
                                        </li>
                                        <li>
                                            <div className="icon">
                                                <span className="icon-email"></span>
                                            </div>
                                            <p>
                                                <a href="mailto:example@gmail.com">
                                                    example@gmail.com
                                                </a>
                                            </p>
                                        </li>
                                        <li>
                                            <div className="icon">
                                                <span className="icon-pin"></span>
                                            </div>
                                            <p>
                                                4517 Washington Ave. Manchester,
                                                <br /> Kentucky 39495
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
                                <div className="service-details__sidebar-download-box">
                                    <h3 className="service-details__services-title">
                                        Download
                                    </h3>
                                    <div className="service-details__sidebar-single-download">
                                        <ul className="clearfix list-unstyled">
                                            <li>
                                                <div className="content-box">
                                                    <div className="icon">
                                                        <span className="far fa-file-pdf"></span>
                                                    </div>
                                                    <div className="text-box">
                                                        <h5>
                                                            <Link to="#">
                                                                Pdf Download
                                                            </Link>
                                                        </h5>
                                                        <p>
                                                            <Link to="#">
                                                                Download
                                                            </Link>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="btn-box">
                                                    <Link to="#">
                                                        <span className="far fa-cloud-download"></span>
                                                    </Link>
                                                </div>
                                            </li>

                                            <li>
                                                <div className="content-box">
                                                    <div className="icon">
                                                        <span className="far fa-file-pdf"></span>
                                                    </div>
                                                    <div className="text-box">
                                                        <h5>
                                                            <Link to="#">
                                                                Pdf Download
                                                            </Link>
                                                        </h5>
                                                        <p>
                                                            <Link to="#">
                                                                Download
                                                            </Link>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="btn-box">
                                                    <Link to="#">
                                                        <span className="far fa-cloud-download"></span>
                                                    </Link>
                                                </div>
                                            </li>

                                            <li>
                                                <div className="content-box">
                                                    <div className="icon">
                                                        <span className="far fa-file-pdf"></span>
                                                    </div>
                                                    <div className="text-box">
                                                        <h5>
                                                            <Link to="#">
                                                                Pdf Download
                                                            </Link>
                                                        </h5>
                                                        <p>
                                                            <Link to="#">
                                                                Download
                                                            </Link>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="btn-box">
                                                    <Link to="#">
                                                        <span className="far fa-cloud-download"></span>
                                                    </Link>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-8 col-lg-7">
                            <div className="service-details__left">
                                <div className="service-details__img">
                                    <img src={currentService.detailsImage} alt="" />
                                </div>
                                <h3 className="service-details__title-1">
                                    {currentService.detailsTitle}
                                </h3>
                                <p className="service-details__text-1">
                                    {currentService.detailsText1}
                                </p>
                                <p className="service-details__text-2">
                                    {currentService.detailsText2}
                                </p>
                                <ul className="service-details__points-list list-unstyled">
                                    {currentService.points.map((point, index) => (
                                        <li key={index}>
                                            <div className="icon">
                                                <span className="icon-check"></span>
                                            </div>
                                            <p>{point}</p>
                                        </li>
                                    ))}
                                </ul>
                                <div className="service-details__img-box">
                                    <div className="row">
                                        {currentService.benefits.map((benefit, index) => (
                                            <div className="col-xl-6" key={index}>
                                                <div className="service-details__img-box-single">
                                                    <div className="service-details__img-box-img">
                                                        <img
                                                            src={benefit.image}
                                                            alt=""
                                                        />
                                                    </div>
                                                    <div className="service-details__img-box-content">
                                                        <div className="service-details__img-box-content-icon-and-title">
                                                            <div className="service-details__img-box-content-icon">
                                                                <span className={benefit.icon}></span>
                                                            </div>
                                                            <h3 className="service-details__img-box-content-title">
                                                                {benefit.title}
                                                            </h3>
                                                        </div>
                                                        <p className="service-details__img-box-content-text">
                                                            {benefit.text}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="service-details__faq-box">
                                    <div
                                        className="accrodion-grp faq-one-accrodion"
                                        data-grp-name="faq-one-accrodion"
                                    >
                                        {currentService.faq.map((item, index) => (
                                            <div
                                                key={index}
                                                className={`accrodion ${activeFaq === index ? "active" : ""}`}
                                            >
                                                <div
                                                    className="accrodion-title"
                                                    onClick={() =>
                                                        setActiveFaq(
                                                            activeFaq === index
                                                                ? -1
                                                                : index
                                                        )
                                                    }
                                                >
                                                    <h4>{item.question}</h4>
                                                </div>
                                                {activeFaq === index && (
                                                    <div className="accrodion-content">
                                                        <div className="inner">
                                                            <p>{item.answer}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/*Service Details End*/}
        </>
    );
}
