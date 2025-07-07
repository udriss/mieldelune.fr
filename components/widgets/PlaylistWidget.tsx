import React from 'react';

export function PlaylistWidget() {
  // À personnaliser : intégration Spotify, SoundCloud, etc.
  return (
    <div style={{ padding: 16, background: '#e6f7ff', borderRadius: 8, textAlign: 'center' }}>
      <h3 style={{ fontWeight: 700, fontSize: 20 }}>🎵 Playlist musicale</h3>
      <p>Le widget de playlist musicale sera affiché ici.</p>
    </div>
  );
}
