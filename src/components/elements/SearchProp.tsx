import React, { useContext } from "react";
import FinrisContext from "../context/FinrisContext";
import { useNavigate } from "react-router-dom";

const SearchProp: React.FC = () => {
    const context = useContext(FinrisContext);
    if (!context) throw new Error("Context Null");
    const { setIsSearch } = context;
    const navigate = useNavigate();
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        form.reset();
        setIsSearch((pre) => !pre);
        navigate("/blog");
    };
    return (
        <div className="search-popup">
            <div className="color-layer"></div>
            <button
                className="close-search"
                onClick={() => setIsSearch((pre) => !pre)}
            >
                <span className="far fa-times fa-fw"></span>
            </button>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <input
                        type="search"
                        name="search-field"
                        placeholder="Search Here"
                        required
                    />
                    <button type="submit">
                        <i className="fas fa-search"></i>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SearchProp;
