'use strict';

/** TODO:
 * Adding mini map
 * Adding pause menu
 */

const canvas = $('#game'),
    ctx = canvas.getContext('2d');

canvas.width = 400;
canvas.height = 400;

$('#width').value = localStorage.width || 20;
$('#height').value = localStorage.height || 20;
$('#show-minimap').checked = parseInt(localStorage.showMinimap);
$('#show-coordinate').checked = parseInt(localStorage.showCoord);

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

// Start a new game
let gameOn = false;
$('#start').addEventListener('submit', e => {
    e.preventDefault();

    gameOn = true;
    let width = $('#width').value;
    let height = $('#height').value;
    let showMinimap = $('#show-minimap').checked ? 1 : 0;
    let showCoord = $('#show-coordinate').checked ? 1 : 0;

    localStorage.width = width;
    localStorage.height = height;
    localStorage.showMinimap = showMinimap;
    localStorage.showCoord = showCoord;

    $.all('#game, header').forEach(el => el.classList.add('hidden'));
    setTimeout(() => {
        maze = generateMaze(width, height);
        playerX = 40, playerY = 40;

        $.all('#game, #in-game-interfaces').forEach(el => el.classList.remove('hidden'));
        if (showCoord) $('#coord').classList.remove('hidden');
        if (detectMob()) $('#joystick-area').classList.remove('hidden');

        startTimer();
    }, 1e3);
});

let keys = {};
window.addEventListener('keydown', e => {
    if (e.target.matches('input, textarea')) return;
    e.preventDefault();
    keys[e.code] = true;
});
window.addEventListener('keyup', e => {
    keys[e.code] = false;
});

// Touchscreen input
let jsCenterX, jsCenterY;
$('#joystick-area').addEventListener('touchstart', e => {
    jsCenterX = e.targetTouches[0].pageX;
    jsCenterY = e.targetTouches[0].pageY;

    {
        let css = $('#joystick').style;
        css.left = jsCenterX + 'px';
        css.top = jsCenterY + 'px';
        css.bottom = 'auto';
    };
});

let touchXOfs = 0,
    touchYOfs = 0;
$('#joystick-area').addEventListener('touchmove', e => {
    touchXOfs = (e.targetTouches[0].pageX - jsCenterX) / 60;
    touchYOfs = (e.targetTouches[0].pageY - jsCenterY) / 60;
    if (touchXOfs < -1) touchXOfs = -1;
    if (touchXOfs > 1) touchXOfs = 1;
    if (touchYOfs < -1) touchYOfs = -1;
    if (touchYOfs > 1) touchYOfs = 1;

    {
        let css = $('#joystick div').style;
        css.left = touchXOfs * 100 / 2 + 50 + '%';
        css.top = touchYOfs * 100 / 2 + 50 + '%';
    };
});

$('#joystick-area').addEventListener('touchend', e => {
    touchXOfs = 0, touchYOfs = 0;

    {
        let css = $('#joystick').style;
        css.left = '100px';
        css.top = 'auto';
        css.bottom = '10px';
    };

    {
        let css = $('#joystick div').style;
        css.left = '50%';
        css.top = '50%';
    };
});

character_sprite.src = 'assets/character.png';
texture.src = 'assets/texture.png';
shadow.src = 'assets/shadow.png';

function detectMob() {
    return [/Android/i, /webOS/i, /iPhone/i, /iPad/i,
            /iPod/i, /BlackBerry/i, /Windows Phone/i
        ].some((toMatchItem) => {
        return navigator.userAgent.match(toMatchItem);
    });
}

function startTimer() {
    let start = window.performance.now();
    let currTime = 0;
    let currTimer = setInterval(timer, 1e2);

    function timer() {
        if (gameOn) {
            $('#timer').innerHTML = (currTime += .1).toFixed(1) + 's';
        } else {
            let currTime = (window.performance.now() - start) / 1e3;
            $('#finish-screen-time').innerHTML = `Time: ${currTime.toFixed(3)} second`;
            clearInterval(currTimer);
        }
    }
}

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

function onGameEnded() {
    $('#in-game-interfaces').classList.add('hidden');
    $('#finish-screen').classList.remove('hidden');
    $('#finish-screen-maze-size').innerHTML = `${maze[0].length} &times; ${maze.length} maze`;
    $('#finish-screen-time').innerHTML = `Time: `;
}

function playAgain() {
    
}

setInterval(gameLoop, 1e3 / 30);

function gameLoop() {
    ctx.clearRect(0, 0, 400, 400);

    let speedX = 0,
        speedY = 0,
        speed_ = speed / 400 * canvas.clientWidth;
    let move = false;
    let currentTile = maze[Math.floor(playerY / 80)][Math.floor(playerX / 80)];

    if (touchXOfs || touchYOfs) {
        speedX = touchXOfs * speed_ * 1.5;
        speedY = touchYOfs * speed_ * 1.5;
        if (Math.abs(touchXOfs) > Math.abs(touchYOfs))
            if (touchXOfs > 0) sy = 3;
            else sy = 2;
        else if (touchYOfs > 0) sy = 0;
        else sy = 1;
    } else {
        if (keys.ArrowUp || keys.KeyW) speedY = -speed_, sy = 1; // Move up
        if (keys.ArrowDown || keys.KeyS) speedY = speed_, sy = 0; // Move down
        if (keys.ArrowLeft || keys.KeyA) speedX = -speed_, sy = 2; // Move left
        if (keys.ArrowRight || keys.KeyD) speedX = speed_, sy = 3; // Move right
    }

    if (speedX || speedY) move = true;

    let nextX = playerX % 80 + speedX,
        nextY = playerY % 80 + speedY;

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

    if (gameOn && Math.floor(playerX / 80) == maze[0].length - 1 && Math.floor(playerY / 80) == maze.length - 1) {
        gameOn = false;
        onGameEnded();
    }

    $('#coord').innerHTML = `Player position: (${Math.floor(playerX / 80) + 1}, ${Math.floor(playerY / 80) + 1})`;

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
            let drawTile = (sx, sy) =>
                ctx.drawImage(texture, 0 + 32 * 8 * sx, 0 + 32 * 8 * sy, 32 * 8, 32 * 8, v.leftX, v.topY, 80, 80);
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
            let drawEdge = (x, y, full) =>
                ctx.drawImage(texture, 28 * 8, !full ? 32 * 8 : 40 * 8, 8 * 8, 8 * 8, x, y, 20, 20);

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
}
