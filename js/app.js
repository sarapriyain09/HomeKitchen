const productGrid = document.querySelector('[data-product-grid]');
const filterButtons = document.querySelectorAll('[data-filter]');
const categoryContext = productGrid?.dataset.category || 'all';

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
      <span class="small">Add to order</span>
    </div>
  `;
  return card;
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
};

const initMenu = async () => {
  if (!productGrid) return;
  try {
    const response = await fetch('data/products.json');
    const products = await response.json();
    renderProducts(products);

    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        filterButtons.forEach((btn) => btn.classList.remove('active'));
        button.classList.add('active');
        renderProducts(products, button.dataset.filter);
      });
    });
  } catch (error) {
    productGrid.innerHTML = '<p class="small">Unable to load menu right now.</p>';
  }
};

initMenu();
