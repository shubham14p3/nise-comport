import React, { Fragment } from "react";
import { useForm } from "react-hook-form";

const ContactForm = () => {
    const { register, errors } = useForm({
        mode: "onBlur",
    });
    return (
        <Fragment>
            <form
                id="contactForm"
                className="row"
                action="https://getform.io/f/646c8e11-c2c3-4c06-8caf-c32138cbb0c8"
                method="POST"
            >
                <div className="col-12 col-sm-6 mb-7">
                    <input
                        type="text"
                        name="name"
                        placeholder="Your Name*"
                        id="name"
                        className="form-control"
                        required
                    />
                </div>
                <div className="col-12 col-sm-6 mb-7">
                    <input
                        type="text"
                        className="form-control"
                        id="email"
                        name="email"
                        placeholder="Your Email*"
                        required
                    />
                </div>
                <div className="col-12 mb-9">
                    <input
                        type="text"
                        className="form-control"
                        id="Mobile"
                        name="Mobile"
                        placeholder="Your Mobile Number*"
                        required
                    />
                </div>

                <div className="col-12 mb-9">
                    <textarea
                        className="form-control massage-control"
                        name="message"
                        id="massage"
                        cols="30"
                        rows="10"
                        placeholder="Message"
                        required
                    ></textarea>
                </div>
                <div className="col-12">
                    <button
                        id="contactSubmit"
                        type="submit"
                        className="btn btn-dark btn-hover-dark"
                        data-complete-text="Well Done!"
                    >
                        Send Message
                    </button>
                </div>
            </form>
        </Fragment>
    );
};

export default ContactForm;
