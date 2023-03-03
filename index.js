// q: how to make remote github repo in terminal
// a: git remote add origin
// obtain the user's current location using HTML5 geolocation
navigator.geolocation.getCurrentPosition(function (position) {
    // var lat = position.coords.latitude;
    // var lng = position.coords.longitude;
    var lat = 60.22398617731569;
    var lng = 24.75839877748185;
    var range = 700;
    // send a request to the Overpass API to obtain the nearest stops in the HSL network
    var overpassUrl = 'https://overpass-api.de/api/interpreter?data=[out:json];node["public_transport"="stop_position"](around:1000,' + lat + ',' + lng + ');out;rel["network"="HSL"]["type"="route_master"](around:1000,' + lat + ',' + lng + ');out;';
    fetch(overpassUrl)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            var stops = [];
            data.elements.forEach(function (element) {
                if (element.type === "node") {
                    var stop = {
                        id: element.id,
                        name: element.tags.name,
                        lat: element.lat,
                        lng: element.lon,
                        routes: []
                    };
                    stops.push(stop);
                } else if (element.type === "relation") {
                    element.members.forEach(function (member) {
                        if (member.role === "platform") {
                            var stop = stops.find(function (stop) {
                                return stop.id === member.ref;
                            });
                            if (stop) {
                                var route = element.tags.ref;
                                if (stop.routes.indexOf(route) === -1) {
                                    stop.routes.push(route);
                                }
                            }
                        }
                    });
                }
            });

            var map = L.map('map').setView([lat, lng], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
            }).addTo(map);

            stops.forEach(function (stop) {
                var marker = L.marker([stop.lat, stop.lng]).addTo(map);
                marker.bindPopup(stop.name + '<br>ID: ' + stop.id + '<br>Routes: ' + stop.routes.join(', '));

                var listItem = document.createElement('li');
                listItem.innerHTML = '<strong>' + stop.name + '</strong> (ID: ' + stop.id + ', Routes: ' + stop.routes.join(', ') + ')';
                document.getElementById('stops').appendChild(listItem);
            });
        });
});