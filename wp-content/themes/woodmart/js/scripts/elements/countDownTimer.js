/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdProductsTabsLoaded wdSearchFullScreenContentLoaded wdUpdateWishlist wdShopPageInit wdArrowsLoadProducts wdLoadMoreLoadProducts wdRecentlyViewedProductLoaded', function () {
		woodmartThemeModule.countDownTimer();
	});

	$.each([
		'frontend/element_ready/wd_products.default',
		'frontend/element_ready/wd_products_tabs.default',
		'frontend/element_ready/wd_countdown_timer.default',
		'frontend/element_ready/wd_single_product_countdown.default',
		'frontend/element_ready/wd_banner.default',
		'frontend/element_ready/wd_banner_carousel.default',
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.countDownTimer();
		});
	});

	woodmartThemeModule.countDownTimer = function() {
		$('.wd-timer').each(function() {
			var $this = $(this);
			var timezone = $this.data('timezone') ? $this.data('timezone') : woodmart_settings.countdown_timezone;

			dayjs.extend(window.dayjs_plugin_utc);
			dayjs.extend(window.dayjs_plugin_timezone);
			var time = dayjs.tz($this.data('end-date'), timezone);

			$this.countdown(time.toDate(), function(event) {
				if ( 'yes' === $this.data('hide-on-finish') && 'finish' === event.type ) {
					$this.parent().addClass('wd-hide');
				}

				$this.find('.wd-timer-days .wd-timer-value').text(event.strftime('%-D'))
				$this.find('.wd-timer-hours .wd-timer-value').text(event.strftime('%H'))
				$this.find('.wd-timer-min .wd-timer-value').text(event.strftime('%M'))
				$this.find('.wd-timer-sec .wd-timer-value').text(event.strftime('%S'))
			});
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.countDownTimer();
	});
})(jQuery);
