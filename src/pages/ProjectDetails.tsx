import { lazy } from "react";
import SEO from "@/components/elements/SEO";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/elements/ErrorBoundary";
import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
const ProjectDetailsContent = lazy(
    () => import("@/features/project-details/ProjectDetailsContent"),
);

import "@/assets/css/module-css/video.css";
import "@/assets/css/module-css/error.css";
import "@/assets/css/module-css/page-header.css";

export default function ProjectDetails() {
    return (
        <>
            <SEO title="Project Details || Itzone || Itzone React Js Template" />
            <PageHeader title="Project Details" subtitle="Project Details" />
            <SuspenseWrapper>
                <ErrorBoundary name="project-details Page">
                    <ProjectDetailsContent />
                </ErrorBoundary>
            </SuspenseWrapper>
        </>
    );
}
