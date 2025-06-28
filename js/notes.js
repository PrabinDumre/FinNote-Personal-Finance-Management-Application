function handleNoteTypeChange(value) {
    const customTypeInput = document.getElementById('customNoteType');
    customTypeInput.style.display = value === 'other' ? 'block' : 'none';
    if (value !== 'other') {
        customTypeInput.value = '';
    }
}

class NotesManager {
    constructor() {
        this.notes = this.loadNotes();
        this.initializeDates();
        this.initializeEventListeners();
        this.renderNotes();
    }

    loadNotes() {
        const stored = localStorage.getItem('notes');
        return stored ? JSON.parse(stored) : [];
    }

    saveNotes() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
    }

    initializeDates() {
        const dateContainer = document.getElementById('dateContainer');
        const dates = [];
        const today = new Date();

        for (let i = -3; i <= 7; i++) {
            const date = new Date();
            date.setDate(today.getDate() + i);
            dates.push(date);
        }

        dateContainer.innerHTML = dates.map((date, index) => `
            <div class="date-item ${index === 3 ? 'active' : ''}">
                <div class="day">${date.getDate()}</div>
                <div class="month">${date.toLocaleString('default', { month: 'short' })}</div>
            </div>
        `).join('');
    }

    initializeEventListeners() {
        // Add Note Button
        const addNoteBtn = document.querySelector('.add-note-btn');
        const modal = document.getElementById('addNoteModal');
        const closeBtn = modal.querySelector('.close-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const addNoteForm = document.getElementById('addNoteForm');

        addNoteBtn.addEventListener('click', () => modal.classList.add('show'));
        closeBtn.addEventListener('click', () => modal.classList.remove('show'));
        cancelBtn.addEventListener('click', () => modal.classList.remove('show'));

        // Form Submission
        addNoteForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const noteTypeSelect = document.getElementById('noteType');
            const customNoteType = document.getElementById('customNoteType');
            
            const note = {
                id: Date.now(),
                type: noteTypeSelect.value === 'other' ? customNoteType.value : noteTypeSelect.value,
                title: document.getElementById('noteTitle').value,
                content: document.getElementById('noteContent').value,
                date: new Date().toISOString()
            };
            
            this.addNote(note);
            modal.classList.remove('show');
            addNoteForm.reset();
            customNoteType.style.display = 'none';
        });

        // Category Filters
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelector('.category-btn.active').classList.remove('active');
                btn.classList.add('active');
                this.filterNotes(btn.textContent);
            });
        });

        // Search Functionality
        const searchInput = document.getElementById('searchNotes');
        searchInput.addEventListener('input', () => {
            this.searchNotes(searchInput.value);
        });
    }

    addNote(note) {
        const newNote = {
            ...note,
            favorite: false
        };
        this.notes.unshift(newNote);
        this.saveNotes();
        this.renderNotes();
    }

    renderNotes() {
        const notesGrid = document.getElementById('notesGrid');
        const activeCategory = document.querySelector('.category-btn.active').textContent;
        
        const filteredNotes = activeCategory === 'Notes' 
            ? this.notes 
            : this.notes.filter(note => note.type === activeCategory);

        // Sort notes to show favorites first
        filteredNotes.sort((a, b) => {
            if (a.favorite && !b.favorite) return -1;
            if (!a.favorite && b.favorite) return 1;
            return 0;
        });

        notesGrid.innerHTML = filteredNotes.map(note => `
            <div class="note-card ${note.favorite ? 'favorite' : ''}">
                ${note.favorite ? '<span class="favorite-indicator">⭐</span>' : ''}
                <h3>${note.title || 'Untitled'}</h3>
                <p>${note.content}</p>
                <button class="menu-btn" data-id="${note.id}">⋮</button>
                <div class="dropdown-menu" id="menu-${note.id}">
                    <button class="edit-btn" data-id="${note.id}">
                        ✏️ Edit
                    </button>
                    <button class="favorite-btn" data-id="${note.id}">
                        ${note.favorite ? '⭐ Unpin' : '⭐ Pin to Top'}
                    </button>
                    <button class="rename-btn" data-id="${note.id}">
                        📝 Rename Type
                    </button>
                    <button class="delete-btn" data-id="${note.id}">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `).join('');

        // Add menu toggle functionality
        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const noteId = btn.dataset.id;
                const menu = document.getElementById(`menu-${noteId}`);
                // Close all other menus
                document.querySelectorAll('.dropdown-menu.show').forEach(m => {
                    if (m !== menu) m.classList.remove('show');
                });
                menu.classList.toggle('show');
            });
        });

        // Add favorite toggle functionality
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const noteId = parseInt(btn.dataset.id);
                this.toggleFavorite(noteId);
                // Close the dropdown menu
                document.getElementById(`menu-${noteId}`).classList.remove('show');
            });
        });

        // Add click handlers for menu items
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const noteId = parseInt(btn.dataset.id);
                this.editNote(noteId);
            });
        });

        document.querySelectorAll('.rename-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const noteId = parseInt(btn.dataset.id);
                this.renameNoteType(noteId);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const noteId = parseInt(btn.dataset.id);
                this.deleteNote(noteId);
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
        });
    }

    filterNotes(category) {
        this.renderNotes();
    }

    searchNotes(query) {
        const notesGrid = document.getElementById('notesGrid');
        const filteredNotes = this.notes.filter(note => 
            note.title.toLowerCase().includes(query.toLowerCase()) ||
            note.content.toLowerCase().includes(query.toLowerCase()) ||
            note.type.toLowerCase().includes(query.toLowerCase())
        );

        notesGrid.innerHTML = filteredNotes.map(note => `
            <div class="note-card">
                <h3>${note.title || 'Untitled'}</h3>
                <p>${note.content}</p>
                <button class="menu-btn" data-id="${note.id}">⋮</button>
                <div class="dropdown-menu" id="menu-${note.id}">
                    <button class="edit-btn" data-id="${note.id}">
                        ✏️ Edit
                    </button>
                    <button class="rename-btn" data-id="${note.id}">
                        📝 Rename Type
                    </button>
                    <button class="delete-btn" data-id="${note.id}">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    editNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;

        const modal = document.getElementById('addNoteModal');
        const form = document.getElementById('addNoteForm');
        const noteType = document.getElementById('noteType');
        const customNoteType = document.getElementById('customNoteType');
        const title = document.getElementById('noteTitle');
        const content = document.getElementById('noteContent');

        // Set form values
        if (this.isDefaultNoteType(note.type)) {
            noteType.value = note.type;
            customNoteType.style.display = 'none';
        } else {
            noteType.value = 'other';
            customNoteType.style.display = 'block';
            customNoteType.value = note.type;
        }
        title.value = note.title;
        content.value = note.content;

        // Update modal title
        modal.querySelector('h2').textContent = 'Edit Note';

        // Show modal
        modal.classList.add('show');

        // Update form submission handler
        const submitHandler = (e) => {
            e.preventDefault();
            note.type = noteType.value === 'other' ? customNoteType.value : noteType.value;
            note.title = title.value;
            note.content = content.value;
            this.saveNotes();
            this.renderNotes();
            modal.classList.remove('show');
            form.reset();
            customNoteType.style.display = 'none';
            form.removeEventListener('submit', submitHandler);
            modal.querySelector('h2').textContent = 'Add New Note';
        };

        form.addEventListener('submit', submitHandler);
    }

    renameNoteType(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;

        const newType = prompt('Enter new note type:', note.type);
        if (newType && newType.trim()) {
            note.type = newType.trim();
            this.saveNotes();
            this.renderNotes();
        }
    }

    deleteNote(noteId) {
        if (confirm('Are you sure you want to delete this note?')) {
            this.notes = this.notes.filter(n => n.id !== noteId);
            this.saveNotes();
            this.renderNotes();
        }
    }

    toggleFavorite(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            note.favorite = !note.favorite;
            this.saveNotes();
            this.renderNotes();
        }
    }

    isDefaultNoteType(type) {
        const defaultTypes = ['Important', 'Lecture Notes', 'Grocery', 'To-do List', 'Shopping List', 'Routine'];
        return defaultTypes.includes(type);
    }
}

// Initialize Notes Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.notesManager = new NotesManager();
}); 