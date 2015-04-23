$('#validate').click(function () {
	if($('#roleAdmin').is(':checked')){
		setTimeout(function(){
			$('#adminTab').addClass("active");
		},200);
	} else if ($('#roleSup').is(':checked')) {
		setTimeout(function(){
			$('#supTab').addClass("active");
		},200);
	}else if ($('#roleEftu').is(':checked')) {
		setTimeout(function(){
			$('#eftuTab').addClass("active");
		},200);
	}else if ($('#roleCashier').is(':checked')) {
		setTimeout(function(){
			$('#cashierTab').addClass("active");
		},200);
	}else if ($('#roleRpt').is(':checked')) {
		setTimeout(function(){
			$('#reportTab').addClass("active");
		},200);
	}
});


