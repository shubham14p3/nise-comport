import { Outlet } from "react-router-dom";
import Header from "@/components/headers/single-header-one/Header";
import Newsletter from "@/components/newsletters/Newsletter";

import Footer from "@/components/footers/Footer";

import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
import MobileNavSingle from "@/components/MobileNavSingle";
export default function SingleHomeOneLayout() {
    return (
        <SuspenseWrapper>
            <div className="page-wrapper">
                <Header />
                <Outlet />
                <Newsletter />
                <Footer />
               <MobileNavSingle />
            </div>
        </SuspenseWrapper>
    );
}
