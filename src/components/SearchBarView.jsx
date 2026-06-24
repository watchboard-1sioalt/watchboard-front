import React from 'react';

export default function SearchBarView({ value, onChange, onClear, placeholder = "Rechercher..." }) {
  return (
    <div style={styles.searchWrapper}>
      {/* Icône Loupe */}
      
      {/* Champ de saisie */}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.input}
      />

      {/* Bouton pour vider le champ (affiché uniquement s'il y a du texte) */}
      {value && (
        <button onClick={onClear} style={styles.clearButton} title="Effacer">
          X
        </button>
      )}
    </div>
  );
}

// Styles CSS-in-JS épurés et modernes
const styles = {
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#ffffff', // Gris clair style Google
    borderRadius: '24px',       // Bords très arrondis pour un look moderne
    padding: '8px 16px',
    border: '1px solid transparent',
    transition: 'all 0.2s ease',
    maxWidth: '1000px',
    margin: '10px 0',
  },
  icon: {
    fontSize: '16px',
    marginRight: '12px',
    color: '#5f6368',
    userSelect: 'none',
  },
  input: {
    border: 'none',
    background: 'transparent',
    outline: 'none',
    width: '100%',
    fontSize: '16px',
    color: '#3c4043',
    padding: '4px 0',
  },
  clearButton: {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#70757a',
    padding: '4px 8px',
    marginLeft: '8px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  },
};