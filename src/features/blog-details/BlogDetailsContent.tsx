import { Link } from "react-router-dom";
import FadeInAdvanced from "@/components/elements/FadeInAdvanced";
import BlogDetailsImg1 from "@/assets/images/blog/blog-details-img-1.jpg";
import BlogDetailsImgBoxImg1 from "@/assets/images/blog/blog-details-img-box-img-1.jpg";
import BlogDetailsImgBoxImg2 from "@/assets/images/blog/blog-details-img-box-img-2.jpg";
import Comment11 from "@/assets/images/blog/comment-1-1.jpg";
import Comment12 from "@/assets/images/blog/comment-1-2.jpg";
import BlogLp1 from "@/assets/images/blog/blog-lp-1.jpg";
import BlogLp2 from "@/assets/images/blog/blog-lp-2.jpg";
import BlogLp3 from "@/assets/images/blog/blog-lp-3.jpg";
import Swal from "sweetalert2";

export default function BlogDetailsContent() {

    const handleSubmitChat = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);

        // Extract form values
        const Name = formData.get("name") as string;
        const Email = formData.get("email") as string;
        const Message = formData.get("message") as string;

        // Validate all fields are filled
        if (Name && Email && Message) {
            Swal.fire({
                position: "center",
                icon: "success",
                title: "Your message sent successfully!",
                showConfirmButton: false,
                timer: 1500
            });
            form.reset();
        }
    };

    return (
        <>
            {/*Blog Details Start */}
            <section className="blog-details">
                <div className="container">
                    <div className="row">
                        <div className="col-xl-8 col-lg-7">
                            <div className="blog-details__left">
                                <div className="blog-details__img">
                                    <img src={BlogDetailsImg1} />
                                    <div className="blog-details__date">
                                        <p>
                                            12
                                            <br />
                                            Nov
                                        </p>
                                    </div>
                                </div>
                                <div className="blog-details__content">
                                    <div className="blog-details__user-and-meta">
                                        <div className="blog-details__user">
                                            <p>
                                                <span className="fas fa-user"></span>
                                                By Admin
                                            </p>
                                        </div>
                                        <ul className="blog-details__meta list-unstyled">
                                            <li>
                                                <Link to="#">
                                                    <span className="fas fa-comments"></span>
                                                    Comments (05)
                                                </Link>
                                            </li>
                                            <li>
                                                <Link to="#">
                                                    <span className="fas fa-clock"></span>
                                                    4 Min Read
                                                </Link>
                                            </li>
                                        </ul>
                                    </div>
                                    <h3 className="blog-details__title">
                                        Top IT Trends in 2025. What Businesses
                                        Need to Know
                                    </h3>
                                    <p className="blog-details__text-1">
                                        Out enigma ad minim veniam, quis nostrud
                                        exercitation ullamco laboris nisi ut
                                        aliquip ex ea commodo consequat. Duis
                                        aute inure dolor in the reprehenderit in
                                        voluptate velit esse cillum dolore eu
                                        fugiat null pariatur. Excepteur snit
                                        occaecat cupidatat non proident, sunt in
                                        culpa qui officia deserunt mollit anim
                                        id est laborum.
                                    </p>
                                    <p className="blog-details__text-2">
                                        The wise man therefore always holds in
                                        these matters to this principle of
                                        selection. He rejects pleasures to
                                        secure other greater pleasures, or else
                                        he endures pains to avoid worse pains to
                                        the selection point.
                                    </p>
                                    <div className="blog-details__author-box">
                                        <h4 className="blog-details__author-text">
                                            “Globally cultivate ubiquitous
                                            growth strategies before team
                                            building users. Dramatically
                                            transform effective internal or
                                            "organic" sources for sound
                                            e-services. Authoritatively harness
                                            performance based customer service
                                            via intermandated”
                                        </h4>
                                        <p className="blog-details__author-name">
                                            Kane Williamson<span> / CEO</span>
                                        </p>
                                    </div>
                                    <h3 className="blog-details__title-2">
                                        How to become a successful businessman
                                    </h3>
                                    <p className="blog-details__text-3">
                                        Out enigma ad minim veniam, quis nostrud
                                        exercitation ullamco laboris nisi ut
                                        aliquip ex ea commodo consequat. Duis
                                        aute inure dolor in the reprehenderit in
                                        voluptate velit esse cillum dolore eu
                                        fugiat null pariatur. Excepteur snit
                                        occaecat cupidatat non proident, sunt in
                                        culpa qui officia deserunt mollit anim
                                        id est laborum.
                                    </p>
                                    <div className="blog-details__img-box">
                                        <div className="row">
                                            <div className="col-xl-6">
                                                <div className="blog-details__img-box-img">
                                                    <img
                                                        src={
                                                            BlogDetailsImgBoxImg1
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-xl-6">
                                                <div className="blog-details__img-box-img">
                                                    <img
                                                        src={
                                                            BlogDetailsImgBoxImg2
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="blog-details__tag-and-share">
                                        <div className="blog-details__tag">
                                            <h3 className="blog-details__tag-title">
                                                Tags :
                                            </h3>
                                            <ul className="blog-details__tag-list list-unstyled">
                                                <li>
                                                    <Link to="#">Analysis</Link>
                                                </li>
                                                <li>
                                                    <Link to="#">Planning</Link>
                                                </li>
                                                <li>
                                                    <Link to="#">
                                                        Management
                                                    </Link>
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="blog-details__share-box">
                                            <h3 className="blog-details__share-title">
                                                Share :
                                            </h3>
                                            <div className="blog-details__share">
                                                <Link to="#">
                                                    <span className="icon-facebook-app-symbol"></span>
                                                </Link>
                                                <Link to="#">
                                                    <span className="icon-twitter-1"></span>
                                                </Link>
                                                <Link to="#">
                                                    <span className="icon-linkedin"></span>
                                                </Link>
                                                <Link to="#">
                                                    <span className="icon-pinterest"></span>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="comment-one">
                                        <div className="comment-one__single">
                                            <div className="comment-one__image">
                                                <img src={Comment11} />
                                            </div>
                                            <div className="comment-one__content">
                                                <h3>Theresa Webb</h3>
                                                <span>
                                                    02 June 2025 at 03:30 pm
                                                </span>
                                                <p>
                                                    The wise man therefore
                                                    always holds in these
                                                    matters to this principle of
                                                    selection. He rejects
                                                    pleasures to secure other
                                                    greater pleasures, or else
                                                    he endures pains to avoid
                                                    worse pains to the selection
                                                    point. But in certain to all
                                                    this circumstances
                                                </p>
                                                <div className="comment-one__btn-box">
                                                    <Link
                                                        to="/blog-details"
                                                        className="thm-btn"
                                                    >
                                                        Reply
                                                        <span className="fas fa-arrow-right"></span>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="comment-one__single">
                                            <div className="comment-one__image">
                                                <img src={Comment12} />
                                            </div>
                                            <div className="comment-one__content">
                                                <h3>Cameron Williamson</h3>
                                                <span>
                                                    02 June 2025 at 03:30 pm
                                                </span>
                                                <p>
                                                    The wise man therefore
                                                    always holds in these
                                                    matters to this principle of
                                                    selection. He rejects
                                                    pleasures to secure other
                                                    greater pleasures, or else
                                                    he endures pains to avoid
                                                    worse pains to the selection
                                                    point. But in certain to all
                                                    this circumstances
                                                </p>
                                                <div className="comment-one__btn-box">
                                                    <Link
                                                        to="/blog-details"
                                                        className="thm-btn"
                                                    >
                                                        Reply
                                                        <span className="fas fa-arrow-right"></span>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="comment-form">
                                        <h3 className="comment-form__title">
                                            Leave A Reply
                                        </h3>
                                        <p className="comment-form__text">
                                            By using form u agree with the
                                            message sorage, you can contact us
                                            directly now
                                        </p>
                                        <form onSubmit={handleSubmitChat} className="comment-one__form contact-form-validated">
                                            <div className="row">
                                                <div className="col-xl-6">
                                                    <div className="comment-form__input-box">
                                                        <input
                                                            type="text"
                                                            placeholder="Your Name"
                                                            name="name"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-xl-6">
                                                    <div className="comment-form__input-box">
                                                        <input
                                                            type="email"
                                                            placeholder="Your Email"
                                                            name="email"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-xl-12">
                                                    <div className="comment-form__input-box text-message-box">
                                                        <textarea
                                                            name="message"
                                                            placeholder="Write your messege"
                                                        ></textarea>
                                                    </div>
                                                    <div className="comment-form__btn-box">
                                                        <button
                                                            type="submit"
                                                            className="thm-btn comment-form__btn"
                                                        >
                                                            submit now
                                                            <span className="fas fa-arrow-right"></span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="result"></div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/*Start Sidebar*/}
                        <div className="col-xl-4 col-lg-5">
                            <div className="sidebar">
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
                                        <li>
                                            <Link to="#">
                                                IT Solution
                                                <span>(12)</span>
                                            </Link>
                                        </li>
                                        <li className="active">
                                            <Link to="#">
                                                SEO Marketing
                                                <span>(15)</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="#">
                                                Web Development
                                                <span>(08)</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="#">
                                                UI/UX Design
                                                <span>(20)</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="#">
                                                Cloud Solution
                                                <span>(14)</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="#">
                                                Products Design
                                                <span>(05)</span>
                                            </Link>
                                        </li>
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
                                        <li>
                                            <div className="sidebar__post-image">
                                                <img src={BlogLp1} />
                                            </div>
                                            <div className="sidebar__post-content">
                                                <p className="sidebar__post-date">
                                                    <span className="icon-calendar"></span>
                                                    March 18, 2025
                                                </p>
                                                <h3 className="sidebar__post-title">
                                                    <Link to="/blog-details">
                                                        Adapting to Digital
                                                        Marketing Trends:
                                                        Staying Ahead
                                                    </Link>
                                                </h3>
                                            </div>
                                        </li>
                                        <li>
                                            <div className="sidebar__post-image">
                                                <img src={BlogLp2} />
                                            </div>
                                            <div className="sidebar__post-content">
                                                <p className="sidebar__post-date">
                                                    <span className="icon-calendar"></span>
                                                    April 18, 2025
                                                </p>
                                                <h3 className="sidebar__post-title">
                                                    <Link to="/blog-details">
                                                        Standing Out in a
                                                        Competitive
                                                        Market:
                                                    </Link>
                                                </h3>
                                            </div>
                                        </li>
                                        <li>
                                            <div className="sidebar__post-image">
                                                <img src={BlogLp3} />
                                            </div>
                                            <div className="sidebar__post-content">
                                                <p className="sidebar__post-date">
                                                    <span className="icon-calendar"></span>
                                                    Jun 18, 2025
                                                </p>
                                                <h3 className="sidebar__post-title">
                                                    <Link to="/blog-details">
                                                        The Importance of
                                                        Accurate Performance
                                                        Reporting
                                                    </Link>
                                                </h3>
                                            </div>
                                        </li>
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
                                        <li>
                                            <Link to="#">Development</Link>
                                        </li>
                                        <li>
                                            <Link to="#">Start Up</Link>
                                        </li>
                                        <li>
                                            <Link to="#">Agency</Link>
                                        </li>
                                        <li>
                                            <Link to="#">Innovation</Link>
                                        </li>
                                        <li>
                                            <Link to="#">Analytics</Link>
                                        </li>
                                        <li>
                                            <Link to="#">Business</Link>
                                        </li>
                                        <li>
                                            <Link to="#">Services</Link>
                                        </li>
                                        <li>
                                            <Link to="#">Technology</Link>
                                        </li>
                                    </ul>
                                </FadeInAdvanced>
                                {/*End Sidebar Single*/}
                            </div>
                        </div>
                        {/*End Sidebar*/}
                    </div>
                </div>
            </section>
            {/*Blog Details Start*/}
        </>
    );
}
