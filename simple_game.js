// Simple Orb Destroyer Game
class SimpleOrbDestroyer {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");

    // Game state
    this.gameState = "menu";
    this.level = 1;
    this.coins = 0;
    this.diamonds = 0;

    // Progression
    this.orbsDestroyed = 0;
    this.orbsThisLevel = 0;
    this.orbsPerLevel = 5;

    // Cannon
    this.cannon = {
      x: 0,
      y: 0,
      autoFire: false,
      lastShot: 0,
      fireRate: 50,
      autoFireRate: 300,
      damage: 10,
    };

    // Game objects
    this.currentOrb = null;
    this.projectiles = [];

    this.setupCanvas();
    this.bindEvents();
    this.showStartScreen();
    this.gameLoop();
  }

  setupCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight * 0.65;
    this.cannon.x = this.canvas.width / 2;
    this.cannon.y = this.canvas.height - 50;
  }

  bindEvents() {
    document.getElementById("start-btn").addEventListener("click", () => {
      this.startGame();
    });

    this.canvas.addEventListener("click", () => this.shoot(true));

    document.getElementById("auto-fire-btn").addEventListener("click", () => {
      this.toggleAutoFire();
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

  startGame() {
    console.log("Starting game...");
    this.gameState = "playing";
    this.showGameScreen();
    this.spawnOrb();
    this.updateStats();
  }

  spawnOrb() {
    console.log("Spawning orb...");
    this.currentOrb = {
      x: this.canvas.width / 2,
      y: this.canvas.height * 0.3,
      radius: 80,
      health: 100,
      maxHealth: 100,
      destroyed: false,
    };
    console.log("Orb created at:", this.currentOrb.x, this.currentOrb.y);
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

  shoot(isManual = true) {
    if (this.gameState !== "playing") return;

    const now = Date.now();
    const fireRate = isManual ? this.cannon.fireRate : this.cannon.autoFireRate;
    if (now - this.cannon.lastShot < fireRate) return;

    this.cannon.lastShot = now;

    this.projectiles.push({
      x: this.cannon.x,
      y: this.cannon.y,
      vx: 0,
      vy: -10,
      damage: this.cannon.damage,
    });
  }

  update() {
    if (this.gameState !== "playing") return;

    // Auto-fire
    if (this.cannon.autoFire && this.currentOrb && !this.currentOrb.destroyed) {
      this.shoot(false);
    }

    // Update projectiles
    this.projectiles = this.projectiles.filter((proj) => {
      proj.x += proj.vx;
      proj.y += proj.vy;

      // Check collision with orb
      if (this.currentOrb && !this.currentOrb.destroyed) {
        const dist = Math.sqrt(
          (proj.x - this.currentOrb.x) ** 2 + (proj.y - this.currentOrb.y) ** 2
        );
        if (dist < this.currentOrb.radius) {
          this.hitOrb(proj);
          return false;
        }
      }

      return proj.y > -50;
    });
  }

  hitOrb(projectile) {
    this.currentOrb.health -= projectile.damage;

    if (this.currentOrb.health <= 0) {
      this.destroyOrb();
    }
  }

  destroyOrb() {
    this.currentOrb.destroyed = true;
    this.orbsDestroyed++;
    this.orbsThisLevel++;

    // Earn rewards
    this.coins += 10 + this.level * 5;
    this.diamonds += Math.floor(this.level / 2) + 1;

    this.updateStats();

    // Check for level progression
    if (this.orbsThisLevel >= this.orbsPerLevel) {
      this.autoProgressLevel();
    } else {
      setTimeout(() => this.spawnOrb(), 1000);
    }
  }

  autoProgressLevel() {
    this.level++;
    this.orbsThisLevel = 0;
    const bonus = this.level * 50;
    this.coins += bonus;
    this.diamonds += Math.floor(this.level / 3) + 2;

    this.updateStats();
    setTimeout(() => this.spawnOrb(), 2000);
  }

  updateStats() {
    document.getElementById("coins").textContent = this.coins;
    document.getElementById("diamonds").textContent = this.diamonds;
    document.getElementById("level").textContent = this.level;
    document.getElementById(
      "orb-progress"
    ).textContent = `${this.orbsThisLevel}/${this.orbsPerLevel}`;
  }

  render() {
    // Clear screen
    this.ctx.fillStyle = "#000011";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw cannon (simple triangle)
    this.ctx.fillStyle = "#00ffff";
    this.ctx.beginPath();
    this.ctx.moveTo(this.cannon.x, this.cannon.y);
    this.ctx.lineTo(this.cannon.x - 20, this.cannon.y + 30);
    this.ctx.lineTo(this.cannon.x + 20, this.cannon.y + 30);
    this.ctx.closePath();
    this.ctx.fill();

    // Draw orb (BIG AND OBVIOUS!)
    if (this.currentOrb && !this.currentOrb.destroyed) {
      console.log("Rendering orb at:", this.currentOrb.x, this.currentOrb.y);

      // Main orb body - BRIGHT MAGENTA
      this.ctx.fillStyle = "#ff00ff";
      this.ctx.strokeStyle = "#00ffff";
      this.ctx.lineWidth = 5;
      this.ctx.shadowColor = "#ff00ff";
      this.ctx.shadowBlur = 30;

      this.ctx.beginPath();
      this.ctx.arc(
        this.currentOrb.x,
        this.currentOrb.y,
        this.currentOrb.radius,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
      this.ctx.stroke();

      // Health bar
      const healthPercent = this.currentOrb.health / this.currentOrb.maxHealth;
      const barWidth = this.currentOrb.radius * 1.5;
      const barX = this.currentOrb.x - barWidth / 2;
      const barY = this.currentOrb.y - this.currentOrb.radius - 20;

      this.ctx.fillStyle = "#333";
      this.ctx.fillRect(barX, barY, barWidth, 10);

      this.ctx.fillStyle = healthPercent > 0.5 ? "#00ff00" : "#ff0000";
      this.ctx.fillRect(barX, barY, barWidth * healthPercent, 10);

      this.ctx.strokeStyle = "#fff";
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(barX, barY, barWidth, 10);
    }

    // Draw projectiles
    this.projectiles.forEach((proj) => {
      this.ctx.fillStyle = "#ffff00";
      this.ctx.fillRect(proj.x - 3, proj.y - 10, 6, 20);
    });
  }

  gameLoop() {
    if (this.gameState !== "menu") {
      this.update();
      this.render();
    }
    requestAnimationFrame(() => this.gameLoop());
  }
}

// Start the simple game
new SimpleOrbDestroyer();
