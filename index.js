// q: how to make remote github repo in terminal
// a: git remote add origin
// obtain the user's current location using HTML5 geolocation
navigator.geolocation.getCurrentPosition(function (position) {
    // var lat = position.coords.latitude;
    // var lng = position.coords.longitude;
    var lat = 60.223946279342854;
    var lng = 24.75845785768593;
    var range = 700;
    // send a request to the Overpass API to obtain the nearest stops in the HSL network
    var overpassUrl = 'https://overpass-api.de/api/interpreter?data=[out:json];node["public_transport"="stop_position"](around:' + range + ',' + lat + ',' + lng + ');out;';
    fetch(overpassUrl)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            // parse the response from the Overpass API to extract the relevant information about the nearest stops
            var stops = [];
            data.elements.forEach(function (element) {
                var stop = {
                    name: element.tags.name,
                    lat: element.lat,
                    lng: element.lon
                };
                stops.push(stop);
            });

            // display the map using Leaflet
            var map = L.map('map').setView([lat, lng], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
            }).addTo(map);

            // add markers to the map for each of the nearest stops
            stops.forEach(function (stop) {
                var marker = L.marker([stop.lat, stop.lng]).addTo(map);
                marker.bindPopup(stop.name);

                // add the stop name to the list in the body of the page
                var listItem = document.createElement('li');
                listItem.innerText = stop.name;
                document.getElementById('stops').appendChild(listItem);
            });
        });
});