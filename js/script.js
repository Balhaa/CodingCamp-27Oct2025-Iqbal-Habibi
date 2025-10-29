document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const todoForm = document.getElementById('todo-form');
    const taskNameInput = document.getElementById('task-name');
    const dueDateInput = document.getElementById('due-date');
    const statusSelect = document.getElementById('status');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-by');
    const filterSelect = document.getElementById('filter-by');
    const todoItemsContainer = document.getElementById('todo-items');
    const totalTasksElement = document.getElementById('total-tasks');
    const completedTasksElement = document.getElementById('completed-tasks');
    const pendingTasksElement = document.getElementById('pending-tasks');
    const progressTasksElement = document.getElementById('progress-tasks');
    const nameErrorElement = document.getElementById('name-error');
    const dateErrorElement = document.getElementById('date-error');
    
    // Confetti setup
    const confettiCanvas = document.getElementById('confetti-canvas');
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    dueDateInput.min = today;
    
    // Load tasks from localStorage - JANGAN PAKAI TASK BAWAAN LAGI
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    
    // Initialize the app
    function init() {
        renderTasks();
        updateStats();
        
        // Add event listeners
        todoForm.addEventListener('submit', addTask);
        searchInput.addEventListener('input', filterTasks);
        sortSelect.addEventListener('change', sortTasks);
        filterSelect.addEventListener('change', filterTasks);
        
        // Add keyboard shortcut for search
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                searchInput.focus();
            }
        });
        
        // Input validation
        taskNameInput.addEventListener('input', validateTaskName);
        dueDateInput.addEventListener('change', validateDueDate);
        
        // Window resize handler for confetti canvas
        window.addEventListener('resize', function() {
            confettiCanvas.width = window.innerWidth;
            confettiCanvas.height = window.innerHeight;
        });
    }
    
    // Validate task name
    function validateTaskName() {
        const taskName = taskNameInput.value.trim();
        if (taskName.length < 3) {
            nameErrorElement.textContent = 'Task name must be at least 3 characters long';
            nameErrorElement.style.color = 'var(--danger)';
            return false;
        } else if (taskName.length > 100) {
            nameErrorElement.textContent = 'Task name must be less than 100 characters';
            nameErrorElement.style.color = 'var(--danger)';
            return false;
        } else {
            nameErrorElement.textContent = '✓ Looks good!';
            nameErrorElement.style.color = 'var(--success)';
            return true;
        }
    }
    
    // Validate due date
    function validateDueDate() {
        const dueDate = dueDateInput.value;
        if (!dueDate) {
            dateErrorElement.textContent = 'Please select a due date';
            dateErrorElement.style.color = 'var(--danger)';
            return false;
        } else if (new Date(dueDate) < new Date(today)) {
            dateErrorElement.textContent = 'Due date cannot be in the past';
            dateErrorElement.style.color = 'var(--danger)';
            return false;
        } else {
            dateErrorElement.textContent = '✓ Valid date!';
            dateErrorElement.style.color = 'var(--success)';
            return true;
        }
    }
    
    // Add a new task
    function addTask(e) {
        e.preventDefault();
        
        const taskName = taskNameInput.value.trim();
        const dueDate = dueDateInput.value;
        const status = statusSelect.value;
        
        // Validate inputs
        const isNameValid = validateTaskName();
        const isDateValid = validateDueDate();
        
        if (!isNameValid || !isDateValid) {
            // Shake animation for invalid form
            todoForm.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                todoForm.style.animation = '';
            }, 500);
            return;
        }
        
        const newTask = {
            id: Date.now(),
            name: taskName,
            dueDate: dueDate,
            status: status,
            createdAt: new Date().toISOString()
        };
        
        tasks.push(newTask);
        renderTasks();
        updateStats();
        saveToLocalStorage();
        
        // Reset form
        todoForm.reset();
        dueDateInput.min = today;
        nameErrorElement.textContent = '';
        dateErrorElement.textContent = '';
        
        // Show success animation
        const addButton = todoForm.querySelector('.btn-primary');
        const originalHTML = addButton.innerHTML;
        const originalBG = addButton.style.background;
        
        addButton.innerHTML = '<i class="fas fa-check"></i> Task Added!';
        addButton.style.background = 'var(--success)';
        
        // Add confetti for new task
        if (status === 'completed') {
            triggerConfetti();
        }
        
        setTimeout(() => {
            addButton.innerHTML = originalHTML;
            addButton.style.background = originalBG;
        }, 2000);
    }
    
    // Delete a task
    function deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            const taskElement = document.querySelector(`[data-task-id="${id}"]`);
            if (taskElement) {
                taskElement.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(() => {
                    tasks = tasks.filter(task => task.id !== id);
                    renderTasks();
                    updateStats();
                    saveToLocalStorage();
                }, 300);
            }
        }
    }
    
    // Edit a task
    function editTask(id) {
        const task = tasks.find(task => task.id === id);
        
        if (task) {
            taskNameInput.value = task.name;
            dueDateInput.value = task.dueDate;
            statusSelect.value = task.status;
            
            // Remove the task from the list
            tasks = tasks.filter(t => t.id !== id);
            renderTasks();
            updateStats();
            saveToLocalStorage();
            
            // Change button text
            const addButton = todoForm.querySelector('.btn-primary');
            addButton.innerHTML = '<i class="fas fa-edit"></i> Update Task';
            addButton.style.background = 'var(--warning)';
            
            // Scroll to form with smooth animation
            document.querySelector('.add-todo-form').scrollIntoView({ 
                behavior: 'smooth',
                block: 'center'
            });
        }
    }
    
    // Change task status
    function changeStatus(id, newStatus) {
        const task = tasks.find(task => task.id === id);
        if (task) {
            const oldStatus = task.status;
            task.status = newStatus;
            renderTasks();
            updateStats();
            saveToLocalStorage();
            
            // Add completion animation and confetti
            if (newStatus === 'completed' && oldStatus !== 'completed') {
                const taskElement = document.querySelector(`[data-task-id="${id}"]`);
                if (taskElement) {
                    taskElement.classList.add('task-completed');
                    setTimeout(() => {
                        taskElement.classList.remove('task-completed');
                    }, 600);
                    
                    // Trigger confetti for completed task
                    triggerConfetti();
                }
            }
        }
    }
    
    // Render tasks to the DOM
    function renderTasks() {
        if (tasks.length === 0) {
            todoItemsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-animation">
                        <i class="fas fa-clipboard-list"></i>
                    </div>
                    <h3>No task found</h3>
                    <p>Add a new task to get started!</p>
                </div>
            `;
            return;
        }
        
        let filteredTasks = [...tasks];
        
        // Apply search filter
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            filteredTasks = filteredTasks.filter(task => 
                task.name.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply status filter
        const statusFilter = filterSelect.value;
        if (statusFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => 
                task.status === statusFilter
            );
        }
        
        // Apply sorting
        const sortBy = sortSelect.value;
        if (sortBy === 'name') {
            filteredTasks.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === 'date') {
            filteredTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        } else if (sortBy === 'status') {
            filteredTasks.sort((a, b) => a.status.localeCompare(b.status));
        }
        
        // If no tasks after filtering
        if (filteredTasks.length === 0) {
            todoItemsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-animation">
                        <i class="fas fa-search"></i>
                    </div>
                    <h3>No tasks match your criteria</h3>
                    <p>Try changing your search or filter</p>
                </div>
            `;
            return;
        }
        
        // Render tasks
        todoItemsContainer.innerHTML = filteredTasks.map(task => `
            <div class="todo-item status-${task.status}" data-task-id="${task.id}">
                <div class="task-name">
                    <i class="fas fa-tasks"></i>
                    <span>${task.name}</span>
                </div>
                <div class="due-date">${formatDate(task.dueDate)}</div>
                <div class="status status-${task.status}">
                    <select onchange="changeStatus(${task.id}, this.value)" class="status-select">
                        <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>⏳ Pending</option>
                        <option value="progress" ${task.status === 'progress' ? 'selected' : ''}>🚧 In Progress</option>
                        <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>✅ Completed</option>
                    </select>
                </div>
                <div class="actions">
                    <button class="action-btn edit-btn" onclick="editTask(${task.id})" title="Edit Task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteTask(${task.id})" title="Delete Task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // Update statistics - DIPERBAIKI untuk sinkronisasi yang benar
    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.status === 'completed').length;
        const pending = tasks.filter(task => task.status === 'pending').length;
        const progress = tasks.filter(task => task.status === 'progress').length;
        
        // Update elements directly tanpa animasi counter yang kompleks
        // untuk memastikan sinkronisasi yang tepat
        totalTasksElement.textContent = total;
        completedTasksElement.textContent = completed;
        pendingTasksElement.textContent = pending;
        progressTasksElement.textContent = progress;
    }
    
    // Filter tasks based on search and status
    function filterTasks() {
        renderTasks();
    }
    
    // Sort tasks
    function sortTasks() {
        renderTasks();
    }
    
    // Format date to display in a more readable format
    function formatDate(dateString) {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }
    
    // Save tasks to localStorage - DIPASTIKAN BERFUNGSI
    function saveToLocalStorage() {
        try {
            localStorage.setItem('tasks', JSON.stringify(tasks));
            console.log('Tasks saved to localStorage:', tasks.length, 'tasks');
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }
    
    // Confetti effect
    function triggerConfetti() {
        const confettiPieces = [];
        const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
        
        for (let i = 0; i < 150; i++) {
            confettiPieces.push({
                x: Math.random() * confettiCanvas.width,
                y: -20,
                size: Math.random() * 10 + 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                speed: Math.random() * 3 + 2,
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 10 - 5
            });
        }
        
        function animateConfetti() {
            ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
            
            let activePieces = 0;
            
            confettiPieces.forEach((piece, index) => {
                piece.y += piece.speed;
                piece.x += Math.sin(piece.y * 0.1) * 0.5;
                piece.rotation += piece.rotationSpeed;
                
                ctx.save();
                ctx.translate(piece.x, piece.y);
                ctx.rotate(piece.rotation * Math.PI / 180);
                ctx.fillStyle = piece.color;
                ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
                ctx.restore();
                
                if (piece.y < confettiCanvas.height) {
                    activePieces++;
                }
            });
            
            if (activePieces > 0) {
                requestAnimationFrame(animateConfetti);
            }
        }
        
        animateConfetti();
    }
    
    // Make functions available globally for onclick handlers
    window.deleteTask = deleteTask;
    window.editTask = editTask;
    window.changeStatus = changeStatus;
    
    // Initialize the application
    init();
});

// Add shake animation for invalid form
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
    
    @keyframes slideOut {
        from { 
            opacity: 1;
            transform: translateX(0);
        }
        to { 
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);