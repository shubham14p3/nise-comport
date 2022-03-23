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
const OfferCategory = () => {
    const { slug } = useParams();
    const data = OfferData.map((offer) => {
        return {
            ...offer,
            categories: offer.categories.filter((cat) => slugify(cat) === slug),
        };
    }).filter((offer) => offer.categories.length > 0);
    const categoryTitle = data[0].categories[0];
    return (
        <React.Fragment>
            <Layout>
                <SEO title="Nise-Comport – Offer Categories" />
                <div className="wrapper">
                    <Header />
                    <PageBanner
                        title={categoryTitle}
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

OfferCategory.propTypes = {
    match: PropTypes.shape({
        params: PropTypes.shape({
            slug: PropTypes.string,
        }),
    }),
};

export default OfferCategory;
