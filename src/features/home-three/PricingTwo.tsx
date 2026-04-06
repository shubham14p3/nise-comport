import { useState } from "react";
import { Link } from "react-router-dom";
import TextAnimation from "@/components/elements/TextAnimation";
import PricingTwoShape2 from "@/assets/images/shapes/pricing-two-shape-2.png";
import PricingTwoShape3 from "@/assets/images/shapes/pricing-two-shape-3.png";
import PricingTwoBgShape from "@/assets/images/shapes/pricing-two-bg-shape.png";
import PricingTwoShape1 from "@/assets/images/shapes/pricing-two-shape-1.png";
import {
    pricingTabs,
    pricingPlans,
    type PricingTabId,
} from "@/data/pricingData";

function PricingCard({
    plan,
}: {
    plan: (typeof pricingPlans)[number];
}) {
    return (
        <div className="col-xl-4 col-lg-4">
            <div className="pricing-two__single">
                <div
                    className="pricing-two__shape-1"
                    style={{
                        backgroundImage: `url(${PricingTwoShape1})`,
                    }}
                />
                <span className="pricing-two__sub-title">{plan.title}</span>
                <h2 className="pricing-two__price">{plan.price}</h2>
                <p className="pricing-two__text">{plan.description}</p>
                <div className="pricing-two__btn-box">
                    <Link to="/pricing" className="thm-btn">
                        Choose Plan
                        <span className="fas fa-arrow-right" />
                    </Link>
                </div>
                <h5 className="pricing-two__points-title">Feature Description</h5>
                <ul className="pricing-two__points list-unstyled">
                    {plan.features.map((feature, idx) => (
                        <li key={idx}>
                            <div className="icon">
                                <span
                                    className={
                                        feature.icon === "checked"
                                            ? "icon-checked"
                                            : "far fa-plus-circle"
                                    }
                                />
                            </div>
                            <p>{feature.text}</p>
                        </li>
                    ))}
                </ul>
                {plan.hasUnlimitedOffer && (
                    <p className="pricing-two__unlimited-offer">
                        ⚡ Unlimited Offer
                    </p>
                )}
            </div>
        </div>
    );
}

export default function PricingTwo() {
    const [activeTab, setActiveTab] =
        useState<PricingTabId>("yearly");

    const handleTabChange = (tab: PricingTabId) => {
        setActiveTab(tab);
    };

    return (
        <>
            {/* Pricing Two Start */}
            <section className="pricing-two">
                <div
                    className="pricing-two__bg-shape"
                    style={{ backgroundImage: `url(${PricingTwoBgShape})` }}
                />
                <div className="pricing-two__shape-2 img-bounce">
                    <img src={PricingTwoShape2} alt="" />
                </div>
                <div className="pricing-two__shape-3 float-bob-y">
                    <img src={PricingTwoShape3} alt="" />
                </div>
                <div className="container">
                    <div className="section-title text-center sec-title-animation animation-style1">
                        <div className="section-title__tagline-box">
                            <span className="section-title__tagline">
                                Pricing & Plan
                            </span>
                        </div>
                        <h2 className="section-title__title">
                            <TextAnimation style="s1">
                                Select the Perfect
                                <span>Plan for Your</span> <br />
                                Needs That Fits You
                            </TextAnimation>
                        </h2>
                    </div>
                    <div className="pricing-two__main-tab-box tabs-box">
                        <ul className="tab-buttons list-unstyled">
                            {pricingTabs.map((tab) => (
                                <li
                                    key={tab.id}
                                    className={`tab-btn ${
                                        activeTab === tab.id ? "active-btn" : ""
                                    }`}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => handleTabChange(tab.id)}
                                    onKeyDown={(e) =>
                                        e.key === "Enter" &&
                                        handleTabChange(tab.id)
                                    }
                                >
                                    <span>{tab.label}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="tabs-content">
                            {pricingTabs.map((tab) => (
                                <div
                                    key={tab.id}
                                    className={`tab ${
                                        activeTab === tab.id ? "active-tab" : ""
                                    }`}
                                    id={tab.id}
                                    role="tabpanel"
                                >
                                    <div className="pricing-two__inner">
                                        <div className="row">
                                            {pricingPlans.map((plan) => (
                                                <PricingCard
                                                    key={plan.id}
                                                    plan={plan}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
            {/* Pricing Two End */}
        </>
    );
}
