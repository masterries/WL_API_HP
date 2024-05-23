// Initialize the map
let map = L.map('map').setView([48.2082, 16.3738], 12); // Centered on Vienna

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Function to add markers to the map
function addMarkersToMap(stops) {
    // Clear existing markers
    map.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    stops.forEach(stop => {
        if (stop.Latitude && stop.Longitude) {
            L.marker([parseFloat(stop.Latitude), parseFloat(stop.Longitude)])
                .addTo(map)
                .bindPopup(stop.StopText);
        }
    });
}

// Function to update the map with filtered stops
function updateMap() {
    const lineSelect = document.getElementById('line-select');
    const directionSelect = document.getElementById('direction-select');
    const selectedLineID = lineSelect.value;
    const selectedDirection = directionSelect.value;

    let stopIDs = [];
    if (selectedLineID !== 'all') {
        stopIDs = lineToStopsMap[selectedLineID] || [];
    }
    if (selectedDirection !== 'all') {
        const directionStopIDs = directionToStopsMap[selectedDirection] || [];
        stopIDs = stopIDs.filter(id => directionStopIDs.includes(id));
    }
    const filteredStops = allStops.filter(stop => stopIDs.includes(stop.StopID));

    addMarkersToMap(filteredStops);
}

// Ensure the map is updated when the line or direction is changed
document.getElementById('line-select').addEventListener('change', updateMap);
document.getElementById('direction-select').addEventListener('change', updateMap);
