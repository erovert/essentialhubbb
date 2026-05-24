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

/* global woodmart_settings */
(function($) {
	$.each([
		'frontend/element_ready/wd_blog.default',
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.blogLoadMore();
		});
	});

	woodmartThemeModule.blogLoadMore = function() {
		var btnClass = '.wd-blog-load-more.load-on-scroll',
		    process  = false;

		woodmartThemeModule.clickOnScrollButton(btnClass, false, false);

		$('.wd-blog-load-more').on('click', function(e) {
			e.preventDefault();

			var $this = $(this);

			if (process || $this.hasClass('no-more-posts')) {
				return;
			}

			process = true;

			var holder   = $this.parent().siblings('.wd-blog-holder'),
			    source   = holder.data('source'),
			    action   = 'woodmart_get_blog_' + source,
			    ajaxurl  = woodmart_settings.ajaxurl,
			    dataType = 'json',
			    method   = 'POST',
			    atts     = holder.data('atts'),
			    paged    = holder.data('paged');

			$this.addClass('loading');

			var data = {
				atts  : atts,
				paged : paged,
				action: action
			};

			if (source === 'main_loop') {
				ajaxurl = $this.attr('href');
				method = 'GET';
				data = atts ? { atts: atts } : {};
			}

			$.ajax({
				url     : ajaxurl,
				data    : data,
				dataType: dataType,
				method  : method,
				success : function(data) {
					woodmartThemeModule.removeDuplicatedStylesFromHTML(data.items, function(html) {
						var items = $(html);

						if (items) {
							if (holder.hasClass('wd-masonry')) {
								holder.append(items).isotope('appended', items);
								holder.imagesLoaded().progress(function() {
									holder.isotope('layout');
									woodmartThemeModule.clickOnScrollButton(btnClass, true, false);
								});
							} else {
								holder.append(items);
								holder.imagesLoaded().progress(function() {
									woodmartThemeModule.clickOnScrollButton(btnClass, true, false);
								});
							}

							if ('yes' === woodmart_settings.load_more_button_page_url_opt && 'no' !== woodmart_settings.load_more_button_page_url && data.currentPage){
								window.history.pushState('', '', data.currentPage);
							}
							holder.data('paged', paged + 1);

							if (source === 'main_loop') {
								$this.attr('href', data.nextPage);
								if (data.status === 'no-more-posts') {
									$this.parent().hide().remove();
								}
							}
						}

						if (data.status === 'no-more-posts') {
							$this.addClass('no-more-posts');
							$this.parent().hide();
						}
					});
				},
				error   : function() {
					console.log('ajax error');
				},
				complete: function() {
					$this.removeClass('loading');
					process = false;
				}
			});
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.blogLoadMore();
	});
})(jQuery);

(function($) {
	$.each([
		'frontend/element_ready/wd_accordion.default',
		'frontend/element_ready/wd_single_product_tabs.default',
		'frontend/element_ready/wd_single_product_reviews.default'
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function($wrapper) {
			woodmartThemeModule.accordion();

			$('.wc-tabs-wrapper, .woocommerce-tabs').trigger('init');
			$wrapper.find('#rating').parent().find('> .stars').remove();
			$wrapper.find('#rating').trigger('init');
		});
	});

	var triggerReviewOpener = function() {
		$('.tabs-layout-accordion .wd-accordion-title.tab-title-reviews:not(.active)').click();
	}

	woodmartThemeModule.accordion = function() {
		var hash = window.location.hash;
		var url = window.location.href;

		// Single product.
		$('.woocommerce-review-link')
			.off('click', triggerReviewOpener)
			.on('click', triggerReviewOpener);

		// Element.
		$('.wd-accordion').each(function() {
			var $wrapper = $(this);
			var $tabTitles = $wrapper.find('> .wd-accordion-item > .wd-accordion-title');
			var $tabContents = $wrapper.find('> .wd-accordion-item > .wd-accordion-content');
			var activeClass = 'wd-active';
			var state = $wrapper.data('state');
			var time = 300;

			if ($wrapper.hasClass('wd-inited')) {
				return;
			}

			var isTabActive = function(tabIndex) {
				return $tabTitles.filter('[data-accordion-index="' + tabIndex + '"]').hasClass(activeClass);
			};

			var activateTab = function(tabIndex) {
				var $requestedTitle = $tabTitles.filter('[data-accordion-index="' + tabIndex + '"]');
				var $requestedContent = $tabContents.filter('[data-accordion-index="' + tabIndex + '"]');

				$requestedTitle.addClass(activeClass);
				$requestedContent.stop(true, true).slideDown(time).addClass(activeClass);

				if ('first' === state && !$wrapper.hasClass('wd-inited')) {
					if (! $requestedContent.length) {
						$requestedContent = $tabContents.first();
					}

					$requestedContent.stop(true, true).show().css('display', 'block');
				}

				$wrapper.addClass('wd-inited');

				woodmartThemeModule.$document.trigger('resize.vcRowBehaviour');
				woodmartThemeModule.$document.trigger('wood-images-loaded');
			};

			var deactivateActiveTab = function() {
				var $activeTitle = $tabTitles.filter('.' + activeClass);
				var $activeContent = $tabContents.filter('.' + activeClass);

				$activeTitle.removeClass(activeClass);
				$activeContent.stop(true, true).slideUp(time).removeClass(activeClass);
			};

			var getFirstTabIndex = function() {
				return $tabTitles.first().data('accordion-index');
			};

			if ('first' === state) {
				activateTab(getFirstTabIndex());
			}

			$tabTitles.off('click').on('click', function() {
				var $this = $(this);
				var tabIndex = $(this).data('accordion-index');
				var isActiveTab = isTabActive(tabIndex);

				var currentIndex = $this.parent().index();
				var oldIndex = $this.parent().siblings().find('.wd-active').parent('.wd-tab-wrapper').index();

				if ($this.hasClass('wd-active') || currentIndex === -1) {
					oldIndex = currentIndex;
				}

				if (isActiveTab || $this.hasClass(activeClass)) {
					deactivateActiveTab();
				} else {
					deactivateActiveTab();
					activateTab(tabIndex);

					if ( ! $tabTitles.filter('[data-accordion-index="' + tabIndex + '"]').length ) {
						$this.addClass(activeClass);
						$this.siblings('.wd-accordion-content').stop(true, true).slideDown(time).addClass(activeClass)
					}
				}

				if ($this.parents('.tabs-layout-accordion').length || $this.parents('.wd-single-tabs').length) {
					setTimeout(function() {
						if (woodmartThemeModule.$window.width() < 1024 && currentIndex > oldIndex) {
							var $header = $('.whb-sticky-header');
							var headerHeight = $header.length > 0 ? $header.outerHeight() : 0;
							$('html, body').animate({
								scrollTop: $this.offset().top - $this.outerHeight() - headerHeight - 50
							}, 500);
						}
					}, time);
				}
			});

			if (hash.toLowerCase().indexOf('comment-') >= 0 || hash === '#reviews' || hash === '#tab-reviews' || url.indexOf('comment-page-') > 0 || url.indexOf('cpage=') > 0) {
				$wrapper.find('.tab-title-reviews').trigger('click');
			}
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.accordion();
	});
})(jQuery);
/* global woodmart_settings */
(function($) {
	$.each([
		'frontend/element_ready/wd_banner_carousel.default',
		'frontend/element_ready/wd_banner.default',
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.bannersHover();
		});
	});

	woodmartThemeModule.bannersHover = function() {
		if (typeof ($.fn.panr) === 'undefined') {
			return;
		}

		$('.promo-banner.banner-hover-parallax, .wp-block-wd-banner.wd-hover-parallax').panr({
			sensitivity         : 20,
			scale               : false,
			scaleOnHover        : true,
			scaleTo             : 1.15,
			scaleDuration       : .34,
			panY                : true,
			panX                : true,
			panDuration         : 0.5,
			resetPanOnMouseLeave: true
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.bannersHover();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.buttonSmoothScroll = function() {
		$('.wd-button-wrapper.wd-smooth-scroll a').on('click', function(e) {
			e.stopPropagation();
			e.preventDefault();

			var $button = $(this);
			var time = $button.parent().data('smooth-time');
			var offset = $button.parent().data('smooth-offset');
			var hash = $button.attr('href').split('#')[1];

			var $anchor = $('#' + hash);

			if ($anchor.length < 1) {
				return;
			}

			var position = $anchor.offset().top;

			$('html, body').animate({
				scrollTop: position - offset
			}, time);
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.buttonSmoothScroll();
	});
})(jQuery);

(function($) {
	woodmartThemeModule.$document.on('wdShopPageInit', function () {
		woodmartThemeModule.buttonShowMore();
	});

	$.each([
		'frontend/element_ready/wd_button.default',
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.buttonShowMore();
		});
	});

	woodmartThemeModule.buttonShowMore = function () {
		$('.wd-collapsible-content, .wp-block-wd-collapsible-content').each(function() {
			var $this = $(this);
			var $button = $this.find('.wd-collapsible-button, > .wp-block-wd-button');

			$button.on('click', function(e) {
				e.preventDefault();

				$this.toggleClass('wd-opened');

				if ($this.data('alt-text')) {
					var $buttonText = $button.find('span');
					var text = $buttonText.text();
					$buttonText.text($this.data('alt-text'));
					$this.data('alt-text', text);
				}
			});
		});
	}

	$(document).ready(function() {
		woodmartThemeModule.buttonShowMore();
	});
})(jQuery);
jQuery.each([
	'frontend/element_ready/wd_compare_img.default'
], function(index, value) {
	woodmartThemeModule.wdElementorAddAction(value, function() {
		woodmartThemeModule.compareImages();
	});
});

woodmartThemeModule.compareImages = function() {
	var containers = document.querySelectorAll('.wd-compare-img');

	containers.forEach(function(container) {
		addDraggingEvents(container);
	});

	function addDraggingEvents(container) {
		var isDragging = false;

		// Mouse event handlers.
		container.addEventListener('mousedown', function(e) {
			isDragging = true;
			moveSlider(e, container);
		});

		document.addEventListener('mouseup', function() {
			isDragging = false;
		});

		container.addEventListener('mousemove', function(e) {
			if (!isDragging) {
				return;
			}

			moveSlider(e, container);
		});

		// Event handlers for sensory devices.
		container.addEventListener('touchstart', function(e) {
			isDragging = true;
			moveSlider(e.touches[0], container);
		}, {passive: true});
	
		document.addEventListener('touchend', function() {
			isDragging = false;
		}, {passive: true});
	
		container.addEventListener('touchmove', function(e) {
			if (!isDragging) {
				return;
			}

			moveSlider(e.touches[0], container);
		}, {passive: true});
	}

	// Move the slider to the click position or the drag position.
	function moveSlider(e, container) {
		var containerRect = container.getBoundingClientRect();
		var offsetX       = e.clientX - containerRect.left;

		if (offsetX < 0) {
			offsetX = 0;
		}

		if (offsetX > containerRect.width) {
			offsetX = containerRect.width;
		}

		var widthPercentage = ( (offsetX / containerRect.width) * 100).toFixed(3);

		// Update the CSS variable
		container.style.setProperty('--wd-compare-handle-pos', `${widthPercentage}%`);
	}
}

window.addEventListener('load', function() {
	woodmartThemeModule.compareImages();
});

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

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdProductsTabsLoaded wdSearchFullScreenContentLoaded wdUpdateWishlist wdShopPageInit wdArrowsLoadProducts wdLoadMoreLoadProducts wdRecentlyViewedProductLoaded', function () {
		woodmartThemeModule.countDownTimer();
	});

	$.each([
		'frontend/element_ready/wd_products.default',
		'frontend/element_ready/wd_products_tabs.default',
		'frontend/element_ready/wd_countdown_timer.default',
		'frontend/element_ready/wd_single_product_countdown.default',
		'frontend/element_ready/wd_banner.default',
		'frontend/element_ready/wd_banner_carousel.default',
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.countDownTimer();
		});
	});

	woodmartThemeModule.countDownTimer = function() {
		$('.wd-timer').each(function() {
			var $this = $(this);
			var timezone = $this.data('timezone') ? $this.data('timezone') : woodmart_settings.countdown_timezone;

			dayjs.extend(window.dayjs_plugin_utc);
			dayjs.extend(window.dayjs_plugin_timezone);
			var time = dayjs.tz($this.data('end-date'), timezone);

			$this.countdown(time.toDate(), function(event) {
				if ( 'yes' === $this.data('hide-on-finish') && 'finish' === event.type ) {
					$this.parent().addClass('wd-hide');
				}

				$this.find('.wd-timer-days .wd-timer-value').text(event.strftime('%-D'))
				$this.find('.wd-timer-hours .wd-timer-value').text(event.strftime('%H'))
				$this.find('.wd-timer-min .wd-timer-value').text(event.strftime('%M'))
				$this.find('.wd-timer-sec .wd-timer-value').text(event.strftime('%S'))
			});
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.countDownTimer();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	$.each([
		'frontend/element_ready/wd_counter.default'
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.visibleElements();
		});
	});

	woodmartThemeModule.counterShortcode = function(counter) {
		if (counter.attr('data-state') === 'done' || counter.attr('data-state') === 'process') {
			return;
		}

		counter.prop('Counter', counter.text()).animate({
			Counter: counter.data('final')
		}, {
			duration: parseInt(woodmart_settings.animated_counter_speed),
			easing  : 'swing',
			step    : function(now) {
				if (now >= counter.data('final')) {
					counter.attr('data-state', 'done');
				} else {
					counter.attr('data-state', 'process');
				}

				counter.text(Math.ceil(now));
			}
		});
	};

	woodmartThemeModule.visibleElements = function() {
		$('.woodmart-counter .counter-value, .wp-block-wd-animated-counter span').each(function() {
			var $this = $(this);

			$this.waypoint(function() {
				woodmartThemeModule.counterShortcode($this);
			}, {offset: '100%'});
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.visibleElements();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	$.each([
		'frontend/element_ready/wd_google_map.default',
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.googleMapInit();
		});
	});

	woodmartThemeModule.googleMapInit = function() {
		$('.google-map-container').each(function() {
			var $map = $(this);
			var data = $map.data('map-args');

			var config = {
				controls_on_map: false,
				map_div        : '#' + data.selector,
				start          : 1,
				map_options    : {
					zoom       : parseInt(data.zoom),
					scrollwheel: 'yes' === data.mouse_zoom
				}
			};

			if ( 'yes' === data.multiple_markers ) {
				config.locations = data.markers.map( marker => {
					var location = {
						lat      : marker.marker_lat,
						lon      : marker.marker_lon,
						image    : marker.marker_icon ? marker.marker_icon : data.marker_icon,
						image_w  : 40,
						image_h  : 40,
						animation: google.maps.Animation.DROP,
					}

					if ( marker.marker_icon_size ) {
						location.image_w = marker.marker_icon_size[0];
						location.image_h = marker.marker_icon_size[1];
					} else if ( data.marker_icon_size ) {
						location.image_w = data.marker_icon_size[0];
						location.image_h = data.marker_icon_size[1];
					}

					if ( marker.marker_title || marker.marker_description ) {
						location.html = `<h3 style="min-width:300px; text-align:center; margin:15px;">${marker.marker_title}</h3>${marker.marker_description}`;
					}

					return location;
				});

				if ( data.hasOwnProperty('center') ) {
					config.start = 0;
					config.map_options.set_center = data.center.split(',').map( function ( el ) {
						return parseFloat( el );
					});
				}
			} else {
				config.locations = [
					{
						lat      : data.latitude,
						lon      : data.longitude,
						image    : data.marker_icon,
						image_w  : data.marker_icon_size && data.marker_icon_size[0] ? data.marker_icon_size[0] : 40,
						image_h  : data.marker_icon_size && data.marker_icon_size[1] ? data.marker_icon_size[1] : 40,
						animation: google.maps.Animation.DROP
					}
				];

				if ('yes' === data.marker_text_needed) {
					config.locations[0].html = data.marker_text;
				}
			}

			if (data.json_style && !data.elementor) {
				config.styles = {};
				config.styles[woodmart_settings.google_map_style_text] = JSON.parse(data.json_style);
			} else if (data.json_style && data.elementor) {
				config.styles = {};
				config.styles[woodmart_settings.google_map_style_text] = JSON.parse(atob(data.json_style));
			}

			if ('button' === data.init_type) {
				$map.find('.wd-init-map').on('click', function(e) {
					e.preventDefault();

					if ($map.hasClass('wd-map-inited')) {
						return;
					}

					$map.addClass('wd-map-inited');
					new Maplace(config).Load();
				});
			} else if ('scroll' === data.init_type) {
				woodmartThemeModule.$window.on('scroll', function() {
					if (window.innerHeight + woodmartThemeModule.$window.scrollTop() + parseInt(data.init_offset) > $map.offset().top) {
						if ($map.hasClass('wd-map-inited')) {
							return;
						}

						$map.addClass('wd-map-inited');
						new Maplace(config).Load();
					}
				});
			} else if ('interaction' === data.init_type) {
				window.addEventListener('wdEventStarted', function () {
					if ($map.hasClass('wd-map-inited')) {
						return;
					}

					$map.addClass('wd-map-inited');
					new Maplace(config).Load();
				});
			} else {
				new Maplace(config).Load();
			}
		});

		var $gmap = $('.google-map-container-with-content');

		woodmartThemeModule.$window.on('resize', function() {
			$gmap.css({
				'height': $gmap.find('.wd-google-map.with-content').outerHeight()
			});
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.googleMapInit();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	$.each([
		'frontend/element_ready/wd_image_hotspot.default',
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.imageHotspot();
		});
	});

	woodmartThemeModule.$document.on('wdShopPageInit', function() {
		woodmartThemeModule.imageHotspot();
	});

	woodmartThemeModule.imageHotspot = function() {
		$('.wd-image-hotspot, .wd-spot').each(function() {
			var _this = $(this);
			var btn = _this.find('.hotspot-btn, .wd-spot-icon');
			var parentWrapper = _this.parents('.wd-spots');

			if (!parentWrapper.hasClass('wd-event-click') && woodmartThemeModule.$window.width() > 1024) {
				return;
			}

			btn.on('click', function() {
				if (_this.hasClass('wd-opened')) {
					_this.removeClass('wd-opened');
				} else {
					_this.addClass('wd-opened');
					_this.siblings().removeClass('wd-opened');
				}

				setContentPosition();
				woodmartThemeModule.$document.trigger('wood-images-loaded');
				return false;
			});

			woodmartThemeModule.$document.on('click', function(e) {
				var target = e.target;

				if (_this.hasClass('wd-opened') && (!$(target).is('.wd-image-hotspot') || !$(target).is('.wd-spot')) && (!$(target).parents().is('.wd-image-hotspot') && !$(target).parents().is('.wd-spot'))) {
					_this.removeClass('wd-opened');
					return false;
				}
			});
		});

		//Image loaded
		$('.wd-spots').each(function() {
			var _this = $(this);
			_this.imagesLoaded(function() {
				_this.addClass('wd-loaded');
			});
		});

		function setContentPosition() {
			$('.wd-image-hotspot .hotspot-content, .wd-spot .wd-spot-dropdown').each(function() {
				var content = $(this);
				var isBlock = content.parents('.wp-block-wd-hotspot').length;

				content.removeClass('hotspot-overflow-right hotspot-overflow-left');
				content.attr('style', '');

				var offsetLeft = content.offset().left;
				var offsetRight = woodmartThemeModule.$window.width() - (offsetLeft + content.outerWidth());

				if (woodmartThemeModule.windowWidth > 768 && !isBlock) {
					if (offsetLeft <= 0) {
						content.addClass('hotspot-overflow-right');
					}
					if (offsetRight <= 0) {
						content.addClass('hotspot-overflow-left');
					}
				}

				if (woodmartThemeModule.windowWidth <= 768 || isBlock && woodmartThemeModule.windowWidth <= 1024) {
					if (offsetLeft <= 0) {
						content.css('marginLeft', Math.abs(offsetLeft - 15) + 'px');
					}
					if (offsetRight <= 0) {
						content.css('marginLeft', offsetRight - 15 + 'px');
					}
				}
			});
		}
	};

	$(document).ready(function() {
		woodmartThemeModule.imageHotspot();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	$.each([
		'frontend/element_ready/wd_images_gallery.default'
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.imagesGalleryMasonry();
			woodmartThemeModule.imagesGalleryJustified();
		});
	});

	woodmartThemeModule.imagesGalleryMasonry = function() {
		if (typeof ($.fn.isotope) == 'undefined' || typeof ($.fn.imagesLoaded) == 'undefined') {
			return;
		}

		var $container = $('.wd-images-gallery .wd-masonry, .wp-block-wd-gallery.wd-masonry');

		$container.imagesLoaded(function() {
			$container.isotope({
				gutter      : 0,
				isOriginLeft: !woodmartThemeModule.$body.hasClass('rtl'),
				itemSelector: '[class*="wd-gallery-item"]'
			});
		});
	};

	woodmartThemeModule.imagesGalleryJustified = function() {
		$('.wd-images-gallery .wd-justified').each(function() {
			$(this).justifiedGallery({
				margins     : 1,
				cssAnimation: true
			});
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.imagesGalleryMasonry();
		woodmartThemeModule.imagesGalleryJustified();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	$.each([
		'frontend/element_ready/wd_infobox_carousel.default',
		'frontend/element_ready/wd_infobox.default'
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.infoboxSvg();
		});
	});

	woodmartThemeModule.infoboxSvg = function() {
		$('.wd-info-box.with-animation').each(function() {
			var $this = $(this);

			if ($this.find('.info-svg-wrapper > svg').length > 0) {
				new Vivus($this.find('.info-svg-wrapper > svg')[0], {
					type              : 'delayed',
					duration          : 200,
					start             : 'inViewport',
					animTimingFunction: Vivus.EASE_OUT
				}, function() {});
			}
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.infoboxSvg();
	});
})(jQuery);

jQuery(window).on('elementor/frontend/init', function(){
	if (window.elementorFrontend) {
		elementorFrontend.hooks.addFilter( 'frontend/handlers/menu_anchor/scroll_top_distance', function(scrollTop) {
			var stickyElementsHeight = 0;
			var stickyRows           = jQuery('.whb-sticky-row');
			
			if (0 === stickyRows.length) {
				return scrollTop;
			}

			stickyRows.each(function() {
				stickyElementsHeight += jQuery(this).height();
			});

			return scrollTop - stickyElementsHeight;
		});
	}
});
(function($) {
	woodmartThemeModule.$document.on('wdShopPageInit', function () {
		woodmartThemeModule.offCanvasColumnBtn();
	});

	$.each([
		'frontend/element_ready/column',
		'frontend/element_ready/container',
		'frontend/element_ready/wd_builder_off_canvas_column_btn.default'
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.offCanvasColumnBtn();
		});
	});

	woodmartThemeModule.offCanvasColumnBtn = function() {
		var $closeSide = $('.wd-close-side');
		var $colOffCanvas = $('[class*="wd-col-offcanvas"], .wp-block-wd-off-sidebar');
		var alignment = $colOffCanvas.hasClass('wd-alignment-left') || $colOffCanvas.hasClass('wd-left') ? 'left' : 'right';
		var $openButton = $('.wd-off-canvas-btn, .wd-off-canvas-btn ~ .wd-sidebar-opener, .wd-toolbar-sidebar');
		var innerWidth = woodmartThemeModule.$window.width();

		var offCanvassInit = function() {
			if (! $colOffCanvas.hasClass( 'wp-block-wd-off-sidebar' )) {
				$colOffCanvas.removeClass('wd-left wd-right').addClass('wd-' + alignment);
			}

			$colOffCanvas.addClass('wd-side-hidden wd-inited');

			if (0 === $colOffCanvas.find('.wd-heading').length) {
				$colOffCanvas.prepend(
					'<div class="wd-heading"><div class="close-side-widget wd-action-btn wd-style-text wd-cross-icon"><a href="#" rel="nofollow">' + woodmart_settings.off_canvas_column_close_btn_text + '</a></div></div>'
				);
			}

			$openButton.on('click', function(e) {
				e.preventDefault();

				if (! $colOffCanvas.length) {
					return;
				}

				$colOffCanvas.trigger('wdOpenSide')
				$colOffCanvas.addClass('wd-scroll wd-opened');
				$closeSide.addClass('wd-close-side-opened');
				$openButton.addClass('wd-opened');

				$colOffCanvas.find(' .elementor-widget-wrap').first().addClass('wd-scroll-content');

				if ($colOffCanvas.hasClass( 'wp-block-wd-off-sidebar' )) {
					$colOffCanvas.find('> .widget-area').addClass('wd-scroll-content');
				}
			});
		};

		if ($colOffCanvas.hasClass('wp-block-wd-off-sidebar') && (($colOffCanvas.hasClass('wd-hide-lg') && innerWidth >= 1024) || ($colOffCanvas.hasClass('wd-hide-md-sm') && 768 <= innerWidth && innerWidth <= 1024) || ($colOffCanvas.hasClass('wd-hide-sm') && innerWidth <= 767))) {
			offCanvassInit();
		} else if ('elementor' === woodmart_settings.current_page_builder && (($colOffCanvas.hasClass('wd-col-offcanvas-lg') && innerWidth >= 1024) || ($colOffCanvas.hasClass('wd-col-offcanvas-md-sm') && 768 <= innerWidth && innerWidth <= 1024) || ($colOffCanvas.hasClass('wd-col-offcanvas-sm') && innerWidth <= 767))) {
			offCanvassInit();
		} else if ('wpb' === woodmart_settings.current_page_builder && (($colOffCanvas.hasClass('wd-col-offcanvas-lg') && innerWidth >= 1200) || ($colOffCanvas.hasClass('wd-col-offcanvas-md-sm') && 769 <= innerWidth && innerWidth <= 1199) || ($colOffCanvas.hasClass('wd-col-offcanvas-sm') && innerWidth <= 768))) {
			offCanvassInit();
		} else if ( $colOffCanvas.hasClass( 'wd-side-hidden' ) ) {
			$openButton.off('click');
			$('.wp-block-wd-off-sidebar').removeClass('wd-side-hidden wd-inited wd-scroll wd-opened');
			$('.elementor-column, .e-con').removeClass('wd-side-hidden wd-inited wd-scroll wd-opened wd-left wd-right');
			$('.wpb_column').removeClass('wd-side-hidden wd-inited wd-scroll wd-opened wd-left wd-right');
			$closeSide.removeClass('wd-close-side-opened');
			$openButton.removeClass('wd-opened');
			$colOffCanvas.find(' .elementor-widget-wrap').first().removeClass('wd-scroll-content');
			$colOffCanvas.find('.wd-heading').remove();
		}

		$openButton.on('click', function(e) {
			e.preventDefault();
		});

		woodmartThemeModule.$body.on('pjax:beforeSend', function() {
			$('.wd-close-side, .close-side-widget').trigger('click');
		});

		woodmartThemeModule.$body.on('click touchstart', '.wd-close-side', function(e) {
			e.preventDefault();

			closeOffCanvas();
		});

		woodmartThemeModule.$body.on('click', '.close-side-widget', function(e) {
			e.preventDefault();

			closeOffCanvas();
		});

		woodmartThemeModule.$document.on('keyup', function(e) {
			if (e.keyCode === 27 && $colOffCanvas.hasClass('wd-opened')) {
				closeOffCanvas();
			}
		});

		function closeOffCanvas() {
			$colOffCanvas.trigger('wdCloseSide')

			$colOffCanvas.removeClass('wd-opened');
			$closeSide.removeClass('wd-close-side-opened');
			$openButton.removeClass('wd-opened');
		}
	};

	woodmartThemeModule.$window.on('resize', woodmartThemeModule.debounce(function() {
		woodmartThemeModule.offCanvasColumnBtn();
	}, 300));

	$(document).ready(function() {
		woodmartThemeModule.offCanvasColumnBtn();
	});
})(jQuery);
/* global woodmart_settings */
(function($) {
	$.each([
		'frontend/element_ready/wd_open_street_map.default',
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.wdOpenStreetMap();
		});
	});

	woodmartThemeModule.wdOpenStreetMap = function () {
		if ( 'undefined' === typeof leaflet ) {
			return;
		}

		/**
		 * Helper to add markers to our map.
		 *
		 * @param map map instance.
		 * @param markers list of markers.
		 */
		const buildMarkers = function ( map, markers ) {
			$.each(markers, function () {
				let $thisMarker   = this.marker;
				let markerOptions = $thisMarker.hasOwnProperty('markerOptions') ? $thisMarker.markerOptions : {};
				let marker        = L.marker( [this.lat, this.lng], markerOptions );

				// add marker to map
				marker.addTo(map);

				// prep tooltip content
				let tooltipContent = '<div class="marker-tooltip">';

				// add marker title
				if (this.marker.marker_title) {
					tooltipContent += `<div class="marker-title"><h5 class="title">${this.marker.marker_title}</h5></div>`;
				}

				// marker content
				tooltipContent += '<div class="marker-content">';

				// add marker description
				if (this.marker.marker_description) {
					tooltipContent += `<div class="marker-description">${this.marker.marker_description}</div>`;
				}

				// add marker button
				if (this.marker.show_button === 'yes' && this.marker.button_text) {
					let button_url_target = this.marker.hasOwnProperty('button_url_target') && this.marker.button_url_target ? this.marker.button_url_target : '_blank';
					tooltipContent += `<div class="marker-button">
                                                <a class="btn" target="${button_url_target}" href='${this.marker.button_url}' role="button">
                                                   ${this.marker.button_text}
                                                </a>
                                            </div>`;
				}

				tooltipContent += '</div>';
				tooltipContent += '</div>';

				// Add tooltip / popup to marker.
				if (this.marker.marker_title || this.marker.marker_description || this.marker.button_text && this.marker.show_button) {
					let markerBehavior = this.marker.hasOwnProperty('marker_behavior') ? this.marker.marker_behavior : null;
					switch (markerBehavior) {
						case 'popup':
							marker.bindPopup(tooltipContent);
							break;

						case 'static_close_on':
							marker.bindPopup(tooltipContent,{closeOnClick: false, autoClose: false, closeOnEscapeKey: false}).openPopup();
							break;

						case 'static_close_off':
							marker.bindPopup(tooltipContent,{closeOnClick: false, autoClose: false, closeButton: false, closeOnEscapeKey: false}).openPopup();
							break;

						case 'tooltip':
							let tooltipOptions = {};

							marker.bindTooltip(tooltipContent, tooltipOptions);
							break;
					}
				}
			});

			setTimeout(function () {
				map.invalidateSize();
			}, 100);
		};

		/**
		 * Check whether we can render our map based on provided coordinates.
		 *
		 * @param markers list of markers.
		 */
		const canRenderMap = function ( markers ) {
			if ( ! markers ) {
				return false;
			}

			return markers.filter( function ( marker ) {
				return ! isNaN( marker.lat ) && ! isNaN( marker.lng )
			}).length > 0;
		}

		const mapInit = function ( $map, settings ) {
			let mapId         = $map.attr('id');
			let center        = settings.hasOwnProperty('center') ? settings.center : null;
			let markers       = settings.hasOwnProperty('markers') ? settings.markers : [];

			// Avoid recreating the html element.
			if ( undefined !== L.DomUtil.get( mapId ) && L.DomUtil.get( mapId ) ) {
				L.DomUtil.get(mapId)._leaflet_id = null;
			}

			const map = L.map( mapId, {
				scrollWheelZoom: settings.hasOwnProperty('scrollWheelZoom') && 'yes' === settings.scrollWheelZoom,
				zoomControl    : settings.hasOwnProperty('zoomControl') && 'yes' === settings.zoomControl,
				dragging       : settings.hasOwnProperty('dragging') && 'yes' === settings.dragging,
			});

			if ( center ) {
				map.setView( center.split(','), settings.zoom );
			}

			if ( ! settings.hasOwnProperty('geoapify_tile') || 'osm-carto' === settings.geoapify_tile || ( 'custom-tile' === settings.geoapify_tile && ( ! settings.hasOwnProperty('geoapify_custom_tile') ||  0 === settings.geoapify_custom_tile.length ) ) ) {
				L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
					attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
					maxZoom: 18
				}).addTo(map);
			}else if ( 'stamen-toner' === settings.geoapify_tile ) {
				L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png', {
					attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
					maxZoom: 18
				}).addTo(map);
			}else if ( 'stamen-terrain' === settings.geoapify_tile ) {
				L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png', {
					attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
					maxZoom: 18
				}).addTo(map);
			}else if ( 'stamen-watercolor' === settings.geoapify_tile ) {
				L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg', {
					attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.',
					maxZoom: 18
				}).addTo(map);
			}else if ( 'custom-tile' === settings.geoapify_tile && settings.hasOwnProperty('geoapify_custom_tile') &&  0 !== settings.geoapify_custom_tile.length ) {
				let tileUrl = settings.geoapify_custom_tile;
				tileUrl     = tileUrl.replaceAll( '$', '' );

				L.tileLayer( tileUrl, {
					attribution: `<a href="${ settings.osm_custom_attribution_url ? settings.osm_custom_attribution_url : null }" target="_blank"> ${settings.osm_custom_attribution ? settings.osm_custom_attribution : null} </a> | © OpenStreetMap <a href="https://www.openstreetmap.org/copyright" target="_blank">contributors</a>`,
					maxZoom: 18
				}).addTo(map);
			}

			if ( ! canRenderMap( markers ) ) {
				let lat = 51.50735;
				let lng = -0.12776;

				markers.push({
					lat: lat,
					lng: lng,
					marker: {
						button_text: "",
						button_url: "",
						marker_coords: {
							lat,
							lng
						},
						marker_description: "",
						marker_title: "",
						show_button: "no"
					}
				});

				map.setView([lat, lng], settings.zoom);
			}

			$.each(markers, function () {
				let $thisMarker = this.marker;

				if ($thisMarker.hasOwnProperty('image') && $thisMarker.hasOwnProperty('image_size') && ( ( $thisMarker.image.hasOwnProperty('url') && $thisMarker.image.url.length > 0 ) || ( 'string' === typeof $thisMarker.image && $thisMarker.image.length > 0 ) ) ) {
					let iconUrl = null;

					if ( $thisMarker.image.hasOwnProperty('url') && $thisMarker.image.url.length > 0 ) {
						iconUrl = $thisMarker.image.url
					} else if ( 'string' === typeof $thisMarker.image && $thisMarker.image.length > 0 ) {
						iconUrl = $thisMarker.image
					}

					$thisMarker['markerOptions'] = {
						icon: L.icon({
							iconUrl,
							iconSize: $thisMarker.image_size,
						}),
					}
				} else {
					$thisMarker['markerOptions'] = {
						icon: L.icon({
							iconUrl: settings.hasOwnProperty('iconUrl') ? settings.iconUrl : null,
							iconSize: settings.hasOwnProperty('iconSize') ? settings.iconSize : [ 25, 41 ],
						}),
					}
				}
			});

			buildMarkers( map, markers );
		}

		$('.wd-osm-map-container').each(function() {
			let $mapContainer = $(this);
			let $map          = $mapContainer.find('.wd-osm-map-wrapper');
			let settings      = $map.data('settings');

			if ( ! settings ) {
				return;
			}

			if ( $mapContainer.closest('.wd-popup').length > 0 && ! $mapContainer.hasClass('wd-map-inited') ) {
				woodmartThemeModule.$document.on('wdOpenPopup', function() {
					if ($mapContainer.hasClass('wd-map-inited')) {
						return;
					}

					$mapContainer.addClass('wd-map-inited');
					mapInit($map, settings);
				});
			} else if ( settings.hasOwnProperty( 'init_type' ) && 'button' === settings.init_type) {
				$mapContainer.find('.wd-init-map').on('click', function(e) {
					e.preventDefault();

					if ($mapContainer.hasClass( 'wd-map-inited')) {
						return;
					}

					$mapContainer.addClass('wd-map-inited');
					mapInit($map, settings);
				});
			} else if ( settings.hasOwnProperty( 'init_type' ) && 'scroll' === settings.init_type) {
				woodmartThemeModule.$window.on('scroll', function() {
					if ( settings.hasOwnProperty('init_offset') && window.innerHeight + woodmartThemeModule.$window.scrollTop() + parseInt(settings.init_offset) > $mapContainer.offset().top) {
						if ($mapContainer.hasClass('wd-map-inited')) {
							return;
						}

						$mapContainer.addClass('wd-map-inited');
						mapInit($map, settings);
					}
				});
			} else if ( settings.hasOwnProperty( 'init_type' ) && 'interaction' === settings.init_type) {
				window.addEventListener('wdEventStarted', function () {
					if ($mapContainer.hasClass('wd-map-inited')) {
						return;
					}

					$mapContainer.addClass('wd-map-inited');
					mapInit($map, settings);
				});
			} else {
				mapInit($map, settings);
			}
		});
	}

	$(document).ready(function() {
		woodmartThemeModule.wdOpenStreetMap();
	});
})(jQuery);

woodmartThemeModule.$document.on('wdShopPageInit', function() {
	woodmartThemeModule.sliderAnimations();
	woodmartThemeModule.sliderLazyLoad();
});

[
	'frontend/element_ready/wd_slider.default'
].forEach( function (value) {
	woodmartThemeModule.wdElementorAddAction(value, function() {
		woodmartThemeModule.sliderAnimations();
		woodmartThemeModule.sliderLazyLoad();
	});
});

woodmartThemeModule.sliderClearAnimations = function($activeSlide, firstLoad) {
	// WPB clear on first load first slide.
	if (firstLoad) {
		$activeSlide.querySelectorAll('[class*="wpb_animate"]').forEach( function (animateElement) {
			var classes = Array.from(animateElement.classList);
			var name;

			for (var index = 0; index < classes.length; index++) {
				if (classes[index].indexOf('wd-anim-name_') >= 0) {
					name = classes[index].split('_')[1];
				}
			}

			if ( animateElement.classList.contains('wpb_start_animation') ) {
				animateElement.classList.remove('wpb_start_animation')
			}
			if ( animateElement.classList.contains('animated') ) {
				animateElement.classList.remove('animated')
			}
			if ( animateElement.classList.contains(name) ) {
				animateElement.classList.remove(name)
			}
		});
	}

	// WPB clear all siblings slides.
	$activeSlide.parentNode.querySelectorAll('[class*="wpb_animate"]').forEach( function (animateElement) {
		var classes = Array.from(animateElement.classList);
		var delay = 0;
		var name;

		for (var index = 0; index < classes.length; index++) {
			if (classes[index].indexOf('wd-anim-delay_') >= 0) {
				delay = parseInt(classes[index].split('_')[1]);
			}

			if (classes[index].indexOf('wd-anim-name_') >= 0) {
				name = classes[index].split('_')[1];
			}
		}

		setTimeout(function() {
			if ( animateElement.classList.contains('wpb_start_animation') ) {
				animateElement.classList.remove('wpb_start_animation')
			}
			if ( animateElement.classList.contains('animated') ) {
				animateElement.classList.remove('animated')
			}
			if ( animateElement.classList.contains(name) ) {
				animateElement.classList.remove(name)
			}
		}, delay);
	});
};

woodmartThemeModule.sliderAnimations = function() {
	document.querySelectorAll('.wd-slider > .wd-carousel-inner > .wd-carousel').forEach( function (sliderWrapper) {
		sliderWrapper.querySelectorAll('[class*="wd-animation"]').forEach( function (slide) {
			slide.classList.add('wd-animation-ready');
		});

		runAnimations(sliderWrapper.querySelector('.wd-slide'), true);

		sliderWrapper.addEventListener('wdSlideChange', function (e) {
			var slide = Array.prototype.filter.call(
				e.target.swiper.wrapperEl.children,
				(element) => e.detail.activeIndex == element.dataset.swiperSlideIndex,
			).shift();

			if (!slide) {
				slide = e.target.swiper.wrapperEl.children[e.detail.activeIndex];
			}

			runAnimations(slide);

			woodmartThemeModule.$document.trigger('wood-images-loaded');
		});

		function runAnimations(slide, firstLoad = false) {
			woodmartThemeModule.sliderClearAnimations(slide, firstLoad);
			woodmartThemeModule.runAnimations(slide, firstLoad);
		}
	});
};

woodmartThemeModule.runAnimations = function($activeSlide, firstLoad) {
	// Elementor.
	$activeSlide.parentElement.querySelectorAll('[class*="wd-animation"]').forEach( function (animateElement) {
		animateElement.classList.remove('wd-animated');
		animateElement.classList.remove('wd-in');
	});

	$activeSlide.querySelectorAll('[class*="wd-animation"]').forEach( function (animateElement) {
		var delay = 0;

		animateElement.classList.forEach((classname) => {
			if (classname.includes('wd_delay_')) {
				delay = parseInt(classname.split('_')[2]);
			}
		})

		setTimeout(function() {
			animateElement.classList.add('wd-animated');
			animateElement.classList.add('wd-in');
		}, delay);
	});

	// WPB.
	$activeSlide.querySelectorAll('[class*="wpb_animate"]').forEach( function (animateElement) {
		var classes = animateElement.classList;
		var delay = 0;
		var name;

		for (var index = 0; index < classes.length; index++) {
			if (classes[index].indexOf('wd-anim-delay_') >= 0) {
				delay = parseInt(classes[index].split('_')[1]);
			}

			if (classes[index].indexOf('wd-anim-name_') >= 0) {
				name = classes[index].split('_')[1];
			}
		}

		setTimeout(function() {
			animateElement.classList.remove('wd-off-anim');
			animateElement.classList.add('wpb_start_animation');
			animateElement.classList.add('animated');
		}, delay);
	});
};

woodmartThemeModule.sliderLazyLoad = function() {
	const slider = document.querySelectorAll('.wd-slider > .wd-carousel-inner > .wd-carousel');

	window.addEventListener('wdEventStarted', function() {
		slider.forEach(function (carousel) {
			load(carousel.querySelector('.wd-carousel-wrap').firstElementChild);
		});
	});

	slider.forEach( function (carousel) {
		carousel.addEventListener('wdSlideChange', function (e) {
			var slide = Array.prototype.filter.call(
				e.target.swiper.wrapperEl.children,
				(element) => e.detail.activeIndex == element.dataset.swiperSlideIndex,
			).shift();

			if (!slide) {
				slide = Array.prototype.filter.call(
					e.target.swiper.wrapperEl.children,
					(element) => element.classList.contains('woodmart-loaded') && element.nextElementSibling ? element.nextElementSibling : null
				).shift();
			}

			load(slide);
		});
	});

	function load(activeSlide) {
		if (activeSlide && activeSlide.nextElementSibling) {
			activeSlide.nextElementSibling.classList.add('woodmart-loaded');
		}

		activeSlide.classList.add('woodmart-loaded');

		activeSlide.closest('.wd-carousel').querySelectorAll('[id="' + activeSlide.id + '"]').forEach( function (slide) {
			slide.classList.add('woodmart-loaded');
		});
	}
};

window.addEventListener('load',function() {
	woodmartThemeModule.sliderLazyLoad();
	woodmartThemeModule.sliderAnimations();
});

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdHeaderBuilderInited', function () {
		woodmartThemeModule.stickyColumns();
	});

	$.each([
		'frontend/element_ready/container',
		'frontend/element_ready/wd_sticky_columns.default'
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.stickyColumns();
		});
	});

	woodmartThemeModule.stickyColumns = function() {
		var $elements = $('.wd-sticky-columns[class*="wd-sticky-on-"]');

		$elements.each(function() {
			var $wrapper = $(this);
			var $columnFirst = $wrapper.find('.wd-sticky-columns-inner > .wd-col:first-child > div');
			var $columnSecond = $wrapper.find('.wd-sticky-columns-inner > .wd-col:last-child > div');
			var classes = $wrapper.attr('class').split(' ');
			var offset = 150;

			for (var index = 0; index < classes.length; index++) {
				if (classes[index].indexOf('wd_sticky_offset_') >= 0) {
					var data = classes[index].split('_');
					offset = parseInt(data[3]);
				}
			}

			var diff = $columnFirst.outerHeight() - $columnSecond.outerHeight();

			if (diff < -100) {
				stickyInit($columnFirst, offset);
			} else if (diff > 100) {
				stickyInit($columnSecond, offset);
			}

			woodmartThemeModule.$window.on('resize', woodmartThemeModule.debounce(function() {
				var diff = $columnFirst.outerHeight() - $columnSecond.outerHeight();

				if (diff < -100) {
					stickyInit($columnFirst, offset);
				} else if (diff > 100) {
					stickyInit($columnSecond, offset);
				}
			}, 300));
		});

		function stickyInit($column, offset) {
			var windowWidth = woodmartThemeModule.$window.width();
			var $wrapper = $column.closest('.wd-sticky-columns');

			$column.trigger('sticky_kit:detach');
			$column.siblings().trigger('sticky_kit:detach');

			if ( ( ! $wrapper.hasClass('wd-sticky-on-lg') && windowWidth > 1024 ) || ( ! $wrapper.hasClass('wd-sticky-on-md-sm') && windowWidth <= 1024 && windowWidth > 768 ) || ( ! $wrapper.hasClass('wd-sticky-on-sm') && windowWidth <= 768 ) ) {
				return;
			}

			$column.stick_in_parent({
				offset_top: offset
			});
		}
	};

	$(document).ready(function() {
		woodmartThemeModule.stickyColumns();
	});
})(jQuery);

(function($) {
	$.each([
		'frontend/element_ready/wd_single_product_stock_status.default',
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.stockStatus();
		});
	});

	woodmartThemeModule.stockStatus = function() {
		$( '.variations_form' )
			.on('show_variation', '.woocommerce-variation', function( event, variation ) {
				$('.wd-single-stock-status').each(function() {
					let $wrapper = $(this);

					if ( 0 !== $wrapper.find('.elementor-widget-container').length ) {
						$wrapper = $wrapper.find('.elementor-widget-container');
					}

					if ( variation.hasOwnProperty( 'availability_html' ) ) {
						$wrapper.html(variation.availability_html);
					}
				});
			})
			.on('click', '.reset_variations', function() {
				$('.wd-single-stock-status').each(function() {
					let $wrapper = $(this);

					if ( 0 !== $wrapper.find('.elementor-widget-container').length ) {
						$wrapper = $wrapper.find('.elementor-widget-container');
					}

					$wrapper.html('');
				});
			});
	};

	$(document).ready(function() {
		woodmartThemeModule.stockStatus();
	});
})(jQuery);

(function($) {
	$.each([
		'frontend/element_ready/wd_tabs.default',
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.tabs();
		});
	});

	woodmartThemeModule.$document.on('wdTabsInit', function() {
		woodmartThemeModule.tabs();
	});

	woodmartThemeModule.tabs = function () {
		$('.wd-tabs').each(function() {
			var $tabsElement = $(this);
			var $tabsList = $tabsElement.find('> .wd-tabs-header > .wd-nav-wrapper > .wd-nav-tabs > li');
			var $content =  $tabsElement.find('> .wd-tabs-content-wrapper > .wd-tab-content');
			var animationClass = 'wd-in';
			var animationTime = 100;

			$tabsList.on('click', function(e) {
				e.preventDefault();
				var $thisTab = $(this);
				var $tabsIndex = $thisTab.index();
				var $activeContent = $content.eq( $tabsIndex );

				$activeContent.siblings().removeClass(animationClass);

				setTimeout(function() {
					$thisTab.siblings().removeClass('wd-active');

					$activeContent.siblings().removeClass('wd-active');
				}, animationTime);

				setTimeout(function() {
					$thisTab.addClass('wd-active');

					$activeContent.siblings().removeClass('wd-active');
					$activeContent.addClass('wd-active');
				}, animationTime);

				setTimeout(function() {
					$activeContent.addClass(animationClass);

					woodmartThemeModule.$document.trigger('resize.vcRowBehaviour');
					woodmartThemeModule.$document.trigger('wood-images-loaded');
				}, animationTime * 2);
			});

			if ( !$($tabsList[0]).hasClass( 'wd-active' ) && !$tabsElement.hasClass( 'wd-inited' ) ) {
				$($tabsList[0]).trigger( 'click' );
			}

			setTimeout(function() {
				$tabsElement.addClass( 'wd-inited' );
			}, animationTime * 2);

		});
	}

	$(document).ready(function() {
		woodmartThemeModule.tabs();
	});
})(jQuery);
woodmartThemeModule.$document.on('wdLoadDropdownsSuccess wdSearchFullScreenContentLoaded wdShopPageInit', function() {
	woodmartThemeModule.elToggle();
});

[
	'frontend/element_ready/wd_toggle.default'
].forEach( function (value) {
	woodmartThemeModule.wdElementorAddAction(value, function() {
		woodmartThemeModule.elToggle();
	});
});

woodmartThemeModule.elToggle = function() {
	document.querySelectorAll('.wd-toggle, .wd-el-toggle').forEach( function (element) {
		if ( element.classList.contains('wd-inited') ) {
			return;
		}

		var content = element.querySelector('.wd-toggle-content, .wd-el-toggle-content');
		var isWpb = element.classList.contains('wd-wpb');

		element.classList.add('wd-inited');

		element.querySelector('.wd-toggle-head, .wd-el-toggle-head').addEventListener('click', function () {
			if ( element.classList.contains('wd-opening') ) {
				return;
			}

			var windowWidth = woodmartThemeModule.$window.width();

			if (windowWidth <= 768 && ! isWpb || windowWidth <= 767 && isWpb) {
				if (element.classList.contains('wd-state-static-sm')) {
					return;
				}

				if (element.classList.contains('wd-active-sm')) {
					element.classList.remove('wd-active-sm')
					woodmartThemeModule.slideUp(content);
				} else {
					element.classList.add('wd-active-sm')
					woodmartThemeModule.slideDown(content);
				}
			} else if (windowWidth <= 1024 && ! isWpb || windowWidth < 1200 && isWpb ) {
				if (element.classList.contains('wd-state-static-md-sm')) {
					return;
				}

				if (element.classList.contains('wd-active-md-sm')) {
					element.classList.remove('wd-active-md-sm')
					woodmartThemeModule.slideUp(content);
				} else {
					element.classList.add('wd-active-md-sm')
					woodmartThemeModule.slideDown(content);
				}
			} else {
				if (element.classList.contains('wd-state-static-lg')) {
					return;
				}

				if (element.classList.contains('wd-active-lg')) {
					element.classList.remove('wd-active-lg')
					woodmartThemeModule.slideUp(content);
				} else {
					element.classList.add('wd-active-lg')
					woodmartThemeModule.slideDown(content);
				}
			}

			element.classList.add('wd-opening');

			setTimeout(function() {
				element.classList.remove('wd-opening');
			}, 400);
		});
	});
};

window.addEventListener('load',function() {
	woodmartThemeModule.elToggle();
});

/* global xts_settings */
(function($) {
	woodmartThemeModule.$document.on('wdLoadDropdownsSuccess', function() {
		woodmartThemeModule.videoElementClick();
	});

	woodmartThemeModule.wdElementorAddAction('frontend/element_ready/wd_video.default', function() {
		woodmartThemeModule.videoElementClick();
	});

	woodmartThemeModule.videoElementClick = function() {
		$('.wd-el-video-btn-overlay:not(.wd-el-video-lightbox):not(.wd-el-video-hosted)').on('click', function(e) {
			e.preventDefault();

			var $this = $(this);
			var $video = $this.parents('.wd-el-video').find('iframe');
			var videoScr = $video.data('lazy-load');
			var videoNewSrc = videoScr + '&autoplay=1&rel=0&mute=1';

			if (videoScr.indexOf('vimeo.com') + 1) {
				videoNewSrc = videoScr.replace('#t=', '') + '&autoplay=1';
			}

			$video.attr('src', videoNewSrc);
			$this.parents('.wd-el-video').addClass('wd-playing');
		});

		$('.wd-el-video-btn-overlay.wd-el-video-hosted:not(.wd-el-video-lightbox)').on('click', function(e) {
			e.preventDefault();

			var $this = $(this);
			var $video = $this.parents('.wd-el-video').find('video');
			var videoScr = $video.data('lazy-load');

			$video.attr('src', videoScr);
			$video[0].play();
			$this.parents('.wd-el-video').addClass('wd-playing');
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.videoElementClick();
	});
})(jQuery);
/* global woodmartThemeModule, woodmart_settings, jQuery */
(function($) {
	woodmartThemeModule.$document.on('wdLoadDropdownsSuccess', function() {
		woodmartThemeModule.videoElementPopup();
	});

	woodmartThemeModule.wdElementorAddAction('frontend/element_ready/wd_video.default', function() {
		woodmartThemeModule.videoElementPopup();
	});

	woodmartThemeModule.videoElementPopup = function() {
		if ('undefined' === typeof ($.fn.magnificPopup)) {
			return;
		}

		$('.wd-el-video-btn:not(.wd-el-video-hosted), .wd-el-video-btn-overlay.wd-el-video-lightbox:not(.wd-el-video-hosted), .wd-el-video.wd-action-button:not(.wd-video-hosted) a:not(.wp-block-wd-button), .wd-el-video.wd-action-action_button:not(.wd-video-hosted) a:not(.wp-block-wd-button)').off('click').on('click', function (e) {
			e.preventDefault()

			var $this = $(this)

			setTimeout(() => {
				if ($.magnificPopup?.instance?.isOpen) {
					$.magnificPopup.instance.st.removalDelay = 0
					$.magnificPopup.close()
				}

				$.magnificPopup.open({
					items       : {
						src: $this.attr('href'),
						type: 'iframe'
					},
					closeMarkup    : woodmart_settings.close_markup,
					tLoading       : woodmart_settings.loading,
					removalDelay   : 600,
					preloader      : false,
					fixedContentPos: true,
					iframe         : {
						markup  : woodmart_settings.close_markup + '<div class="wd-popup wd-video-popup wd-with-video wd-scroll-content"><iframe class="mfp-iframe" src="//about:blank" allowfullscreen frameborder="0"></iframe></div>',
						patterns: {
							youtube: {
								index: 'youtube.com/',
								id   : 'v=',
								src  : '//www.youtube.com/embed/%id%?rel=0&autoplay=1&mute=1'
							},
							vimeo  : {
								index: 'vimeo.com/',
								id   : '/',
								src  : '//player.vimeo.com/video/%id%?transparent=0&autoplay=1&muted=1'
							}
						}
					},
					callbacks      : {
						beforeOpen: function() {
							this.wrap.addClass('wd-video-popup-wrap');
						},
					}
				})
			})
		})

		$('.wd-el-video-btn-overlay.wd-el-video-lightbox.wd-el-video-hosted,.wd-el-video-btn.wd-el-video-hosted, .wd-el-video.wd-action-button.wd-video-hosted a:not(.wp-block-wd-button), .wd-el-video.wd-action-action_button.wd-video-hosted a:not(.wp-block-wd-button)').off('click').on('click', function (e) {
			e.preventDefault();

			var $this = $(this)
			var $videoContainer = $this.closest('.wd-el-video').find('.wd-popup.wd-video-popup');

			setTimeout(() => {
				if ($.magnificPopup?.instance?.isOpen) {
					$.magnificPopup.instance.st.removalDelay = 0
					$.magnificPopup.close()
				}

				$.magnificPopup.open({
					items       : {
						src : $videoContainer,
						type: 'inline'
					},
					closeMarkup : woodmart_settings.close_markup,
					tLoading    : woodmart_settings.loading,
					removalDelay: 600,
					preloader   : false,
					fixedContentPos: true,
					callbacks   : {
						beforeOpen  : function() {
							this.wrap.addClass('wd-video-popup-wrap');
						},
						elementParse: function(item) {
							var $video = $(item.src).find('video');

							if ( ! $video.attr('src') ) {
								$video.attr('src', $video.data('lazy-load'));
							}

							$video[0].play();
						},
						open        : function() {
							woodmartThemeModule.$document.trigger('wood-images-loaded');
							woodmartThemeModule.$window.resize();
						},
						close       : function(e) {
							var $video = $(this.content[0]).find('video');

							if ( $video.length ) {
								$video[0].pause();
							}
						}
					}
				})
			})
		})

		$('.wd-el-video.wd-action-button .wp-block-wd-button').off('click').on('click', function (e) {
			e.preventDefault();

			var $wrapper = $(this).parent();
			var items = '';

			if ($wrapper.hasClass('wd-video-hosted')) {
				items = $wrapper.find('.wd-popup.wd-video-popup')
			} else {
				items = $('<div class="wd-popup wd-video-popup wd-with-video wd-scroll-content"><iframe class="mfp-iframe" src="' + $wrapper.data('src') + '" allowfullscreen allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" width="100%" height="100%"></iframe></div>')
			}
	
			setTimeout(() => {
				if ($.magnificPopup?.instance?.isOpen) {
					$.magnificPopup.instance.st.removalDelay = 0
					$.magnificPopup.close()
				}

				$.magnificPopup.open({
					items       : {
						src : items,
						type: 'inline'
					},
					closeMarkup: woodmart_settings.close_markup,
					tLoading: woodmart_settings.loading,
					removalDelay: 500,
					preloader: false,
					callbacks: {
						beforeOpen: function () {
							this.st.mainClass = 'mfp-move-horizontal';
						},
						elementParse: function (item) {
							var $video = $(item.src).find('video');

							if ( $video.length ) {
								if ( ! $video.attr('src') ) {
									$video.attr('src', $video.data('lazy-load'));
								}

								$video[0].play();
							}
						},
						open: function () {
							woodmartThemeModule.$document.trigger('wood-images-loaded');
							woodmartThemeModule.$window.resize();
						},
						close: function (e) {
							var $video = $(this.content[0]).parents('.wd-el-video').find('video');

							if ( $video.length ) {
								$video[0].pause();
							}
						}
					}
				})
			})
		})
	};

	$(document).ready(function() {
		woodmartThemeModule.videoElementPopup();
	});
})(jQuery);
/* global woodmart_settings */
(function($) {
	woodmartThemeModule.videoPoster = function() {
		$('.wd-video-poster-wrapper').on('click', function() {
			var videoWrapper = $(this),
			    video        = videoWrapper.parent().find('iframe'),
			    videoScr     = video.attr('src'),
			    videoNewSrc  = videoScr + '&autoplay=1';

			if (videoScr.indexOf('vimeo.com') + 1) {
				videoNewSrc = videoScr + '?autoplay=1';
			}

			video.attr('src', videoNewSrc);
			videoWrapper.addClass('hidden-poster');
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.videoPoster();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	$.each([
		'frontend/element_ready/wd_3d_view.default'
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.view3d();
		});
	});

	woodmartThemeModule.view3d = function() {
		$('.wd-threed-view:not(.wd-product-threed)').each(function() {
			init($(this));
		});

		$('.product-360-button a').on('click', function(e) {
			e.preventDefault();
			init($('.wd-threed-view.wd-product-threed'));
		});

		function init($this) {
			var data = $this.data('args');

			if (!data || $this.hasClass('wd-threed-view-inited')) {
				return false;
			}

			$this.ThreeSixty({
				totalFrames : data.frames_count,
				endFrame    : data.frames_count,
				currentFrame : 1,
				imgList     : '.threed-view-images',
				progress    : '.spinner',
				imgArray    : data.images,
				height      : data.height,
				width       : data.width,
				responsive  : true,
				navigation  : true,
				prevNextFrames : woodmart_settings.three_sixty_prev_next_frames,
				framerate   : woodmart_settings.three_sixty_framerate,
			});

			$this.addClass('wd-threed-view-inited');
		}
	};

	$(document).ready(function() {
		woodmartThemeModule.view3d();
	});
})(jQuery);

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

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdShopPageInit', function () {
		woodmartThemeModule.ajaxSearch();
	});

	$.each([
		'frontend/element_ready/wd_search.default'
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.ajaxSearch();
		});
	});

	woodmartThemeModule.ajaxSearch = function() {
		if (typeof ($.fn.devbridgeAutocomplete) == 'undefined') {
			return;
		}

		var escapeRegExChars = function(value) {
			return value.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
		};

		$('form.woodmart-ajax-search').each(function() {
			var $this         = $(this),
			    number        = parseInt($this.data('count')),
			    thumbnail     = parseInt($this.data('thumbnail')),
			    symbols_count = parseInt($this.data('symbols_count')),
			    productCat    = $this.find('[name="product_cat"]'),
				$parent       = $this.parent(),
			    postType      = $this.data('post_type'),
			    url           = woodmart_settings.ajaxurl + '?action=woodmart_ajax_search',
			    price         = parseInt($this.data('price')),
			    sku           = $this.data('sku'),
				isFullScreen  = $this.parents('.wd-search-full-screen').length,
				isFullScreen2 = $this.parents('.wd-search-full-screen-2').length,
				isDropdown    = $this.parents('.wd-search-dropdown').length,
				$results      = $parent.find(`.wd-search-results${ isFullScreen || isFullScreen2 ? '' : ' > ' }.wd-scroll-content`),
				$parentResult = $parent.find('.wd-search-results');

			var	enqueueProductCatResults = $this.data('include_cat_search');

			if (number > 0) {
				url += '&number=' + number;
			}
			url += '&post_type=' + postType;

			if (productCat.length && productCat.val() !== '') {
				url += '&product_cat=' + productCat.val();
			}			

			if (enqueueProductCatResults && 'yes' === enqueueProductCatResults) {
				url += '&include_cat_search=' + enqueueProductCatResults;
			}

			$this.find('[type="text"]').on('focus keyup cat_selected', function(e) {
				let $input         = $(this);
				let serviceUrlData = {
					'action': 'woodmart_ajax_search',
					'number': number > 0 ? number : undefined,
					'post_type': postType,
				};

				if ( ! $input.hasClass('wd-search-inited') ) {
					$input.devbridgeAutocomplete({
						serviceUrl      : url,
						appendTo        : $results,
						minChars        : symbols_count,
						deferRequestBy  : woodmart_settings.ajax_search_delay,
						onHide          : function(container, isClearBtn) {
							if ( isFullScreen2 ) {
								$parentResult.removeClass('wd-no-results');
							}

							var $formWrapper          = isFullScreen2 ? $this.parent().parent() : $this.parent();
							var isBeforeSearchContent = 'function' === typeof woodmartThemeModule.beforeSearchcontent && $formWrapper.find('.wd-search-history, .wd-search-requests, .wd-search-area').length;
							
							if (!isClearBtn && !isBeforeSearchContent) {
								overlayBackground('close');
							}

							if (isClearBtn || isFullScreen2 || isFullScreen) {
								$formWrapper.removeClass('wd-searched');
							} else if ( ! isBeforeSearchContent ) {
								$formWrapper.find('.wd-search-results').removeClass('wd-opened');

								setTimeout(function() {
									$formWrapper.removeClass('wd-searched');
								}, 400);
							}
						},
						onSearchStart   : function() {
							$this.addClass('wd-search-loading');
						},
						beforeRender    : function(container) {
							if (!isDropdown) {
								overlayBackground('open');
							}

							$(container).find('.wd-not-found-msg').parent().addClass('wd-not-found');

							var showViewAllBtn = $(container).find('.wd-suggestion:not(.wd-not-found)').length > 0;

							if (! $(container).find('[class*="wd-type-"]')) {
								showViewAllBtn = container[0].childElementCount > 2;
							}

							if (showViewAllBtn) {
								var formData  = $this.serializeArray();
								var submitUrl = $this.attr('action') + '?' + $.param(formData);

								$(container).append('<a class="wd-all-results" href="' + submitUrl + '">' + woodmart_settings.all_results + '</a>');
							}

							$(container).removeAttr('style');
						},
						onSelect: function(suggestion) {							
							if (suggestion.permalink.length > 0) {
								window.location.href = suggestion.permalink;
							}

							$this.parent().find('.wd-search-results').removeClass('wd-opened');
						},
						onSearchComplete: function() {
							$this.removeClass('wd-search-loading');

							woodmartThemeModule.$document.trigger('wood-images-loaded');
						},
						formatResult    : function(suggestion, currentValue) {
							if (currentValue === '&') {
								currentValue = '&#038;';
							}
							var pattern     = '(' + escapeRegExChars(currentValue) + ')',
								returnValue = '';

							if (suggestion.divider) {
								returnValue += ' <div class="suggestion-divider-title title">' + suggestion.divider + '</div>';
							}

							if (thumbnail && suggestion.thumbnail) {
								returnValue += ' <div class="wd-suggestion-thumb">' + suggestion.thumbnail + '</div>';
							}

							if (suggestion.value) {
								returnValue += ' <div class="wd-suggestion-content wd-set-mb reset-last-child">';
								returnValue += '<div class="wd-entities-title">' + suggestion.value
									.replace(new RegExp(pattern, 'gi'), '<strong>$1<\/strong>')
									.replace(/&lt;(\/?strong)&gt;/g, '<$1>') + '</div>';
							}

							if (sku && suggestion.sku) {
								returnValue += ' <p class="wd-suggestion-sku">' + suggestion.sku + '</p>';
							}

							if (price && suggestion.price) {
								returnValue += ' <p class="price">' + suggestion.price + '</p>';
							}

							if (suggestion.value) {
								returnValue += ' </div>';
							}

							if (suggestion.permalink) {
								var ariaLabel = '';

								if (suggestion.value) {
									ariaLabel = `aria-label="${suggestion.value.replace(/(<([^>]+)>)/ig, '')}"`;
								}

								returnValue += ` <a class="wd-fill" href="${suggestion.permalink}" ${ariaLabel}></a>`;
							}

							if (suggestion.products_not_found) {
								returnValue = '<span class="wd-not-found-msg">' + suggestion.value + '</span>';
							}

							if ( isFullScreen2 ) {
								if (suggestion.no_results) {
									$parentResult.addClass('wd-no-results');
								} else {
									$parentResult.removeClass('wd-no-results');
								}
							}

							if (! isFullScreen && ! isFullScreen2) {
								$parentResult.addClass('wd-opened');
							}

							if (isFullScreen2) {
								$this.parent().parent().addClass('wd-searched');
							} else {
								$this.parent().addClass('wd-searched');
							}

							return returnValue;
						}
					});

					$input.addClass('wd-search-inited');
				}

				if ( productCat.length  && 'cat_selected' === e.type ) {
					if (  '' !== productCat.val() ) {
						serviceUrlData['product_cat'] = productCat.val();
					}

					let searchForm = $this.find('[type="text"]').devbridgeAutocomplete()
					let serviceUrl = woodmart_settings.ajaxurl + '?' + new URLSearchParams(serviceUrlData).toString();

					if (enqueueProductCatResults && 'yes' === enqueueProductCatResults) {
						serviceUrl += '&include_cat_search=' + enqueueProductCatResults;
					}

					searchForm.setOptions({
						serviceUrl: serviceUrl
					});

					searchForm.hide();
					searchForm.onValueChange();
				}
			});

			woodmartThemeModule.$document.on('click', function(e) {
				var target = e.target;

				if (!$(target).is('.wd-search-form') && !$(target).parents().is('.wd-search-form') && !$(target).is('.wd-search-full-screen') && !$(target).parents().is('.wd-search-full-screen') && !$(target).is('.wd-clear-search')) {
					$this.find('[type="text"]').devbridgeAutocomplete('hide');
				}
			});

			$('.wd-search-results > .wd-scroll-content').on('click', function(e) {
				e.stopPropagation();
			});

			function overlayBackground( action ) {
				if (0 === $this.parents('.wd-search-form.wd-display-form.wd-with-overlay').length) {
					return;
				}

				$('.wd-close-side').trigger('wdCloseSideAction', ['open' === action ? 'show' : 'hide', 'click']);
			}
		});

		$('.wd-header-search.wd-display-dropdown > a').on('click', function(e) {
			e.preventDefault();
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.ajaxSearch();
	});

	window.addEventListener('wdUpdatedHeader',function() {
		woodmartThemeModule.ajaxSearch();
	});
})(jQuery);
/* global xts_settings */
(function($) {
	woodmartThemeModule.$document.on('wdShopPageInit', function() {
		woodmartThemeModule.animations();
	});

	woodmartThemeModule.animations = function() {
		if (typeof $.fn.waypoint === 'undefined') {
			return;
		}

		$('[class*="wd-animation"]').each(function() {
			var $element = $(this);
			var $elementClasses = $element.attr('class').split(' ');

			if ('inited' === $element.data('wd-waypoint') || $element.parents('.wd-slider .wd-carousel').length > 0 || $elementClasses.indexOf('wp-block-') >= 0 ) {
				return;
			}

			$element.data('wd-waypoint', 'inited');

			$element.waypoint(function() {
				var $this = $($(this)[0].element);

				var classes = $this.attr('class').split(' ');
				var delay = 0;

				for (var index = 0; index < classes.length; index++) {
					if (classes[index].indexOf('wd_delay_') >= 0) {
						delay = classes[index].split('_')[2];
					}
				}

				$this.addClass('wd-animation-ready');

				setTimeout(function() {
					$this.addClass('wd-animated');
				}, delay);
			}, {
				offset: '90%'
			});
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.animations();
	});
})(jQuery);
/* global woodmart_settings */
(function($) {
	woodmartThemeModule.animationsOffset = function() {
		if (typeof ($.fn.waypoint) == 'undefined') {
			return;
		}

		$('.wpb_animate_when_almost_visible:not(.wpb_start_animation)').waypoint(function() {
			var $this = $($(this)[0].element);
			$this.addClass('wpb_start_animation animated');
		}, {
			offset: '100%'
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.animationsOffset();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdShopPageInit wdBackHistory', function () {
		woodmartThemeModule.backHistory();
	});

	woodmartThemeModule.backHistory = function() {
		$('.wd-back-btn > a').off('click').on('click', function(e) {
			e.preventDefault();

			history.go(-1);

			setTimeout(function() {
				$('.filters-area').removeClass('filters-opened').stop().hide();
				if (woodmartThemeModule.$window.width() <= 1024) {
					$('.wd-nav-product-cat').removeClass('categories-opened').stop().hide();
				}

				woodmartThemeModule.$document.trigger('wdBackHistory');
			}, 20);
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.backHistory();
	});
})(jQuery);

woodmartThemeModule.beforeSearchcontent = function() {
	var init = function() {
		var forms = document.querySelectorAll('form.searchform');
		var isUsingKeyboard = false;

		document.addEventListener('keydown', function(e) {
			if ('Tab' === e.key || (e.shiftKey && 'Tab' === e.key)) {
				isUsingKeyboard = true;
			}
		});

		document.addEventListener('mousedown', function() {
			isUsingKeyboard = false;
		});

		forms.forEach(function(form) {
			var resultsNode = form.parentNode.querySelector('.wd-dropdown-results');

			if (!resultsNode) {
				return;
			}

			var input        = form.querySelector('[type="text"]');
			var searchCatBtn = form.querySelector('.wd-search-cat-btn');

			input.addEventListener('focus', openContent);
			input.addEventListener('keydown', openContent);

			if (searchCatBtn) {
				searchCatBtn.addEventListener('click', closeContent);
			}

			[form, resultsNode].forEach(function(el) {
				el.addEventListener('focusout', function() {
					setTimeout(function() {
						if (isUsingKeyboard && !form.contains(document.activeElement) && !resultsNode.contains(document.activeElement)) {
							closeResults(form, resultsNode);
						}
					}, 10);
				});
			});
		});

		// Add event listener to close content when clicking outside.
		document.addEventListener('click', handleOutsideClick, { passive: true });
	}

	var handleOutsideClick = function (e) {
		var clickedForm = e.target.closest('form.searchform');

		document.querySelectorAll('.wd-dropdown-results.wd-opened').forEach(function(openedResults) {
			var formWrapper = openedResults.closest('.wd-search-form, .wd-search-dropdown');

			if (!formWrapper) {
				return;
			}

			var parentForm = formWrapper.querySelector('form.searchform');

			if (!clickedForm || parentForm !== clickedForm) {
				closeResults(parentForm, openedResults);
			}
		});
	}

	var closeResults = function (form, resultsNode) {
		resultsNode.classList.remove('wd-opened');
		
		backgroundOverlay(form, 'close');

		setTimeout(function() {
			form.parentNode.classList.remove('wd-searched');
		}, 400);
	}

	var closeContent = function (e) {
		var form        = this.closest('form');
		var resultsNode = form.parentNode.querySelector('.wd-dropdown-results');

		closeResults(form, resultsNode);
	}

	var openContent = function (e) {
		var input = this;
		var form  = input.closest('form');
		var resultsNode  = form.parentNode.querySelector('.wd-dropdown-results');

		var key = e.keyCode || e.charCode;

		if ('Tab' === e.key || (e.shiftKey && 'Tab' === e.key)) {
			return;
		}

		if (0 === input.value.length && (8 === key || 46 === key)) {
			closeResults(form, resultsNode);

			return;
		}

		input.dispatchEvent(new Event('wdOpenBeforeSearchContent'));

		setTimeout(function() {
			var showContent     = true;
			var searchHistory   = resultsNode.querySelector('.wd-search-history');
			var popularRequests = resultsNode.querySelector('.wd-search-requests');
			var searchContent   = resultsNode.querySelector('.wd-search-area');

			if (
				(!searchHistory || 0 === searchHistory.childElementCount) &&
				(!popularRequests || 0 === popularRequests.childElementCount) &&
				(!searchContent || (0 === searchContent.childElementCount && 0 === searchContent.textContent.length))
			) {
				showContent = false;
			}

			if (showContent) {
				resultsNode.classList.add('wd-opened');
	
				backgroundOverlay(form, 'open');
			}
		}, 100);
	}

	var backgroundOverlay = function(form, action) {
		if (! form.closest('.wd-search-form.wd-display-form.wd-with-overlay')) {
			return;
		}

		jQuery('.wd-close-side').trigger('wdCloseSideAction', [action === 'open' ? 'show' : 'hide', 'click']);
	}

	init();
}

window.addEventListener('load',function() {
	woodmartThemeModule.beforeSearchcontent();
});

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdBackHistory wdProductsTabsLoaded wdSearchFullScreenContentLoaded wdActionAfterAddToCart wdShopPageInit wdArrowsLoadProducts wdLoadMoreLoadProducts wdUpdateWishlist wdQuickViewOpen wdQuickShopSuccess wdProductBaseHoverIconsResize wdRecentlyViewedProductLoaded updated_checkout updated_cart_totals', function () {
		woodmartThemeModule.btnsToolTips();
	});

	woodmartThemeModule.$document.on('wdUpdateTooltip', function (e, $this) {
		woodmartThemeModule.updateTooltip($this);
	});

	$.each([
		'frontend/element_ready/wd_products.default',
		'frontend/element_ready/wd_products_tabs.default',
		'frontend/element_ready/wd_single_product_nav.default',
		'frontend/element_ready/wd_single_product_size_guide_button.default',
		'frontend/element_ready/wd_single_product_compare_button.default',
		'frontend/element_ready/wd_single_product_wishlist_button.default'
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.btnsToolTips();
		});
	});

	woodmartThemeModule.btnsToolTips = function() {
		// Bootstrap tooltips
		$(woodmart_settings.tooltip_top_selector).on('mouseenter', function() {
			initTooltip($(this), 'top');
		});
		document.querySelectorAll(woodmart_settings.tooltip_top_selector).forEach(el => {
			el.addEventListener('touchstart', function(event) {
				initTooltip($(this), 'top');
			}, { passive: true });
		});

		$(woodmart_settings.tooltip_left_selector).on('mouseenter', function() {
			initTooltip($(this), woodmartThemeModule.$body.hasClass('rtl') ? 'right' : 'left');
		});
		document.querySelectorAll(woodmart_settings.tooltip_left_selector).forEach(el => {
			el.addEventListener('touchstart', function(event) {
				initTooltip($(this), woodmartThemeModule.$body.hasClass('rtl') ? 'right' : 'left');
			}, { passive: true });
		});

		function initTooltip( $this, placement ) {
			if ((! $this.hasClass('wd-hint') && ! $this.closest('.wd-review-likes').length && woodmartThemeModule.windowWidth <= 1024) || $this.hasClass('wd-tooltip-inited') || $this.hasClass('wd-with-html')) {
				return;
			}

			$this.tooltip({
				animation: false,
				container: 'body',
				trigger  : 'hover',
				boundary: 'window',
				placement: placement,
				title    : function () {
					var $this = $(this);

					if ($this.find('.added_to_cart').length > 0) {
						return $this.find('.add_to_cart_button').text();
					}

					if ($this.find('.add_to_cart_button').length > 0) {
						return $this.find('.add_to_cart_button').text();
					}

					if ($this.find('.wd-swatch-text').length > 0) {
						return $this.find('.wd-swatch-text').text();
					}

					if ($this.closest('.wd-review-likes').length) {
						return woodmart_settings.review_likes_tooltip;
					}

					return $this.text();
				}
			});

			$this.tooltip('show');

			$this.addClass('wd-tooltip-inited');
		}

		$('.wd-tooltip.wd-with-html').each(function() {
			var $this = $(this);
			var timeout;

			$this.on('mouseenter touchstart', { passive: true }, function() {
				if (!$(this).hasClass('wd-tooltip-inited')) {
					initHtmlTooltips($this);
				}

				$this.tooltip('show');

				$('#' + $this.attr('aria-describedby'))
					.on('mouseenter touchstart', { passive: true }, function() {
						clearTimeout(timeout);
					})
					.on('mouseleave touchend', { passive: true }, function() {
						clearTimeout(timeout);

						timeout = setTimeout(function() {
							$this.tooltip('hide');
						}, 100);
					});
			});

			$this.on('mouseleave touchend', { passive: true }, function() {
				clearTimeout(timeout);

				timeout = setTimeout(function() {
					$this.tooltip('hide');

					$('#' + $this.attr('aria-describedby')).off('mouseenter mouseleave touchstart touchend');
				}, 100);
			});
		});

		function initHtmlTooltips($el) {
			$el.tooltip({
				animation: false,
				container: 'body',
				trigger: 'manual',
				boundary: 'window',
				placement: 'top',
				sanitize: false,
				html: true,
				title: function() {
					return $(this).html();
				}
			});

			$el.addClass('wd-tooltip-inited');
		}
	};

	woodmartThemeModule.updateTooltip = function($this) {
		var $tooltip = $($this);

		if ( !$tooltip.hasClass('wd-tooltip-inited') ) {
			$tooltip = $tooltip.parent('.wd-tooltip-inited');
		}

		if (woodmartThemeModule.windowWidth <= 1024 || !$tooltip.hasClass('wd-tooltip-inited') || 'undefined' === typeof ($.fn.tooltip) || !$tooltip.is(':hover')) {
			return;
		}

		$tooltip.tooltip('show');
	};

	$(document).ready(function() {
		woodmartThemeModule.btnsToolTips();
	});
})(jQuery);


/* global woodmart_settings */
(function($) {
	woodmartThemeModule.callPhotoSwipe = function(index, items) {
		if (woodmartThemeModule.$body.hasClass('rtl')) {
			index = items.length - index - 1;
			items = items.reverse();
		}

		var options = {
			index        : index,
			shareButtons : [
				{
					id   : 'facebook',
					label: woodmart_settings.share_fb,
					url  : 'https://www.facebook.com/sharer/sharer.php?u={{url}}'
				},
				{
					id   : 'twitter',
					label: woodmart_settings.tweet,
					url  : 'https://x.com/intent/tweet?text={{text}}&url={{url}}'
				},
				{
					id   : 'pinterest',
					label: woodmart_settings.pin_it,
					url  : 'http://www.pinterest.com/pin/create/button/' +
						'?url={{url}}&media={{image_url}}&description={{text}}'
				},
				{
					id      : 'download',
					label   : woodmart_settings.download_image,
					url     : '{{raw_image_url}}',
					download: true
				}
			],
			closeOnScroll: woodmart_settings.photoswipe_close_on_scroll,
			isClickableElement: function (el) {
				return el.tagName === 'A' || $(el).hasClass('wd-play-video')|| $(el).hasClass('wd-product-video');
			},
			getDoubleTapZoom: function (isMouseClick, item) {
				if (isMouseClick || 'undefined' !== typeof item.html) {
					return 1;
				} else {
					return item.initialZoomLevel < 0.7 ? 1 : 1.33;
				}
			}
		};

		woodmartThemeModule.$body.find('.pswp').remove();
		woodmartThemeModule.$body.append(woodmart_settings.photoswipe_template);
		var pswpElement = document.querySelectorAll('.pswp')[0];

		// Initializes and opens PhotoSwipe
		var gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);

		woodmartThemeModule.$document.trigger('wdPhotoSwipeBeforeInited', gallery );

		gallery.init();
	};
})(jQuery);

woodmartThemeModule.$document.on('wdShopPageInit', function () {
	woodmartThemeModule.clearSearch();
});

jQuery.each([
	'frontend/element_ready/wd_search.default'
], function(index, value) {
	woodmartThemeModule.wdElementorAddAction(value, function() {
		woodmartThemeModule.clearSearch();
	});
});

woodmartThemeModule.clearSearch = function() {
	var buttons = document.querySelectorAll('form .wd-clear-search');

	buttons.forEach(function(button) {
		var form  = button.closest('form');
		var input = form.querySelector('input');

		if (input) {
			toggleClearButton(input, button);

			input.addEventListener('keyup', function() {
				toggleClearButton(input, button);
			});
		}

		button.addEventListener('click', function(e) {
			e.preventDefault();

			var input   = button.parentNode.querySelector('input');
			input.value = '';

			toggleClearButton(input, button);

			var searchFormWithOverlay = input.closest('.wd-search-form.wd-display-form.wd-with-overlay');
			var dropdownResultsNode   = searchFormWithOverlay ? searchFormWithOverlay.querySelector('.wd-dropdown-results') : null;

			if (dropdownResultsNode) {
				var searchHistory   = dropdownResultsNode.querySelector('.wd-search-history');
				var popularRequests = dropdownResultsNode.querySelector('.wd-search-requests');
				var searchContent   = dropdownResultsNode.querySelector('.wd-search-area');

				if (
					(!searchHistory || 0 === searchHistory.childElementCount) &&
					(!popularRequests || 0 === popularRequests.childElementCount) &&
					(!searchContent || (0 === searchContent.childElementCount && 0 === searchContent.textContent.length))
				) {
					var closeSideButtons = document.querySelectorAll('.wd-close-side');

					closeSideButtons.forEach(function(button) {
						var event = new CustomEvent('wdCloseSideAction', { detail: ['hide', 'click'] });

						button.dispatchEvent(event);
					});
				}
			}
		});
	});

	function toggleClearButton(serachInput, clearButton) {
		if (serachInput.value.length) {
			clearButton.classList.remove('wd-hide');
		} else {
			clearButton.classList.add('wd-hide')
		}
	}
}

window.addEventListener('wdEventStarted', function() {
	woodmartThemeModule.clearSearch();
});

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.clickOnScrollButton = function(btnClass, destroy, offset) {
		if (typeof $.fn.waypoint != 'function') {
			return;
		}

		var $btn = $(btnClass);
		if ($btn.length === 0) {
			return;
		}

		$btn.trigger('wd-waypoint-destroy');

		if (!offset) {
			offset = 0;
		}

		var waypoint = new Waypoint({
			element: $btn[0],
			handler: function() {
				$btn.trigger('click');
			},
			offset : function() {
				return woodmartThemeModule.$window.outerHeight() + parseInt(offset);
			}
		});

		$btn.data('waypoint-inited', true).off('wd-waypoint-destroy').on('wd-waypoint-destroy', function() {
			if ($btn.data('waypoint-inited')) {
				waypoint.destroy();
				$btn.data('waypoint-inited', false);
			}
		});
	};
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.cookiesPopup = function() {
		var cookies_version = woodmart_settings.cookies_version;

		if ( typeof Cookies === 'undefined' ) {
			return;
		}

		if (Cookies.get('woodmart_cookies_' + cookies_version) === 'accepted') {
			return;
		}

		var popup = $('.wd-cookies-popup');

		setTimeout(function() {
			popup.addClass('popup-display');
			popup.on('click', '.cookies-accept-btn', function(e) {
				e.preventDefault();
				acceptCookies();
			});
		}, 2500);

		var acceptCookies = function() {
			popup.removeClass('popup-display').addClass('popup-hide');
			Cookies.set('woodmart_cookies_' + cookies_version, 'accepted', {
				expires: 60,
				path   : '/',
				secure : woodmart_settings.cookie_secure_param
			});
		};
	};

	$(document).ready(function() {
		woodmartThemeModule.cookiesPopup();
	});
})(jQuery);

/* global woodmartThemeModule */
(function() {
	woodmartThemeModule.$document.on('wdElementorSectionReady wdElementorColumnReady wdElementorGlobalReady wdShopPageInit', function() {
		woodmartThemeModule.cssAnimations();
	});

	woodmartThemeModule.cssAnimations = function() {
	
		var options = {
			root: null,
			rootMargin: '0px',
			threshold: 0
		}
		var elementsToObserve = document.querySelectorAll('.wd-animation');

		var callback = function(entries, observer) {
			entries.forEach(function (entry) {
				// Check if the observed element is intersecting
				if (entry.isIntersecting) {
				  // Perform your desired actions when the element is in view
				  animate(entry.target);
				  observer.unobserve(entry.target);
				}
			});
		};

		var animate = function(target) {
			if ( target.classList.contains('wd-animation-ready')) {
				return;
			}

			var delay = 32;

			target.classList.forEach((classname) => {
				if (classname.includes('wd_delay_')) {
					delay = classname.split('_')[2];
				}
			})

			target.classList.add('wd-animation-ready');

			setTimeout(function() {
				target.classList.add('wd-animated');
				target.classList.add('wd-in');
			}, delay)
		}

		// Create an IntersectionObserver instance for each element
		elementsToObserve.forEach(function (element) {
			if ( element.closest('.wd-slider') ) {
				return;
			}

			var observer = new IntersectionObserver(callback, options);
			observer.observe(element);
		});

	};
	document.addEventListener('DOMContentLoaded', function() {
		woodmartThemeModule.cssAnimations();
	});
})();

/* global woodmartThemeModule, Cookies, woodmart_settings, jQuery */
(function($) {
	woodmartThemeModule.floatingBlocks = function() {
		if (woodmartThemeModule.$body.hasClass('page-template-maintenance')) {
			return
		}

		let popupQueue = []
		let popupTriggered = {}

		const cookieUtils = {
			get(key) {
				let data = Cookies.get(key)
				if (data && typeof data === 'string') {
					try {
						data = JSON.parse(data)
					} catch (e) {
						data = []
					}
				}
				return data || []
			},

			set(key, array) {
				Cookies.set(key, JSON.stringify(array), {
					expires: 7,
					path: '/',
					secure: woodmart_settings.cookie_secure_param,
				})
			},
		}

		const triggerMethods = {
			after_page_views: 'onPageViews',
			after_sessions: 'onSessions',
			time_to_show: 'onTime',
			scroll_value: 'onScroll',
			scroll_to_selector: 'onScrollToSelector',
			inactivity_time: 'onInactivity',
			click_times: 'onClicks',
			selector: 'onSelectorClick',
			parameters: 'onUrlParam',
			hashtags: 'onUrlHashtag',
			exit_intent: 'onExitIntent',
		}
		const getTriggers = {
			onTime: function($element, ms, callback) {
				setTimeout(
					() => {
						if (showOnce($element, 'time_to_show')) return
						callback($element)
					},
					parseInt(ms, 10)
				)
			},

			onScrollToSelector: function($element, scroll_to_selector, callback) {
				let shown = false
				woodmartThemeModule.$window.on('scroll', function() {
					if (shown) return

					const scrollTop = woodmartThemeModule.$window.scrollTop()
					const winHeight = woodmartThemeModule.$window.height()

					if (scroll_to_selector) {
						const $target = woodmartThemeModule.$document.find(scroll_to_selector)
						if (!$target.length) return

						const targetTop = $target.offset().top
						const targetBottom = targetTop + $target.outerHeight()

						if (scrollTop + winHeight >= targetTop && scrollTop <= targetBottom) {
							shown = true
							if (showOnce($element, 'scroll_to_selector')) return
							callback($element)
						}
					}
				})
			},

			onScroll: function($element, scroll_value, callback) {
				let shown = false

				woodmartThemeModule.$window.on('scroll', function() {
					if (shown) return

					const scrollTop = woodmartThemeModule.$window.scrollTop()
					const docHeight = woodmartThemeModule.$document.height()
					const winHeight = woodmartThemeModule.$window.height()
					const scrollPercent = (scrollTop / (docHeight - winHeight)) * 100

					if (scroll_value) {
						let shouldTrigger = false

						if (typeof scroll_value === 'string' && scroll_value.endsWith('%')) {
							const percent = parseFloat(scroll_value)
							shouldTrigger = scrollPercent >= percent
						} else {
							const pixelVal = parseInt(scroll_value)
							shouldTrigger = scrollTop >= pixelVal
						}

						if (shouldTrigger) {
							shown = true
							if (showOnce($element, 'scroll_value')) return
							callback($element)
						}
					}
				})
			},

			onClicks: function($element, count, callback) {
				let clickCount = 0

				woodmartThemeModule.$document.on('mousedown', function() {
					clickCount++
					if (clickCount >= parseInt(count, 10)) {
						clickCount = 0
						const $fb_wrap = $element.find('.wd-fb-wrap')

						if ($fb_wrap.length && !$fb_wrap.hasClass('wd-hide')) return

						if (showOnce($element, 'click_times')) return
						callback($element)
					}
				})
			},

			onSelectorClick: function($element, selector, callback) {
				if ($element.hasClass('wd-hide')) return
				woodmartThemeModule.$document.on('click', selector, function(e) {
					e.preventDefault()
					if (showOnce($element, 'selector')) return
					callback($element)
				})
			},

			onUrlParam: function($element, params, callback) {
				const urlParams = new URLSearchParams(window.location.search)
				const paramsArray = params.split(',').filter(Boolean)

				if (
					paramsArray.some((param) => {
						const [key, value] = param.trim().split('=')
						if (key && value) {
							return urlParams.get(key) === value
						} else {
							return urlParams.has(param.trim())
						}
					})
				) {
					if (showOnce($element, 'parameters')) return
					callback($element)
				}
			},

			onUrlHashtag: function($element, hashtags, callback) {
				if (!hashtags) return

				const hashtagsArray = hashtags
					.split(',')
					.map((h) => h.trim())
					.filter(Boolean)

				function checkHashtags() {
					const currentHash = window.location.hash.trim()

					if (hashtagsArray.some((hashtag) => hashtag === currentHash)) {
						if (showOnce($element, 'hashtags')) return
						callback($element)
					}
				}

				checkHashtags()
				window.addEventListener('hashchange', checkHashtags)
			},

			onPageViews: function($element, requiredViews, callback) {
				const elementId = $element.attr('id')
				const pageViewsKey = 'woodmart_page_views_' + elementId
				let pageViews = parseInt(localStorage.getItem(pageViewsKey), 10) || 0

				pageViews++
				localStorage.setItem(pageViewsKey, pageViews)

				if (pageViews >= parseInt(requiredViews, 10)) {
					localStorage.removeItem(pageViewsKey)
					if (showOnce($element, 'after_page_views')) return
					callback($element)
				}
			},

			onSessions: function($element, requiredSessions, callback) {
				const elementId = $element.attr('id')
				const sessionKey = 'woodmart_session_' + elementId
				const sessionsKey = 'woodmart_sessions_' + elementId

				let sessions = parseInt(localStorage.getItem(sessionsKey), 10) || 0

				if (!sessionStorage.getItem(sessionKey)) {
					sessionStorage.setItem(sessionKey, '1')
					sessions++
					localStorage.setItem(sessionsKey, sessions)
				}

				if (sessions >= parseInt(requiredSessions, 10)) {
					localStorage.removeItem(sessionsKey)
					if (showOnce($element, 'after_sessions')) return
					callback($element)
				}
			},

			onInactivity: function($element, time, callback) {
				let timer
				const delay = parseInt(time, 10)

				function resetTimer() {
					clearTimeout(timer)
					timer = setTimeout(() => {
						if (showOnce($element, 'inactivity_time')) return
						callback($element)
					}, delay)
				}

				woodmartThemeModule.$document.on('mousemove keydown scroll', resetTimer)
				resetTimer()
			},

			onExitIntent: function($element, callback) {
				let shown = false

				woodmartThemeModule.$document.on('mouseleave', function(e) {
					if (shown || showOnce($element, 'exit_intent')) return

					if (e.clientY <= 0) {
						shown = true
						callback($element)
					}
				})
			},
		}

		function queuePopup($this) {
			const popupId = $this.attr('id')

			if (popupTriggered[popupId]) {
				return
			}

			popupTriggered[popupId] = true

			popupQueue.push($this)

			if (popupQueue.length === 1) {
				showPopup($this)
			}
		}

		function proceedToNextPopup() {
			popupQueue.shift()
			if (popupQueue.length > 0) {
				const next = popupQueue[0]
				setTimeout(() => showPopup(next), 0)
			}
		}

		function showPopup($this) {
			if (
				$.magnificPopup?.instance?.isOpen ||
				(woodmart_settings.age_verify === 'yes' &&
					Cookies.get('woodmart_age_verify') !== 'confirmed')
			) {
				const mfpInstance = $.magnificPopup.instance
				const isBuilderOpen =
					mfpInstance.isOpen &&
					mfpInstance.wrap?.find('.wd-popup-builder, .wd-promo-popup').length
				if (!isBuilderOpen) {
					$(document).one('mfpClose', () => setTimeout(() => showPopup($this), 600))
					return
				}
			}

			const options = $this.data('options') || {}
			const popupId = $this.attr('id')
			const closeBtn = options?.close_btn === '1'
			const itemVersion = $this.data('options')?.version || 1
			const cookiesKey = 'woodmart_' + popupId + '_' + itemVersion

			if (options?.persistent_close === '1') {
				const triggeredArray = cookieUtils.get(cookiesKey)

				if (triggeredArray.includes('persistent_closed')) {
					popupQueue.shift()
					return
				}

				woodmartThemeModule.$document.on('mfpClose', function() {
					const triggeredArray = cookieUtils.get(cookiesKey)

					if (!triggeredArray.includes('persistent_closed')) {
						triggeredArray.push('persistent_closed')
						cookieUtils.set(cookiesKey, triggeredArray)
					}
				})
			}

			const enablePageScrolling = options?.enable_page_scrolling === '1'
			const closeByOverlay = options?.close_by_overlay === '1'
			const closeByESC = options?.close_by_esc === '1'

			let wrapClass = ' wd-mfp-popup-wrap-' + popupId.replace('popup-', '')
			let bgClass = ' wd-mfp-popup-bg-' + popupId.replace('popup-', '')
			let btnClass = 'wd-popup-close wd-action-btn wd-cross-icon'

			if (enablePageScrolling) {
				wrapClass += ' wd-scrolling-on'
			}

			if (!closeBtn) {
				btnClass += ' wd-hide'
			}

			if (options?.close_btn_display) {
				btnClass += ' wd-style-' + options.close_btn_display
			}

			let animationClass = ''
			if (options?.animation) {
				animationClass = 'wd-animation-' + options.animation
			}

			const popupWrap = '.wd-popup-wrap'

			$.magnificPopup.open({
				items: {
					src: $this,
				},
				type: 'inline',
				removalDelay: 600,
				fixedContentPos: !enablePageScrolling,
				tClose: woodmart_settings.close,
				closeMarkup:
					'<div class="' +
					btnClass +
					'">' +
					'<a title="' +
					woodmart_settings.close +
					'" href="#" rel="nofollow">' +
					'<span>' +
					woodmart_settings.close +
					'</span>' +
					'</a>' +
					'</div>',
				enableEscapeKey: closeByESC,
				closeOnBgClick: closeByOverlay,
				callbacks: {
					open: function() {
						this.wrap.find(popupWrap).addClass(animationClass)

						if (this.wrap.find('.wd-promo-popup').length) {
							this.wrap.addClass(wrapClass + ' wd-promo-popup-wrap')
						} else {
							this.wrap.addClass(wrapClass + ' wd-popup-builder-wrap')
						}

						$('.mfp-bg').addClass(bgClass)

						if (options?.close_by_selector) {
							$this.find(options.close_by_selector).on('click', function(e) {
								e.preventDefault()
								$.magnificPopup.close()
							})
						}

						woodmartThemeModule.$document.trigger('wood-images-loaded')
						woodmartThemeModule.$document.trigger('wdOpenPopup')
						woodmartThemeModule.$document.trigger('wdPopupOpened.' + popupId)
					},
					close: function() {
						popupTriggered[popupId] = false
						proceedToNextPopup()
					},
				},
			})
		}

		function isPopupHidden($this) {
			const options = $this.data('options') || {}
			const width = woodmartThemeModule.$window.width()

			if (width <= 768) {
				return options.hide_popup_mobile === '1'
			}

			if (width > 768 && width <= 1024) {
				return options.hide_popup_tablet === '1'
			}

			return options.hide_popup === '1'
		}

		function showBlock($this) {
			const $content = $this.find('.wd-fb-wrap')

			if ($content.hasClass('wd-out')) {
				return
			}

			$content.removeClass('wd-hide')

			if ($content.hasClass('wd-animation')) {
				$content.removeClass('wd-out')

				setTimeout(() => {
					$content.addClass('wd-in')
				}, 100)
			}
		}

		function closeBlock($block) {
			const $floatingWrapper = $block.parents('.wd-fb-wrap')
			if (!$floatingWrapper.length) return

			$floatingWrapper.trigger('fbClose')

			if ($floatingWrapper.hasClass('wd-animation')) {
				$floatingWrapper.removeClass('wd-in')
				$floatingWrapper.addClass('wd-out')

				setTimeout(() => {
					$floatingWrapper.addClass('wd-hide')
					$floatingWrapper.removeClass('wd-out')
				}, 600)
			} else {
				setTimeout(() => {
					$floatingWrapper.addClass('wd-hide')
				})
			}
		}

		function showOnce($this, trigger) {
			const itemId = $this.attr('id')
			const options = $this.data('options') || {}
			const itemVersion = options?.version || 1
			const triggers = $this.data('triggers') || {}

			if (triggers[trigger]?.show_once === '0') {
				return false
			}

			const cookiesKey = 'woodmart_' + itemId + '_' + itemVersion
			const triggeredArray = cookieUtils.get(cookiesKey)

			if (triggeredArray.includes(trigger)) {
				return true
			}

			if ($this.hasClass('wd-popup')) {
				woodmartThemeModule.$document.one('wdPopupOpened.' + itemId, function() {
					const triggeredArray = cookieUtils.get(cookiesKey)
					if (!triggeredArray.includes(trigger)) {
						triggeredArray.push(trigger)
						cookieUtils.set(cookiesKey, triggeredArray)
					}
				})
		
				return false
			}

			triggeredArray.push(trigger)
			cookieUtils.set(cookiesKey, triggeredArray)

			return false
		}

		function callTriggers($element, triggers, callback) {
			for (const [triggerKey, methodName] of Object.entries(triggerMethods)) {
				if (triggers[triggerKey]?.value) {
					if (triggerKey === 'selector' && $element.hasClass('wd-popup')) {
						continue
					}

					if (triggerKey === 'exit_intent') {
						getTriggers[methodName]($element, callback)
					} else {
						getTriggers[methodName]($element, triggers[triggerKey].value, callback)
					}
				}
			}
		}

		woodmartThemeModule.$document.on('click', '.wd-fb-close', function(e) {
			e.preventDefault()
			const $closeBtn = $(this)
			closeBlock($closeBtn)
		})

		$('.wd-fb-holder').each(function() {
			const $this = $(this)
			const triggers = $this.data('triggers')
			const options = $this.data('options') || {}
			const $content = $this.find('.wd-fb-wrap')
			const itemId = $this.attr('id')
			const itemVersion = $this.data('options')?.version || 1
			const cookiesKey = 'woodmart_' + itemId + '_' + itemVersion

			if (options?.persistent_close === '1') {
				const triggeredArray = cookieUtils.get(cookiesKey)

				if (triggeredArray.includes('persistent_closed')) {
					$content.addClass('wd-hide')
					return
				}

				woodmartThemeModule.$document.on('fbClose', function() {
					const triggeredArray = cookieUtils.get(cookiesKey)

					if (!triggeredArray.includes('persistent_closed')) {
						triggeredArray.push('persistent_closed')
						cookieUtils.set(cookiesKey, triggeredArray)
					}
				})
			}

			if (options?.close_by_selector) {
				woodmartThemeModule.$document.on(
					'click',
					options.close_by_selector,
					function(e) {
						if (!$content.hasClass('wd-hide')) {
							e.preventDefault()
							closeBlock($content.find('.wd-fb-close'))
						}
					}
				)
			}

			if (!triggers || typeof triggers !== 'object') {
				if (options?.persistent_close === '1') {
					$content.removeClass('wd-hide')
				}

				if ($content.hasClass('wd-animation')) {
					if (options?.persistent_close === '1') {
						setTimeout(() => {
							$content.addClass('wd-in')
						}, 16)
					} else {
						$content.addClass('wd-in')
					}
				}

				return
			}

			callTriggers($this, triggers, showBlock)
		})

		$('.wd-popup-builder, .wd-promo-popup').each(function() {
			const $this = $(this)
			const triggers = $this.data('triggers') || {}

			if (isPopupHidden($this)) {
				return
			}

			if (
				$this.find('.mc4wp-form .mc4wp-response').length &&
				$this.find('.mc4wp-form .mc4wp-response').children().length
			) {
				queuePopup($this)
			}

			if (!triggers || typeof triggers !== 'object') return

			if (triggers.selector?.value) {
				getTriggers.onSelectorClick($this, triggers.selector.value, queuePopup)
			}

			if ($this.hasClass('wd-promo-popup')) {
				let pages = Cookies.get('woodmart_shown_pages')

				if (!pages) {
					pages = 0
				}

				if (pages < triggers.popup_pages) {
					pages++

					Cookies.set('woodmart_shown_pages', pages, {
						expires: 7,
						path: '/',
						secure: woodmart_settings.cookie_secure_param,
					})

					return
				}
			}

			callTriggers($this, triggers, queuePopup)
		})
	}

	woodmartThemeModule.$document.ready(function() {
		woodmartThemeModule.floatingBlocks()
	})
})(jQuery);

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

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdHiddenSidebarsInited', function() {
		woodmartThemeModule.lazyLoading();
	});

	$.each([
		'frontend/element_ready/wd_products.default',
		'frontend/element_ready/wd_products_tabs.default',
		'frontend/element_ready/wd_product_categories.default',
		'frontend/element_ready/wd_products_brands.default',
		'frontend/element_ready/wd_blog.default',
		'frontend/element_ready/wd_images_gallery.default',
		'frontend/element_ready/wd_product_categories.default',
		'frontend/element_ready/wd_slider.default',
		'frontend/element_ready/wd_banner_carousel.default',
		'frontend/element_ready/wd_banner.default',
		'frontend/element_ready/wd_infobox_carousel.default',
		'frontend/element_ready/wd_infobox.default',
		'frontend/element_ready/wd_instagram.default',
		'frontend/element_ready/wd_testimonials.default'
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.lazyLoading();
		});
	});

	woodmartThemeModule.lazyLoading = function() {
		if (!window.addEventListener || !window.requestAnimationFrame || !document.getElementsByClassName) {
			return;
		}

		var pItem = document.querySelectorAll('img[data-src], source[data-srcset]');
		var bgItem = document.querySelectorAll('.wd-lazy-bg');
		var videoItem = document.querySelectorAll('video[data-poster]');
		var pCount;
		var bgCount;
		var timer;

		woodmartThemeModule.$document.on('wood-images-loaded added_to_cart updated_cart_totals updated_checkout wc_fragments_refreshed', function() {
			pItem = document.querySelectorAll('img[data-src], source[data-srcset]');
			bgItem = document.querySelectorAll('.wd-lazy-bg');
			videoItem = document.querySelectorAll('video[data-poster]');

			inView();
		});

		// Fix for menu.
		woodmartThemeModule.$body.on('click', '.wd-header-mobile-nav > a, .wd-nav-opener, .wd-btn-show-cat', function() {
			woodmartThemeModule.$document.trigger('wood-images-loaded');
		});

		$('.wd-scroll-content').on('scroll', function() {
			woodmartThemeModule.$document.trigger('wood-images-loaded');
		});

		// WooCommerce tabs fix
		$('.wc-tabs > li').on('click', function() {
			woodmartThemeModule.$document.trigger('wood-images-loaded');
		});

		$('.wd-side-hidden').on('scroll', function () {
			woodmartThemeModule.$document.trigger('wood-images-loaded');
		});

		// scroll and resize events
		window.addEventListener('scroll', scroller, false);
		window.addEventListener('resize', scroller, false);

		// DOM mutation observer
		if (MutationObserver) {
			var observer = new MutationObserver(function() {
				if (pItem.length !== pCount) {
					inView();
				}
			});

			observer.observe(document.body, {
				subtree      : true,
				childList    : true,
				attributes   : true,
				characterData: true
			});
		}

		// initial check
		inView();

		// throttled scroll/resize
		function scroller() {
			timer = timer || setTimeout(function() {
				timer = null;
				inView();
			}, 100);
		}

		// image in view?
		function inView() {
			if (pItem.length || bgItem.length || videoItem.length) {
				requestAnimationFrame(function() {
					var offset = parseInt(woodmart_settings.lazy_loading_offset);
					var wT = window.pageYOffset, wB = wT + window.innerHeight + offset, cRect, pT, pB, p = 0, b = 0;

					if (pItem.length) {
						while (p < pItem.length) {
							cRect = pItem[p].getBoundingClientRect();
							pT = wT + cRect.top;
							pB = pT + cRect.height;

							if (wT < pB && wB > pT && !pItem[p].loaded) {
								loadFullImage(pItem[p], p);
							} else {
								p++;
							}
						}

						pCount = pItem.length;
					}

					if (bgItem.length) {
						while (b < bgItem.length) {
							cRect = bgItem[b].getBoundingClientRect();
							pT = wT + cRect.top;
							pB = pT + cRect.height;

							if (wT < pB && wB > pT && bgItem[b].classList.contains('wd-lazy-bg')) {
								bgItem[b].classList.remove('wd-lazy-bg');
							} else {
								b++;
							}
						}

						bgCount = bgItem.length;
					}

					if (videoItem.length) {
						var v = 0;

						while (v < videoItem.length) {
							cRect = videoItem[v].getBoundingClientRect();
							pT = wT + cRect.top;
							pB = pT + cRect.height;

							if (wT < pB && wB > pT && !videoItem[v].loaded) {
								videoItem[v].poster = videoItem[v].dataset.poster;

								videoItem[v].loaded = true;
							} else {
								v++;
							}
						}
					}
				});
			}
		}

		// replace with full image
		function loadFullImage(item) {
			item.onload = addedImg;

			if (item.querySelector('img') !== null) {
				item.querySelector('img').onload = addedImg;
				item.querySelector('img').src = item.dataset.src;
				item.querySelector('source').srcset = item.dataset.src;

				if (typeof (item.dataset.srcset) != 'undefined') {
					item.querySelector('img').srcset = item.dataset.srcset;
				}
			}

			if (typeof (item.dataset.src) != 'undefined') {
				item.src = item.dataset.src;
			}

			if (typeof (item.dataset.srcset) != 'undefined') {
				item.srcset = item.dataset.srcset;
			}

			item.loaded = true;

			// replace image
			function addedImg() {
				requestAnimationFrame(function() {
					if (item.classList.contains('wd-lazy-fade') || item.classList.contains('wd-lazy-blur')) {
						item.classList.add('wd-loaded');
					}

					var picture = item.closest('picture')

					if ( picture && (picture.classList.contains('wd-lazy-fade') || picture.classList.contains('wd-lazy-blur')) ) {
						picture.classList.add('wd-loaded')
					}

					var $masonry = jQuery(item).parents('.grid-masonry, .wd-masonry');
					if ($masonry.length > 0 && $masonry.data( 'isotope' )) {
						$masonry.isotope('layout');
					}
					var $categories = jQuery(item).parents('.wd-cats-element .wd-masonry');
					if ($categories.length > 0) {
						$categories.packery();
					}
				});
			}
		}
	};

	$(document).ready(function() {
		woodmartThemeModule.lazyLoading();
	});
})(jQuery);

(function () {
	const lcpEntries = [];

	const observer = new PerformanceObserver((entryList) => {
		for (const entry of entryList.getEntries()) {
			if (entry.entryType === 'largest-contentful-paint') {
				lcpEntries.push(entry);
			}
		}
	});

	observer.observe({ type: 'largest-contentful-paint', buffered: true });

	window.addEventListener('load', () => {
		const fillLoader = document.querySelector('.wd-lcp-loader')

		if (!fillLoader || lcpEntries.length === 0) {
			return
		}

		fillLoader.classList.add('wd-loading');

		setTimeout(() => {
			fillLoader.classList.remove('wd-loading');

			if (lcpEntries.length === 0) {
				return;
			}

			let pageId = null;
			let imageURL = '';
			let withFetchpriority = false;
			let imageType = '';
			let message = '';
			const bodyClasses = document.body.className.split(/\s+/);
			const finalLCP = lcpEntries[lcpEntries.length - 1];
			const lcpElement = finalLCP.element
			const dropdown = document.querySelector('.wd-lcp-admin-bar');
			const loader = dropdown.querySelector('.wd-loader-overlay');

			bodyClasses.forEach(function (className) {
				const match = className.match(/(?:page-id|postid)-(\d+)/);
				if (match) {
					pageId = parseInt(match[1], 10);
				}
			});

			if (!pageId) {
				return;
			}

			if (['IMG', 'PICTURE'].includes(lcpElement.tagName)) {
				imageURL = lcpElement.currentSrc || lcpElement.src;
				imageType = 'image';
				withFetchpriority = 'high' === lcpElement.getAttribute('fetchpriority');
			} else {
				const bgStyle = getComputedStyle(lcpElement).backgroundImage;

				if (bgStyle && bgStyle.includes('url')) {
					const match = bgStyle.match(/url\(["']?(.*?)["']?\)/);
					if (match) {
						imageURL = match[1];
						imageType = 'background';
					}
				}
			}

			if (imageURL) {
				lcpElement.classList.add('wd-lcp-highlight');
				lcpElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

				const wrapper = document.createElement('div');
				const img = document.createElement('img');
				img.src = imageURL;

				wrapper.appendChild(img);
				wrapper.className = 'wd-lcp-thumb';

				dropdown.querySelector('.wd-lcp-content').prepend(wrapper);

				if (withFetchpriority) {
					message = woodmart_settings.lcp_image_with_fetchpriority;
					imageURL = '';
				} else {
					message = woodmart_settings.lcp_image_confirmed
				}
			} else {
				message = woodmart_settings.lcp_without_image_confirmed;
			}

			showPopup(message, false, imageURL).then((userConfirmed) => {
				if (!userConfirmed) {
					lcpElement.classList.remove('wd-lcp-highlight');

					const cleanUrl = window.location.origin + window.location.pathname;
					window.history.replaceState({}, document.title, cleanUrl);

					dropdown.classList.remove('wd-opened');
					dropdown.classList.remove('hover');
					return;
				}

				loader.classList.add('wd-loading');

				const urlParams = new URLSearchParams(window.location.search);
				const security = urlParams.get('security');

				jQuery.ajax({
					url     : woodmart_settings.ajaxurl,
					data    : {
						action    : 'woodmart_update_lcp_image',
						image_url : imageURL,
						image_type: imageType,
						post_id   : pageId,
						security  : security,
						device    : 768 <= woodmartThemeModule.windowWidth ? 'desktop' : 'mobile'
					},
					dataType: 'json',
					method  : 'GET',
					success : function(response) {
						if (response.hasOwnProperty('data')) {
							dropdown.classList.add('wd-saved');

							showPopup(response.data.message, true)
						}
					},
					error   : function() {
						console.error('Something wrong with AJAX response.');
					},
					complete: function() {
						const cleanUrl = window.location.origin + window.location.pathname;
						window.history.replaceState({}, document.title, cleanUrl);

						const link = Array.from(dropdown.children).filter(ch =>
							ch.classList && ch.classList.contains('ab-item'))[0];

						if ( link ) {
							link.remove()

							const newLink = document.createElement( 'div' );
							newLink.className = 'ab-item ab-empty-item';
							newLink.setAttribute('role', 'menuitem');
							newLink.setAttribute('aria-expanded', 'false');
							newLink.textContent = 'LCP Image';

							dropdown.prepend(newLink);
						}

						loader.classList.remove('wd-loading');
						lcpElement.classList.remove('wd-lcp-highlight');

						dropdown.querySelector('.wd-done').addEventListener('click', (e) => {
							e.preventDefault();

							location.reload();

							dropdown.classList.remove('wd-saved');
							dropdown.classList.remove('wd-opened');
							dropdown.classList.remove('hover');
						})
					}
				});
			});
		}, 2500);

		function showPopup( message = '', doneButton = false, hasImage = true ) {
			return new Promise((resolve) => {
				const dropdown = document.querySelector('.wd-lcp-admin-bar');
				const msgElem = dropdown.querySelector('.wd-lcp-desc');

				const btnYes = dropdown.querySelector('.wd-confirm');
				const btnNo = dropdown.querySelector('.wd-cancel');
				const btnDone = dropdown.querySelector('.wd-done');

				if (message) {
					msgElem.textContent = message;
				}

				dropdown.classList.add('wd-opened');

				if (doneButton || (! hasImage && ! doneButton && ! woodmart_settings.lcp_has_image)) {
					btnYes.classList.add('wd-hide');
					btnNo.classList.add('wd-hide');

					btnDone.classList.remove('wd-hide');
				}

				if (! hasImage && !doneButton && ! woodmart_settings.lcp_has_image) {
					btnDone.addEventListener('click', onNo);
				}

				function cleanUp() {
					btnYes.removeEventListener('click', onYes);
					btnNo.removeEventListener('click', onNo);
				}

				function onYes(e) {
					e.preventDefault();

					cleanUp();
					resolve(true);
				}

				function onNo(e) {
					e.preventDefault();

					cleanUp();
					resolve(false);
				}

				btnYes.addEventListener('click', onYes);
				btnNo.addEventListener('click', onNo);
			});
		}
	});
})();

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdPortfolioPjaxComplete', function () {
		woodmartThemeModule.masonryLayout();
	});

	$.each([
		'frontend/element_ready/wd_blog.default',
		'frontend/element_ready/wd_blog_archive.default',
		'frontend/element_ready/wd_portfolio.default',
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.masonryLayout();
		});
	});

	woodmartThemeModule.masonryLayout = function() {
		if (typeof ($.fn.isotope) === 'undefined' || typeof ($.fn.imagesLoaded) === 'undefined') {
			return;
		}

		var $container = $('.wd-masonry:not(.wd-cats)');

		$container.imagesLoaded(function() {
			$container.isotope({
				gutter      : 0,
				isOriginLeft: !woodmartThemeModule.$body.hasClass('rtl'),
				itemSelector: '.blog-design-masonry, .blog-design-mask, .masonry-item'
			});
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.masonryLayout();
	});
})(jQuery);

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

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.parallax = function() {
		if (woodmartThemeModule.windowWidth <= 1024) {
			return;
		}

		$('.wd-parallax').each(function() {
			var $this = $(this);

			if ($this.hasClass('wpb_column')) {
				var $vcColumnInner = $this.find('> .vc_column-inner');

				$this.removeClass( 'wd-parallax' );
				$vcColumnInner.addClass( 'wd-parallax' )

				$vcColumnInner.parallax('50%', 0.3);
			} else {
				$this.parallax('50%', 0.3);
			}
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.parallax();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.photoswipeImages = function() {
		$('.photoswipe-images, .wp-block-wd-gallery:has(.photoswipe-images)').each(function() {
			var $this = $(this);

			$this.on('click', 'a', function(e) {
				e.preventDefault();
				var index = $(e.currentTarget).parents('.wd-gallery-item, .wp-block-wd-gallery-item').index();
				var items = getGalleryItems($this, []);

				woodmartThemeModule.callPhotoSwipe(index, items);
			});
		});

		var getGalleryItems = function($gallery, items) {
			var src, width, height, title;

			$gallery.find('a').each(function() {
				var $this = $(this);

				src = $this.attr('href');
				width = $this.data('width');
				height = $this.data('height');
				title = $this.attr('title');

				if (!isItemInArray(items, src)) {
					items.push({
						src  : src,
						w    : width,
						h    : height,
						title: title
					});
				}
			});

			return items;
		};

		var isItemInArray = function(items, src) {
			var i;
			for (i = 0; i < items.length; i++) {
				if (items[i].src === src) {
					return true;
				}
			}

			return false;
		};
	};

	$(document).ready(function() {
		woodmartThemeModule.photoswipeImages();
	});
})(jQuery);

const htmlElement = document.getElementsByTagName('html')[0];
const windowWidth = window.innerWidth;

if (windowWidth > 1024 && windowWidth > htmlElement.offsetWidth) {
	const scrollbarWidth = window.innerWidth - htmlElement.offsetWidth;
	const styleElement = document.createElement('style');

	styleElement.textContent = `:root {--wd-scroll-w: ${scrollbarWidth}px;}`;
	document.head.appendChild(styleElement);
}
/* global woodmart_settings */
(function($) {
	woodmartThemeModule.scrollTop = function() {
		var $scrollTop = $('.scrollToTop');

		woodmartThemeModule.$window.on('scroll', function() {
			if ($(this).scrollTop() > 100) {
				$scrollTop.addClass('button-show');
			} else {
				$scrollTop.removeClass('button-show');
			}
		});

		$scrollTop.on('click', function() {
			$('html, body').animate({
				scrollTop: 0
			}, 800);
			return false;
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.scrollTop();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.searchFullScreen = function() {
		woodmartThemeModule.$body.on('click', '.wd-header-search.wd-display-full-screen > a, .wd-search-form.wd-display-full-screen-2', function(e) {
			e.preventDefault();

			var $this = $(this);
			var $wrapper = $('.wd-search-full-screen-2');

			if ($this.parent().find('.wd-search-dropdown').length > 0 || woodmartThemeModule.$body.hasClass('global-search-dropdown')) {
				return;
			}

			if (isOpened()) {
				closeWidget();
			} else {
				if ( ! $this.hasClass('wd-display-full-screen-2') ) {
					$wrapper = $('.wd-search-full-screen');
					calculationOffset();
				}

				setTimeout(function() {
					openWidget($wrapper);
				}, 10);
			}
		});

		woodmartThemeModule.$body.on('click', '.wd-close-search a, .wd-page-wrapper, .header-banner', function(event) {

			if (!$(event.target).is('.wd-close-search a') && $(event.target).closest('.wd-search-full-screen').length) {
				return;
			}

			if ( $(event.target).is('.wd-close-search a') ) {
				event.preventDefault();
			}

			if (isOpened()) {
				closeWidget();
			}
		});

		var closeByEsc = function(e) {
			if (e.keyCode === 27) {
				closeWidget();
				woodmartThemeModule.$body.unbind('keyup', closeByEsc);
			}
		};

		var closeWidget = function() {
			var $searchWrapper = $('[class*=wd-search-full-screen]');

			$('html').removeClass('wd-search-opened');
			$searchWrapper.removeClass('wd-opened');
			$searchWrapper.removeClass('wd-searched');
			$searchWrapper.trigger('wdCloseSearch');
		};

		var calculationOffset = function () {
			var $bar = $('#wpadminbar');
			var barHeight = $bar.length > 0 ? $bar.outerHeight() : 0;
			var $sticked = $('.whb-sticked');
			var $mainHeader = $('.whb-main-header');
			var offset;

			if ($sticked.length > 0) {
				if ($('.whb-clone').length > 0) {
					offset = $sticked.outerHeight() + barHeight;
				} else {
					offset = $mainHeader.outerHeight() + barHeight;
				}
			} else {
				offset = $mainHeader.outerHeight() + barHeight;
				if (woodmartThemeModule.$body.hasClass('header-banner-display')) {
					offset += $('.header-banner').outerHeight();
				}
			}

			$('.wd-search-full-screen').css('top', offset);
		}

		var openWidget = function($wrapper) {
			// Close by esc
			woodmartThemeModule.$body.on('keyup', closeByEsc);
			$('html').addClass('wd-search-opened');

			$wrapper.addClass('wd-opened');
			$wrapper.trigger('wdOpenSearch');

			setTimeout(function() {
				var $input = $wrapper.find('input[type="text"]');
				var length = $input.val().length;

				$input[0].setSelectionRange(length, length);
				$input.trigger('focus');
			}, 500);
		};

		var isOpened = function() {
			return $('html').hasClass('wd-search-opened');
		};
	};

	$(document).ready(function() {
		woodmartThemeModule.searchFullScreen();
	});
})(jQuery);

/* global woodmart_settings */
woodmartThemeModule.$document.on('wdShopPageInit', function () {
	woodmartThemeModule.searchHistory();
});

jQuery.each([
	'frontend/element_ready/wd_search.default'
], function(index, value) {
	woodmartThemeModule.wdElementorAddAction(value, function() {
		woodmartThemeModule.searchHistory();
	});
});

woodmartThemeModule.searchHistory = function() {
	var localStorageName = 'woodmart_search_history';
	var itemsLimit       = woodmart_settings.search_history_items_limit;

	if (woodmart_settings.is_multisite) {
		localStorageName += '_' + woodmart_settings.current_blog_id;
	}

	var init = function() {
		var forms = document.querySelectorAll('form.searchform');

		if (0 === forms.length || 'undefined' === typeof localStorage) {
			return;
		}

		forms.forEach(function(form) {
			var input       = form.querySelector('[type="text"]');
			var resultsNode = form.parentNode.querySelector('.wd-search-history');

			if (! resultsNode) {
				return;
			}

			form.addEventListener('submit', saveSearchHistoryEvent);

			input.addEventListener('wdOpenBeforeSearchContent', searchHistoryEvent);

			if (isFullScreenForm(form)) {
				renderSearchHistory(form, resultsNode);
			}

			resultsNode.addEventListener('mousedown', function(e) {
				e.preventDefault();
			});
		});
	}

	var isFullScreenForm = function (form) {
		return form.closest('.wd-search-full-screen') || form.closest('.wd-search-full-screen-2');
	}

	var saveSearchHistoryEvent = function (e) {
		var searchInput = e.target.querySelector('[type="text"]');
		
		addToSearchHistory(searchInput.value);
	}

	var updateHistoryEvent = function(e) {
		var value = this.textContent;

		addToSearchHistory(value);
	}

	var searchHistoryEvent = function(e) {
		var input         = this;
		var form          = input.parentNode;
		var resultsNode   = form.parentNode.querySelector('.wd-search-history');

		if (! resultsNode) {
			return;
		}

		renderSearchHistory(form, resultsNode);
	}

	var renderSearchHistory = function (form, resultsNode) {
		var searchHistory = getSearchHistory().reverse();

		resultsNode.innerHTML = '';

		if (searchHistory.length > 0) {
			var titleItem = createHistoryTitle();
			var ul = document.createElement('ul');

			resultsNode.appendChild(titleItem);
			resultsNode.appendChild(ul);

			searchHistory.forEach(function(searchQuery) {
				searchQuery  = searchQuery.replaceAll('%20', ' ');

				var postType = form.hasAttribute('data-post_type') ? form.getAttribute('data-post_type') : null;

				var url = new URL(woodmart_settings.home_url);

				url.searchParams.set('s', searchQuery);

				if (!postType) {
					postType = form.querySelector('[name="post_type"]') ? form.querySelector('[name="post_type"]').value : null;
				}

				if (null !== postType) {
					url.searchParams.set('post_type', postType);
				}

				var itemNode = createHistoryItem(searchQuery, url.href);

				resultsNode.querySelector('ul').appendChild(itemNode);
			});
		}
	}

	var createHistoryTitle = function() {
		var title    = document.createElement('span');
		var clearBtn = document.createElement('span');
		var wrapper  = document.createElement('div');

		title.textContent = woodmart_settings.search_history_title;
		title.classList.add('wd-search-title', 'title');
		wrapper.appendChild(title);

		clearBtn.classList.add('wd-sh-clear');
		clearBtn.classList.add('wd-role-btn');
		clearBtn.setAttribute('tabindex', '0');
		clearBtn.textContent = woodmart_settings.search_history_clear_all;
		clearBtn.addEventListener('click', clearAllEvent);
		wrapper.appendChild(clearBtn);

		wrapper.classList.add('wd-sh-head');

		return wrapper;
	}

	var createHistoryItem = function( text, href ) {
		var clearBtn = document.createElement('span');
		var linkNode = document.createElement('a');
		var item     = document.createElement('li');

		clearBtn.classList.add('wd-sh-clear');
		clearBtn.classList.add('wd-role-btn');
		clearBtn.setAttribute('tabindex', '0');
		clearBtn.addEventListener('click', clearItemEvent);

		linkNode.textContent = text;
		linkNode.setAttribute('href', href);
		linkNode.classList.add('wd-sh-link');
		linkNode.addEventListener('click', updateHistoryEvent);

		item.appendChild(linkNode);
		item.appendChild(clearBtn);

		return item;
	}

	var clearAllEvent = function(e) {
		e.preventDefault();

		localStorage.removeItem(localStorageName)

		this.closest('.wd-search-history').innerHTML = '';
	}

	var clearItemEvent = function(e) {
		e.preventDefault();

		var searchValue   = this.previousSibling.textContent.replaceAll('%20', ' ');
		var searchHistory = getSearchHistory();

		var newSearchHistory = searchHistory.filter(function(item) {
			return item !== searchValue;
		});

		localStorage.setItem(localStorageName, JSON.stringify(newSearchHistory));

		var listNode = this.closest('ul');

		this.closest('li').remove();

		if (0 === listNode.childElementCount) {
			listNode.closest('.wd-search-history').innerHTML = '';
		}
	}

	var getSearchHistory = function() {
		var data  = localStorage.getItem(localStorageName) ? JSON.parse(localStorage.getItem(localStorageName)) : [];

		data = data.filter(function(item) {
			return item !== "" && item !== null && item !== undefined;
		});

		// Limit to show items.
		if (itemsLimit > 0 && data.length > itemsLimit) {
			data = data.slice(-itemsLimit);
		}

		data = data.map(function(item) {
			return item.replaceAll( '%20', ' ' );
		});

		return data;
	}

	var addToSearchHistory = function (value) {
		var searchHistory = getSearchHistory();

		// Remove duplicate entries (case-insensitive) before adding the new search term.
		searchHistory = searchHistory.filter(function(item) {
			return item.toLowerCase().trim() !== value.toLowerCase().trim();
		});

		value = value.replace( '%20', ' ' );

		searchHistory.push(value.trim());

		localStorage.setItem(localStorageName, JSON.stringify(searchHistory));
	}

	init();
}

window.addEventListener('load',function() {
	woodmartThemeModule.searchHistory();
});

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdElementorColumnReady pjax:complete wdShopPageInit', function () {
		woodmartThemeModule.stickyColumn();
	});

	woodmartThemeModule.$window.on('elementor/frontend/init', function() {
		if (!elementorFrontend.isEditMode()) {
			return;
		}

		elementorFrontend.hooks.addAction('frontend/element_ready/container', function($wrapper) {
			var cid = $wrapper.data('model-cid');

			if (typeof elementorFrontend.config.elements.data[cid] !== 'undefined') {
				if (elementorFrontend.config.elements.data[cid].attributes.container_sticky) {
					$wrapper.addClass('wd-sticky-container-lg');
				} else {
					$wrapper.removeClass('wd-sticky-container-lg');
				}
				if (elementorFrontend.config.elements.data[cid].attributes.container_sticky_tablet) {
					$wrapper.addClass('wd-sticky-container-md-sm');
				} else {
					$wrapper.removeClass('wd-sticky-container-md-sm');
				}
				if (elementorFrontend.config.elements.data[cid].attributes.container_sticky_mobile) {
					$wrapper.addClass('wd-sticky-container-sm');
				} else {
					$wrapper.removeClass('wd-sticky-container-sm');
				}
			}
		});
	});

	woodmartThemeModule.stickyColumn = function() {
		$('.woodmart-sticky-column').each(function() {
			var $column = $(this),
			    offset  = 150;

			var classes = $column.attr('class').split(' ');

			for (var index = 0; index < classes.length; index++) {
				if (classes[index].indexOf('wd_sticky_offset_') >= 0) {
					var data = classes[index].split('_');
					offset = parseInt(data[3]);
				}
			}

			$column.find(' > .vc_column-inner > .wpb_wrapper').trigger('sticky_kit:detach');
			$column.find(' > .vc_column-inner > .wpb_wrapper').stick_in_parent({
				offset_top: offset
			});
		});

		$('.wd-elementor-sticky-column').each(function() {
			var $column = $(this);
			var offset = 150;
			var classes = $column.attr('class').split(' ');

			for (var index = 0; index < classes.length; index++) {
				if (classes[index].indexOf('wd_sticky_offset_') >= 0) {
					var data = classes[index].split('_');
					offset = parseInt(data[3]);
				}
			}

			var $widgetWrap = $column.find(' > .elementor-widget-wrap');

			if ($widgetWrap.length <= 0) {
				$widgetWrap = $column.find('> .elementor-widget-wrap');
			}

			$widgetWrap.stick_in_parent({
				offset_top: offset
			});
		});

		$(':is(.wp-block-wd-column, .wp-block-wd-off-sidebar, .wp-block-wd-off-content)[class*="wd-sticky-on-"]').each(function() {
			var $column = $(this);
			var offset  = 150;

			var classes = $column.attr('class').split(' ');

			for (var index = 0; index < classes.length; index++) {
				if (classes[index].indexOf('wd_sticky_offset_') >= 0) {
					var data = classes[index].split('_');
					offset = parseInt(data[3]);
				}
			}

			function initSticky() {
				var windowWidth = woodmartThemeModule.$window.width();

				$column.trigger('sticky_kit:detach');

				if ( ( ! $column.hasClass('wd-sticky-on-lg') && windowWidth > 1024 ) || ( ! $column.hasClass('wd-sticky-on-md-sm') && windowWidth <= 1024 && windowWidth > 768 ) || ( ! $column.hasClass('wd-sticky-on-sm') && windowWidth <= 768 ) ) {
					return;
				}

				$column.stick_in_parent({
					offset_top: offset
				});
			}

			initSticky();

			woodmartThemeModule.$window.on('resize', woodmartThemeModule.debounce(function() {
				initSticky();
			}, 300));
		});

		$('[class*="wd-sticky-container-"]').each(function() {
			var $column = $(this);

			function initSticky() {
				var windowWidth = woodmartThemeModule.$window.width();

				$column.trigger('sticky_kit:detach');

				if ( ( ! $column.hasClass('wd-sticky-container-lg') && windowWidth > 1024 ) || ( ! $column.hasClass('wd-sticky-container-md-sm') && windowWidth <= 1024 && windowWidth > 768 ) || ( ! $column.hasClass('wd-sticky-container-sm') && windowWidth <= 768 ) ) {
					return;
				}

				var carouselStyle = window.getComputedStyle($column[0]);
				var offset = parseInt( carouselStyle.getPropertyValue('--wd-sticky-offset'), 10);

				$column.stick_in_parent({
					offset_top: offset
				});
			}

			initSticky();

			woodmartThemeModule.$window.on('resize', woodmartThemeModule.debounce(function() {
				initSticky();
			}, 300));
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.stickyColumn();
	});
})(jQuery);

/* global woodmart_settings */
woodmartThemeModule.wdElementorAddAction('frontend/element_ready/container', function() {
	woodmartThemeModule.stickyContainer();
});

woodmartThemeModule.stickyContainer = function () {
	let windowWidth = woodmartThemeModule.windowWidth;

	function isRtl() {
		return document.querySelector('html').hasAttributes('dir') && 'rtl' === document.querySelector('html').getAttribute('dir');
	}

	function setInlineStyle(el, style) {
		let properties = Object.keys(style);

		if (0 === properties.length) {
			return;
		}

		properties.forEach(function(property) {
			el.style[property] = style[property];
		});
	}

	function getFixedStyles(el, offset) {
		let stickyContainerCloneStyles = window.getComputedStyle(el);
		let styles                     = {
			position: 'fixed',
			width: stickyContainerCloneStyles.width,
			marginTop: stickyContainerCloneStyles.marginTop,
			marginBottom: stickyContainerCloneStyles.marginBottom,
			top: `${offset}px`,
			bottom: '',
			zIndex: 99,
		}

		if ( isRtl() ) {
			styles['insetInlineEnd'] = `${el.getBoundingClientRect().left}px`;
		} else {
			styles['insetInlineStart'] = `${el.getBoundingClientRect().left}px`;
		}

		return styles;
	}

	function getAbsoluteStyles(el) {
		let styles = {
			position: 'absolute',
			top: '',
			bottom: '0px',
		};

		if ( isRtl() ) {
			styles['insetInlineEnd'] = `${el.offsetLeft}px`;
		} else {
			styles['insetInlineStart'] = `${el.offsetLeft}px`;
		}

		return styles;
	}

	function createClone(el, offset, position = 'fixed') {
		let styles = getFixedStyles(el, offset);

		if ( 'absolute' === position ) {
			styles = getAbsoluteStyles(el);
		}

		let clone  = el.cloneNode(true);

		clone.classList.add('wd-sticky-spacer');

		setInlineStyle(clone, {visibility: 'hidden'});

		// Fix duplicate clone id. Only for waitlist privacy policy input.
		var wtlPolicyCheck = clone.querySelector('#wd-wtl-policy-check');

		if ( wtlPolicyCheck ) {
			wtlPolicyCheck.id = wtlPolicyCheck.id + '-clone';
		}

		el.parentNode.insertBefore(clone, el);

		setInlineStyle(el, styles);

		return clone;
	}

	function removeClone(el, clone) {
		el.parentNode.removeChild(clone);

		el.style = '';
	}

	function getSiblings(el) {
		let siblings = [];

		if(! el.parentNode) {
			return siblings;
		}

		let sibling  = el.parentNode.firstChild;

		while (sibling) {
			if (sibling.nodeType === 1 && sibling !== el) {
				siblings.push(sibling);
			}

			sibling = sibling.nextSibling;
		}

		return siblings;
	}

	function makeThisContainerSticky(stickyContainer, responsiveSettings) {
		let elementId = stickyContainer.dataset.id;

		if ('undefined' === typeof elementId) {
			return;
		}

		let stickyContainerClone = document.querySelector(`.elementor-element-${elementId}.wd-sticky-spacer`);

		if ( ( responsiveSettings.is_mobile && ! stickyContainer.classList.contains( 'wd-sticky-container-mobile-yes' ) ) || ( responsiveSettings.is_tablet && ! stickyContainer.classList.contains( 'wd-sticky-container-tablet-yes' ) ) || ( responsiveSettings.is_desktop && ! stickyContainer.classList.contains( 'wd-sticky-container-yes' ) ) ) {
			if ( null !== stickyContainerClone ) {
				removeClone(stickyContainer, stickyContainerClone);
			}

			return;
		}

		let offsetClass                = Array.from(stickyContainer.classList).find(function (element) {
			return element.indexOf('wd-sticky-offset') !== -1;
		});
		let offset                     = 'undefined' !== typeof offsetClass ? parseInt(offsetClass.substring(offsetClass.lastIndexOf('-') + 1)) : 150;
		let scrollTop                  = woodmartThemeModule.$window.scrollTop();
		let stickyHolderHeight         = stickyContainer.offsetHeight;
		let stickyHeightToElementStart = stickyContainer.getBoundingClientRect().top + window.scrollY - offset;
		let isTopContainer             = stickyContainer.parentNode.parentNode.classList.contains('entry-content');
		let heightToElementParentEnd   = stickyContainer.parentNode.getBoundingClientRect().top + window.scrollY - offset + stickyContainer.parentNode.offsetHeight;

		if ( ! isTopContainer && null === stickyContainerClone && scrollTop > stickyHeightToElementStart) {
			let clonePosition = 'fixed';

			if ( scrollTop > heightToElementParentEnd ) {
				clonePosition = 'absolute';
			}

			stickyContainerClone = createClone(stickyContainer, offset, clonePosition);
		}

		if (null === stickyContainerClone) {
			return;
		}

		let heightToElementWrapperStart = stickyContainerClone.parentNode.getBoundingClientRect().top + window.scrollY - offset;
		let heightToElementWrapperEnd   = heightToElementWrapperStart + stickyContainerClone.parentNode.offsetHeight;
		let heightToElementStart        = stickyContainerClone.getBoundingClientRect().top + window.scrollY - offset;

		if (scrollTop < heightToElementStart) {
			removeClone(stickyContainer, stickyContainerClone);
		} else {
			if ('fixed' !== stickyContainer.style.position && scrollTop < (heightToElementWrapperEnd - stickyHolderHeight)) {
				let siblings             = getSiblings(stickyContainer);
				let absoluteColumnExists = siblings.find(function (el) {
					return 'absolute' === el.style.position;
				});

				if ( 'undefined' === typeof absoluteColumnExists ) {
					setInlineStyle(stickyContainer.parentNode, {position: ''});
				}

				setInlineStyle(stickyContainer, getFixedStyles(stickyContainerClone, offset));
			} else if ('absolute' !== stickyContainer.style.position && (stickyHeightToElementStart + stickyHolderHeight) > heightToElementWrapperEnd) {
				setInlineStyle(stickyContainer.parentNode, {position: 'relative'});
				setInlineStyle(stickyContainer, getAbsoluteStyles(stickyContainerClone));
			}
		}
	}

	function wipeSticky() {
		let stickyContainers = document.querySelectorAll(
			'.wd-sticky-container-yes, .wd-sticky-container-tablet-yes, .wd-sticky-container-mobile-yes'
		);
		
		stickyContainers.forEach(function (stickyContainer) {
			let elementId            = stickyContainer.dataset.id;
			let stickyContainerClone = document.querySelector(`.elementor-element-${elementId}.wd-sticky-spacer`);
			
			if ( stickyContainerClone ) {
				stickyContainerClone.remove()
			}
			
			document.querySelector(`.elementor-element-${elementId}`).style = '';
		});
	}

	function makeSticky() {
		window.addEventListener('scroll',function() {
			let stickyContainers = document.querySelectorAll('.wd-sticky-container-yes:not(.wd-sticky-spacer), .wd-sticky-container-tablet-yes:not(.wd-sticky-spacer), .wd-sticky-container-mobile-yes:not(.wd-sticky-spacer)');

			let responsiveSettings = {
				is_desktop: windowWidth > 1024,
				is_tablet : windowWidth > 768 && windowWidth < 1024,
				is_mobile : windowWidth <= 768,
			}

			stickyContainers.forEach(function(stickyContainer) {
				makeThisContainerSticky(stickyContainer, responsiveSettings);
			});
		});
	}

	wipeSticky();
	makeSticky();

	window.addEventListener('resize',function() {
		if ( 'undefined' !== typeof elementor ) {
			windowWidth = !isNaN(parseInt(elementor.$preview.css('--e-editor-preview-width'))) ? parseInt(elementor.$preview.css('--e-editor-preview-width')) : 1025;
		}
	});
}

window.addEventListener('load',function() {
	woodmartThemeModule.stickyContainer();
});

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.stickySocialButtons = function() {
		$('.wd-sticky-social').addClass('wd-loaded');
	};

	$(document).ready(function() {
		woodmartThemeModule.stickySocialButtons();
	});
})(jQuery);

woodmartThemeModule.$document.on('wdInstagramAjaxSuccess wdLoadDropdownsSuccess wdProductsTabsLoaded wdSearchFullScreenContentLoaded wdShopPageInit wdRecentlyViewedProductLoaded wdQuickViewOpen300', function() {
	woodmartThemeModule.carouselsInit();
});

[
	'frontend/element_ready/wd_products.default',
	'frontend/element_ready/wd_products_tabs.default',
	'frontend/element_ready/wd_product_categories.default',
	'frontend/element_ready/wd_products_brands.default',
	'frontend/element_ready/wd_blog.default',
	'frontend/element_ready/wd_portfolio.default',
	'frontend/element_ready/wd_images_gallery.default',
	'frontend/element_ready/wd_product_categories.default',
	'frontend/element_ready/wd_banner_carousel.default',
	'frontend/element_ready/wd_infobox_carousel.default',
	'frontend/element_ready/wd_instagram.default',
	'frontend/element_ready/wd_testimonials.default',
	'frontend/element_ready/wd_nested_carousel.default',
	'frontend/element_ready/wd_single_product_fbt_products.default',
	'frontend/element_ready/wd_slider.default',
].forEach( function (value) {
	woodmartThemeModule.wdElementorAddAction(value, function() {
		woodmartThemeModule.carouselsInit();
	});
});

woodmartThemeModule.carouselsInit = function() {
	if ('undefined' === typeof wdSwiper) {
		console.error('Swiper is not defined');

		return;
	}

	document.querySelectorAll('.wd-carousel-container > .wd-carousel-inner > .wd-carousel:not(.scroll-init)').forEach( function (carousel) {
		woodmartThemeModule.swiperInit(carousel);
	});

	const carouselOnScrollObserver = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				let carousel = entry.target;

				if (carousel && ! carousel.classList.contains('wd-initialized')) {
					woodmartThemeModule.swiperInit(carousel);
				}

				carouselOnScrollObserver.unobserve(carousel);
			}
		});
	}, { rootMargin: '200px 0px 200px 0px' });

	document.querySelectorAll('.wd-carousel-container > .wd-carousel-inner > .wd-carousel.scroll-init:not(.wd-initialized)').forEach((carousel) => {
		carouselOnScrollObserver.observe(carousel);
	});

	window.addEventListener('popstate', function() {
		document.querySelectorAll('.wd-carousel.wd-initialized').forEach( function (carousel) {
			if ('undefined' === typeof carousel.swiper) {
				carousel.classList.remove('wd-initialized');

				woodmartThemeModule.swiperInit(carousel);
			}
		});
	});
};

woodmartThemeModule.swiperInit = function(carousel, thumbs = false) {
	if ('undefined' === typeof wdSwiper) {
		console.error('Swiper is not defined');

		return;
	}

	if (carousel.closest('.woocommerce-product-gallery') && ! carousel.classList.contains('quick-view-gallery') || ( ! thumbs && 'undefined' !== typeof carousel.dataset.sync_child_id && document.querySelector('.wd-carousel[data-sync_parent_id=' + carousel.dataset.sync_child_id + ']') ) ) {
		return;
	}

	var carouselWrapper = carousel.closest('.wd-carousel-container');
	var carouselStyle = window.getComputedStyle(carousel);

	if (woodmartThemeModule.windowWidth <= 1024 && carouselWrapper.classList.contains('wd-carousel-dis-mb') || carousel.classList.contains('wd-initialized') ) {
		return;
	}

	var mainSlidesPerView = carouselStyle.getPropertyValue('--wd-col');
	var breakpointsSettings = woodmart_settings.carousel_breakpoints;
	var breakpoints = {};
	var carouselItemsLength = carousel.querySelectorAll('.wd-carousel-item').length;

	Object.entries(breakpointsSettings).forEach(( [size, key] ) => {
		var slidesPerView = carouselStyle.getPropertyValue('--wd-col-' + key );
		var enableScrollPerGroup = 'undefined' !== typeof carousel.dataset.scroll_per_page && 'yes' === carousel.dataset.scroll_per_page;

		if ( ! slidesPerView ) {
			slidesPerView = mainSlidesPerView;
		}

		if ( slidesPerView ) {
			breakpoints[ size ] = {
				slidesPerView : slidesPerView ? slidesPerView : 1
			};

			if ( 'yes' === carousel.dataset.wrap && parseInt(slidesPerView, 10 ) * 2 > carouselItemsLength || 'yes' === carousel.dataset.center_mode) {
				enableScrollPerGroup = false;
			}

			if ( enableScrollPerGroup && slidesPerView ) {
				breakpoints[ size ]['slidesPerGroup'] = parseInt(slidesPerView);
			}
		}
	});

	var config = {
		slidesPerView         : mainSlidesPerView,
		loop                  : 'yes' === carousel.dataset.wrap && (1 === parseInt(mainSlidesPerView, 10) || parseInt(mainSlidesPerView, 10) + 1 < carouselItemsLength),
		loopAddBlankSlides    : false,
		centeredSlides        : 'yes' === carousel.dataset.center_mode,
		autoHeight            : 'yes' === carousel.dataset.autoheight,
		grabCursor            : true,
		a11y                  : {
			enabled: true,
			prevSlideMessage: woodmart_settings.swiper_prev_slide_msg,
			nextSlideMessage: woodmart_settings.swiper_next_slide_msg,
			firstSlideMessage: woodmart_settings.swiper_first_slide_msg,
			lastSlideMessage: woodmart_settings.swiper_last_slide_msg,
			paginationBulletMessage: woodmart_settings.swiper_pagination_bullet_msg,
			slideLabelMessage: woodmart_settings.swiper_slide_label_msg,
		},
		breakpoints           : breakpoints,
		watchSlidesProgress   : true,
		slideClass            : 'wd-carousel-item',
		slideActiveClass      : 'wd-active',
		slideVisibleClass     : 'wd-slide-visible',
		slideNextClass        : 'wd-slide-next',
		slidePrevClass        : 'wd-slide-prev',
		slideFullyVisibleClass: 'wd-full-visible',
		slideBlankClass       : 'wd-slide-blank',
		lazyPreloaderClass    : 'wd-lazy-preloader',
		containerModifierClass: 'wd-',
		wrapperClass          : 'wd-carousel-wrap',
		simulateTouch         : ! carousel.closest('.block-editor-block-list__layout'),
		on                    : {
			init: function() {
				setTimeout(function() {
					woodmartThemeModule.$document.trigger('wdSwiperCarouselInited');
				}, 100);
			},
			slideChange: function() {
				woodmartThemeModule.$document.trigger('wood-images-loaded');
			}
		}
	};

	if ('undefined' !== typeof carousel.dataset.effect) {
		var effect = carousel.dataset.effect;

		if ('distortion' === effect) {
			effect = 'fade';
		}

		config.effect = effect;

		if ('parallax' === effect) {
			config.parallax = {
				enabled: true
			};

			carousel.querySelectorAll('.wd-slide-bg').forEach( function (slideBg) {
				slideBg.setAttribute('data-swiper-parallax', '50%');
			});
		}
	}

	if ('undefined' !== typeof carousel.dataset.sliding_speed && carousel.dataset.sliding_speed) {
		config.speed = carousel.dataset.sliding_speed;
	}

	var pagination = Array.prototype.filter.call(
		carouselWrapper.children,
		(element) => element.classList.contains('wd-nav-pagin-wrap'),
	).shift();

	if (pagination) {
		config.pagination = {
			el                     : pagination.querySelector('.wd-nav-pagin'),
			dynamicBullets         : pagination.classList.contains('wd-dynamic'),
			type                   : 'bullets',
			clickable              : true,
			bulletClass            : 'wd-nav-pagin-item',
			bulletActiveClass      : 'wd-active',
			modifierClass          : 'wd-type-',
			lockClass              : 'wd-lock',
			currentClass           : 'wd-current',
			totalClass             : 'wd-total',
			hiddenClass            : 'wd-hidden',
			clickableClass         : 'wd-clickable',
			horizontalClass        : 'wd-horizontal',
			verticalClass          : 'wd-vertical',
			paginationDisabledClass: 'wd-disabled',
			renderBullet           : function(index, className) {
				var innerContent = '';
				var label = woodmart_settings.swiper_pagination_bullet_msg.replace('{{index}}', index + 1);

				if (pagination.classList.contains('wd-style-number-2')) {
					innerContent = index + 1;

					if ( 9 >= innerContent ) {
						innerContent = '0' + innerContent;
					}
				}

				return '<li class="' + className + '" tabindex="0" aria-label="' + label + '"><span>' + innerContent + '</span></li>';
			}
		};
	}

	var navigationWrapper = Array.prototype.filter.call(
		carouselWrapper.querySelector('.wd-carousel-inner').children,
		(element) => element.classList.contains('wd-nav-arrows'),
	).shift();

	if (navigationWrapper) {
		config.navigation = {
			nextEl       : navigationWrapper.querySelector('.wd-btn-arrow.wd-next'),
			prevEl       : navigationWrapper.querySelector('.wd-btn-arrow.wd-prev'),
			disabledClass: 'wd-disabled',
			lockClass    : 'wd-lock',
			hiddenClass  : 'wd-hide'
		};
	}

	var scrollbar = Array.prototype.filter.call(
		carouselWrapper.children,
		(element) => element.classList.contains('wd-nav-scroll'),
	).shift();

	if (scrollbar) {
		config.scrollbar = {
			el                    : scrollbar,
			lockClass             : 'wd-lock',
			dragClass             : 'wd-nav-scroll-drag',
			scrollbarDisabledClass: 'wd-disabled',
			horizontalClass       : 'wd-horizontal',
			verticalClass         : 'wd-vertical',
			draggable             : true
		};

		config.on.scrollbarDragStart = function () {
			scrollbar.classList.add('wd-grabbing');
		};
		config.on.scrollbarDragEnd = function () {
			scrollbar.classList.remove('wd-grabbing');
		};
	}

	if ('undefined' !== typeof carousel.dataset.autoplay && 'yes' === carousel.dataset.autoplay) {
		config.autoplay = {
			delay: carousel.dataset.speed ? carousel.dataset.speed : 5000,
			pauseOnMouseEnter: true
		};
	}

	if ('undefined' !== typeof carousel.dataset.sync_parent_id) {
		var childCarousel = document.querySelector('.wd-carousel[data-sync_child_id=' + carousel.dataset.sync_parent_id + ']');

		if ( childCarousel ) {
			var childCarouselStyle = window.getComputedStyle(childCarousel);
			var mainSlidesPerViewChild = childCarouselStyle.getPropertyValue('--wd-col');

			if ( mainSlidesPerViewChild === mainSlidesPerView ) {
				config.controller = {
					control: woodmartThemeModule.swiperInit(childCarousel, true),
				}
			} else {
				config.thumbs = {
					swiper               : woodmartThemeModule.swiperInit(childCarousel, true),
					slideThumbActiveClass: 'wd-thumb-active',
					thumbsContainerClass : 'wd-thumbs'
				};
			}
		}
	}

	carousel.querySelectorAll('link').forEach(function (link) {
		var linkClone = link.cloneNode(false);

		carouselWrapper.append(linkClone);

		linkClone.addEventListener('load', function() {
			setTimeout(function () {
				link.remove();
			}, 500);
		}, false);
	});

	const swiper = new wdSwiper(carousel, config);

	if (config.controller) {
		swiper.controller.control.controller.control = swiper;
	}

	if (carouselWrapper && carouselWrapper.classList.contains('wd-slider')) {
		swiper.on('realIndexChange', function (swiper) {
			setTimeout(function () {
				carousel.dispatchEvent(new CustomEvent('wdSlideChange', {
					detail: {activeIndex: swiper.realIndex}
				}));
			},100);
		});
	}

	return swiper;
}

window.addEventListener('load',function() {
	woodmartThemeModule.carouselsInit();
});
/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdShopPageInit', function() {
		woodmartThemeModule.widgetCollapse();
	});

	woodmartThemeModule.$window.on('resize', woodmartThemeModule.debounce(function() {
		woodmartThemeModule.widgetCollapse();
	}, 300));

	woodmartThemeModule.widgetCollapse = function() {
		var $footer = $('.main-footer .footer-widget');

		if ('yes' === woodmart_settings.collapse_footer_widgets && 0 < $footer.length) {
			if (woodmartThemeModule.$window.innerWidth() <= 575) {
				$footer.addClass('wd-widget-collapse');
			} else {
				$footer.removeClass('wd-widget-collapse');
				$footer.find('> *:not(.widget-title, style)').show();
			}
		}

		$('.wd-widget-collapse .widget-title').off('click').on('click', function() {
			var $title = $(this);
			var $widget = $title.parent();
			var $content = $widget.find('> *:not(.widget-title, style)');

			if ($widget.hasClass('wd-opened')) {
				$widget.removeClass('wd-opened');
				$content.stop().slideUp(200);
			} else {
				$widget.addClass('wd-opened');
				$content.stop().slideDown(200);
				woodmartThemeModule.$document.trigger('wood-images-loaded');
			}
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.widgetCollapse();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.widgetsHidable = function() {
		woodmartThemeModule.$document.on('click', '.widget-hidable .widget-title', function() {
			var $this = $(this);
			var $content = $this.siblings('ul, div, form, label, select');

			$this.parent().toggleClass('widget-hidden');
			$content.stop().slideToggle(200);
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.widgetsHidable();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.headerBanner = function() {
		var banner_version = woodmart_settings.header_banner_version;

		if ( typeof Cookies === 'undefined' ) {
			return;
		}

		if ('closed' === Cookies.get('woodmart_tb_banner_' + banner_version) || 'no' === woodmart_settings.header_banner_close_btn || 'no' === woodmart_settings.header_banner_enabled) {
			return;
		}

		if (!woodmartThemeModule.$body.hasClass('page-template-maintenance')) {
			woodmartThemeModule.$body.addClass('header-banner-display');
		}

		$('.header-banner').on('click', '.close-header-banner', function(e) {
			e.preventDefault();
			closeBanner();
		});

		var closeBanner = function() {
			woodmartThemeModule.$body.removeClass('header-banner-display').addClass('header-banner-hide');

			Cookies.set('woodmart_tb_banner_' + banner_version, 'closed', {
				expires: parseInt(woodmart_settings.banner_version_cookie_expires),
				path   : '/',
				secure : woodmart_settings.cookie_secure_param
			});
		};
	};

	$(document).ready(function() {
		woodmartThemeModule.headerBanner();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.headerBuilder = function() {
		var $header         = $('.whb-header'),
		    $headerBanner   = $('.header-banner'),
		    $stickyElements = $('.whb-sticky-row'),
		    $firstSticky    = '',
		    $window         = woodmartThemeModule.$window,
		    isSticked       = false,
		    stickAfter      = 300,
		    cloneHTML       = '',
		    previousScroll,
		    isHideOnScroll  = $header.hasClass('whb-hide-on-scroll');

		$stickyElements.each(function() {
			var $this = $(this);

			if ($this[0].offsetHeight > 10) {
				$firstSticky = $this;
				return false;
			}
		});

		// Real header sticky option
		if ($header.hasClass('whb-sticky-real') || $header.hasClass('whb-scroll-slide')) {
			var $adminBar = $('#wpadminbar');
			var headerHeight = $header.find('.whb-main-header')[0].offsetHeight;
			var adminBarHeight = $adminBar.length > 0 ? $adminBar[0].offsetHeight : 0;

			if ($header.hasClass('whb-sticky-real')) {
				// if no sticky rows
				if ($firstSticky.length === 0 || $firstSticky[0].offsetHeight < 10 || 'undefined' !== typeof elementorFrontend && elementorFrontend.isEditMode()) {
					return;
				}

				$header.addClass('whb-sticky-prepared');

				stickAfter = Math.ceil($firstSticky.offset().top) - adminBarHeight;
			}

			if ($header.hasClass('whb-scroll-slide')) {
				stickAfter = headerHeight + adminBarHeight;
			}
		}

		if ($header.hasClass('whb-sticky-clone')) {
			var data = [];
			data['cloneClass'] = $header.find('.whb-general-header').attr('class');

			if (isHideOnScroll) {
				data['wrapperClasses'] = 'whb-hide-on-scroll';
			}

			if ($('.whb-clone').length) {
				$('.whb-clone').remove();
			}

			cloneHTML = woodmart_settings.whb_header_clone;

			cloneHTML = cloneHTML.replace(/<%([^%>]+)?%>|{{([^{}]+)}}/g, function(replacement) {
				var selector = replacement.slice(2, -2);

				return $header.find(selector).length
					? $('<div>')
						.append($header.find(selector).first().clone())
						.html()
					: (data[selector] !== undefined) ? data[selector] : '';
			});

			cloneHTML = cloneHTML.replace(/<link[^>]*>/g, '');
			cloneHTML = cloneHTML.replace('whb-col-1', '');
			cloneHTML = cloneHTML.replace('dropdowns-loading', '');

			$header.after(cloneHTML);
			$header = $header.parent().find('.whb-clone');

			$header.find('.whb-row').removeClass('whb-flex-equal-sides').addClass('whb-flex-flex-middle');

			window.dispatchEvent(new CustomEvent('wdHeaderBuilderCloneCreated'));
		}

		$window.on('scroll', function() {
			var after = stickAfter;
			var currentScroll = woodmartThemeModule.$window.scrollTop();
			var windowHeight = woodmartThemeModule.$window.height();
			var documentHeight = woodmartThemeModule.$document.height();

			if ($headerBanner.length > 0 && woodmartThemeModule.$body.hasClass('header-banner-display')) {
				after += $headerBanner[0].offsetHeight;
			}

			if (!$('.close-header-banner').length && $header.hasClass('whb-scroll-stick')) {
				after = stickAfter;
			}

			if (currentScroll > after) {
				stickHeader();
			} else {
				unstickHeader();
			}

			var startAfter = 100;

			if ($header.hasClass('whb-scroll-stick')) {
				startAfter = 500;
			}

			if (isHideOnScroll) {
				if (previousScroll - currentScroll > 0 && currentScroll > after) {
					$header.addClass('whb-scroll-up');
					$header.removeClass('whb-scroll-down');
				} else if (currentScroll - previousScroll > 0 && currentScroll + windowHeight !== documentHeight && currentScroll > (after + startAfter)) {
					$header.addClass('whb-scroll-down');
					$header.removeClass('whb-scroll-up');
				} else if (currentScroll <= after) {
					$header.removeClass('whb-scroll-down');
					$header.removeClass('whb-scroll-up');
				} else if (currentScroll + windowHeight >= documentHeight - 5) {
					$header.addClass('whb-scroll-up');
					$header.removeClass('whb-scroll-down');
				}
			}

			previousScroll = currentScroll;
		});

		function stickHeader() {
			if (isSticked) {
				return;
			}

			isSticked = true;
			$header.addClass('whb-sticked');
			menuDropdownRecalc();
		}

		function unstickHeader() {
			if (!isSticked) {
				return;
			}

			isSticked = false;
			$header.removeClass('whb-sticked');
			menuDropdownRecalc();
		}

		function menuDropdownRecalc() {
			if (!$header.hasClass('whb-boxed')) {
				return;
			}

			$('.wd-offsets-calculated .wd-dropdown-menu').attr('style', '');
			$('.wd-offsets-calculated').removeClass('wd-offsets-calculated');
			woodmartThemeModule.$window.trigger('wdHeaderBuilderStickyChanged');
		}

		woodmartThemeModule.$document.trigger('wdHeaderBuilderInited');
	};

	['wdEventStarted', 'wdUpdatedHeader'].forEach((eventName) => {
		window.addEventListener(eventName, function () {
			woodmartThemeModule.headerBuilder();
		});
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.mobileSearchIcon = function() {
		woodmartThemeModule.$body.on('click', '.wd-header-search-mobile:not(.wd-display-full-screen, .wd-display-full-screen-2)', function(e) {
			e.preventDefault();
			var $nav = $('.mobile-nav');

			if (!$nav.hasClass('wd-opened')) {
				$(this).addClass('wd-opened');
				$nav.addClass('wd-opened');
				$('.wd-close-side').addClass('wd-close-side-opened');
				$('.mobile-nav .searchform').find('input[type="text"]').trigger('focus');
			}
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.mobileSearchIcon();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdShopPageInit', function() {
		woodmartThemeModule.categoriesMenuBtns();
		woodmartThemeModule.categoriesMenu();
	});

	jQuery.each([
		'frontend/element_ready/wd_product_categories.default',
		'frontend/element_ready/wd_page_title.default',
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.categoriesMenuBtns();
			woodmartThemeModule.categoriesMenu();
		});
	});

	woodmartThemeModule.categoriesMenu = function() {
		var $categories = $('.wd-nav-product-cat');
		var isProcessing = false;

		if (woodmartThemeModule.$window.width() > 1024) {
			$categories.stop().attr('style', '');
		}

		var time = 200;

		$categories.each(function() {
			var $productCat = $(this);
			var $thisCategories = $productCat.parents('.wd-nav-accordion-mb-on');
			var $showCat = $thisCategories.find('wd-btn-show-cat');
			var isAccordionOnMobile = $thisCategories.hasClass('wd-nav-accordion-mb-on');

			var isOpened = function() {
				return $productCat.hasClass('categories-opened');
			};

			var openCats = function() {
				$showCat.addClass('wd-active');
				$productCat.addClass('categories-opened').stop().slideDown(time);
				woodmartThemeModule.$document.trigger('wood-images-loaded');
			};

			var closeCats = function() {
				$showCat.removeClass('wd-active');
				$productCat.removeClass('categories-opened').stop().slideUp(time);
			};

			$thisCategories.find('.wd-nav-opener').off('click').on('click', function(e) {
				var $this = $(this);
				e.preventDefault();

				if (! isProcessing) {
					isProcessing = true;

					setTimeout(() => {
						isProcessing = false;
					}, time);

					if ($this.closest('.has-sub').find('> ul').hasClass('child-open')) {
						$this.removeClass('wd-active').closest('.has-sub').find('> ul').slideUp(time).removeClass('child-open');
					} else {
						$this.addClass('wd-active').closest('.has-sub').find('> ul').slideDown(time).addClass('child-open');
					}
				}

				woodmartThemeModule.$document.trigger('wood-images-loaded');
			});

			$thisCategories.find('.wd-btn-show-cat > a').off('click').on('click', function(e) {
				e.preventDefault();

				if (! isProcessing && isAccordionOnMobile) {
					isProcessing = true;

					setTimeout(() => {
						isProcessing = false;
					}, time);

					if (isOpened($productCat)) {
						closeCats();
					} else {
						openCats();
						woodmartThemeModule.$document.trigger('wood-images-loaded');
					}
				}
			});

			$thisCategories.find('.wd-nav-product-cat a').off('click').on('click', function(e) {
				if (!$(e.target).hasClass('wd-nav-opener')) {
					closeCats();
					$productCat.stop().attr('style', '');
				}
			});
		});
	};

	woodmartThemeModule.categoriesMenuBtns = function() {
		$('.wd-nav-product-cat.wd-mobile-accordion').each(function() {
			var $this        = $(this);
			var iconDropdown = '<span class="wd-nav-opener"></span>';
			var $ulWrapper   =  $this.find('li > ul').parent();
			var $navOpeners  = $ulWrapper.find('.wd-nav-opener');

			if ( ('undefined' !== typeof elementor && elementor.hasOwnProperty('$preview') && elementor.$preview.width() > 1024)  || woodmartThemeModule.windowWidth > 1024 ) {
				$navOpeners.remove();
				return;
			}

			$navOpeners.remove();
			$ulWrapper.addClass('has-sub').append(iconDropdown);
		});
	};

	woodmartThemeModule.$window.on('resize', woodmartThemeModule.debounce(function() {
		woodmartThemeModule.categoriesMenuBtns();
		woodmartThemeModule.categoriesMenu();
	}, 300));

	$(document).ready(function() {
		woodmartThemeModule.categoriesMenuBtns();
		woodmartThemeModule.categoriesMenu();
	});
})(jQuery);

woodmartThemeModule.$document.on('wdShopPageInit', function() {
	woodmartThemeModule.categoriesMenuSideHidden();
});

jQuery.each([
	'frontend/element_ready/wd_product_categories.default',
	'frontend/element_ready/wd_page_title.default',
], function(index, value) {
	woodmartThemeModule.wdElementorAddAction(value, function() {
		if ( 'function' === typeof woodmartThemeModule.closeMobileNavigation ) {
			woodmartThemeModule.closeMobileNavigation();
		}

		woodmartThemeModule.categoriesMenuSideHidden();
	});
});

woodmartThemeModule.showHideMobileTollBarButton = function() {
	var categoryMenuInStartPosition = document.querySelector('.wd-nav-product-cat-wrap .wd-nav-product-cat, .page-title .wd-nav-product-cat');
	var toolBarCategoriesBatton     = document.querySelector('.wd-toolbar-shop-cat');

	if ( ! toolBarCategoriesBatton ) {
		return;
	}

	battonSettings = 'settings' in toolBarCategoriesBatton.dataset ? JSON.parse( toolBarCategoriesBatton.dataset.settings ) : {};

	if ( ! battonSettings.hasOwnProperty('shop_categories_ancestors') || "0" === battonSettings.shop_categories_ancestors || "no" === battonSettings.shop_categories_ancestors ) {
		return;
	}

	if ( ! categoryMenuInStartPosition ) {
		toolBarCategoriesBatton.classList.add('wd-hide');
	} else if ( toolBarCategoriesBatton.classList.contains('wd-hide') ) {
		toolBarCategoriesBatton.classList.remove('wd-hide');
	}
}

woodmartThemeModule.$document.on('pjax:beforeSend', function() {
	var sideHiddenCat       = document.querySelector('.wd-side-hidden-cat');
	var sideHiddenCatChilds = sideHiddenCat ? sideHiddenCat.childNodes : null;
	var showCatBtn          = document.querySelector('.wd-nav-product-cat-wrap .wd-btn-show-cat, .page-title .wd-btn-show-cat');
	var oldPlaceWrapper     = showCatBtn ? showCatBtn.parentNode : null;

	if ( sideHiddenCatChilds && oldPlaceWrapper ) {
		for (var i = 0; i < sideHiddenCatChilds.length; i++) {
			oldPlaceWrapper.appendChild(sideHiddenCatChilds[i].cloneNode(true));
		}
	}
});

woodmartThemeModule.categoriesMenuSideHidden = function() {
	var openers = document.querySelectorAll('.wd-btn-show-cat, .wd-toolbar-shop-cat');

	woodmartThemeModule.showHideMobileTollBarButton();

	openers.forEach(function(opener) {
		opener.addEventListener('click', function(e) {
			e.preventDefault();

			var sideHiddenCat           = document.querySelector('.wd-side-hidden-cat');
			var categoryMenu            = document.querySelector('.wd-nav-product-cat');
			var shopCategoriesAncestors = false;

			if ( ! categoryMenu || ! ( 'sideCategories' in categoryMenu.dataset ) ) {
				return;
			}

			if  ( sideHiddenCat ) {
				sideHiddenCat.remove();

				sideHiddenCat = document.querySelector('.wd-side-hidden-cat');
			}

			var sideCategories = JSON.parse(categoryMenu.dataset.sideCategories);

			if ( sideCategories.hasOwnProperty('shop_categories_ancestors') && sideCategories.shop_categories_ancestors && "0" !== sideCategories.shop_categories_ancestors && "no" !== sideCategories.shop_categories_ancestors ) {
				shopCategoriesAncestors = true;
			}

			if ( categoryMenu && ! sideHiddenCat ) {
				var newSideHiddenCat = document.createElement("div");

				newSideHiddenCat.classList.add(
					'mobile-nav',
					'wd-side-hidden',
					'wd-side-hidden-cat',
					'wd-' + sideCategories.mobile_categories_position
				);

				if ( 'default' !== sideCategories.mobile_categories_color_scheme ) {
					newSideHiddenCat.classList.add('color-scheme-' + sideCategories.mobile_categories_color_scheme);
				}

				if ( 'only_arrow' === sideCategories.mobile_categories_submenu_opening_action ) {
					newSideHiddenCat.classList.add('wd-opener-arrow');
				} else if ( 'item_and_arrow' === sideCategories.mobile_categories_submenu_opening_action ) {
					newSideHiddenCat.classList.add('wd-opener-item');
				}

				if ('side-hidden' === sideCategories.mobile_categories_layout) {
					if ( categoryMenu.classList.contains('wd-style-underline') ) {
						categoryMenu.classList.remove('wd-style-underline');
					}

					if ( categoryMenu.classList.contains('wd-style-bg') ) {
						categoryMenu.classList.remove('wd-style-bg');
					}

					categoryMenu.querySelectorAll('.wd-dropdown.wd-dropdown-menu').forEach(function(item) {
						item.classList.remove('wd-dropdown', 'wd-dropdown-menu');
					});

					categoryMenu.classList.add(
						'wd-nav-mobile',
						'wd-layout-' + sideCategories.mobile_categories_menu_layout
					);
	
					if ( 'drilldown' === sideCategories.mobile_categories_menu_layout ) {
						categoryMenu.classList.add('wd-drilldown-' + sideCategories.mobile_categories_drilldown_animation)
					}
				}
	
				if ( categoryMenu.previousElementSibling && categoryMenu.previousElementSibling.classList.contains('wd-heading') ) {	
					newSideHiddenCat.appendChild(categoryMenu.previousElementSibling);
				}
	
				newSideHiddenCat.appendChild(categoryMenu);
				document.body.appendChild(newSideHiddenCat);

				sideHiddenCat        = document.querySelector('.wd-side-hidden-cat');
				var	dropDownCats     = sideHiddenCat.querySelectorAll('.wd-nav-mobile .menu-item-has-children');
				var	closeSideWidgets = sideHiddenCat.querySelectorAll('.login-side-opener, .close-side-widget');

				if ('function' === typeof woodmartThemeModule.mobileNavigationAddOpeners && ! shopCategoriesAncestors) {
					woodmartThemeModule.mobileNavigationAddOpeners(dropDownCats);
				}

				if ('function' === typeof woodmartThemeModule.mobileNavigationClickAction  && ! shopCategoriesAncestors) {
					woodmartThemeModule.mobileNavigationClickAction(sideHiddenCat);
				}

				if ('function' === typeof woodmartThemeModule.mobileNavigationCloseSideWidgets) {
					woodmartThemeModule.mobileNavigationCloseSideWidgets( closeSideWidgets );
				}
			}

			if (sideHiddenCat.classList.contains('wd-opened') && 'function' === typeof woodmartThemeModule.closeMobileNavigation ) {
				woodmartThemeModule.closeMobileNavigation();
			} else if ( 'function' === typeof woodmartThemeModule.openMobileNavigation ) {
				setTimeout(function () {
					var sideHiddenCatParrent = sideHiddenCat.parentNode;

					if ( sideHiddenCatParrent ) {
						sideHiddenCatParrent.classList.add('wd-opened');
					}

					woodmartThemeModule.openMobileNavigation(sideHiddenCat);
				}, 10);
			}
		});
	});
};

window.addEventListener('load',function() {
	woodmartThemeModule.categoriesMenuSideHidden();
});

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.fullScreenMenu = function() {
		$('.wd-header-fs-nav > a').on('click', function(e) {
			e.preventDefault();

			var $menu = $('.wd-fs-menu');

			$menu.addClass('wd-opened');
			$menu.trigger('wdOpenSide');
		});

		woodmartThemeModule.$document.on('keyup', function(e) {
			if (e.keyCode === 27) {
				$('.wd-fs-close').trigger('click');
			}
		});

		$('.wd-fs-close').on('click', function() {
			var $menu = $('.wd-fs-menu');

			$menu.removeClass('wd-opened');
			$menu.trigger('wdCloseSide');

			setTimeout(function() {
				$('.wd-nav-fs .menu-item-has-children').removeClass('sub-menu-open');
				$('.wd-nav-fs .menu-item-has-children .wd-nav-opener').removeClass('wd-active');
			}, 200);
		});

		$('.wd-nav-fs > .menu-item-has-children > a, .wd-nav-fs .wd-dropdown-fs-menu.wd-design-default .menu-item-has-children > a').append('<span class="wd-nav-opener"></span>');

		$('.wd-nav-fs').on('click', '.wd-nav-opener', function(e) {
			e.preventDefault();
			var $icon       = $(this),
			    $parentItem = $icon.parent().parent();

			if ($parentItem.hasClass('sub-menu-open')) {
				$parentItem.removeClass('sub-menu-open');
				$icon.removeClass('wd-active');
			} else {
				$parentItem.siblings('.sub-menu-open').find('.wd-nav-opener').removeClass('wd-active');
				$parentItem.siblings('.sub-menu-open').removeClass('sub-menu-open');
				$parentItem.addClass('sub-menu-open');
				$icon.addClass('wd-active');
			}
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.fullScreenMenu();
	});

	window.addEventListener('wdUpdatedHeader', function () {
		woodmartThemeModule.fullScreenMenu();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.menuDropdownsAJAX = function() {
		window.addEventListener('wdEventStarted', function() {
			$('.menu').has('.dropdown-load-ajax').each(function() {
				var $menu = $(this);

				if ($menu.hasClass('dropdowns-loading') || $menu.hasClass('dropdowns-loaded')) {
					return;
				}

				if (woodmartThemeModule.windowWidth <= 1024) {
					setTimeout(function() {
						loadDropdowns($menu);
					}, 500);
				} else {
					loadDropdowns($menu);
				}
			});
		});

		function loadDropdowns($menu) {
			$menu.addClass('dropdowns-loading');

			var storageKey = woodmart_settings.menu_storage_key + '_' + $menu.attr('id');
			var storedData = false;

			var $items = $menu.find('.dropdown-load-ajax'),
			    ids    = [];

			$items.each(function() {
				var $placeholder = $(this).find('.dropdown-html-placeholder');
				if ($placeholder.length > 0) {
					ids.push($placeholder.data('id'));
				}
			});

			if (woodmart_settings.ajax_dropdowns_save && woodmartThemeModule.supports_html5_storage) {
				var unparsedData = localStorage.getItem(storageKey);

				try {
					storedData = JSON.parse(unparsedData);
				}
				catch (e) {
					console.log('cant parse Json', e);
				}
			}
			if (storedData) {
				renderResults(storedData);
			} else {
				if (ids.length === 0) {
					$menu.addClass('dropdowns-loaded');
					$menu.removeClass('dropdowns-loading');
					return;
				}

				$.ajax({
					url     : woodmart_settings.ajaxurl,
					data    : {
						action: 'woodmart_load_html_dropdowns',
						ids   : ids
					},
					dataType: 'json',
					method  : 'POST',
					success : function(response) {
						if (response.status === 'success') {
							renderResults(response.data);
							if (woodmart_settings.ajax_dropdowns_save && woodmartThemeModule.supports_html5_storage) {
								try {
									localStorage.setItem(storageKey, JSON.stringify(response.data));
								} catch (e) {}
							}
						} else {
							console.log('loading html dropdowns returns wrong data - ', response.message);
						}
					},
					error   : function() {
						console.log('loading html dropdowns ajax error');
					}
				});
			}

			function renderResults(data) {
				Object.keys(data).forEach(function(id) {
					woodmartThemeModule.removeDuplicatedStylesFromHTML(data[id], function(html) {
						$menu.find('[data-id="' + id + '"]').replaceWith(html);

						$menu.addClass('dropdowns-loaded');
						setTimeout(function() {
							$menu.removeClass('dropdowns-loading');
						}, 1000);
					});
				});

				setTimeout(function() {
					woodmartThemeModule.$document.trigger('wdLoadDropdownsSuccess');
				}, 500);
			}
		}
	};

	$(document).ready(function() {
		woodmartThemeModule.menuDropdownsAJAX();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.menuOffsets = function() {
		var setOffset = function(li) {
			var $dropdown = li.find(' > .wd-dropdown-menu');
			var dropdownWidth = $dropdown.outerWidth();
			var dropdownOffset = $dropdown.offset();
			var toRight;
			var viewportWidth;
			var dropdownOffsetRight;

			$dropdown.attr('style', '');

			if (!dropdownWidth || !dropdownOffset) {
				return;
			}

			if ($dropdown.hasClass('wd-design-full-width') || $dropdown.hasClass('wd-design-aside')) {
				viewportWidth = woodmartThemeModule.$window.width();

				if (woodmartThemeModule.$body.hasClass('rtl')) {
					dropdownOffsetRight = viewportWidth - dropdownOffset.left - dropdownWidth;

					if (dropdownOffsetRight + dropdownWidth >= viewportWidth) {
						toRight = dropdownOffsetRight + dropdownWidth - viewportWidth;

						$dropdown.css({
							right: -toRight
						});
					}
				} else {
					if (dropdownOffset.left + dropdownWidth >= viewportWidth) {
						toRight = dropdownOffset.left + dropdownWidth - viewportWidth;

						$dropdown.css({
							left: -toRight
						});
					}
				}
			} else if ($dropdown.hasClass('wd-design-sized') || $dropdown.hasClass('wd-design-full-height')) {
				viewportWidth = woodmart_settings.site_width;

				if (woodmartThemeModule.$window.width() < viewportWidth || ! viewportWidth || li.parents('.whb-header').hasClass('whb-full-width')) {
					viewportWidth = woodmartThemeModule.$window.width();
				}

				dropdownOffsetRight = viewportWidth - dropdownOffset.left - dropdownWidth;

				var extraSpace = 15;
				var containerOffset = (woodmartThemeModule.$window.width() - viewportWidth) / 2;
				var dropdownOffsetLeft;
				var $stickyCat = $('.wd-sticky-nav');

				if (woodmartThemeModule.$body.hasClass('wd-sticky-nav-enabled') && $stickyCat.length) {
					extraSpace -= $stickyCat.width() / 2;
				}

				if (woodmartThemeModule.$body.hasClass('rtl')) {
					dropdownOffsetLeft = containerOffset + dropdownOffsetRight;

					if (dropdownOffsetLeft + dropdownWidth >= viewportWidth) {
						toRight = dropdownOffsetLeft + dropdownWidth - viewportWidth;

						$dropdown.css({
							right: -toRight - extraSpace
						});
					}
				} else {
					dropdownOffsetLeft = dropdownOffset.left - containerOffset;

					if (dropdownOffsetLeft + dropdownWidth >= viewportWidth) {
						toRight = dropdownOffsetLeft + dropdownWidth - viewportWidth;

						$dropdown.css({
							left: -toRight - extraSpace
						});
					}
				}
			}
		};

		$('.wd-header-main-nav ul.menu > li, .wd-header-secondary-nav ul.menu > li, .widget_nav_mega_menu ul.menu:not(.wd-nav-vertical) > li, .wd-header-main-nav .wd-dropdown.wd-design-aside ul > li').each(function() {
			var $menu = $(this);

			if ($menu.hasClass('menu-item')) {
				$menu = $(this).parent();
			}

			function recalc() {
				if ($menu.hasClass('wd-offsets-calculated') || $menu.parents('.wd-design-aside').length) {
					return;
				}

				$menu.find(' > .menu-item-has-children').each(function() {
					setOffset($(this));
				});

				woodmartThemeModule.$document.trigger('resize.vcRowBehaviour');

				$menu.addClass('wd-offsets-calculated');
			}

			$menu.on('mouseenter mousemove', function() {
				recalc()
			});

			woodmartThemeModule.$window.on('wdHeaderBuilderStickyChanged', recalc);

			if ('yes' === woodmart_settings.clear_menu_offsets_on_resize) {
				setTimeout(function() {
					woodmartThemeModule.$window.on('resize', woodmartThemeModule.debounce(function() {
						$menu.removeClass('wd-offsets-calculated');
						$menu.find(' > .menu-item-has-children > .wd-dropdown-menu').attr('style', '');
					}, 300));
				}, 2000);
			}
		});
	};

	woodmartThemeModule.menuDropdownAside = function() {
		$('.wd-nav .wd-design-aside, .wd-header-cats.wd-open-dropdown .wd-nav').each( function () {
			var $links = $(this).find('.menu-item');

			if (!$links.length) {
				return;
			}

			var $firstLink = $links.first();

			if (!$firstLink.hasClass('menu-item-has-children')) {
				$firstLink.parents('.wd-sub-menu-wrapp').addClass('wd-empty-item');
			}

			$firstLink.addClass('wd-opened').find('.wd-dropdown').addClass('wd-opened');

			$links.on('mouseover', function () {
				var $this = $(this);
				var $wrap = $this.parents('.wd-sub-menu-wrapp');

				if ($this.hasClass('wd-opened')) {
					return;
				}

				if ( $this.hasClass('item-level-1') ) {
					if (!$this.hasClass('menu-item-has-children')) {
						$wrap.addClass('wd-empty-item');
					} else {
						$wrap.removeClass('wd-empty-item');
					}
				}

				$this.siblings().removeClass('wd-opened').find('.wd-dropdown').removeClass('wd-opened');
				$this.addClass('wd-opened').find('.wd-dropdown').addClass('wd-opened');
			});
		});
	}

	window.addEventListener('wdEventStarted', function () {
		setTimeout(function () {
			woodmartThemeModule.menuDropdownAside();
			woodmartThemeModule.menuOffsets();
		}, 100);
	});

	window.addEventListener('wdUpdatedHeader', function () {
		$('.whb-header .wd-offsets-calculated').removeClass('wd-offsets-calculated');
		$('.whb-header .menu-item.wd-opened, .whb-header .wd-dropdown.wd-opened').removeClass('wd-opened');
		$('.whb-header .wd-dropdown-menu').attr('style', '');

		woodmartThemeModule.menuDropdownAside();
		woodmartThemeModule.menuOffsets();
	});
})(jQuery);

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
/* global woodmart_settings */
(function($) {
	woodmartThemeModule.menuSetUp = function() {
		var hasChildClass = 'menu-item-has-children',
		    mainMenu      = $('.wd-nav, .wd-header-cats, .wd-search-cat'),
		    openedClass   = 'wd-opened';

		$('.mobile-nav').find('ul.wd-nav-mobile').find(' > li').has('.wd-dropdown-menu').addClass(hasChildClass);

		woodmartThemeModule.$document.on('click', '.wd-nav .wd-event-click > a, .wd-header-cats.wd-event-click > span, .wd-search-cat-btn', function(e) {
			e.preventDefault();
			var $this = $(this);

			if ($this.parent().siblings().hasClass(openedClass)) {
				$this.parent().siblings().removeClass(openedClass);
			}

			$this.parent().toggleClass(openedClass);
		});

		woodmartThemeModule.$document.on('click', function(e) {
			var target = e.target;

			if (
				$('.' + openedClass).length > 0 &&
				!$(target).is('.wd-event-hover') &&
				!$(target).parents().is('.wd-event-hover') &&
				!$(target).parents().is('.' + openedClass + '') &&
				!$(target).is('.' + openedClass + '') &&
				!$(target).is('.wd-sticky-nav') &&
				! target.closest('.wd-cookies-popup') &&
				! target.closest('.wd-fb-holder') &&
				0 === $('.mfp-ready').length &&
				0 === $('.pswp--open').length
			) {
				mainMenu.find('.wd-event-click.' + openedClass + '').removeClass(openedClass);

				if (mainMenu.hasClass('wd-event-click')) {
					mainMenu.removeClass(openedClass);
				}

				if ($(target).closest('.wd-with-overlay').length) {
					return;
				}

				$('.wd-close-side').trigger('wdCloseSideAction', ['hide', 'click']);
			}
		});

		if ('yes' === woodmart_settings.menu_item_hover_to_click_on_responsive) {
			function menuIpadClick() {
				if (woodmartThemeModule.$window.width() <= 1024) {
					mainMenu.find(' > .menu-item-has-children.wd-event-hover').each(function() {
						$(this).data('original-event', 'hover').removeClass('wd-event-hover').addClass('wd-event-click');
					});
				} else {
					mainMenu.find(' > .wd-event-click').each(function() {
						var $this = $(this);

						if ($this.data('original-event') === 'hover') {
							$this.removeClass('wd-event-click').addClass('wd-event-hover');
						}
					});
				}
			}

			menuIpadClick();

			woodmartThemeModule.$window.on('resize', woodmartThemeModule.debounce(function() {
				menuIpadClick();
			}, 300));
		}
	};

	['wdEventStarted', 'wdUpdatedHeader'].forEach((eventName) => {
		window.addEventListener(eventName, function () {
			woodmartThemeModule.menuSetUp();
		});
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.menuStickyOffsets = function() {
		var $stickyNav = $('.wd-sticky-nav');
		var $side = $('.wd-close-side');

		$('.wd-sticky-nav .wd-nav-sticky.wd-nav-vertical').each(function() {
			var $menu = $(this);

			$menu.on('mouseenter mousemove', function() {
				if ($menu.hasClass('wd-offsets-calculated')) {
					return;
				}

				$menu.find('> .menu-item-has-children').each(function() {
					var $menuItem = $(this);

					if ($menuItem.find('> .wd-dropdown.wd-design-full-height').length) {
						return;
					}

					setOffset($menuItem);

					if ($menuItem.find('> .wd-dropdown').length) {
						$menuItem.find('.menu-item.menu-item-has-children').each(function() {
							setOffset($(this));
						});
					}
				});

				$menu.addClass('wd-offsets-calculated');
			});

			if ( 'undefined' === typeof woodmart_settings.clear_menu_offsets_on_resize || 'yes' === woodmart_settings.clear_menu_offsets_on_resize) {
				setTimeout(function () {
					woodmartThemeModule.$window.on('resize', woodmartThemeModule.debounce(function () {
						$menu.removeClass('wd-offsets-calculated');
						$menu.find(' > .menu-item-has-children > .wd-dropdown-menu').attr('style', '');
					}, 300));
				}, 2000);
			}

			var setOffset = function(li) {
				var $dropdown = li.find(' > .wd-dropdown');
				var dropdownHeight = $dropdown.innerHeight();
				var dropdownOffset = $dropdown.offset().top - woodmartThemeModule.$window.scrollTop();
				var viewportHeight = woodmartThemeModule.$window.height();
				var toTop = 0;

				$dropdown.attr('style', '');

				if (!dropdownHeight || !dropdownOffset) {
					return;
				}

				if ( dropdownOffset + dropdownHeight >= viewportHeight ) {
					toTop = dropdownOffset + dropdownHeight - viewportHeight;

					$dropdown.css({
						top: -toTop,
					});
				}
			}
		});

		woodmartThemeModule.$document.on('click', '.wd-header-sticky-nav', function(e) {
			e.preventDefault();

			var $stickyNavBtn = $(this);

			sideOpened( $stickyNavBtn, $stickyNavBtn.hasClass('wd-close-menu-mouseout') );
		});

		woodmartThemeModule.$document.on('mouseenter mousemove', '.wd-header-sticky-nav.wd-event-hover', function() {
			sideOpened( $(this) );
		});

		woodmartThemeModule.$document.on('click touchstart', '.wd-close-side.wd-location-sticky-nav', function() {
			closeSide();
		});

		function sideOpened( $stickyNavBtn, addMouseoutEvent = true ) {
			$stickyNavBtn.addClass('wd-opened');
			$stickyNav.addClass('wd-opened');

			$side.trigger('wdCloseSideAction', ['show', 'click', 'wd-location-sticky-nav']);

			if ( ! addMouseoutEvent ) {
				return;
			}

			$stickyNav.on('mouseout', function () {
				closeSide();

				$stickyNav.off('mouseout');
			});
		}

		function closeSide() {
			$('.wd-header-sticky-nav').removeClass('wd-opened');
			$stickyNav.removeClass('wd-opened');

			$side.trigger('wdCloseSideAction', ['hide', 'click', 'wd-location-sticky-nav']);
		}
	};

	window.addEventListener('wdEventStarted', function () {
		setTimeout(function () {
			woodmartThemeModule.menuStickyOffsets();
		}, 100);
	});
})(jQuery);

/* global woodmart_settings */
woodmartThemeModule.$document.on('wdCloseMobileMenu wdPjaxStart', function() {
	woodmartThemeModule.closeMobileNavigation();
});

woodmartThemeModule.mobileNavigationClickAction      = function(mobileNav) {
	if (! mobileNav) {
		return;
	}

	mobileNav.addEventListener("click", function(e) {
		var currentNav = e.target.closest('.wd-nav');

		if ( ! currentNav ) {
			return;
		}

		var isDropdown       = currentNav.classList.contains('wd-layout-dropdown');
		var isDrilldown      = currentNav.classList.contains('wd-layout-drilldown');
		var isDrilldownSlide = currentNav.classList.contains('wd-drilldown-slide');
		var navTabs          = e.target.closest('.wd-nav-mob-tab li');
		var wdNavOpener      = e.target.closest('.menu-item-has-children > a');
		var wdNavOpenerArrow = e.target.closest('.menu-item-has-children > .wd-nav-opener');
		var currentMobileNav = e.target.closest('.mobile-nav');
		var opener           = 'arrow';
		var parentLi;
		var parentLiChildren;
		var openerBtn;

		if (this.classList.contains('wd-opener-item')) {
			opener = 'item';
		}

		woodmartThemeModule.$document.trigger('wood-images-loaded');

		if (navTabs) {
			e.preventDefault();

			if (navTabs.classList.contains('wd-active')) {
				return;
			}

			var menuName         = navTabs.dataset.menu;
			var activeMobileNav  = null !== currentMobileNav ? currentMobileNav.querySelector('.wd-active') : false;

			if (activeMobileNav) {
				activeMobileNav.classList.remove('wd-active');
			}

			navTabs.classList.add('wd-active');

			if ( null !== currentMobileNav ) {
				currentMobileNav.querySelectorAll('.wd-nav-mobile').forEach(function(wdNavMobile) {
					wdNavMobile.classList.remove('wd-active');
				});

				if ('undefined' !== typeof menuName) {
					currentMobileNav.querySelectorAll(`.mobile-${menuName}-menu`).forEach(function(wdMobileMenu) {
						wdMobileMenu.classList.add('wd-active');
					});
				}
			}
		}

		if (isDropdown) {
			if (('item' === opener && (wdNavOpener || wdNavOpenerArrow)) || ('arrow' === opener && wdNavOpenerArrow)) {
				e.preventDefault();

				if ('item' === opener) {
					openerBtn = wdNavOpener ? wdNavOpener : wdNavOpenerArrow;
				} else {
					openerBtn = wdNavOpenerArrow;
				}

				parentLi             = openerBtn.parentNode;
				parentLiChildren     = Array.from(parentLi.children);
				var parentNavOpener  = parentLiChildren.find(function(el) {
					return el.classList.contains('wd-nav-opener');
				});
				var submenus         = parentLiChildren.filter(function(el) {
					return 'UL' === el.tagName || el.classList.contains('wd-sub-menu');
				});

				if (parentLi.classList.contains('opener-page')) {
					parentLi.classList.remove('opener-page');

					if (0 !== submenus.length) {
						submenus.forEach(function (submenu) {
							woodmartThemeModule.slideUp(submenu, 200);
						});
					}

					[
						'.wd-dropdown-menu .container > ul',
						'.wd-dropdown-menu > ul',
					].forEach(function (selector) {
						var slideUpNodes = parentLi.querySelectorAll(selector);

						if (0 === slideUpNodes.length) {
							return;
						}

						slideUpNodes.forEach(function (slideUpNode) {
							woodmartThemeModule.slideUp(slideUpNode, 200);
						});
					});

					if ('undefined' !== typeof parentNavOpener) {
						parentNavOpener.classList.remove('wd-active');
					}
				} else {
					parentLi.classList.add('opener-page');

					if (0 !== submenus.length) {
						submenus.forEach(function (submenu) {
							woodmartThemeModule.slideDown(submenu, 200);
						});
					}

					[
						'.wd-dropdown-menu .container > ul',
						'.wd-dropdown-menu > ul',
					].forEach(function (selector) {
						var slideDownNodes = parentLi.querySelectorAll(selector);

						if (0 === slideDownNodes.length) {
							return;
						}

						slideDownNodes.forEach(function (slideDownNode) {
							woodmartThemeModule.slideDown( slideDownNode, 200 );
						});
					});

					if ('undefined' !== typeof parentNavOpener) {
						parentNavOpener.classList.add('wd-active');
					}
				}
			}
		} else if (isDrilldown) {
			var wdNavBackLink      = e.target.closest('.menu-item-has-children .wd-drilldown-back a');
			var wdNavBackLinkArrow = e.target.closest('.menu-item-has-children .wd-drilldown-back .wd-nav-opener');
			var parentUl;
			var submenu;

			if (('item' === opener && (wdNavOpener || wdNavOpenerArrow)) || ('arrow' === opener && wdNavOpenerArrow)) {
				if ('item' === opener) {
					openerBtn = wdNavOpener ? wdNavOpener : wdNavOpenerArrow;
				} else {
					openerBtn = wdNavOpenerArrow;
				}

				parentLi         = openerBtn.parentNode;
				parentUl         = parentLi.closest('ul');
				parentLiChildren = Array.from(parentLi.children);
				submenu          = parentLiChildren.find(function(el) {
					return el.classList.contains('wd-sub-menu') || el.classList.contains('sub-sub-menu');
				});

				if ('undefined' !== typeof submenu) {
					e.preventDefault();

					parentLi.setAttribute( 'aria-expanded', true );

					parentUl.classList.add('wd-drilldown-hide');
					parentUl.classList.remove('wd-drilldown-show');

					submenu.classList.add('wd-drilldown-show');
					submenu.setAttribute( 'aria-expanded', false );

					var drilldownBackLink = submenu.querySelector('.wd-drilldown-back a');
					var drilldownBackText = drilldownBackLink.textContent;
					drilldownBackText     = drilldownBackText.replaceAll('\t', '');
					drilldownBackText     = drilldownBackText.replaceAll('\n', '');

					if ( parentLi.classList.contains('item-level-0') ) {
						var currentTab = null;

						if ( null !== currentMobileNav ) {
							currentTab = currentMobileNav.querySelector('.wd-nav-mob-tab li.wd-active .nav-link-text');
						}

						if ( null !== currentTab ) {
							var currentTabText = currentTab.textContent;
							currentTabText     = currentTabText.replaceAll('\t', '');
							currentTabText     = currentTabText.replaceAll('\n', '');

							if (! drilldownBackText.includes(currentTabText) && currentTabText.length > 0) {
								drilldownBackLink.textContent = woodmart_settings.mobile_navigation_drilldown_back_to.replace('%s', currentTabText);
							}
						} else if ( parentLi.classList.contains('cat-item') ) {
							drilldownBackLink.textContent = woodmart_settings.mobile_navigation_drilldown_back_to_categories;
						} else if (! drilldownBackText.includes(woodmart_settings.mobile_navigation_drilldown_back_to_main_menu)) {
							drilldownBackLink.textContent = woodmart_settings.mobile_navigation_drilldown_back_to_main_menu;
						}
					} else {
						var parentMenuText = '';
						var parentMenuLink = parentUl.closest('li').querySelector('.woodmart-nav-link');

						if ( null !== parentMenuLink.querySelector('.nav-link-text') ) {
							parentMenuText = parentMenuLink.querySelector('.nav-link-text').textContent;
						} else if ( null !== parentMenuLink.querySelector('span') ) {
							parentMenuText = parentMenuLink.querySelector('span').textContent;
						} else {
							parentMenuText = parentMenuLink.textContent;
						}

						if (! drilldownBackText.includes( parentMenuText ) && parentMenuText.length > 0) {
							drilldownBackLink.textContent = woodmart_settings.mobile_navigation_drilldown_back_to.replace('%s', parentMenuText);
						}
					}

					if ( isDrilldownSlide ) {
						this.querySelector('ul.wd-active').style.height = `${submenu.offsetHeight}px`;
					}
				}
			}

			if (wdNavBackLink || wdNavBackLinkArrow) {
				e.preventDefault();

				var backBtn      = wdNavBackLink ? wdNavBackLink : wdNavBackLinkArrow;
				parentLi         = backBtn.closest('.menu-item');
				parentUl         = parentLi.closest('ul');
				parentLiChildren = Array.from(parentLi.children);
				submenu          = parentLiChildren.find(function(el) {
					return el.classList.contains('wd-sub-menu') || el.classList.contains('sub-sub-menu');
				});

				parentLi.setAttribute( 'aria-expanded', false );

				if ( ! parentLi.classList.contains('item-level-0') ) {
					parentUl.classList.add('wd-drilldown-show');
				}
				parentUl.classList.remove('wd-drilldown-hide');

				submenu.classList.remove('wd-drilldown-show');
				submenu.setAttribute( 'aria-expanded', true );

				if ( isDrilldownSlide ) {
					if ( parentLi.classList.contains('item-level-0') ) {
						this.querySelector('ul.wd-active').style.height = '';
					} else {
						this.querySelector('ul.wd-active').style.height = `${parentUl.offsetHeight}px`;
					}
				}
			}
		}
	});
}
woodmartThemeModule.mobileNavigationAddOpeners       = function(dropDownCats) {
	dropDownCats.forEach(function(dropDownCat) {
		if ( dropDownCat.querySelector(':scope > .wd-nav-opener') || dropDownCat.closest('.widget_nav_mega_menu') ) {
			return;
		}

		var elementIcon = document.createElement('span');
		elementIcon.classList.add('wd-nav-opener');
		dropDownCat.appendChild(elementIcon);
	});
}
woodmartThemeModule.mobileNavigationCloseSideWidgets = function(closeSideWidgets) {
	if (! closeSideWidgets) {
		return;
	}

	closeSideWidgets.forEach(function(closeSideWidget) {
		closeSideWidget.addEventListener('click', function(e) {
			e.preventDefault();
			woodmartThemeModule.closeMobileNavigation();
		});
	});
}
woodmartThemeModule.openMobileNavigation             = function(mobileNav) {
	var closeSide = document.querySelector('.wd-close-side');

	if ( mobileNav ) {
		mobileNav.classList.add('wd-opened');

		jQuery(mobileNav).trigger('wdOpenSide');
	}

	if ( closeSide ) {
		closeSide.classList.add('wd-close-side-opened');
	}

	woodmartThemeModule.$document.trigger('wood-images-loaded');
}
woodmartThemeModule.closeMobileNavigation            = function() {
	var activeHeaderMobileNav = document.querySelector('.wd-header-mobile-nav.wd-opened');
	var activeMobileNav       = document.querySelector('.mobile-nav.wd-opened')
	var activeCloseSide       = document.querySelector('.wd-close-side.wd-close-side-opened');
	var searchFormInput       = document.querySelector('.mobile-nav .searchform input[type=text]');

	if (activeHeaderMobileNav) {
		activeHeaderMobileNav.classList.remove('wd-opened');
	}

	if (activeMobileNav) {
		activeMobileNav.classList.remove('wd-opened');

		jQuery(activeMobileNav).trigger('wdCloseSide');
	}

	if (activeMobileNav && activeCloseSide) {
		activeCloseSide.classList.remove('wd-close-side-opened');
	}

	if (searchFormInput) {
		searchFormInput.blur();
	}
}
woodmartThemeModule.mobileNavigation                 = function() {
	var	dropDownCats     = document.querySelectorAll('.wd-side-hidden-nav .wd-nav-mobile .menu-item-has-children');
	var	mobileNavs       = document.querySelectorAll('.wd-side-hidden-nav');
	var closeSide        = document.querySelector('.wd-close-side');
	var closeSideWidgets = document.querySelectorAll('.mobile-nav .login-side-opener, .mobile-nav .close-side-widget');

	woodmartThemeModule.mobileNavigationAddOpeners(dropDownCats);

	mobileNavs.forEach(function(mobileNav) {
		woodmartThemeModule.mobileNavigationClickAction(mobileNav);
	});

	var openersMobileNav = document.querySelectorAll('.wd-header-mobile-nav > a');

	openersMobileNav.forEach(function(openMobileNav) {
		openMobileNav.addEventListener('click', openMobileNavEvent);
	});

	if (closeSide) {
		closeSide.addEventListener('click', function(e) {
			e.preventDefault();
			woodmartThemeModule.closeMobileNavigation();
		});

		closeSide.addEventListener('touchstart', function(e) {
			e.preventDefault();
			woodmartThemeModule.closeMobileNavigation();
		}, {passive: false});
	}

	woodmartThemeModule.$document.on('keyup', function(e) {
		if (e.keyCode === 27) {
			var mobileNavContent = document.querySelector('.wd-side-hidden-nav');

			if (mobileNavContent.classList.contains('wd-opened')) {
				woodmartThemeModule.closeMobileNavigation();
			}
		}
	});

	woodmartThemeModule.mobileNavigationCloseSideWidgets(closeSideWidgets);
}

function openMobileNavEvent(e) {
	e.preventDefault();
	var mobileNavContent = document.querySelector('.wd-side-hidden-nav');

	if (mobileNavContent.classList.contains('wd-opened')) {
		woodmartThemeModule.closeMobileNavigation();
	} else {
		this.parentNode.classList.add('wd-opened');
		woodmartThemeModule.openMobileNavigation(mobileNavContent);
	}
}

window.addEventListener('load',function() {
	woodmartThemeModule.mobileNavigation();
});
window.addEventListener('wdUpdatedHeader',function() {
	woodmartThemeModule.mobileNavigation();
});
window.addEventListener('wdHeaderBuilderCloneCreated',function() {
	var openCloneMobileNav = document.querySelector('.whb-clone .wd-header-mobile-nav > a');

	if (openCloneMobileNav) {
		openCloneMobileNav.addEventListener('click', openMobileNavEvent);
	}
});

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.moreCategoriesButton = function() {
		$('.wd-more-cat').each(function() {
			var $wrapper = $(this);

			$wrapper.find('.wd-more-cat-btn a').on('click', function(e) {
				e.preventDefault();
				$wrapper.toggleClass('wd-show-cat');

				woodmartThemeModule.$document.trigger('wood-images-loaded');
			});
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.moreCategoriesButton();
	});
})(jQuery);

/* global woodmart_settings, woodmartThemeModule */
(function($) {
	woodmartThemeModule.onePageMenu = function() {
		var scrollToRow = function(hash) {
			var $htmlBody = $('html, body');
			var row = $('#' + hash + ', .wd-menu-anchor[data-id="' + hash + '"]');
			var offset = row.data('offset') ? parseInt(row.data('offset'), 10) : woodmart_settings.one_page_menu_offset;

			$htmlBody.stop(true);

			if (row.length < 1) {
				return;
			}

			var position = row.offset().top;

			$htmlBody.animate({
				scrollTop: position - offset
			}, 800);

			setTimeout(function() {
				activeMenuItem(hash);
			}, 800);
		};

		var activeMenuItem = function(hash) {
			var itemHash;

			$('.onepage-link').each(function() {
				var $this = $(this);
				itemHash = $this.find('> a').attr('href').split('#')[1];

				if (itemHash === hash) {
					$this.siblings().removeClass('current-menu-item');
					$this.parents('.whb-row').find('.onepage-link').removeClass('current-menu-item');
					$this.addClass('current-menu-item');
				}
			});
		};

		woodmartThemeModule.$body.on('click', '.onepage-link > a', function(e) {
			var $this = $(this),
				hash  = $this.attr('href').split('#')[1];

			if ($('#' + hash).length < 1 && $('.wd-menu-anchor[data-id="' + hash + '"]').length < 1) {
				return;
			}

			e.stopPropagation();
			e.preventDefault();

			scrollToRow(hash);

			// close mobile menu
			$('.wd-close-side').trigger('click');
			$('.wd-fs-close').trigger('click');
		});

		woodmartThemeModule.$window.scroll(function () {
			var scroll = woodmartThemeModule.$window.scrollTop();
			var $firstLint = $('.onepage-link:first');
			if ( scroll < 50 && $firstLint.length ) {
				activeMenuItem($firstLint.find('> a').attr('href').split('#')[1]);
			}
		});

		if ($('.onepage-link').length > 0) {
			$('.wpb-content-wrapper > :is(.vc_row, .vc_section)').waypoint(function() {
				var $this = $($(this)[0].element);
				var hash = $this.attr('id');
				activeMenuItem(hash);
			}, {offset: 150});

			$('.wd-menu-anchor').waypoint(function() {
				activeMenuItem($($(this)[0].element).data('id'));
			}, {
				offset: function() {
					return $($(this)[0].element).data('offset');
				}
			});

			if ($('body').is('[class*="elementor-"]')) {
				var locationHash = window.location.hash.split('#')[1];

				if (window.location.hash.length > 1) {
					setTimeout(function() {
						scrollToRow(locationHash);
					}, 500);
				}
			}
		}
	};

	$(document).ready(function() {
		woodmartThemeModule.onePageMenu();
	});
})(jQuery);

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

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.ajaxPortfolio = function() {
		if ('no' === woodmart_settings.ajax_portfolio || 'undefined' === typeof ($.fn.pjax) || woodmartThemeModule.$body.hasClass('elementor-editor-active')) {
			return;
		}

		var ajaxLinks = '.wd-type-links .wd-nav-portfolio a, .tax-project-cat .wd-pagination a, .post-type-archive-portfolio .wd-pagination a';

		woodmartThemeModule.$body.on('click', '.tax-project-cat .wd-pagination a, .post-type-archive-portfolio .wd-pagination a', function() {
			scrollToTop(true);
		});

		woodmartThemeModule.$document.pjax(ajaxLinks, '.wd-page-content', {
			timeout : woodmart_settings.pjax_timeout,
			scrollTo: false,
			renderCallback: function(context, html, afterRender) {
				woodmartThemeModule.removeDuplicatedStylesFromHTML(html, function(html) {
					context.html(html);
					afterRender();
					woodmartThemeModule.$document.trigger('wdPortfolioPjaxComplete');
					woodmartThemeModule.$document.trigger('wood-images-loaded');
				});
			}
		});

		woodmartThemeModule.$document.on('pjax:start', function() {
			var $siteContent = $('.wd-content-layout');

			$siteContent.removeClass('wd-loaded');
			$siteContent.addClass('wd-loading');

			woodmartThemeModule.$document.trigger('wdPortfolioPjaxStart');
			woodmartThemeModule.$window.trigger('scroll.loaderVerticalPosition');
		});

		woodmartThemeModule.$document.on('pjax:end', function() {
			$('.wd-content-layout').removeClass('wd-loading');
		});

		woodmartThemeModule.$document.on('pjax:complete', function() {
			if (!woodmartThemeModule.$body.hasClass('tax-project-cat') && !woodmartThemeModule.$body.hasClass('post-type-archive-portfolio')) {
				return;
			}

			woodmartThemeModule.$document.trigger('wood-images-loaded');

			scrollToTop(false);

			$('.wd-ajax-content').removeClass('wd-loading');
		});

		var scrollToTop = function(type) {
			if (woodmart_settings.ajax_scroll === 'no' && type === false) {
				return false;
			}

			var $scrollTo = $(woodmart_settings.ajax_scroll_class),
			    scrollTo  = $scrollTo.offset().top - woodmart_settings.ajax_scroll_offset;

			$('html, body').stop().animate({
				scrollTop: scrollTo
			}, 400);
		};
	};

	$(document).ready(function() {
		woodmartThemeModule.ajaxPortfolio();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdPortfolioLoadMoreLoaded wdPortfolioPjaxComplete', function () {
		woodmartThemeModule.portfolioEffects();
	});

	$.each([
		'frontend/element_ready/wd_portfolio.default',
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.portfolioEffects();
		});
	});

	woodmartThemeModule.portfolioEffects = function() {
		if (typeof ($.fn.panr) === 'undefined') {
			return;
		}

		$('.wd-projects .portfolio-parallax').panr({
			sensitivity         : 15,
			scale               : false,
			scaleOnHover        : true,
			scaleTo             : 1.12,
			scaleDuration       : 0.45,
			panY                : true,
			panX                : true,
			panDuration         : 0.5,
			resetPanOnMouseLeave: true
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.portfolioEffects();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdPortfolioPjaxComplete', function () {
		woodmartThemeModule.portfolioLoadMore();
	});

	$.each([
		'frontend/element_ready/wd_portfolio.default'
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.portfolioLoadMore();
		});
	});

	woodmartThemeModule.portfolioLoadMore = function() {
		if (typeof $.fn.waypoint !== 'function') {
			return;
		}

		var waypoint = $('.wd-portfolio-load-more.load-on-scroll').waypoint(function() {
			    $('.wd-portfolio-load-more.load-on-scroll').trigger('click');
		    }, {offset: '100%'}),
		    process  = false;

		$('.wd-portfolio-load-more').on('click', function(e) {
			e.preventDefault();

			var $this = $(this);

			if (process || $this.hasClass('no-more-posts')) {
				return;
			}

			process = true;

			var holder   = $this.parent().parent().find('.wd-projects'),
			    source   = holder.data('source'),
			    action   = 'woodmart_get_portfolio_' + source,
			    ajaxurl  = woodmart_settings.ajaxurl,
			    dataType = 'json',
			    method   = 'POST',
			    timeout,
			    atts     = holder.data('atts'),
			    paged    = holder.data('paged');

			$this.addClass('loading');
			holder.addClass('wd-loading');

			var data = {
				atts  : atts,
				paged : paged,
				action: action
			};

			if (source === 'main_loop') {
				ajaxurl = $this.attr('href');
				method = 'GET';
				data = atts ? { atts: atts } : {};
			}

			$.ajax({
				url     : ajaxurl,
				data    : data,
				dataType: dataType,
				method  : method,
				success : function(data) {
					woodmartThemeModule.removeDuplicatedStylesFromHTML(data.items, function(html) {
						var items = $(html);

						if (items) {
							if (holder.hasClass('wd-masonry')) {
								holder.append(items).isotope('appended', items);
								holder.imagesLoaded().progress(function() {
									holder.isotope('layout');

									clearTimeout(timeout);

									timeout = setTimeout(function() {
										waypoint = $('.wd-portfolio-load-more.load-on-scroll').waypoint(function() {
											$('.wd-portfolio-load-more.load-on-scroll').trigger('click');
										}, {offset: '100%'});
									}, 1000);
								});
							} else {
								holder.append(items);
							}

							holder.data('paged', paged + 1);

							$this.attr('href', data.nextPage);

							if ('yes' === woodmart_settings.load_more_button_page_url_opt && 'no' !== woodmart_settings.load_more_button_page_url && data.currentPage){
								window.history.pushState('', '', data.currentPage);
							}
						}

						woodmartThemeModule.$document.trigger('wdPortfolioLoadMoreLoaded');
						woodmartThemeModule.$document.trigger('wood-images-loaded');

						if (data.status === 'no-more-posts') {
							$this.addClass('no-more-posts');
							$this.parent().hide();
						}
					});
				},
				error   : function() {
					console.log('ajax error');
				},
				complete: function() {
					$this.removeClass('loading');
					holder.removeClass('wd-loading');
					process = false;
				}
			});
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.portfolioLoadMore();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdPortfolioPjaxComplete', function () {
		woodmartThemeModule.portfolioMasonryFilters();
	});

	$.each([
		'frontend/element_ready/wd_portfolio.default',
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.portfolioMasonryFilters();
		});
	});

	woodmartThemeModule.portfolioMasonryFilters = function() {
		var $filer = $('.wd-nav-portfolio');
		$filer.on('click', 'li', function(e) {
			e.preventDefault();
			var $this = $(this);
			var filterValue = $this.attr('data-filter');

			setTimeout(function() {
				woodmartThemeModule.$document.trigger('wood-images-loaded');
			}, 300);

			$filer.find('.wd-active').removeClass('wd-active');
			$this.addClass('wd-active');

			var $masonryContainer = $this.parents('.portfolio-filter').siblings('.wd-masonry.wd-projects');

			if (!$masonryContainer.length) {
			    $masonryContainer = $('.wd-portfolio-archive .wd-masonry.wd-projects');
			}
			
			if ($masonryContainer.length) {
			    $masonryContainer.isotope({ filter: filterValue });
			}
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.portfolioMasonryFilters();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdPortfolioPjaxComplete', function () {
		woodmartThemeModule.portfolioPhotoSwipe();
	});

	$.each([
		'frontend/element_ready/wd_portfolio.default',
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.portfolioPhotoSwipe();
		});
	});

	woodmartThemeModule.portfolioPhotoSwipe = function() {
		woodmartThemeModule.$document.on('click', '.portfolio-enlarge', function(e) {
			e.preventDefault();
			var $this = $(this);
			var $parent = $this.parents('.wd-carousel-item');

			if ($parent.length === 0) {
				$parent = $this.parents('.portfolio-entry');
			}

			var index = $parent.index();
			var items = getPortfolioImages();

			woodmartThemeModule.callPhotoSwipe(index, items);
		});

		var getPortfolioImages = function() {
			var items = [];

			$('.portfolio-entry').find('figure a img').each(function() {
				var $this = $(this);

				items.push({
					src: $this.attr('src'),
					w  : $this.attr('width') ? $this.attr('width') : '300',
					h  : $this.attr('height') ? $this.attr('height') : '300',
				});
			});

			return items;
		};
	};

	$(document).ready(function() {
		woodmartThemeModule.portfolioPhotoSwipe();
	});
})(jQuery);

woodmartThemeModule.shaders = {
	matrixVertex: '' +
		'attribute vec2 a_texCoord;' +
		'attribute vec2 a_position;' +
		'uniform mat3 u_matrix;' +
		'void main() {' +
		'	gl_Position = vec4( ( u_matrix * vec3(a_position, 1) ).xy, 0, 1);' +
		'	a_texCoord;' +
		'}',

	sliderWithNoise:
		'precision mediump float;' +
		'uniform float u_time;' +
		'uniform float u_progress;' +
		'uniform sampler2D u_image0;' +
		'uniform vec2 u_image0_size;' +
		'uniform sampler2D u_image1;' +
		'uniform vec2 u_image1_size;' +
		'uniform vec2 u_pixels;' +
		'uniform vec2 u_mouse;' +
		'uniform vec2 u_uvRate;' +
		'uniform float u_scale;' +
		'float rand(vec2 seed) {' +
		'	return fract(sin(dot(seed, vec2(1.29898,7.8233))) * 4.37585453123);' +
		'}' +
		'float noise(vec2 position) {' +
		'	vec2 block_position = floor(position);' +

		'	float top_left_value     = rand(block_position);' +
		'	float top_right_value    = rand(block_position + vec2(1.0, 0.0));' +
		'	float bottom_left_value  = rand(block_position + vec2(0.0, 1.0));' +
		'	float bottom_right_value = rand(block_position + vec2(1.0, 1.0));' +

		'	vec2 computed_value = smoothstep(0.0, 1.0, fract(position));' +

		'	return mix(top_left_value, top_right_value, computed_value.x)' +
		'		+ (bottom_left_value  - top_left_value)  * computed_value.y * (1.0 - computed_value.x)' +
		'		+ (bottom_right_value - top_right_value) * computed_value.x * computed_value.y' +
		'		- 0.5;' +
		'}' +
		'void main() {' +
		'	vec2 uv = gl_FragCoord.xy/u_pixels.xy;' +
		'	uv.y = 1.0 - uv.y;' +
		'	vec2 uv2 = uv;' +
		'	vec2 s = u_pixels.xy/10.;' +
		'	vec2 i = u_image0_size/10.;' +
		'	float rs = s.x / s.y;' +
		'	float ri = i.x / i.y;' +
		'	vec2 new = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);' +
		'	vec2 offset = (rs < ri ? vec2((new.x - s.x) / 2.0, 0.0) : vec2(0.0, (new.y - s.y) / 2.0)) / new;' +
		'	uv = uv * s / new + offset;' +

		'	i = u_image1_size/10.;' +
		'	ri = i.x / i.y;' +
		'	new = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);' +
		'	offset = (rs < ri ? vec2((new.x - s.x) / 2.0, 0.0) : vec2(0.0, (new.y - s.y) / 2.0)) / new;' +
		'	uv2 = uv2 * s / new + offset;' +

		'	float delayValue = clamp(u_progress, 0., 1.);' +
		'   float d = distance(u_mouse*u_uvRate, uv*u_uvRate);' +

		'	float ppp = ((u_progress - .5) * (u_progress - .5) - .25 );' +
		'	vec2 uv_offset = ppp * 1.1 * vec2( noise(uv * 10.0 + sin(u_time + uv.x * 5.0)) / 10.0, noise(uv * 10.0 + cos(u_time + uv.y * 5.0)) / 10.0);' +
		'	uv += uv_offset;' +
		'	uv2 += uv_offset;' +
		'	uv = (uv - vec2(.5, .5)) * u_scale + 0.5;' +
		'	vec4 rgba1 = texture2D( u_image0, uv );' +
		'	vec4 rgba2 = texture2D( u_image1, uv2 );' +
		'	vec4 rgba = mix(rgba1, rgba2, delayValue);' +
		'	gl_FragColor = rgba;' +
		// '	gl_FragColor = vec4(uv, 0., 1.);' +
		'}',

	sliderPattern:
		'precision mediump float;' +
		'uniform float u_time;' +
		'uniform float u_progress;' +
		'uniform sampler2D u_image0;' +
		'uniform vec2 u_image0_size;' +
		'uniform sampler2D u_image1;' +
		'uniform vec2 u_image1_size;' +
		'uniform sampler2D u_image2;' +
		'uniform vec2 u_image2_size;' +
		'uniform vec2 u_pixels;' +
		'void main() {' +
		'	vec2 uv = gl_FragCoord.xy/u_pixels.xy;' +
		'	uv.y = 1.0 - uv.y;' +
		'	vec2 uv2 = uv;' +
		'	vec2 s = u_pixels.xy/10.;' +
		'	vec2 i = u_image0_size/10.;' +
		'	float rs = s.x / s.y;' +
		'	float ri = i.x / i.y;' +
		'	vec2 new = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);' +
		'	vec2 offset = (rs < ri ? vec2((new.x - s.x) / 2.0, 0.0) : vec2(0.0, (new.y - s.y) / 2.0)) / new;' +
		'	uv = uv * s / new + offset;' +

		'	i = u_image1_size/10.;' +
		'	ri = i.x / i.y;' +
		'	new = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);' +
		'	offset = (rs < ri ? vec2((new.x - s.x) / 2.0, 0.0) : vec2(0.0, (new.y - s.y) / 2.0)) / new;' +
		'	uv2 = uv2 * s / new + offset;' +

		'vec4 disp = texture2D(u_image2, uv);' +
		'float effectFactor = 0.4;' +

		'vec2 distortedPosition = vec2(uv.x + u_progress * (disp.r*effectFactor), uv.y);' +
		'vec2 distortedPosition2 = vec2(uv.x - (1.0 - u_progress) * (disp.r*effectFactor), uv.y);' +

		'vec4 _texture = texture2D(u_image0, distortedPosition);' +
		'vec4 _texture2 = texture2D(u_image1, distortedPosition2);' +

		'vec4 finalTexture = mix(_texture, _texture2, u_progress);' +
		'gl_FragColor = finalTexture;' +
		// '	gl_FragColor = vec4(uv, 0., 1.);' +
		'}',

	sliderWithWave:
		'precision mediump float;' +
		'uniform float u_time;' +
		'uniform float u_progress;' +
		'uniform sampler2D u_image0;' +
		'uniform vec2 u_image0_size;' +
		'uniform sampler2D u_image1;' +
		'uniform vec2 u_image1_size;' +
		'uniform vec2 u_pixels;' +
		'uniform vec2 u_mouse;' +
		'uniform vec2 u_uvRate;' +
		'uniform float u_scale;' +

		'    vec2 mirrored(vec2 v) {' +
		'        vec2 m = mod(v,2.);' +
		'        return mix(m,2.0 - m, step(1.0 ,m));' +
		'    }' +

		'    float tri(float p) {' +
		'        return mix(p,1.0 - p, step(0.5 ,p))*2.;' +
		'    }' +

		'void main() {' +
		'	vec2 uv = gl_FragCoord.xy/u_pixels.xy;' +
		'	uv.y = 1.0 - uv.y;' +
		'	vec2 uv2 = uv;' +
		'	vec2 s = u_pixels.xy/10.;' + // problem on mobile devices that is why we scale the value by 10x
		'	vec2 i = u_image0_size.xy/10.;' + // problem on mobile devices that is why we scale the value by 10x
		'	float rs = s.x / s.y;' + // 0.646
		'	float ri = i.x / i.y;' + // 2.23
		'	vec2 new = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, (i.y * s.x) / i.x);' + // 375. 167.9
		'	vec2 offset = (rs < ri ? vec2((new.x - s.x) / 2.0, 0.0) : vec2(0.0, (new.y - s.y) / 2.0)) / new;' +
		'	uv = uv * s / new + offset;' +
		'	i = u_image1_size.xy/10.;' +
		'	ri = i.x / i.y;' +
		'	new = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);' +
		'	offset = (rs < ri ? vec2((new.x - s.x) / 2.0, 0.0) : vec2(0.0, (new.y - s.y) / 2.0)) / new;' +
		'	uv2 = uv2 * s / new + offset;' +

		'    float delayValue = u_progress*6.5 - uv.y*2. + uv.x - 3.0;' +
		'    vec2 accel = vec2(0.5,2.);' +

		'    delayValue = clamp(delayValue,0.,1.);' +

		'    vec2 translateValue = u_progress + delayValue*accel;' +
		'    vec2 translateValue1 = vec2(-0.5,1.)* translateValue;' +
		'    vec2 translateValue2 = vec2(-0.5,1.)* (translateValue - 1. - accel);' +

		'    vec2 w = sin( sin(u_time) * vec2(0,0.3) + uv.yx*vec2(0,4.))*vec2(0,0.5);' +
		'    vec2 xy = w*(tri(u_progress)*0.5 + tri(delayValue)*0.5);' +

		'    vec2 uv1 = uv + translateValue1 + xy;' +
		'    uv2 = uv2 + translateValue2 + xy;' +

		'    vec4 rgba1 = texture2D(u_image0,mirrored(uv1));' +
		'    vec4 rgba2 = texture2D(u_image1,mirrored(uv2));' +

		'    vec4 rgba = mix(rgba1,rgba2,delayValue);' +
		// '	gl_FragColor = vec4(0.1,0.1,0.1, 1.);' +
		'	gl_FragColor = rgba;' +
		'}',

	hoverWave:
		'precision mediump float;' +
		'uniform float u_time;' +
		'uniform float u_progress;' +
		'uniform sampler2D u_image;' +
		'uniform vec2 u_pixels;' +
		'uniform vec2 u_mouse;' +
		'uniform vec2 u_uvRate;' +
		'uniform float u_scale;' +

		'void main() {' +
		'	vec2 uv = gl_FragCoord.xy/u_pixels.xy;' +
		'	uv.y = 1.0 - uv.y;' +
		'	float d = distance(u_mouse*u_uvRate, uv*u_uvRate);' +
		'	float ppp = ((u_progress - .5) * (u_progress - .5) - .25 );' +
		'	float dY = sin(uv.y * 44.005 + u_time * 4.5) * 0.02 * ppp;' +
		'	float dX = sin(uv.x * 30.005 + u_time * 3.2) * 0.02 * ppp;' +
		'	if( u_progress > 0. && d < .1 ) {' +
		'	   dX *= smoothstep( 0., .15, (.15 - d) ) * 5.;' +
		'	   dY *= smoothstep( 0., .15, (.15 - d) ) * 5.;' +
		'	}' +
		'	uv.y += dY;' +
		'	uv.x += dX;' +
		'	gl_FragColor = texture2D(u_image, uv);' +
		'}'
};

function ShaderX(options) {
	var defaults = {
		container     : null,
		sizeContainer : null,
		autoPlay      : true,
		vertexShader  : '',
		fragmentShader: '',
		width         : 0,
		height        : 0,
		mouseMove     : false,
		distImage     : false
	};
	this.options = jQuery.extend({}, defaults, options);
	this.container = this.options.container;
	this.pixelRatio = window.devicePixelRatio;
	this.uniforms = {};
	this.time = 0;
	this.progress = 0;
	this.empty = true;
	this.images = {};
	this.texture1 = null;
	this.texture2 = null;
	this.resizing = false;
	this.resizingTimeout = 0;
	this.border = 0;
	this.scale = 1;
	this.drawn = false;
	this.runned = false;
	this.mouseX = 0;
	this.mouseY = 0;
	this.loadedTextures = {};
	if (this.options.autoPlay) {
		this.init();
	}
}

ShaderX.prototype = {

	init: function() {
		var that = this;
		window.addEventListener('resize', function() { that.resize(); });

		if (this.options.autoPlay) {
			this.runned = true;
			this.render();
			this.raf();
		}

	},

	render: function() {

		if (!this.container.classList.contains('wd-with-webgl')) {
			this.createCanvas();
			this.container.append(this.canvas);
			this.container.classList.add('wd-with-webgl');
		}

		if (this.gl && ((this.progress > 0 && this.progress < 1) || !this.drawn)) {
			this.renderCanvas();
			this.drawn = true;
		}

	},

	createCanvas: function() {
		this.canvas = document.createElement('CANVAS');
		this.gl = this.canvas.getContext('webgl');

		if (!this.gl) {
			console.log('WebGL is not supported');
			return;
		}

		this.canvas.width = this.options.width * this.pixelRatio;
		this.canvas.height = this.options.height * this.pixelRatio;

		var vertexShader   = this.createShader(this.gl.VERTEX_SHADER, this.options.vertexShader),
		    fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, this.options.fragmentShader);

		this.program = this.createProgram(vertexShader, fragmentShader);

		var positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');

		var positionBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);

		var x1 = 0;
		var x2 = this.options.width * this.pixelRatio;
		var y1 = 0;
		var y2 = this.options.height * this.pixelRatio;

		var positions = [
			x1,
			y1,
			x2,
			y1,
			x1,
			y2,
			x1,
			y2,
			x2,
			y1,
			x2,
			y2
		];

		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

		// Tell Webthis.GL how to convert from clip space to pixels
		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

		// Clear the canvas
		this.gl.clearColor(0, 0, 0, 0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);

		// Tell it to use our program (pair of shaders)
		this.gl.useProgram(this.program);

		// Compute the matrices
		var projectionMatrix = [
			2 / this.gl.canvas.width,
			0,
			0,
			0,
			-2 / this.gl.canvas.height,
			0,
			-1,
			1,
			1
		];

		this.addUniform('3fv', 'u_matrix', projectionMatrix);
		this.addUniform('1f', 'u_flipY', 1);
		this.addUniform('1f', 'u_time', 0.0);
		this.addUniform('2f', 'u_pixels', [
			this.options.width * this.pixelRatio,
			this.options.height * this.pixelRatio
		]);
		this.addUniform('1f', 'u_progress', 0);
		this.addUniform('2f', 'u_resolution', [
			this.gl.canvas.width,
			this.gl.canvas.height
		]);
		this.addUniform('2f', 'u_uvRate', [
			1,
			1
		]);
		this.addUniform('1f', 'u_scale', this.scale);

		if (this.options.mouseMove) {
			this.addUniform('2f', 'u_mouse', [
				0.5,
				0
			]);
		}

		// Turn on the attribute
		this.gl.enableVertexAttribArray(positionAttributeLocation);

		// Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
		var size = 2;          // 2 components per iteration
		var type = this.gl.FLOAT;   // the data is 32bit floats
		var normalize = false; // don't normalize the data
		var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
		var offset = 0;        // start at the beginning of the buffer
		this.gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

		var texCoordLocation = this.gl.getAttribLocation(this.program, 'a_texCoord');

		// set coordinates for the rectanthis.gle
		var texCoordBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texCoordBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
			0.0,
			0.0,
			1.0,
			0.0,
			0.0,
			1.0,
			0.0,
			1.0,
			1.0,
			0.0,
			1.0,
			1.0
		]), this.gl.STATIC_DRAW);
		this.gl.enableVertexAttribArray(texCoordLocation);
		this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 0, 0);

		if (this.texture1) {
			this.loadImageTexture(this.texture1, 0);
		}

		if (this.options.distImage) {
			var distImage = new Image();

			this.requestCORSIfNotSameOrigin(distImage, this.options.distImage);

			distImage.src = this.options.distImage;

			var that = this;

			distImage.onload = function() {
				that.loadImageTexture(distImage, 2);
			};
		}
	},

	raf: function() {
		if (!this.canvas) {
			return;
		}

		var that = this;

		function animate() {
			that.time += 0.03;

			that.updateUniform('u_time', that.time);

			if (that.options.mouseMove) {
				var currentMouse = that.getUniform('u_mouse'),
				    currentX     = currentMouse[0],
				    currentY     = currentMouse[1];

				var newX = (!currentX) ? that.mouseX : currentX + (that.mouseX - currentX) * .05,
				    newY = (!currentY) ? that.mouseY : currentY + (that.mouseY - currentY) * .05;

				that.updateUniform('u_mouse', [
					newX,
					newY
				]);
			}

			if (that.progress < 0) {
				that.progress = 0;
			}
			if (that.progress > 1) {
				that.progress = 1;
			}

			that.updateUniform('u_progress', that.progress);

			that.updateUniform('u_scale', that.scale);

			that.render();
			that.requestID = window.requestAnimationFrame(animate);
		}

		animate();

	},

	resize: function() {

		var that = this;

		clearTimeout(this.resizingTimeout);

		this.resizingTimeout = setTimeout(function() {

			if (!that.canvas) {
				return;
			}

			var displayWidth = Math.floor(that.options.sizeContainer.offsetWidth * that.pixelRatio);
			var displayHeight = Math.floor(that.options.sizeContainer.offsetHeight * that.pixelRatio);

			if (that.gl.canvas.width !== displayWidth || that.gl.canvas.height !== displayHeight) {
				that.gl.canvas.width = displayWidth;
				that.gl.canvas.height = displayHeight;
			}

			that.updateUniform('u_resolution', [
				displayWidth,
				displayHeight
			]);
			that.updateUniform('u_pixels', [
				displayWidth,
				displayHeight
			]);
			that.updateUniform('u_uvRate', [
				1,
				displayHeight / displayWidth
			]);

			that.gl.viewport(0, 0, displayWidth, displayHeight);
			that.drawn = false;

		}, 500);
	},

	run: function() {
		if (this.runned) {
			return;
		}
		this.runned = true;
		this.render();
		this.raf();
	},

	stop: function() {
		if (!this.runned) {
			return;
		}
		window.cancelAnimationFrame(this.requestID);
		this.destroyCanvas();
		this.container.find('canvas').remove();
		this.container.removeClass('wd-with-webgl');
		this.runned = false;
	},

	renderCanvas: function() {

		if (this.empty) {
			return false;
		}

		// this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
		this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
	},

	destroyCanvas: function() {

		if (!this.gl) {
			return;
		}

		this.canvas = null;
		this.gl.getExtension('WEBGL_lose_context').loseContext();
		this.gl = null;
	},

	createShader: function(type, source) {
		var shader = this.gl.createShader(type);
		this.gl.shaderSource(shader, source);
		this.gl.compileShader(shader);
		var success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);

		if (success) {
			return shader;
		}

		console.log(this.gl.getShaderInfoLog(shader));
		this.gl.deleteShader(shader);
	},

	createProgram: function(vertexShader, fragmentShader) {
		var program = this.gl.createProgram();
		this.gl.attachShader(program, vertexShader);
		this.gl.attachShader(program, fragmentShader);
		this.gl.linkProgram(program);
		var success = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);

		if (success) {
			return program;
		}

		console.log(this.gl.getProgramInfoLog(program));
		this.gl.deleteProgram(program);
	},

	addUniform: function(type, name, value) {
		var location = this.gl.getUniformLocation(this.program, name);

		this.uniforms[name] = {
			location: location,
			type    : type
		};

		if (value !== false) {
			this.updateUniform(name, value);
		}

	},

	updateUniform: function(name, value) {
		if (!this.gl) {
			return;
		}

		var uniform = this.uniforms[name];

		switch (uniform.type) {
			case '1f':
				this.gl.uniform1f(uniform.location, value);
				break;
			case '2f':
				this.gl.uniform2f(uniform.location, value[0], value[1]);
				break;
			case '1i':
				this.gl.uniform1i(uniform.location, value);
				break;
			case '3fv':
				this.gl.uniformMatrix3fv(uniform.location, false, value);
				break;
		}
	},

	getUniform: function(name, value) {
		if (!this.gl) {
			return;
		}

		var uniform = this.uniforms[name];

		return this.gl.getUniform(this.program, uniform.location);
	},

	getImageId: function(src) {
		var id = '';
		var parts = src.split('/');
		id = parts[parts.length - 3] + '-' + parts[parts.length - 2] + '-' + parts[parts.length - 1];
		return id;
	},

	loadImage: function(src, i, callback, preload) {
		var imageId = this.getImageId(src);
		var image;

		if (this.images[imageId]) {
			image = this.images[imageId];
			if (preload) {
				return;
			}

			if (i === 0) {
				this.texture1 = image;
			} else if (i === 1) {
				this.texture2 = image;
			}
			this.loadImageTexture(image, i);
			this.empty = false;
			this.drawn = false;
			(callback) ? callback() : '';
			return;
		}

		image = new Image();

		this.requestCORSIfNotSameOrigin(image, src);

		image.src = src;

		var that = this;

		image.onload = function() {

			that.images[imageId] = image;
			if (preload) {
				return;
			}

			if (i === 0) {
				that.texture1 = image;
			} else {
				that.texture2 = image;
			}

			that.loadImageTexture(image, i);
			that.empty = false;
			that.drawn = false;
			(callback) ? callback() : '';
		};

	},

	requestCORSIfNotSameOrigin: function(image, src) {
		if ((new URL(src, window.location.href)).origin !== window.location.origin) {
			image.crossOrigin = '';
		}
	},

	loadImageTexture: function(image, i) {
		if (!this.gl) {
			return;
		}
		// Create texture
		var texture;

		if (this.loadedTextures[i]) {
			texture = this.loadedTextures[i];

			var textureID = this.gl.TEXTURE0 + i;

			this.gl.activeTexture(textureID);
			this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

			// load image to texture
			this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);

			this.addUniform('1i', 'u_image' + i, i);
			this.addUniform('2f', 'u_image' + i + '_size', [
				image.width,
				image.height
			]);

		} else {
			texture = this.gl.createTexture();

			var textureID = this.gl.TEXTURE0 + i;

			this.gl.activeTexture(textureID);
			this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

			// Set texture parameters to be able to draw any size image
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

			// load image to texture
			this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);

			this.addUniform('1i', 'u_image' + i, i);
			this.addUniform('2f', 'u_image' + i + '_size', [
				image.width,
				image.height
			]);

			// flip coordinates
			this.updateUniform('u_flipY', -1);
		}

	},

	replaceImage: function(src) {
		var that = this;
		var imageId = this.getImageId(src);

		if (this.texture2) {
			that.loadImageTexture(this.texture2, 0);
			that.loadImageTexture(this.texture2, 1);
		}

		var ease = function(t) { return t * (2 - t); };

		this.loadImage(src, 1, function() {
			var time = 1300;
			var fps = 60;
			var frameTime = 1000 / fps;
			var frames = time / frameTime;
			var step = 1 / frames;
			var requestID;
			var t = 0;

			function progress() {
				t += step;

				that.progress = ease(t);

				if (that.progress >= 1) {
					window.cancelAnimationFrame(requestID);
					return;
				}

				requestID = window.requestAnimationFrame(progress);
			}

			that.progress = 0;

			progress();
		});
	}
};

/* global woodmart_settings */
woodmartThemeModule.$document.on('wdSwiperCarouselInited', function () {
	woodmartThemeModule.sliderDistortion();
});

woodmartThemeModule.sliderDistortion = function() {
	if ('undefined' === typeof ShaderX || woodmartThemeModule.$body.hasClass('single-woodmart_slide') || ! document.querySelector('.wd-slider.wd-anim-distortion .wd-carousel.wd-initialized')) {
		return;
	}

	document.querySelectorAll('.wd-slider.wd-anim-distortion').forEach( function ($slider) {
		var $slides = $slider.querySelectorAll('.wd-carousel .wd-slide');

		if ($slides.length < 2) {
			return;
		}

		var imgSrc  = getImageSrc( $slides[0] );
		var imgSrc2 = getImageSrc( $slides[1] );

		if ($slider.classList.contains('webgl-inited') || !imgSrc || !imgSrc2) {
			return;
		}

		$slider.classList.add('webgl-inited');

		var shaderX = new ShaderX({
			container     : $slider.querySelector('.wd-carousel'),
			sizeContainer : $slider,
			vertexShader  : woodmartThemeModule.shaders.matrixVertex,
			fragmentShader: woodmartThemeModule.shaders[woodmart_settings.slider_distortion_effect] ? woodmartThemeModule.shaders[woodmart_settings.slider_distortion_effect] : woodmartThemeModule.shaders.sliderWithWave,
			width         : $slider.offsetWidth,
			height        : $slider.offsetHeight,
			distImage     : woodmart_settings.slider_distortion_effect === 'sliderPattern' ? woodmart_settings.theme_url + '/images/dist11.jpg' : false
		});

		shaderX.loadImage(imgSrc, 0, function() {
			$slider.classList.add('wd-canvas-loaded');
		});
		shaderX.loadImage(imgSrc, 1);
		shaderX.loadImage(imgSrc2, 0, undefined, true);

		$slider.querySelector('.wd-carousel').addEventListener('wdSlideChange', function (e) {
			var activeSlide = e.target.swiper.visibleSlides[0];

			imgSrc = getImageSrc( activeSlide );

			if (!imgSrc) {
				return;
			}

			shaderX.replaceImage(imgSrc);

			if (activeSlide.nextElementSibling) {
				imgSrc2 = getImageSrc( activeSlide.nextElementSibling);

				if ( imgSrc2 ) {
					shaderX.loadImage(imgSrc2, 0, undefined, true);
				}
			}
		});
	});

	function getImageSrc( slide ) {
		var imageSrc = slide.dataset.imageUrl;

		if ( woodmartThemeModule.$window.width() <= 1024 && slide.dataset.imageUrlMd ) {
			imageSrc = slide.dataset.imageUrlMd;
		}

		if ( woodmartThemeModule.$window.width() <= 767 && slide.dataset.imageUrlSm ) {
			imageSrc = slide.dataset.imageUrlSm;
		}

		return imageSrc;
	}
};

window.addEventListener('load',function() {
	woodmartThemeModule.sliderDistortion();
});

/* global woodmart_settings */
woodmartThemeModule.abandonedCart = function() {
	var init = function() {
		recoverGuestCart();
	}

	var recoverGuestCart = function() {
		var inp_email  = document.querySelector('#billing_email');

		if ( ! inp_email ) {
			return;
		}

		var privacyCkeckbox = document.querySelector('#_wd_recover_guest_cart_consent');

		if (privacyCkeckbox) {
			privacyCkeckbox.addEventListener('change', function (e) {
				e.stopPropagation();

				if (e.currentTarget.checked && inp_email.value.length && isValidEmail(inp_email.value)) {
					var event = new Event('change');

					inp_email.dispatchEvent(event);
				}
			});
		}

		inp_email.addEventListener('change', function (e) {
			var target = e.target;
			var email  = target.value;

			if ( ! checkPrivacy() || ! isValidEmail(email)) {
				return;
			}
		
			var first_name = document.querySelector('#billing_first_name');
			var last_name  = document.querySelector('#billing_last_name');
			var phone      = document.querySelector('#billing_phone');
		
			jQuery.ajax({
				url     : woodmart_settings.ajaxurl,
				data    : {
					action: 'woodmart_recover_guest_cart',
					security: woodmart_settings.abandoned_cart_security,
					email,
					phone: phone ? phone.value : '',
					first_name: first_name ? first_name.value : '',
					last_name: last_name ? last_name.value : '',
					currency: woodmart_settings.abandoned_cart_currency,
					language: woodmart_settings.abandoned_cart_language,
				},
				method  : 'POST',
				error   : function() {
					console.log('Ajax error of capturing the abandoned basket of the guest');
				},
			});
		});
	};

	var isValidEmail = function(email) {
		const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailPattern.test(email);
	}

	var checkPrivacy = function() {
		if ( 'no' === woodmart_settings.abandoned_cart_needs_privacy ) {
			return true;
		}

		var privacyInput = document.querySelector('#_wd_recover_guest_cart_consent');

		return privacyInput && privacyInput.checked;
	};

	init();
}

window.addEventListener('load', function() {
	woodmartThemeModule.abandonedCart();
});

/* global woodmart_settings, woodmartThemeModule, jQuery */
(function($) {
	$.each([
		'frontend/element_ready/wd_products.default',
		'frontend/element_ready/wd_products_tabs.default'
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.addToCart();
		});
	});

	woodmartThemeModule.addToCart = function() {
		var that = this;
		var timeoutNumber = 0;
		var timeout;

		woodmartThemeModule.$body.on('added_to_cart', function(e, data) {
			if (data && (data.stop_reload || data.e_manually_triggered)) {
				return false;
			}

			if (woodmart_settings.add_to_cart_action === 'popup') {
				var html = [
					'<div class="added-to-cart">',
					'<h3>' + woodmart_settings.added_to_cart + '</h3>',
					'<a href="#" class="btn close-popup">' + woodmart_settings.continue_shopping + '</a>',
					'<a href="' + woodmart_settings.cart_url + '" class="btn view-cart">' + woodmart_settings.view_cart + '</a>',
					'</div>'
				].join('');

				if ($.magnificPopup?.instance?.isOpen) {
					$.magnificPopup.instance.st.removalDelay = 0
					$.magnificPopup.close()
				}

				$.magnificPopup.open({
					removalDelay   : 600, //delay removal by X to allow out-animation
					closeMarkup    : woodmart_settings.close_markup,
					tLoading       : woodmart_settings.loading,
					fixedContentPos: true,
					callbacks      : {
						beforeOpen: function() {
							this.wrap.addClass('wd-popup-added-cart-wrap');
						},
					},
					items          : {
						src : '<div class="wd-popup wd-popup-added-cart wd-scroll-content">' + html + '</div>',
						type: 'inline'
					}
				});

				$('.wd-popup-added-cart').on('click', '.close-popup', function(e) {
					e.preventDefault();
					$.magnificPopup.close();
				});

				closeAfterTimeout();
			} else if (woodmart_settings.add_to_cart_action === 'widget') {
				clearTimeout(timeoutNumber);
				var $selector = $('.whb-sticked .wd-header-cart .wd-dropdown-cart');

				if ($selector.length > 0) {
					$selector.addClass('wd-opened');
				} else {
					$('.whb-header .wd-header-cart .wd-dropdown-cart').addClass('wd-opened');
				}

				var $cartOpener = $('.cart-widget-opener');
				if ($cartOpener.length > 0) {
					$cartOpener.first().trigger('wdOpenWidgetCart');
				}

				timeoutNumber = setTimeout(function() {
					$('.wd-dropdown-cart').removeClass('wd-opened');
				}, 3500);

				closeAfterTimeout();
			}

			woodmartThemeModule.$document.trigger('wdActionAfterAddToCart');
		});

		var closeAfterTimeout = function() {
			if ('yes' !== woodmart_settings.add_to_cart_action_timeout) {
				return false;
			}

			clearTimeout(timeout);

			timeout = setTimeout(function() {
				$('.wd-close-side').trigger('click');
				$.magnificPopup.close();
			}, parseInt(woodmart_settings.add_to_cart_action_timeout_number) * 1000);
		};
	};

	$(document).ready(function() {
		woodmartThemeModule.addToCart();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.addToCartAllTypes = function() {
		if (woodmart_settings.ajax_add_to_cart == false) {
			return;
		}

		woodmartThemeModule.$body.on('submit', 'form.cart', function(e) {
			var $form = $(this);
			var $productWrapper = $form.parents('.single-product-page');

			if ($productWrapper.length === 0) {
				$productWrapper = $form.parents('.product-quick-view');
			}

			if ($productWrapper.hasClass('product-type-external') || $productWrapper.hasClass('product-type-zakeke') || $productWrapper.hasClass('product-type-gift-card') || 'undefined' !== typeof e.originalEvent && $(e.originalEvent.submitter).hasClass('wd-buy-now-btn')) {
				return;
			}

			if ($form.parents('.wd-sticky-btn-cart').length > 0) {
				var $stickyBtnWrap = $form.parents('.wd-sticky-btn-cart');

				if ($stickyBtnWrap.hasClass('wd-product-type-external')) {
					return;
				}
			}

			e.preventDefault();

			var $thisbutton = $form.find('.single_add_to_cart_button'),
			    data        = $form.serialize();

			data += '&action=woodmart_ajax_add_to_cart';

			if ($thisbutton.val()) {
				data += '&add-to-cart=' + $thisbutton.val();
			}

			$thisbutton.removeClass('added not-added');
			$thisbutton.addClass('loading');

			// Trigger event
			woodmartThemeModule.$body.trigger('adding_to_cart', [
				$thisbutton,
				data
			]);

			$.ajax({
				url     : woodmart_settings.ajaxurl,
				data    : data,
				method  : 'POST',
				success : function(response) {
					if (!response) {
						return;
					}

					var this_page = window.location.toString();

					this_page.replace('add-to-cart', 'added-to-cart');

					if (response.error && response.product_url) {
						window.location = response.product_url;
						return;
					}

					// Redirect to cart option
					if (woodmart_settings.cart_redirect_after_add === 'yes') {
						window.location = woodmart_settings.cart_url;
					} else {

						$thisbutton.removeClass('loading');

						var fragments = response.fragments || {};
						var cart_hash = response.cart_hash;

						// Block fragments class
						if (fragments) {
							$.each(fragments, function(key) {
								$(key).addClass('updating');
							});

							// Replace fragments
							$.each(fragments, function(key, value) {
								$(key).replaceWith(value);
							});
						}

						// Show notices
						var $noticeWrapper = $('.woocommerce-notices-wrapper');
						$noticeWrapper.empty();
						if (response.notices && response.notices.indexOf('error') > 0) {
							$noticeWrapper.append(response.notices);
							$thisbutton.addClass('not-added');

							woodmartThemeModule.$body.trigger('not_added_to_cart', [
								fragments,
								cart_hash,
								$thisbutton
							]);
						} else {
							if ('undefined' !== typeof $.fn.magnificPopup && woodmart_settings.add_to_cart_action === 'widget') {
								$.magnificPopup.close();
							}

							// Changes button classes
							$thisbutton.addClass('added');
							// Trigger event so themes can refresh other areas
							woodmartThemeModule.$body.trigger('added_to_cart', [
								fragments,
								cart_hash,
								$thisbutton
							]);
						}
					}
				},
				error   : function() {
					console.log('ajax adding to cart error');
				},
				complete: function() { }
			});
		});

		woodmartThemeModule.$body.on('click', '.variations_form .wd-buy-now-btn', function(e) {
			var $this = $(this);
			var $addToCartBtn = $this.siblings('.single_add_to_cart_button');

			if ( 'undefined' !== typeof wc_add_to_cart_variation_params && $addToCartBtn.hasClass('disabled') ) {
				e.preventDefault();

				if ($addToCartBtn.hasClass('wc-variation-is-unavailable') ) {
					alert( wc_add_to_cart_variation_params.i18n_unavailable_text );
				} else if ( $addToCartBtn.hasClass('wc-variation-selection-needed') ) {
					alert( wc_add_to_cart_variation_params.i18n_make_a_selection_text );
				}
			}
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.addToCartAllTypes();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.ajaxFilters = function() {
		if (!woodmartThemeModule.$body.hasClass('woodmart-ajax-shop-on') || typeof ($.fn.pjax) === 'undefined' || woodmartThemeModule.$body.hasClass('single-product') || woodmartThemeModule.$body.hasClass('elementor-editor-active') || $('.products[data-source="main_loop"]').length === 0) {
			return;
		}

		var filtersState = false;
		var isPopstateNavigation = false;

		woodmartThemeModule.$document.on('pjax:popstate', function(e) {
			isPopstateNavigation = true;
		});

		woodmartThemeModule.$document.on('pjax:end', function() {
		    if (isPopstateNavigation) {
				woodmartThemeModule.$document.trigger('wdShopPageInit');
				isPopstateNavigation = false;
			}
		});

		woodmartThemeModule.$body.on('click', '.post-type-archive-product .products-footer .woocommerce-pagination a', function() {
			scrollToTop(true);
		});

		woodmartThemeModule.$document.pjax(woodmart_settings.ajax_links, '.wd-page-content', {
			timeout       : woodmart_settings.pjax_timeout,
			scrollTo      : false,
			renderCallback: function(context, html, afterRender) {
				woodmartThemeModule.removeDuplicatedStylesFromHTML(html, function(html) {
					context.html(html);
					afterRender();
					woodmartThemeModule.$document.trigger('wdShopPageInit');
					woodmartThemeModule.$document.trigger('wood-images-loaded');
				});
			}
		});

		if (woodmart_settings.price_filter_action === 'click') {
			woodmartThemeModule.$document.on('click', '.widget_price_filter form .button', function() {
				var form = $('.widget_price_filter form');
				$.pjax({
					container: '.wd-page-content',
					timeout  : woodmart_settings.pjax_timeout,
					url      : form.attr('action'),
					data     : form.serialize(),
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

				return false;
			});
		} else if (woodmart_settings.price_filter_action === 'submit') {
			woodmartThemeModule.$document.on('submit', '.widget_price_filter form', function(event) {
				$.pjax.submit(event, '.wd-page-content');
			});
		}

		woodmartThemeModule.$document.on('pjax:error', function(xhr, textStatus, error) {
			console.log('pjax error ' + error);
		});

		woodmartThemeModule.$document.on('pjax:start', function() {
			var $siteContent = $('.wd-content-layout');

			$siteContent.removeClass('wd-loaded');
			$siteContent.addClass('wd-loading');

			woodmartThemeModule.$document.trigger('wdPjaxStart');
			woodmartThemeModule.$window.trigger('scroll.loaderVerticalPosition');
		});

		woodmartThemeModule.$document.on('pjax:complete', function() {
			woodmartThemeModule.$window.off('scroll.loaderVerticalPosition');

			scrollToTop(false);

			woodmartThemeModule.$document.trigger('wood-images-loaded');

			$('.wd-scroll-content').on('scroll', function() {
				woodmartThemeModule.$document.trigger('wood-images-loaded');
			});

			if (typeof woodmart_wpml_js_data !== 'undefined' && woodmart_wpml_js_data.languages) {
				$.each(woodmart_wpml_js_data.languages, function(index, language) {
					$('.wpml-ls-item-' + language.code + ' .wpml-ls-link').attr('href', language.url);
				});
			}
		});

		woodmartThemeModule.$document.on('pjax:beforeReplace', function() {
			if ($('.filters-area').hasClass('filters-opened') && woodmart_settings.shop_filters_close === 'yes') {
				filtersState = true;
				woodmartThemeModule.$body.addClass('body-filters-opened');
			}
		});

		woodmartThemeModule.$document.on('wdShopPageInit', function() {
			var $siteContent = $('.wd-content-layout');

			if (filtersState) {
				$('.filters-area').css('display', 'block');
				woodmartThemeModule.openFilters(200);
				filtersState = false;
			}

			$siteContent.removeClass('wd-loading');
			$siteContent.addClass('wd-loaded');
		});

		var scrollToTop = function(type) {
			if (woodmart_settings.ajax_scroll === 'no' && type === false) {
				return false;
			}

			var $scrollTo = $(woodmart_settings.ajax_scroll_class),
			    scrollTo  = $scrollTo.offset().top - woodmart_settings.ajax_scroll_offset;

			$('html, body').stop().animate({
				scrollTop: scrollTo
			}, 400);
		};
	};

	$(document).ready(function() {
		woodmartThemeModule.ajaxFilters();
	});
})(jQuery);

(function($) {
	woodmartThemeModule.cartQuantity = function() {
		var timeout;

		woodmartThemeModule.$document.on('change input', '.woocommerce-cart-form__cart-item .quantity .qty', function(e) {
			var $input = $(this);

			clearTimeout(timeout);

			if ($input.val().trim() === '') {
				return;
			}

			timeout = setTimeout(function() {
				$input.parents('.woocommerce-cart-form').find('button[name=update_cart]').trigger('click');
			}, 500);
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.cartQuantity();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.cartWidget = function() {
		var body = woodmartThemeModule.$body;

		var cartWidgetSide = $('.cart-widget-side');
		var closeSide = $('.wd-close-side');

		body.on('click wdOpenWidgetCart', '.cart-widget-opener', function(e) {
			if (!isCart() && !isCheckout()) {
				e.preventDefault();
			}

			if (isOpened()) {
				closeWidget();
			} else {
				setTimeout(function() {
					openWidget();
				}, 10);
			}
		});

		body.on('click touchstart', '.wd-close-side', function() {
			if (isOpened()) {
				closeWidget();
			}
		});

		body.on('click', '.close-side-widget', function(e) {
			e.preventDefault();
			if (isOpened()) {
				closeWidget();
			}
		});

		woodmartThemeModule.$document.on('keyup', function(e) {
			if (e.keyCode === 27 && isOpened()) {
				closeWidget();
			}
		});

		var closeWidget = function() {
			cartWidgetSide.trigger('wdCloseSide');
			cartWidgetSide.removeClass('wd-opened');
			closeSide.removeClass('wd-close-side-opened');
		};

		var openWidget = function() {
			if (isCart() || isCheckout()) {
				return false;
			}
			cartWidgetSide.trigger('wdOpenSide');
			cartWidgetSide.addClass('wd-opened');
			closeSide.addClass('wd-close-side-opened');
		};

		var isOpened = function() {
			return cartWidgetSide.hasClass('wd-opened');
		};

		var isCart = function() {
			return woodmartThemeModule.$body.hasClass('woocommerce-cart');
		};

		var isCheckout = function() {
			return woodmartThemeModule.$body.hasClass('woocommerce-checkout');
		};
	};

	$(document).ready(function() {
		woodmartThemeModule.cartWidget();
	});

	window.addEventListener('wdUpdatedHeader',function() {
		woodmartThemeModule.cartWidget();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdBackHistory wdShopPageInit', function () {
		woodmartThemeModule.categoriesAccordion();
	});

	woodmartThemeModule.categoriesAccordion = function() {

		if (woodmart_settings.categories_toggle === 'no') {
			return;
		}

		var $widget = $('.widget_product_categories, .wd-product-category-filter'),
		    $list   = $widget.find('.product-categories'),
		    time    = 300;

		$list.find('.wd-active-parent').each(function() {
			var $this = $(this);

			if ($this.find(' > .wd-cats-toggle').length > 0) {
				return;
			}

			if ($this.find(' > .children').length === 0 || $this.find(' > .children > *').length === 0) {
				return;
			}

			if ($this.hasClass('wd-active') || $this.hasClass('wd-current-active-parent')) {
				$this.children().eq(0).after('<div class="wd-cats-toggle toggle-active wd-role-btn" tabindex="0"></div>');

				$this.find('> .children').addClass('list-shown');
			} else {
				$this.children().eq(0).after('<div class="wd-cats-toggle wd-role-btn"  tabindex="0"></div>');
			}
		});

		$list.on('click', '.wd-cats-toggle', function() {
			var $btn     = $(this);
			var	$subList = $btn.parent().find('> .children');

			if ($subList.hasClass('list-shown')) {
				$btn.removeClass('toggle-active');
				$subList.stop().slideUp(time).removeClass('list-shown');
			} else {
				$subList.parent().parent().find('> li > .list-shown').slideUp().removeClass('list-shown');
				$subList.parent().parent().find('> li > .toggle-active').removeClass('toggle-active');
				$btn.addClass('toggle-active');
				$subList.stop().slideDown(time).addClass('list-shown');
			}
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.categoriesAccordion();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdShopPageInit', function() {
		woodmartThemeModule.categoriesDropdowns();
	});

	woodmartThemeModule.categoriesDropdowns = function() {
		$('.dropdown_product_cat').on('change', function() {
			var $this = $(this);

			if ('' !== $this.val()) {
				var this_page;
				var home_url = woodmart_settings.home_url;

				if (home_url.indexOf('?') > 0) {
					this_page = home_url + '&product_cat=' + $this.val();
				} else {
					this_page = home_url + '?product_cat=' + $this.val();
				}

				location.href = this_page;
			} else {
				location.href = woodmart_settings.shop_url;
			}
		});

		$('.widget_product_categories').each(function() {
			var $select = $(this).find('select');

			if ($().selectWoo) {
				$select.selectWoo({
					minimumResultsForSearch: 5,
					width                  : '100%',
					allowClear             : true,
					placeholder            : woodmart_settings.product_categories_placeholder,
					language               : {
						noResults: function() {
							return woodmart_settings.product_categories_no_results;
						}
					}
				});
			}
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.categoriesDropdowns();
	});
})(jQuery);

/* global woodmart_checkout_fields */
/* global wc_address_i18n_params */
(function($) {
	// wc_address_i18n_params is required to continue, ensure the object exists
	if ( 'undefined' === typeof wc_address_i18n_params ) {
		return false;
	}

	function isRequiredField( field, isRequired ) {
		if ( isRequired ) {
			field.find( 'label .optional' ).remove();
			field.addClass( 'validate-required' );

			if ( 0 === field.find( 'label .required' ).length ) {
				field.find( 'label' ).append(
					'&nbsp;<abbr class="required" title="' +
					wc_address_i18n_params.i18n_required_text +
					'">*</abbr>'
				);
			}
		} else {
			field.find( 'label .required' ).remove();
			field.removeClass( 'validate-required woocommerce-invalid woocommerce-invalid-required-field' );

			if ( field.find( 'label .optional' ).length === 0 ) {
				field.find( 'label' ).append( '&nbsp;<span class="optional">(' + wc_address_i18n_params.i18n_optional_text + ')</span>' );
			}
		}
	}

	$( document )
		.on( 'country_to_state_changing', function( event, country, wrapper ) {
			if ( 0 === woodmart_checkout_fields.length ) {
				return;
			}

			let thisform      = wrapper;
			let locale_fields = JSON.parse( wc_address_i18n_params.locale_fields );

			$.each( locale_fields, function( key, value ) {
				let field     = thisform.find( value );
				let fieldName = field.find('[name]').attr('name');

				if ( ! woodmart_checkout_fields.hasOwnProperty(fieldName) || ! woodmart_checkout_fields[fieldName].hasOwnProperty('required') ) {
					return;
				}

				let isRequired = woodmart_checkout_fields[fieldName]['required'];

				isRequiredField( field, isRequired );
			});
		});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.checkoutQuantity = function() {
		var timeout;

		woodmartThemeModule.$document.on('change input', '.woocommerce-checkout-review-order-table .quantity .qty', function() {
			var input = $(this);
			var qtyVal = input.val();
			var itemName = input.attr('name');
			var itemID = itemName.substring(itemName.indexOf('[') + 1, itemName.indexOf(']') );
			var maxValue = input.attr('max');
			var cart_hash_key = woodmart_settings.cart_hash_key;
			var fragment_name = woodmart_settings.fragment_name;

			clearTimeout(timeout);

			if (parseInt(qtyVal) > parseInt(maxValue)) {
				qtyVal = maxValue;
			}

			timeout = setTimeout(function() {
				$.ajax({
					url     : woodmart_settings.ajaxurl,
					data    : {
						action : 'woodmart_update_cart_item',
						item_id: itemID,
						qty    : qtyVal
					},
					success : function( data ) {
						if (data && data.fragments) {
							$.each(data.fragments, function(key, value) {
								$(key).replaceWith(value);
							});

							if (woodmartThemeModule.supports_html5_storage) {
								sessionStorage.setItem(fragment_name, JSON.stringify(data.fragments));
								localStorage.setItem(cart_hash_key, data.cart_hash);
								sessionStorage.setItem(cart_hash_key, data.cart_hash);

								if (data.cart_hash) {
									sessionStorage.setItem('wc_cart_created', (new Date()).getTime());
								}
							}

							woodmartThemeModule.$body.trigger( 'wc_fragments_refreshed' );
						}

						$('form.checkout').trigger( 'update' );
					},
					dataType: 'json',
					method  : 'GET'
				});
			}, 500);
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.checkoutQuantity();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.checkoutRemove = function() {
		woodmartThemeModule.$document.on('click', '.wd-checkout-remove-btn', function() {
			$(this)
				.closest('.woocommerce-checkout-review-order-table')
				.append('<div class="wd-loader-overlay wd-fill wd-loading"></div>');
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.checkoutRemove();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.commentImage = function() {
		$('form.comment-form').attr('enctype', 'multipart/form-data');

		var $form = $('.comment-form');
		var $input = $form.find('#wd-add-img-btn');
		var allowedMimes = [];

		if ($input.length === 0) {
			return;
		}

		$.each(woodmart_settings.comment_images_upload_mimes, function(index, value) {
			allowedMimes.push(String(value));
		});

		$form.find('#wd-add-img-btn').on('change', function() {
			$form.find('.wd-add-img-count').text(woodmart_settings.comment_images_added_count_text.replace('%s', this.files.length));
		});

		$form.on('submit', function(e) {
			$form.find('.woocommerce-error').remove();

			var hasLarge = false;
			var hasNotAllowedMime = false;

			if ($input[0].files.length > woodmart_settings.comment_images_count) {
				showError(woodmart_settings.comment_images_count_text);
				e.preventDefault();
			}

			if ($input[0].files.length <= 0 && 'yes' === woodmart_settings.single_product_comment_images_required) {
				showError(woodmart_settings.comment_required_images_error_text);
				e.preventDefault();
			}

			Array.prototype.forEach.call($input[0].files, function(file) {
				var size = file.size;
				var type = String(file.type);

				if (size > woodmart_settings.comment_images_upload_size) {
					hasLarge = true;
				}

				if ($.inArray(type, allowedMimes) < 0) {
					hasNotAllowedMime = true;
				}
			});

			if (hasLarge) {
				showError(woodmart_settings.comment_images_upload_size_text);
				e.preventDefault();
			}

			if (hasNotAllowedMime) {
				showError(woodmart_settings.comment_images_upload_mimes_text);
				e.preventDefault();
			}
		});

		function showError(text) {
			$form.prepend('<ul class="woocommerce-error" role="alert"><li>' + text + '</li></ul>');
		}
	};

	$(document).ready(function() {
		woodmartThemeModule.commentImage();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.countProductVisits = function () {
		var live_duration = 10000;

		if ( 'undefined' !== typeof woodmart_settings.counter_visitor_live_duration ) {
			live_duration = woodmart_settings.counter_visitor_live_duration;
		}

		if ('yes' === woodmart_settings.counter_visitor_ajax_update) {
			woodmartThemeModule.updateCountProductVisits();
		} else if ( 'yes' === woodmart_settings.counter_visitor_live_mode) {
			setInterval(woodmartThemeModule.updateCountProductVisits, live_duration);
		}
	}

	woodmartThemeModule.updateCountProductVisits = function() {
		$('.wd-visits-count').each( function () {
			var $this = $(this);
			var productId = $this.data('product-id');
			var $count = $this.find('.wd-info-number');

			if ( ! productId ) {
				return;
			}

			$.ajax({
				url     : woodmart_settings.ajaxurl,
				data    : {
					action    : 'woodmart_update_count_product_visits',
					product_id: productId,
					count     : $count.text(),
				},
				method  : 'POST',
				success : function(response) {
					if (response) {
						$count.text(response.count);

						if (response.message) {
							$this.find('.wd-count-msg').text(response.message);
						}

						if (!response.count) {
							$this.addClass('wd-hide');
						} else {
							$this.removeClass('wd-hide');
						}
					}
				},
				error   : function() {
					console.log('ajax error');
				},
				complete: function() {}
			});
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.countProductVisits();
	});
})(jQuery);

(function ($) {
	$.each([
		'frontend/element_ready/wd_dynamic_discounts_table.default',
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.renderDynamicDiscountsTable();
		});
	});

    woodmartThemeModule.renderDynamicDiscountsTable = function () {
        let $variation_forms = $('.variations_form');
        let $dynamicDiscountsTable = $('.wd-dynamic-discounts');
        let default_price_table = $dynamicDiscountsTable.html();

        function reInitPricingTableRowsClick() {
            $('.wd-dynamic-discounts tbody tr').each(function () {
                let $row = $(this);

                let min = $row.data('min');

                $row.off('click').on('click', function() {
                    let $quantityInput = $('.quantity input.qty[name="quantity"]');

                    $quantityInput.val(min).trigger('change');
                });
            });
        }

        function addActiveClassToTable( $pricing_table, currentQuantityValue ) {
            $pricing_table.find('tbody tr').each(function () {
                let $row = $(this);
                let min  = $row.data('min');
                let max  = $row.data('max');

                if ( ( ! max && min <= currentQuantityValue ) || ( min <= currentQuantityValue && currentQuantityValue <= max ) ) {
                    $row.addClass('wd-active');
                } else {
                    $row.removeClass('wd-active');
                }
            });
        }

        $variation_forms.each(function () {
            let $variation_form = $(this);

            $variation_form
                .on('show_variation', function (event, variation) {
                    $.ajax({
                        url     : woodmart_settings.ajaxurl,
                        data    : {
                            action : 'woodmart_update_discount_dynamic_discounts_table',
                            variation_id: variation.variation_id,
                        },
						beforeSend: function () {
							$dynamicDiscountsTable.find('.wd-loader-overlay').addClass('wd-loading');
						},
                        success : ( data ) => {
                            var classes = $dynamicDiscountsTable.attr('class');

                            woodmartThemeModule.removeDuplicatedStylesFromHTML(data, function(html) {
                                $dynamicDiscountsTable.replaceWith( html );

                                $dynamicDiscountsTable = $('.wd-dynamic-discounts');
                                $dynamicDiscountsTable.attr('class', classes);
                                
                                reInitPricingTableRowsClick();

                                addActiveClassToTable( $dynamicDiscountsTable, $(this).find('[name="quantity"]').val() );
                                $dynamicDiscountsTable.find('.wd-loader-overlay').removeClass('wd-loading');
                            });
                        },
                        dataType: 'json',
                        method  : 'GET'
                    });
                })
                .on('click', '.reset_variations', function () {
                    $dynamicDiscountsTable.html(default_price_table);
                    reInitPricingTableRowsClick();

                    addActiveClassToTable( $('.wd-dynamic-discounts'), $(this).closest('form').find('.quantity input.qty[name="quantity"]').val() );
                });
        });

        reInitPricingTableRowsClick();

        $('.quantity input.qty[name="quantity"]').off('change').on('change', function() {
            addActiveClassToTable( $dynamicDiscountsTable, $(this).val() );
        });
    }

    $(document).ready(() => {
        woodmartThemeModule.renderDynamicDiscountsTable();
    });
})(jQuery);

/* global woodmart_settings, woodmartThemeModule */
woodmartThemeModule.emailSubscriptionCheckboxes = function() {
	let mainCheckbox = document.querySelector('#wd_email_subscription_consent');
	
	function init() {
		if (!mainCheckbox) {
			return;
		}

		setupEventListeners();
	}

	function setupEventListeners() {
		mainCheckbox.addEventListener('change', updateIndividualCheckboxes);

		document.querySelectorAll('.wd-email-individual-consent').forEach(function(checkbox) {
			checkbox.addEventListener('change', updateMainCheckbox);
		});
	}

	function updateIndividualCheckboxes() {
		document.querySelectorAll('.wd-email-individual-consent').forEach(function(checkbox) {
			checkbox.checked = mainCheckbox.checked;

			if (mainCheckbox.checked) {
				checkbox.disabled = false;
				checkbox.value = '1';
			} else {
				checkbox.disabled = true;
				checkbox.value = '0';
			}
		});
	}

	function updateMainCheckbox() {
		if (this.checked) {
			mainCheckbox.checked = true;
			mainCheckbox.value = '1';
		} else if (!anyChecked()) {
			mainCheckbox.checked = false;
			mainCheckbox.value = '0';
		}
	}

	function anyChecked() {
		let anyChecked = false;

		document.querySelectorAll('.wd-email-individual-consent').forEach(function(box) {
			if (box.checked) {
				anyChecked = true;
			}
		});

		return anyChecked;
	}

	init();
}

window.addEventListener('load', function() {
	woodmartThemeModule.emailSubscriptionCheckboxes();
});

jQuery(document).on('updated_shipping_method', function() {
	jQuery(document.body).trigger('wc_update_cart');
});

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

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.filtersArea = function() {
		var filters = $('.filters-area'),
		    time    = 200;

		woodmartThemeModule.$body.on('click', '.open-filters', function(e) {
			e.preventDefault();

			if (isOpened()) {
				closeFilters();
			} else {
				woodmartThemeModule.openFilters(time);
				setTimeout(function() {
					woodmartThemeModule.$document.trigger('wdFiltersOpened');
				}, time);
			}
		});

		if (woodmart_settings.shop_filters_close === 'no') {
			woodmartThemeModule.$body.on('click', woodmart_settings.ajax_links, function() {
				if (isOpened()) {
					closeFilters();
				}
			});
		}

		var isOpened = function() {
			filters = $('.filters-area');
			return filters.hasClass('filters-opened');
		};

		var closeFilters = function() {
			filters = $('.filters-area');
			filters.removeClass('filters-opened');
			filters.stop().slideUp(time);
		};
	};

	woodmartThemeModule.openFilters = function(time) {
		var filters = $('.filters-area');
		filters.stop().slideDown(time);

		setTimeout(function() {
			filters.addClass('filters-opened');
			woodmartThemeModule.$document.trigger('wdFiltersOpened');

			woodmartThemeModule.$body.removeClass('body-filters-opened');
			woodmartThemeModule.$document.trigger('wood-images-loaded');
		}, time);
	};

	$(document).ready(function() {
		woodmartThemeModule.filtersArea();
	});
})(jQuery);

jQuery.each([
	'frontend/element_ready/wd_cart_table.default',
], function(index, value) {
	woodmartThemeModule.wdElementorAddAction(value, function($wrapper) {
		woodmartThemeModule.addGiftProduct();
	});
});

// Update gifts table only if turned on layout builder.
function updateGiftsTable() {
	var giftsWrapper = document.querySelector('.wd-fg');

	if ( ! giftsWrapper ) {
		return;
	}

	var settings      = giftsWrapper.dataset.hasOwnProperty('settings') ? JSON.parse( giftsWrapper.dataset.settings ) : false;
	var loaderOverlay = giftsWrapper.querySelector('.wd-loader-overlay');

	if ( loaderOverlay ) {
		loaderOverlay.classList.add('wd-loading');
	}

	jQuery.ajax({
		url     : woodmart_settings.ajaxurl,
		data    : {
			action: 'woodmart_update_gifts_table',
		},
		method  : 'POST',
		success : function(response) {
			if (!response) {
				return;
			}

			if (giftsWrapper && response.hasOwnProperty('html')) {
				let tempDiv       = document.createElement('div');
				tempDiv.innerHTML = response.html;

				if ( settings && 'no' === settings.show_title) {
					var titleNode = tempDiv.querySelector('.wd-el-title');

					if (titleNode) {
						titleNode.remove();
					}
				}

				childNodes = tempDiv.childNodes;

				if (0 === childNodes.length) {
					giftsWrapper.classList.add('wd-hide');
				} else {
					giftsWrapper.classList.remove('wd-hide');
				}

				giftsWrapper.replaceChildren(...childNodes);
			}
		},
		error   : function() {
			console.log('ajax update gifts table error');
		},
		complete: function() {
			if ( loaderOverlay ) {
				loaderOverlay.classList.remove('wd-loading');
			}
		}
	});
}

jQuery( document.body ).on( 'updated_cart_totals', updateGiftsTable);
jQuery( document.body ).on( 'updated_checkout', updateGiftsTable);

woodmartThemeModule.addGiftProduct = function() {
	var isCheckout   = !! document.querySelector('.woocommerce-checkout');
	var listenerArea = document.querySelector('.site-content .woocommerce');

	if ( ! listenerArea ) {
		return;
	}

	listenerArea.addEventListener("click", function(e) {
		var addGiftButton = e.target.closest('.wd-add-gift-product');

		if ( addGiftButton ) {
			e.preventDefault();

			var fgTableWrapper = addGiftButton.closest('.wd-fg');
			var loaderOverlay  = fgTableWrapper.querySelector('.wd-loader-overlay');
			var productId      = addGiftButton.dataset.productId;

			if ( addGiftButton.classList.contains('wd-disabled') ) {
				return;
			}

			loaderOverlay.classList.add('wd-loading');

			jQuery.ajax({
				url     : woodmart_settings.ajaxurl,
				data    : {
					action: 'woodmart_add_gift_product',
					product_id: productId,
					security: addGiftButton.dataset.security,
					is_checkout: isCheckout ? '1' : '0',
				},
				method  : 'POST',
				success : function(response) {
					if (!response) {
						return;
					}

					triggerEvent = isCheckout ? 'update_checkout' : 'wc_update_cart';

					jQuery(document.body).trigger(triggerEvent);
				},
				error   : function() {
					console.log('ajax adding gift to cart error');
				},
				complete: function() {
					loaderOverlay.classList.remove('wd-loading');
				}
			});
		}
	});
}

window.addEventListener('load',function() {
	woodmartThemeModule.addGiftProduct();
});

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.frequentlyBoughtTogether = function () {
		$('form.wd-fbt-form').each( function () {
			var timeout = '';
			var $form = $(this);

			$form.on('change', '.wd-fbt-product input, .wd-fbt-product select', function () {
				var $this = $(this);
				var productsID = getProductsId($form);
				var mainProduct = $form.find('input[name=wd-fbt-main-product]').val();
				var btn = $form.find('.wd-fbt-purchase-btn');

				if ( ! productsID || 'undefined' === typeof productsID[mainProduct] ) {
					return;
				}

				if ( 2 > Object.keys(productsID).length ) {
					btn.addClass('wd-disabled');
				} else {
					btn.removeClass('wd-disabled');
				}

				var $carousel = $form.parents('.wd-fbt').find('.wd-carousel');
				var index = $this.parents('.wd-fbt-product').index();

				if ( 'undefined' !== typeof $carousel[0].swiper && ! $($carousel.find('.wd-carousel-item')[index]).hasClass('wd-active') ) {
					if ( 1 === index && 1 < $carousel[0].swiper.slides.length ) {
						index = 0;
					}

					if ( 'undefined' !== typeof $carousel[0].swiper.slideTo ) {
						$carousel[0].swiper.slideTo(index, 500);
					}
				}

				clearTimeout(timeout);

				timeout = setTimeout(function () {
					updatePrice($form, productsID);
				}, 1000);
			});

			$form.on('change', '.wd-fbt-product select', function () {
				var $this = $(this);
				var productID = $this.parents('.wd-fbt-product').data('id');
				var productWrapper = $this.parents('.wd-fbt').find('.wd-product[data-id=' + productID + ']');
				var $img = productWrapper.find('.product-image-link > img, .product-image-link > picture > img');
				var imageSrc = $this.find('option:selected').data('image-src');
				var imageSrcset = $this.find('option:selected').data('image-srcset');

				if ( $img.attr('srcset') ) {
					if ( ! imageSrcset ) {
						imageSrcset = imageSrc;
					}

					$img.attr('srcset', imageSrcset);
				}

				$img.attr('src', imageSrc);
			});

			$form.on('click', '.wd-fbt-purchase-btn', function (e) {
				e.preventDefault();

				var $this       = $(this);

				if ( $this.hasClass('wd-disabled') ) {
					return;
				}

				var productsID  = getProductsId($form);
				var mainProduct = $form.find('input[name=wd-fbt-main-product]').val();
				var bundlesId   = $form.find('input[name=wd-fbt-bundle-id]').val();

				if ( ! productsID || 'undefined' === typeof productsID[mainProduct] ) {
					return;
				}

				clearTimeout(timeout);

				$this.addClass('loading');

				$.ajax({
					url     : woodmart_settings.ajaxurl,
					data    : {
						action        : 'woodmart_purchasable_fbt_products',
						products_id   : productsID,
						main_product  : mainProduct,
						bundle_id     : bundlesId,
					},
					method  : 'POST',
					success : function(response) {
						var $noticeWrapper = $('.woocommerce-notices-wrapper');
						$noticeWrapper.empty();

						if (response.notices && response.notices.indexOf('error') > 0) {
							$noticeWrapper.append(response.notices);

							var scrollTo = $noticeWrapper.offset().top - woodmart_settings.ajax_scroll_offset;

							$('html, body').stop().animate({
								scrollTop: scrollTo
							}, 400);

							return;
						}

						if ('undefined' !== typeof response.fragments) {
							if ('undefined' !== typeof $.fn.magnificPopup && woodmart_settings.add_to_cart_action === 'widget') {
								$.magnificPopup.close();
							}

							$this.addClass('added');

							woodmartThemeModule.$body.trigger('added_to_cart', [
								response.fragments,
								response.cart_hash,
								jQuery()
							]);
						}
					},
					error   : function() {
						console.log('ajax error');
					},
					complete: function() {
						$this.removeClass('loading');
					}
				});
			});
		});

		function getProductsId($form) {
			var productsID = {};

			$form.find('.wd-fbt-product').each( function () {
				var $this = $(this);
				var $input = $(this).find('input');
				var productId = $this.data('id');
				var productWrapper = $form.parents('.wd-fbt');

				if ( $input.length ) {
					if ( $input.is(':checked') ) {
						if ( $this.find('.wd-fbt-product-variation').length ) {
							productsID[productId] = $this.find('.wd-fbt-product-variation select').val();
						} else {
							productsID[productId] = '';
						}

						productWrapper.find('.product.post-' + productId ).removeClass('wd-disabled-fbt');
					} else if ( ! $input.parents('.wd-fbt-form').hasClass('wd-checkbox-uncheck') ) {
						productWrapper.find('.product.post-' + productId).addClass('wd-disabled-fbt');
					}
				} else {
					if ( $this.find('.wd-fbt-product-variation').length ) {
						productsID[productId] = $this.find('.wd-fbt-product-variation select').val();
					} else {
						productsID[productId] = '';
					}
				}
			});

			return productsID;
		}

		function updatePrice( $wrapper, productsID ) {
			var mainProduct = $wrapper.find('input[name=wd-fbt-main-product]').val();
			var bundleId    = $wrapper.find('input[name=wd-fbt-bundle-id]').val();

			$wrapper.find('.wd-loader-overlay').addClass( 'wd-loading' );

			$.ajax({
				url     : woodmart_settings.ajaxurl,
				data    : {
					action      : 'woodmart_update_frequently_bought_price',
					products_id : productsID,
					main_product: mainProduct,
					bundle_id   : bundleId,
				},
				method  : 'POST',
				success : function(response) {
					if (response.fragments) {
						$.each( response.fragments, function( key, value ) {
							$( key ).replaceWith(value);
						});
					}
				},
				error   : function() {
					console.log('ajax error');
				},
				complete: function() {
					$wrapper.find('.wd-loader-overlay').removeClass('wd-loading');
				}
			});
		}
	}

	$(document).ready(function() {
		woodmartThemeModule.frequentlyBoughtTogether();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdShopPageInit wdProductsTabsLoaded wdSearchFullScreenContentLoaded wdArrowsLoadProducts wdLoadMoreLoadProducts wdUpdateWishlist wdRecentlyViewedProductLoaded', function () {
		woodmartThemeModule.gridQuantity();
	});

	$.each([
		'frontend/element_ready/wd_products.default',
		'frontend/element_ready/wd_products_tabs.default'
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.gridQuantity();
		});
	});

	woodmartThemeModule.gridQuantity = function() {
		$('.wd-product').on('change input', '.quantity .qty', function() {
			var $this = $(this);
			var add_to_cart_button = $this.parent().parent().find('.add_to_cart_button');

			add_to_cart_button.attr('data-quantity', $this.val());
			add_to_cart_button.attr('href', '?add-to-cart=' + add_to_cart_button.attr('data-product_id') + '&quantity=' + $this.val());
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.gridQuantity();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.headerCategoriesMenu = function() {
		if (woodmartThemeModule.windowWidth > 1024) {
			return;
		}

		var categories    = $('.wd-header-cats'),
		    catsUl        = categories.find('.categories-menu-dropdown'),
		    subCategories = categories.find('.menu-item-has-children'),
		    button        = categories.find('.menu-opener'),
		    time          = 200,
		    iconDropdown  = '<span class="drop-category"></span>';

		subCategories.find('> a').before(iconDropdown);

		catsUl.on('click', '.drop-category', function() {
			var $this = $(this);
			var sublist = $this.parent().find('> .wd-dropdown-menu, >.sub-sub-menu');

			if (sublist.hasClass('child-open')) {
				$this.removeClass('act-icon');
				sublist.slideUp(time).removeClass('child-open');
			} else {
				$this.addClass('act-icon');
				sublist.slideDown(time).addClass('child-open');
			}
		});

		categories.on('click', '.menu-opener', function(e) {
			e.preventDefault();

			if (isOpened()) {
				closeCats();
			} else {
				openCats();
			}
		});

		catsUl.on('click', 'a', function() {
			closeCats();
			catsUl.stop().attr('style', '');
		});

		var isOpened = function() {
			return catsUl.hasClass('categories-opened');
		};

		var openCats = function() {
			catsUl.addClass('categories-opened').stop().slideDown(time);
		};

		var closeCats = function() {
			catsUl.removeClass('categories-opened').stop().slideUp(time);
		};
	};

	$(document).ready(function() {
		woodmartThemeModule.headerCategoriesMenu();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('pjax:complete wdProductsTabsLoaded wdShopPageInit wdLoadMoreLoadProducts wdArrowsLoadProducts', function() {
		woodmartThemeModule.imagesGalleryInLoop();
	});

	woodmartThemeModule.$document.on('wdRecentlyViewedProductLoaded', function() {
		$('.wd-products-element .products, .wd-carousel-container.products .wd-product')
			.each(function ( key, product ) {
				let $product = $(this);

				$product.trigger('wdImagesGalleryInLoopOn', $product);
			});
	});

	$.each([
		'frontend/element_ready/wd_products.default',
		'frontend/element_ready/wd_products_tabs.default',
		'frontend/element_ready/wd_archive_products.default',
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.imagesGalleryInLoop();
		});
	});

	woodmartThemeModule.imagesGalleryInLoop = function() {
		function addGalleryLoopEvents( neededProduct ) {
			$( neededProduct )
				.on('mouseover mouseout', '.wd-product-grid-slide', function( e ) {
					let $hoverSlide          = $(this);
					let $product             = $hoverSlide.closest('.wd-product');
					let $productsHolder      = $product.closest('.wd-products, .wd-products .wd-carousel');
					let productsGalleryAtts  = $productsHolder.length > 0 && $productsHolder.data('grid-gallery') ? $productsHolder.data('grid-gallery') : {};
					let grid_gallery_control = woodmart_settings.grid_gallery_control;

					if ( productsGalleryAtts.hasOwnProperty( 'grid_gallery_control' ) && ( null === productsGalleryAtts.grid_gallery_control || ( 'string' === typeof productsGalleryAtts.grid_gallery_control && productsGalleryAtts.grid_gallery_control.length > 0 ) ) ) {
						grid_gallery_control = productsGalleryAtts.grid_gallery_control;
					}

					if ( 'hover' !== grid_gallery_control || woodmartThemeModule.$window.width() <= 1024 ) {
						return;
					}

					let $imagesIndicator    = $product.find('.wd-product-grid-slider-pagin');
					let $productImage       = $product.find('.product-image-link > img, .product-image-link > picture > img');
					let $productImageSource = $product.find('.product-image-link > picture source');
					let hoverImageUrl;
					let hoverImageSrcSet;
					let currentImagesIndicator;

					if ( 'mouseover' === e.type ) {
						let hoverSliderId      = $hoverSlide.data('image-id');
						hoverImageUrl          = $hoverSlide.data('image-url');
						hoverImageSrcSet       = $hoverSlide.data('image-srcset');
						currentImagesIndicator = $imagesIndicator.find(`[data-image-id="${hoverSliderId}"]`);
					} else {
						hoverImageUrl          = $product.find('.wd-product-grid-slide[data-image-id="0"]').data('image-url');
						hoverImageSrcSet       = $product.find('.wd-product-grid-slide[data-image-id="0"]').data('image-srcset');
						currentImagesIndicator = $imagesIndicator.find('[data-image-id="0"]');
					}

					currentImagesIndicator.siblings().removeClass('wd-active');
					currentImagesIndicator.addClass('wd-active');

					$productImage.attr('src', hoverImageUrl );

					if ( hoverImageSrcSet ) {
						$productImage.attr('srcset', hoverImageSrcSet );
						$productImageSource.attr('srcset', hoverImageSrcSet );
					} else if ( $productImage.attr('srcset' ) ) {
						$productImage.attr('srcset', null);
						$productImageSource.attr('srcset', null);
					}
				})
				.on('click', '.wd-prev, .wd-next', function( e ) {
					e.preventDefault();
					let $navButton                 = $(this);
					let $productsHolder            = $navButton.closest('.wd-products, .wd-products .wd-carousel');
					let productsGalleryAtts        = $productsHolder.length > 0 && $productsHolder.data('grid-gallery') ? $productsHolder.data('grid-gallery') : {};
					let grid_gallery_control       = woodmart_settings.grid_gallery_control;
					let grid_gallery_enable_arrows = woodmart_settings.grid_gallery_enable_arrows;

					if ( productsGalleryAtts.hasOwnProperty( 'grid_gallery_control' ) && ( null === productsGalleryAtts.grid_gallery_control || ( 'string' === typeof productsGalleryAtts.grid_gallery_control && productsGalleryAtts.grid_gallery_control.length > 0 ) ) ) {
						grid_gallery_control = productsGalleryAtts.grid_gallery_control;
					}

					if ( productsGalleryAtts.hasOwnProperty( 'grid_gallery_enable_arrows' ) && ( null === productsGalleryAtts.grid_gallery_enable_arrows || ( 'string' === typeof productsGalleryAtts.grid_gallery_enable_arrows && productsGalleryAtts.grid_gallery_enable_arrows.length > 0 ) ) ) {
						grid_gallery_enable_arrows = productsGalleryAtts.grid_gallery_enable_arrows;
					}

					if ( ( woodmartThemeModule.$window.width() < 1024 && ( ! grid_gallery_enable_arrows || 'none' === grid_gallery_enable_arrows ) ) || ( woodmartThemeModule.$window.width() > 1024 && ( ! grid_gallery_control || 'arrows' !== grid_gallery_control ) ) ) {
						return;
					}

					let $product            = $navButton.closest('.wd-product');
					let $productImage       = $product.find('.product-image-link > img, .product-image-link > picture > img');
					let $productImageSource = $product.find('.product-image-link > picture source');
					let $imagesList         = $product.find('.wd-product-grid-slide');
					let index               = $imagesList.hasClass('wd-active') ? $product.find('.wd-product-grid-slide.wd-active').data('image-id') : 0;

					if ( $(this).hasClass('wd-prev') ) {
						index--;
					} else if ( $(this).hasClass('wd-next') ) {
						index++;
					}

					if ( -1 === index ) {
						index = $imagesList.length - 1;
					} else if ( $imagesList.length === index ) {
						index = 0;
					}

					let $currentImage    = $product.find(`.wd-product-grid-slide[data-image-id="${index}"]`);
					let hoverImageUrl    = $currentImage.data('image-url');
					let hoverImageSrcSet = $currentImage.data('image-srcset');

					$imagesList.removeClass('wd-active');
					$currentImage.addClass('wd-active');

					$productImage.attr('src', hoverImageUrl )

					if ( hoverImageSrcSet ) {
						$productImage.attr('srcset', hoverImageSrcSet );
						$productImageSource.attr('srcset', hoverImageSrcSet );
					} else if ( $productImage.attr('srcset' ) ) {
						$productImage.attr('srcset', null);
						$productImageSource.attr('srcset', null);
					}
				});
		}
		function removeGalleryLoopEvents( neededProduct ) {
			$( neededProduct )
				.off( 'mouseover mouseout', '.wd-product-grid-slide' )
				.off( 'click', '.wd-prev, .wd-next' );
		}

		$('.wd-product')
			.each(function ( key, product ) {
				removeGalleryLoopEvents( product );
				addGalleryLoopEvents( product );
			});

		woodmartThemeModule.$document
			.on('wdImagesGalleryInLoopOff', '.wd-product', function( e, neededProduct = this ) {
				removeGalleryLoopEvents( neededProduct );
			})
			.on('wdImagesGalleryInLoopOn', '.wd-product', function( e, neededProduct = this ) {
				addGalleryLoopEvents( neededProduct );
			});
	};

	$(document).ready(function() {
		woodmartThemeModule.imagesGalleryInLoop();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdReplaceMainGalleryNotQuickView wdShowVariationNotQuickView wdResetVariation', function () {
		setTimeout( function() {
			woodmartThemeModule.initZoom();
		}, 300);
	});

	$.each([
		'frontend/element_ready/wd_single_product_gallery.default'
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.initZoom();
		});
	});

	woodmartThemeModule.initZoom = function() {
		var $mainGallery = $('.woocommerce-product-gallery__wrapper:not(.quick-view-gallery)');

		if (woodmart_settings.zoom_enable !== 'yes') {
			return false;
		}

		var zoomOptions = {
			touch: false
		};

		if ('ontouchstart' in window) {
			zoomOptions.on = 'click';
		}

		var $productGallery = $('.woocommerce-product-gallery');
		if ($productGallery.hasClass('thumbs-position-bottom') || $productGallery.hasClass('thumbs-position-left')) {
			document.querySelector('.woocommerce-product-gallery__wrapper:not(.quick-view-gallery)').addEventListener('wdSlideChange', function (e) {
				var $wrapper = $mainGallery.find('.wd-carousel-item').eq(e.target.swiper.activeIndex).find('.woocommerce-product-gallery__image');

				init($wrapper);
			});

			init($mainGallery.find('.wd-carousel-item').eq(0).find('.woocommerce-product-gallery__image'));
		} else {
			$mainGallery.find('.wd-carousel-item').each(function() {
				var $wrapper = $(this).find('.woocommerce-product-gallery__image');

				init($wrapper);
			});
		}

		function init($wrapper) {
			var image = $wrapper.find('img');
			if (image.data('large_image_width') > $wrapper.width() ) {
				$wrapper.trigger('zoom.destroy');
				$wrapper.zoom(zoomOptions);
			}
		}
	};

	$(document).ready(function() {
		woodmartThemeModule.initZoom();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.loginDropdown = function() {
		if (woodmartThemeModule.windowWidth <= 1024) {
			return;
		}

		$('.wd-dropdown-register').each(function() {
			var $this    = $(this),
			    $content = $this.find('.login-dropdown-inner');

			$content.find('input[id="username"]').on('click', function() {
				$this.addClass('wd-active-login').removeClass('wd-active-link');
			});

			$content.find('input[id="username"]').on('input', function() {
				if ($this.hasClass('wd-active-login')) {
					$this.removeClass('wd-active-login').addClass('wd-active-link');
				}
			});

			$content.find('input').not('[id="username"]').on('click', function() {
				$this.removeClass('wd-active-login').removeClass('wd-active-link');
			});

			woodmartThemeModule.$document.click(function(a) {
				if ('undefined' != typeof (a.target.className.length) && a.target.className.indexOf('wd-dropdown-register') === -1 && a.target.className.indexOf('input-text') === -1) {
					$this.removeClass('wd-active-login').removeClass('wd-active-link');
				}
			});

			$('.wd-dropdown-register').on('mouseout', function() {
				if ($this.hasClass('wd-active-link')) {
					$this.removeClass('wd-active-link');
				}
			}).on('mouseleave', function() {
				if ($this.hasClass('wd-active-link')) {
					$this.removeClass('wd-active-link');
				}
			});
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.loginDropdown();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdShopPageInit', function () {
		woodmartThemeModule.loginSidebar();
	});

	woodmartThemeModule.loginSidebar = function() {
		var body = woodmartThemeModule.$body;
		var loginFormSide = $('.login-form-side');
		var closeSide = $('.wd-close-side');

		woodmartThemeModule.$document.on('click', '.login-side-opener', function(e) {
				if (!loginFormSide.length) {
					return
				}

				e.preventDefault();

				if (isOpened()) {
					closeWidget();
				} else {
					setTimeout(function() {
						openWidget();
					}, 10);
				}
			});

		body.on('click touchstart', '.wd-close-side', function() {
			if (isOpened()) {
				closeWidget();
			}
		});

		body.on('click', '.close-side-widget', function(e) {
			e.preventDefault();
			if (isOpened()) {
				closeWidget();
			}
		});

		woodmartThemeModule.$document.on('keyup', function(e) {
			if (e.keyCode === 27 && isOpened()) {
				closeWidget();
			}
		});

		var closeWidget = function() {
			loginFormSide.trigger('wdCloseSide');
			loginFormSide.removeClass('wd-opened');
			closeSide.removeClass('wd-close-side-opened');
		};

		var openWidget = function() {
			loginFormSide.trigger('wdOpenSide');
			loginFormSide.find('form').removeClass('hidden-form');
			loginFormSide.addClass('wd-opened');
			closeSide.addClass('wd-close-side-opened');
		};

		if (loginFormSide.find('.woocommerce-notices-wrapper > ul').length > 0) {
			openWidget();
		}

		var isOpened = function() {
			return loginFormSide.hasClass('wd-opened');
		};
	};

	$(document).ready(function() {
		woodmartThemeModule.loginSidebar();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.loginTabs = function() {
		var tabs               = $('.wd-register-tabs'),
		    btn                = tabs.find('.wd-switch-to-register'),
		    title              = $('.col-register-text h2'),
		    loginText          = tabs.find('.login-info'),
		    classOpened        = 'active-register',
		    loginLabel         = btn.data('login'),
		    registerLabel      = btn.data('register'),
		    loginTitleLabel    = btn.data('login-title'),
		    registerTitleLabel = btn.data('reg-title');

		btn.on('click', function(e) {
			e.preventDefault();

			if (isShown()) {
				hideRegister();
			} else {
				showRegister();
			}

			if (woodmartThemeModule.$window.width() < 769) {
				$('html, body').stop().animate({
					scrollTop: tabs.offset().top - 90
				}, 400);
			}
		});

		var showRegister = function() {
			tabs.addClass(classOpened);
			btn.text(loginLabel);

			if (loginText.length > 0) {
				title.text(loginTitleLabel);
			}
		};

		var hideRegister = function() {
			tabs.removeClass(classOpened);
			btn.text(registerLabel);

			if (loginText.length > 0) {
				title.text(registerTitleLabel);
			}
		};

		var isShown = function() {
			return tabs.hasClass(classOpened);
		};
	};

	$(document).ready(function() {
		woodmartThemeModule.loginTabs();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.miniCartQuantity = function() {
		var timeout;

		woodmartThemeModule.$document.on('change input', '.woocommerce-mini-cart .quantity .qty', function() {
			var input = $(this);
			var qtyVal = input.val();
			var itemID = input.parents('.woocommerce-mini-cart-item').data('key');
			var maxValue = input.attr('max');
			var cart_hash_key = woodmart_settings.cart_hash_key;
			var fragment_name = woodmart_settings.fragment_name;

			clearTimeout(timeout);

			if (parseInt(qtyVal) > parseInt(maxValue)) {
				qtyVal = maxValue;
			}

			timeout = setTimeout(function() {
				input.parents('.mini_cart_item').addClass('wd-loading');

				$.ajax({
					url     : woodmart_settings.ajaxurl,
					data    : {
						action : 'woodmart_update_cart_item',
						item_id: itemID,
						qty    : qtyVal
					},
					success : function(data) {
						if (data && data.fragments) {
							$.each(data.fragments, function(key, value) {
								if ($(key).hasClass('widget_shopping_cart_content')) {
									var dataItemValue = $(value).find('.woocommerce-mini-cart-item[data-key="' + itemID + '"]');
									var dataFooterValue = $(value).find('.shopping-cart-widget-footer');
									var $itemSelector = $(key).find('.woocommerce-mini-cart-item[data-key="' + itemID + '"]');

									if (!data.cart_hash || !dataItemValue.length) {
										$(key).replaceWith(value);
									} else {
										$itemSelector.replaceWith(dataItemValue);
										$('.shopping-cart-widget-footer').replaceWith(dataFooterValue);
									}
								} else {
									$(key.replace('_wd', '')).replaceWith(value);
								}
							});

							if (woodmartThemeModule.supports_html5_storage) {
								sessionStorage.setItem(fragment_name, JSON.stringify(data.fragments));
								localStorage.setItem(cart_hash_key, data.cart_hash);
								sessionStorage.setItem(cart_hash_key, data.cart_hash);

								if (data.cart_hash) {
									sessionStorage.setItem('wc_cart_created', (new Date()).getTime());
								}
							}

							woodmartThemeModule.$body.trigger( 'wc_fragments_refreshed' );
						}
					},
					dataType: 'json',
					method  : 'GET'
				});
			}, 500);
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.miniCartQuantity();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.onRemoveFromCart = function() {
		if ('no' === woodmart_settings.woocommerce_ajax_add_to_cart) {
			return;
		}

		woodmartThemeModule.$document.on('click', '.widget_shopping_cart .remove', function(e) {
			e.preventDefault();
			$(this).parent().addClass('removing-process');
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.onRemoveFromCart();
	});
})(jQuery);

/* global woodmart_settings, woodmartThemeModule, jQuery */
(function($) {
	woodmartThemeModule.product360Button = function() {
		if ('undefined' === typeof $.fn.magnificPopup) {
			return;
		}

		$('.product-360-button a').magnificPopup({
			type           : 'inline',
			mainClass      : 'mfp-fade',
			preloader      : false,
			closeMarkup    : woodmart_settings.close_markup,
			tLoading       : woodmart_settings.loading,
			fixedContentPos: true,
			removalDelay   : 600,
			callbacks      : {
				beforeOpen: function() {
					this.wrap.addClass('wd-product-360-view-wrap');
				},
				open: function() {
					woodmartThemeModule.$window.trigger('resize');
				},
			}
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.product360Button();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdShopPageInit', function () {
		woodmartThemeModule.productFilters();
	});

	$.each([
		'frontend/element_ready/wd_product_filters.default'
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.productFilters();
		});
	});

	woodmartThemeModule.productFilters = function() {
		// Price slider init.
		woodmartThemeModule.$body.on('filter_price_slider_create filter_price_slider_slide', function(event, min, max, minPrice, maxPrice, $slider) {
			if ('undefined' === typeof accounting) {
				return
			}

			var minHtml = accounting.formatMoney(min, {
				symbol   : woocommerce_price_slider_params.currency_format_symbol,
				decimal  : woocommerce_price_slider_params.currency_format_decimal_sep,
				thousand : woocommerce_price_slider_params.currency_format_thousand_sep,
				precision: woocommerce_price_slider_params.currency_format_num_decimals,
				format   : woocommerce_price_slider_params.currency_format
			});

			var maxHtml = accounting.formatMoney(max, {
				symbol   : woocommerce_price_slider_params.currency_format_symbol,
				decimal  : woocommerce_price_slider_params.currency_format_decimal_sep,
				thousand : woocommerce_price_slider_params.currency_format_thousand_sep,
				precision: woocommerce_price_slider_params.currency_format_num_decimals,
				format   : woocommerce_price_slider_params.currency_format
			});

			$slider.siblings('.filter_price_slider_amount').find('span.from').html(minHtml);
			$slider.siblings('.filter_price_slider_amount').find('span.to').html(maxHtml);

			var $results = $slider.parents('.wd-pf-checkboxes').find('.wd-pf-results');
			var value = $results.find('.selected-value');

			if (min === minPrice && max === maxPrice) {
				value.remove();
			} else {
				if (value.length === 0) {
					$results.prepend('<li class="selected-value" data-title="price-filter" data-min="' + minPrice + '" data-max="' + maxPrice + '">' + minHtml + ' - ' + maxHtml + '</li>');
				} else {
					value.html(minHtml + ' - ' + maxHtml);
				}
			}

			woodmartThemeModule.$body.trigger('price_slider_updated', [
				min,
				max
			]);
		});

		$('.wd-pf-price-range .price_slider_widget').each(function() {
			var $this            = $(this);
			var $minInput        = $this.siblings('.filter_price_slider_amount').find('.min_price');
			var $maxInput        = $this.siblings('.filter_price_slider_amount').find('.max_price');
			var minPrice         = parseInt($minInput.data('min'));
			var maxPrice         = parseInt($maxInput.data('max'));
			var currentUrlParams = new URL(window.location.href);
			var currentMinPrice  = parseInt(currentUrlParams.searchParams.has('min_price') ? currentUrlParams.searchParams.get('min_price') : $minInput.val());
			var currentMaxPrice  = parseInt(currentUrlParams.searchParams.has('max_price') ? currentUrlParams.searchParams.get('max_price') : $maxInput.val());

			$('.price_slider_widget, .price_label').show();

			if (isNaN(currentMinPrice)) {
				currentMinPrice = minPrice;
			}

			if (isNaN(currentMaxPrice)) {
				currentMaxPrice = maxPrice;
			}

			$this.slider({
				range  : true,
				animate: true,
				min    : minPrice,
				max    : maxPrice,
				values : [
					currentMinPrice,
					currentMaxPrice
				],
				create : function() {
					if (currentMinPrice === minPrice && currentMaxPrice === maxPrice) {
						$minInput.val('');
						$maxInput.val('');
					}

					woodmartThemeModule.$body.trigger('filter_price_slider_create', [
						currentMinPrice,
						currentMaxPrice,
						minPrice,
						maxPrice,
						$this
					]);

					$this.closest('.wd-pf-price-range').on('click', '.wd-pf-results li', function(e) {
						var $selectedValueNode = $(this);
						var $filter            = $selectedValueNode.closest('.wd-pf-checkboxes');
						var $activeFilterLink  = $filter.find('.pf-value');

						$filter.find('.min_price').val('');
						$filter.find('.max_price').val('');

						$filter.find('.price_slider_widget').slider('values', [$filter.find('.min_price').data('min'), $filter.find('.max_price').data('max') ]);

						$selectedValueNode.remove();

						if ( 0 === $activeFilterLink.length ) {
							return;
						}

						var url = new URL($activeFilterLink.attr('href'));

						url.searchParams.delete('min_price');
						url.searchParams.delete('max_price');

						$activeFilterLink.attr('href', url.href);

						if ($activeFilterLink) {
							$activeFilterLink.trigger('click');
						}
					});
				},
				slide  : function(event, ui) {
					if (ui.values[0] === minPrice && ui.values[1] === maxPrice) {
						$minInput.val('');
						$maxInput.val('');
					} else {
						$minInput.val(ui.values[0]);
						$maxInput.val(ui.values[1]);
					}

					woodmartThemeModule.$body.trigger('filter_price_slider_slide', [
						ui.values[0],
						ui.values[1],
						minPrice,
						maxPrice,
						$this
					]);
				},
				change : function(event, ui) {
					woodmartThemeModule.$body.trigger('price_slider_change', [
						ui.values[0],
						ui.values[1]
					]);
				}
			});
		});

		var $forms = $('form.wd-product-filters');

		var removeValue = function($mainInput, currentVal) {
			if ($mainInput.length === 0) {
				return;
			}

			var mainInputVal = $mainInput.val();

			if (mainInputVal.indexOf(',') > 0) {
				$mainInput.val(mainInputVal.replace(',' + currentVal, '').replace(currentVal + ',', ''));
			} else {
				$mainInput.val(mainInputVal.replace(currentVal, ''));
			}
		}

		var defaultPjaxArgs = {
			container     : '.wd-page-content',
			timeout       : woodmart_settings.pjax_timeout,
			scrollTo      : false,
			renderCallback: function(context, html, afterRender) {
				woodmartThemeModule.removeDuplicatedStylesFromHTML(html, function(html) {
					context.html(html);
					afterRender();
					woodmartThemeModule.$document.trigger('wdShopPageInit');
					woodmartThemeModule.$document.trigger('wood-images-loaded');
				});
			},
		};

		$forms.each(function(index, $form) {
			$form                 = $($form);
			var $mainSubmitButton = $form.find('.wd-pf-btn button, .wp-block-wd-button');
			var $checkboxes       = $form.find('.wd-pf-checkboxes');

			//Label clear.
			$form.on('click', '.wd-pf-results li', function(e) {
				var $selectedValueNode = $(this);
				var selectedValue      = $selectedValueNode.data('title');
				var $filter            = $selectedValueNode.closest('.wd-pf-checkboxes');
				var $activeFilterLink  = $filter.find(`.pf-value[data-val="${selectedValue}"]`);

				if ( $filter.hasClass('wd-pf-price-range') ) {
					return;
				}

				if ( 0 === $mainSubmitButton.length ) {
					$activeFilterLink.trigger('click');
				} else {
					var $mainInput = $filter.find('.result-input');

					if ( $filter.hasClass('wd-pf-categories') ) {
						$filter.closest('form.wd-product-filters').attr('action', woodmart_settings.shop_url);
					}

					removeValue($mainInput, selectedValue);
					$activeFilterLink.closest('li').removeClass('wd-active');
					$selectedValueNode.remove();
				}
			});

			// Show dropdown on "click".
			$checkboxes.each(function() {
				var $this       = $(this);
				var $btn        = $this.find('.wd-pf-title');
				var multiSelect = $this.hasClass('multi_select');

				$btn.on('click keyup', function(e) {
					if (e.type === 'keyup' && e.keyCode !== 13) {
						return;
					}

					var target = e.target;
	
					if ($(target).is($btn.find('.selected-value'))) {
						return;
					}
	
					if (!$this.hasClass('wd-opened')) {
						$this.addClass('wd-opened');
						setTimeout(function() {
							woodmartThemeModule.$document.trigger('wdProductFiltersOpened');
						}, 300);
					} else {
						close();
					}
				});
	
				woodmartThemeModule.$document.on('click', function(e) {
					var target = e.target;
	
					if ($this.hasClass('wd-opened') && (multiSelect && !$(target).is($this) && !$(target).parents().is($this)) || (!multiSelect && !$(target).is($btn) && !$(target).parents().is($btn))) {
						close();
					}
				});
	
				var close = function() {
					$this.removeClass('wd-opened');
				};
			});

			if ( 0 === $mainSubmitButton.length ) {
				// Submit form on "Dropdown select".
				$form.on('click', '.wd-pf-checkboxes li > .pf-value, .filter_price_slider_amount .pf-value', function(e) {
					var $priceAmount = $form.find('.filter_price_slider_amount');

					if ( $priceAmount.length > 0 ) {
						var $priceButton = $priceAmount.find('.pf-value');
						var $minInput    = $priceButton.siblings('.min_price');
						var $maxInput    = $priceButton.siblings('.max_price');
						var $link        = $priceButton.attr('href');
						var url          = new URL($link);

						if ($minInput.length && $maxInput.length) {
							if ($minInput.val()) {
								url.searchParams.set($minInput.attr('name'), $minInput.val());
							} else {
								url.searchParams.delete($minInput.attr('name'));
							}

							if ($maxInput.val()) {
								url.searchParams.set($maxInput.attr('name'), $maxInput.val());
							} else {
								url.searchParams.delete($maxInput.attr('name'));
							}

							$priceButton.attr('href', url.href);
						}

						$minInput.val('');
						$maxInput.val('');
					}

					// Send pjax.
					if ( '1' === woodmart_settings.ajax_shop && 'undefined' !== typeof ($.fn.pjax) ) {
						$.pjax.click(e, defaultPjaxArgs);
					}
				});
			} else {
				// Submit form on "Button click".
				$form.on('click', '.wd-pf-checkboxes li > .pf-value', function(e) {
					e.preventDefault();

					var $dataInput = $(this);
					var $thisForm  = $dataInput.closest('form.wd-product-filters');
					var $li        = $dataInput.parent();
					var $widget    = $dataInput.parents('.wd-pf-checkboxes');
					var $mainInput = $widget.find('.result-input');
					var $results   = $widget.find('.wd-pf-results');

					var multiSelect  = $widget.hasClass('multi_select');
					var mainInputVal = $mainInput.val();
					var currentText  = $dataInput.data('title');
					var currentVal   = $dataInput.data('val');

					if (multiSelect) {
						if (!$li.hasClass('wd-active')) {
							if (mainInputVal === '') {
								$mainInput.val(currentVal);
							} else {
								$mainInput.val(mainInputVal + ',' + currentVal);
							}

							$results.prepend('<li class="selected-value" data-title="' + currentVal + '">' + currentText + '</li>');
							$li.addClass('wd-active');
						} else {
							removeValue($mainInput, currentVal);
							$results.find('li[data-title="' + currentVal + '"]').remove();
							$li.removeClass('wd-active');
						}
					} else {
						if (!$li.hasClass('wd-active')) {
							$mainInput.val(currentVal);
							$results.find('.selected-value').remove();
							$results.prepend('<li class="selected-value" data-title="' + currentVal + '">' + currentText + '</li>');
							$li.parents('.wd-scroll-content').find('.wd-active').removeClass('wd-active');
							$li.addClass('wd-active');
						} else {
							$mainInput.val('');
							$results.find('.selected-value').remove();
							$li.removeClass('wd-active');
						}
					}

					if ( $widget.hasClass('wd-pf-categories') ) {
						var url  = new URL($dataInput.attr('href'));
						var link = woodmart_settings.shop_url;

						if ( $li.hasClass('wd-active') ) {
							var link = url.origin + url.pathname;
						}

						$thisForm.attr('action', link);
					}
				});

				// Send pjax.
				if ( '1' === woodmart_settings.ajax_shop  && 'undefined' !== typeof ($.fn.pjax) ) {
					$(document)
						.off('submit', 'form.wd-product-filters')
						.on('submit', 'form.wd-product-filters', function(e) {
							e.preventDefault();
							$form = $(this);

							defaultPjaxArgs.url  = $form.attr('action');
							defaultPjaxArgs.data = $form.find(':input[value!=""]').serialize();
		
							$.pjax(defaultPjaxArgs);
						});
				} else {
					$(document)
						.off('submit', 'form.wd-product-filters')
						.on('submit', 'form.wd-product-filters', function(e) {
							$(':input', this).each(function() {
								this.disabled = !($(this).val());
							});
						});
				}
			}
		});

		woodmartThemeModule.$document.on('click', '.wd-product-filters > a.btn', function(e) {
			e.preventDefault();

			$(this).parent('form').trigger('submit');
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.productFilters();
	});
})(jQuery);
/* global woodmartConfig, woodmartThemeModule, woodmart_settings */
(function($) {
	'use strict';
	woodmartThemeModule.$document.on('wdReplaceMainGallery', function() {
		woodmartThemeModule.productVideoGallery();
	});

	$.each([
		'frontend/element_ready/wd_single_product_gallery.default'
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.productVideoGallery();
		});
	});

	woodmartThemeModule.productVideoGallery = function() {
		var $mainGallery = $('.woocommerce-product-gallery__wrapper:not(.quick-view-gallery)');
		var $mainGalleryWrapper = $mainGallery.parents('.woocommerce-product-gallery');
		var $variation_form = $('.variations_form');

		woodmartThemeModule.$document.on('click', '.wd-carousel-item.wd-with-video .wd-play-video', function (e) {
			e.preventDefault();

			var $button  = $(this);
			var $wrapper = $button.parents('.wd-carousel-item');
			var $video   = $wrapper.find('iframe');

			if ( ! $video.length ) {
				$video = $wrapper.find('video');
			}

			if ( $wrapper.hasClass('wd-inited') || ! $video.length ) {
				return;
			}

			var videoScr = $video.attr('src');

			if ( ! videoScr ) {
				videoScr = $video.data('lazy-load');
				$video.attr('src', videoScr);
			}

			if ( ! videoScr ) {
				return;
			}

			if ( ! $wrapper.hasClass('wd-video-playing') ) {
				$wrapper.addClass('wd-loading');
			}

			videoInited( videoScr, $wrapper );
		});

		woodmartThemeModule.$document.on('wdPhotoSwipeBeforeInited', function( event, gallery ) {
			gallery.listen('initialLayout', function() {
				if ( 'undefined' === typeof gallery.items || ! gallery.items ) {
					return;
				}

				$.each( gallery.items, function ( key, item ) {
					if ( 'undefined' !== typeof item.mainElement && item.mainElement.hasClass('wd-video-playing') && item.mainElement.hasClass('wd-inited') ) {
						item.mainElement.find('.wd-play-video').trigger('click');
					}
				});
			});

			gallery.listen('close', function() {
				if ( 'undefined' === typeof gallery.currItem.container ) {
					return;
				}

				var $container = $(gallery.currItem.container).parents('.pswp__container');

				$container.find('.pswp__item').each(function () {
					var $video = $(this).find('.wd-with-video.wd-video-playing');

					if ($video.length) {
						$video.find('.wd-play-video').trigger('click');
					}
				});
			});
		});

		if ( $mainGallery.find('.wd-carousel-item.wd-with-video').length ) {
			document.querySelector('.woocommerce-product-gallery__wrapper:not(.quick-view-gallery)').addEventListener('wdSlideChange', function (e) {
				var activeSlide = e.target.swiper.slides[e.target.swiper.activeIndex];

				if ( activeSlide.classList.contains('wd-overlay-hidden') && ( activeSlide.classList.contains('wd-video-playing') || activeSlide.classList.contains('wd-video-design-native') && activeSlide.classList.contains('wd-video-hide-thumb') ) ) {
					visibleOverlayProductInfo( 'hide' );
				} else if ( $mainGalleryWrapper.hasClass('wd-hide-overlay-info') && ( ! activeSlide.classList.contains('wd-overlay-hidden') || ! activeSlide.classList.contains('wd-video-playing') ) ) {
					visibleOverlayProductInfo( 'show' );
				}
			});
		}

		if ( $variation_form.length ) {
			$variation_form.on('show_variation', function(e, variation) {
				$mainGallery.find('.wd-carousel-item.wd-video-playing').each( function () {
					var $imageWrapper = $(this);

					if ( $imageWrapper.find('.wp-post-image').length || $imageWrapper.hasClass('wd-inited') ) {
						$imageWrapper.find('.wd-play-video').trigger('click');
					}
				});
			});
		}

		function videoInited( videoScr, $wrapper ) {
			$wrapper.addClass('wd-inited');

			if (videoScr.indexOf('vimeo.com') + 1) {
				if ('undefined' === typeof Vimeo || 'undefined' === typeof Vimeo.Player) {
					var interval;
					$.getScript(woodmart_settings.vimeo_library_url, function() {
						interval = setInterval(function() {
							if ('undefined' !== typeof Vimeo) {
								clearInterval( interval );
								vimeoVideoControls( $wrapper );
							}
						}, 100);
					});
				} else {
					vimeoVideoControls($wrapper);
				}
			} else if (videoScr.indexOf('youtube.com') + 1) {
				if ('undefined' === typeof YT || 'undefined' === typeof YT.Player) {
					var interval;

					if ( $wrapper.hasClass('wd-video-playing') ) {
						$wrapper.find('.wd-video-actions').addClass('wd-loading');
					}

					$.getScript('https://www.youtube.com/player_api', function() {
						interval = setInterval(function() {
							if ('undefined' !== typeof YT.Player) {
								clearInterval( interval );
								youtubeVideoControls($wrapper);

								$wrapper.find('.wd-video-actions').removeClass('wd-loading');
							}
						}, 100);
					});
				} else {
					youtubeVideoControls( $wrapper );
				}
			} else {
				hostedVideoControls( $wrapper );
			}
		}

		function youtubeVideoControls( $wrapper ) {
			var $video    = $wrapper.find('iframe');
			var $playBtn  = $wrapper.find('.wd-play-video');
			var prevState;

			var player = new YT.Player($video[0], {
				events: {
					'onReady': onPlayerReady,
					'onStateChange': onPlayerStateChange
				}
			});

			function onPlayerStateChange( event ) {
				if ( $wrapper.hasClass('wd-overlay-hidden') ) {
					if ( event.data === YT.PlayerState.PLAYING ) {
						visibleOverlayProductInfo( 'hide' );
					} else if ( event.data === YT.PlayerState.PAUSED && ! $wrapper.hasClass('wd-video-design-native') ) {
						visibleOverlayProductInfo( 'show' );
					}
				}

				prevState = event.data;
			}

			function onPlayerReady() {
				if ( $wrapper.hasClass('wd-video-muted') ) {
					player.mute();
				} else {
					player.unMute();
				}

				player.setLoop(true);
				$wrapper.removeClass('wd-loading');

				if ( ! $wrapper.hasClass('wd-video-playing') || woodmartThemeModule.$window.width() <= 768 && $video.attr('src').indexOf('autoplay=1') && $video.attr('src').indexOf('mute=1') ) {
					$wrapper.addClass('wd-video-playing');
					player.playVideo();
				} else {
					$wrapper.removeClass('wd-video-playing');
					player.pauseVideo();
				}
			}

			$playBtn.on('click', function() {
				if ( prevState === YT.PlayerState.UNSTARTED ) {
					if ( 'function' === typeof player.playVideo ) {
						player.playVideo();
					}

					return;
				}

				if ( $wrapper.hasClass('wd-video-playing') ) {
					$wrapper.removeClass('wd-video-playing');

					if ( 'function' === typeof player.pauseVideo ) {
						player.pauseVideo();
					}
				} else {
					$wrapper.addClass('wd-video-playing');

					if ( 'function' === typeof player.playVideo ) {
						player.playVideo();
					}
				}
			});
		}

		function vimeoVideoControls( $wrapper ) {
			var $video    = $wrapper.find('iframe');
			var $playBtn  = $wrapper.find('.wd-play-video');
			var player    = new Vimeo.Player( $video );

			player.setLoop(true);

			if ( $wrapper.hasClass('wd-video-muted') ) {
				player.setVolume(0);
			} else {
				player.setVolume(1);
			}

			player.on('timeupdate', function() {
				if ( $wrapper.hasClass('wd-loading') ) {
					$wrapper.addClass('wd-video-playing');
					$wrapper.removeClass('wd-loading');

					if ( $wrapper.hasClass('wd-overlay-hidden') ) {
						visibleOverlayProductInfo( 'hide' );
					}
				}
			});

			if ( ! $wrapper.hasClass('wd-video-design-native') && $wrapper.hasClass('wd-overlay-hidden') ) {
				player.on('pause', function() {
					visibleOverlayProductInfo( 'show' );
				});
			}

			if ( $wrapper.hasClass('wd-video-playing') ) {
				player.pause();
				$wrapper.removeClass('wd-video-playing');
			} else {
				player.play();
			}

			if ( $wrapper.hasClass('wd-loaded') ) {
				$wrapper.addClass('wd-video-playing');
				$wrapper.removeClass('wd-loading');

				if ( $wrapper.hasClass('wd-overlay-hidden') ) {
					visibleOverlayProductInfo( 'hide' );
				}

				$wrapper.removeClass('wd-loaded');
			}

			$playBtn.on('click', function() {
				if ( $wrapper.hasClass('wd-video-playing') ) {
					$wrapper.removeClass('wd-video-playing');
					player.pause();
				} else {
					$wrapper.addClass('wd-video-playing');
					player.play();
				}
			});
		}

		function hostedVideoControls( $wrapper ) {
			var $video    = $wrapper.find('video');
			var $playBtn  = $wrapper.find('.wd-play-video');

			$video.on('loadedmetadata', function () {
				$wrapper.removeClass('wd-loading');
				$video[0].play();
				$wrapper.addClass('wd-video-playing');
			});

			if ( $wrapper.hasClass('wd-overlay-hidden') ) {
				$video.on('play', function () {
					visibleOverlayProductInfo( 'hide' );
				});

				if ( ! $wrapper.hasClass('wd-video-design-native') ) {
					$video.on('pause', function () {
						visibleOverlayProductInfo( 'show' );
					});
				}
			}

			if ( $wrapper.hasClass('wd-video-muted') ) {
				$video.prop('muted', true);
			} else {
				$video.prop('muted', false);
			}

			if ( $wrapper.hasClass('wd-video-playing') ) {
				$video[0].pause();
				$wrapper.removeClass('wd-video-playing');
			} else if ( $wrapper.hasClass('wd-loaded') ) {
				$wrapper.removeClass('wd-loading');
				$video[0].play();
				$wrapper.addClass('wd-video-playing');
			}

			$playBtn.on('click', function() {
				if ( $wrapper.hasClass('wd-video-playing') ) {
					$video[0].pause();
					$wrapper.removeClass('wd-video-playing');
				} else {
					$wrapper.addClass('wd-video-playing');
					$video[0].play();
				}
			});
		}

		function visibleOverlayProductInfo( event ) {
			if ( ! $mainGallery.hasClass('wd-carousel') ) {
				return;
			}

			if ( 'hide' === event ) {
				$mainGalleryWrapper.addClass('wd-hide-overlay-info');
			} else if ( 'show' === event ) {
				$mainGalleryWrapper.removeClass('wd-hide-overlay-info');
			}
		}
	};

	$(document).ready(function() {
		woodmartThemeModule.productVideoGallery();
	});
})(jQuery);

window.addEventListener('load',function() {
	if ( (document.querySelector("script[src*='googletagmanager.com']") || document.querySelector('#www-widgetapi-script') ) && document.querySelector('.woocommerce-product-gallery .wd-carousel-item.wd-with-video') ) {
		const tag = document.createElement( 'script' );
		tag.src = '//www.youtube.com/iframe_api';

		const firstScriptTag = document.getElementsByTagName( 'script' )[0];
		firstScriptTag.parentNode.insertBefore( tag, firstScriptTag );
	}
});

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdShopPageInit wdUpdateWishlist wdArrowsLoadProducts wdLoadMoreLoadProducts wdProductsTabsLoaded wdSearchFullScreenContentLoaded wdArrowsLoadProducts wdBackHistory wdRecentlyViewedProductLoaded', function() {
		woodmartThemeModule.productHover();
	});

	woodmartThemeModule.wcTabsHoverFix = function() {
		$('.wc-tabs > li').on('click', function() {
			woodmartThemeModule.productHover();
		});
	};

	woodmartThemeModule.$document.on('wdProductMoreDescriptionOpen', function(event, $product) {
		woodmartThemeModule.productHoverRecalc($product);
	});

	$.each([
		'frontend/element_ready/wd_products.default',
		'frontend/element_ready/wd_products_tabs.default'
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.productHover();
		});
	});

	woodmartThemeModule.productHoverRecalc = function($el) {
		if ($el.hasClass('wd-fade-off')) {
			return;
		}

		var heightHideInfo = $el.find('.fade-in-block').outerHeight();

		$el.find('.content-product-imagin').css({
			marginBottom: -heightHideInfo
		});

		$el.addClass('hover-ready');
	};

	woodmartThemeModule.productHover = function() {
		var $hoverBase = $('.wd-hover-with-fade');
		var $carousel  = $hoverBase.closest('.wd-carousel');

		if (woodmartThemeModule.windowWidth <= 1024) {
			if ( $carousel.length > 0 && $hoverBase.hasClass('wd-hover-fw-button')) {
				$hoverBase.addClass('wd-fade-off');
			}

			$hoverBase.on('click', function(e) {
				var $this = $(this);
				var hoverClass = 'state-hover';
				if (!$this.hasClass(hoverClass) && !$this.hasClass('wd-fade-off') && woodmart_settings.base_hover_mobile_click === 'no') {
					e.preventDefault();
					$('.' + hoverClass).removeClass(hoverClass);
					$this.addClass(hoverClass);
				}
			});

			woodmartThemeModule.$document.on('click touchstart', function(e) {
				if ($(e.target).closest('.state-hover').length === 0) {
					$('.state-hover').removeClass('state-hover');
				}
			});
		}

		$hoverBase.on('mouseenter mousemove touchstart', function() {
			var $product = $(this);
			var $content = $product.find('.wd-more-desc');

			if ($content.hasClass('wd-height-calculated')) {
				return;
			}

			$product.imagesLoaded(function() {
				woodmartThemeModule.productHoverRecalc($product);
			});

			$content.addClass('wd-height-calculated');
		});

		function productHolderWidth($holder) {
			if ($holder.data('column_width')) {
				return;
			}

			var holderWidth = $holder.outerWidth();
			var columns = $holder.data('columns');
			var columnWidth = holderWidth / columns;

			$holder.data('column_width', columnWidth);
		}

		$('.wd-products').on('mouseenter mousemove touchstart', function() {
			productHolderWidth($(this));
		});

		$hoverBase.on('mouseenter mousemove touchstart', function() {
			if (!woodmart_settings.hover_width_small) {
				return;
			}

			var $this = $(this);

			if ($this.hasClass('wd-hover-fw-button')) {
				return;
			}

			productHolderWidth($this.parent('.wd-products'));

			var columnWidth = $this.parent('.wd-products').data('column_width');

			if (!columnWidth) {
				return;
			}

			if (255 > columnWidth || woodmartThemeModule.windowWidth <= 1024) {
				$this.find('.wd-add-btn').parent().addClass('wd-add-small-btn');
				$this.find('.wd-add-btn').removeClass('wd-add-btn-replace').addClass('wd-action-btn wd-style-icon wd-add-cart-icon');
			} else if (woodmartThemeModule.$body.hasClass('catalog-mode-on') || woodmartThemeModule.$body.hasClass('login-see-prices')) {
				$this.find('.wd-bottom-actions .wd-action-btn').removeClass('wd-style-icon').addClass('wd-style-text');
			}

			woodmartThemeModule.$document.trigger('wdProductBaseHoverIconsResize');
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.productHover();
		woodmartThemeModule.wcTabsHoverFix();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.productImages = function() {
		var currentImage,
		    $productGallery   = $('.woocommerce-product-gallery'),
		    $mainImages       = $('.woocommerce-product-gallery__wrapper'),
		    PhotoSwipeTrigger = '.wd-show-product-gallery-wrap > a';

		if ($productGallery.hasClass('image-action-popup')) {
			PhotoSwipeTrigger += ', .woocommerce-product-gallery__image > a';
		}

		$productGallery.on('click', '.woocommerce-product-gallery__image > a', function(e) {
			e.preventDefault();
		});

		$productGallery.on('click', PhotoSwipeTrigger, function(e) {
			e.preventDefault();

			var $this = $(this);

			currentImage = $this.attr('href');

			var items = getProductItems();

			woodmartThemeModule.callPhotoSwipe(getCurrentGalleryIndex(e), items);
		});

		var getCurrentGalleryIndex = function(e) {
			var index = 0;
			var $currentTarget = $(e.currentTarget);

			if ( $currentTarget.parents('.wd-carousel-item').length ) {
				index = $currentTarget.parents('.wd-carousel-item').index();
			} else if ( $currentTarget.hasClass( 'woodmart-show-product-gallery' ) ) {
				var wrapperGallery = $currentTarget.parents('.woocommerce-product-gallery');

				if ( wrapperGallery.hasClass('thumbs-position-left') || wrapperGallery.hasClass('thumbs-position-bottom') || wrapperGallery.hasClass('thumbs-position-without') ) {
					index = $currentTarget.parents('.wd-gallery-images').find('.wd-carousel-item.wd-active').index();
				}
			}

			return index;
		};

		var getProductItems = function() {
			var items = [];

			$mainImages.find('figure a img').each(function() {
				var $this = $(this);
				var src     = $this.attr('data-large_image'),
				    width   = $this.attr('data-large_image_width'),
				    height  = $this.attr('data-large_image_height'),
				    caption = $this.attr('data-caption');

				if ( $this.parents('.wd-carousel-item.wd-with-video').length ) {
					var videoContent = $this.parents('.wd-with-video')[0].outerHTML;

					if ( -1 !== videoContent.indexOf('wd-inited') ) {
						videoContent = videoContent.replace('wd-inited', 'wd-loaded').replace('wd-video-playing', '');
					}

					items.push({
						html       : videoContent,
						mainElement: $this.parents('.wd-with-video'),
					});
				} else {
					items.push({
						src  : src,
						w    : width,
						h    : height,
						title: (woodmart_settings.product_images_captions === 'yes') ? caption : false
					});
				}
			});

			return items;
		};
	};

	$(document).ready(function() {
		woodmartThemeModule.productImages();
	});
})(jQuery);

/* global woodmart_settings */
woodmartThemeModule.$document.on('wdReplaceMainGallery', function() {
	woodmartThemeModule.productImagesGallery( true );
});

[
	'frontend/element_ready/wd_single_product_gallery.default'
].forEach( function (value) {
	woodmartThemeModule.wdElementorAddAction(value, function($wrapper) {
		woodmartThemeModule.productImagesGallery();

		$wrapper.find('.woocommerce-product-gallery').css('opacity', '1');
	});
});

woodmartThemeModule.productImagesGallery = function( replaceGallery = false) {
	document.querySelectorAll('.woocommerce-product-gallery').forEach( function (galleryWrapper) {
		var galleryContainer = galleryWrapper.querySelector('.wd-carousel-container');
		var gallery = galleryWrapper.querySelector('.woocommerce-product-gallery__wrapper:not(.quick-view-gallery)');
		var thumbnails = galleryWrapper.querySelector('.wd-gallery-thumb .wd-carousel');

		if (!gallery) {
			return;
		}

		var galleryStyle = window.getComputedStyle(gallery);

		var galleryDesktop = galleryStyle.getPropertyValue('--wd-col-lg') ? galleryStyle.getPropertyValue('--wd-col-lg') : galleryStyle.getPropertyValue('--wd-col');
		var galleryTablet = galleryStyle.getPropertyValue('--wd-col-md') ? galleryStyle.getPropertyValue('--wd-col-md') : galleryStyle.getPropertyValue('--wd-col');
		var galleryMobile = galleryStyle.getPropertyValue('--wd-col-sm') ? galleryStyle.getPropertyValue('--wd-col-sm') : galleryStyle.getPropertyValue('--wd-col');

		var mainCarouselArg = {
			slidesPerView         : galleryDesktop,
			loop                  : woodmart_settings.product_slider_autoplay,
			centeredSlides        : 'yes' === gallery.dataset.center_mode,
			autoHeight            : woodmart_settings.product_slider_auto_height === 'yes',
			grabCursor            : true,
			a11y                  : {
				enabled: true,
				prevSlideMessage: woodmart_settings.swiper_prev_slide_msg,
				nextSlideMessage: woodmart_settings.swiper_next_slide_msg,
				firstSlideMessage: woodmart_settings.swiper_first_slide_msg,
				lastSlideMessage: woodmart_settings.swiper_last_slide_msg,
				paginationBulletMessage: woodmart_settings.swiper_pagination_bullet_msg,
				slideLabelMessage: woodmart_settings.swiper_slide_label_msg,
			},
			breakpoints           : {
				1025: {
					slidesPerView: galleryDesktop,
					initialSlide : 'yes' === gallery.dataset.center_mode && galleryDesktop ? 1 : 0
				},
				768.98: {
					slidesPerView: galleryTablet,
					initialSlide : 'yes' === gallery.dataset.center_mode && galleryTablet ? 1 : 0
				},
				0: {
					slidesPerView: galleryMobile,
					initialSlide : 'yes' === gallery.dataset.center_mode && galleryMobile ? 1 : 0
				}
			},
			slideClass            : 'wd-carousel-item',
			slideActiveClass      : 'wd-active',
			slideVisibleClass     : 'wd-slide-visible',
			slideNextClass        : 'wd-slide-next',
			slidePrevClass        : 'wd-slide-prev',
			slideFullyVisibleClass: 'wd-full-visible',
			slideBlankClass       : 'wd-slide-blank',
			lazyPreloaderClass    : 'wd-lazy-preloader',
			containerModifierClass: 'wd-',
			wrapperClass          : 'wd-carousel-wrap',
			on                    : {
				slideChange: function() {
					gallery.dispatchEvent(new CustomEvent('wdSlideChange', { activeIndex: this.activeIndex}));

					woodmartThemeModule.$document.trigger('wood-images-loaded');
				}
			}
		};

		if ( gallery.parentElement.querySelector('.wd-btn-arrow.wd-next') ) {
			mainCarouselArg.navigation = {
				nextEl       : gallery.parentElement.querySelector('.wd-btn-arrow.wd-next'),
				prevEl       : gallery.parentElement.querySelector('.wd-btn-arrow.wd-prev'),
				disabledClass: 'wd-disabled',
				lockClass    : 'wd-lock',
				hiddenClass  : 'wd-hide'
			};
		}

		if (woodmart_settings.product_slider_autoplay) {
			mainCarouselArg.autoplay = {
				delay: 3000,
				pauseOnMouseEnter: true
			};
		}

		if (galleryWrapper.querySelector('.wd-nav-pagin')) {
			mainCarouselArg.pagination = {
				el                     : galleryWrapper.querySelector('.wd-nav-pagin'),
				dynamicBullets         : galleryWrapper.querySelector('.wd-nav-pagin-wrap').classList.contains('wd-dynamic'),
				type                   : 'bullets',
				clickable              : true,
				bulletClass            : 'wd-nav-pagin-item',
				bulletActiveClass      : 'wd-active',
				modifierClass          : 'wd-type-',
				lockClass              : 'wd-lock',
				currentClass           : 'wd-current',
				totalClass             : 'wd-total',
				hiddenClass            : 'wd-hidden',
				clickableClass         : 'wd-clickable',
				horizontalClass        : 'wd-horizontal',
				verticalClass          : 'wd-vertical',
				paginationDisabledClass: 'wd-disabled',
				renderBullet           : function(index, className) {
					var innerContent = '';
					var label = woodmart_settings.swiper_pagination_bullet_msg.replace('{{index}}', index + 1);

					if (galleryWrapper.querySelector('.wd-nav-pagin-wrap').classList.contains('wd-style-number-2')) {
						innerContent = index + 1;

						if ( 9 >= innerContent ) {
							innerContent = '0' + innerContent;
						}
					}

					return '<li class="' + className + '" tabindex="0" role="option" aria-label="' + label + '"><span>' + innerContent + '</span></li>';
				}
			};
		}

		if ( thumbnails ) {
			var thumbnailsWrapper = galleryWrapper.querySelector('.wd-gallery-thumb');
			var thumbnailsDirection = galleryWrapper.classList.contains('thumbs-position-left') && ( woodmartThemeModule.$body.width() > 1024 || ! galleryWrapper.classList.contains('wd-thumbs-wrap') ) ? 'vertical' : 'horizontal';

			if (thumbnails.children.length) {
				if ( replaceGallery ) {
					createThumbnails();
				}

				if ( 'vertical' === thumbnailsDirection && ! window.getComputedStyle(galleryWrapper).getPropertyValue('--wd-thumbs-height') && thumbnailsWrapper.offsetHeight ) {
					galleryWrapper.style.setProperty('--wd-thumbs-height', thumbnailsWrapper.offsetHeight + 'px');
				}

				var thumbnailsStyle = window.getComputedStyle(thumbnails);

				var thumbnDesktop = thumbnailsStyle.getPropertyValue('--wd-col-lg') ? thumbnailsStyle.getPropertyValue('--wd-col-lg') : 2;
				var thumbnTablet = thumbnailsStyle.getPropertyValue('--wd-col-md') ? thumbnailsStyle.getPropertyValue('--wd-col-md') : 2;
				var thumbnMobile = thumbnailsStyle.getPropertyValue('--wd-col-sm') ? thumbnailsStyle.getPropertyValue('--wd-col-sm') : 2;

				mainCarouselArg.thumbs = {
					swiper: {
						el                    : thumbnails,
						slidesPerView         : thumbnDesktop,
						direction             : thumbnailsDirection,
						autoHeight            : 'horizontal' === thumbnailsDirection && woodmart_settings.product_slider_auto_height === 'yes',
						id                    : 'wd-carousel-thumbnails',
						slideClass            : 'wd-carousel-item',
						slideActiveClass      : 'wd-active',
						slideVisibleClass     : 'wd-slide-visible',
						slideNextClass        : 'wd-slide-next',
						slidePrevClass        : 'wd-slide-prev',
						slideFullyVisibleClass: 'wd-full-visible',
						slideBlankClass       : 'wd-slide-blank',
						lazyPreloaderClass    : 'wd-lazy-preloader',
						containerModifierClass: 'wd-',
						wrapperClass          : 'wd-carousel-wrap',
						grabCursor            : true,
						a11y                  : {
							enabled: true,
							prevSlideMessage: woodmart_settings.swiper_prev_slide_msg,
							nextSlideMessage: woodmart_settings.swiper_next_slide_msg,
							firstSlideMessage: woodmart_settings.swiper_first_slide_msg,
							lastSlideMessage: woodmart_settings.swiper_last_slide_msg,
							paginationBulletMessage: woodmart_settings.swiper_pagination_bullet_msg,
							slideLabelMessage: woodmart_settings.swiper_slide_label_msg,
						},
						breakpoints           : {
							1025 : {
								slidesPerView: thumbnDesktop
							},
							768.98 : {
								slidesPerView: thumbnTablet
							},
							0   : {
								slidesPerView: thumbnMobile
							}
						},
						navigation            : {
							nextEl       : thumbnails.nextElementSibling.querySelector('.wd-btn-arrow.wd-next'),
							prevEl       : thumbnails.nextElementSibling.querySelector('.wd-btn-arrow.wd-prev'),
							disabledClass: 'wd-disabled',
							lockClass    : 'wd-lock',
							hiddenClass  : 'wd-hide'
						},
						on               : {
							slideChange: function() {
								woodmartThemeModule.$document.trigger('wood-images-loaded');
							},
							resize: function (swiper) {
								if (galleryWrapper.classList.contains('thumbs-position-left') && galleryWrapper.classList.contains('wd-thumbs-wrap')) {
									if ( swiper.currentBreakpoint > 1024 && ! swiper.isVertical() ) {
										swiper.changeDirection('vertical');
									} else if (swiper.currentBreakpoint <= 1024 && ! swiper.isHorizontal() ){
										swiper.changeDirection('horizontal');
									}
								}
							}
						}
					},
					slideThumbActiveClass : 'wd-thumb-active',
					thumbsContainerClass  : 'wd-thumbs'
				};
			}
		}

		if (
			galleryWrapper.classList.contains('thumbs-position-without')
			|| galleryWrapper.classList.contains('thumbs-position-bottom')
			|| galleryWrapper.classList.contains('thumbs-position-left')
			|| (
				(
					( ! galleryContainer.classList.contains('wd-off-md') && woodmartThemeModule.$window.width() <= 1024 && woodmartThemeModule.$window.width() > 768 )
					|| ( ! galleryContainer.classList.contains('wd-off-sm') && woodmartThemeModule.$window.width() <= 768 )
				)
				&& (
					galleryWrapper.classList.contains('thumbs-grid-bottom_combined')
					|| galleryWrapper.classList.contains('thumbs-grid-bottom_combined_2')
					|| galleryWrapper.classList.contains('thumbs-grid-bottom_combined_3')
					|| galleryWrapper.classList.contains('thumbs-grid-bottom_column')
					|| galleryWrapper.classList.contains('thumbs-grid-bottom_grid')
				)
			)
		) {
			if ('yes' === woodmart_settings.product_slider_auto_height) {
				imagesLoaded(galleryWrapper, function() {
						initGallery();
					});
			} else {
				initGallery();
			}
		}

		function initGallery() {
			if ('undefined' === typeof wdSwiper) {
				console.error('Swiper is not defined');

				return;
			}

			if (thumbnails && 'undefined' !== typeof thumbnails.swiper) {
				thumbnails.swiper.destroy( true, false );
			}
			if ('undefined' !== typeof gallery.swiper) {
				gallery.swiper.destroy( true, false );
			}

			gallery.classList.add('wd-carousel');

			woodmartThemeModule.$document.trigger('wood-images-loaded');

			new wdSwiper(gallery, mainCarouselArg);
		}

		function createThumbnails() {
			var html = '';

			gallery.querySelectorAll('.woocommerce-product-gallery__image').forEach( function (imageWrapper, index) {
				var imageSrc = imageWrapper.dataset.thumb;
				var image           = imageWrapper.querySelector('a img');
				var alt             = image.getAttribute('alt');
				var title           = image.getAttribute('title');
				var classes  = '';

				if (!title && imageWrapper.querySelector('a picture')) {
					title = imageWrapper.querySelector('a picture').getAttribute('title');
				}

				if (imageWrapper.querySelector('.wd-product-video')) {
					classes += ' wd-with-video';
				}

				html += '<div class="wd-carousel-item' + classes + '">';
				html += '<img src="' + imageSrc + '"';

				if (alt) {
					html += ' alt="' + alt + '"';
				}
				if (title) {
					html += ' title="' + title + '"';
				}
				if (0 === index) {
					var imageOriginalSrc   = image.getAttribute('data-o_src');

					if ( imageOriginalSrc ) {
						html += ' data-o_src="' + imageOriginalSrc + '"';
					}
					//srcset
				}

				html += '/>';

				html += '</div>';
			});

			thumbnails.firstElementChild.innerHTML = html;
		}
	});
}

woodmartThemeModule.$window.on('elementor/frontend/init', function() {
	if (!elementorFrontend.isEditMode()) {
		return;
	}

	woodmartThemeModule.$window.on('resize', woodmartThemeModule.debounce(function() {
		woodmartThemeModule.productImagesGallery();
	}, 300));
});

window.addEventListener('load',function() {
	woodmartThemeModule.productImagesGallery();
});

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdShopPageInit wdLoadMoreLoadProducts wdArrowsLoadProducts wdProductsTabsLoaded wdSearchFullScreenContentLoaded wdUpdateWishlist wdRecentlyViewedProductLoaded', function () {
		woodmartThemeModule.productMoreDescription();
	});

	$.each([
		'frontend/element_ready/wd_products.default',
		'frontend/element_ready/wd_products_tabs.default'
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.productMoreDescription();
		});
	});

	woodmartThemeModule.productMoreDescription = function() {
		$('.wd-hover-with-fade, .wd-image-hotspot.hotspot-type-product, .wd-spot:has(.wd-spot-product)').on('mouseenter touchstart', function() {
			var $content = $(this).find('.wd-more-desc');
			var $inner = $content.find('.wd-more-desc-inner');
			var $moreBtn = $content.find('.wd-more-desc-btn');

			if ($content.hasClass('wd-more-desc-calculated')) {
				return;
			}

			var contentHeight = $content.outerHeight();
			var innerHeight = $inner.outerHeight();
			var delta = innerHeight - contentHeight;

			if (delta > 30) {
				$moreBtn.addClass('wd-shown');
			} else if (delta > 0) {
				$content.css('max-height', contentHeight + delta);
			}

			$content.addClass('wd-more-desc-calculated');
		});

		woodmartThemeModule.$body.on('click', '.wd-more-desc-btn', function(e) {
			e.preventDefault();
			var $this = $(this);

			$this.parent().addClass('wd-more-desc-full');

			woodmartThemeModule.$document.trigger('wdProductMoreDescriptionOpen', [$this.parents('.wd-hover-with-fade')]);
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.productMoreDescription();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.productRecentlyViewed = function() {
		$('.wd-products-element .products, .wd-carousel-container.products .wd-carousel').each( function () {
			var $this = $(this);
			var attr = $this.data('atts');

			if ( 'undefined' === typeof attr || 'undefined' === typeof attr.post_type || 'recently_viewed' !== attr.post_type || 'undefined' === typeof attr.ajax_recently_viewed || 'yes' !== attr.ajax_recently_viewed ) {
				return;
			}

			$.ajax({
				url     : woodmart_settings.ajaxurl,
				data    : {
					attr  : attr,
					action: 'woodmart_get_recently_viewed_products'
				},
				dataType: 'json',
				method  : 'POST',
				success : function(data) {
					if (data.items) {
						woodmartThemeModule.removeDuplicatedStylesFromHTML(data.items, function(html) {
							var temp = $('<div>').html(html);
							var hasProducts = temp.find('.wd-product').length !== 0

							if ( $this.hasClass('wd-carousel') && $this.parents('.wd-products-element').length ) {
								if ( !hasProducts ) {
									$this.parents('.wd-products-element').addClass('wd-hide')
								} else {
									$this.parents('.wd-products-element').removeClass('wd-hide')
								}
								$this.parent().replaceWith(html);
							} else {
								if ( !hasProducts ) {
									$this.parent().addClass('wd-hide')
								} else {
									$this.parent().removeClass('wd-hide')
								}

								$this.html(html);
							}

							woodmartThemeModule.$document.trigger('wdRecentlyViewedProductLoaded');
							woodmartThemeModule.$document.trigger('wood-images-loaded');
						});
					}
				},
				error   : function() {
					console.log('ajax error');
				},
			});
		})
	};

	$(document).ready(function() {
		woodmartThemeModule.productRecentlyViewed();
	});
})(jQuery);
/* global woodmart_settings */
(function($) {
	woodmartThemeModule.singleProdReviews = function() {
		let $reviewsTab = $('#reviews');

		function getSelectedStars() {
			let $activeStarRating = $('.wd-rating-summary-cont').find('.wd-active');

			if ( $activeStarRating.length > 0 ) {
				return $activeStarRating.find('.wd-rating-label').data('rating').toString();
			}

			return '';
		}

		function reloadReviewsWithAjax( clear = false, loaderForSummaryWrap = false ) {
			let $commentList  = $('.commentlist');
			let attr          = $commentList.length > 0 ? $commentList.data('reviews-columns') : {};
			let animationTime = 50;
			let data          = {
				action      : 'woodmart_filter_review',
				rating      : getSelectedStars(),
				product_id  : $reviewsTab.data('product-id'),
				order_by    : 0 < $reviewsTab.find(".wd-reviews-sorting-select :checked").length ? $reviewsTab.find(".wd-reviews-sorting-select :checked").val() : 'newest',
				only_images :$('#wd-with-image-checkbox').is(":checked"),
				summary_criteria_ids: woodmart_settings.summary_criteria_ids,
			}

			if ( attr.hasOwnProperty('reviews_columns') ) {
				data.reviews_columns = attr.reviews_columns;
			}

			if ( attr.hasOwnProperty('reviews_columns_tablet') ) {
				data.reviews_columns_tablet = attr.reviews_columns_tablet;
			}

			if ( attr.hasOwnProperty('reviews_columns_mobile') ) {
				data.reviews_columns_mobile = attr.reviews_columns_mobile;
			}

			if ( clear ) {
				data['rating']      = '';
				data['only_images'] = false;
			}

			$.ajax({
				url    : woodmart_settings.ajaxurl,
				method : 'GET',
				data,
				beforeSend: function() {
					let $commentList = $reviewsTab.find('#comments .commentlist');

					$reviewsTab.find('#comments .wd-loader-overlay').addClass('wd-loading');

					if ( loaderForSummaryWrap ) {
						$reviewsTab.find('.wd-rating-summary-wrap .wd-loader-overlay').addClass('wd-loading');
					}

					$commentList.removeClass('wd-active');
					$commentList.removeClass('wd-in');
				},
				complete: function() {
					$reviewsTab.find('#comments .wd-loader-overlay').removeClass('wd-loading');

					if ( loaderForSummaryWrap ) {
						$reviewsTab.find('.wd-rating-summary-wrap .wd-loader-overlay').removeClass('wd-loading');
					}

					setTimeout(function() {
						$reviewsTab.find('#comments .commentlist').addClass('wd-active');
					}, animationTime);

					setTimeout(function() {
						$reviewsTab.find('#comments .commentlist').addClass('wd-in');
					}, animationTime * 2);
				},
				success: function( response ) {
					if ( ! data.rating ?? ! data.only_images ) {
						$('.wd-reviews-sorting-clear').addClass('wd-hide');
					}

					if ( response.title ) {
						$reviewsTab
							.find('.woocommerce-Reviews-title')
							.html( response.title );
					}

					$(document).trigger('woodmart_reviews_sorting_clear', data );

					if ( response.content ) {
						$reviewsTab
							.find('#comments .wd-reviews-content')
							.html( response.content );
					}

					if ( woodmartThemeModule.hasOwnProperty( 'photoswipeImages' ) && 'function' === typeof woodmartThemeModule.photoswipeImages ) {
						woodmartThemeModule.photoswipeImages();
					}
				},
				error: function( request ) {
					console.error( request );
				}
			});
		}

		$reviewsTab
			.off('click', '.wd-rating-summary-item')
			.on('click', '.wd-rating-summary-item', function () {
				if ( ! woodmart_settings.is_rating_summary_filter_enabled || $(this).hasClass( 'wd-empty' ) ) {
					return;
				}

				$(this).siblings().removeClass('wd-active');
				$(this).toggleClass('wd-active');

				let selectedStars = getSelectedStars();

				$(document).on('woodmart_reviews_sorting_clear', function( e, data ) {
					if ( selectedStars ) {
						$('.wd-reviews-sorting-clear').removeClass('wd-hide');
					} else {
						$('.wd-reviews-sorting-clear').addClass('wd-hide');
					}
				});

				reloadReviewsWithAjax( false, true );
			})
			.off('click', '.wd-reviews-sorting-clear')
			.on('click', '.wd-reviews-sorting-clear', function(e) {
				e.preventDefault();

				$('.wd-rating-summary-item').each(function (){
					$(this).removeClass('wd-active');
				});

				$(document).on('woodmart_reviews_sorting_clear', function( e, data ) {
					$('.wd-reviews-sorting-clear').addClass('wd-hide');
				});

				$('#wd-with-image-checkbox').prop( "checked", false );

				reloadReviewsWithAjax( true, true );
			})
			.off('click', '#wd-with-image-checkbox')
			.on('click', '#wd-with-image-checkbox', function() {
				let checked = $(this).is(":checked");

				$(document).on('woodmart_reviews_sorting_clear', function( e, data ) {
					if ( checked ) {
						$('.wd-reviews-sorting-clear').removeClass('wd-hide');
					} else if ( 0 === data.rating.length ) {
						$('.wd-reviews-sorting-clear').addClass('wd-hide');
					}
				});

				reloadReviewsWithAjax();
			})
			.off('change', '.wd-reviews-sorting-select')
			.on('change', '.wd-reviews-sorting-select', function() {
				reloadReviewsWithAjax();
			});
	};

	$(document).ready(function() {
		woodmartThemeModule.singleProdReviews();
	});

	window.addEventListener('wdOpenDescHiddenTab', function(e) {
		if (woodmartThemeModule.hasOwnProperty('singleProdReviews')) {
			woodmartThemeModule.singleProdReviews();
		}
	})
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.singleProdReviewsCriteria = function() {
		if ( ! woodmart_settings.is_criteria_enabled ) {
			return;
		}

		$('#reviews')
			.on('click', '.wd-review-criteria div.stars a', function ( e ) {
				e.preventDefault();

				let $star      = $( this );
				let criteriaId = $star.closest( '.comment-form-rating' ).data('criteria-id');
				let $rating    = $( `#${ criteriaId }` );
				let	$container = $star.closest( '.stars' );

				$rating.val( $star.text() );
				$star.siblings( 'a' ).removeClass( 'active' );
				$star.addClass( 'active' );
				$container.addClass( 'selected' );
			})
			.on('click', '#respond #submit', function() {
				if ( 'yes' === woodmart_settings.reviews_criteria_rating_required  ) {
					let showAlert           = false;
					let $commentFormRatings = $('#review_form').find('.wd-review-criteria');

					$commentFormRatings.each(function () {
						let $commentFormRating = $(this);
						let criteriaId         = $commentFormRating.data('criteria-id');
						let $rating            = $commentFormRatings.find(`#${ criteriaId }`);

						if ( ! $( $rating ).val() ) {
							showAlert = true;
						}
					});

					if ( showAlert ) {
						window.alert( wc_single_product_params.i18n_required_rating_text );

						return false;
					}
				}
			});
	};

	$(document).ready(function() {
		woodmartThemeModule.singleProdReviewsCriteria();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.singleProdReviewsLike = function () {
		let $reviewsTab = $('#reviews');
		
		$reviewsTab.on( 'click', '.wd-review-likes .wd-like, .wd-review-likes .wd-dislike', function(e) {
			e.preventDefault();

			if ( ! $('body').hasClass('logged-in') ) {
				return;
			}

			let vote;
			let $this         = $(this);
			let $voteWrapper  = $this.closest('.wd-review-likes');
			let commentIDAttr = $this.closest('.comment_container').attr('id');
			let commentID     = parseInt(commentIDAttr.substring(commentIDAttr.indexOf('-') + 1));

			if ( $this.hasClass('wd-active') ) {
				return;
			}

			$this.siblings().removeClass( 'wd-active' );
			$this.addClass('wd-active');

			if ( $this.hasClass('wd-like') ) {
				vote = 'like';
			} else if ( $this.hasClass('wd-dislike') ) {
				vote = 'dislike';
			}

			$.ajax({
				url    : woodmart_settings.ajaxurl,
				method : 'POST',
				data   : {
					action: 'woodmart_comments_likes',
					comment_id: commentID,
					vote,
				},
				beforeSend: function() {
					$voteWrapper.addClass('wd-adding');
				},
				complete: function() {
					$voteWrapper.removeClass('wd-adding');
				},
				success: function( response ) {
					let $likesWrap = $this.closest('.wd-review-likes');

					if ( response.hasOwnProperty( 'likes' ) ) {
						$likesWrap.find('.wd-like span').text( response.likes )
					}

					if ( response.hasOwnProperty( 'dislikes' ) ) {
						$likesWrap.find('.wd-dislike span').text( response.dislikes )
					}
				},
				error: function( request ) {
					console.error( request );
				}
			});
		});
	}

	$(document).ready(function() {
		woodmartThemeModule.singleProdReviewsLike();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdProductsTabsLoaded wdSearchFullScreenContentLoaded wdUpdateWishlist wdRecentlyViewedProductLoaded wdShopPageInit', function() {
		woodmartThemeModule.productsLoadMore();
	});

	$.each([
		'frontend/element_ready/wd_products.default',
		'frontend/element_ready/wd_products_tabs.default',
		'frontend/element_ready/wd_archive_products.default'
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.productsLoadMore();
		});
	});

	woodmartThemeModule.productsLoadMore = function() {
		var process = false,
		    intervalID;

		$('.wd-products-element').each(function() {
			var $this = $(this),
			    cache = [],
			    inner = $this.find('.wd-products');

			if (!inner.hasClass('pagination-arrows')) {
				return;
			}

			cache[parseInt(inner.data('paged'))] = {
				items : inner.html(),
				status: 'have-posts'
			};

			$this.find('.wd-ajax-arrows .wd-btn-arrow.wd-prev .wd-arrow-inner, .wd-ajax-arrows .wd-btn-arrow.wd-next .wd-arrow-inner').on('click', function(e) {
				e.preventDefault();
				var $this = $(this).parent('.wd-btn-arrow');

				if (process || $this.hasClass('wd-disabled')) {
					return;
				}

				process = true;

				clearInterval(intervalID);

				var holder   = $this.parent().prev(),
				    next     = $this.parent().find('.wd-btn-arrow.wd-next'),
				    prev     = $this.parent().find('.wd-btn-arrow.wd-prev'),
				    atts     = holder.data('atts'),
				    action   = 'woodmart_get_products_shortcode',
				    ajaxurl  = woodmart_settings.ajaxurl,
				    dataType = 'json',
				    method   = 'POST',
				    paged    = holder.attr('data-paged');

				paged++;

				if ($this.hasClass('wd-prev')) {
					if (paged < 2) {
						return;
					}

					paged = paged - 2;
				}

				loadProducts('arrows', atts, ajaxurl, action, dataType, method, paged, holder, $this, cache, function(data) {
					var isBorderedGrid = holder.hasClass('products-bordered-grid') || holder.hasClass('products-bordered-grid-ins') || holder.hasClass('products-bordered-grid-bottom');

					holder.siblings('.wd-sticky-loader').removeClass('wd-loading');

					if (!isBorderedGrid) {
						holder.addClass('wd-animated-products');
					}

					if (data.items.length) {
						holder.html(data.items).attr('data-paged', paged);
						holder.imagesLoaded().progress(function() {
							holder.parent().trigger('recalc');
						});

						woodmartThemeModule.$document.trigger('wood-images-loaded');
						woodmartThemeModule.$document.trigger('wdArrowsLoadProducts');
					}

					if (woodmartThemeModule.$window.width() < 768) {
						$('html, body').stop().animate({
							scrollTop: holder.offset().top - 150
						}, 400);
					}

					if (!isBorderedGrid) {
						var iter = 0;

						intervalID = setInterval(function() {
							holder.find('.wd-product').eq(iter).addClass('wd-animated');
							iter++;
						}, 100);
					}

					if (paged > 1) {
						prev.removeClass('wd-disabled');
					} else {
						prev.addClass('wd-disabled');
					}

					if (data.status === 'no-more-posts') {
						next.addClass('wd-disabled');
					} else {
						next.removeClass('wd-disabled');
					}
				});
			});
		});

		woodmartThemeModule.clickOnScrollButton(woodmartThemeModule.shopLoadMoreBtn, false, woodmart_settings.infinit_scroll_offset);

		woodmartThemeModule.$document.off('click', '.wd-products-load-more').on('click', '.wd-products-load-more', function(e) {
			e.preventDefault();

			if (process) {
				return;
			}

			process = true;

			var $this    = $(this),
			    holder   = $this.parents('.wd-products-element').find('.wd-products'),
			    source   = holder.data('source'),
			    action   = 'woodmart_get_products_' + source,
			    ajaxurl  = woodmart_settings.ajaxurl,
			    dataType = 'json',
			    method   = 'POST',
			    atts     = holder.data('atts'),
			    paged    = holder.data('paged');

			paged++;

			if (source === 'main_loop') {
				ajaxurl = $(this).attr('href');
				method = 'GET';
			}

			loadProducts('load-more', atts, ajaxurl, action, dataType, method, paged, holder, $this, [], function(data) {
				if (data.items.length) {
					if (holder.hasClass('grid-masonry')) {
						isotopeAppend(holder, data.items);
					} else {
						holder.append(data.items);
					}

					if (data.status !== 'no-more-posts') {
						holder.imagesLoaded().progress(function() {
							woodmartThemeModule.clickOnScrollButton(woodmartThemeModule.shopLoadMoreBtn, true, woodmart_settings.infinit_scroll_offset);
						});
					}

					woodmartThemeModule.$document.trigger('wood-images-loaded');
					woodmartThemeModule.$document.trigger('wdLoadMoreLoadProducts');

					holder.data('paged', paged);
				}

				if (source === 'main_loop') {
					$this.attr('href', data.nextPage);

					if (data.status === 'no-more-posts') {
						$this.parent().hide().remove();
					}
				}

				if (data.status === 'no-more-posts') {
					$this.parent().hide();
				}
			});
		});

		var loadProducts = function(btnType, atts, ajaxurl, action, dataType, method, paged, holder, btn, cache, callback) {
			var data = {
				atts    : atts,
				paged   : paged,
				action  : action,
				woo_ajax: 1
			};

			if (method === 'GET') {
				ajaxurl = woodmartThemeModule.removeURLParameter(ajaxurl, 'loop');
				ajaxurl = woodmartThemeModule.removeURLParameter(ajaxurl, 'woo_ajax');
			}

			if (cache[paged]) {
				holder.addClass('wd-loading');

				setTimeout(function() {
					callback(cache[paged]);
					holder.removeClass('wd-loading');
					process = false;
				}, 300);

				return;
			}

			if (btnType === 'arrows') {
				holder.addClass('wd-loading').parent().addClass('wd-loading');

				holder.siblings('.wd-sticky-loader').addClass('wd-loading');
			}

			btn.addClass('loading');

			if (action === 'woodmart_get_products_main_loop') {
				var loop = holder.find('.product').last().data('loop');
				data = {
					loop    : loop,
					woo_ajax: 1,
					atts    : atts,
				};
			}

			$.ajax({
				url     : ajaxurl,
				data    : data,
				dataType: dataType,
				method  : method,
				success : function(data) {
					woodmartThemeModule.removeDuplicatedStylesFromHTML(data.items, function(html) {
						var $resultCount = $('.woocommerce-result-count');
						data.items       = html;
						cache[paged]     = data;
						callback(data);

						if ('yes' === woodmart_settings.load_more_button_page_url_opt && 'no' !== woodmart_settings.load_more_button_page_url && data.currentPage){
							var state  = '';
							var newUrl = data.currentPage + window.location.search;

							if ( !!window.history.state && window.history.state.hasOwnProperty('url') ) {
								window.history.state.url = newUrl;
								state                    = window.history.state;
							}

							window.history.replaceState(state, '', newUrl);
							$('.woocommerce-breadcrumb').replaceWith(data.breadcrumbs);
						}

						if ( $resultCount.length > 0 && data.hasOwnProperty('resultCount') ) {
							$resultCount.replaceWith(data.resultCount);
						}
					});
				},
				error   : function() {
					console.log('ajax error');
				},
				complete: function() {
					if (btnType === 'arrows') {
						holder.removeClass('wd-loading').parent().removeClass('wd-loading');
					}

					btn.removeClass('loading');
					process = false;
				}
			});
		};

		var isotopeAppend = function(el, items) {
			var $items = $(items);
			el.append($items).isotope('appended', $items);
			el.imagesLoaded().progress(function() {
				el.isotope('layout');
			});
		};
	};

	$(document).ready(function() {
		woodmartThemeModule.productsLoadMore();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	$.each([
		'frontend/element_ready/wd_products_tabs.default'
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.productsTabs();
		});
	});

	woodmartThemeModule.productsTabs = function() {
		var process = false;

		$('.wd-products-tabs').each(function() {
			var $this  = $(this);
			var $inner = $this.find('.wd-tabs-content-wrapper');
			var cache  = [];
			var $cloneContent = $inner.find('.wd-products-element').clone().removeClass('wd-active wd-in');

			if ( $cloneContent.find('.wd-carousel') ) {
				$cloneContent.find('.wd-carousel').removeClass('wd-initialized');
			}

			cache[0] = {
				html: $cloneContent.prop('outerHTML')
			};

			$this.find('.products-tabs-title li').on('click', function(e) {
				e.preventDefault();

				var $this = $(this),
				    atts  = $this.data('atts'),
				    index = $this.index();

				if (process || $this.hasClass('wd-active')) {
					return;
				}
				process = true;

				$inner.find('.wd-products-element').removeClass('wd-in');

				setTimeout(function() {
					$inner.find('.wd-products-element').addClass('wd-active');
				}, 100);

				loadTab(atts, index, $inner, $this, cache, function(data) {
					if (data.html) {
						woodmartThemeModule.removeDuplicatedStylesFromHTML(data.html, function(html) {
							if ($inner.find('.wd-products-element').length) {
								$inner.find('.wd-products-element').replaceWith(html);
							} else {
								$inner.append(html);
							}

							$inner.find('.wd-products-element').addClass('wd-active');

							setTimeout(function() {
								$inner.find('.wd-products-element').addClass('wd-in');

								woodmartThemeModule.$document.trigger('wdProductsTabsLoaded');
								woodmartThemeModule.$document.trigger('wood-images-loaded');
							}, 200);

							$this.removeClass('loading');
						});
					}
				});
			});

			setTimeout(function() {
				if (! $this.find('.products-tabs-title li.wd-active').length) {
					$this.find('.products-tabs-title li').first().addClass('wd-active');
				}

				$this.addClass( 'wd-inited' );
			}, 200);
		});

		var loadTab = function(atts, index, holder, btn, cache, callback) {
			var $loader = holder.find('> .wd-sticky-loader');
			btn.parent().find('.wd-active').removeClass('wd-active');
			btn.addClass('wd-active');

			if (cache[index]) {
				setTimeout(function() {
					process = false;
					callback(cache[index]);
				}, 300);
				return;
			}

			$loader.addClass('wd-loading');
			btn.addClass('loading');

			$.ajax({
				url     : woodmart_settings.ajaxurl,
				data    : {
					atts  : atts,
					action: 'woodmart_get_products_tab_shortcode'
				},
				dataType: 'json',
				method  : 'POST',
				success : function(data) {
					process = false;
					cache[index] = data;
					callback(data);
				},
				error   : function() {
					console.log('ajax error');
				},
				complete: function() {
					process = false;
					$loader.removeClass('wd-loading');
				}
			});
		};
	};

	$(document).ready(function() {
		woodmartThemeModule.productsTabs();
	});
})(jQuery);

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

/* global woodmart_settings, woodmartThemeModule, jQuery */
woodmartThemeModule.ptSubscribeForm = function() {
	var signedProducts      = [];
	var firstSignedProducts = [];

	async function init() {
		var notifierBtn = getNotifierBtn();

		if (!notifierBtn) return;

		if ('yes' === woodmart_settings.pt_fragments_enable) {
			const ids  = getProductAndVariationId();
			const data = await fetchSignedProducts(ids.productId);

			if (data) {
				if (data.signed_variations && data.signed_variations.length > 0) {
					firstSignedProducts = data.signed_variations;
				} else if (data.is_signed) {
					firstSignedProducts.push(ids.productId);
					signedProducts.push(ids.productId);
				}

				notifierBtn.classList.remove('wd-disabled');
			}

			renderNotifierUI(notifierBtn);
		} else {
			var variationsForm = getVariationsForm();

			if (variationsForm) {
				firstSignedProducts = JSON.parse(notifierBtn.dataset.signedVariations || '[]');
			}

			renderNotifierUI(notifierBtn);
		}

		setupEventListeners();
	}

	/**
	 * Updates the notifier button UI based on current variation state.
	 *
	 * @param {HTMLElement} notifierBtn
	 */
	function renderNotifierUI(notifierBtn) {
		const ids = getProductAndVariationId();

		if (ids.variationId && firstSignedProducts.includes(ids.variationId)) {
			notifierBtn.classList.remove('wd-hide');
		}
	}

	/**
	 * Sets up all event listeners for notifier button, popup, and variations form.
	 */
	function setupEventListeners() {
		var notifierBtn    = getNotifierBtn();
		var popupContent   = getPopupContent();
		var variationsForm = getVariationsForm();

		if (!notifierBtn) {
			return;
		}

		if (notifierBtn.classList.contains('wd-pt-remove')) {
			notifierBtn.addEventListener('click', handleUnsubscribe);
		}

		if (popupContent) {
			var subscribeBtn           = popupContent.querySelector('.wd-pt-add');
			var policyCheckInput       = popupContent.querySelector('[name="wd-pt-policy-check"]');
			var desiredPriceCheckInput = popupContent.querySelector('[name="wd-pt-desired-price-check"]');
			var desiredPriceInput      = popupContent.querySelector('[name="wd-pt-user-desired-price"]');
			var closePopupBtn          = popupContent.querySelector('.wd-close-popup');

			subscribeBtn.addEventListener('click', handleSubscribe);

			// Remove notice when magnificPopup closes.
			jQuery(document).one('mfpClose', function() {
				maybeClearNotices();
			});

			// Remove notice when policyCheckInput is checked.
			if (policyCheckInput) {
				const removeNoticeOnCheck = function() {
					if (policyCheckInput.checked) {
						maybeClearNotices(woodmart_settings.pt_policy_check_msg);
					}
				};

				policyCheckInput.addEventListener('change', removeNoticeOnCheck);
			}

			if (desiredPriceCheckInput && desiredPriceInput) {
				// Set desired price check input when desired price input is clicked.
				desiredPriceInput.addEventListener('click', function(e) {
					desiredPriceCheckInput.checked = true;
				});

				// Clear desired price input when desired price check input is unchecked.
				desiredPriceCheckInput.addEventListener('change', function() {
					if (!desiredPriceCheckInput.checked) {
						desiredPriceInput.value = '';
					} else {
						desiredPriceInput.focus();
					}
				});
			}

			// Close popup when close button is clicked.
			closePopupBtn.addEventListener('click', function(e) {
				e.preventDefault();

				jQuery.magnificPopup.close();
			});
		} else if (notifierBtn.classList.contains('wd-pt-add')) {
			notifierBtn.addEventListener('click', handleSubscribe);
		}

		if (variationsForm) {
			jQuery('.variations_form')
				.off('show_variation', handleFoundVariation)
				.on('show_variation', handleFoundVariation)
				.off('click', '.reset_variations', handleResetVariations)
				.on('click', '.reset_variations', handleResetVariations);
		}
	}

	/**
	 * Handles faund variation event.
	 *
	 * @param {Event} e
	 * @param {Object} variation
	 */
	function handleFoundVariation(e, variation) {
		var notifierBtn  = getNotifierBtn();
		var popupContent = getPopupContent();

		if (!notifierBtn) {
			return;
		}

		if (popupContent) {
			updatePopupContent(variation.variation_id);
		}

		updateNotifierBtn(variation.variation_id);

		if (variation.is_in_stock) {
			notifierBtn.classList.remove('wd-hide');
		} else {
			notifierBtn.classList.add('wd-hide');
		}
		
		maybeClearNotices();
	}

	/**
	 * Handles reset variations event.
	 *
	 * @param {Event} e
	 */
	function handleResetVariations(e) {
		var notifierBtn = getNotifierBtn();

		notifierBtn.classList.add('wd-hide');

		maybeClearNotices();
	}

	/**
	 * Handles subscribe button click event.
	 *
	 * @param {Event} e
	 */
	function handleSubscribe(e) {
		if (this.classList.contains('wd-pt-remove')) {
			return;
		}

		e.preventDefault();

		var popupContent = getPopupContent();

		if (popupContent) {
			if (! validateForm()) {
				return;
			}
		}

		var ids              = getProductAndVariationId();
		var userEmail        = getUserEmail();
		var userDesiredPrice = getUserDesiredPrice();

		sendNotifierForm({
			action       : 'woodmart_add_to_price_tracker',
			security     : woodmart_settings.pt_add_button_nonce,
			user_email   : userEmail,
			product_id   : ids.productId,
			variation_id : ids.variationId,
			desired_price : userDesiredPrice,
		});
	}

	/**
	 * Handles unsubscribe button click event.
	 *
	 * @param {Event} e
	 */
	function handleUnsubscribe(e) {
		if (!this.classList.contains('wd-pt-remove')) {
			return;
		}

		e.preventDefault();

		var ids         = getProductAndVariationId();
		var productId   = parseInt(ids.productId);
		var variationId = parseInt(ids.variationId); 

		sendNotifierForm({
			action       : 'woodmart_remove_from_price_tracker',
			security     : woodmart_settings.pt_remove_button_nonce,
			product_id   : productId,
			variation_id : variationId,
		});
	}

	/**
	 * Updates notifier button UI for a specific variation.
	 *
	 * @param {number} variationId
	 */
	function updateNotifierBtn(variationId) {
		var notifierBtn     = getNotifierBtn();
		var popupContent    = getPopupContent();
		var notifierBtnLink = notifierBtn.querySelector('a');
		var notifierBtnText = notifierBtnLink.querySelector('.wd-action-text');

		if (firstSignedProducts.includes(variationId)) {
			notifierBtnText.innerText = woodmart_settings.pt_button_text_stop_tracking;
			notifierBtnLink.href      = '#';
			notifierBtnLink.classList.remove('added');

			notifierBtn.classList.add('wd-pt-remove');
			notifierBtn.classList.remove('wd-pt-add');

			notifierBtn.addEventListener('click', handleUnsubscribe);

			notifierBtnLink.classList.remove('wd-open-popup');
		} else if (signedProducts.includes(variationId)) {
			notifierBtnText.innerText = woodmart_settings.pt_button_text_watch_tracking;
			notifierBtnLink.href      = woodmart_settings.pt_endpoint_url;
			notifierBtnLink.classList.add('added');

			notifierBtn.classList.remove('wd-pt-remove');
			notifierBtn.classList.remove('wd-pt-add');

			notifierBtn.removeEventListener('click', handleSubscribe);

			notifierBtnLink.classList.remove('wd-open-popup');
		} else {
			notifierBtnText.innerText = woodmart_settings.pt_button_text_not_tracking;

			notifierBtn.classList.remove('wd-pt-remove');
			notifierBtnLink.classList.remove('wd-open-popup');
			notifierBtnLink.classList.remove('added');

			if (popupContent) {
				notifierBtnLink.href = '#wd-popup-pt';

				notifierBtnLink.classList.add('wd-open-popup');
			} else {
				notifierBtnLink.href = '#';
				notifierBtn.classList.add('wd-pt-add');

				notifierBtn.addEventListener('click', handleSubscribe);
			}
		}
	}

	/**
	 * Updates popup content for a specific variation.
	 *
	 * @param {number} variationId
	 */
	function updatePopupContent(variationId) {
		var popupContent = getPopupContent();

		if (signedProducts.includes(variationId)) {
			popupContent.querySelector('.wd-pt-signed').classList.remove('wd-hide');
			popupContent.querySelector('.wd-pt-not-signed').classList.add('wd-hide');
		} else {
			popupContent.querySelector('.wd-pt-signed').classList.add('wd-hide');
			popupContent.querySelector('.wd-pt-not-signed').classList.remove('wd-hide');
		}
	}

	/**
	 * Updates signed products based on the current state.
	 *
	 * @param {string} state
	 * @param {number} productId
	 */
	function updateSignedProducts(state, productId) {
		if ('signed' === state) {
			if (!signedProducts.includes(productId)) {
				signedProducts.push(productId);
			}
		} else if ('not-signed' === state) {
			if (signedProducts.includes(productId)) {
				signedProducts = signedProducts.filter(function(id) {
					return id !== productId;
				});
			}

			if (firstSignedProducts.includes(productId)) {
				firstSignedProducts = firstSignedProducts.filter(function(id) {
					return id !== productId;
				});
			}
		}
	}

	/**
	 * Validates the popup form (policy checkbox).
	 *
	 * @returns {boolean}
	 */
	function validateForm() {
		var popupContent = getPopupContent();

		if (!popupContent) {
			return false;
		}

		var policyCheckInput       = popupContent.querySelector('[name="wd-pt-policy-check"]');
		var desiredPriceCheckInput = popupContent.querySelector('[name="wd-pt-desired-price-check"]');
		var desiredPriceInput      = popupContent.querySelector('[name="wd-pt-user-desired-price"]');
		var noticesAria            = getNoticeAria();

		if (policyCheckInput && ! policyCheckInput.checked && noticesAria) {
			addNotice(noticesAria, woodmart_settings.pt_policy_check_msg, 'warning');

			return false;
		}

		if (desiredPriceCheckInput && desiredPriceInput && desiredPriceCheckInput.checked && ! parseInt( desiredPriceInput.value ) ) {
			addNotice(noticesAria, woodmart_settings.pt_desired_price_check_msg, 'warning');

			return false;
		}

		return true;
	}

	/**
	 * Sends AJAX request to subscribe/unsubscribe and updates UI.
	 *
	 * @param {Object} data
	 */
	function sendNotifierForm(data) {
		var popupContent    = getPopupContent();
		var noticesAria     = getNoticeAria();
		var notifierBtn     = getNotifierBtn();
		var notifierBtnLink = notifierBtn.querySelector('a');
		var ids             = getProductAndVariationId();
		var productId       = ids.variationId ? ids.variationId : ids.productId;

		maybeClearNotices();

		if (popupContent) {
			var loaderOverlay = popupContent.querySelector('.wd-loader-overlay');

			loaderOverlay.classList.add('wd-loading');
		}

		notifierBtnLink.classList.add('loading');

		jQuery.ajax({
			url     : woodmart_settings.ajaxurl,
			data,
			method  : 'POST',
			success : function(response) {
				if (!response || !response.hasOwnProperty('data')) {
					return;
				}

				if (response.data.notice && noticesAria) {
					var status = response.data.success ? 'success' : 'warning';

					addNotice(noticesAria, response.data.notice, status);
				}

				if (response.data.state) {
					updateSignedProducts(response.data.state, productId);
				}

				if (popupContent) {
					updatePopupContent(productId);
				}

				updateNotifierBtn(productId);
			},
			error   : function() {
				console.error('ajax adding to price tracker error');
			},
			complete: function() {
				if (popupContent) {
					loaderOverlay = popupContent.querySelector('.wd-loader-overlay');

					loaderOverlay.classList.remove('wd-loading');
				}

				notifierBtnLink.classList.remove('loading');
			}
		});
	}

	/**
	 * Fetches signed variations for a product via AJAX.
	 *
	 * @param {number|string} productId
	 *
	 * @returns {Promise<Object|undefined>}
	 */
	async function fetchSignedProducts(productId) {
		try {
			const data = await jQuery.ajax({
				url     : woodmart_settings.ajaxurl,
				data    : {
					action    : 'woodmart_update_price_tracker_form',
					product_id: productId,
				},
				dataType: 'json',
				method  : 'GET',
			});

			return data;
		} catch (error) {
			console.error('Error updating form data:', error);
		}
	}

	/**
	 * Gets current product and variation IDs from DOM.
	 *
	 * @returns {{productId: string|number, variationId: number}}
	 */
	function getProductAndVariationId() {
		var productId = false;

		document.querySelector('body[class*="postid-"]').classList.forEach(function(className) {
			if ( ! className.includes('postid-') ) {
				return;
			}

			productId = className.replace('postid-', '')
		});

		var variations_form = getVariationsForm();
		var variationId     = 0;

		if (variations_form) {
			var variationIdInput = variations_form.querySelector('input.variation_id');
			variationId  = variationIdInput.value ? parseInt(variationIdInput.value) : 0;
		}

		return {productId: parseInt(productId), variationId: parseInt(variationId)};
	}

	/**
	 * Retrieves the value of the user's email from the price tracker subscription form input.
	 *
	 * @returns {string} The user's email address if the input exists, otherwise an empty string.
	 */
	function getUserEmail() {
		var userEmail      = '';
		var userEmailInput = document.querySelector('[name="wd-pt-user-subscribe-email"]');

		if (userEmailInput) {
			userEmail = userEmailInput.value;
		}

		return userEmail;
	}

	/**
	 * Retrieves the value of the user's desired price from the price tracker subscription form input.
	 *
	 * @returns {string} The user's desired price if the input exists, otherwise an empty string.
	 */
	function getUserDesiredPrice() {
		var userDesiredPrice      = '';
		var userDesiredPriceInput = document.querySelector('[name="wd-pt-user-desired-price"]');

		if (userDesiredPriceInput) {
			userDesiredPrice = userDesiredPriceInput.value;
		}

		return userDesiredPrice;
	}

	/**
	 * Adds a notice message to the popup form.
	 *
	 * @param {HTMLElement} noticesAria
	 * @param {string} message
	 * @param {string} status
	 */
	function addNotice(noticesAria, message, status) {
		if (!noticesAria) {
			return;
		}

		maybeClearNotices();

		var noticeNode = document.createElement("div");

		noticeNode.classList.add(
			'wd-notice',
			`wd-${status}`
		);

		noticeNode.append(message);
		noticesAria.append(noticeNode);
	}

	/**
	 * Returns the DOM element of the price drop button.
	 *
	 * @returns {HTMLElement|null}
	 */
	function getNotifierBtn() {
		return document.querySelector('.wd-pt-btn');
	}

	/**
	 * Returns the DOM element of the price drop subscription popup.
	 *
	 * @returns {HTMLElement|null}
	 */
	function getPopupContent() {
		return document.querySelector('#wd-popup-pt');
	}

	/**
	 * Returns the DOM element of the variations form.
	 *
	 * @returns {HTMLElement|null}
	 */
	function getVariationsForm() {
		return document.querySelector('.variations_form');
	}

	/**
	 * Returns the DOM element of the notices wrapper.
	 *
	 * @returns {HTMLElement|null}
	 */
	function getNoticeAria() {
		var popupContent = getPopupContent();

		if (popupContent && popupContent.closest('.mfp-ready')) {
			return popupContent;
		} else {
			return document.querySelector('.woocommerce-notices-wrapper');
		}
	}

	/**
	 * Removes the first element with the class 'wd-notice' from the notice area, if it exists.
	 * Utilizes the getNoticeAria function to locate the notice area in the DOM.
	 *
	 * @param {string} message
	 */
	function maybeClearNotices(message = '') {
		var noticesAria = getNoticeAria();

		if (!noticesAria) {
			return;
		}

		var noticeNodes = noticesAria.querySelectorAll('.wd-notice');

		if ( 0 === noticeNodes.length) {
			return;
		}

		noticeNodes.forEach(noticeNode => {
			if (!message || (message && noticeNode.innerText.includes(message))) {
				noticeNode.remove();
			}
		});
	}

	init();
}

window.addEventListener('load', function() {
	woodmartThemeModule.ptSubscribeForm();
});

/* global woodmart_settings */
woodmartThemeModule.ptTable = function() {
	var ptTable = document.querySelector('.wd-pt-table');

	if (!ptTable) {
		return;
	}

	var unsubscribeBtns        = ptTable.querySelectorAll('.wd-pt-remove');
	var desiredPriceEditBtns   = ptTable.querySelectorAll('.wd-desired-price-opener');
	var desiredPriceCancelBtns = ptTable.querySelectorAll('.wd-desired-price-cancel');
	var desiredPriceSaveBtns   = ptTable.querySelectorAll('.wd-desired-price-save');

	unsubscribeBtns.forEach(function(unsubscribeBtn) {
		unsubscribeBtn.addEventListener('click', function(e) {
			e.preventDefault();

			var actionBtn = this;

			ptTable.parentNode.querySelector('.wd-loader-overlay').classList.add('wd-loading');

			jQuery.ajax({
				url     : woodmart_settings.ajaxurl,
				data    : {
					action       : 'woodmart_remove_from_price_tracker_in_my_account',
					security     : woodmart_settings.pt_remove_button_nonce,
					product_id   : actionBtn.dataset.productId,
					variation_id : actionBtn.dataset.variationId,
				},
				method  : 'POST',
				success : function(response) {
					if (!response) {
						return;
					}

					if (response.success) {
						actionBtn.closest('tr').remove();
					}

					if (response.data.content) {
						tempDiv           = document.createElement('div');
						tempDiv.innerHTML = response.data.content;
						var childNodes    = tempDiv.querySelector('.wd-pt-content').childNodes;

						ptTable.parentNode.replaceChildren(...childNodes);
					}
				},
				error   : function() {
					console.error('ajax remove from waitlist error');
				},
				complete: function() {
					ptTable.parentNode.querySelector('.wd-loader-overlay').classList.remove('wd-loading');
				}
			});
		});
	});

	desiredPriceEditBtns.forEach(function(editBtn) {
		editBtn.addEventListener('click', function(e) {
			e.preventDefault();

			var desiredPriceEdit = this.closest('td').querySelector('.wd-desired-price-edit');
			var amount           = this.closest('td').querySelector('.amount');
			var emptyCell        = this.closest('td').querySelector('.wd-cell-empty');

			if (desiredPriceEdit) {
				desiredPriceEdit.classList.toggle('wd-hide');
				this.classList.toggle('wd-hide');
			}

			if (amount) {
				amount.classList.add('wd-hide');
			}

			if (emptyCell) {
				emptyCell.classList.add('wd-hide');
			}
		});
	});

	desiredPriceCancelBtns.forEach(function(cancelBtn) {
		cancelBtn.addEventListener('click', function(e) {
			e.preventDefault();

			var desiredPriceEdit = this.closest('.wd-desired-price-edit');
			var amount           = desiredPriceEdit.closest('td').querySelector('.amount');
			var emptyCell        = desiredPriceEdit.closest('td').querySelector('.wd-cell-empty');

			if (desiredPriceEdit) {
				desiredPriceEdit.classList.add('wd-hide');
				desiredPriceEdit.parentNode.querySelector('.wd-desired-price-opener').classList.remove('wd-hide');
			}


			if (amount) {
				amount.classList.remove('wd-hide');
			}

			if (emptyCell) {
				emptyCell.classList.remove('wd-hide');
			}
		});
	});

	desiredPriceSaveBtns.forEach(function(saveBtn) {
		saveBtn.addEventListener('click', function(e) {
			e.preventDefault();

			var desiredPriceEdit        = this.closest('.wd-desired-price-edit');
			var desiredPriceChangeInput = desiredPriceEdit.querySelector('[name="wd-desired-price-change"]');
			var noticesWrapper          = document.querySelector('.woocommerce-notices-wrapper');

			if (desiredPriceChangeInput) {
				var newDesiredPrice = desiredPriceChangeInput.value;

				ptTable.parentNode.querySelector('.wd-loader-overlay').classList.add('wd-loading');

				jQuery.ajax({
					url     : woodmart_settings.ajaxurl,
					data    : {
						action       : 'woodmart_update_price_tracker_desired_price',
						security     : woodmart_settings.pt_update_desired_price_nonce,
						product_id   : desiredPriceEdit.dataset.productId,
						variation_id : desiredPriceEdit.dataset.variationId,
						desired_price: newDesiredPrice,
					},
					method  : 'POST',
					success : function(response) {
						if (!response) {
							return;
						}

						if ( response.data.notice ) {
							var noticeNodes = noticesWrapper.querySelectorAll('.wd-notice');
							var noticeNode  = document.createElement("div");
							var status      = response.success ? 'success' : 'warning';

							noticeNodes.forEach(noticeNode => {
								noticeNode.remove();
							});

							noticeNode.classList.add(
								'wd-notice',
								`wd-${status}`
							);

							noticeNode.append(response.data.notice);
							noticesWrapper.append(noticeNode);
						}

						if (response.success) {
							var amount    = desiredPriceEdit.parentNode.querySelector('.amount');
							var emptyCell = desiredPriceEdit.parentNode.querySelector('.wd-cell-empty');

							if (amount) {
								amount.remove();
							}

							if (emptyCell) {
								emptyCell.remove();
							}

							if (response.data.desired_price_html) {
								var tempDiv       = document.createElement('div');
								tempDiv.innerHTML = response.data.desired_price_html;

								desiredPriceEdit.parentNode.prepend(tempDiv.firstElementChild);
							}

							desiredPriceEdit.classList.add('wd-hide');
							desiredPriceEdit.parentNode.querySelector('.wd-desired-price-opener').classList.remove('wd-hide');
						}
					},
					error   : function() {
						console.error('ajax update desired price error');
					},
					complete: function() {
						ptTable.parentNode.querySelector('.wd-loader-overlay').classList.remove('wd-loading');
					}
				});
			}
		});
	});
}

window.addEventListener('load', function() {
	woodmartThemeModule.ptTable();
});

/* global woodmart_settings */
(function($) {
	$.each([
		'frontend/element_ready/wd_products.default',
		'frontend/element_ready/wd_products_tabs.default'
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.quickShop();
		});
	});

	woodmartThemeModule.quickShop = function() {
		if ('no' === woodmart_settings.quick_shop) {
			return;
		}

		var btnSelector = '.wd-product.product-type-variable .add_to_cart_button';

		woodmartThemeModule.$document.on('click', btnSelector, function(e) {
				e.preventDefault();

				var $this        = $(this),
				    $product     = $this.parents('.product').first(),
				    $content     = $product.find('.wd-quick-shop'),
				    id           = $product.data('id'),
				    loadingClass = 'btn-loading';

				if ($this.hasClass(loadingClass)) {
					return;
				}

				// Simply show quick shop form if it is already loaded with AJAX previously
				if ($product.hasClass('quick-shop-loaded')) {
					$product.addClass('quick-shop-shown');
					woodmartThemeModule.$body.trigger('woodmart-quick-view-displayed');
					return;
				}

				$this.addClass(loadingClass);
				$product.addClass('wd-loading-quick-shop');

				$.ajax({
					url     : woodmart_settings.ajaxurl,
					data    : {
						action: 'woodmart_quick_shop',
						id    : id
					},
					method  : 'get',
					success : function(data) {
						woodmartThemeModule.removeDuplicatedStylesFromHTML(data, function(html) {
							$content.append(html);

							initVariationForm($product);
							woodmartThemeModule.$document.trigger('wdQuickShopSuccess');

							$this.removeClass(loadingClass);
							$product.removeClass('wd-loading-quick-shop');
							$product.addClass('quick-shop-shown quick-shop-loaded');
							woodmartThemeModule.$body.trigger('woodmart-quick-view-displayed');
						});
					},
				});
			})
			.on('click', '.quick-shop-close', function(e) {
				e.preventDefault();

				var $this    = $(this),
				    $product = $this.parents('.product');

				$product.removeClass('quick-shop-shown');
			});

		woodmartThemeModule.$body.on('added_to_cart', function() {
			$('.product').removeClass('quick-shop-shown');
		});

		function initVariationForm($product) {
			$product.find('.variations_form').wc_variation_form().find('.variations select:eq(0)').trigger('change');
			$product.find('.variations_form').trigger('wc_variation_form');
		}
	};

	$(document).ready(function() {
		woodmartThemeModule.quickShop();
	});
})(jQuery);

/* global woodmart_settings */
/* global wc_add_to_cart_variation_params */
(function($) {
	$.each([
		'frontend/element_ready/wd_products.default',
		'frontend/element_ready/wd_products_tabs.default'
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.quickShopVariationForm();
		});
	});

	woodmartThemeModule.quickShopVariationForm = function() {
		woodmartThemeModule.$document.on('mouseenter touchstart mousemove', '.wd-product.product-type-variable', function() {
			var $product          = $(this);
			var $form             = $product.find('.variations_form');
			var $button           = $product.find('.button.product_type_variable');
			var $price            = $product.find('.price').first();
			var $image            = $product.find('.product-image-link > img, .product-image-link > picture > img');
			var $source           = $product.find('.product-image-link picture source');

			var originalSrc       = $image.attr('src');
			var originalSrcSet    = $image.attr('srcset') ? $image.attr('srcset') : null;
			var originalSizes     = $image.attr('sizes') ? $image.attr('sizes') : null;
			var originalBtnText   = $button.text();
			var addToCartText     = woodmart_settings.add_to_cart_text;
			var priceOriginalHtml = $price.html();
			var $stockStatus      = $product.find('.wd-product-stock');
			var $sku              = $product.find('.wd-product-sku').find('span').not('.wd-label');
			var $inputQty         = $button.siblings('.quantity').find('input[name=quantity]');
			var originalQtyMax    = $inputQty.attr('max');
			var originalQtyMin    = $inputQty.attr('min');

			if ( ! $form.length || $form.hasClass('wd-variations-inited') || ('undefined' !== typeof elementorFrontend && elementorFrontend.isEditMode())) {
				return;
			}

			if ( $stockStatus.length ) {
				var stockStatusOriginalText = $stockStatus.text();
				var stockStatusClasses = $stockStatus.attr('class');
			}
			if ( $sku.length ) {
				var skuOriginalText = $sku.text();
			}

			$form.wc_variation_form();

			$form.addClass('wd-variations-inited');

			$form.on('click', '.wd-swatch', function() {
				var $this = $(this);
				var $product = $this.parents('.wd-product');
				var value = $this.data('value');
				var id = $this.parent().data('id');
				// var $select = $form.find('select#' + CSS.escape(id));
				var $select = $this.parent().siblings('select');

				if (! $form.hasClass('wd-form-inited')) {
					$form.addClass('wd-form-inited');

					loadVariations($form);
				}

				resetSwatches($form);

				if ( $this.parents('.variations_form.wd-clear-double').length && $this.hasClass('wd-active') ) {
					$select.val('').trigger('change');
					$this.removeClass('wd-active');

					var swatchSelected = false;

					$product.find('.wd-swatch').each( function( key, value ) {
						if ( $( value ).hasClass('wd-active') ) {
							return swatchSelected = true;
						}
					});

					if ( ! swatchSelected ) {
						$product.trigger( 'wdImagesGalleryInLoopOn', $product );
					}

					return;
				} else if ( $this.hasClass('wd-active') || $this.hasClass('wd-disabled')) {
					return;
				}

				$select.val(value).trigger('change');

				$this.parent().find('.wd-active').removeClass('wd-active');
				$this.addClass('wd-active');

				$product.trigger( 'wdImagesGalleryInLoopOff', $product );

				resetSwatches($form);
			});
			$form.on('change', 'select', function() {
				if ( $form.parents('.wd-products.grid-masonry').length && 'undefined' !== typeof ($.fn.isotope) ) {
					setTimeout(function () {
						$form.parents('.wd-products.grid-masonry').isotope('layout');
					}, 100);
				}

				if ($form.hasClass('wd-form-inited')) {
					return false;
				}

				$form.addClass('wd-form-inited');

				loadVariations($form);
			});

			$form.on('found_variation', function(event, variation) {
				if (variation.price_html.length > 1) {
					$price.html(variation.price_html);
				}

				updateProductImage(variation);

				if ( $stockStatus.length ) {
					if ( variation.availability_html ) {
						$stockStatus.removeClass('in-stock available-on-backorder out-of-stock');

						if ( 0 < variation.availability_html.search('available-on-backorder') ) {
							$stockStatus.addClass('available-on-backorder');
						} else if ( 0 < variation.availability_html.search('out-of-stock')) {
							$stockStatus.addClass('out-of-stock');
						} else {
							$stockStatus.addClass('in-stock');
						}

						$stockStatus.text( variation.availability_html.replace(/<\/?[^>]+(>|$)/g, '' ));
					} else {
						$stockStatus.attr( 'class', stockStatusClasses );
						$stockStatus.text( stockStatusOriginalText );
					}
				}
				if ( $sku.length ) {
					if ( variation.sku ) {
						$sku.text( variation.sku );
					} else {
						$sku.text( skuOriginalText );
					}
				}

				if ( $inputQty.length ) {
					$inputQty.val( originalQtyMin );

					$inputQty.attr('max', variation.max_qty).attr('min', variation.min_qty);
				}
			});

			$form.on('show_variation', function(event, variation, purchasable) {
				// Firefox fix after reload page.
				if ( $form.find('.wd-swatch').length && ! $form.find('.wd-swatch.wd-active').length ) {
					$form.find('select').each(function () {
						var $select = $(this);
						var value = $select.val();

						if ( ! value ) {
							return;
						}

						$select.siblings('.wd-swatches-product').find('.wd-swatch[data-value="' + value + '"]').addClass('wd-active');
					});
				}

				$form.addClass('variation-swatch-selected');
			});

			$form.on('woocommerce_update_variation_values', function() {
				resetSwatches($form);
			});

			$form.on('hide_variation', function() {
				$price.html(priceOriginalHtml);
				$button.find('span').text(originalBtnText);

				if ( $image.attr('src') !== originalSrc ){
					$image.attr('src', originalSrc);
					$image.attr('srcset', originalSrcSet);
					$image.attr('sizes', originalSizes);

					if ($source.length > 0 && $source.attr('srcset') !== originalSrcSet ) {
						$source.attr('srcset', originalSrcSet);
						$source.attr('image_sizes', originalSizes);
					}
				}

				if ( $stockStatus.length ) {
					$stockStatus.attr('class', stockStatusClasses);
					$stockStatus.text(stockStatusOriginalText);
				}
				if ( $sku.length ) {
					$sku.text(skuOriginalText);
				}
				if ( $inputQty.length ) {
					$inputQty.attr('max', originalQtyMax).attr('min', originalQtyMin);
				}
			});

			$form.on('click', '.reset_variations', function() {
				$form.find('.wd-active').removeClass('wd-active');
				$form.removeClass('wd-form-inited')

				$product.trigger( 'wdImagesGalleryInLoopOn', $product );
			});

			$form.on('reset_data', function() {
				var $this = $(this);
				var all_attributes_chosen = true;
				var some_attributes_chosen = false;

				$form.find('.variations select').each(function () {
					var value = $this.val() || '';

					if (value.length === 0) {
						all_attributes_chosen = false;
					} else {
						some_attributes_chosen = true;
					}
				});

				if (all_attributes_chosen) {
					$form.find('.wd-active').removeClass('wd-active');
				}

				$form.removeClass('variation-swatch-selected');

				resetSwatches($form);
			});

			$form.find('select.wd-changes-variation-image').on('change', function () {
				var $select = $(this);
				var attributeName = $select.attr('name');
				var attributeValue = $select.val();
				var productData = $form.data('product_variations');
				var changeImage = false;

				$form.find('select').each( function () {
					if ( ! $(this).val() ) {
						changeImage = true;
						return false;
					}
				});

				if ( ! changeImage || ! attributeValue || ! productData ) {
					return;
				}

				$.each( productData, function ( key, variation ) {
					if ( variation.attributes[attributeName] === attributeValue ) {
						setTimeout( function () {
							updateProductImage(variation);
						});

						return false;
					}
				});
			});

			$button.on('click', function(e) {
				var $formBtn = $form.find('.single_add_to_cart_button');

				if (!$(this).data('purchasable') || !$formBtn.length) {
					return;
				}

				e.preventDefault();

				if ( 'undefined' !== typeof wc_add_to_cart_variation_params && $formBtn.hasClass('disabled') ) {

					if ($formBtn.hasClass('wc-variation-is-unavailable') ) {
						alert( wc_add_to_cart_variation_params.i18n_unavailable_text );
					} else if ( $formBtn.hasClass('wc-variation-selection-needed') ) {
						alert( wc_add_to_cart_variation_params.i18n_make_a_selection_text );
					}

					return;
				}

				if ( $inputQty.length ) {
					var qty = $inputQty.val();

					if ( qty ) {
						$form.find('.single_variation_wrap .variations_button input[name=quantity]').val( qty );
					}
				}

				$form.trigger('submit');
				$button.addClass('loading');

				woodmartThemeModule.$body.one( 'added_to_cart not_added_to_cart', function() {
					$button.removeClass('loading');
				});

				woodmartThemeModule.$body.one('added_to_cart', function() {
					$button.addClass('added');
				});
			});

			function resetSwatches($variation_form) {
				if (!$variation_form.data('product_variations')) {
					return;
				}

				$button.find('span').text(originalBtnText);
				$button.data('purchasable', false);
				$product.removeClass('wd-variation-active');

				$variation_form.find('.variations select').each(function() {
					var select = $(this);
					var swatch = select.parent().find('.wd-swatches-product');
					var options = select.html();
					options = $(options);

					if ( select.val() ) {
						$button.find('span').text(addToCartText);
						$button.data('purchasable', true);
						$product.addClass('wd-variation-active');
					}

					swatch.find('.wd-swatch').removeClass('wd-enabled').addClass('wd-disabled');

					options.each(function() {
						var value = $(this).val();

						if ($(this).hasClass('enabled')) {
							swatch.find('div[data-value="' + value + '"]').removeClass('wd-disabled').addClass('wd-enabled');
						} else {
							swatch.find('div[data-value="' + value + '"]').addClass('wd-disabled').removeClass('wd-enabled');
						}
					});
				});
			}

			function updateProductImage( variation ) {
				if (variation.image) {
					if (variation.image.thumb_src && variation.image.thumb_src.length > 1) {
						$product.addClass('wd-loading-image');

						$image.attr('src', variation.image.thumb_src);

						if ( $image.attr('srcset') && ! variation.image.srcset ) {
							$image.attr('srcset', variation.image.thumb_src);
						}

						$image.one('load', function() {
							$product.removeClass('wd-loading-image');
						});
					}

					if (variation.image.srcset.length > 1) {
						$image.attr('srcset', variation.image.srcset);

						if ($source.length > 0) {
							$source.attr('srcset', variation.image.srcset);
						}
					}

					if (variation.image.sizes.length > 1) {
						$image.attr('sizes', variation.image.sizes);

						if ($source.length > 0) {
							$source.attr('image_sizes', variation.image.sizes);
						}
					}
				}
			}
		});

		function loadVariations($form) {
			if ( false !== $form.data('product_variations') ) {
				return;
			}

			$form.addClass('wd-loading');

			$.ajax({
				url     : woodmart_settings.ajaxurl,
				data    : {
					action: 'woodmart_load_available_variations',
					id    : $form.data('product_id')
				},
				method  : 'get',
				dataType: 'json',
				success : function(data) {
					if (data.length > 0) {
						$form.data('product_variations', data).trigger('reload_product_variations');
					}
				},
				complete: function() {
					$form.removeClass('wd-loading');
					var $selectVariation = $form.find('select.wd-changes-variation-image');

					if ( $selectVariation.length && $selectVariation.first().val().length ) {
						$selectVariation.first().trigger('change');
					}
				},
				error   : function() {
					console.log('ajax error');
				}
			});
		}
	};

	$(document).ready(function() {
		woodmartThemeModule.quickShopVariationForm();
	});
})(jQuery);

/* global woodmart_settings, woodmartThemeModule, jQuery */
(function($) {
	$.each([
		'frontend/element_ready/wd_products.default',
		'frontend/element_ready/wd_products_tabs.default'
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.quickViewInit();
		});
	});

	woodmartThemeModule.quickViewInit = function() {
		woodmartThemeModule.$document.on('click', '.open-quick-view', function(e) {
			e.preventDefault();

			if ($('.open-quick-view').hasClass('loading')) {
				return true;
			}

			var $this     = $(this),
			    productId = $this.data('id'),
			    loopName  = $this.data('loop-name'),
			    loop      = $this.data('loop'),
			    prev      = '',
			    next      = '',
			    loopBtns  = $('.quick-view').find('[data-loop-name="' + loopName + '"]');

			$this.addClass('loading');

			if (typeof loopBtns[loop - 1] != 'undefined') {
				prev = loopBtns.eq(loop - 1).addClass('quick-view-prev');
				prev = $('<div>').append(prev.clone()).html();
			}

			if (typeof loopBtns[loop + 1] != 'undefined') {
				next = loopBtns.eq(loop + 1).addClass('quick-view-next');
				next = $('<div>').append(next.clone()).html();
			}

			woodmartThemeModule.quickViewLoad(productId, $this, prev, next);
		});
	};

	woodmartThemeModule.quickViewLoad = function(id, btn) {
		var data = {
			id    : id,
			action: 'woodmart_quick_view'
		};

		if ('undefined' !== typeof btn.data('attribute')) {
			$.extend(data, btn.data('attribute'));
		}

		var initPopup = function(data) {
			var items = $(data);

			if ($.magnificPopup?.instance?.isOpen) {
				$.magnificPopup.instance.st.removalDelay = 0
				$.magnificPopup.close()
			}

			$.magnificPopup.open({
				items       : {
					src : items,
					type: 'inline'
				},
				closeMarkup    : woodmart_settings.close_markup,
				tLoading       : woodmart_settings.loading,
				removalDelay   : 600,
				fixedContentPos: true,
				callbacks      : {
					beforeOpen: function() {
						this.wrap.addClass('wd-popup-quick-view-wrap');
					},
					open      : function() {
						var $form = $(this.content[0]).find('.variations_form');

						$form.each(function() {
							$(this).wc_variation_form().find('.variations select:eq(0)').trigger('change');
						});

						$form.trigger('wc_variation_form');
						woodmartThemeModule.$body.trigger('woodmart-quick-view-displayed');
						woodmartThemeModule.$document.trigger('wdQuickViewOpen');
						setTimeout(function() {
							woodmartThemeModule.$document.trigger('wdQuickViewOpen300');
						}, 300);
					},
				}
			});
		};

		$.ajax({
			url     : woodmart_settings.ajaxurl,
			data    : data,
			method  : 'get',
			success : function(data) {
				woodmartThemeModule.removeDuplicatedStylesFromHTML(data, function(data){
					if (woodmart_settings.quickview_in_popup_fix) {
						$.magnificPopup.close();
						setTimeout(function() {
							initPopup(data);
						}, 500);
					} else {
						initPopup(data);
					}
				});
			},
			complete: function() {
				btn.removeClass('loading');
			}
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.quickViewInit();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdShopPageInit', function() {
		woodmartThemeModule.searchByFilters();
	});

	woodmartThemeModule.searchByFilters = function() {
		$('.wd-filter-search input').on('keyup', function() {
			var $this = $(this);
			var val = $this.val().toLowerCase();

			if (0 < val.length) {
				$this.parent().addClass('wd-active');
			} else {
				$this.parent().removeClass('wd-active');
			}

			$this.parents('.wd-filter-wrapper').find('ul > li').each(function() {
				var $this = $(this);
				var $data = $this.find('.wd-filter-lable').text().toLowerCase();

				if ($data.indexOf(val) > -1) {
					$this.show();
				} else {
					$this.hide();
				}
			});
		});

		$('.wd-filter-search-clear a').on('click', function (e) {
			e.preventDefault();

			var $this = $(this);

			$this.parents('.wd-filter-search').removeClass('wd-active');

			$this.parent().siblings('input').val('');

			$this.parents('.wd-filter-wrapper').find('ul li').each(function() {
				$(this).show();
			});
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.searchByFilters();
	});
})(jQuery);

/* global wd_settings */
(function($) {
	woodmartThemeModule.$document.on('wdFiltersOpened wdShopPageInit wdPjaxStart', function () {
		woodmartThemeModule.shopLoader();
	});

	woodmartThemeModule.shopLoader = function() {
		var loaderVerticalPosition = function() {
			var $products = $('.products[data-source="main_loop"], .wd-projects[data-source="main_loop"]');
			var $loader = $products.parent().find('.wd-sticky-loader');

			if ($products.length < 1) {
				return;
			}

			var offset = woodmartThemeModule.$window.height() / 2;
			var scrollTop = woodmartThemeModule.$window.scrollTop();
			var holderTop = $products.offset().top - offset + 45;
			var holderHeight = $products.height();
			var holderBottom = holderTop + holderHeight - 170;

			if (scrollTop < holderTop) {
				$loader.addClass('wd-position-top');
				$loader.removeClass('wd-position-stick');
			} else if (scrollTop > holderBottom) {
				$loader.addClass('wd-position-bottom');
				$loader.removeClass('wd-position-stick');
			} else {
				$loader.addClass('wd-position-stick');
				$loader.removeClass('wd-position-top wd-position-bottom');
			}
		};

		woodmartThemeModule.$window.off('scroll.loaderVerticalPosition');

		woodmartThemeModule.$window.on('scroll.loaderVerticalPosition', loaderVerticalPosition);
	};

	$(document).ready(function() {
		woodmartThemeModule.shopLoader();
	});
})(jQuery);
/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdProductsTabsLoaded wdSearchFullScreenContentLoaded wdShopPageInit wdRecentlyViewedProductLoaded', function () {
		woodmartThemeModule.shopMasonry();
	});

	$.each([
		'frontend/element_ready/wd_products.default',
		'frontend/element_ready/wd_product_categories.default',
		'frontend/element_ready/wd_products_tabs.default',
		'frontend/element_ready/wd_products_brands.default'
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.shopMasonry();
		});
	});

	woodmartThemeModule.shopMasonry = function() {
		if (typeof ($.fn.isotope) == 'undefined' || typeof ($.fn.packery) == 'undefined' || typeof ($.fn.imagesLoaded) == 'undefined') {
			return;
		}

		var $container = $('.wd-products.grid-masonry');
		$container.imagesLoaded(function() {
			$container.isotope({
				isOriginLeft: !woodmartThemeModule.$body.hasClass('rtl'),
				itemSelector: '.product-category.product, .wd-product, .wd-products > .element-title',
				masonry: {
					columnWidth: '.product-category.product, .wd-product'
				}
			});
		});

		woodmartThemeModule.$window.on('resize', function() {
			initMasonry();
		});

		initMasonry();

		function initMasonry() {
			var $catsContainer = $('.wd-cats-element .wd-masonry');
			$catsContainer.imagesLoaded(function() {
				$catsContainer.packery({
					resizable   : false,
					isOriginLeft: !woodmartThemeModule.$body.hasClass('rtl'),
					packery     : {
						gutter     : 0,
						columnWidth: '.product-category.product'
					},
					itemSelector: '.product-category.product'
				});
			});
		}
	};

	$(document).ready(function() {
		woodmartThemeModule.shopMasonry();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdShopPageInit', function () {
		woodmartThemeModule.shopPageInit();
	});

	woodmartThemeModule.shopPageInit = function() {
		woodmartThemeModule.clickOnScrollButton(woodmartThemeModule.shopLoadMoreBtn, false, woodmart_settings.infinit_scroll_offset);

		$('body > .tooltip').remove();

		woodmartThemeModule.$body.on('updated_wc_div', function() {
			woodmartThemeModule.$document.trigger('wood-images-loaded');
		});

		woodmartThemeModule.$document.trigger('resize.vcRowBehaviour');
	};
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.singleProductTabsAccordion = function() {
		var $wcTabs              = $('.woocommerce-tabs');
		var $wcTabItems          = $wcTabs.find('.wd-accordion-item .entry-content');
		var isProductTabsElement = $wcTabs.closest('.wd-single-tabs').length > 0;

		if ($wcTabs.length <= 0 || $wcTabs.data('layout') === 'accordion' || ( $('.wd-content-layout').hasClass('wd-builder-on') && ! isProductTabsElement ) ) {
			return;
		}

		if (woodmartThemeModule.$window.width() <= 1024) {
			if ( ! $wcTabs.hasClass('tabs-layout-accordion') ) {
				$wcTabs.removeClass('tabs-layout-tabs wc-tabs-wrapper').addClass('tabs-layout-accordion wd-accordion wd-style-default');
				$wcTabItems.addClass('wd-accordion-content wd-scroll').find('.wc-tab-inner').addClass('wd-scroll-content');
				$('.single-product-page').removeClass('tabs-type-tabs').addClass('tabs-type-accordion');
				if ($wcTabs.data('state') !== 'first' ) {
					setTimeout(function() {
						$wcTabItems.first().hide();
					}, 500);

					$wcTabItems.first().siblings('.wd-active').removeClass('wd-active');
				}
			}
		} else if ( ! $wcTabs.hasClass('tabs-layout-tabs') ) {
			$wcTabs.addClass('tabs-layout-tabs wc-tabs-wrapper').removeClass('tabs-layout-accordion wd-accordion wd-style-default');
			$wcTabItems.removeClass('wd-accordion-content wd-scroll').find('.wc-tab-inner').removeClass('wd-scroll-content');
			$('.single-product-page').addClass('tabs-type-tabs').removeClass('tabs-type-accordion');
			$wcTabs.find('.wd-nav a').first().trigger('click');
		}
	};

	woodmartThemeModule.$window.on('resize', woodmartThemeModule.debounce(function() {
		woodmartThemeModule.singleProductTabsAccordion();
		woodmartThemeModule.accordion();
		woodmartThemeModule.$document.trigger('resize.vcRowBehaviour');
	}, 300));

	$(document).ready(function() {
		woodmartThemeModule.singleProductTabsAccordion();
	});
})(jQuery);

window.jQuery.each([
	'frontend/element_ready/wd_single_product_tabs.default',
], function(index, value) {
	woodmartThemeModule.wdElementorAddAction(value, function() {
		jQuery.magnificPopup.close();

		woodmartThemeModule.singleProductTabsDescHidden();
	});
});

woodmartThemeModule.singleProductTabsDescHidden = function() {
	var hash       = window.location.hash;
	var url        = window.location.href;	
	var tabsTitles = document.querySelectorAll('.wd-hidden-tab-title');
	var tabReviews = document.querySelector('.tab-title-reviews');

	tabsTitles.forEach(function(tabsTitle) {
		var eventsWasAdded = false;

		jQuery(tabsTitle).magnificPopup({
			type           : 'inline',
			removalDelay   : 600,
			showCloseBtn   : false,
			tLoading       : woodmart_settings.loading,
			fixedContentPos: false,
			callbacks      : {
				open: function() {
					var mfpInstance     = this;
					var contentWrapper  = this.content[0];
					var	closeSideButton = contentWrapper.querySelector('.close-side-hidden');

					if ( ! contentWrapper.classList.contains('wd-opened') ) {
						setTimeout(function () {
							contentWrapper.classList.add('wd-opened');
							tabsTitle.classList.add('wd-active');

							window.dispatchEvent(new Event('wdOpenDescHiddenTab'));
						}, 10);
					}

					if ( ! eventsWasAdded ) {
						eventsWasAdded = true;
	
						if ( closeSideButton ) {
							closeSideButton.addEventListener('click', function(e) {
								e.preventDefault();
								mfpInstance.close();
							});
						}
					}
				},
				beforeClose: function() {
					var activeTab        = document.querySelector('.wd-hidden-tab-title.wd-active');
					var activeTabContent = document.querySelector('.wd-side-hidden.wd-opened');

					if (activeTab) {
						activeTab.classList.remove('wd-active');
					}

					if (activeTabContent) {
						activeTabContent.classList.remove('wd-opened');
					}
				},
			}
		});
	});

	if (tabReviews) {
		if (hash.toLowerCase().indexOf('comment-') >= 0 || hash === '#reviews' || hash === '#tab-reviews' || url.indexOf('comment-page-') > 0 || url.indexOf('cpage=') > 0) {
			tabReviews.click();
		}

		document.querySelectorAll('.woocommerce-review-link').forEach(function(reviewLink) {
			reviewLink.addEventListener('click', function () {
				tabReviews.click();
			});
		});
	}
}

window.addEventListener('load',function() {
	woodmartThemeModule.singleProductTabsDescHidden();
});

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdShopPageInit', function() {
		woodmartThemeModule.sortByWidget();
	});

	woodmartThemeModule.sortByWidget = function() {
		if (!woodmartThemeModule.$body.hasClass('woodmart-ajax-shop-on') || typeof ($.fn.pjax) == 'undefined') {
			return;
		}

		var $wcOrdering = $('.woocommerce-ordering');

		$wcOrdering.on('change', 'select.orderby', function() {
			var $form = $(this).closest('form');
			$form.find('[name="_pjax"]').remove();

			$.pjax({
				container: '.wd-page-content',
				timeout  : woodmart_settings.pjax_timeout,
				url      : '?' + $form.serialize(),
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
		});

		$wcOrdering.on('submit', function(e) {
			e.preventDefault(e);
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.sortByWidget();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.stickyAddToCart = function() {
		var $trigger = $('form.cart, .out-of-stock');
		var $stickyBtn = $('.wd-sticky-btn');

		if ($stickyBtn.length <= 0 || $trigger.length <= 0 || (woodmartThemeModule.$window.width() <= 768 && !woodmartThemeModule.$body.hasClass('wd-sticky-btn-on-mb'))) {
			return;
		}

		var quantityOverlap = function() {
			if (woodmartThemeModule.$window.width() <= 768 && woodmartThemeModule.$body.hasClass('wd-sticky-btn-on-mb')) {
				$stickyBtn.addClass('wd-quantity-overlap');
			} else {
				$stickyBtn.removeClass('wd-quantity-overlap');
			}
		};

		quantityOverlap();
		woodmartThemeModule.$window.on('resize', quantityOverlap);

		var summaryOffset = $trigger.offset().top + $trigger.outerHeight();
		var $scrollToTop = $('.scrollToTop');

		var stickyAddToCartToggle = function() {
			var windowScroll = woodmartThemeModule.$window.scrollTop();

			if (summaryOffset < windowScroll) {
				$stickyBtn.addClass('wd-sticky-btn-shown');
				$scrollToTop.addClass('wd-sticky-btn-shown');

			} else if (summaryOffset > windowScroll) {
				$stickyBtn.removeClass('wd-sticky-btn-shown');
				$scrollToTop.removeClass('wd-sticky-btn-shown');
			}
		};

		stickyAddToCartToggle();

		woodmartThemeModule.$window.on('scroll', stickyAddToCartToggle);

		$('.wd-sticky-add-to-cart, .wd-sticky-btn-cart > .wd-buy-now-btn').on('click', function(e) {
			e.preventDefault();

			var headerHeight = $('.whb-header .whb-row.whb-sticky-row').length > 0 ? $('.whb-header .whb-main-header').outerHeight() : 0;

			var $stickyHeader = $('.whb-sticky-header');
			var stickyHeaderHeight = $stickyHeader.length ? $stickyHeader.outerHeight() : headerHeight;

			var scrollTo = $('.summary-inner .variations_form, .wd-single-add-cart .variations_form').offset().top - stickyHeaderHeight - woodmart_settings.sticky_add_to_cart_offset;

			$('html, body').animate({
				scrollTop: scrollTo
			}, 800);
		});

		// Wishlist.
		$('.wd-sticky-btn .wd-wishlist-btn a').on('click', function(e) {
			if (!$(this).hasClass('added')) {
				e.preventDefault();
			}

			$('.summary-inner > .wd-wishlist-btn a').trigger('click');
		});

		woodmartThemeModule.$document.on('added_to_wishlist', function() {
			$('.wd-sticky-btn .wd-wishlist-btn a').addClass('added');
		});

		// Compare.
		$('.wd-sticky-btn .wd-compare-btn a').on('click', function(e) {
			if (!$(this).hasClass('added')) {
				e.preventDefault();
			}

			$('.summary-inner > .wd-compare-btn a').trigger('click');
		});

		woodmartThemeModule.$document.on('added_to_compare', function() {
			$('.wd-sticky-btn .wd-compare-btn a').addClass('added');
		});

		// Quantity.
		$('.wd-sticky-btn-cart .qty').on('change', function() {
			$('.summary-inner .qty').val($(this).val());
		});

		$('.summary-inner .qty').on('change', function() {
			$('.wd-sticky-btn-cart .qty').val($(this).val());
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.stickyAddToCart();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdHeaderBuilderInited', function () {
		woodmartThemeModule.stickyDetails();
	});

	woodmartThemeModule.stickyDetails = function() {
		if (!$('.single-product-page').hasClass('wd-sticky-on') || woodmartThemeModule.$window.width() <= 1024) {
			return;
		}

		var details = $('.entry-summary');

		details.each(function() {
			var $column = $(this),
			    offset  = parseInt(woodmart_settings.sticky_product_details_offset),
			    $inner  = $column.find('.summary-inner'),
			    $images = $column.parent().find('.woocommerce-product-gallery');

			$inner.trigger('sticky_kit:detach');
			$images.trigger('sticky_kit:detach');

			$images.imagesLoaded(function() {
				var diff = $inner.outerHeight() - $images.outerHeight();
				var defaultDiff = parseInt(woodmart_settings.sticky_product_details_different);

				if (diff < -defaultDiff) {
					$inner.stick_in_parent({
						offset_top: offset
					});
				} else if (diff > defaultDiff) {
					$images.stick_in_parent({
						offset_top: offset
					});
				}

				woodmartThemeModule.$window.on('resize', woodmartThemeModule.debounce(function() {
					if (woodmartThemeModule.$window.width() <= 1024) {
						$inner.trigger('sticky_kit:detach');
						$images.trigger('sticky_kit:detach');
					} else if ($inner.outerHeight() < $images.outerHeight()) {
						$inner.stick_in_parent({
							offset_top: offset
						});
					} else {
						$images.stick_in_parent({
							offset_top: offset
						});
					}
				}, 300));
			});
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.stickyDetails();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdShopPageInit', function () {
		woodmartThemeModule.stickySidebarBtn();
	});

	woodmartThemeModule.stickySidebarBtn = function() {
		var $trigger = $('.wd-show-sidebar-btn,.wd-off-canvas-btn');
		var $stickyBtn = $('.wd-sidebar-opener.wd-show-on-scroll');

		if ($stickyBtn.length <= 0 || $trigger.length <= 0) {
			return;
		}

		var stickySidebarBtnToggle = function() {
			var btnOffset = $trigger.offset().top + $trigger.outerHeight();
			var windowScroll = woodmartThemeModule.$window.scrollTop();

			if (btnOffset < windowScroll) {
				$stickyBtn.addClass('wd-shown');
			} else {
				$stickyBtn.removeClass('wd-shown');
			}
		};

		stickySidebarBtnToggle();

		woodmartThemeModule.$window.on('scroll', stickySidebarBtnToggle);
		woodmartThemeModule.$window.on('resize', stickySidebarBtnToggle);
	};

	$(document).ready(function() {
		woodmartThemeModule.stickySidebarBtn();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdShopPageInit wdArrowsLoadProducts wdLoadMoreLoadProducts wdProductsTabsLoaded wdSearchFullScreenContentLoaded wdRecentlyViewedProductLoaded wdQuickViewOpen', function () {
		woodmartThemeModule.swatchesLimit();
	});

	woodmartThemeModule.swatchesLimit = function() {
		$('.wd-swatch-divider, .wd-product .wd-swatches-product:not(.wd-all-shown) .wd-swatch').on('click', function() {
			var $this = $(this).parent();

			if ( $this.parents('.wd-swatches-single').length || $this.hasClass('wd-swatches-single') ) {
				var $form = $this.parents('.variations_form');

				$form.find('.wd-swatches-single').removeClass('wd-swatches-limited').addClass('wd-all-shown');
				$form.find('.wd-swatch').removeClass('wd-hidden');
			} else {
				$this.addClass('wd-all-shown');
				$this.find('.wd-swatch').removeClass('wd-hidden');
			}

			if ( $this.parents('.wd-products.grid-masonry').length && 'undefined' !== typeof ($.fn.isotope) ) {
				$this.parents('.wd-products.grid-masonry').isotope('layout');
			}

			woodmartThemeModule.$document.trigger('wood-images-loaded');
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.swatchesLimit();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	$.each([
		'frontend/element_ready/wd_products.default',
		'frontend/element_ready/wd_products_tabs.default'
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.swatchesOnGrid();
		});
	});

	woodmartThemeModule.swatchesOnGrid = function() {
		woodmartThemeModule.$body.on('click', '.wd-swatches-grid .wd-swatch', function() {
			var src, srcset, image_sizes;

			var $this       = $(this),
			    imageSrc    = $this.data('image-src'),
			    imageSrcset = $this.data('image-srcset'),
			    imageSizes  = $this.data('image-sizes');

			if (typeof imageSrc == 'undefined' || '' === imageSrc) {
				return;
			}

			var product    = $this.parents('.wd-product'),
			    image      = product.find('.product-image-link > img, .product-image-link > picture > img'),
			    source     = product.find('.product-image-link picture source'),
			    srcOrig    = image.data('original-src'),
			    srcsetOrig = image.data('original-srcset'),
			    sizesOrig  = image.data('original-sizes');

			if (typeof srcOrig == 'undefined') {
				image.data('original-src', image.attr('src'));
			}

			if (typeof srcsetOrig == 'undefined') {
				image.data('original-srcset', image.attr('srcset'));
			}

			if (typeof sizesOrig == 'undefined') {
				image.data('original-sizes', image.attr('sizes'));
			}

			if ($this.hasClass('wd-active')) {
				src = srcOrig;
				srcset = srcsetOrig;
				image_sizes = sizesOrig;
				$this.removeClass('wd-active');
				product.removeClass('product-swatched');

				product.trigger( 'wdImagesGalleryInLoopOn', product );
			} else {
				$this.parent().find('.wd-active').removeClass('wd-active');
				$this.addClass('wd-active');
				product.addClass('product-swatched');
				src = imageSrc;
				srcset = imageSrcset;
				image_sizes = imageSizes;

				product.trigger( 'wdImagesGalleryInLoopOff', product );
			}

			if (image.attr('src') === src) {
				return;
			}

			product.addClass('wd-loading-image');

			image.attr('src', src).attr('srcset', srcset).attr('image_sizes', image_sizes).one('load', function() {
				product.removeClass('wd-loading-image');
			});

			if (source.length > 0) {
				source.attr('srcset', srcset).attr('image_sizes', image_sizes);
			}
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.swatchesOnGrid();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdQuickShopSuccess wdQuickViewOpen wdUpdateWishlist', function() {
		woodmartThemeModule.swatchesVariations();
	});

	$.each([
		'frontend/element_ready/wd_single_product_add_to_cart.default'
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function($wrapper) {
			$wrapper.find('.variations_form').each(function() {
				$(this).wc_variation_form();
			});

			woodmartThemeModule.swatchesVariations();
		});
	});

	woodmartThemeModule.swatchesVariations = function() {
		var $variation_forms = $('.variations_form');
		var variationGalleryReplace = false;
		var variationData = $variation_forms.data('product_variations');
		var useAjax = false === variationData;
		var defaultMainImageAttr = [];

		// Firefox mobile fix
		$('.variations_form .label').on('click', function(e) {
			if ($(this).siblings('.value').hasClass('with-swatches')) {
				e.preventDefault();
			}
		});

		$variation_forms.each(function() {
			var $variation_form = $(this);

			if ($variation_form.data('swatches') || $variation_form.hasClass('wd-quick-shop-2')) {
				return;
			}

			$variation_form.data('swatches', true);

			if (!$variation_form.data('product_variations')) {
				$variation_form.find('.wd-swatches-product').find('> .wd-swatch').addClass('wd-enabled');
			}

			if ($('.wd-swatches-product > div').hasClass('wd-active')) {
				$variation_form.addClass('variation-swatch-selected');

				showWCVariationContent($variation_form);
			}

			var $selectChangesVariation = $variation_form.find('select.wd-changes-variation-image');

			$selectChangesVariation.on('change', function () {
				var $select = $(this);
				var attributeName = $select.attr('name');
				var attributeValue = $select.val();
				var productData = $variation_form.data('product_variations');
				var changeImage = false;

				$variation_form.find('select').each( function () {
					if ( ! $(this).val() ) {
						changeImage = true;
						return false;
					}
				});

				if ( ! changeImage || ! attributeValue || ! productData ) {
					return;
				}

				var $pageWrapper = $variation_form.parents('.product, .wd-page-content');
				var $firstThumb = $pageWrapper.find('.wd-gallery-thumb .wd-carousel-item img').first();
				var $firstMainImg = $pageWrapper.find('.wd-gallery-images .wd-carousel-item img').first();
				var $mainImage = $pageWrapper.find('.woocommerce-product-gallery .woocommerce-product-gallery__image > a .wp-post-image').first();

				if ( 'undefined' === typeof defaultMainImageAttr['src'] ) {
					defaultMainImageAttr['src'] = $firstMainImg.attr('src');
					defaultMainImageAttr['srcset'] = $firstMainImg.attr('srcset');
					defaultMainImageAttr['size'] = $firstMainImg.attr('srcset');
				}

				$.each( productData, function ( key, variation ) {
					if ( variation.attributes[attributeName] === attributeValue ) {
						setTimeout( function () {
							$variation_form.wc_variations_image_update(variation);

							if ( ! replaceMainGallery( variation.variation_id, $variation_form ) && ( $firstThumb.attr('src') !== variation.image.thumb_src || $firstThumb.attr('srcset') !== variation.image.thumb_src ) ) {
								$firstThumb = $pageWrapper.find('.wd-gallery-thumb .wd-carousel-item img').first();

								$firstThumb.wc_set_variation_attr( 'src', variation.image.src );
								$firstThumb.wc_set_variation_attr( 'srcset', variation.image.src );

								$mainImage.attr( 'data-o_src', variation.image.src );
								$mainImage.attr( 'data-o_srcset', variation.image.src );

								if ( $firstThumb.siblings('source').length ) {
									$firstThumb.siblings('source').attr( 'srcset', variation.image.src );
								}

								woodmartThemeModule.$document.trigger('wdResetVariation');
							}
						});

						return false;
					}
				});
			});

			if ( $selectChangesVariation.val() ) {
				$selectChangesVariation.trigger('change');
			}

			$variation_form
				.on('click keydown', '.wd-swatches-single > .wd-swatch', function(event) {
					var $this = $(this);

					if (event.type === 'keydown') {
						if (event.key === 'Enter' || event.key === ' ') {
							event.preventDefault();
							$(this).trigger('click');
						}

						return;
					}

					var value = $this.data('value');
					var id = $this.parent().data('id');

					resetSwatches($variation_form);

					if ( $this.parents('.wd-swatches-limited').length ) {
						$this.parents('.wd-swatches-limited').find('.wd-swatch-divider').trigger('click');
					}

					if ($this.hasClass('wd-active') || $this.hasClass('wd-disabled')) {
						return;
					}

					var $select = $variation_form.find('select#' + CSS.escape(id));
					$select.val(value).trigger('change');
					$this.parent().find('.wd-active').removeClass('wd-active');
					$this.addClass('wd-active');
					resetSwatches($variation_form);

					showSelectedAttr();
				})
				.on('woocommerce_update_variation_values', function() {
					showSelectedAttr();

					resetSwatches($variation_form);
				})
				.on('click', '.reset_variations', function() {
					$variation_form.find('.wd-active').removeClass('wd-active');

					if ((woodmart_settings.swatches_labels_name === 'yes' && woodmartThemeModule.$window.width() >= 769) || woodmartThemeModule.$window.width() <= 768) {
						$variation_form.find('.wd-attr-selected').html('');
					}
				})
				.on('reset_data', function() {
					var $this = $(this);
					var all_attributes_chosen = true;
					var some_attributes_chosen = false;
					var replaceGallery = true;

					$variation_form.find('.variations select').each(function() {
						var $select = $(this);
						var value = $this.val() || '';

						if (value.length === 0) {
							all_attributes_chosen = false;
						} else {
							some_attributes_chosen = true;
						}

						if ( $select.has('wd-changes-variation-image') && $select.val() ) {
							replaceGallery = false;
						}
					});

					if (all_attributes_chosen) {
						$this.parent().find('.wd-active').removeClass('wd-active');
					}

					$variation_form.removeClass('variation-swatch-selected');
					$variation_form.find('.woocommerce-variation').removeClass('wd-show');

					var mainGallery = document.querySelector('.woocommerce-product-gallery__wrapper.wd-carousel');

					resetSwatches($variation_form);

					if ( replaceGallery ) {
						replaceMainGallery('default', $variation_form);
					}

					if ( mainGallery && 'undefined' !== typeof mainGallery.swiper ) {
						if (woodmart_settings.product_slider_auto_height === 'yes') {
							mainGallery.swiper.update();
						}

						mainGallery.swiper.slideTo(0);
					}

					woodmartThemeModule.$document.trigger('wdResetVariation');
				})
				.on('found_variation', function(event, variation) {
					if (useAjax) {
						replaceMainGallery(variation.variation_id, $variation_form, variation);
					}

					if ( 'undefined' === typeof variation || ! variation.image.src) {
						return;
					}

					var $pageWrapper = $variation_form.parents('.product, .wd-page-content');
					var galleryHasImage = $pageWrapper.find('.wd-gallery-thumb .wd-carousel-item img[data-o_src="' + variation.image.thumb_src + '"]').length > 0;
					var $firstThumb = $pageWrapper.find('.wd-gallery-thumb .wd-carousel-item img, .quick-view-gallery.wd-carousel .wd-carousel-item img').first();
					var $sourceThumb = $firstThumb.siblings('source');
					var originalImageUrl = $pageWrapper.find('.woocommerce-product-gallery .woocommerce-product-gallery__image > a').first().data('o_href');

					if (galleryHasImage) {
						$firstThumb.wc_reset_variation_attr('src');
					}

					if (!isQuickShop($variation_form) && !replaceMainGallery(variation.variation_id, $variation_form)) {
						if ($firstThumb.attr('src') !== variation.image.thumb_src) {
							$firstThumb.wc_set_variation_attr('src', variation.image.src);

							if ( variation.image.srcset.length ) {
								$firstThumb.wc_set_variation_attr('srcset', variation.image.srcset);
							}

							if ( $sourceThumb.length ) {
								if ( variation.image.srcset.length ) {
									$sourceThumb.wc_set_variation_attr('srcset', variation.image.srcset);
								} else {
									$sourceThumb.wc_set_variation_attr('srcset', variation.image.src);
								}
							}
						}

						woodmartThemeModule.$document.trigger('wdShowVariationNotQuickView');
					}

					showWCVariationContent($variation_form);

					if (!isQuickShop($variation_form) && !isQuickView() && originalImageUrl !== variation.image.full_src) {
						scrollToTop();
					}

					var mainGallery = document.querySelector('.woocommerce-product-gallery__wrapper');

					if (!mainGallery) {
						return;
					}

					if (mainGallery.classList.contains('wd-carousel') && 'undefined' !== typeof mainGallery.swiper) {
						mainGallery.swiper.update();
						mainGallery.swiper.slideTo(0);
					}

					if ( 'undefined' !== typeof defaultMainImageAttr['src'] ) {
						var $mainImage = $pageWrapper.find('.woocommerce-product-gallery .woocommerce-product-gallery__image > a .wp-post-image').first();
						var defaultMainImageSrc = defaultMainImageAttr['src'];
						var defaultMainImageSrcset = defaultMainImageSrc;

						if ( defaultMainImageSrc !== $mainImage.attr( 'data-o_src' ) ) {
							if ( 'undefined' !== typeof defaultMainImageAttr['srcset'] ) {
								defaultMainImageSrcset = defaultMainImageAttr['srcset'];
							}

							if ( 'undefined' !== typeof defaultMainImageAttr['size'] ) {
								$mainImage.attr( 'data-o_size', defaultMainImageAttr['size'] );
							}

							$mainImage.attr( 'data-o_src', defaultMainImageSrc );
							$mainImage.attr( 'data-o_srcset', defaultMainImageSrcset );
						}
					}
				})
				.on('reset_image', function() {
					var $thumb = $('.wd-gallery-thumb .wd-carousel-item img').first();

					if (!isQuickView() && !isQuickShop($variation_form)) {
						$thumb.wc_reset_variation_attr('src');
						$thumb.wc_reset_variation_attr('srcset');

						var $sourceThumb = $thumb.siblings('source');

						if ($sourceThumb.length) {
							$sourceThumb.wc_reset_variation_attr('srcset');
						}

						if ( ! $thumb.attr('data-o_srcset') && $thumb.attr('data-srcset') ) {
							$thumb.attr('data-srcset', null)
						}
					}
				})
				.on('show_variation', function(e, variation) {
					// Firefox fix after reload page.
					if ( $variation_form.find('.wd-swatch').length && ! $variation_form.find('.wd-swatch.wd-active').length ) {
						$variation_form.find('select').each(function () {
							var $select = $(this);
							var value = $select.val();

							if ( ! value ) {
								return;
							}

							$select.siblings('.wd-swatches-product').find('.wd-swatch[data-value="' + value + '"]').addClass('wd-active');
						});
					}

					showSelectedAttr();

					$variation_form.addClass('variation-swatch-selected');
				});
		});

		var resetSwatches = function($variation_form) {
			// If using AJAX
			if (!$variation_form.data('product_variations')) {
				return;
			}

			$variation_form.find('.variations select').each(function() {
				var select = $(this);
				var swatch = select.parent().find('.wd-swatches-product');
				var options = select.html();
				options = $(options);

				swatch.find('.wd-swatch').removeClass('wd-enabled').addClass('wd-disabled');

				options.each(function() {
					var value = $(this).val();

					if ($(this).hasClass('enabled')) {
						swatch.find('div[data-value="' + value + '"]').removeClass('wd-disabled').addClass('wd-enabled');
					} else {
						swatch.find('div[data-value="' + value + '"]').addClass('wd-disabled').removeClass('wd-enabled');
					}
				});
			});
		};

		var isQuickView = function() {
			return $('.single-product-content').hasClass('product-quick-view');
		};

		var isQuickShop = function($form) {
			return $form.parent().hasClass('quick-shop-form');
		};

		var isVariationGallery = function(key, $variationForm) {
			if ('old' === woodmart_settings.variation_gallery_storage_method) {
				return isVariationGalleryOld(key);
			} else {
				return isVariationGalleryNew(key, $variationForm);
			}
		};

		var isVariationGalleryOld = function(key) {
			if (typeof woodmart_variation_gallery_data === 'undefined' && typeof woodmart_qv_variation_gallery_data === 'undefined') {
				return;
			}

			var variation_gallery_data = isQuickView() ? woodmart_qv_variation_gallery_data : woodmart_variation_gallery_data;

			return typeof variation_gallery_data !== 'undefined' && variation_gallery_data && variation_gallery_data[key];
		};

		var isVariationGalleryNew = function(key, $variationForm) {
			var data = getAdditionalVariationsImagesData($variationForm);

			return typeof data !== 'undefined' && data && data[key] && data[key].length > 1 || 'default' === key;
		};

		var isVariationGalleryAjax = function(key, data) {
			return typeof data !== 'undefined' && data && data.additional_variation_images && data.additional_variation_images.length > 1 || 'default' === key;
		};

		var scrollToTop = function() {
			if (0 === $('.woocommerce-product-gallery__wrapper').length) {
				return;
			}

			if ((woodmart_settings.swatches_scroll_top_desktop === 'yes' && woodmartThemeModule.$window.width() >= 1024) || (woodmart_settings.swatches_scroll_top_mobile === 'yes' && woodmartThemeModule.$window.width() <= 1024)) {
				var $page = $('html, body');

				$page.stop(true);

				$page.animate({
					scrollTop: $('.woocommerce-product-gallery__wrapper').offset().top - 150
				}, 800);

				if ( 'undefined' !== typeof ($.fn.tooltip) ) {
					$('.wd-swatch').tooltip('hide');
				}
			}
		};

		var getAdditionalVariationsImagesData = function($variationForm, ajaxData) {
			if (ajaxData === undefined) {
				ajaxData = false;
			}

			var rawData = $variationForm.data('product_variations');

			if (ajaxData) {
				rawData = ajaxData;
			}

			if (!rawData) {
				rawData = $variationForm.data('wd_product_variations');
			}

			var data = [];

			if (!rawData) {
				return data;
			}

			if (typeof rawData === 'object' && !Array.isArray(rawData)) {
				data[rawData.variation_id] = rawData.additional_variation_images;
				data['default'] = rawData.additional_variation_images_default;
				$variationForm.data('wd_product_variations', JSON.stringify(
					[
						{
							additional_variation_images_default: rawData.additional_variation_images_default
						}
					]));
			} else {
				if (typeof rawData === 'string') {
					rawData = JSON.parse(rawData);
				}

				rawData.forEach(function(value) {
					data[value.variation_id] = value.additional_variation_images;
					data['default'] = value.additional_variation_images_default;
				});
			}

			return data;
		};

		var replaceMainGallery = function(key, $variationForm, ajaxData) {
			if (ajaxData === undefined) {
				ajaxData = false;
			}

			if ('old' === woodmart_settings.variation_gallery_storage_method) {
				if (!isVariationGallery(key, $variationForm) || isQuickShop($variationForm) || ('default' === key && !variationGalleryReplace)) {
					return false;
				}

				replaceMainGalleryOld(key, $variationForm);
			} else {
				if ((!isVariationGallery(key, $variationForm) && !ajaxData) || (ajaxData && !isVariationGalleryAjax(key, ajaxData)) || isQuickShop($variationForm) || ('default' === key && !variationGalleryReplace)) {
					return false;
				}

				var data = getAdditionalVariationsImagesData($variationForm, ajaxData);

				replaceMainGalleryNew(data[key], $variationForm, key);
			}

			$('.woocommerce-product-gallery__image').trigger('zoom.destroy');
			woodmartThemeModule.$document.trigger('wdReplaceMainGallery');
			if (!isQuickView()) {
				woodmartThemeModule.$document.trigger('wdReplaceMainGalleryNotQuickView');
			}

			variationGalleryReplace = 'default' !== key;

			woodmartThemeModule.$window.trigger('resize');

			return true;
		};

		var replaceMainGalleryOld = function(key, $variationForm) {
			var variation_gallery_data = isQuickView() ? woodmart_qv_variation_gallery_data : woodmart_variation_gallery_data;
			var imagesData = variation_gallery_data[key];
			var $pageWrapper = $variationForm.parents('.product, .wd-page-content');
			var $mainGallery = $pageWrapper.find('.woocommerce-product-gallery__wrapper');

			if ($mainGallery.hasClass('wd-carousel')) {
				$mainGallery = $mainGallery.find('.wd-carousel-wrap');
			}

			if (imagesData && imagesData.length > 1) {
				$pageWrapper.find('.woocommerce-product-gallery').addClass('wd-has-thumb');
			} else {
				$pageWrapper.find('.woocommerce-product-gallery').removeClass('wd-has-thumb');
			}

			$mainGallery.empty();

			for (var index = 0; index < imagesData.length; index++) {
				var classes = '';

				if ( !isQuickView() && 'default' === key && 'undefined' !== typeof imagesData[index].video && 'undefined' !== typeof imagesData[index].video.classes ) {
					classes += imagesData[index].video.classes;
				}

				var $html = '<div class="wd-carousel-item' + classes + '">';

				$html += '<figure data-thumb="' + imagesData[index].data_thumb + '" class="woocommerce-product-gallery__image">';

				if ( !isQuickView() && 'default' === key && 'undefined' !== typeof imagesData[index].video && 'undefined' !== typeof imagesData[index].video.controls ) {
					$html += imagesData[index].video.controls;
				}

				if (!isQuickView()) {
					$html += '<a href="' + imagesData[index].href + '">';
				}

				$html += imagesData[index].image;

				if (!isQuickView()) {
					$html += '</a>';
				}

				if ( !isQuickView() && 'default' === key && 'undefined' !== typeof imagesData[index].video && 'undefined' !== typeof imagesData[index].video.content ) {
					$html += imagesData[index].video.content;
				}

				$html += '</figure></div>';

				$mainGallery.append($html);
			}
		};

		var replaceMainGalleryNew = function(imagesData, $variationForm, galleryType = '') {
			var $pageWrapper = $variationForm.parents('.product, .wd-page-content');
			var $mainGallery = $pageWrapper.find('.woocommerce-product-gallery__wrapper');

			if ($mainGallery.hasClass('wd-carousel')) {
				$mainGallery = $mainGallery.find('.wd-carousel-wrap');
			}

			$mainGallery.empty();

			if (imagesData && imagesData.length > 1) {
				$pageWrapper.find('.woocommerce-product-gallery').addClass('wd-has-thumb');
			} else {
				$pageWrapper.find('.woocommerce-product-gallery').removeClass('wd-has-thumb');
			}

			for (var key in imagesData) {
				if (imagesData.hasOwnProperty(key)) {
					var classes = '';

					if ( !isQuickView() && 'default' === galleryType && 'undefined' !== typeof imagesData[key].video && 'undefined' !== typeof imagesData[key].video.classes ) {
						classes += imagesData[key].video.classes;
					}

					var $html = '<div class="wd-carousel-item' + classes + '">';

					if ( !isQuickView() && 'default' === galleryType && 'undefined' !== typeof imagesData[key].video && 'undefined' !== typeof imagesData[key].video.controls ) {
						$html += imagesData[key].video.controls;
					}

					$html += '<figure class="woocommerce-product-gallery__image" data-thumb="' + imagesData[key].thumbnail_src + '">';

					if (!isQuickView()) {
						$html += '<a href="' + imagesData[key].full_src + '" data-elementor-open-lightbox="no">';
					}

					var srcset = imagesData[key].srcset ? 'srcset="' + imagesData[key].srcset + '"' : '';

					$html += '<img width="' + imagesData[key].width + '" height="' + imagesData[key].height + '" src="' + imagesData[key].src + '" class="' + imagesData[key].class + '" alt="' + imagesData[key].alt + '" title="' + imagesData[key].title + '" data-caption="' + imagesData[key].data_caption + '" data-src="' + imagesData[key].data_src + '"  data-large_image="' + imagesData[key].data_large_image + '" data-large_image_width="' + imagesData[key].data_large_image_width + '" data-large_image_height="' + imagesData[key].data_large_image_height + '" ' + srcset + ' sizes="' + imagesData[key].sizes + '" />';

					if (!isQuickView()) {
						$html += '</a>';
					}

					if ( !isQuickView() && 'default' === galleryType && 'undefined' !== typeof imagesData[key].video && 'undefined' !== typeof imagesData[key].video.content ) {
						$html += imagesData[key].video.content;
					}

					$html += '</figure></div>';

					$mainGallery.append($html);
				}
			}
		};

		function showWCVariationContent( $variation_form ) {
			var $wrapper = $variation_form.find('.woocommerce-variation');
			var $showWrapper = false;

			if ( ! $wrapper.length ) {
				return;
			}

			$wrapper.find('> *').each( function () {
				if ( ! $(this).is(':empty') ) {
					$showWrapper = true;
				}
			});

			if ( $showWrapper ) {
				$wrapper.addClass('wd-show');
			}
		};

		function showSelectedAttr () {
			var swathesSelected = false;

			$('.variations_form').each(function() {
				var $variation_form = $(this);

				if (((woodmart_settings.swatches_labels_name === 'yes' && woodmartThemeModule.$window.width() >= 769) || woodmartThemeModule.$window.width() <= 768) && !swathesSelected) {
					$variation_form.find('.wd-active').each(function() {
						var $this = $(this);
						var title = $this.find('.wd-swatch-text').text();
						var wrapAttr = $this.parents('tr').find('.wd-attr-selected');

						if ( wrapAttr.length ) {
							wrapAttr.html(title);
						} else {
							$this.parents('tr').find(' > th').append(
								'<span class="wd-attr-selected">' + title + '</span>'
							);
						}
					});

					swathesSelected = true;
				}
			});
		}
	};

	$(document).ready(function() {
		woodmartThemeModule.swatchesVariations();
	});
})(jQuery);

/* global woodmart_settings */

woodmartThemeModule.trackProductViewed = function() {
	if ('visible' !== document.visibilityState) {
		return;
	}

	var singleProduct = document.querySelector('.single-product-page');
	var cookiesName = 'woodmart_recently_viewed_products';

	if ( ! singleProduct || 'undefined' === typeof Cookies ) {
		return;
	}

	var singleProductID = singleProduct.id.replace('product-', '');
	var recentlyProduct = Cookies.get(cookiesName);

	if ( ! recentlyProduct ) {
		recentlyProduct = singleProductID;
	} else {
		recentlyProduct = recentlyProduct.split('|');

		var existingIndex = recentlyProduct.indexOf(singleProductID);
		if (existingIndex !== -1) {
			recentlyProduct.splice(existingIndex, 1);
		}

		recentlyProduct.unshift(singleProductID);

		recentlyProduct = recentlyProduct.join('|');
	}

	Cookies.set(cookiesName, recentlyProduct, {
		expires: 7,
		path   : woodmart_settings.cookie_path,
		secure : woodmart_settings.cookie_secure_param
	});
};

window.addEventListener('load',function() {
	woodmartThemeModule.trackProductViewed();
});

woodmartThemeModule.updateAjaxDeliveryDates = function () {
	var deliveryDates = document.querySelector('.wd-est-del');

	if (! deliveryDates) {
		return;
	}

	jQuery.ajax({
		url     : woodmart_settings.ajaxurl,
		data    : {
			action     : 'woodmart_update_delivery_dates',
			product_id : deliveryDates.dataset.productId,
		},
		dataType: 'json',
		method  : 'GET',
		success : function(response) {
			if ( response.hasOwnProperty('fragments') ) {
				Object.keys(response.fragments).forEach(function(selector) {
					var value = response.fragments[selector];

					document.querySelectorAll(selector).forEach(function(node) {
						node.innerHTML = value;

						if (value) {
							node.parentNode.classList.remove('wd-hide');
						} else {
							node.parentNode.classList.add('wd-hide');
						}
					});
				});
			}
		},
		error   : function() {
			console.error('Something wrong with AJAX response. Probably some PHP conflict.');
		},
		complete: function() {
			deliveryDates.classList.add('wd-loaded');
		}
	});
}

window.addEventListener('load', function() {
	woodmartThemeModule.updateAjaxDeliveryDates();
});

(function($) {
	// WooCommerce update fragments fix.
	$(document).ready(function() {
		$('body').on('added_to_cart removed_from_cart', function(e, fragments) {
			if (fragments) {
				$.each(fragments, function(key, value) {
					$(key.replace('_wd', '')).replaceWith(value);
				});
			}
		});
	});

	$('body').on('wc_fragments_refreshed wc_fragments_loaded', function() {
		if (typeof wd_cart_fragments_params !== 'undefined' && 'undefined' !== typeof Cookies) {
			var wc_fragments  = JSON.parse(sessionStorage.getItem(wd_cart_fragments_params.fragment_name)),
			    cart_hash_key = wd_cart_fragments_params.cart_hash_key,
			    cart_hash     = sessionStorage.getItem(cart_hash_key),
			    cookie_hash   = Cookies.get('woocommerce_cart_hash'),
			    cart_created  = sessionStorage.getItem('wc_cart_created'),
			    day_in_ms    = ( 24 * 60 * 60 * 1000 );

			if (cart_hash === null || cart_hash === undefined || cart_hash === '') {
				cart_hash = '';
			}

			if (cookie_hash === null || cookie_hash === undefined || cookie_hash === '') {
				cookie_hash = '';
			}

			if (cart_hash && (cart_created === null || cart_created === undefined || cart_created === '')) {
				throw 'No cart_created';
			}

			if (cart_created) {
				var cart_expiration = ((1 * cart_created) + day_in_ms),
				    timestamp_now   = (new Date()).getTime();
				if (cart_expiration < timestamp_now) {
					throw 'Fragment expired';
				}
			}

			if (wc_fragments && wc_fragments['div.widget_shopping_cart_content'] && cart_hash === cookie_hash) {
				$.each(wc_fragments, function(key, value) {
					$(key.replace('_wd', '')).replaceWith(value);
				});
			}
		}
	});
})(jQuery);
/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdQuickViewOpen', function () {
		woodmartThemeModule.variationsPrice();
	});

	$.each([
		'frontend/element_ready/wd_single_product_add_to_cart.default',
	], function(index, value) {
		woodmartThemeModule.wdElementorAddAction(value, function() {
			woodmartThemeModule.variationsPrice();
		});
	});

	woodmartThemeModule.variationsPrice = function() {
		if ('no' === woodmart_settings.single_product_variations_price) {
			return;
		}

		$('.variations_form').each(function() {
			var $form = $(this);
			var $price = $form.parent().find('> .price, > div > .price, > .price > .price');
			var isQuickView = $form.parents('.product-quick-view').length;

			if ( $('.wd-content-layout').hasClass('wd-builder-on') && ! isQuickView ) {
				$price = $form.parents('.single-product-page').find('.wd-single-price .price');
			}

			var priceOriginalHtml = $price.html();

			$form.on('show_variation', function(e, variation) {
				if (variation.price_html.length > 1) {
					$price.html(variation.price_html);
				}
			});

			$form.on('click', '.reset_variations', function() {
				$price.html(priceOriginalHtml);
			});
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.variationsPrice();
	});
})(jQuery);

/* global wtl_form_data */
woodmartThemeModule.waitlistSubscribeForm = function() {
	function init() {
		if ('undefined' === typeof wtl_form_data) { // Disable script on Elementor edit mode.
			return;
		}

		var parentProductId          = getCurrentProductId();
		var addToCartWrapperSelector = '.summary-inner';

		if ( document.querySelector('.wd-content-layout').classList.contains('wd-builder-on') ) {
			addToCartWrapperSelector = '.wd-single-add-cart';
		}

		var variations_form = document.querySelector(`${addToCartWrapperSelector} .variations_form`);

		if (variations_form) {
			var activeVariation     = document.querySelector(`${addToCartWrapperSelector} .wd-active`);
			var variationsUpdated   = false;
			var formInited          = false;
			var selectedVariationId = parseInt(variations_form.querySelector('input.variation_id').value);

			if (selectedVariationId) {
				var variations          = JSON.parse(variations_form.dataset.product_variations);
				var selectedVariation   = variations.find(function(variation) {
					return variation.variation_id === selectedVariationId;
				});

				if (selectedVariation && ! selectedVariation.is_in_stock) {
					showForm(variations_form, selectedVariation.variation_id, wtl_form_data[selectedVariation.variation_id].state);
				}
			}

			jQuery(`${addToCartWrapperSelector} .variations_form`)
				.on('show_variation', function(e, variation) {
					if (variation.is_in_stock) {
						var form = document.querySelector('.wd-wtl-form:not(.wd-wtl-is-template)');

						if (form) {
							form.remove();
						}

						return;
					}

					showForm(this, variation.variation_id, wtl_form_data[variation.variation_id].state);

					if (! variationsUpdated && wtl_form_data.global.fragments_enable && wtl_form_data.global.is_user_logged_in) {
						updateAjaxFormData(parentProductId, 'variation', variation.variation_id);
						variationsUpdated = true;
					}
				})
				.on('click', '.reset_variations', function() {
					var wtlForm = document.querySelector('.wd-wtl-form:not(.wd-wtl-is-template)');

					if (wtlForm) {
						wtlForm.remove();
					}
				});

			if ( ! formInited && document.querySelector('.single-product-page').classList.contains('has-default-attributes') && activeVariation ) {
				jQuery(`${addToCartWrapperSelector} .variations_form`).trigger('reload_product_variations');
				formInited = true;
			}
		} else {
			if (wtl_form_data.hasOwnProperty('fragments_enable') && wtl_form_data.fragments_enable && wtl_form_data.is_user_logged_in) {
				updateAjaxFormData(parentProductId, 'simple');
			}

			var form = document.querySelector('.wd-wtl-form:not(.wd-wtl-is-template)');

			if (form) {
				form.addEventListener('click', formEvents);
			}
		}
	}
	
	function showForm(appendAfter, product_id, state = 'not-signed' ) {
		if (! wtl_form_data.global.is_user_logged_in) {
			var cookiesName  = 'woodmart_waitlist_unsubscribe_tokens';

			var cookieData  = Cookies.get(cookiesName) ? JSON.parse(Cookies.get(cookiesName)) : {};
			
			if (cookieData && cookieData.hasOwnProperty(product_id) ) {
				state = 'signed';
			}
		}

		var templateForm = document.querySelector(`.wd-wtl-form.wd-wtl-is-template[data-state=${state}]`);

		if (! templateForm) {
			return;
		}

		//var stockElement;
		var oldForm      = document.querySelector('.wd-wtl-form:not(.wd-wtl-is-template)');
		var cloneNode    = templateForm.cloneNode(true);

		if ('not-signed' === state) {
			var emailValue = '';

			cloneNode.querySelector('.wd-wtl-subscribe').dataset.productId = product_id;

			if (wtl_form_data.hasOwnProperty('global') && wtl_form_data.global.email) {
				emailValue =  wtl_form_data.global.email;
			} else if (wtl_form_data.hasOwnProperty('email')) {
				emailValue = wtl_form_data.email;
			}

			cloneNode.querySelector('[name="wd-wtl-user-subscribe-email"]').value = emailValue;

			cloneNode.addEventListener('click', subscribe);
		} else {
			cloneNode.querySelector('.wd-wtl-unsubscribe').dataset.productId = product_id;

			cloneNode.addEventListener('click', unsubscribe);
		}

		cloneNode.querySelectorAll('[for$="-tmpl"]').forEach(function(node) {
			node.setAttribute('for', node.getAttribute('for').replace('-tmpl', ''));
		});

		cloneNode.querySelectorAll('[id$="-tmpl"]').forEach(function(node) {
			node.id = node.id.replace('-tmpl', '');
		});

		cloneNode.classList.remove('wd-wtl-is-template');
		cloneNode.classList.remove('wd-hide');

		if (oldForm) {
			oldForm.replaceWith(cloneNode);
			oldForm.classList.remove('wd-hide');
		} else {
			appendAfter.after(cloneNode);
		}

		if (wtl_form_data.hasOwnProperty(product_id)) {
			wtl_form_data[product_id].state = state;
		} else if (wtl_form_data.hasOwnProperty('product_id')) {
			wtl_form_data.product_id = state;
		}

		return cloneNode;
	}

	function updateAjaxFormData(productId, productType, variationId = 0) {
		if (! productId) {
			return;
		}

		var subscribeForm = document.querySelector('.wd-wtl-form:not(.wd-hide)');
		var loaderOverlay = subscribeForm.querySelector('.wd-loader-overlay');
		
		loaderOverlay.classList.add('wd-loading');

		jQuery.ajax({
			url     : woodmart_settings.ajaxurl,
			data    : {
				action     : 'woodmart_update_form_data',
				product_id : productId,
			},
			dataType: 'json',
			method  : 'GET',
			success : function(response) {
				if (response.hasOwnProperty('data')) {
					if (response.data.hasOwnProperty('global')) {
						wtl_form_data.global = response.data.global;
					}

					if (response.data.hasOwnProperty('signed_ids')) {
						response.data.signed_ids.forEach(function(signedProdutId) {
							if (wtl_form_data.hasOwnProperty(signedProdutId)) {
								wtl_form_data[signedProdutId].state = 'signed';
							} else if (wtl_form_data.hasOwnProperty('state')) {
								wtl_form_data.state = 'signed';
							}
						});
					}					

					if ('simple' === productType) {
						updateForm(response.data.content);
					} else if ( 0 !== variationId ) {
						subscribeForm = showForm(document.querySelector('.wd-wtl-form:not(.wd-wtl-is-template)'), variationId, wtl_form_data[variationId].state);
					}
				}
			},
			error   : function() {
				console.error('Something wrong with AJAX response. Probably some PHP conflict');
			},
			complete: function() {
				loaderOverlay = subscribeForm.querySelector('.wd-loader-overlay');

				loaderOverlay.classList.remove('wd-loading');
			}
		});
	}

	function formEvents(e) {
		var subscribeBtn   = e.target.closest('.wd-wtl-subscribe');
		var unsubscribeBtn = e.target.closest('.wd-wtl-unsubscribe');

		if (subscribeBtn) {
			subscribe(e);
		} else if (unsubscribeBtn) {
			unsubscribe(e);
		}
	}

	function subscribe(e) {
		var actionBtn = e.target.closest('.wd-wtl-subscribe');

		if ( ! actionBtn ) {
			return;
		}

		e.preventDefault();

		var subscribeForm    = actionBtn.closest('.wd-wtl-form');
		var policyCheckInput = subscribeForm.querySelector('[name="wd-wtl-policy-check"]');
		var userEmailInput   = subscribeForm.querySelector('[name="wd-wtl-user-subscribe-email"]');
		var userEmail        = userEmailInput ? userEmailInput.value : '';

		data = {
			action     : 'woodmart_add_to_waitlist',
			user_email : userEmail,
			product_id : actionBtn.dataset.productId,
		}

		if (policyCheckInput) {
			if (! policyCheckInput.checked) {
				var noticeValue = '';
				
				if (wtl_form_data.hasOwnProperty('global') && wtl_form_data.global.policy_check_notice) {
					noticeValue =  wtl_form_data.global.policy_check_notice;
				} else if (wtl_form_data.hasOwnProperty('policy_check_notice')) {
					noticeValue = wtl_form_data.policy_check_notice;
				}
				
				if ( ! noticeValue ) {
					return;
				}

				addNotice(subscribeForm, noticeValue, 'warning');
				return;
			}
		}

		sendForm(subscribeForm, data);
	}

	function unsubscribe(e) {
		var actionBtn = e.target.closest('.wd-wtl-unsubscribe');

		if ( ! actionBtn ) {
			return;
		}

		e.preventDefault();

		var cookiesName  = 'woodmart_waitlist_unsubscribe_tokens';
		var subscribeForm = actionBtn.closest('.wd-wtl-form');

		data = {
			action     : 'woodmart_remove_from_waitlist',
			product_id : actionBtn.dataset.productId,
		}

		var productId   = parseInt(data.product_id);
		var cookieData  = Cookies.get(cookiesName) ? JSON.parse(Cookies.get(cookiesName)) : {};
		
		if (cookieData && cookieData.hasOwnProperty(productId) ) {
			data['unsubscribe_token'] = cookieData[productId];
		}

		sendForm(subscribeForm, data);
	}
	
	function sendForm(subscribeForm, data) {
		var loaderOverlay = subscribeForm.querySelector('.wd-loader-overlay');
		
		loaderOverlay.classList.add('wd-loading');

		jQuery.ajax({
			url     : woodmart_settings.ajaxurl,
			data,
			method  : 'POST',
			success : function(response) {
				if (!response) {
					return;
				}

				if (response.success) {
					if (response.data.hasOwnProperty('content') && response.data.hasOwnProperty('state')) {
						updateForm(response.data.content);
					} else {
						subscribeForm = showForm(subscribeForm, data.product_id ,response.data.state);
					}
				}

				if (response.data.hasOwnProperty('notice')) {
					$nocite_type = ! response.success ? 'warning' : 'success';

					if ( response.data.hasOwnProperty('notice_status') ) {
						$nocite_type = response.data.notice_status;
					}

					addNotice(subscribeForm, response.data.notice, $nocite_type);
				}
			},
			error   : function() {
				console.error('ajax adding to waitlist error');
			},
			complete: function() {
				loaderOverlay = subscribeForm.querySelector('.wd-loader-overlay');

				loaderOverlay.classList.remove('wd-loading');
			}
		});
	}

	function updateForm(content) {
		var         forms = document.querySelectorAll('.wd-wtl-form:not(.wd-wtl-is-template)');
		var         form  = Array.from(forms).find(function(form) {
			return ! form.closest('.wd-sticky-spacer');
		});
		var tempDiv       = document.createElement('div');
		tempDiv.innerHTML = content;
		childNodes        = tempDiv.querySelector('.wd-wtl-form').childNodes;

		form.replaceChildren(...childNodes);
	}

	function getCurrentProductId() {
		var product_id = false;

		document.querySelector('body[class*="postid-"]').classList.forEach(function(className) {
			if ( ! className.includes('postid-') ) {
				return;
			}
		
			product_id = className.replace('postid-', '')
		});

		return product_id;
	}

	function addNotice(subscribeForm, message, status) {
		if ( ! subscribeForm ) {
			return;
		}

		var oldNotice = subscribeForm.querySelector('.wd-notice');

		if ( oldNotice ) {
			oldNotice.remove();
		}

		var noticeNode = document.createElement("div");

		noticeNode.classList.add(
			'wd-notice',
			`wd-${status}`
		);

		noticeNode.append(message);
		subscribeForm.append(noticeNode);
	}

	init();
}

window.addEventListener('load', function() {
	woodmartThemeModule.waitlistSubscribeForm();
});

woodmartThemeModule.waitlistTable = function() {
	var waitlistTable = document.querySelector('.wd-wtl-table');

	if ( ! waitlistTable ) {
		return;
	}

	var unsubscribeBtns = waitlistTable.querySelectorAll('.wd-wtl-unsubscribe');

	unsubscribeBtns.forEach(function(unsubscribeBtn) {
		unsubscribeBtn.addEventListener('click', function(e) {
			e.preventDefault();
			
			var actionBtn = this;

			waitlistTable.parentNode.querySelector('.wd-loader-overlay').classList.add('wd-loading');

			jQuery.ajax({
				url     : woodmart_settings.ajaxurl,
				data    : {
					action     : 'woodmart_remove_from_waitlist_in_my_account',
					product_id : actionBtn.dataset.productId,
				},
				method  : 'POST',
				success : function(response) {
					if (!response) {
						return;
					}

					if (response.success) {
						actionBtn.closest('tr').remove();
					}

					if (response.data.content) {
						tempDiv           = document.createElement('div');
						tempDiv.innerHTML = response.data.content;
						var childNodes    = tempDiv.querySelector('.wd-wtl-content').childNodes;

						waitlistTable.parentNode.replaceChildren(...childNodes);
					}
				},
				error   : function() {
					console.error('ajax remove from waitlist error');
				},
				complete: function() {
					waitlistTable.parentNode.querySelector('.wd-loader-overlay').classList.remove('wd-loading');
				}
			});
		});
	});
}

window.addEventListener('load', function() {
	woodmartThemeModule.waitlistTable();
});

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdShopPageInit wdArrowsLoadProducts wdLoadMoreLoadProducts wdProductsTabsLoaded wdSearchFullScreenContentLoaded wdBackHistory wdRecentlyViewedProductLoaded', function() {
		woodmartThemeModule.updateWishlistButtonState();
	});

	woodmartThemeModule.wishlist = function() {
		var countCookiesName = 'woodmart_wishlist_count';
		var productCookiesName = 'woodmart_wishlist_products';

		if (woodmart_settings.is_multisite) {
			countCookiesName += '_' + woodmart_settings.current_blog_id;
			productCookiesName += '_' + woodmart_settings.current_blog_id;
		}

		if ( typeof Cookies === 'undefined' ) {
			return;
		}

		var cookie = Cookies.get(countCookiesName);
		var count = 0;

		if ('undefined' !== typeof cookie) {
			try {
				count = JSON.parse(cookie);
			}
			catch (e) {
				console.log('cant parse cookies json');
			}
		}

		if ( 'undefined' === typeof woodmart_settings.wishlist_expanded || 'yes' !== woodmart_settings.wishlist_expanded) {
			updateCountWidget(count);
		}

		// Add to wishlist action
		woodmartThemeModule.$body.on('click', '.wd-wishlist-btn a', function(e) {
			var $this = $(this);

			if (!$this.hasClass('added')) {
				e.preventDefault();
			} else {
				return true;
			}

			var productId = $this.data('product-id');
			var key = $this.data('key');

			if ( woodmartThemeModule.$body.hasClass('logged-in') || typeof Cookies === 'undefined' ) {
				$this.addClass('loading');

				if ( 'undefined' !== typeof woodmart_settings.wishlist_expanded && 'yes' === woodmart_settings.wishlist_expanded && 'disable' !== woodmart_settings.wishlist_show_popup && woodmartThemeModule.$body.hasClass('logged-in') ) {
					woodmartThemeModule.$document.trigger('wdShowWishlistGroupPopup', [ productId, key ] );
					return;
				}

				addProductWishlistAJAX( productId, '', key );
			} else {
				var products = {};
				var wishlistCookies = Cookies.get(productCookiesName);

				if ( 'undefined' !== typeof wishlistCookies && wishlistCookies ) {
					var cookiesProducts = JSON.parse(wishlistCookies);

					if ( Object.keys(cookiesProducts).length ) {
						products = cookiesProducts;
					}
				}

				products[ productId ] = {
					'product_id' : productId
				};

				var count = Object.keys(products).length

				updateCountWidget(count);

				Cookies.set(productCookiesName, JSON.stringify(products), {
					expires: 7,
					path   : woodmart_settings.cookie_path,
					secure : woodmart_settings.cookie_secure_param
				});
				Cookies.set(countCookiesName, count, {
					expires: 7,
					path   : woodmart_settings.cookie_path,
					secure : woodmart_settings.cookie_secure_param
				});

				updateButton( $this );
			}
		});

		woodmartThemeModule.$body.on('click', '.wd-wishlist-remove', function(e) {
			e.preventDefault();

			var $this = $(this);
			var groupId = '';

			if ( $this.parents('.wd-wishlist-group').length ) {
				groupId = $this.parents('.wd-wishlist-group').data('group-id');
			}

			$this.addClass('loading');

			if ( woodmartThemeModule.$body.hasClass('logged-in') || 'undefined' === typeof Cookies || 1 === $this.parents('.wd-products').find('.wd-product').length ) {
				removeProductWishlistAJAX(
					$this.data('product-id'),
					groupId,
					$this.parents('.wd-products'),
					function () {
						$this.removeClass('loading');
					}
				);
			} else {
				$this.parents('.wd-product').remove();

				var wishlistCookies = Cookies.get(productCookiesName);
				var products = {};

				if ( 'undefined' !== typeof wishlistCookies && wishlistCookies ) {
					products = JSON.parse(wishlistCookies);

					if ( Object.keys(products).length ) {
						delete products[$this.data('product-id')];
					}
				}

				var count = Object.keys(products).length;

				updateCountWidget( count );

				Cookies.set(productCookiesName, JSON.stringify(products), {
					expires: 7,
					path   : woodmart_settings.cookie_path,
					secure : woodmart_settings.cookie_secure_param
				});
				Cookies.set(countCookiesName, count, {
					expires: 7,
					path   : woodmart_settings.cookie_path,
					secure : woodmart_settings.cookie_secure_param
				});
			}
		});

		woodmartThemeModule.$body.on('click', '.wd-wishlist-checkbox', function(e) {
			var $this = $(this);
			var $parent = $this.parents('.wd-product');
			var $bulkAction = $this.parents('.wd-products-element').siblings('.wd-wishlist-bulk-action');
			var $selectAllBtn = $bulkAction.find('.wd-wishlist-select-all');

			$parent.toggleClass('wd-current-product');

			if ( $selectAllBtn.hasClass('wd-selected') && $bulkAction.hasClass('wd-visible') && ! $parent.hasClass('wd-current-product') ) {
				$selectAllBtn.removeClass('wd-selected');
			}

			if ( $parent.siblings('.product').length === $parent.siblings('.wd-current-product').length && $parent.hasClass('wd-current-product') ) {
				$selectAllBtn.addClass('wd-selected');
			}

			if ( ! $parent.siblings('.wd-current-product').length && $bulkAction.hasClass('wd-visible') && ! $parent.hasClass('wd-current-product') ) {
				$bulkAction.removeClass('wd-visible');
			} else {
				$bulkAction.addClass('wd-visible');
			}
		});

		woodmartThemeModule.$body.on('click', '.wd-wishlist-remove-action > a', function(e) {
			e.preventDefault();

			var $this = $(this);
			var $productWrapper = $this.parents('.wd-wishlist-bulk-action').siblings('.wd-products-element').find('.products');
			var $products = $productWrapper.find('.wd-current-product');
			var productsId = [];
			var groupId = '';

			if ( !$products.length || ! confirm(woodmart_settings.wishlist_remove_notice) ) {
				return;
			}

			$this.addClass('loading');

			if ( $this.parents('.wd-wishlist-group').length ) {
				groupId = $this.parents('.wd-wishlist-group').data('group-id');
			}

			$products.each(function () {
				productsId.push($(this).data('id'));
			});

			removeProductWishlistAJAX( productsId, groupId, $productWrapper, function () {
				$this.parents('.wd-wishlist-bulk-action').removeClass('wd-visible');
				$this.removeClass('loading');
			} );
		});

		woodmartThemeModule.$body.on('click', '.wd-wishlist-select-all > a', function(e) {
			e.preventDefault();

			var $this = $(this).parent();
			var $productWrapper = $this.parents('.wd-wishlist-bulk-action').siblings('.wd-products-element').find('.products');

			if ( $this.hasClass('wd-selected') ) {
				$productWrapper.find('.product').removeClass('wd-current-product').find('.wd-wishlist-checkbox').prop('checked', false);
				$this.removeClass('wd-selected');
				$this.parents('.wd-wishlist-bulk-action').removeClass('wd-visible');
			} else {
				$productWrapper.find('.product').addClass('wd-current-product').find('.wd-wishlist-checkbox').prop('checked', true);
				$this.addClass('wd-selected');
			}
		});


		woodmartThemeModule.$document.on('wdAddProductToWishlist', function (event, productId, groupId, key, callback) {
			addProductWishlistAJAX( productId, groupId, key, callback );
		});

		woodmartThemeModule.$document.on('wdRemoveProductToWishlist', function (event, productId, groupId, $productWrapper, callback) {
			removeProductWishlistAJAX( productId, groupId, $productWrapper, callback );
		});

		woodmartThemeModule.$document.on('wdUpdateWishlistContent', function (event, response) {
			updateWishlist(response);
		});

		// Elements update after ajax
		function updateWishlist(data) {
			var $wishlistContent = $('.wd-wishlist-content');

			updateCountWidget(data.count);

			if ($wishlistContent.length > 0 && !$wishlistContent.hasClass('wd-wishlist-preview')) {
				woodmartThemeModule.removeDuplicatedStylesFromHTML(data.wishlist_content, function(html) {
					$wishlistContent.replaceWith(html);

					woodmartThemeModule.$document.trigger('wdUpdateWishlist');
				});
			}
		}

		// Update product wishlist after ajax.
		function updateWishlistProducts(data, $wrapper) {
			if ( $wrapper.length && ! $('.wd-wishlist-content').hasClass('wd-wishlist-preview')) {
				woodmartThemeModule.removeDuplicatedStylesFromHTML(data.wishlist_content, function(html) {
					$wrapper.replaceWith(html);

					woodmartThemeModule.$document.trigger('wdUpdateWishlist');
				});
			}

			setTimeout( function () {
				var $pagination = $('.wd-wishlist-content .wd-pagination').find('a.page-numbers');

				if ( $pagination.length ) {
					$pagination.each( function () {
						var $this = $(this);

						var href = $this.attr('href').split('product-page=')[1];
						var page = parseInt( href );

						$this.attr( 'href', window.location.origin + window.location.pathname + '?product-page=' + page );
					});
				}
			}, 500 );
		}

		function updateCountWidget(count) {
			var $widget = $('.wd-header-wishlist');

			if ($widget.length > 0) {
				$widget.find('.wd-tools-count').text(count);
			}
		}

		// Add product in wishlist.
		function addProductWishlistAJAX( productId, group, key, callback = '' ) {
			var $this = $('.wd-wishlist-btn a[data-product-id=' + productId + ']');

			$.ajax({
				url     : woodmart_settings.ajaxurl,
				data    : {
					action    : 'woodmart_add_to_wishlist',
					product_id: productId,
					group     : group,
					key       : key
				},
				dataType: 'json',
				method  : 'GET',
				success : function(response) {
					if (response) {
						if ( response.count ) {
							updateCountWidget(response.count);
						}

						if (response.fragments) {
							woodmartThemeModule.$document.trigger('wdWishlistSaveFragments', [response.fragments, response.hash]);

							$.each( response.fragments, function( key, html ) {
								woodmartThemeModule.removeDuplicatedStylesFromHTML(html, function(html) {
									$( key ).replaceWith(html);
								});
							});
						}

						updateButton( $this );
					} else {
						console.log('something wrong loading wishlist data ', response);
					}

					if ( callback ) {
						callback()
					}
				},
				error   : function() {
					console.log('We cant add to wishlist. Something wrong with AJAX response. Probably some PHP conflict.');
				},
				complete: function() {
					$this.removeClass('loading');
				}
			});
		}

		function removeProductWishlistAJAX( productId, groupId, $productsWrapper, callback = '' ) {
			var productsAtts = '';

			if ( 'undefined' !== typeof $productsWrapper.data('atts') ) {
				productsAtts = $productsWrapper.data('atts');

				productsAtts.ajax_page = $productsWrapper.attr('data-paged');
			}

			$.ajax({
				url     : woodmart_settings.ajaxurl,
				data    : {
					action    : 'woodmart_remove_from_wishlist',
					product_id: productId,
					group_id  : groupId,
					key       : woodmart_settings.wishlist_page_nonce,
					atts      : productsAtts,
				},
				dataType: 'json',
				method  : 'GET',
				success : function(response) {
					if (response.wishlist_content) {
						var $productsElement = $productsWrapper.parents('.wd-products-element');
						var $wishlistContent = $productsElement.parents('.wd-wishlist-content')

						updateCountWidget(response.count);
						updateWishlistProducts(response, $productsElement);

						if (response.hasOwnProperty('count') && 0 === response.count) {
							$wishlistContent
								.find('.wd-wishlist-head, .wd-wishlist-bulk-action')
								.remove();
						}
					} else {
						console.log('something wrong loading wishlist data ', response);
					}

					if (response.fragments) {
						woodmartThemeModule.$document.trigger('wdUpdateWishlistFragments', [response.fragments, response.hash]);
					}

					if ( callback ) {
						callback()
					}
				},
				error   : function() {
					console.log('We cant remove from wishlist. Something wrong with AJAX response. Probably some PHP conflict.');
				},
			});
		}

		function updateButton( $button ) {
			var addedText = $button.data('added-text');

			if ($button.find('.wd-action-text').length > 0) {
				$button.find('.wd-action-text').text(addedText);
			} else {
				$button.text(addedText);
			}

			$button.addClass('added');

			woodmartThemeModule.$document.trigger('added_to_wishlist');
			woodmartThemeModule.$document.trigger('wdUpdateTooltip', $button);
		}
	};

	woodmartThemeModule.updateWishlistButtonState = function() {
		if ( 'undefined' === typeof woodmart_settings.wishlist_save_button_state || 'yes' !== woodmart_settings.wishlist_save_button_state || 'undefined' === typeof Cookies || woodmartThemeModule.$body.hasClass('logged-in') ) {
			return;
		}

		var cookiesName = 'woodmart_wishlist_products';
		var products = {};

		if ( woodmart_settings.is_multisite ) {
			cookiesName += '_' + woodmart_settings.current_blog_id;
		}

		var productsCookies = Cookies.get(cookiesName);

		if ( 'undefined' !== typeof productsCookies && productsCookies ) {
			products = Object.values( JSON.parse(productsCookies) );
		}

		if ( ! products.length ) {
			return;
		}

		$.each(products, function( index, value ) {
			var $button = $('.wd-wishlist-btn a[data-product-id=' + value.product_id + ']');

			if ( ! $button.length || $button.hasClass('added') ) {
				return;
			}

			$button.addClass('added');

			var addedText = $button.data('added-text');

			if ($button.find('.wd-action-text').length > 0) {
				$button.find('.wd-action-text').text(addedText);
			} else {
				$button.text(addedText);
			}
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.wishlist();
		woodmartThemeModule.updateWishlistButtonState();
	});
})(jQuery);

/* global woodmart_settings, woodmartThemeModule, jQuery */
(function($) {
	woodmartThemeModule.wishlistGroup = function() {
		if ( 'undefined' === typeof woodmart_settings.wishlist_expanded || 'yes' !== woodmart_settings.wishlist_expanded ) {
			return;
		}

		var fragmentsName   = woodmart_settings.wishlist_fragment_name;
		var cookiesHashName = 'woodmart_wishlist_hash';

		if (woodmart_settings.is_multisite) {
			cookiesHashName += '_' + woodmart_settings.current_blog_id;
		}

		try {
			updateWishlistGroup();
		}
		catch (e) {
			updateAjaxWishlistGroup();
		}

		woodmartThemeModule.$body.on('keyup', '.wd-wishlist-group-name', function(e) {
			if ('Enter' === e.key) {
				$('.btn.wd-wishlist-save-btn').trigger('click');
			}
		});

		woodmartThemeModule.$body.on('keyup', '.wd-wishlist-input-rename', function(e) {
			if ('Enter' === e.key) {
				$('.btn.wd-wishlist-rename-save').trigger('click');
			}
		});

		woodmartThemeModule.$body.on('click', '.wd-wishlist-remove-group', function(e) {
			e.preventDefault();
			var $this = $(this);
			var groupId = $this.parents('.wd-wishlist-group').data('group-id');
			var $loading = $this.parents('.wd-wishlist-group').find('.wd-loader-overlay');

			if ( ! confirm(woodmart_settings.wishlist_remove_notice) ) {
				return;
			}

			$loading.addClass('wd-loading');

			$.ajax({
				url     : woodmart_settings.ajaxurl,
				data    : {
					action  : 'woodmart_remove_group_from_wishlist',
					group_id: groupId,
					key     : woodmart_settings.wishlist_page_nonce
				},
				dataType: 'json',
				method  : 'GET',
				success : function(response) {
					if (response.wishlist_content) {
						woodmartThemeModule.$document.trigger('wdUpdateWishlistContent', response, 'something' );
					} else {
						console.log('something wrong loading wishlist data ', response);
					}
					if ( response.fragments ) {
						updateFragments( response.fragments, response.hash );
					}
				},
				error   : function() {
					console.log('We cant remove from wishlist. Something wrong with AJAX response. Probably some PHP conflict.');
				},
				complete: function() {
					$loading.removeClass('wd-loading');
				}
			});
		});

		woodmartThemeModule.$body.on('click', '.wd-wishlist-edit-title', function(e) {
			e.preventDefault();

			var $wrapper = $(this).parents('.wd-wishlist-group-head').find('.wd-wishlist-group-title');
			var $input = $wrapper.find('.wd-wishlist-input-rename');
			var title = $input.val();

			$wrapper.addClass('wd-edit');
			$input.val('').val(title).trigger('focus');

			woodmartThemeModule.$body.on('mouseup', function(e) {
				var $this = $(this);
				var $inputWrapper = $('.wd-wishlist-group-title.wd-edit');

				if ( $inputWrapper.length ) {
					var $headerGroup = $inputWrapper.parents('.wd-wishlist-group-head');
					if (!$headerGroup.is(e.target) && $headerGroup.has(e.target).length === 0) {
						$inputWrapper.removeClass('wd-edit');
						$this.off(e);
					}
				} else {
					$this.off(e);
				}
			});
		});

		woodmartThemeModule.$body.on('click', '.wd-wishlist-rename-cancel', function(e) {
			e.preventDefault();

			$(this).parents('.wd-wishlist-group-title').removeClass('wd-edit');
		});

		woodmartThemeModule.$body.on('click', '.wd-wishlist-rename-save', function(e) {
			e.preventDefault();

			var $this = $(this);
			var $wrapper = $this.parents('.wd-wishlist-group-title');
			var $groupWrapper = $this.parents('.wd-wishlist-group');
			var $input = $this.siblings('.wd-wishlist-input-rename');
			var title = $input.val();
			var group_id = $groupWrapper.data('group-id');

			if ( ! title ) {
				alert(woodmart_settings.wishlist_rename_group_notice);

				return;
			}

			if ( $input.data('title') === title ) {
				$wrapper.removeClass('wd-edit');
				return;
			}

			$this.addClass('loading');

			$.ajax({
				url     : woodmart_settings.ajaxurl,
				data    : {
					action  : 'woodmart_rename_wishlist_group',
					title   : title,
					group_id: group_id,
					key     : woodmart_settings.wishlist_page_nonce,
				},
				dataType: 'json',
				method  : 'GET',
				success : function(response) {
					if (response) {
						$wrapper.find('>.title').text(title);
						$input.data('title', title);
					} else {
						console.log('something wrong loading wishlist data ', response);
					}

					if ( response.fragments ) {
						updateFragments( response.fragments, response.hash );
					}
				},
				error   : function() {
					console.log('We cant add to wishlist. Something wrong with AJAX response. Probably some PHP conflict.');
				},
				complete: function() {
					$wrapper.removeClass('wd-edit');
					$this.removeClass('loading');
				},
			});
		});

		woodmartThemeModule.$body.on('click', '.wd-wishlist-create-group-btn', function(e) {
			e.preventDefault();

			initPopup( '', '', ' wd-create-group-on-page' );
		});

		woodmartThemeModule.$body.on('click', '.wd-wishlist-move-action > a', function(e) {
			e.preventDefault();

			var $this = $(this);
			var $products = $this.parents('.wd-wishlist-group').find('.product.wd-current-product');
			var productsId = [];

			if ( !$products.length ) {
				return;
			}

			$this.addClass('wd-loading');

			$products.each(function () {
				productsId.push($(this).data('id'));
			});

			initPopup( productsId, '', ' wd-move-action' );
		});

		woodmartThemeModule.$body.on('click', '.wd-wishlist-group-list li', function(e) {
			var $this = $(this);
			var groupId = $this.data('group-id');

			if ( 'add_new' === groupId ) {
				e.preventDefault();

				var $wrapper = $this.parents('.wd-popup-wishlist');

				$wrapper.addClass('wd-create-group');
				$wrapper.find('.wd-wishlist-group-name').trigger('focus');

				return;
			}

			$this.siblings().removeClass('wd-current').find('input').prop('checked', false);

			$this.addClass('wd-current');
			$this.find('input').prop('checked', true);
		});

		woodmartThemeModule.$body.on('click', '.wd-wishlist-save-btn', function(e) {
			e.preventDefault();

			var $this = $(this);
			var $popupWrapper = $this.parents('.wd-popup-wishlist');
			var $wrapperList = $this.siblings('.wd-wishlist-group-list');
			var $moveBtn = $('.wd-wishlist-move-action > a.wd-loading');
			var productsId = $wrapperList.data('product-id');
			var groupId = '';

			if ($popupWrapper.hasClass('wd-create-group')) {
				groupId = $popupWrapper.find('.wd-wishlist-group-name').val();
			} else if ($popupWrapper.parents('.wd-create-group-on-page').length) {
				groupId = $popupWrapper.find('.wd-wishlist-group-name').val();

				createNewGroup(groupId, $this, $moveBtn.length);
				return;
			} else {
				groupId = $wrapperList.find('li.wd-current').data('group-id');
			}

			if ( ! groupId ) {
				return;
			}

			$this.addClass('loading');

			if ( ! $moveBtn.length ) {
				woodmartThemeModule.$document.trigger('wdAddProductToWishlist', [ productsId, groupId, $wrapperList.data('nonce'), function () {
					$popupWrapper = $('.wd-popup-wishlist');
					$popupWrapper.addClass('wd-added');
					$popupWrapper.addClass('wd-in');
					$popupWrapper.removeClass('wd-create-group');
					$this.removeClass('loading');
				} ] );

				return;
			}

			var groupIdOld = $moveBtn.parents('.wd-wishlist-group').data('group-id');

			$.ajax({
				url: woodmart_settings.ajaxurl,
				data: {
					action      : 'woodmart_move_products_from_wishlist',
					products_id : productsId,
					group_id    : groupId,
					group_id_old: groupIdOld,
					key         : woodmart_settings.wishlist_page_nonce,
				},
				dataType: 'json',
				method: 'GET',
				success: function (response) {
					if (response.wishlist_content) {
						woodmartThemeModule.$document.trigger('wdUpdateWishlistContent', response );
					} else {
						console.log('something wrong loading wishlist data ', response);
					}

					if ( response.fragments ) {
						updateFragments( response.fragments, response.hash );
					}
				},
				error: function () {
					console.log('We cant remove from wishlist. Something wrong with AJAX response. Probably some PHP conflict.');
				},
				complete: function() {
					$this.removeClass('wd-loading');
					$.magnificPopup.close();
					$moveBtn.removeClass('wd-loading');
				},
			});
		});

		woodmartThemeModule.$body.on('click', '.wd-wishlist-back-btn', function(e) {
			e.preventDefault();

			$(this).parents('.wd-popup-wishlist').removeClass('wd-create-group');
		});

		woodmartThemeModule.$body.on('click', '.wd-wishlist-back-to-shop', function(e) {
			e.preventDefault();

			if ('undefined' !== typeof $.fn.magnificPopup) {
				$.magnificPopup.close();
			}
		});

		woodmartThemeModule.$document.on('wdShowWishlistGroupPopup', function (event, productId, key) {
			initPopup( productId, key);
		});

		woodmartThemeModule.$document.on('wdUpdateWishlistFragments', function (event, fragments, hash) {
			updateFragments(fragments, hash);
		});

		woodmartThemeModule.$document.on('wdWishlistSaveFragments', function (event, fragments, hash) {
			saveFragments( fragments, hash )
		});

		function updateFragments( fragments, hash = '' ) {
			setTimeout( function () {
				$.each( fragments, function( key, html ) {
					woodmartThemeModule.removeDuplicatedStylesFromHTML(html, function(html) {
						$( key ).replaceWith(html);
					});
				});
			}, 600);

			saveFragments( fragments, hash );
		}

		function saveFragments( fragments, hash ) {
			localStorage.setItem( fragmentsName, JSON.stringify( fragments ) );
			sessionStorage.setItem( fragmentsName, JSON.stringify( fragments ) );

			localStorage.setItem( woodmart_settings.wishlist_hash_name, hash );
			sessionStorage.setItem( woodmart_settings.wishlist_hash_name, hash );

			Cookies.set(cookiesHashName, hash, {
				expires: 7,
				path   : woodmart_settings.cookie_path,
				secure : woodmart_settings.cookie_secure_param
			});
		}

		// Output popup for save product in wishlist groups.
		function initPopup( productId, key, classes = '' ) {
			if ('undefined' === typeof $.fn.magnificPopup) {
				return;
			}

			var $groupLists = $('.wd-popup-wishlist').find('ul');
			var $moveBtn    = $('.wd-wishlist-move-action > a.wd-loading');

			if ( 'undefined' !== typeof woodmart_settings.wishlist_show_popup && 'more_one' === woodmart_settings.wishlist_show_popup && 2 > $groupLists.data('group-count') && ! $moveBtn.length && ! classes ) {
				woodmartThemeModule.$document.trigger('wdAddProductToWishlist', [ productId, '', key, '' ] );
				return;
			}

			if ($.magnificPopup?.instance?.isOpen) {
				$.magnificPopup.instance.st.removalDelay = 0
				$.magnificPopup.close()
			}

			$.magnificPopup.open({
				removalDelay   : 600, //delay removal by X to allow out-animation
				closeMarkup    : woodmart_settings.close_markup,
				tLoading       : woodmart_settings.loading,
				fixedContentPos: true,
				callbacks      : {
					beforeOpen: function() {
						this.wrap.addClass('wd-popup-wishlist-wrap' + classes);
					},
					open      : function() {
						var $popupWrapper = $(this.content[0]);
						var $btn = $popupWrapper.find('.wd-wishlist-save-btn');

						$popupWrapper.find('ul').attr('data-product-id', productId ).attr('data-nonce', key );
						$popupWrapper.find('ul').find('li').first().trigger('click');

						if ( ' wd-create-group-on-page' === classes ) {
							$btn.html( $btn.data('create-text'));

							setTimeout( function () {
								$popupWrapper.find('.wd-wishlist-group-name').trigger('focus');
							}, 500);
						}
						if ( ' wd-move-action' === classes ) {
							$btn.html( $btn.data('move-text'));
						}
					},
					close     : function() {
						if ( key ) {
							$('a[data-product-id=' + productId + ']').removeClass('loading');
						}

						var $popupWrapper = $(this.content[0]);

						if ( ' wd-create-group-on-page' === classes && $popupWrapper.find('.wd-wishlist-save-btn').hasClass('loading') ) {
							var $newGroup = $('.wd-wishlist-content').find('.wd-wishlist-group').last();

							setTimeout( function () {
								$('html, body').animate({
									scrollTop: $newGroup.offset().top - 100
								}, 500);
							}, 50);
						}

						$popupWrapper.removeClass('wd-create-group');
						$popupWrapper.removeClass('wd-added');
						$popupWrapper.find('.wd-wishlist-save-btn').removeClass('loading');
						$popupWrapper.find('.wd-wishlist-group-name').val('');
						$popupWrapper.find('.wd-wishlist-group-list li.wd-current').removeClass('wd-current').find('input').prop('checked', false);
						$moveBtn.removeClass('loading');

						setTimeout(function () {
							updateWishlistGroup();
						}, 600);
					},
				},
				items       : {
					src : '.wd-popup-wishlist',
				}
			});
		}

		function updateWishlistGroup() {
			if ( woodmartThemeModule.supports_html5_storage ) {
				var fragmentWishlistGroups = JSON.parse( sessionStorage.getItem( fragmentsName ) );

				if ( sessionStorage.getItem( woodmart_settings.wishlist_hash_name ) !== Cookies.get( cookiesHashName ) ) {
					fragmentWishlistGroups = '';
				}

				if ( sessionStorage.getItem( fragmentsName ) !== localStorage.getItem( fragmentsName ) ) {
					fragmentWishlistGroups = '';
				}

				if ( 'undefined' !== typeof actions && ( actions.is_lang_switched === '1' || actions.force_reset === '1' ) ) {
					fragmentWishlistGroups = '';
				}

				if ( fragmentWishlistGroups ) {
					$.each( fragmentWishlistGroups, function( key, html ) {
						woodmartThemeModule.removeDuplicatedStylesFromHTML(html, function(html) {
							$( key ).replaceWith(html);
						});
					});
				} else {
					updateAjaxWishlistGroup();
				}
			} else {
				updateAjaxWishlistGroup();
			}
		}

		function updateAjaxWishlistGroup() {
			$.ajax({
				url     : woodmart_settings.ajaxurl,
				data    : {
					action : 'woodmart_get_wishlist_fragments',
					key    : woodmart_settings.wishlist_fragments_nonce
				},
				dataType: 'json',
				method  : 'GET',
				success : function(response) {
					if (response.fragments) {
						updateFragments( response.fragments, response.hash );
					} else {
						console.log('something wrong loading compare data ', response);
					}
				},
				error   : function() {
					console.log('We cant remove product compare. Something wrong with AJAX response. Probably some PHP conflict.');
				},
			});
		}

		function createNewGroup( nameGroup, $this, is_move = false ) {
			if ( ! nameGroup ) {
				return;
			}

			$this.addClass('loading');

			$.ajax({
				url: woodmart_settings.ajaxurl,
				data: {
					action     : 'woodmart_save_wishlist_group',
					group      : nameGroup,
					key        : woodmart_settings.wishlist_page_nonce,
				},
				dataType: 'json',
				method: 'GET',
				success: function (response) {
					if (response) {
						if (response.wishlist_content) {
							woodmartThemeModule.$document.trigger('wdUpdateWishlistContent', response );
						}

						if ( response.fragments ) {
							updateFragments( response.fragments, response.hash );
						}

						if ( is_move || $this.parents('.wd-create-group-on-page').length ) {
							$.magnificPopup.close();
						}

						var groups = $('.wd-wishlist-content').find('.wd-wishlist-group');

						if ( groups.length ) {
							var position = groups.last().offset().top - woodmart_settings.ajax_scroll_offset;

							$('html, body').stop().animate({
								scrollTop: position
							}, 500);
						}
					} else {
						console.log('something wrong loading wishlist data ', response);
					}
				},
				error: function () {
					console.log('We cant add to wishlist. Something wrong with AJAX response. Probably some PHP conflict.');
				},
				complete: function() {
					$this.removeClass('loading');
					$this.siblings('.wd-wishlist-create-group').find('.wd-wishlist-group-name').val('');
				},
			});
		}
	};

	$(document).ready(function() {
		woodmartThemeModule.wishlistGroup();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.woocommerceComments = function() {
		var hash = window.location.hash;
		var url = window.location.href;

		if ( ! document.querySelector('.wd-hidden-tab-title') && ( hash.toLowerCase().indexOf('comment-') >= 0 || hash === '#reviews' || hash === '#tab-reviews' || url.indexOf('comment-page-') > 0 || url.indexOf('cpage=') > 0 || hash === '#tab-wd_additional_tab' || hash === '#tab-wd_custom_tab' ) ) {
			setTimeout(function() {
				window.scrollTo(0, 0);
			}, 1);

			// When reviews separate section need open first tab.
			if ( $('.single-product-page').hasClass('reviews-location-separate') && ( hash === '#reviews' || hash === '#tab-reviews' || hash.toLowerCase().indexOf('comment-') >= 0 || url.indexOf('comment-page-') > 0 || url.indexOf('cpage=') > 0 ) ) {
				woodmartThemeModule.$body.find('.wc-tabs, ul.tabs').first().find('li:first a').click();
			}

			setTimeout(function() {
				if ($(hash).length > 0) {
					var $link = $('.woocommerce-tabs a[href=' + hash + ']');

					if ( $link.length ) {
						$link.trigger('click');
					}
					setTimeout(function() {
						$('html, body').stop().animate({
							scrollTop: $(hash).offset().top - woodmart_settings.ajax_scroll_offset
						}, 400);
					}, 400);
				}
			}, 10);
		}

		$('.wd-builder-on .woocommerce-review-link').on('click', function () {
			var $tabReviews = $('.wd-single-tabs .wd-accordion:not(.tabs-layout-accordion) .wd-accordion-title.tab-title-reviews');

			if ( !$tabReviews.length ) {
				return;
			}

			$tabReviews.trigger('click');

			setTimeout(function() {
				$('html, body').stop().animate({
					scrollTop: $tabReviews.offset().top - woodmart_settings.ajax_scroll_offset
				}, 400);
			}, 400);
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.woocommerceComments();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.woocommerceNotices = function() {
		var notices = '.woocommerce-error, .woocommerce-info, .woocommerce-message, div.wpcf7-response-output, #yith-wcwl-popup-message, .mc4wp-alert, .dokan-store-contact .alert-success, .yith_ywraq_add_item_product_message';

		woodmartThemeModule.$body.on('click', notices, function() {
			hideMessage($(this));
		});

		var hideMessage = function($msg) {
			$msg.removeClass('shown-notice').addClass('hidden-notice');
		};
	};

	$(document).ready(function() {
		woodmartThemeModule.woocommerceNotices();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdBackHistory wdShopPageInit', function() {
		woodmartThemeModule.woocommercePriceSlider();
	});

	woodmartThemeModule.woocommercePriceSlider = function() {
		var $amount          = $('.price_slider_amount');
		var $min_price       = $('.price_slider_amount #min_price');
		var $max_price       = $('.price_slider_amount #max_price');
		var $products        = $('.products');
		var currentUrlParams = new URL(window.location.href);

		if (typeof woocommerce_price_slider_params === 'undefined' || $min_price.length < 1 || !$.fn.slider) {
			return false;
		}

		var $slider = $('.price_slider');

		if ($slider.slider('instance') !== undefined) {
			return;
		}

		// Get markup ready for slider
		$('input#min_price, input#max_price').hide();
		$('.price_slider, .price_label').show();

		// Price slider uses $ ui
		var min_price         = parseInt($min_price.data('min'));
		var max_price         = parseInt($max_price.data('max'));
		var step              = $amount.data('step') || 1;
		var current_min_price = parseInt(currentUrlParams.searchParams.has('min_price') ? currentUrlParams.searchParams.get('min_price') : min_price, 10);
		var current_max_price = parseInt(currentUrlParams.searchParams.has('max_price') ? currentUrlParams.searchParams.get('max_price') : max_price, 10);

		if ($products.attr('data-min_price') && $products.attr('data-min_price').length > 0) {
			current_min_price = parseInt($products.attr('data-min_price'), 10);
		}

		if ($products.attr('data-max_price') && $products.attr('data-max_price').length > 0) {
			current_max_price = parseInt($products.attr('data-max_price'), 10);
		}

		$slider.slider({
			range  : true,
			animate: true,
			min    : min_price,
			max    : max_price,
			step   : step,
			values : [
				current_min_price,
				current_max_price
			],
			create : function() {
				$min_price.val(current_min_price);
				$max_price.val(current_max_price);

				woodmartThemeModule.$body.trigger('price_slider_create', [
					current_min_price,
					current_max_price
				]);
			},
			slide  : function(event, ui) {
				$min_price.val(ui.values[0]);
				$max_price.val(ui.values[1]);

				woodmartThemeModule.$body.trigger('price_slider_slide', [
					ui.values[0],
					ui.values[1]
				]);
			},
			change : function(event, ui) {
				woodmartThemeModule.$body.trigger('price_slider_change', [
					ui.values[0],
					ui.values[1]
				]);
			}
		});

		setTimeout(function() {
			woodmartThemeModule.$body.trigger('price_slider_create', [
				current_min_price,
				current_max_price
			]);

			if ($slider.find('.ui-slider-range').length > 1) {
				$slider.find('.ui-slider-range').first().remove();
			}
		}, 10);
	};

	$(document).ready(function() {
		woodmartThemeModule.woocommercePriceSlider();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.woocommerceQuantity = function() {
		if (!String.prototype.getDecimals) {
			Object.defineProperty(String.prototype, 'getDecimals', {
				value: function() {
					var num = this,
						match = ('' + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);

					if (!match) {
						return 0;
					}

					return Math.max(0, (match[1] ? match[1].length : 0) - (match[2] ? +match[2] : 0));
				},
				enumerable: false
			});
		}

		woodmartThemeModule.$document.on('click', '.plus, .minus', function() {
			var $this      = $(this),
			    $qty       = $this.closest('.quantity').find('.qty'),
			    currentVal = parseFloat($qty.val()),
			    max        = parseFloat($qty.attr('max')),
			    min        = parseFloat($qty.attr('min')),
			    step       = $qty.attr('step');

			if (!currentVal || currentVal === '' || currentVal === 'NaN') {
				currentVal = 0;
			}
			if (max === '' || max === 'NaN') {
				max = '';
			}
			if (min === '' || min === 'NaN') {
				min = 0;
			}
			if (step === 'any' || step === '' || step === undefined || parseFloat(step) == 'NaN') {
				step = '1';
			}

			if ($this.is('.plus')) {
				if (max && ((currentVal + parseFloat(step)).toFixed(step.getDecimals()) >= max)) {
					$qty.val(max);
				} else {
					$qty.val((currentVal + parseFloat(step)).toFixed(step.getDecimals()));
				}
			} else {
				if (min && ((currentVal - parseFloat(step)).toFixed(step.getDecimals()) <= min)) {
					$qty.val(min);
				} else if (currentVal > 0) {
					$qty.val((currentVal - parseFloat(step)).toFixed(step.getDecimals()));
				}
			}

			$qty.trigger('change');
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.woocommerceQuantity();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.woocommerceWrappTable = function() {
		$('.shop_table:not(.shop_table_responsive):not(.woocommerce-checkout-review-order-table)').wrap('<div class=\'responsive-table\'></div>');
	};

	$(document).ready(function() {
		woodmartThemeModule.woocommerceWrappTable();
	});
})(jQuery);

/* global woodmart_settings */
(function($) {
	woodmartThemeModule.$document.on('wdShopPageInit wdUpdateWishlist wdArrowsLoadProducts wdLoadMoreLoadProducts wdProductsTabsLoaded wdSearchFullScreenContentLoaded wdBackHistory wdRecentlyViewedProductLoaded', function() {
		woodmartThemeModule.woodmartCompareUpdateState();
	});

	woodmartThemeModule.woodmartCompare = function() {
		var cookiesName = 'woodmart_compare_list';

		if (woodmart_settings.is_multisite) {
			cookiesName += '_' + woodmart_settings.current_blog_id;
		}

		if ( typeof Cookies === 'undefined' ) {
			return;
		}

		var $body         = woodmartThemeModule.$body,
		    $widget       = $('.wd-header-compare'),
		    compareCookie = Cookies.get(cookiesName);

		if ($widget.length > 0) {
			if ('undefined' !== typeof compareCookie) {
				try {
					var ids = JSON.parse(compareCookie);
					$widget.find('.wd-tools-count').text(ids.length);
				}
				catch (e) {
					console.log('cant parse cookies json');
				}
			} else {
				$widget.find('.wd-tools-count').text(0);
			}

			if ( 'undefined' !== typeof woodmart_settings.compare_by_category && 'yes' === woodmart_settings.compare_by_category ) {
				try {
					getProductsCategory();
				}
				catch (e) {
					getAjaxProductCategory();
				}
			}
		}

		$body.on('click', '.wd-compare-btn a', function(e) {
			var $this     = $(this),
			    id        = $this.data('id'),
			    $widget = $('.wd-header-compare');

			if ($this.hasClass('added')) {
				return true;
			}

			e.preventDefault();

			if ( ! $widget.find('.wd-dropdown-compare').length ) {
				var products = [];
				var productsCookies = Cookies.get(cookiesName);

				if ( 'undefined' !== typeof productsCookies && productsCookies ) {
					products = Object.values( JSON.parse(productsCookies) );
				}

				if ( ! products.length || -1 === products.indexOf(id.toString()) ) {
					products.push( id.toString() );
				}

				var count = products.length;

				updateCountWidget(count);

				Cookies.set(cookiesName, JSON.stringify(products), {
					expires: 7,
					path   : woodmart_settings.cookie_path,
					secure : woodmart_settings.cookie_secure_param
				});

				updateButton( $this );

				return;
			}

			$this.addClass('loading');

			jQuery.ajax({
				url     : woodmart_settings.ajaxurl,
				data    : {
					action: 'woodmart_add_to_compare',
					id    : id
				},
				dataType: 'json',
				method  : 'GET',
				success : function(response) {
					if ( response.count ) {
						var $widget = $('.wd-header-compare');

						if ($widget.length > 0) {
							$widget.find('.wd-tools-count').text(response.count);
						}

						updateButton( $this );
					} else {
						console.log('something wrong loading compare data ', response);
					}

					if (response.fragments) {
						$.each( response.fragments, function( key, value ) {
							$( key ).replaceWith(value);
						});

						sessionStorage.setItem( cookiesName + '_fragments', JSON.stringify( response.fragments ) );
					}
				},
				error   : function() {
					console.log('We cant add to compare. Something wrong with AJAX response. Probably some PHP conflict.');
				},
				complete: function() {
					$this.removeClass('loading');
				}
			});
		});

		$body.on('click', '.wd-compare-remove', function(e) {
			e.preventDefault();
			var $this      = $(this),
			    id         = $this.data('id'),
				categoryId = '';

			if ('undefined' !== typeof woodmart_settings.compare_by_category && 'yes' === woodmart_settings.compare_by_category) {
				categoryId = $this.parents('.wd-compare-table').data('category-id');

				if ( categoryId && 1 >= $this.parents('.compare-value').siblings().length ) {
					removeProductCategory( categoryId, $this.parents('.wd-compare-page') );
					return;
				}
			}

			$this.addClass('loading');

			jQuery.ajax({
				url     : woodmart_settings.ajaxurl,
				data    : {
					action     : 'woodmart_remove_from_compare',
					id         : id,
					category_id: categoryId,
					key        : woodmart_settings.compare_page_nonce,
				},
				dataType: 'json',
				method  : 'GET',
				success : function(response) {
					if (response.table) {
						updateCompare(response);

						if (response.fragments) {
							$.each( response.fragments, function( key, value ) {
								$( key ).replaceWith(value);
							});

							sessionStorage.setItem( cookiesName + '_fragments', JSON.stringify( response.fragments ) );
						}
					} else {
						console.log('something wrong loading compare data ', response);
					}
				},
				error   : function() {
					console.log('We cant remove product compare. Something wrong with AJAX response. Probably some PHP conflict.');
				},
				complete: function() {
					$this.remove('loading');
				}
			});
		});

		$body.on('change', '.wd-compare-select', function (e) {
			e.preventDefault();

			var $this = $(this);
			var $wrapper = $this.parents('.wd-compare-page');
			var $activeCompareTable = $wrapper.find('.wd-compare-table[data-category-id=' + $this.val() + ']');
			var $oldActiveCompareTable = $wrapper.find('.wd-compare-table.wd-active');
			var animationTime = 100;

			$wrapper.find('.wd-compare-cat-link').attr( 'href', $activeCompareTable.data('category-url') );

			$oldActiveCompareTable.removeClass('wd-in');

			setTimeout(function() {
				$oldActiveCompareTable.removeClass('wd-active');
			}, animationTime);

			setTimeout(function() {
				$activeCompareTable.addClass('wd-active');
			}, animationTime);

			setTimeout(function() {
				$activeCompareTable.addClass('wd-in');
				woodmartThemeModule.$document.trigger('wood-images-loaded');
			}, animationTime * 2);
		});

		$body.on('click', '.wd-compare-remove-cat', function (e) {
			e.preventDefault();

			var $this = $(this);
			var activeCategory = $this.parents('.wd-compare-header').find('.wd-compare-select').val();
			var $wrapper = $this.parents('.wd-compare-page');

			removeProductCategory( activeCategory, $wrapper );
		});

		function removeProductCategory( activeCategory, $wrapper ) {
			var $loader = $wrapper.find('.wd-loader-overlay');

			$loader.addClass('wd-loading');

			jQuery.ajax({
				url     : woodmart_settings.ajaxurl,
				data    : {
					action     : 'woodmart_remove_category_from_compare',
					category_id: activeCategory,
					key        : woodmart_settings.compare_page_nonce,
				},
				dataType: 'json',
				method  : 'GET',
				success : function(response) {
					if (response.table) {
						updateCompare(response);

						if (response.fragments) {
							$.each( response.fragments, function( key, value ) {
								$( key ).replaceWith(value);
							});

							sessionStorage.setItem( cookiesName + '_fragments', JSON.stringify( response.fragments ) );
						}
					} else {
						console.log('something wrong loading compare data ', response);
					}
				},
				error   : function() {
					console.log('We cant remove product compare. Something wrong with AJAX response. Probably some PHP conflict.');
				},
				complete: function() {
					$loader.removeClass('wd-loading');

					var $compareTable = $('.wd-compare-table').first();

					setTimeout(function() {
						$compareTable.addClass('wd-active');
					}, 100);

					setTimeout(function() {
						$compareTable.addClass('wd-in');
						woodmartThemeModule.$document.trigger('wood-images-loaded');
					}, 200);
				}
			});
		}

		function updateCompare(data) {
			var $widget = $('.wd-header-compare');

			if ($widget.length > 0) {
				$widget.find('.wd-tools-count').text(data.count);
			}

			woodmartThemeModule.removeDuplicatedStylesFromHTML(data.table, function(html) {
				var $wcCompareWrapper = $('.wd-compare-page');
				var $wcCompareTable = $('.wd-compare-table');

				if ($wcCompareWrapper.length > 0) {
					$wcCompareWrapper.replaceWith(html);
				} else if ($wcCompareTable.length > 0) {
					$wcCompareTable.replaceWith(html);
				}
			});

			if ('undefined' !== typeof woodmart_settings.compare_by_category && 'yes' === woodmart_settings.compare_by_category) {
				woodmartThemeModule.$document.trigger('wdTabsInit');
			}
		}

		function getProductsCategory() {
			if ( woodmartThemeModule.supports_html5_storage ) {
				var fragmentProductCategory = JSON.parse( sessionStorage.getItem( cookiesName + '_fragments' ) );

				if ( 'undefined' !== typeof actions && ( actions.is_lang_switched === '1' || actions.force_reset === '1' ) ) {
					fragmentProductCategory = '';
				}

				if ( fragmentProductCategory ) {
					$.each( fragmentProductCategory, function( key, value ) {
						$( key ).replaceWith(value);
					});
				} else {
					getAjaxProductCategory();
				}
			} else {
				getAjaxProductCategory();
			}
		}

		function getAjaxProductCategory() {
			jQuery.ajax({
				url     : woodmart_settings.ajaxurl,
				data    : {
					action : 'woodmart_get_fragment_product_category_compare',
				},
				dataType: 'json',
				method  : 'GET',
				success : function(response) {
					if (response.fragments) {
						$.each( response.fragments, function( key, value ) {
							$( key ).replaceWith(value);
						});

						sessionStorage.setItem( cookiesName + '_fragments', JSON.stringify( response.fragments ) );
					} else {
						console.log('something wrong loading compare data ', response);
					}
				},
				error   : function() {
					console.log('We cant remove product compare. Something wrong with AJAX response. Probably some PHP conflict.');
				},
			});
		}

		function updateButton( $button ) {
			var addedText = $button.data('added-text');

			if ($button.find('.wd-action-text').length > 0) {
				$button.find('.wd-action-text').text(addedText);
			} else {
				$button.text(addedText);
			}

			$button.addClass('added');

			woodmartThemeModule.$document.trigger('added_to_compare');
			woodmartThemeModule.$document.trigger('wdUpdateTooltip', $button);
		}

		function updateCountWidget(count) {
			var $widget = $('.wd-header-compare');

			if ($widget.length > 0) {
				$widget.find('.wd-tools-count').text(count);
			}
		}
	};

	woodmartThemeModule.woodmartCompareUpdateState = function() {
		if ( 'undefined' === typeof woodmart_settings.compare_save_button_state || 'yes' !== woodmart_settings.compare_save_button_state || 'undefined' === typeof Cookies ) {
			return;
		}

		var cookiesName = 'woodmart_compare_list';
		var products = [];

		if (woodmart_settings.is_multisite) {
			cookiesName += '_' + woodmart_settings.current_blog_id;
		}

		var productsCookies = Cookies.get(cookiesName);

		if ( 'undefined' !== typeof productsCookies && productsCookies ) {
			products = Object.values( JSON.parse(productsCookies) );
		}

		if ( ! products.length ) {
			return;
		}

		$.each(products, function( index, id ) {
			var $button = $('.wd-compare-btn a[data-id=' + id + ']');

			if ( ! $button.length || $button.hasClass('added') ) {
				return;
			}

			$button.addClass('added');

			var addedText = $button.data('added-text');

			if ($button.find('.wd-action-text').length > 0) {
				$button.find('.wd-action-text').text(addedText);
			} else {
				$button.text(addedText);
			}
		});
	};

	$(document).ready(function() {
		woodmartThemeModule.woodmartCompare();
		woodmartThemeModule.woodmartCompareUpdateState();
	});
})(jQuery);
