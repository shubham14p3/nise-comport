import ShopProduct11 from "@/assets/images/shop/shop-product-1-1.jpg";
import ShopProduct12 from "@/assets/images/shop/shop-product-1-2.jpg";
import ShopProduct13 from "@/assets/images/shop/shop-product-1-3.jpg";
import ShopProduct14 from "@/assets/images/shop/shop-product-1-4.jpg";
import ShopProduct15 from "@/assets/images/shop/shop-product-1-5.jpg";
import ShopProduct16 from "@/assets/images/shop/shop-product-1-6.jpg";
import ShopProduct17 from "@/assets/images/shop/shop-product-1-7.jpg";
import ShopProduct18 from "@/assets/images/shop/shop-product-1-8.jpg";
import ShopProduct19 from "@/assets/images/shop/shop-product-1-9.jpg";
import ShopProduct110 from "@/assets/images/shop/shop-product-1-10.jpg";
import ShopProduct111 from "@/assets/images/shop/shop-product-1-11.jpg";
import ShopProduct112 from "@/assets/images/shop/shop-product-1-12.jpg";
import ShopProduct21 from "@/assets/images/shop/shop-product-2-1.jpg";
import ShopProduct22 from "@/assets/images/shop/shop-product-2-2.jpg";
import ShopProduct23 from "@/assets/images/shop/shop-product-2-3.jpg";
import ShopProduct24 from "@/assets/images/shop/shop-product-2-4.jpg";
import ShopProduct25 from "@/assets/images/shop/shop-product-2-5.jpg";
import ShopProduct26 from "@/assets/images/shop/shop-product-2-6.jpg";
import ShopProduct27 from "@/assets/images/shop/shop-product-2-7.jpg";
import ShopProduct28 from "@/assets/images/shop/shop-product-2-8.jpg";
import ShopProduct29 from "@/assets/images/shop/shop-product-2-9.jpg";
import ShopProduct210 from "@/assets/images/shop/shop-product-2-10.jpg";
import ShopProduct211 from "@/assets/images/shop/shop-product-2-11.jpg";
import ShopProduct212 from "@/assets/images/shop/shop-product-2-12.jpg";
import ProductThumb1 from "@/assets/images/shop/product-thumb-1.jpg";
import ProductThumb2 from "@/assets/images/shop/product-thumb-2.jpg";
import ProductThumb3 from "@/assets/images/shop/product-thumb-3.jpg";
import ProductThumb4 from "@/assets/images/shop/product-thumb-4.jpg";

export interface Badge {
    text: string;
    type: "new" | "off";
}

export interface ShopProduct {
    id: number;
    gridImage: string;
    gridImageHover: string;
    listImage: string;
    listImageHover: string;
    title: string;
    link: string;
    price: string;
    oldPrice?: string;
    rating: string;
    badges?: Badge[];
}

export interface RecentProduct {
    image: string;
    title: string;
    price: string;
    link: string;
}

export interface Category {
    name: string;
    link: string;
    active?: boolean;
}

export const shopProductsData: ShopProduct[] = [
    {
        id: 1,
        gridImage: ShopProduct11,
        gridImageHover: ShopProduct11,
        listImage: ShopProduct21,
        listImageHover: ShopProduct21,
        title: "Gree Air Conditioner",
        link: "/product-details",
        price: "$33.00",
        rating: "4.9",
        badges: [{ text: "New", type: "new" }],
    },
    {
        id: 2,
        gridImage: ShopProduct12,
        gridImageHover: ShopProduct12,
        listImage: ShopProduct22,
        listImageHover: ShopProduct22,
        title: "Pliers | Cutting, Gripping",
        link: "/product-details",
        price: "$50.00",
        rating: "5.0",
    },
    {
        id: 3,
        gridImage: ShopProduct13,
        gridImageHover: ShopProduct13,
        listImage: ShopProduct23,
        listImageHover: ShopProduct23,
        title: "Gear and wrench",
        link: "/product-details",
        price: "$28.00",
        oldPrice: "$33.00",
        rating: "4.5",
        badges: [{ text: "5% Off", type: "off" }],
    },
    {
        id: 4,
        gridImage: ShopProduct14,
        gridImageHover: ShopProduct14,
        listImage: ShopProduct24,
        listImageHover: ShopProduct24,
        title: "Nut Driver",
        link: "/product-details",
        price: "$40.00",
        rating: "4.8",
    },
    {
        id: 5,
        gridImage: ShopProduct15,
        gridImageHover: ShopProduct15,
        listImage: ShopProduct25,
        listImageHover: ShopProduct25,
        title: "Screwdriver and wrench",
        link: "/product-details",
        price: "$20.00",
        oldPrice: "$25.00",
        rating: "4.9",
        badges: [{ text: "5% Off", type: "off" }],
    },
    {
        id: 6,
        gridImage: ShopProduct16,
        gridImageHover: ShopProduct16,
        listImage: ShopProduct26,
        listImageHover: ShopProduct26,
        title: "Monitor Cable",
        link: "/product-details",
        price: "$35.00",
        rating: "4.7",
    },
    {
        id: 7,
        gridImage: ShopProduct17,
        gridImageHover: ShopProduct17,
        listImage: ShopProduct27,
        listImageHover: ShopProduct27,
        title: "Fiber Optical Cable",
        link: "/product-details",
        price: "$27.00",
        rating: "4.6",
        badges: [{ text: "New", type: "new" }],
    },
    {
        id: 8,
        gridImage: ShopProduct18,
        gridImageHover: ShopProduct18,
        listImage: ShopProduct28,
        listImageHover: ShopProduct28,
        title: "Electrical Wire",
        link: "/product-details",
        price: "$44.00",
        rating: "5.0",
    },
    {
        id: 9,
        gridImage: ShopProduct19,
        gridImageHover: ShopProduct19,
        listImage: ShopProduct29,
        listImageHover: ShopProduct29,
        title: "Computer power supply",
        link: "/product-details",
        price: "$52.00",
        oldPrice: "$49.00",
        rating: "4.9",
        badges: [{ text: "3% Off", type: "off" }],
    },
    {
        id: 10,
        gridImage: ShopProduct110,
        gridImageHover: ShopProduct110,
        listImage: ShopProduct210,
        listImageHover: ShopProduct210,
        title: "Fite ON AC_DC Adapter",
        link: "/product-details",
        price: "$25.00",
        rating: "4.7",
    },
    {
        id: 11,
        gridImage: ShopProduct111,
        gridImageHover: ShopProduct111,
        listImage: ShopProduct211,
        listImageHover: ShopProduct211,
        title: "Wireless Mouse Keyboard",
        link: "/product-details",
        price: "$43.00",
        oldPrice: "$36.00",
        rating: "4.9",
        badges: [
            { text: "New", type: "new" },
            { text: "7% Off", type: "off" },
        ],
    },
    {
        id: 12,
        gridImage: ShopProduct112,
        gridImageHover: ShopProduct112,
        listImage: ShopProduct212,
        listImageHover: ShopProduct212,
        title: "Gaming Headset",
        link: "/product-details",
        price: "$28.00",
        rating: "4.6",
    },
];

export const recentProductsData: RecentProduct[] = [
    {
        image: ProductThumb1,
        title: "Gree Air Conditioner",
        price: "$33.00",
        link: "#",
    },
    {
        image: ProductThumb2,
        title: "Pliers | Cutting, Gripping",
        price: "$39.00",
        link: "#",
    },
    {
        image: ProductThumb3,
        title: "Gear and wrench",
        price: "$54.00",
        link: "#",
    },
    {
        image: ProductThumb4,
        title: "Nut Driver",
        price: "$44.00",
        link: "#",
    },
];

export const categoriesData: Category[] = [
    { name: "PC Repair", link: "#" },
    { name: "Phone Repair", link: "#", active: true },
    { name: "A/C Installation", link: "#" },
    { name: "Electrical Wire", link: "#" },
    { name: "Laptop Repair", link: "#" },
];

export const productTagsData: string[] = [
    "Repair",
    "Technology",
    "Business",
    "Virus",
    "Desktop",
    "Laptop",
];
