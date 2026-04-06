import { Link } from "react-router-dom";
import PageHeaderBg from "@/assets/images/backgrounds/page-header-bg.jpg";

interface PHProps {
    /** @default "Welcome" */
    title?: React.ReactNode;
    /** @default "Go To Home" */
    subtitle?: string;
}

export default function PageHeader({
    title = "Welcome",
    subtitle = "Go To Home",
}: PHProps) {
    return (
        <>
            <section className="page-header">
                <div
                    className="page-header__bg"
                    style={{ backgroundImage: `url(${PageHeaderBg})` }}
                ></div>
                <div className="container">
                    <div className="page-header__inner">
                        <h3>{title}</h3>
                        <div className="thm-breadcrumb__inner">
                            <ul className="thm-breadcrumb list-unstyled">
                                <li>
                                    <Link to="/">Home</Link>
                                </li>
                                <li>
                                    <span className="icon-arrow-angle-pointing-to-right"></span>
                                </li>
                                <li>{subtitle}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
