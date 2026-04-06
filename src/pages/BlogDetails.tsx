import { lazy } from "react";
import SEO from "@/components/elements/SEO";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/elements/ErrorBoundary";
import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
const BlogDetailsContent = lazy(
    () => import("@/features/blog-details/BlogDetailsContent"),
);

import "@/assets/css/module-css/video.css";
import "@/assets/css/module-css/error.css";
import "@/assets/css/module-css/page-header.css";

export default function BlogDetails() {
    return (
        <>
            <SEO title="Blog Details || Itzone || Itzone React Js Template" />
            <PageHeader title="Blog Details" subtitle="Blog Details" />
            <SuspenseWrapper>
                <ErrorBoundary name="blog-details Page">
                    <BlogDetailsContent />
                </ErrorBoundary>
            </SuspenseWrapper>
        </>
    );
}
