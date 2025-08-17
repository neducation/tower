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

    // Visual effects
    this.particles = [];
    this.explosions = [];
    this.stars = [];
    this.time = 0;

    // Generate background stars
    this.generateStars();

    // Cannon
    this.cannon = {
      x: 0,
      y: 0,
      autoFire: false,
      lastShot: 0,
      fireRate: 50,
      autoFireRate: 300,
      damage: 10,
      piercing: 1,
      multishot: 1,
    };

    // Upgrades
    this.upgrades = {
      damage: { level: 1, cost: 10, multiplier: 1.5 },
      speed: { level: 1, cost: 15, multiplier: 0.8 },
      piercing: { level: 1, cost: 25, multiplier: 1 },
      multishot: { level: 1, cost: 50, multiplier: 1 },
    };

    // Skins system
    this.skins = {
      default: { name: "Classic", cost: 0, owned: true, color: "#ff6b35" },
      plasma: { name: "Plasma", cost: 50, owned: false, color: "#00ffff" },
      fire: { name: "Fire", cost: 100, owned: false, color: "#ff0000" },
      ice: { name: "Ice", cost: 150, owned: false, color: "#87ceeb" },
      gold: { name: "Golden", cost: 300, owned: false, color: "#ffd700" },
      rainbow: { name: "Rainbow", cost: 500, owned: false, color: "rainbow" },
    };
    this.currentSkin = "default";

    // IAP Store
    this.iapStore = {
      diamonds: [
        { icon: "💎", amount: 100, price: "$0.99" },
        { icon: "💎", amount: 500, price: "$2.99" },
        { icon: "💎", amount: 1200, price: "$4.99" },
        { icon: "💎", amount: 2500, price: "$9.99" },
        { icon: "💎", amount: 10000, price: "$49.99" },
      ],
      coins: [
        { icon: "🪙", amount: 1000, price: "$0.99" },
        { icon: "🪙", amount: 5000, price: "$2.99" },
        { icon: "🪙", amount: 15000, price: "$4.99" },
        { icon: "🪙", amount: 50000, price: "$19.99" },
        { icon: "🪙", amount: 100000, price: "$29.99" },
      ],
      powerups: [
        { icon: "💥", name: "Double Damage", price: "$1.99" },
        { icon: "⚡", name: "Rapid Fire", price: "$1.99" },
        { icon: "🎯", name: "Multi-Shot", price: "$1.99" },
        { icon: "🔥", name: "Piercing Shot", price: "$1.99" },
      ],
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

  generateStars() {
    this.stars = [];
    for (let i = 0; i < 100; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2 + 0.5,
        twinkle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.5 + 0.1,
      });
    }
  }

  createParticle(x, y, type = "explosion") {
    const colors = {
      explosion: ["#ff6b35", "#f7931e", "#ffff00", "#ff0000"],
      hit: ["#00ffff", "#0080ff", "#ffffff"],
      diamond: ["#ff00ff", "#ffff00", "#00ffff"],
      upgrade: ["#00ff00", "#39ff14", "#ffffff"],
    };

    const particleColors = colors[type] || colors.explosion;

    for (let i = 0; i < (type === "explosion" ? 20 : 8); i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.02,
        size: Math.random() * 4 + 2,
        color:
          particleColors[Math.floor(Math.random() * particleColors.length)],
        type: type,
      });
    }
  }

  createExplosion(x, y, size = 50) {
    this.explosions.push({
      x: x,
      y: y,
      size: 0,
      maxSize: size,
      life: 1.0,
      decay: 0.05,
    });
    this.createParticle(x, y, "explosion");
  }

  bindEvents() {
    document.getElementById("start-btn").addEventListener("click", () => {
      this.startGame();
    });

    this.canvas.addEventListener("click", () => this.shoot(true));

    document.getElementById("auto-fire-btn").addEventListener("click", () => {
      this.toggleAutoFire();
    });

    // Skins and shop buttons
    document.getElementById("skins-btn").addEventListener("click", () => {
      this.showSkins();
    });

    document.getElementById("shop-btn").addEventListener("click", () => {
      this.showShop();
    });

    // Upgrade buttons
    document.querySelectorAll(".upgrade-card").forEach((card) => {
      card.addEventListener("click", () => {
        const upgradeType = card.dataset.upgrade;
        this.buyUpgrade(upgradeType);
      });
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

  buyUpgrade(type) {
    const upgrade = this.upgrades[type];
    if (this.coins >= upgrade.cost) {
      this.coins -= upgrade.cost;
      upgrade.level++;

      // Create upgrade particle effect
      this.createParticle(this.cannon.x, this.cannon.y, "upgrade");

      // Apply upgrade effects
      switch (type) {
        case "damage":
          this.cannon.damage = Math.floor(
            10 * Math.pow(upgrade.multiplier, upgrade.level - 1)
          );
          break;
        case "speed":
          this.cannon.fireRate = Math.max(
            10,
            Math.floor(50 * Math.pow(upgrade.multiplier, upgrade.level - 1))
          );
          break;
        case "piercing":
          this.cannon.piercing = upgrade.level;
          break;
        case "multishot":
          this.cannon.multishot = upgrade.level;
          break;
      }

      // Update cost for next level
      upgrade.cost = Math.floor(upgrade.cost * 1.5);

      this.updateStats();
      this.updateUpgradeDisplay();
    }
  }

  updateUpgradeDisplay() {
    Object.keys(this.upgrades).forEach((type) => {
      const upgrade = this.upgrades[type];
      document.getElementById(`${type}-level`).textContent = upgrade.level;
      document.getElementById(`${type}-cost`).textContent = upgrade.cost;

      // Update affordability
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

  showSkins() {
    this.populateSkinsModal();
    document.getElementById("skins-modal").classList.remove("hidden");
  }

  showShop() {
    this.populateShopModal();
    document.getElementById("shop-modal").classList.remove("hidden");
  }

  populateSkinsModal() {
    const skinsGrid = document.getElementById("skins-grid");
    skinsGrid.innerHTML = "";

    Object.entries(this.skins).forEach(([skinId, skin]) => {
      const skinItem = document.createElement("div");
      skinItem.className = "skin-item";

      if (skin.owned) {
        skinItem.classList.add("owned");
      }

      if (this.currentSkin === skinId) {
        skinItem.classList.add("selected");
      }

      skinItem.innerHTML = `
        <div class="skin-preview">🔫</div>
        <div class="skin-name">${skin.name}</div>
        <div class="skin-price">${
          skin.cost === 0 ? "FREE" : `${skin.cost} 💎`
        }</div>
      `;

      skinItem.onclick = () => this.selectSkin(skinId);
      skinsGrid.appendChild(skinItem);
    });
  }

  selectSkin(skinId) {
    const skin = this.skins[skinId];

    if (skin.owned) {
      this.currentSkin = skinId;
      this.populateSkinsModal();
    } else {
      if (this.diamonds >= skin.cost) {
        this.diamonds -= skin.cost;
        skin.owned = true;
        this.currentSkin = skinId;
        this.updateStats();
        this.populateSkinsModal();
      } else {
        alert(`Need ${skin.cost - this.diamonds} more diamonds!`);
      }
    }
  }

  populateShopModal() {
    // Diamond packages
    const diamondsShop = document.getElementById("diamonds-shop");
    diamondsShop.innerHTML = "";
    this.iapStore.diamonds.forEach((pack) => {
      const item = this.createShopItem(
        pack.icon,
        pack.amount + " Diamonds",
        pack.price,
        () => {
          alert(
            `Purchase ${pack.amount} diamonds for ${pack.price}?\\n(Demo - not implemented)`
          );
        }
      );
      diamondsShop.appendChild(item);
    });

    // Coin packages
    const coinsShop = document.getElementById("coins-shop");
    coinsShop.innerHTML = "";
    this.iapStore.coins.forEach((pack) => {
      const item = this.createShopItem(
        pack.icon,
        pack.amount + " Coins",
        pack.price,
        () => {
          alert(
            `Purchase ${pack.amount} coins for ${pack.price}?\\n(Demo - not implemented)`
          );
        }
      );
      coinsShop.appendChild(item);
    });

    // Powerup packages
    const powerupsShop = document.getElementById("powerups-shop");
    powerupsShop.innerHTML = "";
    this.iapStore.powerups.forEach((pack) => {
      const item = this.createShopItem(pack.icon, pack.name, pack.price, () => {
        alert(
          `Purchase ${pack.name} for ${pack.price}?\\n(Demo - not implemented)`
        );
      });
      powerupsShop.appendChild(item);
    });
  }

  createShopItem(icon, amount, price, onclick) {
    const item = document.createElement("div");
    item.className = "shop-item";
    item.innerHTML = `
      <div class="shop-item-icon">${icon}</div>
      <div class="shop-item-amount">${amount}</div>
      <div class="shop-item-price">${price}</div>
    `;
    item.onclick = onclick;
    return item;
  }

  shoot(isManual = true) {
    if (this.gameState !== "playing") return;

    const now = Date.now();
    const fireRate = isManual ? this.cannon.fireRate : this.cannon.autoFireRate;
    if (now - this.cannon.lastShot < fireRate) return;

    this.cannon.lastShot = now;

    // Calculate shots based on multishot upgrade
    const shots = this.cannon.multishot;
    const spreadAngle = shots > 1 ? Math.PI / 6 : 0; // 30 degrees spread

    for (let i = 0; i < shots; i++) {
      let vx = 0;
      let vy = -10;

      if (shots > 1) {
        const angleOffset =
          (i - (shots - 1) / 2) * (spreadAngle / Math.max(1, shots - 1));
        vx = Math.sin(angleOffset) * 10;
        vy = -Math.cos(angleOffset) * 10;
      }

      this.projectiles.push({
        x: this.cannon.x,
        y: this.cannon.y,
        vx: vx,
        vy: vy,
        damage: this.cannon.damage,
        piercing: this.cannon.piercing,
      });
    }
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
          proj.piercing--;
          if (proj.piercing <= 0) return false;
        }
      }

      return proj.y > -50;
    });
  }

  hitOrb(projectile) {
    this.currentOrb.health -= projectile.damage;

    // Create hit particle effect
    this.createParticle(this.currentOrb.x, this.currentOrb.y, "hit");

    if (this.currentOrb.health <= 0) {
      this.destroyOrb();
    }
  }

  destroyOrb() {
    // Create explosion effect
    this.createExplosion(this.currentOrb.x, this.currentOrb.y, 80);

    this.currentOrb.destroyed = true;
    this.orbsDestroyed++;
    this.orbsThisLevel++;

    // Earn rewards
    this.coins += 10 + this.level * 5;
    const diamondsEarned = Math.floor(this.level / 2) + 1;
    this.diamonds += diamondsEarned;

    // Create diamond particle effect
    this.createParticle(this.currentOrb.x, this.currentOrb.y, "diamond");

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
    this.updateUpgradeDisplay();
  }

  render() {
    // Clear screen with gradient
    const gradient = this.ctx.createRadialGradient(
      this.canvas.width / 2,
      this.canvas.height / 2,
      0,
      this.canvas.width / 2,
      this.canvas.height / 2,
      Math.max(this.canvas.width, this.canvas.height)
    );
    gradient.addColorStop(0, "#000033");
    gradient.addColorStop(0.5, "#000022");
    gradient.addColorStop(1, "#000011");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw animated stars
    this.drawStars();

    // Draw particles
    this.drawParticles();

    // Draw explosions
    this.drawExplosions();

    // Draw enhanced cannon
    const skinColor = this.getSkinColor();

    // Cannon base glow
    this.ctx.shadowColor = skinColor;
    this.ctx.shadowBlur = 20;
    this.ctx.fillStyle = skinColor;

    // Main cannon body (enhanced triangle)
    this.ctx.beginPath();
    this.ctx.moveTo(this.cannon.x, this.cannon.y);
    this.ctx.lineTo(this.cannon.x - 25, this.cannon.y + 35);
    this.ctx.lineTo(this.cannon.x + 25, this.cannon.y + 35);
    this.ctx.closePath();
    this.ctx.fill();

    // Cannon barrel
    this.ctx.fillStyle = "#ffffff";
    this.ctx.shadowBlur = 10;
    this.ctx.fillRect(this.cannon.x - 4, this.cannon.y - 15, 8, 20);

    // Cannon base
    this.ctx.fillStyle = "#555555";
    this.ctx.shadowBlur = 5;
    this.ctx.fillRect(this.cannon.x - 30, this.cannon.y + 30, 60, 15);

    this.ctx.shadowBlur = 0;

    // Draw enhanced orb with animations
    if (this.currentOrb && !this.currentOrb.destroyed) {
      const healthPercent = this.currentOrb.health / this.currentOrb.maxHealth;
      const pulseFactor = 1 + Math.sin(Date.now() * 0.01) * 0.1;
      const orbRadius = this.currentOrb.radius * pulseFactor;

      // Orb outer glow
      const glowGradient = this.ctx.createRadialGradient(
        this.currentOrb.x,
        this.currentOrb.y,
        0,
        this.currentOrb.x,
        this.currentOrb.y,
        orbRadius * 2
      );
      glowGradient.addColorStop(0, "rgba(255, 0, 255, 0.8)");
      glowGradient.addColorStop(0.5, "rgba(255, 0, 255, 0.3)");
      glowGradient.addColorStop(1, "rgba(255, 0, 255, 0)");

      this.ctx.fillStyle = glowGradient;
      this.ctx.beginPath();
      this.ctx.arc(
        this.currentOrb.x,
        this.currentOrb.y,
        orbRadius * 2,
        0,
        Math.PI * 2
      );
      this.ctx.fill();

      // Main orb body with gradient
      const orbGradient = this.ctx.createRadialGradient(
        this.currentOrb.x - orbRadius * 0.3,
        this.currentOrb.y - orbRadius * 0.3,
        0,
        this.currentOrb.x,
        this.currentOrb.y,
        orbRadius
      );
      orbGradient.addColorStop(0, "#ff66ff");
      orbGradient.addColorStop(0.6, "#ff00ff");
      orbGradient.addColorStop(1, "#cc00cc");

      this.ctx.fillStyle = orbGradient;
      this.ctx.shadowColor = "#ff00ff";
      this.ctx.shadowBlur = 30;

      this.ctx.beginPath();
      this.ctx.arc(
        this.currentOrb.x,
        this.currentOrb.y,
        orbRadius,
        0,
        Math.PI * 2
      );
      this.ctx.fill();

      // Orb energy rings
      for (let i = 0; i < 3; i++) {
        const ringRadius =
          orbRadius + i * 15 + Math.sin(Date.now() * 0.005 + i) * 5;
        this.ctx.strokeStyle = `rgba(0, 255, 255, ${0.3 - i * 0.1})`;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(
          this.currentOrb.x,
          this.currentOrb.y,
          ringRadius,
          0,
          Math.PI * 2
        );
        this.ctx.stroke();
      }

      this.ctx.shadowBlur = 0;

      // Health bar
      const barWidth = this.currentOrb.radius * 1.5;
      const barX = this.currentOrb.x - barWidth / 2;
      const barY = this.currentOrb.y - this.currentOrb.radius - 30;

      // Health bar background
      this.ctx.fillStyle = "rgba(51, 51, 51, 0.8)";
      this.ctx.fillRect(barX, barY, barWidth, 12);

      // Health bar fill with gradient
      const orbHealthPercent =
        this.currentOrb.health / this.currentOrb.maxHealth;
      const healthGradient = this.ctx.createLinearGradient(
        barX,
        barY,
        barX + barWidth,
        barY
      );
      if (orbHealthPercent > 0.5) {
        healthGradient.addColorStop(0, "#00ff00");
        healthGradient.addColorStop(1, "#39ff14");
      } else {
        healthGradient.addColorStop(0, "#ff0000");
        healthGradient.addColorStop(1, "#ff6b35");
      }

      this.ctx.fillStyle = healthGradient;
      this.ctx.fillRect(barX, barY, barWidth * orbHealthPercent, 12);

      // Health bar border with glow
      this.ctx.strokeStyle = "#ffffff";
      this.ctx.lineWidth = 2;
      this.ctx.shadowColor = "#ffffff";
      this.ctx.shadowBlur = 5;
      this.ctx.strokeRect(barX, barY, barWidth, 12);
      this.ctx.shadowBlur = 0;
    }

    // Draw projectiles with enhanced effects
    this.projectiles.forEach((proj) => {
      // Get skin color
      const skinColor = this.getSkinColor();

      this.ctx.fillStyle = skinColor;
      this.ctx.shadowColor = skinColor;
      this.ctx.shadowBlur = 10;
      this.ctx.fillRect(proj.x - 3, proj.y - 10, 6, 20);

      // Add projectile trail
      this.ctx.globalAlpha = 0.5;
      this.ctx.fillRect(proj.x - 2, proj.y, 4, 15);
      this.ctx.globalAlpha = 1.0;
      this.ctx.shadowBlur = 0;
    });
  }

  drawStars() {
    this.time += 0.01;
    this.stars.forEach((star) => {
      star.twinkle += star.speed;
      const alpha = ((Math.sin(star.twinkle) + 1) / 2) * 0.8 + 0.2;

      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      this.ctx.shadowColor = "#ffffff";
      this.ctx.shadowBlur = star.size * 2;
      this.ctx.fillRect(star.x, star.y, star.size, star.size);
      this.ctx.shadowBlur = 0;
    });
  }

  drawParticles() {
    this.ctx.save();
    this.particles.forEach((particle, index) => {
      if (particle.life <= 0) {
        this.particles.splice(index, 1);
        return;
      }

      this.ctx.globalAlpha = particle.life;
      this.ctx.fillStyle = particle.color;
      this.ctx.shadowColor = particle.color;
      this.ctx.shadowBlur = particle.size;

      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();

      // Update particle
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= particle.decay;
      particle.vx *= 0.98; // Air resistance
      particle.vy *= 0.98;
    });
    this.ctx.restore();
  }

  drawExplosions() {
    this.ctx.save();
    this.explosions.forEach((explosion, index) => {
      if (explosion.life <= 0) {
        this.explosions.splice(index, 1);
        return;
      }

      this.ctx.globalAlpha = explosion.life;
      this.ctx.strokeStyle = "#ff6b35";
      this.ctx.lineWidth = 4;
      this.ctx.shadowColor = "#ff6b35";
      this.ctx.shadowBlur = 20;

      this.ctx.beginPath();
      this.ctx.arc(explosion.x, explosion.y, explosion.size, 0, Math.PI * 2);
      this.ctx.stroke();

      // Inner ring
      this.ctx.strokeStyle = "#ffff00";
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(
        explosion.x,
        explosion.y,
        explosion.size * 0.6,
        0,
        Math.PI * 2
      );
      this.ctx.stroke();

      // Update explosion
      explosion.size = Math.min(explosion.size + 3, explosion.maxSize);
      explosion.life -= explosion.decay;
    });
    this.ctx.restore();
  }

  getSkinColor() {
    const skin = this.skins[this.currentSkin];
    if (skin.color === "rainbow") {
      const hue = (Date.now() / 10) % 360;
      return `hsl(${hue}, 100%, 50%)`;
    }
    return skin.color;
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
