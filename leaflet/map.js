var map = L.map('map').setView([-37.788100, 175.277000], 13);



L.tileLayer('https://www.google.com/maps/vt/pb=!1m4!1m3!1i{z}!2i{x}!3i{y}!2m3!1e0!2sm!3i403100514!3m8!2str!3str!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m1!1e0!23i4111425')
    .addTo(map);

// Initialise the FeatureGroup to store editable layers
var editableLayers = new L.FeatureGroup();
map.addLayer(editableLayers);


var drawPluginOptions = {
    position: 'topright',
    draw: {
        polygon: {
            allowIntersection: false, // Restricts shapes to simple polygons
            drawError: {
                color: '#e1e100', // Color the shape will turn when intersects
                message: '<strong>Polygon draw does not allow intersections!<strong> (allowIntersection: false)' 
            },
            shapeOptions: {
                color: '#bada55'
            }
        },
        polyline: false,
        circle: false,
        rectangle: false,
        marker: false,
        circlemarker: false
    },
    edit: {
        featureGroup: editableLayers
    }
};





// Initialise the draw control and pass it the FeatureGroup of editable layers
var drawControl = new L.Control.Draw(drawPluginOptions);
map.addControl(drawControl);




map.on('draw:created', function (e) {
    var type = e.layerType,
        layer = e.layer;

    if (type === 'marker') {
        layer.bindPopup('A popup!');
    }

    var geojson = e.layer.toGeoJSON();
    var wkt = Terraformer.WKT.convert(geojson.geometry);
    console.log(wkt);

    $.ajax({
        type: "POST",
        url: "/api/Polygon",
        data: { label: '', geomwkt: wkt },
        success: function (response) {
            editableLayers.addLayer(layer);
        },
        dataType: 'json'
    });

});

map.on('draw:edited', function (e) {
    var layers = e.layers;
    layers.eachLayer(function (layer) {
        var editedId = layer.feature.properties.id;
        let geojson = layer.toGeoJSON();
        var wktEdited = Terraformer.WKT.convert(geojson.geometry);

        $.ajax({
            type: "PUT",
            url: "/api/Polygon/" + editedId,
            data: { label: layer.feature.properties.label, geomwkt: wktEdited },
            success: function (response) {
                
            },
            dataType: 'json'
        });
    });
});

map.on('draw:deleted', function (e) {
    var layers = e.layers;
    layers.eachLayer(function (layer) {
        $.ajax({
            type: "DELETE",
            url: "/api/Polygon/" + layer.feature.properties.id,
            success: function (response) {

            },
            dataType: 'json'
        });
    });
});

map.on('zoomend', function (e) {
    console.log(map.getZoom());
    if (map.getZoom() < 10) {
        
    }
});