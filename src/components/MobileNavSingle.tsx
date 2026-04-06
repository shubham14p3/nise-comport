import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import FinrisContext from '@/components/context/FinrisContext';
import Logo1 from '@/assets/images/resources/logo-2.png';
interface NavItem {
    linkId: string;
    navItem: string;
}

const navItems: NavItem[] = [
    {
        linkId: 'home',
        navItem: 'Home'
    },
    {
        linkId: 'about',
        navItem: 'About'
    },
    {
        linkId: 'services',
        navItem: 'Services'
    },
    {
        linkId: 'project',
        navItem: 'project'
    },
    {
        linkId: 'team',
        navItem: 'Team'
    },
    {
        linkId: 'contact',
        navItem: 'Contact'
    },
    {
        linkId: 'blog',
        navItem: 'Blog'
    }

];

const MobileNavSingle: React.FC = () => {
    const context = useContext(FinrisContext);
    if (!context) throw new Error("FinrisContext is null");

    const { isMobile, activeSection, scrollToSection, setIsMobile } = context;

    const closeNav = () => {
        setIsMobile((pre) => !pre);
    };

    const closeMobileState = () => {
        setIsMobile(false);
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
                        <img src={Logo1} width="150" alt="Logo" />
                    </Link>
                </div>

                <div className="mobile-nav__container">
                    <ul className="main-menu__list">
                        {navItems.map((item: NavItem) => (
                            <li
                                className={`scrollToLink ${activeSection === item.linkId ? 'current' : ''}`}
                                key={item.linkId}
                            >
                                <a
                                    href={`#${item.linkId}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        scrollToSection(item.linkId);
                                        closeMobileState();
                                    }}
                                >
                                    {item.navItem}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                <ul className="mobile-nav__contact list-unstyled">
                    <li>
                        <i className="fa fa-envelope"></i>
                        <a href="mailto:needhelp@MyStory.com">needhelp@MyStory.com</a>
                    </li>
                    <li>
                        <i className="fas fa-phone"></i>
                        <a href="tel:666-888-0000">666 888 0000</a>
                    </li>
                </ul>

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
};

export default MobileNavSingle;