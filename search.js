// search.js

let searchTimeout = null;
let awesomplete = new Awesomplete(document.getElementById('station-search'), {
    minChars: 1,
    maxItems: 100,
    autoFirst: true
});

function displayResults(results) {
    let list = results.map(result => ({
        label: `${result.location.properties.title} (${result.location.properties.name}/${result.attributes.stopType})`,
        value: result.location.properties.name
    }));
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
            let response = await fetch(`https://cors-anywhere.herokuapp.com/https://m.qando.at/ws/location?search=${encodeURIComponent(searchTerm)}&type=stop`);
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
    }, 400);
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