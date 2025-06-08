import PropTypes from "prop-types";

const SocialIcon = ({ path, icon, classOption }) => {
    return (
        <a
            className={`${classOption}`}
            href={import.meta.env.BASE_URL + path}
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
SocialIcon.defaultProps = {
    classOption: "footer-social-link",
};

export default SocialIcon;
