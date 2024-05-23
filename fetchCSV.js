function fetchCSVData(url, callback, headers) {
    console.log(`Fetching CSV data from URL: ${url}`);
    fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`)
        .then(response => {
            console.log(`Response received from ${url}`);
            return response.json();
        })
        .then(data => {
            try {
                // Decode Base64 encoded CSV data
                const base64Data = data.contents.split(',')[1];
                const csvData = atob(base64Data);
                console.log(`CSV Data decoded: ${csvData.slice(0, 100)}...`); // Log the first 100 characters of the CSV data
                const parsedData = parseCSV(csvData, headers);
                console.log(`Parsed data:`, parsedData);
                callback(parsedData);
            } catch (e) {
                console.error('Error parsing CSV data:', e);
            }
        })
        .catch(error => console.error('Error fetching CSV data:', error));
}

function parseCSV(data, headers) {
    console.log(`Parsing CSV data with headers: ${headers}`);
    const lines = data.split('\n');
    const items = [];

    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(';');
        if (row.length === headers.length) {
            const item = {};
            headers.forEach((header, index) => {
                item[header] = row[index];
            });
            items.push(item);
        }
    }

    console.log(`Parsed items:`, items);
    return items;
}

function populateDropdown(items, dropdownId, textKey, valueKey) {
    const select = document.getElementById(dropdownId);
    select.innerHTML = ''; // Clear existing options
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valueKey];
        option.text = item[textKey];
        select.appendChild(option);
    });
    console.log(`Dropdown ${dropdownId} populated with items:`, items); // Log the populated items
}
