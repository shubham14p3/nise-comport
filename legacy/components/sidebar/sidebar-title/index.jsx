import React from "react";
import PropTypes from "prop-types";

const SidebarTitle = ({ title }) => {
    return (
        <>
            <h3 className="widget-title">{title}</h3>
        </>
    );
};

SidebarTitle.propTypes = {
    title: PropTypes.string,
};

export default SidebarTitle;
