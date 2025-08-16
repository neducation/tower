// Orb Destroyer Game
class OrbDestroyer {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");

    // Game state
    this.gameState = "menu";
    this.level = 1;
    this.coins = 0;
    this.cannonPower = 1;

    // Cannon properties
    this.cannon = {
      x: 0, // Will be set to center
      y: 0, // Will be set to bottom
      angle: 0,
      fireRate: 500,
      lastShot: 0,
      damage: 10,
      piercing: 1,
      multishot: 1,
      autoFire: false,
    };

    // Upgrades
    this.upgrades = {
      damage: { level: 1, cost: 10, multiplier: 1.5 },
      speed: { level: 1, cost: 15, multiplier: 0.8 },
      piercing: { level: 1, cost: 25, multiplier: 1 },
      multishot: { level: 1, cost: 50, multiplier: 1 },
    };

    // Game objects
    this.orbs = [];
    this.projectiles = [];
    this.particles = [];
    this.coinDrops = [];

    // Current orb
    this.currentOrb = null;

    // Timing
    this.lastTime = 0;

    this.setupCanvas();
    this.bindEvents();
    this.showStartScreen();
    this.gameLoop();
  }

  setupCanvas() {
    const gameArea = document.getElementById("game-area");
    const rect = gameArea.getBoundingClientRect();

    this.canvas.width = window.innerWidth;
    this.canvas.height = rect.height;

    this.canvasWidth = this.canvas.width;
    this.canvasHeight = this.canvas.height;

    // Cannon position (bottom center)
    this.cannon.x = this.canvasWidth / 2;
    this.cannon.y = this.canvasHeight - 50;

    window.addEventListener("resize", () => {
      const gameArea = document.getElementById("game-area");
      const rect = gameArea.getBoundingClientRect();
      this.canvas.width = window.innerWidth;
      this.canvas.height = rect.height;
      this.canvasWidth = this.canvas.width;
      this.canvasHeight = this.canvas.height;
      this.cannon.x = this.canvasWidth / 2;
      this.cannon.y = this.canvasHeight - 50;
    });
  }

  showStartScreen() {
    document.getElementById("start-screen").classList.remove("hidden");
    document.getElementById("game-screen").classList.add("hidden");
  }

  showGameScreen() {
    document.getElementById("start-screen").classList.add("hidden");
    document.getElementById("game-screen").classList.remove("hidden");
  }

  bindEvents() {
    // Start button
    document.getElementById("start-btn").addEventListener("click", () => {
      this.startGame();
    });

    // Canvas click/touch for shooting
    this.canvas.addEventListener("click", (e) => this.shoot());
    this.canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      this.shoot();
    });

    // Control buttons
    document.getElementById("pause-btn").addEventListener("click", () => {
      this.togglePause();
    });

    document.getElementById("auto-fire-btn").addEventListener("click", () => {
      this.toggleAutoFire();
    });

    // Upgrade buttons
    document.querySelectorAll(".upgrade-card").forEach((card) => {
      card.addEventListener("click", () => {
        const upgradeType = card.dataset.upgrade;
        this.buyUpgrade(upgradeType);
      });
    });

    // Modal buttons
    document.getElementById("restart-btn").addEventListener("click", () => {
      this.restart();
    });

    document.getElementById("main-menu-btn").addEventListener("click", () => {
      this.returnToMenu();
    });

    document.getElementById("next-level-btn").addEventListener("click", () => {
      this.nextLevel();
    });

    document
      .getElementById("upgrade-menu-btn")
      .addEventListener("click", () => {
        this.hideModal("level-complete-modal");
      });
  }

  startGame() {
    this.gameState = "playing";
    this.showGameScreen();
    this.resetGame();
    this.spawnOrb();
    document.getElementById("shoot-indicator").style.display = "block";
  }

  togglePause() {
    if (this.gameState === "playing") {
      this.gameState = "paused";
      document.getElementById("pause-btn").innerHTML = "▶️ RESUME";
    } else if (this.gameState === "paused") {
      this.gameState = "playing";
      document.getElementById("pause-btn").innerHTML = "⏸️ PAUSE";
    }
  }

  toggleAutoFire() {
    this.cannon.autoFire = !this.cannon.autoFire;
    const btn = document.getElementById("auto-fire-btn");
    if (this.cannon.autoFire) {
      btn.innerHTML = "🔥 AUTO-ON";
      btn.classList.add("special");
    } else {
      btn.innerHTML = "🤖 AUTO-FIRE";
      btn.classList.remove("special");
    }
  }

  returnToMenu() {
    this.gameState = "menu";
    this.showStartScreen();
    this.hideModal("game-over-modal");
    this.hideModal("level-complete-modal");
  }

  hideModal(modalId) {
    document.getElementById(modalId).classList.add("hidden");
  }

  shoot() {
    if (this.gameState !== "playing") return;

    const now = Date.now();
    if (now - this.cannon.lastShot < this.cannon.fireRate) return;

    // Hide shoot indicator after first shot
    document.getElementById("shoot-indicator").style.display = "none";

    // Calculate shots based on multishot upgrade
    const shots = this.upgrades.multishot.level;
    const spreadAngle = shots > 1 ? Math.PI / 8 : 0; // 22.5 degrees spread

    for (let i = 0; i < shots; i++) {
      let angle = -Math.PI / 2; // Straight up
      if (shots > 1) {
        angle += (i - (shots - 1) / 2) * (spreadAngle / (shots - 1));
      }

      this.projectiles.push({
        x: this.cannon.x,
        y: this.cannon.y,
        vx: Math.cos(angle) * 8,
        vy: Math.sin(angle) * 8,
        damage: this.cannon.damage,
        piercing: this.upgrades.piercing.level,
        trail: [],
      });
    }

    this.cannon.lastShot = now;
    this.addMuzzleFlash();
  }

  addMuzzleFlash() {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: this.cannon.x + (Math.random() - 0.5) * 20,
        y: this.cannon.y - 20,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3,
        life: 15,
        maxLife: 15,
        color: `hsl(${20 + Math.random() * 40}, 100%, ${
          50 + Math.random() * 30
        }%)`,
      });
    }
  }

  spawnOrb() {
    const orbRadius = 80 + (this.level - 1) * 5;
    const orbHealth = 100 + (this.level - 1) * 50;
    const orbArmor = Math.min(this.level, 8); // Max 8 armor segments

    this.currentOrb = {
      x: this.canvasWidth / 2,
      y: this.canvasHeight * 0.3,
      radius: orbRadius,
      health: orbHealth,
      maxHealth: orbHealth,
      rotation: 0,
      rotationSpeed: 0.02 + this.level * 0.005,
      armor: [],
      destroyed: false,
    };

    // Create armor segments
    for (let i = 0; i < orbArmor; i++) {
      this.currentOrb.armor.push({
        angle: (i / orbArmor) * Math.PI * 2,
        health: 30 + this.level * 5,
        maxHealth: 30 + this.level * 5,
        destroyed: false,
      });
    }
  }

  buyUpgrade(type) {
    const upgrade = this.upgrades[type];
    if (this.coins >= upgrade.cost) {
      this.coins -= upgrade.cost;
      upgrade.level++;

      // Apply upgrade effects
      switch (type) {
        case "damage":
          this.cannon.damage = Math.floor(
            10 * Math.pow(upgrade.multiplier, upgrade.level - 1)
          );
          break;
        case "speed":
          this.cannon.fireRate = Math.floor(
            500 * Math.pow(upgrade.multiplier, upgrade.level - 1)
          );
          break;
        case "piercing":
          // Piercing handled in projectile logic
          break;
        case "multishot":
          // Multishot handled in shoot logic
          break;
      }

      // Update cost for next level
      upgrade.cost = Math.floor(upgrade.cost * 1.8);

      this.updateUI();
      this.updateUpgradeDisplay();
    }
  }

  updateUpgradeDisplay() {
    Object.keys(this.upgrades).forEach((type) => {
      const upgrade = this.upgrades[type];
      document.getElementById(`${type}-level`).textContent = upgrade.level;
      document.getElementById(`${type}-cost`).textContent = upgrade.cost;

      const card = document.querySelector(`[data-upgrade="${type}"]`);
      if (this.coins >= upgrade.cost) {
        card.classList.add("affordable");
        card.classList.remove("unaffordable");
      } else {
        card.classList.remove("affordable");
        card.classList.add("unaffordable");
      }
    });
  }

  spawnEnemy() {
    this.enemies.push({
      x: -50,
      y: this.pathY - 15,
      health: 100,
      maxHealth: 100,
      speed: 1,
    });
  }

  update(dt) {
    if (this.gameState !== "playing") return;

    // Auto-fire
    if (this.cannon.autoFire && this.currentOrb && !this.currentOrb.destroyed) {
      this.shoot();
    }

    // Update orb rotation
    if (this.currentOrb && !this.currentOrb.destroyed) {
      this.currentOrb.rotation += this.currentOrb.rotationSpeed;
    }

    // Update projectiles
    this.projectiles = this.projectiles.filter((proj) => {
      proj.x += proj.vx;
      proj.y += proj.vy;

      // Add trail effect
      proj.trail.push({ x: proj.x, y: proj.y });
      if (proj.trail.length > 8) proj.trail.shift();

      // Check collision with orb
      if (this.currentOrb && !this.currentOrb.destroyed) {
        const dist = Math.sqrt(
          (proj.x - this.currentOrb.x) ** 2 + (proj.y - this.currentOrb.y) ** 2
        );

        if (dist < this.currentOrb.radius + 10) {
          this.hitOrb(proj);
          proj.piercing--;
          if (proj.piercing <= 0) return false;
        }
      }

      // Remove if off screen
      return proj.y > -50 && proj.x > -50 && proj.x < this.canvasWidth + 50;
    });

    // Update particles
    this.particles = this.particles.filter((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;
      return particle.life > 0;
    });

    // Update coin drops
    this.coinDrops = this.coinDrops.filter((coin) => {
      coin.y += coin.vy;
      coin.vy += 0.3; // gravity
      coin.rotation += 0.1;

      // Collect coins that reach the bottom
      if (coin.y > this.canvasHeight - 100) {
        this.coins += coin.value;
        this.addCoinCollectEffect(coin.x, coin.y);
        this.updateUI();
        return false;
      }

      return true;
    });

    // Check if orb is destroyed
    if (
      this.currentOrb &&
      this.currentOrb.health <= 0 &&
      !this.currentOrb.destroyed
    ) {
      this.destroyOrb();
    }
  }

  hitOrb(projectile) {
    if (!this.currentOrb) return;

    // Check armor first
    let hitArmor = false;
    this.currentOrb.armor.forEach((armor) => {
      if (armor.destroyed) return;

      const armorX =
        this.currentOrb.x +
        Math.cos(armor.angle + this.currentOrb.rotation) *
          (this.currentOrb.radius - 20);
      const armorY =
        this.currentOrb.y +
        Math.sin(armor.angle + this.currentOrb.rotation) *
          (this.currentOrb.radius - 20);
      const dist = Math.sqrt(
        (projectile.x - armorX) ** 2 + (projectile.y - armorY) ** 2
      );

      if (dist < 25 && !hitArmor) {
        armor.health -= projectile.damage;
        hitArmor = true;
        this.addHitEffect(armorX, armorY, "#888888");

        if (armor.health <= 0) {
          armor.destroyed = true;
          this.addArmorBreakEffect(armorX, armorY);
          this.dropCoins(armorX, armorY, 2);
        }
      }
    });

    // If no armor hit, damage the core
    if (!hitArmor) {
      this.currentOrb.health -= projectile.damage;
      this.addHitEffect(this.currentOrb.x, this.currentOrb.y, "#ff6b35");
      this.dropCoins(
        this.currentOrb.x + (Math.random() - 0.5) * 60,
        this.currentOrb.y + (Math.random() - 0.5) * 60,
        1
      );
    }
  }

  addHitEffect(x, y, color) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 20,
        maxLife: 20,
        color: color,
      });
    }
  }

  addArmorBreakEffect(x, y) {
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 30,
        maxLife: 30,
        color: "#ffffff",
      });
    }
  }

  addCoinCollectEffect(x, y) {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 4,
        life: 15,
        maxLife: 15,
        color: "#f7931e",
      });
    }
  }

  dropCoins(x, y, amount) {
    for (let i = 0; i < amount; i++) {
      this.coinDrops.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y,
        vy: -2 - Math.random() * 3,
        rotation: 0,
        value: 1,
      });
    }
  }

  destroyOrb() {
    this.currentOrb.destroyed = true;

    // Big explosion effect
    for (let i = 0; i < 50; i++) {
      this.particles.push({
        x: this.currentOrb.x,
        y: this.currentOrb.y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 60,
        maxLife: 60,
        color: `hsl(${Math.random() * 60 + 10}, 100%, ${
          50 + Math.random() * 30
        }%)`,
      });
    }

    // Drop bonus coins
    this.dropCoins(this.currentOrb.x, this.currentOrb.y, 5 + this.level);

    // Show level complete after a delay
    setTimeout(() => {
      this.showLevelComplete();
    }, 1000);
  }

  showLevelComplete() {
    const coinsEarned = 5 + this.level + (5 + this.level); // Base + armor coins
    document.getElementById("completed-level").textContent = this.level;
    document.getElementById("coins-earned").textContent = coinsEarned;
    document.getElementById("total-coins").textContent = this.coins;
    document.getElementById("level-complete-modal").classList.remove("hidden");
  }

  nextLevel() {
    this.level++;
    this.hideModal("level-complete-modal");
    this.spawnOrb();
    this.updateUI();
  }

  render() {
    // Clear screen with gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
    gradient.addColorStop(0, "#000033");
    gradient.addColorStop(1, "#000011");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Draw starfield
    this.drawStarfield();

    // Draw cannon
    this.drawCannon();

    // Draw orb
    if (this.currentOrb && !this.currentOrb.destroyed) {
      this.drawOrb();
    }

    // Draw projectiles
    this.projectiles.forEach((proj) => {
      // Draw trail
      this.ctx.strokeStyle = "#ff6b35";
      this.ctx.lineWidth = 3;
      this.ctx.globalAlpha = 0.8;
      this.ctx.beginPath();
      for (let i = 0; i < proj.trail.length - 1; i++) {
        const alpha = i / proj.trail.length;
        this.ctx.globalAlpha = alpha * 0.8;
        if (i === 0) {
          this.ctx.moveTo(proj.trail[i].x, proj.trail[i].y);
        } else {
          this.ctx.lineTo(proj.trail[i].x, proj.trail[i].y);
        }
      }
      this.ctx.stroke();
      this.ctx.globalAlpha = 1;

      // Draw projectile
      this.ctx.fillStyle = "#ff6b35";
      this.ctx.shadowColor = "#ff6b35";
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });

    // Draw particles
    this.particles.forEach((particle) => {
      const alpha = particle.life / particle.maxLife;
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;

    // Draw coin drops
    this.coinDrops.forEach((coin) => {
      this.ctx.save();
      this.ctx.translate(coin.x, coin.y);
      this.ctx.rotate(coin.rotation);
      this.ctx.fillStyle = "#f7931e";
      this.ctx.strokeStyle = "#ffffff";
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Draw dollar sign
      this.ctx.fillStyle = "#000000";
      this.ctx.font = "bold 10px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText("$", 0, 3);
      this.ctx.restore();
    });

    // Paused overlay
    if (this.gameState === "paused") {
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
      this.ctx.fillStyle = "#ff6b35";
      this.ctx.font = "bold 48px Arial";
      this.ctx.textAlign = "center";
      this.ctx.shadowColor = "#ff6b35";
      this.ctx.shadowBlur = 20;
      this.ctx.fillText("PAUSED", this.canvasWidth / 2, this.canvasHeight / 2);
      this.ctx.shadowBlur = 0;
    }
  }

  drawCannon() {
    this.ctx.save();
    this.ctx.translate(this.cannon.x, this.cannon.y);

    // Cannon base
    this.ctx.fillStyle = "#333333";
    this.ctx.strokeStyle = "#666666";
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 25, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    // Cannon barrel
    this.ctx.fillStyle = "#555555";
    this.ctx.strokeStyle = "#888888";
    this.ctx.lineWidth = 2;
    this.ctx.fillRect(-8, -40, 16, 40);
    this.ctx.strokeRect(-8, -40, 16, 40);

    // Cannon tip glow
    this.ctx.shadowColor = "#ff6b35";
    this.ctx.shadowBlur = 15;
    this.ctx.fillStyle = "#ff6b35";
    this.ctx.beginPath();
    this.ctx.arc(0, -40, 4, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    this.ctx.restore();
  }

  drawOrb() {
    const orb = this.currentOrb;

    this.ctx.save();
    this.ctx.translate(orb.x, orb.y);
    this.ctx.rotate(orb.rotation);

    // Draw orb core
    const healthPercent = orb.health / orb.maxHealth;
    const coreColor = `hsl(${healthPercent * 120}, 80%, 50%)`; // Red to green

    this.ctx.fillStyle = coreColor;
    this.ctx.shadowColor = coreColor;
    this.ctx.shadowBlur = 20;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, orb.radius - 30, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    // Draw orb outline
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, orb.radius - 30, 0, Math.PI * 2);
    this.ctx.stroke();

    // Draw armor segments
    orb.armor.forEach((armor) => {
      if (armor.destroyed) return;

      const armorX = Math.cos(armor.angle) * (orb.radius - 20);
      const armorY = Math.sin(armor.angle) * (orb.radius - 20);
      const armorHealth = armor.health / armor.maxHealth;

      this.ctx.fillStyle = `rgba(136, 136, 136, ${armorHealth})`;
      this.ctx.strokeStyle = "#ffffff";
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(armorX, armorY, 20, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Armor damage cracks
      if (armorHealth < 0.5) {
        this.ctx.strokeStyle = "#ff0000";
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(armorX - 10, armorY - 5);
        this.ctx.lineTo(armorX + 8, armorY + 7);
        this.ctx.moveTo(armorX - 8, armorY + 6);
        this.ctx.lineTo(armorX + 10, armorY - 4);
        this.ctx.stroke();
      }
    });

    this.ctx.restore();

    // Draw health bar above orb
    const barWidth = 100;
    const barHeight = 8;
    const barX = orb.x - barWidth / 2;
    const barY = orb.y - orb.radius - 20;

    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(barX, barY, barWidth, barHeight);
    this.ctx.fillStyle = coreColor;
    this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);
  }

  drawStarfield() {
    this.stars = this.stars || [];
    if (this.stars.length < 100) {
      for (let i = 0; i < 100; i++) {
        this.stars.push({
          x: Math.random() * this.canvasWidth,
          y: Math.random() * this.canvasHeight,
          size: Math.random() * 2,
          alpha: Math.random(),
        });
      }
    }

    this.stars.forEach((star) => {
      star.alpha += (Math.random() - 0.5) * 0.1;
      star.alpha = Math.max(0.1, Math.min(1, star.alpha));

      this.ctx.globalAlpha = star.alpha;
      this.ctx.fillStyle = "#ffffff";
      this.ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    this.ctx.globalAlpha = 1;
  }

  updateUI() {
    document.getElementById("coins").textContent = this.coins;
    document.getElementById("level").textContent = this.level;
    document.getElementById("power").textContent = this.cannon.damage;
    this.updateUpgradeDisplay();
  }

  resetGame() {
    this.level = 1;
    this.coins = 0;
    this.cannon.damage = 10;
    this.cannon.fireRate = 500;
    this.cannon.autoFire = false;

    // Reset upgrades
    Object.keys(this.upgrades).forEach((type) => {
      this.upgrades[type].level = 1;
      this.upgrades[type].cost =
        type === "damage"
          ? 10
          : type === "speed"
          ? 15
          : type === "piercing"
          ? 25
          : 50;
    });

    this.projectiles = [];
    this.particles = [];
    this.coinDrops = [];
    this.currentOrb = null;

    this.updateUI();
    document.getElementById("auto-fire-btn").innerHTML = "🤖 AUTO-FIRE";
    document.getElementById("auto-fire-btn").classList.remove("special");
  }

  restart() {
    this.gameState = "playing";
    this.resetGame();
    this.spawnOrb();
    this.hideModal("game-over-modal");
    document.getElementById("pause-btn").innerHTML = "⏸️ PAUSE";
    document.getElementById("shoot-indicator").style.display = "block";
  }

  gameLoop(time = 0) {
    const dt = time - this.lastTime;
    this.lastTime = time;

    if (this.gameState !== "menu") {
      this.update(dt);
      this.render();
    }

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

new OrbDestroyer();
