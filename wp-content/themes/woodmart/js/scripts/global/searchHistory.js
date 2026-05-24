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
