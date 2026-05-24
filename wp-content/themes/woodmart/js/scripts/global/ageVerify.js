/* global woodmart_settings, woodmartThemeModule, Cookies, jQuery */
(function($) {
	woodmartThemeModule.ageVerify = function() {
		if ( typeof Cookies === 'undefined' ) {
			return;
		}

		if (woodmart_settings.age_verify !== 'yes' || Cookies.get('woodmart_age_verify') === 'confirmed') {
			return;
		}

		$.magnificPopup.open({
			items          : {
				src: '.wd-age-verify'
			},
			type           : 'inline',
			closeOnBgClick : false,
			closeBtnInside : false,
			showCloseBtn   : false,
			enableEscapeKey: false,
			removalDelay   : 600,
			closeMarkup    : woodmart_settings.close_markup,
			tLoading       : woodmart_settings.loading,
			fixedContentPos: true,
			callbacks      : {
				beforeOpen: function() {
					this.wrap.addClass('wd-age-verify-wrap');
				},
			}
		});

		$('.wd-age-verify-allowed').on('click', function(e) {
			e.preventDefault();
			Cookies.set('woodmart_age_verify', 'confirmed', {
				expires: parseInt(woodmart_settings.age_verify_expires),
			 	path   : '/',
				secure : woodmart_settings.cookie_secure_param
			});

			$.magnificPopup.close();
		});

		$('.wd-age-verify-forbidden').on('click', function(e) {
			e.preventDefault();
			$('.wd-age-verify').addClass('wd-forbidden');
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.ageVerify();
	});
})(jQuery);
