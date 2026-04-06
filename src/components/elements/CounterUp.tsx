import React from "react";
import { useInView } from "react-intersection-observer";
import CountUp from "react-countup";

type CountUpProps = {
    ending?: number;
    duration?: number;
    decimals?: number;
};

const CounterUp: React.FC<CountUpProps> = ({
    ending = 32,
    duration = 3000, // 3000ms = 3 seconds
    decimals,
}) => {
    const { ref, inView } = useInView({
        triggerOnce: true,
        threshold: 0.2,
    });

    // Auto-detect decimals if not provided
    const autoDecimals =
        decimals !== undefined
            ? decimals
            : (ending.toString().split(".")[1] || "").length;

    if (!inView) {
        return <span ref={ref}>0</span>;
    }

    return (
        <CountUp
            start={0}
            end={ending}
            duration={duration / 1000}
            decimals={autoDecimals}
            separator=","
            decimal="."
        />
    );
};

export default CounterUp;
