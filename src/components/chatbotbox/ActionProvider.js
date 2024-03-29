class ActionProvider {
    constructor(createChatBotMessage, setStateFunc, createClientMessage) {
        this.createChatBotMessage = createChatBotMessage;
        this.setState = setStateFunc;
        this.createClientMessage = createClientMessage;
    }
    handleOptions = (options) => {
        const message = this.createChatBotMessage(
            "How can I help you? Below are some possible options.",
            {
                widget: "overview",
                loading: true,
                terminateLoading: true,
                ...options,
            }
        );

        this.addMessageToState(message);
    };

    handleGlobalStats = () => {
        const message = this.createChatBotMessage(
            "Here's the latest global stats.",
            {
                widget: "globalStatistics",
                loading: true,
                terminateLoading: true,
                withAvatar: true,
            }
        );

        this.addMessageToState(message);
    };

    handleLocalStats = () => {
        const message = this.createChatBotMessage(
            "Here's the latest stats in Sri Lanka.",
            {
                widget: "localStatistics",
                loading: true,
                terminateLoading: true,
                withAvatar: true,
            }
        );

        this.addMessageToState(message);
    };

    handleContact = () => {
        const message = this.createChatBotMessage(
            "Call +919835552756 for Assistance.",
            {
                widget: "emergencyContact",
                loading: true,
                terminateLoading: true,
                withAvatar: true,
            }
        );

        this.addMessageToState(message);
    };

    handleMedicine = () => {
        const message = this.createChatBotMessage(
            "To apply for Pan related query, please refer to the link below.",
            {
                widget: "Pan",
                loading: true,
                terminateLoading: true,
                withAvatar: true,
            }
        );

        this.addMessageToState(message);
    };

    handleJoke = () => {
        var jokes = [
            "So many coronavirus jokes out there, it’s a pundemic!",
            "I’ll tell you a coronavirus joke now, but you’ll have to wait two weeks to see if you got it!",
            "Did you hear the joke about coronavirus? Never mind, I don’t want to spread it around!",
            "What should you do if you don’t understand a coronavirus joke? Be patient!",
            "Why do they call it the novel coronavirus? It’s a long story...",
            "Since we’re all in quarantine I guess we’ll be making only inside jokes from now on!",
        ];

        var randomJoke = jokes[Math.floor(Math.random() * jokes.length)];

        const message = this.createChatBotMessage(randomJoke);

        this.addMessageToState(message);
    };
    // pan
    handlePan = () => {
        const message = this.createChatBotMessage(
            "To apply for Pan related queries , please refer to the link below.",
            {
                widget: "Pan",
                loading: true,
                terminateLoading: true,
                withAvatar: true,
            }
        );

        this.addMessageToState(message);
    };

    // Dl
    handleDl = () => {
        const message = this.createChatBotMessage(
            "To apply for DL related queries , please refer to the link below.",
            {
                widget: "Dl",
                loading: true,
                terminateLoading: true,
                withAvatar: true,
            }
        );

        this.addMessageToState(message);
    };

    // Voter
    handleVoter = () => {
        const message = this.createChatBotMessage(
            "To apply for Voter related queries , please refer to the link below.",
            {
                widget: "Voter",
                loading: true,
                terminateLoading: true,
                withAvatar: true,
            }
        );

        this.addMessageToState(message);
    };

    // Passport
    handlePassport = () => {
        const message = this.createChatBotMessage(
            "To apply for Passport related queries , please refer to the link below.",
            {
                widget: "Passport",
                loading: true,
                terminateLoading: true,
                withAvatar: true,
            }
        );

        this.addMessageToState(message);
    };

    handleThanks = () => {
        const message = this.createChatBotMessage(
            "You're welcome, and stay safe!"
        );

        this.addMessageToState(message);
    };

    addMessageToState = (message) => {
        this.setState((state) => ({
            ...state,
            messages: [...state.messages, message],
        }));
    };
}

export default ActionProvider;
