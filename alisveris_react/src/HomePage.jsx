// src/HomePage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './style.css'; 

function HomePage({ currentUser, setShowLoginForm, setShowRegisterForm }) {
  const handleLoginClick = typeof setShowLoginForm === 'function' ? setShowLoginForm : () => console.error("setShowLoginForm is not a function");
  const handleRegisterClick = typeof setShowRegisterForm === 'function' ? setShowRegisterForm : () => console.error("setShowRegisterForm is not a function");

  return (
    <section className="anasayfa-yeni">
      <div className="sol-bolum">
        <div className="logo-anasayfa">
          <img src="logo.png" alt="Shopino Logo" />
        </div>
        <p className="slogan-anasayfa">Aradığınız her şey burada!</p>
      </div>
      <div className="sag-bolum">
        <h2 className="baslik-anasayfa">Alışverişe Başla</h2>
        {!currentUser && (
          <div className="hesap-islemleri-anasayfa">
            <button onClick={handleLoginClick}>Giriş Yap</button> 
            <button onClick={handleRegisterClick}>Kayıt Ol</button> 
          </div>
        )}
      </div>
    </section>
  );
}

export default HomePage;
