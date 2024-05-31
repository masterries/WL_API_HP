let previousData = null;
let currentStationName = '';

function updateClock() {
    const jetzt = new Date();
    const tag = jetzt.getDate();
    const monat = jetzt.getMonth() + 1;
    const monat2 = (monat < 10 ? "0" : "");
    const jahr = jetzt.getFullYear();
    const stunden = jetzt.getHours();
    const stunden2 = (stunden < 10 ? "0" : "");
    const minuten = jetzt.getMinutes();
    const minute2 = (minuten < 10 ? ":0" : ":");
    const sekunden = jetzt.getSeconds();
    const sekunde2 = (sekunden < 10 ? ".0" : ".");
    document.getElementById('current-time').innerText = `${stunden2}${stunden}${minute2}${minuten}${sekunde2}${sekunden} | ${tag}.${monat2}${monat}.`;
}
    
async function fetchData() {
    if (!currentStationName) {
        console.log('No station selected');
        return;
    }
    
    try {
        let response = await fetch(`https://nodejs-serverless-function-express-iota-kohl.vercel.app/api/proxy?url=/ws/monitor?diva=${currentStationName}&_=${Date.now()}`);
        let data = await response.json();
        console.log(data);

        if (data.message.messageCode !== 1) {
            throw new Error('Error fetching data: ' + data.message.value);
        }

        updatePage(data);
    } catch (e) {
        console.error('Error fetching data:', e);
        document.getElementById('error-message').innerText = 'Fehler beim Abrufen der Daten.';
        document.getElementById('error-message').style.display = 'block';
    }
}

function toggleDepartures(stationName) {
    console.log('Toggle departures for station:', stationName);
    let stationRows = document.querySelectorAll(`tr[data-station="${stationName}"]`);
    stationRows.forEach(row => {
        if (row.style.display === 'none') {
            row.style.display = 'table-row';
        }
    });
}


function updatePage(data) {
    updateClock(); // Aktualisiert die Uhrzeit bei jedem Datenabruf
    if (!data || !data.data || !data.data.monitors || data.data.monitors.length === 0) {
        document.getElementById('error-message').innerText = 'Keine Anzeigedaten verfügbar.';
        document.getElementById('error-message').style.display = 'block';
        console.error('No monitors data available:', data);
        document.getElementById('departure-table').innerHTML = '';
        document.getElementById('stoerung-text').innerHTML = '';
        return;
    } else {
        document.getElementById('error-message').style.display = 'none';
    }

    let haltepunktName = data.data.monitors[0].locationStop?.properties?.title || 'Unbekannter Haltepunkt';
    document.getElementById('haltepunkt-name').innerText = haltepunktName;
    let table = document.getElementById('departure-table');
    table.innerHTML = '';


    data.data.monitors.forEach(monitor => {
        let stationName = monitor.locationStop?.properties?.title;
        let lines = {};

        monitor.lines.forEach(line => {
            if (!lines[line.name]) {
                lines[line.name] = [];
            }
            line.departures?.departure.forEach(dep => {
                let towards = line.towards;
                if (dep.vehicle && dep.vehicle.towards) {
                    towards = dep.vehicle.towards;
                }
                let barrierFree = dep.vehicle?.barrierFree !== undefined ? dep.vehicle.barrierFree : line.barrierFree;
                lines[line.name].push({
                    towards: towards,
                    countdown: dep.departureTime.countdown,
                    barrierFree: barrierFree,
                    realtimeSupported: line.realtimeSupported
                });
            });
        });

        // Erstellen der Kopfzeile für jede Station
        let stationHeader = document.createElement('tr');
        stationHeader.innerHTML = `<th colspan="3" onclick="toggleDepartures('${stationName}')">${stationName}</th>`;
        table.appendChild(stationHeader);


        for (let lineName in lines) {
            let visibleDepartures = lines[lineName].slice(0, 2);
            let hiddenDepartures = lines[lineName].slice(2);

            visibleDepartures.forEach(dep => {
                let row = document.createElement('tr');
                row.setAttribute('data-station', stationName);
                row.innerHTML = `
                    <td>${lineName}</td>
                    <td>${dep.towards} ${dep.barrierFree ? '♿' : ''} ${dep.realtimeSupported ? '🕒' : ''}</td>
                    <td>${dep.countdown}</td>
                `;
                table.appendChild(row);
            });

            hiddenDepartures.forEach(dep => {
                let row = document.createElement('tr');
                row.setAttribute('data-station', stationName);
                row.style.display = 'none';
                row.innerHTML = `
                    <td>${lineName}</td>
                    <td>${dep.towards} ${dep.barrierFree ? '♿' : ''} ${dep.realtimeSupported ? '🕒' : ''}</td>
                    <td>${dep.countdown}</td>
                `;
                table.appendChild(row);
            });
        }
    });

    previousData = data;
}

setInterval(fetchData, 15000);