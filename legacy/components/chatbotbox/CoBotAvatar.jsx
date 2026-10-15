import BotAvatar from "../../assets/icons/bot.svg";

const CoBotAvatar = () => {
    return (
        <div className="react-chatbot-kit-chat-bot-avatar">
            <div
                className="react-chatbot-kit-chat-bot-avatar-container"
                style={{ background: "none" }}
            >
                <img src={BotAvatar} alt="BotAvatar" />
            </div>
        </div>
    );
};

export default CoBotAvatar;