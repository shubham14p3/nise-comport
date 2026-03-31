import React from "react";
import ScrollToTop from "../components/scroll-to-top";
import SEO from "../components/seo";
import UserProfilePage from "../containers/UserProfilePage/index";
import Footer from "../layouts/footer";
import Header from "../layouts/header";
import Layout from "../layouts/index";

const UserProfile = () => {
    return (
        <>
            <Layout>
                <SEO title="Nise-Comport – About" />
                <div className="wrapper">
                    <Header />
                    <UserProfilePage />
                    <Footer />
                    <ScrollToTop />
                </div>
            </Layout>
        </>
    );
};

export default UserProfile;
