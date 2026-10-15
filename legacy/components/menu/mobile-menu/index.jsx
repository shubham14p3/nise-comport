import PropTypes from "prop-types";
import { NavLink, Link } from "react-router-dom";
import {
    getClosest,
    getSiblings,
    slideToggle,
    slideUp,
    slugify,
} from "../../../utils";
import Logo from "../../logo";
import service from "../../../data/service.json";
import { getImage } from "../../../data/getImage";

const MobileMenu = ({ show, onClose }) => {
    const onClickHandler = (e) => {
        const target = e.currentTarget;
        const parentEl = target.parentElement;
        if (
            parentEl?.classList.contains("menu-expand") ||
            target.classList.contains("menu-expand")
        ) {
            const element = target.classList.contains("icon")
                ? parentEl
                : target;
            const parent = getClosest(element, "li");
            const childNodes = parent.childNodes;
            const parentSiblings = getSiblings(parent);
            parentSiblings.forEach((sibling) => {
                const sibChildNodes = sibling.childNodes;
                sibChildNodes.forEach((child) => {
                    if (child.nodeName === "UL") {
                        slideUp(child, 1000);
                    }
                });
            });
            childNodes.forEach((child) => {
                if (child.nodeName === "UL") {
                    slideToggle(child, 1000);
                }
            });
        }
    };
    return (
        <div className={`offcanvas-modal ${show ? "show" : ""}`}>
            <div className="offcanvas-dialog">
                <div className="menu-content">
                    <div className="offcanvas-header">
                        <Logo
                            classOption="offcanvas-logo d-inline-block"
                            image={getImage('logo/logo.png')}
                        />
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                        ></button>
                    </div>

                    <nav id="offcanvasNav" className="offcanvas-menu">
                        <ul>
                            <li>
                                <NavLink
                                    to="/service"
                                >
                                    Service
                                </NavLink>
                                <span
                                    className="menu-expand"
                                    onClick={onClickHandler}
                                    aria-hidden="true"
                                ></span>
                                <ul>
                                    {service.map((id, i) => {
                                        return (
                                            <li key={i}>
                                                <Link
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
                                <NavLink to="/blog">
                                    Blog
                                </NavLink>
                                {/* <span
                                    className="menu-expand"
                                    onClick={onClickHandler}
                                    aria-hidden="true"
                                ></span>
                                <ul>
                                    <li>
                                        <NavLink
                                            to={
                                                import.meta.env.BASE_URL + "/blog"
                                            }
                                        >
                                            blog
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink
                                            to={
                                                import.meta.env.BASE_URL +
                                                "/blog-left-sidebar"
                                            }
                                        >
                                            blog grid left sidebar
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink
                                            to={
                                                import.meta.env.BASE_URL +
                                                "/blog-right-sidebar"
                                            }
                                        >
                                            blog grid right sidebar
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink
                                            to={
                                                import.meta.env.BASE_URL +
                                                "/blog-details/1"
                                            }
                                        >
                                            blog details
                                        </NavLink>
                                    </li>
                                </ul> */}
                            </li>
                            {/* <li>
                                <NavLink
                                    to={import.meta.env.BASE_URL + "/contact"}
                                >
                                    Contact
                                </NavLink>
                            </li> */}
                            <li>
                                <NavLink to="/offer">
                                    Offer
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/home" end>
                                    Company
                                </NavLink>
                                <span
                                    className="menu-expand"
                                    onClick={onClickHandler}
                                    aria-hidden="true"
                                ></span>
                                <ul>
                                    <li>
                                        <NavLink
                                            to="/About"
                                        >
                                            About
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink
                                            to="/faq"
                                        >
                                            Faq
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink
                                            to="/team"
                                        >
                                            Team
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink
                                            to="/Contact"
                                        >
                                            Contact
                                        </NavLink>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    );
};

MobileMenu.propTypes = {
    show: PropTypes.bool,
    onClose: PropTypes.func,
};

export default MobileMenu;
