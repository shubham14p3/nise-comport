import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavScrollTop from "./components/nav-scroll-top";
import WelcomePage from "./pages/welcomePage";
import HomePage from "./pages/index";
import AboutPage from "./pages/about";
import ServicePage from "./pages/service";
import AllServices from "./pages/all-services";
import ServiceDetails from "./templates/service-details";
import TeamPage from "./pages/team";
import FaqPage from "./pages/faq";
import BlogPage from "./pages/blog";
import BlogLeftSidebarPage from "./pages/blog-left-sidebar";
import BlogRightSidebarPage from "./pages/blog-right-sidebar";
import BlogDetailsPage from "./templates/blog-details";
import BlogAuthor from "./templates/blog-author";
import BlogDate from "./templates/blog-date";
import BlogTag from "./templates/blog-tag";
import BlogCategory from "./templates/blog-category";
import ContactPage from "./pages/contact";
import PageNotFound from "./pages/404-page";
import Chatbotbox from "./components/chatbotbox/index";
import OfferPage from "./pages/offer";
import OfferLeftSidebarPage from "./pages/offer-left-sidebar";
import OfferRightSidebarPage from "./pages/offer-right-sidebar";
import OfferDetailsPage from "./templates/offer-details";
// import OfferAuthor from "./templates/offer-author";
import OfferDate from "./templates/offer-date";
import OfferTag from "./templates/offer-tag";
import OfferCategory from "./templates/offer-category";
import SignIn from "./pages/sigin";
import UserProfile from "./pages/UserProfile";

import "./assets/css/vendor/metropolis.css";
import "./assets/css/vendor/icofont.min.css";
import "./assets/css/vendor/font-awesome.css";
import "./assets/css/vendor/material-design-iconic.min.css";
import "./assets/css/plugins/animate.min.css";
import "./assets/scss/style.scss";

const App = () => {
    return (
        <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Chatbotbox />
            <NavScrollTop>
                <Routes>
                    <Route path="/" element={<WelcomePage />} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/all-services" element={<AllServices />} />

                    <Route path="/offer" element={<OfferPage />} />
                    <Route path="/offer-details/:offerId" element={<OfferDetailsPage />} />
                    <Route path="/offer-left-sidebar" element={<OfferLeftSidebarPage />} />
                    <Route path="/offer-right-sidebar" element={<OfferRightSidebarPage />} />
                    <Route path="/offer-category/:slug" element={<OfferCategory />} />
                    <Route path="/offer-date/:date" element={<OfferDate />} />
                    <Route path="/offer-tag/:slug" element={<OfferTag />} />

                    <Route path="/service" element={<ServicePage />} />
                    <Route path="/service-details/:title" element={<ServiceDetails />} />

                    <Route path="/team" element={<TeamPage />} />
                    <Route path="/faq" element={<FaqPage />} />
                    <Route path="/contact" element={<ContactPage />} />

                    <Route path="/blog" element={<BlogPage />} />
                    <Route path="/blog-left-sidebar" element={<BlogLeftSidebarPage />} />
                    <Route path="/blog-right-sidebar" element={<BlogRightSidebarPage />} />
                    <Route path="/blog-details/:blogId" element={<BlogDetailsPage />} />
                    <Route path="/author/:author" element={<BlogAuthor />} />
                    <Route path="/date/:date" element={<BlogDate />} />
                    <Route path="/tag/:slug" element={<BlogTag />} />
                    <Route path="/category/:slug" element={<BlogCategory />} />

                    <Route path="/login" element={<SignIn />} />
                    <Route path="/profile" element={<UserProfile />} />

                    <Route path="*" element={<PageNotFound />} />
                </Routes>
            </NavScrollTop>
        </BrowserRouter>
    );
};

export default App;