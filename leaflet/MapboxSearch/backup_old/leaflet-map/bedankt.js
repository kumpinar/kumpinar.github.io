if (window.top.location.href.indexOf("/bedankt") != -1){

	$(document).ready(function(){
	
		//Get parameters from link
		urlParam = (name) => {
			let results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
			if (results==null) {
				return null;
			}
			return decodeURI(results[1]) || 0;
		}

		// let test = encodeURIComponent("hotel boat&co");

		//Define variables
		let mail = urlParam('customerEmail');
		let hotel = urlParam('hotelName');
		let hotelDecoded = decodeURIComponent(hotel);
		let date = urlParam('customerCheckin');

		
		document.getElementById("customerEmail").textContent=mail;	
		document.getElementById("hotelName").textContent=hotelDecoded;	
		document.getElementById("customerCheckin").textContent=date;
	
	});
}