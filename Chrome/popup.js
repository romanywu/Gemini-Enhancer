// Popup script for managing slash commands

// Safari compatibility: Use browser API if available, fallback to chrome
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

document.addEventListener('DOMContentLoaded', async function() {
    const commandsList = document.getElementById('commandsList');
    const addCommandBtn = document.getElementById('addCommand');
    const triggerInput = document.getElementById('commandTrigger');
    const promptInput = document.getElementById('commandPrompt');
    
    // Load and display existing commands
    await loadCommands();
    
    // Add new command
    addCommandBtn.addEventListener('click', addCommand);
    
    // Enable adding command with Enter key
    triggerInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addCommand();
    });
    
    promptInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) addCommand();
    });
    
    async function loadCommands() {
        try {
            const result = await browserAPI.storage.sync.get(['slashCommands']);
            const commands = result.slashCommands || {};
            
            displayCommands(commands);
        } catch (error) {
            console.error('Error loading commands:', error);
        }
    }
    
    function displayCommands(commands) {
        const commandsArray = Object.entries(commands);
        
        if (commandsArray.length === 0) {
            commandsList.innerHTML = '<div class="empty-state">No commands yet. Add one below!</div>';
            return;
        }
        
        commandsList.innerHTML = commandsArray.map(([trigger, prompt]) => `
            <div class="command-item" data-trigger="${trigger}">
                <div class="command-trigger">/${trigger}</div>
                <div class="command-description">${prompt}</div>
                <button class="delete-btn" data-trigger="${trigger}">Delete</button>
            </div>
        `).join('');
        
        // Add delete event listeners
        commandsList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteCommand(btn.dataset.trigger));
        });
    }
    
    async function addCommand() {
        const trigger = triggerInput.value.trim().toLowerCase();
        const prompt = promptInput.value.trim();
        
        if (!trigger || !prompt) {
            showNotification('Please fill in both fields', 'error');
            return;
        }
        
        // Validate trigger (alphanumeric only)
        if (!/^[a-z0-9]+$/.test(trigger)) {
            showNotification('Command must contain only letters and numbers', 'error');
            return;
        }
        
        try {
            const result = await browserAPI.storage.sync.get(['slashCommands']);
            const commands = result.slashCommands || {};
            
            const isUpdate = commands[trigger];
            commands[trigger] = prompt;
            
            await browserAPI.storage.sync.set({ slashCommands: commands });
            
            // Clear inputs
            triggerInput.value = '';
            promptInput.value = '';
            
            // Show success message
            showNotification(isUpdate ? `Updated /${trigger}` : `Added /${trigger}`, 'success');
            
            // Reload display
            await loadCommands();
            
        } catch (error) {
            console.error('Error saving command:', error);
            showNotification('Error saving command. Please try again.', 'error');
        }
    }
    
    async function deleteCommand(trigger) {
        if (!confirm(`Delete command /${trigger}?`)) {
            return;
        }
        
        try {
            const result = await browserAPI.storage.sync.get(['slashCommands']);
            const commands = result.slashCommands || {};
            
            delete commands[trigger];
            
            await browserAPI.storage.sync.set({ slashCommands: commands });
            
            // Show success message
            showNotification(`Deleted /${trigger}`, 'success');
            
            // Reload display
            await loadCommands();
            
        } catch (error) {
            console.error('Error deleting command:', error);
            showNotification('Error deleting command. Please try again.', 'error');
        }
    }
    
    function showNotification(message, type = 'info') {
        // Remove any existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? 'var(--button-danger)' : 'var(--button-primary)'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
            opacity: 0;
            animation: slideInFade 0.3s ease forwards;
        `;
        
        // Add animation keyframes if not already added
        if (!document.querySelector('#notificationStyles')) {
            const style = document.createElement('style');
            style.id = 'notificationStyles';
            style.textContent = `
                @keyframes slideInFade {
                    from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                @keyframes slideOutFade {
                    from { opacity: 1; transform: translateX(-50%) translateY(0); }
                    to { opacity: 0; transform: translateX(-50%) translateY(-10px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutFade 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
});
