let cartDrawer;
let cartCountBubble;

function getSectionDOM(html, selector = '.shopify-section') {
  return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
}

const swiper = new Swiper('.swiper', {
  slidesPerView: 'auto',
  spaceBetween: 16,
  pagination: {
    el: '.swiper-pagination',
  },
  breakpoints: {
    320: {
      slidesPerView: 'auto',
      cssMode: true,
      centeredSlides: true,
      centeredSlidesBounds: true,
      spaceBetween: 16,
    },
    1024: {
      cssMode: false,
      slidesPerView: 'auto',
      centeredSlides: false,
      centeredSlidesBounds: false,
      spaceBetween: 50,
    },
  },
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
});

const sizesBtn = document.querySelectorAll('[data-variant-size]');
const colorsBtn = document.querySelectorAll('[data-variant-color]');
const variantInput = document.querySelector('#variant-id');
const addToBag = document.querySelector('#add-to-cart');
const quantity = document.querySelector('#pdp-quantity');

sizesBtn.forEach((size) => {
  size.addEventListener('click', (evt) => {
    const button = evt.target.value;
    const selectedColor = colorsBtn.length && Array.from(colorsBtn)?.find((btn) => btn.checked).value;
    const variantDetail = !selectedColor ? button : `${selectedColor}-${button}`;
    updateVariant(variants[variantDetail]);
  });
});

function updateVariant(id) {
  variantInput.value = id;
}

colorsBtn.forEach((size) => {
  size.addEventListener('click', (evt) => {
    const button = evt.target.value;
    const selectedSize = sizesBtn?.length && Array.from(sizesBtn)?.find((btn) => btn.checked).value;

    const variantDetail = !selectedSize ? button : `${selectedSize}-${button}`;
    updateVariant(variants[variantDetail]);
  });
});

const addToCart = () => {
  let formData = {
    items: [
      {
        id: variantInput.value,
        quantity: quantity.value || 1,
      },
    ],
    sections: 'cart-drawer,cart-icon-bubble',
  };
  const cart = fetch('/cart/add.js', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  })
    .then((response) => {
      return response.json();
    })
    .then((response) => {
      cartDrawer.innerHTML = getSectionDOM(response.sections['cart-drawer'], '#lti-cart-drawer');
      cartCountBubble.innerHTML = getSectionDOM(
        response.sections['cart-icon-bubble'],
        '#shopify-section-cart-icon-bubble'
      );
      const click = new Event('click');
      const drawer = new Event('attach-drawer-events');
      cartDrawerOverlay.dispatchEvent(click);
      window.dispatchEvent(drawer);
    })
    .catch((error) => {
      console.error('Error:', error);
    });
};

addToBag?.addEventListener('click', addToCart);

if (!customElements.get('pdp-quantity')) {
  class PdpQuantity extends HTMLElement {
    constructor() {
      super();
      this.increaseBtn = this.querySelector('#increment-quantity');
      this.decreaseBtn = this.querySelector('#decrement-quantity');
      this.pdpQuantity = this.querySelector('#pdp-quantity');
    }

    connectedCallback() {
      this.decreaseBtn?.addEventListener('click', (event) => {
        event.stopPropagation();
        this.updateQuantity(false);
      });

      this.increaseBtn?.addEventListener('click', (event) => {
        event.stopPropagation();
        this.updateQuantity(true);
      });
    }

    updateQuantity = (add) => {
      const { pdpQuantity } = this;
      if (add) {
        pdpQuantity.value = Number(pdpQuantity.value) + 1;
      } else if (!add && pdpQuantity.value > 1) {
        pdpQuantity.value = Number(pdpQuantity.value) - 1;
      }
    };
  }
  customElements.define('pdp-quantity', PdpQuantity);
}

window.addEventListener('DOMContentLoaded', () => {
  cartDrawer = document.getElementById('lti-cart-drawer');
  cartCountBubble = document.getElementById('cart-icon-bubble');
});
