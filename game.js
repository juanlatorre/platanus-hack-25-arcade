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

  // Keyboard input for SPACE (handles menu->tutorial->gameplay)
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
      turnTimer = 7000;
      combo = 0;
      score = 0;
      lastHarmony = 0;
      if (this.tutorialTexts) this.tutorialTexts.forEach(text => text.setVisible(false));
      this.turnText.setVisible(true);
    } else if (gameState === 'player_turn') {
      playHarmony(this);
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

  this.playerHPText = this.add.text(50, 10, '100/100', { fontSize: '11px', color: '#00ff00' }).setVisible(false);
  this.aiHPText = this.add.text(750, 10, '100/100', { fontSize: '11px', color: '#ff0000' }).setVisible(false);
  this.scoreText = this.add.text(400, 10, '0', { fontSize: '14px', color: '#00ffff' }).setOrigin(0.5).setVisible(false);

  this.input.on('pointerdown', () => {
    if (this.sound.context.state === 'suspended') this.sound.context.resume();
    console.log('Audio resumed on click');
  });

  this.timerText = this.add.text(500, 70, '7s', { fontSize: '12px', color: '#ffffff' }).setVisible(false);
}

function drawMenu(scene) {
  console.log('Drawing bird - graphics defined:', !!scene.graphics);
  // Decorative birds
  drawBird(scene.graphics, 200, 400, 25, 0x8b4513, false, 1);
  drawBird(scene.graphics, 600, 400, 25, 0x654321, true, -1);
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
  const t10 = scene.add.text(400, y + spacing * 13, '80%+ = Aturdimiento', { fontSize: '16px', color: '#ff00ff' }).setOrigin(0.5).setVisible(true);
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
  // Draw example birds
  drawBird(scene.graphics, 200, 450, 30, 0x8b4513, true, 1);
  drawBird(scene.graphics, 600, 450, 30, 0x654321, false, -1);
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
    // Draw birds (always visible in gameplay) - positioned in center area
    drawBird(this.graphics, 150, 200, 50, 0x8b4513, true, 1);
    drawBird(this.graphics, 650, 200, 50, 0x654321, false, -1);

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
        // Auto random
        selectedMelody.pitch = Math.floor(Math.random() * PITCHES.length);
        selectedMelody.rhythm = Math.floor(Math.random() * RHYTHMS.length);
        selectedMelody.duration = Math.floor(Math.random() * DURATIONS.length);
        playHarmony(this);
        gameState = 'ai_turn';
        this.turnText.setText('Turno ' + turnCount + ' - IA').setColor('#ff0000');
        this.time.delayedCall(500, () => aiPlay(this));
        turnTimer = 7000;
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
    this.playerHPText.setText(playerHealth + '/100').setVisible(true).setPosition(50, 10);

    // AI health bar (top right)
    this.graphics.fillStyle(0xff0000, 1);
    this.graphics.fillRect(600, 10, (aiHealth / 100) * 150, 12);
    this.graphics.strokeRect(600, 10, 150, 12);
    this.aiHPText.setText(aiHealth + '/100').setVisible(true).setPosition(750, 10);

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
    const stunText = scene.add.text(400, 250, '¡ATURDIMIENTO!', { fontSize: '32px', color: '#ff00ff' }).setOrigin(0.5);
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
    const comboText = scene.add.text(400, 280, `¡COMBO x${combo}!`, { fontSize: '24px', color: '#ffff00' }).setOrigin(0.5);
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
  scene.turnText.setText('Turno ' + turnCount + ' - Jugador').setColor('#00ff00');

  scene.feedbackText.setAlpha(1).setVisible(true).setText(`Armonía IA ${harmonyMeter}% - ¡${Math.floor(harmonyMeter / 10)} de daño!`);
  scene.tweens.add({ targets: scene.feedbackText, alpha: 0, duration: 1500, onComplete: () => scene.feedbackText.setVisible(false) });
  turnTimer = 7000;
}

function checkWinLose(scene) {
  if (aiHealth <= 0) {
    gameState = 'victory';
    const victoryText = scene.add.text(400, 250, '¡VICTORIA!', { fontSize: '64px', color: '#00ff00', stroke: '#000000', strokeThickness: 6 }).setOrigin(0.5);
    const scoreText = scene.add.text(400, 320, 'Puntos Finales: ' + score, { fontSize: '32px', color: '#00ffff' }).setOrigin(0.5);
    scene.tweens.add({ targets: victoryText, scale: { from: 0.5, to: 1 }, duration: 500, ease: 'Back.easeOut' });
    scene.cameras.main.shake(500, 0.03);
    playTone(scene, 523, 0.3); // C5
    scene.time.delayedCall(300, () => playTone(scene, 659, 0.3)); // E5
    scene.time.delayedCall(600, () => playTone(scene, 784, 0.3)); // G5
  } else if (playerHealth <= 0) {
    gameState = 'defeat';
    const defeatText = scene.add.text(400, 300, '¡DERROTA!', { fontSize: '64px', color: '#ff0000', stroke: '#000000', strokeThickness: 6 }).setOrigin(0.5);
    const scoreText = scene.add.text(400, 370, 'Puntos Finales: ' + score, { fontSize: '32px', color: '#ffff00' }).setOrigin(0.5);
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
