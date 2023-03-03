
var lat = 60.22398617731569;
var lng = 24.75839877748185;
var range = 700;
const eventsDiv = document.getElementById('events');

fetch('https://api.hel.fi/linkedevents/v1/event/?start=now&end=today')
	.then(response => response.json())
	.then(data => {
		// Loop through the events and create an HTML element for each one
		data.data.forEach(event => {
			const eventDiv = document.createElement('div');
			eventDiv.textContent = `${event.name.fi} starts at ${event.start_time}`;
			eventsDiv.appendChild(eventDiv);
		});
	})
	.catch(error => console.error(error));

window.addEventListener('load', function () {
	getStopsAndSchedules(lat, lng, range);
});
function getStopsAndSchedules(lat, lng, range) {
	var overpassUrl = 'https://overpass-api.de/api/interpreter?data=[out:json];node["public_transport"="stop_position"](around:1000,' + lat + ',' + lng + ');out;rel["network"="HSL"]["type"="route_master"](around:' + range + ',' + lat + ',' + lng + ');out;';
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

				getSchedules(stop.id);
			});
		})
		.catch(function (error) {
			console.error(error);
		});
}
function getSchedules(stopId) {
	var apiUrl = 'https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql';
	var query = `
		{
		  stop(id: "HSL:${stopId}") {
			name
			stoptimesWithoutPatterns(numberOfDepartures: 5) {
			  scheduledDeparture
			  realtimeDeparture
			  serviceDay
			  headsign
			  trip {
				routeShortName
			  }
			}
		  }
		}
	`;
	fetch(apiUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/graphql'
		},
		body: query
	})
		.then(function (response) {
			return response.json();
		})
		.then(function (data) {
			if (data.data.stop !== null) {
				var schedules = data.data.stop.stoptimesWithoutPatterns;
				if (schedules.length > 0) {
					var scheduleList = document.createElement('ul');
					schedules.forEach(function (schedule) {
						var scheduledDeparture = new Date(schedule.serviceDay * 1000 + schedule.scheduledDeparture * 1000);
						var realtimeDeparture = schedule.realtimeDeparture ? new Date(schedule.serviceDay * 1000 + schedule.realtimeDeparture * 1000) : null;
						var routeShortName = schedule.trip.routeShortName;
						var headsign = schedule.headsign;
						var scheduleItem = document.createElement('li');
						scheduleItem.innerHTML = '<strong>' + routeShortName + '</strong> to ' + headsign + ' (' + scheduledDeparture.toLocaleTimeString() + (schedule.realtimeDeparture ? ' - ' + realtimeDeparture.toLocaleTimeString() : '') + ')';
						scheduleList.appendChild(scheduleItem);
					});
					document.getElementById('stop-' + stopId).appendChild(scheduleList);
				} else {
					document.getElementById('stop-' + stopId).innerHTML = 'No upcoming departures.';
				}
			} else {
				document.getElementById('stop-' + stopId).innerHTML = 'Stop not found.';
			}
		})
		.catch(function (error) {
			console.error(error);
		});
}

