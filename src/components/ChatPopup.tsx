import React, { useState } from "react";
import Swal from "sweetalert2";

export default function ChatPopup() {
    const [showChat, setShowChat] = useState<boolean>(false);

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
                timer: 1500,
            });
            form.reset();
            setShowChat(false);
        }
    };

    return (
        <>
            <div className="chat-icon">
                <button type="button" onClick={() => setShowChat(true)}>
                    <i className="fa fa-comment"></i>
                </button>
            </div>
            {/*Chat Popup*/}
            <div
                id="chat-popup"
                className={`chat-popup ${showChat ? "popup-visible" : ""}`}
            >
                <div className="popup-inner">
                    <div
                        className="close-chat"
                        onClick={() => setShowChat(false)}
                    >
                        <i className="fa fa-times"></i>
                    </div>
                    <div className="chat-form">
                        <p>
                            Please fill out the form below and we will get back
                            to you as soon as possible.
                        </p>
                        <form onSubmit={handleSubmitChat}>
                            <div className="form-group">
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Your Name"
                                    required={true}
                                />
                            </div>
                            <div className="form-group">
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Your Email"
                                    required={true}
                                />
                            </div>
                            <div className="form-group">
                                <textarea
                                    name="message"
                                    placeholder="Your Text"
                                    required={true}
                                ></textarea>
                            </div>
                            <div className="form-group message-btn">
                                <button type="submit" className="thm-btn">
                                    
                                    Submit Now
                                    <span className="fas fa-arrow-right"></span>
                                </button>
                            </div>
                            <div className="result"></div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
