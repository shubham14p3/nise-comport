import { lazy } from "react";
import SEO from "@/components/elements/SEO";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/elements/ErrorBoundary";
import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
const ServiceDetails = lazy(
    () => import("@/features/service-details/ServicesDetails"),
);

import "@/assets/css/module-css/video.css";
import "@/assets/css/module-css/error.css";
import "@/assets/css/module-css/page-header.css";

export default function ProductDesign() {
    return (
        <>
            <SEO title="Product Design || Itzone || Itzone React Js Template" />
            <PageHeader title="Product Design" subtitle="Product Design" />
            <SuspenseWrapper>
                <ErrorBoundary name="product-design Page">
                    <ServiceDetails />
                </ErrorBoundary>
            </SuspenseWrapper>
        </>
    );
}
