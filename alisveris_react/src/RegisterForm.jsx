// src/RegisterForm.jsx
import React from 'react';
import './style.css'; 

function RegisterForm({ showRegisterForm, setShowRegisterForm, handleRegisterSubmit, registerErrorMessage }) {
  if (!showRegisterForm) return null; 

  return (
    <div className="form-container" style={{ display: 'flex' }}>
      <div className="form-content">
        <span className="form-kapat" onClick={() => { setShowRegisterForm(false);}}>&times;</span>
        <h2>Kayıt Ol</h2>
        {registerErrorMessage && <div className="error-message" style={{ display: 'block' }}>{registerErrorMessage}</div>}
        <form onSubmit={handleRegisterSubmit}>
          <div className="form-grup">
            <label htmlFor="firstName">İsim:</label>
            <input type="text" id="firstName" name="firstName" required />
          </div>
          <div className="form-grup">
            <label htmlFor="lastName">Soyisim:</label>
            <input type="text" id="lastName" name="lastName" required />
          </div>
          <div className="form-grup">
            <label htmlFor="email">E-posta:</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div className="form-grup">
            <label htmlFor="sifre">Şifre:</label>
            <input type="password" id="sifre" name="sifre" required />
          </div>
          <div className="form-grup">
            <label htmlFor="sifreTekrar">Şifre Tekrar:</label>
            <input type="password" id="sifreTekrar" name="sifreTekrar" required />
          </div>
          <button type="submit">Kayıt Ol</button>
        </form>
      </div>
    </div>
  );
}

export default RegisterForm;