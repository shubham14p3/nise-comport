import { Link } from "react-router-dom";
import TextAnimation from "@/components/elements/TextAnimation";
import TestimonialTwoBgShape from "@/assets/images/shapes/testimonial-two-bg-shape.png";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { testimonialsData } from "@/data/testimonials";

export default function TestimonialTwo() {
    return (
        <>
            {/*Testimonial Two Start*/}
            <section className="testimonial-two" id="testimonial">
                <div
                    className="testimonial-two-bg-shape"
                    style={{ backgroundImage: `url(${TestimonialTwoBgShape})` }}
                ></div>
                <div className="container">
                    <div className="section-title text-center sec-title-animation animation-style1">
                        <div className="section-title__tagline-box">
                            <span className="section-title__tagline">
                                Testimonials
                            </span>
                        </div>
                        <h2 className="section-title__title">
                            <TextAnimation style="s1">
                                What Our Customer <span>Says?</span>
                            </TextAnimation>
                        </h2>
                    </div>
                    <div className="testimonial-two__carousel owl-theme owl-carousel">

                        <Swiper
                            modules={[Pagination, Autoplay]}
                            spaceBetween={30}
                            loop={true}
                            speed={500}
                            autoplay={{
                                delay: 7000,
                                disableOnInteraction: false,
                            }}
                            className="testimonial-two__carousel owl-theme owl-carousel"
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
                                    slidesPerView: 2,
                                },
                                1320: {
                                    slidesPerView: 2,
                                },
                            }}
                        >
                            {testimonialsData.map((testimonial) => (
                                <SwiperSlide key={testimonial.id}>
                                    {/*Testimonial Two Single Start*/}
                                    <div className="item">
                                        <div className="testimonial-two__single">
                                            <div className="testimonial-two__single-bdr"></div>
                                            <div className="testimonial-two__quote">
                                                <span className="fas fa-quote-right"></span>
                                            </div>
                                            <div className="testimonial-two__client-info-box">
                                                <div className="testimonial-two__client-info">
                                                    <div className="testimonial-two__client-img-box">
                                                        <div className="testimonial-two__client-img">
                                                            <img src={testimonial.image} />
                                                        </div>
                                                    </div>
                                                    <div className="testimonial-two__client-content">
                                                        <h3 className="testimonial-two__client-name">
                                                            <Link to="/testimonials">
                                                                {testimonial.name}
                                                            </Link>
                                                        </h3>
                                                        <p className="testimonial-two__client-sub-title">
                                                            {testimonial.designation}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="testimonial-two__client-ratting">
                                                    <span className="icon-star-1"></span>
                                                    <span className="icon-star-1"></span>
                                                    <span className="icon-star-1"></span>
                                                    <span className="icon-star-1"></span>
                                                    <span className="icon-star-1"></span>
                                                </div>
                                            </div>
                                            <p className="testimonial-two__text">
                                                {testimonial.text}
                                            </p>
                                        </div>
                                    </div>
                                    {/*Testimonial Two Single End*/}
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                </div>
            </section>
            {/*Testimonial Two End*/}
        </>
    );
}
