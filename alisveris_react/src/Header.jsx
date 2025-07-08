// src/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './style.css'; 

function Header({
  currentUser,
  getCartItemCount,
  handleLogout,
  setShowLoginForm,
  setShowRegisterForm,
  setShowCartPopup,
  activeCategoryKey,
  productsFrontendCategories,
  setActiveCategoryKey
}) {
  return (
    <header>
      <div className="logo">
        <Link to="/" onClick={() => setActiveCategoryKey('anasayfa')}>
          <img src="logo.png" alt="Shopino Logo" className="header-logo" />
        </Link>
      </div>
      <nav>
        <ul>
          <li><Link to="/" onClick={() => setActiveCategoryKey('anasayfa')} className={activeCategoryKey === 'anasayfa' ? 'active-category' : ''}>Anasayfa</Link></li>
          {Object.keys(productsFrontendCategories).filter(key => key !== 'anasayfa').map(categoryKey => (
            <li key={categoryKey}>
              <Link
                to={`/category/${categoryKey}`}
                data-category={categoryKey}
                className={activeCategoryKey === categoryKey ? 'active-category' : ''}
                onClick={() => setActiveCategoryKey(categoryKey)}
              >
                {productsFrontendCategories[categoryKey].displayName}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="account" id="headerAccount">
        {currentUser ? (
          <div id="loggedInContent" style={{ display: 'flex' }}>
            <Link to="/profile" className="user-info" style={{cursor: 'pointer', textDecoration: 'none', color: '#096B68', fontWeight: 'bold'}}>{`Merhaba, ${currentUser}!`}</Link>
            <button id="sepetBtn" className="cart-button" onClick={() => setShowCartPopup(true)}>
              <i className="fas fa-shopping-cart"></i> <span id="cartItemCount" className="cart-count">{getCartItemCount()}</span>
            </button>
            <button id="cikisYapBtn" className="logout-button" onClick={handleLogout}>Çıkış Yap</button>
          </div>
        ) : (
          activeCategoryKey !== 'anasayfa' && (
            <div id="loggedOutContent" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                className="logout-button"
                onClick={() => setShowLoginForm(true)}
                style={{ padding: '8px 12px', fontSize: '0.85em' }}
              >
                Giriş Yap
              </button>
              <button
                className="logout-button"
                onClick={() => setShowRegisterForm(true)}
                style={{ padding: '8px 12px', fontSize: '0.85em' }}
              >
                Kayıt Ol
              </button>
            </div>
          )
        )}
      </div>
    </header>
  );
}

export default Header;
