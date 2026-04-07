import { Link } from "react-router-dom";
import Logo1 from "@/assets/images/resources/logo-1.png";
import MenuList from "@/components/MenuList";
import { useContext } from "react";
import FinrisContext from "@/components/context/FinrisContext";

// optional avatar image
import UserAvatar from "@/assets/images/resources/user-avatar.png";
// if you do not have this image, remove the import and fallback div will work

export default function Menu() {
    const context = useContext(FinrisContext);
    if (!context) throw new Error("Context Null");

    const { setIsSearch, setIsMobile } = context;

    // replace this later with your real auth state
    const isLoggedIn = false;

    return (
        <div className="main-menu__wrapper">
            <div className="main-menu__wrapper-inner">
                <div className="main-menu__left">
                    <div className="main-menu__logo">
                        <Link to="/" aria-label="Go to home page">
                            <img src={Logo1} alt="Logo" />
                        </Link>
                    </div>
                </div>

                <div className="main-menu__main-menu-box">
                    <Link
                        onClick={() => setIsMobile((prev) => !prev)}
                        to="#"
                        className="mobile-nav__toggler"
                        aria-label="Open mobile navigation"
                    >
                        <i className="fa fa-bars"></i>
                    </Link>

                    <MenuList />
                </div>

                <div className="main-menu__right">
                    <div className="main-menu__search-cart-box auth-right-box">
                        <div className="main-menu__search-box">
                            <Link
                                onClick={() => setIsSearch((prev) => !prev)}
                                to="#"
                                className="main-menu__search searcher-toggler-box fal fa-search"
                                aria-label="Search"
                                title="Search"
                            />
                        </div>

                        <div className="main-menu__cart-box">
                            <Link to="/cart" className="main-menu__cart" aria-label="Cart" title="Cart">
                                <span className="fal fa-shopping-cart"></span>
                                <span className="main-menu__cart-count">02</span>
                            </Link>
                        </div>

                        <div className="header-auth-box main-menu__cart-box">
                            {!isLoggedIn ? (
                                <Link
                                    to="/login"
                                    className="header-auth-icon"
                                    aria-label="Login"
                                    title="Login / Sign Up"
                                >
                                    <i className="fa fa-user"></i>
                                </Link>
                            ) : (
                                <Link
                                    to="/my-account"
                                    className="header-auth-avatar"
                                    aria-label="My Account"
                                    title="My Account"
                                >
                                    {/* if avatar image exists use img, otherwise fallback circle */}
                                    <img src={UserAvatar} alt="User Avatar" />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}