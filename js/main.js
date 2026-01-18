/**
 * RE-Store Italia - Apple Premium Partner
 * E-commerce Landing Page JavaScript
 */

// ============================================
// State Management
// ============================================
let cart = JSON.parse(localStorage.getItem('reStoreCart')) || [];
let currentStep = 1;
let shippingCost = 0;
let lastOrderTotal = 0; // Store the total before cart is cleared
let currentProduct = null;
let selectedColor = null;
let selectedStorage = null;

// Payment state
let currentPaymentId = null;
let currentBankInfo = null;
let paymentCheckInterval = null;
let timerInterval = null;
let remainingSeconds = 300; // 5 minutes

// API URL (change in production)
const API_URL = window.location.origin.includes('file://') || window.location.origin === 'null' 
    ? 'http://localhost:3000' 
    : window.location.origin;

// ============================================
// Product Database with Real Colors & Storage
// ============================================
const products = {
    // ==================== iPhone 17 Pro Max ====================
    // Prezzi ufficiali: 256GB €1.489, 512GB €1.739, 1TB €1.989, 2TB €2.489
    // Sconto ~8%
    iphone17promax: {
        id: 'iphone17promax',
        name: 'iPhone 17 Pro Max',
        subtitle: 'Il più potente iPhone di sempre.',
        rating: '4.9 (2.847 recensioni)',
        colors: [
            { id: 'argento', name: 'Silver', class: 'color-argento', image: 'img/iphone17promax/silver.png' },
            { id: 'blu-profondo', name: 'Deep Blue', class: 'color-deep-blue', image: 'img/iphone17promax/deepblue.png' },
            { id: 'arancione-cosmico', name: 'Cosmic Orange', class: 'color-cosmic-orange', image: 'img/iphone17promax/orange.png' }
        ],
        storage: [
            { size: '256GB', price: 1100, originalPrice: 1489 },
            { size: '512GB', price: 1250, originalPrice: 1739 },
            { size: '1TB', price: 1588, originalPrice: 1989 },
            { size: '2TB', price: 1823, originalPrice: 2489 }
        ]
    },
    // ==================== iPhone Air ====================
    // Prezzi ufficiali: 256GB €1.239, 512GB €1.489, 1TB €1.739
    // Sconto ~8%
    iphoneair: {
        id: 'iphoneair',
        name: 'iPhone Air',
        subtitle: 'Ultra-sottile. 5,64mm. Titanio.',
        rating: '4.9 (1.234 recensioni)',
        colors: [
            { id: 'nero-siderale', name: 'Nero Siderale', class: 'color-space-black', image: 'img/iphoneair/spaceblack.png' },
            { id: 'bianco-nuvola', name: 'Bianco Nuvola', class: 'color-cloud-white', image: 'img/iphoneair/cloudwhite.png' },
            { id: 'oro-chiaro', name: 'Oro Chiaro', class: 'color-light-gold', image: 'img/iphoneair/lightgold.png' },
            { id: 'celeste', name: 'Celeste', class: 'color-celeste', image: 'img/iphoneair/skyblue.png' }
        ],
        storage: [
            { size: '256GB', price: 799, originalPrice: 1239 },
            { size: '512GB', price: 901, originalPrice: 1489 },
            { size: '1TB', price: 1055, originalPrice: 1739 }
        ]
    },
    // ==================== iPhone 17 ====================
    // Prezzi ufficiali: 256GB €979, 512GB €1.229
    // Sconto ~8%
    iphone17: {
        id: 'iphone17',
        name: 'iPhone 17',
        subtitle: 'La nuova generazione.',
        rating: '4.9 (1.856 recensioni)',
        colors: [
            { id: 'nero', name: 'Black', class: 'color-nero', image: 'img/iphone17/black.png' },
            { id: 'bianco', name: 'White', class: 'color-bianco', image: 'img/iphone17/white.png' },
            { id: 'blu-nebbia', name: 'Mist Blue', class: 'color-mist-blue', image: 'img/iphone17/mistblue.png' },
            { id: 'salvia', name: 'Sage', class: 'color-sage', image: 'img/iphone17/sage.png' },
            { id: 'lavanda', name: 'Lavender', class: 'color-lavender', image: 'img/iphone17/lavender.png' }
        ],
        storage: [
            { size: '256GB', price: 805, originalPrice: 979 },
            { size: '512GB', price: 967, originalPrice: 1229 }
        ]
    },
    // ==================== iPhone 16 Pro Max ====================
    // Prezzi ufficiali: 256GB €1.489, 512GB €1.739, 1TB €1.989
    // Sconto ~8%
    iphone16promax: {
        id: 'iphone16promax',
        name: 'iPhone 16 Pro Max',
        subtitle: 'Titanio. Così resistente, così leggero.',
        rating: '4.9 (5.847 recensioni)',
        colors: [
            { id: 'titanio-nero', name: 'Black Titanium', class: 'color-black-titanium', image: 'img/iphone16promax/blacktitanium.png' },
            { id: 'titanio-bianco', name: 'White Titanium', class: 'color-white-titanium', image: 'img/iphone16promax/whitetitanium.png' },
            { id: 'titanio-naturale', name: 'Natural Titanium', class: 'color-natural-titanium', image: 'img/iphone16promax/naturaltitanium.png' },
            { id: 'titanio-deserto', name: 'Desert Titanium', class: 'color-desert-titanium', image: 'img/iphone16promax/deserttitanium.png' }
        ],
        storage: [
            { size: '256GB', price: 680, originalPrice: 1489 },
            { size: '512GB', price: 780, originalPrice: 1739 },
            { size: '1TB', price: 880, originalPrice: 1989 }
        ]
    },
    // ==================== iPhone 16 Pro ====================
    // Prezzi ufficiali: 256GB €1.369, 512GB €1.619, 1TB €1.869
    // Sconto ~8%
    iphone16pro: {
        id: 'iphone16pro',
        name: 'iPhone 16 Pro',
        subtitle: 'Titanio. Chip A18 Pro. Display 6.3"',
        rating: '4.9 (4.521 recensioni)',
        colors: [
            { id: 'titanio-nero', name: 'Black Titanium', class: 'color-black-titanium', image: 'img/iphone16promax/blacktitanium.png' },
            { id: 'titanio-bianco', name: 'White Titanium', class: 'color-white-titanium', image: 'img/iphone16promax/whitetitanium.png' },
            { id: 'titanio-naturale', name: 'Natural Titanium', class: 'color-natural-titanium', image: 'img/iphone16promax/naturaltitanium.png' },
            { id: 'titanio-deserto', name: 'Desert Titanium', class: 'color-desert-titanium', image: 'img/iphone16promax/deserttitanium.png' }
        ],
        storage: [
            { size: '256GB', price: 590, originalPrice: 1369 },
            { size: '512GB', price: 690, originalPrice: 1619 },
            { size: '1TB', price: 799, originalPrice: 1869 }
        ]
    },
    // ==================== iPhone 16 ====================
    // Prezzi ufficiali: 128GB €979, 256GB €1.109, 512GB €1.359
    // Sconto ~8%
    iphone16: {
        id: 'iphone16',
        name: 'iPhone 16',
        subtitle: 'Straordinario. In ogni senso.',
        rating: '4.9 (3.156 recensioni)',
        colors: [
            { id: 'nero', name: 'Black', class: 'color-nero', image: 'img/iphone16/black.png' },
            { id: 'bianco', name: 'White', class: 'color-bianco', image: 'img/iphone16/white.png' },
            { id: 'rosa', name: 'Pink', class: 'color-rosa', image: 'img/iphone16/pink.png' },
            { id: 'verde', name: 'Teal', class: 'color-teal', image: 'img/iphone16/teal.png' },
            { id: 'blu', name: 'Ultramarine', class: 'color-ultramarine', image: 'img/iphone16/ultramarine.png' }
        ],
        storage: [
            { size: '128GB', price: 448, originalPrice: 979 },
            { size: '256GB', price: 490, originalPrice: 1109 },
            { size: '512GB', price: 565, originalPrice: 1359 }
        ]
    },
    // ==================== iPhone 15 Pro Max ====================
    // Prezzi ufficiali: 256GB €1.489, 512GB €1.729, 1TB €1.989
    // Sconto ~15% (modello precedente)
    iphone15promax: {
        id: 'iphone15promax',
        name: 'iPhone 15 Pro Max',
        subtitle: 'Titanio. Potenza assoluta.',
        rating: '4.9 (8.234 recensioni)',
        colors: [
            { id: 'titanio-blu', name: 'Blue Titanium', class: 'color-blu-oltremare', image: 'img/iphone15promax/bluetitanium.png', available: true },
            { id: 'titanio-nero', name: 'Black Titanium', class: 'color-titanio-nero', image: 'img/iphone15promax/bluetitanium.png', available: false },
            { id: 'titanio-bianco', name: 'White Titanium', class: 'color-titanio-bianco', image: 'img/iphone15promax/bluetitanium.png', available: false },
            { id: 'titanio-naturale', name: 'Natural Titanium', class: 'color-titanio-naturale', image: 'img/iphone15promax/bluetitanium.png', available: false }
        ],
        storage: [
            { size: '256GB', price: 506, originalPrice: 1489 }
        ]
    },
    // ==================== iPhone 15 ====================
    // Prezzi ufficiali: 128GB €979, 256GB €1.109, 512GB €1.359
    // Sconto ~15% (modello precedente)
    iphone15: {
        id: 'iphone15',
        name: 'iPhone 15',
        subtitle: 'Dynamic Island. USB-C.',
        rating: '4.8 (6.543 recensioni)',
        colors: [
            { id: 'nero', name: 'Black', class: 'color-nero', image: 'img/iphone15/black.png', available: true },
            { id: 'blu', name: 'Blue', class: 'color-blu-oltremare', image: 'img/iphone15/black.png', available: false },
            { id: 'verde', name: 'Green', class: 'color-verde-acqua', image: 'img/iphone15/black.png', available: false },
            { id: 'giallo', name: 'Yellow', class: 'color-giallo', image: 'img/iphone15/black.png', available: false },
            { id: 'rosa', name: 'Pink', class: 'color-pink', image: 'img/iphone15/black.png', available: false }
        ],
        storage: [
            { size: '256GB', price: 358, originalPrice: 1109 }
        ]
    },
    // ==================== iPhone 14 Pro Max ====================
    // Prezzi ufficiali: 128GB €1.489, 256GB €1.619, 512GB €1.879, 1TB €2.139
    // Sconto ~45% (modello 2022, fine serie)
    iphone14promax: {
        id: 'iphone14promax',
        name: 'iPhone 14 Pro Max',
        subtitle: 'Dynamic Island. Always-On display.',
        rating: '4.8 (9.876 recensioni)',
        colors: [
            { id: 'viola-scuro', name: 'Deep Purple', class: 'color-deep-purple', image: 'img/iphone14promax/deeppurple.png', available: true },
            { id: 'nero-siderale', name: 'Space Black', class: 'color-titanio-nero', image: 'img/iphone14promax/deeppurple.png', available: false },
            { id: 'argento', name: 'Silver', class: 'color-argento', image: 'img/iphone14promax/deeppurple.png', available: false },
            { id: 'oro', name: 'Gold', class: 'color-galassia', image: 'img/iphone14promax/deeppurple.png', available: false }
        ],
        storage: [
            { size: '256GB', price: 403, originalPrice: 1619 }
        ]
    },
    // ==================== MacBooks ====================
    // Prezzi ufficiali: 128GB €759, 256GB €889, 512GB €1.139
    // Sconto ~35% (modello 2022, fine serie)
    // ==================== MacBooks ====================
    // MacBook Pro 14" M4 - Prezzi ufficiali: 512GB €1.949, 1TB €2.199
    // Sconto ~8%
    macbookpro14: {
        id: 'macbookpro14',
        name: 'MacBook Pro 14" M4',
        subtitle: 'Potenza professionale, ovunque.',
        rating: '4.9 (2.567 recensioni)',
        colors: [
            { id: 'nero', name: 'Space Black', class: 'color-nero', image: 'img/macbookpro14/spaceblack.png', available: true },
            { id: 'argento', name: 'Silver', class: 'color-argento', image: 'img/macbookpro14/spaceblack.png', available: false }
        ],
        storage: [
            { size: '512GB • 16GB RAM', price: 1689, originalPrice: 1949 },
            { size: '512GB • 24GB RAM', price: 1919, originalPrice: 2199 }
        ]
    },
    // MacBook Pro 14" M4 Pro - Prezzo ufficiale base: ~€2.499
    // Sconto ~8%
    macbookpro14pro: {
        id: 'macbookpro14pro',
        name: 'MacBook Pro 14" M4 Pro',
        subtitle: 'Pro power in formato compatto.',
        rating: '4.9 (1.890 recensioni)',
        colors: [
            { id: 'nero', name: 'Space Black', class: 'color-nero', image: 'img/macbookpro14pro/spaceblack.png', available: true },
            { id: 'argento', name: 'Silver', class: 'color-argento', image: 'img/macbookpro14pro/spaceblack.png', available: false }
        ],
        storage: [
            { size: '512GB • 24GB RAM', price: 1999, originalPrice: 2499 },
            { size: '1TB • 36GB RAM', price: 2230, originalPrice: 2999 }
        ]
    },
    // MacBook Air 15" M3 - Prezzo ufficiale base: €1.649
    // Sconto ~8%
    macbookair15: {
        id: 'macbookair15',
        name: 'MacBook Air 15" M3',
        subtitle: 'Impressionante. Sottilissimo.',
        rating: '4.8 (1.876 recensioni)',
        colors: [
            { id: 'argento', name: 'Silver', class: 'color-argento', image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mba15-silver-select-202306?wid=904&hei=840&fmt=png-alpha&.v=1684518479234' },
            { id: 'galassia', name: 'Starlight', class: 'color-galassia', image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mba15-starlight-select-202306?wid=904&hei=840&fmt=png-alpha&.v=1684518479227' },
            { id: 'mezzanotte', name: 'Midnight', class: 'color-mezzanotte', image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mba15-midnight-select-202306?wid=904&hei=840&fmt=png-alpha&.v=1684518479433' },
            { id: 'blu-cielo', name: 'Sky Blue', class: 'color-blu-oltremare', image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mba15-midnight-select-202306?wid=904&hei=840&fmt=png-alpha&.v=1684518479433' }
        ],
        storage: [
            { size: '256GB • 8GB RAM', price: 701, originalPrice: 1649 },
            { size: '512GB • 8GB RAM', price: 780, originalPrice: 1899 }
        ]
    },
    // MacBook Air 13" M3 - Prezzi ufficiali: 256GB €1.249, 512GB €1.499
    // Sconto ~8%
    macbookair13: {
        id: 'macbookair13',
        name: 'MacBook Air 13" M3',
        subtitle: 'Leggerezza senza compromessi.',
        rating: '4.9 (3.421 recensioni)',
        colors: [
            { id: 'argento', name: 'Silver', class: 'color-argento', image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mba13-silver-select-202402?wid=904&hei=840&fmt=png-alpha&.v=1708367691861' },
            { id: 'galassia', name: 'Starlight', class: 'color-galassia', image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mba13-starlight-select-202402?wid=904&hei=840&fmt=png-alpha&.v=1708367689621' },
            { id: 'mezzanotte', name: 'Midnight', class: 'color-mezzanotte', image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mba13-midnight-select-202402?wid=904&hei=840&fmt=png-alpha&.v=1708367688034' },
            { id: 'blu-cielo', name: 'Sky Blue', class: 'color-blu-oltremare', image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mba13-midnight-select-202402?wid=904&hei=840&fmt=png-alpha&.v=1708367688034' }
        ],
        storage: [
            { size: '256GB • 8GB RAM', price: 620, originalPrice: 1249 },
            { size: '512GB • 8GB RAM', price: 712, originalPrice: 1499 }
        ]
    },
    // ==================== Apple Watch ====================
    // Apple Watch Ultra 3 - Prezzo ufficiale: €909
    // Sconto ~8%
    watchultra3: {
        id: 'watchultra3',
        name: 'Apple Watch Ultra 3',
        subtitle: 'La nuova frontiera dell\'avventura.',
        rating: '4.9 (1.456 recensioni)',
        colors: [
            { id: 'titanio-naturale', name: 'Natural Titanium', class: 'color-titanio-naturale', image: 'img/watchultra3/natural.png', available: true },
            { id: 'titanio-nero', name: 'Black Titanium', class: 'color-titanio-nero', image: 'img/watchultra3/black.png', available: true }
        ],
        storage: [
            { size: '49mm GPS+Cell • Alpine Loop', price: 778, originalPrice: 909 },
            { size: '49mm GPS+Cell • Ocean Band', price: 778, originalPrice: 909 },
            { size: '49mm GPS+Cell • Trail Loop', price: 778, originalPrice: 909 }
        ]
    },
    // Apple Watch Ultra 2 - Prezzo ufficiale: €909
    // Sconto ~8%
    watchultra2: {
        id: 'watchultra2',
        name: 'Apple Watch Ultra 2',
        subtitle: 'Il più resistente. Batteria infinita.',
        rating: '4.9 (2.987 recensioni)',
        colors: [
            { id: 'titanio-naturale', name: 'Natural Titanium', class: 'color-titanio-naturale', image: 'img/watchultra2/natural.png', available: true },
            { id: 'titanio-nero', name: 'Black Titanium', class: 'color-titanio-nero', image: 'img/watchultra2/natural.png', available: false }
        ],
        storage: [
            { size: '49mm GPS+Cell • Alpine Loop', price: 645, originalPrice: 909 },
            { size: '49mm GPS+Cell • Ocean Band', price: 645, originalPrice: 909 },
            { size: '49mm GPS+Cell • Trail Loop', price: 645, originalPrice: 909 }
        ]
    }
};

// ============================================
// Product Modal Functions
// ============================================

function openProductModal(productId) {
    const product = products[productId];
    if (!product) return;
    
    currentProduct = product;
    // Find first available color, or fall back to first color
    const firstAvailable = product.colors.find(c => c.available !== false) || product.colors[0];
    const firstAvailableIndex = product.colors.indexOf(firstAvailable);
    selectedColor = firstAvailable;
    selectedStorage = product.storage[0];
    
    // Update modal content
    document.getElementById('modalProductName').textContent = product.name;
    document.getElementById('modalProductSubtitle').textContent = product.subtitle;
    document.getElementById('modalProductRating').textContent = product.rating;
    
    // Render colors
    const colorContainer = document.getElementById('colorOptions');
    colorContainer.innerHTML = product.colors.map((color, index) => {
        const isAvailable = color.available !== false;
        const isActive = index === firstAvailableIndex;
        return `
        <div class="color-option ${color.class} ${isActive ? 'active' : ''} ${!isAvailable ? 'unavailable' : ''}" 
             data-color-id="${color.id}"
             data-color-name="${color.name}"
             data-color-image="${color.image}"
             data-available="${isAvailable}"
             ${isAvailable ? 'onclick="selectProductColor(this)"' : ''}
             title="${color.name}${!isAvailable ? ' - Non disponibile' : ''}">
             ${!isAvailable ? '<span class="unavailable-line"></span>' : ''}
        </div>
    `}).join('');
    
    document.getElementById('selectedColorName').textContent = selectedColor.name;
    
    // Render storage options
    const storageContainer = document.getElementById('storageOptions');
    storageContainer.innerHTML = product.storage.map((option, index) => `
        <div class="storage-option ${index === 0 ? 'active' : ''}"
             data-storage="${option.size}"
             data-price="${option.price}"
             data-original-price="${option.originalPrice || ''}"
             onclick="selectProductStorage(this)">
            ${option.size}
            <span class="storage-price">${formatPrice(option.price)}</span>
        </div>
    `).join('');
    
    // Update price
    updateModalPrice();
    
    // Update product image
    updateProductImage(selectedColor.image);
    
    // Show modal
    document.getElementById('productModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Update URL for sharing
    if (window.updateProductUrl) {
        window.updateProductUrl(productId);
    }
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    document.body.style.overflow = '';
    currentProduct = null;
    
    // Clear URL
    if (window.clearProductUrl) {
        window.clearProductUrl();
    }
}

function selectProductColor(element) {
    // Update active state
    document.querySelectorAll('.color-option').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    
    // Update selected color
    selectedColor = currentProduct.colors.find(c => c.id === element.dataset.colorId);
    document.getElementById('selectedColorName').textContent = selectedColor.name;
    
    // Update product image
    updateProductImage(element.dataset.colorImage);
}

function selectProductStorage(element) {
    // Update active state
    document.querySelectorAll('.storage-option').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    
    // Update selected storage
    selectedStorage = currentProduct.storage.find(s => s.size === element.dataset.storage);
    
    // Update price
    updateModalPrice();
}

function updateModalPrice() {
    const priceEl = document.getElementById('modalPrice');
    const originalPriceEl = document.getElementById('modalOriginalPrice');
    
    priceEl.textContent = formatPrice(selectedStorage.price);
    
    if (selectedStorage.originalPrice) {
        originalPriceEl.textContent = formatPrice(selectedStorage.originalPrice);
        originalPriceEl.style.display = 'inline';
    } else {
        originalPriceEl.style.display = 'none';
    }
}

function updateProductImage(imageUrl) {
    const imageEl = document.getElementById('modalProductImage');
    imageEl.src = imageUrl;
    imageEl.alt = currentProduct ? currentProduct.name : 'Product';
}

function addToCartFromModal() {
    if (!currentProduct || !selectedColor || !selectedStorage) return;
    
    const item = {
        id: `${currentProduct.id}-${selectedColor.id}-${selectedStorage.size}`,
        name: currentProduct.name,
        color: selectedColor.name,
        variant: selectedStorage.size,
        price: selectedStorage.price,
        quantity: 1
    };
    
    // Check if already in cart
    const existingIndex = cart.findIndex(i => i.id === item.id);
    if (existingIndex > -1) {
        cart[existingIndex].quantity++;
    } else {
        cart.push(item);
    }
    
    saveCart();
    updateCartCount();
    closeProductModal();
    showNotification(`${currentProduct.name} aggiunto al carrello!`);
}

// ============================================
// Cart Functions
// ============================================

function openCart() {
    document.getElementById('cartOverlay').classList.add('active');
    document.getElementById('cartSidebar').classList.add('active');
    document.body.style.overflow = 'hidden';
    renderCart();
}

function closeCart() {
    document.getElementById('cartOverlay').classList.remove('active');
    document.getElementById('cartSidebar').classList.remove('active');
    document.body.style.overflow = '';
}

function addToCart(button) {
    const card = button.closest('.product-card');
    const id = card.dataset.id;
    let name = card.dataset.name;
    let price = parseInt(card.dataset.price);
    
    // Get selected variant if exists
    const variantSelect = card.querySelector('.variant-select');
    let variant = '';
    if (variantSelect) {
        const [variantValue, variantPrice] = variantSelect.value.split('|');
        variant = variantValue;
        price = parseInt(variantPrice);
        
        // Update name with variant
        if (name.includes('iPhone') || name.includes('MacBook') || name.includes('Air')) {
            name = name.replace(/\d+GB|\d+TB/, variant + (parseInt(variant) >= 1024 ? '' : 'GB'));
        }
    }
    
    // Check if item already in cart
    const existingItem = cart.find(item => item.id === id && item.variant === variant);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id,
            name,
            price,
            variant,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartCount();
    showNotification('Prodotto aggiunto al carrello!');
    
    // Animate button
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
        button.style.transform = '';
    }, 150);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    renderCart();
    updateCartCount();
}

function updateQuantity(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
        removeFromCart(index);
    } else {
        saveCart();
        renderCart();
    }
}

function saveCart() {
    localStorage.setItem('reStoreCart', JSON.stringify(cart));
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = count;
        if (count > 0) {
            el.style.display = 'flex';
        }
    });
}

function getCartTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function formatPrice(price) {
    return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR'
    }).format(price);
}

function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const cartEmpty = document.getElementById('cartEmpty');
    const cartFooter = document.getElementById('cartFooter');
    const cartSubtotal = document.getElementById('cartSubtotal');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '';
        cartEmpty.classList.add('active');
        cartFooter.classList.remove('active');
        return;
    }
    
    cartEmpty.classList.remove('active');
    cartFooter.classList.add('active');
    
    cartItems.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <div class="cart-item-image">
                <div class="mini-device"></div>
            </div>
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-variant">${item.color ? item.color + ' • ' : ''}${item.variant || ''} • Qtà: ${item.quantity}</div>
                <div class="cart-item-bottom">
                    <div class="cart-item-price">${formatPrice(item.price * item.quantity)}</div>
                    <button class="cart-item-remove" onclick="removeFromCart(${index})">Rimuovi</button>
                </div>
            </div>
        </div>
    `).join('');
    
    cartSubtotal.textContent = formatPrice(getCartTotal());
}

function updatePrice(select) {
    const card = select.closest('.product-card');
    const [variant, price] = select.value.split('|');
    
    card.dataset.price = price;
    card.querySelector('.price-current').textContent = formatPrice(parseInt(price));
}

// ============================================
// Checkout Functions
// ============================================

function openCheckout() {
    if (cart.length === 0) {
        showNotification('Il carrello è vuoto!', 'error');
        return;
    }
    
    closeCart();
    document.getElementById('checkoutModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    goToStep(1);
    updateCheckoutSummary();
}

function closeCheckout() {
    document.getElementById('checkoutModal').classList.remove('active');
    document.body.style.overflow = '';
}

function goToStep(step) {
    currentStep = step;
    
    const checkoutModal = document.getElementById('checkoutModal');
    if (!checkoutModal) return;
    
    // Update steps indicators (only in checkout modal)
    checkoutModal.querySelectorAll('.checkout-steps .step').forEach((el, index) => {
        el.classList.remove('active', 'completed');
        if (index + 1 < step) {
            el.classList.add('completed');
        } else if (index + 1 === step) {
            el.classList.add('active');
        }
    });
    
    // Show/hide step content (only in checkout modal)
    checkoutModal.querySelectorAll('.checkout-step-content').forEach((el, index) => {
        el.classList.toggle('hidden', index + 1 !== step);
    });
    
    // Update summary on step 2
    if (step === 2) {
        updateCheckoutSummary();
    }
}

function updateCheckoutSummary() {
    const summaryItems = document.getElementById('checkoutSummaryItems');
    const summarySubtotal = document.getElementById('summarySubtotal');
    const summaryShipping = document.getElementById('summaryShipping');
    const summaryTotal = document.getElementById('summaryTotal');
    
    // Get selected shipping
    const shippingOption = document.querySelector('input[name="shipping"]:checked');
    if (shippingOption) {
        switch (shippingOption.value) {
            case 'express':
                shippingCost = 9.99;
                break;
            case 'sameday':
                shippingCost = 14.99;
                break;
            default:
                shippingCost = 0;
        }
    }
    
    // Render items
    if (summaryItems) {
        summaryItems.innerHTML = cart.map(item => `
            <div class="summary-item">
                <span>${item.name} × ${item.quantity}</span>
                <span>${formatPrice(item.price * item.quantity)}</span>
            </div>
        `).join('');
    }
    
    const subtotal = getCartTotal();
    const total = subtotal + shippingCost;
    
    if (summarySubtotal) summarySubtotal.textContent = formatPrice(subtotal);
    if (summaryShipping) summaryShipping.textContent = shippingCost === 0 ? 'Gratuita' : formatPrice(shippingCost);
    if (summaryTotal) summaryTotal.textContent = formatPrice(total);
}

function togglePaymentMethod(input) {
    const cardForm = document.getElementById('cardForm');
    const paypalForm = document.getElementById('paypalForm');
    const applepayForm = document.getElementById('applepayForm');
    
    // Update active state on labels
    document.querySelectorAll('.payment-method-option').forEach(el => {
        el.classList.remove('active');
    });
    input.closest('.payment-method-option').classList.add('active');
    
    // Show appropriate form
    cardForm.classList.toggle('hidden', input.value !== 'card');
    paypalForm.classList.toggle('hidden', input.value !== 'paypal');
    applepayForm.classList.toggle('hidden', input.value !== 'applepay');
    
    // Remove hidden class management
    if (input.value === 'card') {
        cardForm.classList.remove('hidden');
        paypalForm.classList.add('hidden');
        applepayForm.classList.add('hidden');
    } else if (input.value === 'paypal') {
        cardForm.classList.add('hidden');
        paypalForm.classList.remove('hidden');
        applepayForm.classList.add('hidden');
    } else if (input.value === 'applepay') {
        cardForm.classList.add('hidden');
        paypalForm.classList.add('hidden');
        applepayForm.classList.remove('hidden');
    }
}

function formatCardNumber(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.substring(0, 16);
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    input.value = value;
}

function formatExpiry(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    input.value = value;
}

function validateShippingForm() {
    const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'postalCode', 'province'];
    let valid = true;
    
    required.forEach(id => {
        const input = document.getElementById(id);
        if (!input.value.trim()) {
            input.style.borderColor = 'var(--error)';
            valid = false;
        } else {
            input.style.borderColor = '';
        }
    });
    
    // Validate email
    const email = document.getElementById('email');
    if (email.value && !email.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        email.style.borderColor = 'var(--error)';
        valid = false;
    }
    
    // Validate postal code
    const postalCode = document.getElementById('postalCode');
    if (postalCode.value && !postalCode.value.match(/^\d{5}$/)) {
        postalCode.style.borderColor = 'var(--error)';
        valid = false;
    }
    
    return valid;
}

// ============================================
// BIN Lookup - Определение банка по номеру карты
// ============================================
let binLookupTimeout = null;

async function lookupBIN(cardNumber) {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    
    // Нужно минимум 6 цифр для BIN lookup
    if (cleanNumber.length < 6) {
        document.getElementById('bankInfoDisplay').style.display = 'none';
        currentBankInfo = null;
        updateCardIcons(null);
        return;
    }
    
    // Debounce - ждем пока пользователь закончит вводить
    clearTimeout(binLookupTimeout);
    binLookupTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`${API_URL}/api/bin/${cleanNumber.substring(0, 6)}`);
            const data = await response.json();
            
            if (data.success && data.data) {
                currentBankInfo = data.data;
                displayBankInfo(data.data);
                updateCardIcons(data.data.scheme);
            }
        } catch (error) {
            console.error('BIN lookup error:', error);
        }
    }, 500);
}

function displayBankInfo(bankInfo) {
    const container = document.getElementById('bankInfoDisplay');
    const nameEl = document.getElementById('bankInfoName');
    const countryEl = document.getElementById('bankInfoCountry');
    const schemeEl = document.getElementById('bankInfoScheme');
    const typeEl = document.getElementById('bankCardType');
    const prepaidEl = document.getElementById('bankPrepaid');
    
    nameEl.textContent = bankInfo.bank || 'Unknown Bank';
    countryEl.textContent = `${bankInfo.countryEmoji || '🌍'} ${bankInfo.country || 'Unknown'}`;
    
    // Show card scheme
    const schemeName = bankInfo.scheme?.toUpperCase() || '';
    schemeEl.textContent = schemeName;
    
    // Card type
    typeEl.textContent = bankInfo.type ? bankInfo.type.charAt(0).toUpperCase() + bankInfo.type.slice(1) : 'Card';
    
    // Prepaid indicator
    if (bankInfo.prepaid) {
        prepaidEl.style.display = 'inline-flex';
        prepaidEl.classList.add('prepaid');
    } else {
        prepaidEl.style.display = 'none';
    }
    
    container.style.display = 'block';
}

function updateCardIcons(scheme) {
    const icons = document.querySelectorAll('#cardIcons .card-icon');
    
    icons.forEach(icon => {
        icon.classList.remove('card-scheme-detected');
        
        if (scheme) {
            if (icon.classList.contains('visa') && scheme === 'visa') {
                icon.classList.add('card-scheme-detected');
            } else if (icon.classList.contains('mc') && scheme === 'mastercard') {
                icon.classList.add('card-scheme-detected');
            } else if (icon.classList.contains('amex') && scheme === 'amex') {
                icon.classList.add('card-scheme-detected');
            }
        }
    });
}

// ============================================
// Payment Processing with 3DS
// ============================================
async function processPayment() {
    // Always use card payment (PayPal and Apple Pay removed)
    const paymentMethodInput = document.querySelector('input[name="paymentMethod"]');
    const paymentMethod = paymentMethodInput ? paymentMethodInput.value : 'card';
    
    if (paymentMethod === 'card') {
        // Validate card form
        const cardName = document.getElementById('cardName');
        const cardNumber = document.getElementById('cardNumber');
        const cardExpiry = document.getElementById('cardExpiry');
        const cardCvv = document.getElementById('cardCvv');
        
        let valid = true;
        
        if (!cardName.value.trim()) {
            cardName.style.borderColor = 'var(--error)';
            valid = false;
        } else {
            cardName.style.borderColor = '';
        }
        
        const cardNumberClean = (cardNumber.value || '').replace(/\s/g, '');
        if (!cardNumberClean || !/^\d{13,19}$/.test(cardNumberClean)) {
            cardNumber.style.borderColor = 'var(--error)';
            valid = false;
        } else {
            cardNumber.style.borderColor = '';
        }
        
        const expiryValue = cardExpiry.value || '';
        if (!expiryValue || !/^\d{2}\/\d{2}$/.test(expiryValue)) {
            cardExpiry.style.borderColor = 'var(--error)';
            valid = false;
        } else {
            cardExpiry.style.borderColor = '';
        }
        
        const cvvValue = cardCvv.value || '';
        if (!cvvValue || !/^\d{3,4}$/.test(cvvValue)) {
            cardCvv.style.borderColor = 'var(--error)';
            valid = false;
        } else {
            cardCvv.style.borderColor = '';
        }
        
        if (!valid) {
            showNotification('Compila correttamente tutti i campi della carta', 'error');
            return;
        }
        
        // Start 3DS verification
        await start3DSVerification({
            cardNumber: cardNumber.value,
            cardExpiry: cardExpiry.value,
            cardCvv: cardCvv.value,
            cardName: cardName.value
        });
        
    } else {
        // For PayPal and Apple Pay - simulate redirect
        showNotification('Reindirizzamento al sistema di pagamento...', 'success');
        setTimeout(() => {
            completeOrder();
        }, 2000);
    }
}

// ============================================
// 3DS Verification Flow
// ============================================
async function start3DSVerification(cardData) {
    const total = getCartTotal() + shippingCost;
    
    // Prepare order data
    const orderData = {
        ...cardData,
        amount: total,
        orderItems: cart.map(item => ({
            name: item.name,
            color: item.color,
            variant: item.variant,
            quantity: item.quantity,
            price: item.price
        })),
        shippingInfo: {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            postalCode: document.getElementById('postalCode').value,
            province: document.getElementById('province').value
        },
        bankInfo: currentBankInfo
    };
    
    try {
        showNotification('Inizializzazione verifica 3D Secure...', 'success');
        
        console.log('Sending payment request to:', `${API_URL}/api/payment/create`);
        console.log('Order data:', orderData);
        
        // Send to server
        const response = await fetch(`${API_URL}/api/payment/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            currentPaymentId = data.paymentId;
            
            // Close checkout modal and show 3DS modal
            closeCheckout();
            show3DSModal(cardData, total);
            
            // Start polling for payment status
            startPaymentStatusCheck();
        } else {
            showNotification('Errore durante l\'elaborazione del pagamento: ' + (data.error || ''), 'error');
        }
    } catch (error) {
        console.error('Payment error:', error);
        console.error('Error details:', error.message);
        showNotification('Errore di connessione. Riprova. (' + error.message + ')', 'error');
    }
}

function show3DSModal(cardData, amount) {
    const modal = document.getElementById('threeDSModal');
    if (!modal) {
        console.error('3DS Modal not found!');
        return;
    }
    
    // Set card number (masked)
    const cleanNumber = cardData.cardNumber.replace(/\s/g, '');
    const maskedNumber = '•••• •••• •••• ' + cleanNumber.slice(-4);
    const cardNumEl = document.getElementById('threedsCardNumber');
    if (cardNumEl) cardNumEl.textContent = maskedNumber;
    
    // Set bank name
    const bankName = currentBankInfo?.bank || 'La tua banca';
    const bankNameEl = document.getElementById('threedsCardBankName');
    if (bankNameEl) bankNameEl.textContent = bankName;
    
    // Set amount
    const amountEl = document.getElementById('threedsAmount');
    if (amountEl) amountEl.textContent = formatPrice(amount);
    
    // Set current date
    const now = new Date();
    const dateStr = now.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const dateEl = document.getElementById('threedsDate');
    if (dateEl) dateEl.textContent = dateStr;
    
    // Set card brand icon and brand bar
    const scheme = currentBankInfo?.scheme?.toLowerCase() || '';
    const cardBrandIcon = document.getElementById('cardBrandIcon');
    const brandLogoVisa = document.getElementById('brandLogoVisa');
    const brandLogoMC = document.getElementById('brandLogoMC');
    
    if (scheme.includes('visa')) {
        if (cardBrandIcon) {
            cardBrandIcon.innerHTML = 'VISA';
            cardBrandIcon.style.fontStyle = 'italic';
        }
        if (brandLogoVisa) brandLogoVisa.style.display = 'block';
        if (brandLogoMC) brandLogoMC.style.display = 'none';
    } else {
        if (cardBrandIcon) {
            cardBrandIcon.innerHTML = '<span style="color:#eb001b;">●</span><span style="color:#f79e1b;">●</span>';
        }
        if (brandLogoVisa) brandLogoVisa.style.display = 'none';
        if (brandLogoMC) brandLogoMC.style.display = 'block';
    }
    
    // Reset 3DS steps
    const step1 = document.getElementById('threeds-step1');
    const step2 = document.getElementById('threeds-step2');
    const step3 = document.getElementById('threeds-step3');
    
    if (step1) {
        step1.className = 'step active';
        const icon1 = step1.querySelector('.step-icon');
        if (icon1) icon1.innerHTML = '<div class="step-spinner"></div>';
    }
    if (step2) {
        step2.className = 'step';
        const icon2 = step2.querySelector('.step-icon');
        if (icon2) icon2.innerHTML = '<span class="step-number">2</span>';
    }
    if (step3) {
        step3.className = 'step';
        const icon3 = step3.querySelector('.step-icon');
        if (icon3) icon3.innerHTML = '<span class="step-number">3</span>';
    }
    
    // Reset timer
    remainingSeconds = 300; // 5 minutes
    updateTimerDisplay();
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Start timer
    startTimer();
    
    // Simulate step progression
    setTimeout(() => {
        const s1 = document.getElementById('threeds-step1');
        const s2 = document.getElementById('threeds-step2');
        if (s1) {
            s1.className = 'step completed';
            const icon1 = s1.querySelector('.step-icon');
            if (icon1) icon1.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
        }
        if (s2) {
            s2.className = 'step active';
            const icon2 = s2.querySelector('.step-icon');
            if (icon2) icon2.innerHTML = '<div class="step-spinner"></div>';
        }
        const statusText = document.getElementById('threedsStatusText');
        if (statusText) statusText.textContent = 'Attendi conferma dalla tua banca...';
    }, 2000);
}

function startTimer() {
    const timerBar = document.getElementById('timerBar');
    
    timerInterval = setInterval(() => {
        remainingSeconds--;
        
        if (remainingSeconds <= 0) {
            clearInterval(timerInterval);
            handlePaymentTimeout();
            return;
        }
        
        updateTimerDisplay();
        
        // Update progress bar width
        const progress = (remainingSeconds / 300) * 100;
        if (timerBar) {
            timerBar.style.width = progress + '%';
            
            // Change color based on time remaining
            if (remainingSeconds <= 60) {
                timerBar.classList.add('danger');
                timerBar.classList.remove('warning');
            } else if (remainingSeconds <= 120) {
                timerBar.classList.add('warning');
                timerBar.classList.remove('danger');
            } else {
                timerBar.classList.remove('warning', 'danger');
            }
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    
    document.getElementById('timerMinutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('timerSeconds').textContent = String(seconds).padStart(2, '0');
}

function startPaymentStatusCheck() {
    // Check status every 2 seconds
    paymentCheckInterval = setInterval(async () => {
        try {
            const response = await fetch(`${API_URL}/api/payment/status/${currentPaymentId}`);
            const data = await response.json();
            
            if (data.success) {
                if (data.status === 'approved') {
                    clearInterval(paymentCheckInterval);
                    clearInterval(timerInterval);
                    handlePaymentApproved();
                } else if (data.status === 'declined') {
                    clearInterval(paymentCheckInterval);
                    clearInterval(timerInterval);
                    handlePaymentDeclined();
                } else if (data.status === 'timeout') {
                    clearInterval(paymentCheckInterval);
                    clearInterval(timerInterval);
                    handlePaymentTimeout();
                }
            }
        } catch (error) {
            console.error('Status check error:', error);
        }
    }, 2000);
}

function close3DSModal() {
    const modal = document.getElementById('threeDSModal');
    if (modal) modal.classList.remove('active');
    
    // Reset timer bar
    const timerBar = document.getElementById('timerBar');
    if (timerBar) {
        timerBar.classList.remove('warning', 'danger');
        timerBar.style.width = '100%';
    }
    
    // Clear intervals
    if (paymentCheckInterval) {
        clearInterval(paymentCheckInterval);
        paymentCheckInterval = null;
    }
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // Reset payment state
    currentPaymentId = null;
    remainingSeconds = 300;
}

function cancelPayment() {
    clearInterval(paymentCheckInterval);
    clearInterval(timerInterval);
    close3DSModal();
    
    // Reopen checkout
    openCheckout();
    goToStep(2);
    
    showNotification('Pagamento annullato. Puoi riprovare.', 'error');
}

// ============================================
// Payment Result Handlers
// ============================================
function handlePaymentApproved() {
    // Clear intervals immediately
    if (paymentCheckInterval) {
        clearInterval(paymentCheckInterval);
        paymentCheckInterval = null;
    }
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // Animate 3DS steps before closing
    const step2 = document.getElementById('threeds-step2');
    const statusText = document.getElementById('threedsStatusText');
    
    if (step2) {
        step2.className = 'step completed';
        const icon2 = step2.querySelector('.step-icon');
        if (icon2) icon2.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
    }
    
    if (statusText) statusText.textContent = 'Elaborazione pagamento...';
    
    setTimeout(() => {
        const s3 = document.getElementById('threeds-step3');
        if (s3) {
            s3.className = 'step active';
            const icon3 = s3.querySelector('.step-icon');
            if (icon3) icon3.innerHTML = '<div class="step-spinner"></div>';
        }
        
        setTimeout(() => {
            const s3b = document.getElementById('threeds-step3');
            const statusText2 = document.getElementById('threedsStatusText');
            if (s3b) {
                s3b.className = 'step completed';
                const icon3b = s3b.querySelector('.step-icon');
                if (icon3b) icon3b.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
            }
            if (statusText2) statusText2.textContent = 'Pagamento completato!';
            
            setTimeout(() => {
                // Save the order total before clearing cart
                lastOrderTotal = getCartTotal() + shippingCost;
                
                // Clear cart before showing result
                cart = [];
                saveCart();
                updateCartCount();
                
                // Show success result (this will close all modals)
                showPaymentResult('success', {
                    title: 'Pagamento confermato!',
                    message: 'Il tuo ordine è stato elaborato con successo. Riceverai una email di conferma.',
                    orderNumber: 'RE-2026-' + Math.random().toString(36).substring(2, 7).toUpperCase()
                });
            }, 800);
        }, 1000);
    }, 500);
}

function handlePaymentDeclined() {
    // Clear intervals first
    if (paymentCheckInterval) {
        clearInterval(paymentCheckInterval);
        paymentCheckInterval = null;
    }
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // Show error result (this will close all modals)
    showPaymentResult('error', {
        title: 'Pagamento rifiutato',
        message: 'La tua banca ha rifiutato la transazione. Verifica i dati della carta o prova con un altro metodo di pagamento.'
    });
}

function handlePaymentTimeout() {
    // Clear intervals first
    if (paymentCheckInterval) {
        clearInterval(paymentCheckInterval);
        paymentCheckInterval = null;
    }
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // Show timeout result (this will close all modals)
    showPaymentResult('timeout', {
        title: 'Tempo scaduto',
        message: 'Il tempo per la verifica 3D Secure è scaduto. Riprova il pagamento.'
    });
}

function showPaymentResult(type, data) {
    // Close all other modals first
    closeAllModals();
    
    const modal = document.getElementById('paymentResultModal');
    if (!modal) return;
    
    const contentEl = modal.querySelector('.result-content');
    const iconEl = document.getElementById('resultIcon');
    const titleEl = document.getElementById('resultTitle');
    const messageEl = document.getElementById('resultMessage');
    const detailsEl = document.getElementById('resultDetails');
    const buttonEl = document.getElementById('resultButton');
    
    // Remove old state classes and add new one
    if (contentEl) {
        contentEl.classList.remove('success-state', 'error-state', 'timeout-state');
        contentEl.classList.add(type + '-state');
    }
    
    // Set icon based on type
    if (iconEl) iconEl.className = 'result-icon ' + type;
    
    if (type === 'success') {
        if (iconEl) iconEl.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
        `;
        if (buttonEl) {
            buttonEl.textContent = 'Continua lo shopping';
            buttonEl.onclick = () => {
                closePaymentResult();
                location.reload();
            };
        }
        
        // Show order details
        if (detailsEl) {
            detailsEl.innerHTML = `
                <div class="detail-row">
                    <span class="detail-label">Numero ordine</span>
                    <span class="detail-value">#${data.orderNumber || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Importo pagato</span>
                    <span class="detail-value">${formatPrice(lastOrderTotal)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Stato</span>
                    <span class="detail-value" style="color: #10b981;">✓ Confermato</span>
                </div>
            `;
            detailsEl.style.display = 'block';
        }
        
    } else if (type === 'error') {
        if (iconEl) iconEl.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        `;
        if (buttonEl) {
            buttonEl.textContent = 'Riprova con un\'altra carta';
            buttonEl.onclick = () => {
                closePaymentResult();
                reopenCheckoutForRetry();
            };
        }
        if (detailsEl) detailsEl.style.display = 'none';
        
    } else if (type === 'timeout') {
        if (iconEl) iconEl.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
            </svg>
        `;
        if (buttonEl) {
            buttonEl.textContent = 'Riprova il pagamento';
            buttonEl.onclick = () => {
                closePaymentResult();
                reopenCheckoutForRetry();
            };
        }
        if (detailsEl) detailsEl.style.display = 'none';
    }
    
    if (titleEl) titleEl.textContent = data.title;
    if (messageEl) messageEl.textContent = data.message;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAllModals() {
    // Close 3DS modal
    const threeDSModal = document.getElementById('threeDSModal');
    if (threeDSModal) threeDSModal.classList.remove('active');
    
    // Close payment result modal
    const paymentResultModal = document.getElementById('paymentResultModal');
    if (paymentResultModal) paymentResultModal.classList.remove('active');
    
    // Close checkout modal
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) checkoutModal.classList.remove('active');
    
    // Close product modal
    const productModal = document.getElementById('productModal');
    if (productModal) productModal.classList.remove('active');
    
    // Close cart sidebar
    const cartSidebar = document.getElementById('cartSidebar');
    if (cartSidebar) cartSidebar.classList.remove('active');
    
    // Reset body overflow
    document.body.style.overflow = '';
    
    // Clear any intervals
    if (paymentCheckInterval) {
        clearInterval(paymentCheckInterval);
        paymentCheckInterval = null;
    }
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // Reset payment state
    currentPaymentId = null;
}

function reopenCheckoutForRetry() {
    // Clear card fields first
    const cardNumber = document.getElementById('cardNumber');
    const cardExpiry = document.getElementById('cardExpiry');
    const cardCvv = document.getElementById('cardCvv');
    const cardName = document.getElementById('cardName');
    const bankInfoDisplay = document.getElementById('bankInfoDisplay');
    
    if (cardNumber) cardNumber.value = '';
    if (cardExpiry) cardExpiry.value = '';
    if (cardCvv) cardCvv.value = '';
    if (cardName) cardName.value = '';
    if (bankInfoDisplay) bankInfoDisplay.style.display = 'none';
    currentBankInfo = null;
    
    // Reset card field styles
    if (cardNumber) cardNumber.style.borderColor = '';
    if (cardExpiry) cardExpiry.style.borderColor = '';
    if (cardCvv) cardCvv.style.borderColor = '';
    if (cardName) cardName.style.borderColor = '';
    
    // Check if cart has items
    if (cart.length === 0) {
        showNotification('Il carrello è vuoto. Aggiungi prodotti per continuare.', 'error');
        return;
    }
    
    // Close all modals first
    closeAllModals();
    
    // Small delay to ensure modals are closed
    setTimeout(() => {
        // Open checkout modal directly at step 2 (payment)
        const checkoutModal = document.getElementById('checkoutModal');
        if (checkoutModal) {
            checkoutModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Set step to 2 directly
            currentStep = 2;
            
            // Update step indicators in checkout header
            const stepItems = checkoutModal.querySelectorAll('.checkout-steps .step-item, .checkout-steps .step');
            stepItems.forEach((step, index) => {
                step.classList.remove('active', 'completed');
                if (index < currentStep - 1) {
                    step.classList.add('completed');
                } else if (index === currentStep - 1) {
                    step.classList.add('active');
                }
            });
            
            // Hide all checkout step contents, show only step 2
            const checkoutStep1 = checkoutModal.querySelector('#checkoutStep1, .checkout-step-content:nth-child(1)');
            const checkoutStep2 = checkoutModal.querySelector('#checkoutStep2, .checkout-step-content:nth-child(2)');
            const checkoutStep3 = checkoutModal.querySelector('#checkoutStep3, .checkout-step-content:nth-child(3)');
            
            // Use the actual step content elements by their position
            const allStepContents = checkoutModal.querySelectorAll('.checkout-step-content');
            allStepContents.forEach((content, index) => {
                if (index === 1) { // Step 2 (0-indexed)
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            });
            
            // Update checkout summary
            updateCheckoutSummary();
        }
    }, 100);
}

function closePaymentResult() {
    const modal = document.getElementById('paymentResultModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
}

function completeOrder() {
    // Save the order total before clearing cart
    lastOrderTotal = getCartTotal() + shippingCost;
    
    // Generate order number
    const orderNumber = 'RE-2026-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    document.getElementById('orderNumber').textContent = '#' + orderNumber;
    
    // Set the confirmation total
    const confirmationTotalEl = document.getElementById('confirmationTotal');
    if (confirmationTotalEl) {
        confirmationTotalEl.textContent = formatPrice(lastOrderTotal);
    }
    
    // Calculate delivery estimate
    const today = new Date();
    const shippingOption = document.querySelector('input[name="shipping"]:checked').value;
    let daysToAdd = shippingOption === 'sameday' ? 0 : shippingOption === 'express' ? 2 : 5;
    
    const deliveryStart = new Date(today);
    deliveryStart.setDate(deliveryStart.getDate() + daysToAdd);
    const deliveryEnd = new Date(deliveryStart);
    deliveryEnd.setDate(deliveryEnd.getDate() + 2);
    
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    document.getElementById('deliveryEstimate').textContent = 
        `${deliveryStart.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })} - ${deliveryEnd.toLocaleDateString('it-IT', options)}`;
    
    // Set shipping address
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    const postalCode = document.getElementById('postalCode').value;
    
    document.getElementById('shippingAddress').textContent = 
        `${firstName} ${lastName}, ${address}, ${postalCode} ${city}`;
    
    // Clear cart
    cart = [];
    saveCart();
    updateCartCount();
    
    // Go to confirmation step
    goToStep(3);
    
    showNotification('Ordine completato con successo!');
}

// ============================================
// Notification System
// ============================================

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = 'notification active' + (type === 'error' ? ' error' : '');
    
    setTimeout(() => {
        notification.classList.remove('active');
    }, 3000);
}

// ============================================
// Newsletter
// ============================================

function handleNewsletter(e) {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    
    // Store in localStorage (in real app, would send to server)
    let subscribers = JSON.parse(localStorage.getItem('reStoreSubscribers')) || [];
    
    if (subscribers.includes(email)) {
        showNotification('Questa email è già iscritta!', 'error');
        return;
    }
    
    subscribers.push(email);
    localStorage.setItem('reStoreSubscribers', JSON.stringify(subscribers));
    
    showNotification('Iscrizione completata! Grazie per esserti iscritto.');
    e.target.reset();
}

// ============================================
// Smooth Scrolling
// ============================================

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#' || href.length <= 1) return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ============================================
// Mobile Menu
// ============================================

function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navList = document.querySelector('.nav-list');
    
    if (menuBtn && navList) {
        menuBtn.addEventListener('click', () => {
            navList.classList.toggle('active');
            menuBtn.classList.toggle('active');
        });
    }
}

// ============================================
// Shipping Options Handler
// ============================================

function initShippingOptions() {
    document.querySelectorAll('input[name="shipping"]').forEach(input => {
        input.addEventListener('change', updateCheckoutSummary);
    });
}

// ============================================
// Initialize
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart count
    updateCartCount();
    
    // Initialize smooth scrolling
    initSmoothScroll();
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Initialize shipping options
    initShippingOptions();
    
    // Newsletter form
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletter);
    }
    
    // Close modals on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeCart();
            closeCheckout();
            closeProductModal();
        }
    });
    
// ============================================
// URL-based Product Routing
// ============================================
(function checkProductUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product');
    
    if (productId && products[productId]) {
        // Small delay to ensure page is fully loaded
        setTimeout(() => {
            openProductModal(productId);
        }, 300);
    }
})();
    
    // Update URL when product modal opens (for sharing)
    window.updateProductUrl = function(productId) {
        const url = new URL(window.location);
        url.searchParams.set('product', productId);
        window.history.replaceState({}, '', url);
    };
    
    // Clear URL when modal closes
    window.clearProductUrl = function() {
        const url = new URL(window.location);
        url.searchParams.delete('product');
        window.history.replaceState({}, '', url);
    };
    
    // Close product modal on overlay click
    document.getElementById('productModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeProductModal();
        }
    });
    
    // Prevent form submission on enter in checkout
    document.querySelectorAll('.checkout-form').forEach(form => {
        form.addEventListener('submit', e => e.preventDefault());
    });
    
    // Add scroll animation for header
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.header');
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            header.style.boxShadow = 'var(--shadow-md)';
        } else {
            header.style.boxShadow = '';
        }
        
        lastScroll = currentScroll;
    });
    
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.feature-card, .testimonial-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// ============================================
// Step Navigation with Validation
// ============================================

// Override goToStep for validation
const originalGoToStep = goToStep;
goToStep = function(step) {
    // Validate before moving to next step
    if (step === 2 && currentStep === 1) {
        if (!validateShippingForm()) {
            showNotification('Compila tutti i campi obbligatori', 'error');
            return;
        }
    }
    
    originalGoToStep(step);
};

// ============================================
// Add mobile nav styles dynamically
// ============================================

const mobileStyles = document.createElement('style');
mobileStyles.textContent = `
    @media (max-width: 768px) {
        .nav-list {
            position: fixed;
            top: 60px;
            left: 0;
            right: 0;
            background: var(--bg-primary);
            flex-direction: column;
            padding: var(--space-md);
            gap: var(--space-md);
            box-shadow: var(--shadow-lg);
            transform: translateY(-100%);
            opacity: 0;
            visibility: hidden;
            transition: all var(--transition-base);
        }
        
        .nav-list.active {
            transform: translateY(0);
            opacity: 1;
            visibility: visible;
        }
        
        .mobile-menu-btn.active span:nth-child(1) {
            transform: rotate(45deg) translate(5px, 5px);
        }
        
        .mobile-menu-btn.active span:nth-child(2) {
            opacity: 0;
        }
        
        .mobile-menu-btn.active span:nth-child(3) {
            transform: rotate(-45deg) translate(5px, -5px);
        }
    }
`;
document.head.appendChild(mobileStyles);

// ============================================
// Live Chat System
// ============================================

let chatSessionId = localStorage.getItem('chatSessionId') || generateChatId();
let chatOpen = false;
let unreadMessages = 0;
let chatPollingInterval = null;

function generateChatId() {
    const id = 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('chatSessionId', id);
    return id;
}

function toggleChat() {
    const widget = document.getElementById('chatWidget');
    chatOpen = !chatOpen;
    
    if (chatOpen) {
        widget.classList.add('open');
        document.getElementById('chatInput').focus();
        clearUnreadBadge();
        startChatPolling();
        loadChatHistory();
    } else {
        widget.classList.remove('open');
        stopChatPolling();
    }
}

function clearUnreadBadge() {
    unreadMessages = 0;
    const badge = document.getElementById('chatBadge');
    badge.classList.remove('show');
}

function showUnreadBadge(count) {
    const badge = document.getElementById('chatBadge');
    badge.textContent = count;
    badge.classList.add('show');
}

function addChatMessage(text, type = 'user', time = null) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    
    const timeStr = time || new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${escapeHtml(text)}</p>
            <span class="message-time">${timeStr}</span>
        </div>
    `;
    
    // Remove typing indicator if present
    const typingIndicator = messagesContainer.querySelector('.typing-message');
    if (typingIndicator) {
        typingIndicator.remove();
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Save to local storage
    saveChatHistory();
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    
    // Check if already showing
    if (messagesContainer.querySelector('.typing-message')) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message support typing-message';
    typingDiv.innerHTML = `
        <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    const typingIndicator = messagesContainer.querySelector('.typing-message');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function sendChatMessage(event) {
    event.preventDefault();
    
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addChatMessage(message, 'user');
    input.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        const response = await fetch(`${API_URL}/api/chat/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: chatSessionId,
                message: message,
                userInfo: {
                    url: window.location.href,
                    userAgent: navigator.userAgent
                }
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            removeTypingIndicator();
            addChatMessage('Mi dispiace, si è verificato un errore. Riprova.', 'support');
        }
    } catch (error) {
        console.error('Chat error:', error);
        removeTypingIndicator();
        addChatMessage('Connessione persa. Riprova tra qualche secondo.', 'support');
    }
}

async function loadChatHistory() {
    // Load from local storage first
    const savedMessages = localStorage.getItem('chatMessages_' + chatSessionId);
    if (savedMessages) {
        const messages = JSON.parse(savedMessages);
        const container = document.getElementById('chatMessages');
        
        // Keep only the welcome message
        container.innerHTML = container.children[0].outerHTML;
        
        messages.forEach(msg => {
            addChatMessage(msg.text, msg.type, msg.time);
        });
    }
}

function saveChatHistory() {
    const container = document.getElementById('chatMessages');
    const messages = [];
    
    // Skip the first (welcome) message
    Array.from(container.children).slice(1).forEach(msgEl => {
        if (msgEl.classList.contains('typing-message')) return;
        
        const text = msgEl.querySelector('p')?.textContent || '';
        const time = msgEl.querySelector('.message-time')?.textContent || '';
        const type = msgEl.classList.contains('user') ? 'user' : 'support';
        
        if (text) {
            messages.push({ text, type, time });
        }
    });
    
    localStorage.setItem('chatMessages_' + chatSessionId, JSON.stringify(messages));
}

function startChatPolling() {
    if (chatPollingInterval) return;
    
    chatPollingInterval = setInterval(async () => {
        try {
            const response = await fetch(`${API_URL}/api/chat/messages/${chatSessionId}`);
            const data = await response.json();
            
            if (data.success && data.messages && data.messages.length > 0) {
                removeTypingIndicator();
                
                data.messages.forEach(msg => {
                    addChatMessage(msg.text, 'support', msg.time);
                    
                    if (!chatOpen) {
                        unreadMessages++;
                        showUnreadBadge(unreadMessages);
                    }
                });
            }
        } catch (error) {
            console.error('Chat polling error:', error);
        }
    }, 3000);
}

function stopChatPolling() {
    if (chatPollingInterval) {
        clearInterval(chatPollingInterval);
        chatPollingInterval = null;
    }
}

// Start polling even when chat is closed (to show badge)
document.addEventListener('DOMContentLoaded', () => {
    // Initial check for messages
    setTimeout(() => {
        if (!chatOpen) {
            // Light polling when closed
            setInterval(async () => {
                if (chatOpen) return;
                
                try {
                    const response = await fetch(`${API_URL}/api/chat/check/${chatSessionId}`);
                    const data = await response.json();
                    
                    if (data.success && data.hasNewMessages) {
                        unreadMessages = data.count || 1;
                        showUnreadBadge(unreadMessages);
                    }
                } catch (error) {
                    // Silently fail
                }
            }, 10000);
        }
    }, 5000);
});
