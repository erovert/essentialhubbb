var woodmartThemeModule = {};
/* global woodmart_settings */

(function($) {
	woodmartThemeModule.supports_html5_storage = false;

	try {
		woodmartThemeModule.supports_html5_storage = ('sessionStorage' in window && window.sessionStorage !== null);
		window.sessionStorage.setItem('wd', 'test');
		window.sessionStorage.removeItem('wd');
	}
	catch (err) {
		woodmartThemeModule.supports_html5_storage = false;
	}

	woodmartThemeModule.$window = $(window);

	woodmartThemeModule.$document = $(document);

	woodmartThemeModule.$body = $('body');

	woodmartThemeModule.windowWidth = woodmartThemeModule.$window.width();

	woodmartThemeModule.removeURLParameter = function(url, parameter) {
		var urlParts = url.split('?');

		if (urlParts.length >= 2) {
			var prefix = encodeURIComponent(parameter) + '=';
			var pars = urlParts[1].split(/[&;]/g);

			for (var i = pars.length; i-- > 0;) {
				if (pars[i].lastIndexOf(prefix, 0) !== -1) {
					pars.splice(i, 1);
				}
			}

			return urlParts[0] + (pars.length > 0 ? '?' + pars.join('&') : '');
		}

		return url;
	};

	woodmartThemeModule.removeDuplicatedStylesFromHTML = function(html, callback) {
		var $data = $('<div class="temp-wrapper"></div>').append(html);
		var $links = $data.find('link');
		var counter = 0;
		var timeout = false;

		if (0 === $links.length) {
			callback(html);
			return;
		}

		setTimeout(function() {
			if (counter <= $links.length && !timeout) {
				callback($($data.html()));
				timeout = true;
			}
		}, 500);

		$links.each(function() {
			if ( 'undefined' !== typeof $(this).attr('id') && $(this).attr('id').indexOf('theme_settings_') !== -1) {
				$('head').find('link[id*="theme_settings_"]:not([id*="theme_settings_default"])').remove();
			}
		});

		$links.each(function() {
			var $link = $(this);
			var id = $link.attr('id');
			var href = $link.attr('href');

			if ( 'undefined' === typeof id ) {
				return;
			}

			var isThemeSettings = id.indexOf('theme_settings_') !== -1;
			var isThemeSettingsDefault = id.indexOf('theme_settings_default') !== -1;

			$link.remove();

			if ('undefined' === typeof woodmart_page_css[id] && ! isThemeSettingsDefault) {
				if (!isThemeSettings) {
					woodmart_page_css[id] = href;
				}

				$('head').append($link.on('load', function() {
					counter++;

					if (counter >= $links.length && !timeout) {
						callback($($data.html()));
						timeout = true;
					}
				}));
			} else {
				counter++;

				if (counter >= $links.length && !timeout) {
					callback($($data.html()));
					timeout = true;
				}
			}
		});
	};

	woodmartThemeModule.debounce = function(func, wait, immediate) {
		var timeout;
		return function() {
			var context = this;
			var args = arguments;
			var later = function() {
				timeout = null;

				if (!immediate) {
					func.apply(context, args);
				}
			};
			var callNow = immediate && !timeout;

			clearTimeout(timeout);
			timeout = setTimeout(later, wait);

			if (callNow) {
				func.apply(context, args);
			}
		};
	};

	woodmartThemeModule.wdElementorAddAction = function(name, callback) {
		woodmartThemeModule.$window.on('elementor/frontend/init', function() {
			if (!elementorFrontend.isEditMode()) {
				return;
			}

			elementorFrontend.hooks.addAction(name, callback);
		});
	};

	woodmartThemeModule.wdElementorAddAction('frontend/element_ready/global', function($wrapper) {
		$wrapper.removeClass('wd-animation-ready');
		$wrapper.removeClass('wd-animated');
		$wrapper.removeClass('wd-in');

		woodmartThemeModule.$document.trigger('wdElementorGlobalReady');
	});

	$.each([
		'frontend/element_ready/column',
		'frontend/element_ready/container'
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function($wrapper) {
			$wrapper.removeClass('wd-animation-ready');
			$wrapper.removeClass('wd-animated');
			$wrapper.removeClass('wd-in');

			setTimeout(function() {
				woodmartThemeModule.$document.trigger('wdElementorColumnReady');
			}, 100);
		});
	});

	woodmartThemeModule.shopLoadMoreBtn = '.wd-products-load-more.load-on-scroll';

	woodmartThemeModule.$window.on('elementor/frontend/init', function() {
		if (!elementorFrontend.isEditMode()) {
			return;
		}

		if ('enabled' === woodmart_settings.elementor_no_gap) {
			$.each([
				'frontend/element_ready/section',
				'frontend/element_ready/container'
			], function(index, value) {
				woodmartThemeModule.wdElementorAddAction(value, function($wrapper) {
					$wrapper.removeClass('wd-animation-ready');
					$wrapper.removeClass('wd-animated');
					$wrapper.removeClass('wd-in');

					woodmartThemeModule.$document.trigger('wdElementorSectionReady');
				});

				elementorFrontend.hooks.addAction(value, function($wrapper) {
					var cid = $wrapper.data('model-cid');

					if (typeof elementorFrontend.config.elements.data[cid] !== 'undefined') {
						var size = '';

						if ('undefined' !== typeof elementorFrontend.config.elements.data[cid].attributes.elType) {
							if ('container' === elementorFrontend.config.elements.data[cid].attributes.elType) {
								if ( 'boxed' === elementorFrontend.config.elements.data[cid].attributes.content_width ) {
									size = elementorFrontend.config.elements.data[cid].attributes.boxed_width.size;
								} else {
									size = true;
								}
							} else if ('section' === elementorFrontend.config.elements.data[cid].attributes.elType) {
								size = elementorFrontend.config.elements.data[cid].attributes.content_width.size;
							}
						}

						if (!size) {
							$wrapper.addClass('wd-negative-gap');
						}
					}
				});
			});

			elementor.channels.editor.on('change:section change:container', function(view) {
				var changed = view.elementSettingsModel.changed;
				if (typeof changed.content_width !== 'undefined' || typeof changed.boxed_width !== 'undefined') {
					var size = [];

					if ('container' === view.elementSettingsModel.attributes.elType ) {
						if ( typeof changed.boxed_width !== 'undefined' ) {
							size = changed.boxed_width.size;
						}
					} else if (typeof changed.content_width !== 'undefined') {
						size = changed.content_width.size;
					}

					var sectionId = view._parent.model.id;
					var $section = $('.elementor-element-' + sectionId);

					if (size) {
						$section.removeClass('wd-negative-gap');
					} else {
						$section.addClass('wd-negative-gap');
					}
				}
			});
		}
	});

	woodmartThemeModule.$window.on('load', function() {
		$('.wd-preloader').delay(parseInt(woodmart_settings.preloader_delay)).addClass('preloader-hide');
		$('.wd-preloader-style').remove();
		setTimeout(function() {
			$('.wd-preloader').remove();
		}, 200);
	});

	woodmartThemeModule.googleMapsCallback = function () {
		return '';
	};

	var previouslyFocused = null;
	woodmartThemeModule
		.$document
		.on('wdOpenSide wdOpenSearch', '.wd-side-hidden, .wd-fs-menu, [class*=wd-search-full-screen]', function() {
			var side = $(this);

			previouslyFocused = document.activeElement;

			if (!side.attr('tabindex')) {
				side.attr('tabindex', '-1');
			}

			side.trigger('focus');

			$(document).on('focusin.wd', function (e) {
				if(e.target !== side[0] && !side[0].contains(e.target)) {
					side.trigger('focus');
				}
			})
		})
		.on('wdCloseSide wdCloseSearch', '.wd-side-hidden, .wd-fs-menu, [class*=wd-search-full-screen]', function() {
			$(document).off('focusin.wd')

			if (previouslyFocused && document.contains(previouslyFocused)) {
				if (previouslyFocused.closest('.wd-quick-shop, .wd-quick-shop-2')) {
					previouslyFocused = previouslyFocused.closest('.wd-product').querySelector('.product-image-link');
				}

				$(previouslyFocused).trigger('focus');
				previouslyFocused = null;
			}
		});

	woodmartThemeModule.$document.on('keyup', '.wd-role-btn[tabindex]', function(e) {
		if (e.which === 13) {
			$(this).trigger('click');
			e.preventDefault();
		}
	});
})(jQuery);

woodmartThemeModule.slideUp = function ( target, duration = 400 ) {
	target.style.transitionProperty = 'height, margin, padding';
	target.style.transitionDuration = duration + 'ms';
	target.style.boxSizing = 'border-box';
	target.style.height = target.offsetHeight + 'px';
	window.getComputedStyle(target).height
	target.style.overflow = 'hidden';
	target.style.height = 0;
	target.style.paddingTop = 0;
	target.style.paddingBottom = 0;
	target.style.marginTop = 0;
	target.style.marginBottom = 0;

	window.setTimeout( () => {
		target.style.display = 'none';
		target.style.removeProperty('height');
		target.style.removeProperty('padding-top');
		target.style.removeProperty('padding-bottom');
		target.style.removeProperty('margin-top');
		target.style.removeProperty('margin-bottom');
		target.style.removeProperty('overflow');
		target.style.removeProperty('transition-duration');
		target.style.removeProperty('transition-property');
	}, duration);
}

woodmartThemeModule.slideDown = function ( target, duration = 400 ) {
	target.style.removeProperty('display');
	let display = window.getComputedStyle(target).display;

	if ('none' === display) {
		display = 'block';
	}

	target.style.display = display;
	let height = target.offsetHeight;
	target.style.overflow = 'hidden';
	target.style.height = 0;
	target.style.paddingTop = 0;
	target.style.paddingBottom = 0;
	target.style.marginTop = 0;
	target.style.marginBottom = 0;
	window.getComputedStyle(target).height;
	target.style.boxSizing = 'border-box';
	target.style.transitionProperty = "height, margin, padding";
	target.style.transitionDuration = duration + 'ms';
	target.style.height = height + 'px';
	target.style.removeProperty('padding-top');
	target.style.removeProperty('padding-bottom');
	target.style.removeProperty('margin-top');
	target.style.removeProperty('margin-bottom');

	window.setTimeout( () => {
		target.style.removeProperty('height');
		target.style.removeProperty('overflow');
		target.style.removeProperty('transition-duration');
		target.style.removeProperty('transition-property');
	}, duration);
}

woodmartThemeModule.slideToggle = function (target, duration = 400) {
	if (window.getComputedStyle(target).display === 'none') {
		return woodmartThemeModule.slideDown(target, duration);
	} else {
		return woodmartThemeModule.slideUp(target, duration);
	}
}

window.addEventListener('load',function() {
	var events = [
		'keydown',
		'scroll',
		'mouseover',
		'touchmove',
		'touchstart',
		'mousedown',
		'mousemove',
	];

	var triggerListener = function(e) {
		window.dispatchEvent(new CustomEvent('wdEventStarted'));
		removeListener();
	};

	var removeListener = function() {
		events.forEach(function(eventName) {
			window.removeEventListener(eventName, triggerListener);
		});
	};

	var addListener = function(eventName) {
		window.addEventListener(eventName, triggerListener);
	};

	// Add listeners with a small delay to ensure all scripts are loaded.
	setTimeout(function() {
		events.forEach(function(eventName) {
			addListener(eventName);
		});
	}, 100);
});
