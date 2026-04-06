import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { brandsData } from "@/data/brands";

export default function BrandOne() {
    return (
        <>
            {/*Brand One Start */}
            <section className="brand-one">
                <div className="container">
                    <div className="brand-one__inner">
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
                                576: {
                                    slidesPerView: 2,
                                },
                                768: {
                                    slidesPerView: 3,
                                },
                                992: {
                                    slidesPerView: 4,
                                },
                                1200: {
                                    slidesPerView: 5,
                                },
                            }}
                            className="brand-one__carousel owl-theme owl-carousel"
                        >
                            {brandsData.map((brand) => (
                                <SwiperSlide key={brand.id}>
                                    <div className="item">
                                        <div className="brand-one__single">
                                            <div className="brand-one__img">
                                                <img src={brand.image} />
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
