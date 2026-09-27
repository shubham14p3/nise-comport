import React from "react";

import Link from "./Link";

const Pan = () => {
    const getUrl = () => {
        return `https://wa.me/919771219893?text=I%20need%20help%20in%20applying%20Pan.%20Kindly%20assist%20me`;
    };

    return <Link url={getUrl()} title={"PAN"} />;
};

export default Pan;
