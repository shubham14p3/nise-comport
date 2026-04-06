import { lazy } from "react";
import SEO from "@/components/elements/SEO";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/elements/ErrorBoundary";
import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
const PricingOne = lazy(() => import("@/features/pricing/PricingOne"));

import "@/assets/css/module-css/video.css";
import "@/assets/css/module-css/error.css";
import "@/assets/css/module-css/page-header.css";

export default function Pricing() {
    return (
        <>
            <SEO title="Pricing || Itzone || Itzone React Js Template" />
            <PageHeader title="Pricing" subtitle="Pricing" />
            <SuspenseWrapper>
                <ErrorBoundary name="pricing Page">
                    <PricingOne />
                </ErrorBoundary>
            </SuspenseWrapper>
        </>
    );
}
