import { lazy } from "react";
import SEO from "@/components/elements/SEO";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/elements/ErrorBoundary";
import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
const ErrorPage = lazy(() => import("@/features/error404/ErrorPage"));

import "@/assets/css/module-css/video.css";
import "@/assets/css/module-css/error.css";
import "@/assets/css/module-css/page-header.css";

export default function Error404() {
    return (
        <>
            <SEO title="404 Error || Itzone || Itzone React Js Template" />
            <PageHeader title="404 Error" subtitle="404 Error" />
            <SuspenseWrapper>
                <ErrorBoundary name="error404 Page">
                    <ErrorPage />
                </ErrorBoundary>
            </SuspenseWrapper>
        </>
    );
}
