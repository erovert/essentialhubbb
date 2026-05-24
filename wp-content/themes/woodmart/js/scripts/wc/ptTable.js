/* global woodmart_settings */
woodmartThemeModule.ptTable = function() {
	var ptTable = document.querySelector('.wd-pt-table');

	if (!ptTable) {
		return;
	}

	var unsubscribeBtns        = ptTable.querySelectorAll('.wd-pt-remove');
	var desiredPriceEditBtns   = ptTable.querySelectorAll('.wd-desired-price-opener');
	var desiredPriceCancelBtns = ptTable.querySelectorAll('.wd-desired-price-cancel');
	var desiredPriceSaveBtns   = ptTable.querySelectorAll('.wd-desired-price-save');

	unsubscribeBtns.forEach(function(unsubscribeBtn) {
		unsubscribeBtn.addEventListener('click', function(e) {
			e.preventDefault();

			var actionBtn = this;

			ptTable.parentNode.querySelector('.wd-loader-overlay').classList.add('wd-loading');

			jQuery.ajax({
				url     : woodmart_settings.ajaxurl,
				data    : {
					action       : 'woodmart_remove_from_price_tracker_in_my_account',
					security     : woodmart_settings.pt_remove_button_nonce,
					product_id   : actionBtn.dataset.productId,
					variation_id : actionBtn.dataset.variationId,
				},
				method  : 'POST',
				success : function(response) {
					if (!response) {
						return;
					}

					if (response.success) {
						actionBtn.closest('tr').remove();
					}

					if (response.data.content) {
						tempDiv           = document.createElement('div');
						tempDiv.innerHTML = response.data.content;
						var childNodes    = tempDiv.querySelector('.wd-pt-content').childNodes;

						ptTable.parentNode.replaceChildren(...childNodes);
					}
				},
				error   : function() {
					console.error('ajax remove from waitlist error');
				},
				complete: function() {
					ptTable.parentNode.querySelector('.wd-loader-overlay').classList.remove('wd-loading');
				}
			});
		});
	});

	desiredPriceEditBtns.forEach(function(editBtn) {
		editBtn.addEventListener('click', function(e) {
			e.preventDefault();

			var desiredPriceEdit = this.closest('td').querySelector('.wd-desired-price-edit');
			var amount           = this.closest('td').querySelector('.amount');
			var emptyCell        = this.closest('td').querySelector('.wd-cell-empty');

			if (desiredPriceEdit) {
				desiredPriceEdit.classList.toggle('wd-hide');
				this.classList.toggle('wd-hide');
			}

			if (amount) {
				amount.classList.add('wd-hide');
			}

			if (emptyCell) {
				emptyCell.classList.add('wd-hide');
			}
		});
	});

	desiredPriceCancelBtns.forEach(function(cancelBtn) {
		cancelBtn.addEventListener('click', function(e) {
			e.preventDefault();

			var desiredPriceEdit = this.closest('.wd-desired-price-edit');
			var amount           = desiredPriceEdit.closest('td').querySelector('.amount');
			var emptyCell        = desiredPriceEdit.closest('td').querySelector('.wd-cell-empty');

			if (desiredPriceEdit) {
				desiredPriceEdit.classList.add('wd-hide');
				desiredPriceEdit.parentNode.querySelector('.wd-desired-price-opener').classList.remove('wd-hide');
			}


			if (amount) {
				amount.classList.remove('wd-hide');
			}

			if (emptyCell) {
				emptyCell.classList.remove('wd-hide');
			}
		});
	});

	desiredPriceSaveBtns.forEach(function(saveBtn) {
		saveBtn.addEventListener('click', function(e) {
			e.preventDefault();

			var desiredPriceEdit        = this.closest('.wd-desired-price-edit');
			var desiredPriceChangeInput = desiredPriceEdit.querySelector('[name="wd-desired-price-change"]');
			var noticesWrapper          = document.querySelector('.woocommerce-notices-wrapper');

			if (desiredPriceChangeInput) {
				var newDesiredPrice = desiredPriceChangeInput.value;

				ptTable.parentNode.querySelector('.wd-loader-overlay').classList.add('wd-loading');

				jQuery.ajax({
					url     : woodmart_settings.ajaxurl,
					data    : {
						action       : 'woodmart_update_price_tracker_desired_price',
						security     : woodmart_settings.pt_update_desired_price_nonce,
						product_id   : desiredPriceEdit.dataset.productId,
						variation_id : desiredPriceEdit.dataset.variationId,
						desired_price: newDesiredPrice,
					},
					method  : 'POST',
					success : function(response) {
						if (!response) {
							return;
						}

						if ( response.data.notice ) {
							var noticeNodes = noticesWrapper.querySelectorAll('.wd-notice');
							var noticeNode  = document.createElement("div");
							var status      = response.success ? 'success' : 'warning';

							noticeNodes.forEach(noticeNode => {
								noticeNode.remove();
							});

							noticeNode.classList.add(
								'wd-notice',
								`wd-${status}`
							);

							noticeNode.append(response.data.notice);
							noticesWrapper.append(noticeNode);
						}

						if (response.success) {
							var amount    = desiredPriceEdit.parentNode.querySelector('.amount');
							var emptyCell = desiredPriceEdit.parentNode.querySelector('.wd-cell-empty');

							if (amount) {
								amount.remove();
							}

							if (emptyCell) {
								emptyCell.remove();
							}

							if (response.data.desired_price_html) {
								var tempDiv       = document.createElement('div');
								tempDiv.innerHTML = response.data.desired_price_html;

								desiredPriceEdit.parentNode.prepend(tempDiv.firstElementChild);
							}

							desiredPriceEdit.classList.add('wd-hide');
							desiredPriceEdit.parentNode.querySelector('.wd-desired-price-opener').classList.remove('wd-hide');
						}
					},
					error   : function() {
						console.error('ajax update desired price error');
					},
					complete: function() {
						ptTable.parentNode.querySelector('.wd-loader-overlay').classList.remove('wd-loading');
					}
				});
			}
		});
	});
}

window.addEventListener('load', function() {
	woodmartThemeModule.ptTable();
});
