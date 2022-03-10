import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { slugify } from "../../utils";

const ServiceBox = ({ data }) => {
    return (
        <div className="service-media">
            <Link
                to={
                    process.env.PUBLIC_URL +
                    `/service-details/${slugify(data.id)}`
                }
            >
                <img
                    className="logo"
                    src={process.env.PUBLIC_URL + data.icon}
                    alt=" service logo"
                />
            </Link>
            <div className="service-media-body">
                <h4 className="title">
                    <Link
                        to={
                            process.env.PUBLIC_URL +
                            `/service-details/${slugify(data.id)}`
                        }
                    >
                        {data.title}
                    </Link>
                </h4>
                <Link
                    to={
                        process.env.PUBLIC_URL +
                        `/service-details/${slugify(data.id)}`
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
