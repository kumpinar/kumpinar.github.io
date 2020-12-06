$(document).ready(function () {
  //if browser doesn't support input type="date", initialize date picker widget:
  let minDateVar = 0
  let hourNow = new Date().getHours()
  console.log("hourNow " + hourNow)
  if (hourNow > 15) {
    //change min date from today to tomorrow if after 18.00 o'clock, note two hour difference)
    minDateVar = 1
  }

  $("#date").datepicker({
    minDate: minDateVar,
    maxDate: 60,
    dateFormat: "dd-mm-yy",
    altFormat: "yyyy-mm-dd",
    constrainInput: true,
    firstDay: 1,
    dayNamesMin: ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"],
  })

  // $("#date").datepicker({
  //   language: "nl",
  //   minDate: minDateVar,
  //   maxDate: 60,
  //   dateFormat: "dd-mm-yy",
  //   firstDay: 1,
  // })

  $("#date").keydown(function (event) {
    event.preventDefault()
  })

  // setTimeout(function () {
  //   $("#date-2").flatpickr({
  //     minDate: day, // today or tomorrow if after 15:00
  //     maxDate: maxDate,
  //     // defaultDate: day,
  //     dateFormat: "d-m-y",
  //     mode: "multiple",
  //     locale: "nl",
  //   })
  // }, 3000)

  // // Add min and max date to calendar NOT NEEDED AS ALREADY DONE BY JQUERY DATEPICKER MINDATE AND MAXDATE
  // var tzoffset = new Date().getTimezoneOffset() * 60 * 1000; //offset in milliseconds
  // var today = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0]
  // document.getElementById("date").setAttribute('min', today);

  // var twoMonthsAway = 60 * 1000 * 60 * 24 * 60; //in milliseconds
  // var twoMonths = (new Date(Date.now() - tzoffset + twoMonthsAway)).toISOString().split('T')[0]
  // document.getElementById("date").setAttribute('max', twoMonths);

  // if ($('#geo').val() == "52.366697~4.89454") {
  // 	$('option[value=3]').css('display','block');
  //     $('option[value=4]').css('display','block');
  // }

  // Add number of people options if Amsterdam is selected
  // $(function() {
  //     $('#geo').change(function() {
  //         city = $('#geo').val();
  //         select = document.getElementById("people");
  //         // select = $('#people');
  //         if (city == "52.366697~4.89454") {
  //         	$('option[value=3]').css('display','block');
  // 	        $('option[value=4]').css('display','block');
  // 		} else {
  // 			$('option[value=3]').css('display','none');
  // 	        $('option[value=4]').css('display','none');
  // 		}
  // 	});
  // });
})
