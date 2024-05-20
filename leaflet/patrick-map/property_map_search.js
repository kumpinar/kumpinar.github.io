let is_bot = function () {
    let botPattern, re, userAgent;
    botPattern = '(googlebot/|bot|Googlebot-Mobile|Googlebot-Image|Google favicon|Mediapartners-Google|bingbot|slurp|java|wget|curl|Commons-HttpClient|Python-urllib|libwww|httpunit|nutch|phpcrawl|msnbot|jyxobot|FAST-WebCrawler|FAST Enterprise Crawler|biglotron|teoma|convera|seekbot|gigablast|exabot|ngbot|ia_archiver|GingerCrawler|webmon |httrack|webcrawler|grub.org|UsineNouvelleCrawler|antibot|netresearchserver|speedy|fluffy|bibnum.bnf|findlink|msrbot|panscient|yacybot|AISearchBot|IOI|ips-agent|tagoobot|MJ12bot|dotbot|woriobot|yanga|buzzbot|mlbot|yandexbot|purebot|Linguee Bot|Voyager|CyberPatrol|voilabot|baiduspider|citeseerxbot|spbot|twengabot|postrank|turnitinbot|scribdbot|page2rss|sitebot|linkdex|Adidxbot|blekkobot|ezooms|dotbot|Mail.RU_Bot|discobot|heritrix|findthatfile|europarchive.org|NerdByNature.Bot|sistrix crawler|ahrefsbot|Aboundex|domaincrawler|wbsearchbot|summify|ccbot|edisterbot|seznambot|ec2linkfinder|gslfbot|aihitbot|intelium_bot|facebookexternalhit|yeti|RetrevoPageAnalyzer|lb-spider|sogou|lssbot|careerbot|wotbox|wocbot|ichiro|DuckDuckBot|lssrocketcrawler|drupact|webcompanycrawler|acoonbot|openindexspider|gnam gnam spider|web-archive-net.com.bot|backlinkcrawler|coccoc|integromedb|content crawler spider|toplistbot|seokicks-robot|it2media-domain-crawler|ip-web-crawler.com|siteexplorer.info|elisabot|proximic|changedetection|blexbot|arabot|WeSEE:Search|niki-bot|CrystalSemanticsBot|rogerbot|360Spider|psbot|InterfaxScanBot|Lipperhey SEO Service|CC Metadata Scaper|g00g1e.net|GrapeshotCrawler|urlappendbot|brainobot|fr-crawler|binlar|SimpleCrawler|Livelapbot|Twitterbot|cXensebot|smtbot|bnf.fr_bot|A6-Indexer|ADmantX|Facebot|Twitterbot|OrangeBot|memorybot|AdvBot|MegaIndex|SemanticScholarBot|ltx71|nerdybot|xovibot|BUbiNG|Qwantify|archive.org_bot|Applebot|TweetmemeBot|crawler4j|findxbot|SemrushBot|yoozBot|lipperhey|y!j-asr|Domain Re-Animator Bot|AddThis)';
    re = new RegExp(botPattern, 'i');
    userAgent = navigator.userAgent;
    return re.test(userAgent);
};

if (!is_bot()) {
    $('#map').on('load-map', () => {
        let domain = ''
        //https://api.thunderforest.com/styles/atlas/style.json?apikey=6a53e8b25d114a5e9216df5bf9b5e9c8
        var tiles = L.tileLayer('https://map.kvikbolig.dk/atlas/{z}/{x}/{y}@2x.png', {
            maxZoom: 18,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        });
        let bounds = [
            [
                parseFloat(document.getElementById('sw_lat').value),
                parseFloat(document.getElementById('sw_lng').value)
            ],
            [
                parseFloat(document.getElementById('ne_lat').value),
                parseFloat(document.getElementById('ne_lng').value)
            ]
        ]
        let map = L.map('map', {zoom: 14, layers: [tiles], zoomDelta: 0.5, zoomSnap: 0.1, wheelPxPerZoomLevel: 10});
        map.on('load', function () {
            console.log('map load event')
            updateMap()
        });
        window.map_instance = map;
        let update_map_delay = 2000
        let map_update_timer = undefined
        if (window.is_development) {
            L.marker([bounds[0][0], bounds[0][1]]).addTo(map); // South-west marker
            L.marker([bounds[1][0], bounds[1][1]]).addTo(map); // North-east marker
        }
        const updateMapDelayed = () => {
            if (map_update_timer) {
                clearTimeout(map_update_timer)
            }
            map_update_timer = setTimeout(() => updateMap(), update_map_delay)
        };

        let hotelsLayer = L.geoJson(null, {

            pointToLayer: function (feature, latlng) {
                let unclusteredMarkerIcon = new L.DivIcon({
                    html: '<div class="flex-center"><span>' + feature.properties.price + '</span></div>',
                    className: 'marker-unclustered marker-unclustered-single',
                    iconAnchor: [70/2, 26],
                    iconSize: new L.Point(70, 26)
                })
                return L.marker(latlng, {icon: unclusteredMarkerIcon});

            },

            onEachFeature: function (feature, layer) {
                layer.once('click', function () {
                    //let popupText = 'price: ' + feature.properties.price;
                    let popup = layer.bindPopup('loading...').openPopup();
                    window.popup = popup
                    fetch(`${domain}/api/map_infobox_item?ids=${feature.properties.id}`)
                        .then((response) => response.text())
                        .then((data) => {
                            popup.setPopupContent(data);
                        });
                })
            }
        });

        let hotelsCluster = L.markerClusterGroup({
            showCoverageOnHover: false,
            iconCreateFunction: function (cluster) {
                let clusterSize = 0;
                let clusterStyle = '';
                if (cluster.getChildCount() < 30) {
                    clusterSize = 41;
                    clusterStyle = 'custom-cluster-30'
                } else if (cluster.getChildCount() < 40) {
                    clusterSize = 56;
                    clusterStyle = 'custom-cluster-40'
                } else {
                    clusterSize = 66;
                    clusterStyle = 'custom-cluster-50'
                }
                //return L.divIcon({ html: '<b>' + cluster.getChildCount() + '</b>' });
                return L.divIcon({
                    html: '<div>' + cluster.getChildCount() + '</div>',
                    className: clusterStyle,
                    iconSize: new L.Point(clusterSize, clusterSize)
                });
            }
        });
        map.addLayer(hotelsCluster);
        map.fitBounds(bounds);
        map.on('moveend', function () {
            let bounds = map.getBounds();
            $('#sw_lat').val(bounds.getSouthWest().lat)
            $('#sw_lng').val(bounds.getSouthWest().lng)
            $('#ne_lat').val(bounds.getNorthEast().lat)
            $('#ne_lng').val(bounds.getNorthEast().lng)
            $('#map').trigger('map-moved');
            updateMapDelayed();
        });

        function updateMap() {
            let search_params = $("form.filters-form input:not(.excluded)[value!=' ']").serialize()
            fetch(`${domain}/api/map_markers?${search_params}`)
                .then((response) => response.json())
                .then((res) => {
                    if (!res) {
                        return;
                    }
                    hotelsLayer.clearLayers();
                    hotelsCluster.clearLayers();
                    hotelsLayer.addData(res)
                    hotelsCluster.addLayer(hotelsLayer);
                });
        }

        map.on('update-markers', () => {
            console.log('update-markers');
            updateMap();
        });
    });
}

window.onload = () => {
    let map_is_loaded = false
    $(window).on('resize.map_load_handler', () => {
        console.log('window resize')
        if ($('#map').is(':visible') && !map_is_loaded) {
            let script = document.createElement('script');
            script.onload = function () {
                $('#map').trigger('load-map');
            };

            let fileref = document.createElement("link");
            fileref.rel = "stylesheet";
            fileref.type = "text/css";
            let cssUrl = document.getElementById('search-filters').dataset.mapCssUrl;
            fileref.href = cssUrl;
            document.getElementsByTagName("head")[0].appendChild(fileref)
            let jsUrl = document.getElementById('search-filters').dataset.mapJsUrl;

            script.src = jsUrl;
            map_is_loaded = true
            $(window).off('resize.map_load_handler');
            document.head.appendChild(script)
        }
    });
    $(window).trigger('resize.map_load_handler');
}

