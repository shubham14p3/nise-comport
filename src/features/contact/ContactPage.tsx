import ContactPageBgShape from "@/assets/images/shapes/contact-page-bg-shape.png";
import Swal from "sweetalert2";

export default function ContactPage() {
    const handleSubmitChat = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);

        // Extract form values
        const Name = formData.get("name") as string;
        const Email = formData.get("email") as string;
        const Phone = formData.get("phone") as string;
        const Message = formData.get("message") as string;

        // Validate all fields are filled
        if (Name && Email && Message && Phone) {
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
            {/*Contact Page Start*/}
            <section className="contact-page">
                <div className="container">
                    <div className="contact-page__inner">
                        <div
                            className="contact-page__bg-shape"
                            style={{
                                backgroundImage: `url(${ContactPageBgShape})`,
                            }}
                        ></div>
                        <div className="row">
                            <div className="col-xl-6">
                                <div className="contact-page__left">
                                    <iframe
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4562.753041141002!2d-118.80123790098536!3d34.152323469614075!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80e82469c2162619%3A0xba03efb7998eef6d!2sCostco+Wholesale!5e0!3m2!1sbn!2sbd!4v1562518641290!5m2!1sbn!2sbd"
                                        className="google-map__one"
                                    ></iframe>
                                </div>
                            </div>
                            <div className="col-xl-6">
                                <div className="contact-page__right">
                                    <h3 className="contact-page__form-title">
                                        Get A Free Quote
                                    </h3>
                                    <form onSubmit={handleSubmitChat}
                                        id="contact-form"
                                        className="contact-form-validated contact-page__form"
                                    >
                                        <div className="row">
                                            <div className="col-xl-6 col-lg-6 col-md-6">
                                                <div className="contact-page__input-box">
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        placeholder="Your name"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-xl-6 col-lg-6 col-md-6">
                                                <div className="contact-page__input-box">
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        placeholder="Your Email"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-xl-6 col-lg-6 col-md-6">
                                                <div className="contact-page__input-box">
                                                    <input
                                                        type="text"
                                                        placeholder="Mobile"
                                                        name="phone"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-xl-6 col-lg-6 col-md-6">
                                                <div className="contact-page__input-box">
                                                    <input
                                                        type="text"
                                                        placeholder="Subject"
                                                        name="subject"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-xl-12">
                                                <div className="contact-page__input-box text-message-box">
                                                    <textarea
                                                        name="message"
                                                        placeholder="Messege"
                                                    ></textarea>
                                                </div>
                                                <div className="contact-page__btn-box">
                                                    <button
                                                        type="submit"
                                                        className="thm-btn contact-page__btn"
                                                        data-loading-text="Please wait..."
                                                    >
                                                        Send A Message
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
                </div>
            </section>
            {/*Contact Page End*/}
        </>
    );
}
