/* global woodmartConfig jQuery */
(function($) {
	'use strict'

	var $wrapper = $('.wd-add-fb')
	var $form = $wrapper.find('form')
	var $floating_block = $wrapper.find('.xts-popup')
	var fbType = 'Floating block'

	if ($('.post-type-wd_popup').length) {
		fbType = 'Popup'
	}

	const showNotice = function($floating_block, message, status) {
		$floating_block.find('.xts-notices-wrapper').text('')
		$floating_block
			.find('.xts-notices-wrapper')
			.append('<div class="xts-notice xts-' + status + '">' + message + '</div>')
		$floating_block.removeClass('xts-loading')
	}

	// Form.
	$form.on('submit', function(e) {
		e.preventDefault()

		if ($(this).hasClass('xts-disabled') || $(this).prop('disabled')) {
			return false
		}

		var floatingName = $form.find('.xts-fb-name').val()
		var blockType = $form.find('.xts-fb-type').val()

		$floating_block.addClass('xts-loading')

		$.ajax({
			url: woodmartConfig.ajaxUrl,
			method: 'POST',
			data: {
				action: $wrapper.data('ajax-action'),
				name: floatingName,
				floating_type: blockType,
				predefined_name: $form
					.find('.xts-popup-predefined-layout.xts-active')
					.data('name'),
				security: woodmartConfig.get_new_template_nonce,
			},
			dataType: 'json',
			success: function(response) {
				if (!response.redirect_url) {
					showNotice($floating_block, woodmartConfig.fb_creation_error, 'warning')
				} else {
					window.location.href = response.redirect_url
				}
			},
			error: function() {
				showNotice($floating_block, woodmartConfig.fb_creation_error, 'warning')
			},
		})

		$('.xts-fb-type').val('')
	})

	// Predefined.
	$('.xts-popup-predefined-layout').on('click', function() {
		var $this = $(this)
		$this.siblings().removeClass('xts-active')
		$this.toggleClass('xts-active')
		if ($this.hasClass('xts-active')) {
			$wrapper.find('.xts-add-floating-block-submit').removeClass('xts-disabled')
		} else {
			$wrapper.find('.xts-add-floating-block-submit').addClass('xts-disabled')
		}
	})

	// Change layout type.
	$form.find('.xts-fb-type').on('change', function() {
		var floatingType = $(this).val()
		var $name = $form.find('.xts-fb-name')

		if (floatingType) {
			$name.val($(this).find('option:selected').text() + ' ' + fbType.toLowerCase())
			$wrapper.find('.xts-add-floating-block-submit').addClass('xts-disabled')
		} else {
			$name.val(fbType)
			$wrapper.find('.xts-add-floating-block-submit').removeClass('xts-disabled')
		}

		$('.xts-popup-predefined-layouts').addClass('xts-hidden')
		$('.xts-popup-predefined-layout').removeClass('xts-active')

		$(
			'.xts-popup-predefined-layouts[data-type="' + floatingType + '"]'
		).removeClass('xts-hidden')
	})

	// Floating block.
	$(
		'.page-title-action, :is(.menu-icon-wd_floating_block, .menu-icon-wd_popup) li:not(.wp-first-item):not(:last-child) a, .post-type-wd_floating_block .wd-add-floating-block a, .post-type-wd_popup .wd-add-popup a'
	).on('click', function(event) {
		event.preventDefault()
		$wrapper.find('.xts-popup-holder').addClass('xts-opened')
		$('html').addClass('xts-popup-opened')

		setTimeout(function() {
			var $input = $form.find('.xts-fb-name')
			var strLength = $input.val().length
			$input.trigger('focus')
			$input[0].setSelectionRange(strLength, strLength)
		}, 100)
	})

	$(document).on('click', '.xts-popup-opener', function() {
		$(this).parent().addClass('xts-opened')
		$('html').addClass('xts-popup-opened')
	})

	$(document).on('click', '.xts-popup-close, .xts-popup-overlay', function() {
		$('.xts-fb-type').val('')
		$('.xts-fb-name').val(fbType)
		$('.xts-popup-predefined-layouts').addClass('xts-hidden')
		$('.xts-add-floating-block-submit').removeClass('xts-disabled')
		$('.xts-popup-holder').removeClass('xts-opened')
		$('html').removeClass('xts-popup-opened')
	})
})(jQuery)
