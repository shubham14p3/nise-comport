import SEO from "@/components/elements/SEO";
import ErrorBoundary from "@/components/elements/ErrorBoundary";
import BannerOne from "@/features/home-one/BannerOne";
import AboutOne from "@/features/home-one/AboutOne";
import ServiceOne from "@/features/home-one/ServiceOne";
import WhyChooseOne from "@/features/home-one/WhyChooseOne";
import ProcessOne from "@/features/home-one/ProcessOne";
import SlidingTextOne from "@/features/home-one/SlidingTextOne";
import ProjectOne from "@/features/home-one/ProjectOne";
import CounterOne from "@/features/home-one/CounterOne";
import TeamOne from "@/features/home-one/TeamOne";
import BrandOne from "@/features/home-one/BrandOne";
import TestimonialOne from "@/features/home-one/TestimonialOne";
import ContactOne from "@/features/home-one/ContactOne";
import PricingOne from "@/features/home-one/PricingOne";
import FaqOne from "@/features/home-one/FaqOne";
import BlogOne from "@/features/home-one/BlogOne";

export default function DarkHome() {
    return (
        <>
            <SEO title="Home One || Itzone|| Itzone React Js Template" />
            <ErrorBoundary name="dark-home Page">
                <BannerOne />

                <AboutOne />

                <ServiceOne />

                <WhyChooseOne />

                <ProcessOne />

                <SlidingTextOne />

                <ProjectOne />

                <CounterOne />

                <TeamOne />

                <BrandOne />

                <TestimonialOne />

                <ContactOne />

                <PricingOne />

                <FaqOne />

                <BlogOne />
            </ErrorBoundary>
        </>
    );
}
