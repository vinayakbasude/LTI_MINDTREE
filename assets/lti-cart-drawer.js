let cartDrawerWidget = document.getElementById('lti-cart-drawer');
let cartDrawerOverlay;
let body;


function getSectionDOM(html, selector = '.shopify-section') {
  return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
}

function toggleCart() {
  cartDrawerOverlay.classList.toggle('show');
  body.classList.toggle('overflow-hidden');
}

function attachEvents() {
  const drawerBtn = document.getElementById('cart-icon-bubble');
  const closeBtn = document.querySelector('#close-btn');
  body = document.body;
  cartDrawerOverlay = document.getElementById('lti-cart-drawer-overlay');
  cartDrawerWidget = document.getElementById('lti-cart-drawer');
  drawerBtn?.addEventListener('click', () => {
    cartDrawerOverlay.classList.toggle('show');
    body.classList.toggle('overflow-hidden');
  });

  closeBtn.addEventListener('click', (evt) => {
    toggleCart();
  });

  cartDrawerOverlay.addEventListener('click', (evt) => {
    if (!cartDrawerWidget.contains(evt.target)) {
      toggleCart();
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  attachEvents();
});

window.addEventListener('attach-drawer-events', () => {
  attachEvents();
});

if (!customElements.get('lti-cart-item')) {
  class CartItem extends HTMLElement {
    constructor() {
      super();
      this.debounceTimer = null;
    }

    debounce(func, delay) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(func, delay);
    }

    connectedCallback() {
      this.cartDrawer = document.getElementById('lti-cart-drawer');
      this.cartCountBubble = document.getElementById('cart-icon-bubble');
      this.addEventListener('click', function (event) {
        event.stopPropagation();
        if (event.target.classList.contains('quantity-increment')) {
          const itemId = event.target.getAttribute('data-item-id');
          this.handleQuantityChange(itemId, 1);
        }

        if (event.target.classList.contains('quantity-decrement')) {
          const itemId = event.target.getAttribute('data-item-id');
          this.handleQuantityChange(itemId, -1);
        }

        if (event.target.classList.contains('remove-cart-btn')) {
          const itemId = event.target.getAttribute('data-item-id');
          this.updateCartItemQuantity(itemId, 0);
        }
      });
    }

    updateCartItemQuantity(itemId, newQuantity) {
      const spinner = this.querySelector(`.spinner-wrapper[data-item-id="${itemId}"]`);
      spinner.style.display = 'flex'; // Show spinner
      fetch(`/cart/change.js?quantity=${newQuantity}&id=${itemId}&sections[]=cart-drawer&sections[]=cart-icon-bubble`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'xmlhttprequest',
        },
      })
        .then((response) => {
          // window.location.reload();
          return response.json();
        })
        .then((response) => {
          this.cartDrawer.innerHTML = getSectionDOM(response.sections['cart-drawer'], '#lti-cart-drawer');
          this.cartCountBubble.innerHTML = getSectionDOM(
            response.sections['cart-icon-bubble'],
            '#shopify-section-cart-icon-bubble'
          );
          const drawer = new Event('attach-drawer-events');
          window.dispatchEvent(drawer);
        })
        .catch((error) => {
          console.error('Error:', error);
        })
        .finally(() => {
          spinner.style.display = 'none'; // Hide spinner after API call
        });
    }

    handleQuantityChange(itemId, change) {
      const inputElement = this.querySelector(`input[data-item-id="${itemId}"]`);
      let newQuantity = parseInt(inputElement.value) + change;
      if (newQuantity < 1) {
        newQuantity = 1; // Ensure minimum quantity is 1
      }
      inputElement.value = newQuantity;
      this.debounce(() => this.updateCartItemQuantity(itemId, newQuantity), 500); // Debounce API call
    }
  }

  customElements.define('lti-cart-item', CartItem);
}
