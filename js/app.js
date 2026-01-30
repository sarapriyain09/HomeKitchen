const productGrid = document.querySelector('[data-product-grid]');
const filterButtons = document.querySelectorAll('[data-filter]');
const categoryContext = productGrid?.dataset.category || 'all';
const cartItemsEl = document.querySelector('[data-cart-items]');
const cartTotalEl = document.querySelector('[data-cart-total]');
const checkoutButton = document.querySelector('[data-checkout]');
const apiBase = typeof BACKEND_URL !== 'undefined' && BACKEND_URL
  ? BACKEND_URL
  : 'http://localhost:4242';

const CART_KEY = 'hk_cart';

const normalizePath = (path) => encodeURI(path);

const formatPrice = (price) => {
  if (!price) return '';
  const trimmed = String(price).trim();
  return trimmed.includes('£') ? trimmed : `£${trimmed}`;
};

const createCard = (product) => {
  const card = document.createElement('article');
  card.className = 'card product-card';
  card.innerHTML = `
    <div class="product-image">
      <img src="${normalizePath(product.image)}" alt="${product.name}" loading="lazy" />
    </div>
    <span class="badge">${product.category.replace('-', ' ')}</span>
    <h3>${product.name}</h3>
    <p class="small">${product.description || ''}</p>
    <div class="product-footer">
      <strong>${formatPrice(product.price)}</strong>
      <button type="button" data-add="${product.name}">Add</button>
    </div>
  `;
  return card;
};

const getCart = () => {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
};

const saveCart = (cart) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCart(cart);
};

const addToCart = (product) => {
  const cart = getCart();
  const existing = cart.find((item) => item.name === product.name);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
    });
  }
  saveCart(cart);
};

const renderCart = (cart) => {
  if (!cartItemsEl || !cartTotalEl) return;
  cartItemsEl.innerHTML = '';
  if (!cart.length) {
    cartItemsEl.innerHTML = '<p class="small">Your cart is empty.</p>';
    cartTotalEl.textContent = '£0.00';
    return;
  }

  let total = 0;
  cart.forEach((item) => {
    const line = document.createElement('div');
    line.className = 'cart-item';
    const lineTotal = Number(item.price) * item.quantity;
    total += lineTotal;
    line.innerHTML = `
      <div>
        <strong>${item.name}</strong>
        <span>x${item.quantity}</span>
      </div>
      <span>${formatPrice(lineTotal.toFixed(2))}</span>
    `;
    cartItemsEl.appendChild(line);
  });
  cartTotalEl.textContent = formatPrice(total.toFixed(2));
};

const handleCheckout = async () => {
  const cart = getCart();
  if (!cart.length) return;
  checkoutButton.textContent = 'Redirecting...';
  checkoutButton.disabled = true;
  try {
    const response = await fetch(`${apiBase}/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart }),
    });
    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    throw new Error(data.error || 'Unable to start checkout');
  } catch (error) {
    alert(error.message || 'Checkout failed');
  } finally {
    checkoutButton.textContent = 'Checkout';
    checkoutButton.disabled = false;
  }
};

const renderProducts = (products, filter = 'all') => {
  if (!productGrid) return;
  productGrid.innerHTML = '';
  const filtered = products.filter((product) => {
    if (categoryContext !== 'all') return product.category === categoryContext;
    if (filter === 'all') return true;
    return product.category === filter;
  });

  if (!filtered.length) {
    productGrid.innerHTML = '<p class="small">No items available yet.</p>';
    return;
  }

  filtered.forEach((product) => productGrid.appendChild(createCard(product)));

  productGrid.querySelectorAll('[data-add]').forEach((button) => {
    button.addEventListener('click', () => {
      const product = filtered.find((item) => item.name === button.dataset.add);
      if (product) addToCart(product);
    });
  });
};

const initMenu = async () => {
  if (!productGrid) return;
  try {
    const response = await fetch('data/products.json');
    const products = await response.json();
    renderProducts(products);
    renderCart(getCart());

    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        filterButtons.forEach((btn) => btn.classList.remove('active'));
        button.classList.add('active');
        renderProducts(products, button.dataset.filter);
      });
    });

    if (checkoutButton) {
      checkoutButton.addEventListener('click', handleCheckout);
    }
  } catch (error) {
    productGrid.innerHTML = '<p class="small">Unable to load menu right now.</p>';
  }
};

initMenu();
