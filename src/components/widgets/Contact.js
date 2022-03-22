import React from "react";

import UrlIcon from "../../assets/icons/call.svg";

const ContactLink = () => {
    return (
        <a href="tel:+919835552756" className="chatbotbox-tel-link">
            <img className="chatbotbox-url-icon" alt="CallIcon" src={UrlIcon} />
            <h1 className="tel-header"> Call 9835552756 </h1>
        </a>
    );
};

export default ContactLink;
