/* global woodmart_settings */
(function($) {
	woodmartThemeModule.simpleDropdown = function() {
		$('.wd-search-cat').each(function() {
			var dd = $(this);
			var btn = dd.find('.wd-search-cat-btn');
			var input = dd.find('> input');
			var list = dd.find('> .wd-dropdown');
			var $searchInput = dd.parent().parent().find('.s');

			$searchInput.on('focus', function() {
				inputPadding();
			});

			btn.on('click', function(e) {
				e.preventDefault();

				if (typeof ($.fn.devbridgeAutocomplete) != 'undefined') {
					dd.siblings('[type="text"]').devbridgeAutocomplete('hide');
				}
			});

			list.on('click', 'a', function(e) {
				e.preventDefault();
				var $this = $(this);
				var value = $this.data('val');
				var label = $this.text();

				list.find('.current-item').removeClass('current-item');
				$this.parent().addClass('current-item');

				if (value !== 0) {
					list.find('ul:not(.children) > li:first-child').show();

					input.attr('disabled', null);
				} else if (value === 0) {
					list.find('ul:not(.children) > li:first-child').hide();

					input.attr('disabled', 'disabled');
				}

				btn.find('span').text(label);
				input.val(value);
				input.closest('form.woodmart-ajax-search').find('[type="text"]').trigger('cat_selected');
				dd.removeClass('wd-opened');
				inputPadding();
			});

			function inputPadding() {
				if (woodmartThemeModule.$window.width() <= 768 || $searchInput.hasClass('wd-padding-inited') || 'yes' !== woodmart_settings.search_input_padding) {
					return;
				}

				var paddingValue = dd.innerWidth() + dd.parent().siblings('.searchsubmit').innerWidth() + 17,
				    padding      = 'padding-right';

				if (woodmartThemeModule.$body.hasClass('rtl')) {
					padding = 'padding-left';
				}

				$searchInput.css(padding, paddingValue);
				$searchInput.addClass('wd-padding-inited');
			}
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.simpleDropdown();
	});

	window.addEventListener('wdUpdatedHeader',function() {
		woodmartThemeModule.simpleDropdown();
	});

})(jQuery);
