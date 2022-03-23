import React from "react";
import PropTypes from "prop-types";
import OfferSidebarCategories from "../../../components/offer-sidebar/offer-categories";
import SidebarSearch from "../../../components/sidebar/search";
import OfferSidebarTag from "../../../components/offer-sidebar/offer-sidbar-tag";
import OfferSidebarArchive from "../../../components/offer-sidebar/offer-sidebar-archive";
import OfferSidebarPost from "../../../components/offer-sidebar/offer-sidebar-post";
import OfferSidebarTitle from "../../../components/offer-sidebar/offer-sidebar-title";
import OfferData from "../../../data/offer.json";
import OfferDetailsWrap from "../../../components/offer-details";
import Comment from "../../../components/comment";

const OfferDetailsContainer = ({ data }) => {
    return (
        <div className="blog-section section-py">
            <div className="container">
                <div className="row mb-n7">
                    <div className="col-xl-8 col-lg-8 mb-7">
                        <div className="blog-details-content">
                            <OfferDetailsWrap data={data} />
                            <div className="blog-comments ">
                                <h3 className="blog-comment-title">
                                    Leave a Reply or Comment
                                </h3>
                                <p>
                                    Top rated construction packages we pleasure
                                    rationally encounter consequences
                                    interesting who loves or pursue or desires
                                    to obtain These cases are perfectly simple
                                    and easy
                                </p>
                            </div>

                            <Comment
                                url=""
                                id={OfferData.id}
                                title={OfferData.title}
                            />
                        </div>
                    </div>
                    <div className="col-xl-3 col-lg-4 mb-7 offset-xl-1">
                        <div className="widget-wrapper widget-wrapper-nl">
                            <div className="sidebar-widget">
                                <OfferSidebarTitle title="Search" />
                                <SidebarSearch />
                            </div>

                            <div className="sidebar-widget">
                                <OfferSidebarTitle title="Categories" />
                                <OfferSidebarCategories data={OfferData} />
                            </div>
                            <div className="sidebar-widget">
                                <OfferSidebarTitle title="popular post" />
                                <OfferSidebarPost data={OfferData} />
                            </div>

                            <div className="sidebar-widget">
                                <OfferSidebarTitle title="Archive" />
                                <OfferSidebarArchive data={OfferData} />
                            </div>

                            <div className="sidebar-widget">
                                <OfferSidebarTitle title="Tags" />
                                <OfferSidebarTag data={OfferData} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

OfferDetailsContainer.propTypes = {
    data: PropTypes.object,
};

export default OfferDetailsContainer;
