// Load all public pastes
async function loadAllPastes() {
  try {
    const { data, error } = await supabaseClient
      .from('pastes')
      .select('*, profiles!inner(username, email, avatar_url), comments(count)')
      .eq('is_private', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tbody = document.getElementById('allPastesList');
    
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No pastes yet. Be the first to upload!</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(paste => {
      const isRich = paste.profiles?.email === RICH_USER_EMAIL;
      const commentCount = paste.comments?.[0]?.count || 0;
      const cleanTitle = encodeURIComponent(paste.title.toLowerCase().replace(/[^a-z0-9]/g, '-'));
      return `
        <tr>
          <td class="title" onclick="window.location.href='/${cleanTitle}'">${escapeHtml(paste.title)}</td>
          <td class="comment-count">${commentCount}</td>
          <td class="views">${paste.views || 0}</td>
          <td>
            <span class="${isRich ? 'username-white' : 'username-blue'}">${escapeHtml(paste.profiles?.username || 'Anonymous')}</span>
            ${isRich ? '<span class="rich-badge">[RICH]</span>' : ''}
          </td>
          <td class="date">${new Date(paste.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
        </tr>
      `;
    }).join('');
    
    // Update total pastes count
    const totalPastes = document.getElementById('totalPastes');
    if (totalPastes) totalPastes.textContent = data.length;
  } catch (error) {
    console.error('Error loading pastes:', error);
  }
}

// Load paste by title
async function loadPasteByTitle(title) {
  try {
    const decodedTitle = decodeURIComponent(title).replace(/-/g, ' ');
    
    const { data: paste, error } = await supabaseClient
      .from('pastes')
      .select('*, profiles!inner(username, email, avatar_url)')
      .eq('title', decodedTitle)
      .eq('is_private', false)
      .single();

    if (error) throw error;

    // Increment views
    try {
      await supabaseClient.rpc('increment_paste_views', { paste_id: paste.id });
    } catch (e) {
      console.warn('Could not increment views:', e);
    }

    // Load comments
    const { data: comments } = await supabaseClient
      .from('comments')
      .select('*, profiles(username, email)')
      .eq('paste_id', paste.id)
      .order('created_at', { ascending: true });

    displayPaste(paste, comments);
  } catch (error) {
    console.error('Error loading paste:', error);
    window.location.href = '/';
  }
}

// Display paste
function displayPaste(paste, comments) {
  const isRich = paste.profiles?.email === RICH_USER_EMAIL;
  const container = document.getElementById('pasteViewContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="paste-view">
      <div class="paste-header">
        <h1 class="paste-title">${escapeHtml(paste.title)}</h1>
        <div class="paste-meta">
          <span>👁️ ${paste.views || 0}</span>
          <span>💬 ${comments?.length || 0}</span>
          <span>📅 ${new Date(paste.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      <div class="paste-content">
        ${escapeHtml(paste.content)}
      </div>
      <div style="margin-top: 15px; color: #888;">
        Created by: 
        <span class="${isRich ? 'username-white' : 'username-blue'}">${escapeHtml(paste.profiles?.username || 'Anonymous')}</span>
        ${isRich ? '<span class="rich-badge">[RICH]</span>' : ''}
      </div>

      <!-- COMMENTS SECTION -->
      <div class="comments-section">
        <h3 style="color: #fff; margin-bottom: 15px;">Comments (${comments?.length || 0})</h3>
        
        ${currentUser ? `
          <div>
            <textarea id="newComment" class="comment-input" placeholder="Add a comment..."></textarea>
            <button class="comment-btn" onclick="addComment('${paste.id}')">Post Comment</button>
          </div>
        ` : `
          <p style="color: #888; margin: 10px 0;">Login to add comments</p>
        `}

        <div id="commentsList" style="margin-top: 20px;">
          ${comments && comments.length > 0 ? comments.map(comment => {
            const isCommentRich = comment.profiles?.email === RICH_USER_EMAIL;
            return `
              <div class="comment">
                <div class="comment-header">
                  <span class="comment-author ${isCommentRich ? 'username-white' : 'username-blue'}">
                    ${escapeHtml(comment.profiles?.username || 'Anonymous')}
                    ${isCommentRich ? '<span class="rich-badge">[RICH]</span>' : ''}
                  </span>
                  <span>${new Date(comment.created_at).toLocaleString()}</span>
                </div>
                <div class="comment-content">${escapeHtml(comment.content)}</div>
              </div>
            `;
          }).join('') : '<p style="color: #888;">No comments yet.</p>'}
        </div>
      </div>
    </div>
  `;
}

// Upload paste
async function uploadPaste() {
  if (!currentUser) {
    showLogin();
    return;
  }

  const title = document.getElementById('pasteTitle')?.value.trim();
  const content = document.getElementById('pasteContent')?.value.trim();
  const isPrivate = document.getElementById('privatePaste')?.checked;

  if (!title || !content) {
    showMessage('uploadMessage', 'Title and content required', 'error');
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from('pastes')
      .insert([{
        title,
        content,
        is_private: isPrivate,
        user_id: currentUser.id,
        username: currentProfile?.username || 'Anonymous',
        views: 0,
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;

    showMessage('uploadMessage', 'Paste uploaded successfully!', 'success');
    document.getElementById('pasteTitle').value = '';
    document.getElementById('pasteContent').value = '';
    document.getElementById('privatePaste').checked = false;
    
    // Redirect to new paste
    if (data && data[0]) {
      const cleanTitle = data[0].title.toLowerCase().replace(/[^a-z0-9]/g, '-');
      setTimeout(() => {
        window.location.href = `/${cleanTitle}`;
      }, 1000);
    }
  } catch (error) {
    showMessage('uploadMessage', error.message, 'error');
  }
}

// Search pastes
async function searchPastes() {
  const query = document.getElementById('searchInput')?.value.trim();
  const searchTitle = document.getElementById('searchTitle')?.checked;
  
  if (!query) {
    loadAllPastes();
    return;
  }

  try {
    let data, error;
    
    if (searchTitle) {
      ({ data, error } = await supabaseClient
        .from('pastes')
        .select('*, profiles!inner(username, email, avatar_url), comments(count)')
        .eq('is_private', false)
        .ilike('title', `%${query}%`)
        .order('created_at', { ascending: false }));
    } else {
      ({ data, error } = await supabaseClient
        .from('pastes')
        .select('*, profiles!inner(username, email, avatar_url), comments(count)')
        .eq('is_private', false)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false }));
    }

    if (error) throw error;

    const tbody = document.getElementById('allPastesList');
    
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No pastes found</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(paste => {
      const isRich = paste.profiles?.email === RICH_USER_EMAIL;
      const commentCount = paste.comments?.[0]?.count || 0;
      const cleanTitle = paste.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
      return `
        <tr>
          <td class="title" onclick="window.location.href='/${cleanTitle}'">${escapeHtml(paste.title)}</td>
          <td>${commentCount}</td>
          <td>${paste.views || 0}</td>
          <td>
            <span class="${isRich ? 'username-white' : 'username-blue'}">${escapeHtml(paste.profiles?.username || 'Anonymous')}</span>
            ${isRich ? '<span class="rich-badge">[RICH]</span>' : ''}
          </td>
          <td>${new Date(paste.created_at).toLocaleDateString()}</td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Error searching:', error);
  }
}