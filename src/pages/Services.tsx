import { lazy } from "react";
import SEO from "@/components/elements/SEO";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/elements/ErrorBoundary";
import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
const ServicesPage = lazy(() => import("@/features/services/ServicesPage"));
const ContactThree = lazy(() => import("@/features/services/ContactThree"));
const ProcessTwo = lazy(() => import("@/features/services/ProcessTwo"));
const PricingOne = lazy(() => import("@/features/services/PricingOne"));

import "@/assets/css/module-css/video.css";
import "@/assets/css/module-css/error.css";
import "@/assets/css/module-css/page-header.css";

export default function Services() {
    return (
        <>
            <SEO title="Services || Itzone || Itzone React Js Template" />
            <PageHeader title="Services" subtitle="Services" />
            <SuspenseWrapper>
                <ErrorBoundary name="services Page">
                    <ServicesPage />

                    <ContactThree />

                    <ProcessTwo />

                    <PricingOne />
                </ErrorBoundary>
            </SuspenseWrapper>
        </>
    );
}
