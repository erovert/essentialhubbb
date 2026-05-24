/* global jQuery, woodmartConfig */

(function($) {
	'use strict';

	function saveThemeSettings() {
		let formChanged = false;
		let $form = $('.xts-options .xts-box-content form');
		let $noticeWrapper = $form.find('.xts-notices-wrapper');

		$(document).on('change irischange', 'input[name^="xts-woodmart-options"], select[name^="xts-woodmart-options"], textarea[name^="xts-woodmart-options"]', function () {
			let $this = $(this);

			if (! $this.attr('data-changed')) {
				$this.attr('data-changed', 1);

				clearNotice();
			}

			formChanged = true;
		})

		if ('undefined' !== typeof tinymce) {
			$('.xts-textarea-control textarea[name^="xts-woodmart-options"]').each(function() {
				let $textarea = $(this);
				let editor = tinymce.get($textarea.attr('id'));

				if (editor) {
					editor.on('change keyup', function () {
						if (! $textarea.attr('data-changed')) {
							$textarea.attr('data-changed', 1);

							clearNotice();
						}

						formChanged = true;
					});
				}
			})
		}

		$(window).on('beforeunload', function (e) {
			if (formChanged) {
				e.preventDefault();
				return '';
			}
		});

		$form.on('submit', function (e) {
			let $submit = $(e.originalEvent.submitter);

			if ('xts-woodmart-options[reset-defaults]' === $submit.attr('name') || 'xts-woodmart-options[import-btn]' === $submit.attr('name')) {
				formChanged = false;

				return;
			}

			e.preventDefault();

			let $form = $(this);
			let $wrapper = $form.parents('.xts-box-content');
			let formData = new FormData();

			$form.find('> input[type="hidden"]').each(function () {
				formData.append($(this).attr('name'), $(this).val());
			})

			$form.find('[data-changed="1"][name^="xts-woodmart-options"]').each(function () {
				let $element = $(this);
				let name = $element.attr('name');

				$element.attr('data-changed', null);

				$element.removeClass('xts-changed');

				if (formData.has(name)) {
					return;
				}

				let match = name.match(/\[([^\]]+)\]\[([^\]]+)\]/);

				if (!match || match.length < 2) {
					if ( $element.attr('disabled') ) {
						formData.append(name, '');
					} else if ($element.is('select[multiple]')) {
						let values = $element.val() || [];

						if (values.length === 0) {
							formData.append(name, '');
						} else {
							values.forEach(value => {
								formData.append(name, value);
							});
						}
					} else {
						formData.append(name, $element.val());
					}
				} else {
					let mainKey = match[1];

					$element
						.closest('.xts-fields')
						.find(`input[name^="xts-woodmart-options[${mainKey}]"], select[name^="xts-woodmart-options[${mainKey}]"]`)
						.each(function () {
							let $siblingElement = $(this);
							let siblingName = $siblingElement.attr('name');

							$siblingElement.attr('data-changed', null);

							if (!formData.has(siblingName) && siblingName.search('{{index}}') === -1) {
								if ( $siblingElement.attr('disabled') ) {
									formData.append(siblingName, '');
								} else if ($siblingElement.is('select[multiple]')) {
									let values = $siblingElement.val() || [];

									if (values.length === 0) {
										formData.append(siblingName, '');
									} else {
										values.forEach(value => {
											formData.append(siblingName, value);
										});
									}
								} else {
									formData.append(siblingName, $siblingElement.val());
								}
							}
						});
				}
			});

			$wrapper.addClass('xts-loading');

			$.ajax({
				url: $form.attr('action'),
				type: 'POST',
				data: formData,
				processData: false,
				contentType: false,
				success: function (response) {
					let $responseHtml = $(response);
					let noticeContent = $responseHtml.find('.xts-notices-wrapper').html();

					if ($responseHtml.find('.xts-header li > a').length !== $('.xts-header li > a').length || $responseHtml.find('#adminmenu li > a').length !== $('#adminmenu li > a').length) {
						formChanged = false;
						location.reload();
					}

					$noticeWrapper.html(noticeContent);

					setTimeout(function () {
						clearNotice();
					}, 30000);
				},
				error: function () {
					$form.off('submit').trigger('submit');
				},
				complete: function () {
					formChanged = false;
					$wrapper.removeClass('xts-loading');
				}
			});
		});

		function clearNotice() {
			if ($noticeWrapper.html()) {
				$noticeWrapper.html('');
			}
		}
	}

	jQuery(document).ready(function() {
		saveThemeSettings();
	});
})(jQuery);