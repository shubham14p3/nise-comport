import { motion, type Transition } from "framer-motion";
import { type ReactNode, type FC } from "react";

type AnimationVariant =
    | "fadeIn"
    | "fadeInLeft"
    | "fadeInRight"
    | "fadeInUp"
    | "fadeInDown"
    | "slideInLeft"
    | "slideInRight"
    | "slideInUp"
    | "slideInDown"
    | "zoomIn"
    | "zoomOut"
    | "bounceIn"
    | "flipInX"
    | "flipInY";

interface VariantConfig {
    initial: {
        opacity?: number;
        x?: number;
        y?: number;
        scale?: number;
        rotateX?: number;
        rotateY?: number;
    };
    animate: {
        opacity?: number;
        x?: number;
        y?: number;
        scale?: number;
        rotateX?: number;
        rotateY?: number;
        transition?: Transition;
    };
}

interface FadeInAdvancedProps {
    children: ReactNode;
    variant?: AnimationVariant;
    delay?: number;
    duration?: number;
    distance?: number;
    className?: string;
    triggerOnce?: boolean;
    threshold?: number;
}

/**
 * Advanced FadeIn Component with multiple animation variants
 */
const FadeInAdvanced: FC<FadeInAdvancedProps> = ({
    children,
    variant = "fadeInLeft",
    delay = 0,
    duration = 1500,
    distance = 70,
    className = "",
    triggerOnce = true,
    threshold = 0.3,
}) => {
    // Use different default distance for slide animations
    const isSlideAnimation = variant.startsWith("slideIn");
    const finalDistance = isSlideAnimation && distance === 80 ? 350 : distance;
    const finalDuration =
        isSlideAnimation && duration === 1500 ? 2100 : duration;

    // Animation variants matching WOW.js patterns
    const variants: Record<AnimationVariant, VariantConfig> = {
        // Fade animations
        fadeIn: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
        },
        fadeInLeft: {
            initial: { opacity: 0, x: -finalDistance },
            animate: { opacity: 1, x: 0 },
        },
        fadeInRight: {
            initial: { opacity: 0, x: finalDistance },
            animate: { opacity: 1, x: 0 },
        },
        fadeInUp: {
            initial: { opacity: 0, y: finalDistance },
            animate: { opacity: 1, y: 0 },
        },
        fadeInDown: {
            initial: { opacity: 0, y: -finalDistance },
            animate: { opacity: 1, y: 0 },
        },

        // Slide animations
        slideInLeft: {
            initial: { x: -finalDistance },
            animate: { x: 0 },
        },
        slideInRight: {
            initial: { x: finalDistance },
            animate: { x: 0 },
        },
        slideInUp: {
            initial: { y: finalDistance },
            animate: { y: 0 },
        },
        slideInDown: {
            initial: { y: -finalDistance },
            animate: { y: 0 },
        },

        // Zoom animations
        zoomIn: {
            initial: { opacity: 0, scale: 0.8 },
            animate: { opacity: 1, scale: 1 },
        },
        zoomOut: {
            initial: { opacity: 0, scale: 1.2 },
            animate: { opacity: 1, scale: 1 },
        },

        // Bounce animations
        bounceIn: {
            initial: { opacity: 0, scale: 0.3 },
            animate: {
                opacity: 1,
                scale: 1,
                transition: {
                    type: "spring",
                    bounce: 0.5,
                    duration: finalDuration / 1000,
                },
            },
        },

        // Flip animations
        flipInX: {
            initial: { opacity: 0, rotateX: 90 },
            animate: { opacity: 1, rotateX: 0 },
        },
        flipInY: {
            initial: { opacity: 0, rotateY: 90 },
            animate: { opacity: 1, rotateY: 0 },
        },
    };

    const selectedVariant = variants[variant] || variants.fadeInLeft;
    const { initial, animate } = selectedVariant;
    const { transition, ...animateProps } = animate;

    return (
        <motion.div
            className={className}
            initial={initial}
            whileInView={animateProps}
            viewport={{ once: triggerOnce, amount: threshold }}
            transition={{
                duration: finalDuration / 1000,
                delay: delay / 1000,
                ease: "easeOut",
                ...transition,
            }}
        >
            {children}
        </motion.div>
    );
};

export default FadeInAdvanced;
export type { AnimationVariant, FadeInAdvancedProps };
