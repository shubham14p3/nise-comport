class MessageParser {
    constructor(actionProvider, state) {
        this.actionProvider = actionProvider;
        this.state = state;
    }

    parse(message) {
        const normalizedMessage = message.toLowerCase();

        if (
            normalizedMessage.includes("options") ||
            normalizedMessage.includes("help") ||
            normalizedMessage.includes("do for me")
        ) {
            return this.actionProvider.handleOptions({ withAvatar: true });
        }

        if (
            normalizedMessage.includes("talk") ||
            normalizedMessage.includes("speak") ||
            normalizedMessage.includes("real person") ||
            normalizedMessage.includes("call") ||
            normalizedMessage.includes("emergency") ||
            normalizedMessage.includes("contact")
        ) {
            return this.actionProvider.handleContact();
        }

        if (
            normalizedMessage.includes("joke") ||
            normalizedMessage.includes("jokes") ||
            normalizedMessage.includes("funny")
        ) {
            return this.actionProvider.handleJoke();
        }

        if (
            normalizedMessage.includes("pan") ||
            normalizedMessage.includes("uti") ||
            normalizedMessage.includes("nsdl") ||
            normalizedMessage.includes("pan center") ||
            normalizedMessage.includes("permanent account number")
        ) {
            return this.actionProvider.handlePan();
        }

        if (
            normalizedMessage.includes("voter") ||
            normalizedMessage.includes("nvsp") ||
            normalizedMessage.includes("election") ||
            normalizedMessage.includes("enrol") ||
            normalizedMessage.includes("new voter apply") ||
            normalizedMessage.includes("voter correction") ||
            normalizedMessage.includes("voter photo change")
        ) {
            return this.actionProvider.handleVoter();
        }

        if (
            normalizedMessage.includes("dl") ||
            normalizedMessage.includes("driving lincese") ||
            normalizedMessage.includes("driving license") ||
            normalizedMessage.includes("two wheeler license") ||
            normalizedMessage.includes("four wheeler license") ||
            normalizedMessage.includes("license") ||
            normalizedMessage.includes("jharkhand license") ||
            normalizedMessage.includes("learner license") ||
            normalizedMessage.includes("renewal driving lincese") ||
            normalizedMessage.includes("heavy license")
        ) {
            return this.actionProvider.handleDl();
        }

        if (
            normalizedMessage.includes("passport") ||
            normalizedMessage.includes("passport apply") ||
            normalizedMessage.includes("passport renewal")
        ) {
            return this.actionProvider.handlePassport();
        }

        if (
            normalizedMessage.includes("thanks") ||
            normalizedMessage.includes("thank you")
        ) {
            return this.actionProvider.handleThanks();
        }

        return this.actionProvider.handleOptions({ withAvatar: true });
    }
}

export default MessageParser;