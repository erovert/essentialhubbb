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
