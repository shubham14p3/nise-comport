import { Link } from "react-router-dom";
import Logo2 from "@/assets/images/resources/logo-2.png";
import React, { useState, useContext } from "react";
import FinrisContext from "./context/FinrisContext";

// optional avatar image
import UserAvatar from "@/assets/images/resources/user-avatar.png";
// if you do not have this image, remove the import and use fallback block

export default function MobileNav() {
    const context = useContext(FinrisContext);
    if (!context) throw new Error("FinrisContext is null");

    const { isMobile, setIsMobile } = context;
    const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({});

    // replace this later with your real auth state
    const isLoggedIn = false;

    const closeNav = () => {
        setIsMobile((prev) => !prev);
    };

    const closeMobileState = () => {
        setIsMobile(false);
        setExpandedMenus({});
    };

    const toggleDropdown = (menuKey: string, e: React.MouseEvent) => {
        e.preventDefault();
        setExpandedMenus((prev) => ({
            ...prev,
            [menuKey]: !prev[menuKey],
        }));
    };

    return (
        <div className={`mobile-nav__wrapper ${isMobile ? "expanded" : ""}`}>
            <div onClick={closeNav} className="mobile-nav__overlay mobile-nav__toggler"></div>

            <div className="mobile-nav__content">
                <span onClick={closeNav} className="mobile-nav__close mobile-nav__toggler">
                    <i className="fa fa-times"></i>
                </span>

                <div className="logo-box">
                    <Link to="/" onClick={closeMobileState} aria-label="logo image">
                        <img src={Logo2} width="150" alt="Logo" />
                    </Link>
                </div>

                <div className="mobile-nav__container">
                    <ul className="main-menu__list">
                        <li className={`dropdown ${expandedMenus["menu-services"] ? "expanded" : ""}`}>
                            <Link to="#" className={expandedMenus["menu-services"] ? "expanded" : ""}>
                                Services
                                <button
                                    aria-label="dropdown toggler"
                                    className={expandedMenus["menu-services"] ? "expanded" : ""}
                                    onClick={(e) => toggleDropdown("menu-services", e)}
                                >
                                    <i className="fa fa-angle-down"></i>
                                </button>
                            </Link>

                            <ul
                                className="shadow-box"
                                style={{ display: expandedMenus["menu-services"] ? "block" : "none" }}
                            >
                                <li><Link to="/services" onClick={closeMobileState}>Services</Link></li>
                                <li><Link to="/banking" onClick={closeMobileState}>Banking</Link></li>
                                <li><Link to="/education" onClick={closeMobileState}>Education</Link></li>
                                <li><Link to="/form-filing" onClick={closeMobileState}>Form Filing</Link></li>
                                <li><Link to="/fee-payment" onClick={closeMobileState}>Fee Payment</Link></li>
                                <li><Link to="/government-services" onClick={closeMobileState}>Government Services</Link></li>
                                <li><Link to="/insurance" onClick={closeMobileState}>Insurance</Link></li>
                            </ul>
                        </li>

                        <li className={`dropdown ${expandedMenus["menu-shop"] ? "expanded" : ""}`}>
                            <Link to="#" className={expandedMenus["menu-shop"] ? "expanded" : ""}>
                                Shop
                                <button
                                    aria-label="dropdown toggler"
                                    className={expandedMenus["menu-shop"] ? "expanded" : ""}
                                    onClick={(e) => toggleDropdown("menu-shop", e)}
                                >
                                    <i className="fa fa-angle-down"></i>
                                </button>
                            </Link>

                            <ul
                                className="shadow-box"
                                style={{ display: expandedMenus["menu-shop"] ? "block" : "none" }}
                            >
                                <li><Link to="/products" onClick={closeMobileState}>Products</Link></li>
                                <li><Link to="/cart" onClick={closeMobileState}>Cart</Link></li>
                                <li><Link to="/checkout" onClick={closeMobileState}>Checkout</Link></li>
                                <li><Link to="/wishlist" onClick={closeMobileState}>Wishlist</Link></li>
                            </ul>
                        </li>

                        <li>
                            <Link to="/blog" onClick={closeMobileState}>Blog</Link>
                        </li>

                        <li className={`dropdown ${expandedMenus["menu-company"] ? "expanded" : ""}`}>
                            <Link to="#" className={expandedMenus["menu-company"] ? "expanded" : ""}>
                                Company
                                <button
                                    aria-label="dropdown toggler"
                                    className={expandedMenus["menu-company"] ? "expanded" : ""}
                                    onClick={(e) => toggleDropdown("menu-company", e)}
                                >
                                    <i className="fa fa-angle-down"></i>
                                </button>
                            </Link>

                            <ul
                                className="shadow-box"
                                style={{ display: expandedMenus["menu-company"] ? "block" : "none" }}
                            >
                                <li><Link to="/about" onClick={closeMobileState}>About</Link></li>
                                <li><Link to="/faq" onClick={closeMobileState}>Faq</Link></li>
                                <li><Link to="/team" onClick={closeMobileState}>Team</Link></li>
                                <li><Link to="/testimonials" onClick={closeMobileState}>Testimonials</Link></li>
                                <li><Link to="/contact" onClick={closeMobileState}>Contact</Link></li>
                            </ul>
                        </li>
                    </ul>
                </div>

                <div className="mobile-auth-box">
                    {!isLoggedIn ? (
                        <Link
                            to="/login"
                            onClick={closeMobileState}
                            className="mobile-auth-icon"
                            aria-label="Login"
                            title="Login / Sign Up"
                        >
                            <i className="fa fa-user"></i>
                        </Link>
                    ) : (
                        <Link
                            to="/my-account"
                            onClick={closeMobileState}
                            className="mobile-auth-avatar"
                            aria-label="My Account"
                            title="My Account"
                        >
                            <img src={UserAvatar} alt="User Avatar" />
                        </Link>
                    )}
                </div>

                <div className="mobile-nav__top">
                    <div className="mobile-nav__social">
                        <Link to="#" className="fab fa-twitter"></Link>
                        <Link to="#" className="fab fa-facebook-square"></Link>
                        <Link to="#" className="fab fa-pinterest-p"></Link>
                        <Link to="#" className="fab fa-instagram"></Link>
                    </div>
                </div>
            </div>
        </div>
    );
}