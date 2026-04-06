import React, { useEffect, useState } from "react";

interface TypingEffectProps {
    strings: string[];
    typeSpeed?: number;
    deleteSpeed?: number;
    pauseDuration?: number;
    className?: string;
    showCursor?: boolean;
}

const TypingEffect: React.FC<TypingEffectProps> = ({
    strings,
    typeSpeed = 100,
    deleteSpeed = 50,
    pauseDuration = 2000,
    className = "",
    showCursor = true,
}) => {
    const [typedText, setTypedText] = useState<string>("");
    const [currentStringIndex, setCurrentStringIndex] = useState<number>(0);
    const [currentCharIndex, setCurrentCharIndex] = useState<number>(0);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    useEffect(() => {
        const timer = setTimeout(
            () => {
                const currentString = strings[currentStringIndex];

                if (!isDeleting) {
                    if (currentCharIndex < currentString.length) {
                        setTypedText(
                            currentString.substring(0, currentCharIndex + 1),
                        );
                        setCurrentCharIndex((prev) => prev + 1);
                    } else {
                        setTimeout(() => setIsDeleting(true), pauseDuration);
                    }
                } else {
                    if (currentCharIndex > 0) {
                        setTypedText(
                            currentString.substring(0, currentCharIndex - 1),
                        );
                        setCurrentCharIndex((prev) => prev - 1);
                    } else {
                        setIsDeleting(false);
                        setCurrentStringIndex(
                            (prev) => (prev + 1) % strings.length,
                        );
                    }
                }
            },
            isDeleting ? deleteSpeed : typeSpeed,
        );

        return () => clearTimeout(timer);
    }, [
        currentCharIndex,
        currentStringIndex,
        isDeleting,
        strings,
        typeSpeed,
        deleteSpeed,
        pauseDuration,
    ]);

    return (
        <span className={className}>
            {typedText}
            {showCursor && (
                <span
                    className="cursor"
                    style={{
                        animation: "blink 1s infinite",
                        marginLeft: "2px",
                    }}
                >
                    |
                </span>
            )}
        </span>
    );
};

export default TypingEffect;
