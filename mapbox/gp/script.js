mapboxgl.accessToken = 'pk.eyJ1IjoiYWNlbWltdWhlbmRpcyIsImEiOiJjajNvZnZvd3IwMDI0MnJydHhpZjZ5bnRsIn0.mVZMKTNJSZ0rWxy1F7nXhg';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/standard',
    center: [144.97, -37.84], // Default center (Melbourne area)
    zoom: 12,
    pitch: 60, // Tilt the map to see 3D buildings
    bearing: 0
});

let currentTheme = 'day';
let circuitData = null;
let flyPathData = null; // Store fly path data for animation
let isAnimating = false;
let animationFrameId = null;
let lastBearing = 0; // For smooth bearing transitions
let initialView = null; // Store initial fitted view
let savedFlythroughState = null; // Store paused flythrough state
let completePath = null; // Store the complete path for resume
let currentAnimationState = null; // Track current animation state in real-time

map.on('load', () => {
    // Load the F1 circuit GeoJSON
    fetch('au-1953.geojson')
        .then(response => response.json())
        .then(data => {
            
            // Reverse the coordinates array to flip direction
            data.features[0].geometry.coordinates.reverse();

            // shift the coordinates array. make the index 39 to the first index
            const shiftedCoordinates = data.features[0].geometry.coordinates.slice(39).concat(data.features[0].geometry.coordinates.slice(0, 39));
            data.features[0].geometry.coordinates = shiftedCoordinates;
            
            // Store circuit data for animation
            circuitData = data;
            
            // Set start and end points from circuit data
            const coords = data.features[0].geometry.coordinates;
            
            // Add the circuit source
            map.addSource('circuit', {
                'type': 'geojson',
                'data': data
            });

            // Add a line layer for the circuit
            map.addLayer({
                'id': 'circuit-line',
                'type': 'line',
                'source': 'circuit',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': '#ff0000',
                    'line-width': 4,
                    'line-opacity': 0.8
                }
            });

                // Add an outline for better visibility
                map.addLayer({
                    'id': 'circuit-outline',
                    'type': 'line',
                    'source': 'circuit',
                    'layout': {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    'paint': {
                        'line-color': '#ffffff',
                        'line-width': 6,
                        'line-opacity': 0.4
                    }
                }, 'circuit-line');

                // Add direction arrows along the line
                map.addLayer({
                    'id': 'circuit-arrows',
                    'type': 'symbol',
                    'source': 'circuit',
                    'layout': {
                        'symbol-placement': 'line',
                        'symbol-spacing': 50,
                        'text-field': '▶',
                        'text-size': 16,
                        'text-keep-upright': false,
                        'text-rotation-alignment': 'map',
                        'text-pitch-alignment': 'viewport'
                    },
                    'paint': {
                        'text-color': '#ff0000',
                        'text-halo-color': '#ffffff',
                        'text-halo-width': 2
                    }
                });

                // Add a blue point at the start of the circuit
                const startCoord = coords[0];
                map.addSource('start-point', {
                    'type': 'geojson',
                    'data': {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Point',
                            'coordinates': startCoord
                        }
                    }
                });

                map.addLayer({
                    'id': 'start-point-circle',
                    'type': 'circle',
                    'source': 'start-point',
                    'paint': {
                        'circle-radius': 10,
                        'circle-color': '#0080ff',
                        'circle-stroke-color': '#ffffff',
                        'circle-stroke-width': 3
                    }
                });

            // Load custom buildings GeoJSON
            fetch('custom_buildings.json')
                .then(response => response.json())
                .then(buildingsData => {
                    // Add custom buildings source
                    map.addSource('custom-buildings', {
                        'type': 'geojson',
                        'data': buildingsData
                    });

                    // Add 3D extrusion layer for buildings
                    map.addLayer({
                        'id': 'custom-buildings-3d',
                        'type': 'fill-extrusion',
                        'source': 'custom-buildings',
                        'paint': {
                            'fill-extrusion-color': '#4264fb',
                            'fill-extrusion-height': ['get', 'height_meter'],
                            'fill-extrusion-base': 0,
                            'fill-extrusion-opacity': 0.8
                        }
                    });

                    // Add building name labels
                    map.addLayer({
                        'id': 'custom-buildings-labels',
                        'type': 'symbol',
                        'source': 'custom-buildings',
                        'layout': {
                            'text-field': ['get', 'name'],
                            'text-size': [
                                'interpolate',
                                ['linear'],
                                ['zoom'],
                                4, 6,  // At zoom 12 (initial view): 7px (2x smaller)
                                18, 14  // At zoom 18 (flythrough): 14px (normal size)
                            ],
                            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                            'text-anchor': 'center',
                            'text-offset': [0, 0]
                        },
                        'paint': {
                            'text-color': '#ffffff',
                            'text-halo-color': '#4264fb',
                            'text-halo-width': 2
                        }
                    });

                    console.log('Custom buildings loaded successfully');
                })
                .catch(error => {
                    console.error('Error loading custom buildings:', error);
                });

            // Calculate bounds and fit map to the circuit
            const coordinates = data.features[0].geometry.coordinates;
            const bounds = coordinates.reduce((bounds, coord) => {
                return bounds.extend(coord);
            }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

            map.fitBounds(bounds, {
                padding: 80,
                duration: 1500
            });

            // Store initial view after fitting bounds
            setTimeout(() => {
                initialView = {
                    center: map.getCenter(),
                    zoom: map.getZoom(),
                    pitch: map.getPitch(),
                    bearing: map.getBearing()
                };
                console.log('Initial view stored:', initialView);
            }, 1600); // Wait for fitBounds animation to complete

            // Load the fly path GeoJSON for animation
            fetch('au-1953-fly-path.geojson')
                .then(response => response.json())
                .then(flyData => {
                    flyPathData = flyData;
                    console.log('Fly path data loaded successfully');
                })
                .catch(error => {
                    console.error('Error loading fly path:', error);
                });

            // Hide loading indicator
            document.getElementById('loading').classList.add('hidden');
        })
        .catch(error => {
            console.error('Error loading circuit:', error);
            document.getElementById('loading').textContent = 'Error loading circuit data';
        });
});

// Theme switching functionality
const themeButtons = document.querySelectorAll('.theme-btn');

themeButtons.forEach(button => {
    button.addEventListener('click', () => {
        const theme = button.dataset.theme;
        
        // Update active state
        themeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Apply the lighting configuration
        map.setConfigProperty('basemap', 'lightPreset', theme);
        currentTheme = theme;
    });
});

// Set initial theme and enable 3D buildings
map.on('style.load', () => {
    map.setConfigProperty('basemap', 'lightPreset', 'day');
    map.setConfigProperty('basemap', 'showPlaceLabels', true);
    map.setConfigProperty('basemap', 'showRoadLabels', true);
    map.setConfigProperty('basemap', 'show3dObjects', true);
});

// Log clicked coordinates
map.on('click', (e) => {
    console.log('Clicked coordinates:', {
        lng: e.lngLat.lng,
        lat: e.lngLat.lat
    });
    console.log('Formatted:', `[${e.lngLat.lng}, ${e.lngLat.lat}]`);

    // Find nearest point on circuit if circuit data is loaded
    if (circuitData && circuitData.features && circuitData.features[0]) {
        const clickedPoint = turf.point([e.lngLat.lng, e.lngLat.lat]);
        const line = circuitData.features[0];
        
        // Find the nearest point on the line
        const nearestPoint = turf.nearestPointOnLine(line, clickedPoint);
        
        // Get the coordinates array
        const coordinates = line.geometry.coordinates;
        
        // Find the index of the nearest coordinate in the array
        let nearestIndex = 0;
        let minDistance = Infinity;
        
        coordinates.forEach((coord, index) => {
            const coordPoint = turf.point(coord);
            const distance = turf.distance(clickedPoint, coordPoint, {units: 'meters'});
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestIndex = index;
            }
        });
        
        console.log('Nearest point on circuit:');
        console.log('  Index:', nearestIndex);
        console.log('  Coordinates:', coordinates[nearestIndex]);
        console.log('  Distance from click:', minDistance.toFixed(2), 'meters');
        console.log('  Location on line:', nearestPoint.properties.location.toFixed(2), 'km from start');
    }
});

// Interpolation function with easing
function lerp(a, b, t) {
    if (Array.isArray(a) && Array.isArray(b)) {
        const result = [];
        for (let i = 0; i < Math.min(a.length, b.length); i++) {
            result[i] = a[i] * (1.0 - t) + b[i] * t;
        }
        return result;
    } else {
        return a * (1.0 - t) + b * t;
    }
}

// Smooth easing function (ease-in-out cubic)
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Normalize angle to -180 to 180 range
function normalizeAngle(angle) {
    while (angle > 180) angle -= 360;
    while (angle < -180) angle += 360;
    return angle;
}

// Calculate turn angle at a given position on the path
function calculateTurnAngle(path, index, lookAheadSteps = 10) {
    if (index < 1 || index >= path.length - lookAheadSteps) {
        return 0; // No turn at start/end
    }
    
    // Get previous, current, and future points
    const prevPoint = path[index - 1];
    const currentPoint = path[index];
    const futurePoint = path[Math.min(index + lookAheadSteps, path.length - 1)];
    
    // Calculate bearing from previous to current
    const dx1 = currentPoint.lng - prevPoint.lng;
    const dy1 = currentPoint.lat - prevPoint.lat;
    const bearing1 = Math.atan2(dx1, dy1) * (180 / Math.PI);
    
    // Calculate bearing from current to future
    const dx2 = futurePoint.lng - currentPoint.lng;
    const dy2 = futurePoint.lat - currentPoint.lat;
    const bearing2 = Math.atan2(dx2, dy2) * (180 / Math.PI);
    
    // Calculate the turn angle (normalized to -180 to 180)
    const turnAngle = normalizeAngle(bearing2 - bearing1);
    
    return Math.abs(turnAngle); // Return absolute value for turn sharpness
}

// Update camera position with pitch control and smooth bearing
function updateCameraPosition(position, altitude, target, interpolationFactor = 1.0, turnAngle = 0) {
    // Calculate bearing (direction) towards target
    const dx = target[0] - position[0];
    const dy = target[1] - position[1];
    let targetBearing = Math.atan2(dx, dy) * (180 / Math.PI);
    
    // Smooth bearing transition to avoid jerky turns
    // Handle angle wrapping (e.g., 350° to 10° should interpolate through 360°, not backwards)
    let bearingDiff = normalizeAngle(targetBearing - lastBearing);
    
    // Adaptive smoothing based on turn sharpness
    // Sharp turns (>30°) get more smoothing, gentle turns get less
    // This makes the camera turn more gradually through sharp corners
    const turnFactor = Math.min(turnAngle / 45, 1.0); // Normalize turn angle to 0-1 range (45° = full effect)
    const baseSmoothingFactor = 0.45; // Lower base for smoother turns
    const turnSmoothingBoost = 0.25 * (1 - turnFactor); // Less smoothing on straight paths
    const smoothingFactor = (baseSmoothingFactor + turnSmoothingBoost) * interpolationFactor;
    
    const bearing = lastBearing + bearingDiff * smoothingFactor;
    lastBearing = bearing;
    
    // Calculate appropriate zoom level based on altitude
    // Zoom out more to see wider panoramic area
    const zoom = 18.5 - Math.log2(altitude / 10);
    
    // Set pitch to 65 degrees for better panoramic view of surroundings
    const pitch = 65;
    
    // Update camera position with bearing and pitch
    // Using jumpTo for instant updates to prevent accumulated lag
    map.jumpTo({
        center: position,
        zoom: zoom,
        bearing: bearing,
        pitch: pitch
    });
}

// Build complete path using turf.js to generate optimized segments
function buildCompletePath() {
    if (!flyPathData) {
        console.error('Fly path data not loaded');
        return [];
    }
    
    const path = [];
    
    // Get the line from fly path data
    const feature = flyPathData.features[0];
    
    // Handle MultiLineString geometry - extract the first line
    let line;
    if (feature.geometry.type === 'MultiLineString') {
        // Convert MultiLineString to LineString by taking the first line
        line = {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: feature.geometry.coordinates[0]
            },
            properties: feature.properties
        };
    } else {
        line = feature;
    }
    
    // Calculate total length of the line in meters
    const lineLength = turf.length(line, {units: 'meters'});
    console.log('Total fly path length:', lineLength.toFixed(2), 'meters');
    
    // Generate points along the line at 2-meter intervals for 2x speed
    // This reduces computational load while maintaining smooth animation
    const segmentDistance = 2; // 2 meters (2x speed optimization)
    const numSegments = Math.floor(lineLength / segmentDistance);
    
    console.log('Generating', numSegments, 'segments at 2-meter intervals (2x speed)');
    
    for (let i = 0; i <= numSegments; i++) {
        const distanceAlongLine = i * segmentDistance;
        const point = turf.along(line, distanceAlongLine, {units: 'meters'});
        
        if (point && point.geometry && point.geometry.coordinates) {
            path.push({
                lng: point.geometry.coordinates[0],
                lat: point.geometry.coordinates[1],
                altitude: 12.5 // Very low altitude, very close to the road
            });
        }
    }
    
    console.log('Built path with', path.length, 'points');
    return path;
}

// Initial flight to starting position
function flyToStart(completePath, callback) {
    if (!completePath || completePath.length < 1) {
        callback();
        return;
    }
    
    // Get current map state as starting position
    const startPos = {
        lng: map.getCenter().lng,
        lat: map.getCenter().lat,
        altitude: 200, // Approximate altitude based on zoom
        pitch: map.getPitch(),
        bearing: map.getBearing(),
        zoom: map.getZoom()
    };
    
    // Target is the first coordinate of the circuit
    const targetPos = completePath[0];
    const lookAheadPos = completePath[Math.min(50, completePath.length - 1)];
    
    // Calculate target bearing (direction to look ahead)
    const dx = lookAheadPos.lng - targetPos.lng;
    const dy = lookAheadPos.lat - targetPos.lat;
    const targetBearing = Math.atan2(dx, dy) * (180 / Math.PI);
    
    console.log('Flying to starting position...');
    console.log('Start:', startPos);
    console.log('Target:', targetPos);
    
    // Use smooth transition
    const initialDuration = 3000; // 3 seconds
    const startTime = performance.now();
    
    function initialFrame(time) {
        if (!isAnimating) return;
        
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / initialDuration, 1.0);
        
        // Ease-in-out function for smooth transition
        const easeProgress = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        // Interpolate position
        const position = [
            startPos.lng + (targetPos.lng - startPos.lng) * easeProgress,
            startPos.lat + (targetPos.lat - startPos.lat) * easeProgress
        ];
        
        // Interpolate altitude
        const altitude = startPos.altitude + (targetPos.altitude - startPos.altitude) * easeProgress;
        
        // Interpolate pitch
        const pitch = startPos.pitch + (65 - startPos.pitch) * easeProgress;
        
        // Interpolate bearing smoothly using normalized angle
        const bearingDiff = normalizeAngle(targetBearing - startPos.bearing);
        const bearing = startPos.bearing + bearingDiff * easeProgress;
        
        // Interpolate zoom
        const zoom = startPos.zoom + (18.5 - Math.log2(altitude / 10) - startPos.zoom) * easeProgress;
        
        // Update camera
        map.jumpTo({
            center: position,
            zoom: zoom,
            bearing: bearing,
            pitch: pitch
        });
        
        if (progress < 1.0) {
            animationFrameId = requestAnimationFrame(initialFrame);
        } else {
            console.log('Reached starting position, beginning main flight...');
            lastBearing = bearing; // Set initial bearing for smooth transition
            callback();
        }
    }
    
    animationFrameId = requestAnimationFrame(initialFrame);
}

// Main flythrough animation - smooth drone-like movement
function startFlythrough() {
    const btn = document.querySelector('.animate-btn');
    
    if (isAnimating) {
        stopFlythrough();
        if (btn) btn.textContent = '▶ Resume Flythrough';
        return;
    }
    
    if (!flyPathData) {
        console.error('Fly path data not loaded yet');
        return;
    }
    
    isAnimating = true;
    if (btn) btn.textContent = '⏸ Pause Flythrough';
    
    // Check if we're resuming from a saved state
    if (savedFlythroughState) {
        console.log('Resuming flythrough from saved position...');
        // Resume animation from saved state
        startMainFlight(completePath, savedFlythroughState.currentSegmentIndex, savedFlythroughState.accumulatedTime);
        savedFlythroughState = null; // Clear saved state after resuming
    } else {
        console.log('Starting flythrough animation...');
        
        // Reset bearing smoothing
        lastBearing = map.getBearing();
        
        // Build the complete path with 1-meter segments
        completePath = buildCompletePath();
        console.log('Complete path:', completePath);
        
        if (completePath.length < 2) {
            console.error('Path too short. Points:', completePath.length);
            stopFlythrough();
            if (btn) btn.textContent = '▶ Start Flythrough';
            return;
        }
        
        // Start with initial flight to starting position
        flyToStart(completePath, () => {
            if (!isAnimating) return; // Check if stopped during initial flight
            
            // Begin main animation from the beginning
            startMainFlight(completePath, 0, 0);
        });
    }
}

// Main flight along the circuit
function startMainFlight(path, startSegmentIndex = 0, startAccumulatedTime = 0) {
    // Base animation speed: 10ms per segment at 2-meter intervals = 200 m/s
    const baseMillisecondsPerSegment = 10; // Base speed
    const segmentDistance = 2; // meters per segment
    const baseSpeed = segmentDistance / (baseMillisecondsPerSegment / 1000); // 200 m/s
    
    console.log('Base speed:', baseSpeed, 'meters per second');
    console.log('Starting from segment:', startSegmentIndex);
    
    let currentSegmentIndex = startSegmentIndex;
    let lastTime = performance.now();
    let accumulatedTime = startAccumulatedTime;
    
    function frame(time) {
        if (!isAnimating) {
            return;
        }
        
        const deltaTime = time - lastTime;
        lastTime = time;
        
        // Calculate turn angle at current position for speed adjustment
        const turnAngle = calculateTurnAngle(path, currentSegmentIndex, 15);
        
        // Dynamic speed adjustment based on turn sharpness
        // Sharp turns (>45°) = 3x slower, medium turns (30°) = 2x slower, gentle turns = normal speed
        let speedMultiplier = 1.0;
        if (turnAngle > 45) {
            speedMultiplier = 0.33; // Very sharp turn: 3x slower
        } else if (turnAngle > 30) {
            speedMultiplier = 0.5; // Sharp turn: 2x slower
        } else if (turnAngle > 15) {
            speedMultiplier = 0.7; // Medium turn: 1.4x slower
        } else if (turnAngle > 8) {
            speedMultiplier = 0.85; // Gentle turn: 1.2x slower
        }
        // else: straight path = normal speed (1.0)
        
        // Adjust milliseconds per segment based on turn
        const adjustedMillisecondsPerSegment = baseMillisecondsPerSegment / speedMultiplier;
        
        accumulatedTime += deltaTime;
        
        // Move forward based on accumulated time and adjusted speed
        while (accumulatedTime >= adjustedMillisecondsPerSegment && currentSegmentIndex < path.length - 1) {
            currentSegmentIndex++;
            accumulatedTime -= adjustedMillisecondsPerSegment;
        }
        
        // Continuously update current animation state for pause/resume
        currentAnimationState = {
            currentSegmentIndex: currentSegmentIndex,
            accumulatedTime: accumulatedTime
        };
        
        // Check if animation is complete
        if (currentSegmentIndex >= path.length - 1) {
            console.log('Flythrough complete!');
            stopFlythrough(true); // Pass true to indicate completion
            const btn = document.querySelector('.animate-btn');
            if (btn) btn.textContent = '▶ Start Flythrough';
            
            // Clear saved state on completion
            savedFlythroughState = null;
            currentAnimationState = null;
            
            // Fly back to initial view
            returnToInitialView();
            return;
        }
        
        // Get current and next points
        const currentPoint = path[currentSegmentIndex];
        const nextIndex = Math.min(currentSegmentIndex + 1, path.length - 1);
        const nextPoint = path[nextIndex];
        
        if (!currentPoint || !nextPoint) {
            console.error('Invalid path points at index:', currentSegmentIndex);
            stopFlythrough();
            return;
        }
        
        // Smooth interpolation between current and next segment with easing
        const segmentProgress = Math.min(accumulatedTime / adjustedMillisecondsPerSegment, 1.0);
        const easedProgress = easeInOutCubic(segmentProgress);
        
        const position = lerp(
            [currentPoint.lng, currentPoint.lat],
            [nextPoint.lng, nextPoint.lat],
            easedProgress
        );
        const altitude = lerp(currentPoint.altitude, nextPoint.altitude, easedProgress);
        
        // Adaptive lookahead: increase distance during turns for smoother bearing transitions
        // Sharp turns need longer lookahead to anticipate the turn
        const baseLookAheadSteps = 25;
        const turnLookAheadBoost = Math.floor(turnAngle / 5); // +1 step per 5° of turn
        const lookAheadSteps = Math.min(baseLookAheadSteps + turnLookAheadBoost, 50);
        const lookAheadIndex = Math.min(currentSegmentIndex + lookAheadSteps, path.length - 1);
        const targetPoint = path[lookAheadIndex];
        
        if (!targetPoint) {
            console.error('Invalid target point at index:', lookAheadIndex);
            stopFlythrough();
            return;
        }
        
        const target = [targetPoint.lng, targetPoint.lat];
        
        // Pass turn angle to updateCameraPosition for adaptive bearing smoothing
        updateCameraPosition(position, altitude, target, easedProgress, turnAngle);
        
        animationFrameId = requestAnimationFrame(frame);
    }
    
    animationFrameId = requestAnimationFrame(frame);
}

function stopFlythrough(isCompleted = false) {
    isAnimating = false;
    
    if (!isCompleted && currentAnimationState) {
        // Save the current animation state for resuming
        savedFlythroughState = {
            currentSegmentIndex: currentAnimationState.currentSegmentIndex,
            accumulatedTime: currentAnimationState.accumulatedTime
        };
        console.log('Flythrough paused at segment:', savedFlythroughState.currentSegmentIndex, 'accumulated time:', savedFlythroughState.accumulatedTime);
    }
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    if (isCompleted) {
        console.log('Flythrough completed');
        savedFlythroughState = null; // Clear saved state on completion
        currentAnimationState = null;
    } else {
        console.log('Flythrough paused');
    }
}

// Return to initial fitted circuit view
function returnToInitialView() {
    if (!initialView) {
        console.warn('No initial view stored');
        return;
    }
    
    console.log('Returning to initial view...');
    
    // Smooth fly back to the initial fitted view
    map.flyTo({
        center: initialView.center,
        zoom: initialView.zoom,
        pitch: initialView.pitch,
        bearing: initialView.bearing,
        duration: 3000, // 3 seconds
        essential: true
    });
}

// Make functions available globally
window.startFlythrough = startFlythrough;
window.stopFlythrough = stopFlythrough;
