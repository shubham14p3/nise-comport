import { Outlet } from "react-router-dom";
import Header from "@/components/headers/header-one/Header";
import Newsletter from "@/components/newsletters/Newsletter";

import Footer from "@/components/footers/Footer";

import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
import MobileNav from "@/components/MoblieNav";
export default function HomeOneLayout() {
    return (
        <SuspenseWrapper>
            <div className="page-wrapper">
                <Header />
                <Outlet />
                <Newsletter />
                <Footer />
                <MobileNav />
            </div>
        </SuspenseWrapper>
    );
}
