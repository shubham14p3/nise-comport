import React from "react";
import PropTypes from "prop-types";
import NewsletterArea from "../containers/global/newsletter";
import PageBanner from "../containers/global/page-banner";
import Footer from "../layouts/footer";
import Header from "../layouts/header";
import Layout from "../layouts/index";
import OfferDetailsContainer from "../containers/offer/offer-details";
import OfferData from "../data/offer.json";
import ScrollToTop from "../components/scroll-to-top";
import SEO from "../components/seo";
import { useParams } from "react-router-dom";
import { slugify } from "../utils";
const OfferDetailsPage = () => {
    const { offerId } = useParams();

    const data = OfferData.filter(
        (offerItem) => slugify(offerItem.title) === offerId
    );
    return (
        <React.Fragment>
            <Layout>
                <SEO title="Nise-Comport – Offer Details" />
                <div className="wrapper">
                    <Header />
                    <PageBanner
                        title="Offer Details"
                        excerpt="Pleasure rationally encounter consequences <br />
                        are extremely painful great oppurtunity"
                        image="/images/offer/banner.png"
                    />
                    <OfferDetailsContainer data={data[0]} />
                    <NewsletterArea />
                    <Footer />
                    <ScrollToTop />
                </div>
            </Layout>
        </React.Fragment>
    );
};

OfferDetailsPage.propTypes = {
    match: PropTypes.shape({
        params: PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        }),
    }),
};

export default OfferDetailsPage;
