class MessageParser {
    constructor(actionProvider, state) {
        this.actionProvider = actionProvider;
        this.state = state;
    }

    parse(message) {
        message = message.toLowerCase();
        console.log(message);

        if (
            message.includes("options") ||
            message.includes("help") ||
            message.includes("do for me")
        ) {
            return this.actionProvider.handleOptions({ withAvatar: true });
        }

        if (
            message.includes("talk") ||
            message.includes("speak") ||
            message.includes("real person") ||
            message.includes("call") ||
            message.includes("emergency") ||
            message.includes("contact")
        ) {
            return this.actionProvider.handleContact();
        }

        // if (
        //     message.includes("stats") ||
        //     message.includes("statistics") ||
        //     message.includes("deaths")
        // ) {
        //     return [
        //         this.actionProvider.handleGlobalStats(),
        //         this.actionProvider.handleLocalStats(),
        //     ];
        // }

        // if (message.includes("medicine") || message.includes("delivery")) {
        //     return this.actionProvider.handleMedicine();
        // }

        if (
            message.includes("joke") ||
            message.includes("jokes") ||
            message.includes("funny")
        ) {
            return this.actionProvider.handleJoke();
        }
        // Pan
        if (
            message.includes("PAN") ||
            message.includes("pan") ||
            message.includes("Pan") ||
            message.includes("UTI") ||
            message.includes("NSDL") ||
            message.includes("Pan CENTER") ||
            message.includes("pan Center") ||
            message.includes("PAN CENTER") ||
            message.includes("Permanent Account Number") ||
            message.includes("PAN")
        ) {
            return this.actionProvider.handlePan();
        }
        // Voter
        if (
            message.includes("Voter") ||
            message.includes("voter") ||
            message.includes("NVSP") ||
            message.includes("nvsp") ||
            message.includes("VOTER") ||
            message.includes("Election") ||
            message.includes("Enrol") ||
            message.includes("New Voter Apply") ||
            message.includes("Voter Correction") ||
            message.includes("Voter Photo Change")
        ) {
            return this.actionProvider.handleVoter();
        }
        // DL
        if (
            message.includes("DL") ||
            message.includes("driving Lincese") ||
            message.includes("two wheeler license") ||
            message.includes("four wheeler license") ||
            message.includes("License") ||
            message.includes("Jharkhand License") ||
            message.includes("Learner License") ||
            message.includes("Renewal Driving Lincese") ||
            message.includes("Heavy License") ||
            message.includes("DRIVING LICENSE")
        ) {
            return this.actionProvider.handleDl();
        }

        if (message.includes("thanks") || message.includes("thank you")) {
            return this.actionProvider.handleThanks();
        }

        return this.actionProvider.handleOptions({ withAvatar: true });
    }
}

export default MessageParser;
