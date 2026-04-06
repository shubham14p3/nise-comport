import { Link } from "react-router-dom";
import Logo2 from "@/assets/images/resources/logo-2.png";
import HomeShowcase11 from "@/assets/images/home-showcase/home-showcase-1-1.jpg";
import HomeShowcase12 from "@/assets/images/home-showcase/home-showcase-1-2.jpg";
import HomeShowcase13 from "@/assets/images/home-showcase/home-showcase-1-3.jpg";
import HomeShowcase14 from "@/assets/images/home-showcase/home-showcase-1-4.jpg";
import React, { useState, useContext } from 'react';
import FinrisContext from "./context/FinrisContext";

export default function MobileNav() {
    const context = useContext(FinrisContext);
    if (!context) throw new Error("FinrisContext is null");

    const { isMobile, setIsMobile } = context;
    const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({});

    const closeNav = () => {
        setIsMobile((pre) => !pre);
    };

    const closeMobileState = () => {
        setIsMobile(false);
        setExpandedMenus({});
    };

    const toggleDropdown = (menuKey: string, e: React.MouseEvent) => {
        e.preventDefault();
        setExpandedMenus(prev => ({
            ...prev,
            [menuKey]: !prev[menuKey]
        }));
    };



    return (
        <>
            <div className={`mobile-nav__wrapper ${isMobile ? 'expanded' : ''}`}>
                <div onClick={closeNav} className="mobile-nav__overlay mobile-nav__toggler"></div>
                {/* /.mobile-nav__overlay */}
                <div className="mobile-nav__content">
                    <span onClick={closeNav} className="mobile-nav__close mobile-nav__toggler"><i className="fa fa-times"></i></span>

                    <div className="logo-box">
                        <Link to="/" onClick={closeMobileState} aria-label="logo image"><img src={Logo2} width="150" alt="Logo" /></Link>
                    </div>
                    {/* /.logo-box */}
                    <div className="mobile-nav__container">
                        <ul className="main-menu__list">
                            <li className={`dropdown megamenu ${expandedMenus['menu-home'] ? 'expanded' : ''}`}>
                                <Link to="#" className={expandedMenus['menu-home'] ? 'expanded' : ''}>
                                    Home
                                    <button
                                        aria-label="dropdown toggler"
                                        className={expandedMenus['menu-home'] ? 'expanded' : ''}
                                        onClick={(e) => toggleDropdown('menu-home', e)}
                                    >
                                        <i className="fa fa-angle-down"></i>
                                    </button>
                                </Link>
                                <ul style={{ display: expandedMenus['menu-home'] ? 'block' : 'none' }}>
                                    <li>
                                        <section className="home-showcase">
                                            <div className="container">
                                                <div className="home-showcase__inner">
                                                    <div className="row">
                                                        <div className="col-lg-3">
                                                            <div className="home-showcase__item">
                                                                <div className="home-showcase__image">
                                                                    <img src={HomeShowcase11} alt="Home Page 01" />
                                                                    <div className="home-showcase__buttons">
                                                                        <Link to="/" className="thm-btn home-showcase__buttons__item" onClick={closeMobileState}>
                                                                            Multi Page
                                                                            <span className="fas fa-arrow-right"></span>
                                                                        </Link>
                                                                        <Link to="/index-one-page" className="thm-btn home-showcase__buttons__item" onClick={closeMobileState}>
                                                                            One Page
                                                                            <span className="fas fa-arrow-right"></span>
                                                                        </Link>
                                                                    </div>
                                                                    {/* /.home-showcase__buttons */}
                                                                </div>{/* /.home-showcase__image */}
                                                                <h3 className="home-showcase__title">Home
                                                                    Page
                                                                    01</h3>
                                                                {/* /.home-showcase__title */}
                                                            </div>{/* /.home-showcase__item */}
                                                        </div>{/* /.col-lg-3 */}
                                                        <div className="col-lg-3">
                                                            <div className="home-showcase__item">
                                                                <div className="home-showcase__image">
                                                                    <img src={HomeShowcase12} alt="Home Page 02" />
                                                                    <div className="home-showcase__buttons">
                                                                        <Link to="/index2" className="thm-btn home-showcase__buttons__item" onClick={closeMobileState}>
                                                                            Multi Page
                                                                            <span className="fas fa-arrow-right"></span>
                                                                        </Link>
                                                                        <Link to="/index2-one-page" className="thm-btn home-showcase__buttons__item" onClick={closeMobileState}>
                                                                            One Page
                                                                            <span className="fas fa-arrow-right"></span>
                                                                        </Link>
                                                                    </div>
                                                                    {/* /.home-showcase__buttons */}
                                                                </div>{/* /.home-showcase__image */}
                                                                <h3 className="home-showcase__title">Home
                                                                    Page
                                                                    02
                                                                </h3>{/* /.home-showcase__title */}
                                                            </div>{/* /.home-showcase__item */}
                                                        </div>{/* /.col-lg-3 */}
                                                        <div className="col-lg-3">
                                                            <div className="home-showcase__item">
                                                                <div className="home-showcase__image">
                                                                    <img src={HomeShowcase13} alt="Home Page 03" />
                                                                    <div className="home-showcase__buttons">
                                                                        <Link to="/index3" className="thm-btn home-showcase__buttons__item" onClick={closeMobileState}>
                                                                            Multi Page
                                                                            <span className="fas fa-arrow-right"></span>
                                                                        </Link>
                                                                        <Link to="/index3-one-page" className="thm-btn home-showcase__buttons__item" onClick={closeMobileState}>
                                                                            One Page
                                                                            <span className="fas fa-arrow-right"></span>
                                                                        </Link>
                                                                    </div>
                                                                    {/* /.home-showcase__buttons */}
                                                                </div>{/* /.home-showcase__image */}
                                                                <h3 className="home-showcase__title">Home
                                                                    Page
                                                                    03
                                                                </h3>{/* /.home-showcase__title */}
                                                            </div>{/* /.home-showcase__item */}
                                                        </div>{/* /.col-lg-3 */}
                                                        <div className="col-lg-3">
                                                            <div className="home-showcase__item">
                                                                <div className="home-showcase__image">
                                                                    <img src={HomeShowcase14} alt="Dark Page" />
                                                                    <div className="home-showcase__buttons">
                                                                        <Link to="/index-dark" className="thm-btn home-showcase__buttons__item" onClick={closeMobileState}>Dark
                                                                            Page
                                                                            <span className="fas fa-arrow-right"></span>
                                                                        </Link>
                                                                    </div>
                                                                    {/* /.home-showcase__buttons */}
                                                                </div>{/* /.home-showcase__image */}
                                                                <h3 className="home-showcase__title">Dark Page
                                                                </h3>{/* /.home-showcase__title */}
                                                            </div>{/* /.home-showcase__item */}
                                                        </div>{/* /.col-lg-3 */}
                                                    </div>{/* /.row */}
                                                </div>{/* /.home-showcase__inner */}

                                            </div>{/* /.container */}
                                        </section>
                                    </li>
                                </ul>
                            </li>
                            <li>
                                <Link to="/about" onClick={closeMobileState}>About</Link>
                            </li>
                            <li className={`dropdown ${expandedMenus['menu-pages'] ? 'expanded' : ''}`}>
                                <Link to="#" className={expandedMenus['menu-pages'] ? 'expanded' : ''}>
                                    Pages
                                    <button
                                        aria-label="dropdown toggler"
                                        className={expandedMenus['menu-pages'] ? 'expanded' : ''}
                                        onClick={(e) => toggleDropdown('menu-pages', e)}
                                    >
                                        <i className="fa fa-angle-down"></i>
                                    </button>
                                </Link>
                                <ul className="shadow-box" style={{ display: expandedMenus['menu-pages'] ? 'block' : 'none' }}>
                                    <li><Link to="/team" onClick={closeMobileState}>Team</Link></li>
                                    <li><Link to="/team-details" onClick={closeMobileState}>Team Details</Link></li>
                                    <li><Link to="/projects" onClick={closeMobileState}>Projects</Link></li>
                                    <li><Link to="/project-details" onClick={closeMobileState}>Project Details</Link></li>
                                    <li><Link to="/testimonials" onClick={closeMobileState}>Testimonials</Link></li>
                                    <li><Link to="/pricing" onClick={closeMobileState}>Pricing</Link></li>
                                    <li><Link to="/faq" onClick={closeMobileState}>FAQs</Link></li>
                                    <li><Link to="/404" onClick={closeMobileState}>404 Error</Link></li>
                                </ul>
                            </li>
                            <li className={`dropdown ${expandedMenus['menu-services'] ? 'expanded' : ''}`}>
                                <Link to="#" className={expandedMenus['menu-services'] ? 'expanded' : ''}>
                                    services
                                    <button
                                        aria-label="dropdown toggler"
                                        className={expandedMenus['menu-services'] ? 'expanded' : ''}
                                        onClick={(e) => toggleDropdown('menu-services', e)}
                                    >
                                        <i className="fa fa-angle-down"></i>
                                    </button>
                                </Link>
                                <ul className="shadow-box" style={{ display: expandedMenus['menu-services'] ? 'block' : 'none' }}>
                                    <li><Link to="/services" onClick={closeMobileState}>Services</Link></li>
                                    <li><Link to="/ui-ux-design" onClick={closeMobileState}>UI/UX Design</Link></li>
                                    <li><Link to="/web-development" onClick={closeMobileState}>Web Development</Link></li>
                                    <li><Link to="/digital-marketing" onClick={closeMobileState}>Digital Marketing</Link></li>
                                    <li><Link to="/business-analysis" onClick={closeMobileState}>Business Analysis</Link></li>
                                    <li><Link to="/software-development" onClick={closeMobileState}>Software Development</Link></li>
                                    <li><Link to="/product-design" onClick={closeMobileState}>Product Design</Link></li>
                                </ul>
                            </li>
                            <li className={`dropdown ${expandedMenus['menu-shop'] ? 'expanded' : ''}`}>
                                <Link to="#" className={expandedMenus['menu-shop'] ? 'expanded' : ''}>
                                    Shop
                                    <button
                                        aria-label="dropdown toggler"
                                        className={expandedMenus['menu-shop'] ? 'expanded' : ''}
                                        onClick={(e) => toggleDropdown('menu-shop', e)}
                                    >
                                        <i className="fa fa-angle-down"></i>
                                    </button>
                                </Link>
                                <ul className="shadow-box" style={{ display: expandedMenus['menu-shop'] ? 'block' : 'none' }}>
                                    <li><Link to="/products" onClick={closeMobileState}>Products</Link></li>
                                    <li><Link to="/product-details" onClick={closeMobileState}>Product Details</Link></li>
                                    <li><Link to="/cart" onClick={closeMobileState}>Cart</Link></li>
                                    <li><Link to="/checkout" onClick={closeMobileState}>Checkout</Link></li>
                                    <li><Link to="/wishlist" onClick={closeMobileState}>Wishlist</Link></li>
                                    <li><Link to="/sign-up" onClick={closeMobileState}>Sign Up</Link></li>
                                    <li><Link to="/login" onClick={closeMobileState}>Login</Link></li>
                                </ul>
                            </li>
                            <li className={`dropdown ${expandedMenus['menu-blog'] ? 'expanded' : ''}`}>
                                <Link to="#" className={expandedMenus['menu-blog'] ? 'expanded' : ''}>
                                    Blog
                                    <button
                                        aria-label="dropdown toggler"
                                        className={expandedMenus['menu-blog'] ? 'expanded' : ''}
                                        onClick={(e) => toggleDropdown('menu-blog', e)}
                                    >
                                        <i className="fa fa-angle-down"></i>
                                    </button>
                                </Link>
                                <ul className="shadow-box" style={{ display: expandedMenus['menu-blog'] ? 'block' : 'none' }}>
                                    <li><Link to="/blog" onClick={closeMobileState}>Blog</Link></li>
                                    <li><Link to="/blog-standard" onClick={closeMobileState}>Blog Standard</Link></li>
                                    <li><Link to="/blog-left-sidebar" onClick={closeMobileState}>Blog Left Sidebar</Link></li>
                                    <li><Link to="/blog-right-sidebar" onClick={closeMobileState}>Blog Right Sidebar</Link></li>
                                    <li><Link to="/blog-details" onClick={closeMobileState}>Blog Details</Link></li>
                                </ul>
                            </li>
                            <li>
                                <Link to="/contact" onClick={closeMobileState}>Contact</Link>
                            </li>
                        </ul>
                    </div>
                    {/* /.mobile-nav__container */}

                    <ul className="mobile-nav__contact list-unstyled">
                        <li>
                            <i className="fa fa-envelope"></i>
                            <a href="mailto:needhelp@packageName__.com">needhelp@Itzone.com</a>
                        </li>
                        <li>
                            <i className="fas fa-phone"></i>
                            <a href="tel:666-888-0000">666 888 0000</a>
                        </li>
                    </ul>{/* /.mobile-nav__contact */}
                    <div className="mobile-nav__top">
                        <div className="mobile-nav__social">
                            <Link to="#" className="fab fa-twitter"></Link>
                            <Link to="#" className="fab fa-facebook-square"></Link>
                            <Link to="#" className="fab fa-pinterest-p"></Link>
                            <Link to="#" className="fab fa-instagram"></Link>
                        </div>{/* /.mobile-nav__social */}
                    </div>{/* /.mobile-nav__top */}
                </div>
                {/* /.mobile-nav__content */}
            </div>
        </>
    );
}