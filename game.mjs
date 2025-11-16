//#region CONSTANTS ------------------------------------------------------------------
const FPS = 1000 / 60;
const STATES = { MENU: 1, PLAY: 2, GAMEOVER: 3 };

//#endregion

//#region Game variables -------------------------------------------------------------
const scene = document.getElementById("scene");
const brush = getBrush();

let currentState = STATES.IDLE;

// ------

const MENU = {
  currentIndex: 0,
  buttons: [
    { text: "Play", action: startPlay },
    { text: "High Scores", action: showHigScores },
  ],
};

const GAMEOVERMENU = {
  finalScoreText: "Final Score: ",
  highscoreText: "Highscore: ",
  button: {
    text: "Back to Menu",
    action: goMenu,
  },
};

// ------

const shipStartingX = scene.width * 0.5 - 50;
const ship = {
  x: shipStartingX,
  y: scene.height - 30,
  width: 50,
  height: 20,
  velocityX: 0,
  velocityY: 0,
  maxVelocity: 3,
};

// ------

const projectieWidth = 3;
const projectileHeight = 5;
const projectileSpeed = 2;
const projectileCooldown = 40;

const npcStartDirection = 1;
const npcStartSpeed = 1;

let cooldown = 0;
let projectiles = [];
let score = 0;
let highscore = 0;

const keyPressState = {};

// ------

const NPC = {
  width: 50,
  height: 20,
  padding: 20,
  sx: 50,
  sy: 75,
  speed: npcStartSpeed,
  direction: npcStartDirection,
  enteties: [],
};

const npcPerRow = Math.floor(
  (scene.width - NPC.height) / (NPC.width + NPC.height)
);

// ------

// Movment back and forth of NPC´s are govered by counting up to a level
const maxMovmentSteps = 50;
let movmentSteps = maxMovmentSteps;

// ------
// The following is a simple way of
let controllKeys = {
  ArrowDown: false,
  ArrowUp: false,
  ArrowLeft: false,
  ArrowRight: false,
  " ": false, // space
};

window.addEventListener("keydown", function (e) {
  if (!keyPressState[e.key]) {
    keyPressState[e.key] = currentState;
  }
  controllKeys[e.key] = true;
});

window.addEventListener("keyup", function (e) {
  controllKeys[e.key] = false;
  keyPressState[e.key] = null;
});

//#endregion

//#region Game engine ----------------------------------------------------------------

function init() {
  createInvaders();

  NPC.speed = 1;

  currentState = STATES.MENU;
  update();
}

function createInvaders() {
  movmentSteps = maxMovmentSteps;
  NPC.speed = npcStartSpeed;
  NPC.direction = npcStartDirection;

  let x = NPC.sx;
  let y = NPC.sy;
  for (let i = 0; i < npcPerRow; i++) {
    NPC.enteties.push({
      x,
      y,
      color: "#ffff00",
      active: true,
      width: NPC.width,
      height: NPC.height,
      value: 4,
    });
    let rowTwoY = y + NPC.height + NPC.padding;
    NPC.enteties.push({
      x,
      y: rowTwoY,
      color: "#ffa500",
      active: true,
      width: NPC.width,
      height: NPC.height,
      value: 3,
    });
    let rowThreeY = rowTwoY + NPC.height + NPC.padding;
    NPC.enteties.push({
      x,
      y: rowThreeY,
      color: "#ff0000",
      active: true,
      width: NPC.width,
      height: NPC.height,
      value: 2,
    });
    let rowFourY = rowThreeY + NPC.height + NPC.padding;
    NPC.enteties.push({
      x,
      y: rowFourY,
      color: "#00ff00",
      active: true,
      width: NPC.width,
      height: NPC.height,
      value: 1,
    });

    x += NPC.width + NPC.padding;
  }
}

function isKeyPressed(key) {
  return controllKeys[key] && keyPressState[key] === currentState;
}

function update(time) {
  if (currentState === STATES.MENU) {
    updateMenu(time);
  } else if (currentState === STATES.PLAY) {
    updateGame(time);
  } else if (currentState === STATES.GAMEOVER) {
    updateGameOverMenu();
  }

  draw();
  requestAnimationFrame(update);
}

function draw() {
  clearScreen();

  if (currentState === STATES.MENU) {
    drawMenu();
  } else if (currentState === STATES.PLAY) {
    drawGameState();
    drawScore();
  } else if (currentState === STATES.GAMEOVER) {
    drawGameOverMenu();
  }
}

init(); // Starts the game

//#endregion

//#region Game functions

function updateMenu(dt) {
  if (isKeyPressed(" ")) {
    MENU.buttons[MENU.currentIndex].action();
  }

  if (controllKeys.ArrowUp) {
    MENU.currentIndex--;
  } else if (controllKeys.ArrowDown) {
    MENU.currentIndex++;
  }

  MENU.currentIndex = clamp(MENU.currentIndex, 0, MENU.buttons.length - 1);
}

function updateGameOverMenu(dt) {
  if (isKeyPressed(" ")) {
    GAMEOVERMENU.button.action();
  }
}

function drawMenu() {
  let sy = 100;
  for (let i = 0; i < MENU.buttons.length; i++) {
    let text = MENU.buttons[i].text;
    if (i == MENU.currentIndex) {
      text = `* ${text} *`;
    }

    brush.font = "50px serif";
    brush.fillText(text, 100, sy);
    sy += 50;
  }
}

function drawGameOverMenu() {
  let sy = 100;
  let finalScoreText = GAMEOVERMENU.finalScoreText + score;
  brush.font = "50px serif";

  brush.fillText(finalScoreText, 100, sy);
  sy += 50;

  let highscoreText = GAMEOVERMENU.highscoreText + highscore;

  brush.fillText(highscoreText, 100, sy);
  sy += 100;

  let text = GAMEOVERMENU.button.text;
  text = `* ${text} *`;

  brush.fillText(text, 100, sy);
}

function drawScore() {
  brush.font = "50px serif";
  brush.fillStyle = "#000000ff";
  brush.fillText(score, 30, 40);
}

function updateGame(dt) {
  updateShip();
  updateProjectiles();
  updateInvaders();
  if (allInvadersDefeated()) {
    resetInvadersAndShip();
  }
  if (isGameOver()) {
    if (score > highscore) {
      highscore = score;
    }
    currentState = STATES.GAMEOVER;
  }
}

function resetInvadersAndShip() {
  NPC.enteties = [];
  createInvaders();
  resetShipX();
}

function updateInvaders() {
  let ty = 0;

  if (NPC.direction == 1 && movmentSteps >= maxMovmentSteps * 2) {
    movmentSteps = 0;
    NPC.direction *= -1;
  } else if (NPC.direction == -1 && movmentSteps >= maxMovmentSteps * 2) {
    movmentSteps = 0;
    NPC.direction *= -1;
    ty += NPC.height;
  }

  let tx = NPC.speed * NPC.direction;

  for (let i = 0; i < NPC.enteties.length; i++) {
    let invader = NPC.enteties[i];

    if (invader.active) {
      invader.x += tx;
      invader.y += ty;

      if (isShot(invader)) {
        invader.active = false;
      }
    }
  }

  movmentSteps++;
}

function resetShipX() {
  ship.x = shipStartingX;
}

function isGameOver() {
  let invaderReachedShip = false;
  for (let invader of NPC.enteties) {
    if (invader.active) {
      if (invader.y + invader.height >= ship.y) {
        invaderReachedShip = true;
      }
    }
  }

  return invaderReachedShip;
}

function allInvadersDefeated() {
  let allInvadersDefeated = true;
  for (let invader of NPC.enteties) {
    if (invader.active) {
      allInvadersDefeated = false;
    }
  }
  return allInvadersDefeated;
}

function isShot(target) {
  for (let i = 0; i < projectiles.length; i++) {
    let projectile = projectiles[i];
    if (
      overlaps(
        target.x,
        target.y,
        target.width,
        target.height,
        projectile.x,
        projectile.y,
        projectile.width,
        projectile.height
      )
    ) {
      projectile.active = false;
      score += target.value;
      return true;
    }
  }

  return false;
}

function updateShip() {
  if (controllKeys.ArrowLeft) {
    ship.velocityX--;
  } else if (controllKeys.ArrowRight) {
    ship.velocityX++;
  }

  ship.velocityX = clamp(
    ship.velocityX,
    ship.maxVelocity * -1,
    ship.maxVelocity
  );

  let tmpX = ship.x + ship.velocityX;
  tmpX = clamp(tmpX, 0, scene.width - ship.width);

  ship.x = tmpX;

  cooldown--;

  if (controllKeys[" "] && cooldown <= 0) {
    projectiles.push({
      x: ship.x + ship.width * 0.5,
      y: ship.y,
      dir: -1,
      active: true,
      width: projectieWidth,
      height: projectileHeight,
    });
    cooldown = projectileCooldown;
  }
}

function updateProjectiles() {
  let activeProjectiles = [];
  for (let i = 0; i < projectiles.length; i++) {
    let projectile = projectiles[i];
    projectile.y += projectileSpeed * projectile.dir;
    if (projectile.y + projectileHeight > 0 && projectile.active) {
      activeProjectiles.push(projectile);
    }
  }
  projectiles = activeProjectiles;
}

function drawGameState() {
  brush.fillStyle = "Black";
  brush.fillRect(ship.x, ship.y, ship.width, ship.height);

  for (let projectile of projectiles) {
    if (projectile.active) {
      brush.fillRect(
        projectile.x,
        projectile.y,
        projectieWidth,
        projectileHeight
      );
    }
  }

  for (let i = 0; i < NPC.enteties.length; i++) {
    let invader = NPC.enteties[i];
    if (invader.active) {
      brush.fillStyle = invader.color;
      brush.fillRect(invader.x, invader.y, NPC.width, NPC.height);
    }
  }
}

function goMenu() {
  score = 0;
  resetInvadersAndShip();
  currentState = STATES.MENU;
}

function startPlay() {
  currentState = STATES.PLAY;
}

function showHigScores() {}

//#endregion

//#region Utility functions ----------------------------------------------------------

function getBrush() {
  return scene.getContext("2d");
}

function clearScreen() {
  if (brush) {
    brush.clearRect(0, 0, scene.width, scene.height);
  }
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function overlaps(x1, y1, w1, h1, x2, y2, w2, h2) {
  if (x1 + w1 < x2 || x2 + w2 < x1) {
    return false;
  }

  if (y1 + h1 < y2 || y2 + h2 < y1) {
    return false;
  }

  return true;
}
//#endregion
