import { lazy } from "react";
import SEO from "@/components/elements/SEO";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/elements/ErrorBoundary";
import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
const TeamPage = lazy(() => import("@/features/team/TeamPage"));

import "@/assets/css/module-css/video.css";
import "@/assets/css/module-css/error.css";
import "@/assets/css/module-css/page-header.css";

export default function Team() {
    return (
        <>
            <SEO title="Team Members || Itzone || Itzone React Js Template" />
            <PageHeader title="Team Members" subtitle="Team Members" />
            <SuspenseWrapper>
                <ErrorBoundary name="team Page">
                    <TeamPage />
                </ErrorBoundary>
            </SuspenseWrapper>
        </>
    );
}
