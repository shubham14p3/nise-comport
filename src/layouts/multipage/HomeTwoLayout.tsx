import { Outlet } from "react-router-dom";
import Header from "@/components/headers/header-two/Header";
import NewsletterTwo from "@/components/newsletters/NewsletterTwo";

import FooterTwo from "@/components/footers/FooterTwo";

import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
import MobileNav from "@/components/MoblieNav";
export default function HomeTwoLayout() {
    return (
        <SuspenseWrapper>
            <div className="page-wrapper">
                <Header />
                <Outlet />
                <NewsletterTwo />
                <FooterTwo />
                <MobileNav />
            </div>
        </SuspenseWrapper>
    );
}
