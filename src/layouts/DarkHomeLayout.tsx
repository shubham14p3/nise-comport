import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from 'react';
import Newsletter from "@/components/newsletters/Newsletter";
import Header from "@/components/headers/header-dark/Header";
import Footer from "@/components/footers/Footer";
import darkCssUrl from '@/assets/css/dark.css?url';
import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
export default function DarkHomeLayout() {
    const { pathname } = useLocation();
    useEffect(() => {

        const isDarkRoute = pathname === '/index-dark';
        if (isDarkRoute) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = darkCssUrl;
            link.id = 'dark-theme';
            document.head.appendChild(link);
        }
        return () => {
            const darkLink = document.getElementById('dark-theme');
            if (darkLink) {
                darkLink.remove();
            }
        };
    }, [pathname]);
    return (
        <SuspenseWrapper>
            <div className="page-wrapper">
                <Header />
                <Outlet />
                <Newsletter />
                <Footer />
            </div>
        </SuspenseWrapper>
    );
}
