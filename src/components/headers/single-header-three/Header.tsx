import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Menu from "@/components/headers/single-header-three/Menu";

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
            <header ref={headerRef} className="main-header-three">
                <div className="main-menu-three__top">
                    <div className="container">
                        <div className="main-menu-three__top-inner">
                            <div className="main-menu-three__top-social">
                                <Link to="#">
                                    <span className="icon-facebook-app-symbol"></span>
                                </Link>
                                <Link to="#">
                                    <span className="icon-twitter-1"></span>
                                </Link>
                                <Link to="#">
                                    <span className="icon-linkedin"></span>
                                </Link>
                                <Link to="#">
                                    <span className="icon-pinterest"></span>
                                </Link>
                            </div>
                            <ul className="list-unstyled main-menu-three__contact-list">
                                <li>
                                    <div className="icon">
                                        <i className="icon-pin"></i>
                                    </div>
                                    <div className="text">
                                        <p>
                                            1629 N. Dixie Avenue, Kentucky,
                                            42701
                                        </p>
                                    </div>
                                </li>
                                <li>
                                    <div className="icon">
                                        <i className="icon-mail"></i>
                                    </div>
                                    <div className="text">
                                        <p>
                                            <a href="mailto:example@domain.com">
                                                example@domain.com
                                            </a>
                                        </p>
                                    </div>
                                </li>
                                <li>
                                    <div className="icon">
                                        <i className="icon-phone-call"></i>
                                    </div>
                                    <div className="text">
                                        <p>
                                            <a href="tel:1212345678900">
                                                +12 (123) 456 78900
                                            </a>
                                        </p>
                                    </div>
                                </li>
                            </ul>
                            <ul className="list-unstyled main-menu-three__top-menu">
                                <li>
                                    <Link to="/about">Help</Link>
                                </li>
                                <li>
                                    <Link to="/contact">Support</Link>
                                </li>
                                <li>
                                    <Link to="/faq">Faqs</Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <nav className="main-menu main-menu-three">
                    <Menu />
                </nav>
            </header>

            <div
                className={`stricky-header stricked-menu main-menu main-menu-three ${isStick ? "stricky-fixed" : ""}`}
            >
                <div className="sticky-header__content">
                    <Menu />
                </div>
                {/* /.sticky-header__content */}
            </div>
        </>
    );
}
