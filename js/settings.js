class SettingsManager {
    constructor() {
        this.initializeSettings();
        this.addEventListeners();
    }

    initializeSettings() {
        // Load saved settings from localStorage
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            this.populateSettings(settings);
            UserManager.updateNavbarName();
        }
    }

    populateSettings(settings) {
        // Populate form fields with saved settings
        if (settings.name) document.getElementById('userName').value = settings.name;
        if (settings.email) document.getElementById('userEmail').value = settings.email;
        
        // Set notification toggles
        const reminderToggle = document.querySelector('input[type="checkbox"]');
        if (settings.reminderNotifications !== undefined) {
            reminderToggle.checked = settings.reminderNotifications;
        }

        // Set currency and date format
        if (settings.currency) {
            document.querySelector('.currency-select').value = settings.currency;
        }
        if (settings.dateFormat) {
            document.querySelector('.date-format-select').value = settings.dateFormat;
        }
    }

    addEventListeners() {
        // Save Button
        const saveBtn = document.querySelector('.save-btn');
        saveBtn.addEventListener('click', () => this.saveSettings());

        // Export Data
        const exportBtn = document.querySelector('.export-btn');
        exportBtn.addEventListener('click', () => this.exportData());

        // Clear Data
        const clearDataBtn = document.querySelector('.clear-data-btn');
        clearDataBtn.addEventListener('click', () => this.clearData());

        // Change Avatar
        const changeAvatarBtn = document.querySelector('.change-avatar-btn');
        changeAvatarBtn.addEventListener('click', () => this.changeAvatar());
    }

    saveSettings() {
        const settings = {
            name: document.getElementById('userName').value,
            email: document.getElementById('userEmail').value,
            reminderNotifications: document.querySelector('input[type="checkbox"]').checked,
            currency: document.querySelector('.currency-select').value,
            dateFormat: document.querySelector('.date-format-select').value
        };

        // Save to localStorage
        localStorage.setItem('userSettings', JSON.stringify(settings));
        
        // Update navbar name using shared functionality
        UserManager.updateNavbarName();
        
        this.showNotification('Settings saved successfully!');
    }

    exportData() {
        // Collect data from localStorage
        const data = {
            reminders: JSON.parse(localStorage.getItem('reminders') || '[]'),
            notes: JSON.parse(localStorage.getItem('notes') || '[]'),
            expenses: JSON.parse(localStorage.getItem('expenses') || '[]')
        };

        // Convert to CSV or JSON
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = 'budget-buddy-data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    clearData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            localStorage.clear();
            this.showNotification('All data has been cleared.');
            setTimeout(() => window.location.reload(), 2000);
        }
    }

    changeAvatar() {
        // Placeholder for avatar change functionality
        alert('Avatar change functionality will be implemented soon!');
    }

    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear all stored data
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userSettings');
        
        // Redirect to login page
        window.location.href = 'index.html';
    }
}

// Initialize Settings Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
}); 