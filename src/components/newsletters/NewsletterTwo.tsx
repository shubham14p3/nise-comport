import NewsletterTwoImg1 from "@/assets/images/resources/newsletter-two-img-1.png";
import NewsletterTwoShape1 from "@/assets/images/shapes/newsletter-two-shape-1.png";
import Swal from "sweetalert2";
export default function NewsletterTwo() {
    const handleSubmitChat = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);

        // Extract form values
        const Email = formData.get("email") as string;

        // Validate all fields are filled
        if (Email) {
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
            {/* Newsletter One Start */}
            <section className="newsletter-two">
                <div className="container">
                    <div className="newsletter-two__inner">
                        <div
                            className="newsletter-two__shape-1"
                            style={{
                                backgroundImage: `url(${NewsletterTwoShape1})`,
                            }}
                        ></div>
                        <div className="newsletter-two__img-1">
                            <img src={NewsletterTwoImg1} />
                        </div>
                        <div className="newsletter-two__left">
                            <h2 className="newsletter-two__title">
                                Subcribe to Our Newsletter
                            </h2>
                            <p className="newsletter-two__text">
                                Get the latest SEO tips and software insights
                                straight to your inbox.
                            </p>
                        </div>
                        <div className="newsletter-two__right">
                            <form onSubmit={handleSubmitChat} className="contact-form-validated newsletter-two__form">
                                <div className="newsletter-two__input">
                                    <input
                                        type="email"
                                        placeholder="Enter email address"
                                        name="email"
                                        required={true}
                                    />
                                </div>
                                <button type="submit" className="thm-btn">
                                    Subscribe Now
                                    <span className="fas fa-arrow-right"></span>
                                </button>
                                <div className="result"></div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
            {/* Newsletter One End */}
        </>
    );
}
