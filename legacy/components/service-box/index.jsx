import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { slugify } from "../../utils";
import { getImage } from "../../data/getImage";

const ServiceBox = ({ data }) => {
    return (
        <div className="service-media">
            <Link
                to={`/service-details/${slugify(data.title)}`}
            >
                <img
                    className="logo"
                    src={getImage(data.icon)}
                    alt=" service logo"
                />
            </Link>
            <div className="service-media-body">
                <h4 className="title">
                    <Link
                        to={`/service-details/${slugify(data.title)}`}
                    >
                        {data.title}
                    </Link>
                </h4>
                <Link
                    to={
                        `/service-details/${slugify(data.title)}`
                    }
                >
                    <p>{data.excerpt}</p>
                </Link>
            </div>
        </div>
    );
};

ServiceBox.propTypes = {
    data: PropTypes.object,
};

export default ServiceBox;
