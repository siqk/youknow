// Wait for supabase
function waitForSupabase(callback) {
  if (window.supabaseClient) {
    callback();
  } else {
    window.addEventListener('supabaseReady', callback);
  }
}

// Add comment
async function addComment(pasteId) {
  if (!window.currentUser) {
    window.showLogin();
    return;
  }

  const content = document.getElementById('newComment')?.value.trim();
  if (!content) return;

  try {
    const { error } = await window.supabaseClient
      .from('comments')
      .insert([{
        paste_id: pasteId,
        user_id: window.currentUser.id,
        author: window.currentProfile?.username || 'Anonymous',
        content: content,
        created_at: new Date().toISOString()
      }]);

    if (error) throw error;

    // Refresh page to show new comment
    window.location.reload();
  } catch (error) {
    console.error('Error adding comment:', error);
    alert('Error adding comment');
  }
}

// Load comments for a paste
async function loadComments(pasteId) {
  if (!window.supabaseClient) return [];
  
  try {
    const { data, error } = await window.supabaseClient
      .from('comments')
      .select('*, profiles(username, email)')
      .eq('paste_id', pasteId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading comments:', error);
    return [];
  }
}

// Make functions globally available
window.addComment = addComment;
window.loadComments = loadComments;