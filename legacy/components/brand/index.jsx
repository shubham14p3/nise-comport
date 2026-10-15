import PropTypes from "prop-types";
import { getImage } from "../../data/getImage";

const Brand = ({ data }) => {
    return (
        <div className="single-brand">
            <img src={getImage(data.image)} alt="brand logo" />
        </div>
    );
};

Brand.propTypes = {
    data: PropTypes.object,
};

export default Brand;
