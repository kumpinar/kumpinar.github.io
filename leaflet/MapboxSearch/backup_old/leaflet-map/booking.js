$.ajax({
  url: "/leaflet-map/geojson.js?v" + Math.random(),
  success: function () {
    //execute map code }

    $.ajax({
      url: "/leaflet-map/availability.js?v" + Math.random(),
      success: function () {
        //execute map code }

        $.fn.isInViewport = function () {
          var elementTop = $(this).offset().top
          var elementBottom = elementTop + $(this).outerHeight() + 1000 // added + 500 to hide as well under the booking form
          var viewportTop = $(window).scrollTop()
          var viewportBottom = viewportTop + $(window).height()
          return elementBottom > viewportTop && elementTop < viewportBottom
        }

        $(window).on("resize scroll", function () {
          if ($("#booking-form button").length) {
            // check if element exists, otherwise '$(this).' in 'isInViewport' does not exists and creates problems on those pages
            if ($("#booking-form button").isInViewport()) {
              $("#booking-button").addClass("d-none")
            } else {
              $("#booking-button").removeClass("d-none")
            }
          }
        })

        window.addEventListener("load", function () {
          var myElem = document.getElementById("related-listings")
          if (myElem === null) {
            document.getElementById("related-listings-title").style.display =
              "none"
          }

          findUnavailableDate = (hotelId) => {
            let hotelAvailability = availability[0][hotelId]
            // console.log(hotelAvailability);
            var today = new Date()
            var todayFormatted =
              today.getFullYear() +
              "-" +
              ("0" + (today.getMonth() + 1)).slice(-2) +
              "-" +
              ("0" + today.getDate()).slice(-2)
            // console.log(todayFormatted);
            var startDate = new Date("2020-07-01") //YYYY-MM-DD
            // console.log(startDate);
            const diffTime = Math.abs(startDate - today)
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            // console.log(diffDays);

            let unavailable = []
            let j = 0
            // console.log(today);
            let bookingEnd = ""
            let bookingEndTime = ""
            const currentDate = new Date()
            let latestBookingTime = new Date()
            let earliestBookingTime = new Date()

            let obj = hotel.features.find((obj) => obj.id == hotelId)
            if (obj) {
              bookingEnd = obj.properties.BookingEnd
            }
            // If there's a booking end time and booking day is tomorrow
            if (bookingEnd === "TRUE") {
              bookingEndTime = obj.properties.BookingEndTime
              bookingEndTime = bookingEndTime.split(":")
              // Create new Date with current date and booking end time
              latestBookingTime = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                currentDate.getDate(),
                bookingEndTime[0],
                bookingEndTime[1]
              )
              earliestBookingTime = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                currentDate.getDate(),
              )
              earliestBookingTime.setHours(12,0,0,0);
              // console.log("currentDate " + currentDate);
              // console.log("earliestBookingTime " + earliestBookingTime);
            }

            /*if (currentDate < latestBookingTime) {
            }*/
            for (i = diffDays - 1; i < diffDays - 1 + 60; i++) {
              //console.log(hotelAvailability[i])
              var nDate = new Date(
                new Date(startDate).getTime() + i * (1000 * 60 * 60 * 24)
              )
              var nDay = ("0" + nDate.getDate()).slice(-2)
              var nMonth = ("0" + (nDate.getMonth() + 1)).slice(-2)
              var nYear = nDate.getFullYear()

              if (hotelAvailability[i] === 0) {
                unavailable.push(nYear + "-" + nMonth + "-" + nDay)
              } else if (bookingEnd === "TRUE") { // if hotel has booking time restrictions
                if (i == diffDays && currentDate > latestBookingTime) { //if booking is tomorrow and after latest booking time
                  unavailable.push(nYear + "-" + nMonth + "-" + nDay)
                } else if (i == diffDays-1 && currentDate < earliestBookingTime) { //if booking is today and before 9:00
                  unavailable.push(nYear + "-" + nMonth + "-" + nDay)
                }  
              }

              // OLD CODE
              // If booking day is tomorrow
              // if (i == diffDays) {
              //   //console.log(hotelAvailability[i])
              //   // If hotel is not available or current time is earlier than latest booking time
              //   if (hotelAvailability[i] === 0) {
              //     unavailable.push(nYear + "-" + nMonth + "-" + nDay)
              //     // If booking time is later than latest booking time
              //   } else if (currentDate > latestBookingTime) {
              //     unavailable.push(nYear + "-" + nMonth + "-" + nDay)
              //   }
              //   // If hotel is not available and booking day is not tomorrow
              // } else if (hotelAvailability[i] === 0) {
              //   unavailable.push(nYear + "-" + nMonth + "-" + nDay)
              // }
            
            }
            //console.log(unavailable)

            // var hidedates = ["2020-09-07","2020-09-09","2020-09-11"];
            return unavailable
          }

          // let addDatePicker = () => {
          //   // $("input[placeholder='Selecteer datum']").val(dropdownDate).trigger("click");
          //   let minDateVar = 0
          //   let hourNow = new Date().getHours()
          //   if (hourNow > 15) {
          //     //change min date from today to tomorrow if after 18.00 o'clock, note two hour difference)
          //     minDateVar = 1
          //   }

          //   $("input[placeholder='Selecteer datum']").datepicker({
          //     minDate: minDateVar,
          //     maxDate: 60,
          //     dateFormat: "dd-mm-yy",
          //     altFormat: "yyyy-mm-dd",
          //     constrainInput: true,
          //     firstDay: 1,
          //     dayNamesMin: ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"],
          //     beforeShowDay: function (date) {
          //       //dates to be deleted
          //       var string = $.datepicker.formatDate("yy-mm-dd", date)
          //       return [hidedates.indexOf(string) == -1]
          //     },
          //   })

          //   document
          //     .getElementsByClassName("hasDatepicker")[0]
          //     .setAttribute("readonly", true)
          // }

          // //MULTIPLE DATEPICKER
          // //*******************************************************/
          // let addMultipleDatePicker = () => {
          // 	let minDateVar = 0;
          // 	let hourNow = new Date().getHours();
          // 	if (hourNow > 15) { //change min date from today to tomorrow if after 18.00 o'clock, note two hour difference)
          // 		minDateVar = 1;
          // 	}

          // 	var day = new Date()
          // 	if (minDateVar === 1) {
          // 	  var nextDay = new Date(day)
          // 	  nextDay.setDate(day.getDate() + 1)
          // 	  // console.log(nextDay)
          // 	  day = nextDay
          // 	}

          // 	var maxDate = new Date(day)
          // 	maxDate.setDate(day.getDate() + 60)

          // 	var hideDatesChangedFormat = [];
          // 	$(hidedates).each(function(){
          // 		let year = this.split("-")[0];
          // 		let month = this.split("-")[1];
          // 		let day = this.split("-")[2];

          // 		hideDatesChangedFormat.push(`${day}-${month}-${year}`)

          // 		// var string = $.datepicker.formatDate('yy-mm-dd', this);
          // 		// hideDatesReverse.push(string);
          // 	})

          // //   setTimeout(function () {
          // 	//Multiple-date picker
          // 	// let calendar = $("#c-0-47").flatpickr({
          // 	let calendar = $("input[placeholder='Selecteer datum']").flatpickr({
          // 	  minDate: day, // today or tomorrow if after 15:00
          // 	  maxDate: maxDate,
          // 	  // defaultDate: day,
          // 	dateFormat: "d-m-Y",
          // 	// altFormat: "Y-m-d",
          // 	  mode: "multiple",
          // 	  locale: "nl",
          //       disable: hideDatesChangedFormat,
          // 	  ignoredFocusElements: [window.document.body],
          // 	  monthSelectorType: "static"
          // 	})
          // 	$('.flatpickr-rContainer').append(`
          // 		<div>
          // 			<button type="submit" class="submitDates">Done</button>
          // 		</div>
          // 	`)

          // 	$('.submitDates').on('click', function(){
          // 		calendar.close();
          // 	});

          // 	$(".numInput").attr(
          // 		"style",
          // 		"padding-left: 21px !important; padding-right: 21px !important;"
          // 	)
          // }

          //*******************************************************/

          //Multiple-date picker
            let addMultipleDatePicker = () => {
              // let calendar = $("#c-0-49").flatpickr({
                let calendar = $("input[placeholder='Selecteer datum']").flatpickr({
                minDate: day, // today or tomorrow if after 15:00
                maxDate: maxDate,
                // defaultDate: day,
                dateFormat: "d-m-Y",
                // altFormat: "Y-m-d",
                mode: "multiple",
                locale: "nl",
                disable: hideDatesChangedFormat,
                // ignoredFocusElements: [window.document.body],
                monthSelectorType: "static",
              })


              $(".flatpickr-rContainer").append(`
        <div>
        <button type="submit" class="submitDates">Selecteer dag(en)</button>
        </div>
        `)

              $(".submitDates").on("click", function () {
                calendar.close()
              })

              $(".numInput").attr(
                "style",
                "padding-left: 21px !important; padding-right: 21px !important;"
              )

              // calendar.focus({preventScroll: true})

    //           calendar.focus({
				// preventScroll: true
			 //  });

            }
          

          let fillPeopleDropdown = () => {
            let nPeopleWelcome = []
            for (var i = 0; i < dayPrices.length; i++) {
              if (dayPrices[i] > 0) {
                nPeopleWelcome.push(i + 1)
              }
            }
            // console.log("nPeopleWelcome " + nPeopleWelcome);

            $("[data-field='CustomerPersons'] select").empty()
            for (var i = 0; i < nPeopleWelcome.length; i++) {
              $("[data-field='CustomerPersons'] select").append(
                new Option(nPeopleWelcome[i], nPeopleWelcome[i])
              )
              // console.log("nPeopleWelcome " + nPeopleWelcome[i]);
            }
            if (dropdownPeople) {
              $("[data-field='CustomerPersons'] select")
                .val(dropdownPeople)
                .trigger("click")
              $("input[placeholder='RoomPriceDay']")
                .val(
                  dayPrices[
                    $("[data-field='CustomerPersons'] select").val() - 1
                  ]
                )
                .trigger("click") //update prices based on number of people
            } else {
              $("input[placeholder='RoomPriceDay']")
                .val(dayPrices[0])
                .trigger("click")
            }
          }

          //Get parameters from link
          urlParam = (name) => {
            let results = new RegExp("[?&]" + name + "=([^&#]*)").exec(
              window.location.href
            )
            if (results == null) {
              return null
            }
            return decodeURI(results[1]) || 0
          }

          //Define variables
          let urlDate = urlParam("date")
          let dropdownDate = urlDate
          let getPeople = urlParam("people")
          let dropdownPeople = getPeople
          var hidedates
          let hotelId = $("#hotelId > div > div").text()
          let flatPickrBuild = ""
          console.log(hotelId)
          if (hotelId) {
            // prevent error on pages without hotelId e.g. home
            let hotelGeo = hotel.features.find((x) => x.id == hotelId)
            // hotelName = hotelGeo.properties.hotelName;
            // roomPriceDay = hotelGeo.properties.roomPriceDay;
            // console.log("roomPriceDay " + roomPriceDay);
            // roomExtraPerson = hotelGeo.properties.roomExtraPerson;
            // roomExtraPersonPrice = hotelGeo.properties.roomExtraPersonPrice;
            // roomLunchIncluded = hotelGeo.properties.roomLunchIncluded;
            // roomLunchPrice = hotelGeo.properties.roomLunchPrice;
            // roomOvernight = hotelGeo.properties.roomOvernight;
            // roomOvernightPrice = hotelGeo.properties.roomOvernightPrice;
            // roomBathroom = hotelGeo.properties.roomBathroom;
            // roomBathroomPrice = hotelGeo.properties.roomBathroomPrice;
            dayPrices = hotelGeo.dayPrices
            console.log("dayPrices " + dayPrices)
            // roomCheckInTime = hotelGeo.properties.roomCheckInTime;
            // roomCheckOutTime = hotelGeo.properties.roomCheckOutTime;

            // Set values of selected hotels
            $("input[placeholder='HotelId']").val(hotelId).trigger("click")
            $("input[placeholder='HotelName']")
              .val(hotelGeo.properties.hotelName)
              .trigger("click")
            $("input[placeholder='Selecteer datum']")
              .val(dropdownDate)
              .trigger("click")
            // $("input[placeholder='RoomExtraPerson']").val(roomExtraPerson).trigger("click");
            // $("input[placeholder='RoomExtraPersonPrice']").val(roomExtraPersonPrice).trigger("click");
            $("input[placeholder='HotelKitchen']")
              .val(hotelGeo.properties.hotelKitchen)
              .trigger("click")
            $("input[placeholder='HotelKitchenLockdown']")
              .val(hotelGeo.properties.hotelKitchenLockdown)
              .trigger("click")
            $("input[placeholder='RoomLunchIncluded']")
              .val(hotelGeo.properties.roomLunchIncluded)
              .trigger("click")
            $("input[placeholder='RoomLunchPrice']")
              .val(hotelGeo.properties.roomLunchPrice)
              .trigger("click")
            $("input[placeholder='RoomOvernight']")
              .val(hotelGeo.properties.roomOvernight)
              .trigger("click")
            $("input[placeholder='RoomOvernightCheckOutTime']")
              .val(hotelGeo.properties.roomOvernightCheckOutTime)
              .trigger("click")
            $("input[placeholder='RoomOvernightPrice']")
              .val(hotelGeo.properties.roomOvernightPrice)
              .trigger("click")
            $("input[placeholder='RoomBreakfastIncluded']")
              .val(hotelGeo.properties.roomBreakfastIncluded)
              .trigger("click")
            $("input[placeholder='RoomBreakfastPrice']")
              .val(hotelGeo.properties.roomBreakfastPrice)
              .trigger("click")
            $("input[placeholder='RoomBathroom']")
              .val(hotelGeo.properties.roomBathroom)
              .trigger("click")
            $("input[placeholder='RoomBathroomPrice']")
              .val(hotelGeo.properties.roomBathroomPrice)
              .trigger("click")
            $("input[placeholder='RoomCheckInTime']")
              .val(hotelGeo.properties.roomCheckInTime)
              .trigger("click")
            $("input[placeholder='RoomCheckOutTime']")
              .val(hotelGeo.properties.roomCheckOutTime)
              .trigger("click")
            $("input[placeholder='Language']")
              .val(window.location.pathname)
              .trigger("click")
            $("input[placeholder='SystemInfo']")
              .val(navigator.appName)
              .trigger("click")

            // part of addDatePicker that only needs to happen once
            hidedates = findUnavailableDate(hotelId)
            if (!hidedates) {
              hidedates = []
            }

            //MULTIPLE DATEPICKER
            //*******************************************************/
            let minDateVar = 0
            let hourNow = new Date().getHours()
            if (hourNow > 15) {
              //change min date from today to tomorrow if after 18.00 o'clock, note two hour difference)
              minDateVar = 1
            }

            var day = new Date()
            if (minDateVar === 1) {
              var nextDay = new Date(day)
              nextDay.setDate(day.getDate() + 1)
              // console.log(nextDay)
              day = nextDay
            }

            var maxDate = new Date(day)
            maxDate.setDate(day.getDate() + 60)

            var hideDatesChangedFormat = []
            $(hidedates).each(function () {
              let year = this.split("-")[0]
              let month = this.split("-")[1]
              let day = this.split("-")[2]

              hideDatesChangedFormat.push(`${day}-${month}-${year}`)

              // var string = $.datepicker.formatDate('yy-mm-dd', this);
              // hideDatesReverse.push(string);
            })

            //   setTimeout(function () {
            

            //*******************************************************/

            addMultipleDatePicker();
            // addDatePicker();
            fillPeopleDropdown()
          }

          // get onchange values ***NOT WORKING AFTER 'TERUG' FROM 2ND BOOKING PAGE***
          $("input[placeholder='Selecteer datum']").on("change", function () {
            dropdownDate = $("input[placeholder='Selecteer datum']").val()
            $("input[placeholder='Selecteer datum']")
              .val(dropdownDate)
              .trigger("click")
            console.log(dropdownDate)
          })
          $("[data-field='CustomerPersons'] select").on("change", function () {
            dropdownPeople = $("[data-field='CustomerPersons'] select").val()
            $("input[placeholder='RoomPriceDay']")
              .val(dayPrices[dropdownPeople - 1])
              .trigger("click") //update prices based on number of people
            console.log(dropdownPeople)
          })

          // rename label total amount
          // $("#booking-form .c-button-section > div > button").on('click', function() {
          //	var $link = $('.c-forms-payment-total-amount');
          //    var $img = $link.find('span');
          //    $link.html('Totaal te betalen bij checkin:');
          //    $link.append($img);
          //}

          // translation of the booking form to English
          // if (window.top.location.href.indexOf("/en/") != -1) {
          // 	$('#booking-form div[data-field=CustomerBookingDate] input').attr('placeholder', 'Select date');
          // 	$('#booking-form div[data-field=Room] .c-content').text('Worksuite');
          // 	$('#booking-form div[data-field=Room]  p').text('Lunch (€)');
          // 	$('#booking-form div[data-field=Room]  p').text('Lunch (€)');
          // }

          // re-add custom functionality to date and people fields after "terug" button in 2nd booking page
          $(".c-page-previous-page").click(function () {
            $(document).ready(function () {
              // addDatePicker();
              console.log("back works")
              addMultipleDatePicker()
              fillPeopleDropdown()
              $("input[placeholder='Selecteer datum']").on(
                "change",
                function () {
                  dropdownDate = $("input[placeholder='Selecteer datum']").val()
                  $("input[placeholder='Selecteer datum']")
                    .val(dropdownDate)
                    .trigger("click")
                  console.log(dropdownDate)
                }
              )
              $("[data-field='CustomerPersons'] select").on(
                "change",
                function () {
                  dropdownPeople = $(
                    "[data-field='CustomerPersons'] select"
                  ).val()
                  $("input[placeholder='RoomPriceDay']")
                    .val(dayPrices[dropdownPeople - 1])
                    .trigger("click") //update prices based on number of people
                  console.log(dropdownPeople)
                }
              )
            })
          })
        })
      },
    })
  },
})
