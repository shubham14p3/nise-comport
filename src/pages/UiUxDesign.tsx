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

export default function UiUxDesign() {
    return (
        <>
            <SEO title="UI/UX Design || Itzone || Itzone React Js Template" />
            <PageHeader title="UI/UX Design" subtitle="UI/UX Design" />
            <SuspenseWrapper>
                <ErrorBoundary name="ui-ux-design Page">
                    <ServiceDetails />
                </ErrorBoundary>
            </SuspenseWrapper>
        </>
    );
}
