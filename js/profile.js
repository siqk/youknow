// Load user profile
async function loadUserProfile(userId) {
  try {
    const { data: profile, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    const { data: pastes } = await supabaseClient
      .from('pastes')
      .select('*, comments(count)')
      .eq('user_id', userId)
      .eq('is_private', false)
      .order('created_at', { ascending: false });

    displayProfile(profile, pastes);
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

// Display profile
function displayProfile(profile, pastes) {
  const isRich = profile.email === RICH_USER_EMAIL;
  const isOwnProfile = currentUser && currentUser.id === profile.id;
  const container = document.getElementById('profileViewContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="profile-view">
      <div class="profile-left">
        <div class="profile-avatar-large" ${isOwnProfile ? 'onclick="document.getElementById(\'avatarUpload\').click()"' : ''}>
          ${profile.avatar_url ? 
            `<img src="${profile.avatar_url}" alt="Avatar">` : 
            `<span>${profile.username ? profile.username.charAt(0).toUpperCase() : '👤'}</span>`
          }
        </div>
        ${isOwnProfile ? `
          <input type="file" id="avatarUpload" class="hidden" accept="image/*" onchange="handleAvatarUpload(event)">
        ` : ''}
        
        <div class="profile-username-large">
          <span class="${isRich ? 'username-white' : 'username-blue'}">${escapeHtml(profile.username || 'Anonymous')}</span>
          ${isRich ? '<span class="rich-badge">[RICH]</span>' : ''}
        </div>
        <div class="profile-uid">UID: ${profile.id.substring(0, 8)}</div>
        
        <div class="profile-stats">
          <div class="stat">
            <div class="stat-value">${pastes?.length || 0}</div>
            <div class="stat-label">PASTES</div>
          </div>
        </div>

        <div class="profile-bio">
          ${profile.bio ? escapeHtml(profile.bio) : 'No bio yet.'}
        </div>

        ${isOwnProfile ? `
          <button class="comment-btn" style="width: 100%;" onclick="toggleEditProfile()" id="profileEditBtn">Edit Profile</button>
          
          <div id="profileEditForm" class="edit-form hidden">
            <input type="text" id="editUsernameInput" placeholder="Username" value="${escapeHtml(profile.username || '')}">
            <textarea id="editBioInput" placeholder="Bio">${escapeHtml(profile.bio || '')}</textarea>
            <button class="primary" onclick="saveProfileChanges()">Save Changes</button>
            <button onclick="toggleEditProfile()">Cancel</button>
          </div>
        ` : ''}

        <div class="share-url">
          <input type="text" id="profileShareUrl" value="${window.location.origin}/user/${profile.id}" readonly>
          <button onclick="copyProfileUrl()">Copy</button>
        </div>
      </div>

      <div class="profile-right">
        <h3>Recent Pastes</h3>
        <div id="userPastesContainer">
          ${pastes && pastes.length > 0 ? 
            pastes.slice(0, 5).map(paste => {
              const commentCount = paste.comments?.[0]?.count || 0;
              const cleanTitle = paste.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
              return `
                <div style="padding: 10px; border-bottom: 1px solid #222;">
                  <div style="color: #fff; cursor: pointer;" onclick="window.location.href='/${cleanTitle}'">${escapeHtml(paste.title)}</div>
                  <div style="color: #888; font-size: 11px;">
                    ${new Date(paste.created_at).toLocaleDateString()} · ${paste.views || 0} views · ${commentCount} comments
                  </div>
                </div>
              `;
            }).join('') : 
            '<p>No public pastes yet.</p>'
          }
        </div>
      </div>
    </div>
  `;
}

// Toggle edit profile
function toggleEditProfile() {
  const form = document.getElementById('profileEditForm');
  const btn = document.getElementById('profileEditBtn');
  
  if (form.classList.contains('hidden')) {
    form.classList.remove('hidden');
    btn.textContent = 'Cancel';
  } else {
    form.classList.add('hidden');
    btn.textContent = 'Edit Profile';
  }
}

// Save profile changes
async function saveProfileChanges() {
  const username = document.getElementById('editUsernameInput').value.trim();
  const bio = document.getElementById('editBioInput').value.trim();

  try {
    const { error } = await supabaseClient
      .from('profiles')
      .update({
        username: username || null,
        bio: bio || null
      })
      .eq('id', currentUser.id);

    if (error) throw error;

    alert('Profile updated!');
    window.location.reload();
  } catch (error) {
    alert(error.message);
  }
}

// Copy profile URL
function copyProfileUrl() {
  const urlInput = document.getElementById('profileShareUrl');
  urlInput.select();
  document.execCommand('copy');
  alert('Profile URL copied!');
}

// Handle avatar upload
async function handleAvatarUpload(event) {
  const file = event.target.files[0];
  if (!file || !currentUser) return;

  const isRich = currentUser.email === RICH_USER_EMAIL;
  const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');

  if (isGif && !isRich) {
    alert('Only RICH users can upload GIFs');
    return;
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabaseClient.storage
      .from('avatars')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabaseClient.storage
      .from('avatars')
      .getPublicUrl(fileName);

    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', currentUser.id);

    if (updateError) throw updateError;

    alert('Avatar updated!');
    window.location.reload();
  } catch (error) {
    alert(error.message);
  }
}