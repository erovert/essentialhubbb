/* global woodmart_settings, woodmartThemeModule, jQuery */
(function($) {
	woodmartThemeModule.product360Button = function() {
		if ('undefined' === typeof $.fn.magnificPopup) {
			return;
		}

		$('.product-360-button a').magnificPopup({
			type           : 'inline',
			mainClass      : 'mfp-fade',
			preloader      : false,
			closeMarkup    : woodmart_settings.close_markup,
			tLoading       : woodmart_settings.loading,
			fixedContentPos: true,
			removalDelay   : 600,
			callbacks      : {
				beforeOpen: function() {
					this.wrap.addClass('wd-product-360-view-wrap');
				},
				open: function() {
					woodmartThemeModule.$window.trigger('resize');
				},
			}
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.product360Button();
	});
})(jQuery);
