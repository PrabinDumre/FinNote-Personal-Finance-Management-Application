// Utility functions for shared functionality
class UserManager {
    static getUserName() {
        const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
        return settings.name || 'Buddy'; // Default name if none set
    }

    static setUserName(newName) {
        const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
        settings.name = newName;
        localStorage.setItem('userSettings', JSON.stringify(settings));
        this.updateSidebarName();
    }

    static updateSidebarName() {
        const sidebarName = document.getElementById('sidebar-username');
        if (sidebarName) {
            const name = this.getUserName();
            sidebarName.textContent = name;
            // Ensure the comma is always present after the name
            const parent = sidebarName.parentElement;
            if (parent && parent.tagName === 'P') {
                // Remove any trailing commas
                parent.innerHTML = `Hi, <span id="sidebar-username">${name}</span>,`;
            }
        }
    }

    static updateNavbarName() {
        const navbarName = document.querySelector('.side-navbar .welcome-text h3');
        if (navbarName) {
            navbarName.textContent = this.getUserName();
        }
    }
}

// On every page load, update the sidebar username
window.addEventListener('DOMContentLoaded', () => {
    UserManager.updateSidebarName();
});

// Export for use in settings.html
window.updateSidebarUsername = (newName) => UserManager.setUserName(newName);

// Add this to every page to update the navbar name
document.addEventListener('DOMContentLoaded', () => {
    UserManager.updateNavbarName();
}); 