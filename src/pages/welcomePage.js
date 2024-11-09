import React, { useState, useEffect } from "react";
import Particles from "react-tsparticles";
import "./WelcomePage.css";

const WelcomePage = () => {
    const [scrolled, setScrolled] = useState(false);

    // Handle scroll event
    const handleScroll = () => {
        if (window.scrollY > 50) setScrolled(true);
    };

    useEffect(() => {
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="welcome-container">
            <Particles
                options={{
                    fpsLimit: 60,
                    particles: {
                        number: {
                            value: 50,
                            density: { enable: true, value_area: 800 },
                        },
                        color: { value: "#61dafb" },
                        shape: { type: "circle" },
                        opacity: { value: 0.3 },
                        size: { value: 5, random: true },
                        move: {
                            enable: true,
                            speed: 1,
                            direction: "none",
                            random: false,
                            straight: false,
                            bounce: false,
                        },
                    },
                }}
            />
            <div className={`welcome-content ${scrolled ? "scrolled" : ""}`}>
                <h1>Welcome</h1>
                <h1>to</h1>
                <h1>Nise Comport</h1>
                {scrolled && (
                    <button
                        className="continue-button"
                        onClick={() => alert("Continuing...")}
                    >
                        Continue
                    </button>
                )}
            </div>
        </div>
    );
};

export default WelcomePage;
