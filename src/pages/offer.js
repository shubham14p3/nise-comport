import React from "react";
import OfferItemContainer from "../containers/offer/offer-item";
import NewsletterArea from "../containers/global/newsletter";
import PageBanner from "../containers/global/page-banner";
import Footer from "../layouts/footer";
import Header from "../layouts/header";
import Layout from "../layouts/index";
import OfferData from "../data/offer.json";
import ScrollToTop from "../components/scroll-to-top";
import SEO from "../components/seo";

const Offer = () => {
    return (
        <React.Fragment>
            <Layout>
                <SEO title="Nise-Comport – Blog" />
                <div className="wrapper">
                    <Header />
                    <PageBanner
                        title="Offer"
                        excerpt="We regularly bring best offer to our users, so they can
                        have the best service and get good returns."
                        image="./images/blog/banner.png"
                    />
                    <OfferItemContainer data={OfferData} />
                    <NewsletterArea />
                    <Footer />
                    <ScrollToTop />
                </div>
            </Layout>
        </React.Fragment>
    );
};

export default Offer;
