let previousData = null;
let rblNumber = "407";

function getURLParameter(name) {
    return new URLSearchParams(window.location.search).get(name);
}

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

function fetchData() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", 'https://api.allorigins.win/get?url=' + encodeURIComponent(`https://www.wienerlinien.at/ogd_realtime/monitor?activateTrafficInfo=stoerunglang&rbl=${rblNumber}`), true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            try {
                let response = JSON.parse(xhr.responseText);
                let parsedData = JSON.parse(response.contents);
                console.log(parsedData);  // Debugging-Ausgabe
                updatePage(parsedData);
            } catch (e) {
                console.error('Error parsing data:', e);
            }
        } else if (xhr.readyState === 4) {
            console.error('Error fetching data:', xhr.statusText);
        }
    };
    xhr.send();
}

function updatePage(data) {
    // Überprüfen Sie, ob das grundlegende Datenobjekt fehlt oder leer ist
    if (!data || !data.data) {
        document.getElementById('error-message').innerText = 'Keine Daten verfügbar.';
        document.getElementById('error-message').style.display = 'block';
        console.error('No data object found:', data);
        document.getElementById('departure-table').innerHTML = '';
        return;
    }
    
    // Überprüfen Sie, ob Monitore vorhanden sind oder die Liste leer ist
    if (!data.data.monitors || data.data.monitors.length === 0) {
        document.getElementById('error-message').innerText = 'Keine Anzeigedaten verfügbar.';
        document.getElementById('error-message').style.display = 'block';
        console.error('No monitors data available:', data);
        document.getElementById('departure-table').innerHTML = '';
        return;
    } else {
        document.getElementById('error-message').style.display = 'none'; // Verbergen Sie die Fehlermeldung, wenn Daten vorhanden sind
    }

    // Da Daten vorhanden sind, extrahieren Sie die relevanten Daten
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
    } else {
        document.getElementById('error-message').innerText = 'Keine Abfahrtsinformationen verfügbar.';
        document.getElementById('error-message').style.display = 'block';
        document.getElementById('departure-table').innerHTML = '';
    }

    let stoerungText = data.data.trafficInfos?.[0]?.description.replace(/\n/g, ' ') || 'Keine Störungen';

    // Aktualisieren Sie die Seite mit den neuen Daten
    document.getElementById('haltepunkt-name').innerText = haltepunktName;
    let table = document.getElementById('departure-table');
    table.innerHTML = '';
    departures.forEach(dep => {
        let row = document.createElement('tr');
        row.innerHTML = `
            <td>${dep.line}</td>
            <td>${dep.towards} ${dep.barrierFree ? '♿' : ''} ${dep.realtimeSupported ? '🕒' : ''}</td>
            <td>${dep.countdown}</td>
        `;
        table.appendChild(row);
    });
    document.getElementById('stoerung-text').innerText = stoerungText;

    // Aktualisieren Sie previousData für künftige Vergleiche
    previousData = data;
}


function updateRBL() {
    rblNumber = document.getElementById('rbl-number').value;
    fetchData();
}

window.onload = function() {
    const paramRBL = getURLParameter('rbl');
    if (paramRBL) {
        rblNumber = paramRBL;
        document.getElementById('rbl-number').value = paramRBL;
    }
    fetchData();
}

setInterval(updateClock, 1000);  // Update the clock every second
setInterval(fetchData, 15000);  // Update data every 15 seconds
