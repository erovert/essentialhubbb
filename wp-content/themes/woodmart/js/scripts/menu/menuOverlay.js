(function($) {
	woodmartThemeModule.menuOverlay = function() {
		var hoverSelector = '.wd-header-nav.wd-with-overlay .item-level-0.menu-item-has-children.wd-event-hover, .wd-header-cats.wd-with-overlay .item-level-0.menu-item-has-children.wd-event-hover, .wd-sticky-nav:not(.wd-opened), .wd-header-cats.wd-with-overlay.wd-event-hover, .wd-header-my-account.wd-with-overlay, .wd-header-cart.wd-with-overlay, .wd-header-search.wd-display-dropdown.wd-with-overlay';
		var clickSelector = '.wd-header-nav.wd-with-overlay .item-level-0.menu-item-has-children.wd-event-click, .wd-header-cats.wd-with-overlay .item-level-0.menu-item-has-children.wd-event-click, .wd-header-cats.wd-with-overlay.wd-event-click, .wd-search-form.wd-with-overlay .wd-search-cat';
		var closeSideLastAction = '';
		var $side = $('.wd-close-side');

		woodmartThemeModule.$document.on('mouseleave', hoverSelector, function() {
			var $this = $(this);

			if ( $this.parents('.wd-header-cats.wd-with-overlay.wd-event-click.wd-opened').length ) {
				return;
			}

			$side.trigger('wdCloseSideAction', ['hide', 'hover', 'wd-location-header-sticky wd-location-header wd-location-header-cats wd-location-sticky-nav']);
		});

		woodmartThemeModule.$document.on('mouseenter mousemove', hoverSelector, function() {
			var $this = $(this);

			if ($side.hasClass('wd-close-side-opened') || woodmartThemeModule.$window.width() < 768) {
				return;
			}

			var isInHeader = $this.parents('.whb-header').length;
			var isInCloneHeader = $this.parents('.whb-clone').length;
			var isInCategories = $this.hasClass('wd-sticky-nav');
			var isInHeaderCategories = $this.parents('.wd-header-cats').length;
			var extraClass = '';

			if (isInHeader) {
				if ($this.parents('.whb-sticked').length) {
					extraClass = 'wd-location-header-sticky';
				} else {
					extraClass = 'wd-location-header';
				}
				if (isInHeaderCategories) {
					extraClass += ' wd-location-header-cats';
				}
			} else if (isInCloneHeader) {
				extraClass = 'wd-location-header-sticky';
			} else if (isInCategories) {
				extraClass = 'wd-location-sticky-nav';
			}

			$side.trigger('wdCloseSideAction', ['show', 'hover', extraClass]);
		});

		woodmartThemeModule.$document.on('click', clickSelector, function(e) {
			var $item = $(this);

			if ( $item.parents('.wd-header-cats.wd-with-overlay.wd-event-click.wd-opened').length || $item.parents('.wd-header-cats.wd-with-overlay.wd-event-hover').length ) {
				return;
			}

			setTimeout(function() {
				var action = ! $item.hasClass('wd-opened') ? 'hide' : 'show';

				$side.trigger('wdCloseSideAction', [action, 'click']);
			});
		});

		woodmartThemeModule.$document.on('click touchstart', '.wd-close-side.wd-location-header', function() {
			$(this).removeClass('wd-location-header wd-close-side-opened');
		});

		$side.on('wdCloseSideAction', function( e, type, action, extraClass = 'wd-location-header' ) {
			if ( 'hover' === action && 'click' === closeSideLastAction ) {
				return;
			}

			if ( 'click' === action && 'hide' === type ) {
				closeSideLastAction = '';
			} else {
				closeSideLastAction = action;
			}

			if ( 'show' === type ) {
				$side.addClass('wd-close-side-opened').addClass(extraClass);
			} else {
				$side.removeClass('wd-close-side-opened').removeClass(extraClass);
			}
		});
	};

	['wdEventStarted', 'wdUpdatedHeader'].forEach((eventName) => {
		window.addEventListener(eventName, function () {
			woodmartThemeModule.menuOverlay();
		});
	});
})(jQuery);