import PropTyps from "prop-types";
import { getImage } from "../../data/getImage";

const TeamCard = ({ data }) => {
    return (
        <div className="team-card">
            <div className="thumb">
                <img src={getImage(data.thumb)} alt="img" />
            </div>
            <div className="content">
                <h3 className="title">{data.name}</h3>
                <span>{data.designation}</span>
            </div>
        </div>
    );
};

TeamCard.propTypes = {
    data: PropTyps.object,
};

export default TeamCard;
