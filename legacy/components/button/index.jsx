import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const Button = ({ classOption = "btn", text, path = "/" }) => {
    return (
        <Link to={path} className={classOption}>
            {text}
        </Link>
    );
};

Button.propTypes = {
    classOption: PropTypes.string,
    text: PropTypes.string,
    path: PropTypes.string,
};

export default Button