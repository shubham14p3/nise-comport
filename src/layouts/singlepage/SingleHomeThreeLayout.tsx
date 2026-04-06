import { Outlet } from "react-router-dom";
import Header from "@/components/headers/single-header-three/Header";

import FooterThree from "@/components/footers/FooterThree";

import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
import MobileNavSingle from "@/components/MobileNavSingle";
export default function SingleHomeThreeLayout() {
    return (
        <SuspenseWrapper>
            <div className="page-wrapper">
                <Header />
                <Outlet />
                <FooterThree />
                <MobileNavSingle />
            </div>
        </SuspenseWrapper>
    );
}
