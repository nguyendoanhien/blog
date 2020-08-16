(function($){
	'use strict';

    // apply matchHeight to each item container's items
    $(function() {
	    $('.void-grid .row').each(function(i, elem) {
	        $(elem)
	            .find('.item')   // Only children of this row
	            .matchHeight({byRow: false}); // Row detection gets confused so disable it
	    });
	})

})( jQuery );