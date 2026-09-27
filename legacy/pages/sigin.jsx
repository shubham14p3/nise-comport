import React from "react";
import ScrollToTop from "../components/scroll-to-top";
import SEO from "../components/seo";
import SignInForm from "../containers/signInForm";
import Footer from "../layouts/footer";
import Header from "../layouts/header";
import Layout from "../layouts/index";

const Signin = () => {
    return (
        <>
            <Layout>
                <SEO title="Nise-Comport – About" />
                <div className="wrapper">
                    <Header />
                    <SignInForm />
                    <Footer />
                    <ScrollToTop />
                </div>
            </Layout>
        </>
    );
};

export default Signin;
