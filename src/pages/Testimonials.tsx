import { lazy } from "react";
import SEO from "@/components/elements/SEO";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/elements/ErrorBoundary";
import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
const TestimonialPage = lazy(
    () => import("@/features/testimonials/TestimonialPage"),
);

import "@/assets/css/module-css/video.css";
import "@/assets/css/module-css/error.css";
import "@/assets/css/module-css/page-header.css";

export default function Testimonials() {
    return (
        <>
            <SEO title="Testimonials || Itzone || Itzone React Js Template" />
            <PageHeader title="Testimonials" subtitle="Testimonials" />
            <SuspenseWrapper>
                <ErrorBoundary name="testimonials Page">
                    <TestimonialPage />
                </ErrorBoundary>
            </SuspenseWrapper>
        </>
    );
}
