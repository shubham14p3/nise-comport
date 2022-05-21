import React from "react";

import Link from "./Link";

const Voter = () => {
    const getUrl = () => {
        return `https://wa.me/919771219893?text=I%20need%20help%20in%20applying%20Voter.%20Kindly%20assist%20me`;
    };

    return <Link url={getUrl()} title={"VOTER"} />;
};

export default Voter;
