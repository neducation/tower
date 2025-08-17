// Orb Destroyer Game
class OrbDestroyer {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");

    // Game state
    this.gameState = "menu";
    this.level = 1;
    this.coins = 0;
    this.diamonds = 0;
    this.cannonPower = 1;

    // Progression system
    this.orbsDestroyed = 0;
    this.orbsThisLevel = 0;
    this.orbsPerLevel = 5; // Auto-progress after 5 orbs
    this.levelBonus = 0;

    // Cannon properties
    this.cannon = {
      x: 0, // Will be set to center
      y: 0, // Will be set to bottom
      angle: 0,
      fireRate: 50, // Fast manual tapping rate
      autoFireRate: 300, // Slower auto-fire rate
      lastShot: 0,
      damage: 10,
      piercing: 1,
      multishot: 1,
      autoFire: false,
      skin: "default", // Cosmetic skin
    };

    // Upgrades
    this.upgrades = {
      damage: { level: 1, cost: 10, multiplier: 1.5 },
      speed: { level: 1, cost: 15, multiplier: 0.8 },
      piercing: { level: 1, cost: 25, multiplier: 1 },
      multishot: { level: 1, cost: 50, multiplier: 1 },
    };

    // Cosmetic skins
    this.skins = {
      default: { name: "Classic", cost: 0, owned: true, color: "#ff6b35" },
      plasma: { name: "Plasma", cost: 50, owned: false, color: "#00ffff" },
      fire: { name: "Fire", cost: 100, owned: false, color: "#ff0000" },
      ice: { name: "Ice", cost: 150, owned: false, color: "#87ceeb" },
      gold: { name: "Golden", cost: 300, owned: false, color: "#ffd700" },
      rainbow: { name: "Rainbow", cost: 500, owned: false, color: "rainbow" },
    };

    // IAP Store items
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

    // Modal show functions
    this.showSkins = () => {
      this.populateSkinsModal();
      document.getElementById("skins-modal").classList.remove("hidden");
    };

    this.showShop = () => {
      this.populateShopModal();
      document.getElementById("shop-modal").classList.remove("hidden");
    };

    // Populate skins modal
    this.populateSkinsModal = () => {
      const skinsGrid = document.getElementById("skins-grid");
      skinsGrid.innerHTML = "";

      Object.entries(this.skins).forEach(([skinId, skin]) => {
        const skinItem = document.createElement("div");
        skinItem.className = "skin-item";

        // Check if owned
        if (skin.owned) {
          skinItem.classList.add("owned");
        }

        // Check if selected
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
    };

    // Select/purchase skin
    this.selectSkin = (skinId) => {
      const skin = this.skins[skinId];

      if (skin.owned) {
        // Already owned, just select it
        this.currentSkin = skinId;
        this.cannon.skin = skinId;
        this.populateSkinsModal();
      } else {
        // Need to purchase
        if (this.diamonds >= skin.cost) {
          this.diamonds -= skin.cost;
          skin.owned = true;
          this.currentSkin = skinId;
          this.cannon.skin = skinId;
          this.updateStats();
          this.populateSkinsModal();
        } else {
          alert(`Need ${skin.cost - this.diamonds} more diamonds!`);
        }
      }
    };

    // Populate shop modal
    this.populateShopModal = () => {
      // Diamond packages
      const diamondsShop = document.getElementById("diamonds-shop");
      diamondsShop.innerHTML = "";
      this.iapStore.diamonds.forEach((pack) => {
        const item = this.createShopItem(
          pack.icon,
          pack.amount + " Diamonds",
          pack.price,
          () => {
            // In a real app, this would trigger IAP
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
        const item = this.createShopItem(
          pack.icon,
          pack.name,
          pack.price,
          () => {
            alert(
              `Purchase ${pack.name} for ${pack.price}?\\n(Demo - not implemented)`
            );
          }
        );
        powerupsShop.appendChild(item);
      });
    };

    // Create shop item element
    this.createShopItem = (icon, amount, price, onclick) => {
      const item = document.createElement("div");
      item.className = "shop-item";
      item.innerHTML = `
        <div class="shop-item-icon">${icon}</div>
        <div class="shop-item-amount">${amount}</div>
        <div class="shop-item-price">${price}</div>
      `;
      item.onclick = onclick;
      return item;
    };

    // Initialize current skin
    this.currentSkin = "default";

    // Add event listeners for skins and shop buttons
    document
      .getElementById("skins-btn")
      .addEventListener("click", () => this.showSkins());
    document
      .getElementById("shop-btn")
      .addEventListener("click", () => this.showShop());
  }

  startGame() {
    this.gameState = "playing";
    this.showGameScreen();

    // Wait a bit for the screen transition, then setup canvas and game
    setTimeout(() => {
      this.setupCanvas(); // Recalculate canvas dimensions after screen is visible
      this.resetGame();
      this.updateStats();
      this.spawnOrb();
      document.getElementById("shoot-indicator").style.display = "block";
    }, 100);
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

  shoot(isManual = true) {
    if (this.gameState !== "playing") return;

    const now = Date.now();
    const currentFireRate = isManual
      ? this.cannon.fireRate
      : this.cannon.autoFireRate;
    if (now - this.cannon.lastShot < currentFireRate) return;

    this.cannon.lastShot = now;

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
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: this.cannon.x + (Math.random() - 0.5) * 25,
        y: this.cannon.y - 40 + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 5 - 2,
        life: 20,
        maxLife: 20,
        color: `hsl(${20 + Math.random() * 40}, 100%, ${
          50 + Math.random() * 30
        }%)`,
        type: "explosion",
      });
    }

    // Add some sparks
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: this.cannon.x + (Math.random() - 0.5) * 15,
        y: this.cannon.y - 35,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3,
        life: 15,
        maxLife: 15,
        color: "#ffffff",
        type: "spark",
      });
    }
  }

  spawnOrb() {
    // Ensure canvas dimensions are available
    if (this.canvasWidth <= 0 || this.canvasHeight <= 0) {
      console.warn("Canvas not ready, setting up...");
      this.setupCanvas();
    }

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

    console.log(
      "Orb spawned at:",
      this.currentOrb.x,
      this.currentOrb.y,
      "Canvas size:",
      this.canvasWidth,
      this.canvasHeight
    );

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
      this.shoot(false); // Pass false for auto-fire
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
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 25,
        maxLife: 25,
        color: color,
        type: "explosion",
        rotation: Math.random() * Math.PI * 2,
      });
    }

    // Add electric sparks for hits
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 15,
        maxLife: 15,
        color: "#ffffff",
        type: "spark",
      });
    }
  }

  addArmorBreakEffect(x, y) {
    // Large explosion for armor break
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 40,
        maxLife: 40,
        color: "#ffffff",
        type: "explosion",
        rotation: Math.random() * Math.PI * 2,
      });
    }

    // Metal fragments
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 35,
        maxLife: 35,
        color: "#aaaaaa",
        type: "explosion",
      });
    }

    // Electric discharge
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 20,
        maxLife: 20,
        color: "#00ffff",
        type: "spark",
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

    // Progression tracking
    this.orbsDestroyed++;
    this.orbsThisLevel++;

    // Earn diamonds from destruction
    const diamondsEarned = Math.floor(this.level / 2) + 1;
    this.diamonds += diamondsEarned;
    this.updateStats();

    // Show diamond reward
    this.showFloatingText(
      this.currentOrb.x,
      this.currentOrb.y - 30,
      `+${diamondsEarned} 💎`,
      "#00ffff",
      "bold 16px Arial",
      2000
    );

    // Massive explosion effect with multiple types
    for (let i = 0; i < 80; i++) {
      this.particles.push({
        x: this.currentOrb.x,
        y: this.currentOrb.y,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        life: 80,
        maxLife: 80,
        color: `hsl(${Math.random() * 60 + 10}, 100%, ${
          50 + Math.random() * 30
        }%)`,
        type: "explosion",
        rotation: Math.random() * Math.PI * 2,
      });
    }

    // Energy discharge sparks
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: this.currentOrb.x + (Math.random() - 0.5) * 40,
        y: this.currentOrb.y + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 50,
        maxLife: 50,
        color: "#ffffff",
        type: "spark",
      });
    }

    // Purple energy wisps
    for (let i = 0; i < 25; i++) {
      this.particles.push({
        x: this.currentOrb.x,
        y: this.currentOrb.y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 60,
        maxLife: 60,
        color: "#aa00ff",
      });
    }

    // Drop bonus coins with improved animation
    this.dropCoins(this.currentOrb.x, this.currentOrb.y, 5 + this.level);

    // Check for level progression (auto after 5 orbs)
    if (this.orbsThisLevel >= this.orbsPerLevel) {
      setTimeout(() => {
        this.autoProgressLevel();
      }, 1500);
    } else {
      // Spawn next orb after short delay
      setTimeout(() => {
        this.spawnOrb();
      }, 1000);
    }
  }

  autoProgressLevel() {
    // Calculate level bonus
    this.levelBonus = this.level * 50 + this.orbsPerLevel * 10;
    this.coins += this.levelBonus;
    this.diamonds += Math.floor(this.level / 3) + 2;

    // Show big bonus reward
    this.showFloatingText(
      this.canvasWidth / 2,
      this.canvasHeight / 2,
      `LEVEL ${this.level} COMPLETE!\n+${this.levelBonus} COINS\n+${
        Math.floor(this.level / 3) + 2
      } DIAMONDS`,
      "#00ff00",
      "bold 24px Arial",
      3000
    );

    // Progress to next level
    this.level++;
    this.orbsThisLevel = 0;

    // Spawn new orb after bonus display
    setTimeout(() => {
      this.spawnOrb();
      this.updateStats();
      this.updateUI();
    }, 2000);
  }

  nextLevel() {
    this.level++;
    this.hideModal("level-complete-modal");
    this.spawnOrb();
    this.updateUI();
  }

  showFloatingText(x, y, text, color, font, duration) {
    // Create a simple floating text effect with particles
    const lines = text.split("\n");
    lines.forEach((line, index) => {
      this.particles.push({
        x: x,
        y: y + index * 25,
        vx: 0,
        vy: -1,
        life: duration / 16, // Convert to frame count (assuming 60fps)
        maxLife: duration / 16,
        color: color,
        type: "text",
        text: line,
        font: font,
      });
    });
  }

  render() {
    // Clear screen with enhanced gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
    gradient.addColorStop(0, "#000044");
    gradient.addColorStop(0.3, "#000022");
    gradient.addColorStop(0.7, "#000011");
    gradient.addColorStop(1, "#000000");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Add nebula effects
    this.drawNebula();

    // Draw starfield
    this.drawStarfield();

    // Draw cannon
    this.drawCannon();

    // Draw orb
    if (this.currentOrb && !this.currentOrb.destroyed) {
      console.log("Drawing orb at:", this.currentOrb.x, this.currentOrb.y);
      this.drawOrb();
    } else {
      console.log("No orb to draw - currentOrb:", this.currentOrb);
    }

    // Draw projectiles
    this.projectiles.forEach((proj) => {
      // Enhanced trail with gradient
      if (proj.trail.length > 1) {
        this.ctx.lineWidth = 6;
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";

        for (let i = 0; i < proj.trail.length - 1; i++) {
          const alpha = (i / proj.trail.length) * 0.8;
          const trailGradient = this.ctx.createLinearGradient(
            proj.trail[i].x,
            proj.trail[i].y,
            proj.trail[i + 1].x,
            proj.trail[i + 1].y
          );
          trailGradient.addColorStop(0, `rgba(255, 107, 53, ${alpha * 0.5})`);
          trailGradient.addColorStop(1, `rgba(255, 170, 85, ${alpha})`);

          this.ctx.strokeStyle = trailGradient;
          this.ctx.globalAlpha = alpha;
          this.ctx.beginPath();
          this.ctx.moveTo(proj.trail[i].x, proj.trail[i].y);
          this.ctx.lineTo(proj.trail[i + 1].x, proj.trail[i + 1].y);
          this.ctx.stroke();
        }
        this.ctx.globalAlpha = 1;
        this.ctx.lineCap = "butt";
        this.ctx.lineJoin = "miter";
      }

      // Enhanced projectile with energy core
      this.ctx.save();
      this.ctx.translate(proj.x, proj.y);

      // Outer energy glow
      this.ctx.shadowColor = "#ff6b35";
      this.ctx.shadowBlur = 20;
      this.ctx.fillStyle = "#ff6b35";
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
      this.ctx.fill();

      // Inner core
      this.ctx.shadowBlur = 10;
      this.ctx.fillStyle = "#ffaa55";
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 5, 0, Math.PI * 2);
      this.ctx.fill();

      // Bright center
      this.ctx.shadowBlur = 5;
      this.ctx.fillStyle = "#ffffff";
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 2, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.shadowBlur = 0;
      this.ctx.restore();
    });

    // Enhanced particles with different types
    this.particles.forEach((particle) => {
      const alpha = particle.life / particle.maxLife;
      this.ctx.globalAlpha = alpha;

      // Different particle rendering based on type
      if (particle.type === "explosion") {
        // Large explosion particles
        this.ctx.save();
        this.ctx.translate(particle.x, particle.y);
        this.ctx.rotate(particle.rotation || 0);

        const size = 3 + (1 - alpha) * 4;
        this.ctx.fillStyle = particle.color;
        this.ctx.shadowColor = particle.color;
        this.ctx.shadowBlur = 8;
        this.ctx.fillRect(-size / 2, -size / 2, size, size);

        this.ctx.restore();
      } else if (particle.type === "spark") {
        // Electric spark particles
        this.ctx.strokeStyle = particle.color;
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = "round";
        this.ctx.shadowColor = particle.color;
        this.ctx.shadowBlur = 5;
        this.ctx.beginPath();
        this.ctx.moveTo(particle.x - 3, particle.y);
        this.ctx.lineTo(particle.x + 3, particle.y);
        this.ctx.moveTo(particle.x, particle.y - 3);
        this.ctx.lineTo(particle.x, particle.y + 3);
        this.ctx.stroke();
      } else if (particle.type === "text") {
        // Floating text particles
        this.ctx.fillStyle = particle.color;
        this.ctx.font = particle.font || "bold 16px Arial";
        this.ctx.textAlign = "center";
        this.ctx.shadowColor = particle.color;
        this.ctx.shadowBlur = 3;
        this.ctx.fillText(particle.text, particle.x, particle.y);
      } else {
        // Default circular particles with glow
        this.ctx.fillStyle = particle.color;
        this.ctx.shadowColor = particle.color;
        this.ctx.shadowBlur = 6;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, 2 + alpha * 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.shadowBlur = 0;
    });
    this.ctx.globalAlpha = 1;

    // Enhanced coin drops with animation
    this.coinDrops.forEach((coin) => {
      this.ctx.save();
      this.ctx.translate(coin.x, coin.y);
      this.ctx.rotate(coin.rotation);

      // Coin glow effect
      this.ctx.shadowColor = "#f7931e";
      this.ctx.shadowBlur = 15;

      // Outer ring
      this.ctx.strokeStyle = "#ffcc00";
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 12, 0, Math.PI * 2);
      this.ctx.stroke();

      // Main coin body with gradient
      const coinGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 10);
      coinGradient.addColorStop(0, "#ffcc00");
      coinGradient.addColorStop(0.7, "#f7931e");
      coinGradient.addColorStop(1, "#cc7700");

      this.ctx.fillStyle = coinGradient;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
      this.ctx.fill();

      // Inner shine
      this.ctx.fillStyle = "#ffffff";
      this.ctx.globalAlpha = 0.6;
      this.ctx.beginPath();
      this.ctx.arc(-2, -2, 3, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 1;

      // Dollar sign with 3D effect
      this.ctx.fillStyle = "#000000";
      this.ctx.font = "bold 12px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText("$", 1, 1); // Shadow
      this.ctx.fillStyle = "#ffffff";
      this.ctx.fillText("$", 0, 4); // Main text

      this.ctx.shadowBlur = 0;
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

    // Cannon platform/base - larger with rivets
    const gradient = this.ctx.createRadialGradient(0, 0, 10, 0, 0, 35);
    gradient.addColorStop(0, "#4a4a4a");
    gradient.addColorStop(0.6, "#2a2a2a");
    gradient.addColorStop(1, "#1a1a1a");
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 35, 0, Math.PI * 2);
    this.ctx.fill();

    // Base outline with metallic shine
    this.ctx.strokeStyle = "#6a6a6a";
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 35, 0, Math.PI * 2);
    this.ctx.stroke();

    // Rivets around the base
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = Math.cos(angle) * 28;
      const y = Math.sin(angle) * 28;
      this.ctx.fillStyle = "#8a8a8a";
      this.ctx.beginPath();
      this.ctx.arc(x, y, 3, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = "#1a1a1a";
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }

    // Cannon barrel with gradient and detail
    const barrelGradient = this.ctx.createLinearGradient(-12, 0, 12, 0);
    barrelGradient.addColorStop(0, "#2a2a2a");
    barrelGradient.addColorStop(0.3, "#4a4a4a");
    barrelGradient.addColorStop(0.7, "#4a4a4a");
    barrelGradient.addColorStop(1, "#2a2a2a");
    this.ctx.fillStyle = barrelGradient;
    this.ctx.fillRect(-12, -50, 24, 50);

    // Barrel outline
    this.ctx.strokeStyle = "#6a6a6a";
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(-12, -50, 24, 50);

    // Barrel rings for detail
    for (let i = 1; i <= 3; i++) {
      this.ctx.strokeStyle = "#5a5a5a";
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(-12, -50 + i * 12);
      this.ctx.lineTo(12, -50 + i * 12);
      this.ctx.stroke();
    }

    // Cannon tip with enhanced glow effect
    this.ctx.shadowColor = "#ff6b35";
    this.ctx.shadowBlur = 25;

    // Inner glow
    this.ctx.fillStyle = "#ffaa55";
    this.ctx.beginPath();
    this.ctx.arc(0, -50, 8, 0, Math.PI * 2);
    this.ctx.fill();

    // Outer energy ring
    this.ctx.strokeStyle = "#ff6b35";
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(0, -50, 12, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.shadowBlur = 0;

    // Power level indicator lights
    const powerLevel = Math.min(this.cannon.damage / 50, 1);
    for (let i = 0; i < 5; i++) {
      const lightY = -20 + i * 8;
      const isActive = i < powerLevel * 5;
      this.ctx.fillStyle = isActive ? "#00ff00" : "#003300";
      this.ctx.beginPath();
      this.ctx.arc(16, lightY, 2, 0, Math.PI * 2);
      this.ctx.fill();

      if (isActive) {
        this.ctx.shadowColor = "#00ff00";
        this.ctx.shadowBlur = 10;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
      }
    }

    this.ctx.restore();
  }

  drawOrb() {
    const orb = this.currentOrb;
    if (!orb) {
      console.log("No orb to draw!");
      return;
    }

    console.log(
      "Drawing orb at:",
      orb.x,
      orb.y,
      "radius:",
      orb.radius,
      "health:",
      orb.health
    );

    this.ctx.save();

    // Draw a simple, bright, visible orb first
    this.ctx.fillStyle = "#ff00ff"; // Bright magenta
    this.ctx.strokeStyle = "#00ffff"; // Cyan border
    this.ctx.lineWidth = 5;
    this.ctx.shadowColor = "#ff00ff";
    this.ctx.shadowBlur = 20;

    this.ctx.beginPath();
    this.ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    // Add a health bar above the orb
    const healthPercent = orb.health / orb.maxHealth;
    const barWidth = orb.radius * 1.5;
    const barHeight = 10;
    const barX = orb.x - barWidth / 2;
    const barY = orb.y - orb.radius - 30;

    // Health bar background
    this.ctx.fillStyle = "#333333";
    this.ctx.fillRect(barX, barY, barWidth, barHeight);

    // Health bar fill
    this.ctx.fillStyle =
      healthPercent > 0.5
        ? "#00ff00"
        : healthPercent > 0.25
        ? "#ffff00"
        : "#ff0000";
    this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    // Health bar border
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);

    this.ctx.restore();
  }

  drawStarfield() {
    this.ctx.save();
    this.ctx.scale(pulseScale, pulseScale);
    this.ctx.shadowColor = "#ff00ff";
    this.ctx.shadowBlur = 30;
    this.ctx.strokeStyle = "#ff00ff";
    this.ctx.lineWidth = 3;
    this.ctx.globalAlpha = 0.4;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, orb.radius + 10, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.restore();
    this.ctx.shadowBlur = 0;
    this.ctx.globalAlpha = 1;

    this.ctx.rotate(orb.rotation);

    // Draw orb core with multiple layers
    const healthPercent = orb.health / orb.maxHealth;

    // Outer core ring with energy
    const outerGradient = this.ctx.createRadialGradient(
      0,
      0,
      0,
      0,
      0,
      orb.radius - 25
    );
    outerGradient.addColorStop(
      0,
      `hsla(${280 + healthPercent * 80}, 80%, 60%, 0.8)`
    );
    outerGradient.addColorStop(
      0.7,
      `hsla(${260 + healthPercent * 60}, 70%, 40%, 0.6)`
    );
    outerGradient.addColorStop(
      1,
      `hsla(${240 + healthPercent * 40}, 60%, 20%, 0.3)`
    );

    this.ctx.fillStyle = outerGradient;
    this.ctx.shadowColor = `hsl(${280 + healthPercent * 80}, 80%, 60%)`;
    this.ctx.shadowBlur = 25;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, orb.radius - 25, 0, Math.PI * 2);
    this.ctx.fill();

    // Inner core with crystalline pattern
    const innerGradient = this.ctx.createRadialGradient(
      0,
      0,
      0,
      0,
      0,
      orb.radius - 35
    );
    innerGradient.addColorStop(0, `hsl(${300 + healthPercent * 60}, 90%, 80%)`);
    innerGradient.addColorStop(
      0.5,
      `hsl(${280 + healthPercent * 40}, 80%, 60%)`
    );
    innerGradient.addColorStop(1, `hsl(${260 + healthPercent * 20}, 70%, 40%)`);

    this.ctx.fillStyle = innerGradient;
    this.ctx.shadowBlur = 15;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, orb.radius - 35, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    // Crystalline pattern in the core
    this.ctx.strokeStyle = `hsla(${320 + healthPercent * 40}, 100%, 90%, 0.6)`;
    this.ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      const endX = Math.cos(angle) * (orb.radius - 40);
      const endY = Math.sin(angle) * (orb.radius - 40);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();
    }

    // Draw armor segments with detailed design
    orb.armor.forEach((armor, index) => {
      if (armor.destroyed) return;

      const armorX = Math.cos(armor.angle) * (orb.radius - 20);
      const armorY = Math.sin(armor.angle) * (orb.radius - 20);
      const armorHealth = armor.health / armor.maxHealth;

      this.ctx.save();
      this.ctx.translate(armorX, armorY);
      this.ctx.rotate(armor.angle + orb.rotation * 0.5);

      // Armor base with metallic gradient
      const armorGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 25);
      armorGradient.addColorStop(0, `rgba(180, 180, 200, ${armorHealth})`);
      armorGradient.addColorStop(
        0.6,
        `rgba(120, 120, 140, ${armorHealth * 0.8})`
      );
      armorGradient.addColorStop(1, `rgba(60, 60, 80, ${armorHealth * 0.6})`);

      this.ctx.fillStyle = armorGradient;
      this.ctx.shadowColor = "#ffffff";
      this.ctx.shadowBlur = 8;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 22, 0, Math.PI * 2);
      this.ctx.fill();

      // Armor hexagonal shape
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${armorHealth})`;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const hexAngle = (i / 6) * Math.PI * 2;
        const hexX = Math.cos(hexAngle) * 18;
        const hexY = Math.sin(hexAngle) * 18;
        if (i === 0) {
          this.ctx.moveTo(hexX, hexY);
        } else {
          this.ctx.lineTo(hexX, hexY);
        }
      }
      this.ctx.closePath();
      this.ctx.stroke();

      // Armor detail lines
      this.ctx.strokeStyle = `rgba(200, 200, 220, ${armorHealth * 0.8})`;
      this.ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const lineAngle = (i / 3) * Math.PI * 2;
        this.ctx.beginPath();
        this.ctx.moveTo(Math.cos(lineAngle) * 8, Math.sin(lineAngle) * 8);
        this.ctx.lineTo(Math.cos(lineAngle) * 16, Math.sin(lineAngle) * 16);
        this.ctx.stroke();
      }

      // Damage effects
      if (armorHealth < 0.7) {
        this.ctx.strokeStyle = "#ffaa00";
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 1 - armorHealth;
        for (let i = 0; i < 3; i++) {
          this.ctx.beginPath();
          this.ctx.moveTo(
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 30
          );
          this.ctx.lineTo(
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 30
          );
          this.ctx.stroke();
        }
        this.ctx.globalAlpha = 1;
      }

      if (armorHealth < 0.3) {
        // Sparks from damaged armor
        this.ctx.fillStyle = "#ff6600";
        this.ctx.shadowColor = "#ff6600";
        this.ctx.shadowBlur = 5;
        for (let i = 0; i < 2; i++) {
          this.ctx.beginPath();
          this.ctx.arc(
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            1,
            0,
            Math.PI * 2
          );
          this.ctx.fill();
        }
        this.ctx.shadowBlur = 0;
      }

      this.ctx.restore();
    });

    this.ctx.restore();

    // Enhanced health bar with multiple segments
    const barWidth = 120;
    const barHeight = 12;
    const barX = orb.x - barWidth / 2;
    const barY = orb.y - orb.radius - 30;

    // Health bar background
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    this.ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

    // Health bar segments
    const segments = 10;
    const segmentWidth = barWidth / segments;
    for (let i = 0; i < segments; i++) {
      const segmentHealth = Math.max(
        0,
        Math.min(1, healthPercent * segments - i)
      );
      const segmentX = barX + i * segmentWidth;

      if (segmentHealth > 0) {
        const segmentColor = `hsl(${segmentHealth * 120}, 100%, ${
          50 + segmentHealth * 20
        }%)`;
        this.ctx.fillStyle = segmentColor;
        this.ctx.fillRect(segmentX, barY, segmentWidth - 1, barHeight);

        if (segmentHealth === 1) {
          this.ctx.shadowColor = segmentColor;
          this.ctx.shadowBlur = 8;
          this.ctx.fillRect(segmentX, barY, segmentWidth - 1, barHeight);
          this.ctx.shadowBlur = 0;
        }
      }
    }

    // Health bar outline
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Armor indicators
    const armorCount = orb.armor.filter((a) => !a.destroyed).length;
    for (let i = 0; i < armorCount; i++) {
      this.ctx.fillStyle = "#cccccc";
      this.ctx.shadowColor = "#cccccc";
      this.ctx.shadowBlur = 3;
      this.ctx.beginPath();
      this.ctx.arc(barX - 10 - i * 8, barY + barHeight / 2, 3, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }
  }

  drawStarfield() {
    this.stars = this.stars || [];
    if (this.stars.length < 150) {
      for (let i = 0; i < 150; i++) {
        this.stars.push({
          x: Math.random() * this.canvasWidth,
          y: Math.random() * this.canvasHeight,
          size: Math.random() * 3 + 0.5,
          alpha: Math.random(),
          twinkleSpeed: 0.02 + Math.random() * 0.05,
          color: Math.random() > 0.8 ? "#88ccff" : "#ffffff",
          distance: Math.random(), // For parallax effect
        });
      }
    }

    this.stars.forEach((star) => {
      // Twinkling effect
      star.alpha += (Math.random() - 0.5) * star.twinkleSpeed;
      star.alpha = Math.max(0.1, Math.min(1, star.alpha));

      // Subtle movement for parallax
      star.y += star.distance * 0.1;
      if (star.y > this.canvasHeight) {
        star.y = -star.size;
        star.x = Math.random() * this.canvasWidth;
      }

      this.ctx.globalAlpha = star.alpha;
      this.ctx.fillStyle = star.color;

      // Add glow to larger stars
      if (star.size > 2) {
        this.ctx.shadowColor = star.color;
        this.ctx.shadowBlur = star.size * 2;
      }

      this.ctx.fillRect(star.x, star.y, star.size, star.size);
      this.ctx.shadowBlur = 0;
    });
    this.ctx.globalAlpha = 1;
  }

  drawNebula() {
    // Create colorful nebula clouds
    this.nebulaClouds = this.nebulaClouds || [];
    if (this.nebulaClouds.length < 5) {
      for (let i = 0; i < 5; i++) {
        this.nebulaClouds.push({
          x: Math.random() * this.canvasWidth,
          y: Math.random() * this.canvasHeight,
          radius: 50 + Math.random() * 100,
          color: `hsl(${Math.random() * 360}, 70%, 40%)`,
          alpha: 0.1 + Math.random() * 0.2,
          drift: {
            x: (Math.random() - 0.5) * 0.2,
            y: (Math.random() - 0.5) * 0.2,
          },
        });
      }
    }

    this.nebulaClouds.forEach((cloud) => {
      cloud.x += cloud.drift.x;
      cloud.y += cloud.drift.y;

      // Wrap around screen
      if (cloud.x < -cloud.radius) cloud.x = this.canvasWidth + cloud.radius;
      if (cloud.x > this.canvasWidth + cloud.radius) cloud.x = -cloud.radius;
      if (cloud.y < -cloud.radius) cloud.y = this.canvasHeight + cloud.radius;
      if (cloud.y > this.canvasHeight + cloud.radius) cloud.y = -cloud.radius;

      // Draw nebula cloud
      const gradient = this.ctx.createRadialGradient(
        cloud.x,
        cloud.y,
        0,
        cloud.x,
        cloud.y,
        cloud.radius
      );
      gradient.addColorStop(0, cloud.color.replace("40%", "30%"));
      gradient.addColorStop(0.7, cloud.color.replace("40%", "15%"));
      gradient.addColorStop(1, "transparent");

      this.ctx.globalAlpha = cloud.alpha;
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
  }

  updateUI() {
    document.getElementById("coins").textContent = this.coins;
    document.getElementById("level").textContent = this.level;
    document.getElementById("power").textContent = this.cannon.damage;
    this.updateUpgradeDisplay();
  }

  updateStats() {
    document.getElementById("coins").textContent = this.coins;
    document.getElementById("diamonds").textContent = this.diamonds;
    document.getElementById("level").textContent = this.level;
    document.getElementById(
      "orb-progress"
    ).textContent = `${this.orbsThisLevel}/${this.orbsPerLevel}`;
  }

  resetGame() {
    this.level = 1;
    this.coins = 0;
    this.diamonds = 0;
    this.orbsDestroyed = 0;
    this.orbsThisLevel = 0;
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
    // Don't clear currentOrb here - let spawnOrb() handle it

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
