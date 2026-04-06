import { lazy } from "react";
import SEO from "@/components/elements/SEO";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/elements/ErrorBoundary";
import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
const BlogLeftSidebarContent = lazy(
    () => import("@/features/blog-left-sidebar/BlogLeftSidebarContent"),
);

import "@/assets/css/module-css/video.css";
import "@/assets/css/module-css/error.css";
import "@/assets/css/module-css/page-header.css";

export default function BlogLeftSidebar() {
    return (
        <>
            <SEO title="Blog Left Sidebar || Itzone || Itzone React Js Template" />
            <PageHeader
                title="Blog Left Sidebar"
                subtitle="Blog Left Sidebar"
            />
            <SuspenseWrapper>
                <ErrorBoundary name="blog-left-sidebar Page">
                    <BlogLeftSidebarContent />
                </ErrorBoundary>
            </SuspenseWrapper>
        </>
    );
}
