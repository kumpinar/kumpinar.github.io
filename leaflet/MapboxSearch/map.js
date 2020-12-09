
var map = L.map("map") // Plot map
var hotelLayer
$.ajax({
  url: "/leaflet-map/geojson.js?v" + Math.random(),
  success: function () {
    //execute map code }

    $.ajax({
      url: "/leaflet-map/availability.js?v" + Math.random(),
      success: function () {
        //execute map code }

        if (
          window.top.location.href.indexOf("/map") != -1 ||
          window.top.location.href.indexOf(
            "voordethuiswerkers.nl/map-dominik/"
          ) != -1
        ) {
          // console.log("in");

          $(document).ready(function () {
            //Variables
            //**********************************************************************************************************
            let getCity
            let getDate
            let getPeople
            let getAirco,
              getPool,
              getGym,
              getSauna,
              getParking,
              getNature,
              getLunch
            let availableHotels = []
            let geoDatePeople = []
            let objectKeyName = []
            let i, t
            let hotelName,
              hotelWeekPrice,
              hotelMonthPrice,
              hotelTelephone,
              hotelAddress,
              hotelGoogleMapsLink,
              hotelOpeningTime,
              hotelClosingTime,
              hotelCustomerEmail,
              hotelBookingEmail,
              hotelRemarks,
              hotelRating,
              hotelFreeParking,
              hotelRoomService,
              getInfluencer
            let showPeopleAlert = false
            let showDateAlert = false


            const currentDate = new Date()

            //**********************************************************************************************************
            //Variables

            //Functions
            //**********************************************************************************************************

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

            //Create slider of hotel pictures if more than one picture
            popupSliderFunction = (value) => {
              let popupSliderContent
              i = 1
              //If hotel has more than one picture
              if (value.properties.roomPhotos.length > 1) {
                popupSliderContent =
                  '<div class="w3-content w3-display-container" style="max-width:800px">'
                let sliderSpan =
                  '<span class="w3-badge demo w3-border w3-transparent w3-hover-white" onclick="currentDiv(' +
                  i +
                  ')"></span>'
                $.each(value.properties.roomPhotos, function () {
                  popupSliderContent +=
                    '<img class="mySlides" src="/leaflet-map/popup-photos/' +
                    value.id +
                    "-thumbs/" +
                    this +
                    '" style="width:100%">'
                  if (i > 1) {
                    sliderSpan +=
                      '<span class="w3-badge demo w3-border w3-transparent w3-hover-white" onclick="currentDiv(' +
                      i +
                      ')"></span>'
                  }
                  i++
                })
                popupSliderContent +=
                  '<div class="w3-center w3-container w3-section w3-large w3-text-white w3-display-bottommiddle" style="width:100%">'
                popupSliderContent +=
                  '<div class="w3-left w3-hover-text" onclick="plusDivs(-1);">&#10094;</div>'
                popupSliderContent +=
                  '<div class="w3-right w3-hover-text" onclick="plusDivs(1);">&#10095;</div>'
                popupSliderContent += sliderSpan + "</div></div>"
                //If hotel has only one picture
              } else {
                popupSliderContent =
                  '<img src="/leaflet-map/photos/' +
                  value.id +
                  "-thumbs/" +
                  value.properties.roomPhotos[0] +
                  '" style="width:100%">'
              }
              // console.log(popupSliderContent);
              return popupSliderContent
            }

            //Create popup for each hotel
            onEachFeature = (feature, layer) => {
              // let hotelDayPrice = feature.properties.roomPriceDay + " dag";
              if (feature.properties.roomPriceWorkweek != "€ 0") {
                let hotelWeekPrice =
                  " | " + feature.properties.roomPriceWorkweek + " week"
              } else {
                let hotelWeekPrice = ""
              }
              if (feature.properties.roomPriceMonth != "€ 0") {
                let hotelMonthPrice =
                  " | " + feature.properties.roomPriceMonth + " maand"
              } else {
                let hotelMonthPrice = ""
              }
              if (feature.properties.roomFacilities != "none") {
                let hotelRemarks = feature.properties.roomFacilities
              } else {
                let hotelRemarks = ""
              }
              i = 1
              let popupSlider = popupSliderFunction(feature)
              let popupText1 =
                '<h6 class="elementor-heading-title elementor-size-default">' +
                feature.properties.hotelName +
                "</h6>"
              let popupText2 =
                '<p class="hotelSlogan"><i>' +
                feature.properties.roomDescription +
                "</i></p>"
              // let popupText3 = '<p class="hotelFeatures">' + feature.properties.roomCheckInTime + '-' + feature.properties.roomCheckOutTime + ' &middot; ' + feature.properties.roomFacilities + '</p>';
              let popupText3 =
                '<p class="hotelFeatures">' +
                '<i aria-hidden="true" class="far fa-clock"></i> ' +
                feature.properties.roomCheckInTime +
                "-" +
                feature.properties.roomCheckOutTime +
                '<span class="pull-right"><i aria-hidden="true" class="far fa-star"></i> ' +
                feature.properties.hotelRating +
                "</span>"
              // console.log("date in onEachFeature " + getDate);
              let popupText4 =
                '<div class="hotelBook"><a href="?p=' +
                feature.WPpostID +
                "&date=" +
                getDate +
                "&people=" +
                getPeople +
                '" class="elementor-button-link elementor-button elementor-size-sm"><span class="elementor-button-content-wrapper"><span class="elementor-button-text">Bekijk</span></span></a></div>'
              // Boek voor €' + parseInt(feature.dayPrices[getPeople-1], 10) + '
              layer.bindPopup(
                popupSlider +
                  '<div class="leaflet-popup-text">' +
                  popupText1 +
                  popupText2 +
                  popupText3 +
                  popupText4 +
                  "</div>"
              )
              layer.on({ click: whenClicked })
            }

            test = () => {
              $(".mySlides:first-of-type").css(
                "display",
                "inline-block !important"
              )
            }

            //When clicked on a hotel in the map
            whenClicked = (e, getDate, getPeople) => {
              /* zoom in to marker when clicked
    		layer.on('click', function(e){
    			if  ( map.getZoom() < 11 ) {
    				var zoomLevel = 13;
    			} else {
    				var zoomLevel = map.getZoom();
    			}
    			var latLevel = e.latlng.lat + ( 163.84 / Math.pow(2, zoomLevel));
    			map.setView([latLevel, e.latlng.lng], zoomLevel);
    		});
    		*/
            }

            //**********************************************************************************************************
            //Functions

            // Fill variables with parameters, and preselect new form
            //**********************************************************************************************************
            getCity = urlParam("geo")
            console.log(getCity)
            if (getCity) {
              $("#geo").val(getCity)
            }

            console.log("getCity " + getCity)

            getDate = urlParam("date")
            $("#date").val(getDate).trigger("click")
            console.log("getDate " + getDate)

            getPeople = urlParam("people")
            $("#people").val(getPeople).trigger("click")
            console.log("getPeople " + getPeople)

            // hotelIdUrl = urlParam('id');

            getAirco = urlParam("airco")
            if (getAirco == 1) {
              airco.click()
            }

            getPool = urlParam("pool")
            if (getPool == 1) {
              pool.click()
            }

            getGym = urlParam("gym")
            if (getGym == 1) {
              gym.click()
            }

            getSauna = urlParam("sauna")
            if (getSauna == 1) {
              sauna.click()
            }

            getNature = urlParam("nature")
            if (getNature == "true") {
              nature.click()
            }

            getLunch = urlParam("lunch")
            if (getLunch == "true") {
              lunch.click()
            }

            getParking = urlParam("parkeren")
            if (getParking == 1) {
              parkeren.click()
            }

            objectKeyName = Object.keys(availability[0])
            // console.log(objectKeyName);

            if (!/^\d+$/.test(getPeople) || parseInt(getPeople, 10) === 0) {
              // showPeopleAlert = true;
              getPeople = 1
              $("#people").val("1")
            }
            $("input[placeholder='CustomerPersons']")
              .val(getPeople)
              .trigger("click")

            // console.log("getCity " + getCity);
            // console.log("getDate " + getDate);
            // console.log("CustomerPersons = " + getPeople);

            //**********************************************************************************************************
            // Fill variables with parameters, and preselect new form

            // Filters
            //**********************************************************************************************************
            let filterPeople = () => {
              peopleSet = []
              for (i = 0; i < hotel.features.length; i++) {
                if (hotel.features[i].dayPrices[getPeople - 1] > 0) {
                  peopleSet.push(hotel.features[i].id.toString())
                }
              }
              availableHotels = peopleSet.filter((x) =>
                availableHotels.includes(x)
              )

              return availableHotels
            }

            let filterDates = () => {
              //if date format is not correct
              var date_regex = /^(0[1-9]|[1-2][0-9]|3[0-1])-(0[1-9]|1[0-2])-[0-9]{4}$/
              if (!date_regex.test(getDate)) {
                // console.log("not in date_regex")
                // showDateAlert = true;
                // console.log("else showDateAlert " + showDateAlert)
                const tomorrow = new Date()
                tomorrow.setDate(tomorrow.getDate() + 1)
                var tomorrow_formatted =
                  ("0" + tomorrow.getDate()).slice(-2) +
                  "-" +
                  ("0" + (tomorrow.getMonth() + 1)).slice(-2) +
                  "-" +
                  tomorrow.getFullYear()
                $("#date").val(tomorrow_formatted)
                getDate = tomorrow_formatted
                // console.log("getDate " + getDate)
              }

              var newDate = getDate.split("-").reverse().join("-") // change date format to
              var userDate = new Date(newDate)
              var startDate = new Date("2020-07-01") //YYYY-MM-DD
              const diffTime = Math.abs(startDate - userDate)
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

              var diff_in_days = Math.floor(
                (Date.UTC(
                  userDate.getFullYear(),
                  userDate.getMonth(),
                  userDate.getDate()
                ) -
                  Date.UTC(
                    currentDate.getFullYear(),
                    currentDate.getMonth(),
                    currentDate.getDate()
                  )) /
                  (1000 * 60 * 60 * 24)
              )

              // Filterfunction
              $.each(availability[0], function (index) {
                let obj = hotel.features.find((obj) => obj.id == index)
                if (this[diffDays] > 0 && obj.dayPrices[getPeople - 1] > 0) {
                  let bookingEnd = ""
                  if (obj) {
                    bookingEnd = obj.properties.BookingEnd
                  }

                  // If there's a booking end time
                  if (bookingEnd === "TRUE") {
                    let bookingEndTime = obj.properties.BookingEndTime
                    bookingEndTime = bookingEndTime.split(":")
                    // Create new Date with current date and booking end time
                    let latestBookingTime = new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth(),
                      currentDate.getDate(),
                      bookingEndTime[0],
                      bookingEndTime[1]
                    )
                    let earliestBookingTime = new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth(),
                      currentDate.getDate()
                    )
                    earliestBookingTime.setHours(9, 0, 0, 0) //before 9 the hotel is disabled on the same day

                    if (diff_in_days === 1 && currentDate < latestBookingTime) {
                      //if booking is for tomorrow and before latest booking time
                      availableHotels.push(index)
                      //return "Booking for tomorrow and end time not exceeded"
                    } else if (
                      //If booking is for today and after 12:00
                      diff_in_days === 0 &&
                      currentDate > earliestBookingTime
                    ) {
                      availableHotels.push(index)
                      //return "Booking for today and end time not exceeded"
                    } else if (diff_in_days > 1) {
                      //If booking is for after tomorrow
                      availableHotels.push(index)
                    }
                  } else {
                    availableHotels.push(index)
                  }
                }
                /*} else {
                  console.log("Hotel is not available" + index)
                  //console.log(this[diffDays] > 0)
                  //console.log(hotel.features[i].dayPrices[getPeople - 1])
                }*/
              })

              $("input[placeholder='CustomerBookingDate']")
                .val(getDate)
                .trigger("click")

              return availableHotels
            }

            let filterHotels = () => {
              availableHotels = []

              // if (date_regex.test(getDate)) {
              // 	console.log("doet het");
              availableHotels = filterDates()
              console.log(availableHotels)
              // console.log(availableHotels);
              // }
              availableHotels = filterPeople()

              // Check checkboxes
              if (document.getElementById("pool").checked) {
                availableHotels = filterCheckbox("hotelPool", "TRUE")
              }
              if (document.getElementById("gym").checked) {
                availableHotels = filterCheckbox("hotelGym", "TRUE")
              }
              if (document.getElementById("parkeren").checked) {
                availableHotels = filterCheckbox("hotelParking", "Ja, gratis")
              }
              if (document.getElementById("sauna").checked) {
                availableHotels = filterCheckbox("hotelWellness", "TRUE")
              }
              if (document.getElementById("nature").checked) {
                availableHotels = filterCheckbox("hotelNature", "TRUE")
              }
              if (document.getElementById("lunch").checked) {
                availableHotels = filterCheckbox("hotelLunch", "TRUE")
              }
              //if (document.getElementById('airco').checked) {
              //	availableHotels = filterCheckbox("roomAirco", "TRUE");
              //}

              // MAKE PRICE FILTER
              // let minprice = document.getElementById('minprice').value;
              //   	console.log("minprice " + minprice);

              getInfluencer = urlParam("influencer")
              if (getInfluencer == "ja") {
                console.log("influencer")
                availableHotels = filterCheckbox("Influencers", "Ja")
              }
              console.log("getDate " + getDate);
              // onEachFeature();

              return availableHotels
            }

            let filterCheckbox = (checkboxParam, checkValue) => {
              checkboxSet = []
              for (i = 0; i < hotel.features.length; i++) {
                if (hotel.features[i].properties[checkboxParam] == checkValue) {
                  checkboxSet.push(hotel.features[i].id.toString())
                }
              }
              // find common values of both poolSet and availableHotels
              availableHotels = checkboxSet.filter((x) =>
                availableHotels.includes(x)
              )

              return availableHotels
            }

            //**********************************************************************************************************
            // Filters

            // Checkbox statements
            //**********************************************************************************************************

            // checkbox onchange statements
            $("#filter-form .checkbox input").change(function () {
              filterHotels()
              refreshIcons()
            })

            // search form onchange statements
            /* $(function () {
              $("#geo").change(function () {
                getCity = $("#geo").val()
                cityFocus()
              })
            }) */

            $(function () {
              $("#people").change(function () {
                getPeople = $("#people").val()
                availableHotels = filterHotels()
                refreshMarkers() //in order to refresh the prices
                refreshIcons()
              })
            })

            $(function () {
              $("#date").change(function () {
                getDate = $("#date").val()
                availableHotels = filterHotels()
                refreshMarkers() //in order to refresh the date in the link to the hotel-page
                refreshIcons()
              })
            })
            //**********************************************************************************************************
            // Onchange statements

            // Alerts
            //**********************************************************************************************************

            let showAlert = () => {
              if (showPeopleAlert == true && showDateAlert == false) {
                alert(
                  "Ter info, het aantal personen staat op 1. Je kunt dit aanpassen via de filters."
                )
              } else if (showPeopleAlert == false && showDateAlert == true) {
                alert(
                  "Ter info, de datum staat op morgen. Je kunt dit aanpassen via de filters."
                )
              } else if (showPeopleAlert == true && showDateAlert == true) {
                alert(
                  "Ter info, datum staat op morgen en aantal personen op 1. Je kunt dit aanpassen via de filters."
                )
              }
            }

            //**********************************************************************************************************
            // Alerts

            // Default script
            //**********************************************************************************************************

            geoDatePeople = filterHotels()
            availableHotels = geoDatePeople

            //**********************************************************************************************************
            // Default script

            //**********************************************************************************************************
            // Sorting scripts

            //Sort hotels by price in decending order and store in new object
            //New object must have same format than hotel object
            var hotelsSortedByNameAscending = {}
            hotelsSortedByNameAscending.features = hotel.features.sort(
              (a, b) => {
                return a.properties.roomPriceDay - b.properties.roomPriceDay
              }
            )
            hotelsSortedByNameAscending.type = "FeatureCollection"

            //Sort hotels by price in decending order and store in new object
            //New object must have same format than hotel object
            var hotelsSortedByNameDecending = {}
            // hotelsSortedByNameDecending.features = hotel.features.sort((a, b) => {
            //   return b.properties.roomPriceDay - a.properties.roomPriceDay
            // })
            hotelsSortedByNameDecending.features = hotelsSortedByNameAscending.features.reverse()
            hotelsSortedByNameDecending.type = "FeatureCollection"

            //   hotel.features.forEach((e) => {
            //     console.log(`${e.properties.hotelName} ${e.properties.roomPriceDay}`)
            //   })

            //**********************************************************************************************************

            //Leaflet configuration
            //**********************************************************************************************************

            let cityFocus = () => {
              // if no city show the Netherlands, otherwise show the city
              if (!getCity) {
                map.setView([52.13, 5.29], 8)
              } else {
                citySplit = getCity.replace(',','~').split("~").reverse() //.split("~") //.reverse()
                map.setView(citySplit, 12)
              }
            }

            cityFocus()

            var southWest = new L.LatLng(49.13, -0.29),
              northEast = new L.LatLng(55.13, 11.29),
              maxBounds = new L.LatLngBounds(southWest, northEast),
              bounds = new L.LatLngBounds(southWest, northEast)

            L.tileLayer(
              "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw",
              {
                minZoom: 7,
                maxZoom: 15,
                maxBounds: maxBounds,
                bounds: bounds,
                id: "mapbox/outdoors-v11",
              }
            ).addTo(map)

            // add zoom to location to map
            L.control
              .locate({ icon: "fas fa-crosshairs", initialZoomLevel: 13 })
              .addTo(map)

            /* start geolocation
    				function onLocationFound(e) {
    				}
    				function onLocationError(e) {
    					alert(e.message);
    				}
    				map.on('locationfound', onLocationFound);
    				map.on('locationerror', onLocationError);
    				map.locate({setView: true, maxZoom: 12});
    			end geolocation */

            //Configuration of markers
            let vdtIcon = L.icon({
              iconUrl: "/leaflet-map/marker.png",
              iconSize: [32, 32],
              iconAnchor: [16, 32],
              //popupAnchor: [0, 0]
              popupAnchor: [0, -12],
            })

            console.log("getPeople " + getPeople)
            // refresh labels (markers on map) after filtering
            let refreshMarkers = () => {
              //Display markers in map
              if (hotelLayer != null) {
                hotelLayer.clearLayers() //clear map to prevent grey borders after multiple filter actions
              }
              //console.log(hotelsSortedByNameDecending)
              hotelLayer = L.geoJSON(hotelsSortedByNameDecending, {
                pointToLayer: function (feature, latlng) {
                  // return L.marker(latlng, {icon: vdtIcon});
                  // return L.marker(latlng, {icon: vdtIcon, alt: feature.id}).bindTooltip("€ " + (parseInt(feature.properties.roomPriceDay, 10) + ((parseInt(getPeople, 10)-1)) * parseInt(feature.properties.roomExtraPersonPrice, 10)), {permanent: true, direction: 'center', interactive: true, opacity: 1, className: "Id_"+feature.id});
                  return L.marker(latlng, {
                    icon: vdtIcon,
                    alt: feature.id,
                  }).bindTooltip(
                    "€ " + parseInt(feature.dayPrices[getPeople - 1], 10),
                    {
                      permanent: true,
                      direction: "center",
                      interactive: true,
                      opacity: 1,
                      className: "Id_" + feature.id,
                    }
                  )
                },
                onEachFeature: onEachFeature,
              }).addTo(map)
            }

            refreshMarkers()

            map.on("popupclose", function (e) {
              //Your code here#
              // console.log(e)
              //  map.setView(e.target._marker._latLng)
            })

            let refreshIcons = () => {
              //Only show labels of available hotels, hide others
              $(".leaflet-marker-icon").each(function () {
                let selLabel = ".Id_" + $(this).attr("alt")
                if (getDate != null) {
                  $(this).closest(".leaflet-tooltip").hide()
                }
                if (availableHotels.includes($(this).attr("alt"))) {
                  $(selLabel).css("display", "block")
                } else {
                  $(selLabel).css("display", "none")
                }
              })
            }
            refreshIcons()

            //Add class to change design of tooltip
            $(".leaflet-tooltip").click(function () {
              let storeThis = this
              //When clicked from one hotel directly to another
              $(".leaflet-tooltip").each(function () {
                if ($(this).hasClass("tooltip-clicked")) {
                  $(this).removeClass("tooltip-clicked")
                  $(storeThis).addClass("tooltip-clicked")
                  //When clicked from the map
                } else {
                  $(storeThis).addClass("tooltip-clicked")
                }
              })
            })

            //remove class to change design of tooltip when clicked on map
            map.on("click", function (e) {
              $(".leaflet-tooltip").each(function () {
                if ($(this).hasClass("tooltip-clicked")) {
                  $(this).removeClass("tooltip-clicked")
                }
              })
            })

            //**********************************************************************************************************
            //Leaflet configuration

            // Show alert with 2 seconds delay
            setTimeout(function () {
              showAlert()
            }, 2000)

            //Other scripts, to be named
            //**********************************************************************************************************

            //   function createListElement(hotel) {
            //     let hotelRemarks = ""
            //     if (hotel.properties.roomFacilities != "none") {
            //       hotelRemarks = hotel.properties.roomFacilities
            //     } else {
            //       hotelRemarks = ""
            //     }
            //     let imgSlide = popupSliderFunction(hotel)
            //     $(".ss-content").append(`
            // <div class="wrapper-list">
            //     <div class="box a img-container">${imgSlide}</div>
            //     <div class="box b">
            //       <p class="title">${hotel.properties.hotelName}</p>
            //       <p class="">
            //         <i>
            //         ${hotel.properties.roomDescription}
            //         </i>
            //       </p>
            //       <p class="">
            //         <i aria-hidden="true" class="far fa-clock"></i>
            //         ${hotel.properties.roomCheckInTime} - ${hotel.properties.roomCheckOutTime} | € ${hotel.properties.roomPriceDay}
            //         <br>${hotelRemarks}
            //       </p>
            //     </div>
            //   </div>
            // `)
            //   }

            // ;(() => {
            //   $.each(hotelsSortedByNameAscending.features, function () {
            //     var point = []
            //     point.push(this.geometry.coordinates[1], this.geometry.coordinates[0])
            //     if (map.getBounds().contains(point)) {
            //       createListElement(this)
            //     } else {
            //       // console.log("hotel is not in viewport")
            //     }
            //   })
            // })()

            // Fill scrollbar div with content
            // map.on("moveend", function (e) {
            //   console.log("move map")
            //   $.each(hotelsSortedByNameAscending.features, function () {
            //     var point = []
            //     point.push(this.geometry.coordinates[1], this.geometry.coordinates[0])
            //     if (map.getBounds().contains(point)) {
            //       createListElement(this)
            //     } else {
            //       // console.log("hotel is not in viewport")
            //     }
            //   })
            // })

            // $(".wrapper-list").on("click", function (e) {
            //   if (
            //     $(e.target).is(
            //       ".img-container > div > .mySlides, .img-container > div > .w3-container > .w3-left, .img-container > div > .w3-container > .w3-right"
            //     )
            //   ) {
            //     e.preventDefault()
            //     return
            //   }
            //   // console.log("clicked")
            // })

            //**********************************************************************************************************
            //Other scripts, to be named




            //seacrh location by text scripts            

            /* L.Control.textbox = L.Control.extend({
              onAdd: function (map) {

                var text = L.DomUtil.create('input');
                text.type = "text";
                text.id = "txtSearch";
                text.style.width = "300px";
                return text;
              },
              onRemove: function (map) {
                // Nothing to do here
              }
            });
            L.control.textbox = function (opts) { return new L.Control.textbox(opts); }
            L.control.textbox({ position: 'topright' }).addTo(map);
            
            $(function() {
                var accessToken = 'pk.eyJ1Ijoidm9vcmRldGh1aXN3ZXJrZXJzIiwiYSI6ImNraWEzeWNneDBsejAyem1uMTRpZXA0bngifQ.YJt04s0cLlBwtNG5iR3wJA';
                var $select = $('#txtSearch').selectize({
                  preload: false,
                  valueField: 'center',
                  labelField: 'place_name_nl',
                  maxItems: 1,
                  loadThrottle: 600,
                  load: function (query, callback) {
                    if (query.split(' ').join('').length >= 3) {
                      $.ajax({
                        contentType: "application/json; charset=utf-8",
                        url: "https://api.mapbox.com/geocoding/v5/mapbox.places/" + encodeURI(query) + ".json?access_token="+accessToken+"&autocomplete=true&language=nl&types=place&country=NL,BE",
                        type: 'GET',
                        dataType: "json",
                        error: function () {
                          callback();
                        },
                        success: function (data) {
                          console.log(data);
                          selectize.clearOptions();
                          callback(data.features);
                        }
                      });

                    }
                  }
                });
                var selectize = $select[0].selectize;

                selectize.on('change', function (value) {
                  if (value) {
                    map.setView([value.split(',')[1], value.split(',')[0]], 15);
                    CheckMarkerCount();
                  }
                });

                function CheckMarkerCount(){
                  setTimeout(() => {
                      let markerCount = 0;
                      hotelLayer.eachLayer(function (l) {
                        if (l instanceof L.Marker && map.getBounds().contains(l.getLatLng())) {
                          markerCount++;
                        }
                      });
                      if(markerCount<1){
                        map.setZoom(map.getZoom()-1);
                        if(map.getZoom()<20 && map.getZoom()>2){
                          CheckMarkerCount();
                        }
                      }
                    }, 300);
                }
              }); */

            //end - seacrh location by text scripts

          })
        }
      },
    })
  },
})
