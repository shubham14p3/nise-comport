import { Outlet } from "react-router-dom";
import Header from "@/components/headers/header-one/Header";
import FooterTwo from "@/components/footers/FooterTwo";

import NewsletterTwo from "@/components/newsletters/NewsletterTwo";
import MobileNav from "@/components/MoblieNav";

export default function DefaultLayout() {
    return (
        <>
            <div className="page-wrapper">
                <Header />
                <Outlet />
                <NewsletterTwo />
                <FooterTwo />
                <MobileNav />
            </div>
        </>
    );
}
