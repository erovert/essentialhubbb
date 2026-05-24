/* global woodmartConfig, woodmartAdminModule */
(function($) {
    // Condition query select2.
    function conditionQuerySelect2($field) {
        $field.select2({
            ajax             : {
                url     : woodmartConfig.ajaxUrl,
                data    : function(params) {
                    return {
                        action    : 'wd_conditions_query',
                        security  : woodmartConfig.get_new_template_nonce,
                        query_type: $field.attr('data-query-type'),
                        search    : params.term
                    };
                },
                method  : 'POST',
                dataType: 'json'
            },
            theme            : 'xts',
            dropdownAutoWidth: false,
            width            : 'resolve'
        });
    }

    function conditionQueryFieldInit( conditionType, $querySelect ) {
        if ($querySelect.data('select2')) {
            $querySelect.val('');
            $querySelect.select2('destroy');
        }

        var $conditionQueryFieldTitle = $querySelect.parents('.xts-controls-wrapper').find('.xts-condition-query').first();
        var $dependencFields          = $querySelect.parents('.xts-table-controls').find('[data-dependency]');

        $dependencFields.each(function( key, field ) {
            var $field     = $(field);
            var $select    = $field.find('select');
            var dependency = $field.data('dependency').split(';').filter(function( val ) {
                return val.length > 0;
            });
            $showField     = false;

            for (var i = 0; i < dependency.length; i++) {
                var dep = dependency[i];
                var parts = dep.split(':');

                var key     = parts[0];
                var compare = parts[1];
                var value   = parts[2].split(',').filter(function( val ) {
                    return val.length > 0;
                });

                if ( 'type' === key && 'all' !== conditionType ) {
                    $showField = 'equals' === compare ? value.includes( conditionType ) : ! value.includes( conditionType );
                }

                // This field will appear if at least one dependency returns a value of true.
                if ( $showField ) {
                    break;
                }
            }

            if ( $showField ) {
                $field.removeClass('xts-hidden');

                if ( $field.hasClass('xts-condition-query') ) {
                    $select.attr('data-query-type', conditionType);
                    conditionQuerySelect2($select);
                }
            } else {
                $field.addClass('xts-hidden');

                if ( $select.data('select2') ) {
                    $select.removeAttr('data-query-type', conditionType);
                    $select.val('');
                    $select.select2('destroy');
                }
            }
        });

        // Show or hide Condition query field title.
        var showTitle = false;

        $('select.xts-condition-type').each((key, type) => {
            if ( 'all' !== $(type).val() ) {
                showTitle = true;
            }
        });

        if ( showTitle ) {
            $conditionQueryFieldTitle.removeClass('xts-hidden');
        } else {
            $conditionQueryFieldTitle.addClass('xts-hidden');
        }
    }

    function validate() {
		let isValid            = true;
		let $conditions        = $('.xts-conditions-control');
		let $conditionRows     = $conditions.find('.xts-controls-wrapper > .xts-table-controls:not(.xts-table-heading)');

		if ( 0 === $conditionRows.length ) {
            woodmartAdminModule.woodmartAdmin.addNotice($conditions, 'warning', woodmartConfig.no_discount_condition);
            isValid = false;
        }

        return isValid;
	}

    $('#post:has(.xts-options)').on('submit', function(e){
        if ( ! validate() ) {
            e.preventDefault();
        }
    });

    $(document)
        .ready( function() {
            $('.xts-condition-query:not(.xts-hidden) select.xts-condition-query').each((key, field) => {
                var $querySelect  = $( field );
                var conditionType = $querySelect.parents('.xts-table-controls').find('select.xts-condition-type').val();

                conditionQueryFieldInit( conditionType, $querySelect );
            });
        })
        .on('change', 'select.xts-condition-type', function() {
            var $this = $(this);
            var conditionType = $this.val();
            var $querySelect = $this.parents('.xts-table-controls').find('select.xts-condition-query');

            conditionQueryFieldInit( conditionType, $querySelect );
        });

    $(document).on('xts_select_with_table_control_row_removed', function( e, $control ) {
        if ( ! $control.hasClass('xts-conditions-control') ) {
            return;
        }

        var $conditionQueryFieldTitle = $control.find('.xts-controls-wrapper .xts-condition-query').first();

        var showTitle = false;

        $control.find('.xts-controls-wrapper select.xts-condition-type').each((key, type) => {
            if ( 'all' !== $(type).val() ) {
                showTitle = true;
            }
        });

        if ( ! showTitle ) {
            $conditionQueryFieldTitle.addClass('xts-hidden');
        }
    });
})(jQuery)
