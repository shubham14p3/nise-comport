import { useEffect, useState, useCallback, useLayoutEffect } from "react";
import { Link, useLocation } from "react-router-dom";

function throttle<T extends (...args: unknown[]) => void>(
    fn: T,
    delay: number,
): (...args: Parameters<T>) => void {
    let last = 0;

    return (...args: Parameters<T>) => {
        const now = Date.now();
        if (now - last >= delay) {
            last = now;
            fn(...args);
        }
    };
}

const ScrollToTop = () => {
    const [visible, setVisible] = useState(false);

    const toggleVisibility = useCallback(() => {
        if (window.scrollY > 200) {
            setVisible(true);
        } else {
            setVisible(false);
        }
    }, []);

    const location = useLocation();

    useLayoutEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
    }, [location.pathname]);

    useEffect(() => {
        const throttledScroll = throttle(toggleVisibility, 200);

        window.addEventListener("scroll", throttledScroll);
        return () => {
            window.removeEventListener("scroll", throttledScroll);
        };
    }, [toggleVisibility]);

    const scrollToTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <Link
            to="#"
            onClick={scrollToTop}
            className={`scroll-to-top ${visible ? "show" : ""}`}
        >
            <span className="scroll-to-top__wrapper">
                <span className="scroll-to-top__inner"></span>
            </span>
            <span className="scroll-to-top__text">Go Back Top</span>
        </Link>
    );
};

export default ScrollToTop;
