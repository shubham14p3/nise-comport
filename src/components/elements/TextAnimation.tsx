import React, { useRef } from "react";
import type { ReactNode } from "react";
import { motion, useInView } from "framer-motion";
import type { Variants } from "framer-motion";

type AnimationStyle =
    | "s1" | "s2" | "s3" | "s4" | "s5" | "s6" | "s7" | "s8"
    | "s9" | "s10" | "s11" | "s12" | "s13" | "s14" | "s15" | "s16"
    | "style1" | "style2" | "style3" | "style4"
    | "style5" | "style6" | "style7" | "style8";

type TextSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";

interface TextAnimationProps {
    children: ReactNode;
    style?: AnimationStyle;
    size?: TextSize;
    className?: string;
    stagger?: number; // Override the style's default stagger
    once?: boolean;
}

const sizeMap: Record<TextSize, string> = {
    xs: "0.75rem", sm: "0.875rem", md: "1rem",
    lg: "1.125rem", xl: "1.25rem", "2xl": "1.5rem",
    "3xl": "1.875rem", "4xl": "2.25rem", "5xl": "3rem",
};

// Default stagger per style — tuned to match the feel of each animation
const defaultStaggerMap: Record<string, number> = {
    style1: 0.03,  // 3D flip — slightly slower so each flip is visible
    style2: 0.02,  // Slide from right — smooth fast flow
    style3: 0.04,  // Fade — relaxed, dreamy pace
    style4: 0.02,  // Slide up — clean and quick
    style5: 0.03,  // Skew/wave — needs slight gap to feel wavy
    style6: 0.05,  // Glitch — more gap so each flicker is distinct
    style7: 0.04,  // Blur in — slow reveal feels better
    style8: 0.03,  // Scale/zoom — slight gap for pop effect
    style9: 0.02,  // Slide from left — mirror of style2
    style10: 0.05,  // Flip Y — needs gap so each card flip reads clearly
    style11: 0.04,  // Drop + bounce — gap lets each bounce land
    style12: 0.08,  // Typewriter — high stagger is the whole point
    style13: 0.04,  // Rise + blur — slow and cinematic
    style14: 0.06,  // Swing/pendulum — each char swings independently
    style15: 0.03,  // Zoom out — fast enough to feel explosive
    style16: 0.06,  // Raindrop — high stagger so drops land one by one
};

const TextAnimation: React.FC<TextAnimationProps> = ({
    children,
    style = "s2",
    size,
    className,
    stagger,       // undefined by default — falls back to defaultStaggerMap
    once = true,
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once, amount: 0.3 });

    // Normalize shorthand s1 → style1, keep legacy style1 as-is
    const normalized = style.startsWith("style") ? style : style.replace("s", "style");

    // Use manual override if provided, otherwise use the style's built-in default
    const resolvedStagger = stagger ?? defaultStaggerMap[normalized] ?? 0.02;

    const getCharVariants = (): Variants => {
        switch (normalized) {
            // Slide up + rotateX 3D flip
            case "style1":
                return {
                    hidden: { opacity: 0, y: "90%", rotateX: -40 },
                    visible: {
                        opacity: 1, y: 0, rotateX: 0,
                        transition: { duration: 1, ease: [0.175, 0.885, 0.32, 1.275] },
                    },
                };

            // Slide in from right
            case "style2":
                return {
                    hidden: { opacity: 0, x: 50 },
                    visible: {
                        opacity: 1, x: 0,
                        transition: { duration: 1, ease: [0.175, 0.885, 0.32, 1.275] },
                    },
                };

            // Fade in only
            case "style3":
                return {
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: { duration: 1, ease: [0.175, 0.885, 0.32, 1.275] },
                    },
                };

            // Slide up from bottom
            case "style4":
                return {
                    hidden: { opacity: 0, y: 40 },
                    visible: {
                        opacity: 1, y: 0,
                        transition: { duration: 1, ease: [0.175, 0.885, 0.32, 1.275] },
                    },
                };

            // Skew / wave — each char skews then straightens
            case "style5":
                return {
                    hidden: { opacity: 0, skewX: 20, y: 10 },
                    visible: {
                        opacity: 1, skewX: 0, y: 0,
                        transition: { duration: 0.6, ease: [0.175, 0.885, 0.32, 1.275] },
                    },
                };

            // Glitch / flicker — jitter + blur then settles
            case "style6":
                return {
                    hidden: { opacity: 0, x: -8, filter: "blur(2px)" },
                    visible: {
                        opacity: [0, 1, 0.4, 1, 0.7, 1],
                        x: [-8, 4, -4, 2, 0],
                        filter: ["blur(2px)", "blur(0px)"],
                        transition: { duration: 0.8, ease: "easeOut", times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
                    },
                };

            // Blur in — chars emerge from blur
            case "style7":
                return {
                    hidden: { opacity: 0, filter: "blur(12px)", scale: 1.2 },
                    visible: {
                        opacity: 1, filter: "blur(0px)", scale: 1,
                        transition: { duration: 0.9, ease: [0.175, 0.885, 0.32, 1.275] },
                    },
                };

            // Scale / zoom in — chars pop in from small
            case "style8":
                return {
                    hidden: { opacity: 0, scale: 0.3 },
                    visible: {
                        opacity: 1, scale: 1,
                        transition: { duration: 0.6, ease: [0.175, 0.885, 0.32, 1.275] },
                    },
                };

            // Slide in from left
            case "style9":
                return {
                    hidden: { opacity: 0, x: -50 },
                    visible: {
                        opacity: 1, x: 0,
                        transition: { duration: 1, ease: [0.175, 0.885, 0.32, 1.275] },
                    },
                };

            // Flip Y — horizontal card flip per character
            case "style10":
                return {
                    hidden: { opacity: 0, rotateY: -90 },
                    visible: {
                        opacity: 1, rotateY: 0,
                        transition: { duration: 0.7, ease: [0.175, 0.885, 0.32, 1.275] },
                    },
                };

            // Drop + bounce — falls from above with a bounce
            case "style11":
                return {
                    hidden: { opacity: 0, y: -60 },
                    visible: {
                        opacity: 1, y: 0,
                        transition: { duration: 0.8, ease: [0.34, 1.56, 0.64, 1] },
                    },
                };

            // Typewriter — instant per-char fade, high stagger gives typewriter feel
            case "style12":
                return {
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: { duration: 0.01, ease: "linear" },
                    },
                };

            // Rise + blur combo — slides up while unblurring
            case "style13":
                return {
                    hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
                    visible: {
                        opacity: 1, y: 0, filter: "blur(0px)",
                        transition: { duration: 0.9, ease: [0.175, 0.885, 0.32, 1.275] },
                    },
                };

            // Swing / pendulum — rotates from top-left anchor
            case "style14":
                return {
                    hidden: { opacity: 0, rotate: -45, transformOrigin: "top left" },
                    visible: {
                        opacity: 1, rotate: 0,
                        transition: { duration: 0.7, ease: [0.34, 1.56, 0.64, 1] },
                    },
                };

            // Zoom out — starts oversized and shrinks into place
            case "style15":
                return {
                    hidden: { opacity: 0, scale: 2.5 },
                    visible: {
                        opacity: 1, scale: 1,
                        transition: { duration: 0.8, ease: [0.175, 0.885, 0.32, 1.275] },
                    },
                };

            // Raindrop — falls from above, squish bounce on land
            case "style16":
                return {
                    hidden: { opacity: 0, y: -80, scaleY: 1.3 },
                    visible: {
                        opacity: 1, y: 0, scaleY: 1,
                        transition: {
                            duration: 0.6,
                            ease: [0.25, 0.46, 0.45, 0.94],
                            scaleY: {
                                duration: 0.3,
                                delay: 0.3,
                                ease: [0.34, 1.56, 0.64, 1],
                            },
                        },
                    },
                };

            default:
                return { hidden: { opacity: 0 }, visible: { opacity: 1 } };
        }
    };

    const containerVariants: Variants = {
        hidden: {},
        visible: {
            transition: { staggerChildren: resolvedStagger, delayChildren: 0 },
        },
    };

    // Split text into word and whitespace tokens, animate each character individually.
    // Each word is wrapped with inline-block + nowrap so responsive never breaks mid-word.
    const processTextNode = (text: string): ReactNode => {
        const charVariants = getCharVariants();
        const tokens = text.split(/(\s+)/);

        return tokens.map((token, tokenIndex) => {
            // Whitespace token — preserve spacing between words
            if (/^\s+$/.test(token)) {
                return (
                    <motion.div
                        key={"sp-" + tokenIndex}
                        style={{ display: "inline-block", whiteSpace: "pre" }}
                    >
                        {token}
                    </motion.div>
                );
            }

            // Word token — nowrap wrapper ensures whole word wraps as a unit, never mid-character
            return (
                <div
                    key={"w-" + tokenIndex}
                    style={{ display: "inline-block", whiteSpace: "nowrap" }}
                >
                    {token.split("").map((char, charIndex) => (
                        <motion.div
                            key={"c-" + charIndex}
                            variants={charVariants}
                            style={{ display: "inline-block" }}
                        >
                            {char}
                        </motion.div>
                    ))}
                </div>
            );
        });
    };

    // Recursively process all children — handles strings, React elements (<br/>, <strong>, etc.), and arrays
    const processChildren = (node: ReactNode): ReactNode => {
        if (typeof node === "string") {
            return processTextNode(node);
        }

        // If it's a React element (like <br/>, <strong>, <em>, etc.), recurse into its children
        if (React.isValidElement(node)) {
            const element = node as React.ReactElement<{
                children?: ReactNode;
                style?: React.CSSProperties;
            }>;

            // <br/> and void elements have no children — return them as-is
            if (element.type === "br" || element.props.children === undefined) {
                return element;
            }

            return React.cloneElement(element, {
                ...element.props,
                children: React.Children.map(element.props.children, (child) =>
                    processChildren(child)
                ),
            });
        }

        // Handle arrays of mixed children
        if (Array.isArray(node)) {
            return node.map((child, index) => (
                <React.Fragment key={index}>{processChildren(child)}</React.Fragment>
            ));
        }

        return node;
    };

    return (
        <motion.div
            ref={ref}
            className={className}
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            style={size ? { fontSize: sizeMap[size] } : undefined}
        >
            {processChildren(children)}
        </motion.div>
    );
};

export default TextAnimation;