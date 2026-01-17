// Enhanced ASHA Dashboard with Maternal Sync and Real-time Monitoring
class ASHAMaternalSync {
    constructor() {
        this.currentASHA = null;
        this.highRiskCases = [];
        this.upcomingCheckups = [];
        this.immunizationSchedules = [];
        this.notificationInterval = null;
        this.initializeASHA();
    }

    initializeASHA() {
        // Load current ASHA user
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentASHA = JSON.parse(userData);
        }

        // Initialize monitoring systems
        this.loadHighRiskCases();
        this.loadUpcomingCheckups();
        this.loadImmunizationSchedules();
        this.startRealTimeMonitoring();
        this.setupNotificationSystem();
    }

    // Load high-risk maternal cases from pregnant dashboard data
    loadHighRiskCases() {
        const pregnantData = JSON.parse(localStorage.getItem('maternalHealthRecords') || '[]');
        this.highRiskCases = pregnantData.filter(record => {
            return record.riskLevel === 'high' || 
                   record.riskFactors?.includes('hypertension') ||
                   record.riskFactors?.includes('diabetes') ||
                   record.riskFactors?.includes('previous_c_section');
        });

        this.displayHighRiskCases();
    }

    // Load upcoming prenatal checkups
    loadUpcomingCheckups() {
        const checkups = JSON.parse(localStorage.getItem('prenatalCheckups') || '[]');
        const today = new Date();
        
        this.upcomingCheckups = checkups.filter(checkup => {
            const checkupDate = new Date(checkup.date);
            const daysUntil = Math.ceil((checkupDate - today) / (1000 * 60 * 60 * 24));
            return daysUntil >= 0 && daysUntil <= 7; // Next 7 days
        });

        this.displayUpcomingCheckups();
    }

    // Load government immunization schedules
    loadImmunizationSchedules() {
        const schedules = [
            {
                name: 'BCG Vaccine',
                targetAge: 'At birth',
                description: 'Tuberculosis prevention',
                priority: 'high',
                dueDate: this.calculateDueDate('birth')
            },
            {
                name: 'Hepatitis B - Birth Dose',
                targetAge: 'At birth',
                description: 'Hepatitis B prevention',
                priority: 'high',
                dueDate: this.calculateDueDate('birth')
            },
            {
                name: 'OPV - Polio',
                targetAge: '6 weeks',
                description: 'Polio prevention',
                priority: 'high',
                dueDate: this.calculateDueDate('6_weeks')
            },
            {
                name: 'DPT Vaccine',
                targetAge: '6 weeks',
                description: 'Diphtheria, Pertussis, Tetanus',
                priority: 'high',
                dueDate: this.calculateDueDate('6_weeks')
            },
            {
                name: 'Measles Vaccine',
                targetAge: '9 months',
                description: 'Measles prevention',
                priority: 'medium',
                dueDate: this.calculateDueDate('9_months')
            }
        ];

        this.immunizationSchedules = schedules;
        this.displayImmunizationSchedules();
    }

    // Calculate due dates based on child's birth
    calculateDueDate(ageMilestone) {
        const today = new Date();
        const birthRecords = JSON.parse(localStorage.getItem('birthRecords') || '[]');
        
        if (birthRecords.length > 0) {
            const lastBirth = new Date(birthRecords[birthRecords.length - 1].date);
            
            switch(ageMilestone) {
                case 'birth':
                    return lastBirth.toISOString().split('T')[0];
                case '6_weeks':
                    return new Date(lastBirth.getTime() + 42 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                case '9_months':
                    return new Date(lastBirth.getTime() + 273 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                default:
                    return today.toISOString().split('T')[0];
            }
        }
        
        return today.toISOString().split('T')[0];
    }

    // Display high-risk cases
    displayHighRiskCases() {
        const container = document.getElementById('highRiskCases');
        if (!container) return;

        if (this.highRiskCases.length === 0) {
            container.innerHTML = `
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div class="flex items-center">
                        <i class="fas fa-check-circle text-green-500 text-2xl mr-3"></i>
                        <div>
                            <h4 class="font-semibold text-green-700">No High-Risk Cases</h4>
                            <p class="text-sm text-green-600">All maternal cases are currently stable</p>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        let html = '<div class="space-y-3">';
        this.highRiskCases.forEach(case_ => {
            const urgencyClass = case_.riskLevel === 'high' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50';
            const urgencyIcon = case_.riskLevel === 'high' ? 'fa-exclamation-triangle text-red-500' : 'fa-exclamation-circle text-yellow-500';
            
            html += `
                <div class="border-l-4 ${urgencyClass} p-4 rounded-lg">
                    <div class="flex justify-between items-start">
                        <div>
                            <h5 class="font-semibold">${case_.patientName}</h5>
                            <p class="text-sm text-gray-600">Gestation: ${case_.gestationalAge || 'N/A'}</p>
                            <p class="text-sm">Risk Factors: ${case_.riskFactors?.join(', ') || 'N/A'}</p>
                        </div>
                        <div class="flex items-center">
                            <i class="fas ${urgencyIcon} text-xl mr-2"></i>
                            <button onclick="contactPatient('${case_.patientPhone}')" class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                                <i class="fas fa-phone mr-1"></i>Contact
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }

    // Display upcoming checkups
    displayUpcomingCheckups() {
        const container = document.getElementById('upcomingCheckups');
        if (!container) return;

        if (this.upcomingCheckups.length === 0) {
            container.innerHTML = `
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="flex items-center">
                        <i class="fas fa-calendar-check text-blue-500 text-2xl mr-3"></i>
                        <div>
                            <h4 class="font-semibold text-blue-700">No Upcoming Checkups</h4>
                            <p class="text-sm text-blue-600">Next 7 days are clear</p>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        let html = '<div class="space-y-3">';
        this.upcomingCheckups.forEach(checkup => {
            const daysUntil = Math.ceil((new Date(checkup.date) - new Date()) / (1000 * 60 * 60 * 24));
            const urgencyClass = daysUntil <= 2 ? 'border-red-500 bg-red-50' : 'border-blue-500 bg-blue-50';
            
            html += `
                <div class="border-l-4 ${urgencyClass} p-4 rounded-lg">
                    <div class="flex justify-between items-start">
                        <div>
                            <h5 class="font-semibold">${checkup.patientName}</h5>
                            <p class="text-sm text-gray-600">Date: ${new Date(checkup.date).toLocaleDateString()}</p>
                            <p class="text-sm">Type: ${checkup.type}</p>
                            <p class="text-sm font-medium">In ${daysUntil} day${daysUntil > 1 ? 's' : ''}</p>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="confirmCheckup('${checkup.id}')" class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
                                <i class="fas fa-check mr-1"></i>Confirm
                            </button>
                            <button onclick="rescheduleCheckup('${checkup.id}')" class="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600">
                                <i class="fas fa-calendar mr-1"></i>Reschedule
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }

    // Display immunization schedules
    displayImmunizationSchedules() {
        const container = document.getElementById('immunizationSchedules');
        if (!container) return;

        let html = '<div class="space-y-3">';
        this.immunizationSchedules.forEach(schedule => {
            const priorityClass = schedule.priority === 'high' ? 'border-red-500 bg-red-50' : 'border-blue-500 bg-blue-50';
            const priorityIcon = schedule.priority === 'high' ? 'fa-exclamation-triangle text-red-500' : 'fa-info-circle text-blue-500';
            
            html += `
                <div class="border-l-4 ${priorityClass} p-4 rounded-lg hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-start">
                        <div>
                            <h5 class="font-semibold">${schedule.name}</h5>
                            <p class="text-sm text-gray-600">Target Age: ${schedule.targetAge}</p>
                            <p class="text-sm">${schedule.description}</p>
                            <p class="text-sm font-medium">Due: ${schedule.dueDate}</p>
                        </div>
                        <div class="flex items-center">
                            <i class="fas ${priorityIcon} text-xl mr-2"></i>
                            <button onclick="markImmunization('${schedule.name}')" class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
                                <i class="fas fa-check mr-1"></i>Mark Done
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }

    // Start real-time monitoring
    startRealTimeMonitoring() {
        // Check for updates every 30 seconds
        this.notificationInterval = setInterval(() => {
            this.checkForUpdates();
        }, 30000);
    }

    // Check for new updates
    checkForUpdates() {
        const previousHighRiskCount = this.highRiskCases.length;
        const previousCheckupCount = this.upcomingCheckups.length;

        // Reload data
        this.loadHighRiskCases();
        this.loadUpcomingCheckups();

        // Check for new high-risk cases
        if (this.highRiskCases.length > previousHighRiskCount) {
            this.showNotification('New high-risk maternal case detected!', 'warning');
        }

        // Check for new upcoming checkups
        if (this.upcomingCheckups.length > previousCheckupCount) {
            this.showNotification('New prenatal checkup scheduled!', 'info');
        }
    }

    // Setup notification system
    setupNotificationSystem() {
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // Check for urgent cases every 5 minutes
        setInterval(() => {
            this.checkUrgentCases();
        }, 300000);
    }

    // Check for urgent cases
    checkUrgentCases() {
        const today = new Date();
        
        // Check for checkups due today or tomorrow
        const urgentCheckups = this.upcomingCheckups.filter(checkup => {
            const daysUntil = Math.ceil((new Date(checkup.date) - today) / (1000 * 60 * 60 * 24));
            return daysUntil <= 1;
        });

        if (urgentCheckups.length > 0) {
            this.showBrowserNotification('Urgent: Prenatal Checkup Due', 
                `${urgentCheckups.length} checkup(s) scheduled in the next 24 hours.`);
        }

        // Check for overdue immunizations
        const overdueImmunizations = this.immunizationSchedules.filter(schedule => {
            const dueDate = new Date(schedule.dueDate);
            return dueDate < today;
        });

        if (overdueImmunizations.length > 0) {
            this.showBrowserNotification('Overdue Immunizations', 
                `${overdueImmunizations.length} immunization(s) are overdue.`);
        }
    }

    // Show browser notification
    showBrowserNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: '/favicon.ico',
                tag: 'asha-notification'
            });
        }
    }

    // Show in-app notification
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

    // Contact patient
    contactPatient(phone) {
        if (confirm(`Call ${phone}?`)) {
            window.location.href = `tel:${phone}`;
        }
    }

    // Confirm checkup
    confirmCheckup(checkupId) {
        const checkups = JSON.parse(localStorage.getItem('prenatalCheckups') || '[]');
        const checkup = checkups.find(c => c.id === checkupId);
        
        if (checkup) {
            checkup.status = 'confirmed';
            checkup.confirmedBy = this.currentASHA.name;
            checkup.confirmedAt = new Date().toISOString();
            
            localStorage.setItem('prenatalCheckups', JSON.stringify(checkups));
            this.showNotification('Checkup confirmed successfully!', 'success');
            this.loadUpcomingCheckups();
        }
    }

    // Reschedule checkup
    rescheduleCheckup(checkupId) {
        const newDate = prompt('Enter new date (YYYY-MM-DD):');
        if (newDate) {
            const checkups = JSON.parse(localStorage.getItem('prenatalCheckups') || '[]');
            const checkup = checkups.find(c => c.id === checkupId);
            
            if (checkup) {
                checkup.date = newDate;
                checkup.status = 'rescheduled';
                checkup.rescheduledBy = this.currentASHA.name;
                checkup.rescheduledAt = new Date().toISOString();
                
                localStorage.setItem('prenatalCheckups', JSON.stringify(checkups));
                this.showNotification('Checkup rescheduled successfully!', 'success');
                this.loadUpcomingCheckups();
            }
        }
    }

    // Mark immunization as complete
    markImmunization(vaccineName) {
        const completed = JSON.parse(localStorage.getItem('completedImmunizations') || '[]');
        
        completed.push({
            vaccineName,
            completedBy: this.currentASHA.name,
            completedAt: new Date().toISOString(),
            village: this.currentASHA.assignedVillages[0] || 'Unknown'
        });
        
        localStorage.setItem('completedImmunizations', JSON.stringify(completed));
        this.showNotification(`${vaccineName} marked as completed!`, 'success');
        
        // Remove from active schedules
        this.immunizationSchedules = this.immunizationSchedules.filter(s => s.name !== vaccineName);
        this.displayImmunizationSchedules();
    }

    // Generate daily report
    generateDailyReport() {
        const report = {
            date: new Date().toISOString().split('T')[0],
            ashaName: this.currentASHA.name,
            highRiskCases: this.highRiskCases.length,
            upcomingCheckups: this.upcomingCheckups.length,
            completedImmunizations: JSON.parse(localStorage.getItem('completedImmunizations') || '[]').filter(i => 
                new Date(i.completedAt).toDateString() === new Date().toDateString()
            ).length,
            villagesCovered: this.currentASHA.assignedVillages
        };

        // Save report
        const reports = JSON.parse(localStorage.getItem('ashaDailyReports') || '[]');
        reports.push(report);
        localStorage.setItem('ashaDailyReports', JSON.stringify(reports));

        this.showNotification('Daily report generated!', 'success');
        return report;
    }

    // Sync with pregnant dashboard
    syncWithPregnantDashboard() {
        // This would normally sync with a server
        // For demo, we'll just refresh local data
        this.loadHighRiskCases();
        this.loadUpcomingCheckups();
        this.showNotification('Synced with maternal health data!', 'success');
    }

    // Cleanup
    destroy() {
        if (this.notificationInterval) {
            clearInterval(this.notificationInterval);
        }
    }
}

// Initialize ASHA Maternal Sync
let ashaMaternalSync;

document.addEventListener('DOMContentLoaded', function() {
    ashaMaternalSync = new ASHAMaternalSync();
    
    // Add sync button to ASHA dashboard if not exists
    const syncButton = document.createElement('button');
    syncButton.className = 'bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition fixed bottom-4 right-4 z-40';
    syncButton.innerHTML = '<i class="fas fa-sync mr-2"></i>Sync Data';
    syncButton.onclick = () => ashaMaternalSync.syncWithPregnantDashboard();
    document.body.appendChild(syncButton);
});

// Export for global access
window.ashaMaternalSync = ashaMaternalSync;
window.contactPatient = (phone) => ashaMaternalSync.contactPatient(phone);
window.confirmCheckup = (id) => ashaMaternalSync.confirmCheckup(id);
window.rescheduleCheckup = (id) => ashaMaternalSync.rescheduleCheckup(id);
window.markImmunization = (name) => ashaMaternalSync.markImmunization(name);
