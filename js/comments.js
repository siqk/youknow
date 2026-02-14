// Add comment
async function addComment(pasteId) {
  if (!currentUser) {
    showLogin();
    return;
  }

  const content = document.getElementById('newComment')?.value.trim();
  if (!content) return;

  try {
    const { error } = await supabaseClient
      .from('comments')
      .insert([{
        paste_id: pasteId,
        user_id: currentUser.id,
        author: currentProfile?.username || 'Anonymous',
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
  try {
    const { data, error } = await supabaseClient
      .from('comments')
      .select('*, profiles(username, email)')
      .eq('paste_id', pasteId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error loading comments:', error);
    return [];
  }
}