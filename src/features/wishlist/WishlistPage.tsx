import { Link } from "react-router-dom";
import WishlistPageImg1 from "@/assets/images/shop/wishlist-page-img-1.jpg";
import WishlistPageImg2 from "@/assets/images/shop/wishlist-page-img-2.jpg";
import WishlistPageImg3 from "@/assets/images/shop/wishlist-page-img-3.jpg";
import WishlistPageImg4 from "@/assets/images/shop/wishlist-page-img-4.jpg";

export default function WishlistPage() {
    return (
        <>
            {/*Start Cart Page*/}
            <section className="wishlist-page">
                <div className="container">
                    <div className="table-responsive">
                        <table className="table wishlist-table">
                            <thead>
                                <tr>
                                    <th>Product Name</th>
                                    <th>Unit Price</th>
                                    <th>Stock Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <div className="product-box">
                                            <div className="cross-icon">
                                                <Link to="/wishlist">
                                                    <i className="fas fa-times"></i>
                                                </Link>
                                            </div>
                                            <div className="img-box">
                                                <img src={WishlistPageImg1} />
                                            </div>
                                            <h3>
                                                <Link to="/product-details">
                                                    Fite ON AC_DC Adapter
                                                </Link>
                                            </h3>
                                        </div>
                                    </td>
                                    <td>$120.99</td>
                                    <td>In Stock</td>
                                    <td>
                                        <div className="product-select">
                                            <Link
                                                to="/wishlist"
                                                className="thm-btn wishlist-page__btn"
                                            >
                                                Select Product
                                                <span className="fas fa-arrow-right"></span>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>

                                <tr>
                                    <td>
                                        <div className="product-box">
                                            <div className="cross-icon">
                                                <Link to="/wishlist">
                                                    <i className="fas fa-times"></i>
                                                </Link>
                                            </div>
                                            <div className="img-box">
                                                <img src={WishlistPageImg2} />
                                            </div>
                                            <h3>
                                                <Link to="/product-details">
                                                    Gaming Headset
                                                </Link>
                                            </h3>
                                        </div>
                                    </td>
                                    <td>$100.99</td>
                                    <td>In Stock</td>
                                    <td>
                                        <div className="product-select">
                                            <Link
                                                to="/wishlist"
                                                className="thm-btn wishlist-page__btn"
                                            >
                                                Select Product
                                                <span className="fas fa-arrow-right"></span>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>

                                <tr>
                                    <td>
                                        <div className="product-box">
                                            <div className="cross-icon">
                                                <Link to="/wishlist">
                                                    <i className="fas fa-times"></i>
                                                </Link>
                                            </div>
                                            <div className="img-box">
                                                <img src={WishlistPageImg3} />
                                            </div>
                                            <h3>
                                                <Link to="/product-details">
                                                    Wireless Mouse
                                                </Link>
                                            </h3>
                                        </div>
                                    </td>
                                    <td>$106.99</td>
                                    <td>In Stock</td>
                                    <td>
                                        <div className="product-select">
                                            <Link
                                                to="/wishlist"
                                                className="thm-btn wishlist-page__btn"
                                            >
                                                Select Product
                                                <span className="fas fa-arrow-right"></span>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>

                                <tr>
                                    <td>
                                        <div className="product-box">
                                            <div className="cross-icon">
                                                <Link to="/wishlist">
                                                    <i className="fas fa-times"></i>
                                                </Link>
                                            </div>
                                            <div className="img-box">
                                                <img src={WishlistPageImg4} />
                                            </div>
                                            <h3>
                                                <Link to="/product-details">
                                                    Screwdriver and wrench
                                                </Link>
                                            </h3>
                                        </div>
                                    </td>
                                    <td>$170.00</td>
                                    <td>In Stock</td>
                                    <td>
                                        <div className="product-select">
                                            <Link
                                                to="/wishlist"
                                                className="thm-btn wishlist-page__btn"
                                            >
                                                Select Product
                                                <span className="fas fa-arrow-right"></span>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="product-details__social two">
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
            </section>
            {/*End Cart Page*/}
        </>
    );
}
