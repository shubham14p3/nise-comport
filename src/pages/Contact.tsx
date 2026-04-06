import { lazy } from "react";
import SEO from "@/components/elements/SEO";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/elements/ErrorBoundary";
import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
const ContactInfo = lazy(() => import("@/features/contact/ContactInfo"));
const ContactPage = lazy(() => import("@/features/contact/ContactPage"));

import "@/assets/css/module-css/video.css";
import "@/assets/css/module-css/error.css";
import "@/assets/css/module-css/page-header.css";

export default function Contact() {
    return (
        <>
            <SEO title="Contact || Itzone || Itzone React Js Template" />
            <PageHeader title="Contact" subtitle="Contact" />
            <SuspenseWrapper>
                <ErrorBoundary name="contact Page">
                    <ContactInfo />

                    <ContactPage />
                </ErrorBoundary>
            </SuspenseWrapper>
        </>
    );
}
