import PropTypes from "prop-types";

const SocialIcon = ({ path = "#", icon, classOption = "footer-social-link" }) => {
    return (
        <a
            className={classOption}
            href={path}
            target="_blank"
            rel="noopener noreferrer"
        >
            <i className={icon}></i>
        </a>
    );
};

SocialIcon.propTypes = {
    path: PropTypes.string,
    icon: PropTypes.string,
    classOption: PropTypes.string,
};

export default SocialIcon;