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
let turnCnt = 0;
let playerHealth = 100;
let aiHealth = 100;
let graphics;

// Stun system variables
let playerStunned = false;
let aiStunned = false;
let stunTurnsRemaining = { player: 0, ai: 0 };

// Environmental power-ups
let activePowerUps = { player: null, ai: null };
let powerUpTurnsRemaining = { player: 0, ai: 0 };

// Background music
let backgroundMusic = null;
let backgroundMusicEnabled = true;

// Pre-generated mountain data to prevent flickering
let mountainData = null;

// Mouse controls - direct click on melody

const PITCHES = ['Grave', 'Bajo', 'Medio', 'Alto', 'Agudo', 'Muy Alto', 'Estridente', 'Celestial'];
const RHYTHMS = ['Lento', 'Normal', 'Rápido', 'Veloz'];
const DURATIONS = ['Breve', 'Medio', 'Extendido'];

// Environmental power-ups
const POWER_UPS = {
  WIND_GUST: 'wind_gust',     // 1.5x damage for 2 turns
  BIRD_FLOCK: 'bird_flock',   // +20% harmony for 3 turns
  MUSICAL_ECHO: 'musical_echo' // Copy opponent's successful pitch for 1 turn
};

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

  // Start background music immediately on game load
  startBackgroundMusic(this);

  // Menu text as group for easy destroy
  this.menuTexts = [];

  // Main title with glow effect
  const titleText = this.add.text(400, 150, "El Duelo Sinfónico del Zarapito", {
    fontSize: '32px',
    color: '#00ffff',
    stroke: '#0088ff',
    strokeThickness: 2
  }).setOrigin(0.5);
  this.menuTexts.push(titleText);

  // Subtitle
  const subtitleText = this.add.text(400, 190, "¡Armonías Musicales en el Aire!", {
    fontSize: '16px',
    color: '#ffff88',
    fontStyle: 'italic'
  }).setOrigin(0.5);
  this.menuTexts.push(subtitleText);

  // Start text
  const startText = this.add.text(400, 350, 'Click para Jugar', {
    fontSize: '20px',
    color: '#00ff00'
  }).setOrigin(0.5);
  this.menuTexts.push(startText);

  // Credits with typewriter effect
  const creditsText = this.add.text(400, 450, '', {
    fontSize: '14px',
    color: '#ffffff',
    fontStyle: 'italic'
  }).setOrigin(0.5);
  this.menuTexts.push(creditsText);

  // Typewriter effect for credits
  const creditsString = "Un juego de Juan Latorre";
  let charIndex = 0;
  const typewriterInterval = setInterval(() => {
    if (charIndex < creditsString.length) {
      creditsText.setText(creditsString.substring(0, charIndex + 1));
      charIndex++;

      // Add a little bounce effect on each character
      this.tweens.add({
        targets: creditsText,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 50,
        yoyo: true,
        ease: 'Power2'
      });
    } else {
      clearInterval(typewriterInterval);
      // Rainbow effect after typing is complete
      startRainbowEffect(this, creditsText);
    }
  }, 100);

  // Pulsing title effect
  this.tweens.add({
    targets: titleText,
    scale: { from: 1, to: 1.02 },
    duration: 2000,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });

  // Floating subtitle
  this.tweens.add({
    targets: subtitleText,
    y: { from: 190, to: 185 },
    duration: 2500,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });

  // Tween for start text
  this.tweens.add({
    targets: startText,
    alpha: { from: 1, to: 0.5 },
    duration: 1000,
    yoyo: true,
    repeat: -1
  });

  // Add floating musical notes (created once)
  addMenuDecorations(this);

  // Global click to start from menu and tutorial
  this.input.on('pointerdown', (pointer, gameObjects) => {
    if (gameState === 'menu' && gameObjects.length === 0) { // Only if clicking on empty space in menu
      gameState = 'tutorial';
      if (this.menuTexts) this.menuTexts.forEach(text => text.setVisible(false));
      createTutorial(this);
    } else if (gameState === 'tutorial' && gameObjects.length === 0) { // Only if clicking on empty space in tutorial
      gameState = 'player_turn';
      turnCnt = 1;
      turnTimer = 15000;
      combo = 0;
      score = 0;
      lastHarmony = 0;
      if (this.tutorialTexts) this.tutorialTexts.forEach(text => text.setVisible(false));
      this.turnText.setVisible(true);
      // Start background music when gameplay begins
      startBackgroundMusic(this);
    }
  });

  // Create clickable controls
  this.attackButton = createAttackButton(this);
  createRhythmDurationControls(this);

  // Tutorial texts
  this.tutorialTexts = [];

  this.input.keyboard.on('keydown-M', () => {
    const wasEnabled = backgroundMusicEnabled;
    backgroundMusicEnabled = !backgroundMusicEnabled;

    if (!backgroundMusicEnabled) {
      stopBackgroundMusic();
    } else if (!wasEnabled && !backgroundMusic) {
      // Music was disabled and now enabled, restart it
      startBackgroundMusic(this);
    }

    // Show feedback
    const musicText = backgroundMusicEnabled ? '🎵 Música ON' : '🔇 Música OFF';
    this.feedbackText.setAlpha(1).setVisible(true).setText(musicText);
    this.tweens.add({ targets: this.feedbackText, alpha: 0, duration: 1500, onComplete: () => this.feedbackText.setVisible(false) });
  });

  this.turnText = this.add.text(400, 30, '', { fontSize: '20px', color: '#00ff00' }).setOrigin(0.5).setVisible(false);
  
  // Initialize tone labels array
  this.toneLabels = [];
  this.matchText = null;
  this.legendText = null;
  this.melodyInfoText = null;

  // Generate initial tones
  generateTones();

  // Pre-generate mountain data to prevent flickering
  generateMountainData();

  // Melody UI texts (create once)
  this.pitchText = this.add.text(100, 350, '', { fontSize: '16px', color: '#ffffff' }).setVisible(false);
  this.rhythmText = this.add.text(300, 350, '', { fontSize: '16px', color: '#ffffff' }).setVisible(false);
  this.durationText = this.add.text(500, 350, '', { fontSize: '16px', color: '#ffffff' }).setVisible(false);

  this.instructionsText = this.add.text(400, 560, 'Click en tonos para cambiar | Click en Ritmo/Duración | Click ¡Armonizar! para atacar | M: Música', { fontSize: '8px', color: '#ffff00', align: 'center' }).setOrigin(0.5).setVisible(false);
  this.windText = this.add.text(150, 420, '', { fontSize: '14px', color: '#00ffff' }).setOrigin(0.5).setVisible(false); // Under player bird
  this.birdsText = this.add.text(650, 420, '', { fontSize: '14px', color: '#ff8800' }).setOrigin(0.5).setVisible(false); // Under AI bird
  this.feedbackText = this.add.text(400, 200, '', { fontSize: '18px', color: '#00ffff' }).setOrigin(0.5).setVisible(false);


  this.playerHPText = this.add.text(125, 28, 'HP: 100/100', { fontSize: '12px', color: '#00ff00' }).setOrigin(0.5).setVisible(false);
  this.aiHPText = this.add.text(675, 28, 'HP: 100/100', { fontSize: '12px', color: '#ff0000' }).setOrigin(0.5).setVisible(false);
  this.scoreText = this.add.text(400, 10, '⭐ Puntos: 0', { fontSize: '16px', color: '#00ffff', fontStyle: 'bold' }).setOrigin(0.5).setVisible(false);

  this.input.on('pointerdown', () => {
    if (this.sound.context.state === 'suspended') this.sound.context.resume();
  });

  this.timerText = this.add.text(500, 70, '7s', { fontSize: '12px', color: '#ffffff' }).setVisible(false);

  // Create dynamic idle animations for birds
  // Player bird animation params
  this.playerBirdY = { value: 250 };
  this.playerBirdNeckAngle = { value: 0 };
  this.playerBirdBodyTilt = { value: 0 };
  this.playerBirdWingOffset = { value: 0 };
  this.playerBirdHeadBob = { value: 0 };
  
  // AI bird animation params
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
  scene.graphics.clear();

  // Dynamic sky gradient background
  drawSkyGradient(scene.graphics);

  // Animated clouds
  drawClouds(scene.graphics, scene.time.now);

  // Weather effects based on current environmental tones
  drawWeatherEffects(scene.graphics, scene.time.now);

  // Semi-transparent overlay for text readability
  scene.graphics.fillStyle(0x000000, 0.4);
  scene.graphics.fillRect(0, 0, 800, 600);

  // Bird silhouettes in background (more subtle now)
  scene.graphics.fillStyle(0x000000, 0.05);
  for (let i = 0; i < 3; i++) {
    const birdX = 100 + i * 250;
    const birdY = 150 + i * 50;

    // Draw bird body as ellipse
    scene.graphics.fillEllipse(birdX, birdY, 50, 25);

    // Wings
    scene.graphics.fillEllipse(birdX - 30, birdY, 25, 40);
    scene.graphics.fillEllipse(birdX + 30, birdY, 25, 40);
  }

  // Decorative birds - bigger size but more subtle
  drawBird(scene.graphics, 200, 400, 35, 0x8b4513, false, 1);
  drawBird(scene.graphics, 600, 400, 35, 0x654321, true, -1);
}

function createTutorial(scene) {
  if (scene.tutorialTexts && scene.tutorialTexts.length > 0) return; // Already created
  
  scene.tutorialTexts = [];
  const y = 50;
  let spacing = 28;
  
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
  const t6c = scene.add.text(400, y + spacing * 9, 'El CLIMA afecta tu armonía: 💨 Viento = -10%  🌪️ Vendaval = -20%  🐦 Bandada = +15%', { fontSize: '12px', color: '#87CEEB' }).setOrigin(0.5).setVisible(true);
  scene.tutorialTexts.push(t6c);
  const t7 = scene.add.text(400, y + spacing * 10, 'Controles: Click en tonos individuales | Click en Ritmo/Duración | Click ¡Armonizar!', { fontSize: '12px', color: '#ffff00' }).setOrigin(0.5).setVisible(true);
  scene.tutorialTexts.push(t7);
  
  const t8 = scene.add.text(400, y + spacing * 12, '✨ ESPECIALES', { fontSize: '24px', color: '#ffff00' }).setOrigin(0.5).setVisible(true);
  scene.tutorialTexts.push(t8);
  const t9 = scene.add.text(400, y + spacing * 13, '100% = PERFECTA (doble daño + cura)', { fontSize: '14px', color: '#ff00ff' }).setOrigin(0.5).setVisible(true);
  scene.tutorialTexts.push(t9);
  const t10 = scene.add.text(400, y + spacing * 14, '80%+ = ATURDIMIENTO (enemigo pierde 1 turno)', { fontSize: '14px', color: '#ff00ff' }).setOrigin(0.5).setVisible(true);
  scene.tutorialTexts.push(t10);
  const t11 = scene.add.text(400, y + spacing * 15, '💨 VIENTO FUERTE: 1.5x daño por 2 turnos', { fontSize: '12px', color: '#0088ff' }).setOrigin(0.5).setVisible(true);
  scene.tutorialTexts.push(t11);
  const t12 = scene.add.text(400, y + spacing * 16, '🐦 BANDADA: +20% armonía por 3 turnos', { fontSize: '12px', color: '#ffff00' }).setOrigin(0.5).setVisible(true);
  scene.tutorialTexts.push(t12);
  const t13 = scene.add.text(400, y + spacing * 17, '🎵 ECO MUSICAL: Copia tono exitoso rival', { fontSize: '12px', color: '#ff00ff' }).setOrigin(0.5).setVisible(true);
  scene.tutorialTexts.push(t13);
  const t14 = scene.add.text(400, y + spacing * 18, 'Combos aumentan daño', { fontSize: '14px', color: '#ffff00' }).setOrigin(0.5).setVisible(true);
  scene.tutorialTexts.push(t14);
  
  const continueText = scene.add.text(400, 540, 'Haz click en cualquier lugar para comenzar', { fontSize: '20px', color: '#00ff00' }).setOrigin(0.5).setVisible(true);
  scene.tutorialTexts.push(continueText);

  scene.tweens.add({ targets: continueText, alpha: { from: 1, to: 0.5 }, duration: 1000, yoyo: true, repeat: -1 });
  
}

function drawTutorial(scene) {
  scene.graphics.clear();

  // Same dynamic background as menu
  drawSkyGradient(scene.graphics);
  drawClouds(scene.graphics, scene.time.now);
  drawWeatherEffects(scene.graphics, scene.time.now);

  // Semi-transparent overlay for text readability (full screen)
  scene.graphics.fillStyle(0x000000, 0.5);
  scene.graphics.fillRect(0, 0, 800, 600);

  // Draw example birds - bigger size but more subtle with overlay
  scene.graphics.fillStyle(0x8b4513, 0.3); // More transparent
  drawBird(scene.graphics, 200, 450, 40, 0x8b4513, true, 1);
  scene.graphics.fillStyle(0x654321, 0.3); // More transparent
  drawBird(scene.graphics, 600, 450, 40, 0x654321, false, -1);
}

function update(time, delta) {
  this.graphics.clear();

  if (gameState === 'menu') {
    drawMenu(this);
    this.menuTexts.forEach(t => t.setVisible(true));
    this.turnText.setVisible(false);
    if (this.tutorialTexts) this.tutorialTexts.forEach(t => t.setVisible(false));
    // Hide mouse controls in menu
    if (this.rhythmControl) this.rhythmControl.setVisible(false);
    if (this.durationControl) this.durationControl.setVisible(false);
    // Hide attack button in menu
    if (this.attackButton) this.attackButton.setVisible(false);
    // Hide weather indicator in menu
    if (this.weatherText) this.weatherText.setVisible(false);
  } else if (gameState === 'tutorial') {
    drawTutorial(this);
    // Hide all gameplay UI
    if (this.menuTexts) this.menuTexts.forEach(t => t.setVisible(false));
    if (this.turnText) this.turnText.setVisible(false);
    if (this.pitchText) this.pitchText.setVisible(false);
    if (this.rhythmText) this.rhythmText.setVisible(false);
    if (this.durationText) this.durationText.setVisible(false);
    if (this.windText) this.windText.setVisible(false);
    if (this.birdsText) this.birdsText.setVisible(false);
    if (this.scoreText) this.scoreText.setVisible(false);
    if (this.timerText) this.timerText.setVisible(false);
    if (this.timerIcon) this.timerIcon.setVisible(false);
    if (this.instructionsText) this.instructionsText.setVisible(false);
    if (this.weatherText) this.weatherText.setVisible(false);
    // Show tutorial texts
    if (this.tutorialTexts && this.tutorialTexts.length > 0) {
      this.tutorialTexts.forEach((t, i) => {
        if (t && t.active !== false) {
          t.setVisible(true);
        }
      });
    } else {
      createTutorial(this);
    }
  } else if (gameState === 'player_turn' || gameState === 'ai_turn') {
    // Dynamic background for gameplay
    drawSkyGradient(this.graphics);
    drawClouds(this.graphics, time);

    // Draw distant mountains/hills for depth
    drawMountains(this.graphics);

    // Weather effects
    drawWeatherEffects(this.graphics, time);

    // Draw birds with dynamic idle animation
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
    
    // Draw with dynamic animations
    const baseSize = 110; // Increased from 85 to make birds bigger
    drawBird(this.graphics, playerX, playerY, baseSize, 0x8b4513, true, 1, playerAnim);
    drawBird(this.graphics, aiX, aiY, baseSize, 0x654321, false, -1, aiAnim);

    // Environmental tones and weather status
    this.windText.setText('🌬️ ' + envTones.wind).setVisible(true);
    this.birdsText.setText('🐦 ' + envTones.birds).setVisible(true);

    // Weather status indicator
    const currentWeather = getCurrentWeather();
    if (!this.weatherText) {
      this.weatherText = this.add.text(400, 60, currentWeather, {
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: { x: 8, y: 4 },
        fontStyle: 'bold'
      }).setOrigin(0.5).setVisible(true);
    } else {
      this.weatherText.setText(currentWeather).setVisible(true);
    }
    
    // Score only shown during gameplay (not cluttering defeat/victory)
    this.scoreText.setText('⭐ Puntos: ' + score).setVisible(true);

    if (gameState === 'player_turn') {
      this.turnText.setText('Turno ' + turnCnt).setColor('#00ff00').setVisible(true).setPosition(400, 30);

      // Check if player is stunned at start of turn - skip automatically
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

        // Skip to AI turn immediately
        gameState = 'ai_turn';
        this.turnText.setText('Turno ' + turnCnt + ' - IA').setColor('#ff0000');
        this.time.delayedCall(1000, () => aiPlay(this));
        return;
      }
      
      // Update harmony in real-time
      calculateHarmony();
      updateAttackButton(this, harmony);

      // Tone selector
      drawToneSelector(this.graphics, 100, 480, 600, 25, selectedMelody.pitch);
      
      // Tone labels directly on selector
      const pitchWidth = 600 / PITCHES.length;
      for (let i = 0; i < PITCHES.length; i++) {
        const px = 100 + i * pitchWidth + pitchWidth / 2;
        const labelColor = (PITCHES[i] === envTones.wind || PITCHES[i] === envTones.birds) ? '#ffffff' : '#888888';
        if (!this.toneLabels) this.toneLabels = [];
        if (!this.toneLabels[i]) {
          this.toneLabels[i] = this.add.text(px, 492, PITCHES[i], { fontSize: '11px', color: labelColor }).setOrigin(0.5).setInteractive();

          // Make it clickable immediately
          this.toneLabels[i].on('pointerdown', () => {
            selectedMelody.pitch = i;
            calculateHarmony();
            updateAttackButton(this, harmony);
            // Update the display immediately
            if (this.melodyInfoText) {
              const melodyInfo = 'ACTUAL: ' + PITCHES[selectedMelody.pitch] + ' | ' + RHYTHMS[selectedMelody.rhythm] + ' | ' + DURATIONS[selectedMelody.duration];
              this.melodyInfoText.setText(melodyInfo);
            }
            // Visual feedback
            this.tweens.add({
              targets: this.toneLabels[i],
              scaleX: 1.2,
              scaleY: 1.2,
              duration: 100,
              yoyo: true
            });
          });

          // Hover effects
          this.toneLabels[i].on('pointerover', () => {
            this.toneLabels[i].setColor('#ffff00');
          });

          this.toneLabels[i].on('pointerout', () => {
            const isMatch = (PITCHES[i] === envTones.wind || PITCHES[i] === envTones.birds);
            this.toneLabels[i].setColor(isMatch ? '#ffffff' : '#888888');
          });
        } else {
          this.toneLabels[i].setText(PITCHES[i]).setColor(labelColor).setVisible(true);
        }
      }

      // Current melody display (shows what's currently selected)
      const melodyInfo = 'ACTUAL: ' + PITCHES[selectedMelody.pitch] + ' | ' + RHYTHMS[selectedMelody.rhythm] + ' | ' + DURATIONS[selectedMelody.duration];
      if (!this.melodyInfoText) {
        this.melodyInfoText = this.add.text(400, 530, melodyInfo, {
          fontSize: '12px',
          color: '#cccccc',
          backgroundColor: 'rgba(100,100,100,0.3)',
          padding: { x: 10, y: 5 },
          fontStyle: 'bold'
        }).setOrigin(0.5);
      } else {
        this.melodyInfoText.setText(melodyInfo).setVisible(true);
      }
      

      turnTimer -= delta;
      this.timerText.setText(Math.ceil(turnTimer / 1000) + 's').setVisible(true).setPosition(500, 70);

      // Enhanced timer bar - more visible and clear
      const timerBarWidth = 120;
      const timerBarHeight = 12;
      const timerBarX = 340;
      const timerBarY = 95;

      // Timer icon
      if (!this.timerIcon) {
        this.timerIcon = this.add.text(timerBarX - 25, timerBarY - 2, '⏰', { fontSize: '14px' });
      }
      this.timerIcon.setVisible(true).setPosition(timerBarX - 25, timerBarY - 2);

      // Background bar (gray)
      this.graphics.fillStyle(0x333333, 0.8);
      this.graphics.fillRect(timerBarX, timerBarY, timerBarWidth, timerBarHeight);

      // Timer progress bar with color changes
      let timerColor = 0x00ff00; // Green by default
      if (turnTimer < 3000) timerColor = 0xff0000; // Red when < 3 seconds
      else if (turnTimer < 7000) timerColor = 0xffff00; // Yellow when < 7 seconds

      const progressWidth = (turnTimer / 15000) * timerBarWidth;
      this.graphics.fillStyle(timerColor, 1);
      this.graphics.fillRect(timerBarX, timerBarY, progressWidth, timerBarHeight);

      // Border
      this.graphics.lineStyle(2, 0xffffff, 1);
      this.graphics.strokeRect(timerBarX, timerBarY, timerBarWidth, timerBarHeight);

      // Pulsing effect when time is low
      if (turnTimer < 3000) {
        const pulseAlpha = (Math.sin(this.time.now / 100) + 1) / 2 * 0.3 + 0.7;
        this.graphics.fillStyle(0xff0000, pulseAlpha);
        this.graphics.fillRect(timerBarX, timerBarY, progressWidth, timerBarHeight);
      }
      
      // Instructions at very bottom
      this.instructionsText.setVisible(true).setPosition(400, 560);

      // Show mouse controls
      if (this.rhythmControl) this.rhythmControl.setVisible(true);
      if (this.durationControl) this.durationControl.setVisible(true);
      if (this.attackButton) this.attackButton.setVisible(true);

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
        this.turnText.setText('Turno ' + turnCnt + ' - IA').setColor('#ff0000');
        this.time.delayedCall(500, () => aiPlay(this));
        turnTimer = 15000;
      }
    } else if (gameState === 'ai_turn') {
      this.turnText.setText('Turno ' + turnCnt + ' - IA').setColor('#ff0000').setVisible(true).setPosition(400, 30);
      // Hide melody UI during AI turn
      this.pitchText.setVisible(false);
      this.rhythmText.setVisible(false);
      this.durationText.setVisible(false);
      this.timerText.setVisible(false);
      if (this.timerIcon) this.timerIcon.setVisible(false);
      this.instructionsText.setVisible(false);
      if (this.toneLabels) this.toneLabels.forEach(l => l.setVisible(false));
      if (this.matchText) this.matchText.setVisible(false);
      if (this.legendText) this.legendText.setVisible(false);
      if (this.melodyInfoText) this.melodyInfoText.setVisible(false);
      if (this.rhythmControl) this.rhythmControl.setVisible(false);
      if (this.durationControl) this.durationControl.setVisible(false);
      if (this.attackButton) this.attackButton.setVisible(false);
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
    if (this.timerIcon) this.timerIcon.setVisible(false);
    this.instructionsText.setVisible(false);
    this.feedbackText.setVisible(false);
    if (this.toneLabels) this.toneLabels.forEach(l => l.setVisible(false));
    if (this.matchText) this.matchText.setVisible(false);
    if (this.legendText) this.legendText.setVisible(false);
    if (this.melodyInfoText) this.melodyInfoText.setVisible(false);
    if (this.rhythmControl) this.rhythmControl.setVisible(false);
    if (this.durationControl) this.durationControl.setVisible(false);
    if (this.attackButton) this.attackButton.setVisible(false);
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

    
    // Compact score at top center
    this.scoreText.setPosition(400, 10).setVisible(true);

    // Wind/Birds positioned under their respective birds
    this.windText.setPosition(150, 420).setVisible(true);  // Under player bird (x=150)
    this.birdsText.setPosition(650, 420).setVisible(true);  // Under AI bird (x=650)

    // Power-up indicators
    drawPowerUpIndicators(this.graphics, activePowerUps, powerUpTurnsRemaining);

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
    if (this.timerIcon) this.timerIcon.setVisible(false);
    if (this.toneLabels) this.toneLabels.forEach(l => l.setVisible(false));
    if (this.matchText) this.matchText.setVisible(false);
    if (this.legendText) this.legendText.setVisible(false);
  }

  // Note: These texts recreate each frame—optimize by creating once if needed, but fine for now.
}

const FREQUENCIES = {
  'Grave': 261.63,      // C4
  'Bajo': 293.66,       // D4
  'Medio': 329.63,      // E4
  'Alto': 349.23,       // F4
  'Agudo': 392.00,      // G4
  'Muy Alto': 440.00,   // A4
  'Estridente': 493.88, // B4
  'Celestial': 523.25   // C5
};

let envTones = { wind: '', birds: '' };
let harmony = 0;
let turnTimer = 15000; // 15 seconds
let combo = 0;
let score = 0;
let lastHarmony = 0;
let lastSuccessfulPitch = { player: null, ai: null }; // For musical echo power-up
let birdPositions = { player: { baseY: 250, offsetY: 0 }, ai: { baseY: 250, offsetY: 0 } };

function generateTones() {
  envTones.wind = PITCHES[Math.floor(Math.random() * PITCHES.length)];
  envTones.birds = PITCHES[Math.floor(Math.random() * PITCHES.length)];
}

function activateEnvironmentalPowerUp(scene, isPlayer) {
  // 15% chance to activate a power-up after a successful harmony (>=60%)
  if (Math.random() > 0.15) return;

  const powerUps = Object.values(POWER_UPS);
  const randomPowerUp = powerUps[Math.floor(Math.random() * powerUps.length)];

  const target = isPlayer ? 'player' : 'ai';

  // Set the power-up
  activePowerUps[target] = randomPowerUp;

  // Set duration based on power-up type
  switch (randomPowerUp) {
    case POWER_UPS.WIND_GUST:
      powerUpTurnsRemaining[target] = 2;
      break;
    case POWER_UPS.BIRD_FLOCK:
      powerUpTurnsRemaining[target] = 3;
      break;
    case POWER_UPS.MUSICAL_ECHO:
      powerUpTurnsRemaining[target] = 1;
      break;
  }

  // Show visual effect
  showPowerUpEffect(scene, isPlayer, randomPowerUp);
}

function showPowerUpEffect(scene, isPlayer, powerUpType) {
  const birdX = isPlayer ?
    (scene.playerBirdX ? scene.playerBirdX.value : 150) :
    (scene.aiBirdX ? scene.aiBirdX.value : 650);
  const birdY = isPlayer ?
    (scene.playerBirdY ? scene.playerBirdY.value : 250) :
    (scene.aiBirdY ? scene.aiBirdY.value : 250);

  let effectText = '';
  let effectColor = '#00ff00';
  let effectIcon = '';

  switch (powerUpType) {
    case POWER_UPS.WIND_GUST:
      effectText = '¡VIENTO FUERTE!';
      effectColor = '#0088ff';
      effectIcon = '💨';
      break;
    case POWER_UPS.BIRD_FLOCK:
      effectText = '¡BANDADA!';
      effectColor = '#ffff00';
      effectIcon = '🐦';
      break;
    case POWER_UPS.MUSICAL_ECHO:
      effectText = '¡ECO MUSICAL!';
      effectColor = '#ff00ff';
      effectIcon = '🎵';
      break;
  }

  // Create floating icon
  const iconText = scene.add.text(birdX, birdY - 60, effectIcon, { fontSize: '24px' }).setOrigin(0.5);
  scene.tweens.add({
    targets: iconText,
    y: birdY - 100,
    alpha: 0,
    scale: 1.5,
    duration: 2000,
    ease: 'Power2',
    onComplete: () => iconText.destroy()
  });

  // Create effect text
  const effectTextObj = scene.add.text(birdX, birdY - 30, effectText, {
    fontSize: '14px',
    color: effectColor,
    stroke: '#000000',
    strokeThickness: 2,
    fontStyle: 'bold'
  }).setOrigin(0.5);

  scene.tweens.add({
    targets: effectTextObj,
    y: birdY - 70,
    alpha: 0,
    duration: 1500,
    ease: 'Power2',
    onComplete: () => effectTextObj.destroy()
  });
}

function playHarmony(scene) {
  const pitch = PITCHES[selectedMelody.pitch];
  const frequency = FREQUENCIES[pitch];
  let durationSec = 0.5;
  if (DURATIONS[selectedMelody.duration] === 'Breve') durationSec = 0.3;
  else if (DURATIONS[selectedMelody.duration] === 'Extendido') durationSec = 1.0;

  calculateHarmony(); // Calculate harmony first to get the percentage
  playHarmonySound(scene, harmony, pitch, durationSec);
  applyEffects(scene);
}

function calculateHarmony() {
  const currentPlayer = gameState === 'player_turn' ? 'player' : 'ai';
  const opponent = gameState === 'player_turn' ? 'ai' : 'player';

  // Apply musical echo power-up (copy opponent's successful pitch)
  let effectivePitchIndex = selectedMelody.pitch;
  if (activePowerUps[currentPlayer] === POWER_UPS.MUSICAL_ECHO && powerUpTurnsRemaining[currentPlayer] > 0 && lastSuccessfulPitch[opponent]) {
    const echoPitchIndex = PITCHES.indexOf(lastSuccessfulPitch[opponent]);
    if (echoPitchIndex !== -1) {
      effectivePitchIndex = echoPitchIndex;
    }
  }

  harmony = 0;
  if (PITCHES[effectivePitchIndex] === envTones.wind) harmony += 30;
  if (PITCHES[effectivePitchIndex] === envTones.birds) harmony += 30;
  if (RHYTHMS[selectedMelody.rhythm] === 'Rápido') harmony += 20;
  if (DURATIONS[selectedMelody.duration] === 'Medio') harmony += 20;

  // Apply bird flock power-up bonus (+20% harmony)
  if (activePowerUps[currentPlayer] === POWER_UPS.BIRD_FLOCK && powerUpTurnsRemaining[currentPlayer] > 0) {
    harmony += 20;
  }

  // Apply weather modifier
  const weatherMod = getWeatherModifier();
  harmony += weatherMod;

  harmony = Math.max(0, Math.min(100, harmony));
}

function drawPowerUpIndicators(graphics, activePowerUps, powerUpTurnsRemaining) {
  // Player power-up indicator (above player bird)
  if (activePowerUps.player && powerUpTurnsRemaining.player > 0) {
    const icon = getPowerUpIcon(activePowerUps.player);
    const color = getPowerUpColor(activePowerUps.player);

    // Draw background circle
    graphics.fillStyle(color, 0.8);
    graphics.fillCircle(150, 180, 20);

    // Draw icon text (using Phaser text instead of graphics.fillText)
    // We'll handle this differently - just draw the circle for now
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.strokeCircle(150, 180, 20);
  }

  // AI power-up indicator (above AI bird)
  if (activePowerUps.ai && powerUpTurnsRemaining.ai > 0) {
    const icon = getPowerUpIcon(activePowerUps.ai);
    const color = getPowerUpColor(activePowerUps.ai);

    // Draw background circle
    graphics.fillStyle(color, 0.8);
    graphics.fillCircle(650, 180, 20);

    // Draw border
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.strokeCircle(650, 180, 20);
  }
}

function getPowerUpIcon(powerUpType) {
  switch (powerUpType) {
    case POWER_UPS.WIND_GUST: return '💨';
    case POWER_UPS.BIRD_FLOCK: return '🐦';
    case POWER_UPS.MUSICAL_ECHO: return '🎵';
    default: return '?';
  }
}

function getPowerUpColor(powerUpType) {
  switch (powerUpType) {
    case POWER_UPS.WIND_GUST: return 0x0088ff;
    case POWER_UPS.BIRD_FLOCK: return 0xffff00;
    case POWER_UPS.MUSICAL_ECHO: return 0xff00ff;
    default: return 0xffffff;
  }
}

function drawToneSelector(graphics, x, y, width, height, selectedIdx) {
  const pitchWidth = width / PITCHES.length;
  const matchWind = PITCHES.indexOf(envTones.wind);
  const matchBirds = PITCHES.indexOf(envTones.birds);
  
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
  const currentPlayer = gameState === 'player_turn' ? 'player' : 'ai';
  const opponent = gameState === 'player_turn' ? 'ai' : 'player';

  let baseDamage = Math.floor(harmony / 10);
  let moveName = '';
  let healAmount = 0;

  // Apply wind gust power-up (1.5x damage)
  if (activePowerUps[currentPlayer] === POWER_UPS.WIND_GUST && powerUpTurnsRemaining[currentPlayer] > 0) {
    baseDamage = Math.floor(baseDamage * 1.5);
  }

  // Combo system (chain good harmonies)
  if (harmony >= 50 && lastHarmony >= 50) {
    combo++;
    if (combo > 1) baseDamage += combo;
  } else if (harmony < 50) {
    combo = 0;
  }
  
  // Special moves and effects based on harmony
  if (harmony === 100) {
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
  } else if (harmony >= 90) {
    moveName = '¡GRAN ARMONÍA!';
    baseDamage = Math.floor(baseDamage * 1.5);
    healAmount = 3;
    scene.cameras.main.shake(250, 0.015);
    playTone(scene, 750, 0.3);
  } else if (harmony >= 80) {
    moveName = '¡ATAQUE ATURDIDOR!';
    baseDamage += 3;
    scene.cameras.main.shake(200, 0.01);
    playTone(scene, 650, 0.25);
  } else if (harmony >= 60) {
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
      animateBirdHit(scene, false, damage, harmony);
    }
    playerHealth = Math.min(100, playerHealth + healAmount);
    score += damage * 10 + (combo * 5) + (harmony === 100 ? 100 : 0);
  } else {
    // Animate AI attack
    animateBirdAttack(scene, false);
    // Apply damage and animate player hit
    playerHealth = Math.max(0, playerHealth - damage);
    if (damage > 0) {
      animateBirdHit(scene, true, damage, harmony);
    }
    aiHealth = Math.min(100, aiHealth + healAmount);
  }

  // Show move name
  const moveText = scene.add.text(400, 220, moveName, { 
    fontSize: harmony >= 80 ? '36px' : '28px',
    color: harmony === 100 ? '#ff00ff' : harmony >= 80 ? '#ff00ff' : '#ffffff',
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
  if (harmony >= 80) {
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
  
  // Record successful pitch for musical echo (if harmony >= 60%)
  if (harmony >= 60) {
    lastSuccessfulPitch[currentPlayer] = PITCHES[selectedMelody.pitch];
    // Try to activate environmental power-up (15% chance)
    activateEnvironmentalPowerUp(scene, gameState === 'player_turn');
  }

  // Decrement power-up turns
  if (powerUpTurnsRemaining.player > 0) {
    powerUpTurnsRemaining.player--;
    if (powerUpTurnsRemaining.player === 0) {
      activePowerUps.player = null;
    }
  }
  if (powerUpTurnsRemaining.ai > 0) {
    powerUpTurnsRemaining.ai--;
    if (powerUpTurnsRemaining.ai === 0) {
      activePowerUps.ai = null;
    }
  }

  lastHarmony = harmony;
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
    animateAttack(scene, scene.graphics, playerX, playerY, aiX, aiY, harmony, combo);
  } else if (gameState === 'ai_turn') {
    animateAttack(scene, scene.graphics, aiX, aiY, playerX, playerY, harmony, combo);
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
    turnCnt++;
    generateTones();
    gameState = 'player_turn';
    scene.turnText.setText('Turno ' + turnCnt + ' - Jugador').setColor('#00ff00');
    turnTimer = 15000;
    return;
  }

  const targetPitch = Math.random() < 0.5 ? envTones.wind : envTones.birds;
  selectedMelody.pitch = PITCHES.indexOf(targetPitch);
  if (selectedMelody.pitch === -1) selectedMelody.pitch = Math.floor(Math.random() * PITCHES.length); // Fallback
  selectedMelody.rhythm = Math.floor(Math.random() * RHYTHMS.length);
  selectedMelody.duration = Math.floor(Math.random() * DURATIONS.length);
  playHarmony(scene);

  // Check again after playHarmony (which calls checkWinLose)
  if (gameState === 'victory' || gameState === 'defeat') {
    return; // Game ended, stop
  }

  turnCnt++;
  generateTones();
  gameState = 'player_turn';
  scene.turnText.setText('Turno ' + turnCnt + ' - Jugador').setColor('#00ff00');

  scene.feedbackText.setAlpha(1).setVisible(true).setText(`Armonía IA ${harmony}% - ¡${Math.floor(harmony / 10)} de daño!`);
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
  turnCnt = 1;
  playerHealth = 100;
  aiHealth = 100;
  turnTimer = 15000;
  combo = 0;
  score = 0;
  lastHarmony = 0;
  selectedMelody = { pitch: 0, rhythm: 0, duration: 0 };
  harmony = 0;

  // Reset stun system
  playerStunned = false;
  aiStunned = false;
  stunTurnsRemaining = { player: 0, ai: 0 };

  // Reset environmental power-ups
  activePowerUps = { player: null, ai: null };
  powerUpTurnsRemaining = { player: 0, ai: 0 };
  lastSuccessfulPitch = { player: null, ai: null };

  // Stop and reset background music
  stopBackgroundMusic();
  backgroundMusicEnabled = true;
  
  // Generate new environmental tones
  generateTones();
  
  // Reset UI elements
  scene.turnText.setText('Turno ' + turnCnt + ' - Jugador').setColor('#00ff00').setVisible(true);
}

function checkWinLose(scene) {
  if (aiHealth <= 0) {
    gameState = 'victory';
    stopBackgroundMusic(); // Stop background music on victory
    // Store references to texts for cleanup
    scene.victoryText = scene.add.text(400, 250, '¡VICTORIA!', { fontSize: '64px', color: '#00ff00', stroke: '#000000', strokeThickness: 6 }).setOrigin(0.5);
    scene.victoryScoreText = scene.add.text(400, 320, 'Puntos Finales: ' + score, { fontSize: '32px', color: '#00ffff' }).setOrigin(0.5);
    scene.replayText = scene.add.text(400, 400, 'Haz click para jugar de nuevo', { fontSize: '20px', color: '#00ff00' }).setOrigin(0.5).setInteractive();
    scene.replayText.on('pointerdown', () => {
      resetGame(scene);
    });
    scene.tweens.add({ targets: scene.replayText, alpha: { from: 1, to: 0.5 }, duration: 1000, yoyo: true, repeat: -1 });
    scene.tweens.add({ targets: scene.victoryText, scale: { from: 0.5, to: 1 }, duration: 500, ease: 'Back.easeOut' });
    scene.cameras.main.shake(500, 0.03);
    playTone(scene, 523, 0.3); // C5
    scene.time.delayedCall(300, () => playTone(scene, 659, 0.3)); // E5
    scene.time.delayedCall(600, () => playTone(scene, 784, 0.3)); // G5
  } else if (playerHealth <= 0) {
    gameState = 'defeat';
    stopBackgroundMusic(); // Stop background music on defeat
    // Store references to texts for cleanup
    scene.defeatText = scene.add.text(400, 300, '¡DERROTA!', { fontSize: '64px', color: '#ff0000', stroke: '#000000', strokeThickness: 6 }).setOrigin(0.5);
    scene.defeatScoreText = scene.add.text(400, 370, 'Puntos Finales: ' + score, { fontSize: '32px', color: '#ffff00' }).setOrigin(0.5);
    scene.replayText = scene.add.text(400, 450, 'Haz click para jugar de nuevo', { fontSize: '20px', color: '#00ff00' }).setOrigin(0.5).setInteractive();
    scene.replayText.on('pointerdown', () => {
      resetGame(scene);
    });
    scene.tweens.add({ targets: scene.replayText, alpha: { from: 1, to: 0.5 }, duration: 1000, yoyo: true, repeat: -1 });
    scene.tweens.add({ targets: scene.defeatText, scale: { from: 0.5, to: 1 }, duration: 500, ease: 'Back.easeOut' });
    playTone(scene, 220, 0.5); // Low tone
  }
}

function startBackgroundMusic(scene) {
  if (!backgroundMusicEnabled || backgroundMusic) return;

  const ctx = scene.sound.context;
  backgroundMusic = {
    oscillators: [],
    gains: [],
    melodyOsc: null,
    melodyGain: null,
    isPlaying: true,
    currentSection: 0,
    melodyNotes: [],
    chordProgression: []
  };

  // More sophisticated chord progression: I - vi - IV - V - I
  // Using frequencies for a more musical sound
  backgroundMusic.chordProgression = [
    { root: 261.63, notes: [261.63, 329.63, 392.00], name: 'C' },  // C major
    { root: 220.00, notes: [220.00, 261.63, 329.63], name: 'Am' }, // A minor
    { root: 174.61, notes: [174.61, 220.00, 261.63], name: 'F' },  // F major
    { root: 196.00, notes: [196.00, 246.94, 293.66], name: 'G' }   // G major
  ];

  // Simple melody line that follows the chord progression
  backgroundMusic.melodyNotes = [
    [392.00, 440.00, 493.88, 523.25], // C major melody
    [440.00, 392.00, 349.23, 329.63], // A minor melody
    [349.23, 392.00, 440.00, 523.25], // F major melody
    [392.00, 440.00, 523.25, 587.33]  // G major melody
  ];

  // Create sustained chord oscillators
  backgroundMusic.chordProgression.forEach((chord, chordIndex) => {
    chord.notes.forEach((freq, noteIndex) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = freq;
      osc.type = noteIndex === 0 ? 'sine' : 'triangle';

      // Very low volume for background - layered sound
      gain.gain.setValueAtTime(0.008, ctx.currentTime);

      backgroundMusic.oscillators.push(osc);
      backgroundMusic.gains.push(gain);

      // Start all oscillators immediately but they'll be faded
      osc.start(ctx.currentTime);
    });
  });

  // Create melody oscillator
  const melodyOsc = ctx.createOscillator();
  const melodyGain = ctx.createGain();
  melodyOsc.connect(melodyGain);
  melodyGain.connect(ctx.destination);
  melodyOsc.type = 'sine';
  melodyGain.gain.setValueAtTime(0.015, ctx.currentTime);
  melodyOsc.start(ctx.currentTime);

  backgroundMusic.melodyOsc = melodyOsc;
  backgroundMusic.melodyGain = melodyGain;

  // Musical progression system
  let noteIndex = 0;
  let chordIndex = 0;
  let measureCount = 0;

  const playNextNote = () => {
    if (!backgroundMusic || !backgroundMusic.isPlaying) return;

    const currentChord = backgroundMusic.chordProgression[chordIndex];
    const currentMelody = backgroundMusic.melodyNotes[chordIndex];

    // Update melody note
    const noteFreq = currentMelody[noteIndex % currentMelody.length];
    backgroundMusic.melodyOsc.frequency.setTargetAtTime(noteFreq, ctx.currentTime, 0.1);

    // Fade chord notes in/out for smooth transitions
    const chordStartIndex = chordIndex * 3; // 3 notes per chord
    backgroundMusic.gains.forEach((gain, index) => {
      if (index >= chordStartIndex && index < chordStartIndex + 3) {
        // This chord's notes - fade in
        gain.gain.setTargetAtTime(0.008, ctx.currentTime, 0.3);
      } else {
        // Other chords - fade out
        gain.gain.setTargetAtTime(0.002, ctx.currentTime, 0.3);
      }
    });

    noteIndex++;
    measureCount++;

    // Change chord every 4 notes (1 measure)
    if (measureCount >= 4) {
      chordIndex = (chordIndex + 1) % backgroundMusic.chordProgression.length;
      measureCount = 0;
    }
  };

  // Start the musical progression
  playNextNote();
  backgroundMusic.interval = setInterval(playNextNote, 600); // 600ms per note = 100 BPM

  // Add some subtle rhythmic variation
  setTimeout(() => {
    if (backgroundMusic && backgroundMusic.isPlaying) {
      backgroundMusic.rhythmInterval = setInterval(() => {
        // Occasional subtle volume swells
        if (Math.random() < 0.3) {
          backgroundMusic.melodyGain.gain.setTargetAtTime(0.02, ctx.currentTime, 0.2);
          setTimeout(() => {
            if (backgroundMusic && backgroundMusic.melodyGain) {
              backgroundMusic.melodyGain.gain.setTargetAtTime(0.015, ctx.currentTime, 0.5);
            }
          }, 200);
        }
      }, 2400); // Every ~4 notes
    }
  }, 1200);
}

function stopBackgroundMusic() {
  if (!backgroundMusic) return;

  backgroundMusic.isPlaying = false;

  // Stop all chord oscillators
  backgroundMusic.oscillators.forEach(osc => {
    try {
      osc.stop();
    } catch (e) {
      // Oscillator might already be stopped
    }
  });

  // Stop melody oscillator
  if (backgroundMusic.melodyOsc) {
    try {
      backgroundMusic.melodyOsc.stop();
    } catch (e) {
      // Oscillator might already be stopped
    }
  }

  // Clear all intervals
  if (backgroundMusic.interval) {
    clearInterval(backgroundMusic.interval);
  }
  if (backgroundMusic.rhythmInterval) {
    clearInterval(backgroundMusic.rhythmInterval);
  }

  backgroundMusic = null;
}

function createClickableMelodyDisplay(scene) {
  // Removed - now using individual controls
}

function cycleMelodyCombination() {
  // Simple cycling through all combinations
  selectedMelody.duration = (selectedMelody.duration + 1) % DURATIONS.length;

  if (selectedMelody.duration === 0) { // Wrapped around, cycle rhythm
    selectedMelody.rhythm = (selectedMelody.rhythm + 1) % RHYTHMS.length;

    if (selectedMelody.rhythm === 0) { // Wrapped around, cycle pitch
      selectedMelody.pitch = (selectedMelody.pitch + 1) % PITCHES.length;
    }
  }
}

function updateMelodyDisplay(scene) {
  if (scene.melodyInfoText) {
    const melodyInfo = PITCHES[selectedMelody.pitch] + ' | ' + RHYTHMS[selectedMelody.rhythm] + ' | ' + DURATIONS[selectedMelody.duration];
    scene.melodyInfoText.setText(melodyInfo);
  }
}

function createAttackButton(scene) {
  // Create a themed attack button with harmony percentage
  const attackButton = scene.add.text(400, 400, '¡Armonizar con 0%!', {
    fontSize: '22px',
    color: '#ffffff',
    backgroundColor: 'rgba(255, 0, 0, 0.8)', // Red by default (low harmony)
    padding: { x: 15, y: 8 },
    borderRadius: 8,
    fontStyle: 'bold'
  }).setOrigin(0.5).setInteractive();

  // Store reference to current harmony color
  attackButton.currentHarmonyColor = 'rgba(255, 0, 0, 0.8)'; // Default red

  // Hover effects (preserve harmony color)
  attackButton.on('pointerover', () => {
    const hoverColor = attackButton.currentHarmonyColor.replace('0.8', '0.9');
    attackButton.setBackgroundColor(hoverColor);
    attackButton.setScale(1.05);
  });

  attackButton.on('pointerout', () => {
    attackButton.setBackgroundColor(attackButton.currentHarmonyColor);
    attackButton.setScale(1);
  });

  attackButton.on('pointerdown', () => {
    if (gameState === 'player_turn') {
      playHarmony(scene);
      if (gameState === 'victory' || gameState === 'defeat') return;
      gameState = 'ai_turn';
      scene.turnText.setText('Turno ' + turnCnt + ' - IA').setColor('#ff0000');
      scene.time.delayedCall(1000, () => aiPlay(scene));
    }
    attackButton.setScale(0.95);
    scene.time.delayedCall(100, () => attackButton.setScale(1));
  });

  attackButton.setVisible(false); // Hidden by default, shown only during gameplay
  return attackButton;
}

function updateAttackButton(scene, harmonyPercent) {
  if (!scene.attackButton) return;

  // Update button text with harmony percentage
  scene.attackButton.setText(`¡Armonizar con ${harmonyPercent}%!`);

  // Update button color based on harmony percentage
  let buttonColor;
  if (harmonyPercent >= 80) {
    buttonColor = 'rgba(255, 0, 255, 0.8)'; // Magenta for high harmony
  } else if (harmonyPercent >= 60) {
    buttonColor = 'rgba(255, 255, 0, 0.8)'; // Yellow for medium-high
  } else if (harmonyPercent >= 30) {
    buttonColor = 'rgba(0, 255, 0, 0.8)'; // Green for medium
  } else {
    buttonColor = 'rgba(255, 0, 0, 0.8)'; // Red for low
  }

  scene.attackButton.currentHarmonyColor = buttonColor;
  scene.attackButton.setBackgroundColor(buttonColor);
}


function createRhythmDurationControls(scene) {
  // Create separate clickable controls for rhythm and duration

  // Rhythm control
  if (!scene.rhythmControl) {
    scene.rhythmControl = scene.add.text(280, 460, '🎵 ' + RHYTHMS[selectedMelody.rhythm] + ' ▶️', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: 'rgba(0, 150, 255, 0.9)',
      padding: { x: 12, y: 6 },
      borderRadius: 6,
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive();

    scene.rhythmControl.on('pointerdown', () => {
      selectedMelody.rhythm = (selectedMelody.rhythm + 1) % RHYTHMS.length;
      scene.rhythmControl.setText('🎵 ' + RHYTHMS[selectedMelody.rhythm] + ' ▶️');
      calculateHarmony();
      updateAttackButton(scene, harmony);
      // Update the main display
      if (scene.melodyInfoText) {
        const melodyInfo = 'ACTUAL: ' + PITCHES[selectedMelody.pitch] + ' | ' + RHYTHMS[selectedMelody.rhythm] + ' | ' + DURATIONS[selectedMelody.duration];
        scene.melodyInfoText.setText(melodyInfo);
      }
      // Add click feedback
      scene.tweens.add({
        targets: scene.rhythmControl,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true
      });
    });

    scene.rhythmControl.on('pointerover', () => {
      scene.rhythmControl.setBackgroundColor('rgba(0, 200, 255, 1)');
      scene.rhythmControl.setScale(1.05);
    });

    scene.rhythmControl.on('pointerout', () => {
      scene.rhythmControl.setBackgroundColor('rgba(0, 150, 255, 0.9)');
      scene.rhythmControl.setScale(1);
    });
    scene.rhythmControl.setVisible(false); // Hidden by default, shown only during gameplay
  } else {
    scene.rhythmControl.setText('🎵 ' + RHYTHMS[selectedMelody.rhythm] + ' ▶️').setVisible(true);
  }

  // Duration control
  if (!scene.durationControl) {
    scene.durationControl = scene.add.text(520, 460, '⏱️ ' + DURATIONS[selectedMelody.duration] + ' ▶️', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: 'rgba(255, 150, 0, 0.9)',
      padding: { x: 12, y: 6 },
      borderRadius: 6,
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive();

    scene.durationControl.on('pointerdown', () => {
      selectedMelody.duration = (selectedMelody.duration + 1) % DURATIONS.length;
      scene.durationControl.setText('⏱️ ' + DURATIONS[selectedMelody.duration] + ' ▶️');
      calculateHarmony();
      updateAttackButton(scene, harmony);
      // Update the main display
      if (scene.melodyInfoText) {
        const melodyInfo = 'ACTUAL: ' + PITCHES[selectedMelody.pitch] + ' | ' + RHYTHMS[selectedMelody.rhythm] + ' | ' + DURATIONS[selectedMelody.duration];
        scene.melodyInfoText.setText(melodyInfo);
      }
      // Add click feedback
      scene.tweens.add({
        targets: scene.durationControl,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true
      });
    });

    scene.durationControl.on('pointerover', () => {
      scene.durationControl.setBackgroundColor('rgba(255, 200, 0, 1)');
      scene.durationControl.setScale(1.05);
    });

    scene.durationControl.on('pointerout', () => {
      scene.durationControl.setBackgroundColor('rgba(255, 150, 0, 0.9)');
      scene.durationControl.setScale(1);
    });
    scene.durationControl.setVisible(false); // Hidden by default, shown only during gameplay
  } else {
    scene.durationControl.setText('⏱️ ' + DURATIONS[selectedMelody.duration] + ' ▶️').setVisible(true);
  }
}

// Dynamic weather and background system
function drawSkyGradient(graphics) {
  // Create a beautiful sky gradient from light blue to deeper blue
  const skyColors = [
    0x87CEEB, // Sky blue
    0x4682B4, // Steel blue
    0x1e3a5f  // Deep blue
  ];

  // Draw gradient by creating horizontal stripes
  for (let i = 0; i < skyColors.length; i++) {
    const y = (i / skyColors.length) * 600;
    const height = 600 / skyColors.length + 1;
    graphics.fillStyle(skyColors[i], 1);
    graphics.fillRect(0, y, 800, height);
  }
}

function drawClouds(graphics, time) {
  // Animated clouds that move across the sky
  const cloudSpeed = time * 0.0005; // Slow movement

  for (let i = 0; i < 5; i++) {
    const baseX = (i * 200 + cloudSpeed * (i + 1) * 50) % 1000 - 100;
    const baseY = 80 + i * 40 + Math.sin(time * 0.001 + i) * 10;

    // Draw fluffy cloud using multiple circles
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillCircle(baseX, baseY, 25);
    graphics.fillCircle(baseX + 20, baseY - 5, 30);
    graphics.fillCircle(baseX + 40, baseY, 25);
    graphics.fillCircle(baseX + 25, baseY + 10, 20);
    graphics.fillCircle(baseX + 10, baseY + 8, 18);
  }
}

function drawWeatherEffects(graphics, time) {
  // Weather effects based on environmental tones
  const windTone = envTones.wind;
  const birdTone = envTones.birds;

  // Wind effect - particles moving horizontally
  if (windTone) {
    const windIntensity = getWindIntensity(windTone);
    for (let i = 0; i < windIntensity * 3; i++) {
      const x = (time * 0.1 * windIntensity + i * 50) % 850 - 50;
      const y = 200 + Math.random() * 300;
      graphics.fillStyle(0xffffff, 0.6);
      graphics.fillCircle(x, y, 1 + Math.random() * 2);
    }
  }

  // Bird flock effect - small flying birds
  if (birdTone) {
    const birdIntensity = getBirdIntensity(birdTone);
    for (let i = 0; i < birdIntensity; i++) {
      const x = (time * 0.05 + i * 80) % 900 - 50;
      const y = 150 + Math.sin(time * 0.003 + i) * 50 + i * 20;
      graphics.fillStyle(0x333333, 0.7);
      graphics.fillCircle(x, y, 2); // Small bird dots
      graphics.fillCircle(x + 3, y - 1, 1); // Wing
    }
  }

  // Occasional rain or snow based on harmony
  const harmonyEffect = Math.sin(time * 0.001) > 0.8;
  if (harmonyEffect) {
    const isSnow = Math.random() > 0.5;
    const particleColor = isSnow ? 0xffffff : 0x87CEEB;
    const particleCount = isSnow ? 20 : 30;

    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * 800;
      const y = (time * 0.1 + i * 20) % 650 - 50;
      graphics.fillStyle(particleColor, 0.8);
      graphics.fillCircle(x, y, isSnow ? 1.5 : 1);
    }
  }
}

function getWindIntensity(windTone) {
  // Map wind tones to intensity levels
  const toneMap = {
    'Grave': 1, 'Bajo': 2, 'Medio': 3, 'Alto': 4,
    'Agudo': 5, 'Muy Alto': 6, 'Estridente': 7, 'Celestial': 8
  };
  return toneMap[windTone] || 3;
}

function getBirdIntensity(birdTone) {
  // Map bird tones to flock size
  const toneMap = {
    'Grave': 2, 'Bajo': 3, 'Medio': 4, 'Alto': 5,
    'Agudo': 6, 'Muy Alto': 7, 'Estridente': 8, 'Celestial': 10
  };
  return toneMap[birdTone] || 4;
}

function getCurrentWeather() {
  // Determine weather based on environmental tones
  const windTone = envTones.wind;
  const birdTone = envTones.birds;

  // Weather conditions based on tone combinations
  let weatherType = 'Despejado';
  let effect = 'Sin efectos';

  // Wind-based weather
  if (windTone === 'Estridente' || windTone === 'Celestial') {
    weatherType = '🌪️ Vendaval';
    effect = '-20% armonía';
  } else if (windTone === 'Muy Alto' || windTone === 'Agudo') {
    weatherType = '💨 Viento Fuerte';
    effect = '-10% armonía';
  } else if (windTone === 'Alto' || windTone === 'Medio') {
    weatherType = '🌬️ Brisa';
    effect = 'Sin efectos';
  }

  // Bird-based weather modifications
  if (birdTone === 'Estridente' || birdTone === 'Celestial') {
    if (weatherType === 'Despejado') {
      weatherType = '🐦 Bandada';
      effect = '+15% armonía';
    } else {
      weatherType += ' + Bandada';
      effect = effect.replace('-', '+').replace('Sin efectos', '+15% armonía');
    }
  }

  return `${weatherType} | ${effect}`;
}

function getWeatherModifier() {
  // Return harmony modifier based on current weather
  const windTone = envTones.wind;
  const birdTone = envTones.birds;

  let modifier = 0;

  // Wind penalties
  if (windTone === 'Estridente' || windTone === 'Celestial') {
    modifier -= 20; // -20% harmony
  } else if (windTone === 'Muy Alto' || windTone === 'Agudo') {
    modifier -= 10; // -10% harmony
  }

  // Bird bonuses
  if (birdTone === 'Estridente' || birdTone === 'Celestial') {
    modifier += 15; // +15% harmony
  }

  return modifier;
}

function generateMountainData() {
  // Pre-generate all mountain and tree positions to prevent flickering
  mountainData = {
    ranges: [],
    trees: []
  };

  // Generate mountain ranges
  const mountainRanges = [
    { y: 450, height: 80, color: 0x1a3310 }, // Closest mountains
    { y: 480, height: 60, color: 0x0f1f08 }, // Middle distance
    { y: 510, height: 40, color: 0x071004 }  // Farthest
  ];

  mountainRanges.forEach(range => {
    const peaks = [];
    for (let x = 0; x <= 800; x += 40) {
      // Use a seeded approach for consistent but varied terrain
      const seed = (x * 7 + range.y * 3) % 1000;
      const variation = (Math.sin(seed * 0.01) * 10 + (seed % 20));
      const peakHeight = range.y - (Math.sin(x * 0.02) * range.height + variation);
      peaks.push({ x, y: peakHeight });
    }
    mountainData.ranges.push({
      y: range.y,
      color: range.color,
      peaks: peaks
    });
  });

  // Generate tree positions
  for (let i = 0; i < 8; i++) {
    const seed = i * 37 % 1000;
    const x = 50 + i * 100 + (seed % 50);
    const y = 480 + ((seed * 2) % 50);
    mountainData.trees.push({ x, y });
  }
}

function drawMountains(graphics) {
  if (!mountainData) return; // Safety check

  // Draw distant mountains for atmospheric depth
  graphics.fillStyle(0x2d5016, 1); // Dark green mountains

  // Draw each mountain range using pre-generated data
  mountainData.ranges.forEach(range => {
    graphics.fillStyle(range.color, 1);

    // Draw mountain peaks using pre-generated data
    graphics.beginPath();
    graphics.moveTo(0, 600);
    graphics.lineTo(0, range.y);

    range.peaks.forEach(peak => {
      graphics.lineTo(peak.x, peak.y);
    });

    graphics.lineTo(800, range.y);
    graphics.lineTo(800, 600);
    graphics.closePath();
    graphics.fillPath();
  });

  // Draw trees using pre-generated positions
  graphics.fillStyle(0x0a2a05, 1);
  mountainData.trees.forEach(tree => {
    // Tree trunk
    graphics.fillRect(tree.x - 2, tree.y, 4, 20);

    // Tree foliage
    graphics.fillCircle(tree.x, tree.y - 5, 8);
    graphics.fillCircle(tree.x - 5, tree.y - 8, 6);
    graphics.fillCircle(tree.x + 5, tree.y - 8, 6);
  });
}

function startRainbowEffect(scene, textObject) {
  let hue = 0;
  scene.time.addEvent({
    delay: 50,
    callback: () => {
      if (textObject && textObject.active) {
        hue = (hue + 1) % 360;
        // Simple rainbow colors instead of HSLToColor
        const rainbowColors = [
          '#ff0000', '#ff8000', '#ffff00', '#80ff00',
          '#00ff00', '#00ff80', '#00ffff', '#0080ff',
          '#0000ff', '#8000ff', '#ff00ff', '#ff0080'
        ];
        const colorIndex = Math.floor(hue / 30) % rainbowColors.length;
        textObject.setColor(rainbowColors[colorIndex]);
      }
    },
    loop: true
  });
}

function addMenuDecorations(scene) {
  // Add floating musical notes around the screen
  const noteSymbols = ['♪', '♫', '♬', '♩', '♭', '♯'];

  for (let i = 0; i < 12; i++) {
    const noteText = scene.add.text(
      Math.random() * 800,
      Math.random() * 600,
      noteSymbols[Math.floor(Math.random() * noteSymbols.length)],
      {
        fontSize: `${10 + Math.random() * 12}px`,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        alpha: 0.4
      }
    ).setOrigin(0.5);

    // Floating animation with rotation
    scene.tweens.add({
      targets: noteText,
      y: noteText.y - 30 - Math.random() * 40,
      x: noteText.x + (Math.random() - 0.5) * 60,
      angle: (Math.random() - 0.5) * 20,
      alpha: { from: 0.4, to: 0.1 },
      duration: 4000 + Math.random() * 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: Math.random() * 3000
    });

    // Add to menu texts so they get cleaned up
    scene.menuTexts.push(noteText);
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

function playHarmonySound(scene, harmonyPercent, pitch, duration) {
  const ctx = scene.sound.context;
  const baseFreq = FREQUENCIES[pitch];

  if (harmonyPercent >= 100) {
    // Perfect harmony - play a beautiful chord progression
    playChordProgression(scene, baseFreq, duration);
  } else if (harmonyPercent >= 80) {
    // High harmony - play arpeggio
    playArpeggio(scene, baseFreq, duration);
  } else if (harmonyPercent >= 60) {
    // Good harmony - play chord with some embellishment
    playChord(scene, baseFreq, duration);
  } else {
    // Poor harmony - just play single note with some noise
    playSingleNoteWithEffect(scene, baseFreq, duration);
  }
}

function playChord(scene, baseFreq, duration) {
  const ctx = scene.sound.context;
  const chordFreqs = [baseFreq, baseFreq * 1.25, baseFreq * 1.5]; // Major chord

  chordFreqs.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = freq;
    osc.type = index === 0 ? 'sine' : 'triangle'; // Mix waveforms

    const delay = index * 0.05; // Slight stagger
    gain.gain.setValueAtTime(0.1, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + duration);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  });
}

function playArpeggio(scene, baseFreq, duration) {
  const ctx = scene.sound.context;
  const arpeggio = [baseFreq, baseFreq * 1.189, baseFreq * 1.5, baseFreq * 1.189]; // Up and down
  const noteDuration = duration / arpeggio.length;

  arpeggio.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = freq;
    osc.type = 'sine';

    const startTime = ctx.currentTime + (index * noteDuration);
    gain.gain.setValueAtTime(0.12, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration * 0.8);

    osc.start(startTime);
    osc.stop(startTime + noteDuration);
  });
}

function playChordProgression(scene, baseFreq, duration) {
  const ctx = scene.sound.context;
  const progression = [
    [baseFreq, baseFreq * 1.25, baseFreq * 1.5],     // I
    [baseFreq * 1.189, baseFreq * 1.5, baseFreq * 1.875], // IV
    [baseFreq * 1.333, baseFreq * 1.667, baseFreq * 2]   // V
  ];

  const chordDuration = duration / progression.length;

  progression.forEach((chord, chordIndex) => {
    chord.forEach((freq, noteIndex) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = freq;
      osc.type = noteIndex === 0 ? 'sine' : 'triangle';

      const startTime = ctx.currentTime + (chordIndex * chordDuration) + (noteIndex * 0.02);
      gain.gain.setValueAtTime(0.08, startTime);
      gain.gain.exponentialRampToValueAtTime(0.005, startTime + chordDuration * 0.9);

      osc.start(startTime);
      osc.stop(startTime + chordDuration);
    });
  });

  // Add some sparkle effect
  addSparkleEffect(scene, baseFreq * 2, duration);
}

function playSingleNoteWithEffect(scene, freq, duration) {
  const ctx = scene.sound.context;

  // Main note
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.frequency.value = freq;
  osc.type = 'sawtooth'; // More aggressive sound
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);

  // Add some noise for poor harmony
  addNoiseEffect(scene, duration);
}

function addSparkleEffect(scene, freq, duration) {
  const ctx = scene.sound.context;

  // High sparkle notes
  const sparkleNotes = [freq, freq * 1.189, freq * 1.333];
  const noteDuration = 0.1;

  sparkleNotes.forEach((noteFreq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = noteFreq;
    osc.type = 'sine';

    const startTime = ctx.currentTime + (index * 0.15);
    gain.gain.setValueAtTime(0.05, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

    osc.start(startTime);
    osc.stop(startTime + noteDuration);
  });
}

function addNoiseEffect(scene, duration) {
  const ctx = scene.sound.context;

  // Create noise buffer
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1; // White noise
  }

  const noiseSource = ctx.createBufferSource();
  const gainNode = ctx.createGain();

  noiseSource.buffer = buffer;
  noiseSource.connect(gainNode);
  gainNode.connect(ctx.destination);

  gainNode.gain.setValueAtTime(0.02, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  noiseSource.start(ctx.currentTime);
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
