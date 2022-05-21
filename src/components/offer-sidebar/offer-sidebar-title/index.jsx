import React from "react";
import PropTypes from "prop-types";

const OfferSidebarTitle = ({ title }) => {
    return (
        <React.Fragment>
            <h3 className="widget-title">{title}</h3>
        </React.Fragment>
    );
};

OfferSidebarTitle.propTypes = {
    title: PropTypes.string,
};

export default OfferSidebarTitle;
