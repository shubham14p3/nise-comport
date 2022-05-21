import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { slugify } from "../../../utils";

const OfferSidebarPost = ({ data }) => {
    return (
        <div className="widget-post-wrap">
            {data.slice(0, 3).map((single, i) => {
                return (
                    <div key={i} className="widget-post-list">
                        <Link
                            to={
                                process.env.PUBLIC_URL +
                                `/offer-details/${slugify(single.title)}`
                            }
                            className="post-thumb"
                        >
                            <img
                                src={`${process.env.PUBLIC_URL}/${single.media.rcImage}`}
                                alt="img"
                            />
                        </Link>
                        <div className="widget-post-content">
                            <h3 className="widget-sub-title">
                                <Link
                                    to={
                                        process.env.PUBLIC_URL +
                                        `/offer-details/${slugify(
                                            single.title
                                        )}`
                                    }
                                >
                                    {single.title}
                                </Link>
                            </h3>
                            <p className="post-meta">{single.date}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

OfferSidebarPost.propTypes = {
    data: PropTypes.array,
};

export default OfferSidebarPost;
