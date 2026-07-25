(function () {
  "use strict";

  function cleanPrice(value) {
    return (value || "").replace(/[^0-9.]/g, "");
  }

  function getCurrentPrice(container, selector) {
    var price = container.querySelector(selector + " ins .amount") ||
      container.querySelector(selector + " ins") ||
      container.querySelector(selector + " .amount") ||
      container.querySelector(selector);
    return cleanPrice(price ? price.textContent : "");
  }

  function getCardProduct(button) {
    var card = button.closest(".wd-product, .product-grid-item, li.product, .wc-block-grid__product");
    if (!card) return null;

    var titleLink = card.querySelector(".wd-entities-title a, .woocommerce-loop-product__title a, a.woocommerce-loop-product__link, a.wc-block-grid__product-link");
    var imageLink = card.querySelector("a.product-image-link, a.woocommerce-loop-product__link, a.wc-block-grid__product-link");
    var image = card.querySelector(".product-image-link img, .wc-block-grid__product-image img, img.wp-post-image, img.attachment-woocommerce_thumbnail, img");
    var firstGalleryImage = card.querySelector(".wd-product-grid-slide[data-image-url]");

    var title = titleLink ? titleLink.textContent.trim() : "";
    var productUrl = titleLink ? titleLink.href : (imageLink ? imageLink.href : "");
    var imageUrl = firstGalleryImage ? firstGalleryImage.getAttribute("data-image-url") :
      (image ? (image.getAttribute("data-src") || image.currentSrc || image.src) : "");

    return {
      title: title,
      price: getCurrentPrice(card, ".price"),
      url: productUrl,
      image: imageUrl
    };
  }

  function getSingleProduct() {
    var title = document.querySelector("h1.product_title");
    var canonical = document.querySelector('link[rel="canonical"]');
    var image = document.querySelector(".woocommerce-product-gallery__image .wp-post-image");

    return {
      title: title ? title.textContent.trim() : document.title,
      price: getCurrentPrice(document, ".wd-single-price .price"),
      url: canonical ? canonical.href : window.location.href,
      image: image ? (image.dataset.large_image || image.currentSrc || image.src) : ""
    };
  }

  function isValidProduct(product) {
    return product && product.title && Number(product.price) > 0 && product.url && product.image;
  }

  document.addEventListener("click", function (event) {
    var button = event.target.closest(".eh-buy-now-button");
    if (!button) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    var product = getCardProduct(button) || getSingleProduct();
    if (!isValidProduct(product)) {
      window.alert("Product information is unavailable. Please open the product page and try again.");
      return;
    }

    var params = new URLSearchParams({
      title: product.title,
      price: product.price,
      url: product.url,
      img: product.image
    });

    window.location.href = "/order/?" + params.toString();
  }, true);
}());
