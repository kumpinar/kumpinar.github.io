/**
 * Shows the postcode layer provided by Platform Data Extension REST API
 * https://developer.here.com/platform-extensions/documentation/platform-data/topics/introduction.html
 *
 * @param  {H.Map} map      A HERE Map instance within the application
 */


function showPostcodes(map) {
  var service = platform.getPlatformDataService();

  style = {
    strokeColor: '#05A',
    fillColor: 'rgba(0, 85, 170, 0.05)',
    lineWidth: 2,
    lineCap: 'round',
    lineJoin: 'miter',
    miterLimit: 1,
    lineDash: [],
    lineDashOffset: 0
  };
  // create tile provider and layer that displays postcode boundaries
  var boundariesProvider = new H.service.extension.platformData.TileProvider(service,
    {
      layerId: 'PSTLCB_GEN',
      level: 12,
      rowFilter: function (row, layerId) {
        // Filter rows from layer "ROAD_GEOM_FC1" with link ID "123"
        //return layerId == 'ROAD_GEOM_FC1' && row.getCell('LINK_ID') == '123';    
        //return row.getCell('POSTAL_CODE')==20123;  
        return true;
      }
    }, {
    resultType: H.service.extension.platformData.TileProvider.ResultType.POLYGON,
    styleCallback: function (data) { return style }
  });
  var boundaries = new H.map.layer.TileLayer(boundariesProvider);
  map.addLayer(boundaries, 1);

  // add event listener that shows infobubble with basic information
  // about the postcode
  boundariesProvider.addEventListener('tap', function (ev) {
    AddRedBoundaries(map);
  });
}

// In your own code, replace variable window.apikey with your own apikey
var platform = new H.service.Platform({
  apikey: 'kCGZElk30Gj5anj2geQ020tZZxM8uZiuKjP7qNUC16E'
});

var defaultLayers = platform.createDefaultLayers();

//Step 2: initialize a map  - not specificing a location will give a whole world view.
var map = new H.Map(document.getElementById('map'),
  defaultLayers.vector.normal.map, {
  pixelRatio: window.devicePixelRatio || 1
});
// add a resize listener to make sure that the map occupies the whole container
window.addEventListener('resize', () => map.getViewPort().resize());

map.setCenter({ lat: 45.464211, lng: 9.191383 });
map.setZoom(13);

//Step 3: make the map interactive
// MapEvents enables the event system
// Behavior implements default interactions for pan/zoom (also on mobile touch environments)
var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

// Now use the map as required...
showPostcodes(map);


function AddRedBoundaries(map) {
  service=platform.getPlatformDataService();
  let styleSub = {
    strokeColor: '#05A',
    fillColor: 'rgba(255, 255, 255, 0.05)',
    lineWidth: 2,
    lineCap: 'round',
    lineJoin: 'miter',
    miterLimit: 1,
    lineDash: [],
    lineDashOffset: 0
  };
  console.log(redArray);
  var arr=redArray;
  // create tile provider and layer that displays postcode boundaries
  let boundariesProviderSub = new H.service.extension.platformData.TileProvider(service,
    {
      layerId: 'PSTLCB_GEN',
      level: 12,
      rowFilter: function (row, layerId) {        
        return 20123==row.getCell('POSTAL_CODE');
      }
    }, {
    resultType: H.service.extension.platformData.TileProvider.ResultType.POLYGON,
    styleCallback: function (data) { return styleSub }
  });
  let boundariesSub = new H.map.layer.TileLayer(boundariesProviderSub);
  //map.removeLayer(boundariesSub);
  map.addLayer(boundariesSub, 2);
}