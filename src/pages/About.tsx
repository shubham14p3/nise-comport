import { lazy } from "react";
import SEO from "@/components/elements/SEO";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/elements/ErrorBoundary";
import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
const AboutOne = lazy(() => import("@/features/about/AboutOne"));
const ServiceOne = lazy(() => import("@/features/about/ServiceOne"));
const SlidingTextOne = lazy(() => import("@/features/about/SlidingTextOne"));
const TeamTwo = lazy(() => import("@/features/about/TeamTwo"));
const CounterTwo = lazy(() => import("@/features/about/CounterTwo"));
const TestimonialTwo = lazy(() => import("@/features/about/TestimonialTwo"));
const BlogOne = lazy(() => import("@/features/home-one/BlogOne"));

import "@/assets/css/module-css/video.css";
import "@/assets/css/module-css/error.css";
import "@/assets/css/module-css/page-header.css";

export default function About() {
    return (
        <>
            <SEO title="About Us || Itzone || Itzone React Js Template" />
            <PageHeader title="About Us" subtitle="About Us" />
            <SuspenseWrapper>
                <ErrorBoundary name="about Page">
                    <AboutOne />

                    <ServiceOne />

                    <SlidingTextOne />

                    <TeamTwo />

                    <CounterTwo />

                    <TestimonialTwo />

                    <BlogOne />
                </ErrorBoundary>
            </SuspenseWrapper>
        </>
    );
}
