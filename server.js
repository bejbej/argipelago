require('env2')('./env.json');
const Express = require("express");
const bodyParser = require('body-parser');
const nocache = require('nocache');
const fs = require("fs");
const SaveDataDal = require("./server/save-file-dal.js");
const ArchipelagoDal = require("./server/archipelago-dal.js");
const DataManager = require('./server/data-manager.js');

const saveDataDal = new SaveDataDal(process.env.saveFile);
const archipelagoDal = new ArchipelagoDal({
    hostname: process.env.archipelago_hostname,
    port: parseInt(process.env.archipelago_port),
    game: process.env.archipelago_game,
    name: process.env.archipelago_name
});
const dataManager = new DataManager(saveDataDal, archipelagoDal);

const app = Express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(nocache());
app.set("etag", false);

app.get("/api/puzzles", function(request, response) {
    const puzzles = saveDataDal.getSaveData().puzzles;
    const sanitizedPuzzles = puzzles.map(puzzle => {
        const location = puzzle.metadata ? `${puzzle.metadata.findingPlayer} - ${puzzle.metadata.findingLocation}` : "Location Unknown";

        return {
            item: puzzle.receivingItem,
            location: location,
            url: puzzle.isFound ? puzzle.url : undefined,
            isFound: puzzle.isFound,
            isSolved: puzzle.isSolved
        };
    });
    
    response.send(sanitizedPuzzles);
});

app.get("/api/finale", function(request, response) {
    const fileNames = [
        "98f8c612-4b88-4d24-af41-010a2c1f2014", 
        "5c1fb56c-cdbf-4577-9e21-29ac96b067dc", 
        "0000de43-e5fb-4500-a673-58756adb64e6", 
        "76fce6d2-865e-44e9-860f-b91e88d6f79f", 
        "37e67939-e00b-419f-beb3-c3901b6e271f", 
        "568d70a1-887f-49e2-b487-6073aadf5205", 
        "986fa20d-cf59-4934-ab8b-002e0834ca8e", 
        "f4620688-64f6-4ca6-92e2-ffc1a1b7151b",
        "d5cdc02d-3e60-4ef3-884c-e66882cbdd28",
        "a8322d66-52ff-44d7-84e6-bd04ba90bd7e"
    ];
    const puzzles = saveDataDal.getSaveData().puzzles;
    const numberOfUnsolvedPuzzles = puzzles.filter(puzzle => !puzzle.isSolved).length;
    const fileNameIndex = Math.max(fileNames.length - 1 - numberOfUnsolvedPuzzles, 0);
    const fileName = fileNames[fileNameIndex] + ".png";
    response.send({
        fileName: fileName
    });
});

app.post("/*", function(request, response) {
    const password = request.body.password;
    const puzzles = saveDataDal.getSaveData().puzzles;
    const puzzlesToSolve = puzzles.filter(puzzle => puzzle.solution === password && puzzle.isFound);
    if (puzzlesToSolve.length === 0) {
        response.redirect("/dead-end");
        return;
    }

    puzzlesToSolve.forEach(puzzle => puzzle.isSolved = true);
    saveDataDal.persistSaveData();

    puzzlesToSolve.forEach(puzzle => {
        if (puzzle.metadata) {
            archipelagoDal.sendItem(puzzle.metadata.locationId);
        }
    });
    if (puzzles.every(puzzle => puzzle.isSolved)) {
        archipelagoDal.sendGoalStatus();
    }

    response.redirect(process.env.default_url);
});

app.get('/', function(request, response) {
    response.redirect(process.env.default_url);
});

app.get('/*', function(request, response) {
    if (request.params[0].slice(-1) === "/") {
        response.sendFile(`${__dirname}/pages/${request.params[0]}/index.html`);
    }
    else if (request.params[0].includes(".")) {
        response.sendFile(`${__dirname}/pages/${request.params[0]}`);
    }
    else {
        const htmlFileName = `${__dirname}/pages/${request.params[0]}.html`;
        if (fs.existsSync(htmlFileName)) {
            response.sendFile(htmlFileName);
        }
        else if (fs.existsSync(`${__dirname}/pages/${request.params[0]}/index.html`)) {
            response.redirect(`${request.params[0]}/`);
        }
        else {
            response.sendFile(`${__dirname}/pages/dead-end/index.html`);
        }
    }
});

app.listen(process.env.port, function() {
    console.log(`Example app listening on port ${process.env.port}!`);
});