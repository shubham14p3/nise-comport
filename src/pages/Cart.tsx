import { lazy } from "react";
import SEO from "@/components/elements/SEO";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/elements/ErrorBoundary";
import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
const CartPage = lazy(() => import("@/features/cart/CartPage"));

import "@/assets/css/module-css/shop.css";
import "@/assets/css/module-css/page-header.css";

export default function Cart() {
    return (
        <>
            <SEO title="Cart || Itzone|| Itzone React Js Template" />
            <PageHeader title="Cart" subtitle="Cart" />
            <SuspenseWrapper>
                <ErrorBoundary name="cart Page">
                    <CartPage />
                </ErrorBoundary>
            </SuspenseWrapper>
        </>
    );
}
