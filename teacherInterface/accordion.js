function findAndInitializeAccordions() {
	function close_accordion_sections(element) {
		var curAccord = $(element).closest('.accordion');
		curAccord.find('.accordion-section-title').removeClass('active');
		curAccord.find('.accordion-section-content').slideUp(300).removeClass('open');
		//$('.accordion .accordion-section-title').removeClass('active');
		//$('.accordion .accordion-section-content').slideUp(300).removeClass('open');
	}

	$('.accordion-section-title').click(function(e) {
		// Grab current anchor value
	        var currentAttrValue = $(this).attr('href');
 	
	        if($(e.target).is('.active')) {
        	    close_accordion_sections(this);
	        }else {
        	    close_accordion_sections(this);
 
	            // Add active class to section title
        	    $(this).addClass('active');
	            // Open up the hidden content panel
        	    $('.accordion ' + currentAttrValue).slideDown(300).addClass('open'); 
	        }
 
	        e.preventDefault();
	});
}
