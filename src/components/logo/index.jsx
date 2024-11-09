import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const Logo = ({ image, classOption }) => {
    return (
        <Link className={`${classOption}`} to={"/"}>
            <img
                className="logo-main"
                src={image}
                alt="Logo"
            />
        </Link>
    );
};

Logo.propTypes = {
    image: PropTypes.string,
    classOption: PropTypes.string,
};

Logo.defaultProps = {
    classOption: "text-center",
};

export default Logo;
