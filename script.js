function initMap() { // Function to initialize the Google Maps
    const centerMap = {lat: 51.9279861, lng: 4.4908281};   // Define the coordinates for the center of the map
    const mapOptions = {  // Define options for map customization
        center: centerMap,
        zoom: 13,
        disableDefaultUI: true,
        styles: [ // Style settings for the map to modify its appearance
            {
                "featureType": "all",
                "elementType": "all",
                "stylers": [
                    {
                        "invert_lightness": true
                    },
                    {
                        "saturation": 10
                    },
                    {
                        "lightness": 30
                    },
                    {
                        "gamma": 0.5
                    },
                    {
                        "hue": "#435158"
                    }
                ]
            },
            {
                "featureType": "poi.business",
                "elementType": "all",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "poi",
                "elementType": "labels",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "elementType": "labels",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road.arterial",
                "elementType": "labels",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road.local",
                "elementType": "labels",
                "stylers": [
                    {
                        "visibility": "simplified"
                    }
                ]
            },
            {
                "featureType": "transit.station",
                "elementType": "labels",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            }
        ]
    };

    const map = new google.maps.Map(document.getElementById('google-map'), mapOptions);
    const sidebar = document.getElementById('info-sidebar');
    const popupWindow = document.getElementById('popup-window');
    const service = new google.maps.places.PlacesService(map);


    fetch('restau_data.json')  // Fetch markers data from the JSON file
        .then(response => response.json())
        .then(markers => {
            markers.forEach((markerData) => {
                const marker = createMarker(markerData, map);
                google.maps.event.addListener(marker, 'click', () => {
                    showPopup(markerData, marker);
                    showSidebar(markerData.LocationName, markerData.placeId);
                    //getPlaceDetails(markerData.placeId);
                });
            });
        })
        .catch(error => console.error('Error loading the markers:', error));    

    // Function to create a marker on the map
    function createMarker(data, map) {
        return new google.maps.Marker({
            position: { lat: data.lat, lng: data.lng },
            map: map,
            icon: {
                url: data.iconUrl,
                scaledSize: new google.maps.Size(100, 100),
                anchor: new google.maps.Point(50, 100)
            }
        });
    }

    // Function to show the popup window when a marker is clicked
    function showPopup(data, marker) {
        const content = `
            <strong>${data.LocationName}</strong><br>
            <button onclick="showSidebar('${data.LocationName}', '${data.placeId}')">More Info</button>
        `;
        popupWindow.innerHTML = content;
        popupWindow.style.display = 'block';
        popupWindow.style.left = `${marker.getPosition().lng()}px`; 
        popupWindow.style.top = `${marker.getPosition().lat()}px`; 
    }

    // Exposed function to show the sidebar with detailed information
    window.showSidebar = (locationName, placeId) => {
        fetch('restau_data.json')
            .then(response => response.json())
            .then(markers => {
                const data = markers.find(marker => marker.LocationName === locationName);
                const imagesHtml = generateImageHtml(data.images);
                const infoContent = `
                    <div class="info-content">
                        <h3>${data.LocationName}</h3>
                        <address>${data.address}</address>
                        ${data.videoEmbed}
                        ${imagesHtml}
                        <div id="opening-hours">Loading opening hours...</div>
                        <div id="phone-number">Loading phone number...</div>
                        <div id="menu">Loading menu...</div>
                        <button onclick="openDirectionsModal(${data.lat}, ${data.lng})">Get Directions</button>
                        <div id="comment-section" class="comment-section">
                            <h4>Comments</h4>
                            <div id="comments"></div>
                            <textarea id="new-comment" placeholder="Add a comment..."></textarea>
                            <button onclick="addComment()">Post Comment</button>
                        </div>
                    </div>`;
                sidebar.innerHTML = infoContent;
                sidebar.style.display = 'block';
                document.getElementById('google-map').style.width = '67%';
                popupWindow.style.display = 'none'; // Hide the popup after opening the sidebar
                loadTikTokScript();
                getPlaceDetails(placeId);
                loadComments(locationName); // Load comments for the restaurant
            }) 
            .catch(error => console.error('Error in showSidebar:', error)); // Added error handling
    };

    // Function to get place details including opening hours
    function getPlaceDetails(placeId) {
        const request = {
            placeId: placeId,
            fields: ['name', 'formatted_address', 'opening_hours', 'formatted_phone_number', 'website']
        };

        service.getDetails(request, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                const openingHours = place.opening_hours ? place.opening_hours.weekday_text.join('<br>') : 'No opening hours available';
                document.getElementById('opening-hours').innerHTML = `
                    <h4>Opening Hou rs:</h4>
                    <p>${openingHours}</p>
                `;
                const phoneNumber = place.formatted_phone_number ? place.formatted_phone_number : 'No phone number available';
                document.getElementById('phone-number').innerHTML = `
                    <h4>Phone Number:</h4>
                    <p>${phoneNumber}</p>
                `;
                const menu = place.menu ? place.menu : 'No menu available';
                document.getElementById('menu').innerHTML = `
                    <h4>Menu:</h4>
                    <p>${menu}</p>
                `;
            } else {
                document.getElementById('opening-hours').innerHTML = 'Failed to load opening hours.';
                document.getElementById('phone-number').innerHTML = 'Failed to load phone number.';
                document.getElementById('menu').innerHTML = 'Failed to load menu.';
            }
        });
    }

    function generateImageHtml(images) {
        return images.map(img => `<img src="${img}" style="width: 100%; height: auto; margin-bottom: 10px;">`).join('');
    }

    // Function to dynamically load the TikTok embed script
    function loadTikTokScript() {
        const scriptTag = document.createElement('script');
        scriptTag.src = 'https://www.tiktok.com/embed.js';
        scriptTag.async = true;
        document.body.appendChild(scriptTag);
    }

    function loadComments(locationName) {
        const comments = JSON.parse(localStorage.getItem(locationName) || '[]');
        const commentsContainer = document.getElementById('comments');
        if (commentsContainer) {
            commentsContainer.innerHTML = comments.map(comment => `<div class="comment">${comment}</div>`).join('');
        }
    }
    

    window.addComment = () => {
        const newComment = document.getElementById('new-comment').value;
        if (newComment.trim()) {
            const locationName = document.querySelector('.info-content h3').textContent;
            const comments = JSON.parse(localStorage.getItem(locationName) || '[]');
            comments.push(newComment);
            localStorage.setItem(locationName, JSON.stringify(comments));
            document.getElementById('new-comment').value = '';
            loadComments(locationName);
        }

    }

    // Clicking outside any marker or sidebar closes the sidebar and popup
    google.maps.event.addListener(map, 'click', () => {
        sidebar.style.display = 'none';
        popupWindow.style.display = 'none';
        document.getElementById('google-map').style.width = '100%';
    });
}

// Directions Modal and Navigation Functions
function openDirectionsModal(lat, lng) {
    window.selectedCoords = { lat, lng };
    document.getElementById('directions-modal').style.display = 'block';
}

function closeDirectionsModal() {
    document.getElementById('directions-modal').style.display = 'none';
}

function openGoogleMaps() {
    const { lat, lng } = window.selectedCoords;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
    closeDirectionsModal();
}

function openAppleMaps() {
    const { lat, lng } = window.selectedCoords;
    const url = `http://maps.apple.com/?daddr=${lat},${lng}`;
    window.open(url, '_blank');
    closeDirectionsModal();
}

function openWaze() {
    const { lat, lng } = window.selectedCoords;
    const url = `https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    window.open(url, '_blank');
    closeDirectionsModal();
}