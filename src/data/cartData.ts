import CartPageImg1 from "@/assets/images/shop/cart-page-img-1.jpg";
import CartPageImg2 from "@/assets/images/shop/cart-page-img-2.jpg";
import CartPageImg3 from "@/assets/images/shop/cart-page-img-3.jpg";
import CartPageImg4 from "@/assets/images/shop/cart-page-img-4.jpg";

export interface CartItem {
    id: number;
    title: string;
    link: string;
    image: string;
    price: number;
    quantity: number;
}

export const cartItems: CartItem[] = [
    { id: 1, title: "Gree Air Conditioner", link: "/product-details", image: CartPageImg1, price: 10.99, quantity: 1 },
    { id: 2, title: "Pliers | Cutting, Gripping", link: "/product-details", image: CartPageImg2, price: 10.99, quantity: 1 },
    { id: 3, title: "Gear and wrench", link: "/product-details", image: CartPageImg3, price: 10.99, quantity: 1 },
    { id: 4, title: "Nut Driver", link: "/product-details", image: CartPageImg4, price: 10.99, quantity: 1 },
];
