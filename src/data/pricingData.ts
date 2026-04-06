export interface PricingFeature {
    text: string;
    icon: "checked" | "plus";
}

export interface PricingPlan {
    id: string;
    title: string;
    price: string;
    description: string;
    features: PricingFeature[];
    hasUnlimitedOffer?: boolean;
}

export type PricingTabId = "monthly" | "yearly" | "packges";

export const pricingTabs: { id: PricingTabId; label: string }[] = [
    { id: "monthly", label: "Monthly" },
    { id: "yearly", label: "Yearly" },
    { id: "packges", label: "Packges" },
];

export const pricingPlans: PricingPlan[] = [
    {
        id: "personal",
        title: "PERSONAL",
        price: "$5.60",
        description: "Will get free 3 months solutions support",
        features: [
            { text: "Custom Website Design", icon: "checked" },
            { text: "website Design & Development", icon: "checked" },
            { text: "Social Media Graphics", icon: "plus" },
            { text: "Brand Color Palette", icon: "plus" },
        ],
    },
    {
        id: "premium",
        title: "Premium",
        price: "$25.60",
        description: "Will get free 5 months solutions support",
        features: [
            { text: "Custom Website Design", icon: "checked" },
            { text: "website Design & Development", icon: "checked" },
            { text: "Basic & Technical SEO", icon: "checked" },
            { text: "Social Media Graphics", icon: "plus" },
        ],
        hasUnlimitedOffer: true,
    },
    {
        id: "business",
        title: "Business",
        price: "$120.60",
        description: "Will get free lifetime solutions support",
        features: [
            { text: "Custom Website Design", icon: "checked" },
            { text: "website Design & Development", icon: "checked" },
            { text: "Social Media Graphics", icon: "plus" },
            { text: "Brand Color Palette", icon: "plus" },
        ],
    },
];
