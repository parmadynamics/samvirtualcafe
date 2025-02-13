class CafeMenu {
  constructor() {
    this.menuItems = [
            {
        id: 1,
        name: "Black Coffe",
        price: 50,
        icon: "images/coffe.gif", 
        description: "Coffe for your loved once"
      },
      {
        id: 2,
        name: "TEA Latte", 
        price: 80,
        icon: "images/3.gif",
        description: "Smooth tea with calm vibes"
      },
      {
        id: 3,
        name: "Tranquility Cookies",
        price: 60,
        icon: "images/cookie.gif",
        description: "Freshly baked cookies"
      },
      {
        id: 4,
        name: "capatino",
        price: 120,
        icon: "images/2.gif",
        description: "Fresh and healthy"
      },
      {
        id: 5,
        name: "Harmony Burger",
        price: 150,
        icon: "images/5.gif",
        description: "Classic comfort food"
      },
      {
        id: 7,
        name: "Rose",
        price: 50,
        icon: "images/roses.gif",
        description: "Somethingh Romantic"
      },
      {
        id: 6,
        name: "Serenity Smoothie",
        price: 100,
        icon: "images/s.png",
        description: "Fruit blend smoothie"
      },
      {
        id: 8,
        name: "💝 Special Ring",
        price: 500,
        icon: "images/ring.gif",
        description: "A magical moment awaits",
        isSpecial: true
      }

    ];
  }

  renderMenu() {
    const menuGrid = document.getElementById('menuGrid');
    menuGrid.innerHTML = this.menuItems.map(item => `
      <div class="menu-item">
        <img src="${item.icon}" alt="${item.name}" style="width: 100px; height: 100px;" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI0ZGMTQ5MyIgZD0iTTEyIDIxLjM1bC0xLjQ1LTEuMzJDNS40IDE1LjM2IDIgMTIuMjggMiA4LjUgMiA1LjQyIDQuNDIgMyA3LjUgM2MxLjc0IDAgMy40MS44MSA0LjUgMi4wOUMxMy4wOSAzLjgxIDE0Ljc2IDMgMTYuNSAzIDE5LjU4IDMgMjIgNS40MiAyMiA4LjVjMCAzLjc4LTMuNCA2Ljg2LTguNTUgMTEuNTRMMTIgMjEuMzV6Ii8+PC9zdmc+'">
        <h3>${item.name}</h3>
        <p class="price">${item.price} coins</p>
        <p>${item.description}</p>
        <button class="order-btn" onclick="cafeManager.orderItem(${item.id})">
          Order
        </button>
      </div>
    `).join('');
  }

  initialize() {
    const menuCard = document.getElementById('menuCard');
    const menuModal = document.getElementById('menuModal');
    const menuClose = document.querySelector('.menu-close');

    menuCard.addEventListener('click', () => {
      menuModal.classList.add('active');
      this.renderMenu(); // Render menu when opened
    });

    menuClose.addEventListener('click', () => {
      menuModal.classList.remove('active');
    });

    // Close modal when clicking outside
    menuModal.addEventListener('click', (e) => {
      if (e.target === menuModal) {
        menuModal.classList.remove('active');
      }
    });
  }
}

class CafeManager {
  constructor() {
    this.coins = 1000;
    this.orders = [];
    this.menu = new CafeMenu();
    this.tableItems = [];
    this.isOrderFromMe = {}; // Track order source
    this.MAX_TABLE_ITEMS = 4; // Maximum items allowed on table
  }

  init() {
    this.menu.initialize(); // Add this line to initialize menu card functionality
    this.updateCoinDisplay();
    this.renderSharedOrders();
    this.renderTableItems();
  }

  updateCoinDisplay() {
    document.getElementById('coinBalance').textContent = this.coins;
  }

  orderItem(itemId) {
    const item = this.menu.menuItems.find(i => i.id === itemId);
    if (!item) return;

    // Check if table has space (only for non-special items)
    const activeItems = this.tableItems.filter(i => !i.eaten).length;
    if (!item.isSpecial && activeItems >= this.MAX_TABLE_ITEMS) {
      this.showTableFullMessage();
      return;
    }

    if (this.coins >= item.price) {
      this.coins -= item.price;
      this.updateCoinDisplay();

      const order = {
        id: Date.now(),
        item: item,
        status: 'pending',
        from: 'You'
      };

      this.orders.push(order);
      this.isOrderFromMe[order.id] = true;
      this.renderSharedOrders();

      if (window.peacefulConnect) {
        window.peacefulConnect.sendOrder(order);
      }

      setTimeout(() => {
        order.status = 'served';
        this.renderSharedOrders();

        const tableItem = {
          id: order.id,
          item: order.item,
          eaten: false
        };

        this.addTableItem(tableItem);

        if (window.peacefulConnect) {
          window.peacefulConnect.sendTableItem(tableItem);
        }
      }, Math.random() * 5000 + 2000);
    } else {
      alert('Not enough coins!');
    }
  }

  showTableFullMessage() {
    const popup = document.createElement('div');
    popup.className = 'table-full-popup';
    popup.innerHTML = `
      <div class="popup-content">
        <div class="popup-icon">🍽️</div>
        <h3>Oops! Table is Full</h3>
        <p>Please finish some food first before ordering more!</p>
        <button class="popup-close">OK</button>
      </div>
    `;

    document.body.appendChild(popup);

    // Add animation class after a small delay
    setTimeout(() => popup.classList.add('show'), 10);

    // Close button functionality
    const closeBtn = popup.querySelector('.popup-close');
    closeBtn.addEventListener('click', () => {
      popup.classList.remove('show');
      setTimeout(() => popup.remove(), 300);
    });

    // Auto close after 3 seconds
    setTimeout(() => {
      if (document.body.contains(popup)) {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
      }
    }, 3000);
  }

  receiveOrder(order) {
    const existingOrder = this.orders.find(o => o.id === order.id);
    order.from = 'Friend';

    if (existingOrder) {
      existingOrder.status = order.status;
    } else {
      this.orders.push(order);
      this.isOrderFromMe[order.id] = false;
    }

    this.renderSharedOrders();

    if (order.status === 'served') {
      const tableItem = {
        id: order.id,
        item: order.item,
        eaten: false
      };
      this.addTableItem(tableItem);
    }
  }

  receiveTableItem(tableItem) {
    if (!this.tableItems.find(i => i.id === tableItem.id)) {
      this.tableItems.push(tableItem);
      this.renderTableItems();
    }
  }

  eatItem(itemId) {
    const item = this.tableItems.find(i => i.id === itemId);
    if (!item || item.eaten) return;

    setTimeout(() => {
      item.eaten = true;
      this.renderTableItems();

      if (window.peacefulConnect) {
        window.peacefulConnect.sendEatAction(itemId);
      }
    }, 1000);
  }

  receiveEatAction(itemId) {
    const item = this.tableItems.find(i => i.id === itemId);
    if (item) {
      item.eaten = true;
      this.renderTableItems();
    }
  }

  renderSharedOrders() {
    const sharedOrdersContainer = document.getElementById('sharedOrders');
    sharedOrdersContainer.innerHTML = this.orders.map(order => `
      <div class="shared-order-item ${order.status}">
        <div class="order-content">
          <img src="${order.item.icon}" alt="${order.item.name}" style="width: 50px; height: 50px;" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI0ZGMTQ5MyIgZD0iTTggMThoOHYtMkg4djJ6bTAtNGg4di0ySDh2MnptMC00aDh2LTJIOHYyem0tMiA4YzAtMS4xLjktMiAyLTJoOGMxLjEgMCAyIC45IDIgMkg2eiIvPjwvc3ZnPg=='">
          <div class="order-details">
            <span class="order-name">${order.item.name}</span>
            <span class="order-from">Ordered by: ${order.from}</span>
          </div>
          ${order.status === 'served' ? `
            <span class="order-status-badge served">Served</span>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  renderTableItems() {
    const tableItemsContainer = document.querySelector('.table-items');
    if (!tableItemsContainer) return;

    tableItemsContainer.innerHTML = this.tableItems
      .filter(item => !item.eaten)
      .map(item => `
        <div class="food-item" onclick="cafeManager.eatItem(${item.id})">
          <img src="${item.item.icon}" alt="${item.item.name}" style="width: 200px; height: 200px;" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI0ZGMTQ5MyIgZD0iTTggMThoOHYtMkg4djJ6bTAtNGg4di0ySDh2MnptMC00aDh2LTJIOHYyem0tMiA4YzAtMS4xLjktMiAyLTJoOGMxLjEgMCAyIC45IDIgMkg2eiIvPjwvc3ZnPg=='">
          <div class="food-name">${item.item.name}</div>
        </div>
      `).join('');
  }

  addTableItem(tableItem) {
    if (window.peacefulConnect && window.peacefulConnect.dataConnection) {
      // Ensure image path starts with images/ before sending
      if (tableItem.item.isSpecial && tableItem.item.icon) {
        if (!tableItem.item.icon.startsWith('images/')) {
          tableItem.item.icon = 'images/' + tableItem.item.icon.split('/').pop();
        }
      }
      
      window.peacefulConnect.dataConnection.send({
        type: tableItem.item.isSpecial ? 'special-ring-delivery' : 'food-delivery',
        tableItem: tableItem
      });
    }

    // Add delay before triggering animation
    setTimeout(() => {
      this.triggerFoodDeliveryAnimation(tableItem);
    }, 100);
  }

  triggerFoodDeliveryAnimation(tableItem) {
    if (tableItem.item.isSpecial) {
      this.triggerSpecialRingAnimation(tableItem);
      return;
    }

    const foodDeliveryGif = document.createElement('img');
    foodDeliveryGif.onerror = () => {
      foodDeliveryGif.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI0ZGMTQ5MyIgZD0iTTggMThoOHYtMkg4djJ6bTAtNGg4di0ySDh2MnptMC00aDh2LTJIOHYyem0tMiA4YzAtMS4xLjktMiAyLTJoOGMxLjEgMCAyIC45IDIgMkg2eiIvPjwvc3ZnPg==';
    };
    foodDeliveryGif.src = 'p.gif';
    foodDeliveryGif.style.position = 'fixed';
    foodDeliveryGif.style.width = '200px';
    foodDeliveryGif.style.height = '200px';
    foodDeliveryGif.style.transition = 'all 1s ease';
    foodDeliveryGif.style.zIndex = '1000';
    
    foodDeliveryGif.style.top = '50%';
    foodDeliveryGif.style.left = '-100px';
    foodDeliveryGif.style.transform = 'translateY(-50%)';
    
    document.body.appendChild(foodDeliveryGif);

    foodDeliveryGif.offsetWidth;

    setTimeout(() => {
      const tableArea = document.querySelector('.virtual-table-area');
      const tableRect = tableArea.getBoundingClientRect();
      
      foodDeliveryGif.style.left = `${tableRect.left + tableRect.width/2 - 100}px`;
      foodDeliveryGif.style.top = `${tableRect.top + tableRect.height/2 - 100}px`;
      foodDeliveryGif.style.transform = 'translate(-50%, -50%)';
    }, 100);

    setTimeout(() => {
      foodDeliveryGif.remove();

      if (!this.tableItems.find(i => i.id === tableItem.id)) {
        this.tableItems.push(tableItem);
        this.renderTableItems();
      }
    }, 2000);
  }

  triggerSpecialRingAnimation(tableItem) {
    // Ensure correct image path
    if (tableItem.item.icon && !tableItem.item.icon.startsWith('images/')) {
      tableItem.item.icon = 'images/' + tableItem.item.icon.split('/').pop();
    }

    const specialEffects = document.createElement('div');
    specialEffects.className = 'special-effects';
    document.body.appendChild(specialEffects);

    for (let i = 0; i < 50; i++) {
      const heart = document.createElement('div');
      heart.className = 'floating-heart';
      heart.innerHTML = ['💝', '💖', '💗', '💓', '💘', '💕', '❤️', '💞', '💟', '💌'][Math.floor(Math.random() * 10)];
      heart.style.left = Math.random() * 100 + 'vw';
      heart.style.animationDelay = Math.random() * 3 + 's';
      specialEffects.appendChild(heart);
    }

    document.body.style.transition = 'background-color 2s ease';
    document.body.style.backgroundColor = '#FFE4E1';  

    const ringDelivery = document.createElement('div');
    ringDelivery.className = 'ring-delivery';
    
    // Use the corrected image path
    ringDelivery.style.backgroundImage = `url(${tableItem.item.icon})`;

    document.body.appendChild(ringDelivery);

    setTimeout(() => {
      const tableArea = document.querySelector('.virtual-table-area');
      const tableRect = tableArea.getBoundingClientRect();
      
      ringDelivery.style.left = `${tableRect.left + tableRect.width/2 - 100}px`;
      ringDelivery.style.top = `${tableRect.top + tableRect.height/2 - 100}px`;
      ringDelivery.style.transform = 'translate(-50%, -50%) scale(1.2)';
    }, 100);

    setTimeout(() => {
      document.body.style.backgroundColor = '';  
      ringDelivery.remove();
      specialEffects.remove();
      
      if (!this.tableItems.find(i => i.id === tableItem.id)) {
        this.tableItems.push(tableItem);
        this.renderTableItems();
      }
    }, 15000);  
  }

  receiveFoodDelivery(data) {
    // Ensure image path correction for received data
    if (data.type === 'special-ring-delivery') {
      if (data.tableItem && data.tableItem.item && data.tableItem.item.icon) {
        // Ensure path starts with images/
        if (!data.tableItem.item.icon.startsWith('images/')) {
          data.tableItem.item.icon = 'images/' + data.tableItem.item.icon.split('/').pop();
        }
      }
      this.triggerSpecialRingAnimation(data.tableItem);
    } else {
      this.triggerFoodDeliveryAnimation(data.tableItem);
    }
  }

  receiveFoodDelivery(data) {
    if (data.type === 'special-ring-delivery') {
      this.triggerSpecialRingAnimation(data.tableItem);
    } else {
      this.triggerFoodDeliveryAnimation(data.tableItem);
    }
  }
}

const cafeManager = new CafeManager();
cafeManager.init();
