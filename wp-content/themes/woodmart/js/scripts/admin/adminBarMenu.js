/* global woodmart_settings */
(function($) {
	woodmartThemeModule.adminBarSliderMenu = function() {
		var $sliderWrapper = $('.wd-slider > .wd-carousel-inner > .wd-carousel');
		var $adminBar = $('#wpadminbar');

		if ($sliderWrapper.length > 0 && $adminBar.length > 0) {
			$sliderWrapper.each(function() {
				var $slider = $(this);
				var sliderId = $slider.parents('.wd-slider').data('id');
				var sliderData = $slider.data('slider');
				var $sliderSubMenu = $('#wp-admin-bar-xts_sliders > .ab-sub-wrapper > .ab-submenu');

				if (!sliderData) {
					return;
				}

				if (! $sliderSubMenu.find('.xts-admin-bar-separator').length) {
					$sliderSubMenu.append(
						`<li class="xts-admin-bar-separator"><div class="ab-item ab-empty-item">${woodmart_settings.on_this_page}</div></li>`
					);
				}

				$sliderSubMenu.append('<li id="' + sliderId + '" class="menupop"><a href="' + sliderData.url + '" class="ab-item" target="_blank">' + sliderData.title + '<span class="wp-admin-bar-arrow" aria-hidden="true"></span></a><div class="ab-sub-wrapper"><ul class="ab-submenu"></ul></div></li>');

				$slider.find('.wd-slide').each(function() {
					var $slide = $(this);
					var slideData = $slide.data('slide');

					$sliderSubMenu.find('#' + sliderId + ' > .ab-sub-wrapper > .ab-submenu').append('<li><a href="' + slideData.url + '" class="ab-item" target="_blank">' + slideData.title + '</a></li>');
				});
			});
		}

		if ('undefined' !== typeof woodmart_editable_posts_data && woodmart_editable_posts_data.length && $adminBar.length > 0) {
			woodmart_editable_posts_data.forEach(postData => {
				var $menuItem = $('#wp-admin-bar-xts_dashboard .' + postData.type + '-post-type')

				if (! $menuItem.length) {
					return;
				}

				if (! $menuItem.find('.xts-admin-bar-separator').length) {
					$menuItem.find('.ab-submenu').append(
						`<li class="xts-admin-bar-separator"><div class="ab-item ab-empty-item">${woodmart_settings.on_this_page}</div></li>`
					);
				}

				$menuItem.find('.ab-submenu').append(
					`<li><a href="${postData.edit_url}" class="ab-item" target="_blank">${postData.title}</a></li>`
				);
			});
		}
	};

	woodmartThemeModule.adminBarSliderMenu();
})(jQuery);
