class ReminderManager {
    constructor() {
        this.reminders = this.loadReminders();
        this.initializeEventListeners();
        this.renderReminders();
        this.checkForDueReminders();
        this.setupNotificationPermission();
    }

    setupNotificationPermission() {
        if ('Notification' in window) {
            if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        }
    }

    loadReminders() {
        const stored = localStorage.getItem('reminders');
        return stored ? JSON.parse(stored) : [];
    }

    saveReminders() {
        localStorage.setItem('reminders', JSON.stringify(this.reminders));
    }

    initializeEventListeners() {
        // Add Reminder Button
        const addBtn = document.querySelector('.add-reminder-btn');
        const modal = document.getElementById('addReminderModal');
        const closeBtn = modal.querySelector('.close-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const addReminderForm = document.getElementById('addReminderForm');

        addBtn.addEventListener('click', () => modal.classList.add('show'));
        closeBtn.addEventListener('click', () => modal.classList.remove('show'));
        cancelBtn.addEventListener('click', () => modal.classList.remove('show'));

        // Form Submission
        addReminderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const reminder = {
                id: Date.now(),
                title: document.getElementById('reminderTitle').value,
                type: document.getElementById('reminderType').value,
                date: document.getElementById('reminderDate').value,
                amount: document.getElementById('reminderAmount').value || null,
                description: document.getElementById('reminderDescription').value,
                priority: document.getElementById('reminderPriority').value,
                completed: false,
                starred: false
            };
            
            this.addReminder(reminder);
            modal.classList.remove('show');
            addReminderForm.reset();
            window.location.href = 'reminders.html'; // Redirect to reminders page
        });

        // Category Filters
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelector('.category-btn.active').classList.remove('active');
                btn.classList.add('active');
                this.filterReminders(btn.textContent);
            });
        });

        // Search Functionality
        const searchInput = document.getElementById('searchReminders');
        searchInput.addEventListener('input', () => {
            this.searchReminders(searchInput.value);
        });

        // Filter Buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelector('.filter-btn.active').classList.remove('active');
                btn.classList.add('active');
                this.filterReminders(btn.dataset.filter);
            });
        });

        // Update menu toggle functionality
        document.addEventListener('click', (e) => {
            // Close all menus when clicking outside
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.classList.remove('show');
                });
            }
            
            // Handle menu button click
            if (e.target.matches('.menu-btn')) {
                e.stopPropagation();
                const reminderId = e.target.dataset.id;
                const menu = document.getElementById(`menu-${reminderId}`);
                
                // Close other open menus
                document.querySelectorAll('.dropdown-menu.show').forEach(m => {
                    if (m !== menu) m.classList.remove('show');
                });
                
                menu.classList.toggle('show');
            }

            // Handle menu item clicks
            if (e.target.closest('.edit-btn')) {
                const reminderId = parseInt(e.target.closest('.edit-btn').dataset.id);
                this.editReminder(reminderId);
                document.getElementById(`menu-${reminderId}`).classList.remove('show');
            }

            if (e.target.closest('.pin-btn')) {  // Changed from star-btn to pin-btn
                const reminderId = parseInt(e.target.closest('.pin-btn').dataset.id);
                this.toggleStar(reminderId);
                document.getElementById(`menu-${reminderId}`).classList.remove('show');
            }

            if (e.target.closest('.delete-btn')) {
                const reminderId = parseInt(e.target.closest('.delete-btn').dataset.id);
                if (confirm('Are you sure you want to delete this reminder?')) {
                    this.deleteReminder(reminderId);
                }
                document.getElementById(`menu-${reminderId}`).classList.remove('show');
            }
        });
    }

    addReminder(reminder) {
        reminder.enableNotification = document.getElementById('enableNotification').checked;
        // Add new reminders at the beginning of the array
        if (reminder.starred) {
            // If reminder is starred, add it at the beginning of starred reminders
            const starredReminders = this.reminders.filter(r => r.starred);
            const unstarredReminders = this.reminders.filter(r => !r.starred);
            this.reminders = [reminder, ...starredReminders, ...unstarredReminders];
        } else {
            // If not starred, add after starred reminders
            const starredReminders = this.reminders.filter(r => r.starred);
            const unstarredReminders = this.reminders.filter(r => !r.starred);
            this.reminders = [...starredReminders, reminder, ...unstarredReminders];
        }
        this.saveReminders();
        this.renderReminders();
        if (reminder.enableNotification) {
            this.scheduleNotification(reminder);
        }
    }

    renderReminders() {
        const remindersGrid = document.getElementById('remindersGrid');
        const activeCategory = document.querySelector('.category-btn.active').textContent;
        
        const filteredReminders = this.filterRemindersByCategory(activeCategory);

        remindersGrid.innerHTML = filteredReminders.map(reminder => this.createReminderCard(reminder)).join('');
    }

    filterRemindersByCategory(category) {
        if (category === 'All') return this.reminders;
        if (category === 'Today') {
            const today = new Date().toDateString();
            return this.reminders.filter(reminder => 
                new Date(reminder.date).toDateString() === today);
        }
        if (category === 'Upcoming') {
            const now = new Date();
            return this.reminders.filter(reminder => 
                new Date(reminder.date) > now && !reminder.completed);
        }
        if (category === 'Completed') {
            return this.reminders.filter(reminder => reminder.completed);
        }
        return this.reminders;
    }

    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getReminderStatus(reminder) {
        if (reminder.completed) return 'completed';
        const now = new Date();
        const reminderDate = new Date(reminder.date);
        return reminderDate < now ? 'overdue' : 'upcoming';
    }

    getStatusText(reminder) {
        if (reminder.completed) return '✅ Completed';
        const now = new Date();
        const reminderDate = new Date(reminder.date);
        return reminderDate < now ? '⚠️ Overdue' : '⏳ Upcoming';
    }

    scheduleNotification(reminder) {
        if (!reminder.enableNotification) return;

        const reminderDate = new Date(reminder.date);
        const now = new Date();
        
        if (reminderDate > now) {
            const timeUntilReminder = reminderDate - now;
            setTimeout(() => {
                if (!reminder.completed) {
                    this.showNotification(reminder);
                }
            }, timeUntilReminder);

            // Also schedule a notification 1 hour before
            const oneHourBefore = reminderDate - (60 * 60 * 1000);
            if (oneHourBefore > now) {
                setTimeout(() => {
                    if (!reminder.completed) {
                        this.showNotification(reminder, true);
                    }
                }, oneHourBefore - now);
            }
        }
    }

    showNotification(reminder, isPreNotification = false) {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;

        const title = isPreNotification ? 
            `Upcoming Reminder in 1 hour: ${reminder.title}` :
            `Reminder: ${reminder.title}`;

        const options = {
            body: `${reminder.description}\n${reminder.amount ? `Amount: ₹${reminder.amount}` : ''}`,
            icon: '/path/to/icon.png',
            badge: '/path/to/badge.png',
            tag: `reminder-${reminder.id}`,
            renotify: true,
            requireInteraction: true
        };

        const notification = new Notification(title, options);
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }

    checkForDueReminders() {
        setInterval(() => {
            const now = new Date();
            this.reminders.forEach(reminder => {
                const reminderDate = new Date(reminder.date);
                if (!reminder.completed && reminderDate <= now && !reminder.notified) {
                    this.showNotification(reminder);
                    reminder.notified = true;
                    this.saveReminders();
                }
            });
        }, 60000); // Check every minute
    }

    showRemindersForDate(date) {
        const dateReminders = this.reminders.filter(reminder => {
            const reminderDate = new Date(reminder.date);
            return reminderDate.toDateString() === date.toDateString();
        });

        const remindersList = document.getElementById('remindersList');
        if (dateReminders.length === 0) {
            remindersList.innerHTML = `
                <div class="no-reminders">
                    No reminders for ${date.toLocaleDateString()}
                </div>
            `;
            return;
        }

        this.renderRemindersList(dateReminders);
    }

    renderRemindersList(reminders) {
        const remindersList = document.getElementById('remindersList');
        remindersList.innerHTML = reminders.map(reminder => this.createReminderCard(reminder)).join('');
    }

    createReminderCard(reminder) {
        const status = this.getReminderStatus(reminder);
        return `
            <div class="reminder-card ${status} ${reminder.priority}-priority ${reminder.starred ? 'starred' : ''}">
                <div class="card-header">
                    <div class="title-section">
                        <h3>${reminder.title}</h3>
                        <span class="type-badge">${reminder.type}</span>
                    </div>
                    <div class="dropdown">
                        <button class="menu-btn" data-id="${reminder.id}">⋮</button>
                        <div class="dropdown-menu" id="menu-${reminder.id}">
                            <button class="menu-item edit-btn" data-id="${reminder.id}">
                                <span class="icon">✏️</span> Edit
                            </button>
                            <button class="menu-item pin-btn" data-id="${reminder.id}">
                                <span class="icon">⭐</span> ${reminder.starred ? 'Unpin' : 'Pin'}
                            </button>
                            <button class="menu-item delete-btn" data-id="${reminder.id}">
                                <span class="icon">🗑️</span> Delete
                            </button>
                        </div>
                    </div>
                </div>
                ${reminder.amount ? `<div class="amount">₹${reminder.amount}</div>` : ''}
                <div class="date-time">${this.formatDateTime(reminder.date)}</div>
                <p>${reminder.description}</p>
                <div class="status ${status}">
                    ${this.getStatusText(reminder)}
                </div>
            </div>
        `;
    }

    filterReminders(filter) {
        let filteredReminders;
        const now = new Date();

        switch(filter) {
            case 'today':
                filteredReminders = this.reminders.filter(reminder => 
                    new Date(reminder.date).toDateString() === now.toDateString());
                break;
            case 'upcoming':
                filteredReminders = this.reminders.filter(reminder => 
                    new Date(reminder.date) > now && !reminder.completed);
                break;
            case 'completed':
                filteredReminders = this.reminders.filter(reminder => reminder.completed);
                break;
            default:
                filteredReminders = this.reminders;
        }

        this.renderRemindersList(filteredReminders);
    }

    toggleStar(id) {
        const reminder = this.reminders.find(r => r.id === id);
        if (reminder) {
            reminder.starred = !reminder.starred;
            this.saveReminders();
            this.renderReminders();
        }
    }

    editReminder(id) {
        const reminder = this.reminders.find(r => r.id === id);
        if (!reminder) return;

        const modal = document.getElementById('addReminderModal');
        const form = document.getElementById('addReminderForm');
        
        // Fill form with reminder data
        document.getElementById('reminderTitle').value = reminder.title;
        document.getElementById('reminderType').value = reminder.type;
        document.getElementById('reminderDate').value = reminder.date;
        document.getElementById('reminderAmount').value = reminder.amount || '';
        document.getElementById('reminderDescription').value = reminder.description;
        document.getElementById('reminderPriority').value = reminder.priority;
        
        modal.querySelector('h2').textContent = 'Edit Reminder';
        modal.classList.add('show');

        // Update form submission handler
        const submitHandler = (e) => {
            e.preventDefault();
            reminder.title = document.getElementById('reminderTitle').value;
            reminder.type = document.getElementById('reminderType').value;
            reminder.date = document.getElementById('reminderDate').value;
            reminder.amount = document.getElementById('reminderAmount').value || null;
            reminder.description = document.getElementById('reminderDescription').value;
            reminder.priority = document.getElementById('reminderPriority').value;
            
            this.saveReminders();
            this.renderReminders();
            modal.classList.remove('show');
            form.reset();
            form.removeEventListener('submit', submitHandler);
            modal.querySelector('h2').textContent = 'Add New Reminder';
        };

        form.addEventListener('submit', submitHandler);
    }

    deleteReminder(id) {
        this.reminders = this.reminders.filter(r => r.id !== id);
        this.saveReminders();
        this.renderReminders();
    }
}

// Initialize Reminder Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.reminderManager = new ReminderManager();
}); 