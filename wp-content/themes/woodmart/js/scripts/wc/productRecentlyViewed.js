/* global woodmart_settings */
(function($) {
	woodmartThemeModule.productRecentlyViewed = function() {
		$('.wd-products-element .products, .wd-carousel-container.products .wd-carousel').each( function () {
			var $this = $(this);
			var attr = $this.data('atts');

			if ( 'undefined' === typeof attr || 'undefined' === typeof attr.post_type || 'recently_viewed' !== attr.post_type || 'undefined' === typeof attr.ajax_recently_viewed || 'yes' !== attr.ajax_recently_viewed ) {
				return;
			}

			$.ajax({
				url     : woodmart_settings.ajaxurl,
				data    : {
					attr  : attr,
					action: 'woodmart_get_recently_viewed_products'
				},
				dataType: 'json',
				method  : 'POST',
				success : function(data) {
					if (data.items) {
						woodmartThemeModule.removeDuplicatedStylesFromHTML(data.items, function(html) {
							var temp = $('<div>').html(html);
							var hasProducts = temp.find('.wd-product').length !== 0

							if ( $this.hasClass('wd-carousel') && $this.parents('.wd-products-element').length ) {
								if ( !hasProducts ) {
									$this.parents('.wd-products-element').addClass('wd-hide')
								} else {
									$this.parents('.wd-products-element').removeClass('wd-hide')
								}
								$this.parent().replaceWith(html);
							} else {
								if ( !hasProducts ) {
									$this.parent().addClass('wd-hide')
								} else {
									$this.parent().removeClass('wd-hide')
								}

								$this.html(html);
							}

							woodmartThemeModule.$document.trigger('wdRecentlyViewedProductLoaded');
							woodmartThemeModule.$document.trigger('wood-images-loaded');
						});
					}
				},
				error   : function() {
					console.log('ajax error');
				},
			});
		})
	};

	$(document).ready(function() {
		woodmartThemeModule.productRecentlyViewed();
	});
})(jQuery);