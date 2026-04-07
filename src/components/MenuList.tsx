import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";

export default function MenuList() {
    const location = useLocation();
    const menuRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        if (!menuRef.current) return;

        const currentPath = location.pathname;
        const menu = menuRef.current;

        menu.querySelectorAll("li").forEach((li) => {
            li.classList.remove("current");
        });

        const topLevelItems = Array.from(menu.children) as HTMLLIElement[];

        topLevelItems.forEach((li) => {
            const childUl = li.querySelector(":scope > ul");

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

            const link = li.querySelector(":scope > a");
            const href = link?.getAttribute("href");

            if (href && href === currentPath) {
                li.classList.add("current");
            }
        });
    }, [location.pathname]);

    return (
        <ul className="main-menu__list" ref={menuRef}>
            <li className="dropdown">
                <Link to="#">Services</Link>
                <ul className="shadow-box">
                    <li>
                        <Link to="/services">Services</Link>
                    </li>
                    <li>
                        <Link to="/banking">Banking</Link>
                    </li>
                    <li>
                        <Link to="/education">Education</Link>
                    </li>
                    <li>
                        <Link to="/form-filing">Form Filing</Link>
                    </li>
                    <li>
                        <Link to="/fee-payment">Fee Payment</Link>
                    </li>
                    <li>
                        <Link to="/government-services">Government Services</Link>
                    </li>
                    <li>
                        <Link to="/insurance">Insurance</Link>
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
                        <Link to="/cart">Cart</Link>
                    </li>
                    <li>
                        <Link to="/checkout">Checkout</Link>
                    </li>
                    <li>
                        <Link to="/wishlist">Wishlist</Link>
                    </li>
                </ul>
            </li>

            <li>
                <Link to="/blog">Blog</Link>
            </li>

            <li className="dropdown">
                <Link to="#">Company</Link>
                <ul className="shadow-box">
                    <li>
                        <Link to="/about">About</Link>
                    </li>
                    <li>
                        <Link to="/faq">Faq</Link>
                    </li>
                    <li>
                        <Link to="/team">Team</Link>
                    </li>
                    <li>
                        <Link to="/testimonials">Testimonials</Link>
                    </li>
                    <li>
                        <Link to="/contact">Contact</Link>
                    </li>
                </ul>
            </li>
        </ul>
    );
}