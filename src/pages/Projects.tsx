import { lazy } from "react";
import SEO from "@/components/elements/SEO";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/elements/ErrorBoundary";
import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
const ProjectPage = lazy(() => import("@/features/projects/ProjectPage"));

import "@/assets/css/module-css/video.css";
import "@/assets/css/module-css/error.css";
import "@/assets/css/module-css/page-header.css";

export default function Projects() {
    return (
        <>
            <SEO title="projects || Itzone || Itzone React Js Template" />
            <PageHeader title="projects" subtitle="projects" />
            <SuspenseWrapper>
                <ErrorBoundary name="projects Page">
                    <ProjectPage />
                </ErrorBoundary>
            </SuspenseWrapper>
        </>
    );
}
