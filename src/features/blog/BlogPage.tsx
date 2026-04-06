import { Link } from "react-router-dom";
import FadeInAdvanced from "@/components/elements/FadeInAdvanced";
import { blogOneData } from "@/data/blog";

export default function BlogPage() {
    return (
        <>
            {/*Blog Page Start*/}
            <section className="blog-page">
                <div className="container">
                    <div className="row">
                        {blogOneData.map((item) => (
                            <div
                                key={item.id}
                                className="col-xl-4 col-lg-6 col-md-6"
                            >
                                <FadeInAdvanced
                                    variant={item.variant as any}
                                    delay={item.delay}
                                >
                                    <div className="blog-one__single">
                                        <div className="blog-one__img">
                                            <img src={item.image} alt="" />
                                            <div className="blog-one__tags">
                                                {item.tags.map(
                                                    (tag, index) => (
                                                        <span key={index}>
                                                            {tag}
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                        <div className="blog-one__content">
                                            <div className="blog-one__user">
                                                <div className="blog-one__user-img">
                                                    <img
                                                        src={item.userImage}
                                                        alt=""
                                                    />
                                                </div>
                                                <p className="blog-one__user-title">
                                                    {item.userName}
                                                </p>
                                            </div>
                                            <ul className="blog-one__meta list-unstyled">
                                                <li>
                                                    <Link to="/blog-details">
                                                        <span className="far fa-calendar-alt"></span>
                                                        {item.date}
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to="/blog-details">
                                                        <span className="fal fa-comments"></span>
                                                        {item.comments}
                                                    </Link>
                                                </li>
                                            </ul>
                                            <h3 className="blog-one__title">
                                                <Link to="/blog-details">
                                                    {item.title}
                                                </Link>
                                            </h3>
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
                        ))}
                        <div className="blog-list__pagination">
                            <ul className="pg-pagination list-unstyled">
                                <li className="count active">
                                    <Link to="#">1</Link>
                                </li>
                                <li className="count">
                                    <Link to="#">2</Link>
                                </li>
                                <li className="count">
                                    <Link to="#">3</Link>
                                </li>
                                <li className="next">
                                    <Link to="#" aria-label="Next">
                                        <i className="fas fa-angle-right"></i>
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
            {/*Blog Page End*/}
        </>
    );
}
