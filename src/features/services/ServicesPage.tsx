import { Link } from "react-router-dom";
import FadeInAdvanced, { type AnimationVariant } from "@/components/elements/FadeInAdvanced";
import { servicesData } from "@/data/services";

export default function ServicesPage() {
    const variants: AnimationVariant[] = ["fadeInLeft", "fadeInUp", "fadeInRight"];

    return (
        <>
            {/*Services Page Start */}
            <section className="services-page">
                <div className="container">
                    <div className="row">
                        {servicesData.map((service, index) => (
                            <div
                                key={service.id}
                                className="col-xl-4 col-lg-6 col-md-6"
                            >
                                <FadeInAdvanced
                                    variant={variants[index % 3]}
                                    delay={100 + index * 200}
                                >
                                    <div className="services-two__single">
                                        <div className="services-two__img-box">
                                            <div className="services-two__img">
                                                <img src={service.image} alt="" />
                                            </div>
                                            <div className="services-two__icon">
                                                <span className={service.icon}></span>
                                            </div>
                                        </div>
                                        <div className="services-two__content">
                                            <h3 className="services-two__title">
                                                <Link to={service.slug}>
                                                    {service.title}
                                                </Link>
                                            </h3>
                                            <p className="services-two__text">
                                                {service.text}
                                            </p>
                                            <div className="services-two__plus">
                                                <Link to={service.slug}>
                                                    <span className="fas fa-plus"></span>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </FadeInAdvanced>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            {/*Services Page End */}
        </>
    );
}
