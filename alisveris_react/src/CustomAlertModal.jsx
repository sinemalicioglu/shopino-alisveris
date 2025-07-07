// src/CustomAlertModal.jsx
import React from 'react';
import './style.css'; // Global stiller için

function CustomAlertModal({ show, message, onClose }) {
  if (!show) {
    return null; // Eğer modal gösterilmeyecekse hiçbir şey render etme
  }

  return (
    <div className="form-container" style={{ display: 'flex' }}> {/* Mevcut form-container stilini kullanıyoruz */}
      <div className="form-content" style={{ textAlign: 'center', padding: '30px', maxWidth: '400px' }}>
        <h2 style={{ color: '#096B68', marginBottom: '20px' }}>Bilgilendirme</h2>
        <p style={{ fontSize: '1.1em', color: '#343a40', marginBottom: '30px' }}>{message}</p>
        <button
          onClick={onClose}
          style={{
            backgroundColor: '#096B68',
            color: '#fff',
            border: 'none',
            padding: '10px 25px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '1em',
            fontWeight: '600',
            transition: 'background-color 0.3s ease, transform 0.1s ease',
          }}
        >
          Tamam
        </button>
      </div>
    </div>
  );
}

export default CustomAlertModal;