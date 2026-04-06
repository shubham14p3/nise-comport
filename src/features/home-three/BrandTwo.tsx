import CounterUp from "@/components/elements/CounterUp";
import BrandTwoTrustpilotLogo from "@/assets/images/resources/brand-two-trustpilot-logo.png";
import BrandTwoTrustpilotImg1 from "@/assets/images/resources/brand-two-trustpilot-img-1.jpg";
import BrandTwoTrustpilotImg2 from "@/assets/images/resources/brand-two-trustpilot-img-2.jpg";
import { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { brandsData } from '@/data/brands';

export default function BrandTwo() {
    const swiperRefProject = useRef<SwiperType | null>(null);
    return (
        <>
            {/*Brand Two Start */}
            <section className="brand-two">
                <div className="brand-two__wrapper">
                    <div className="container">
                        <div className="brand-two__inner">
                            <div className="brand-two__left">
                                <div className="brand-two__trustpilot-box">
                                    <ul className="list-unstyled brand-two__trustpilot-img-list">
                                        <li>
                                            <div className="brand-two__trustpilot-img">
                                                <img
                                                    src={BrandTwoTrustpilotImg1}
                                                />
                                            </div>
                                        </li>
                                        <li>
                                            <div className="brand-two__trustpilot-img">
                                                <img
                                                    src={BrandTwoTrustpilotImg2}
                                                />
                                            </div>
                                        </li>
                                    </ul>
                                    <div className="brand-two__trustpilot-content-box">
                                        <div className="brand-two__trustpilot-logo">
                                            <img src={BrandTwoTrustpilotLogo} />
                                        </div>
                                        <div className="brand-two__trustpilot-rating-review">
                                            <p className="brand-two__trustpilot-rating">
                                                5.0 Excellent
                                            </p>
                                            <p className="brand-two__trustpilot-review">
                                                Reviews
                                                <span>
                                                    <CounterUp ending={4170} />
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="brand-two__right">
                                <Swiper
                                    modules={[Navigation, Autoplay]}
                                    spaceBetween={30}
                                    loop={true}
                                    speed={500}
                                    autoplay={{
                                        delay: 7000,
                                        disableOnInteraction: false,
                                        pauseOnMouseEnter: false,
                                    }}
                                    onSwiper={(swiper) => {
                                        swiperRefProject.current = swiper;
                                    }}
                                    className="brand-two__carousel owl-theme owl-carousel"
                                    breakpoints={{
                                        0: {
                                            slidesPerView: 1,
                                        },
                                        540: {
                                            slidesPerView: 2,
                                        },
                                        768: {
                                            slidesPerView: 2,
                                        },
                                        992: {
                                            slidesPerView: 3,
                                        },
                                        1200: {
                                            slidesPerView: 4,
                                        },
                                        1320: {
                                            slidesPerView: 5,
                                        },
                                    }}
                                >
                                    {brandsData.map((brand) => (
                                        <SwiperSlide key={brand.id}>
                                            <div className="item">
                                                <div className="brand-two__single">
                                                    <div className="brand-two__img">
                                                        <img src={brand.image} alt="Brand Logo" />
                                                    </div>
                                                </div>
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/*Brand Two End */}
        </>
    );
}
