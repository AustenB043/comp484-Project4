// CSUN Map Quiz Game
// Google Maps API Implementation

// CSUN campus center coordinates
const CSUN_CENTER = { lat: 34.2406, lng: -118.5287 };

// Game state
let map;
let currentLocationIndex = 0;
let score = 0;
let startTime;
let timerInterval;
let locations = [];
let userMarkers = [];
let correctMarkers = [];
let rectangles = [];
let rotatedPolygons = [];

// Define 5 locations on CSUN campus
// 4 user's choice + 1 instructor's choice (Bayramian Hall)
// width: east-west dimension (longitude) in degrees
// north: distance north from center (latitude) in degrees (adjustable)
// south: distance south from center (latitude) in degrees (adjustable)
// rotation: rotation angle in degrees (0 = no rotation, positive = clockwise)
// If width/north/south are not specified, radius will be used (creates square)
const LOCATIONS = [
    {
        name: "Bookstein Hall",
        lat: 34.24198950283919,
        lng: -118.5308086727663,
        radius: 0.0005, // Fallback if width/north/south not specified
        width: 0.0005,  // East-west dimension (adjustable)
        north: 0.0006,  // Distance north from center (adjustable)
        south: 0.0008,  // Distance south from center (adjustable)
        rotation: 45     // Rotation in degrees (adjustable, 0 = no rotation)
    },
    {
        name: "Campus Store",
        lat: 34.23740201268529,    
        lng: -118.52817288070287,
        radius: 0.0004,
        width: 0.0000,  // Adjustable width
        north: 0.0000, // Adjustable north distance
        south: 0.0000, // Adjustable south distance
        rotation: 0     // Adjustable rotation
    },
    {
        name: "Jacaranda Hall",
        lat: 34.24148256185818,         
        lng: -118.528565000144,
        radius: 0.0006,
        width: 0.0000,
        north: 0.0000,
        south: 0.0000,
        rotation: 0
    },
    {
        name: "Manzanita Hall",
        lat: 34.237301,          
        lng: -118.530070,
        radius: 0.0005,
        width: 0.0000,
        north: 0.0000,
        south: 0.0000,
        rotation: 0
    },
    {
        name: "Citrus Hall",
        lat: 34.23904251281768,       
        lng: -118.52800668279416,
        radius: 0.0004,
        width: 0.0000,
        north: 0.0000,
        south: 0.0000,
        rotation: 0
    }
];

/**
 * Calculate bounds that include all locations
 * Takes into account width, north, and south dimensions
 */
function calculateLocationsBounds() {
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;
    
    LOCATIONS.forEach(location => {
        const lat = location.lat;
        const lng = location.lng;
        
        // Calculate bounds for this location
        let northExtent = 0;
        let southExtent = 0;
        let eastExtent = 0;
        let westExtent = 0;
        
        if (location.width && (location.north > 0 || location.south > 0)) {
            // Use custom width, north, and south
            northExtent = location.north || 0;
            southExtent = location.south || 0;
            const halfWidth = location.width / 2;
            eastExtent = halfWidth;
            westExtent = halfWidth;
        } else {
            // Use radius
            const radius = location.radius || 0.0003;
            northExtent = radius;
            southExtent = radius;
            eastExtent = radius;
            westExtent = radius;
        }
        
        // Update overall bounds
        minLat = Math.min(minLat, lat - southExtent);
        maxLat = Math.max(maxLat, lat + northExtent);
        minLng = Math.min(minLng, lng - westExtent);
        maxLng = Math.max(maxLng, lng + eastExtent);
    });
    
    // Add padding to ensure all locations are visible
    const padding = 0.0002; // Small padding in degrees
    return {
        north: maxLat + padding,
        south: minLat - padding,
        east: maxLng + padding,
        west: minLng - padding
    };
}

/**
 * Calculate fixed center point from all locations
 */
function calculateFixedCenter() {
    let totalLat = 0;
    let totalLng = 0;
    
    LOCATIONS.forEach(location => {
        totalLat += location.lat;
        totalLng += location.lng;
    });
    
    return {
        lat: totalLat / LOCATIONS.length,
        lng: totalLng / LOCATIONS.length
    };
}

/**
 * Fit map to show all locations and return the zoom level
 */
function fitMapAndGetZoom() {
    const bounds = calculateLocationsBounds();
    const boundsObj = new google.maps.LatLngBounds(
        new google.maps.LatLng(bounds.south, bounds.west),
        new google.maps.LatLng(bounds.north, bounds.east)
    );
    
    // Fit bounds to determine appropriate zoom
    map.fitBounds(boundsObj, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50
    });
    
    // Return the zoom level that fitBounds determined
    return map.getZoom();
}

/**
 * Initialize the Google Map
 */
function initMap() {
    // Custom map styles to hide POI markers, labels, street names, and descriptions
    const mapStyles = [
        {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
        },
        {
            featureType: "poi",
            elementType: "geometry",
            stylers: [{ visibility: "off" }]
        },
        {
            featureType: "poi.business",
            stylers: [{ visibility: "off" }]
        },
        {
            featureType: "transit",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
        },
        {
            featureType: "transit.station",
            stylers: [{ visibility: "off" }]
        },
        {
            featureType: "road",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
        },
        {
            featureType: "road",
            elementType: "labels.text",
            stylers: [{ visibility: "off" }]
        },
        {
            featureType: "road",
            elementType: "labels.icon",
            stylers: [{ visibility: "off" }]
        },
        {
            featureType: "administrative",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
        },
        {
            featureType: "administrative.locality",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
        },
        {
            featureType: "administrative.neighborhood",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
        },
        {
            featureType: "water",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
        },
        {
            featureType: "landscape",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
        }
    ];
    
    // Calculate fixed center point from all locations
    const fixedCenter = calculateFixedCenter();
    
    // Create map initially with center (zoom will be set after fitBounds)
    map = new google.maps.Map(document.getElementById('map'), {
        center: fixedCenter,
        zoom: 17, // Temporary zoom, will be adjusted
        disableDefaultUI: true, // Disable all default UI controls
        zoomControl: false,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
        panControl: false, // Disable pan controls
        styles: mapStyles // Apply custom styles to hide icons
    });
    
    // Wait for map to be ready, then fit bounds and lock zoom
    google.maps.event.addListenerOnce(map, 'idle', function() {
        const bounds = calculateLocationsBounds();
        const boundsObj = new google.maps.LatLngBounds(
            new google.maps.LatLng(bounds.south, bounds.west),
            new google.maps.LatLng(bounds.north, bounds.east)
        );
        
        // Fit bounds with minimal padding to zoom in more
        map.fitBounds(boundsObj, {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10
        });
        
        // After fitBounds completes, zoom in a bit more and lock
        google.maps.event.addListenerOnce(map, 'bounds_changed', function() {
            let fixedZoom = map.getZoom();
            const finalCenter = map.getCenter();
            
            // Zoom in by 1-2 levels to make buildings more selectable
            if (fixedZoom < 18) {
                fixedZoom = Math.min(fixedZoom + 0.8, 19); // Zoom in more, but cap at 19
            } else {
                fixedZoom = Math.min(fixedZoom + 0.5, 19); // Slight zoom in if already close
            }
            
            map.setZoom(fixedZoom);
            
            // Lock the zoom and center after slight delay to ensure zoom is applied
            setTimeout(function() {
                map.setOptions({
                    minZoom: fixedZoom,
                    maxZoom: fixedZoom,
                    center: finalCenter
                });
            }, 100);
        });
    });

    // Disable all panning and zooming interactions
    map.setOptions({
        draggable: false,
        zoomControl: false,
        scrollwheel: false,
        disableDoubleClickZoom: true,
        keyboardShortcuts: false, // Disable keyboard navigation
        gestureHandling: 'none' // Disable all gesture controls (pinch, drag, etc.)
    });

    // Add double-click event listener
    map.addListener('dblclick', handleMapDoubleClick);

    // Handle window resize to adjust map
    window.addEventListener('resize', function() {
        google.maps.event.trigger(map, 'resize');
    });

    // Initialize game
    initializeGame();
}

/**
 * Initialize the game
 */
function initializeGame() {
    // Stop timer if running
    stopTimer();
    
    // Clear any existing markers from the map (must be done before resetting arrays)
    clearMarkers();
    
    // Reset game state
    currentLocationIndex = 0;
    score = 0;
    userMarkers = [];
    correctMarkers = [];
    rectangles = [];
    rotatedPolygons = [];
    
    // Update display
    updateScore();
    updateHighScore();
    
    // Hide game over screen
    document.getElementById('gameOver').classList.add('hidden');
    
    // Hide feedback if visible
    document.getElementById('feedback').classList.add('hidden');
    
    // Start timer
    startTimer();
    
    // Show first location
    showNextLocation();
}

/**
 * Start the game timer
 */
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        document.getElementById('timer').textContent = elapsed;
    }, 1000);
}

/**
 * Stop the game timer
 */
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in degrees (approximate)
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
    const dLat = lat2 - lat1;
    const dLng = lng2 - lng1;
    return Math.sqrt(dLat * dLat + dLng * dLng);
}

/**
 * Rotate a point around a center point by a given angle (in degrees)
 */
function rotatePoint(point, center, angleDegrees) {
    const angleRad = angleDegrees * Math.PI / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    
    // Translate to origin
    const dx = point.lng - center.lng;
    const dy = point.lat - center.lat;
    
    // Rotate
    const rotatedX = dx * cos - dy * sin;
    const rotatedY = dx * sin + dy * cos;
    
    // Translate back
    return {
        lat: center.lat + rotatedY,
        lng: center.lng + rotatedX
    };
}

/**
 * Calculate the four corners of a rotated rectangle
 * north and south are distances from center (not total length)
 */
function getRotatedRectangleCorners(center, width, north, south, rotation) {
    const halfWidth = width / 2;
    
    // Define corners relative to center (before rotation)
    // north and south are already distances from center
    const corners = [
        { lat: center.lat + north, lng: center.lng - halfWidth }, // Top-left
        { lat: center.lat + north, lng: center.lng + halfWidth }, // Top-right
        { lat: center.lat - south, lng: center.lng + halfWidth },  // Bottom-right
        { lat: center.lat - south, lng: center.lng - halfWidth }  // Bottom-left
    ];
    
    // Rotate each corner around the center
    if (rotation !== 0) {
        return corners.map(corner => rotatePoint(corner, center, rotation));
    }
    
    return corners;
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
function isPointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lng, yi = polygon[i].lat;
        const xj = polygon[j].lng, yj = polygon[j].lat;
        
        const intersect = ((yi > point.lat) !== (yj > point.lat))
            && (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

/**
 * Check if user's click is within the correct location
 * Uses width/north/south if specified, otherwise uses radius
 * Handles rotation if specified
 */
function isCorrectLocation(userLat, userLng, correctLocation) {
    if (correctLocation.width && (correctLocation.north !== undefined || correctLocation.south !== undefined)) {
        const rotation = correctLocation.rotation || 0;
        const north = correctLocation.north || 0;
        const south = correctLocation.south || 0;
        
        if (rotation !== 0) {
            // For rotated rectangles, check if point is inside the polygon
            const corners = getRotatedRectangleCorners(
                { lat: correctLocation.lat, lng: correctLocation.lng },
                correctLocation.width,
                north,
                south,
                rotation
            );
            // Close the polygon
            const polygon = [...corners, corners[0]];
            return isPointInPolygon({ lat: userLat, lng: userLng }, polygon);
        } else {
            // For non-rotated rectangles, use simple bounds check
            const halfWidth = correctLocation.width / 2;
            const latDiff = userLat - correctLocation.lat;
            const lngDiff = Math.abs(userLng - correctLocation.lng);
            
            // Check if within north/south bounds and east/west bounds
            const withinNorthSouth = latDiff >= -south && latDiff <= north;
            const withinEastWest = lngDiff <= halfWidth;
            return withinNorthSouth && withinEastWest;
        }
    } else {
        // Fallback to radius check
        const distance = calculateDistance(
            userLat, 
            userLng, 
            correctLocation.lat, 
            correctLocation.lng
        );
        return distance <= (correctLocation.radius || 0.0003);
    }
}

/**
 * Show the next location question
 */
function showNextLocation() {
    if (currentLocationIndex >= LOCATIONS.length) {
        endGame();
        return;
    }

    const location = LOCATIONS[currentLocationIndex];
    document.getElementById('locationName').textContent = location.name;
    
    // Clear previous markers
    clearMarkers();
    
    // Hide feedback
    document.getElementById('feedback').classList.add('hidden');
}

/**
 * Handle double-click event on the map
 */
function handleMapDoubleClick(event) {
    const userLat = event.latLng.lat();
    const userLng = event.latLng.lng();
    const currentLocation = LOCATIONS[currentLocationIndex];
    
    // Check if the answer is correct
    const isCorrect = isCorrectLocation(userLat, userLng, currentLocation);
    
    // Create marker for user's click
    const userMarker = new google.maps.Marker({
        position: { lat: userLat, lng: userLng },
        map: map,
        title: 'Your Answer',
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: isCorrect ? '#4CAF50' : '#F44336',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
        },
        animation: google.maps.Animation.DROP
    });
    userMarkers.push(userMarker);
    
    // Create marker for correct location
    const correctMarker = new google.maps.Marker({
        position: { lat: currentLocation.lat, lng: currentLocation.lng },
        map: map,
        title: 'Correct Location',
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: isCorrect ? '#4CAF50' : '#F44336',
            fillOpacity: 0.6,
            strokeColor: '#FFFFFF',
            strokeWeight: 3
        },
        animation: google.maps.Animation.BOUNCE
    });
    correctMarkers.push(correctMarker);
    
    // Create rectangle (box) to show the area
    // Use polygon if rotation is specified, otherwise use rectangle for better performance
    const rotation = currentLocation.rotation || 0;
    const north = currentLocation.north !== undefined ? currentLocation.north : 0;
    const south = currentLocation.south !== undefined ? currentLocation.south : 0;
    
    if (currentLocation.width && (north > 0 || south > 0) && rotation !== 0) {
        // Create rotated rectangle using polygon
        const corners = getRotatedRectangleCorners(
            { lat: currentLocation.lat, lng: currentLocation.lng },
            currentLocation.width,
            north,
            south,
            rotation
        );
        // Close the polygon
        const polygonPath = [...corners, corners[0]];
        
        const rotatedPolygon = new google.maps.Polygon({
            paths: polygonPath,
            strokeColor: isCorrect ? '#4CAF50' : '#F44336',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: isCorrect ? '#4CAF50' : '#F44336',
            fillOpacity: 0.35,
            map: map
        });
        rotatedPolygons.push(rotatedPolygon);
    } else {
        // Use regular rectangle (non-rotated or fallback)
        let bounds;
        if (currentLocation.width && (north > 0 || south > 0)) {
            // Use custom width, north, and south
            const halfWidth = currentLocation.width / 2;
            bounds = {
                north: currentLocation.lat + north,
                south: currentLocation.lat - south,
                east: currentLocation.lng + halfWidth,
                west: currentLocation.lng - halfWidth
            };
        } else {
            // Fallback to radius (creates square)
            const radius = currentLocation.radius || 0.0003;
            bounds = {
                north: currentLocation.lat + radius,
                south: currentLocation.lat - radius,
                east: currentLocation.lng + radius,
                west: currentLocation.lng - radius
            };
        }
        
        const rectangle = new google.maps.Rectangle({
            strokeColor: isCorrect ? '#4CAF50' : '#F44336',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: isCorrect ? '#4CAF50' : '#F44336',
            fillOpacity: 0.35,
            map: map,
            bounds: bounds
        });
        rectangles.push(rectangle);
    }
    
    // Show feedback
    showFeedback(isCorrect);
    
    // Update score
    if (isCorrect) {
        score++;
        updateScore();
    }
    
    // Move to next location after a delay
    setTimeout(() => {
        currentLocationIndex++;
        showNextLocation();
    }, 2000);
}

/**
 * Show feedback message
 */
function showFeedback(isCorrect) {
    const feedbackDiv = document.getElementById('feedback');
    feedbackDiv.classList.remove('hidden');
    
    if (isCorrect) {
        feedbackDiv.textContent = 'Your answer is correct!!';
        feedbackDiv.className = 'feedback correct';
    } else {
        feedbackDiv.textContent = 'Sorry wrong location.';
        feedbackDiv.className = 'feedback incorrect';
    }
    
    // Add animation effect
    feedbackDiv.style.animation = 'none';
    setTimeout(() => {
        feedbackDiv.style.animation = 'slideIn 0.5s ease-out';
    }, 10);
}

/**
 * Update score display
 */
function updateScore() {
    document.getElementById('score').textContent = score;
}

/**
 * Update high score display
 */
function updateHighScore() {
    const highScore = localStorage.getItem('csunMapQuizHighScore');
    if (highScore) {
        document.getElementById('highScore').textContent = highScore;
    } else {
        document.getElementById('highScore').textContent = '--';
    }
}

/**
 * Save high score to localStorage
 */
function saveHighScore(time) {
    const currentHighScore = localStorage.getItem('csunMapQuizHighScore');
    if (!currentHighScore || time < parseInt(currentHighScore)) {
        localStorage.setItem('csunMapQuizHighScore', time.toString());
        updateHighScore();
    }
}

/**
 * Clear all markers, rectangles, and polygons from the map
 */
function clearMarkers() {
    userMarkers.forEach(marker => marker.setMap(null));
    correctMarkers.forEach(marker => marker.setMap(null));
    rectangles.forEach(rectangle => rectangle.setMap(null));
    rotatedPolygons.forEach(polygon => polygon.setMap(null));
    userMarkers = [];
    correctMarkers = [];
    rectangles = [];
    rotatedPolygons = [];
}

/**
 * End the game and show results
 */
function endGame() {
    stopTimer();
    
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    const incorrect = LOCATIONS.length - score;
    
    // Save high score if applicable
    saveHighScore(totalTime);
    
    // Show game over screen
    const gameOverDiv = document.getElementById('gameOver');
    gameOverDiv.classList.remove('hidden');
    
    document.getElementById('finalScore').textContent = 
        `${score} Correct, ${incorrect} Incorrect`;
    document.getElementById('finalTime').textContent = 
        `Time: ${totalTime} seconds`;
    
    // Add celebration animation if perfect score
    if (score === LOCATIONS.length) {
        gameOverDiv.style.animation = 'fadeIn 0.5s ease-in, slideIn 0.5s ease-out';
    }
}

/**
 * Set up event listeners when DOM is ready
 */
$(document).ready(function() {
    // Play again button
    $('#playAgain').click(function() {
        initializeGame();
    });
});

// Make initMap globally accessible for Google Maps API callback
window.initMap = initMap;

