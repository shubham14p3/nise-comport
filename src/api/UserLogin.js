const baseURL =
    process.env.NODE_ENV === "development"
        ? "https://ns-db-2022.herokuapp.com"
        : "https://ns-db-2022.herokuapp.com";

const signUpEndPoint = "/register";
const signnInEndPoint = "/signin";

export const handleSingUpSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, cpassword } = user;
    // "proxy": "https://ns-db-2022.herokuapp.com",
    const res = await fetch(baseURL + signUpEndPoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name,
            email,
            password,
            cpassword,
        }),
    });
    const resJson = await res.json();
    console.log("resJson:", resJson);
    if (resJson.status === 200 || resJson) {
        window.alert("Successful");
    }
};
export const handleSingInSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = user;
    // "proxy": "https://ns-db-2022.herokuapp.com",
    const res = await fetch(baseURL + signnInEndPoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email,
            password,
        }),
    });
    const resJson = await res.json();
    console.log("resJson:", resJson);
    if (resJson.status === 200 || resJson) {
        window.alert("Successful singin");
    }
};

export default { handleSingInSubmit, handleSingUpSubmit };
