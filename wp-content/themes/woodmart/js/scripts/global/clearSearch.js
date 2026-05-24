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
