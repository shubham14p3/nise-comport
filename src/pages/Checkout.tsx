import { lazy } from "react";
import SEO from "@/components/elements/SEO";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/elements/ErrorBoundary";
import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
const CheckoutPage = lazy(() => import("@/features/checkout/CheckoutPage"));

import "@/assets/css/module-css/shop.css";
import "@/assets/css/module-css/page-header.css";

export default function Checkout() {
    return (
        <>
            <SEO title="Checkout || Itzone|| Itzone React Js Template" />
            <PageHeader title="Checkout" subtitle="Checkout" />
            <SuspenseWrapper>
                <ErrorBoundary name="checkout Page">
                    <CheckoutPage />
                </ErrorBoundary>
            </SuspenseWrapper>
        </>
    );
}
