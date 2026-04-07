import { useState } from "react";
import { tcdAccordions, tcdAccordions2 } from "@/data/termConditionData";

export default function TermAndConditionInfo() {
    const [openId, setOpenId] = useState<string>("One");

    const renderAccordion = (items: typeof tcdAccordions) => {
        return items.map((item) => (
            <div
                key={item.id}
                className={`accrodion ${openId === item.id ? "active" : ""}`}
            >
                <div
                    className="accrodion-title"
                    onClick={() =>
                        setOpenId(openId === item.id ? "" : item.id)
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
        ));
    };

    return (
        <>
            {/* FAQ Page Start */}
            <section className="faq-page">
                <div className="container">
                    <div className="row">
                        <div className="col-xl-6">
                            <div className="faq-page__single">
                                <div className="faq-one__left">
                                    <div
                                        className="accrodion-grp faq-one-accrodion"
                                        data-grp-name="faq-one-accrodion"
                                    >
                                        {renderAccordion(tcdAccordions)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-6">
                            <div className="faq-page__single">
                                <div className="faq-one__left">
                                    <div
                                        className="accrodion-grp faq-one-accrodion"
                                        data-grp-name="faq-one-accrodion"
                                    >
                                        {renderAccordion(tcdAccordions2)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* FAQ Page End */}
        </>
    );
}
