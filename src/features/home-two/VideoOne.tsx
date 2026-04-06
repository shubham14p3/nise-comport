import { Link } from "react-router-dom";
import VideoOneShape1 from "@/assets/images/shapes/video-one-shape-1.png";
import VideoOneBgShape from "@/assets/images/shapes/video-one-bg-shape.png";
import VideoOneBg from "@/assets/images/backgrounds/video-one-bg.jpg";
import YoutubeFrem from "@/components/elements/YoutubeFrem";

export default function VideoOne() {
    return (
        <>
            {/*Video One Start */}
            <section className="video-one">
                <div
                    className="video-one__bg jarallax"
                    data-jarallax
                    data-speed="0.2"
                    data-imgPosition="50% 0%"
                    style={{ backgroundImage: `url(${VideoOneBg})` }}
                ></div>
                <div
                    className="video-one__bg-shape"
                    style={{ backgroundImage: `url(${VideoOneBgShape})` }}
                ></div>
                <div className="container">
                    <div className="video-one__inner">
                        <div className="video-one__video-link">
                            <YoutubeFrem className="video-popup" video="https://www.youtube.com/watch?v=rbFoRH2deeY">
                                <div className="video-one__video-icon">
                                    <span className="icon-play-button-arrowhead"></span>
                                    <i className="ripple"></i>
                                </div>
                            </YoutubeFrem>
                        </div>
                        <h3 className="video-one__title">
                            Unlocking Growth Potential with Advanced
                            <br /> Business success
                        </h3>
                        <div className="video-one__btn-box">
                            <Link to="/contact" className="thm-btn">
                                Contact Us
                                <span className="fas fa-arrow-right"></span>
                            </Link>
                            <div className="video-one__shape-1">
                                <img src={VideoOneShape1} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/*Video One End */}
        </>
    );
}
