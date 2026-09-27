import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { slugify } from "../../utils";
import { getImage } from "../../data/getImage";

const BlogGrid = ({ data, classOption = "thumb" }) => {
    return (
        <div className="blog-card">
            <div className={`thumb bg-light text-center ${classOption}`}>
                <Link to={`/blog-details/${slugify(data.title)}`}>
                    <img src={getImage(data.media.gridImage)} alt={data.title} />
                </Link>
            </div>

            <div className="blog-content">
                <Link to={`/author/${slugify(data.author)}`}>
                    <span className="blog-meta author">{data.author}</span>
                </Link>

                <span className="separator">-</span>

                <Link to={`/date/${slugify(data.date)}`}>
                    <span className="blog-meta date">{data.date}</span>
                </Link>

                <h3 className="title">
                    <Link to={`/blog-details/${slugify(data.title)}`}>
                        {data.title}
                    </Link>
                </h3>
            </div>
        </div>
    );
};

BlogGrid.propTypes = {
    data: PropTypes.object,
    classOption: PropTypes.string,
};

export default BlogGrid;