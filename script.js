'use strict';

/** TODO:
 * Adding pause menu
 * Adding loading screen while generating maze
 */

const game = $('#game').getContext('2d'),
    radar = $('#radar').getContext('2d');

$('#game').width = 400;
$('#game').height = 400;

$('#radar').width = 210;
$('#radar').height = 210;

$('#width').value = localStorage.width || 20;
$('#height').value = localStorage.height || 20;
$('#show-radar').checked = parseInt(localStorage.showRadar);
$('#show-coordinate').checked = parseInt(localStorage.showCoord);

let maze = generateMaze(3, 3),
    character_sprite = new Image,
    texture = new Image,
    shadow = new Image,
    playerX = 120,
    playerY = 120,
    speed = 5,
    animation_countdown = 5,
    sx = 1,
    sy = 0;

// Start a new game
let gameOn = false;
$('#start').addEventListener('submit', e => {
    e.preventDefault();

    let width = $('#width').value;
    let height = $('#height').value;
    let showRadar = $('#show-radar').checked ? 1 : 0;
    let showCoord = $('#show-coordinate').checked ? 1 : 0;

    localStorage.width = width;
    localStorage.height = height;
    localStorage.showRadar = showRadar;
    localStorage.showCoord = showCoord;

    $.all('#game, header, #blur-filter').forEach(el => el.classList.add('hidden'));
    setTimeout(() => {
        maze = generateMaze(width, height);
        playerX = 40, playerY = 40;

        $.all('#game, #in-game-interfaces').forEach(el => el.classList.remove('hidden'));
        if (showRadar) $('#radar').classList.remove('hidden');
        if (showCoord) $('#coord').classList.remove('hidden');
        if (detectMob()) $('#joystick-area').classList.remove('hidden');

        startTimer();

        gameOn = true;
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

function playerXTile() { return Math.floor(playerX / 80) }

function playerYTile() { return Math.floor(playerY / 80) }

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

function getLazyMaze(radius) {
    let mazeX = playerXTile(),
        mazeY = playerYTile(),
        diameter = radius * 2 + 1;
    
    let lazyMaze = Array.from({ length: diameter }, _ => Array());
    for (let row in Array(diameter).fill())
        for (let col in Array(diameter).fill()) {
            let x = mazeX + parseInt(col) - radius,
                y = mazeY + parseInt(row) - radius;
            try { lazyMaze[row][col] = { conn: maze[y][x], x, y }; }
            catch (err) { lazyMaze[row][col] = { conn: undefined, x, y }; }
        }
    return lazyMaze;
}

function drawPlayer(sx = 1, sy = 0) {
    let dw = 34,
        dh = 51;
    game.drawImage(character_sprite, 16 * sx * 8, 24 * sy * 8, 16 * 8, 24 * 8, 200 - dw / 2, 200 - dh, dw, dh);
}

function onMoveTile() {
    lazyMaze = getLazyMaze(3);
    lastPos = [playerXTile(), playerYTile()];

    $('#coord').innerHTML = `Player position: (${playerXTile() + 1}, ${playerYTile() + 1})`;

    if (!gameOn) return;
    let radarData = getLazyMaze(10);

    radar.clearRect(0, 0, 210, 210);

    radar.beginPath();
    radar.fillStyle = 'yellow';
    radar.ellipse(105, 105, 3, 3, 0, 0, 2 * Math.PI);
    radar.fill();

    forEachTile(radarData, v => {
        if (v.tile.conn) {
            let leftX = 10 * v.x,
                topY = 10 * v.y;
            console.log(leftX, topY)

            let drawWall = (horizontal, invert = false) => {
                if (invert) invert = 10;
                else invert = 0;

                radar.beginPath();
                radar.moveTo(leftX + 10 - invert, topY + 10 - invert);
                radar.lineTo(leftX + Math.abs((horizontal ? 0 : 10) - invert), topY + Math.abs((horizontal ? 10 : 0) - invert));
                radar.stroke();
            }

            radar.strokeStyle = 'cyan';
            radar.lineWidth = 1;
            if (v.tile.x == 0) drawWall(false, true);
            if (v.tile.y == 0) drawWall(true, true);
            if (!(v.tile.conn & 4)) drawWall(false);
            if (!(v.tile.conn & 2)) drawWall(true);
        }
    }, 20);
}

function onGameEnded() {
    $('#in-game-interfaces').classList.add('hidden');
    $.all('#finish-screen, #blur-filter').forEach(el => el.classList.remove('hidden'));
    $('#finish-screen-maze-size').innerHTML = `${maze[0].length} &times; ${maze.length} maze`;
}

function playAgain() {
    $('#finish-screen').classList.add('hidden');
    $('header').classList.remove('hidden');
}

setInterval(gameLoop, 1e3 / 30);

let lastPos = [playerXTile(), playerYTile()],
    lazyMaze = getLazyMaze(3);
function gameLoop() {
    game.clearRect(0, 0, 400, 400);

    let speedX = 0,
        speedY = 0,
        move = false,
        currentTile = maze[playerYTile()][playerXTile()];

    if (touchXOfs || touchYOfs) {
        speedX = touchXOfs * speed;
        speedY = touchYOfs * speed;
        if (Math.abs(touchXOfs) > Math.abs(touchYOfs))
            if (touchXOfs > 0) sy = 3;
            else sy = 2;
        else if (touchYOfs > 0) sy = 0;
        else sy = 1;
    } else {
        if (keys.ArrowUp || keys.KeyW) speedY = -speed, sy = 1; // Move up
        if (keys.ArrowDown || keys.KeyS) speedY = speed, sy = 0; // Move down
        if (keys.ArrowLeft || keys.KeyA) speedX = -speed, sy = 2; // Move left
        if (keys.ArrowRight || keys.KeyD) speedX = speed, sy = 3; // Move right
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

    if (lastPos.join() != [playerXTile(), playerYTile()]) onMoveTile();

    if (gameOn && playerXTile() == maze[0].length - 1 && playerYTile() == maze.length - 1) {
        gameOn = false;
        onGameEnded();
    }

    // Draw Tiles
    forEachTile(lazyMaze, v => {
        if (v.tile.conn) {
            let drawTile = (sx, sy) =>
                game.drawImage(texture, 0 + 32 * 8 * sx, 0 + 32 * 8 * sy, 32 * 8, 32 * 8, v.leftX, v.topY, 80, 80);
            if (v.tile.x == maze[0].length - 1 && v.tile.y == maze.length - 1) drawTile(1, 0);
            else drawTile(0, 0);
        }
    });

    // Draw player's shadow
    game.save();
    game.globalAlpha = .8;
    game.drawImage(shadow, 0, 0, 16 * 8, 16 * 8, 200 - 34 / 2, 200 - 51 / 2, 34, 51);
    game.restore();

    // Draw Walls' Edge
    forEachTile(lazyMaze, v => {
        if (v.tile.conn) {
            let drawEdge = (x, y, full) =>
                game.drawImage(texture, 28 * 8, !full ? 32 * 8 : 40 * 8, 8 * 8, 8 * 8, x, y, 20, 20);

            if (v.tile.x == 0 && v.tile.y == 0) drawEdge(v.leftX - 10, v.topY - 10, false);
            if (v.tile.x == 0)
                drawEdge(v.leftX - 10, v.topY + 70, (v.tile.y == maze.length - 1));
            if (v.tile.y == 0) drawEdge(v.leftX + 70, v.topY - 10, v.lazyMaze[v.y][v.x].conn & 4)
            drawEdge(v.leftX + 70, v.topY + 70, (v.y <= 5) ? (v.lazyMaze[v.y + 1][v.x].conn || 4) & 4 : true);
        }
    });

    // Draw Walls
    forEachTile(lazyMaze, v => {
        if (v.tile.conn) {
            let drawWall = (x, y, horizontal) => {
                if (horizontal) {
                    game.drawImage(texture, 0, 40 * 8, 28 * 8, 8 * 8, x, y, 60, 20);
                } else {
                    game.save();
                    game.translate(x, y);
                    game.rotate(-90 * Math.PI / 180);
                    game.drawImage(texture, 0, 32 * 8, 28 * 8, 8 * 8, 0, 0, 60, 20);
                    game.restore();
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

function forEachTile(maze, handler) {
    for (let [y, row] of maze.entries())
        for (let [x, tile] of row.entries()) {
            let leftX = 80 * (x - 1) - (playerX % 80 - 40),
                topY = 80 * (y - 1) - (playerY % 80 - 40);
            handler({ lazyMaze, y, row, x, tile, leftX, topY });
        }
}
