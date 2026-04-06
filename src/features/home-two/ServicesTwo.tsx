import { Link } from "react-router-dom";
import TextAnimation from "@/components/elements/TextAnimation";
import ServicesTwoShape2 from "@/assets/images/shapes/services-two-shape-2.png";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { servicesData } from "@/data/services";

export default function ServicesTwo() {
    return (
        <>
            {/* Services Two Start */}
            <section className="services-two"  id="services">
                <div className="services-two__shape-2">
                    <img src={ServicesTwoShape2} />
                </div>
                <div className="container">
                    <div className="section-title text-center sec-title-animation animation-style1">
                        <div className="section-title__tagline-box">
                            <span className="section-title__tagline">
                                Our Services
                            </span>
                        </div>
                        <h2 className="section-title__title">
                            <TextAnimation style="s1">
                                We Provide the Best <br /> IT <span>Services</span>
                            </TextAnimation>
                        </h2>
                    </div>
                    <Swiper
                        modules={[Autoplay]}
                        spaceBetween={30}
                        loop={true}
                        autoplay={{
                            delay: 5000,
                            disableOnInteraction: false,
                        }}
                        breakpoints={{
                            0: {
                                slidesPerView: 1,
                            },
                            768: {
                                slidesPerView: 2,
                            },
                            992: {
                                slidesPerView: 3,
                            },
                        }}
                        className="services-two__carousel owl-theme owl-carousel"
                    >
                        {servicesData.map((service) => (
                            <SwiperSlide key={service.id}>
                                <div className="item">
                                    <div className="services-two__single">
                                        <div className="services-two__img-box">
                                            <div className="services-two__img">
                                                <img src={service.image} />
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
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </section>
            {/* Services Two End */}
        </>
    );
}
