import SEO from "@/components/elements/SEO";
import ErrorBoundary from "@/components/elements/ErrorBoundary";
import MainSlider from "@/features/home-two/MainSlider";
import ServicesTwo from "@/features/home-two/ServicesTwo";
import AboutTwo from "@/features/home-two/AboutTwo";
import BrandOne from "@/features/home-two/BrandOne";
import VideoOne from "@/features/home-two/VideoOne";
import ProcessTwo from "@/features/home-two/ProcessTwo";
import SlidingTextOne from "@/features/home-two/SlidingTextOne";
import ProjectTwo from "@/features/home-two/ProjectTwo";
import WhyChooseTwo from "@/features/home-two/WhyChooseTwo";
import TeamTwo from "@/features/home-two/TeamTwo";
import CounterTwo from "@/features/home-two/CounterTwo";
import TestimonialTwo from "@/features/home-two/TestimonialTwo";
import ContactTwo from "@/features/home-two/ContactTwo";
import BlogTwo from "@/features/home-two/BlogTwo";

import "@/assets/css/module-css/video.css";

export default function HomeTwo() {
    return (
        <>
            <SEO title="Home Two || Itzone|| Itzone React Js Template" />
            <ErrorBoundary name="home-two Page">
                <MainSlider />

                <ServicesTwo />

                <AboutTwo />

                <BrandOne />

                <VideoOne />

                <ProcessTwo />

                <SlidingTextOne />

                <ProjectTwo />

                <WhyChooseTwo />

                <TeamTwo />

                <CounterTwo />

                <TestimonialTwo />

                <ContactTwo />

                <BlogTwo />
            </ErrorBoundary>
        </>
    );
}
