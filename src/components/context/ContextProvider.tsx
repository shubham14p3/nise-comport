import React, { useState } from "react";
import FinrisContext from "./FinrisContext";
import type { contextType } from "../../types/context";

type ScrollToSection = (id: string) => void;

const ContextProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [isSidebar, setIsSidebar] = useState(false);
    const [isSearch, setIsSearch] = useState(false);
    const [showVideoPopup, setShowVideoPopup] = useState<boolean>(false);
    const [currentVideoUrl, setCurrentVideoUrl] = useState<string>("");
    const [activeSection, setActiveSection] = useState<string>("home");
    const handleVideoClick = (
        e: React.MouseEvent<HTMLAnchorElement>,
        videoUrl: string = "https://www.youtube.com/embed/MLpWrANjFbI?autoplay=1",
    ): void => {
        e.preventDefault();
        setCurrentVideoUrl(videoUrl);
        setShowVideoPopup(true);
    };

    const scrollToSection: ScrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (!element) return;
        const offset = 70; // adgust height
        const top =
            element.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({
            top,
            behavior: "smooth",
        });
    };

    const info: contextType = {
        isMobile,
        setIsMobile,
        isSidebar,
        setIsSidebar,
        isSearch,
        setIsSearch,
        showVideoPopup,
        setShowVideoPopup,
        currentVideoUrl,
        setCurrentVideoUrl,
        handleVideoClick,
        scrollToSection,
        activeSection,
        setActiveSection,
    };

    return (
        <FinrisContext.Provider value={info}>{children}</FinrisContext.Provider>
    );
};

export default ContextProvider;
