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
