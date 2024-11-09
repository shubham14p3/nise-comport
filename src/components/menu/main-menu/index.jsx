import { NavLink, Link } from "react-router-dom";
import { slugify } from "../../../utils";
import service from "../../../data/service.json";

const MainMenu = () => {
    return (
        <nav className="main-menu d-none d-lg-block">
            <ul className="d-flex">
                <li>
                    <NavLink to={"/Service"}>
                        Service
                    </NavLink>

                    <ul className="sub-menu">
                        {service.map((id, i) => {
                            return (
                                <li key={i} className="sub-menu-item">
                                    <Link
                                        className="sub-menu-link"
                                        to={
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
                    <NavLink to={"/Blog"}>
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
                    <NavLink to={"/offer"}>
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
                                to={"/About"}
                            >
                                About
                            </NavLink>
                        </li>
                        <li className="sub-menu-item">
                            <NavLink
                                className="sub-menu-link"
                                to={"/Faq"}
                            >
                                Faq
                            </NavLink>
                        </li>
                        <li className="sub-menu-item">
                            <NavLink
                                className="sub-menu-link"
                                to={"/Team"}
                            >
                                Team
                            </NavLink>
                        </li>
                        <li className="sub-menu-item">
                            <NavLink
                                className="sub-menu-link"
                                to={"/Contact"}
                            >
                                Contact
                            </NavLink>
                        </li>
                    </ul>
                </li>
                {/* <li>
                    <NavLink
                        // className="sub-menu-link"
                        to={"/login"}
                    >
                        LogIn
                    </NavLink>
                    <ul className="sub-menu">
                        <li className="sub-menu-item">
                            <NavLink
                                className="sub-menu-link"
                                to={process.env.PUBLIC_URL + "/profile"}
                            >
                                Profile
                            </NavLink>
                        </li>
                    </ul>
                </li> */}
            </ul>
        </nav>
    );
};

export default MainMenu;
