import { useContext } from "react";
import CustomCursor from "@/components/elements/CustomCursor";
import FinrisContext from "@/components/context/FinrisContext";
import { Outlet } from "react-router-dom";
import SideBar from "@/components/elements/SideBar";
import SearchProp from "@/components/elements/SearchProp";
import ScrollToTop from "@/components/elements/ScrollToTop";
import ErrorBoundary from "@/components/elements/ErrorBoundary";

export default function App() {
    const context = useContext(FinrisContext);
    if (!context) throw new Error("Context is null");
    const { isMobile, isSearch } = context;

    return (
        <ErrorBoundary name="Main App">
            <div
                className={`custom-cursor ${isMobile ? "locked" : ""} ${isSearch ? "search-active" : ""}`}
            >
                <CustomCursor />
                <Outlet />
                <SideBar />
                <SearchProp />
                <ScrollToTop />
            </div>
        </ErrorBoundary>
    );
}
