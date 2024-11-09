import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { getImage } from "../../data/getImage"; // Import the getImage function

const Logo = ({ image, classOption }) => {
    return (
        <Link className={`${classOption}`} to="/home">
            <img
                className="logo-main"
                src={getImage(image)} // Use getImage to resolve the image path
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
