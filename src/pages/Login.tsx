import { lazy } from "react";
import SEO from "@/components/elements/SEO";
import PageHeader from "@/components/PageHeader";
import ErrorBoundary from "@/components/elements/ErrorBoundary";
import SuspenseWrapper from "@/components/elements/SuspenseWrapper";
const LoginOne = lazy(() => import("@/features/login/LoginOne"));

import "@/assets/css/module-css/shop.css";
import "@/assets/css/module-css/page-header.css";

export default function Login() {
    return (
        <>
            <SEO title="Login || Itzone|| Itzone React Js Template" />
            <PageHeader title="Login" subtitle="Login" />
            <SuspenseWrapper>
                <ErrorBoundary name="login Page">
                    <LoginOne />
                </ErrorBoundary>
            </SuspenseWrapper>
        </>
    );
}
