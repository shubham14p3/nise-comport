import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import CustomSelect, { type OptionType } from "@/components/elements/CustomSelect";
import {
    shopProductsData,
    recentProductsData,
    categoriesData,
    productTagsData,
} from "@/data/shopProducts";

const sortOptions: OptionType[] = [
    { value: "1", label: "Sort by popular" },
    { value: "2", label: "Sort by Price" },
    { value: "3", label: "Sort by Ratings" },
];

const parsePrice = (priceStr: string) => parseFloat(priceStr.replace(/[^0-9.]/g, "")) || 0;

export default function Product() {
    const [activeTab, setActiveTab] = useState<"grid" | "list">("grid");
    const [sortValue, setSortValue] = useState<OptionType | null>(sortOptions[0]);

    const { minPrice, maxPrice } = useMemo(() => {
        const prices = shopProductsData.map((p) => parsePrice(p.price));
        return {
            minPrice: Math.min(...prices),
            maxPrice: Math.max(...prices),
        };
    }, []);

    const [priceRange, setPriceRange] = useState<[number, number]>([minPrice, maxPrice]);

    const filteredProducts = useMemo(() => {
        return shopProductsData.filter((product) => {
            const price = parsePrice(product.price);
            return price >= priceRange[0] && price <= priceRange[1];
        });
    }, [priceRange]);

    const handlePriceChange = (value: number | number[]) => {
        const [min, max] = value as number[];
        setPriceRange([min, max]);
    };

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    return (
        <>
            {/*Product Start*/}
            <section className="product">
                <div className="container">
                    <div className="row">
                        <div className="col-xl-9 col-lg-12">
                            <div className="product__items">
                                <div className="row">
                                    <div className="col-xl-12">
                                        <div className="product__showing-result">
                                            <div className="product__showing-text-box">
                                                <p className="product__showing-text">
                                                    {filteredProducts.length > 0
                                                        ? `Showing 1–${filteredProducts.length} of ${shopProductsData.length} results`
                                                        : `Showing 0 of ${shopProductsData.length} results`}
                                                </p>
                                            </div>
                                            <div className="product__showing-sort">
                                                <div className="select-box">
                                                    <CustomSelect
                                                        options={sortOptions}
                                                        value={sortValue}
                                                        onChange={(newValue: OptionType | readonly OptionType[] | null) => setSortValue(newValue as OptionType)}
                                                        placeholder="Sort by popular"
                                                        className="wide"
                                                        isSearchable={false}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="product__all">
                                    <div className="product__all-tab">
                                        <div className="product__all-tab-button">
                                            <ul className="tabs-button-box clearfix">
                                                <li
                                                    data-tab="#grid"
                                                    className={`tab-btn-item ${activeTab === "grid" ? "active-btn-item" : ""}`}
                                                    onClick={() => setActiveTab("grid")}
                                                >
                                                    <div className="product__all-tab-button-icon one">
                                                        <i className="fa fa-solid fa-bars"></i>
                                                    </div>
                                                </li>
                                                <li
                                                    data-tab="#list"
                                                    className={`tab-btn-item ${activeTab === "list" ? "active-btn-item" : ""}`}
                                                    onClick={() => setActiveTab("list")}
                                                >
                                                    <div className="product__all-tab-button-icon">
                                                        <i className="fa fa-solid fa-list-ul"></i>
                                                    </div>
                                                </li>
                                            </ul>
                                        </div>

                                        {/*Start Tabs Content Box*/}
                                        <div className="tabs-content-box">
                                            {/*Start Tab - Grid View*/}
                                            <div
                                                className={`tab-content-box-item ${activeTab === "grid" ? "tab-content-box-item-active" : ""}`}
                                                id="grid"
                                            >
                                                <div className="product__all-tab-content-box-item">
                                                    <div className="product__all-tab-single">
                                                        <div className="row">
                                                            {filteredProducts.map((product) => (
                                                                <div
                                                                    key={product.id}
                                                                    className="col-xl-4 col-lg-6 col-md-6"
                                                                >
                                                                    <div className="single-product-style1">
                                                                        <div className="single-product-style1__img">
                                                                            <img src={product.gridImage} alt={product.title} />
                                                                            <img src={product.gridImageHover} alt={product.title} />
                                                                            {product.badges && product.badges.length > 0 && (
                                                                                <ul className="single-product-style1__overlay">
                                                                                    {product.badges.map((badge, index) => (
                                                                                        <li key={index}>
                                                                                            <p>{badge.text}</p>
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>
                                                                            )}
                                                                            <ul className="single-product-style1__info">
                                                                                <li>
                                                                                    <Link
                                                                                        to="#"
                                                                                        title="Add to Wishlist"
                                                                                    >
                                                                                        <i className="fa fa-regular fa-heart"></i>
                                                                                    </Link>
                                                                                </li>
                                                                                <li>
                                                                                    <Link
                                                                                        to="#"
                                                                                        title="Add to cart"
                                                                                    >
                                                                                        <i className="fa fa-solid fa-cart-plus"></i>
                                                                                    </Link>
                                                                                </li>
                                                                                <li>
                                                                                    <Link
                                                                                        to="#"
                                                                                        title="Quick View"
                                                                                    >
                                                                                        <i className="fa fa-regular fa-eye"></i>
                                                                                    </Link>
                                                                                </li>
                                                                                <li>
                                                                                    <Link
                                                                                        to="#"
                                                                                        title="Compare"
                                                                                    >
                                                                                        <i className="fa fa-solid fa-repeat"></i>
                                                                                    </Link>
                                                                                </li>
                                                                            </ul>
                                                                        </div>
                                                                        <div className="single-product-style1__content">
                                                                            <div className="single-product-style1__content-left">
                                                                                <h4>
                                                                                    <Link to={product.link}>
                                                                                        {product.title}
                                                                                    </Link>
                                                                                </h4>
                                                                                <p>
                                                                                    {product.oldPrice && (
                                                                                        <del>{product.oldPrice}</del>
                                                                                    )}
                                                                                    {product.price}
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
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {/*End Tab - Grid View*/}

                                            {/*Start Tab - List View*/}
                                            <div
                                                className={`tab-content-box-item ${activeTab === "list" ? "tab-content-box-item-active" : ""}`}
                                                id="list"
                                            >
                                                <div className="product__all-tab-content-box-item">
                                                    <div className="product__all-tab-single">
                                                        <div className="row">
                                                            {filteredProducts.map((product) => (
                                                                <div
                                                                    key={product.id}
                                                                    className="col-xl-6 col-lg-6"
                                                                >
                                                                    <div className="single-product-style2">
                                                                        <div className="row">
                                                                            <div className="col-xl-6 col-lg-6 col-md-6">
                                                                                <div className="single-product-style2__img">
                                                                                    <img src={product.listImage} alt={product.title} />
                                                                                    <img src={product.listImageHover} alt={product.title} />
                                                                                    {product.badges && product.badges.length > 0 && (
                                                                                        <ul className="single-product-style1__overlay">
                                                                                            {product.badges.map((badge, index) => (
                                                                                                <li key={index}>
                                                                                                    <p>{badge.text}</p>
                                                                                                </li>
                                                                                            ))}
                                                                                        </ul>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <div className="col-xl-6 col-lg-6 col-md-6">
                                                                                <div className="single-product-style2__content">
                                                                                    <div className="single-product-style2__review">
                                                                                        <i className="fa fa-star"></i>
                                                                                        <i className="fa fa-star"></i>
                                                                                        <i className="fa fa-star"></i>
                                                                                        <i className="fa fa-star"></i>
                                                                                        <i className="fa fa-star"></i>
                                                                                    </div>
                                                                                    <div className="single-product-style2__text">
                                                                                        <h4>
                                                                                            <Link to={product.link}>
                                                                                                {product.title}
                                                                                            </Link>
                                                                                        </h4>
                                                                                        <p>
                                                                                            {product.oldPrice && (
                                                                                                <del>{product.oldPrice}</del>
                                                                                            )}
                                                                                            {product.price}
                                                                                        </p>
                                                                                    </div>
                                                                                    <ul className="single-product-style2__info">
                                                                                        <li>
                                                                                            <Link
                                                                                                to="#"
                                                                                                title="Add to Wishlist"
                                                                                            >
                                                                                                <i className="fa fa-regular fa-heart"></i>
                                                                                            </Link>
                                                                                        </li>
                                                                                        <li>
                                                                                            <Link
                                                                                                to="#"
                                                                                                title="Add to cart"
                                                                                            >
                                                                                                <i className="fa fa-solid fa-cart-plus"></i>
                                                                                            </Link>
                                                                                        </li>
                                                                                        <li>
                                                                                            <Link
                                                                                                to="#"
                                                                                                title="Quick View"
                                                                                            >
                                                                                                <i className="fa fa-regular fa-eye"></i>
                                                                                            </Link>
                                                                                        </li>
                                                                                        <li>
                                                                                            <Link
                                                                                                to="#"
                                                                                                title="Compare"
                                                                                            >
                                                                                                <i className="fa fa-solid fa-repeat"></i>
                                                                                            </Link>
                                                                                        </li>
                                                                                    </ul>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {/*End Tab - List View*/}
                                        </div>
                                        {/*End Tabs Content Box*/}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-3 col-lg-12">
                            <div className="product__sidebar">
                                <div className="shop-search product__sidebar-single">
                                    <form className="shop-search__form">
                                        <input type="text" placeholder="Search..." />
                                        <button type="submit">
                                            <i className="icon-search"></i>
                                        </button>
                                    </form>
                                </div>

                                <div className="product__price-ranger product__sidebar-single">
                                    <h3 className="product__sidebar-title">
                                        Price Filter
                                    </h3>
                                    <form className="price-ranger" onSubmit={handleFilterSubmit}>
                                        <div id="slider-range" className="price-ranger__slider">
                                            <Slider
                                                range
                                                min={minPrice}
                                                max={maxPrice}
                                                value={[priceRange[0], priceRange[1]]}
                                                onChange={handlePriceChange}
                                                allowCross={false}
                                            />
                                        </div>
                                        <div className="ranger-min-max-block">
                                            <input
                                                type="text"
                                                className="min"
                                                readOnly
                                                value={priceRange[0]}
                                            />
                                            <span>-</span>
                                            <input
                                                type="text"
                                                className="max"
                                                readOnly
                                                value={priceRange[1]}
                                            />
                                            <input type="submit" value="Filter" />
                                        </div>
                                    </form>
                                </div>

                                <div className="shop-category product__sidebar-single">
                                    <h3 className="product__sidebar-title">
                                        Categories
                                    </h3>
                                    <ul className="list-unstyled">
                                        {categoriesData.map((category, index) => (
                                            <li
                                                key={index}
                                                className={category.active ? "active" : ""}
                                            >
                                                <Link to={category.link}>
                                                    {category.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="shop-product-recent-products product__sidebar-single">
                                    <h3 className="product__sidebar-title">
                                        Recent Products
                                    </h3>
                                    <ul className="clearfix list-unstyled">
                                        {recentProductsData.map((recentProduct, index) => (
                                            <li key={index}>
                                                <div className="img">
                                                    <img
                                                        src={recentProduct.image}
                                                        alt={recentProduct.title}
                                                    />
                                                    <Link to={recentProduct.link}>
                                                        <i
                                                            className="fa fa-link"
                                                            aria-hidden="true"
                                                        ></i>
                                                    </Link>
                                                </div>
                                                <div className="content">
                                                    <div className="title">
                                                        <h5>
                                                            <Link to={recentProduct.link}>
                                                                {recentProduct.title}
                                                            </Link>
                                                        </h5>
                                                    </div>
                                                    <div className="price">
                                                        <p>{recentProduct.price}</p>
                                                    </div>
                                                    <div className="review">
                                                        <i className="fa fa-star"></i>
                                                        <i className="fa fa-star"></i>
                                                        <i className="fa fa-star"></i>
                                                        <i className="fa fa-star"></i>
                                                        <i className="fa fa-star color"></i>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="shop-product-tags product__sidebar-single">
                                    <h3 className="product__sidebar-title">
                                        Product Tags
                                    </h3>
                                    <div className="shop-product__tags-list">
                                        {productTagsData.map((tag, index) => (
                                            <Link key={index} to="#">
                                                {tag}
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                {/*Start Products Style1 Single Sidear */}
                                <div className="shop-product-tags product__sidebar-single style">
                                    <h3 className="product__sidebar-title">
                                        Reviews
                                    </h3>
                                    <div className="sidebar-rating-box sidebar-rating-box--style2">
                                        <ul className="list-unstyled">
                                            <li>
                                                <input
                                                    type="radio"
                                                    id="fivestar"
                                                    name="rating"
                                                    checked={true}
                                                    readOnly
                                                />
                                                <label htmlFor="fivestar">
                                                    <i></i>
                                                    <span className="fas fa-star"></span>
                                                    <span className="fas fa-star"></span>
                                                    <span className="fas fa-star"></span>
                                                    <span className="fas fa-star"></span>
                                                    <span className="fas fa-star"></span>
                                                </label>
                                            </li>
                                            <li>
                                                <input
                                                    type="radio"
                                                    id="fourstar"
                                                    name="rating"
                                                />
                                                <label htmlFor="fourstar">
                                                    <i></i>
                                                    <span className="fas fa-star"></span>
                                                    <span className="fas fa-star"></span>
                                                    <span className="fas fa-star"></span>
                                                    <span className="fas fa-star"></span>
                                                    <span className="fas fa-star gray"></span>
                                                </label>
                                            </li>
                                            <li>
                                                <input
                                                    type="radio"
                                                    id="threestar"
                                                    name="rating"
                                                />
                                                <label htmlFor="threestar">
                                                    <i></i>
                                                    <span className="fas fa-star"></span>
                                                    <span className="fas fa-star"></span>
                                                    <span className="fas fa-star"></span>
                                                    <span className="fas fa-star gray"></span>
                                                    <span className="fas fa-star gray"></span>
                                                </label>
                                            </li>
                                            <li>
                                                <input
                                                    type="radio"
                                                    id="twostar"
                                                    name="rating"
                                                />
                                                <label htmlFor="twostar">
                                                    <i></i>
                                                    <span className="fas fa-star"></span>
                                                    <span className="fas fa-star"></span>
                                                    <span className="fas fa-star gray"></span>
                                                    <span className="fas fa-star gray"></span>
                                                    <span className="fas fa-star gray"></span>
                                                </label>
                                            </li>
                                            <li>
                                                <input
                                                    type="radio"
                                                    id="onestar"
                                                    name="rating"
                                                />
                                                <label htmlFor="onestar">
                                                    <i></i>
                                                    <span className="fas fa-star"></span>
                                                    <span className="fas fa-star gray"></span>
                                                    <span className="fas fa-star gray"></span>
                                                    <span className="fas fa-star gray"></span>
                                                    <span className="fas fa-star gray"></span>
                                                </label>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                {/*End Products Style1 Single Sidear */}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/*Product End*/}
        </>
    );
}
