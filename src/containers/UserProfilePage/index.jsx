import React, { useEffect, useState } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";
import { HistoryEduTwoTone } from "@mui/icons-material";
const TabPanel = (props) => {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    <Typography>{children}</Typography>
                </Box>
            )}
        </div>
    );
};

const a11yProps = (index) => {
    return {
        id: `simple-tab-${index}`,
        "aria-controls": `simple-tabpanel-${index}`,
    };
};

const UserProfilePage = () => {
    const [value, setValue] = useState(0);
    const [userData, setUserData] = useState({});
    const navigate = useNavigate();
    const handleChange = (event, newValue) => {
        setValue(newValue);
    };
    const baseURL =
        process.env.NODE_ENV === "development"
            ? "https://ns-db-2022.herokuapp.com"
            : "https://ns-db-2022.herokuapp.com";
    const callUserPage = async () => {
        try {
            const res = await fetch(baseURL + "/profile", {
                method: "GET",
                headers: {
                    Accept: "appllication/json",
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods":
                        "DELETE, POST, GET, OPTIONS",
                    "Access-Control-Allow-Headers":
                        "Content-Type, Authorization, X-Requested-With",
                },
                credentials: "include",
            });
            const data = await res.json();
            setUserData(data);
            if (!res.status === 200) {
                const error = new Error(res.error);
                throw error;
            }
        } catch (error) {
            navigate("/login");
        }
    };

    useEffect(() => {
        callUserPage();
    }, []);

    return (
        <>
            <div className="container user-profile">
                {/* <from method=""> */}
                <div className="row-user-profile-upper">
                    <div className="col-md-4">
                        <img
                            src={`${process.env.PUBLIC_URL}/images/users/12.png`}
                            alt="UserPhoto"
                            className="user-profile-img"
                        />
                    </div>

                    <div className="col-md-6">
                        <div className="profile-head">
                            <h5>Shubham</h5>
                            <h6>web developer</h6>
                        </div>
                        <Box sx={{ width: "100%" }}>
                            <Box
                                sx={{
                                    borderBottom: 1,
                                    borderColor: "divider",
                                }}
                            >
                                <Tabs
                                    value={value}
                                    onChange={handleChange}
                                    aria-label="basic tabs example"
                                >
                                    <Tab label="Details" {...a11yProps(0)} />
                                    <Tab label="Timeline" {...a11yProps(1)} />
                                    <Tab
                                        label="Order History"
                                        {...a11yProps(2)}
                                    />
                                </Tabs>
                            </Box>
                            <TabPanel value={value} index={0}>
                                <div className="row">
                                    <div className="col-md-6">
                                        <span>User ID</span>
                                    </div>
                                    <div className="col-md-6">
                                        <p>{userData._id}</p>
                                    </div>
                                </div>
                                <div className="row mt-3">
                                    <div className="col-md-6">
                                        <span>Name</span>
                                    </div>
                                    <div className="col-md-6">
                                        <p>{userData.name}</p>
                                    </div>
                                </div>
                                <div className="row mt-3">
                                    <div className="col-md-6">
                                        <span>Email</span>
                                    </div>
                                    <div className="col-md-6">
                                        <p>{userData.email}</p>
                                    </div>
                                </div>
                                <div className="row mt-3">
                                    <div className="col-md-6">
                                        <span>Phone</span>
                                    </div>
                                    <div className="col-md-6">
                                        <performance>00000000</performance>
                                    </div>
                                </div>
                                <div className="row mt-3">
                                    <div className="col-md-6">
                                        <span>Country</span>
                                    </div>
                                    <div className="col-md-6">
                                        <p>India</p>
                                    </div>
                                </div>
                            </TabPanel>
                            <TabPanel value={value} index={1}>
                                Item Two
                            </TabPanel>
                            <TabPanel value={value} index={2}>
                                Item Three
                            </TabPanel>
                        </Box>
                    </div>
                    <div className="col-md-2">
                        <input
                            type="submit"
                            className="edit-user-btn"
                            value="Edit Profile"
                        />
                    </div>
                </div>
                <div className="row-user-profile-lower">
                    <div className="col-md-4">
                        <div className="profile-work">
                            <p>Work Link</p>
                            <a href="https;//www.google.com" target="#">
                                youtube
                            </a>
                        </div>
                    </div>
                    <div className="col-md-8"></div>
                </div>
                {/* </from> */}
            </div>
        </>
    );
};

export default UserProfilePage;
