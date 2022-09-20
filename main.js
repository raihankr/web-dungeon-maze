'use strict';

let
  width  = 10,
  height = 10;

const
  [N, S, E, W] = [1, 2, 4, 8],
  DX           = { [E]: 1, [W]: -1, [N]:  0, [S]: 0 },
  DY           = { [E]: 0, [W]:  0, [N]: -1, [S]: 1 },
  OPPOSITE     = { [E]: W, [W]:  E, [N]:  S, [S]: N };

class Tree {
  #parent         = null;
  get root()      { return this.#parent ? this.#parent.root : this; }
  connected(tree) { return this.root == tree.root; }
  connect(tree)   { tree.root.#parent = this; }
}

let
  grid = Array.from({length: height}, _ => Array(width).fill(0)),
  sets = Array.from({length: height}, _ => Array.from({length: width}, _ => new Tree));

let edges = [];
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    if (y > 0) edges.push([x, y, N]);
    if (x > 0) edges.push([x, y, W]);
  }
}

edges.sort(() => Math.random() - .5);

while (!edges.length == 0) {
  let
    [x, y, direction] = edges.pop(),
    [nx, ny] = [x + DX[direction], y + DY[direction]],
    
    [set1, set2] = [sets[y][x], sets[ny][nx]];
  
  if (!set1.connected(set2)) {
    set1.connect(set2);
    grid[y][x]   |= direction;
    grid[ny][nx] |= OPPOSITE[direction];
  }
}
