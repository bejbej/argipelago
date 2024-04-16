const fs = require("fs");

module.exports = class SaveDataDal {
    constructor(saveFilePath) {
        this.saveFilePath = saveFilePath;
        this.saveData = {};
        this.#loadSaveData();
        fs.watchFile(saveFilePath, () => this.#loadSaveData());
    }

    getSaveData() {
        return this.saveData;
    }

    persistSaveData() {
        fs.writeFileSync(this.saveFilePath, JSON.stringify(this.saveData, null, 2));
    }

    #loadSaveData() {
        const newSaveData = JSON.parse(fs.readFileSync(this.saveFilePath).toString());
        this.saveData = Object.assign(this.saveData, newSaveData);
    }
}
