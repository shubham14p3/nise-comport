import { Link } from "react-router-dom";
import { teamData } from "@/data/team";

export default function TeamPage() {
    return (
        <>
            {/*Team Page Start*/}
            <section className="team-page">
                <div className="container">
                    <div className="row">
                        {teamData.map((member) => (
                            <div key={member.id} className="col-xl-3 col-lg-6 col-md-6">
                                <div className="team-two__single">
                                    <div className="team-two__img-box">
                                        <div className="team-two__img">
                                            <img src={member.image} alt={member.name} />
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
                                                {member.socialLinks.map((social) => (
                                                    <li key={social.platform}>
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
                        ))}
                    </div>
                </div>
            </section>
            {/*Team Page End*/}
        </>
    );
}

