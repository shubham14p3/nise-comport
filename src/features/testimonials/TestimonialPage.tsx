import { Link } from "react-router-dom";
import { testimonialsData } from "@/data/testimonials";

export default function TestimonialPage() {
    return (
        <>
            {/*Testimonial Page Start*/}
            <section className="testimonial-page">
                <div className="container">
                    <div className="row">
                        {testimonialsData.map((testimonial) => (
                            <div
                                key={testimonial.id}
                                className="col-xl-4 col-lg-6 col-md-6"
                            >
                                <div className="testimonial-one__single">
                                    <div className="testimonial-one__single-inner">
                                        <div className="testimonial-one__single-shape-1"></div>
                                        <div className="testimonial-one__star">
                                            {[...Array(5)].map((_, index) => (
                                                <span
                                                    key={index}
                                                    className={
                                                        index < testimonial.rating
                                                            ? "icon-star-1"
                                                            : "icon-star"
                                                    }
                                                ></span>
                                            ))}
                                        </div>
                                        <p className="testimonial-one__text">
                                            {testimonial.text}
                                        </p>
                                    </div>
                                    <div className="testimonial-one__client-info">
                                        <div className="testimonial-one__client-img">
                                            <img
                                                src={testimonial.image}
                                                alt={testimonial.name}
                                            />
                                        </div>
                                        <div className="testimonial-one__client-content">
                                            <h4 className="testimonial-one__client-name">
                                                <Link to="#">
                                                    {testimonial.name}
                                                </Link>
                                            </h4>
                                            <p className="testimonial-one__sub-title">
                                                {testimonial.designation}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="testimonial-one__quote">
                                        <span className="fal fa-quote-right"></span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            {/*Testimonial Page End*/}
        </>
    );
}
