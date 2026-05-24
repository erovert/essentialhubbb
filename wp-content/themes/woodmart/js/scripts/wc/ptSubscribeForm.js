/* global woodmart_settings, woodmartThemeModule, jQuery */
woodmartThemeModule.ptSubscribeForm = function() {
	var signedProducts      = [];
	var firstSignedProducts = [];

	async function init() {
		var notifierBtn = getNotifierBtn();

		if (!notifierBtn) return;

		if ('yes' === woodmart_settings.pt_fragments_enable) {
			const ids  = getProductAndVariationId();
			const data = await fetchSignedProducts(ids.productId);

			if (data) {
				if (data.signed_variations && data.signed_variations.length > 0) {
					firstSignedProducts = data.signed_variations;
				} else if (data.is_signed) {
					firstSignedProducts.push(ids.productId);
					signedProducts.push(ids.productId);
				}

				notifierBtn.classList.remove('wd-disabled');
			}

			renderNotifierUI(notifierBtn);
		} else {
			var variationsForm = getVariationsForm();

			if (variationsForm) {
				firstSignedProducts = JSON.parse(notifierBtn.dataset.signedVariations || '[]');
			}

			renderNotifierUI(notifierBtn);
		}

		setupEventListeners();
	}

	/**
	 * Updates the notifier button UI based on current variation state.
	 *
	 * @param {HTMLElement} notifierBtn
	 */
	function renderNotifierUI(notifierBtn) {
		const ids = getProductAndVariationId();

		if (ids.variationId && firstSignedProducts.includes(ids.variationId)) {
			notifierBtn.classList.remove('wd-hide');
		}
	}

	/**
	 * Sets up all event listeners for notifier button, popup, and variations form.
	 */
	function setupEventListeners() {
		var notifierBtn    = getNotifierBtn();
		var popupContent   = getPopupContent();
		var variationsForm = getVariationsForm();

		if (!notifierBtn) {
			return;
		}

		if (notifierBtn.classList.contains('wd-pt-remove')) {
			notifierBtn.addEventListener('click', handleUnsubscribe);
		}

		if (popupContent) {
			var subscribeBtn           = popupContent.querySelector('.wd-pt-add');
			var policyCheckInput       = popupContent.querySelector('[name="wd-pt-policy-check"]');
			var desiredPriceCheckInput = popupContent.querySelector('[name="wd-pt-desired-price-check"]');
			var desiredPriceInput      = popupContent.querySelector('[name="wd-pt-user-desired-price"]');
			var closePopupBtn          = popupContent.querySelector('.wd-close-popup');

			subscribeBtn.addEventListener('click', handleSubscribe);

			// Remove notice when magnificPopup closes.
			jQuery(document).one('mfpClose', function() {
				maybeClearNotices();
			});

			// Remove notice when policyCheckInput is checked.
			if (policyCheckInput) {
				const removeNoticeOnCheck = function() {
					if (policyCheckInput.checked) {
						maybeClearNotices(woodmart_settings.pt_policy_check_msg);
					}
				};

				policyCheckInput.addEventListener('change', removeNoticeOnCheck);
			}

			if (desiredPriceCheckInput && desiredPriceInput) {
				// Set desired price check input when desired price input is clicked.
				desiredPriceInput.addEventListener('click', function(e) {
					desiredPriceCheckInput.checked = true;
				});

				// Clear desired price input when desired price check input is unchecked.
				desiredPriceCheckInput.addEventListener('change', function() {
					if (!desiredPriceCheckInput.checked) {
						desiredPriceInput.value = '';
					} else {
						desiredPriceInput.focus();
					}
				});
			}

			// Close popup when close button is clicked.
			closePopupBtn.addEventListener('click', function(e) {
				e.preventDefault();

				jQuery.magnificPopup.close();
			});
		} else if (notifierBtn.classList.contains('wd-pt-add')) {
			notifierBtn.addEventListener('click', handleSubscribe);
		}

		if (variationsForm) {
			jQuery('.variations_form')
				.off('show_variation', handleFoundVariation)
				.on('show_variation', handleFoundVariation)
				.off('click', '.reset_variations', handleResetVariations)
				.on('click', '.reset_variations', handleResetVariations);
		}
	}

	/**
	 * Handles faund variation event.
	 *
	 * @param {Event} e
	 * @param {Object} variation
	 */
	function handleFoundVariation(e, variation) {
		var notifierBtn  = getNotifierBtn();
		var popupContent = getPopupContent();

		if (!notifierBtn) {
			return;
		}

		if (popupContent) {
			updatePopupContent(variation.variation_id);
		}

		updateNotifierBtn(variation.variation_id);

		if (variation.is_in_stock) {
			notifierBtn.classList.remove('wd-hide');
		} else {
			notifierBtn.classList.add('wd-hide');
		}
		
		maybeClearNotices();
	}

	/**
	 * Handles reset variations event.
	 *
	 * @param {Event} e
	 */
	function handleResetVariations(e) {
		var notifierBtn = getNotifierBtn();

		notifierBtn.classList.add('wd-hide');

		maybeClearNotices();
	}

	/**
	 * Handles subscribe button click event.
	 *
	 * @param {Event} e
	 */
	function handleSubscribe(e) {
		if (this.classList.contains('wd-pt-remove')) {
			return;
		}

		e.preventDefault();

		var popupContent = getPopupContent();

		if (popupContent) {
			if (! validateForm()) {
				return;
			}
		}

		var ids              = getProductAndVariationId();
		var userEmail        = getUserEmail();
		var userDesiredPrice = getUserDesiredPrice();

		sendNotifierForm({
			action       : 'woodmart_add_to_price_tracker',
			security     : woodmart_settings.pt_add_button_nonce,
			user_email   : userEmail,
			product_id   : ids.productId,
			variation_id : ids.variationId,
			desired_price : userDesiredPrice,
		});
	}

	/**
	 * Handles unsubscribe button click event.
	 *
	 * @param {Event} e
	 */
	function handleUnsubscribe(e) {
		if (!this.classList.contains('wd-pt-remove')) {
			return;
		}

		e.preventDefault();

		var ids         = getProductAndVariationId();
		var productId   = parseInt(ids.productId);
		var variationId = parseInt(ids.variationId); 

		sendNotifierForm({
			action       : 'woodmart_remove_from_price_tracker',
			security     : woodmart_settings.pt_remove_button_nonce,
			product_id   : productId,
			variation_id : variationId,
		});
	}

	/**
	 * Updates notifier button UI for a specific variation.
	 *
	 * @param {number} variationId
	 */
	function updateNotifierBtn(variationId) {
		var notifierBtn     = getNotifierBtn();
		var popupContent    = getPopupContent();
		var notifierBtnLink = notifierBtn.querySelector('a');
		var notifierBtnText = notifierBtnLink.querySelector('.wd-action-text');

		if (firstSignedProducts.includes(variationId)) {
			notifierBtnText.innerText = woodmart_settings.pt_button_text_stop_tracking;
			notifierBtnLink.href      = '#';
			notifierBtnLink.classList.remove('added');

			notifierBtn.classList.add('wd-pt-remove');
			notifierBtn.classList.remove('wd-pt-add');

			notifierBtn.addEventListener('click', handleUnsubscribe);

			notifierBtnLink.classList.remove('wd-open-popup');
		} else if (signedProducts.includes(variationId)) {
			notifierBtnText.innerText = woodmart_settings.pt_button_text_watch_tracking;
			notifierBtnLink.href      = woodmart_settings.pt_endpoint_url;
			notifierBtnLink.classList.add('added');

			notifierBtn.classList.remove('wd-pt-remove');
			notifierBtn.classList.remove('wd-pt-add');

			notifierBtn.removeEventListener('click', handleSubscribe);

			notifierBtnLink.classList.remove('wd-open-popup');
		} else {
			notifierBtnText.innerText = woodmart_settings.pt_button_text_not_tracking;

			notifierBtn.classList.remove('wd-pt-remove');
			notifierBtnLink.classList.remove('wd-open-popup');
			notifierBtnLink.classList.remove('added');

			if (popupContent) {
				notifierBtnLink.href = '#wd-popup-pt';

				notifierBtnLink.classList.add('wd-open-popup');
			} else {
				notifierBtnLink.href = '#';
				notifierBtn.classList.add('wd-pt-add');

				notifierBtn.addEventListener('click', handleSubscribe);
			}
		}
	}

	/**
	 * Updates popup content for a specific variation.
	 *
	 * @param {number} variationId
	 */
	function updatePopupContent(variationId) {
		var popupContent = getPopupContent();

		if (signedProducts.includes(variationId)) {
			popupContent.querySelector('.wd-pt-signed').classList.remove('wd-hide');
			popupContent.querySelector('.wd-pt-not-signed').classList.add('wd-hide');
		} else {
			popupContent.querySelector('.wd-pt-signed').classList.add('wd-hide');
			popupContent.querySelector('.wd-pt-not-signed').classList.remove('wd-hide');
		}
	}

	/**
	 * Updates signed products based on the current state.
	 *
	 * @param {string} state
	 * @param {number} productId
	 */
	function updateSignedProducts(state, productId) {
		if ('signed' === state) {
			if (!signedProducts.includes(productId)) {
				signedProducts.push(productId);
			}
		} else if ('not-signed' === state) {
			if (signedProducts.includes(productId)) {
				signedProducts = signedProducts.filter(function(id) {
					return id !== productId;
				});
			}

			if (firstSignedProducts.includes(productId)) {
				firstSignedProducts = firstSignedProducts.filter(function(id) {
					return id !== productId;
				});
			}
		}
	}

	/**
	 * Validates the popup form (policy checkbox).
	 *
	 * @returns {boolean}
	 */
	function validateForm() {
		var popupContent = getPopupContent();

		if (!popupContent) {
			return false;
		}

		var policyCheckInput       = popupContent.querySelector('[name="wd-pt-policy-check"]');
		var desiredPriceCheckInput = popupContent.querySelector('[name="wd-pt-desired-price-check"]');
		var desiredPriceInput      = popupContent.querySelector('[name="wd-pt-user-desired-price"]');
		var noticesAria            = getNoticeAria();

		if (policyCheckInput && ! policyCheckInput.checked && noticesAria) {
			addNotice(noticesAria, woodmart_settings.pt_policy_check_msg, 'warning');

			return false;
		}

		if (desiredPriceCheckInput && desiredPriceInput && desiredPriceCheckInput.checked && ! parseInt( desiredPriceInput.value ) ) {
			addNotice(noticesAria, woodmart_settings.pt_desired_price_check_msg, 'warning');

			return false;
		}

		return true;
	}

	/**
	 * Sends AJAX request to subscribe/unsubscribe and updates UI.
	 *
	 * @param {Object} data
	 */
	function sendNotifierForm(data) {
		var popupContent    = getPopupContent();
		var noticesAria     = getNoticeAria();
		var notifierBtn     = getNotifierBtn();
		var notifierBtnLink = notifierBtn.querySelector('a');
		var ids             = getProductAndVariationId();
		var productId       = ids.variationId ? ids.variationId : ids.productId;

		maybeClearNotices();

		if (popupContent) {
			var loaderOverlay = popupContent.querySelector('.wd-loader-overlay');

			loaderOverlay.classList.add('wd-loading');
		}

		notifierBtnLink.classList.add('loading');

		jQuery.ajax({
			url     : woodmart_settings.ajaxurl,
			data,
			method  : 'POST',
			success : function(response) {
				if (!response || !response.hasOwnProperty('data')) {
					return;
				}

				if (response.data.notice && noticesAria) {
					var status = response.data.success ? 'success' : 'warning';

					addNotice(noticesAria, response.data.notice, status);
				}

				if (response.data.state) {
					updateSignedProducts(response.data.state, productId);
				}

				if (popupContent) {
					updatePopupContent(productId);
				}

				updateNotifierBtn(productId);
			},
			error   : function() {
				console.error('ajax adding to price tracker error');
			},
			complete: function() {
				if (popupContent) {
					loaderOverlay = popupContent.querySelector('.wd-loader-overlay');

					loaderOverlay.classList.remove('wd-loading');
				}

				notifierBtnLink.classList.remove('loading');
			}
		});
	}

	/**
	 * Fetches signed variations for a product via AJAX.
	 *
	 * @param {number|string} productId
	 *
	 * @returns {Promise<Object|undefined>}
	 */
	async function fetchSignedProducts(productId) {
		try {
			const data = await jQuery.ajax({
				url     : woodmart_settings.ajaxurl,
				data    : {
					action    : 'woodmart_update_price_tracker_form',
					product_id: productId,
				},
				dataType: 'json',
				method  : 'GET',
			});

			return data;
		} catch (error) {
			console.error('Error updating form data:', error);
		}
	}

	/**
	 * Gets current product and variation IDs from DOM.
	 *
	 * @returns {{productId: string|number, variationId: number}}
	 */
	function getProductAndVariationId() {
		var productId = false;

		document.querySelector('body[class*="postid-"]').classList.forEach(function(className) {
			if ( ! className.includes('postid-') ) {
				return;
			}

			productId = className.replace('postid-', '')
		});

		var variations_form = getVariationsForm();
		var variationId     = 0;

		if (variations_form) {
			var variationIdInput = variations_form.querySelector('input.variation_id');
			variationId  = variationIdInput.value ? parseInt(variationIdInput.value) : 0;
		}

		return {productId: parseInt(productId), variationId: parseInt(variationId)};
	}

	/**
	 * Retrieves the value of the user's email from the price tracker subscription form input.
	 *
	 * @returns {string} The user's email address if the input exists, otherwise an empty string.
	 */
	function getUserEmail() {
		var userEmail      = '';
		var userEmailInput = document.querySelector('[name="wd-pt-user-subscribe-email"]');

		if (userEmailInput) {
			userEmail = userEmailInput.value;
		}

		return userEmail;
	}

	/**
	 * Retrieves the value of the user's desired price from the price tracker subscription form input.
	 *
	 * @returns {string} The user's desired price if the input exists, otherwise an empty string.
	 */
	function getUserDesiredPrice() {
		var userDesiredPrice      = '';
		var userDesiredPriceInput = document.querySelector('[name="wd-pt-user-desired-price"]');

		if (userDesiredPriceInput) {
			userDesiredPrice = userDesiredPriceInput.value;
		}

		return userDesiredPrice;
	}

	/**
	 * Adds a notice message to the popup form.
	 *
	 * @param {HTMLElement} noticesAria
	 * @param {string} message
	 * @param {string} status
	 */
	function addNotice(noticesAria, message, status) {
		if (!noticesAria) {
			return;
		}

		maybeClearNotices();

		var noticeNode = document.createElement("div");

		noticeNode.classList.add(
			'wd-notice',
			`wd-${status}`
		);

		noticeNode.append(message);
		noticesAria.append(noticeNode);
	}

	/**
	 * Returns the DOM element of the price drop button.
	 *
	 * @returns {HTMLElement|null}
	 */
	function getNotifierBtn() {
		return document.querySelector('.wd-pt-btn');
	}

	/**
	 * Returns the DOM element of the price drop subscription popup.
	 *
	 * @returns {HTMLElement|null}
	 */
	function getPopupContent() {
		return document.querySelector('#wd-popup-pt');
	}

	/**
	 * Returns the DOM element of the variations form.
	 *
	 * @returns {HTMLElement|null}
	 */
	function getVariationsForm() {
		return document.querySelector('.variations_form');
	}

	/**
	 * Returns the DOM element of the notices wrapper.
	 *
	 * @returns {HTMLElement|null}
	 */
	function getNoticeAria() {
		var popupContent = getPopupContent();

		if (popupContent && popupContent.closest('.mfp-ready')) {
			return popupContent;
		} else {
			return document.querySelector('.woocommerce-notices-wrapper');
		}
	}

	/**
	 * Removes the first element with the class 'wd-notice' from the notice area, if it exists.
	 * Utilizes the getNoticeAria function to locate the notice area in the DOM.
	 *
	 * @param {string} message
	 */
	function maybeClearNotices(message = '') {
		var noticesAria = getNoticeAria();

		if (!noticesAria) {
			return;
		}

		var noticeNodes = noticesAria.querySelectorAll('.wd-notice');

		if ( 0 === noticeNodes.length) {
			return;
		}

		noticeNodes.forEach(noticeNode => {
			if (!message || (message && noticeNode.innerText.includes(message))) {
				noticeNode.remove();
			}
		});
	}

	init();
}

window.addEventListener('load', function() {
	woodmartThemeModule.ptSubscribeForm();
});
