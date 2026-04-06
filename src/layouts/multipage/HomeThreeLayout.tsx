import { Outlet } from "react-router-dom";
import Header from "@/components/headers/header-three/Header";

import FooterThree from "@/components/footers/FooterThree";

import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
import MobileNav from "@/components/MoblieNav";
export default function HomeThreeLayout() {
    return (
        <SuspenseWrapper>
            <div className="page-wrapper">
                <Header />
                <Outlet />
                <FooterThree />
                <MobileNav />
            </div>
        </SuspenseWrapper>
    );
}
