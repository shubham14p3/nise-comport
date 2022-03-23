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
const OfferAuthor = () => {
    const { author } = useParams();
    const data = OfferData.filter((offer) => slugify(offer.author) === author);
    const authorTitle = data[0].author;
    return (
        <React.Fragment>
            <Layout>
                <SEO title="Nise-Comport – Offer Author" />
                <div className="wrapper">
                    <Header />
                    <PageBanner
                        title={authorTitle}
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

OfferAuthor.propTypes = {
    match: PropTypes.shape({
        params: PropTypes.shape({
            author: PropTypes.string,
        }),
    }),
};

export default OfferAuthor;
