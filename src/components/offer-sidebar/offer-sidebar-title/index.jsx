import React from "react";
import PropTypes from "prop-types";

const OfferSidebarTitle = ({ title }) => {
    return (
        <>
            <h3 className="widget-title">{title}</h3>
        </>
    );
};

OfferSidebarTitle.propTypes = {
    title: PropTypes.string,
};

export default OfferSidebarTitle;
