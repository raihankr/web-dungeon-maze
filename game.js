'use strict';

/** TODO:
 * Setting up starting screen.
 ** INPUT: Size of the maze (min 10)
 ** INPUT: Show mini map
 * Adding mini map option
 * Adding touch input for mobile phone.
 * Adding time mechanic
 * Setting up ending screen
 */

const canvas = document.querySelector('#game'),
    ctx = canvas.getContext('2d');

canvas.width = 400;
canvas.height = 400;

let keys = []
window.addEventListener('keydown', e => {
    keys[e.keyCode] = true;
});
window.addEventListener('keyup', e => {
    keys[e.keyCode] = false;
});

let maze = generateMaze(3, 3),
    character_sprite = new Image,
    texture = new Image,
    shadow = new Image,
    playerX = 120,
    playerY = 120,
    speed = 3,
    animation_countdown = 5,
    sx = 1,
    sy = 0;

character_sprite.src = 'assets/character.png';
texture.src = 'assets/texture.png';
shadow.src = 'assets/shadow.png'

function getLazyMaze(playerX, playerY) {
    let mazeX = Math.floor(playerX / 80),
        mazeY = Math.floor(playerY / 80);

    let lazyMaze = [[], [], [], [], [], [], []];
    for (let row in Array(7).fill())
        for (let col in Array(7).fill()) {
            let x = mazeX + parseInt(col) - 3,
                y = mazeY + parseInt(row) - 3;
            try { lazyMaze[row][col] = { conn: maze[y][x], x, y }; }
            catch (err) { lazyMaze[row][col] = { conn: undefined, x, y }; }
        }
    return lazyMaze;
}

function drawPlayer(sx = 1, sy = 0) {
    let dw = 34,
        dh = 51;
    ctx.drawImage(character_sprite, 16 * sx * 8, 24 * sy * 8, 16 * 8, 24 * 8, 200 - dw / 2, 200 - dh, dw, dh);
}

setInterval(gameLoop, 1e3 / 30);

function gameLoop() {
    ctx.clearRect(0, 0, 400, 400);

    let speedX = 0, speedY = 0, speed_ = speed / 400 * canvas.clientWidth;
    let move = keys.slice(37, 41).concat(keys[65], keys[68], keys[83], keys[87]).includes(true);
    let currentTile = maze[Math.floor(playerY / 80)][Math.floor(playerX / 80)];

    if (keys[38] || keys[87]) speedY = -speed_, sy = 1; // Move up
    if (keys[40] || keys[83]) speedY = speed_, sy = 0; // Move down
    if (keys[37] || keys[65]) speedX = -speed_, sy = 2; // Move left
    if (keys[39] || keys[68]) speedX = speed_, sy = 3; // Move right

    let nextX = playerX % 80 + speedX, nextY = playerY % 80 + speedY;
    // console.log(speedX, speedY)

    // Stop if collide with wall
    if (!(currentTile & 1) && nextY < 10) speedY = 0;
    if (!(currentTile & 2) && nextY > 70) speedY = 0;
    if (!(currentTile & 4) && nextX > 65) speedX = 0;
    if (!(currentTile & 8) && nextX < 15) speedX = 0;

    // Stop if collide with edge
    if ((playerX % 80 < 15 || playerX % 80 > 65) && (nextY < 10 || nextY > 70)) speedY = 0;
    if ((playerY % 80 < 10 || playerY % 80 > 70) && (nextX < 15 || nextX > 65)) speedX = 0;

    playerX += speedX, playerY += speedY;
    if (!move) sx = 1;
    if (--animation_countdown < 1) {
        animation_countdown = 5;
        if (move && ++sx > 3) sx = 0;
        if (!move) sy = 0;
    }

    function forEachTile(handler) {
        let lazyMaze = getLazyMaze(playerX, playerY);
        for (let [y, row] of lazyMaze.entries())
            for (let [x, tile] of row.entries()) {
                let leftX = 80 * (x - 1) - (playerX % 80 - 40),
                    topY = 80 * (y - 1) - (playerY % 80 - 40);
                handler({ lazyMaze, y, row, x, tile, leftX, topY });
            }
    }

    // Draw Tiles
    forEachTile(v => {
        if (v.tile.conn) {
            let drawTile = (sx, sy) => ctx.drawImage(texture, 0 + 32 * 8 * sx, 0 + 32 * 8 * sy, 32 * 8, 32 * 8, v.leftX, v.topY, 80, 80);
            if (v.tile.x == maze[0].length - 1 && v.tile.y == maze.length - 1) drawTile(1, 0);
            else drawTile(0, 0);
        }
    });
    
    // Draw player's shadow
    ctx.save();
    ctx.globalAlpha = .8;
    ctx.drawImage(shadow, 0, 0, 16 * 8, 16 * 8, 200 - 34 / 2, 200 - 51 / 2, 34, 51);
    ctx.restore();

    // Draw Walls' Edge
    forEachTile(v => {
        if (v.tile.conn) {
            let drawEdge = (x, y, full) => ctx.drawImage(texture, 28 * 8, !full ? 32 * 8 : 40 * 8, 8 * 8, 8 * 8, x, y, 20, 20);

            if (v.tile.x == 0 && v.tile.y == 0) drawEdge(v.leftX - 10, v.topY - 10, false);
            if (v.tile.x == 0)
                drawEdge(v.leftX - 10, v.topY + 70, (v.tile.y == maze.length - 1));
            if (v.tile.y == 0) drawEdge(v.leftX + 70, v.topY - 10, v.lazyMaze[v.y][v.x].conn & 4)
            drawEdge(v.leftX + 70, v.topY + 70, (v.y <= 5) ? (v.lazyMaze[v.y + 1][v.x].conn || 4) & 4 : true);
        }
    });

    // Draw Walls
    forEachTile(v => {
        if (v.tile.conn) {
            let drawWall = (x, y, horizontal) => {
                if (horizontal) {
                    ctx.drawImage(texture, 0, 40 * 8, 28 * 8, 8 * 8, x, y, 60, 20);
                } else {
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(-90 * Math.PI / 180);
                    ctx.drawImage(texture, 0, 32 * 8, 28 * 8, 8 * 8, 0, 0, 60, 20);
                    ctx.restore();
                }
            }

            if (v.tile.x == 0) drawWall(v.leftX - 10, v.topY + 70, false);
            if (v.tile.y == 0) drawWall(v.leftX + 10, v.topY - 10, true);
            if (!(v.tile.conn & 4)) drawWall(v.leftX + 70, v.topY + 70, false);
            if (!(v.tile.conn & 2)) drawWall(v.leftX + 10, v.topY + 70, true);
        }
    });

    drawPlayer((!move || sx == 3) ? 1 : sx, (!move) ? 0 : sy);

    // document.querySelector('#debug').innerHTML = parseInt(playerX) + ',' + parseInt(playerY);
}
