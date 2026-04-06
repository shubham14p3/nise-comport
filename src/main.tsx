import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "swiper/swiper-bundle.css";
import "@/assets/css/combined.css";
import ContextProvider from "@/components/context/ContextProvider.tsx";
import ROUTER from "@/routes/Router.tsx";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ContextProvider>
            <RouterProvider router={ROUTER} />
        </ContextProvider>
    </StrictMode>,
);
