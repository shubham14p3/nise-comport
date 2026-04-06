import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface YoutubeFrameProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    video: string;
    children?: React.ReactNode;
}

const YoutubeFrem: React.FC<YoutubeFrameProps> = ({
    video,
    children,
    className = "",
    ...anchorProps
}) => {
    const [showPopup, setShowPopup] = useState<boolean>(false);
    const [embedUrl, setEmbedUrl] = useState<string>("");

    // Extract YouTube Video ID from various URL formats
    const extractYouTubeVideoId = useCallback((input: string): string | null => {
        if (!input) return null;

        if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) {
            return input.trim();
        }

        const patterns: RegExp[] = [
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
            /(?:https?:\/\/)?youtu\.be\/([^&\n?#]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^&\n?#]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^&\n?#]+)/,
        ];

        for (const pattern of patterns) {
            const match = input.match(pattern);
            if (match && match[1]) return match[1];
        }

        return null;
    }, []);

    const buildEmbedUrl = useCallback((input: string): string => {
        const videoId = extractYouTubeVideoId(input);

        if (videoId) {
            return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3`;
        }

        return input;
    }, [extractYouTubeVideoId]);

    const handleVideoClick = (e: React.MouseEvent<HTMLAnchorElement>): void => {
        e.preventDefault();
        const url = buildEmbedUrl(video);
        setEmbedUrl(url);
        setShowPopup(true);
    };

    const closePopup = useCallback((): void => {
        setShowPopup(false);
        setEmbedUrl("");
    }, []);

    useEffect(() => {
        const handleEscKey = (e: KeyboardEvent): void => {
            if (e.key === "Escape") closePopup();
        };

        if (showPopup) {
            document.addEventListener("keydown", handleEscKey);
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        return () => {
            document.removeEventListener("keydown", handleEscKey);
            document.body.style.overflow = "unset";
        };
    }, [showPopup, closePopup]);

    const handleOverlayClick = (): void => closePopup();

    const handleContentClick = (e: React.MouseEvent<HTMLDivElement>): void => {
        e.stopPropagation();
    };

    // Render popup with Portal
    const renderPopup = () => {
        if (!showPopup) return null;

        return createPortal(
            <>
                <style>
                    {`
                        .video-popup-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            width: 100vw;
                            height: 100vh;
                            background-color: rgba(0, 0, 0, 0.75);
                            backdrop-filter: blur(3px);
                            -webkit-backdrop-filter: blur(2px);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            z-index: 999999;
                            padding: 20px;
                            box-sizing: border-box;
                            margin: 0;
                            overflow: auto;
                            animation: videoOverlayFadeIn 0.3s ease-in-out;
                        }

                        .video-popup-overlay * {
                            box-sizing: border-box;
                        }

                        @keyframes videoOverlayFadeIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }

                        .video-popup-content {
                            position: relative;
                            width: 100%;
                            max-width: 900px;
                            background: #000;
                            border-radius: 12px;
                            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                            margin: auto;
                            animation: videoContentSlideUp 0.4s ease-out;
                        }

                        @keyframes videoContentSlideUp {
                            from {
                                opacity: 0;
                                transform: translateY(30px) scale(0.95);
                            }
                            to {
                                opacity: 1;
                                transform: translateY(0) scale(1);
                            }
                        }

                        .video-popup-close {
                        position: absolute;
                        top: -50px;
                        right: -30px;
                        width: 45px;
                        height: 45px;
                        background: rgba(0, 0, 0, 0.36);
                        border: 2px solid rgba(252, 252, 252, 0.67);
                        border-radius: 50%;
                        color: white;
                        font-size: 28px;
                        font-weight: 300;
                        line-height: 1;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25);
                        z-index: 99999999;
                        padding: 0;
                    }

                        .video-popup-close:hover {
                            transform: rotate(90deg);
                            background: rgba(255, 68, 68, 0.2);
                            border-color: #ff4444;
                            color: #ff4444;
                        }

                        .video-popup-close:active {
                            transform: rotate(90deg) scale(0.95);
                        }

                        .video-iframe {
                            width: 100%;
                            height: auto;
                            aspect-ratio: 16 / 9;
                            border: none;
                            overflow: hidden;
                            border-radius: 12px;
                            display: block;
                        }

                        @media (max-width: 768px) {
                            .video-popup-overlay { padding: 15px; }
                            .video-popup-content {
                                max-width: 100%;
                                border-radius: 8px;
                            }
                            .video-popup-close {
                                top: -45px;
                                right: 0;
                                width: 40px;
                                height: 40px;
                                font-size: 24px;
                            }
                        }

                        @media (max-width: 480px) {
                            .video-popup-overlay { padding: 10px; }
                            .video-popup-close {
                                top: 10px;
                                right: 10px;
                                width: 36px;
                                height: 36px;
                                font-size: 22px;
                                background: rgba(0, 0, 0, 0.7);
                                border-color: rgba(255, 255, 255, 0.5);
                            }
                            .video-popup-content { border-radius: 6px; }
                        }

                        @supports (-webkit-touch-callout: none) {
                            .video-popup-overlay {
                                height: -webkit-fill-available;
                            }
                        }
                    `}
                </style>

                <div className="video-popup-overlay active" onClick={handleOverlayClick}>
                    <div className="video-popup-content" onClick={handleContentClick}>
                        <button className="video-popup-close" onClick={closePopup}>
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                        <iframe
                            className="video-iframe"
                            width="800"
                            height="450"
                            src={embedUrl}
                            title="YouTube video player"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            referrerPolicy="strict-origin-when-cross-origin"
                            style={{
                                maxWidth: "100%",
                                height: "auto",
                                aspectRatio: "16 / 9",
                            }}
                        />
                    </div>
                </div>
            </>,
            document.body
        );
    };

    return (
        <>
            <a
                href="#"
                className={className}
                onClick={handleVideoClick}
                {...anchorProps}
            >
                {children}
            </a>
            {renderPopup()}
        </>
    );
};

export default YoutubeFrem;