import React from "react";
import PropTypes from "prop-types";
import { fixHtmlImagePaths, getImage } from "../../data/getImage";
const ServiceDetails = ({ data }) => {
    return (
        <div className="service-wrap">
            <div className="service-thumb bg-light text-center">
                <img src={getImage(data.image)} alt="" />
            </div>
            <div className="title-section">
                <h3 className="title pb-2">{data.title}</h3>
                <div className="service-content-wrap">
                    {data.body.map((single, key) => (
                        <div
                            className="desc"
                            key={key}
                            dangerouslySetInnerHTML={{ __html: fixHtmlImagePaths(single) }}
                        ></div>
                    ))}
                </div>
            </div>
        </div>
    );
};

ServiceDetails.propTypes = {
    data: PropTypes.object,
};

export default ServiceDetails;
