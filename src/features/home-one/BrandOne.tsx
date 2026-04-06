import { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { brandsData } from '@/data/brands';

export default function BrandOne() {
    const swiperRefProject = useRef<SwiperType | null>(null);

    return (
        <>
            {/*Brand One Start */}
            <section className="brand-one">
                <div className="container">
                    <div className="brand-one__inner">
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
                            className="brand-one__carousel owl-theme owl-carousel"
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
                                        <div className="brand-one__single">
                                            <div className="brand-one__img">
                                                <img src={brand.image} alt="Brand Logo" />
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                </div>
            </section>
            {/*Brand One End */}
        </>
    );
}
