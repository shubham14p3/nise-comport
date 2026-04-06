import { Link } from "react-router-dom";
import TextAnimation from "@/components/elements/TextAnimation";
import { projectsData } from "@/data/projects";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { useState } from 'react';

export default function ProjectOne() {
    const [activeIndex, setActiveIndex] = useState(-1);

    const handleMouseEnter = (index: number) => {
        setActiveIndex(index);
    };

    // Group projects into chunks of 4 (4 projects per slide)
    const groupedProjects = [];
    for (let i = 0; i < projectsData.length; i += 4) {
        groupedProjects.push(projectsData.slice(i, i + 4));
    }

    return (
        <>
            {/* Project One Start */}
            <section className="project-one" id="project">
                <div className="container">
                    <div className="section-title text-center sec-title-animation animation-style1">
                        <div className="section-title__tagline-box">
                            <span className="section-title__tagline">
                                Portfolio
                            </span>
                        </div>
                        <h2 className="section-title__title">
                            <TextAnimation style="s1">
                                Explore Our Recent
                                <span>Projects</span>
                            </TextAnimation>
                        </h2>
                    </div>
                    <div className="project-one__carousel-container">
                        <div>
                            <Swiper
                                modules={[Pagination, Autoplay]}
                                spaceBetween={30}
                                slidesPerView={1}
                                className="project-one__carousel"
                                loop={true}
                                speed={500}
                                autoplay={{
                                    delay: 7000,
                                    disableOnInteraction: false,
                                    pauseOnMouseEnter: false,
                                }}
                            >
                                {groupedProjects.map((projectGroup, groupIndex) => (
                                    <SwiperSlide key={groupIndex}>
                                        <div className="item">
                                            <div className="project-one__single-box">
                                                <ul className="project-one__box list-unstyled">
                                                    {projectGroup.map((project, index) => (
                                                        <li
                                                            key={project.id}
                                                            className={activeIndex === index ? "active" : ""}
                                                            onMouseEnter={() => handleMouseEnter(index)}
                                                        >
                                                            <div className="project-one__box-content">
                                                                <div
                                                                    className="single-project-one__bg"
                                                                    style={{
                                                                        backgroundImage: `url(${project.image})`,
                                                                    }}
                                                                ></div>
                                                                <div className="project-one__title">
                                                                    <h3>
                                                                        <Link to={project.link}>
                                                                            {project.title}
                                                                        </Link>
                                                                    </h3>
                                                                </div>
                                                                <div className="project-one__content-box">
                                                                    <div className="project-one__icon">
                                                                        <a
                                                                            href={project.imageUrl}
                                                                            className="img-popup"
                                                                        >
                                                                            <span className="icon-right-arrow"></span>
                                                                        </a>
                                                                    </div>
                                                                    <div className="project-one__title-box">
                                                                        <h3 className="project-one__title-2">
                                                                            <Link to={project.link}>
                                                                                {project.title}
                                                                            </Link>
                                                                        </h3>
                                                                        <p className="project-one__text">
                                                                            {project.subtitle}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                    </div>
                </div>
            </section>
            {/* Project One End */}
        </>
    );
}
