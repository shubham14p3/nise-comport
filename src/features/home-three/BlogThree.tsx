import { Link } from "react-router-dom";
import TextAnimation from "@/components/elements/TextAnimation";
import BlogOneShape3 from "@/assets/images/shapes/blog-one-shape-3.png";
import Blog21 from "@/assets/images/blog/blog-2-1.jpg";
import BlogOneUser1 from "@/assets/images/blog/blog-one-user-1.jpg";
import Blog22 from "@/assets/images/blog/blog-2-2.jpg";
import BlogOneUser2 from "@/assets/images/blog/blog-one-user-2.jpg";
import Blog23 from "@/assets/images/blog/blog-2-3.jpg";
import BlogOneUser3 from "@/assets/images/blog/blog-one-user-3.jpg";

export default function BlogThree() {
    return (
        <>
            {/* Blog One Start */}
            <section className="blog-one blog-two blog-three" id="blog">
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
                    <ul className="row list-unstyled">
                        {/*Blog One Single Start*/}
                        <li
                            className="col-xl-4 col-lg-4 wow fadeInLeft"
                            data-wow-delay="100ms"
                        >
                            <div className="blog-one__single">
                                <div className="blog-one__img">
                                    <img src={Blog21} />
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
                                            Improving Business Growth with New
                                            Technology
                                        </Link>
                                    </h3>
                                    <p className="blog-one__text">
                                        Winning the Digital business The 2025
                                        Transformation Roadmap.
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
                        </li>
                        {/*Blog One Single End*/}
                        {/*Blog One Single Start*/}
                        <li
                            className="col-xl-4 col-lg-4 wow fadeInUp"
                            data-wow-delay="200ms"
                        >
                            <div className="blog-one__single">
                                <div className="blog-one__img">
                                    <img src={Blog22} />
                                    <div className="blog-one__tags">
                                        <span>Digital</span>
                                        <span>Technology</span>
                                    </div>
                                </div>
                                <div className="blog-one__content">
                                    <div className="blog-one__user">
                                        <div className="blog-one__user-img">
                                            <img src={BlogOneUser2} />
                                        </div>
                                        <p className="blog-one__user-title">
                                            Readik males
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
                                            Regional Manager & limited
                                            management.
                                        </Link>
                                    </h3>
                                    <p className="blog-one__text">
                                        Winning the Digital business The 2025
                                        Transformation Roadmap.
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
                        </li>
                        {/*Blog One Single End*/}
                        {/*Blog One Single Start*/}
                        <li
                            className="col-xl-4 col-lg-4 wow fadeInRight"
                            data-wow-delay="300ms"
                        >
                            <div className="blog-one__single">
                                <div className="blog-one__img">
                                    <img src={Blog23} />
                                    <div className="blog-one__tags">
                                        <span>Digital</span>
                                        <span>Technology</span>
                                    </div>
                                </div>
                                <div className="blog-one__content">
                                    <div className="blog-one__user">
                                        <div className="blog-one__user-img">
                                            <img src={BlogOneUser3} />
                                        </div>
                                        <p className="blog-one__user-title">
                                            Tamu Tanu
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
                                            Easy and Most Powerful Server and
                                            Platform.
                                        </Link>
                                    </h3>
                                    <p className="blog-one__text">
                                        Winning the Digital business The 2025
                                        Transformation Roadmap.
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
                        </li>
                        {/*Blog One Single End*/}
                    </ul>
                </div>
            </section>
            {/* Blog One End */}
        </>
    );
}
