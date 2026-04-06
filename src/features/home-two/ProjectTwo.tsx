import { Link } from "react-router-dom";
import TextAnimation from "@/components/elements/TextAnimation";
import ProjectTwoShape1 from "@/assets/images/shapes/project-two-shape-1.png";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { projectsData } from "@/data/projects";

export default function ProjectTwo() {
    return (
        <>
            {/*Project Two Start */}
            <section className="project-two" id="project">
                <div className="project-two__shape-1 rotate-me">
                    <img src={ProjectTwoShape1} />
                </div>
                <div className="container">
                    <div className="section-title text-center sec-title-animation animation-style1">
                        <div className="section-title__tagline-box">
                            <span className="section-title__tagline">
                                Latest Project
                            </span>
                        </div>
                        <h2 className="section-title__title">
                            <TextAnimation style="s1">
                                Your Roadmap to Success with <br />
                                Trusted
                                <span>projects</span>
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
                        className="project-two__carousel owl-theme owl-carousel"
                    >
                        {projectsData.map((project) => (
                            <SwiperSlide key={project.id}>
                                <div className="item">
                                    <div className="project-two__single">
                                        <div className="project-two__img-box">
                                            <div className="project-two__img">
                                                <img src={project.image} />
                                                <div className="project-two__arrow">
                                                    <a
                                                        href={project.imageUrl}
                                                        className="img-popup"
                                                    >
                                                        <span className="fas fa-arrow-right"></span>
                                                    </a>
                                                </div>
                                            </div>
                                            <div className="project-two__content">
                                                <h3 className="project-two__title">
                                                    <Link to={project.link}>
                                                        {project.title}
                                                    </Link>
                                                </h3>
                                                <p className="project-two__sub-title">
                                                    {project.subtitle}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </section>
            {/*Project Two End */}
        </>
    );
}
