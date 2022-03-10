import { useEffect } from "react";
import { withRouter } from "./withRouter";

const NavScrollTop = (props) => {
    useEffect(() => {
        window.scrollTo(0, 0);
    });
    return props.children;
};

export default withRouter(NavScrollTop);
