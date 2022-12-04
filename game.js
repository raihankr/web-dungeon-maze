const canvas = document.querySelector('#game'),
    ctx = canvas.getContext('2d');

canvas.width = 400;
canvas.height = 400;

let keys = []
window.addEventListener('keydown', e => {
    e.preventDefault();
    keys[e.keyCode] = true;
});
window.addEventListener('keyup', e => {
    keys[e.keyCode] = false;
});

let maze = generateMaze(20, 20),
    character_sprite = new Image,
    texture = new Image,
    playerX = 40,
    playerY = 40,
    speed = 4,
    character_id = 0,
    animation_countdown = 5,
    sx = 3, sy = 0;

character_sprite.src = 'game_assets/c1.png';
texture.src = 'game_assets/w1.png';

function getLazyMaze(playerX, playerY) {
    let mazeX = Math.floor(playerX / 80),
        mazeY = Math.floor(playerY / 80);

    let lazyMaze = [[], [], [], [], [], [], []];
    for (let row in Array(7).fill())
        for (let col in Array(7).fill())
            try {
                let x = mazeX + parseInt(col) - 3, y = mazeY + parseInt(row) - 3;
                lazyMaze[row][col] = maze[y][x];
            }
            catch (err) { lazyMaze[row][col] = undefined; }
    return lazyMaze;
}

function drawPlayer(sx = 1, sy = 0) {
    let dw = 34, dh = 51;
    ctx.drawImage(character_sprite, 16 * sx * 8, 24 * sy * 8, 16 * 8, 24 * 8, 200 - dw / 2, 200 - dh / 2, dw, dh);
}

setInterval(gameLoop, 1e3 / 30);
function gameLoop() {
    ctx.clearRect(0, 0, 400, 400);

    let speed_ = speed / 400 * canvas.clientWidth;
    let move = keys.slice(37, 41).concat(keys[65], keys[68], keys[83], keys[87]).includes(true);
    if (keys[38] || keys[87]) playerY -= speed_, sy = 1; // Move up
    if (keys[40] || keys[83]) playerY += speed_, sy = 0; // Move down
    if (keys[37] || keys[65]) playerX -= speed_, sy = 2; // Move left
    if (keys[39] || keys[68]) playerX += speed_, sy = 3; // Move right
    if (!move) sx = 3;
    if (--animation_countdown < 1) {
        animation_countdown = 5;
        if (move && ++sx > 3) sx = 0;
        if (!move) sy = 0;
    }

    function forEachTile(handler) {
        let lazyMaze = getLazyMaze(playerX, playerY);
        for (let [y, row] of lazyMaze.entries())
            for (let [x, tile] of row.entries()) {
                let leftX = 80 * (x - 1) - (playerX % 80 - 40), topY = 80 * (y - 1) - (playerY % 80 - 40);
                handler({ lazyMaze, y, row, x, tile, leftX, topY })
            }
    }

    // Draw Tiles
    forEachTile(v => { if (v.tile) ctx.drawImage(texture, 0, 0, 32 * 8, 32 * 8, v.leftX, v.topY, 80, 80); })

    // Draw Walls' Edge
    forEachTile(v => {
        if (v.tile) {
            let drawEdge = (full) => ctx.drawImage(texture, 28 * 8, full ? 32 * 8 : 40 * 8, 8 * 8, 8 * 8, v.leftX - 10 + 80, v.topY + 70, 20, 20);
            v.y <= 5 ? drawEdge(v.lazyMaze[v.y + 1][v.x] & 4) : drawEdge(true);
        }
    });

    forEachTile(v => {
        if (v.tile) {
            if (!(v.tile & 4)) {
                ctx.save();
                ctx.translate(v.leftX + 90, v.topY - 10);
                ctx.rotate(-90 * Math.PI / 180);
                ctx.drawImage(texture, 0, 32 * 8, 28 * 8, 8 * 8, v.leftX + 90, v.topY - 10, 60, 20);
                ctx.restore();
            }
        }
    });

    drawPlayer((!move || sx == 3) ? 1 : sx, (!move) ? 0 : sy);

    // document.querySelector('#debug').innerHTML = parseInt(playerX) + ',' + parseInt(playerY);
}