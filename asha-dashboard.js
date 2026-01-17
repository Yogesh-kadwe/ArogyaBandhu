// ASHA Worker Dashboard JavaScript
let currentASHA = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadASHAData();
    loadVaccinationRecords();
    loadSurveyRecords();
    initializeCharts();
});

function loadASHAData() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        currentASHA = JSON.parse(userData);
        document.getElementById('userName').textContent = currentASHA.name;
    }
}

// Navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.remove('hidden');
}

// Vaccination Management
function loadVaccinationRecords() {
    const vaccinations = JSON.parse(localStorage.getItem('ashaVaccinations') || '[]');
    const vaccinationList = document.getElementById('vaccinationList');
    
    if (vaccinations.length === 0) {
        vaccinationList.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-syringe text-4xl mb-3"></i>
                <p>No vaccination records found.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    vaccinations.forEach(vaccination => {
        html += `
            <div class="border rounded-lg p-4 hover:shadow-md transition">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-semibold">${vaccination.childName}</h4>
                        <p class="text-sm text-gray-600">Parent: ${vaccination.parentName}</p>
                        <p class="text-sm">Vaccine: ${vaccination.vaccineType.toUpperCase()}</p>
                        <p class="text-sm">Date: ${vaccination.date}</p>
                        <p class="text-sm">Location: ${vaccination.location}</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="viewVaccination(${vaccination.id})" class="text-blue-500 hover:text-blue-700">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="editVaccination(${vaccination.id})" class="text-green-500 hover:text-green-700">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    vaccinationList.innerHTML = html;
}

function addVaccination() {
    document.getElementById('vaccinationModal').classList.remove('hidden');
}

function saveVaccination() {
    const vaccination = {
        id: Date.now(),
        childName: document.getElementById('childName').value,
        parentName: document.getElementById('parentName').value,
        date: document.getElementById('vaccinationDate').value,
        vaccineType: document.getElementById('vaccineType').value,
        location: document.getElementById('vaccinationLocation').value,
        ashaId: currentASHA.id,
        createdAt: new Date().toISOString()
    };
    
    if (!vaccination.childName || !vaccination.parentName || !vaccination.date || !vaccination.vaccineType) {
        alert('Please fill in all required fields');
        return;
    }
    
    let vaccinations = JSON.parse(localStorage.getItem('ashaVaccinations') || '[]');
    vaccinations.push(vaccination);
    localStorage.setItem('ashaVaccinations', JSON.stringify(vaccinations));
    
    closeVaccinationModal();
    loadVaccinationRecords();
    showNotification('Vaccination recorded successfully!');
}

function closeVaccinationModal() {
    document.getElementById('vaccinationModal').classList.add('hidden');
    
    // Clear form
    document.getElementById('childName').value = '';
    document.getElementById('parentName').value = '';
    document.getElementById('vaccinationDate').value = '';
    document.getElementById('vaccineType').value = '';
    document.getElementById('vaccinationLocation').value = '';
}

function viewVaccination(id) {
    showNotification(`Viewing vaccination record ID: ${id}`);
}

function editVaccination(id) {
    showNotification(`Edit vaccination functionality for ID: ${id}`);
}

// Survey Management
function loadSurveyRecords() {
    const surveys = JSON.parse(localStorage.getItem('ashaSurveys') || '[]');
    const surveysList = document.getElementById('surveysList');
    
    if (surveys.length === 0) {
        surveysList.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-clipboard-list text-4xl mb-3"></i>
                <p>No survey records found.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    surveys.forEach(survey => {
        const statusColor = survey.status === 'completed' ? 'green' : 
                         survey.status === 'in-progress' ? 'yellow' : 'blue';
        
        html += `
            <div class="border rounded-lg p-4 hover:shadow-md transition">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-semibold">${survey.type} Survey</h4>
                        <p class="text-sm text-gray-600">Family: ${survey.familyName}</p>
                        <p class="text-sm">Date: ${survey.date}</p>
                        <p class="text-sm">Members: ${survey.familyMembers}</p>
                        <span class="inline-block px-2 py-1 bg-${statusColor}-100 text-${statusColor}-700 text-xs rounded-full mt-2">
                            ${survey.status}
                        </span>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="viewSurvey(${survey.id})" class="text-blue-500 hover:text-blue-700">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="editSurvey(${survey.id})" class="text-green-500 hover:text-green-700">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    surveysList.innerHTML = html;
}

function startSurvey(type) {
    const survey = {
        id: Date.now(),
        type: type,
        familyName: prompt('Enter family name:'),
        familyMembers: prompt('Enter number of family members:'),
        date: new Date().toLocaleDateString(),
        status: 'in-progress',
        ashaId: currentASHA.id,
        createdAt: new Date().toISOString()
    };
    
    if (survey.familyName && survey.familyMembers) {
        let surveys = JSON.parse(localStorage.getItem('ashaSurveys') || '[]');
        surveys.push(survey);
        localStorage.setItem('ashaSurveys', JSON.stringify(surveys));
        
        loadSurveyRecords();
        showNotification(`${type} survey started successfully!`);
    }
}

function createSurvey() {
    showNotification('Create survey functionality would be implemented here');
}

function viewSurvey(id) {
    showNotification(`Viewing survey ID: ${id}`);
}

function editSurvey(id) {
    showNotification(`Edit survey functionality for ID: ${id}`);
}

// Awareness Activities
function planAwareness() {
    const activity = {
        id: Date.now(),
        title: prompt('Enter activity title:'),
        date: prompt('Enter date:'),
        location: prompt('Enter location:'),
        topic: prompt('Enter topic:'),
        status: 'planned',
        ashaId: currentASHA.id,
        createdAt: new Date().toISOString()
    };
    
    if (activity.title && activity.date && activity.location) {
        let activities = JSON.parse(localStorage.getItem('ashaActivities') || '[]');
        activities.push(activity);
        localStorage.setItem('ashaActivities', JSON.stringify(activities));
        
        showNotification('Awareness activity planned successfully!');
    }
}

function shareAwareness(topic) {
    const messages = {
        handwashing: 'Remember to wash hands with soap for 20 seconds to prevent diseases!',
        nutrition: 'Eat balanced meals with fruits and vegetables for good health!',
        family: 'Plan your family for better health and prosperity!',
        immunization: 'Vaccinate your children on time for a healthy future!'
    };
    
    const message = messages[topic];
    
    // Share functionality
    if (navigator.share) {
        navigator.share({
            title: 'Health Awareness',
            text: message
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(message);
        showNotification('Message copied to clipboard!');
    }
}

// Analytics Charts
function initializeCharts() {
    // Activities Chart
    const activitiesCtx = document.getElementById('activitiesChart');
    if (activitiesCtx) {
        new Chart(activitiesCtx, {
            type: 'bar',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Home Visits',
                    data: [45, 52, 38, 65],
                    backgroundColor: 'rgba(20, 184, 166, 0.8)'
                }, {
                    label: 'Vaccinations',
                    data: [12, 19, 15, 23],
                    backgroundColor: 'rgba(34, 197, 94, 0.8)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
    
    // Health Indicators Chart
    const healthCtx = document.getElementById('healthChart');
    if (healthCtx) {
        new Chart(healthCtx, {
            type: 'doughnut',
            data: {
                labels: ['Healthy', 'At Risk', 'Need Attention'],
                datasets: [{
                    data: [65, 25, 10],
                    backgroundColor: [
                        'rgb(34, 197, 94)',
                        'rgb(251, 146, 60)',
                        'rgb(239, 68, 68)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

// Utility Functions
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-teal-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.innerHTML = `<i class="fas fa-check-circle mr-2"></i>${message}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
