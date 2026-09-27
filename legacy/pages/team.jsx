import React from "react";
import ScrollToTop from "../components/scroll-to-top";
import SEO from "../components/seo";
import NewsletterArea from "../containers/global/newsletter";
import PageBanner from "../containers/global/page-banner";
import TeampPageContainer from "../containers/team-page-container";
import Footer from "../layouts/footer";
import Header from "../layouts/header";
import Layout from "../layouts/index";

const TeamPage = () => {
    return (
        <>
            <Layout>
                <SEO title="Nise-Comport – Team" />
                <div className="wrapper">
                    <Header />
                    <PageBanner
                        title="Our Team"
                        excerpt="These the people that make the magic happen..."
                        image="team/5.png"
                    />
                    <TeampPageContainer />
                    {/* <NewsletterArea /> */}
                    <Footer />
                    <ScrollToTop />
                </div>
            </Layout>
        </>
    );
};

export default TeamPage;
