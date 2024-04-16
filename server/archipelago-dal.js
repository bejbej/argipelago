const { Client, ITEMS_HANDLING_FLAGS, SERVER_PACKET_TYPE, CLIENT_STATUS } = require("archipelago.js");

module.exports = class ArchipelagoDal {

    constructor(options) {
        this.callbacks = [];
        this.options = options;
        this.client = new Client();

        const connectionInfo = {
            ...options,
            items_handling: ITEMS_HANDLING_FLAGS.REMOTE_ALL,
        };

        this.client.connect(connectionInfo)
            .then(() => {
                console.log("Archipelago running");
            })
            .catch(error => console.log(error));

        this.client.addListener(SERVER_PACKET_TYPE.RECEIVED_ITEMS, packet => this.#handleItems());
    }

    onReceivedItems(callback) {
        this.callbacks.push(callback);;
    }

    sendItem(locationId) {
        this.client.locations.check(locationId);
    }

    sendGoalStatus() {
        this.client.updateStatus(CLIENT_STATUS.GOAL);
    }

    #handleItems() {
        const items = this.client.items.received
            .filter(item => item.location > -1)
            .map(item => {
                const name = this.client.items.name(this.options.game, item.item)
                const player = this.client.players.get(item.player);
                const location = this.client.locations.name(player.game, item.location);

                return {
                    name: name,
                    player: player.name,
                    location: location
                };
            });
        this.callbacks.forEach(callback => callback(items));
    }
}