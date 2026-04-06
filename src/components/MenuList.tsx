import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import HomeShowcase11 from "@/assets/images/home-showcase/home-showcase-1-1.jpg";
import HomeShowcase12 from "@/assets/images/home-showcase/home-showcase-1-2.jpg";
import HomeShowcase13 from "@/assets/images/home-showcase/home-showcase-1-3.jpg";
import HomeShowcase14 from "@/assets/images/home-showcase/home-showcase-1-4.jpg";
export default function MenuList() {
    const location = useLocation();
    const menuRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        if (!menuRef.current) return;

        const currentPath = location.pathname;
        const menu = menuRef.current;

        // Reset all active states
        menu.querySelectorAll("li").forEach((li) => {
            li.classList.remove("current");
        });

        // Home paths that belong to the megamenu
        const homePaths = [
            "/",
            "/index-one-page",
            "/index2",
            "/index2-one-page",
            "/index3",
            "/index3-one-page",
            "/index-dark",
        ];
        const topLevelItems = Array.from(menu.children) as HTMLLIElement[];

        topLevelItems.forEach((li) => {
            // ---------- MEGAMENU (Home) ----------
            if (li.classList.contains("megamenu")) {
                if (homePaths.includes(currentPath)) {
                    li.classList.add("current");
                }
                return;
            }

            const childUl = li.querySelector(":scope > ul");

            // ---------- DROPDOWN ITEMS ----------
            if (childUl) {
                const childLinks = childUl.querySelectorAll("a");
                let childMatched = false;

                childLinks.forEach((link) => {
                    const href = link.getAttribute("href");
                    if (href && href !== "#" && currentPath === href) {
                        childMatched = true;
                        link.closest("li")?.classList.add("current");
                    }
                });

                if (childMatched) {
                    li.classList.add("current");
                }
                return;
            }

            // ---------- NORMAL LINKS ----------
            const link = li.querySelector(":scope > a");
            const href = link?.getAttribute("href");

            if (href && href === currentPath) {
                li.classList.add("current");
            }
        });
    }, [location.pathname]);

    return (
        <ul className="main-menu__list" ref={menuRef}>
            <li className="dropdown megamenu">
                <Link to="#">Home </Link>
                <ul>
                    <li>
                        <section className="home-showcase">
                            <div className="container">
                                <div className="home-showcase__inner">
                                    <div className="row">
                                        <div className="col-lg-3">
                                            <div className="home-showcase__item">
                                                <div className="home-showcase__image">
                                                    <img src={HomeShowcase11} />
                                                    <div className="home-showcase__buttons">
                                                        <Link
                                                            to="/"
                                                            className="thm-btn home-showcase__buttons__item"
                                                        >
                                                            Multi Page
                                                            <span className="fas fa-arrow-right"></span>
                                                        </Link>
                                                        <Link
                                                            to="/index-one-page"
                                                            className="thm-btn home-showcase__buttons__item"
                                                        >
                                                            One Page
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
                                                    <img src={HomeShowcase12} />
                                                    <div className="home-showcase__buttons">
                                                        <Link
                                                            to="/index2"
                                                            className="thm-btn home-showcase__buttons__item"
                                                        >
                                                            Multi Page
                                                            <span className="fas fa-arrow-right"></span>
                                                        </Link>
                                                        <Link
                                                            to="/index2-one-page"
                                                            className="thm-btn home-showcase__buttons__item"
                                                        >
                                                            One Page
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
                                                    <img src={HomeShowcase13} />
                                                    <div className="home-showcase__buttons">
                                                        <Link
                                                            to="/index3"
                                                            className="thm-btn home-showcase__buttons__item"
                                                        >
                                                            Multi Page
                                                            <span className="fas fa-arrow-right"></span>
                                                        </Link>
                                                        <Link
                                                            to="/index3-one-page"
                                                            className="thm-btn home-showcase__buttons__item"
                                                        >
                                                            One Page
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
                                                    <img src={HomeShowcase14} />
                                                    <div className="home-showcase__buttons">
                                                        <Link
                                                            to="/index-dark"
                                                            className="thm-btn home-showcase__buttons__item"
                                                        >
                                                            Dark Page
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
            <li>
                <Link to="/about">About</Link>
            </li>
            <li className="dropdown">
                <Link to="#">Pages</Link>
                <ul className="shadow-box">
                    <li>
                        <Link to="/team">Team</Link>
                    </li>
                    <li>
                        <Link to="/team-details">Team Details</Link>
                    </li>
                    <li>
                        <Link to="/projects">Projects</Link>
                    </li>
                    <li>
                        <Link to="/project-details">Project Details</Link>
                    </li>
                    <li>
                        <Link to="/testimonials">Testimonials</Link>
                    </li>
                    <li>
                        <Link to="/pricing">Pricing</Link>
                    </li>
                    <li>
                        <Link to="/faq">FAQs</Link>
                    </li>
                    <li>
                        <Link to="/404">404 Error</Link>
                    </li>
                </ul>
            </li>
            <li className="dropdown">
                <Link to="#">services</Link>
                <ul className="shadow-box">
                    <li>
                        <Link to="/services">Services</Link>
                    </li>
                    <li>
                        <Link to="/ui-ux-design">UI/UX Design</Link>
                    </li>
                    <li>
                        <Link to="/web-development">Web Development</Link>
                    </li>
                    <li>
                        <Link to="/digital-marketing">Digital Marketing</Link>
                    </li>
                    <li>
                        <Link to="/business-analysis">Business Analysis</Link>
                    </li>
                    <li>
                        <Link to="/software-development">
                            Software Development
                        </Link>
                    </li>
                    <li>
                        <Link to="/product-design">Product Design</Link>
                    </li>
                </ul>
            </li>
            <li className="dropdown">
                <Link to="#">Shop</Link>
                <ul className="shadow-box">
                    <li>
                        <Link to="/products">Products</Link>
                    </li>
                    <li>
                        <Link to="/product-details">Product Details</Link>
                    </li>
                    <li>
                        <Link to="/cart">Cart</Link>
                    </li>
                    <li>
                        <Link to="/checkout">Checkout</Link>
                    </li>
                    <li>
                        <Link to="/wishlist">Wishlist</Link>
                    </li>
                    <li>
                        <Link to="/sign-up">Sign Up</Link>
                    </li>
                    <li>
                        <Link to="/login">Login</Link>
                    </li>
                </ul>
            </li>
            <li className="dropdown">
                <Link to="#">Blog</Link>
                <ul className="shadow-box">
                    <li>
                        <Link to="/blog">Blog</Link>
                    </li>
                    <li>
                        <Link to="/blog-standard">Blog Standard</Link>
                    </li>
                    <li>
                        <Link to="/blog-left-sidebar">Blog Left Sidebar</Link>
                    </li>
                    <li>
                        <Link to="/blog-right-sidebar">Blog Right Sidebar</Link>
                    </li>
                    <li>
                        <Link to="/blog-details">Blog Details</Link>
                    </li>
                </ul>
            </li>
            <li>
                <Link to="/contact">Contact</Link>
            </li>
        </ul>
    );
}
