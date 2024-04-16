const fs = require("fs");

module.exports = class SyncedFile {
    constructor(filename) {
        this.filename = filename;
        this.#loadData();
        fs.watchFile(filename, () => this.#loadData());
    }

    get contents() {
        return this.contents;
    }

    set contents(value) {
        this.data = value;
        fs.writeFileSync(filename, JSON.stringify(this.data, null, 2));
    }

    save() {
        fs.writeFileSync(filename, JSON.stringify(this.data, null, 2));
    }

    #loadData() {
        this.data = JSON.parse(fs.readFileSync(this.filename).toString());
    }
}