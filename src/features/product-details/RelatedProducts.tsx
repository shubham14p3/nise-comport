import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import ShopProduct11 from "@/assets/images/shop/shop-product-1-1.jpg";
import ShopProduct12 from "@/assets/images/shop/shop-product-1-2.jpg";
import ShopProduct13 from "@/assets/images/shop/shop-product-1-3.jpg";
import ShopProduct14 from "@/assets/images/shop/shop-product-1-4.jpg";

const relatedProducts = [
    {
        id: 1,
        image: ShopProduct11,
        title: "Gree Air Conditioner",
        price: "$33.00",
        originalPrice: null,
        rating: "4.9",
        badge: "New",
    },
    {
        id: 2,
        image: ShopProduct12,
        title: "Pliers | Cutting, Gripping",
        price: "$50.00",
        originalPrice: null,
        rating: "5.0",
        badge: null,
    },
    {
        id: 3,
        image: ShopProduct13,
        title: "Gear and wrench",
        price: "$28.00",
        originalPrice: "$33.00",
        rating: "4.5",
        badge: "5% Off",
    },
    {
        id: 4,
        image: ShopProduct14,
        title: "Nut Driver",
        price: "$40.00",
        originalPrice: null,
        rating: "4.8",
        badge: null,
    },
    {
        id: 5,
        image: ShopProduct13,
        title: "Gree Air Conditioner",
        price: "$33.00",
        originalPrice: null,
        rating: "4.9",
        badge: "New",
    },
];

export default function RelatedProducts() {
    return (
        <>
            {/* Start Related Products */}
            <section className="related-products">
                <div className="container">
                    <div className="related-products__title">
                        <h3>Related Products</h3>
                        <p>
                            Interdum et malesuada fames ac ante ipsum primis in
                            faucibus.
                        </p>
                    </div>
                    <div className="row">
                        <Swiper
                            modules={[Autoplay]}
                            spaceBetween={30}
                            loop={true}
                            speed={500}
                            autoplay={{
                                delay: 2000,
                                disableOnInteraction: false,
                            }}
                            breakpoints={{
                                0: { slidesPerView: 1 },
                                768: { slidesPerView: 2 },
                                992: { slidesPerView: 3 },
                                1200: { slidesPerView: 3 },
                                1320: { slidesPerView: 4 },
                            }}
                            className="related-products__carousel owl-theme owl-dot-style1"
                        >
                            {relatedProducts.map((product) => (
                                <SwiperSlide key={product.id}>
                                    <div className="single-product-style1 instyle--2">
                                        <div className="single-product-style1__img">
                                            <img src={product.image} alt={product.title} />
                                            <img src={product.image} alt={product.title} />
                                            {product.badge && (
                                                <ul className="single-product-style1__overlay">
                                                    <li><p>{product.badge}</p></li>
                                                </ul>
                                            )}
                                            <ul className="single-product-style1__info">
                                                <li>
                                                    <Link to="#" title="Add to Wishlist">
                                                        <i className="fa fa-regular fa-heart"></i>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to="#" title="Add to cart">
                                                        <i className="fa fa-solid fa-cart-plus"></i>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to="#" title="Quick View">
                                                        <i className="fa fa-regular fa-eye"></i>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to="#" title="Compare">
                                                        <i className="fa fa-solid fa-repeat"></i>
                                                    </Link>
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="single-product-style1__content">
                                            <div className="single-product-style1__content-left">
                                                <h4>
                                                    <Link to="/product-details">{product.title}</Link>
                                                </h4>
                                                <p>
                                                    {product.originalPrice ? (
                                                        <><del>{product.originalPrice}</del> {product.price}</>
                                                    ) : (
                                                        product.price
                                                    )}
                                                </p>
                                            </div>
                                            <div className="single-product-style1__content-right">
                                                <div className="single-product-style1__review">
                                                    <i className="fa fa-star"></i>
                                                    <p>{product.rating}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                </div>
            </section>
            {/* End Related Products */}
        </>
    );
}
