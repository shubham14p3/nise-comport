import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Menu from "@/components/headers/header-one/Menu";

export default function Header() {
    const [isStick, setIsSticky] = useState<boolean>(false);
    const headerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (headerRef.current) {
                const headerHeight = headerRef.current.offsetHeight;
                if (window.scrollY > headerHeight) {
                    setIsSticky(true);
                } else {
                    setIsSticky(false);
                }
            }
        };

        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    return (
        <>
            <header ref={headerRef} className="main-header">
                <div className="main-menu__top">
                    <div className="main-menu__top-inner">
                        <ul className="list-unstyled main-menu__contact-list">
                            <li>
                                <div className="icon">
                                    <i className="icon-email"></i>
                                </div>
                                <div className="text">
                                    <p>
                                        <a href="mailto:info@Itzone24.com">
                                            info@nisecomport.com
                                        </a>
                                    </p>
                                </div>
                            </li>
                            <li>
                                <div className="icon">
                                    <i className="icon-pin"></i>
                                </div>
                                <div className="text">
                                    <p>Shop No 3, Kharangajhar, Telco,</p>
                                </div>
                            </li>
                        </ul>
                        <p className="main-menu__top-welcome-text">
                            Welcome to NISE COMPORT आपका अपना प्रज्ञा केंद्र
                        </p>
                        <div className="main-menu__top-right">
                            <p className="main-menu__social-title">
                                Follow Us On:
                            </p>
                            <div className="main-menu__social">
                                <Link to="#">
                                    <i className="fab fa-twitter"></i>
                                </Link>
                                <Link to="#">
                                    <i className="fab fa-facebook"></i>
                                </Link>
                                <Link to="#">
                                    <i className="fab fa-pinterest-p"></i>
                                </Link>
                                <Link to="#">
                                    <i className="fab fa-instagram"></i>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
                <nav className="main-menu">
                    <Menu />
                </nav>
            </header>

            <div
                className={`stricky-header stricked-menu main-menu ${isStick ? "stricky-fixed" : ""}`}
            >
                <div className="sticky-header__content">
                    <Menu />
                </div>
                {/* /.sticky-header__content */}
            </div>
        </>
    );
}
