import React from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { slugify } from "../../utils";

import { getImage } from "../../data/getImage";
const OfferGrid = ({ data, classOption }) => {
    return (
        <div className="blog-card">
            <div className={`thumb bg-light text-center ${classOption}`}>
                <Link
                    to={`/author/${slugify(data.title)}`}

                >
                    <img
                        src={getImage(data.media.gridImage)}
                        alt="img"
                    />
                </Link>
            </div>
            <div className="blog-content">
                <Link
                    to={`/author/${slugify(data.author)}`}
                >
                    <span className="blog-meta author">{data.author}</span>
                </Link>
                <span className="separator">-</span>
                <Link
                    to={`/author/${slugify(data.date)}`}
                >
                    <span className="blog-meta date">{data.date}</span>
                </Link>
                <h3 className="title">
                    <Link
                        to={`/author/${slugify(data.title)}`}
                    >
                        {data.title}
                    </Link>
                </h3>
            </div>
        </div>
    );
};

OfferGrid.propTypes = {
    data: PropTypes.object,
    classOption: PropTypes.string,
};

OfferGrid.defaultProps = {
    classOption: "thumb",
};

export default OfferGrid;
