// Initialize Supabase client
let supabaseClient = null;

// Configuration for Tasklapp backend
const SUPABASE_URL = 'https://xgfdypewsviakeabgvms.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZmR5cGV3c3ZpYWtlYWJndm1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NTMyMTMsImV4cCI6MjA2MDMyOTIxM30.XqJQbIey99IUpqryrikFPCUAftDpPEj4XO3UnPgqDcA';

// Current authentication step
let authStep = 'email'; // 'email' or 'otp'
let currentEmail = '';

// State persistence functions
async function saveAuthState() {
    try {
        await chrome.storage.local.set({
            authStep: authStep,
            currentEmail: currentEmail,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('Error saving auth state:', error);
    }
}

async function loadAuthState() {
    try {
        const result = await chrome.storage.local.get(['authStep', 'currentEmail', 'timestamp']);
        
        // Check if the saved state is recent (within 10 minutes)
        if (result.timestamp && (Date.now() - result.timestamp) < 10 * 60 * 1000) {
            if (result.authStep) authStep = result.authStep;
            if (result.currentEmail) currentEmail = result.currentEmail;
            return true;
        } else {
            // Clear old state
            await chrome.storage.local.remove(['authStep', 'currentEmail', 'timestamp']);
            return false;
        }
    } catch (error) {
        console.error('Error loading auth state:', error);
        return false;
    }
}

async function clearAuthState() {
    try {
        await chrome.storage.local.remove(['authStep', 'currentEmail', 'timestamp']);
        authStep = 'email';
        currentEmail = '';
    } catch (error) {
        console.error('Error clearing auth state:', error);
    }
}

// Helper functions for UI updates

// Show status message to user
function showStatusMessage(message, type = 'info') {
    const statusEl = document.getElementById('statusMessage');
    if (!statusEl) return;
    
    console.log(`[Tasklapp] ${type.toUpperCase()}: ${message}`);
    
    // Clear existing classes
    statusEl.className = 'status-message';
    
    // Add type-specific class
    statusEl.classList.add(type);
    
    // Set message
    statusEl.textContent = message;
    
    // Show message
    statusEl.classList.remove('hidden');
    
    // Auto-hide after 5 seconds for success messages, 8 seconds for errors
    const hideAfter = type === 'error' ? 8000 : 5000;
    setTimeout(() => {
        if (statusEl.textContent === message) {
            statusEl.classList.add('hidden');
        }
    }, hideAfter);
}

// Update authentication UI based on current step
function updateAuthUI(step, email = '') {
    const emailInput = document.getElementById('emailInput');
    const otpGroup = document.getElementById('otpGroup');
    const otpInput = document.getElementById('otpInput');
    const authButton = document.getElementById('authButton');
    
    if (step === 'email') {
        // Show email input, hide OTP
        if (otpGroup) otpGroup.classList.add('hidden');
        if (emailInput) {
            emailInput.parentElement.classList.remove('hidden');
            emailInput.readOnly = false;
            emailInput.focus();
        }
        if (authButton) {
            authButton.innerHTML = 'Send Verification Code';
            authButton.disabled = false;
            authButton.classList.remove('loading');
        }
    } else if (step === 'otp') {
        // Show OTP input, keep email visible but readonly
        if (emailInput) {
            emailInput.value = email;
            emailInput.readOnly = true;
        }
        if (otpGroup) {
            otpGroup.classList.remove('hidden');
            setTimeout(() => {
                if (otpInput) otpInput.focus();
            }, 100);
        }
        if (authButton) {
            authButton.innerHTML = 'Verify Code';
            authButton.disabled = false;
            authButton.classList.remove('loading');
        }
    }
}

// Update UI based on authentication state
function updateUIForAuthState(isAuthenticated, user = null) {
    const authSection = document.getElementById('authSection');
    const taskSection = document.getElementById('taskSection');
    
    if (isAuthenticated && user) {
        console.log('[Tasklapp] User authenticated, showing task interface');
        
        // Hide auth section
        if (authSection) {
            authSection.classList.add('hidden');
        }
        
        // Show task section
        if (taskSection) {
            taskSection.classList.remove('hidden');
        }
        
        // Load friends for task assignment
        loadFriends();
        
        // Show welcome message
        showStatusMessage(`Welcome! 👋 Ready to create tasks`, 'success');
        
    } else {
        console.log('[Tasklapp] User not authenticated, showing auth interface');
        
        // Show auth section
        if (authSection) {
            authSection.classList.remove('hidden');
        }
        
        // Hide task section
        if (taskSection) {
            taskSection.classList.add('hidden');
        }
    }
}

// Initialize Supabase with check for global availability
function initializeSupabase() {
    try {
        // Check if the Supabase library is available globally
        if (typeof supabase !== 'undefined') {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            });
            
            // Test the database connection
            testDatabaseConnection();
            
            return true;
        } else {
            showStatusMessage('Supabase library not loaded', 'error');
            return false;
        }
    } catch (error) {
        showStatusMessage(`Initialization error: ${error.message}`, 'error');
        return false;
    }
}

// Test database connection
async function testDatabaseConnection() {
    if (!supabaseClient) return;
    
    try {
        console.log('Testing database connection...');
        
        // Simple query to test connection using the correct table name
        const { data, error } = await supabaseClient
            .from('users')
            .select('id')
            .limit(1);
        
        if (error) {
            console.error('Database connection test failed:', error);
            showStatusMessage('⚠️ Database connection issue - some features may not work', 'error');
        } else {
            console.log('Database connection successful');
        }
    } catch (error) {
        console.error('Database connection test error:', error);
        showStatusMessage('⚠️ Cannot connect to database', 'error');
    }
}

// Load friends/users for assignment
async function loadFriends() {
    if (!supabaseClient) {
        console.log('Supabase client not available for loading friends');
        return;
    }
    
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            console.log('User not authenticated, cannot load friends');
            return;
        }
        
        console.log('Loading friends for user:', user.id);
        
        // Get friends from friendships table with correct schema matching main app
        const { data: friendships, error: friendsError } = await supabaseClient
            .from('friendships')
            .select(`
                *,
                requester:users!friendships_user_id_fkey(id, name, email, avatar_url, created_at),
                recipient:users!friendships_friend_id_fkey(id, name, email, avatar_url, created_at)
            `)
            .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
            .eq('status', 'ACCEPTED');
        
        if (friendsError) {
            console.error('Error loading friends:', friendsError);
            showStatusMessage('Could not load friends list', 'error');
            return;
        }
        
        console.log('Loaded friendships:', friendships);
        
        const assigneeSelect = document.getElementById('assigneeSelect');
        if (!assigneeSelect) {
            console.error('Assignee select element not found');
            return;
        }
        
        // Clear existing options (no placeholder needed for multiselect)
        assigneeSelect.innerHTML = '';
        
        // Add current user as an option (self-assignment)
        const selfOption = document.createElement('option');
        selfOption.value = user.id;
        selfOption.textContent = '👤 Myself';
        assigneeSelect.appendChild(selfOption);
        
        // Add friends
        if (friendships && friendships.length > 0) {
            friendships.forEach(friendship => {
                // Determine which user is the friend (not the current user)
                const isUserRequester = friendship.user_id === user.id;
                const friendData = isUserRequester 
                    ? friendship.recipient 
                    : friendship.requester;
                
                if (friendData) {
                    const option = document.createElement('option');
                    // Use friend_id if current user is the requester, otherwise use user_id
                    option.value = isUserRequester ? friendship.friend_id : friendship.user_id;
                    option.textContent = `👥 ${friendData.name || friendData.email}`;
                    assigneeSelect.appendChild(option);
                }
            });
            console.log(`Added ${friendships.length} friends to dropdown`);
        } else {
            // Add a helpful message if no friends
            const noFriendsOption = document.createElement('option');
            noFriendsOption.value = '';
            noFriendsOption.textContent = '(No friends added yet)';
            noFriendsOption.disabled = true;
            assigneeSelect.appendChild(noFriendsOption);
            console.log('No friends found');
        }
        
        // Add some visual feedback
        showStatusMessage(`✅ Loaded ${friendships?.length || 0} friends`, 'success');
        setTimeout(() => {
            const statusEl = document.getElementById('statusMessage');
            if (statusEl && statusEl.textContent.includes('Loaded')) {
                statusEl.classList.add('hidden');
            }
        }, 2000);
        
    } catch (error) {
        console.error('Error loading friends:', error);
        showStatusMessage('Error loading friends list', 'error');
        
        // Still add self-assignment option even if friends fail to load
        const assigneeSelect = document.getElementById('assigneeSelect');
        if (assigneeSelect) {
            assigneeSelect.innerHTML = '';
            try {
                const { data: { user } } = await supabaseClient.auth.getUser();
                if (user) {
                    const selfOption = document.createElement('option');
                    selfOption.value = user.id;
                    selfOption.textContent = '👤 Myself';
                    assigneeSelect.appendChild(selfOption);
                }
            } catch (e) {
                console.error('Could not add self option:', e);
            }
        }
    }
}

// Submit a task to Tasklapp
async function submitTask() {
    if (!supabaseClient) {
        showStatusMessage('Not connected to Tasklapp', 'error');
        return;
    }
    
    const titleInput = document.getElementById('taskTitle');
    const descriptionInput = document.getElementById('taskDescription');
    const assigneeSelect = document.getElementById('assigneeSelect');
    const dueDateInput = document.getElementById('dueDate');
    const dueTimeInput = document.getElementById('dueTime');
    const priorityInput = document.getElementById('priority');
    const estimatedTimeInput = document.getElementById('estimatedTime');
    const submissionTypeInput = document.getElementById('submissionType');
    const submissionInstructionsInput = document.getElementById('submissionInstructions');
    
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const assigneeIds = Array.from(assigneeSelect.selectedOptions, option => option.value);
    
    if (!title) {
        showStatusMessage('Please enter a task title', 'error');
        titleInput.focus();
        return;
    }
    
    if (assigneeIds.length === 0) {
        showStatusMessage('Please select who to assign this task to', 'error');
        assigneeSelect.focus();
        return;
    }
    
    try {
        // Add loading state
        const submitBtn = document.getElementById('submitTaskButton');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner"></span>Creating task...';
        submitBtn.disabled = true;
        
        showStatusMessage('Creating task...', 'info');
        
        // Check if user is authenticated
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            showStatusMessage('Please sign in first', 'error');
            return;
        }
        
        // Get form values with defaults
        const dueDate = dueDateInput?.value || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Tomorrow
        const dueTime = dueTimeInput?.value || '23:59'; // End of day default
        const priority = priorityInput?.value || 'medium';
        const estimatedTime = estimatedTimeInput?.value ? parseInt(estimatedTimeInput.value) : 30;
        const submissionType = submissionTypeInput?.value || 'text';
        const submissionInstructions = submissionInstructionsInput?.value.trim() || null;
        
        // Create proper due date object (matching CreateTaskModal logic)
        const dueDateObj = new Date(`${dueDate}T${dueTime}:00`);
        
        // Create task data matching CreateTaskModal structure exactly
        const newTasks = assigneeIds.map(assigneeId => ({
            title,
            description: description,
            due_date: dueDateObj.toISOString(),
            assigner_id: user.id,
            assignee_id: assigneeId,
            status: 'PENDING',
            priority: priority.toUpperCase(),
            estimated_time_minutes: estimatedTime,
            submission_type: submissionType,
            submission_instructions: submissionInstructions
        }));
        
        console.log('Creating tasks with data:', newTasks);
        
        // Submit tasks to database using createTask format
        const { data, error } = await supabaseClient
            .from('tasks')
            .insert(newTasks)
            .select();
        
        if (error) throw error;
        
        const taskCount = assigneeIds.length;
        const taskWord = taskCount === 1 ? 'task' : 'tasks';
        showStatusMessage(`✅ ${taskCount} ${taskWord} created successfully!`, 'success');
        
        // Clear form
        titleInput.value = '';
        descriptionInput.value = '';
        assigneeSelect.selectedIndex = -1; // Clear all selections in multiselect
        if (estimatedTimeInput) estimatedTimeInput.value = '';
        if (submissionInstructionsInput) submissionInstructionsInput.value = '';
        
        // Reset to defaults
        if (priorityInput) priorityInput.value = 'medium';
        if (submissionTypeInput) submissionTypeInput.value = 'text';
        
        // Collapse advanced options
        const optionsPanel = document.getElementById('advancedPanel');
        const toggleBtn = document.getElementById('advancedToggle');
        if (optionsPanel && !optionsPanel.classList.contains('hidden')) {
            optionsPanel.classList.add('hidden');
            if (toggleBtn) toggleBtn.classList.remove('expanded');
        }
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
    } catch (error) {
        console.error('Error creating tasks:', error);
        showStatusMessage(`❌ Error creating tasks: ${error.message}`, 'error');
        
        // Reset button
        const submitBtn = document.getElementById('submitTaskButton');
        submitBtn.innerHTML = 'Add Task';
        submitBtn.disabled = false;
    }
}

// Check authentication status
async function checkAuthStatus() {
    if (!supabaseClient) return;
    
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        
        if (error) {
            console.error('Auth check error:', error);
            updateUIForAuthState(false);
            return;
        }
        
        if (user) {
            updateUIForAuthState(true, user);
        } else {
            updateUIForAuthState(false);
        }
        
    } catch (error) {
        console.error('Error checking auth status:', error);
        updateUIForAuthState(false);
    }
}

// Initialize extension when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Tasklapp] Extension popup loaded');
    
    // Initialize Supabase
    initializeSupabase();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load auth state and initialize UI
    initializeUI();
});

// Initialize UI
function initializeUI() {
    // Load saved auth state first
    loadAuthState();
    
    // Wait a short moment for the local Supabase library to load
    setTimeout(async () => {
        if (initializeSupabase()) {
            // Set up auth state change listener
            supabaseClient.auth.onAuthStateChange(async (event, session) => {
                console.log('Auth state changed:', event, session?.user?.email);
                
                if (event === 'SIGNED_IN' && session) {
                    updateUIForAuthState(true, session.user);
                } else if (event === 'SIGNED_OUT') {
                    updateUIForAuthState(false);
                    authStep = 'email';
                    currentEmail = '';
                    await clearAuthState();
                    updateAuthUI();
                }
            });
            
            // Initial auth check
            await checkAuthStatus();
            
            // Update UI based on loaded state (this will show OTP form if we were in OTP step)
            updateAuthUI();
            
            // Set up initial event listeners
            setupEventListeners();
            
            // Set up logout listener
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', handleSignOut);
            }
            
            // Set up task submission listener
            const submitBtn = document.getElementById('submitTaskButton');
            if (submitBtn) {
                submitBtn.addEventListener('click', submitTask);
            }
            
            // Set up advanced options toggle
            const advancedToggle = document.getElementById('advancedToggle');
            const advancedPanel = document.getElementById('advancedPanel');
            if (advancedToggle && advancedPanel) {
                advancedToggle.addEventListener('click', () => {
                    const isHidden = advancedPanel.classList.contains('hidden');
                    if (isHidden) {
                        advancedPanel.classList.remove('hidden');
                        advancedToggle.textContent = '⚙️ Hide Advanced Options';
                        initializeFormDefaults();
                    } else {
                        advancedPanel.classList.add('hidden');
                        advancedToggle.textContent = '⚙️ Advanced Options';
                    }
                });
            }
            
            // Show ready status
            showStatusMessage('🚀 Tasklapp extension ready!', 'success');
            
        } else {
            showStatusMessage('❌ Failed to initialize Tasklapp connection', 'error');
        }
    }, 100);
}

// Initialize form defaults
function initializeFormDefaults() {
    // Set default due date to tomorrow
    const dueDateInput = document.getElementById('dueDate');
    if (dueDateInput && !dueDateInput.value) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dueDateInput.value = tomorrow.toISOString().split('T')[0];
    }
    
    // Set default due time to current time
    const dueTimeInput = document.getElementById('dueTime');
    if (dueTimeInput && !dueTimeInput.value) {
        const now = new Date();
        const timeString = now.toTimeString().slice(0, 5); // HH:MM format
        dueTimeInput.value = timeString;
    }
}

// Handle sign out
async function handleSignOut() {
    try {
        console.log('[Tasklapp] Signing out user...');
        
        if (supabaseClient) {
            const { error } = await supabaseClient.auth.signOut();
            if (error) {
                console.error('Sign out error:', error);
                showStatusMessage('Error signing out: ' + error.message, 'error');
                return;
            }
        }
        
        // Clear auth state
        clearAuthState();
        
        // Reset UI
        updateUIForAuthState(false);
        updateAuthUI('email');
        
        // Clear form
        const emailInput = document.getElementById('emailInput');
        const otpInput = document.getElementById('otpInput');
        if (emailInput) emailInput.value = '';
        if (otpInput) otpInput.value = '';
        
        showStatusMessage('👋 Successfully signed out', 'success');
        
        console.log('[Tasklapp] User signed out successfully');
        
    } catch (error) {
        console.error('Unexpected error during sign out:', error);
        showStatusMessage('Error during sign out', 'error');
    }
}

// Set up all event listeners
function setupEventListeners() {
    // Settings dropdown
    const settingsButton = document.getElementById('settingsButton');
    const settingsDropdown = document.getElementById('settingsDropdown');
    const profileItem = document.getElementById('profileItem');
    const signOutItem = document.getElementById('signOutItem');
    
    if (settingsButton && settingsDropdown) {
        settingsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsDropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!settingsButton.contains(e.target) && !settingsDropdown.contains(e.target)) {
                settingsDropdown.classList.remove('show');
            }
        });
        
        // Handle dropdown item clicks
        if (profileItem) {
            profileItem.addEventListener('click', () => {
                settingsDropdown.classList.remove('show');
                // TODO: Add profile functionality
                showStatusMessage('👤 Profile settings coming soon!', 'info');
            });
        }
        
        if (signOutItem) {
            signOutItem.addEventListener('click', () => {
                settingsDropdown.classList.remove('show');
                handleSignOut();
            });
        }
    }
    
    // Authentication
    const authButton = document.getElementById('authButton');
    const emailInput = document.getElementById('emailInput');
    const otpInput = document.getElementById('otpInput');
    const backToEmailBtn = document.getElementById('backToEmailBtn');
    
    if (authButton) {
        authButton.addEventListener('click', handleAuth);
    }
    
    if (emailInput) {
        emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleAuth();
            }
        });
    }
    
    if (otpInput) {
        otpInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleOTPVerification();
            }
        });
        
        // Auto-submit when 6 digits are entered
        otpInput.addEventListener('input', (e) => {
            const value = e.target.value;
            if (value.length === 6 && /^\d{6}$/.test(value)) {
                setTimeout(handleOTPVerification, 100);
            }
        });
    }
    
    if (backToEmailBtn) {
        backToEmailBtn.addEventListener('click', () => {
            clearAuthState();
            updateAuthUI('email');
        });
    }
    
    // Task submission
    const submitTaskButton = document.getElementById('submitTaskButton');
    if (submitTaskButton) {
        submitTaskButton.addEventListener('click', submitTask);
    }
    
    // Advanced options toggle
    const advancedToggle = document.getElementById('advancedToggle');
    const advancedPanel = document.getElementById('advancedPanel');
    
    if (advancedToggle && advancedPanel) {
        advancedToggle.addEventListener('click', () => {
            const isHidden = advancedPanel.classList.contains('hidden');
            if (isHidden) {
                advancedPanel.classList.remove('hidden');
                advancedToggle.textContent = '⚙️ Hide Advanced Options';
                initializeFormDefaults();
            } else {
                advancedPanel.classList.add('hidden');
                advancedToggle.textContent = '⚙️ Advanced Options';
            }
        });
    }
    
    // Task title input validation
    const taskTitleInput = document.getElementById('taskTitle');
    if (taskTitleInput) {
        taskTitleInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitTask();
            }
        });
    }
    
    // Assignee selection feedback
    const assigneeSelect = document.getElementById('assigneeSelect');
    if (assigneeSelect) {
        assigneeSelect.addEventListener('change', () => {
            const selectedCount = assigneeSelect.selectedOptions.length;
            const hint = assigneeSelect.parentElement.querySelector('.form-hint');
            if (hint) {
                if (selectedCount === 0) {
                    hint.textContent = 'Hold Ctrl/Cmd to select multiple people';
                } else if (selectedCount === 1) {
                    hint.textContent = '1 person selected. Hold Ctrl/Cmd to select more';
                } else {
                    hint.textContent = `${selectedCount} people selected`;
                }
            }
        });
    }
    
    // Paste URL button
    const pasteUrlBtn = document.getElementById('pasteUrlBtn');
    if (pasteUrlBtn) {
        pasteUrlBtn.addEventListener('click', pasteCurrentPageToDescription);
    }
}

// Send OTP to email (step 1)
async function sendOTP(email) {
    if (!supabaseClient) {
        showStatusMessage('Supabase not initialized', 'error');
        return false;
    }
    
    try {
        showStatusMessage('Sending verification code...', 'info');
        
        const { error } = await supabaseClient.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true, // Allow new user creation
            }
        });
        
        if (error) {
            throw error;
        }
        
        showStatusMessage('Check your email for the 6-digit verification code!', 'success');
        return true;
        
    } catch (error) {
        console.error('Error sending OTP:', error);
        showStatusMessage(`Error: ${error.message}`, 'error');
        return false;
    }
}

// Verify OTP (step 2)
async function verifyOTP(email, otp) {
    if (!supabaseClient) {
        showStatusMessage('Supabase not initialized', 'error');
        return false;
    }
    
    try {
        showStatusMessage('Verifying code...', 'info');
        
        const { data, error } = await supabaseClient.auth.verifyOtp({
            email,
            token: otp,
            type: 'email'
        });
        
        if (error) {
            throw error;
        }
        
        if (data?.session) {
            showStatusMessage('Successfully signed in!', 'success');
            await clearAuthState(); // Clear the OTP state since we're now logged in
            return true;
        } else {
            showStatusMessage('Verification failed - no session created', 'error');
            return false;
        }
        
    } catch (error) {
        console.error('Error verifying OTP:', error);
        showStatusMessage(`Verification failed: ${error.message}`, 'error');
        return false;
    }
}

// Handle the login form submission
async function handleAuth() {
    const emailInput = document.getElementById('emailInput');
    const email = emailInput.value.trim();
    
    if (!email || !email.includes('@')) {
        showStatusMessage('Please enter a valid email address', 'error');
        return;
    }
    
    if (authStep === 'email') {
        // Send OTP
        const success = await sendOTP(email);
        if (success) {
            currentEmail = email;
            authStep = 'otp';
            await saveAuthState(); // Save state so it persists when popup closes
            updateAuthUI();
        }
    }
}

// Handle OTP verification
async function handleOTPVerification() {
    const otpInput = document.getElementById('otpInput');
    const otp = otpInput.value.trim();
    
    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
        showStatusMessage('Please enter a valid 6-digit code', 'error');
        return;
    }
    
    const success = await verifyOTP(currentEmail, otp);
    if (success) {
        // Check auth status will be called by the auth state change listener
        authStep = 'email';
        await clearAuthState();
        updateAuthUI();
    }
}

// Update the auth UI based on current step
function updateAuthUI() {
    const authSection = document.getElementById('authSection');
    
    if (authStep === 'email') {
        authSection.innerHTML = `
            <input id="emailInput" type="email" placeholder="Enter your email" value="${currentEmail || ''}" />
            <button id="authButton" class="btn-primary">Send Verification Code</button>
        `;
    } else if (authStep === 'otp') {
        authSection.innerHTML = `
            <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: var(--spacing-sm);">
                Enter the 6-digit code sent to <strong>${currentEmail}</strong>
            </p>
            <input id="otpInput" type="text" placeholder="000000" maxlength="6" pattern="[0-9]{6}" style="text-align: center; font-size: 18px; letter-spacing: 2px;" />
            <button id="verifyBtn" class="btn-primary">Verify Code</button>
            <button id="backToEmailBtn" class="btn-secondary">Back to Email</button>
        `;
    }
    
    // Re-attach event listeners
    setupEventListeners();
}

// Paste current page URL and title into description
async function pasteCurrentPageToDescription() {
    try {
        const descriptionTextarea = document.getElementById('taskDescription');
        const pasteBtn = document.getElementById('pasteUrlBtn');
        
        if (!descriptionTextarea) {
            showStatusMessage('Description field not found', 'error');
            return;
        }
        
        // Get current page info
        console.log('Getting current page info for pasting...');
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tabs && tabs.length > 0 && tabs[0]) {
            const tab = tabs[0];
            const currentUrl = tab.url || '';
            const pageTitle = tab.title || '';
            
            // Skip chrome internal pages
            if (currentUrl.startsWith('chrome://') || currentUrl.startsWith('chrome-extension://')) {
                showStatusMessage('Cannot paste URL from chrome internal pages', 'error');
                return;
            }
            
            if (currentUrl) {
                // Format the text to paste
                const textToPaste = pageTitle 
                    ? `${pageTitle}\n${currentUrl}` 
                    : currentUrl;
                
                // Insert at cursor position or append
                const currentText = descriptionTextarea.value;
                
                if (currentText.trim()) {
                    // Add to existing text with proper spacing
                    const newText = currentText + '\n\n' + textToPaste;
                    descriptionTextarea.value = newText;
                } else {
                    // Replace empty description
                    descriptionTextarea.value = textToPaste;
                }
                
                // Focus the textarea and move cursor to end
                descriptionTextarea.focus();
                descriptionTextarea.setSelectionRange(descriptionTextarea.value.length, descriptionTextarea.value.length);
                
                // Visual feedback on button
                if (pasteBtn) {
                    const originalText = pasteBtn.innerHTML;
                    pasteBtn.innerHTML = '✅ Pasted!';
                    pasteBtn.disabled = true;
                    
                    setTimeout(() => {
                        pasteBtn.innerHTML = originalText;
                        pasteBtn.disabled = false;
                    }, 1500);
                }
                
                showStatusMessage('🔗 Page URL pasted to description!', 'success');
                console.log('Pasted page info:', { title: pageTitle, url: currentUrl });
                
            } else {
                showStatusMessage('No URL found for current page', 'error');
            }
        } else {
            showStatusMessage('No active tab found', 'error');
        }
        
    } catch (error) {
        console.error('Error pasting page info:', error);
        showStatusMessage('Failed to paste page URL', 'error');
    }
} 