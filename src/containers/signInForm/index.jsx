import { useEffect, useState, useRef } from "react";
import Button from "../../components/button";
import SectionTitle from "../../components/section-title";
import Parallax from "parallax-js";
import { Link } from "react-router-dom";
const SignInForm = () => {
    const [swapPanel, setSwapPanel] = useState(false);

    const signUpButton = () => {
        setSwapPanel(true);
    };
    const signInButton = () => {
        setSwapPanel(false);
    };
    const [user, setUser] = useState({
        name: "",
        email: "",
        password: "",
    });
    let name, value;
    const handleInput = (e) => {
        name = e.target.name;
        value = e.target.value;
        setUser({ ...user, [name]: value });
    };

    let handleSubmit = async (e) => {
        e.preventDefault();
        const { name, email, password } = user;
        // "proxy": "https://ns-db-2022.herokuapp.com",
        const res = await fetch("https://ns-db-2022.herokuapp.com/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                email,
                password,
            }),
        });
        const resJson = await res.json();
        console.log("resJson:", resJson);
        if (resJson.status === 200 || resJson) {
            window.alert("Successful");
        }
    };
    return (
        <div className="sigin">
            <div
                className={[
                    "container",
                    swapPanel ? "right-panel-active" : null,
                ]
                    .filter(Boolean)
                    .join(" ")}
                id="container"
            >
                <div className="form-container sign-up-container">
                    <form method="POST">
                        <h1>Create Account</h1>
                        <div className="social-container"></div>
                        <span>or use your email for registration</span>
                        <input
                            type="text"
                            placeholder="Name"
                            name="name"
                            value={user.name}
                            onChange={handleInput}
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            name="email"
                            value={user.email}
                            onChange={handleInput}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            name="password"
                            value={user.password}
                            onChange={handleInput}
                        />
                        <button
                            className="btn btn-lg btn-dark btn-hover-dark"
                            type="submit"
                            onClick={handleSubmit}
                        >
                            Sign Up
                        </button>
                    </form>
                </div>
                <div className="form-container sign-in-container">
                    <form action="#">
                        <h1>Sign in</h1>
                        <div className="social-container"></div>
                        <span>or use your account</span>
                        <input type="email" placeholder="Email" />
                        <input type="password" placeholder="Password" />
                        Forgot your password?
                        {/* <a href="#">Forgot your password?</a> */}
                        <button
                            className="btn btn-lg btn-dark btn-hover-dark"
                            onClick={""}
                        >
                            Sign In
                        </button>
                    </form>
                </div>
                <div className="overlay-container">
                    <div className="overlay">
                        <div className="overlay-panel overlay-left">
                            <h1>Welcome Back!</h1>
                            <p>
                                To keep connected with us please login with your
                                personal info
                            </p>
                            <button
                                type="button"
                                onClick={signInButton}
                                className="ghost"
                                id="signIn"
                            >
                                Sign In
                            </button>
                        </div>
                        <div className="overlay-panel overlay-right">
                            <h1>Hello, Friend!</h1>
                            <p>
                                Enter your personal details and start journey
                                with us
                            </p>
                            <button
                                type="button"
                                onClick={signUpButton}
                                className="ghost"
                                id="signUp"
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default SignInForm;
