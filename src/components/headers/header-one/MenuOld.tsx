import { Link } from "react-router-dom";
import Logo1 from "@/assets/images/resources/logo-1.png";
import MenuList from "@/components/MenuList";
import { useContext } from 'react';
import FinrisContext from '@/components/context/FinrisContext';

export default function Menu() {
    const context = useContext(FinrisContext);
    if (!context) throw new Error("Context Null");
    const { setIsSearch, setIsSidebar, setIsMobile } = context;
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
                        <Link  onClick={() => setIsMobile((pre) => !pre)}  to="#" className="mobile-nav__toggler">
                            <i className="fa fa-bars"></i>
                        </Link>
                        <MenuList />
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
                                    <Link   onClick={() => setIsSearch(pre => !pre)}
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

                        {/* Chnage here Home */}
                         <div className="main-menu__nav-sidebar-icon">
                            <Link className="navSidebar-button" to="#"  onClick={() => setIsSidebar(pre => !pre)} >
                                <span className="icon-dots-menu-one"></span>
                                <span className="icon-dots-menu-two"></span>
                                <span className="icon-dots-menu-three"></span>
                            </Link>
                        </div>
                        {/* <div className="main-menu__btn-box">
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
