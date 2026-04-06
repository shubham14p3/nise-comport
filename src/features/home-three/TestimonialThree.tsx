import { Link } from "react-router-dom";
import { useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, Thumbs } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { testimonialsData } from "@/data/testimonials";
import TestimonialThreeBg from "@/assets/images/backgrounds/testimonial-three-bg.jpg";

export default function TestimonialThree() {
    const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
    const swiperRefMain = useRef<SwiperType | null>(null);

    const projectNextSlide = (): void => {
        swiperRefMain.current?.slideNext();
    };
    const projectPrevSlide = (): void => {
        swiperRefMain.current?.slidePrev();
    };

    return (
        <>
            {/* Testimonial Three Start */}
            <section className="testimonial-three" id="testimonial">
                <div className="container">
                    <div className="testimonial-three__inner">
                        <div
                            className="testimonial-three__bg"
                            style={{ backgroundImage: `url(${TestimonialThreeBg})` }}
                        ></div>

                        <div className="testimonial-three__main-content">
                            <Swiper
                                modules={[Navigation, Autoplay, Thumbs]}
                                spaceBetween={72}
                                slidesPerView={1}
                                loop={true}
                                speed={1400}
                                observer={true}
                                observeParents={true}
                                autoplay={{ delay: 5000, disableOnInteraction: false }}
                                thumbs={{
                                    swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
                                }}
                                onSwiper={(swiper) => { swiperRefMain.current = swiper; }}
                                className="swiper-container"
                                id="testimonial-three__carousel"
                            >
                                {testimonialsData.map((testimonial, index) => (
                                    <SwiperSlide key={index}>
                                        <div className="testimonial-three__main-content-inner">
                                            <div className="testimonial-three__main-content-box">
                                                <div className="testimonial-three__quote">
                                                    <i className="fas fa-quote-left"></i>
                                                </div>
                                                <p className="testimonial-three__text">
                                                    {testimonial.text}
                                                </p>
                                                <div className="testimonial-three__client-info-box">
                                                    <div className="testimonial-three__client-info">
                                                        <h3>
                                                            <Link to="/testimonials">{testimonial.name}</Link>
                                                        </h3>
                                                        <p>{testimonial.designation}</p>
                                                    </div>
                                                    <div className="testimonial-three__ratting">
                                                        {[...Array(5)].map((_, i) => (
                                                            <span
                                                                key={i}
                                                                className={`${i < testimonial.rating ? "fas" : "far"} fa-star`}
                                                            ></span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="testimonial-three__img">
                                                <img src={testimonial.bigImage} alt={testimonial.name} />
                                            </div>
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>

                            <div className="testimonial-three__nav">
                                {/* IDs match the navigation config: prev arrow */}
                                <div
                                    onClick={projectPrevSlide}
                                    className="swiper-button-next"
                                    id="testimonial-three__swiper-button-prev"
                                >
                                    <i className="icon-right-arrow"></i>
                                </div>
                                {/* next arrow */}
                                <div
                                    onClick={projectNextSlide}
                                    className="swiper-button-prev"
                                    id="testimonial-three__swiper-button-next"
                                >
                                    <i className="icon-right-arrow"></i>
                                </div>
                            </div>
                        </div>

                        <div className="testimonial-three__thumb-box">
                            <Swiper
                                modules={[Thumbs, Autoplay]}
                                onSwiper={setThumbsSwiper}
                                spaceBetween={0}
                                slidesPerView={3}
                                loop={true}
                                speed={1400}
                                direction="vertical"
                                watchSlidesProgress={true}
                                slideToClickedSlide={true}
                                autoplay={{ delay: 5000, disableOnInteraction: false }}
                                breakpoints={{
                                    0: { slidesPerView: 3, spaceBetween: 0 },
                                    575: { slidesPerView: 3, spaceBetween: 0 },
                                    768: { slidesPerView: 3, spaceBetween: 0 },
                                }}
                                className="swiper-container"
                                id="testimonial-three__thumb"
                            >
                                {testimonialsData.map((testimonial, index) => (
                                    <SwiperSlide key={index}>
                                        <div className="testimonial-three__img-holder-box">
                                            <div className="testimonial-three__img-holder">
                                                <img
                                                    src={testimonial.thumbImage}
                                                    alt={testimonial.name}
                                                />
                                            </div>
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>

                        <div id="particles-js-three"></div>
                    </div>
                </div>
            </section>
            {/* Testimonial Three End */}
        </>
    );
}