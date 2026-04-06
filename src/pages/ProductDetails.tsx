import { lazy } from "react";
import SEO from "@/components/elements/SEO";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/elements/ErrorBoundary";
import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
const ProductDetailsContent = lazy(
    () => import("@/features/product-details/ProductDetailsContent"),
);
const ProductDescription = lazy(
    () => import("@/features/product-details/ProductDescription"),
);
const RelatedProducts = lazy(
    () => import("@/features/product-details/RelatedProducts"),
);

import "@/assets/css/module-css/shop.css";
import "@/assets/css/module-css/page-header.css";

export default function ProductDetails() {
    return (
        <>
            <SEO title="Product Details || Itzone|| Itzone React Js Template" />
            <PageHeader title="Product Details" subtitle="Product Details" />
            <SuspenseWrapper>
                <ErrorBoundary name="product-details Page">
                    <ProductDetailsContent />

                    <ProductDescription />

                    <RelatedProducts />
                </ErrorBoundary>
            </SuspenseWrapper>
        </>
    );
}
