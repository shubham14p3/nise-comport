import { Link } from "react-router-dom";
import TextAnimation from "@/components/elements/TextAnimation";
import TeamTwoShape1 from "@/assets/images/shapes/team-two-shape-1.png";
import { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { teamData } from "@/data/team";

export default function TeamTwo() {
    const swiperRefProject = useRef<SwiperType | null>(null);
    return (
        <>
            {/*Team Two Start */}
            <section className="team-two">
                <div className="team-two__shape-1">
                    <img src={TeamTwoShape1} className="rotate-me" />
                </div>
                <div className="container">
                    <div className="section-title text-center sec-title-animation animation-style1">
                        <div className="section-title__tagline-box">
                            <span className="section-title__tagline">
                                Our Expert Team
                            </span>
                        </div>
                        <h2 className="section-title__title">
                            <TextAnimation style="s1">
                                See Our Skilled Expert <span>Team</span>
                            </TextAnimation>
                        </h2>
                    </div>
                    <div className="team-two__carousel owl-theme owl-carousel">


                        <Swiper

                            modules={[Navigation, Autoplay]}
                            spaceBetween={30}
                            loop={true}
                            autoplay={{
                                delay: 5000,
                                disableOnInteraction: false,
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
                            {teamData.map((item, index) => (

                                <SwiperSlide key={index}>
                                    {/* Team Two Single Start */}
                                    <div className="item">
                                        <div className="team-two__single">
                                            <div className="team-two__img-box">
                                                <div className="team-two__img">
                                                    <img src={item.image} />
                                                </div>
                                            </div>
                                            <div className="team-two__content-inner">
                                                <div className="team-two__content">
                                                    <h3 className="team-two__title">
                                                        <Link to="/team-details">
                                                            Alisha Martin
                                                        </Link>
                                                    </h3>
                                                    <p className="team-two__sub-title">
                                                        Cheif Expert
                                                    </p>
                                                </div>
                                                <div className="team-two__arrow-and-social">
                                                    <div className="team-two__arrow">
                                                        <span className="icon-share"></span>
                                                    </div>
                                                    <ul className="team-two__social list-unstyled">
                                                        <li>
                                                            <Link to="#">
                                                                <span className="icon-facebook-app-symbol"></span>
                                                            </Link>
                                                        </li>
                                                        <li>
                                                            <Link to="#">
                                                                <span className="icon-twitter-1"></span>
                                                            </Link>
                                                        </li>
                                                        <li>
                                                            <Link to="#">
                                                                <span className="icon-pinterest"></span>
                                                            </Link>
                                                        </li>
                                                        <li>
                                                            <Link to="#">
                                                                <span className="icon-linkedin"></span>
                                                            </Link>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Team Two Single End */}
                                </SwiperSlide>
                            )
                            )}

                        </Swiper>









                    </div>
                </div>
            </section>
            {/*Team Two End */}
        </>
    );
}
