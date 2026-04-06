import { Outlet } from "react-router-dom";
import Header from "@/components/headers/single-header-two/Header";
import NewsletterTwo from "@/components/newsletters/NewsletterTwo";

import FooterTwo from "@/components/footers/FooterTwo";

import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
import MobileNavSingle from "@/components/MobileNavSingle";
export default function SingleHomeTwoLayout() {
    return (
        <SuspenseWrapper>
            <div className="page-wrapper">
                <Header />
                <Outlet />
                <NewsletterTwo />
                <FooterTwo />
                <MobileNavSingle />
            </div>
        </SuspenseWrapper>
    );
}
