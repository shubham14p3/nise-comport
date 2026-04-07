import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { testimonialsData } from "@/data/testimonials";

const ITEMS_PER_PAGE = 9;

export default function TestimonialPage() {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(testimonialsData.length / ITEMS_PER_PAGE);

    const currentTestimonials = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return testimonialsData.slice(startIndex, endIndex);
    }, [currentPage]);

    const goToPage = (pageNumber: number) => {
        if (pageNumber < 1 || pageNumber > totalPages) return;
        setCurrentPage(pageNumber);
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const getInitial = (name: string) => {
        return name?.trim()?.charAt(0)?.toUpperCase() || "U";
    };

    return (
        <>
            <section className="testimonial-page">
                <div className="container">
                    <div className="row">
                        {currentTestimonials.map((testimonial) => (
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
                                            {testimonial.image ? (
                                                <img
                                                    src={testimonial.image}
                                                    alt={testimonial.name}
                                                />
                                            ) : (
                                                <div className="testimonial-one__client-placeholder">
                                                    {getInitial(testimonial.name)}
                                                </div>
                                            )}
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

                    {totalPages > 1 && (
                        <div className="testimonial-pagination">
                            <button
                                type="button"
                                className="testimonial-pagination__btn testimonial-pagination__nav"
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Prev
                            </button>

                            <div className="testimonial-pagination__pages">
                                {Array.from({ length: totalPages }, (_, index) => {
                                    const pageNumber = index + 1;

                                    return (
                                        <button
                                            key={pageNumber}
                                            type="button"
                                            className={`testimonial-pagination__btn ${
                                                currentPage === pageNumber
                                                    ? "is-active"
                                                    : ""
                                            }`}
                                            onClick={() => goToPage(pageNumber)}
                                        >
                                            {pageNumber}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                type="button"
                                className="testimonial-pagination__btn testimonial-pagination__nav"
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}