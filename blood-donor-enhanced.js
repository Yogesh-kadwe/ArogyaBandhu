// Enhanced Blood Donor System with Emergency Blood Link for Doctors
class BloodDonorEmergencySystem {
    constructor() {
        this.donors = [];
        this.emergencyRequests = [];
        this.userLocation = null;
        this.map = null;
        this.currentUser = null;
        this.initializeSystem();
    }

    initializeSystem() {
        this.loadCurrentUser();
        this.loadDonors();
        this.loadEmergencyRequests();
        this.initializeMap();
        this.setupRealTimeUpdates();
        this.setupEmergencyHotline();
    }

    loadCurrentUser() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
    }

    // Load donors from multiple sources
    loadDonors() {
        // Load registered donors
        const registeredDonors = JSON.parse(localStorage.getItem('registeredDonors') || '[]');
        
        // Load demo donors
        const demoDonors = [
            {
                id: 1,
                name: 'Rajesh Kumar',
                bloodGroup: 'O+',
                phone: '9876543210',
                location: { lat: 28.6139, lng: 77.2090 },
                address: 'Delhi, Connaught Place',
                lastDonation: '2024-01-15',
                available: true,
                verified: true,
                responseTime: '5-10 minutes',
                rating: 4.8
            },
            {
                id: 2,
                name: 'Priya Sharma',
                bloodGroup: 'A+',
                phone: '9876543211',
                location: { lat: 28.6229, lng: 77.2080 },
                address: 'Delhi, Karol Bagh',
                lastDonation: '2024-02-01',
                available: true,
                verified: true,
                responseTime: '10-15 minutes',
                rating: 4.9
            },
            {
                id: 3,
                name: 'Amit Singh',
                bloodGroup: 'B+',
                phone: '9876543212',
                location: { lat: 28.6039, lng: 77.2100 },
                address: 'Delhi, Chandni Chowk',
                lastDonation: '2023-12-20',
                available: false,
                verified: true,
                responseTime: '15-20 minutes',
                rating: 4.7
            },
            {
                id: 4,
                name: 'Sunita Devi',
                bloodGroup: 'AB+',
                phone: '9876543213',
                location: { lat: 28.6329, lng: 77.2190 },
                address: 'Delhi, Rohini',
                lastDonation: '2024-01-10',
                available: true,
                verified: true,
                responseTime: '20-30 minutes',
                rating: 4.6
            },
            {
                id: 5,
                name: 'Mohammed Ali',
                bloodGroup: 'O-',
                phone: '9876543214',
                location: { lat: 28.5909, lng: 77.2000 },
                address: 'Delhi, Lajpat Nagar',
                lastDonation: '2024-02-10',
                available: true,
                verified: true,
                responseTime: '5-10 minutes',
                rating: 4.9
            }
        ];

        this.donors = [...demoDonors, ...registeredDonors];
        this.displayDonors();
    }

    loadEmergencyRequests() {
        this.emergencyRequests = JSON.parse(localStorage.getItem('emergencyRequests') || '[]');
        this.displayEmergencyRequests();
    }

    // Initialize Google Maps
    initializeMap() {
        if (typeof google !== 'undefined' && google.maps) {
            this.map = new google.maps.Map(document.getElementById('map'), {
                center: { lat: 28.6139, lng: 77.2090 },
                zoom: 12,
                styles: [
                    {
                        featureType: 'poi',
                        elementType: 'labels',
                        stylers: [{ visibility: 'off' }]
                    }
                ]
            });
            
            this.getCurrentLocation();
            this.displayDonorsOnMap();
        } else {
            // Fallback if Google Maps not loaded
            document.getElementById('map').innerHTML = `
                <div class="flex items-center justify-center h-full bg-gray-100 rounded-lg">
                    <div class="text-center">
                        <i class="fas fa-map-marked-alt text-4xl mb-3 text-gray-400"></i>
                        <p class="text-gray-600">Map loading...</p>
                        <p class="text-sm text-gray-500">Please check your internet connection</p>
                    </div>
                </div>
            `;
        }
    }

    // Get current user location
    getCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    this.userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    
                    // Update location input
                    document.getElementById('location').value = 
                        `${this.userLocation.lat.toFixed(4)}, ${this.userLocation.lng.toFixed(4)}`;
                    
                    // Add user marker
                    if (this.map) {
                        new google.maps.Marker({
                            position: this.userLocation,
                            map: this.map,
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
                        
                        this.map.setCenter(this.userLocation);
                    }
                    
                    this.filterNearbyDonors();
                },
                error => {
                    console.error('Error getting location:', error);
                    this.showNotification('Unable to get your location. Please enter it manually.', 'warning');
                }
            );
        }
    }

    // Search and filter donors
    searchDonors() {
        const bloodGroup = document.getElementById('bloodGroup').value;
        const maxDistance = parseInt(document.getElementById('distance').value) || 10;
        const locationInput = document.getElementById('location').value;
        
        // Parse location if coordinates are entered
        if (locationInput && locationInput.includes(',')) {
            const coords = locationInput.split(',').map(coord => parseFloat(coord.trim()));
            if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                this.userLocation = { lat: coords[0], lng: coords[1] };
                if (this.map) {
                    this.map.setCenter(this.userLocation);
                }
            }
        }
        
        this.filterNearbyDonors(bloodGroup, maxDistance);
    }

    // Filter nearby donors
    filterNearbyDonors(bloodGroup = '', maxDistance = 10) {
        let filteredDonors = this.donors.filter(donor => {
            const bloodGroupMatch = !bloodGroup || donor.bloodGroup === bloodGroup;
            const distanceMatch = !this.userLocation || this.calculateDistance(this.userLocation, donor.location) <= maxDistance;
            const availabilityMatch = donor.available;
            
            return bloodGroupMatch && distanceMatch && availabilityMatch;
        });

        // Sort by distance and rating
        filteredDonors.sort((a, b) => {
            const distA = this.userLocation ? this.calculateDistance(this.userLocation, a.location) : 0;
            const distB = this.userLocation ? this.calculateDistance(this.userLocation, b.location) : 0;
            
            if (Math.abs(distA - distB) < 1) {
                return b.rating - a.rating; // Sort by rating if distances are similar
            }
            return distA - distB; // Otherwise sort by distance
        });

        this.displayDonors(filteredDonors);
        this.displayDonorsOnMap(filteredDonors);
    }

    // Display donors in list
    displayDonors(filteredDonors = this.donors) {
        const container = document.getElementById('donorsList');
        const countElement = document.getElementById('donorCount');
        
        if (countElement) {
            countElement.textContent = `(${filteredDonors.length} found)`;
        }
        
        if (filteredDonors.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-users text-4xl mb-3"></i>
                    <p>No donors found matching your criteria.</p>
                    <p class="text-sm mt-2">Try expanding your search distance or blood group</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        filteredDonors.forEach(donor => {
            const distance = this.userLocation ? 
                this.calculateDistance(this.userLocation, donor.location).toFixed(1) : 'N/A';
            
            const availabilityBadge = donor.available ? 
                '<span class="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Available</span>' : 
                '<span class="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">Unavailable</span>';
            
            const verifiedBadge = donor.verified ? 
                '<i class="fas fa-check-circle text-blue-500 ml-2" title="Verified Donor"></i>' : '';
            
            html += `
                <div class="donor-card border rounded-lg p-4 hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center mb-2">
                                <h4 class="font-semibold text-lg">${donor.name}</h4>
                                <span class="blood-group-badge bg-${donor.bloodGroup.toLowerCase().replace('+', '-positive').replace('-', '-negative')} text-white px-3 py-1 rounded-full text-sm ml-3">
                                    ${donor.bloodGroup}
                                </span>
                                ${verifiedBadge}
                            </div>
                            <div class="text-sm text-gray-600 space-y-1">
                                <div class="flex items-center">
                                    <i class="fas fa-phone mr-2 text-gray-400"></i>
                                    ${donor.phone}
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-map-marker-alt mr-2 text-gray-400"></i>
                                    ${donor.address}
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-tint mr-2 text-gray-400"></i>
                                    Last Donation: ${donor.lastDonation}
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-clock mr-2 text-gray-400"></i>
                                    Response Time: ${donor.responseTime}
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-star mr-2 text-yellow-400"></i>
                                    Rating: ${donor.rating}/5.0
                                </div>
                                ${distance !== 'N/A' ? `
                                <div class="flex items-center">
                                    <i class="fas fa-route mr-2 text-gray-400"></i>
                                    Distance: ${distance} km
                                </div>
                                ` : ''}
                            </div>
                            <div class="mt-2">${availabilityBadge}</div>
                        </div>
                        <div class="flex flex-col gap-2 ml-4">
                            ${this.currentUser?.role === 'doctor' ? `
                                <button onclick="emergencyContact('${donor.phone}', '${donor.name}')" class="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition text-sm">
                                    <i class="fas fa-phone-alt mr-1"></i>Emergency
                                </button>
                            ` : ''}
                            <button onclick="contactDonor('${donor.phone}')" class="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition text-sm">
                                <i class="fas fa-phone mr-1"></i>Contact
                            </button>
                            <button onclick="showDonorOnMap(${donor.location.lat}, ${donor.location.lng})" class="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition text-sm">
                                <i class="fas fa-map-marker-alt mr-1"></i>Map
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    // Display donors on map
    displayDonorsOnMap(filteredDonors = this.donors) {
        if (!this.map) return;
        
        // Clear existing markers
        if (this.donorMarkers) {
            this.donorMarkers.forEach(marker => marker.setMap(null));
        }
        this.donorMarkers = [];
        
        filteredDonors.forEach(donor => {
            const marker = new google.maps.Marker({
                position: donor.location,
                map: this.map,
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
                    <div class="p-3">
                        <h4 class="font-semibold">${donor.name}</h4>
                        <p class="text-sm">Blood Group: ${donor.bloodGroup}</p>
                        <p class="text-sm">Phone: ${donor.phone}</p>
                        <p class="text-sm">Address: ${donor.address}</p>
                        <p class="text-sm">Status: ${donor.available ? 'Available' : 'Not Available'}</p>
                        <div class="mt-2 space-x-2">
                            ${this.currentUser?.role === 'doctor' ? `
                                <button onclick="emergencyContact('${donor.phone}', '${donor.name}')" class="bg-red-500 text-white px-3 py-1 rounded text-sm">
                                    Emergency Contact
                                </button>
                            ` : ''}
                            <button onclick="contactDonor('${donor.phone}')" class="bg-green-500 text-white px-3 py-1 rounded text-sm">
                                Contact
                            </button>
                        </div>
                    </div>
                `
            });
            
            marker.addListener('click', () => {
                infoWindow.open(this.map, marker);
            });
            
            this.donorMarkers.push(marker);
        });
        
        // Adjust map bounds
        if (filteredDonors.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            filteredDonors.forEach(donor => {
                bounds.extend(donor.location);
            });
            this.map.fitBounds(bounds);
        }
    }

    // Emergency contact for doctors
    emergencyContact(phone, donorName) {
        const urgency = prompt('Emergency Level:\n1. Critical - Immediate\n2. Urgent - Within 1 hour\n3. Priority - Within 3 hours\n\nEnter number (1-3):');
        
        if (urgency && ['1', '2', '3'].includes(urgency)) {
            const urgencyLevels = {
                '1': 'CRITICAL - Immediate response required',
                '2': 'URGENT - Response within 1 hour',
                '3': 'PRIORITY - Response within 3 hours'
            };
            
            // Log emergency request
            const emergencyRequest = {
                id: Date.now(),
                doctorName: this.currentUser?.name || 'Unknown Doctor',
                hospital: this.currentUser?.hospital || 'Unknown Hospital',
                donorName,
                donorPhone: phone,
                urgency: urgencyLevels[urgency],
                urgencyLevel: urgency,
                bloodGroup: document.getElementById('bloodGroup').value || 'Any',
                timestamp: new Date().toISOString(),
                status: 'pending',
                location: this.userLocation
            };
            
            this.emergencyRequests.push(emergencyRequest);
            localStorage.setItem('emergencyRequests', JSON.stringify(this.emergencyRequests));
            
            // Send immediate notification
            this.sendEmergencyNotification(emergencyRequest);
            
            // Auto-call donor
            if (confirm(`Emergency Level ${urgency}: ${urgencyLevels[urgency]}\n\nCall ${donorName} at ${phone} now?`)) {
                window.location.href = `tel:${phone}`;
            }
        }
    }

    // Send emergency notification
    sendEmergencyNotification(request) {
        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Emergency Blood Request', {
                body: `${request.urgency}\nDonor: ${request.donorName}\nBlood Group: ${request.bloodGroup}`,
                icon: '/favicon.ico',
                tag: 'emergency-blood',
                requireInteraction: true
            });
        }
        
        // Show in-app notification
        this.showNotification(`Emergency blood request sent to ${request.donorName}!`, 'error');
        
        // Log the request
        console.log('Emergency blood request:', request);
    }

    // Submit emergency blood request
    submitEmergencyRequest() {
        const request = {
            id: Date.now(),
            patientName: document.getElementById('patientName').value,
            hospital: document.getElementById('hospital').value,
            bloodGroup: document.getElementById('requiredBloodGroup').value,
            contactNumber: document.getElementById('contactNumber').value,
            urgency: document.querySelector('input[name="urgency"]:checked')?.value || 'moderate',
            location: this.userLocation,
            requestedBy: this.currentUser?.name || 'Anonymous',
            timestamp: new Date().toISOString(),
            status: 'active'
        };
        
        if (!request.patientName || !request.hospital || !request.bloodGroup || !request.contactNumber) {
            this.showNotification('Please fill in all required fields', 'warning');
            return;
        }
        
        // Save request
        this.emergencyRequests.push(request);
        localStorage.setItem('emergencyRequests', JSON.stringify(this.emergencyRequests));
        
        // Find and notify nearby donors
        this.notifyNearbyDonors(request);
        
        this.showNotification('Emergency request sent to nearby donors!', 'success');
        
        // Clear form
        document.getElementById('patientName').value = '';
        document.getElementById('hospital').value = '';
        document.getElementById('requiredBloodGroup').value = '';
        document.getElementById('contactNumber').value = '';
        document.querySelector('input[name="urgency"]').checked = false;
    }

    // Notify nearby donors
    notifyNearbyDonors(request) {
        const nearbyDonors = this.donors.filter(donor => {
            const bloodMatch = donor.bloodGroup === request.bloodGroup;
            const distanceMatch = !this.userLocation || 
                this.calculateDistance(this.userLocation, donor.location) <= 20; // 20km radius
            return bloodMatch && distanceMatch && donor.available;
        });
        
        console.log(`Notifying ${nearbyDonors.length} nearby donors for ${request.bloodGroup} blood`);
        
        // In production, this would send push notifications via Firebase Cloud Messaging
        nearbyDonors.forEach(donor => {
            console.log(`Notification sent to ${donor.name} (${donor.phone})`);
        });
        
        return nearbyDonors;
    }

    // Display emergency requests
    displayEmergencyRequests() {
        const container = document.getElementById('emergencyRequestsList');
        if (!container) return;
        
        if (this.emergencyRequests.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-phone-alt text-4xl mb-3"></i>
                    <p>No emergency requests at this time.</p>
                </div>
            `;
            return;
        }
        
        let html = '<div class="space-y-3">';
        this.emergencyRequests.slice(-5).reverse().forEach(request => {
            const statusColor = request.status === 'fulfilled' ? 'green' : 
                             request.status === 'pending' ? 'yellow' : 'red';
            
            html += `
                <div class="border-l-4 border-${statusColor}-500 bg-${statusColor}-50 p-4 rounded-lg">
                    <div class="flex justify-between items-start">
                        <div>
                            <h5 class="font-semibold">Emergency: ${request.patientName}</h5>
                            <p class="text-sm text-gray-600">Hospital: ${request.hospital}</p>
                            <p class="text-sm">Blood Group: ${request.bloodGroup}</p>
                            <p class="text-sm">${request.urgency}</p>
                            <p class="text-xs text-gray-500">Time: ${new Date(request.timestamp).toLocaleString()}</p>
                        </div>
                        <div class="flex items-center">
                            <span class="bg-${statusColor}-100 text-${statusColor}-700 text-xs px-2 py-1 rounded-full">
                                ${request.status.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }

    // Setup real-time updates
    setupRealTimeUpdates() {
        // Check for new emergency requests every 30 seconds
        setInterval(() => {
            const currentRequests = JSON.parse(localStorage.getItem('emergencyRequests') || '[]');
            if (currentRequests.length > this.emergencyRequests.length) {
                this.emergencyRequests = currentRequests;
                this.displayEmergencyRequests();
                this.showNotification('New emergency blood request received!', 'error');
            }
        }, 30000);
    }

    // Setup emergency hotline
    setupEmergencyHotline() {
        // Add emergency hotline button
        const hotlineButton = document.createElement('button');
        hotlineButton.className = 'bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition fixed bottom-4 left-4 z-40 flex items-center shadow-lg';
        hotlineButton.innerHTML = '<i class="fas fa-phone-alt mr-2"></i>Emergency Hotline';
        hotlineButton.onclick = () => {
            if (confirm('Call Emergency Blood Bank Hotline (108)?')) {
                window.location.href = 'tel:108';
            }
        };
        document.body.appendChild(hotlineButton);
    }

    // Utility functions
    calculateDistance(point1, point2) {
        const R = 6371; // Earth's radius in km
        const dLat = (point2.lat - point1.lat) * Math.PI / 180;
        const dLng = (point2.lng - point1.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    contactDonor(phone) {
        if (confirm(`Call ${phone}?`)) {
            window.location.href = `tel:${phone}`;
        }
    }

    showDonorOnMap(lat, lng) {
        if (this.map) {
            this.map.setCenter({ lat, lng });
            this.map.setZoom(15);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        const colors = {
            info: 'bg-blue-500',
            success: 'bg-green-500',
            warning: 'bg-yellow-500',
            error: 'bg-red-500'
        };
        
        notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300`;
        notification.style.transform = 'translateX(100%)';
        notification.innerHTML = `<i class="fas fa-bell mr-2"></i>${message}`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    // Register as donor
    registerAsDonor() {
        const donor = {
            id: Date.now(),
            name: document.getElementById('donorName').value,
            phone: document.getElementById('donorPhone').value,
            email: document.getElementById('donorEmail').value,
            bloodGroup: document.getElementById('donorBloodGroup').value,
            lastDonation: document.getElementById('lastDonation').value,
            address: document.getElementById('donorAddress').value,
            location: this.userLocation || { lat: 28.6139, lng: 77.2090 },
            available: true,
            verified: false,
            responseTime: '15-30 minutes',
            rating: 0,
            registeredAt: new Date().toISOString()
        };
        
        if (!donor.name || !donor.phone || !donor.bloodGroup || !donor.address) {
            this.showNotification('Please fill in all required fields', 'warning');
            return;
        }
        
        // Save donor
        const registeredDonors = JSON.parse(localStorage.getItem('registeredDonors') || '[]');
        registeredDonors.push(donor);
        localStorage.setItem('registeredDonors', JSON.stringify(registeredDonors));
        
        // Add to current donors list
        this.donors.push(donor);
        
        this.closeDonorModal();
        this.displayDonors();
        this.showNotification('Successfully registered as blood donor!', 'success');
    }

    closeDonorModal() {
        document.getElementById('donorModal').classList.add('hidden');
        
        // Clear form
        document.getElementById('donorName').value = '';
        document.getElementById('donorPhone').value = '';
        document.getElementById('donorEmail').value = '';
        document.getElementById('donorBloodGroup').value = '';
        document.getElementById('lastDonation').value = '';
        document.getElementById('donorAddress').value = '';
    }
}

// Initialize Blood Donor Emergency System
let bloodDonorSystem;

document.addEventListener('DOMContentLoaded', function() {
    bloodDonorSystem = new BloodDonorEmergencySystem();
});

// Export for global access
window.bloodDonorSystem = bloodDonorSystem;
window.emergencyContact = (phone, name) => bloodDonorSystem.emergencyContact(phone, name);
window.contactDonor = (phone) => bloodDonorSystem.contactDonor(phone);
window.showDonorOnMap = (lat, lng) => bloodDonorSystem.showDonorOnMap(lat, lng);
window.registerAsDonor = () => bloodDonorSystem.registerAsDonor();
window.closeDonorModal = () => bloodDonorSystem.closeDonorModal();
window.submitEmergencyRequest = () => bloodDonorSystem.submitEmergencyRequest();
