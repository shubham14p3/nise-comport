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
const OfferTag = () => {
    const { slug } = useParams();
    const data = OfferData.map((offer) => {
        return {
            ...offer,
            tags: offer.tags.filter((tag) => slugify(tag) === slug),
        };
    }).filter((offer) => offer.tags.length > 0);
    const tagTitle = data[0].tags[0];
    return (
        <React.Fragment>
            <Layout>
                <SEO title="Nise-Comport – Offer Tag" />
                <div className="wrapper">
                    <Header />
                    <PageBanner
                        title={tagTitle}
                        excerpt="Pleasure rationally encounter consequences <br />
                        are extremely painful great oppurtunity"
                        image="/images/offer/banner.png"
                    />
                    <OfferItemContainer data={data} />
                    <NewsletterArea />
                    <Footer />
                    <ScrollToTop />
                </div>
            </Layout>
        </React.Fragment>
    );
};

OfferTag.propTypes = {
    match: PropTypes.shape({
        params: PropTypes.shape({
            slug: PropTypes.string,
        }),
    }),
};

export default OfferTag;
