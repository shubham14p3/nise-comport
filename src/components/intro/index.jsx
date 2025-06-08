import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import Button from "../button";
import Parallax from "parallax-js";
import SocialIcon from "../../components/social-icon";
import { getImage } from "../../data/getImage";

const Intro = ({ data }) => {
    const sceneEl = useRef(null);
    const img = data.image;

    useEffect(() => {
        const parallaxInstance = new Parallax(sceneEl.current, {
            relativeInput: true,
        });

        parallaxInstance.enable();

        return () => parallaxInstance.disable();
    }, []);

    return (
        <div className="hero-slider">
            <div className="container">
                <div className="row align-items-center">
                    <div className="col-lg-6">
                        <div className="hero-slide-content">
                            <h2
                                className="title animated"
                                dangerouslySetInnerHTML={{ __html: data.title }}
                            ></h2>

                            {/* Spaced & outlined buttons */}
                            <div className="d-flex flex-wrap gap-3 mt-4">
                                <Button
                                    classOption="btn btn-lg btn-outline-secondary"
                                    text="About Us"
                                    path="/about"
                                />
                                <Button
                                    classOption="btn btn-lg btn-outline-dark"
                                    text="Contact Us"
                                    path="/contact"
                                />
                                <SocialIcon
                                    classOption="btn btn-lg btn-outline-success"
                                    path="https://wa.me/919771219893"
                                    icon="icofont-whatsapp"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-6">
                        <div
                            className="hero-img scene mt-10 mt-lg-0"
                            id="scene"
                            ref={sceneEl}
                        >
                            <div data-depth="0.2">
                                <img
                                    className="animated"
                                    src={getImage(img)}
                                    alt="Hero"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

Intro.propTypes = {
    data: PropTypes.object,
};

export default Intro;
