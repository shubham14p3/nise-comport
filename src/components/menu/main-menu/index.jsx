import { NavLink, Link } from "react-router-dom";
import { slugify } from "../../../utils";
import service from "../../../data/service.json";

const MainMenu = () => {
    return (
        <nav className="main-menu d-none d-lg-block">
            <ul className="d-flex">
                <li>
                    <NavLink to={process.env.PUBLIC_URL + "/Service"}>
                        Service
                    </NavLink>

                    <ul className="sub-menu">
                        {service.map((id, i) => {
                            return (
                                <li key={i} className="sub-menu-item">
                                    <Link
                                        className="sub-menu-link"
                                        to={
                                            process.env.PUBLIC_URL +
                                            `/service-details/${slugify(
                                                id.title
                                            )}`
                                        }
                                    >
                                        {id.title}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </li>
                <li>
                    <NavLink to={process.env.PUBLIC_URL + "/Blog"}>
                        Blog
                    </NavLink>
                    {/* <ul className="sub-menu">
                        <li className="sub-menu-item">
                            <NavLink
                                className="sub-menu-link"
                                to={process.env.PUBLIC_URL + "/Blog"}
                            >
                                Blog
                            </NavLink>
                        </li>
                        <li className="sub-menu-item">
                            <NavLink
                                className="sub-menu-link"
                                to={
                                    process.env.PUBLIC_URL +
                                    "/Blog-left-sidebar"
                                }
                            >
                                blog grid left sidebar
                            </NavLink>
                        </li>
                        <li className="sub-menu-item">
                            <NavLink
                                className="sub-menu-link"
                                to={
                                    process.env.PUBLIC_URL +
                                    "/Blog-right-sidebar"
                                }
                            >
                                blog grid right sidebar
                            </NavLink>
                        </li>
                        <li className="sub-menu-item">
                            <NavLink
                                className="sub-menu-link"
                                to={process.env.PUBLIC_URL + "/Blog-details/1"}
                            >
                                blog details
                            </NavLink>
                        </li>
                    </ul> */}
                </li>
                {/* <li>
                    <NavLink to={process.env.PUBLIC_URL + "/contact"}>
                        Contact
                    </NavLink>
                </li> */}
                <li>
                    <NavLink to={process.env.PUBLIC_URL + "/Offer"}>
                        Offer
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/" end>
                        Company
                    </NavLink>
                    <ul className="sub-menu">
                        <li className="sub-menu-item">
                            <NavLink
                                className="sub-menu-link"
                                to={process.env.PUBLIC_URL + "/About"}
                            >
                                About
                            </NavLink>
                        </li>
                        <li className="sub-menu-item">
                            <NavLink
                                className="sub-menu-link"
                                to={process.env.PUBLIC_URL + "/Faq"}
                            >
                                Faq
                            </NavLink>
                        </li>
                        <li className="sub-menu-item">
                            <NavLink
                                className="sub-menu-link"
                                to={process.env.PUBLIC_URL + "/Team"}
                            >
                                Team
                            </NavLink>
                        </li>
                        <li className="sub-menu-item">
                            <NavLink
                                className="sub-menu-link"
                                to={process.env.PUBLIC_URL + "/Contact"}
                            >
                                Contact
                            </NavLink>
                        </li>
                    </ul>
                </li>
            </ul>
        </nav>
    );
};

export default MainMenu;
