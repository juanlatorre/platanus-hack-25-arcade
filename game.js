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
let turnCount = 0;
let playerHealth = 100;
let aiHealth = 100;
let graphics;

const PITCHES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
const RHYTHMS = ['whole', 'half', 'quarter', 'eighth'];
const DURATIONS = ['short', 'medium', 'long'];

let selectedMelody = { pitch: 0, rhythm: 0, duration: 0 }; // Indices for selection

function preload() {
  // No assets to preload
}

// Replace existing drawBird with refined version based on illustration

function drawBird(graphics, x, y, size, bodyColor, isZarapito = false) {
  // Elongated neck and head
  graphics.fillStyle(bodyColor, 1); // Main brown: 0x8b4513
  graphics.fillEllipse(x, y - size * 0.3, size * 0.15, size * 0.4); // Neck
  graphics.fillCircle(x, y - size * 0.55, size * 0.18); // Head

  // Slender body with white underbelly
  graphics.fillStyle(bodyColor, 1);
  graphics.fillEllipse(x, y, size * 0.35, size * 0.7); // Body
  graphics.fillStyle(0xf5f5f5, 1); // White under
  graphics.fillEllipse(x, y + size * 0.2, size * 0.3, size * 0.4);

  // Mottled plumage (random white specks on brown)
  graphics.fillStyle(0xf5f5f5, 0.8);
  for (let i = 0; i < 30; i++) {
    const spotX = x + (Math.random() - 0.5) * size * 0.35;
    const spotY = y + (Math.random() - 0.5) * size * 0.7 - size * 0.1; // Mostly on upper body
    graphics.fillCircle(spotX, spotY, size * 0.015 + Math.random() * size * 0.02);
  }

  // Head with bold dark stripes (eye line and crown)
  graphics.fillStyle(0x000000, 0.6);
  graphics.fillRect(x - size * 0.1, y - size * 0.6, size * 0.35, size * 0.03); // Crown stripe
  graphics.fillRect(x - size * 0.05, y - size * 0.55, size * 0.3, size * 0.025); // Eye stripe

  // Dark eye
  graphics.fillStyle(0x000000, 1);
  graphics.fillCircle(x + size * 0.05, y - size * 0.55, size * 0.025);

  // Long decurved beak (fallback to line segments for compatibility)
  graphics.lineStyle(size * 0.025, 0x333333, 1);
  graphics.beginPath();
  graphics.moveTo(x + size * 0.15, y - size * 0.5);
  graphics.lineTo(x + size * 0.3, y - size * 0.45); // Start curve
  graphics.lineTo(x + size * 0.42, y - size * 0.35); // Mid curve
  graphics.lineTo(x + size * 0.48, y - size * 0.2); // Peak curve
  graphics.lineTo(x + size * 0.45, y); // End downward
  graphics.strokePath();

  // Pointed folded wings with feather details
  graphics.fillStyle(bodyColor, 0.9);
  graphics.beginPath();
  graphics.moveTo(x - size * 0.15, y - size * 0.1); // Base
  graphics.lineTo(x - size * 0.35, y + size * 0.15); // Point
  graphics.lineTo(x - size * 0.1, y + size * 0.25); // Bottom
  graphics.closePath();
  graphics.fillPath();
  // Feather lines
  graphics.lineStyle(size * 0.01, 0x000000, 0.3);
  graphics.lineBetween(x - size * 0.15, y - size * 0.1, x - size * 0.35, y + size * 0.15);
  graphics.lineBetween(x - size * 0.2, y, x - size * 0.3, y + size * 0.1);

  // Long legs with three-toed feet
  graphics.fillStyle(0x808080, 1); // Gray legs
  graphics.fillRect(x - size * 0.05, y + size * 0.35, size * 0.02, size * 0.45); // Left leg
  graphics.fillRect(x + size * 0.05, y + size * 0.35, size * 0.02, size * 0.45); // Right leg
  // Feet (simple three toes)
  graphics.fillStyle(0x808080, 1);
  // Left foot
  graphics.fillTriangle(x - size * 0.1, y + size * 0.8, x - size * 0.05, y + size * 0.8, x - size * 0.075, y + size * 0.85); // Middle toe
  graphics.fillRect(x - size * 0.12, y + size * 0.8, size * 0.04, size * 0.01); // Left toe
  graphics.fillRect(x - size * 0.03, y + size * 0.8, size * 0.04, size * 0.01); // Right toe
  // Right foot (similar)
  graphics.fillTriangle(x, y + size * 0.8, x + size * 0.05, y + size * 0.8, x + size * 0.025, y + size * 0.85);
  graphics.fillRect(x - size * 0.02, y + size * 0.8, size * 0.04, size * 0.01);
  graphics.fillRect(x + size * 0.07, y + size * 0.8, size * 0.04, size * 0.01);

  if (isZarapito) {
    // Special marking, e.g., red crest for distinction
    graphics.fillStyle(0xff0000, 1);
    graphics.fillTriangle(x + size * 0.05, y - size * 0.65, x + size * 0.1, y - size * 0.7, x + size * 0.15, y - size * 0.65);
  }
}

function create() {
  this.graphics = this.add.graphics(); // Attach to scene

  // Menu text as group for easy destroy
  this.menuTexts = [];
  this.menuTexts.push(this.add.text(400, 150, "Zarapito's Symphony Skirmish", { fontSize: '32px', color: '#00ffff' }).setOrigin(0.5));
  const startText = this.add.text(400, 350, 'Press SPACE to Start', { fontSize: '20px', color: '#00ff00' }).setOrigin(0.5);
  this.menuTexts.push(startText);

  // Tween for start text
  this.tweens.add({
    targets: startText,
    alpha: { from: 1, to: 0.5 },
    duration: 1000,
    yoyo: true,
    repeat: -1
  });

  // Keyboard input
  this.input.keyboard.on('keydown-SPACE', () => {
    if (gameState === 'menu') {
      gameState = 'player_turn';
      turnCount = 1;
      this.menuTexts.forEach(text => text.destroy()); // Clear menu
      this.turnText.setVisible(true);
    }
  });

  this.input.keyboard.on('keydown-W', () => {
    if (gameState === 'player_turn') selectedMelody.pitch = (selectedMelody.pitch + 1) % PITCHES.length;
  });
  this.input.keyboard.on('keydown-A', () => {
    if (gameState === 'player_turn') selectedMelody.rhythm = (selectedMelody.rhythm + 1) % RHYTHMS.length;
  });
  this.input.keyboard.on('keydown-S', () => {
    if (gameState === 'player_turn') selectedMelody.duration = (selectedMelody.duration + 1) % DURATIONS.length;
  });

  this.turnText = this.add.text(400, 50, '', { fontSize: '24px', color: '#00ff00' }).setOrigin(0.5).setVisible(false);

  // Generate initial tones
  generateTones();

  // Melody UI texts (create once)
  this.pitchText = this.add.text(100, 420, '', { fontSize: '16px', color: '#ffffff' }).setVisible(false);
  this.rhythmText = this.add.text(300, 420, '', { fontSize: '16px', color: '#ffffff' }).setVisible(false);
  this.durationText = this.add.text(500, 420, '', { fontSize: '16px', color: '#ffffff' }).setVisible(false);
  this.harmonyText = this.add.text(400, 100, 'Harmony: 0%', { fontSize: '18px', color: '#ffff00' }).setOrigin(0.5).setVisible(false);

  this.instructionsText = this.add.text(400, 520, 'W: Cycle Pitch (match tones!)\nA: Cycle Rhythm\nS: Cycle Duration\nSPACE: Play Harmony', { fontSize: '14px', color: '#ffff00', align: 'center' }).setOrigin(0.5).setVisible(false);
  this.windText = this.add.text(100, 150, '', { fontSize: '16px', color: '#00ffff' }).setVisible(false);
  this.birdsText = this.add.text(700, 150, '', { fontSize: '16px', color: '#ff8800' }).setVisible(false);
  this.feedbackText = this.add.text(400, 200, '', { fontSize: '18px', color: '#00ffff' }).setOrigin(0.5).setVisible(false);

  // Add SPACE to play harmony
  this.input.keyboard.on('keydown-SPACE', () => {
    if (gameState === 'menu') {
      gameState = 'player_turn';
      turnCount = 1;
      this.menuTexts.forEach(text => text.destroy()); // Clear menu
      this.turnText.setVisible(true);
    }
    else if (gameState === 'player_turn') {
      playHarmony(this);
      gameState = 'ai_turn';
      this.turnText.setText('AI Turn ' + turnCount).setColor('#ff0000');
      this.time.delayedCall(1000, () => aiPlay(this));
    }
  });

  console.log('Create called'); // Debug

  this.playerHPText = this.add.text(50, 5, 'Player HP: 100', { fontSize: '14px', color: '#00ff00' }).setVisible(false);
  this.aiHPText = this.add.text(600, 5, 'AI HP: 100', { fontSize: '14px', color: '#ff0000' }).setVisible(false);

  this.input.on('pointerdown', () => {
    if (this.sound.context.state === 'suspended') this.sound.context.resume();
    console.log('Audio resumed on click');
  });
}

function drawMenu(scene) {
  console.log('Drawing bird - graphics defined:', !!scene.graphics);
  // Decorative birds
  drawBird(scene.graphics, 200, 400, 25, 0x8b4513);
  drawBird(scene.graphics, 600, 400, 25, 0xff00ff, true);
}

function update() {
  this.graphics.clear();

  if (gameState === 'menu') {
    drawMenu(this);
    this.menuTexts.forEach(t => t.setVisible(true));
    this.turnText.setVisible(false);
  } else if (gameState === 'player_turn') {
    console.log('Drawing bird - graphics defined:', !!this.graphics);
    drawBird(this.graphics, 150, 300, 50, 0x8b4513, true);
    drawBird(this.graphics, 650, 300, 50, 0x654321);
    this.turnText.setText('Player Turn ' + turnCount).setColor('#00ff00').setVisible(true);

    // Melody UI
    this.pitchText.setText('Pitch: ' + PITCHES[selectedMelody.pitch]).setVisible(true);
    this.rhythmText.setText('Rhythm: ' + RHYTHMS[selectedMelody.rhythm]).setVisible(true);
    this.durationText.setText('Duration: ' + DURATIONS[selectedMelody.duration]).setVisible(true);
    this.harmonyText.setText('Harmony: ' + harmonyMeter + '%').setVisible(true);

    // Instructions background rect
    this.graphics.fillStyle(0x000000, 0.5);
    this.graphics.fillRect(200, 480, 400, 80);
    this.graphics.lineStyle(1, 0xffff00, 1);
    this.graphics.strokeRect(200, 480, 400, 80); // Bright border

    // Instructions text (re-add if destroyed, at y=530)
    if (!this.instructionsText || !this.instructionsText.active) {
      this.instructionsText = this.add.text(400, 530, 'W: Cycle Pitch (match tones!)\nA: Cycle Rhythm\nS: Cycle Duration\nSPACE: Play Harmony', { fontSize: '14px', color: '#ffff00', align: 'center' }).setOrigin(0.5);
    }
    this.instructionsText.setVisible(true);
    console.log('Instructions visible');

    // Note: Texts recreate each frame—optimize later by creating once and updating text.
    console.log('Rendering player turn');
  } else if (gameState === 'ai_turn') {
    this.turnText.setText('AI Turn ' + turnCount).setColor('#ff0000').setVisible(true);
    console.log('Rendering AI turn');
  }

  // Add health bars in update() player_turn/ai_turn using graphics (after clear):

  // Player health bar
  this.graphics.fillStyle(0x00ff00, 1);
  this.graphics.fillRect(50, 20, (playerHealth / 100) * 150, 15);
  this.graphics.lineStyle(1, 0xffffff, 1);
  this.graphics.strokeRect(50, 20, 150, 15);

  // AI health bar
  this.graphics.fillStyle(0xff0000, 1);
  this.graphics.fillRect(600, 20, (aiHealth / 100) * 150, 15);
  this.graphics.strokeRect(600, 20, 150, 15);

  // Harmony meter bar
  this.graphics.fillStyle(0xffff00, 1);
  this.graphics.fillRect(350, 120, (harmonyMeter / 100) * 100, 10);
  this.graphics.strokeRect(350, 120, 100, 10);

  // In playHarmony, after applyEffects: Show feedback and fade out

  this.playerHPText.setText('Player HP: ' + playerHealth).setVisible(true);
  this.aiHPText.setText('AI HP: ' + aiHealth).setVisible(true);

  this.tweens.killTweensOf(this.feedbackText); // Stop any ongoing fade
  this.feedbackText.setAlpha(1).setVisible(true).setText(`Harmony ${harmonyMeter}% - Dealt ${Math.floor(harmonyMeter / 10)} damage!`);
  this.tweens.add({ targets: this.feedbackText, alpha: 0, duration: 1500, onComplete: () => this.feedbackText.setVisible(false) });

  // Hide UI in menu/victory/defeat: Add in update() if (gameState !== 'player_turn' && gameState !== 'ai_turn') { this.instructionsText.setVisible(false); this.windText.setVisible(false); this.birdsText.setVisible(false); }
  if (gameState !== 'player_turn' && gameState !== 'ai_turn') {
    this.instructionsText.setVisible(false);
    this.windText.setVisible(false);
    this.birdsText.setVisible(false);
    this.playerHPText.setVisible(false);
    this.aiHPText.setVisible(false);
  }

  // Note: These texts recreate each frame—optimize by creating once if needed, but fine for now.
  console.log('Update loop running, state: ' + gameState);
  console.log('Update: state=' + gameState); // Debug
}

const FREQUENCIES = { C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88, C5: 523.25 };

let environmentalTones = { wind: '', birds: '' };
let harmonyMeter = 0;

function generateTones() {
  environmentalTones.wind = PITCHES[Math.floor(Math.random() * PITCHES.length)];
  environmentalTones.birds = PITCHES[Math.floor(Math.random() * PITCHES.length)];
}

function playHarmony(scene) {
  const pitch = PITCHES[selectedMelody.pitch];
  const frequency = FREQUENCIES[pitch];
  let durationSec = 0.5;
  if (DURATIONS[selectedMelody.duration] === 'short') durationSec = 0.3;
  else if (DURATIONS[selectedMelody.duration] === 'long') durationSec = 1.0;

  playTone(scene, frequency, durationSec);
  calculateHarmony();
  applyEffects(scene);
}

function calculateHarmony() {
  harmonyMeter = 0;
  if (PITCHES[selectedMelody.pitch] === environmentalTones.wind) harmonyMeter += 30;
  if (PITCHES[selectedMelody.pitch] === environmentalTones.birds) harmonyMeter += 30;
  if (RHYTHMS[selectedMelody.rhythm] === 'quarter') harmonyMeter += 20;
  if (DURATIONS[selectedMelody.duration] === 'medium') harmonyMeter += 20;
  harmonyMeter = Math.min(100, harmonyMeter);
}

function applyEffects(scene) {
  const damage = Math.floor(harmonyMeter / 10);
  if (gameState === 'player_turn') aiHealth -= damage;
  else playerHealth -= damage;

  // Special effects (simplified)
  if (harmonyMeter >= 80) {
    // Stun: skip next turn (placeholder: extra damage)
    if (gameState === 'player_turn') aiHealth -= 5;
    else playerHealth -= 5;
  }
  checkWinLose(scene);
}

function aiPlay(scene) {
  selectedMelody.pitch = Math.floor(Math.random() * PITCHES.length);
  selectedMelody.rhythm = Math.floor(Math.random() * RHYTHMS.length);
  selectedMelody.duration = Math.floor(Math.random() * DURATIONS.length);
  playHarmony(scene);
  turnCount++;
  generateTones();
  gameState = 'player_turn';
  scene.turnText.setText('Player Turn ' + turnCount).setColor('#00ff00');

  scene.feedbackText.setAlpha(1).setVisible(true).setText(`AI Harmony ${harmonyMeter}% - Dealt ${Math.floor(harmonyMeter / 10)} damage!`);
  scene.tweens.add({ targets: scene.feedbackText, alpha: 0, duration: 1500, onComplete: () => scene.feedbackText.setVisible(false) });
}

function checkWinLose(scene) {
  if (aiHealth <= 0) {
    gameState = 'victory';
    scene.add.text(400, 300, 'VICTORY!', { fontSize: '48px', color: '#00ff00' }).setOrigin(0.5);
  } else if (playerHealth <= 0) {
    gameState = 'defeat';
    scene.add.text(400, 300, 'DEFEAT!', { fontSize: '48px', color: '#ff0000' }).setOrigin(0.5);
  }
}

function playTone(scene, freq, dur) {
  const ctx = scene.sound.context;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = freq;
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + dur);
}
