import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Thumbs } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import ProductDetailsImg1 from "@/assets/images/shop/product-details-img-1.jpg";
import ProductDetailsImg2 from "@/assets/images/shop/product-details-img-2.jpg";
import ProductDetailsImg3 from "@/assets/images/shop/product-details-img-3.jpg";
import ProductDetailsThumbImg1 from "@/assets/images/shop/product-details-thumb-img-1.jpg";
import ProductDetailsThumbImg2 from "@/assets/images/shop/product-details-thumb-img-2.jpg";
import ProductDetailsThumbImg3 from "@/assets/images/shop/product-details-thumb-img-3.jpg";

const productImages = [
    { id: 1, main: ProductDetailsImg1, thumb: ProductDetailsThumbImg1 },
    { id: 2, main: ProductDetailsImg2, thumb: ProductDetailsThumbImg2 },
    { id: 3, main: ProductDetailsImg3, thumb: ProductDetailsThumbImg3 },
];

export default function ProductDetailsContent() {
    const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
    const mainSwiperRef = useRef<SwiperType | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    return (
        <>
            {/*Start Product Details*/}
            <section className="product-details">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-6 col-xl-6">
                            <div className="product-details__left">
                                <div className="product-details__left-inner">
                                    <div className="product-details__content-box">
                                        <Swiper
                                            modules={[Navigation, Autoplay, Thumbs]}
                                            id="shop-details-one__carousel"
                                            className="swiper-container"
                                            spaceBetween={0}
                                            slidesPerView={1}
                                            loop={true}
                                            speed={1400}
                                            observer={true}
                                            observeParents={true}
                                            autoplay={{
                                                delay: 5000,
                                                disableOnInteraction: false,
                                            }}
                                            thumbs={{
                                                swiper:
                                                    thumbsSwiper && !thumbsSwiper.destroyed
                                                        ? thumbsSwiper
                                                        : null,
                                            }}
                                            onSwiper={(swiper) => {
                                                mainSwiperRef.current = swiper;
                                            }}
                                        >
                                            {productImages.map((img) => (
                                                <SwiperSlide key={img.id}>
                                                    <div className="product-details__img">
                                                        <img src={img.main} alt="" />
                                                    </div>
                                                </SwiperSlide>
                                            ))}
                                        </Swiper>
                                        <div className="product-details__nav">
                                            <div
                                                className="swiper-button-next"
                                                id="product-details__swiper-button-prev"
                                                onClick={() => mainSwiperRef.current?.slideNext()}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) =>
                                                    e.key === "Enter" && mainSwiperRef.current?.slideNext()
                                                }
                                            >
                                                <i className="fal fa-long-arrow-left"></i>
                                            </div>
                                            <div
                                                className="swiper-button-prev"
                                                id="product-details__swiper-button-next"
                                                onClick={() => mainSwiperRef.current?.slidePrev()}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) =>
                                                    e.key === "Enter" && mainSwiperRef.current?.slidePrev()
                                                }
                                            >
                                                <i className="fal fa-long-arrow-right"></i>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="product-details__thumb-box">
                                        <Swiper
                                            modules={[Thumbs, Autoplay]}
                                            id="shop-details-one__thumb"
                                            className="swiper-container"
                                            spaceBetween={0}
                                            slidesPerView={3}
                                            speed={1400}
                                            watchSlidesProgress={true}
                                            loop={true}
                                            autoplay={{
                                                delay: 5000,
                                                disableOnInteraction: false,
                                            }}
                                            onSwiper={setThumbsSwiper}
                                        >
                                            {productImages.map((img) => (
                                                <SwiperSlide key={img.id}>
                                                    <div className="product-details__thumb-img">
                                                        <img src={img.thumb} alt="" />
                                                    </div>
                                                </SwiperSlide>
                                            ))}
                                        </Swiper>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-6 col-xl-6">
                            <div className="product-details__right">
                                <div className="product-details__top">
                                    <h3 className="product-details__title">
                                        Gree Air Conditioner <span>$86.00</span>
                                    </h3>
                                </div>
                                <div className="product-details__reveiw">
                                    <i className="fa fa-star"></i>
                                    <i className="fa fa-star"></i>
                                    <i className="fa fa-star"></i>
                                    <i className="fa fa-star"></i>
                                    <i className="fa fa-star"></i>
                                    <span>55 customer reviews</span>
                                </div>
                                <div className="product-details__content">
                                    <p className="product-details__content-text1">
                                        The power to be found between the pages
                                        of a book is formidable, indeed. And
                                        these 80 inspiring quotes about books
                                        and importance of reading are here to
                                        remind you of that. From beloved
                                        bestsellers to iconic celebrities, these
                                        quotes exemplify the benefits of reading
                                        and of a good books to comfort,
                                        challenge, and inspire you.
                                    </p>
                                    <p className="product-details__content-text2">
                                        REF. 4231/406 <br />
                                        Available in store
                                    </p>
                                </div>
                                <div className="product-details__select">
                                    <div className="product-details__select-size">
                                        <h3>Size:</h3>
                                        <ul className="list-unstyled">
                                            <li>
                                                <input
                                                    type="radio"
                                                    id="size1"
                                                    name="rating"
                                                    defaultChecked
                                                />
                                                <label htmlFor="size1">
                                                    <i></i>
                                                    <span>XXL</span>
                                                </label>
                                            </li>
                                            <li>
                                                <input
                                                    type="radio"
                                                    id="size2"
                                                    name="rating"
                                                />
                                                <label htmlFor="size2">
                                                    <i></i>
                                                    <span>XL</span>
                                                </label>
                                            </li>
                                            <li>
                                                <input
                                                    type="radio"
                                                    id="size3"
                                                    name="rating"
                                                />
                                                <label htmlFor="size3">
                                                    <i></i>
                                                    <span>XS</span>
                                                </label>
                                            </li>
                                            <li>
                                                <input
                                                    type="radio"
                                                    id="size4"
                                                    name="rating"
                                                />
                                                <label htmlFor="size4">
                                                    <i></i>
                                                    <span>M</span>
                                                </label>
                                            </li>
                                            <li>
                                                <input
                                                    type="radio"
                                                    id="size5"
                                                    name="rating"
                                                />
                                                <label htmlFor="size5">
                                                    <i></i>
                                                    <span>L</span>
                                                </label>
                                            </li>
                                            <li>
                                                <input
                                                    type="radio"
                                                    id="size6"
                                                    name="rating"
                                                />
                                                <label htmlFor="size6">
                                                    <i></i>
                                                    <span>S</span>
                                                </label>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="product-details__inner">
                                    <div className="product-details__quantity">
                                        <h3 className="product-details__quantity-title">
                                            Quantity
                                        </h3>
                                        <div className="quantity-box">
                                            <button
                                                type="button"
                                                className="sub"
                                                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                                            >
                                                <i className="fa fa-minus"></i>
                                            </button>
                                            <input
                                                type="number"
                                                id="quantity"
                                                value={quantity}
                                                min={1}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    if (!isNaN(val) && val >= 1) setQuantity(val);
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="add"
                                                onClick={() => setQuantity((prev) => prev + 1)}
                                            >
                                                <i className="fa fa-plus"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="product-details__buttons-boxes">
                                        <div className="product-details__buttons-1">
                                            <Link
                                                to="/wishlist"
                                                className="thm-btn"
                                            >
                                                Add to Wishlist
                                                <span className="fas fa-arrow-right"></span>
                                            </Link>
                                        </div>
                                        <div className="product-details__buttons-2">
                                            <Link
                                                to="/cart"
                                                className="thm-btn"
                                            >
                                                Add to Cart
                                                <span className="fas fa-arrow-right"></span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                                <div className="product-details__social">
                                    <div className="title">
                                        <h3>Share with friends:</h3>
                                    </div>
                                    <div className="product-details__social-link">
                                        <Link to="#">
                                            <span className="fab fa-twitter"></span>
                                        </Link>
                                        <Link to="#">
                                            <span className="fab fa-facebook"></span>
                                        </Link>
                                        <Link to="#">
                                            <span className="fab fa-pinterest-p"></span>
                                        </Link>
                                        <Link to="#">
                                            <span className="fab fa-instagram"></span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/*End Product Details*/}
        </>
    );
}
