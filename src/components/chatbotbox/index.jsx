import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Chatbot from "react-chatbot-kit";
import config from "./chatbotConfig.jsx";
import MessageParser from "./MessageParser.jsx";
import ActionProvider from "./ActionProvider.jsx";

export default function Chatbotbox() {
    const [showBot, setShowBot] = useState(false);

    return (
        <div className="Chat-App">
            <AnimatePresence>
                {showBot && (
                    <motion.div
                        className="app-chatbotbox-container"
                        initial={{ opacity: 0, y: 24, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.96 }}
                        transition={{ duration: 0.25 }}
                    >
                        <Chatbot
                            config={config}
                            messageParser={MessageParser}
                            actionProvider={ActionProvider}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                type="button"
                className="app-chatbotbox-button"
                onClick={() => setShowBot((prev) => !prev)}
                whileTap={{ scale: 0.96 }}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div>{showBot ? "Close" : "Chat"}</div>
                <svg
                    viewBox="0 0 640 512"
                    className="app-chatbotbox-button-icon"
                    aria-hidden="true"
                >
                    <path d="M192,408h64V360H192ZM576,192H544a95.99975,95.99975,0,0,0-96-96H344V24a24,24,0,0,0-48,0V96H192a95.99975,95.99975,0,0,0-96,96H64a47.99987,47.99987,0,0,0-48,48V368a47.99987,47.99987,0,0,0,48,48H96a95.99975,95.99975,0,0,0,96,96H448a95.99975,95.99975,0,0,0,96-96h32a47.99987,47.99987,0,0,0,48-48V240A47.99987,47.99987,0,0,0,576,192ZM96,368H64V240H96Zm400,48a48.14061,48.14061,0,0,1-48,48H192a48.14061,48.14061,0,0,1-48-48V192a47.99987,47.99987,0,0,1,48-48H448a47.99987,47.99987,0,0,1,48,48Zm80-48H544V240h32ZM240,208a48,48,0,1,0,48,48A47.99612,47.99612,0,0,0,240,208Zm160,0a48,48,0,1,0,48,48A47.99612,47.99612,0,0,0,400,208ZM384,408h64V360H384Zm-96,0h64V360H288Z" />
                </svg>
            </motion.button>
        </div>
    );
}