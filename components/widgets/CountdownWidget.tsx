import React from 'react';

export function CountdownWidget() {
  // À personnaliser : date cible, style, etc.
  return (
    <div style={{ padding: 16, background: '#fffbe6', borderRadius: 8, textAlign: 'center' }}>
      <h3 style={{ fontWeight: 700, fontSize: 20 }}>⏳ Compte à rebours</h3>
      <p>Le widget de compte à rebours sera affiché ici.</p>
    </div>
  );
}
