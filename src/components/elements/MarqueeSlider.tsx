import React from "react";
import Marquee from "react-fast-marquee";
import { useInView } from "react-intersection-observer";

interface MarqueeSliderProps {
    mode?: "1" | "2" | "3" | "4" | "5";
    children: React.ReactNode;
    className?: string;
    direction?: "left" | "right" | "up" | "down";
    speed?: number;
}

export default function MarqueeSlider({
    mode = "1",
    children,
    className = "",
    direction,
    speed,
}: MarqueeSliderProps) {
    const { ref, inView } = useInView({
        triggerOnce: true,
        threshold: 0,
    });

    // Configuration based on mode
    const getConfig = () => {
        const configs: Record<
            "1" | "2" | "3" | "4" | "5",
            { speed: number; direction: "left" | "right" | "up" | "down" }
        > = {
            "1": { speed: 60, direction: "left" },
            "2": { speed: 50, direction: "left" },
            "3": { speed: 40, direction: "right" },
            "4": { speed: 70, direction: "left" },
            "5": { speed: 80, direction: "right" },
        };
        return configs[mode];
    };

    const config = getConfig();
    const marqueeSpeed = speed || config.speed;
    const marqueeDirection: "left" | "right" | "up" | "down" =
        direction || config.direction;

    return (
        <div ref={ref} className={`marquee_mode-${mode} ${className}`}>
            <Marquee
                speed={marqueeSpeed}
                gradient={false}
                pauseOnHover={true}
                direction={marqueeDirection}
                delay={0}
                play={inView}
                autoFill={true}
                style={{ width: "110vw" }}
                loop={0}
            >
                {children}
            </Marquee>
        </div>
    );
}
