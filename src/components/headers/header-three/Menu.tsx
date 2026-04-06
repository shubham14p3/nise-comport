import { Link } from "react-router-dom";
import Logo1 from "@/assets/images/resources/logo-1.png";
import MenuList from "@/components/MenuList";
import { useContext } from 'react';
import FinrisContext from '@/components/context/FinrisContext';

export default function Menu() {
    const context = useContext(FinrisContext);
    if (!context) throw new Error("Context Null");
    const { setIsSearch,setIsMobile } = context;
    return (
        <>
            <div className="main-menu-three__wrapper">
                <div className="container">
                    <div className="main-menu-three__wrapper-inner">
                        <div className="main-menu-three__left">
                            <div className="main-menu-three__logo">
                                <Link to="/">
                                    <img src={Logo1} />
                                </Link>
                            </div>
                        </div>
                        <div className="main-menu-three__main-menu-box">
                            <Link   onClick={() => setIsMobile((pre) => !pre)} to="#" className="mobile-nav__toggler">
                                <i className="fa fa-bars"></i>
                            </Link>
                            <MenuList />
                        </div>
                        <div className="main-menu-three__right">
                            <div className="main-menu-three__search-box">
                                <Link onClick={() => setIsSearch(pre => !pre)}
                                    to="#"
                                    className="main-menu-three__search searcher-toggler-box fal fa-search"
                                ></Link>
                            </div>
                            <div className="main-menu-three__btn-box">
                                <Link to="/contact" className="thm-btn">
                                    Get in Touch
                                    <span className="icon-right-arrow"></span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
