import { Link } from "react-router-dom";
import FadeInAdvanced from "@/components/elements/FadeInAdvanced";
import { blogListContentData, sidebarWidgetsData } from "@/data/blog";

export default function BlogList() {
    return (
        <>
            {/*Blog List Start */}
            <section className="blog-list">
                <div className="container">
                    <div className="row">
                        <div className="col-xl-8 col-lg-7">
                            <div className="blog-list__left">
                                {blogListContentData.map((item) => (
                                    <div
                                        key={item.id}
                                        className="blog-list__single"
                                    >
                                        <div className="blog-list__img">
                                            <img src={item.image} alt="" />
                                            <div className="blog-list__tags">
                                                {item.tags.map((tag, index) => (
                                                    <span key={index}>
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="blog-list__content">
                                            <div className="blog-list__user">
                                                <div className="blog-list__user-img">
                                                    <img
                                                        src={item.userImage}
                                                        alt=""
                                                    />
                                                </div>
                                                <p className="blog-list__user-title">
                                                    {item.userName}
                                                </p>
                                            </div>
                                            <ul className="blog-list__meta list-unstyled">
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
                                            <h3 className="blog-list__title">
                                                <Link to="/blog-details">
                                                    {item.title}
                                                </Link>
                                            </h3>
                                            <p className="blog-list__text">
                                                {item.text}
                                            </p>
                                            <div className="blog-list__btn-box">
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

                        {/*Start Sidebar*/}
                        <div className="col-xl-4 col-lg-5">
                            <div className="sidebar">
                                {/*Start Sidebar Single*/}
                                <FadeInAdvanced
                                    variant={"fadeInUp"}
                                    delay={100}
                                    className="sidebar__single sidebar__search"
                                >
                                    <form className="sidebar__search-form">
                                        <input
                                            type="search"
                                            placeholder="Search..."
                                        />
                                        <button type="submit">
                                            <i className="fa fa-search"></i>
                                        </button>
                                    </form>
                                </FadeInAdvanced>
                                {/*End Sidebar Single*/}

                                {/*Start Sidebar Single*/}
                                <FadeInAdvanced
                                    variant={"fadeInUp"}
                                    className="sidebar__single sidebar__category"
                                    delay={100}
                                >
                                    <h3 className="sidebar__title">
                                        Categories
                                    </h3>
                                    <ul className="sidebar__category-list list-unstyled">
                                        {sidebarWidgetsData.categories.map(
                                            (category, index) => (
                                                <li
                                                    key={index}
                                                    className={
                                                        category.active
                                                            ? "active"
                                                            : ""
                                                    }
                                                >
                                                    <Link to="#">
                                                        {category.name}
                                                        <span>
                                                            ({category.count})
                                                        </span>
                                                    </Link>
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </FadeInAdvanced>
                                {/*End Sidebar Single*/}

                                {/*Start Sidebar Single*/}
                                <FadeInAdvanced
                                    variant={"fadeInUp"}
                                    delay={100} className="sidebar__single sidebar__post"
                                >
                                    <h3 className="sidebar__title">
                                        Recent Post
                                    </h3>
                                    <ul className="sidebar__post-list list-unstyled">
                                        {sidebarWidgetsData.recentPosts.map(
                                            (post, index) => (
                                                <li key={index}>
                                                    <div className="sidebar__post-image">
                                                        <img
                                                            src={post.image}
                                                            alt=""
                                                        />
                                                    </div>
                                                    <div className="sidebar__post-content">
                                                        <p className="sidebar__post-date">
                                                            <span className="icon-calendar"></span>
                                                            {post.date}
                                                        </p>
                                                        <h3 className="sidebar__post-title">
                                                            <Link to="/blog-details">
                                                                {post.title}
                                                            </Link>
                                                        </h3>
                                                    </div>
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </FadeInAdvanced>
                                {/*End Sidebar Single*/}

                                {/*Start Sidebar Single*/}
                                <FadeInAdvanced
                                    variant={"fadeInUp"}
                                    delay={100} className="sidebar__single sidebar__tags"
                                >
                                    <h3 className="sidebar__title">
                                        Tags Cloud
                                    </h3>
                                    <ul className="sidebar__tags-list clearfix list-unstyled">
                                        {sidebarWidgetsData.tags.map(
                                            (tag, index) => (
                                                <li key={index}>
                                                    <Link to="#">{tag}</Link>
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </FadeInAdvanced>
                                {/*End Sidebar Single*/}
                            </div>
                        </div>
                        {/*End Sidebar*/}
                    </div>
                </div>
            </section>
            {/*Blog List End*/}
        </>
    );
}
