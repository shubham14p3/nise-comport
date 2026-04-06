import { lazy } from "react";
import SEO from "@/components/elements/SEO";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/elements/ErrorBoundary";
import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
const BlogList = lazy(() => import("@/features/blog-standard/BlogList"));

import "@/assets/css/module-css/video.css";
import "@/assets/css/module-css/error.css";
import "@/assets/css/module-css/page-header.css";

export default function BlogStandard() {
    return (
        <>
            <SEO title="Blog & News || Itzone || Itzone React Js Template" />
            <PageHeader title="Blog & News" subtitle="Blog & News" />
            <SuspenseWrapper>
                <ErrorBoundary name="blog-standard Page">
                    <BlogList />
                </ErrorBoundary>
            </SuspenseWrapper>
        </>
    );
}
