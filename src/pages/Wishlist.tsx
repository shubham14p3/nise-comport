import { lazy } from "react";
import SEO from "@/components/elements/SEO";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/elements/ErrorBoundary";
import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
const WishlistPage = lazy(() => import("@/features/wishlist/WishlistPage"));

import "@/assets/css/module-css/shop.css";
import "@/assets/css/module-css/page-header.css";

export default function Wishlist() {
    return (
        <>
            <SEO title="Wishlist || Itzone|| Itzone React Js Template" />
            <PageHeader title="Wishlist" subtitle="Wishlist" />
            <SuspenseWrapper>
                <ErrorBoundary name="wishlist Page">
                    <WishlistPage />
                </ErrorBoundary>
            </SuspenseWrapper>
        </>
    );
}
