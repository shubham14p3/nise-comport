import { createChatBotMessage } from "react-chatbot-kit";
import Overview from "../widgets/Overview";
import GlobalStatistics from "../widgets/GlobalStatistics";
import LocalStatistics from "../widgets/LocalStatistics";
import Contact from "../widgets/Contact";
import Pan from "../widgets/Pan";
import Voter from "../widgets/Voter";
import Dl from "../widgets/Dl";
import Passport from "../widgets/Passport";
import CoBotAvatar from "./CoBotAvatar";

const config = {
    lang: "no",
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
        createChatBotMessage(`Hi, I'm Help Bot! here to help you`),
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
    customComponents: { botAvatar: (props) => <CoBotAvatar {...props} /> },
    widgets: [
        {
            widgetName: "overview",
            widgetFunc: (props) => <Overview {...props} />,
            mapStateToProps: ["messages"],
        },
        {
            widgetName: "globalStatistics",
            widgetFunc: (props) => <GlobalStatistics />,
        },
        {
            widgetName: "localStatistics",
            widgetFunc: (props) => <LocalStatistics />,
        },
        {
            widgetName: "emergencyContact",
            widgetFunc: (props) => <Contact />,
        },
        {
            widgetName: "Pan",
            widgetFunc: (props) => <Pan />,
        },
        {
            widgetName: "Dl",
            widgetFunc: (props) => <Dl />,
        },
        {
            widgetName: "Passport",
            widgetFunc: (props) => <Passport />,
        },
        {
            widgetName: "Voter",
            widgetFunc: (props) => <Voter />,
        },
    ],
};

export default config;
