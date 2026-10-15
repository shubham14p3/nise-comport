import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const Logo = ({ image, classOption = "text-center" }) => {
    return (
        <Link className={classOption} to="/home">
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

export default Logo;
