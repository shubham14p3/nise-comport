import { Link } from "react-router-dom";
import FadeInAdvanced from "@/components/elements/FadeInAdvanced";
import { projectsData } from "@/data/projects";

export default function ProjectPage() {
    return (
        <>
            {/*Project Page Start*/}
            <section className="project-page">
                <div className="container">
                    <div className="row">
                        {projectsData.map((project) => (
                            <div key={project.id} className="col-xl-3 col-lg-6 col-md-6">
                                <FadeInAdvanced variant={"fadeInLeft"} delay={project.delay}>
                                    <div className="project-two__single">
                                        <div className="project-two__img-box">
                                            <div className="project-two__img">
                                                <img src={project.image} alt={project.title} />
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
                                </FadeInAdvanced>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            {/*Project Page End*/}
        </>
    );
}
