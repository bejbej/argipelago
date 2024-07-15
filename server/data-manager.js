const { toDictionary } = require("./utilities.js");

module.exports = class DataManager {
    constructor(saveDataDal, archipelagoDal) {
        archipelagoDal.onHints(hintByItemName => {
            const puzzles = saveDataDal.getSaveData().puzzles;
            puzzles.forEach(puzzle => {
                const hint = hintByItemName[puzzle.receivingItem];
                if (hint) {
                    puzzle.metadata = {
                        ...puzzle.metadata,
                        findingPlayer: hint.findingPlayer,
                        findingLocation: hint.findingLocation
                    };
                }
            })
        
            saveDataDal.persistSaveData();
        });
        
        archipelagoDal.onItemDefinitions(itemNameToLocationId => {
            const puzzles = saveDataDal.getSaveData().puzzles;
            puzzles.forEach(puzzle => {
                const locationId = itemNameToLocationId[puzzle.sendingItem];
                if (locationId) {
                    puzzle.metadata = {
                        ...puzzle.metadata,
                        locationId: locationId
                    };
                }
            });
        
            saveDataDal.persistSaveData();
        })
        
        archipelagoDal.onReceivedItems(items => {
            const puzzles = saveDataDal.getSaveData();
            const puzzleByItemName = toDictionary(puzzles, puzzle => puzzle.receivingItem);
            items.forEach(item => {
                const puzzle = puzzleByItemName[item.itemName];
                puzzle.isFound = true;
            });
        
            saveDataDal.persistSaveData();
        });
    }
}
