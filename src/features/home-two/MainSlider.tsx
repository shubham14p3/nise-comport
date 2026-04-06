import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Autoplay, Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import CounterUp from '@/components/elements/CounterUp';
import MainSliderShape1 from '@/assets/images/shapes/main-slider-shape-1.png';
import MainSliderShape2 from '@/assets/images/shapes/main-slider-shape-2.png';
import MainSliderShape3 from '@/assets/images/shapes/main-slider-shape-3.png';
import MainSliderShape4 from '@/assets/images/shapes/main-slider-shape-4.png';
import MainSliderImg11 from '@/assets/images/resources/main-slider-img-1-1.jpg';
import MainSliderImg12 from '@/assets/images/resources/main-slider-img-1-2.jpg';
import MainSliderImg13 from '@/assets/images/resources/main-slider-img-1-3.jpg';
import MainSliderShapeBg1 from '@/assets/images/shapes/main-slider-shape-bg-1.png';
import YoutubeFrem from '@/components/elements/YoutubeFrem';

const slides = [
    {
        id: 1,
        image: MainSliderImg11,
        subTitle: 'IT Solutions Designed for Your Success',
        title: <>Smart IT Solutions for <br /> a <span>Connected world</span></>,
    },
    {
        id: 2,
        image: MainSliderImg12,
        subTitle: 'IT Solutions That Work for You',
        title: <>Expert IT Solutions to <br /> Elevate <span>Your Enterprise</span></>,
    },
    {
        id: 3,
        image: MainSliderImg13,
        subTitle: 'IT Solutions to grow your company',
        title: <>Boost Business Our <br /> Innovative <span>IT Solutions</span></>,
    },
];

export default function MainSlider() {
    const swiperRef = useRef<SwiperType | null>(null);

    return (
        <>
            {/* Main Slider Two Start */}
            <section className="main-slider">
                <div className="main-slider__carousel owl-theme">
                    <Swiper
                        modules={[EffectFade, Autoplay, Pagination]}
                        className="main-slider__swiper"
                        effect="fade"
                        loop={true}
                        spaceBetween={0}
                        speed={500}
                        autoplay={{
                            delay: 5000,
                            disableOnInteraction: false,
                        }}
                        pagination={{ clickable: true }}
                        onSwiper={(swiper) => { swiperRef.current = swiper; }}
                    >
                        {slides.map((slide) => (
                            <SwiperSlide key={slide.id}>
                                <div className="item">
                                    <div className="main-slider__shape-bg-one"
                                        style={{ backgroundImage: `url(${MainSliderShapeBg1})` }}></div>
                                    <div className="main-slider__shape-1">
                                        <img src={MainSliderShape1} alt="" />
                                    </div>
                                    <div className="main-slider__shape-2 float-bob-x">
                                        <img src={MainSliderShape2} alt="" />
                                    </div>
                                    <div className="main-slider__shape-3 img-bounce">
                                        <img src={MainSliderShape3} alt="" />
                                    </div>
                                    <div className="main-slider__shape-4 rotate-me">
                                        <img src={MainSliderShape4} alt="" />
                                    </div>
                                    <div className="main-slider__img">
                                        <img src={slide.image} alt="" />
                                    </div>
                                    <div className="container">
                                        <div className="main-slider__content">
                                            <div className="main-slider__solution-user">
                                                <div className="main-slider__solution-count">
                                                    <h3><CounterUp ending={850} /></h3>
                                                    <span>+</span>
                                                </div>
                                                <div className="main-slider__solution-content">
                                                    <p>Solutions <br /> Realtime Users </p>
                                                </div>
                                            </div>
                                            <div className="main-slider__sub-title-box">
                                                <div className="main-slider__sub-title-shape"></div>
                                                <p className="main-slider__sub-title">{slide.subTitle}</p>
                                            </div>
                                            <h2 className="main-slider__title">{slide.title}</h2>
                                            <p className="main-slider__text">We help companies develop powerful corporate social
                                                responsibility, grantmaking, <br /> and employee engagement strategies. Dicta sunt
                                                explicabo. Nemo</p>
                                            <div className="main-slider__btn-box">
                                                <div className="main-slider__btn">
                                                    <Link to="/about" className="thm-btn">Discover More
                                                        <span className="fas fa-arrow-right"></span>
                                                    </Link>
                                                </div>
                                                <div className="main-slider__video-link">
                                                    <YoutubeFrem className="video-popup" video="https://www.youtube.com/watch?v=rbFoRH2deeY">
                                                        <div className="main-slider__video-icon">
                                                            <span className="fa fa-play"></span>
                                                            <i className="ripple"></i>
                                                        </div>
                                                    </YoutubeFrem>
                                                </div>
                                            </div>
                                            <div className="main-slider__call-box">
                                                <p className="main-slider__call-text">Call for more info</p>
                                                <div className="main-slider__call-icon-box">
                                                    <div className="main-slider__call-icon">
                                                        <span className="icon-call"></span>
                                                    </div>
                                                    <div className="main-slider__call-number">
                                                        <a href="tel:23645689622">+236 (456) 896 22</a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                    <div className="owl-nav">
                        <div className="owl-next my-2" onClick={() => swiperRef.current?.slideNext()} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && swiperRef.current?.slideNext()}>
                            <span className="icon-right-arrow"></span>
                        </div>
                        <div className="owl-prev  my-2" onClick={() => swiperRef.current?.slidePrev()} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && swiperRef.current?.slidePrev()}>
                            <span className="icon-right-arrow"></span>
                        </div>
                    </div>
                </div>
            </section>
            {/*Main Two Slider End */}
        </>

    );
}
