import { useState } from "react";
import CounterUp from "@/components/elements/CounterUp";
import TextAnimation from "@/components/elements/TextAnimation";
import FadeInAdvanced from "@/components/elements/FadeInAdvanced";
import { faqAccordions } from "@/data/faqData";
import FaqOneShape2 from "@/assets/images/shapes/faq-one-shape-2.png";
import FaqOneShape3 from "@/assets/images/shapes/faq-one-shape-3.png";
import FaqOneShape1 from "@/assets/images/shapes/faq-one-shape-1.png";
import FaqOneImg1 from "@/assets/images/resources/faq-one-img-1.jpg";
import FaqOneImg2 from "@/assets/images/resources/faq-one-img-2.jpg";

export default function FaqOne() {
    const [openId, setOpenId] = useState<string>("Two");

    return (
        <>
            {/* FAQ One Start */}
            <section className="faq-one">
                <div className="faq-one__shape-2 float-bob-y">
                    <img src={FaqOneShape2} />
                </div>
                <div className="faq-one__shape-3 float-bob">
                    <img src={FaqOneShape3} />
                </div>
                <div className="container">
                    <div className="row">
                        <div className="col-xl-6">
                            <div className="faq-one__left">
                                <div className="section-title text-left sec-title-animation animation-style2">
                                    <div className="section-title__tagline-box">
                                        <span className="section-title__tagline">
                                            Frequently Ask Question
                                        </span>
                                    </div>
                                    <h2 className="section-title__title">
                                        <TextAnimation style="s2">
                                            Have Questions in
                                            <span>Your Mind?</span> Get the
                                            Answers Now
                                        </TextAnimation>
                                    </h2>
                                </div>
                                <div
                                    className="accrodion-grp faq-one-accrodion"
                                    data-grp-name="faq-one-accrodion"
                                >
                                    {faqAccordions.map((item) => (
                                        <div
                                            key={item.id}
                                            className={`accrodion ${openId === item.id ? "active" : ""}`}
                                        >
                                            <div
                                                className="accrodion-title"
                                                onClick={() =>
                                                    setOpenId(
                                                        openId === item.id
                                                            ? ""
                                                            : item.id
                                                    )
                                                }
                                            >
                                                <h4>{item.question}</h4>
                                            </div>
                                            {openId === item.id && (
                                                <div className="accrodion-content">
                                                    <div className="inner">
                                                        <p>{item.answer}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-6">
                            <div className="faq-one__right">
                                <FadeInAdvanced
                                    variant={"slideInRight"}
                                    delay={100}
                                    duration={2500}
                                >
                                    <div className="faq-one__img-box">
                                        <div className="faq-one__shape-1 float-bob-y">
                                            <img src={FaqOneShape1} />
                                        </div>
                                        <div className="faq-one__experience-box">
                                            <div className="faq-one__experience-year">
                                                <h2>
                                                    <CounterUp ending={55} />
                                                </h2>
                                            </div>
                                            <p className="faq-one__experience-text">
                                                Year of <br /> experience
                                            </p>
                                        </div>
                                        <div className="faq-one__img">
                                            <img src={FaqOneImg1} />
                                        </div>
                                        <div className="faq-one__img-2">
                                            <img src={FaqOneImg2} />
                                        </div>
                                    </div>
                                </FadeInAdvanced>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* FAQ One End */}
        </>
    );
}
