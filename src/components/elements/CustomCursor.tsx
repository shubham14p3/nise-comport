import { useEffect, useRef } from "react";

const CustomCursor = () => {
    const cursorRef = useRef<HTMLDivElement | null>(null);
    const cursorInnerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const cursor = cursorRef.current;
        const cursorInner = cursorInnerRef.current;
        if (!cursor || !cursorInner) return;

        const moveCursor = (e: MouseEvent) => {
            cursor.style.transform = `translate3d(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%), 0)`;
        };

        const moveCursorInner = (e: MouseEvent) => {
            cursorInner.style.left = `${e.clientX}px`;
            cursorInner.style.top = `${e.clientY}px`;
        };

        const mouseDown = () => {
            cursor.classList.add("click");
            cursorInner.classList.add("custom-cursor__innerhover");
        };

        const mouseUp = () => {
            cursor.classList.remove("click");
            cursorInner.classList.remove("custom-cursor__innerhover");
        };

        document.addEventListener("mousemove", moveCursor);
        document.addEventListener("mousemove", moveCursorInner);
        document.addEventListener("mousedown", mouseDown);
        document.addEventListener("mouseup", mouseUp);

        return () => {
            document.removeEventListener("mousemove", moveCursor);
            document.removeEventListener("mousemove", moveCursorInner);
            document.removeEventListener("mousedown", mouseDown);
            document.removeEventListener("mouseup", mouseUp);
        };
    }, []);

    return (
        <>
            <div ref={cursorRef} className="custom-cursor__cursor"></div>
            <div
                ref={cursorInnerRef}
                className="custom-cursor__cursor-two"
            ></div>
        </>
    );
};

export default CustomCursor;
