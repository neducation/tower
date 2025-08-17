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

  bindEvents() {
    document.getElementById("start-btn").addEventListener("click", () => {
      this.startGame();
    });

    this.canvas.addEventListener("click", () => this.shoot(true));

    document.getElementById("auto-fire-btn").addEventListener("click", () => {
      this.toggleAutoFire();
    });

    // Pause button
    document.getElementById("pause-btn").addEventListener("click", () => {
      this.togglePause();
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

  togglePause() {
    if (this.gameState === "playing") {
      this.gameState = "paused";
      document.getElementById("pause-btn").innerHTML = "▶️ RESUME";
    } else if (this.gameState === "paused") {
      this.gameState = "playing";
      document.getElementById("pause-btn").innerHTML = "⏸️ PAUSE";
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
    const spreadAngle = shots > 1 ? Math.PI / 8 : 0; // 22.5 degrees spread

    for (let i = 0; i < shots; i++) {
      let angle = -Math.PI / 2; // Straight up
      if (shots > 1) {
        angle += (i - (shots - 1) / 2) * (spreadAngle / (shots - 1));
      }

      this.projectiles.push({
        x: this.cannon.x,
        y: this.cannon.y,
        vx: Math.sin(angle) * 10,
        vy: Math.cos(angle) * -10,
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
    this.updateUpgradeDisplay();
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
