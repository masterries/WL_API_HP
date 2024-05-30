// search.js

let searchTimeout = null;
let awesomplete = new Awesomplete(document.getElementById('station-search'), {
    minChars: 1,
    maxItems: 100,
    autoFirst: true
});

function displayResults(results) {
    console.log(results);
    let list = results.map(result => {
        // Sicherstellen, dass alle benötigten Eigenschaften vorhanden sind
        const title = result.location?.properties?.title;
        const name = result.location?.properties?.name;
        const stopType = result.attributes?.stopType;

        // Wenn irgendein erforderlicher Wert fehlt, überspringen Sie diesen Eintrag
        if (!title || !name || !stopType) {
            return null;  // Dies wird später gefiltert, um nicht in die finale Liste aufgenommen zu werden
        }

        // Objekt erstellen, wenn alle Daten vorhanden sind
        return {
            label: `${title} (${name}/${stopType})`,
            value: name
        };
    }).filter(item => item !== null);  // Entfernen Sie alle null-Werte, die durch fehlende Daten verursacht wurden

    console.log(list);
    awesomplete.list = list;
}




async function searchStation() {
    let searchTerm = document.getElementById('station-search').value;

    if (!searchTerm) {
        awesomplete.list = [];
        return;
    }

    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    searchTimeout = setTimeout(async () => {
        try {
            let response = await fetch(`https://46.38.243.223/proxy?url=/ws/location?search=${encodeURIComponent(searchTerm)}&type=stop`);
            let data = await response.json();
            console.log(data);

            if (data.message.messageCode !== 1) {
                throw new Error('Error searching station: ' + data.message.value);
            }

            displayResults(data.data.pois);
        } catch (e) {
            console.error('Error searching station:', e);
            awesomplete.list = ['Fehler bei der Suche.'];
        }
    }, 800);
}



document.getElementById('station-search').addEventListener('input', searchStation);
document.getElementById('station-search').addEventListener('awesomplete-selectcomplete', function(event) {
    let selectedTitle = event.text.label;
    console.log(event.text)
    let selectedName = event.text.value;  // Hole den Namen aus dem ausgewählten Element
    document.getElementById('station-search').value = selectedTitle;  // Zeige den Titel im Suchfeld an
    document.getElementById('selected-station').textContent = selectedName;  // Zeige den Namen im Footer an
    console.log("selectedName: " + selectedName)
    console.log("selectedTitle: " + selectedTitle)
    currentStationName = selectedName;  // Setze den Namen als currentStationName
    fetchData();
});