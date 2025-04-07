

let canvas = null;
let context = null;

const TILE_STRIDE = 48; // Distance between consecutive edges
const TILE_SIZE = 34;
const TILE_HIGHLIGHT_SIZE = 24;
const BRIDGE_WIDTH = 10;
const RADIUS = 6;
const MARGIN = 10; // Where the game board starts
const NUM_ROWS = 8;
const NUM_COLS = 8;


window.onload = function() {
    canvas = document.getElementById("c");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    context = canvas.getContext("2d");
    canvas.style.backgroundColor = "lightblue";

    render();
}

function render() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();

    drawTileHighlightList([
        [0, 0],
        [1, 1],
        [1, 0],
        [0, 1],
        [0, 2],
        [0, 3],
        [1, 3],
    ]);
}

function drawGrid() {
    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.fillStyle = "blue";

    const GAP = (TILE_STRIDE - TILE_SIZE) / 2;
    for (let row = 0; row < NUM_ROWS; row++) {
        for (let col = 0; col < NUM_COLS; col++) {
            let tileX = col * TILE_STRIDE + MARGIN + GAP;
            let tileY = row * TILE_STRIDE + MARGIN + GAP;

            context.roundRect(tileX, tileY, TILE_SIZE, TILE_SIZE, RADIUS);
            context.fill();
            context.stroke();
        }
    }
}

function drawTileHighlightList(coords) {
    let lastLoc = null;

    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.fillStyle = "#8888ee";
    const GAP = TILE_STRIDE - TILE_HIGHLIGHT_SIZE;

    for (let index = 0; index < coords.length; index++) {
        const curLoc = coords[index];
        const nextLoc = index < coords.length - 1 ? coords[index + 1] : null;
        let tileX = curLoc[0] * TILE_STRIDE + MARGIN + GAP / 2;
        let tileY = curLoc[1] * TILE_STRIDE + MARGIN + GAP / 2;
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

function deltaToDir(x, y) {
    if (x < 0) {
        if (y < 0) {
            return "NW";
        } else if (y > 0) {
            return "SW";
        } else {
            return "W";
        }
    } else if (x > 0) {
        if (y < 0) {
            return "NE";
        } else if (y > 0) {
            return "SE";
        } else {
            return "E";
        }
    } else {
        if (y < 0) {
            return "N";
        } else {
            return "S";
        }
    }
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
            highlightBridgePathHelper(x, y + TILE_STRIDE, "N", openFunc);
            break;

        case "SW":
            highlightBridgePathHelper(x - TILE_STRIDE, y + TILE_STRIDE, "NE", openFunc);
            break;

        case "W":
            highlightBridgePathHelper(x - TILE_STRIDE, y, "E", openFunc);
            break;

        case "NW":
            highlightBridgePathHelper(x - TILE_STRIDE, y - TILE_STRIDE, "SE", openFunc);
            break;

        default:
            highlightBridgePathHelper(x, y, direction, openFunc);
            break;
    }
}

function highlightBridgePathHelper(x, y, direction, openFunc) {
    let centerX = x + TILE_HIGHLIGHT_SIZE / 2;
    let centerY = y + TILE_HIGHLIGHT_SIZE / 2;
    const GAP = TILE_STRIDE - TILE_HIGHLIGHT_SIZE;

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
