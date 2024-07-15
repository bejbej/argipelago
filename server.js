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

    puzzlesToSolve.forEach(puzzle => archipelagoDal.sendItem(puzzle.metadata.locationId));
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