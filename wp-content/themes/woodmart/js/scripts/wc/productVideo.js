/* global woodmart_settings, woodmartThemeModule, jQuery */
(function($) {
	woodmartThemeModule.productVideo = function() {
		if ('undefined' === typeof $.fn.magnificPopup) {
			return;
		}

		$('.product-video-button a').magnificPopup({
			tLoading       : woodmart_settings.loading,
			type           : 'iframe',
			removalDelay   : 600,
			iframe         : {
				markup  : woodmart_settings.close_markup +
					'<div class="wd-popup wd-with-video wd-scroll-content">' +
					'<iframe class="mfp-iframe" src="//about:blank" allowfullscreen></iframe>' +
					'</div>',
				patterns: {
					youtube: {
						index: 'youtube.com/',
						id   : 'v=',
						src  : '//www.youtube.com/embed/%id%?rel=0&autoplay=1'
					}
				}
			},
			preloader      : false,
			fixedContentPos: true,
			callbacks      : {
				beforeOpen: function() {
					this.wrap.addClass('wd-video-popup-wrap');
				},
			}
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.productVideo();
	});
})(jQuery);
