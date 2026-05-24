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
