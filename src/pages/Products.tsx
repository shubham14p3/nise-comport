import { lazy } from "react";
import SEO from "@/components/elements/SEO";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/elements/ErrorBoundary";
import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
const Product = lazy(() => import("@/features/products/Product"));

import "@/assets/css/module-css/shop.css";
import "@/assets/css/module-css/page-header.css";

export default function Products() {
    return (
        <>
            <SEO title="Products || Itzone|| Itzone React Js Template" />
            <PageHeader title="Products" subtitle="Products" />
            <SuspenseWrapper>
                <ErrorBoundary name="products Page">
                    <Product />
                </ErrorBoundary>
            </SuspenseWrapper>
        </>
    );
}
