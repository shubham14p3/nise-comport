import React, { useState, useEffect } from "react";

const WelcomePage = () => {
    const [showContinueButton, setShowContinueButton] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const lastLetter = document.querySelector(".c12");
            if (lastLetter) {
                const rect = lastLetter.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom >= 0) {
                    setShowContinueButton(true);
                } else {
                    setShowContinueButton(false);
                }
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navigateToHomepage = () => {
        window.location.href = "/home"; // Replace with your homepage URL
    };

    return (
        <>
            <style>
                {`
                    @import url("https://fonts.googleapis.com/css?family=Fredoka+One&display=swap");

                    html {
                        scroll-behavior: smooth;
                    }

                    body {
                        overflow-x: hidden;
                    }

                    .codepen {
                        display: flex;
                        font-size: 60px;
                        align-items: flex-start;
                        color: #000;
                        justify-content: center;
                        position: relative;
                    }

                    .bg {
                        position: absolute;
                        left: -25vw;
                        top: -50vw;
                        width: 150vw;
                        height: 1180vw;
                        background-image: url(https://images.unsplash.com/photo-1538291323976-37dcaafccb12?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1300&q=80);
                        background-size: cover;
                        z-index: -1;
                        -webkit-filter: blur(120px);
                        filter: blur(120px);
                    }

                    span {
                        position: sticky;
                        top: calc(50% - 50px);
                        height: 100px;
                        display: inline-flex;
                        align-items: center;
                        mix-blend-mode: overlay;
                        font-family: "Fredoka One", sans-serif;
                        margin-left: 2px;
                        margin-right: 2px;
                        font-size: 120px;
                    }

                    /* Apply different scroll effects to each letter */
                    .c2 { margin-top: 100vw; }
                    .c3 { margin-top: 200vw; }
                    .c4 { margin-top: 300vw; }
                    .c5 { margin-top: 400vw; }
                    .c6 { margin-top: 500vw; }
                    .c7 { margin-top: 600vw; }
                    .c8 { margin-top: 700vw; }
                    .c9 { margin-top: 800vw; }
                    .c10 { margin-top: 900vw; }
                    .c11 { margin-top: 1000vw; }
                    .c12 { margin-top: 1100vw; }

                    a {
                        position: sticky;
                        bottom: -80px;
                        width: 5%;
                        height: 12%;
                        text-align: center;
                        right: 0;
                        padding: 10px 20px;
                        float: right;
                        font-family: "Fredoka One", sans-serif;
                        mix-blend-mode: overlay;
                        color: #fff;
                        font-size: 15px;
                        z-index: 1;
                        background-color: #000;
                        border-radius: 20px 0 0;
                        text-decoration: none;
                    }

                    .scroll {
                        position: fixed;
                        background-color: rgba(0, 0, 0, 0.7);
                        bottom: 0;
                        pointer-events: none;
                    }

                    @media (max-width: 660px) {
                        a {
                            display: none;
                        }

                        span {
                            font-size: 15vw;
                        }
                    }

                    .chevron {
                        position: absolute;
                        width: 28px;
                        height: 8px;
                        opacity: 0;
                        transform: scale3d(0.5, 0.5, 0.5);
                        animation: move 3s ease-out infinite;
                    }

                    .chevron:first-child {
                        animation: move 3s ease-out 1s infinite;
                    }

                    .chevron:nth-child(2) {
                        animation: move 3s ease-out 2s infinite;
                    }

                    .chevron:before,
                    .chevron:after {
                        content: " ";
                        position: absolute;
                        top: 0;
                        height: 100%;
                        width: 51%;
                        background: #fff;
                    }

                    .chevron:before {
                        left: 0;
                        transform: skew(0deg, 30deg);
                    }

                    .chevron:after {
                        right: 0;
                        width: 50%;
                        transform: skew(0deg, -30deg);
                    }

                    @keyframes move {
                        25% { opacity: 1; }
                        33% { opacity: 1; transform: translateY(30px); }
                        67% { opacity: 1; transform: translateY(40px); }
                        100% { opacity: 0; transform: translateY(55px) scale3d(0.5, 0.5, 0.5); }
                    }

                    @keyframes pulse {
                        to { opacity: 1; }
                    }

                    .continue-button {
                        position: fixed;
                        bottom: 50px;
                        padding: 15px 30px;
                        font-size: 20px;
                        background-color: #007bff75;
                        color: #fff;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        z-index: 10;
                        animation: pulse 1.5s infinite;
                    }
                `}
            </style>

            <div className="codepen">
                <span className="c1">N</span>
                <span className="c2">I</span>
                <span className="c3">S</span>
                <span className="c4">E</span>
                <span className="c5">-</span>
                <span className="c6">C</span>
                <span className="c7">O</span>
                <span className="c8">M</span>
                <span className="c9">P</span>
                <span className="c10">O</span>
                <span className="c11">R</span>
                <span className="c12">T</span>
                <div className="bg"></div>

                <a className="scroll">
                    <div className="container">
                        <div className="chevron"></div>
                        <div className="chevron"></div>
                        <div className="chevron"></div>
                    </div>
                </a>

                {showContinueButton ? (
                    <button
                        className="continue-button"
                        onClick={navigateToHomepage}
                    >
                        Continue..
                    </button>
                ) : null}
            </div>
        </>
    );
};

export default WelcomePage;
