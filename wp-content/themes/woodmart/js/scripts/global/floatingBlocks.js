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
