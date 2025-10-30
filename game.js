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

let gameState = 'menu'; // menu, tutorial, player_turn, ai_turn, victory, defeat
let turnCount = 0;
let playerHealth = 100;
let aiHealth = 100;
let graphics;

// Stun system variables
let playerStunned = false;
let aiStunned = false;
let stunTurnsRemaining = { player: 0, ai: 0 };

const PITCHES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
const RHYTHMS = ['whole', 'half', 'quarter', 'eighth'];
const DURATIONS = ['short', 'medium', 'long'];

let selectedMelody = { pitch: 0, rhythm: 0, duration: 0 }; // Indices for selection

function preload() {
  // No assets to preload
}

// Replace existing drawBird with refined version based on illustration

function drawBird(graphics, x, y, size, bodyColor, isZarapito = false, facing = 1, animParams = {}) {
  // Animation parameters
  const neckAngle = animParams.neckAngle || 0; // Angle for neck movement
  const bodyTilt = animParams.bodyTilt || 0; // Body tilt angle
  const wingOffset = animParams.wingOffset || 0; // Wing movement offset
  const headBob = animParams.headBob || 0; // Head bobbing
  const colorFlash = animParams.colorFlash || 1.0; // Color flash for hit effect
  
  // Apply color flash effect (red tint when hit)
  let finalColor = bodyColor;
  if (colorFlash > 1.0) {
    // Blend with red for hit effect
    const r = Math.min(255, ((bodyColor >> 16) & 0xFF) * (1 + (colorFlash - 1) * 2));
    const g = Math.max(0, ((bodyColor >> 8) & 0xFF) * (1 - (colorFlash - 1) * 0.5));
    const b = Math.max(0, (bodyColor & 0xFF) * (1 - (colorFlash - 1) * 0.5));
    finalColor = (r << 16) | (g << 8) | b;
  }
  
  // Apply body tilt (subtle rotation effect by offsetting x)
  const tiltOffsetX = Math.sin(bodyTilt) * size * 0.1;
  const tiltOffsetY = Math.cos(bodyTilt) * size * 0.05;
  
  // Elongated neck and head (with animation)
  graphics.fillStyle(finalColor, 1);
  const neckX = x + facing * size * 0 + Math.sin(neckAngle) * size * 0.1 + tiltOffsetX;
  const neckY = y - size * 0.3 + Math.cos(neckAngle) * size * 0.05 + tiltOffsetY;
  graphics.fillEllipse(neckX, neckY, size * 0.15, size * 0.4); // Neck
  const headX = neckX + Math.sin(neckAngle) * size * 0.15;
  const headY = neckY - size * 0.25 + headBob;
  graphics.fillCircle(headX, headY, size * 0.18); // Head

  // Slender body with white underbelly (with tilt)
  graphics.fillStyle(finalColor, 1);
  graphics.fillEllipse(x + tiltOffsetX, y + tiltOffsetY, size * 0.35, size * 0.7);
  graphics.fillStyle(0xf5f5f5, 1);
  graphics.fillEllipse(x + tiltOffsetX, y + size * 0.2 + tiltOffsetY, size * 0.3, size * 0.4);

  // Dark eye (on animated head)
  graphics.fillStyle(0x000000, 1);
  graphics.fillCircle(headX + facing * size * 0.05, headY, size * 0.025);

  // Long decurved beak (from animated head)
  graphics.lineStyle(size * 0.025, 0x333333, 1);
  graphics.beginPath();
  graphics.moveTo(headX + facing * size * 0.15, headY + size * 0.05);
  graphics.lineTo(headX + facing * size * 0.3, headY + size * 0.1);
  graphics.lineTo(headX + facing * size * 0.42, headY + size * 0.2);
  graphics.lineTo(headX + facing * size * 0.48, headY + size * 0.35);
  graphics.lineTo(headX + facing * size * 0.45, headY + size * 0.55);
  graphics.strokePath();

  // Pointed folded wings with feather details (with wing animation)
  graphics.fillStyle(finalColor, 0.9);
  const wingYOffset = wingOffset * size * 0.15;
  graphics.beginPath();
  graphics.moveTo(x + facing * (-size * 0.15) + tiltOffsetX, y - size * 0.1 + tiltOffsetY + wingYOffset);
  graphics.lineTo(x + facing * (-size * 0.35) + tiltOffsetX, y + size * 0.15 + tiltOffsetY + wingYOffset);
  graphics.lineTo(x + facing * (-size * 0.1) + tiltOffsetX, y + size * 0.25 + tiltOffsetY + wingYOffset);
  graphics.closePath();
  graphics.fillPath();
  graphics.lineStyle(size * 0.01, 0x000000, 0.3);
  graphics.lineBetween(x + facing * (-size * 0.15) + tiltOffsetX, y - size * 0.1 + tiltOffsetY + wingYOffset, x + facing * (-size * 0.35) + tiltOffsetX, y + size * 0.15 + tiltOffsetY + wingYOffset);
  graphics.lineBetween(x + facing * (-size * 0.2) + tiltOffsetX, y + tiltOffsetY + wingYOffset, x + facing * (-size * 0.3) + tiltOffsetX, y + size * 0.1 + tiltOffsetY + wingYOffset);

  // Long legs with three-toed feet (with tilt)
  graphics.fillStyle(0x808080, 1);
  graphics.fillRect(x + facing * (-size * 0.05) + tiltOffsetX, y + size * 0.35 + tiltOffsetY, size * 0.02, size * 0.45);
  graphics.fillRect(x + facing * size * 0.05 + tiltOffsetX, y + size * 0.35 + tiltOffsetY, size * 0.02, size * 0.45);
  graphics.fillStyle(0x808080, 1);
  // Left foot
  let leftX = x + facing * (-size * 0.05) + tiltOffsetX;
  let footY = y + size * 0.8 + tiltOffsetY;
  graphics.fillTriangle(leftX + facing * (-size * 0.05), footY, leftX, footY, leftX + facing * (-size * 0.025), footY + size * 0.05);
  graphics.fillRect(leftX + facing * (-size * 0.07), footY, size * 0.04, size * 0.01);
  graphics.fillRect(leftX + facing * size * 0.02, footY, size * 0.04, size * 0.01);
  // Right foot
  let rightX = x + facing * size * 0.05 + tiltOffsetX;
  graphics.fillTriangle(rightX + facing * (-size * 0.05), footY, rightX, footY, rightX + facing * (-size * 0.025), footY + size * 0.05);
  graphics.fillRect(rightX + facing * (-size * 0.07), footY, size * 0.04, size * 0.01);
  graphics.fillRect(rightX + facing * size * 0.02, footY, size * 0.04, size * 0.01);
}

function create() {
  this.graphics = this.add.graphics(); // Attach to scene

  // Menu text as group for easy destroy
  this.menuTexts = [];
  this.menuTexts.push(this.add.text(400, 150, "El Duelo Sinfónico de Zarapito", { fontSize: '32px', color: '#00ffff' }).setOrigin(0.5));
  const startText = this.add.text(400, 350, 'Presiona ESPACIO para Iniciar', { fontSize: '20px', color: '#00ff00' }).setOrigin(0.5);
  this.menuTexts.push(startText);

  // Tween for start text
  this.tweens.add({
    targets: startText,
    alpha: { from: 1, to: 0.5 },
    duration: 1000,
    yoyo: true,
    repeat: -1
  });

  // Tutorial texts
  this.tutorialTexts = [];

  // Keyboard input for SPACE (handles menu->tutorial->gameplay->restart)
  this.input.keyboard.on('keydown-SPACE', () => {
    if (gameState === 'menu') {
      console.log('SPACE pressed in menu, transitioning to tutorial');
      gameState = 'tutorial';
      if (this.menuTexts) this.menuTexts.forEach(text => text.setVisible(false));
      createTutorial(this);
      console.log('Tutorial created, state:', gameState, 'texts count:', this.tutorialTexts ? this.tutorialTexts.length : 0);
    } else if (gameState === 'tutorial') {
      gameState = 'player_turn';
      turnCount = 1;
      turnTimer = 15000;
      combo = 0;
      score = 0;
      lastHarmony = 0;
      if (this.tutorialTexts) this.tutorialTexts.forEach(text => text.setVisible(false));
      this.turnText.setVisible(true);
    } else if (gameState === 'victory' || gameState === 'defeat') {
      // Restart game
      resetGame(this);
    } else if (gameState === 'player_turn') {
      // Don't allow actions if game has ended
      if (gameState === 'victory' || gameState === 'defeat') return;

      // Check if player is stunned - skip turn
      if (playerStunned && stunTurnsRemaining.player > 0) {
        stunTurnsRemaining.player--;

        // Show stunned message
        this.feedbackText.setAlpha(1).setVisible(true).setText('¡ATURDIDO - Pierdes turno!');
        this.tweens.add({ targets: this.feedbackText, alpha: 0, duration: 1500, onComplete: () => this.feedbackText.setVisible(false) });

        // Show stun effect on player bird
        showStunEffect(this, true);

        // If stun turns are over, clear stun status
        if (stunTurnsRemaining.player === 0) {
          playerStunned = false;
        }

        // Skip to AI turn
        gameState = 'ai_turn';
        this.turnText.setText('Turno ' + turnCount + ' - IA').setColor('#ff0000');
        this.time.delayedCall(1000, () => aiPlay(this));
        return;
      }

      playHarmony(this);
      // Check if game ended after playHarmony
      if (gameState === 'victory' || gameState === 'defeat') return;
      gameState = 'ai_turn';
      this.turnText.setText('Turno ' + turnCount + ' - IA').setColor('#ff0000');
      this.time.delayedCall(1000, () => aiPlay(this));
    }
  });

  this.input.keyboard.on('keydown-W', () => {
    if (gameState === 'player_turn') {
      selectedMelody.pitch = (selectedMelody.pitch + 1) % PITCHES.length;
      calculateHarmony(); // Update harmony in real-time
    }
  });
  this.input.keyboard.on('keydown-A', () => {
    if (gameState === 'player_turn') {
      selectedMelody.rhythm = (selectedMelody.rhythm + 1) % RHYTHMS.length;
      calculateHarmony(); // Update harmony in real-time
    }
  });
  this.input.keyboard.on('keydown-S', () => {
    if (gameState === 'player_turn') {
      selectedMelody.duration = (selectedMelody.duration + 1) % DURATIONS.length;
      calculateHarmony(); // Update harmony in real-time
    }
  });

  this.input.keyboard.on('keydown-D', () => {
    if (gameState === 'player_turn') {
      selectedMelody.duration = (selectedMelody.duration - 1 + DURATIONS.length) % DURATIONS.length;
      calculateHarmony(); // Update harmony in real-time
    }
  });

  this.turnText = this.add.text(400, 30, '', { fontSize: '20px', color: '#00ff00' }).setOrigin(0.5).setVisible(false);
  
  // Initialize tone labels array
  this.toneLabels = [];
  this.matchText = null;
  this.legendText = null;
  this.melodyInfoText = null;

  // Generate initial tones
  generateTones();

  // Melody UI texts (create once)
  this.pitchText = this.add.text(100, 350, '', { fontSize: '16px', color: '#ffffff' }).setVisible(false);
  this.rhythmText = this.add.text(300, 350, '', { fontSize: '16px', color: '#ffffff' }).setVisible(false);
  this.durationText = this.add.text(500, 350, '', { fontSize: '16px', color: '#ffffff' }).setVisible(false);
  this.harmonyText = this.add.text(400, 100, 'Armonía: 0%', { fontSize: '18px', color: '#ffff00' }).setOrigin(0.5).setVisible(false);

  this.instructionsText = this.add.text(400, 560, 'W: Tono  |  A: Ritmo  |  S/D: Duración  |  ESPACIO: Atacar', { fontSize: '11px', color: '#ffff00', align: 'center' }).setOrigin(0.5).setVisible(false);
  this.windText = this.add.text(100, 420, '', { fontSize: '14px', color: '#00ffff' }).setVisible(false);
  this.birdsText = this.add.text(700, 420, '', { fontSize: '14px', color: '#ff8800' }).setVisible(false);
  this.feedbackText = this.add.text(400, 200, '', { fontSize: '18px', color: '#00ffff' }).setOrigin(0.5).setVisible(false);

  console.log('Create called'); // Debug

  this.playerHPText = this.add.text(125, 28, 'HP: 100/100', { fontSize: '12px', color: '#00ff00' }).setOrigin(0.5).setVisible(false);
  this.aiHPText = this.add.text(675, 28, 'HP: 100/100', { fontSize: '12px', color: '#ff0000' }).setOrigin(0.5).setVisible(false);
  this.scoreText = this.add.text(400, 10, '0', { fontSize: '14px', color: '#00ffff' }).setOrigin(0.5).setVisible(false);

  this.input.on('pointerdown', () => {
    if (this.sound.context.state === 'suspended') this.sound.context.resume();
    console.log('Audio resumed on click');
  });

  this.timerText = this.add.text(500, 70, '7s', { fontSize: '12px', color: '#ffffff' }).setVisible(false);

  // Create dynamic idle animations for birds
  // Player bird animation parameters (moved down to y: 250)
  this.playerBirdY = { value: 250 };
  this.playerBirdNeckAngle = { value: 0 };
  this.playerBirdBodyTilt = { value: 0 };
  this.playerBirdWingOffset = { value: 0 };
  this.playerBirdHeadBob = { value: 0 };
  
  // AI bird animation parameters (moved down to y: 250)
  this.aiBirdY = { value: 250 };
  this.aiBirdNeckAngle = { value: 0 };
  this.aiBirdBodyTilt = { value: 0 };
  this.aiBirdWingOffset = { value: 0 };
  this.aiBirdHeadBob = { value: 0 };
  
  // Attack and damage animation states
  this.playerBirdX = { value: 150, baseX: 150 };
  this.aiBirdX = { value: 650, baseX: 650 };
  this.playerBirdColor = { value: 1.0 }; // Color multiplier for flash effect
  this.aiBirdColor = { value: 1.0 };
  this.isAttacking = { player: false, ai: false };
  this.isHit = { player: false, ai: false };
  
  // Player bird - vertical bobbing (smooth breathing)
  this.tweens.add({
    targets: this.playerBirdY,
    value: 250 + 12,
    duration: 1800,
    ease: 'Sine.easeInOut',
    yoyo: true,
    repeat: -1
  });
  
  // Player bird - neck movement (looking around)
  this.tweens.add({
    targets: this.playerBirdNeckAngle,
    value: 0.3,
    duration: 2500,
    ease: 'Sine.easeInOut',
    yoyo: true,
    repeat: -1,
    delay: 300
  });
  
  // Player bird - body tilt (swaying)
  this.tweens.add({
    targets: this.playerBirdBodyTilt,
    value: 0.2,
    duration: 2200,
    ease: 'Sine.easeInOut',
    yoyo: true,
    repeat: -1,
    delay: 100
  });
  
  // Player bird - wing subtle movement
  this.tweens.add({
    targets: this.playerBirdWingOffset,
    value: 0.15,
    duration: 1600,
    ease: 'Sine.easeInOut',
    yoyo: true,
    repeat: -1,
    delay: 500
  });
  
  // Player bird - head bobbing
  this.tweens.add({
    targets: this.playerBirdHeadBob,
    value: 3,
    duration: 1400,
    ease: 'Sine.easeInOut',
    yoyo: true,
    repeat: -1,
    delay: 200
  });
  
  // AI bird - vertical bobbing (out of sync)
  this.tweens.add({
    targets: this.aiBirdY,
    value: 250 + 12,
    duration: 2000,
    ease: 'Sine.easeInOut',
    yoyo: true,
    repeat: -1,
    delay: 800
  });
  
  // AI bird - neck movement (different pattern)
  this.tweens.add({
    targets: this.aiBirdNeckAngle,
    value: -0.3,
    duration: 2700,
    ease: 'Sine.easeInOut',
    yoyo: true,
    repeat: -1,
    delay: 1000
  });
  
  // AI bird - body tilt (opposite sway)
  this.tweens.add({
    targets: this.aiBirdBodyTilt,
    value: -0.2,
    duration: 2400,
    ease: 'Sine.easeInOut',
    yoyo: true,
    repeat: -1,
    delay: 600
  });
  
  // AI bird - wing movement
  this.tweens.add({
    targets: this.aiBirdWingOffset,
    value: -0.15,
    duration: 1800,
    ease: 'Sine.easeInOut',
    yoyo: true,
    repeat: -1,
    delay: 1200
  });
  
  // AI bird - head bobbing
  this.tweens.add({
    targets: this.aiBirdHeadBob,
    value: -3,
    duration: 1500,
    ease: 'Sine.easeInOut',
    yoyo: true,
    repeat: -1,
    delay: 900
  });
}

function drawMenu(scene) {
  console.log('Drawing bird - graphics defined:', !!scene.graphics);
  // Decorative birds - bigger size
  drawBird(scene.graphics, 200, 400, 35, 0x8b4513, false, 1);
  drawBird(scene.graphics, 600, 400, 35, 0x654321, true, -1);
}

function createTutorial(scene) {
  if (scene.tutorialTexts && scene.tutorialTexts.length > 0) return; // Already created
  
  scene.tutorialTexts = [];
  const y = 80;
  let spacing = 32;
  
  const t1 = scene.add.text(400, y, 'CÓMO JUGAR', { fontSize: '36px', color: '#00ffff', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setVisible(true);
  scene.tutorialTexts.push(t1);
  
  const t2 = scene.add.text(400, y + spacing * 2, '🎵 OBJETIVO', { fontSize: '24px', color: '#ffff00' }).setOrigin(0.5).setVisible(true);
  scene.tutorialTexts.push(t2);
  const t3 = scene.add.text(400, y + spacing * 3, 'Combate con armonías musicales', { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5).setVisible(true);
  scene.tutorialTexts.push(t3);
  const t4 = scene.add.text(400, y + spacing * 4, 'Reduce el HP del rival a 0 para ganar', { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5).setVisible(true);
  scene.tutorialTexts.push(t4);
  
  const t5 = scene.add.text(400, y + spacing * 6, '🎼 ARMONÍA', { fontSize: '24px', color: '#ffff00' }).setOrigin(0.5).setVisible(true);
  scene.tutorialTexts.push(t5);
  const t6 = scene.add.text(400, y + spacing * 7, 'El selector muestra qué tonos coinciden:', { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5).setVisible(true);
  scene.tutorialTexts.push(t6);
  const t6b = scene.add.text(400, y + spacing * 8, '🔵 = Viento  🟠 = Aves  🟢 = Ambos', { fontSize: '16px', color: '#00ffff' }).setOrigin(0.5).setVisible(true);
  scene.tutorialTexts.push(t6b);
  const t7 = scene.add.text(400, y + spacing * 9, '¡Selecciona los tonos de colores para más daño!', { fontSize: '16px', color: '#ffff00' }).setOrigin(0.5).setVisible(true);
  scene.tutorialTexts.push(t7);
  
  const t8 = scene.add.text(400, y + spacing * 11, '✨ ESPECIALES', { fontSize: '24px', color: '#ffff00' }).setOrigin(0.5).setVisible(true);
  scene.tutorialTexts.push(t8);
  const t9 = scene.add.text(400, y + spacing * 12, '100% = PERFECTA (doble daño + cura)', { fontSize: '16px', color: '#ff00ff' }).setOrigin(0.5).setVisible(true);
  scene.tutorialTexts.push(t9);
  const t10 = scene.add.text(400, y + spacing * 13, '80%+ = ATURDIMIENTO (enemigo pierde 1 turno)', { fontSize: '16px', color: '#ff00ff' }).setOrigin(0.5).setVisible(true);
  scene.tutorialTexts.push(t10);
  const t11 = scene.add.text(400, y + spacing * 14, 'Combos aumentan daño', { fontSize: '16px', color: '#ffff00' }).setOrigin(0.5).setVisible(true);
  scene.tutorialTexts.push(t11);
  
  const continueText = scene.add.text(400, 540, 'Presiona ESPACIO para comenzar', { fontSize: '20px', color: '#00ff00' }).setOrigin(0.5).setVisible(true);
  scene.tutorialTexts.push(continueText);
  scene.tweens.add({ targets: continueText, alpha: { from: 1, to: 0.5 }, duration: 1000, yoyo: true, repeat: -1 });
  
  console.log('Tutorial creado, textos:', scene.tutorialTexts.length);
}

function drawTutorial(scene) {
  scene.graphics.clear();
  // Draw example birds - bigger size
  drawBird(scene.graphics, 200, 450, 40, 0x8b4513, true, 1);
  drawBird(scene.graphics, 600, 450, 40, 0x654321, false, -1);
}

function update(time, delta) {
  this.graphics.clear();

  if (gameState === 'menu') {
    drawMenu(this);
    this.menuTexts.forEach(t => t.setVisible(true));
    this.turnText.setVisible(false);
    if (this.tutorialTexts) this.tutorialTexts.forEach(t => t.setVisible(false));
  } else if (gameState === 'tutorial') {
    drawTutorial(this);
    // Hide all gameplay UI
    if (this.menuTexts) this.menuTexts.forEach(t => t.setVisible(false));
    if (this.turnText) this.turnText.setVisible(false);
    if (this.harmonyText) this.harmonyText.setVisible(false);
    if (this.pitchText) this.pitchText.setVisible(false);
    if (this.rhythmText) this.rhythmText.setVisible(false);
    if (this.durationText) this.durationText.setVisible(false);
    if (this.windText) this.windText.setVisible(false);
    if (this.birdsText) this.birdsText.setVisible(false);
    if (this.scoreText) this.scoreText.setVisible(false);
    if (this.timerText) this.timerText.setVisible(false);
    if (this.instructionsText) this.instructionsText.setVisible(false);
    // Show tutorial texts
    if (this.tutorialTexts && this.tutorialTexts.length > 0) {
      console.log('Tutorial state: showing', this.tutorialTexts.length, 'texts');
      this.tutorialTexts.forEach((t, i) => {
        if (t && t.active !== false) {
          t.setVisible(true);
          console.log('Text', i, 'visible:', t.visible, 'active:', t.active);
        }
      });
    } else {
      console.log('WARNING: Tutorial state but no texts! Creating them now...');
      createTutorial(this);
    }
  } else if (gameState === 'player_turn' || gameState === 'ai_turn') {
    // Draw birds (always visible in gameplay) - bigger size with dynamic idle animation
    const playerY = this.playerBirdY ? this.playerBirdY.value : 250;
    const aiY = this.aiBirdY ? this.aiBirdY.value : 250;
    const playerX = this.playerBirdX ? this.playerBirdX.value : 150;
    const aiX = this.aiBirdX ? this.aiBirdX.value : 650;
    
    // Player bird animation parameters
    const playerAnim = {
      neckAngle: this.playerBirdNeckAngle ? this.playerBirdNeckAngle.value : 0,
      bodyTilt: this.playerBirdBodyTilt ? this.playerBirdBodyTilt.value : 0,
      wingOffset: this.playerBirdWingOffset ? this.playerBirdWingOffset.value : 0,
      headBob: this.playerBirdHeadBob ? this.playerBirdHeadBob.value : 0,
      colorFlash: this.playerBirdColor ? this.playerBirdColor.value : 1.0
    };
    
    // AI bird animation parameters
    const aiAnim = {
      neckAngle: this.aiBirdNeckAngle ? this.aiBirdNeckAngle.value : 0,
      bodyTilt: this.aiBirdBodyTilt ? this.aiBirdBodyTilt.value : 0,
      wingOffset: this.aiBirdWingOffset ? this.aiBirdWingOffset.value : 0,
      headBob: this.aiBirdHeadBob ? this.aiBirdHeadBob.value : 0,
      colorFlash: this.aiBirdColor ? this.aiBirdColor.value : 1.0
    };
    
    // Draw with dynamic animations (using animated X positions) - bigger birds
    const baseSize = 85;
    drawBird(this.graphics, playerX, playerY, baseSize, 0x8b4513, true, 1, playerAnim);
    drawBird(this.graphics, aiX, aiY, baseSize, 0x654321, false, -1, aiAnim);

    // Environmental tones - compact display
    this.windText.setText('🌬️ ' + environmentalTones.wind).setVisible(true);
    this.birdsText.setText('🐦 ' + environmentalTones.birds).setVisible(true);
    
    // Score only shown during gameplay (not cluttering defeat/victory)
    this.scoreText.setText(score).setVisible(true);

    if (gameState === 'player_turn') {
      this.turnText.setText('Turno ' + turnCount).setColor('#00ff00').setVisible(true).setPosition(400, 30);
      
      // Update harmony in real-time
      calculateHarmony();

      // Simplified tone selector - more compact, at bottom
      drawToneSelector(this.graphics, 100, 480, 600, 25, selectedMelody.pitch);
      
      // Tone labels directly on selector
      const pitchWidth = 600 / PITCHES.length;
      for (let i = 0; i < PITCHES.length; i++) {
        const px = 100 + i * pitchWidth + pitchWidth / 2;
        const labelColor = (PITCHES[i] === environmentalTones.wind || PITCHES[i] === environmentalTones.birds) ? '#ffffff' : '#888888';
        if (!this.toneLabels) this.toneLabels = [];
        if (!this.toneLabels[i]) {
          this.toneLabels[i] = this.add.text(px, 492, PITCHES[i], { fontSize: '11px', color: labelColor }).setOrigin(0.5);
        } else {
          this.toneLabels[i].setText(PITCHES[i]).setColor(labelColor).setVisible(true);
        }
      }

      // Compact melody info in one line (above selector)
      const melodyInfo = PITCHES[selectedMelody.pitch] + ' | ' + RHYTHMS[selectedMelody.rhythm] + ' | ' + DURATIONS[selectedMelody.duration];
      if (!this.melodyInfoText) {
        this.melodyInfoText = this.add.text(400, 455, melodyInfo, { fontSize: '13px', color: '#ffffff' }).setOrigin(0.5);
      } else {
        this.melodyInfoText.setText(melodyInfo).setVisible(true);
      }
      
      // Harmony text (compact, near harmony bar)
      let harmonyColor = '#ff6666'; // Light red for low
      if (harmonyMeter >= 80) harmonyColor = '#ff00ff'; // Magenta for high
      else if (harmonyMeter >= 60) harmonyColor = '#ffff00'; // Yellow for medium-high
      else if (harmonyMeter >= 30) harmonyColor = '#66ff66'; // Light green for medium
      
      this.harmonyText.setText(harmonyMeter + '%').setColor(harmonyColor).setVisible(true).setPosition(300, 70);

      turnTimer -= delta;
      this.timerText.setText(Math.ceil(turnTimer / 1000) + 's').setVisible(true).setPosition(500, 70);

      // Compact timer bar (inline with harmony)
      this.graphics.fillStyle(0x00ffff, 1);
      this.graphics.fillRect(350, 85, (turnTimer / 7000) * 100, 6);
      this.graphics.lineStyle(1, 0x00ffff, 1);
      this.graphics.strokeRect(350, 85, 100, 6);
      
      // Instructions at very bottom
      this.instructionsText.setVisible(true).setPosition(400, 560);

      if (turnTimer <= 0) {
        // Don't auto-play if game has ended
        if (gameState === 'victory' || gameState === 'defeat') return;
        // Auto random
        selectedMelody.pitch = Math.floor(Math.random() * PITCHES.length);
        selectedMelody.rhythm = Math.floor(Math.random() * RHYTHMS.length);
        selectedMelody.duration = Math.floor(Math.random() * DURATIONS.length);
        playHarmony(this);
        // Check if game ended after playHarmony
        if (gameState === 'victory' || gameState === 'defeat') return;
        gameState = 'ai_turn';
        this.turnText.setText('Turno ' + turnCount + ' - IA').setColor('#ff0000');
        this.time.delayedCall(500, () => aiPlay(this));
        turnTimer = 15000;
      }
    } else if (gameState === 'ai_turn') {
      this.turnText.setText('Turno ' + turnCount + ' - IA').setColor('#ff0000').setVisible(true).setPosition(400, 30);
      // Hide melody UI during AI turn
      this.pitchText.setVisible(false);
      this.rhythmText.setVisible(false);
      this.durationText.setVisible(false);
      this.harmonyText.setVisible(false);
      this.timerText.setVisible(false);
      this.instructionsText.setVisible(false);
      if (this.toneLabels) this.toneLabels.forEach(l => l.setVisible(false));
      if (this.matchText) this.matchText.setVisible(false);
      if (this.legendText) this.legendText.setVisible(false);
      if (this.melodyInfoText) this.melodyInfoText.setVisible(false);
    }
  }

  // Hide ALL gameplay UI during victory/defeat
  if (gameState === 'victory' || gameState === 'defeat') {
    this.turnText.setVisible(false);
    this.harmonyText.setVisible(false);
    this.pitchText.setVisible(false);
    this.rhythmText.setVisible(false);
    this.durationText.setVisible(false);
    this.windText.setVisible(false);
    this.birdsText.setVisible(false);
    this.scoreText.setVisible(false);
    this.timerText.setVisible(false);
    this.instructionsText.setVisible(false);
    this.feedbackText.setVisible(false);
    if (this.toneLabels) this.toneLabels.forEach(l => l.setVisible(false));
    if (this.matchText) this.matchText.setVisible(false);
    if (this.legendText) this.legendText.setVisible(false);
    if (this.melodyInfoText) this.melodyInfoText.setVisible(false);
  }

  // Only show gameplay UI during actual gameplay
  if (gameState === 'player_turn' || gameState === 'ai_turn') {
    // Player health bar (top left)
    this.graphics.fillStyle(0x00ff00, 1);
    this.graphics.fillRect(50, 10, (playerHealth / 100) * 150, 12);
    this.graphics.lineStyle(1, 0xffffff, 1);
    this.graphics.strokeRect(50, 10, 150, 12);
    // Player HP text - positioned below the bar, centered
    this.playerHPText.setText('HP: ' + playerHealth + '/100').setVisible(true).setPosition(125, 28).setOrigin(0.5);

    // AI health bar (top right)
    this.graphics.fillStyle(0xff0000, 1);
    this.graphics.fillRect(600, 10, (aiHealth / 100) * 150, 12);
    this.graphics.strokeRect(600, 10, 150, 12);
    // AI HP text - positioned below the bar, centered
    this.aiHPText.setText('HP: ' + aiHealth + '/100').setVisible(true).setPosition(675, 28).setOrigin(0.5);

    // Harmony meter bar (centered, below turn text)
    this.graphics.fillStyle(0xffff00, 1);
    this.graphics.fillRect(350, 70, (harmonyMeter / 100) * 100, 8);
    this.graphics.lineStyle(1, 0xffff00, 1);
    this.graphics.strokeRect(350, 70, 100, 8);
    
    // Compact score at top center
    this.scoreText.setPosition(400, 10).setVisible(true);

    // Wind/Birds positioned near selector
    this.windText.setPosition(100, 420).setVisible(true);
    this.birdsText.setPosition(700, 420).setVisible(true);

    this.feedbackText.setVisible(false); // Only show when harmony is played
  } else {
    this.feedbackText.setVisible(false);
  }

  // Hide gameplay UI in menu/victory/defeat (but NOT in tutorial)
  if (gameState !== 'player_turn' && gameState !== 'ai_turn' && gameState !== 'tutorial') {
    this.instructionsText.setVisible(false);
    this.windText.setVisible(false);
    this.birdsText.setVisible(false);
    this.playerHPText.setVisible(false);
    this.aiHPText.setVisible(false);
    this.timerText.setVisible(false);
    if (this.toneLabels) this.toneLabels.forEach(l => l.setVisible(false));
    if (this.matchText) this.matchText.setVisible(false);
    if (this.legendText) this.legendText.setVisible(false);
  }

  // Note: These texts recreate each frame—optimize by creating once if needed, but fine for now.
}

const FREQUENCIES = { C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88, C5: 523.25 };

let environmentalTones = { wind: '', birds: '' };
let harmonyMeter = 0;
let turnTimer = 15000; // 15 seconds
let combo = 0;
let score = 0;
let lastHarmony = 0;
let birdPositions = { player: { baseY: 250, offsetY: 0 }, ai: { baseY: 250, offsetY: 0 } };

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

function drawToneSelector(graphics, x, y, width, height, selectedIdx) {
  const pitchWidth = width / PITCHES.length;
  const matchWind = PITCHES.indexOf(environmentalTones.wind);
  const matchBirds = PITCHES.indexOf(environmentalTones.birds);
  
  for (let i = 0; i < PITCHES.length; i++) {
    const px = x + i * pitchWidth;
    let color = 0x333333; // Gray default
    let borderColor = 0x666666;
    
    // Highlight matching tones
    if (i === matchWind && i === matchBirds) {
      color = 0x00ff00; // Green - matches both
      borderColor = 0xffffff;
    } else if (i === matchWind) {
      color = 0x0088ff; // Cyan - matches wind
      borderColor = 0x00ffff;
    } else if (i === matchBirds) {
      color = 0xff8800; // Orange - matches birds
      borderColor = 0xffaa00;
    }
    
    // Highlight selected tone
    if (i === selectedIdx) {
      borderColor = 0xffff00;
      graphics.lineStyle(3, borderColor, 1);
    } else {
      graphics.lineStyle(1, borderColor, 1);
    }
    
    graphics.fillStyle(color, 0.8);
    graphics.fillRect(px, y, pitchWidth - 2, height);
    graphics.strokeRect(px, y, pitchWidth - 2, height);
  }
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
    moveName = '¡ARMONÍA PERFECTA!';
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
    moveName = '¡GRAN ARMONÍA!';
    baseDamage = Math.floor(baseDamage * 1.5);
    healAmount = 3;
    scene.cameras.main.shake(250, 0.015);
    playTone(scene, 750, 0.3);
  } else if (harmonyMeter >= 80) {
    moveName = '¡ATAQUE ATURDIDOR!';
    baseDamage += 3;
    scene.cameras.main.shake(200, 0.01);
    playTone(scene, 650, 0.25);
  } else if (harmonyMeter >= 60) {
    moveName = 'BUENA ARMONÍA';
    playTone(scene, 550, 0.2);
  } else {
    moveName = 'ATAQUE DÉBIL';
    playTone(scene, 300, 0.15);
  }
  
  let damage = baseDamage;
  
  if (gameState === 'player_turn') {
    // Animate player attack
    animateBirdAttack(scene, true);
    // Apply damage and animate AI hit
    aiHealth = Math.max(0, aiHealth - damage);
    if (damage > 0) {
      animateBirdHit(scene, false, damage, harmonyMeter);
    }
    playerHealth = Math.min(100, playerHealth + healAmount);
    score += damage * 10 + (combo * 5) + (harmonyMeter === 100 ? 100 : 0);
  } else {
    // Animate AI attack
    animateBirdAttack(scene, false);
    // Apply damage and animate player hit
    playerHealth = Math.max(0, playerHealth - damage);
    if (damage > 0) {
      animateBirdHit(scene, true, damage, harmonyMeter);
    }
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

  // Stun effect (80%+ harmony) - disables enemy for 1 full turn
  if (harmonyMeter >= 80) {
    const stunText = scene.add.text(400, 250, '¡ATURDIMIENTO!', { fontSize: '32px', color: '#ff00ff' }).setOrigin(0.5);
    scene.tweens.add({ targets: stunText, alpha: 0, y: stunText.y - 50, duration: 1000, onComplete: () => stunText.destroy() });

    // Apply stun status (1 turn) instead of extra damage
    if (gameState === 'player_turn') {
      aiStunned = true;
      stunTurnsRemaining.ai = 1;
      // Show stun effect on AI bird
      showStunEffect(scene, false);
    } else {
      playerStunned = true;
      stunTurnsRemaining.player = 1;
      // Show stun effect on player bird
      showStunEffect(scene, true);
    }
  }
  
  // Heal feedback - show above the bird that gets healed
  if (healAmount > 0) {
    const birdX = gameState === 'player_turn' ? 
      (scene.playerBirdX ? scene.playerBirdX.value : 150) : 
      (scene.aiBirdX ? scene.aiBirdX.value : 650);
    const birdY = gameState === 'player_turn' ? 
      (scene.playerBirdY ? scene.playerBirdY.value : 250) : 
      (scene.aiBirdY ? scene.aiBirdY.value : 250);
    showHealNumber(scene, birdX, birdY, healAmount);
  }
  
  lastHarmony = harmonyMeter;
  checkWinLose(scene);

  // If game ended, don't continue with turn transitions
  if (gameState === 'victory' || gameState === 'defeat') {
    return; // Stop execution, game is over
  }

  // Get current bird positions for attack visualization
  const playerX = scene.playerBirdX ? scene.playerBirdX.value : 150;
  const playerY = scene.playerBirdY ? scene.playerBirdY.value : 250;
  const aiX = scene.aiBirdX ? scene.aiBirdX.value : 650;
  const aiY = scene.aiBirdY ? scene.aiBirdY.value : 250;
  
  if (gameState === 'player_turn') {
    animateAttack(scene, scene.graphics, playerX, playerY, aiX, aiY, harmonyMeter, combo);
  } else if (gameState === 'ai_turn') {
    animateAttack(scene, scene.graphics, aiX, aiY, playerX, playerY, harmonyMeter, combo);
  }
  
  // Show combo feedback
  if (combo > 1) {
    const comboText = scene.add.text(400, 280, `¡COMBO x${combo}!`, { fontSize: '24px', color: '#ffff00' }).setOrigin(0.5);
    scene.tweens.add({ targets: comboText, alpha: 0, scale: 1.5, duration: 1000, onComplete: () => comboText.destroy() });
  }
}

function aiPlay(scene) {
  // Don't play if game has ended
  if (gameState === 'victory' || gameState === 'defeat') {
    return;
  }

  // Check if AI is stunned - skip turn
  if (aiStunned && stunTurnsRemaining.ai > 0) {
    stunTurnsRemaining.ai--;

    // Show stunned message
    scene.feedbackText.setAlpha(1).setVisible(true).setText('¡IA ATURDIDA - Pierde turno!');
    scene.tweens.add({ targets: scene.feedbackText, alpha: 0, duration: 1500, onComplete: () => scene.feedbackText.setVisible(false) });

    // Show stun effect on AI bird
    showStunEffect(scene, false);

    // If stun turns are over, clear stun status
    if (stunTurnsRemaining.ai === 0) {
      aiStunned = false;
    }

    // Skip to next turn
    turnCount++;
    generateTones();
    gameState = 'player_turn';
    scene.turnText.setText('Turno ' + turnCount + ' - Jugador').setColor('#00ff00');
    turnTimer = 15000;
    return;
  }

  const targetPitch = Math.random() < 0.5 ? environmentalTones.wind : environmentalTones.birds;
  selectedMelody.pitch = PITCHES.indexOf(targetPitch);
  if (selectedMelody.pitch === -1) selectedMelody.pitch = Math.floor(Math.random() * PITCHES.length); // Fallback
  selectedMelody.rhythm = Math.floor(Math.random() * RHYTHMS.length);
  selectedMelody.duration = Math.floor(Math.random() * DURATIONS.length);
  playHarmony(scene);

  // Check again after playHarmony (which calls checkWinLose)
  if (gameState === 'victory' || gameState === 'defeat') {
    return; // Game ended, stop
  }

  turnCount++;
  generateTones();
  gameState = 'player_turn';
  scene.turnText.setText('Turno ' + turnCount + ' - Jugador').setColor('#00ff00');

  scene.feedbackText.setAlpha(1).setVisible(true).setText(`Armonía IA ${harmonyMeter}% - ¡${Math.floor(harmonyMeter / 10)} de daño!`);
  scene.tweens.add({ targets: scene.feedbackText, alpha: 0, duration: 1500, onComplete: () => scene.feedbackText.setVisible(false) });
  turnTimer = 15000;
}

function resetGame(scene) {
  // Stop and destroy any tweens on victory/defeat texts
  if (scene.replayText) {
    scene.tweens.killTweensOf(scene.replayText);
    scene.replayText.destroy();
    scene.replayText = null;
  }
  
  // Destroy victory texts
  if (scene.victoryText) {
    scene.tweens.killTweensOf(scene.victoryText);
    scene.victoryText.destroy();
    scene.victoryText = null;
  }
  if (scene.victoryScoreText) {
    scene.victoryScoreText.destroy();
    scene.victoryScoreText = null;
  }
  
  // Destroy defeat texts
  if (scene.defeatText) {
    scene.tweens.killTweensOf(scene.defeatText);
    scene.defeatText.destroy();
    scene.defeatText = null;
  }
  if (scene.defeatScoreText) {
    scene.defeatScoreText.destroy();
    scene.defeatScoreText = null;
  }
  
  // Reset all game variables
  gameState = 'player_turn';
  turnCount = 1;
  playerHealth = 100;
  aiHealth = 100;
  turnTimer = 15000;
  combo = 0;
  score = 0;
  lastHarmony = 0;
  selectedMelody = { pitch: 0, rhythm: 0, duration: 0 };
  harmonyMeter = 0;

  // Reset stun system
  playerStunned = false;
  aiStunned = false;
  stunTurnsRemaining = { player: 0, ai: 0 };
  
  // Generate new environmental tones
  generateTones();
  
  // Reset UI elements
  scene.turnText.setText('Turno ' + turnCount + ' - Jugador').setColor('#00ff00').setVisible(true);
}

function checkWinLose(scene) {
  if (aiHealth <= 0) {
    gameState = 'victory';
    // Store references to texts for cleanup
    scene.victoryText = scene.add.text(400, 250, '¡VICTORIA!', { fontSize: '64px', color: '#00ff00', stroke: '#000000', strokeThickness: 6 }).setOrigin(0.5);
    scene.victoryScoreText = scene.add.text(400, 320, 'Puntos Finales: ' + score, { fontSize: '32px', color: '#00ffff' }).setOrigin(0.5);
    scene.replayText = scene.add.text(400, 400, 'Presiona ESPACIO para jugar de nuevo', { fontSize: '20px', color: '#00ff00' }).setOrigin(0.5);
    scene.tweens.add({ targets: scene.replayText, alpha: { from: 1, to: 0.5 }, duration: 1000, yoyo: true, repeat: -1 });
    scene.tweens.add({ targets: scene.victoryText, scale: { from: 0.5, to: 1 }, duration: 500, ease: 'Back.easeOut' });
    scene.cameras.main.shake(500, 0.03);
    playTone(scene, 523, 0.3); // C5
    scene.time.delayedCall(300, () => playTone(scene, 659, 0.3)); // E5
    scene.time.delayedCall(600, () => playTone(scene, 784, 0.3)); // G5
  } else if (playerHealth <= 0) {
    gameState = 'defeat';
    // Store references to texts for cleanup
    scene.defeatText = scene.add.text(400, 300, '¡DERROTA!', { fontSize: '64px', color: '#ff0000', stroke: '#000000', strokeThickness: 6 }).setOrigin(0.5);
    scene.defeatScoreText = scene.add.text(400, 370, 'Puntos Finales: ' + score, { fontSize: '32px', color: '#ffff00' }).setOrigin(0.5);
    scene.replayText = scene.add.text(400, 450, 'Presiona ESPACIO para jugar de nuevo', { fontSize: '20px', color: '#00ff00' }).setOrigin(0.5);
    scene.tweens.add({ targets: scene.replayText, alpha: { from: 1, to: 0.5 }, duration: 1000, yoyo: true, repeat: -1 });
    scene.tweens.add({ targets: scene.defeatText, scale: { from: 0.5, to: 1 }, duration: 500, ease: 'Back.easeOut' });
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

function animateBirdAttack(scene, isPlayer) {
  const birdX = isPlayer ? scene.playerBirdX : scene.aiBirdX;
  const baseX = isPlayer ? 150 : 650;
  const attackDistance = isPlayer ? 100 : -100; // Player attacks right, AI attacks left
  
  if (isPlayer) scene.isAttacking.player = true;
  else scene.isAttacking.ai = true;
  
  // Lunge forward
  scene.tweens.add({
    targets: birdX,
    value: baseX + attackDistance,
    duration: 150,
    ease: 'Power2',
    yoyo: true,
    repeat: 0,
    onComplete: () => {
      birdX.value = baseX;
      if (isPlayer) scene.isAttacking.player = false;
      else scene.isAttacking.ai = false;
    }
  });
  
  // Wing spread animation during attack
  const wingParam = isPlayer ? scene.playerBirdWingOffset : scene.aiBirdWingOffset;
  const originalValue = wingParam.value;
  scene.tweens.add({
    targets: wingParam,
    value: originalValue + 0.3,
    duration: 100,
    yoyo: true,
    repeat: 1,
    ease: 'Power2'
  });
}

function showDamageNumber(scene, x, y, damage, isCrit = false) {
  // Create damage text with style
  const damageText = scene.add.text(x, y - 50, '-' + damage, {
    fontSize: isCrit ? '36px' : '28px',
    color: isCrit ? '#ff00ff' : '#ff0000',
    stroke: '#000000',
    strokeThickness: 4,
    fontStyle: 'bold'
  }).setOrigin(0.5);

  // Animate: float up and fade out
  scene.tweens.add({
    targets: damageText,
    y: y - 120,
    alpha: 0,
    scale: isCrit ? 1.5 : 1.2,
    duration: 1200,
    ease: 'Power2',
    onComplete: () => {
      damageText.destroy();
    }
  });
  
  // Add slight X drift for more natural look
  const drift = (Math.random() - 0.5) * 30;
  scene.tweens.add({
    targets: damageText,
    x: x + drift,
    duration: 1200,
    ease: 'Sine.easeOut'
  });
}

function showHealNumber(scene, x, y, healAmount) {
  // Create heal text with green color
  const healText = scene.add.text(x, y - 60, '+' + healAmount, {
    fontSize: '24px',
    color: '#00ff00',
    stroke: '#000000',
    strokeThickness: 3,
    fontStyle: 'bold'
  }).setOrigin(0.5);

  // Animate: float up and fade out
  scene.tweens.add({
    targets: healText,
    y: y - 100,
    alpha: 0,
    scale: 1.3,
    duration: 1000,
    ease: 'Power2',
    onComplete: () => {
      healText.destroy();
    }
  });
}

function showStunEffect(scene, isPlayer) {
  const birdX = isPlayer ?
    (scene.playerBirdX ? scene.playerBirdX.value : 150) :
    (scene.aiBirdX ? scene.aiBirdX.value : 650);
  const birdY = isPlayer ?
    (scene.playerBirdY ? scene.playerBirdY.value : 250) :
    (scene.aiBirdY ? scene.aiBirdY.value : 250);

  // Create stun stars effect around the bird
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const distance = 80;
    const starX = birdX + Math.cos(angle) * distance;
    const starY = birdY + Math.sin(angle) * distance;

    // Create star emoji text
    const starText = scene.add.text(starX, starY, '⭐', { fontSize: '20px' }).setOrigin(0.5);

    // Animate stars spinning and fading
    scene.tweens.add({
      targets: starText,
      angle: 360,
      alpha: 0,
      scale: 1.5,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => starText.destroy()
    });
  }

  // Create "STUNNED" text above the bird
  const stunnedText = scene.add.text(birdX, birdY - 80, 'ATURDIDO', {
    fontSize: '16px',
    color: '#ff00ff',
    stroke: '#000000',
    strokeThickness: 2,
    fontStyle: 'bold'
  }).setOrigin(0.5);

  // Animate stunned text
  scene.tweens.add({
    targets: stunnedText,
    y: birdY - 100,
    alpha: 0,
    duration: 1500,
    ease: 'Power2',
    onComplete: () => stunnedText.destroy()
  });
}

function animateBirdHit(scene, isPlayer, damage = 0, harmonyPercent = 0) {
  const birdX = isPlayer ? scene.playerBirdX : scene.aiBirdX;
  const birdY = isPlayer ? scene.playerBirdY : scene.aiBirdY;
  const birdColor = isPlayer ? scene.playerBirdColor : scene.aiBirdColor;
  const baseX = isPlayer ? 150 : 650;
  const knockback = isPlayer ? -20 : 20;
  
  if (isPlayer) scene.isHit.player = true;
  else scene.isHit.ai = true;
  
  // Show damage number above bird
  if (damage > 0) {
    const currentX = birdX.value || baseX;
    const currentY = birdY.value || 200;
    // Critical hit detection: high harmony (90%+) or very high damage (15+)
    const isCrit = damage >= 15 || harmonyPercent >= 90;
    showDamageNumber(scene, currentX, currentY, damage, isCrit);
  }
  
  // Knockback animation
  scene.tweens.add({
    targets: birdX,
    value: baseX + knockback,
    duration: 100,
    ease: 'Power2',
    yoyo: true,
    repeat: 2,
    onComplete: () => {
      birdX.value = baseX;
      if (isPlayer) scene.isHit.player = false;
      else scene.isHit.ai = false;
    }
  });
  
  // Color flash (red flash effect)
  scene.tweens.add({
    targets: birdColor,
    value: 2.0, // Bright red flash
    duration: 50,
    yoyo: true,
    repeat: 5,
    ease: 'Linear',
    onComplete: () => {
      birdColor.value = 1.0;
    }
  });
  
  // Shake effect
  const shakeTarget = isPlayer ? scene.playerBirdY : scene.aiBirdY;
  const originalY = shakeTarget.value;
  scene.tweens.add({
    targets: shakeTarget,
    value: originalY + 5,
    duration: 30,
    yoyo: true,
    repeat: 6,
    ease: 'Linear',
    onComplete: () => {
      shakeTarget.value = originalY;
    }
  });
}
