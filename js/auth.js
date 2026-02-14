// Auth state
let currentUser = null;
let currentProfile = null;

// Check if user is Rich
function isRichUser(email) {
  return email === window.RICH_USER_EMAIL;
}

// Load user profile
async function loadUserProfile() {
  if (!currentUser) return;
  
  try {
    const { data, error } = await window.supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();
      
    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist, create it
      const { error: insertError } = await window.supabaseClient
        .from('profiles')
        .insert([{
          id: currentUser.id,
          email: currentUser.email,
          username: currentUser.email.split('@')[0],
          created_at: new Date().toISOString()
        }]);
        
      if (!insertError) {
        const { data: newProfile } = await window.supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        currentProfile = newProfile;
      }
    } else if (error) {
      console.error('Error loading profile:', error);
    } else {
      currentProfile = data;
    }
  } catch (error) {
    console.error('Error in loadUserProfile:', error);
  }
}

// Handle signup
async function handleSignup() {
  const email = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;

  if (!email || !password) {
    showModalMessage('Email and password required', 'error');
    return;
  }

  if (password.length < 6) {
    showModalMessage('Password must be at least 6 characters', 'error');
    return;
  }

  try {
    const { data, error } = await window.supabaseClient.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: window.location.origin
      }
    });

    if (error) throw error;

    if (data.user) {
      // Create profile
      const { error: profileError } = await window.supabaseClient
        .from('profiles')
        .upsert([{
          id: data.user.id,
          email: email,
          username: email.split('@')[0],
          created_at: new Date().toISOString()
        }]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }
    }

    showModalMessage('Signup successful! Check email for confirmation.', 'success');
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
  } catch (error) {
    showModalMessage(error.message, 'error');
  }
}

// Handle login
async function handleLogin() {
  const email = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;

  if (!email || !password) {
    showModalMessage('Email and password required', 'error');
    return;
  }

  try {
    const { data, error } = await window.supabaseClient.auth.signInWithPassword({ 
      email, 
      password 
    });

    if (error) throw error;
    
    showModalMessage('Login successful!', 'success');
    
    setTimeout(async () => {
      closeLoginModal();
      currentUser = data.user;
      await loadUserProfile();
      updateNavbar();
      window.location.href = '/';
    }, 1000);
  } catch (error) {
    showModalMessage(error.message, 'error');
  }
}

// Handle logout
async function handleLogout() {
  try {
    await window.supabaseClient.auth.signOut();
    currentUser = null;
    currentProfile = null;
    updateNavbar();
    window.location.href = '/';
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Show login modal
function showLogin() {
  document.getElementById('loginModal').classList.remove('hidden');
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
}

// Close login modal
function closeLoginModal() {
  document.getElementById('loginModal').classList.add('hidden');
}

// Show message in modal
function showModalMessage(message, type) {
  const msgEl = document.getElementById('modalAuthMessage');
  msgEl.textContent = message;
  msgEl.className = `message ${type}`;
  msgEl.classList.remove('hidden');
  setTimeout(() => msgEl.classList.add('hidden'), 5000);
}

// Update navbar based on auth
function updateNavbar() {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const profileLink = document.getElementById('profileLink');

  if (currentUser) {
    if (loginBtn) loginBtn.classList.add('hidden');
    if (logoutBtn) logoutBtn.classList.remove('hidden');
    if (profileLink) profileLink.classList.remove('hidden');
  } else {
    if (loginBtn) loginBtn.classList.remove('hidden');
    if (logoutBtn) logoutBtn.classList.add('hidden');
    if (profileLink) profileLink.classList.add('hidden');
  }
}

// Auth state change listener
window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session) {
    currentUser = session.user;
    await loadUserProfile();
    updateNavbar();
  } else if (event === 'SIGNED_OUT') {
    currentUser = null;
    currentProfile = null;
    updateNavbar();
  }
});

// Make auth functions globally available
window.showLogin = showLogin;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.handleLogout = handleLogout;
window.closeLoginModal = closeLoginModal;