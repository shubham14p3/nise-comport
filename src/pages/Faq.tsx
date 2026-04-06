import { lazy } from "react";
import SEO from "@/components/elements/SEO";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/elements/ErrorBoundary";
import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
const FaqPage = lazy(() => import("@/features/faq/FaqPage"));

import "@/assets/css/module-css/video.css";
import "@/assets/css/module-css/error.css";
import "@/assets/css/module-css/page-header.css";

export default function Faq() {
    return (
        <>
            <SEO title="Our Faq || Itzone || Itzone React Js Template" />
            <PageHeader title="Our Faq" subtitle="Our Faq" />
            <SuspenseWrapper>
                <ErrorBoundary name="faq Page">
                    <FaqPage />
                </ErrorBoundary>
            </SuspenseWrapper>
        </>
    );
}
