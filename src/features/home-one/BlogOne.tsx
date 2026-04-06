import { Link } from "react-router-dom";
import TextAnimation from "@/components/elements/TextAnimation";
import FadeInAdvanced from "@/components/elements/FadeInAdvanced";
import BlogOneShape3 from "@/assets/images/shapes/blog-one-shape-3.png";
import Blog11 from "@/assets/images/blog/blog-1-1.jpg";
import BlogOneUser1 from "@/assets/images/blog/blog-one-user-1.jpg";
import Blog12 from "@/assets/images/blog/blog-1-2.jpg";
import BlogOneUser2 from "@/assets/images/blog/blog-one-user-2.jpg";
import Blog13 from "@/assets/images/blog/blog-1-3.jpg";
import BlogOneUser3 from "@/assets/images/blog/blog-one-user-3.jpg";

export default function BlogOne() {
    return (
        <>
            {/* Blog One Start */}
            <section className="blog-one" id="blog">
                <div className="blog-one__shape-1"></div>
                <div className="blog-one__shape-2"></div>
                <div className="blog-one__shape-3 float-bob">
                    <img src={BlogOneShape3} />
                </div>
                <div className="container">
                    <div className="section-title text-center sec-title-animation animation-style1">
                        <div className="section-title__tagline-box">
                            <span className="section-title__tagline">
                                Our Blogs
                            </span>
                        </div>
                        <h2 className="section-title__title">
                            <TextAnimation style="s1">
                                Latest News & Articles From
                                <br /> The <span>Blog Posts</span>
                            </TextAnimation>
                        </h2>
                    </div>
                    <div className="row">
                        {/*Blog One Single Start*/}
                        <div className="col-xl-6">
                            <FadeInAdvanced variant={"fadeInLeft"} delay={100}>
                                <div className="blog-one__single">
                                    <div className="blog-one__img">
                                        <img src={Blog11} />
                                        <div className="blog-one__tags">
                                            <span>Digital</span>
                                            <span>Technology</span>
                                        </div>
                                    </div>
                                    <div className="blog-one__content">
                                        <div className="blog-one__user">
                                            <div className="blog-one__user-img">
                                                <img src={BlogOneUser1} />
                                            </div>
                                            <p className="blog-one__user-title">
                                                Malaika alise
                                            </p>
                                        </div>
                                        <ul className="blog-one__meta list-unstyled">
                                            <li>
                                                <Link to="/blog-details">
                                                    <span className="far fa-calendar-alt"></span>
                                                    April 5, 2025
                                                </Link>
                                            </li>
                                            <li>
                                                <Link to="/blog-details">
                                                    <span className="fal fa-comments"></span>
                                                    80 Comments
                                                </Link>
                                            </li>
                                        </ul>
                                        <h3 className="blog-one__title">
                                            <Link to="/blog-details">
                                                Improving Business Growth with
                                                New
                                                <br /> Technology
                                            </Link>
                                        </h3>
                                        <p className="blog-one__text">
                                            Winning the Digital business The
                                            2025 Transformation Roadmap.
                                            Holisticly leverage existing
                                            magnetic. Next-Gen Digital
                                            Transformation
                                        </p>
                                        <div className="blog-one__btn-box">
                                            <Link
                                                to="/blog-details"
                                                className="thm-btn"
                                            >
                                                Reed More
                                                <span className="fas fa-arrow-right"></span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </FadeInAdvanced>
                        </div>
                        {/*Blog One Single End*/}
                        <div className="col-xl-6">
                            {/* Blog One Single Two Start */}
                            <FadeInAdvanced
                                variant={"fadeInUp"}
                                delay={200}
                            >
                                <div className="blog-one__single-two">
                                    <div className="blog-one__img-two">
                                        <img src={Blog12} />
                                        <div className="blog-one__tags-two">
                                            <span>Digital</span>
                                            <span>Technology</span>
                                        </div>
                                    </div>
                                    <div className="blog-one__content-two">
                                        <div className="blog-one__user-two">
                                            <div className="blog-one__user-two-img">
                                                <img src={BlogOneUser2} />
                                            </div>
                                            <p className="blog-one__user-two-title">
                                                John Smith
                                            </p>
                                        </div>
                                        <ul className="blog-one__meta-two list-unstyled">
                                            <li>
                                                <Link to="/blog-details">
                                                    <span className="far fa-calendar-alt"></span>
                                                    Feb 25, 2025
                                                </Link>
                                            </li>
                                            <li>
                                                <Link to="/blog-details">
                                                    <span className="fal fa-comments"></span>
                                                    22 Comments
                                                </Link>
                                            </li>
                                        </ul>
                                        <h3 className="blog-one__title-two">
                                            <Link to="/blog-details">
                                                Regional Manager & limited
                                                management.
                                            </Link>
                                        </h3>
                                        <p className="blog-one__text-two">
                                            Winning the Digital business The
                                            2025 Transformation Roadmap.
                                        </p>
                                        <div className="blog-one__btn-box-two">
                                            <Link
                                                to="/blog-details"
                                                className="thm-btn"
                                            >
                                                Reed More
                                                <span className="fas fa-arrow-right"></span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </FadeInAdvanced>
                            {/* Blog One Single Two End */}
                            {/* Blog One Single Two Start */}
                            <FadeInAdvanced
                                variant={"fadeInUp"}
                                delay={300}
                            >
                                <div className="blog-one__single-two">
                                    <div className="blog-one__img-two">
                                        <img src={Blog13} />
                                        <div className="blog-one__tags-two">
                                            <span>Digital</span>
                                            <span>Technology</span>
                                        </div>
                                    </div>
                                    <div className="blog-one__content-two">
                                        <div className="blog-one__user-two">
                                            <div className="blog-one__user-two-img">
                                                <img src={BlogOneUser3} />
                                            </div>
                                            <p className="blog-one__user-two-title">
                                                Jerin jara
                                            </p>
                                        </div>
                                        <ul className="blog-one__meta-two list-unstyled">
                                            <li>
                                                <Link to="/blog-details">
                                                    <span className="far fa-calendar-alt"></span>
                                                    May 19, 2025
                                                </Link>
                                            </li>
                                            <li>
                                                <Link to="/blog-details">
                                                    <span className="fal fa-comments"></span>
                                                    15 Comments
                                                </Link>
                                            </li>
                                        </ul>
                                        <h3 className="blog-one__title-two">
                                            <Link to="/blog-details">
                                                Easy and Most Powerful Server
                                                and Platform.
                                            </Link>
                                        </h3>
                                        <p className="blog-one__text-two">
                                            Winning the Digital business The
                                            2025 Transformation Roadmap.
                                        </p>
                                        <div className="blog-one__btn-box-two">
                                            <Link
                                                to="/blog-details"
                                                className="thm-btn"
                                            >
                                                Reed More
                                                <span className="fas fa-arrow-right"></span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </FadeInAdvanced>
                            {/* Blog One Single Two End */}
                        </div>
                    </div>
                </div>
            </section>
            {/* Blog One End */}
        </>
    );
}
