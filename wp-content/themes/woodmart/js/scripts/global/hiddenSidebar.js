/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdPjaxStart wdBackHistory wdShopPageInit', function() {
		woodmartThemeModule.hideShopSidebar();
	});

	woodmartThemeModule.$document.on('wdShopPageInit', function() {
		woodmartThemeModule.hiddenSidebar();
	});

	woodmartThemeModule.hiddenSidebar = function() {
		var position = woodmartThemeModule.$body.hasClass('rtl') ? 'right' : 'left';
		var $sidebarWrapper = $('.wd-content-layout');
		var windowWidth = woodmartThemeModule.windowWidth;

		if ('undefined' !== typeof elementor && elementor.hasOwnProperty('$preview') && elementor.$preview.width()) {
			windowWidth = elementor.$preview.width();
		}

		if ($sidebarWrapper.hasClass('wd-sidebar-hidden-lg') && windowWidth > 1024 || $sidebarWrapper.hasClass('wd-sidebar-hidden-md-sm') && windowWidth <= 1024 && windowWidth > 768 || $sidebarWrapper.hasClass('wd-sidebar-hidden-sm') && windowWidth <= 768) {
			$('.wd-sidebar').addClass('wd-side-hidden wd-' + position + ' wd-scroll');
			$('.wd-sidebar .widget-area').addClass('wd-scroll-content');
		}

		woodmartThemeModule.$body.off('click', '.wd-show-sidebar-btn, .wd-sidebar-opener, .wd-toolbar-sidebar').on('click', '.wd-show-sidebar-btn, .wd-sidebar-opener, .wd-toolbar-sidebar', function(e) {
			e.preventDefault();
			var $btn = $('.wd-show-sidebar-btn, .wd-sidebar-opener');
			var $sidebar = $('.wd-sidebar');

			if (!$sidebar.length) {
				return;
			}

			if ($sidebar.hasClass('wd-opened')) {
				$btn.removeClass('wd-opened');
				woodmartThemeModule.hideShopSidebar();
			} else {
				$(this).addClass('wd-opened');
				showSidebar();
			}
		});

		woodmartThemeModule.$body.on('click touchstart', '.wd-close-side', function() {
			woodmartThemeModule.hideShopSidebar();
		});

		woodmartThemeModule.$body.on('click', '.close-side-widget', function(e) {
			e.preventDefault();

			woodmartThemeModule.hideShopSidebar();
		});

		woodmartThemeModule.$document.on('keyup', function(e) {
			if (e.keyCode === 27) {
				woodmartThemeModule.hideShopSidebar();
			}
		});

		var showSidebar = function() {
			var $sidebarContainer = $('.wd-sidebar');

			$sidebarContainer.addClass('wd-opened');
			$sidebarContainer.trigger('wdOpenSide');
			$('.wd-close-side').addClass('wd-close-side-opened');
		};

		woodmartThemeModule.$document.trigger('wdHiddenSidebarsInited');
	};

	woodmartThemeModule.hideShopSidebar = function() {
		var $sidebarContainer = $('.wd-sidebar');

		if ( $sidebarContainer.hasClass('wd-opened') ) {
			$sidebarContainer.trigger('wdCloseSide');
			$sidebarContainer.removeClass('wd-opened');
			$('.wd-close-side').removeClass('wd-close-side-opened');
			$('.wd-show-sidebar-btn, .wd-sidebar-opener, .wd-toolbar-sidebar').removeClass('wd-opened');
		}
	};

	$(document).ready(function() {
		woodmartThemeModule.hiddenSidebar();
	});
})(jQuery);
