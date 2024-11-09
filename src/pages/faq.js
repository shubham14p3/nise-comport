import React from "react";
import ScrollToTop from "../components/scroll-to-top";
import SEO from "../components/seo";
import AccordionContainer from "../containers/accordion";
import NewsletterArea from "../containers/global/newsletter";
import PageBanner from "../containers/global/page-banner";
import Footer from "../layouts/footer";
import Header from "../layouts/header";
import Layout from "../layouts/index";

const FaqPage = () => {
    return (
        <React.Fragment>
            <Layout>
                <SEO title="Nise-Comport – Faq" />
                <div className="wrapper">
                    <Header />
                    <PageBanner
                        title="FAQ"
                        excerpt="You can find basic questions answered here"
                        image="faq/1.png"
                    />
                    <AccordionContainer />
                    {/* <NewsletterArea /> */}
                    <Footer />
                    <ScrollToTop />
                </div>
            </Layout>
        </React.Fragment>
    );
};

export default FaqPage;
