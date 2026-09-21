import React from "react";
import ScrollToTop from "../components/scroll-to-top";
import SEO from "../components/seo";
import BrandContainer from "../containers/global/brand/index";
import FunFactContainer from "../containers/global/funfact";
import IconBoxContainer from "../containers/global/icon-box";
import NewsletterArea from "../containers/global/newsletter";
import TeamContainer from "../containers/global/team";
import TestimonialContainer from "../containers/global/testimonial";
import HomeAboutContainer from "../containers/home/about";
import HomeBlog from "../containers/home/blog";
import IntroContainer from "../containers/home/intro";
import DigitalServiceLaunch from "../components/digital-service-launch";
import ServiceListContainer from "../containers/service/service-list";
import Footer from "../layouts/footer";
import Header from "../layouts/header";
import Layout from "../layouts/index";
import "../assets/css/style.css";

const HomePage = () => {
    return (
        <>
            <Layout>
                <SEO title="NISE COMPORT | Everyday Digital Services in Telco, Jamshedpur" description="NISE COMPORT helps customers in Telco, Jamshedpur with printing, citizen-document assistance, banking, insurance, travel and other digital services." canonical="https://nisecomport.com/" />
                <div className="wrapper">
                    <Header />
                    <DigitalServiceLaunch />
                    {/* <BrandContainer /> */}
                    {/* <IconBoxContainer classOption="section-pb" /> */}
                    {/* <HomeAboutContainer /> */}
                    <ServiceListContainer />
                    <TestimonialContainer />
                    {/* <FunFactContainer classOption="mt-10 mt-lg-0" /> */}
                    {/* <TeamContainer classOption="section-pb" /> */}
                    <HomeBlog />
                    {/* <NewsletterArea /> */}
                    <Footer />
                    <ScrollToTop />
                </div>
            </Layout>
        </>
    );
};

export default HomePage;
