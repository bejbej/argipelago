const { Client, ITEMS_HANDLING_FLAGS, SERVER_PACKET_TYPE, CLIENT_STATUS } = require("archipelago.js");

module.exports = class ArchipelagoDal {

    constructor(options) {
        this.callbacks = {
            hints: [],
            items: []
        };
        this.options = options;
        this.client = new Client();

        const connectionInfo = {
            ...options,
            items_handling: ITEMS_HANDLING_FLAGS.REMOTE_ALL,
        };

        this.client.connect(connectionInfo)
            .then(() => {
                console.log("Archipelago running");
                this.#handleHints();
            })
            .catch(error => console.log(error));

        this.client.addListener(SERVER_PACKET_TYPE.RECEIVED_ITEMS, packet => this.#handleItems());
    }

    onReceivedHints(callback) {
        this.callbacks.hints.push(callback);
    }

    onReceivedItems(callback) {
        this.callbacks.items.push(callback);
    }

    sendItem(locationId) {
        this.client.locations.check(locationId);
    }

    sendGoalStatus() {
        this.client.updateStatus(CLIENT_STATUS.GOAL);
    }

    #handleHints() {
        const hints = this.client.hints.mine;
        hints.map(hint => {
            const itemName = this.client.items.name(hint.item);
            const player = this.client.players.get(hint.finding_player);
            const location = this.client.locations.get(player.game, hint.location);

            return {
                itemName: itemName,
                playerName: player.name,
                locationName: location.name,
                locationId: location.locationId
            };
        });
        this.callbacks.hints.forEach(callback => callback(hints));
    }

    #handleItems() {
        const items = this.client.items.received
            .filter(item => item.location > -1)
            .map(item => {
                const itemName = this.client.items.name(this.options.game, item.item)

                return {
                    itemName: itemName
                };
            });
        this.callbacks.items.forEach(callback => callback(items));
    }
}