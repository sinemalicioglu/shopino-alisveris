// src/LoginForm.jsx
import React from 'react';
import './style.css'; 

function LoginForm({ showLoginForm, setShowLoginForm, handleLoginSubmit, loginErrorMessage }) {
  if (!showLoginForm) return null;

  return (
    <div className="form-container" style={{ display: 'flex' }}>
      <div className="form-content">
        <span className="form-kapat" onClick={() => { setShowLoginForm(false);}}>&times;</span>
        <h2>Giriş Yap</h2>
        {loginErrorMessage && <div className="error-message" style={{ display: 'block' }}>{loginErrorMessage}</div>}
        <form onSubmit={handleLoginSubmit}>
          <div className="form-grup">
            <label htmlFor="girisEmail">E-posta:</label>
            <input type="email" id="girisEmail" name="girisEmail" required />
          </div>
          <div className="form-grup">
            <label htmlFor="girisSifre">Şifre:</label>
            <input type="password" id="girisSifre" name="girisSifre" required />
          </div>
          <button type="submit">Giriş Yap</button>
        </form>
      </div>
    </div>
  );
}

export default LoginForm;