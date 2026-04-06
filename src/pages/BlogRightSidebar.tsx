import { lazy } from "react";
import SEO from "@/components/elements/SEO";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/elements/ErrorBoundary";
import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
const BlogRightSidebarContent = lazy(
    () => import("@/features/blog-right-sidebar/BlogRightSidebarContent"),
);

import "@/assets/css/module-css/video.css";
import "@/assets/css/module-css/error.css";
import "@/assets/css/module-css/page-header.css";

export default function BlogRightSidebar() {
    return (
        <>
            <SEO title="Blog Right Sidebar || Itzone || Itzone React Js Template" />
            <PageHeader
                title="Blog Right Sidebar"
                subtitle="Blog Right Sidebar"
            />
            <SuspenseWrapper>
                <ErrorBoundary name="blog-right-sidebar Page">
                    <BlogRightSidebarContent />
                </ErrorBoundary>
            </SuspenseWrapper>
        </>
    );
}
