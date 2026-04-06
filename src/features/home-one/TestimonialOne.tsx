import { Link } from "react-router-dom";
import TextAnimation from "@/components/elements/TextAnimation";
import TestimonialOneBg from "@/assets/images/backgrounds/testimonial-one-bg.jpg";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { testimonialsData } from "@/data/testimonials";

export default function TestimonialOne() {
    return (
        <>
            {/* Testimonial One Start */}
            <section className="testimonial-one">
                <div className="testimonial-one__bg-color">
                    <div
                        className="testimonial-one__bg"
                        style={{ backgroundImage: `url(${TestimonialOneBg})` }}
                    ></div>
                </div>
                <div className="container">
                    <div className="section-title text-center sec-title-animation animation-style1">
                        <div className="section-title__tagline-box">
                            <span className="section-title__tagline">
                                Testimonials
                            </span>
                        </div>
                        <h2 className="section-title__title">
                            <TextAnimation style="s1">
                                What Client Say <span>About </span>us
                            </TextAnimation>
                        </h2>
                    </div>
                    <div className="testimonial-one__carousel">
                        <Swiper
                            modules={[Pagination, Autoplay]}
                            spaceBetween={30}
                            loop={true}
                            speed={500}
                            autoplay={{
                                delay: 7000,
                                disableOnInteraction: false,
                            }}
                            pagination={{
                                clickable: true,
                            }}
                            className="testimonial-one__carousel owl-theme owl-carousel"
                            breakpoints={{
                                0: {
                                    slidesPerView: 1,
                                },
                                768: {
                                    slidesPerView: 2,
                                },
                                992: {
                                    slidesPerView: 2,
                                },
                                1200: {
                                    slidesPerView: 3,
                                },
                                1320: {
                                    slidesPerView: 3,
                                },
                            }}
                        >
                            {testimonialsData.map((testimonial) => (
                                <SwiperSlide key={testimonial.id}>
                                    <div className="item">
                                        <div className="testimonial-one__single">
                                            <div className="testimonial-one__single-inner">
                                                <div className="testimonial-one__single-shape-1"></div>
                                                <div className="testimonial-one__star">
                                                    <span className="icon-star-1"></span>
                                                    <span className="icon-star-1"></span>
                                                    <span className="icon-star-1"></span>
                                                    <span className="icon-star"></span>
                                                    <span className="icon-star"></span>
                                                </div>
                                                <p className="testimonial-one__text">
                                                    {testimonial.text}
                                                </p>
                                            </div>
                                            <div className="testimonial-one__client-info">
                                                <div className="testimonial-one__client-img">
                                                    <img src={testimonial.image} alt={testimonial.name} />
                                                </div>
                                                <div className="testimonial-one__client-content">
                                                    <h4 className="testimonial-one__client-name">
                                                        <Link to="/testimonials">
                                                            {testimonial.name}
                                                        </Link>
                                                    </h4>
                                                    <p className="testimonial-one__sub-title">
                                                        {testimonial.designation}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="testimonial-one__quote">
                                                <span className="fal fa-quote-right"></span>
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                            ))}
                            <div className="owl-dots"></div>
                        </Swiper>
                    </div>
                </div>
            </section>
            {/* Testimonial One End */}
        </>
    );
}
