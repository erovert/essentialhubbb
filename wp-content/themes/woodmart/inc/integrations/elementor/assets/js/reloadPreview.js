(function ($) {
	function init() {
		const page = elementor?.settings?.page;
		if (!page) return;

		const controls = page.editedView.container.controls || {};

		Object.keys(controls).forEach((key) => {
			const control = controls[key];
			if (control.wd_reload_preview) {
				page.addChangeCallback(key, (newValue) => {
					$e.internal('panel/state-loading');
					$e.run('document/save/update').then(function(){
						elementor.reloadPreview();
						elementor.once('preview:loaded', function(){
							setTimeout(function(){
								$e.internal('panel/state-ready');
								$e.route('panel/page-settings/' + control.tab);
							}, 1);
						});
					});
				});
			}
		});
	}

	$(window).on('elementor:init', init);
})(jQuery);
