/**
 * @title Platanus Hack 25: Zarapito's Symphony Skirmish
 * @description Zarapito, un ave mística, se enfrenta a otras aves en batallas aéreas de "sinfonías",
 * usando armonías musicales como su poder. La clave está en sincronizar las melodías con elementos
 * del entorno (como el viento o los cantos de otras aves) para obtener ventajas estratégicas.
 */

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e',
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);

let gameState = 'menu'; // menu, player_turn, ai_turn, victory, defeat

function preload() {
  // No assets to preload
}

function drawBird(graphics, x, y, size, color, isZarapito = false) {
  // Body
  graphics.fillStyle(color, 1);
  graphics.fillCircle(x, y, size * 0.4);

  // Head
  graphics.fillCircle(x + size * 0.3, y - size * 0.2, size * 0.25);

  // Beak
  graphics.fillStyle(0xffaa00, 1);
  graphics.fillTriangle(
    x + size * 0.45, y - size * 0.15,
    x + size * 0.6, y - size * 0.1,
    x + size * 0.45, y - size * 0.05
  );

  // Wings
  graphics.fillStyle(color, 0.8);
  graphics.fillEllipse(x - size * 0.1, y, size * 0.4, size * 0.3);
  graphics.fillEllipse(x + size * 0.1, y, size * 0.4, size * 0.3);

  // Eye
  graphics.fillStyle(0xffffff, 1);
  graphics.fillCircle(x + size * 0.35, y - size * 0.25, size * 0.05);
  graphics.fillStyle(0x000000, 1);
  graphics.fillCircle(x + size * 0.35, y - size * 0.25, size * 0.02);

  if (isZarapito) {
    graphics.fillStyle(0xff0000, 1);
    graphics.fillCircle(x + size * 0.3, y - size * 0.3, size * 0.03);
  }
}

function create() {
  this.graphics = this.add.graphics();

  // Menu text
  this.add.text(400, 150, "Zarapito's Symphony Skirmish", { fontSize: '32px', color: '#00ffff' }).setOrigin(0.5);
  this.add.text(400, 350, 'Press SPACE to Start', { fontSize: '20px', color: '#00ff00' }).setOrigin(0.5);
}

function drawMenu(scene) {
  scene.graphics.clear();

  // Decorative birds
  drawBird(scene.graphics, 200, 400, 25, 0x00ffff);
  drawBird(scene.graphics, 600, 400, 25, 0xff00ff, true);
}

function update() {
  if (gameState === 'menu') {
    drawMenu(this);
  }
}
