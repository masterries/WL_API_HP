let previousData = null;
let rblNumber = "798";
let allStops = [];
let lineStops = [];
let allLines = [];
let lineToStopsMap = {};
let directionToStopsMap = {};

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

function startTimer(button) {
    const countdownCell = button.parentNode.previousElementSibling;
    const countdown = parseInt(countdownCell.textContent);

    if (countdown > 0) {
        const timerMinutes = Math.max(countdown - 3, 0);
        const timerDuration = timerMinutes * 60 * 1000;

        setTimeout(() => {
            alert(`In 2 Minuten fährt deine Bim ab!`);
        }, timerDuration);

        button.disabled = true;
        button.textContent = 'Timer gestartet';
    }
}

async function fetchData() {
    try {
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.wienerlinien.at/ogd_realtime/monitor?activateTrafficInfo=stoerunglang&rbl=${rblNumber}`)}`);
        const data = await response.json();
        let parsedData = JSON.parse(data.contents);
        console.log(parsedData);
        updatePage(parsedData);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
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
        departures.forEach((dep, index) => {
            let row = table.insertRow();
            row.insertCell().textContent = dep.line;
            row.insertCell().textContent = `${dep.towards} ${dep.barrierFree ? '♿' : ''} ${dep.realtimeSupported ? '🕒' : ''}`;
            row.insertCell().textContent = dep.countdown;
        
            if (index === 0) {
                row.insertCell().innerHTML = '<button class="timer-button" onclick="startTimer(this)">Timer</button>';
            } else {
                row.insertCell().textContent = '';
            }
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
    const directionSelect = document.getElementById('direction-select');
    const selectedLineID = lineSelect.value;
    const selectedDirection = directionSelect.value;

    if (selectedLineID === 'all' && selectedDirection === 'all') {
        populateDropdown(allStops, 'stop-select', 'StopText', 'StopID');
    } else {
        let stopIDs = [];
        if (selectedLineID !== 'all') {
            stopIDs = lineToStopsMap[selectedLineID] || [];
        }
        if (selectedDirection !== 'all') {
            const directionStopIDs = directionToStopsMap[selectedDirection] || [];
            stopIDs = stopIDs.filter(id => directionStopIDs.includes(id));
        }
        const filteredStops = allStops.filter(stop => stopIDs.includes(stop.StopID));
        populateDropdown(filteredStops, 'stop-select', 'StopText', 'StopID');
    }
}

async function initApp() {
    const paramRBL = getURLParameter('rbl');
    if (paramRBL) {
        rblNumber = paramRBL;
        document.getElementById('rbl-number').value = paramRBL;
    }

    try {
        allStops = await fetchCSVData('https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-ogd-haltepunkte.csv', stopHeaders);
        populateDropdown(allStops, 'stop-select', 'StopText', 'StopID');

        allLines = (await fetchCSVData('https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-ogd-linien.csv', lineHeaders)).filter(line => line.Realtime === '1');
        populateDropdown(allLines, 'line-select', 'LineText', 'LineID');

        lineStops = await fetchCSVData('https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-ogd-fahrwegverlaeufe.csv', fahrwegverlaeufeHeaders);
        lineStops.forEach(item => {
            if (!lineToStopsMap[item.LineID]) {
                lineToStopsMap[item.LineID] = [];
            }
            lineToStopsMap[item.LineID].push(item.StopID);

            if (!directionToStopsMap[item.Direction]) {
                directionToStopsMap[item.Direction] = [];
            }
            directionToStopsMap[item.Direction].push(item.StopID);
        });

        const uniqueDirections = [...new Set(lineStops.map(item => item.Direction))];
        populateDropdown(uniqueDirections.map(dir => ({ Direction: dir, Text: `Direction ${dir}` })), 'direction-select', 'Text', 'Direction');

        console.log('Line to Stops Map:', lineToStopsMap);
        console.log('Direction to Stops Map:', directionToStopsMap);

        fetchData();
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

window.onload = initApp;

setInterval(updateClock, 1000);
setInterval(fetchData, 15000);