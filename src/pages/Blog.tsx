import { lazy } from "react";
import SEO from "@/components/elements/SEO";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/elements/ErrorBoundary";
import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
const BlogPage = lazy(() => import("@/features/blog/BlogPage"));

import "@/assets/css/module-css/video.css";
import "@/assets/css/module-css/error.css";
import "@/assets/css/module-css/page-header.css";

export default function Blog() {
    return (
        <>
            <SEO title="Blog || Itzone || Itzone React Js Template" />
            <PageHeader title="Blog" subtitle="Blog" />
            <SuspenseWrapper>
                <ErrorBoundary name="blog Page">
                    <BlogPage />
                </ErrorBoundary>
            </SuspenseWrapper>
        </>
    );
}
