import { Link } from "react-router-dom";
import Logo1 from "@/assets/images/resources/logo-1.png";
import HomeShowcase11 from "@/assets/images/home-showcase/home-showcase-1-1.jpg";
import HomeShowcase12 from "@/assets/images/home-showcase/home-showcase-1-2.jpg";
import HomeShowcase13 from "@/assets/images/home-showcase/home-showcase-1-3.jpg";
import HomeShowcase14 from "@/assets/images/home-showcase/home-showcase-1-4.jpg";
import { useContext } from 'react';
import FinrisContext from '@/components/context/FinrisContext';
import { useOnePageMenuScroll } from '@/components/elements/useOnePageMenuScroll';

export default function Menu() {
    const context = useContext(FinrisContext);
    if (!context) throw new Error("Context Null");
    const { setIsSearch, setIsSidebar, setIsMobile, activeSection, scrollToSection } = context;

    useOnePageMenuScroll();
    return (
        <>
            <div className="main-menu__wrapper">
                <div className="main-menu__wrapper-inner">
                    <div className="main-menu__left">
                        <div className="main-menu__logo">
                            <Link to="/">
                                <img src={Logo1} />
                            </Link>
                        </div>
                    </div>
                    <div className="main-menu__main-menu-box">
                        <Link   onClick={() => setIsMobile((pre) => !pre)} to="#" className="mobile-nav__toggler">
                            <i className="fa fa-bars"></i>
                        </Link>
                        <ul className="main-menu__list one-page-scroll-menu">
                            <li className={`dropdown megamenu scrollToLink ${activeSection === 'home' ? 'current' : ''}`}>
                                <a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>Home </a>
                                <ul>
                                    <li>
                                        <section className="home-showcase">
                                            <div className="container">
                                                <div className="home-showcase__inner">
                                                    <div className="row">
                                                        <div className="col-lg-3">
                                                            <div className="home-showcase__item">
                                                                <div className="home-showcase__image">
                                                                    <img
                                                                        src={
                                                                            HomeShowcase11
                                                                        }
                                                                    />
                                                                    <div className="home-showcase__buttons">
                                                                        <Link
                                                                            to="/"
                                                                            className="thm-btn home-showcase__buttons__item"
                                                                        >
                                                                            Multi
                                                                            Page
                                                                            <span className="fas fa-arrow-right"></span>
                                                                        </Link>
                                                                        <Link
                                                                            to="/index-one-page"
                                                                            className="thm-btn home-showcase__buttons__item"
                                                                        >
                                                                            One
                                                                            Page
                                                                            <span className="fas fa-arrow-right"></span>
                                                                        </Link>
                                                                    </div>
                                                                    {/* /.home-showcase__buttons */}
                                                                </div>
                                                                {/* /.home-showcase__image */}
                                                                <h3 className="home-showcase__title">
                                                                    Home Page 01
                                                                </h3>
                                                                {/* /.home-showcase__title */}
                                                            </div>
                                                            {/* /.home-showcase__item */}
                                                        </div>
                                                        {/* /.col-lg-3 */}
                                                        <div className="col-lg-3">
                                                            <div className="home-showcase__item">
                                                                <div className="home-showcase__image">
                                                                    <img
                                                                        src={
                                                                            HomeShowcase12
                                                                        }
                                                                    />
                                                                    <div className="home-showcase__buttons">
                                                                        <Link
                                                                            to="/index2"
                                                                            className="thm-btn home-showcase__buttons__item"
                                                                        >
                                                                            Multi
                                                                            Page
                                                                            <span className="fas fa-arrow-right"></span>
                                                                        </Link>
                                                                        <Link
                                                                            to="/index2-one-page"
                                                                            className="thm-btn home-showcase__buttons__item"
                                                                        >
                                                                            One
                                                                            Page
                                                                            <span className="fas fa-arrow-right"></span>
                                                                        </Link>
                                                                    </div>
                                                                    {/* /.home-showcase__buttons */}
                                                                </div>
                                                                {/* /.home-showcase__image */}
                                                                <h3 className="home-showcase__title">
                                                                    Home Page 02
                                                                </h3>
                                                                {/* /.home-showcase__title */}
                                                            </div>
                                                            {/* /.home-showcase__item */}
                                                        </div>
                                                        {/* /.col-lg-3 */}
                                                        <div className="col-lg-3">
                                                            <div className="home-showcase__item">
                                                                <div className="home-showcase__image">
                                                                    <img
                                                                        src={
                                                                            HomeShowcase13
                                                                        }
                                                                    />
                                                                    <div className="home-showcase__buttons">
                                                                        <Link
                                                                            to="/index3"
                                                                            className="thm-btn home-showcase__buttons__item"
                                                                        >
                                                                            Multi
                                                                            Page
                                                                            <span className="fas fa-arrow-right"></span>
                                                                        </Link>
                                                                        <Link
                                                                            to="/index3-one-page"
                                                                            className="thm-btn home-showcase__buttons__item"
                                                                        >
                                                                            One
                                                                            Page
                                                                            <span className="fas fa-arrow-right"></span>
                                                                        </Link>
                                                                    </div>
                                                                    {/* /.home-showcase__buttons */}
                                                                </div>
                                                                {/* /.home-showcase__image */}
                                                                <h3 className="home-showcase__title">
                                                                    Home Page 03
                                                                </h3>
                                                                {/* /.home-showcase__title */}
                                                            </div>
                                                            {/* /.home-showcase__item */}
                                                        </div>
                                                        {/* /.col-lg-3 */}
                                                        <div className="col-lg-3">
                                                            <div className="home-showcase__item">
                                                                <div className="home-showcase__image">
                                                                    <img
                                                                        src={
                                                                            HomeShowcase14
                                                                        }
                                                                    />
                                                                    <div className="home-showcase__buttons">
                                                                        <Link
                                                                            to="/index-dark"
                                                                            className="thm-btn home-showcase__buttons__item"
                                                                        >
                                                                            Dark
                                                                            Page
                                                                            <span className="fas fa-arrow-right"></span>
                                                                        </Link>
                                                                    </div>
                                                                    {/* /.home-showcase__buttons */}
                                                                </div>
                                                                {/* /.home-showcase__image */}
                                                                <h3 className="home-showcase__title">
                                                                    Dark Page
                                                                </h3>
                                                                {/* /.home-showcase__title */}
                                                            </div>
                                                            {/* /.home-showcase__item */}
                                                        </div>
                                                        {/* /.col-lg-3 */}
                                                    </div>
                                                    {/* /.row */}
                                                </div>
                                                {/* /.home-showcase__inner */}
                                            </div>
                                            {/* /.container */}
                                        </section>
                                    </li>
                                </ul>
                            </li>
                            <li className={`scrollToLink ${activeSection === 'about' ? 'current' : ''}`}>
                                <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>About</a>
                            </li>
                            <li className={`scrollToLink ${activeSection === 'services' ? 'current' : ''}`}>
                                <a href="#services" onClick={(e) => { e.preventDefault(); scrollToSection('services'); }}>Services</a>
                            </li>
                            <li className={`scrollToLink ${activeSection === 'project' ? 'current' : ''}`}>
                                <a href="#project" onClick={(e) => { e.preventDefault(); scrollToSection('project'); }}>Project</a>
                            </li>
                            <li className={`scrollToLink ${activeSection === 'team' ? 'current' : ''}`}>
                                <a href="#team" onClick={(e) => { e.preventDefault(); scrollToSection('team'); }}>Team</a>
                            </li>
                            <li className={`scrollToLink ${activeSection === 'contact' ? 'current' : ''}`}>
                                <a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a>
                            </li>
                            <li className={`scrollToLink ${activeSection === 'blog' ? 'current' : ''}`}>
                                <a href="#blog" onClick={(e) => { e.preventDefault(); scrollToSection('blog'); }}>Blog</a>
                            </li>
                        </ul>
                    </div>
                    <div className="main-menu__right">
                        <div className="main-menu__call">
                            <div className="main-menu__call-icon">
                                <i className="icon-call"></i>
                            </div>
                            <div className="main-menu__call-content">
                                <p className="main-menu__call-sub-title">
                                    Call Anytime
                                </p>
                                <h5 className="main-menu__call-number">
                                    <a href="tel:9288006780">
                                        +92 ( 8800 ) - 6780
                                    </a>
                                </h5>
                            </div>
                        </div>
                        <div className="main-menu__search-cart-box">
                            <div className="main-menu__search-cart-box">
                                <div className="main-menu__search-box">
                                    <Link  onClick={() => setIsSearch(pre => !pre)}
                                        to="#"
                                        className="main-menu__search searcher-toggler-box fal fa-search"
                                    ></Link>
                                </div>
                                <div className="main-menu__cart-box">
                                    <Link
                                        to="/cart"
                                        className="main-menu__cart"
                                    >
                                        <span className="fal fa-shopping-cart"></span>
                                        <span className="main-menu__cart-count">
                                            02
                                        </span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                        {/* <div className="main-menu__nav-sidebar-icon">
                            <Link  onClick={() => setIsSidebar(pre => !pre)} className="navSidebar-button" to="#">
                                <span className="icon-dots-menu-one"></span>
                                <span className="icon-dots-menu-two"></span>
                                <span className="icon-dots-menu-three"></span>
                            </Link>
                        </div>
                        <div className="main-menu__btn-box">
                            <Link to="/about" className="thm-btn">
                                Discover More
                                <span className="fas fa-arrow-right"></span>
                            </Link>
                        </div> */}
                    </div>
                </div>
            </div>
        </>
    );
}
