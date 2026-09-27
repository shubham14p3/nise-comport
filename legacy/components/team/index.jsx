import PropTyps from "prop-types";
import { getImage } from "../../data/getImage";

const Team = ({ data }) => {
    return (
        <div className="new-team-members-list">
            <img src={getImage(data.thumb)} alt="images" />
            <h3 className="title">{data.name}</h3>
            <span>{data.designation}</span>
        </div>
    );
};

Team.propTypes = {
    data: PropTyps.object,
};

export default Team;
