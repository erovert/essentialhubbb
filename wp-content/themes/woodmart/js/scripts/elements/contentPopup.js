/* global woodmart_settings woodmartThemeModule */
(function($) {
	$.each([
		'frontend/element_ready/wd_popup.default',
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.contentPopup();
		});
	});

	woodmartThemeModule.$document.on('wdShopPageInit', function() {
		woodmartThemeModule.contentPopup();
	});

	woodmartThemeModule.contentPopup = function() {
		if ('undefined' === typeof $.fn.magnificPopup) {
			return;
		}

		woodmartThemeModule.$document.on('click', '.wd-open-popup, .wp-block-wd-popup > a', function(e) {
			e.preventDefault();

			if ($.magnificPopup?.instance?.isOpen) {
				$.magnificPopup.instance.st.removalDelay = 0
				$.magnificPopup.close()
			}

			var $btn = $(this);
			var $content = $btn.parent().siblings('.wd-popup');

			if ($btn.parents().hasClass('wd-popup-builder')) {
				return
			}

			if ($btn.hasClass('wp-block-wd-button')) {
				$content = $btn.siblings('.wd-popup');
			} else if ($btn.attr('href')) {
				$content = $($btn.attr('href'))
			}

			$.magnificPopup.open({
				items          : {
					src : $content,
					type: 'inline',
				},
				removalDelay   : 600, //delay removal by X to allow out-animation
				closeMarkup    : woodmart_settings.close_markup,
				tLoading       : woodmart_settings.loading,
				fixedContentPos: true,
				closeOnContentClick: false,
				callbacks      : {
					open      : function() {
						var classWrap = this.wrap.find('.wd-popup').data('wrap-class')
						if (classWrap) {
							setTimeout(() => this.wrap.addClass(classWrap))
						} else {
							setTimeout(() => this.wrap.addClass('wd-popup-element-wrap'))
							var popupWidth = getComputedStyle($content[0]).getPropertyValue('--wd-popup-width');
							this.wrap.css('--wd-popup-width', popupWidth)
						}

						woodmartThemeModule.$document.trigger('wood-images-loaded');
						woodmartThemeModule.$document.trigger('wdOpenPopup');
					},
				}
			});
		});

		// Fix Mailchimp form in popup
		var $mailchimpFormResponse = $('.wd-popup-element .mc4wp-form .mc4wp-response');
		if ($mailchimpFormResponse.length && $mailchimpFormResponse.children().length) {
			var $popup = $mailchimpFormResponse.parents('.wd-popup-element');

			$popup.siblings().find('.wd-open-popup').trigger('click');
		}
	};

	$(document).ready(function() {
		woodmartThemeModule.contentPopup();
	});
})(jQuery);
