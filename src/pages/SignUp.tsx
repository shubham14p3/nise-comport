import { lazy } from "react";
import SEO from "@/components/elements/SEO";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/elements/ErrorBoundary";
import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
const SignUpOne = lazy(() => import("@/features/sign-up/SignUpOne"));

import "@/assets/css/module-css/shop.css";
import "@/assets/css/module-css/page-header.css";

export default function SignUp() {
    return (
        <>
            <SEO title="Sign Up || Itzone|| Itzone React Js Template" />
            <PageHeader title="Sign Up" subtitle="Sign Up" />
            <SuspenseWrapper>
                <ErrorBoundary name="sign-up Page">
                    <SignUpOne />
                </ErrorBoundary>
            </SuspenseWrapper>
        </>
    );
}
