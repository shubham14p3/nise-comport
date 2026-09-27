import React from "react";

import Link from "./Link";

const Passport = () => {
    const getUrl = () => {
        return `https://wa.me/919771219893?text=I%20need%20help%20in%20applying%20Passport.%20Kindly%20assist%20me`;
    };

    return <Link url={getUrl()} title={"Passport(IN)"} />;
};

export default Passport;
