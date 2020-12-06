$(document).ready(function () {
  let hotelId = 160
  let hotelAvailability = availability[0][hotelId]
  // console.log(hotelAvailability);

  ///////////// find unavailable dates /////////////
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
  console.log(today)

  for (i = diffDays - 1; i < diffDays - 1 + 60; i++) {
    if (hotelAvailability[i] === 0) {
      var nDate = new Date(
        new Date(today).getTime() + j * (1000 * 60 * 60 * 24)
      )
      var nDay = ("0" + nDate.getDate()).slice(-2)
      var nMonth = ("0" + (nDate.getMonth() + 1)).slice(-2)
      var nYear = nDate.getFullYear()

      unavailable[j] = nYear + "-" + nMonth + "-" + nDay
    } else {
      console.log(j)
    }

    j = j + 1
  }
  // console.log(unavailable);

  // var hidedates = ["2020-09-07","2020-09-09","2020-09-11"];
  var hidedates = unavailable
  // console.log(hidedates);

  ///////////// datepicker settings /////////////
  $("#date").datepicker({
    minDate: 0,
    maxDate: 60,
    dateFormat: "dd-mm-yy",
    altFormat: "yyyy-mm-dd",
    constrainInput: true,
    firstDay: 1,
    dayNamesMin: ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"],
    beforeShowDay: function (date) {
      //dates to be deleted
      var string = jQuery.datepicker.formatDate("yy-mm-dd", date)
      return [hidedates.indexOf(string) == -1]
    },
  })

  $("#date").keydown(function (event) {
    event.preventDefault()
  })

  // Add min and max date to calendar
  var tzoffset = new Date().getTimezoneOffset() * 60 * 1000 //offset in milliseconds
  var today = new Date(Date.now() - tzoffset).toISOString().split("T")[0]
  document.getElementById("date").setAttribute("min", today)

  var twoMonthsAway = 60 * 1000 * 60 * 24 * 60 //in milliseconds
  var twoMonths = new Date(Date.now() - tzoffset + twoMonthsAway)
    .toISOString()
    .split("T")[0]
  document.getElementById("date").setAttribute("max", twoMonths)
})
