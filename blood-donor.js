// Blood Donor Finder JavaScript
let map;
let markers = [];
let donors = [];
let userLocation = null;

// Mock donor data (in production, this would come from a database)
const mockDonors = [
    {
        id: 1,
        name: 'Rajesh Kumar',
        bloodGroup: 'O+',
        phone: '9876543210',
        location: { lat: 28.6139, lng: 77.2090 },
        address: 'Delhi, Connaught Place',
        lastDonation: '2024-01-15',
        available: true
    },
    {
        id: 2,
        name: 'Priya Sharma',
        bloodGroup: 'A+',
        phone: '9876543211',
        location: { lat: 28.6229, lng: 77.2080 },
        address: 'Delhi, Karol Bagh',
        lastDonation: '2024-02-01',
        available: true
    },
    {
        id: 3,
        name: 'Amit Singh',
        bloodGroup: 'B+',
        phone: '9876543212',
        location: { lat: 28.6039, lng: 77.2100 },
        address: 'Delhi, Chandni Chowk',
        lastDonation: '2023-12-20',
        available: false
    },
    {
        id: 4,
        name: 'Sunita Devi',
        bloodGroup: 'AB+',
        phone: '9876543213',
        location: { lat: 28.6329, lng: 77.2190 },
        address: 'Delhi, Rohini',
        lastDonation: '2024-01-10',
        available: true
    },
    {
        id: 5,
        name: 'Mohammed Ali',
        bloodGroup: 'O-',
        phone: '9876543214',
        location: { lat: 28.5909, lng: 77.2000 },
        address: 'Delhi, Lajpat Nagar',
        lastDonation: '2024-02-10',
        available: true
    }
];

// Initialize Google Map
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 28.6139, lng: 77.2090 }, // Delhi center
        zoom: 12,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });
    
    // Load initial donors
    loadDonors();
    
    // Get user location
    getCurrentLocation();
}

// Load donors on map and list
function loadDonors() {
    const bloodGroup = document.getElementById('bloodGroup').value;
    const maxDistance = parseInt(document.getElementById('distance').value) || 10;
    
    // Filter donors based on criteria
    let filteredDonors = mockDonors.filter(donor => {
        const bloodGroupMatch = !bloodGroup || donor.bloodGroup === bloodGroup;
        const distanceMatch = !userLocation || calculateDistance(userLocation, donor.location) <= maxDistance;
        return bloodGroupMatch && distanceMatch;
    });
    
    donors = filteredDonors;
    displayDonorsList();
    displayDonorsOnMap();
}

// Display donors in list
function displayDonorsList() {
    const donorsList = document.getElementById('donorsList');
    const donorCount = document.getElementById('donorCount');
    
    donorCount.textContent = `(${donors.length} found)`;
    
    if (donors.length === 0) {
        donorsList.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-users text-4xl mb-3"></i>
                <p>No donors found matching your criteria.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    donors.forEach(donor => {
        const bloodGroupClass = `bg-${donor.bloodGroup.toLowerCase().replace('+', '-positive').replace('-', '-negative')}`;
        const availabilityStatus = donor.available ? 
            '<span class="text-green-600 text-sm">Available</span>' : 
            '<span class="text-red-600 text-sm">Not Available</span>';
        
        html += `
            <div class="donor-card border rounded-lg p-4 hover:shadow-md">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center mb-2">
                            <h4 class="font-semibold mr-2">${donor.name}</h4>
                            <span class="blood-group-badge ${bloodGroupClass}">${donor.bloodGroup}</span>
                        </div>
                        <div class="text-sm text-gray-600 space-y-1">
                            <div><i class="fas fa-phone mr-2"></i>${donor.phone}</div>
                            <div><i class="fas fa-map-marker-alt mr-2"></i>${donor.address}</div>
                            <div><i class="fas fa-tint mr-2"></i>Last Donation: ${donor.lastDonation}</div>
                        </div>
                        <div class="mt-2">${availabilityStatus}</div>
                    </div>
                    <div class="flex flex-col gap-2">
                        <button onclick="contactDonor('${donor.phone}')" class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition">
                            <i class="fas fa-phone"></i>
                        </button>
                        <button onclick="showDonorOnMap(${donor.location.lat}, ${donor.location.lng})" class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition">
                            <i class="fas fa-map-marker-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    donorsList.innerHTML = html;
}

// Display donors on Google Map
function displayDonorsOnMap() {
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    
    donors.forEach(donor => {
        const marker = new google.maps.Marker({
            position: donor.location,
            map: map,
            title: `${donor.name} (${donor.bloodGroup})`,
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="16" cy="16" r="14" fill="${donor.available ? '#10b981' : '#ef4444'}" stroke="white" stroke-width="2"/>
                        <text x="16" y="20" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${donor.bloodGroup}</text>
                    </svg>
                `),
                scaledSize: new google.maps.Size(32, 32)
            }
        });
        
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div class="p-2">
                    <h4 class="font-semibold">${donor.name}</h4>
                    <p class="text-sm">Blood Group: ${donor.bloodGroup}</p>
                    <p class="text-sm">Phone: ${donor.phone}</p>
                    <p class="text-sm">Address: ${donor.address}</p>
                    <p class="text-sm">Status: ${donor.available ? 'Available' : 'Not Available'}</p>
                    <button onclick="contactDonor('${donor.phone}')" class="mt-2 bg-green-500 text-white px-3 py-1 rounded text-sm">
                        Contact Now
                    </button>
                </div>
            `
        });
        
        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });
        
        markers.push(marker);
    });
    
    // Adjust map to show all markers
    if (donors.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        donors.forEach(donor => {
            bounds.extend(donor.location);
        });
        map.fitBounds(bounds);
    }
}

// Get current user location
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Update location input
                document.getElementById('location').value = `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`;
                
                // Add user marker
                new google.maps.Marker({
                    position: userLocation,
                    map: map,
                    title: 'Your Location',
                    icon: {
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="8" fill="#3b82f6" stroke="white" stroke-width="2"/>
                                <circle cx="12" cy="12" r="3" fill="white"/>
                            </svg>
                        `),
                        scaledSize: new google.maps.Size(24, 24)
                    }
                });
                
                // Center map on user location
                map.setCenter(userLocation);
                
                // Reload donors with new location
                loadDonors();
            },
            error => {
                console.error('Error getting location:', error);
                showNotification('Unable to get your location. Please enter it manually.');
            }
        );
    } else {
        showNotification('Geolocation is not supported by your browser.');
    }
}

// Search donors
function searchDonors() {
    const location = document.getElementById('location').value;
    
    if (!location) {
        showNotification('Please enter a location or use current location.');
        return;
    }
    
    // Parse location if coordinates are entered
    const coords = location.split(',').map(coord => parseFloat(coord.trim()));
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        userLocation = { lat: coords[0], lng: coords[1] };
        map.setCenter(userLocation);
    }
    
    loadDonors();
}

// Contact donor
function contactDonor(phone) {
    if (confirm(`Call ${phone}?`)) {
        window.location.href = `tel:${phone}`;
    }
}

// Show donor on map
function showDonorOnMap(lat, lng) {
    map.setCenter({ lat, lng });
    map.setZoom(15);
}

// Register as donor
function registerAsDonor() {
    document.getElementById('donorModal').classList.remove('hidden');
}

// Save donor registration
function saveDonorRegistration() {
    const donor = {
        id: Date.now(),
        name: document.getElementById('donorName').value,
        phone: document.getElementById('donorPhone').value,
        email: document.getElementById('donorEmail').value,
        bloodGroup: document.getElementById('donorBloodGroup').value,
        lastDonation: document.getElementById('lastDonation').value,
        address: document.getElementById('donorAddress').value,
        location: userLocation || { lat: 28.6139, lng: 77.2090 },
        available: true,
        registeredAt: new Date().toISOString()
    };
    
    if (!donor.name || !donor.phone || !donor.bloodGroup || !donor.address) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Save to localStorage (in production, this would be sent to server)
    let registeredDonors = JSON.parse(localStorage.getItem('registeredDonors') || '[]');
    registeredDonors.push(donor);
    localStorage.setItem('registeredDonors', JSON.stringify(registeredDonors));
    
    // Add to mock donors for immediate display
    mockDonors.push(donor);
    
    closeDonorModal();
    loadDonors();
    showNotification('Successfully registered as blood donor!');
}

// Close donor modal
function closeDonorModal() {
    document.getElementById('donorModal').classList.add('hidden');
    
    // Clear form
    document.getElementById('donorName').value = '';
    document.getElementById('donorPhone').value = '';
    document.getElementById('donorEmail').value = '';
    document.getElementById('donorBloodGroup').value = '';
    document.getElementById('lastDonation').value = '';
    document.getElementById('donorAddress').value = '';
}

// Submit emergency request
function submitEmergencyRequest() {
    const request = {
        patientName: document.getElementById('patientName').value,
        hospital: document.getElementById('hospital').value,
        bloodGroup: document.getElementById('requiredBloodGroup').value,
        contactNumber: document.getElementById('contactNumber').value,
        urgency: document.querySelector('input[name="urgency"]:checked')?.value,
        location: userLocation,
        timestamp: new Date().toISOString()
    };
    
    if (!request.patientName || !request.hospital || !request.bloodGroup || !request.contactNumber) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Save emergency request
    let emergencyRequests = JSON.parse(localStorage.getItem('emergencyRequests') || '[]');
    emergencyRequests.push(request);
    localStorage.setItem('emergencyRequests', JSON.stringify(emergencyRequests));
    
    // Notify nearby donors (in production, this would send push notifications)
    notifyNearbyDonors(request);
    
    showNotification('Emergency request sent to nearby donors!');
    
    // Clear form
    document.getElementById('patientName').value = '';
    document.getElementById('hospital').value = '';
    document.getElementById('requiredBloodGroup').value = '';
    document.getElementById('contactNumber').value = '';
    document.querySelector('input[name="urgency"]').checked = false;
}

// Notify nearby donors (mock implementation)
function notifyNearbyDonors(request) {
    const nearbyDonors = donors.filter(donor => {
        return donor.available && donor.bloodGroup === request.bloodGroup;
    });
    
    console.log(`Notifying ${nearbyDonors.length} nearby donors for ${request.bloodGroup} blood`);
    
    // In production, this would send actual notifications via Firebase Cloud Messaging
    nearbyDonors.forEach(donor => {
        console.log(`Notification sent to ${donor.name} (${donor.phone})`);
    });
}

// Calculate distance between two points
function calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Go back to previous page
function goBack() {
    window.history.back();
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.innerHTML = `<i class="fas fa-check-circle mr-2"></i>${message}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Load registered donors from localStorage
function loadRegisteredDonors() {
    const registeredDonors = JSON.parse(localStorage.getItem('registeredDonors') || '[]');
    registeredDonors.forEach(donor => {
        mockDonors.push(donor);
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadRegisteredDonors();
    
    // If Google Maps fails to load, show fallback
    if (typeof google === 'undefined') {
        document.getElementById('map').innerHTML = `
            <div class="flex items-center justify-center h-full bg-gray-100 rounded-lg">
                <div class="text-center">
                    <i class="fas fa-map-marked-alt text-4xl text-gray-400 mb-3"></i>
                    <p class="text-gray-600">Map unavailable</p>
                    <p class="text-sm text-gray-500">Please check your internet connection</p>
                </div>
            </div>
        `;
    }
});
