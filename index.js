//
// Copyright 2025 Jeff Bush
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

let canvas = null;
let context = null;

const TILE_SPACING = 55; // Distance between neighboring edges
const TILE_SIZE = 40;
const TILE_HIGHLIGHT_SIZE = 30;
const TILE_FONT = "20px monospace";
const BRIDGE_WIDTH = 10;
const RADIUS = 8;
const MARGIN = 10; // Where the game board starts
const NUM_ROWS = 10;
const NUM_COLS = 10;
const BACKGROUND_COLOR = "#76b4b9";
const TILE_COLOR = "#e8e8e8";
const VALID_HIGHLIGHT_COLOR = "#25e44d";
const INVALID_HIGHLIGHT_COLOR = "#fb0202";
const LINE_COLOR = "#000000";
const GRID_COLOR = "#808080";
const ROUND_DURATION_S = 120;

const INST_FONT = "14px monospace";
const INST_LEFT = NUM_COLS * TILE_SPACING + MARGIN * 2;
const INST_TOP = 200;
const INSTRUCTIONS = `Click on a tile to begin selection, then drag
    horizontally and diagonally to adjacent letters to form words.
    Try to create longer words, which are worth more points.
    You must clear enough lines to get to the next level.`;
let wrappedInstructions = "";
let instLineHeight = 0;

let highlightList = [];
let highlightedCells = {};
let currentWord = "";
let currentWordValid = false;
let gridContents = [];
let validWords = [];
let totalWords = 0;
let score = 0;
let clearedLines = 0;
let startTime = null;
let nextRound = null;
let level = 1;

// Generated by make_freq_table.py
const FREQ_TABLE = [
    ['Q', 0.0019], ['J', 0.004], ['X', 0.0067], ['Z', 0.0111], ['W', 0.0202],
    ['K', 0.0299], ['V', 0.0399], ['F', 0.0539], ['Y', 0.0699], ['B', 0.0899],
    ['H', 0.1129], ['M', 0.1399], ['P', 0.1679], ['G', 0.1979], ['U', 0.2309],
    ['D', 0.2689], ['C', 0.3089], ['L', 0.3619], ['O', 0.4229], ['T', 0.4899],
    ['N', 0.5619], ['R', 0.6349], ['A', 0.7129], ['I', 0.7989], ['S', 0.8859],
    ['E', 1.0]
]

window.onload = function() {
    canvas = document.getElementById("c");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    context = canvas.getContext("2d");
    canvas.style.backgroundColor = BACKGROUND_COLOR;

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("keydown", handleKeyDown);

    fetch('words.json')
        .then(response => response.json())
        .then(response => valid_words = response)
        .catch(error => {
            alert("Error loading word list from server");
        });

    context.fillStyle = "black";
    context.font = INST_FONT;
    [wrappedInstructions, instLineHeight] = wrapText(INSTRUCTIONS,
        canvas.width - MARGIN - INST_LEFT);

    resetGame();
    setInterval(heartBeat, 1000);
}

function heartBeat() {
    if (Date.now() >= nextRound - 2) {
        if (clearedLines >= level || level >= NUM_ROWS + NUM_COLS) {
            // XXX Display interstitial screen
            level++;
            resetGrid();
        } else {
            // XXX display game over
            resetGame();
        }
    }

    draw();
}

function resetGame() {
    startTime = Date.now();
    nextRound = startTime;
    level = 1;
    resetGrid();
}

function resetGrid() {
    gridContents = [];
    clearedLines = 0;
    for (let i = 0; i < NUM_ROWS * NUM_COLS; i++) {
        gridContents.push(generateRandomLetter());
    }

    resetSelection();
    nextRound += ROUND_DURATION_S * 1000;
    draw();
}

function isValidWord(word) {
    if (word.lenght < 3) {
        return false;
    }

    let low = 0;
    let high = valid_words.length - 1;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (word == valid_words[mid]) {
            return true;
        }

        if (word > valid_words[mid]) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    return false;
}

function generateRandomLetter() {
    const num = Math.random();
    let low = 0;
    let high = FREQ_TABLE.length - 1;
    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (num > FREQ_TABLE[mid][1]) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    return FREQ_TABLE[low][0];
}

function testRandomGen() {
    const TOTAL_TRIALS = 100000;
    let freqTable = {};
    for (let i = 0; i < TOTAL_TRIALS; i++) {
        const x = generateRandomLetter();
        if (x in freqTable) {
            freqTable[x] += 1;
        } else {
            freqTable[x] = 1;
        }
    }

    for (const key in freqTable) {
        console.log(key, freqTable[key] / TOTAL_TRIALS * 100);
    }
}

function locationToColRow(x, y) {
    let gridCol = Math.floor((x - MARGIN) / TILE_SPACING);
    let gridRow = Math.floor((y - MARGIN) / TILE_SPACING);

    if (gridCol < 0 || gridCol >= NUM_COLS || gridRow < 0 || gridRow >= NUM_ROWS) {
        return null;
    }

    const pad = (TILE_SPACING - TILE_SIZE) / 2;

    // Check if this is inside the tile.
    let tileLeft = gridCol * TILE_SPACING + MARGIN + pad;
    let tileTop = gridRow * TILE_SPACING + MARGIN + pad;
    let tileRight = tileLeft + TILE_SIZE;
    let tileBottom = tileTop + TILE_SIZE;

    if (x >= tileLeft && x <= tileRight && y >= tileTop && y <= tileBottom) {
        return [gridCol, gridRow];
    }

    return null;
}

function handleSwipe(x, y) {
    const gridLoc = locationToColRow(x, y);
    if (!gridLoc || getLetterAt(gridLoc[1], gridLoc[0]) == " ") {
        return;
    }

    if ((gridLoc in highlightedCells)) {
        // Check if we are undoing the last move
        if (highlightList.length > 1) {
            const prevCell = highlightList[highlightList.length - 2];
            if (prevCell[0] == gridLoc[0] && prevCell[1] == gridLoc[1]) {
                delete highlightedCells[highlightList.pop()];
                currentWord = currentWord.substring(0, currentWord.length - 1);
                currentWordValid = isValidWord(currentWord);
                draw();
            }
        }
    } else if (highlightList.length == 0 || isAdjacent(highlightList[highlightList.length - 1], gridLoc)) {
        // Add new cell
        highlightedCells[gridLoc] = true;
        highlightList.push(gridLoc);
        currentWord = currentWord + getLetterAt(gridLoc[1], gridLoc[0]);
        currentWordValid = isValidWord(currentWord);
        draw();
    }
}

function resetSelection() {
    highlightedCells = {};
    highlightList = [];
    currentWord = "";
    currentWordValid = false;
}

function handleKeyDown(event) {
    console.log("handleKeyDown", event);
    if (event.key === "Escape") {
        resetSelection();
        draw();
    }
}

function isAdjacent(coord1, coord2) {
    return Math.abs(coord1[0] - coord2[0]) < 2 && Math.abs(coord1[1] - coord2[1]) < 2;
}

function handleMouseDown(event) {
    handleSwipe(event.clientX, event.clientY);
}

function handleMouseMove(event) {
    if (event.buttons & 1) {
        handleSwipe(event.clientX, event.clientY);
    }
}

function handleMouseUp(event) {
    if (currentWordValid) {
        totalWords += 1;

        // Reward longer words. A 3 letter word is worth 1+2+3 = 6
        // A four letter is 1+2+3+4 = 10, five is 1+2+3+4+5=15
        const n = currentWord.length;
        score += Math.floor((n * (n + 1)) / 2);
        removeHighlightedLetters();
        compressTiles();
    }

    resetSelection();

    draw();
}

function getLetterAt(row, col) {
    return gridContents[row * NUM_COLS + col];
}

function setLetterAt(row, col, value) {
    gridContents[row * NUM_COLS + col] = value;
}

function removeHighlightedLetters() {
    for (let index = 0; index < highlightList.length; index++) {
        const [col, row] = highlightList[index];
        setLetterAt(row, col, " ");
    }
}

function compressTiles() {
    dropTiles();
    clearedLines = 0;
    for (let row = 0; row < NUM_ROWS; row++) {
        if (!isRowEmpty(row)) {
            break;
        }

        clearedLines++;
    }

    clearedLines += removeEmptyColumns();

    // XXX if there are new cleared lines, should play a sound effect or
    // display some sort of visual indication.
}

function dropTiles() {
    for (let col = 0; col < NUM_COLS; col++) {
        let srcRow = NUM_ROWS - 1;
        let destRow = srcRow;
        while (srcRow >= 0) {
            const val = getLetterAt(srcRow, col);
            if (val != " ") {
                if (srcRow != destRow) {
                    setLetterAt(destRow, col, val);
                }

                destRow--;
            }

            srcRow--;
        }

        while (destRow >= 0) {
            setLetterAt(destRow--, col, " ");
        }
    }
}

function removeEmptyColumns() {
    let emptyColumns = 0;

    // Assumes even number of columns
    let destRight = NUM_COLS / 2;
    let srcRight = destRight;
    while (srcRight < NUM_COLS) {
        if (!isColumnEmpty(srcRight)) {
            copyColumn(srcRight, destRight);
            destRight++;
        }

        srcRight++;
    }

    while (destRight < NUM_COLS) {
        clearColumn(destRight);
        destRight++;
        emptyColumns++;
    }

    let destLeft = NUM_COLS / 2 - 1;
    let srcLeft = destLeft;
    while (srcLeft >= 0) {
        if (!isColumnEmpty(srcLeft)) {
            copyColumn(srcLeft, destLeft);
            destLeft--;
        }

        srcLeft--;
    }

    while (destLeft >= 0) {
        clearColumn(destLeft);
        destLeft--;
        emptyColumns++;
    }

    return emptyColumns;
}

function isColumnEmpty(col) {
    return everyRange(NUM_ROWS, row => getLetterAt(row, col) === " ");
}

function isRowEmpty(row) {
    return everyRange(NUM_COLS, col => getLetterAt(row, col) === " ");
}

function copyColumn(fromCol, toCol) {
    if (fromCol == toCol) {
        return;
    }

    for (let row = 0; row < NUM_ROWS; row++) {
        setLetterAt(row, toCol, getLetterAt(row, fromCol));
    }
}

function clearColumn(col) {
    for (let row = 0; row < NUM_ROWS; row++) {
        setLetterAt(row, col, " ");
    }
}

function everyRange(n, fn) {
    for (let i = 0; i < n; i++) {
        if (!fn(i)) {
            return false;
        }
    }

    return true;
}

function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.reset(); // Hack, the last path is being re-rendered
    drawGrid();
    drawTileHighlightList(highlightList);
    drawLetters();
    drawCurrentWord();
    drawScore();
    drawInstructions();
}

function drawScore() {
    const scorePaneLeft = NUM_COLS * TILE_SPACING + MARGIN * 2;

    context.fillStyle = "black";
    context.fillText("Level: " + level, scorePaneLeft, 25);
    context.fillText("Total Words: " + totalWords, scorePaneLeft, 50);
    context.fillText("Score: " + score, scorePaneLeft, 75);
    context.fillText("Lines: " + clearedLines + "/" + level, scorePaneLeft, 100);

    // Note round ends when time hits zero, hence minus one
    const remaining = Math.floor((nextRound - Date.now()) / 1000);
    const seconds = remaining % 60;
    const minutes = Math.floor(remaining / 60);

    if (remaining < 5) {
        context.fillStyle = "red";
    }

    context.fillText("Time: " + minutes + ":" + String(seconds).padStart(2, "0"), scorePaneLeft, 125);
}

function wrapText(inText, totalWidth) {
    const metrics = context.measureText("M");
    const lineHeight = metrics.fontBoundingBoxAscent;
    const words = inText.split(' ');
    let lines = [];
    let currentLine = "";
    let x = 0;
    for (const word of words) {
        const trimmed = word.trim() + " ";
        const wordWidth = context.measureText(trimmed).width;
        if (x + wordWidth > totalWidth) {
            x = 0;
            lines.push(currentLine);
            currentLine = "";
        }

        currentLine += trimmed;
        x += wordWidth;
    }

    if (currentLine.length > 0) {
        lines.push(currentLine);
    }

    return [lines, lineHeight];
}

function drawInstructions() {
    context.fillStyle = "black";
    context.font = INST_FONT;
    let y = INST_TOP;
    for (const line of wrappedInstructions) {
        context.fillText(line, INST_LEFT, y);
        y += instLineHeight;
    }
}

function drawGrid() {
    context.lineWidth = 1;
    context.strokeStyle = GRID_COLOR;

    const GAP = (TILE_SPACING - TILE_SIZE) / 2;
    for (let row = 0; row <= NUM_ROWS; row++) {
        const y = TILE_SPACING * row + MARGIN;
        context.beginPath();
        context.moveTo(MARGIN, y);
        context.lineTo(MARGIN + NUM_COLS * TILE_SPACING, y);
        context.stroke();
    }

    for (let col = 0; col <= NUM_COLS; col++) {
        const x = TILE_SPACING * col + MARGIN;
        context.beginPath();
        context.moveTo(x, MARGIN);
        context.lineTo(x, MARGIN + NUM_ROWS * TILE_SPACING);
        context.stroke();
    }

    context.strokeStyle = LINE_COLOR;
    context.fillStyle = TILE_COLOR;

    for (let row = 0; row < NUM_ROWS; row++) {
        for (let col = 0; col < NUM_COLS; col++) {
            let tileX = col * TILE_SPACING + MARGIN + GAP;
            let tileY = row * TILE_SPACING + MARGIN + GAP;

            if (getLetterAt(row, col) != " ") {
                context.beginPath();
                context.roundRect(tileX, tileY, TILE_SIZE, TILE_SIZE, RADIUS);
                context.fill();
                context.stroke();
            }
        }
    }
}

function drawLetters() {
    context.font = TILE_FONT;
    context.fillStyle = LINE_COLOR;
    for (let row = 0; row < NUM_ROWS; row++) {
        for (let col = 0; col < NUM_COLS; col++) {
            const letter = getLetterAt(row, col);
            context.fillText(letter,
                col * TILE_SPACING + MARGIN + TILE_SPACING / 2 - 8,
                row * TILE_SPACING + MARGIN + TILE_SPACING / 2 + 6);
        }
    }
}

function drawCurrentWord() {
    if (currentWord != "") {
        const metrics = context.measureText(currentWord);
        const left = (NUM_COLS * TILE_SPACING - metrics.width) / 2 + MARGIN;
        context.fillText(currentWord, left, MARGIN + TILE_SPACING * NUM_ROWS + 20);
    }
}

function drawTileHighlightList(coords) {
    let lastLoc = null;

    context.strokeStyle = LINE_COLOR;
    context.lineWidth = 1;
    if (currentWordValid) {
        context.fillStyle = VALID_HIGHLIGHT_COLOR;
    } else {
        context.fillStyle = INVALID_HIGHLIGHT_COLOR;
    }

    const GAP = TILE_SPACING - TILE_HIGHLIGHT_SIZE;

    for (let index = 0; index < coords.length; index++) {
        const curLoc = coords[index];
        const nextLoc = index < coords.length - 1 ? coords[index + 1] : null;
        let tileX = curLoc[0] * TILE_SPACING + MARGIN + GAP / 2;
        let tileY = curLoc[1] * TILE_SPACING + MARGIN + GAP / 2;
        let bridges = {};

        if (lastLoc != null) {
            bridges[deltaToDir(lastLoc[0] - curLoc[0], lastLoc[1]- curLoc[1])] = true;
        }

        if (nextLoc != null) {
            bridges[deltaToDir(nextLoc[0] - curLoc[0], nextLoc[1] - curLoc[1])] = true;
        }

        drawTileHighlight(tileX, tileY, bridges);

        if (nextLoc != null) {
            drawHighlightBridge(tileX, tileY, deltaToDir(nextLoc[0] - curLoc[0], nextLoc[1] - curLoc[1]));
        }

        lastLoc = curLoc;
    }
}

const DIRECTIONS = [
    "NW", "N", "NE",
    "W",  "",  "E",
    "SW", "S", "SE"
];

function deltaToDir(x, y) {
    const index = ((Math.sign(y) + 1) * 3) + Math.sign(x) + 1;
    return DIRECTIONS[index];
}

function drawTileHighlight(x, y, connectivity) {
    context.beginPath();
    tileHighlightPath(x, y, connectivity);
    context.stroke();

    context.beginPath();
    context.roundRect(x, y, TILE_HIGHLIGHT_SIZE, TILE_HIGHLIGHT_SIZE, RADIUS);
    context.fill();
}

function tileHighlightPath(x, y, connectivity) {
    context.moveTo(x + RADIUS, y);
    if (connectivity.N) {
        context.lineTo(x + (TILE_HIGHLIGHT_SIZE - BRIDGE_WIDTH) / 2, y);
        context.moveTo(x + (TILE_HIGHLIGHT_SIZE + BRIDGE_WIDTH) / 2, y);
    }

    context.lineTo(x + TILE_HIGHLIGHT_SIZE - RADIUS, y);
    if (connectivity.NE) {
        context.moveTo(x + TILE_HIGHLIGHT_SIZE, y + RADIUS);
    } else {
        context.arcTo(x + TILE_HIGHLIGHT_SIZE, y, x + TILE_HIGHLIGHT_SIZE, y + RADIUS, RADIUS);
    }

    if (connectivity.E) {
        context.lineTo(x + TILE_HIGHLIGHT_SIZE, y + (TILE_HIGHLIGHT_SIZE - BRIDGE_WIDTH) / 2);
        context.moveTo(x + TILE_HIGHLIGHT_SIZE, y + (TILE_HIGHLIGHT_SIZE + BRIDGE_WIDTH) / 2);
        context.lineTo(x + TILE_HIGHLIGHT_SIZE, y + TILE_HIGHLIGHT_SIZE - RADIUS);
    } else {
        context.lineTo(x + TILE_HIGHLIGHT_SIZE, y + TILE_HIGHLIGHT_SIZE - RADIUS);
    }

    if (connectivity.SE) {
        context.moveTo(x + TILE_HIGHLIGHT_SIZE - RADIUS, y + TILE_HIGHLIGHT_SIZE);
    } else {
        context.arcTo(x + TILE_HIGHLIGHT_SIZE, y + TILE_HIGHLIGHT_SIZE, x + TILE_HIGHLIGHT_SIZE - RADIUS, y + TILE_HIGHLIGHT_SIZE, RADIUS);
    }

    if (connectivity.S) {
        context.lineTo(x + (TILE_HIGHLIGHT_SIZE + BRIDGE_WIDTH) / 2, y + TILE_HIGHLIGHT_SIZE);
        context.moveTo(x + (TILE_HIGHLIGHT_SIZE - BRIDGE_WIDTH) / 2, y + TILE_HIGHLIGHT_SIZE);
        context.lineTo(x + RADIUS, y + TILE_HIGHLIGHT_SIZE);
    } else {
        context.lineTo(x + RADIUS, y + TILE_HIGHLIGHT_SIZE);
    }

    if (connectivity.SW) {
        context.moveTo(x, y + TILE_HIGHLIGHT_SIZE - RADIUS);
    } else {
        context.arcTo(x, y + TILE_HIGHLIGHT_SIZE, x, y + TILE_HIGHLIGHT_SIZE - RADIUS, RADIUS);
    }

    if (connectivity.W) {
        context.lineTo(x, y + (TILE_HIGHLIGHT_SIZE + BRIDGE_WIDTH) / 2);
        context.moveTo(x, y + (TILE_HIGHLIGHT_SIZE - BRIDGE_WIDTH) / 2);
        context.lineTo(x, y + RADIUS);
    } else {
        context.lineTo(x, y + RADIUS);
    }

    if (connectivity.NW) {
        context.moveTo(x + RADIUS, y);
    } else {
        context.arcTo(x, y, x + RADIUS, y, RADIUS);
    }
}

function drawHighlightBridge(x, y, direction) {
    context.beginPath();
    highlightBridgePath(x, y, direction, (x, y) => context.moveTo(x, y));
    context.stroke();

    context.beginPath();
    highlightBridgePath(x, y, direction, (x, y) => context.lineTo(x, y));
    context.closePath();
    context.fill();
}

function highlightBridgePath(x, y, direction, openFunc) {
    switch (direction) {
        case "S":
            highlightBridgePathHelper(x, y + TILE_SPACING, "N", openFunc);
            break;

        case "SW":
            highlightBridgePathHelper(x - TILE_SPACING, y + TILE_SPACING, "NE", openFunc);
            break;

        case "W":
            highlightBridgePathHelper(x - TILE_SPACING, y, "E", openFunc);
            break;

        case "NW":
            highlightBridgePathHelper(x - TILE_SPACING, y - TILE_SPACING, "SE", openFunc);
            break;

        default:
            highlightBridgePathHelper(x, y, direction, openFunc);
            break;
    }
}

function highlightBridgePathHelper(x, y, direction, openFunc) {
    let centerX = x + TILE_HIGHLIGHT_SIZE / 2;
    let centerY = y + TILE_HIGHLIGHT_SIZE / 2;
    const GAP = TILE_SPACING - TILE_HIGHLIGHT_SIZE;

    switch (direction) {
        case "N": {
            const left = centerX - BRIDGE_WIDTH / 2;
            const right = centerX + BRIDGE_WIDTH / 2;
            context.moveTo(left, y);
            context.lineTo(left, y - GAP);
            openFunc(right, y - GAP);
            context.lineTo(right, y);
            break;
        }

        case "NE": {
            context.moveTo(x + TILE_HIGHLIGHT_SIZE, y + RADIUS);
            context.lineTo(x + TILE_HIGHLIGHT_SIZE + GAP + RADIUS, y - GAP);
            openFunc(x + TILE_HIGHLIGHT_SIZE + GAP, y - GAP - RADIUS);
            context.lineTo(x + TILE_HIGHLIGHT_SIZE - RADIUS, y);
            break;
        }

        case "E": {
            const top = centerY - BRIDGE_WIDTH / 2;
            const bottom = centerY + BRIDGE_WIDTH / 2;
            context.moveTo(x + TILE_HIGHLIGHT_SIZE, top);
            context.lineTo(x + TILE_HIGHLIGHT_SIZE + GAP, top);
            openFunc(x + TILE_HIGHLIGHT_SIZE + GAP, bottom);
            context.lineTo(x + TILE_HIGHLIGHT_SIZE, bottom);
            break;
        }

        case "SE": {
            context.moveTo(x + TILE_HIGHLIGHT_SIZE, y + TILE_HIGHLIGHT_SIZE - RADIUS);
            context.lineTo(x + TILE_HIGHLIGHT_SIZE + GAP + RADIUS, y + TILE_HIGHLIGHT_SIZE + GAP);
            openFunc(x + TILE_HIGHLIGHT_SIZE + GAP, y + TILE_HIGHLIGHT_SIZE + GAP + RADIUS);
            context.lineTo(x + TILE_HIGHLIGHT_SIZE - RADIUS, y + TILE_HIGHLIGHT_SIZE);
            break;
        }
    }
}
