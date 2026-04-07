import { createBrowserRouter } from "react-router-dom";
import App from "@/App";

import HomeOneLayout from "@/layouts/multipage/HomeOneLayout";
import HomeOne from "@/home/HomeOne";
import SingleHomeOneLayout from "@/layouts/singlepage/SingleHomeOneLayout";
import SingleHomeOne from "@/home/SingleHomeOne";
import HomeTwoLayout from "@/layouts/multipage/HomeTwoLayout";
import HomeTwo from "@/home/HomeTwo";
import SingleHomeTwoLayout from "@/layouts/singlepage/SingleHomeTwoLayout";
import SingleHomeTwo from "@/home/SingleHomeTwo";
import HomeThreeLayout from "@/layouts/multipage/HomeThreeLayout";
import HomeThree from "@/home/HomeThree";
import SingleHomeThreeLayout from "@/layouts/singlepage/SingleHomeThreeLayout";
import SingleHomeThree from "@/home/SingleHomeThree";
import DarkHomeLayout from "@/layouts/DarkHomeLayout";
import DarkHome from "@/home/DarkHome";
import About from "@/pages/About";
import Team from "@/pages/Team";
import TeamDetails from "@/pages/TeamDetails";
import Projects from "@/pages/Projects";
import ProjectDetails from "@/pages/ProjectDetails";
import Testimonials from "@/pages/Testimonials";
import Pricing from "@/pages/Pricing";
import Faq from "@/pages/Faq";
import Error404 from "@/pages/Error404";
import Services from "@/pages/Services";
import UiUxDesign from "@/pages/UiUxDesign";
import WebDevelopment from "@/pages/WebDevelopment";
import DigitalMarketing from "@/pages/DigitalMarketing";
import BusinessAnalysis from "@/pages/BusinessAnalysis";
import SoftwareDevelopment from "@/pages/SoftwareDevelopment";
import ProductDesign from "@/pages/ProductDesign";
import Products from "@/pages/Products";
import ProductDetails from "@/pages/ProductDetails";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Wishlist from "@/pages/Wishlist";
import SignUp from "@/pages/SignUp";
import Login from "@/pages/Login";
import Blog from "@/pages/Blog";
import BlogStandard from "@/pages/BlogStandard";
import BlogLeftSidebar from "@/pages/BlogLeftSidebar";
import BlogRightSidebar from "@/pages/BlogRightSidebar";
import BlogDetails from "@/pages/BlogDetails";
import Contact from "@/pages/Contact";
import DefaultLayout from "@/layouts/DefaultLayout";
import TermAndConditionInfo from "@/features/TermAndCondition/TermAndConditionInfo";
import TermAndCondition from "@/pages/TermAndCondition";

const ROUTER = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                element: <HomeOneLayout />,
                children: [
                    {
                        path: "/",
                        element: <HomeOne />,
                    },
                ],
            },
            {
                element: <SingleHomeOneLayout />,
                children: [
                    {
                        path: "/index-one-page",
                        element: <SingleHomeOne />,
                    },
                ],
            },
            {
                element: <HomeTwoLayout />,
                children: [
                    {
                        path: "/index2",
                        element: <HomeTwo />,
                    },
                ],
            },
            {
                element: <SingleHomeTwoLayout />,
                children: [
                    {
                        path: "/index2-one-page",
                        element: <SingleHomeTwo />,
                    },
                ],
            },
            {
                element: <HomeThreeLayout />,
                children: [
                    {
                        path: "/index3",
                        element: <HomeThree />,
                    },
                ],
            },
            {
                element: <SingleHomeThreeLayout />,
                children: [
                    {
                        path: "/index3-one-page",
                        element: <SingleHomeThree />,
                    },
                ],
            },
            {
                element: <DarkHomeLayout />,
                children: [
                    {
                        path: "/index-dark",
                        element: <DarkHome />,
                    },
                ],
            },
            {
                element: <DefaultLayout />,
                children: [
                    {
                        path: "/about",
                        element: <About />,
                    },
                    {
                        path: "/team",
                        element: <Team />,
                    },
                    {
                        path: "/team-details",
                        element: <TeamDetails />,
                    },
                    {
                        path: "/projects",
                        element: <Projects />,
                    },
                    {
                        path: "/project-details",
                        element: <ProjectDetails />,
                    },
                    {
                        path: "/testimonials",
                        element: <Testimonials />,
                    },
                    {
                        path: "/term-conditions",
                        element: <TermAndCondition />,
                    },
                    {
                        path: "/pricing",
                        element: <Pricing />,
                    },
                    {
                        path: "/faq",
                        element: <Faq />,
                    },
                    {
                        path: "/404",
                        element: <Error404 />,
                    },
                    {
                        path: "/services",
                        element: <Services />,
                    },
                    {
                        path: "/banking",
                        element: <UiUxDesign />,
                    },
                    {
                        path: "/education",
                        element: <WebDevelopment />,
                    },
                    {
                        path: "/form-filing",
                        element: <DigitalMarketing />,
                    },
                    {
                        path: "/fee-payment",
                        element: <BusinessAnalysis />,
                    },
                    {
                        path: "/government-services",
                        element: <SoftwareDevelopment />,
                    },
                    {
                        path: "/insurance",
                        element: <ProductDesign />,
                    },
                    {
                        path: "/products",
                        element: <Products />,
                    },
                    {
                        path: "/product-details",
                        element: <ProductDetails />,
                    },
                    {
                        path: "/cart",
                        element: <Cart />,
                    },
                    {
                        path: "/checkout",
                        element: <Checkout />,
                    },
                    {
                        path: "/wishlist",
                        element: <Wishlist />,
                    },
                    {
                        path: "/sign-up",
                        element: <SignUp />,
                    },
                    {
                        path: "/login",
                        element: <Login />,
                    },
                    {
                        path: "/blog",
                        element: <Blog />,
                    },
                    {
                        path: "/blog-standard",
                        element: <BlogStandard />,
                    },
                    {
                        path: "/blog-left-sidebar",
                        element: <BlogLeftSidebar />,
                    },
                    {
                        path: "/blog-right-sidebar",
                        element: <BlogRightSidebar />,
                    },
                    {
                        path: "/blog-details",
                        element: <BlogDetails />,
                    },
                    {
                        path: "/contact",
                        element: <Contact />,
                    },
                    {
                        path: "*",
                        element: <Error404 />,
                    },
                ],
            },
        ],
    },
]);

export default ROUTER;
