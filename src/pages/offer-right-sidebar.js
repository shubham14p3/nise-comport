import React from "react";
import OfferItemRightContainer from "../containers/offer/offer-item-right";
import NewsletterArea from "../containers/global/newsletter";
import PageBanner from "../containers/global/page-banner";
import Footer from "../layouts/footer";
import Header from "../layouts/header";
import Layout from "../layouts/index";
import OfferData from "../data/offer.json";
import ScrollToTop from "../components/scroll-to-top";
import SEO from "../components/seo";

const OfferRightSidebarPage = () => {
    return (
        <React.Fragment>
            <Layout>
                <SEO title="Nise-Comport – Offer Right Sidebar" />
                <div className="wrapper">
                    <Header />
                    <PageBanner
                        title="Offer Post"
                        excerpt="We update our latest service <br />
                        details here regularly "
                        image="./images/offer/banner.png"
                    />
                    <OfferItemRightContainer data={OfferData} />
                    {/* <NewsletterArea /> */}
                    <Footer />
                    <ScrollToTop />
                </div>
            </Layout>
        </React.Fragment>
    );
};

export default OfferRightSidebarPage;
