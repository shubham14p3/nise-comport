import React from "react";
import BlogItemRightContainer from "../containers/blog/blog-item-right";
import NewsletterArea from "../containers/global/newsletter";
import PageBanner from "../containers/global/page-banner";
import Footer from "../layouts/footer";
import Header from "../layouts/header";
import Layout from "../layouts/index";
import BlogData from "../data/blog.json";
import ScrollToTop from "../components/scroll-to-top";
import SEO from "../components/seo";

const BlogRightSidebarPage = () => {
    return (
        <>
            <Layout>
                <SEO title="Nise-Comport – Blog Right Sidebar" />
                <div className="wrapper">
                    <Header />
                    <PageBanner
                        title="Blog Post"
                        excerpt="We update our latest service <br />
                        details here regularly "
                        image="blog/banner.png"
                    />
                    <BlogItemRightContainer data={BlogData} />
                    {/* <NewsletterArea /> */}
                    <Footer />
                    <ScrollToTop />
                </div>
            </Layout>
        </>
    );
};

export default BlogRightSidebarPage;
