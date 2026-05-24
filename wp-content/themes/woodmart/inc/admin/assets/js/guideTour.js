/* global woodmartConfig, woodmart_settings */

(function($) {
	'use strict';
	window.addEventListener('load',function() {
		if (! $('body').hasClass('elementor-editor-wp-page')) {
			initGuide();
		}
	});

	if (typeof elementor !== 'undefined' && elementor.on) {
		elementor.once('preview:loaded', function() {
			const checkLoaderHidden = setInterval(() => {
				const loader = document.querySelector('#elementor-loading');

				if (!loader || loader.style.display === 'none') {
					clearInterval(checkLoaderHidden);

					initGuide()
				}
			}, 2000);
		});
	}

	function initGuide() {
		if (!window.driver || (('undefined' === typeof woodmartConfig && 'undefined' === typeof woodmart_settings) || (('undefined' !== typeof woodmartConfig && !woodmartConfig.guide_tour) && ('undefined' !== typeof woodmart_settings && !woodmart_settings.guide_tour)))) {
			return;
		}

		let config = {};

		if ('undefined' !== typeof woodmartConfig) {
			config = woodmartConfig;
		} else {
			config = woodmart_settings;
		}

		if ('undefined' === typeof config.guide_tour) {
			return;
		}

		const steps = config.guide_tour;
		const currentIndex = getCookieValue();

		const validStepIndex = getValidStepIndex(steps, currentIndex);
		console.log(validStepIndex)
		if (validStepIndex !== null) {
			const driverObj = window.driver.js.driver({
				showProgress: true,
				smoothScroll: true,
				overlayClickBehavior: 'none',
				allowKeyboardControl: false,
				nextBtnText: config.guide_next_text,
				prevBtnText: config.guide_back_text,
				doneBtnText: config.guide_done_text,
				steps: steps,
				onDestroyStarted: (element, step, options) => {
					if (options.driver.isLastStep()) {
						let url = config.guide_url_end;
						const param = 'wd_guide_done=' + getCookieValue('tour_id');

						if (url.includes('?')) {
							if (!url.includes('wd_guide_done=')) {
								url += '&' + param;
							}
						} else {
							url += '?' + param;
						}

						updateCookie(null);

						window.location.href = url;
					}
				},
				onHighlightStarted: onHighlightStartedStep,
			});

			driverObj.drive(validStepIndex);

			$('.xts-tour-close').on('click', function() {
				driverObj.destroy();
				updateCookie(null);

				const url = new URL(window.location);
				url.searchParams.delete('wd_tour');

				let $body = $('body');

				$body.removeClass('driver-active-iframe')

				$body.attr('class').split(/\s+/).forEach(function(cls) {
					if (/^wd-guide-step-\d+$/.test(cls) || /^wd-guide-tour-\d+$/.test(cls)) {
						$body.removeClass(cls);
					}
				});

				window.history.replaceState({}, document.title, url.toString());
			});

			$('.xts-step-heading').on('click', function() {
				$(this).parents('.xts-tour-step').toggleClass('xts-open');
			});

			$('.xts-tour-collapse').on('click', function(e) {
				e.preventDefault();

				let $wrapper = $(this).parents('.xts-tour-navigation');

				$wrapper.toggleClass('xts-collapse');

				updateCookie( $wrapper.hasClass('xts-collapse'), 'collapse' );
			})
		} else {
			updateCookie(null);
		}
	}

	function onHighlightStartedStep( element, step, options, documentType = 'document' ) {
		let config = {};

		if ('undefined' !== typeof woodmartConfig) {
			config = woodmartConfig;
		} else {
			config = woodmart_settings;
		}

		if ('document' === documentType && 'string' === typeof step.element && step.element.includes(' iframe ')) {
			const iframeSelector = step.element.split(' iframe ')[0] + ' iframe';
			const innerSelector = step.element.split(' iframe ')[1];

			if (document.querySelector(iframeSelector)) {
				const iframe = document.querySelector(iframeSelector);

				if (iframe && iframe.contentWindow && iframe.contentDocument) {
					const innerElement = iframe.contentDocument.querySelector(innerSelector);

					if (innerElement && iframe.contentWindow.driver) {
						setTimeout(() => {
							options.driver.destroy()

							$('body').addClass('driver-active-iframe')
						}, 100)

						const driverObjIframe = iframe.contentWindow.driver.js.driver({
							showProgress: true,
							smoothScroll: true,
							overlayClickBehavior: 'none',
							allowKeyboardControl: false,
							nextBtnText: config.guide_next_text,
							prevBtnText: config.guide_back_text,
							doneBtnText: config.guide_done_text,
							onHighlightStarted: (iframeElement, iframeStep, iframeOptions) => {
								onHighlightStartedStep(iframeElement, step, options, 'iframe');

								if ((iframeStep.type === 'button' || iframeStep.type === 'hover') && step.element) {
									const allowedSelectors = 'input:not([disabled], [type=hidden]), button, a, .wd-action, [draggable=true], [role="button"], [role="link"], [type="button"]';
									let action = 'click';

									let $target = $(iframeStep.element);

									let $allowedInner = $target.find(allowedSelectors);

									if (!$target.is(allowedSelectors) && $allowedInner.length) {
										$target = $allowedInner;
									}

									if ( $target.is('input') && $target.attr('type') !== 'submit' ) {
										action = 'change';
									}

									action = step.type === 'hover' ? 'mouseenter' : action;

									$target.one( action + '.wdGuideStep', function () {
										iframeOptions.driver.destroy();

										$('body').removeClass('driver-active-iframe')
									})
								} else {
									$('body').removeClass('driver-active-iframe')
								}
							}
						});

						if (step.popover && Array.isArray(step.popover.showButtons)) {
							const index = step.popover.showButtons.indexOf('previous');
							if (index !== -1) {
								step.popover.showButtons.splice(index, 1);
							}
						}

						driverObjIframe.highlight({
							...step,
							element: innerElement,
						});

						return;
					}
				}
			}
		}

		let activeStep = options.driver.getActiveIndex()

		updateCookie(activeStep);
		updateTourNavigation(activeStep);

		if (step.skipIf) {
			try {
				const shouldSkip = new Function(`return (${step.skipIf});`)();

				if (shouldSkip) {
					setTimeout(() => {
						options.driver.moveNext();

						options.driver.refresh();
					})

					return;
				}
			} catch (e) {
				console.error(e);
			}
		}

		if ((step.type === 'button' || step.type === 'hover') && step.element) {
			const allowedSelectors = 'input:not([disabled], [type=hidden]), button, a, .wd-action, [draggable=true], [role="button"], [role="link"], [type="button"]';
			let navigatingAway = false;
			let action = 'click';

			let $target = $(step.element);

			if ('string' === typeof step.element && step.element.includes(' iframe ')) {
				const iframeSelector = step.element.split(' iframe ')[0] + ' iframe';
				const innerSelector = step.element.split(' iframe ')[1];

				if (document.querySelector(iframeSelector)) {
					const iframe = document.querySelector(iframeSelector);

					if (iframe && iframe.contentWindow && iframe.contentDocument) {
						$target = $(iframe.contentDocument.querySelector(innerSelector));
					}
				}
			}

			let $allowedInner = $target.find(allowedSelectors);

			if ($allowedInner.length) {
				$target = $allowedInner;
			}

			if (!$target.length) {
				return;
			}

			if ( $target.is('input') && $target.attr('type') !== 'submit' ) {
				action = 'change';
			}

			action = step.type === 'hover' ? 'mouseenter' : action;

			window.addEventListener('beforeunload', function () {
				navigatingAway = true;
			}, { once: true });

			$target.off(action + '.wdGuideStep').one( action + '.wdGuideStep', function () {
				setTimeout(function () {
					if (!navigatingAway) {
						if (step.isDone) {
							const callback = () => {
								options.driver.drive(activeStep + 1)
							}

							try {
								const fn = new Function('options', 'activeStep', 'callback', step.isDone);
								fn(options, activeStep, callback);
							} catch (e) {
								console.error(e)
							}

							options.driver.destroy(); // pause the tour
						} else {
							if (options.driver.isActive()) {
								options.driver.moveNext();
							} else {
								options.driver.drive(activeStep + 1)
							}
						}
					}
				});

				if ( !step.isDone ) {
					updateCookie(activeStep + 1);
				}
			});
		}

		if (element && 'undefined' !== typeof step.offset && step.offset) {
			const rect = element.getBoundingClientRect();
			const viewportHeight = window.innerHeight;
			const offset = step.offset;

			if (rect.height + offset < viewportHeight) {
				const distanceToBottom = viewportHeight - rect.bottom;

				if (distanceToBottom < offset) {
					const scrollY = window.scrollY + (offset - distanceToBottom) + 10;

					window.scrollTo({
						top: scrollY,
						behavior: 'smooth'
					});
				}
			}
		}

		setTimeout(function () {
			options.driver.refresh();
		}, 500)
	}

	function getValidStepIndex(steps, startIndex) {
		let validIndex = null;

		for (let i = startIndex; i >= 0; i--) {
			const selector = steps[i]?.element;
			if (selector && document.querySelector(selector)) {
				validIndex = i;
				break;
			}
		}

		if (validIndex === null) return null;

		let currentIndex = validIndex;

		if (steps[currentIndex].skipIf ) {
			while (currentIndex < steps.length) {
				const step = steps[currentIndex];
				const selector = step?.element;

				if (!selector || !document.querySelector(selector)) {
					currentIndex++;
					continue;
				}

				if (typeof step.skipIf === 'string') {
					try {
						const shouldSkip = new Function(`return (${step.skipIf});`)();

						if (shouldSkip) {
							updateCookie(currentIndex);
							updateTourNavigation(currentIndex);

							currentIndex++;
							continue;
						}
					} catch (e) {
						console.error('Error in skipIf expression:', e);
					}
				}

				return currentIndex;
			}
		}

		return validIndex;
	}

	function updateCookie(value, key = 'step') {
		const cookieName = 'woodmart_guide_tour';
		let config = typeof woodmartConfig !== 'undefined' ? woodmartConfig : woodmart_settings;
		let parsed = null;

		if (typeof Cookies === 'undefined') {
			return;
		}

		const rawValue = Cookies.get(cookieName);

		if (rawValue) {
			parsed = JSON.parse(rawValue);
		}

		if (!parsed || typeof parsed.tour_id === 'undefined' || !parsed.tour_id) {
			const urlParams = new URLSearchParams(window.location.search);
			const tourIdFromUrl = urlParams.get('wd_tour');

			parsed = {
				tour_id: tourIdFromUrl || null,
				[key]: value
			};
		} else {
			parsed[key] = value;
		}

		let newCookieValue = null;

		if (value != null) {
			newCookieValue = JSON.stringify(parsed)
		}

		Cookies.set(cookieName, newCookieValue, {
			expires: 1,
			path   : config.cookie_path,
			secure : config.cookie_secure_param
		});
	}

	function getCookieValue( name = 'step') {
		const cookieName = 'woodmart_guide_tour';
		const rawValue = Cookies.get(cookieName);

		if (rawValue) {
			const parsed = JSON.parse(rawValue);

			if (parsed && typeof parsed[name] !== 'undefined') {
				return parsed[name];
			}
		}

		if (name === 'tour_id') {
			const urlParams = new URLSearchParams(window.location.search);
			if (urlParams.has('wd_tour')) {
				return urlParams.get('wd_tour');
			}
		}

		return 0;
	}

	function updateTourNavigation( step ) {
		if ( ! step ) {
			return;
		}

		const $body = $('body');
		let $wrapper = $('.xts-tour-navigation');
		let $heading = $wrapper.find('.xts-tour-heading');
		let $steps = $wrapper.find('.xts-tour-step li');
		let $currentStep = $steps.eq(step);
		let $prevStep = $steps.filter('.xts-active');
		let $progressBar = $wrapper.find('.xts-tour-progress-bar');

		$body.attr('class').split(/\s+/).forEach(function(cls) {
			if (/^wd-guide-step-\d+$/.test(cls)) {
				$body.removeClass(cls);
			}
		});

		$heading.find('.xts-step-title').text( $currentStep.text() )

		if ( null !== $currentStep.length ) {
			$body.addClass(`wd-guide-step-${step}`);
		}

		$progressBar.css('width', `${(step + 1) / $steps.length * 100}%`);

		if (! $currentStep.parents('.xts-tour-step').hasClass('xts-active')) {
			$prevStep.parents('.xts-tour-step').removeClass('xts-active xts-open').addClass('xts-done');

			$currentStep.parents('.xts-tour-step').addClass('xts-active xts-open');
		}

		$prevStep.addClass('xts-done');

		$steps.each(function(index) {
			if (index >= step) {
				$(this).removeClass('xts-done');
				$(this).parents('.xts-tour-step').removeClass('xts-done');
			}
		});

		$steps.removeClass('xts-active')
		$currentStep.addClass('xts-active');
	}
})(jQuery);