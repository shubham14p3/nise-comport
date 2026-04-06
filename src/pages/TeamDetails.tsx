import { lazy } from "react";
import SEO from "@/components/elements/SEO";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/elements/ErrorBoundary";
import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
const TeamDetailsContent = lazy(
    () => import("@/features/team-details/TeamDetailsContent"),
);
const TeamDetailsContact = lazy(
    () => import("@/features/team-details/TeamDetailsContact"),
);

import "@/assets/css/module-css/video.css";
import "@/assets/css/module-css/error.css";
import "@/assets/css/module-css/page-header.css";

export default function TeamDetails() {
    return (
        <>
            <SEO title="Team Details || Itzone || Itzone React Js Template" />
            <PageHeader title="Team Details" subtitle="Team Details" />
            <SuspenseWrapper>
                <ErrorBoundary name="team-details Page">
                    <TeamDetailsContent />

                    <TeamDetailsContact />
                </ErrorBoundary>
            </SuspenseWrapper>
        </>
    );
}
