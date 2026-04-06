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

export default function WebDevelopment() {
    return (
        <>
            <SEO title="Web Development || Itzone || Itzone React Js Template" />
            <PageHeader title="Web Development" subtitle="Web Development" />
            <SuspenseWrapper>
                <ErrorBoundary name="web-development Page">
                    <ServiceDetails />
                </ErrorBoundary>
            </SuspenseWrapper>
        </>
    );
}
