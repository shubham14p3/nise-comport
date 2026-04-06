import React, { useState, useEffect } from "react";
import ProgressBar from "@ramonak/react-progress-bar";
import { useInView } from "react-intersection-observer";

interface ProgressBarsProps {
    title: string;
    value: number;
    /** "default" uses progress-levels layout, "bar-inner" uses bar-inner count-bar (why-choose-one, team-details) */
    variant?: "default" | "bar-inner";
    wrapperClassName?: string;
    titleClassName?: string;
}

const Progresbar: React.FC<ProgressBarsProps> = ({
    title = "",
    value = 80,
    variant = "default",
    wrapperClassName = "",
    titleClassName = "",
}) => {
    const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });
    const [progress, setProgress] = useState<number>(0);
    const [counted, setCounted] = useState(false);

    useEffect(() => {
        if (inView) {
            let start = 0;
            const end = value;
            const duration = variant === "bar-inner" ? 1500 : 1200;
            const frameRate = 20;
            const increment = end / (duration / frameRate);

            const timer = setInterval(() => {
                start += increment;
                if (start >= end) {
                    start = end;
                    clearInterval(timer);
                    if (variant === "bar-inner") setCounted(true);
                }
                setProgress(Math.round(start));
            }, frameRate);
            return () => clearInterval(timer);
        }
    }, [inView, value, variant]);

    if (variant === "bar-inner") {
        return (
            <li>
                <div
                    className={wrapperClassName || "progress"}
                    ref={ref}
                >
                    <h4 className={titleClassName || "progress-title"}>
                        {title}
                    </h4>
                    <div className="bar">
                        <div
                            className={`bar-inner count-bar ${counted ? "counted" : ""}`}
                            style={{ width: `${progress}%` }}
                        >
                            <div className="count-text">{progress}%</div>
                        </div>
                    </div>
                </div>
            </li>
        );
    }

    return (
        <li>
            <div className="progress-levels" ref={ref}>
                <div className="progress-box">
                    <div className="inner count-box">
                        <div className="text">{title}</div>
                        <div className="bar">
                            <div className="bar-inner">
                                <div className="skill-percent">
                                    <span className="count-text">{progress}</span>
                                    <span className="percent">%</span>
                                </div>
                                <ProgressBar
                                    completed={progress}
                                    maxCompleted={100}
                                    bgColor="#2E72FF"
                                    baseBgColor="#f1f1f1"
                                    height="8px"
                                    isLabelVisible={false}
                                    className="progressWrapper"
                                    barContainerClassName="barContainer"
                                    animateOnRender={false}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </li>
    );
};

export default Progresbar;
