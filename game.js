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

function drawBird(graphics, x, y, size, bodyColor, isZarapito = false, facing = 1) {
  // Elongated neck and head
  graphics.fillStyle(bodyColor, 1);
  graphics.fillEllipse(x + facing * size * 0, y - size * 0.3, size * 0.15, size * 0.4); // Neck (centered)
  graphics.fillCircle(x + facing * size * 0, y - size * 0.55, size * 0.18); // Head (centered for mirror)

  // Slender body with white underbelly
  graphics.fillStyle(bodyColor, 1);
  graphics.fillEllipse(x, y, size * 0.35, size * 0.7);
  graphics.fillStyle(0xf5f5f5, 1);
  graphics.fillEllipse(x, y + size * 0.2, size * 0.3, size * 0.4);


  // Dark eye (mirror x)
  graphics.fillStyle(0x000000, 1);
  graphics.fillCircle(x + facing * size * 0.05, y - size * 0.55, size * 0.025);

  // Long decurved beak (mirror direction)
  graphics.lineStyle(size * 0.025, 0x333333, 1);
  graphics.beginPath();
  graphics.moveTo(x + facing * size * 0.15, y - size * 0.5);
  graphics.lineTo(x + facing * size * 0.3, y - size * 0.45);
  graphics.lineTo(x + facing * size * 0.42, y - size * 0.35);
  graphics.lineTo(x + facing * size * 0.48, y - size * 0.2);
  graphics.lineTo(x + facing * size * 0.45, y);
  graphics.strokePath();

  // Pointed folded wings with feather details (mirror x)
  graphics.fillStyle(bodyColor, 0.9);
  graphics.beginPath();
  graphics.moveTo(x + facing * (-size * 0.15), y - size * 0.1);
  graphics.lineTo(x + facing * (-size * 0.35), y + size * 0.15);
  graphics.lineTo(x + facing * (-size * 0.1), y + size * 0.25);
  graphics.closePath();
  graphics.fillPath();
  graphics.lineStyle(size * 0.01, 0x000000, 0.3);
  graphics.lineBetween(x + facing * (-size * 0.15), y - size * 0.1, x + facing * (-size * 0.35), y + size * 0.15);
  graphics.lineBetween(x + facing * (-size * 0.2), y, x + facing * (-size * 0.3), y + size * 0.1);

  // Long legs with three-toed feet (mirror x for feet)
  graphics.fillStyle(0x808080, 1);
  graphics.fillRect(x + facing * (-size * 0.05), y + size * 0.35, size * 0.02, size * 0.45);
  graphics.fillRect(x + facing * size * 0.05, y + size * 0.35, size * 0.02, size * 0.45);
  graphics.fillStyle(0x808080, 1);
  // Left foot (adjust for facing)
  let leftX = x + facing * (-size * 0.05);
  graphics.fillTriangle(leftX + facing * (-size * 0.05), y + size * 0.8, leftX, y + size * 0.8, leftX + facing * (-size * 0.025), y + size * 0.85);
  graphics.fillRect(leftX + facing * (-size * 0.07), y + size * 0.8, size * 0.04, size * 0.01);
  graphics.fillRect(leftX + facing * size * 0.02, y + size * 0.8, size * 0.04, size * 0.01);
  // Right foot similar, mirrored
  let rightX = x + facing * size * 0.05;
  graphics.fillTriangle(rightX + facing * (-size * 0.05), y + size * 0.8, rightX, y + size * 0.8, rightX + facing * (-size * 0.025), y + size * 0.85);
  graphics.fillRect(rightX + facing * (-size * 0.07), y + size * 0.8, size * 0.04, size * 0.01);
  graphics.fillRect(rightX + facing * size * 0.02, y + size * 0.8, size * 0.04, size * 0.01);
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
      turnTimer = 7000;
      combo = 0;
      score = 0;
      lastHarmony = 0;
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

  this.input.keyboard.on('keydown-D', () => {
    if (gameState === 'player_turn') selectedMelody.duration = (selectedMelody.duration - 1 + DURATIONS.length) % DURATIONS.length;
  });

  this.turnText = this.add.text(400, 50, '', { fontSize: '24px', color: '#00ff00' }).setOrigin(0.5).setVisible(false);

  // Generate initial tones
  generateTones();

  // Melody UI texts (create once)
  this.pitchText = this.add.text(100, 420, '', { fontSize: '16px', color: '#ffffff' }).setVisible(false);
  this.rhythmText = this.add.text(300, 420, '', { fontSize: '16px', color: '#ffffff' }).setVisible(false);
  this.durationText = this.add.text(500, 420, '', { fontSize: '16px', color: '#ffffff' }).setVisible(false);
  this.harmonyText = this.add.text(400, 100, 'Harmony: 0%', { fontSize: '18px', color: '#ffff00' }).setOrigin(0.5).setVisible(false);

  this.instructionsText = this.add.text(380, 530, 'W: Cycle Pitch (match tones!)\nA: Cycle Rhythm\nS: Duration + | D: Duration -\nSPACE: Play Harmony', { fontSize: '14px', color: '#ffff00', align: 'center' }).setOrigin(0.5);
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
  this.scoreText = this.add.text(400, 5, 'Score: 0', { fontSize: '20px', color: '#00ffff' }).setOrigin(0.5).setVisible(false);

  this.input.on('pointerdown', () => {
    if (this.sound.context.state === 'suspended') this.sound.context.resume();
    console.log('Audio resumed on click');
  });

  this.timerText = this.add.text(400, 70, 'Time: 10s', { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5).setVisible(false);
}

function drawMenu(scene) {
  console.log('Drawing bird - graphics defined:', !!scene.graphics);
  // Decorative birds
  drawBird(scene.graphics, 200, 400, 25, 0x8b4513, false, 1);
  drawBird(scene.graphics, 600, 400, 25, 0x654321, true, -1);
}

function update(time, delta) {
  this.graphics.clear();

  if (gameState === 'menu') {
    drawMenu(this);
    this.menuTexts.forEach(t => t.setVisible(true));
    this.turnText.setVisible(false);
  } else if (gameState === 'player_turn' || gameState === 'ai_turn') {
    // Draw birds (always visible in gameplay)
    drawBird(this.graphics, 150, 300, 50, 0x8b4513, true, 1);
    drawBird(this.graphics, 650, 300, 50, 0x654321, false, -1);

    // Instructions background rect (always visible in gameplay)
    this.graphics.fillStyle(0x000000, 0.5);
    this.graphics.fillRect(200, 480, 400, 80);
    this.graphics.lineStyle(1, 0xffff00, 1);
    this.graphics.strokeRect(200, 480, 400, 80);

    // Instructions text (always visible in gameplay)
    if (!this.instructionsText || !this.instructionsText.active) {
      this.instructionsText = this.add.text(400, 530, 'W: Cycle Pitch (match tones!)\nA: Cycle Rhythm\nS: Duration + | D: Duration -\nSPACE: Play Harmony', { fontSize: '14px', color: '#ffff00', align: 'center' }).setOrigin(0.5);
    }
    this.instructionsText.setVisible(true);

    // Environmental tones (always visible in gameplay)
    this.windText.setText('Wind: ' + environmentalTones.wind).setVisible(true);
    this.birdsText.setText('Birds: ' + environmentalTones.birds).setVisible(true);
    this.scoreText.setText('Score: ' + score).setVisible(true);

    if (gameState === 'player_turn') {
      this.turnText.setText('Player Turn ' + turnCount).setColor('#00ff00').setVisible(true);

      // Melody UI (only in player turn)
      this.pitchText.setText('Pitch: ' + PITCHES[selectedMelody.pitch]).setVisible(true);
      this.rhythmText.setText('Rhythm: ' + RHYTHMS[selectedMelody.rhythm]).setVisible(true);
      this.durationText.setText('Duration: ' + DURATIONS[selectedMelody.duration]).setVisible(true);
      this.harmonyText.setText('Harmony: ' + harmonyMeter + '%').setVisible(true);

      turnTimer -= delta;
      this.timerText.setText('Time: ' + Math.ceil(turnTimer / 1000) + 's').setVisible(true);

      // Timer bar
      this.graphics.fillStyle(0x00ffff, 1);
      this.graphics.fillRect(350, 140, (turnTimer / 7000) * 100, 10);
      this.graphics.strokeRect(350, 140, 100, 10);

      if (turnTimer <= 0) {
        // Auto random
        selectedMelody.pitch = Math.floor(Math.random() * PITCHES.length);
        selectedMelody.rhythm = Math.floor(Math.random() * RHYTHMS.length);
        selectedMelody.duration = Math.floor(Math.random() * DURATIONS.length);
        playHarmony(this);
        gameState = 'ai_turn';
        this.turnText.setText('AI Turn ' + turnCount).setColor('#ff0000');
        this.time.delayedCall(500, () => aiPlay(this));
        turnTimer = 7000;
      }
    } else if (gameState === 'ai_turn') {
      this.turnText.setText('AI Turn ' + turnCount).setColor('#ff0000').setVisible(true);
      // Hide melody UI during AI turn
      this.pitchText.setVisible(false);
      this.rhythmText.setVisible(false);
      this.durationText.setVisible(false);
      this.harmonyText.setVisible(false);
      this.timerText.setVisible(false);
    }
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
    this.timerText.setVisible(false);
  }

  // Note: These texts recreate each frame—optimize by creating once if needed, but fine for now.
  console.log('Update loop running, state: ' + gameState);
  console.log('Update: state=' + gameState); // Debug
}

const FREQUENCIES = { C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88, C5: 523.25 };

let environmentalTones = { wind: '', birds: '' };
let harmonyMeter = 0;
let turnTimer = 7000; // Faster: 7 seconds
let combo = 0;
let score = 0;
let lastHarmony = 0;

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
  let baseDamage = Math.floor(harmonyMeter / 10);
  let moveName = '';
  let healAmount = 0;
  
  // Combo system (chain good harmonies)
  if (harmonyMeter >= 50 && lastHarmony >= 50) {
    combo++;
    if (combo > 1) baseDamage += combo;
  } else if (harmonyMeter < 50) {
    combo = 0;
  }
  
  // Special moves and effects based on harmony
  if (harmonyMeter === 100) {
    moveName = 'PERFECT HARMONY!';
    baseDamage = baseDamage * 2;
    healAmount = 5; // Heal on perfect
    scene.cameras.main.shake(300, 0.02);
    playTone(scene, 880, 0.4);
    // Particle burst effect
    scene.graphics.fillStyle(0xff00ff, 1);
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      const dist = 50 + Math.random() * 100;
      const px = 400 + Math.cos(angle) * dist;
      const py = 300 + Math.sin(angle) * dist;
      scene.graphics.fillCircle(px, py, 4 + Math.random() * 4);
    }
  } else if (harmonyMeter >= 90) {
    moveName = 'GREAT HARMONY!';
    baseDamage = Math.floor(baseDamage * 1.5);
    healAmount = 3;
    scene.cameras.main.shake(250, 0.015);
    playTone(scene, 750, 0.3);
  } else if (harmonyMeter >= 80) {
    moveName = 'STUN ATTACK!';
    baseDamage += 3;
    scene.cameras.main.shake(200, 0.01);
    playTone(scene, 650, 0.25);
  } else if (harmonyMeter >= 60) {
    moveName = 'GOOD HARMONY';
    playTone(scene, 550, 0.2);
  } else {
    moveName = 'WEAK ATTACK';
    playTone(scene, 300, 0.15);
  }
  
  let damage = baseDamage;
  
  if (gameState === 'player_turn') {
    aiHealth = Math.max(0, aiHealth - damage);
    playerHealth = Math.min(100, playerHealth + healAmount);
    score += damage * 10 + (combo * 5) + (harmonyMeter === 100 ? 100 : 0);
  } else {
    playerHealth = Math.max(0, playerHealth - damage);
    aiHealth = Math.min(100, aiHealth + healAmount);
  }

  // Show move name
  const moveText = scene.add.text(400, 220, moveName, { 
    fontSize: harmonyMeter >= 80 ? '36px' : '28px', 
    color: harmonyMeter === 100 ? '#ff00ff' : harmonyMeter >= 80 ? '#ff00ff' : '#ffffff',
    stroke: '#000000',
    strokeThickness: 4
  }).setOrigin(0.5);
  scene.tweens.add({ 
    targets: moveText, 
    alpha: 0, 
    y: moveText.y - 30, 
    scale: 1.2,
    duration: 1500, 
    onComplete: () => moveText.destroy() 
  });

  // Stun effect (80%+ harmony)
  if (harmonyMeter >= 80) {
    const stunText = scene.add.text(400, 250, 'STUN!', { fontSize: '32px', color: '#ff00ff' }).setOrigin(0.5);
    scene.tweens.add({ targets: stunText, alpha: 0, y: stunText.y - 50, duration: 1000, onComplete: () => stunText.destroy() });
    if (gameState === 'player_turn') aiHealth = Math.max(0, aiHealth - 3);
    else playerHealth = Math.max(0, playerHealth - 3);
  }
  
  // Heal feedback
  if (healAmount > 0 && gameState === 'player_turn') {
    const healText = scene.add.text(150, 250, '+' + healAmount + ' HP', { fontSize: '24px', color: '#00ff00' }).setOrigin(0.5);
    scene.tweens.add({ targets: healText, alpha: 0, y: healText.y - 30, duration: 1000, onComplete: () => healText.destroy() });
  }
  
  lastHarmony = harmonyMeter;
  checkWinLose(scene);

  if (gameState === 'player_turn') {
    animateAttack(scene, scene.graphics, 150, 300, 650, 300, harmonyMeter, combo);
  } else {
    animateAttack(scene, scene.graphics, 650, 300, 150, 300, harmonyMeter, combo);
  }
  
  // Show combo feedback
  if (combo > 1) {
    const comboText = scene.add.text(400, 280, `COMBO x${combo}!`, { fontSize: '24px', color: '#ffff00' }).setOrigin(0.5);
    scene.tweens.add({ targets: comboText, alpha: 0, scale: 1.5, duration: 1000, onComplete: () => comboText.destroy() });
  }
}

function aiPlay(scene) {
  const targetPitch = Math.random() < 0.5 ? environmentalTones.wind : environmentalTones.birds;
  selectedMelody.pitch = PITCHES.indexOf(targetPitch);
  if (selectedMelody.pitch === -1) selectedMelody.pitch = Math.floor(Math.random() * PITCHES.length); // Fallback
  selectedMelody.rhythm = Math.floor(Math.random() * RHYTHMS.length);
  selectedMelody.duration = Math.floor(Math.random() * DURATIONS.length);
  playHarmony(scene);
  turnCount++;
  generateTones();
  gameState = 'player_turn';
  scene.turnText.setText('Player Turn ' + turnCount).setColor('#00ff00');

  scene.feedbackText.setAlpha(1).setVisible(true).setText(`AI Harmony ${harmonyMeter}% - Dealt ${Math.floor(harmonyMeter / 10)} damage!`);
  scene.tweens.add({ targets: scene.feedbackText, alpha: 0, duration: 1500, onComplete: () => scene.feedbackText.setVisible(false) });
  turnTimer = 7000;
}

function checkWinLose(scene) {
  if (aiHealth <= 0) {
    gameState = 'victory';
    const victoryText = scene.add.text(400, 250, 'VICTORY!', { fontSize: '64px', color: '#00ff00', stroke: '#000000', strokeThickness: 6 }).setOrigin(0.5);
    const scoreText = scene.add.text(400, 320, 'Final Score: ' + score, { fontSize: '32px', color: '#00ffff' }).setOrigin(0.5);
    scene.tweens.add({ targets: victoryText, scale: { from: 0.5, to: 1 }, duration: 500, ease: 'Back.easeOut' });
    scene.cameras.main.shake(500, 0.03);
    playTone(scene, 523, 0.3); // C5
    scene.time.delayedCall(300, () => playTone(scene, 659, 0.3)); // E5
    scene.time.delayedCall(600, () => playTone(scene, 784, 0.3)); // G5
  } else if (playerHealth <= 0) {
    gameState = 'defeat';
    const defeatText = scene.add.text(400, 300, 'DEFEAT!', { fontSize: '64px', color: '#ff0000', stroke: '#000000', strokeThickness: 6 }).setOrigin(0.5);
    const scoreText = scene.add.text(400, 370, 'Final Score: ' + score, { fontSize: '32px', color: '#ffff00' }).setOrigin(0.5);
    scene.tweens.add({ targets: defeatText, scale: { from: 0.5, to: 1 }, duration: 500, ease: 'Back.easeOut' });
    playTone(scene, 220, 0.5); // Low tone
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

function animateAttack(scene, graphics, fromX, fromY, toX, toY, strength, combo = 0) {
  if (!graphics) return;
  
  // Draw attack line (thicker for combo, purple for crit)
  graphics.lineStyle(3 + combo, strength === 100 ? 0xff00ff : 0xffff00, 1);
  graphics.beginPath();
  graphics.moveTo(fromX, fromY);
  graphics.lineTo(toX, toY);
  graphics.strokePath();
  
  // More particles for combo/crit
  const particleCount = Math.min(strength / 10 + combo, 10);
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 20 + Math.random() * (30 + combo * 5);
    const px = toX + Math.cos(angle) * dist;
    const py = toY + Math.sin(angle) * dist;
    graphics.fillStyle(strength === 100 ? 0xff00ff : 0xffff00, 1);
    graphics.fillCircle(px, py, 3 + combo);
  }
}
