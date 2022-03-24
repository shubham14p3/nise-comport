import { NavLink } from "react-router-dom";
import PropTypes from "prop-types";
import { flatDeep, slugify, containsObject } from "../../../utils";

const OfferServiceCate = ({ data }) => {
    const cats = data.map((item) => {
        return item.categories;
    });
    let singleCatArray = flatDeep(cats).filter((item) => Boolean(item));
    let categories = [];
    singleCatArray.forEach((cat) => {
        const obj = {
            title: cat.trim(),
            slug: slugify(cat),
            count: 1,
        };
        const objIndex = containsObject(obj, categories);
        if (objIndex !== -1) {
            const prevCount = categories[objIndex].count;
            categories[objIndex] = {
                title: cat.trim(),
                slug: slugify(cat),
                count: prevCount + 1,
            };
        } else {
            categories.push(obj);
        }
    });
    return (
        <div className="sidbar-menu">
            <ul>
                {data.map((single, i) => {
                    return (
                        <li key={i}>
                            <NavLink
                                activeClassName="active"
                                to={
                                    process.env.PUBLIC_URL +
                                    `/offer-details/${slugify(single.title)}`
                                }
                            >
                                <img src={single.smallIcon} alt="logo" />
                                {single.title}
                            </NavLink>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

OfferServiceCate.propTypes = {
    data: PropTypes.array,
};

export default OfferServiceCate;
