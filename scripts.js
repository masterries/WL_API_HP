let previousData = null;
let rblNumber = "407";
let allStops = [];
let lineStops = [];
let allLines = [];
let lineToStopsMap = {};

const stopHeaders = ['StopID', 'DIVA', 'StopText', 'Municipality', 'MunicipalityID', 'Longitude', 'Latitude'];
const lineHeaders = ['LineID', 'LineText', 'SortingHelp', 'Realtime', 'MeansOfTransport'];
const fahrwegverlaeufeHeaders = ['LineID', 'PatternID', 'StopSeqCount', 'StopID', 'Direction'];

function getURLParameter(name) {
    return new URLSearchParams(window.location.search).get(name);
}

function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const day = now.getDate();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    document.getElementById('current-time').textContent = `${hours}:${minutes}:${seconds} | ${day}.${month}.`;
}

function fetchData() {
    fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.wienerlinien.at/ogd_realtime/monitor?activateTrafficInfo=stoerunglang&rbl=${rblNumber}`)}`)
        .then(response => response.json())
        .then(data => {
            try {
                let parsedData = JSON.parse(data.contents);
                console.log(parsedData);
                updatePage(parsedData);
            } catch (e) {
                console.error('Error parsing data:', e);
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

function updatePage(data) {
    if (!data || !data.data || !data.data.monitors || !data.data.monitors[0]) {
        console.error('Unexpected data structure', data);
        return;
    }

    let monitor = data.data.monitors[0];
    let haltepunktName = monitor.locationStop?.properties?.title || 'Unbekannter Haltepunkt';
    let departures = [];

    if (monitor.lines && monitor.lines.length > 0) {
        departures = monitor.lines.flatMap(line => line.departures?.departure.map(dep => ({
            line: line.name,
            towards: line.towards,
            countdown: dep.departureTime.countdown,
            barrierFree: line.barrierFree,
            realtimeSupported: line.realtimeSupported
        })) || []);
    }

    let stoerungText = data.data.trafficInfos?.[0]?.description.replace(/\n/g, ' ') || 'Keine Störungen';

    if (JSON.stringify(data) !== JSON.stringify(previousData)) {
        console.log('Data has changed, updating the page');
        document.getElementById('haltepunkt-name').textContent = haltepunktName;

        let table = document.getElementById('departure-table');
        table.innerHTML = '';
        departures.forEach(dep => {
            let row = table.insertRow();
            row.insertCell().textContent = dep.line;
            row.insertCell().textContent = `${dep.towards} ${dep.barrierFree ? '♿' : ''} ${dep.realtimeSupported ? '🕒' : ''}`;
            row.insertCell().textContent = dep.countdown;
        });

        document.getElementById('stoerung-text').textContent = stoerungText;

        previousData = data;
    } else {
        console.log('Data has not changed, not updating the page');
    }
}

function updateRBL() {
    rblNumber = document.getElementById('rbl-number').value;
    fetchData();
}

function updateStopID() {
    const select = document.getElementById('stop-select');
    const selectedStopID = select.value;
    rblNumber = selectedStopID;
    document.getElementById('rbl-number').value = selectedStopID;
    fetchData();
}

function filterStopsByLine() {
    const lineSelect = document.getElementById('line-select');
    const selectedLineID = lineSelect.value;

    if (selectedLineID === 'all') {
        populateDropdown(allStops, 'stop-select', 'StopText', 'StopID');
    } else {
        const stopIDs = lineToStopsMap[selectedLineID] || [];
        const filteredStops = allStops.filter(stop => stopIDs.includes(stop.StopID));
        populateDropdown(filteredStops, 'stop-select', 'StopText', 'StopID');
    }
}

window.onload = function() {
    const paramRBL = getURLParameter('rbl');
    if (paramRBL) {
        rblNumber = paramRBL;
        document.getElementById('rbl-number').value = paramRBL;
    }

    fetchCSVData('https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-ogd-haltepunkte.csv', stops => {
        allStops = stops;
        populateDropdown(stops, 'stop-select', 'StopText', 'StopID');
    }, stopHeaders);

    fetchCSVData('https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-ogd-linien.csv', lines => {
        allLines = lines.filter(line => line.Realtime === '1'); // Only lines with Realtime = 1
        populateDropdown(allLines, 'line-select', 'LineText', 'LineID');
    }, lineHeaders);

    fetchCSVData('https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-ogd-fahrwegverlaeufe.csv', fahrwegverlaeufe => {
        lineStops = fahrwegverlaeufe;
        console.log('Parsed fahrwegverlaeufe:', fahrwegverlaeufe); // Log parsed fahrwegverlaeufe data
        // Create a map of LineID to array of StopID
        lineStops.forEach(item => {
            if (!lineToStopsMap[item.LineID]) {
                lineToStopsMap[item.LineID] = [];
            }
            lineToStopsMap[item.LineID].push(item.StopID);
        });
        console.log('Line to Stops Map:', lineToStopsMap); // Log the line to stops mapping
    }, fahrwegverlaeufeHeaders);

    fetchData();
}

setInterval(updateClock, 1000);
setInterval(fetchData, 15000);
