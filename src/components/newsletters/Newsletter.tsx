import Swal from "sweetalert2";

export default function Newsletter() {
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
            <section className="newsletter-one">
                <div className="container">
                    <div className="newsletter-one__inner">
                        <div className="newsletter-one__left">
                            <h2 className="newsletter-one__title">
                                Subcribe to Our Newsletter
                            </h2>
                            <p className="newsletter-one__text">
                                Get the latest SEO tips and software insights
                                straight to your inbox.
                            </p>
                        </div>
                        <div className="newsletter-one__right">
                            <form  onSubmit={handleSubmitChat} className="newsletter-one__form">
                                <div className="newsletter-one__input">
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Enter email address"
                                    />
                                </div>
                                <button type="submit" className="thm-btn">
                                    Subscribe Now
                                    <span className="fas fa-arrow-right"></span>
                                </button>
                                <div className="checked-box">
                                    <input
                                        type="checkbox"
                                        name="skipper1"
                                        id="skipper"
                                    />
                                    <label htmlFor="skipper">
                                        <span></span>by Subscribing. Your Accept
                                        Privacy policy
                                    </label>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                <div id="particles-js-two"></div>
            </section>
            {/* Newsletter One End */}
        </>
    );
}
