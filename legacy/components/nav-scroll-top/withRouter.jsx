import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const withRouter = (Component) => {
    const Wrapper = (props) => {
        const navigate = useNavigate();
        const location = useLocation();
        const params = useParams();

        return (
            <Component
                {...props}
                router={{ navigate, location, params }}
            />
        );
    };

    return Wrapper;
};

export default withRouter;