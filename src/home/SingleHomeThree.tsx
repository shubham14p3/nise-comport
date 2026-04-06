import SEO from "@/components/elements/SEO";
import ErrorBoundary from "@/components/elements/ErrorBoundary";
import BannerTwo from "@/features/home-three/BannerTwo";
import AboutThree from "@/features/home-three/AboutThree";
import SlidingTextOne from "@/features/home-three/SlidingTextOne";
import ServicesThree from "@/features/home-three/ServicesThree";
import CounterTwo from "@/features/home-three/CounterTwo";
import WhyChooseThree from "@/features/home-three/WhyChooseThree";
import FeatureOne from "@/features/home-three/FeatureOne";
import ProjectThree from "@/features/home-three/ProjectThree";
import TestimonialThree from "@/features/home-three/TestimonialThree";
import ContactThree from "@/features/home-three/ContactThree";
import BrandTwo from "@/features/home-three/BrandTwo";
import TeamTwo from "@/features/home-three/TeamTwo";
import PricingTwo from "@/features/home-three/PricingTwo";
import BlogThree from "@/features/home-three/BlogThree";

import "@/assets/css/module-css/video.css";
import "@/assets/css/module-css/feature.css";

export default function SingleHomeThree() {
    return (
        <>
            <SEO title="Home Three || Itzone|| Itzone React Js Template" />
            <ErrorBoundary name="single-home-three Page">
                <BannerTwo />

                <AboutThree />

                <SlidingTextOne />

                <ServicesThree />

                <CounterTwo />

                <WhyChooseThree />

                <FeatureOne />

                <ProjectThree />

                <TestimonialThree />

                <ContactThree />

                <BrandTwo />

                <TeamTwo />

                <PricingTwo />

                <BlogThree />
            </ErrorBoundary>
        </>
    );
}
