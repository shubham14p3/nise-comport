import { Link } from "react-router-dom";
import FadeInAdvanced from "@/components/elements/FadeInAdvanced";
import { blogSidebarContentData, sidebarWidgetsData } from "@/data/blog";

export default function BlogLeftSidebarContent() {
    return (
        <>
            {/*Blog Left Sidebar Start */}
            <section className="blog-left-sidebar">
                <div className="container">
                    <div className="row">
                        {/*Start Sidebar*/}
                        <div className="col-xl-4">
                            <div className="sidebar sidebar--two">
                                {/*Start Sidebar Single*/}
                                <FadeInAdvanced
                                    variant={"fadeInUp"}
                                    delay={100} className="sidebar__single sidebar__search"
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
                                    delay={100} className="sidebar__single sidebar__category"
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
                        <div className="col-xl-8">
                            <div className="row">
                                {blogSidebarContentData.map((item) => (
                                    <div
                                        key={item.id}
                                        className="col-xl-6 col-lg-6"
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
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/*Blog Left Sidebar End*/}
        </>
    );
}
