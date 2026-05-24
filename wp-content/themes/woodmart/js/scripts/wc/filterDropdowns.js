/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdShopPageInit', function () {
		woodmartThemeModule.filterDropdowns();
	});

	woodmartThemeModule.filterDropdowns = function() {
		function init() {
			$('.wd-widget-layered-nav-dropdown-form, .wd-product-category-filter-form').each(function() {
				var $form = $(this);
				var $select = $form.find('select');
				var slug = $select.data('slug');

				// Destroy existing select2 instance if it exists.
				if ($select.hasClass('select2-hidden-accessible')) {
					// Remove select2 wrapper and restore original select.
					$select.next('.select2-container').remove();
					$select.removeClass('select2-hidden-accessible');
					$select.removeAttr('data-select2-id aria-hidden tabindex');
					$select.removeData('select2');
					$select.find('option').removeAttr('data-select2-id');
				}

				$select.on( 'change', function() {
					var val = $(this).val();
					$('input[name=filter_' + slug + ']').val(val);
				});

				if ($().selectWoo) {
					$select.selectWoo({
						placeholder            : $select.data('placeholder'),
						minimumResultsForSearch: 5,
						width                  : '100%',
						allowClear             : !$select.attr('multiple'),
						language               : {
							noResults: function() {
								return $select.data('noResults');
							}
						}
					}).on('select2:unselecting', function() {
						$(this).data('unselecting', true);
					}).on('select2:opening', function(e) {
						var $this = $(this);

						if ($this.data('unselecting')) {
							$this.removeData('unselecting');
							e.preventDefault();
						}
					});

					$select.on('select2:selecting', handleSingleLevelCatSelecting);
				}
			});

			$('.wd-widget-layered-nav-dropdown__submit, .wd-product-category-filter-submit').on('click', function() {
				var $this = $(this);

				if (!$this.siblings('select').attr('multiple') || !woodmartThemeModule.$body.hasClass('woodmart-ajax-shop-on')) {
					return;
				}

				ajaxAction($this);

				$this.prop('disabled', true);
			});

			$('.wd-widget-layered-nav-dropdown-form select, .wd-product-category-filter-form select').on('change', function() {
				var $this = $(this);

				if (!woodmartThemeModule.$body.hasClass('woodmart-ajax-shop-on')) {
					$this.parent().submit();
					return;
				}

				if ($this.attr('multiple')) {
					return;
				}

				ajaxAction($this);
			});
		}

		function ajaxAction($element) {
			var $form = $element.parent('.wd-widget-layered-nav-dropdown-form, .wd-product-category-filter-form');

			if (!woodmartThemeModule.$body.hasClass('woodmart-ajax-shop-on') || typeof ($.fn.pjax) === 'undefined') {
				return;
			}

			$.pjax({
				container: '.wd-page-content',
				timeout  : woodmart_settings.pjax_timeout,
				url      : $form.attr('action'),
				data     : $form.serialize(),
				scrollTo : false,
				renderCallback: function(context, html, afterRender) {
					woodmartThemeModule.removeDuplicatedStylesFromHTML(html, function(html) {
						context.html(html);
						afterRender();
						woodmartThemeModule.$document.trigger('wdShopPageInit');
						woodmartThemeModule.$document.trigger('wood-images-loaded');
					});
				}
			});
		}

		function handleSingleLevelCatSelecting(e) {
			var selectedData = e.params.args.data;
			var $select = $(this);
			var $option = $select.find('option[value="' + selectedData.id + '"]');
			var optionClass = $option.attr('class') || '';
			var levelMatch = optionClass.match(/level-(\d+)/);
			if (!levelMatch) return;
			var currentLevel = parseInt(levelMatch[1]);

			var $nextSiblings = $option.nextAll('option');
			$nextSiblings.each(function() {
				var cls = $(this).attr('class') || '';
				var m = cls.match(/level-(\d+)/);
				if (m) {
					var lvl = parseInt(m[1]);
					if (lvl > currentLevel) {
						$(this).prop('selected', false);
					} else if (lvl <= currentLevel) {
						return false;
					}
				}
			});

			if (currentLevel > 0) {
				var ancestors = [];
				var $prevSiblings = $option.prevAll('option');
				var searchLevel = currentLevel - 1;
				
				while (searchLevel >= 0) {
					var foundAncestor = false;
					$prevSiblings.each(function() {
						var cls = $(this).attr('class') || '';
						var m = cls.match(/level-(\d+)/);
						if (m) {
							var lvl = parseInt(m[1]);
							if (lvl === searchLevel) {
								ancestors.unshift($(this));
								foundAncestor = true;
								return false;
							}
						}
					});
					
					if (!foundAncestor) {
						break;
					}
					searchLevel--;
				}

				var hasDirectParentSelected = false;
				if (ancestors.length > 0) {
					var directParent = ancestors[ancestors.length - 1];
					hasDirectParentSelected = directParent.prop('selected');
				}

				ancestors.forEach(function(ancestor) {
					if (hasDirectParentSelected) {
						if (ancestor === ancestors[ancestors.length - 1]) {
							ancestor.prop('selected', false);
						}
					} else {
						ancestor.prop('selected', false);
					}
				});
			}
		}

		init();
	};

	$(document).ready(function() {
		woodmartThemeModule.filterDropdowns();
	});
})(jQuery);
