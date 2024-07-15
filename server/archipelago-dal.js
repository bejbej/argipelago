const { Client, ITEMS_HANDLING_FLAGS, SERVER_PACKET_TYPE, CLIENT_STATUS, CLIENT_PACKET_TYPE } = require("archipelago.js");
const { toDictionary } = require("./utilities");

module.exports = class ArchipelagoDal {

    constructor(options) {
        this.callbacks = {
            hints: [],
            items: [],
            itemDefinitions: []
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
            })
            .catch(error => console.log(error));

        this.client.addListener(SERVER_PACKET_TYPE.RECEIVED_ITEMS, packet => this.#handleItems());
        this.client.addListener(SERVER_PACKET_TYPE.DATA_PACKAGE, packet => this.#handleItemDefinitions(packet));
        this.client.addListener(SERVER_PACKET_TYPE.RETRIEVED, packet => this.#handleHints());
    }

    onHints(callback) {
        this.callbacks.hints.push(callback);
    }

    onReceivedItems(callback) {
        this.callbacks.items.push(callback);
    }

    onItemDefinitions(callback) {
        this.callbacks.itemDefinitions.push(callback);
    }

    sendItem(locationId) {
        this.client.locations.check(locationId);
    }

    sendGoalStatus() {
        this.client.updateStatus(CLIENT_STATUS.GOAL);
    }

    #handleHints() {
        const hints = this.client.hints.mine;
        const mappedHints = hints
            .filter(hint => hint.receiving_player == this.client.data.slot)
            .map(hint => {
                const itemName = this.client.items.name(this.client.data.slot, hint.item);
                const player = this.client.players.get(hint.finding_player);
                const location = this.client.locations.name(player.game, hint.location);

                return {
                    itemName: itemName,
                    findingPlayer: player.alias,
                    findingLocation: location
                };
            });

        const hintByReceivingItem = toDictionary(mappedHints, hint => hint.itemName);
        this.callbacks.hints.forEach(callback => callback(hintByReceivingItem));
    }

    #handleItemDefinitions(packet) {
        const location_name_to_id = packet.data.games[this.options.game].location_name_to_id
        this.callbacks.itemDefinitions.forEach(callback => callback(location_name_to_id));
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