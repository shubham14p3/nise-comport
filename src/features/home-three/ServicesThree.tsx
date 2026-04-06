import { Link } from "react-router-dom";
import TextAnimation from "@/components/elements/TextAnimation";
import ServicesThreeShape2 from "@/assets/images/shapes/services-three-shape-2.png";
import { servicesData } from "@/data/services";
import { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

export default function ServicesThree() {
    const swiperRefProject = useRef<SwiperType | null>(null);
    return (
        <>
            {/*Services Three Start*/}
            <section className="services-three" id="services">
                <div className="services-three__shape-1"></div>
                <div className="services-three__shape-2 float-bob-x">
                    <img src={ServicesThreeShape2} />
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
                                Reliable Services Crafted To <br />
                                Your<span>Expectations</span>
                            </TextAnimation>
                        </h2>
                    </div>
                    <div className="services-three__carousel owl-theme owl-carousel">
                        <Swiper
                            modules={[Navigation, Autoplay]}
                            spaceBetween={30}
                            loop={true}
                            autoplay={{
                                delay: 4000,
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
                                    slidesPerView: 3,
                                },
                                1344: {
                                    slidesPerView: 3,
                                },
                            }}
                        >
                            {servicesData.map((service, id) => (
                                <SwiperSlide key={id}>
                                    {/*Services Three Single Start*/}
                                    <div className="item">
                                        <div className="services-three__single">
                                            <div className="services-three__icon">
                                                <span className={service.icon}></span>
                                            </div>
                                            <h3 className="services-three__title">
                                                <Link to={service.slug}>
                                                    {service.title}
                                                </Link>
                                            </h3>
                                            <p className="services-three__text">
                                                {service.text}
                                            </p>
                                            <div className="services-three__read-more">
                                                <Link to={service.slug}>
                                                    Read More
                                                    <span className="fas fa-arrow-right"></span>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                    {/*Services Three Single End*/}
                                </SwiperSlide>
                            ))}
                        </Swiper>

                    </div>
                </div>
            </section>
            {/*Services Three End*/}
        </>
    );
}
