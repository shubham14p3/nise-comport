import { createChatBotMessage } from "react-chatbot-kit";
import Overview from "../widgets/Overview";
import GlobalStatistics from "../widgets/GlobalStatistics";
import LocalStatistics from "../widgets/LocalStatistics";
import Contact from "../widgets/Contact";
import Pan from "../widgets/Pan";
import Voter from "../widgets/Voter";
import Dl from "../widgets/Dl";
import Passport from "../widgets/Passport";
import CoBotAvatar from "./CoBotAvatar.jsx";

const config = {
    lang: "en",
    botName: "CoBot",
    customStyles: {
        botMessageBox: {
            backgroundColor: "#04668a",
        },
        chatButton: {
            backgroundColor: "#0f5faf",
        },
    },
    initialMessages: [
        createChatBotMessage("Hi, I'm Help Bot! Here to help you."),
        createChatBotMessage(
            "Here's a quick overview of what I can help you with. You can also type in.",
            {
                withAvatar: false,
                delay: 400,
                widget: "overview",
            }
        ),
    ],
    state: {},
    customComponents: {
        botAvatar: (props) => <CoBotAvatar {...props} />,
    },
    widgets: [
        {
            widgetName: "overview",
            widgetFunc: (props) => <Overview {...props} />,
            mapStateToProps: ["messages"],
        },
        {
            widgetName: "globalStatistics",
            widgetFunc: () => <GlobalStatistics />,
        },
        {
            widgetName: "localStatistics",
            widgetFunc: () => <LocalStatistics />,
        },
        {
            widgetName: "emergencyContact",
            widgetFunc: () => <Contact />,
        },
        {
            widgetName: "Pan",
            widgetFunc: () => <Pan />,
        },
        {
            widgetName: "Dl",
            widgetFunc: () => <Dl />,
        },
        {
            widgetName: "Passport",
            widgetFunc: () => <Passport />,
        },
        {
            widgetName: "Voter",
            widgetFunc: () => <Voter />,
        },
    ],
};

export default config;