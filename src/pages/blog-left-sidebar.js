import React from "react";
import BlogItemLeftContainer from "../containers/blog/blog-item-left";
import NewsletterArea from "../containers/global/newsletter";
import PageBanner from "../containers/global/page-banner";
import Footer from "../layouts/footer";
import Header from "../layouts/header";
import Layout from "../layouts/index";
import BlogData from "../data/blog.json";
import ScrollToTop from "../components/scroll-to-top";
import SEO from "../components/seo";

const BlogLeftSidebarPage = () => {
    return (
        <React.Fragment>
            <Layout>
                <SEO title="Nise-Comport – Blog Left Sidebar" />
                <div className="wrapper">
                    <Header />
                    <PageBanner
                        title="Blog Post"
                        excerpt="We update our latest service <br />
                        details here regularly "
                        image="./images/blog/banner.png"
                    />
                    <BlogItemLeftContainer data={BlogData} />
                    {/* <NewsletterArea /> */}
                    <Footer />
                    <ScrollToTop />
                </div>
            </Layout>
        </React.Fragment>
    );
};

export default BlogLeftSidebarPage;
