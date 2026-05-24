/* global woodmart_settings, woodmartThemeModule, jQuery */
(function($) {
	woodmartThemeModule.$document.on('wdPortfolioLoadMoreLoaded', function () {
		woodmartThemeModule.mfpPopup();
	});

	woodmartThemeModule.mfpPopup = function() {
		if ('undefined' === typeof $.fn.magnificPopup) {
			return;
		}

		const popupWrap = '.wd-popup-wrap'

		$('.gallery').off('click').on('click', 'a:not([data-elementor-open-lightbox]), a[data-elementor-open-lightbox=no]', function(e) {
			e.preventDefault()

			setTimeout(() => {
				if ($.magnificPopup?.instance?.isOpen) {
					$.magnificPopup.instance.st.removalDelay = 0
					$.magnificPopup.close()
				}

				const $link = $(this)
				const $gallery = $link.closest('.gallery')
				const $items = $gallery.find('a:not([data-elementor-open-lightbox]), a[data-elementor-open-lightbox=no]')
				const index = $items.index($link)
				const items = []
				$items.each(function() {
					items.push({ src: $(this).attr('href') })
				})

				$.magnificPopup.open({
					items          : items,
					type           : 'image',
					removalDelay   : 600,
					closeMarkup    : woodmart_settings.close_markup,
					tLoading       : woodmart_settings.loading,
					fixedContentPos: true,
					callbacks      : {
						beforeOpen: function() {
							this.wrap.addClass('wd-popup-gallery-wrap')
						},
						change: function() {
							setTimeout(() => {
								this.wrap.find(popupWrap).addClass('wd-in wd-animated')
							}, 16)
						},
					},
					image       : {
						verticalFit: true,
						markup: '<div class="mfp-figure wd-popup wd-popup-gallery">'+
							woodmart_settings.close_markup +
							'<figure>'+
							'<div class="mfp-img"></div>'+
							'<figcaption>'+
							'<div class="mfp-bottom-bar">'+
							'<div class="mfp-title"></div>'+
							'<div class="mfp-counter"></div>'+
							'</div>'+
							'</figcaption>'+
							'</figure>'+
							'</div>'
					},
					gallery     : {
						enabled           : true,
						navigateByImgClick: true
					}
				}, index)
			})
		})
	};

	$(document).ready(function() {
		woodmartThemeModule.mfpPopup();
	});
})(jQuery);
