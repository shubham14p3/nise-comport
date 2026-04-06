import { Link } from "react-router-dom";
import Logo2 from "@/assets/images/resources/logo-2.png";
import MenuList from "@/components/MenuList";
import { useContext } from 'react';
import FinrisContext from '@/components/context/FinrisContext';

export default function Menu() {
    const context = useContext(FinrisContext);
    if (!context) throw new Error("Context Null");
    const { setIsSearch, setIsMobile } = context;
    return (
        <>
            <div className="main-menu-two__wrapper">
                <div className="main-menu-two__wrapper-inner">
                    <div className="main-menu-two__left">
                        <div className="main-menu-two__logo">
                            <Link to="/">
                                <img src={Logo2} />
                            </Link>
                        </div>
                    </div>
                    <div className="main-menu-two__main-menu-box">
                        <Link   onClick={() => setIsMobile((pre) => !pre)} to="#" className="mobile-nav__toggler">
                            <i className="fa fa-bars"></i>
                        </Link>
                        <MenuList />
                    </div>
                    <div className="main-menu-two__right">
                        <div className="main-menu-two__search-box"  onClick={() => setIsSearch(pre => !pre)}>
                            <span className="main-menu-two__search searcher-toggler-box fal fa-search"></span>
                        </div>
                        <div className="main-menu-two__cart">
                            <Link to="/cart">
                                <span className="fal fa-shopping-cart"></span>
                                <span className="main-menu-two__cart-count">
                                    02
                                </span>
                            </Link>
                        </div>
                        <div className="main-menu-two__user">
                            <Link to="/sign-up">
                                <span className="far fa-users"></span>
                            </Link>
                        </div>
                        <div className="main-menu-two__btn-box">
                            <Link to="/about" className="thm-btn">
                                Discover More
                                <span className="fas fa-arrow-right"></span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
