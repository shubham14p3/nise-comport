import { useEffect, useState } from "react";
import {
    CircularProgressbarWithChildren,
    buildStyles,
} from "react-circular-progressbar";
import { useInView } from "react-intersection-observer";
import CounterUp from "@/components/elements/CounterUp";
import "react-circular-progressbar/dist/styles.css";

interface CirculaProgressOnViewProps {
    endValue: number;
    size?: number;
    strokeWidth?: number;
    duration?: number;
    pathColor?: string;
    trailColor?: string;
    textColor?: string;
    suffix?: string;
    counterUpEnding?: number;
    counterUpDuration?: number;
}

const CirculaProgressOnView: React.FC<CirculaProgressOnViewProps> = ({
    endValue,
    size = 120,
    strokeWidth = 5,
    duration = 20,
    pathColor = "#6e54f3",
    trailColor = "#070d1a",
    textColor = "#fff",
    suffix = "%",
    counterUpEnding,
    counterUpDuration = 2000,
}) => {
    const [progress, setProgress] = useState(0);

    const { ref, inView } = useInView({
        threshold: 0.5,
        triggerOnce: true,
    });

    useEffect(() => {
        if (!inView) return;

        let start = 0;

        const interval = setInterval(() => {
            start += 1;
            setProgress(start);

            if (start >= endValue) {
                clearInterval(interval);
            }
        }, duration);

        return () => clearInterval(interval);
    }, [inView, endValue, duration]);

    return (
        <div
            ref={ref}
            style={{
                width: size,
                height: size,
                padding: "5px",
            }}
        >
            <CircularProgressbarWithChildren
                value={progress}
                strokeWidth={strokeWidth}
                styles={buildStyles({
                    pathColor,
                    trailColor,
                })}
            >
                <div
                    style={{
                        position: "relative",
                        zIndex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        lineHeight: "20px",
                        fontWeight: 700,
                        color: textColor,
                    }}
                >
                    {counterUpEnding !== undefined ? (
                        <>
                            <CounterUp
                                ending={counterUpEnding}
                                duration={counterUpDuration}
                            />
                            {suffix}
                        </>
                    ) : (
                        <>
                            {progress}
                            {suffix}
                        </>
                    )}
                </div>
            </CircularProgressbarWithChildren>
        </div>
    );
};

export default CirculaProgressOnView;
