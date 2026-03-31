import React from "react";
import PropTypes from "prop-types";
import NewsletterArea from "../containers/global/newsletter";
import PageBanner from "../containers/global/page-banner";
import Footer from "../layouts/footer";
import Header from "../layouts/header";
import Layout from "../layouts/index";
import OfferData from "../data/offer.json";
import OfferItemContainer from "../containers/offer/offer-item";
import { slugify } from "../utils";
import ScrollToTop from "../components/scroll-to-top";
import SEO from "../components/seo";
import { useParams } from "react-router-dom";
const OfferDate = () => {
    const { date } = useParams();
    const data = OfferData.filter((offer) => slugify(offer.date) === date);
    const dateTitle = data[0].date;
    return (
        <>
            <Layout>
                <SEO title="Nise-Comport – Offer Date" />
                <div className="wrapper">
                    <Header />
                    <PageBanner
                        title={dateTitle}
                        excerpt="Pleasure rationally encounter consequences <br />
                        are extremely painful great oppurtunity"
                        image="offer/banner.png"
                    />
                    <OfferItemContainer data={data} />
                    <NewsletterArea />
                    <Footer />
                    <ScrollToTop />
                </div>
            </Layout>
        </>
    );
};

OfferDate.propTypes = {
    match: PropTypes.shape({
        params: PropTypes.shape({
            date: PropTypes.string,
        }),
    }),
};

export default OfferDate;
