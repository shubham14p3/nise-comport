import { Link } from "react-router-dom";
import TextAnimation from "@/components/elements/TextAnimation";
import ServicesOneShape2 from "@/assets/images/shapes/services-one-shape-2.png";
import { servicesData } from "@/data/services";
import { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

export default function ServiceOne() {
    const swiperRefProject = useRef<SwiperType | null>(null);
    return (
        <>
            {/*Service One Start */}
            <section className="service-one" id="services">
                <div className="services-one__shape-1"></div>
                <div className="services-one__shape-2 float-bob-x">
                    <img src={ServicesOneShape2} />
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
                                Innovative IT Services
                                <br /> Tailored <span>For Your Success.</span>
                            </TextAnimation>
                        </h2>
                    </div>
                    <div className="service-one__carousel owl-theme owl-carousel">
                        <Swiper
                            modules={[Navigation, Autoplay]}
                            spaceBetween={30}
                            loop={true}
                            autoplay={{
                                delay: 5000,
                                disableOnInteraction: false,
                                pauseOnMouseEnter: false,
                            }}
                            onSwiper={(swiper) => {
                                swiperRefProject.current = swiper;
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
                                1024: {
                                    slidesPerView: 3,
                                },
                                1200: {
                                    slidesPerView: 4,
                                },
                                1344: {
                                    slidesPerView: 4,
                                },
                            }}
                        >
                            {servicesData.map((service, id) => (
                                <SwiperSlide key={id}>
                                    <div className="item">
                                        <div className="service-one__single-inner">
                                            <div className="service-one__single-wrap">
                                                <div className="service-one__single">
                                                    <div className="service-one__single-shape-1"></div>
                                                    <div className="service-one__icon">
                                                        <span className={service.icon}></span>
                                                    </div>
                                                    <h3 className="service-one__title">
                                                        <Link to={service.slug}>
                                                            {service.title}
                                                        </Link>
                                                    </h3>
                                                    <p className="service-one__text">
                                                        {service.text}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="service-one__btn-box">
                                                <Link
                                                    to={service.slug}
                                                    className="thm-btn"
                                                >
                                                    Read More
                                                    <span className="fas fa-arrow-right"></span>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                </div>
            </section>
            {/*Service One End */}
        </>
    );
}
