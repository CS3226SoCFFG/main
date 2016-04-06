/*------------------------Drag and Drop Feature---------------------*/
$("#sortable-1, #sortable-2, #sortable-3, #sortable-4").sortable({
	connectWith: "#sortable-1, #sortable-2, #sortable-3, #sortable-4"
});

function showDegReq() {
	$("#deg-req-div").show();
	$("#all-mod-div").hide();
	$("#plan-mod-div").hide();
}

/*-----------------------Start-page--------------------------*/
$("#get-started-btn").on("click", function() {
	$("#start-text-div").hide();
	$("#grad-cer-div").show();
});

$("#starter-confirm-btn").on("click", function() {
	$("#start-page").hide();
	$("#main-section").show();
	showDegReq();
});

$(document).ready(function() {
	$("#main-section").hide();
	$("#grad-cer-div").hide();

	 // the "href" attribute of .modal-trigger must specify the modal ID that wants to be triggered
	 $(".modal-trigger").leanModal();

	 $("#taken-search-box").focus(function(){
	 	$("#taken-search-box").keypress(function(e) {
	 		if(e.which == 13) {		// pressing enter button
	 			$("#search-modal").openModal();

	 			$(".close-btn").on("click", function() {
	 				$("#search-modal").closeModal();
	 			});

	 			Materialize.toast(' is added into ', 4000);
	 		}
	 	});
	 });

	 $("#homepage-btn").on("click", function() {
	 	$("#home-page-div").hide();
	 	$("#deg-req-div").show();
	 });

	// Highlight selected li item
	var selector = ".collapsible-body ul li";

	$(selector).on("click", function(){
		$(selector).removeClass("active");
		$(this).addClass("active");
	});


	/*-------------Add smooth scrolling to all links-------------------*/
	$("a").on('click', function(event) {

	    // Prevent default anchor click behavior
	    event.preventDefault();

	    // Store hash
	    var hash = this.hash;

	    // Using jQuery's animate() method to add smooth page scroll
	    // The optional number (800) specifies the number of milliseconds it takes to scroll to the specified area
	    $('html, body').animate({
	    	scrollTop: $(hash).offset().top - 80
	    }, 800, function(){
	    	
	      // Add hash (#) to URL when done scrolling (default click behavior)
	      window.location.hash = hash;
	  });
	});
});

$("#deg-req-nav").on("click", function (){
	showDegReq();
});

$("#all-mod-nav").on("click", function (){
	$("#deg-req-div").hide();
	$("#all-mod-div").show();
	$("#plan-mod-div").hide();
});

$("#plan-mod-nav").on("click", function (){
	$("#deg-req-div").hide();
	$("#all-mod-div").hide();
	$("#plan-mod-div").show();
});

/*-------------Toggle button taken/plan---------------*/
function toggleFunction() {
	$(".left-div").on("click", function() {
		var rightItem = $(this).parent().find(".right-div");

		if(!rightItem.hasClass("selected-toggle-btn")){
			$(this).addClass("selected-toggle-btn");
		} else {
			$(this).addClass("selected-toggle-btn");
			rightItem.removeClass("selected-toggle-btn");
		}
	});

	$(".right-div").on("click", function() {
		var leftItem = $(this).parent().find(".left-div");

		if(!leftItem.hasClass("selected-toggle-btn")){
			$(this).addClass("selected-toggle-btn");
		} else {
			$(this).addClass("selected-toggle-btn");
			leftItem.removeClass("selected-toggle-btn");
		}
	});
}
