import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavScrollTop from "./components/nav-scroll-top";
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
        <React.Fragment>
            <BrowserRouter>
                <Chatbotbox />
                <NavScrollTop>
                    <Routes>
                        <Route
                            path={`${process.env.PUBLIC_URL + "/"}`}
                            element={<HomePage />}
                        />
                        <Route
                            path={`${process.env.PUBLIC_URL + "/about"}`}
                            element={<AboutPage />}
                        />
                        <Route
                            path={`${process.env.PUBLIC_URL + "/all-services"}`}
                            element={<AllServices />}
                        />
                        <Route
                            path={`${process.env.PUBLIC_URL + "/offer"}`}
                            element={<OfferPage />}
                        />
                        <Route
                            path={`${
                                process.env.PUBLIC_URL +
                                "/offer-details/:offerId"
                            }`}
                            element={<OfferDetailsPage />}
                        />
                        <Route
                            path={`${
                                process.env.PUBLIC_URL + "/offer-left-sidebar"
                            }`}
                            element={<OfferLeftSidebarPage />}
                        />
                        <Route
                            path={`${
                                process.env.PUBLIC_URL + "/offer-right-sidebar"
                            }`}
                            element={<OfferRightSidebarPage />}
                        />
                        <Route
                            path={`${
                                process.env.PUBLIC_URL + "/offer-category/:slug"
                            }`}
                            element={<OfferCategory />}
                        />
                        <Route
                            path={`${
                                process.env.PUBLIC_URL + "/offer-date/:date"
                            }`}
                            element={<OfferDate />}
                        />
                        <Route
                            path={`${
                                process.env.PUBLIC_URL + "/offer-tag/:slug"
                            }`}
                            element={<OfferTag />}
                        />
                        {/* 
                        
                        <Route
                            path={`${
                                process.env.PUBLIC_URL + "/author/:author"
                            }`}
                            element={<OfferAuthor />}
                        />
                        
                       
                        */}
                        <Route
                            path={`${process.env.PUBLIC_URL + "/service"}`}
                            element={<ServicePage />}
                        />
                        <Route
                            path={`${
                                process.env.PUBLIC_URL +
                                "/service-details/:title"
                            }`}
                            element={<ServiceDetails />}
                        />
                        <Route
                            path={`${process.env.PUBLIC_URL + "/team"}`}
                            element={<TeamPage />}
                        />
                        <Route
                            path={`${process.env.PUBLIC_URL + "/faq"}`}
                            element={<FaqPage />}
                        />
                        <Route
                            path={`${process.env.PUBLIC_URL + "/contact"}`}
                            element={<ContactPage />}
                        />
                        <Route
                            path={`${process.env.PUBLIC_URL + "/blog"}`}
                            element={<BlogPage />}
                        />
                        <Route
                            path={`${
                                process.env.PUBLIC_URL + "/blog-left-sidebar"
                            }`}
                            element={<BlogLeftSidebarPage />}
                        />
                        <Route
                            path={`${
                                process.env.PUBLIC_URL + "/blog-right-sidebar"
                            }`}
                            element={<BlogRightSidebarPage />}
                        />
                        <Route
                            path={`${
                                process.env.PUBLIC_URL + "/blog-details/:blogId"
                            }`}
                            element={<BlogDetailsPage />}
                        />
                        <Route
                            path={`${
                                process.env.PUBLIC_URL + "/author/:author"
                            }`}
                            element={<BlogAuthor />}
                        />
                        <Route
                            path={`${process.env.PUBLIC_URL + "/date/:date"}`}
                            element={<BlogDate />}
                        />
                        <Route
                            path={`${process.env.PUBLIC_URL + "/tag/:slug"}`}
                            element={<BlogTag />}
                        />
                        <Route
                            path={`${
                                process.env.PUBLIC_URL + "/category/:slug"
                            }`}
                            element={<BlogCategory />}
                        />
                        <Route
                            path={`${process.env.PUBLIC_URL + "/login"}`}
                            element={<SignIn />}
                        />
                        <Route
                            path={`${process.env.PUBLIC_URL + "/profile"}`}
                            element={<UserProfile />}
                        />
                        <Route path="*" element={<PageNotFound />} />
                    </Routes>
                </NavScrollTop>
            </BrowserRouter>
        </React.Fragment>
    );
};

export default App;
