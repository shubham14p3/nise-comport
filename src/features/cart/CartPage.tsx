import { Link } from "react-router-dom";
import { useState } from "react";
import CustomSelect, { type OptionType } from "@/components/elements/CustomSelect";
import { cartItems } from "@/data/cartData";
import type { CartItem } from "@/data/cartData";

const countryOptions: OptionType[] = [
    { value: "1", label: "Ban" },
    { value: "2", label: "Ind" },
    { value: "3", label: "Pak" },
    { value: "4", label: "USA" },
];

const stateOptions: OptionType[] = [
    { value: "1", label: "Ban" },
    { value: "2", label: "Ind" },
    { value: "3", label: "Pak" },
    { value: "4", label: "USA" },
];

export default function CartPage() {
    const [items, setItems] = useState<CartItem[]>(cartItems);
    const [countryValue, setCountryValue] = useState<OptionType | null>(null);
    const [stateValue, setStateValue] = useState<OptionType | null>(null);

    const handleQuantityChange = (id: number, newQuantity: number) => {
        if (newQuantity < 1) return;
        setItems(items.map(item => item.id === id ? { ...item, quantity: newQuantity } : item));
    };

    const handleRemoveItem = (id: number) => {
        setItems(items.filter(item => item.id !== id));
    };

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = 50;
    const total = subtotal + shippingCost;

    return (
        <>
            {/*Start Cart Page*/}
            <section className="cart-page">
                <div className="container">
                    <div className="row">
                        <div className="col-xl-8 col-lg-7">
                            <div className="cart-page__left">
                                <div className="table-responsive">
                                    <table className="table cart-table">
                                        <thead>
                                            <tr>
                                                <th>Item</th>
                                                <th>Price</th>
                                                <th>Quantity</th>
                                                <th>Total</th>
                                                <th>Remove</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item) => {
                                                const itemTotal = item.price * item.quantity;
                                                return (
                                                    <tr key={item.id}>
                                                        <td>
                                                            <div className="product-box">
                                                                <div className="img-box">
                                                                    <img src={item.image} alt={item.title} />
                                                                </div>
                                                                <h3>
                                                                    <Link to={item.link}>{item.title}</Link>
                                                                </h3>
                                                            </div>
                                                        </td>
                                                        <td>${item.price.toFixed(2)}</td>
                                                        <td>
                                                            <div className="quantity-box">
                                                                <button
                                                                    type="button"
                                                                    className="sub"
                                                                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                                >
                                                                    <i className="fa fa-minus"></i>
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    id={`product-${item.id}`}
                                                                    value={item.quantity}
                                                                    onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    className="add"
                                                                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                                >
                                                                    <i className="fa fa-plus"></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td>${itemTotal.toFixed(2)}</td>
                                                        <td>
                                                            <div
                                                                className="cross-icon"
                                                                onClick={() => handleRemoveItem(item.id)}
                                                                style={{ cursor: "pointer" }}
                                                            >
                                                                <i className="fas fa-times"></i>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-4 col-lg-5">
                            <div className="cart-page__right">
                                <div className="cart-page__sidebar">
                                    <div className="cart-page__shipping">
                                        <h3 className="cart-page__shipping-title">
                                            Calculated Shipping
                                        </h3>
                                        <form className="cart-page__shipping-form">
                                            <div className="row">
                                                <div className="col-xl-12">
                                                    <div className="cart-page__shipping-input-box">
                                                        <div className="select-box">
                                                            <CustomSelect
                                                                options={countryOptions}
                                                                value={countryValue}
                                                                onChange={(newValue: OptionType | readonly OptionType[] | null) => setCountryValue(Array.isArray(newValue) ? newValue[0] ?? null : newValue)}
                                                                placeholder="Country"
                                                                className="wide"
                                                                isSearchable={false}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-xl-6 col-lg-6 col-md-6">
                                                    <div className="cart-page__shipping-input-box">
                                                        <div className="select-box">
                                                            <CustomSelect
                                                                options={stateOptions}
                                                                value={stateValue}
                                                                onChange={(newValue: OptionType | readonly OptionType[] | null) => setStateValue(Array.isArray(newValue) ? newValue[0] ?? null : newValue)}
                                                                placeholder="State/City"
                                                                className="wide"
                                                                isSearchable={false}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-xl-6 col-lg-6 col-md-6">
                                                    <div className="cart-page__shipping-input-box">
                                                        <input
                                                            type="text"
                                                            placeholder="Zip Code"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="cart-page__btn-box">
                                                    <button
                                                        type="submit"
                                                        className="thm-btn"
                                                    >
                                                        Update
                                                        <span className="fas fa-arrow-right"></span>
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                    <div className="cart-page__coupon-code">
                                        <h3 className="cart-page__coupon-code-title">
                                            Coupon Code
                                        </h3>
                                        <p className="cart-page__coupon-code-text">
                                            I must explain to you how all this
                                            mistaken idea of denouncing pleasure
                                            and praising pain was born
                                        </p>
                                        <form className="default-form cart-page__coupon-code-form">
                                            <input
                                                type="text"
                                                placeholder="Enter Coupon Code"
                                            />
                                            <button
                                                className="thm-btn"
                                                type="submit"
                                            >
                                                Apply Coupon
                                                <span className="fas fa-arrow-right"></span>
                                            </button>
                                        </form>
                                    </div>
                                    <div className="cart-page__cart-total">
                                        <ul className="cart-total list-unstyled">
                                            <li>
                                                <span>Cart Subtotal</span>
                                                <span>${subtotal.toFixed(2)} USD</span>
                                            </li>
                                            <li>
                                                <span>Shipping Cost</span>
                                                <span>${shippingCost.toFixed(2)} USD</span>
                                            </li>
                                            <li>
                                                <span>Discount</span>
                                                <span>$0.00 USD</span>
                                            </li>
                                            <li>
                                                <span>Cart Total</span>
                                                <span className="cart-total-amount">
                                                    ${total.toFixed(2)} USD
                                                </span>
                                            </li>
                                        </ul>
                                        <div className="cart-page__buttons">
                                            <div className="cart-page__buttons-1">
                                                <Link
                                                    to="/checkout"
                                                    className="thm-btn"
                                                >
                                                    Update
                                                    <span className="fas fa-arrow-right"></span>
                                                </Link>
                                            </div>
                                            <div className="cart-page__buttons-2">
                                                <Link
                                                    to="/checkout"
                                                    className="thm-btn"
                                                >
                                                    Checkout
                                                    <span className="fas fa-arrow-right"></span>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/*End Cart Page*/}
        </>
    );
}
