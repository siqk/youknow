// Global variables
let onlineUsers = [];

// Load components
async function loadComponents() {
  try {
    // Load navbar
    const navbar = document.getElementById('navbar');
    if (navbar) {
      const response = await fetch('/components/navbar.html');
      const html = await response.text();
      navbar.innerHTML = html;
      updateNavbar();
    }

    // Load ticker
    const ticker = document.getElementById('ticker');
    if (ticker) {
      const response = await fetch('/components/ticker.html');
      const html = await response.text();
      ticker.innerHTML = html;
      updateStats();
    }

    // Load footer
    const footer = document.getElementById('footer');
    if (footer) {
      const response = await fetch('/components/footer.html');
      const html = await response.text();
      footer.innerHTML = html;
    }
  } catch (error) {
    console.error('Error loading components:', error);
  }
}

// Update stats
async function updateStats() {
  try {
    const { count: userCount } = await window.supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: pasteCount } = await window.supabaseClient
      .from('pastes')
      .select('*', { count: 'exact', head: true })
      .eq('is_private', false);

    const totalUsers = document.getElementById('totalUsers');
    const totalPastes = document.getElementById('totalPastes');
    
    if (totalUsers) totalUsers.textContent = userCount || 0;
    if (totalPastes) totalPastes.textContent = pasteCount || 0;
  } catch (error) {
    console.error('Error updating stats:', error);
  }
}

// Update online users
async function updateOnlineUsers() {
  try {
    const { data } = await window.supabaseClient
      .from('profiles')
      .select('id')
      .limit(20);
      
    onlineUsers = data
      ?.map(u => u.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 10) + 5) || [];
    
    const onlineNow = document.getElementById('onlineNow');
    if (onlineNow) onlineNow.textContent = onlineUsers.length;
  } catch (error) {
    console.error('Error updating online users:', error);
  }
}

// Load users list
async function loadUsers() {
  try {
    const { data, error } = await window.supabaseClient
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const usersList = document.getElementById('usersList');
    if (!usersList) return;
    
    usersList.innerHTML = data.map(user => {
      const isRich = user.email === window.RICH_USER_EMAIL;
      const isOnline = onlineUsers.includes(user.id);
      return `
        <div class="user-card" onclick="window.location.href='/user/${user.id}'">
          <div class="user-avatar">
            ${user.avatar_url ? `<img src="${user.avatar_url}">` : '👤'}
          </div>
          <div class="user-name ${isRich ? 'username-white' : 'username-blue'}">
            ${escapeHtml(user.username || 'Anonymous')}
            ${isRich ? '<span class="rich-badge">[RICH]</span>' : ''}
            ${isOnline ? '<span style="color: #0f0;">●</span>' : ''}
          </div>
          <div class="user-joined">
            Joined: ${new Date(user.created_at).toLocaleDateString()}
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

// Escape HTML
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Show message
function showMessage(elementId, message, type) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
    element.className = `message ${type}`;
    element.classList.remove('hidden');
    setTimeout(() => element.classList.add('hidden'), 5000);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Wait for supabaseClient to be available
  if (!window.supabaseClient) {
    console.error('Supabase client not loaded');
    return;
  }

  await loadComponents();
  
  // Load page-specific content
  const path = window.location.pathname;
  
  if (path === '/' || path === '/index.html') {
    if (typeof loadAllPastes === 'function') {
      await loadAllPastes();
    }
  } else if (path === '/users.html') {
    if (typeof loadUsers === 'function') {
      await loadUsers();
    }
  }
  
  // Start online users updates
  updateOnlineUsers();
  setInterval(updateOnlineUsers, 30000);
});

// Make main functions globally available
window.escapeHtml = escapeHtml;
window.showMessage = showMessage;
window.loadUsers = loadUsers;
window.updateStats = updateStats;