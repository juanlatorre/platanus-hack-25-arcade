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

function create() {
  // To be implemented
}

function update() {
  // To be implemented
}
