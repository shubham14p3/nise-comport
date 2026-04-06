import { Link } from "react-router-dom";
import TextAnimation from "@/components/elements/TextAnimation";
import TeamTwoShape1 from "@/assets/images/shapes/team-two-shape-1.png";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { teamData } from "@/data/team";

export default function TeamTwo() {
    return (
        <>
            {/*Team Two Start */}
            <section className="team-two" id="team">
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
                            768: {
                                slidesPerView: 2,
                            },
                            992: {
                                slidesPerView: 3,
                            },
                            1200: {
                                slidesPerView: 4,
                            },
                        }}
                        className="team-two__carousel owl-theme owl-carousel"
                    >
                        {teamData.map((member) => (
                            <SwiperSlide key={member.id}>
                                <div className="item">
                                    <div className="team-two__single">
                                        <div className="team-two__img-box">
                                            <div className="team-two__img">
                                                <img src={member.image} />
                                            </div>
                                        </div>
                                        <div className="team-two__content-inner">
                                            <div className="team-two__content">
                                                <h3 className="team-two__title">
                                                    <Link to={member.detailsLink}>
                                                        {member.name}
                                                    </Link>
                                                </h3>
                                                <p className="team-two__sub-title">
                                                    {member.position}
                                                </p>
                                            </div>
                                            <div className="team-two__arrow-and-social">
                                                <div className="team-two__arrow">
                                                    <span className="icon-share"></span>
                                                </div>
                                                <ul className="team-two__social list-unstyled">
                                                    {member.socialLinks.map((social, idx) => (
                                                        <li key={idx}>
                                                            <Link to={social.url}>
                                                                <span className={social.icon}></span>
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </section>
            {/*Team Two End */}
        </>
    );
}
