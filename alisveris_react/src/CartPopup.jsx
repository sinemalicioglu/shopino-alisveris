// src/CartPopup.jsx
import React from 'react';
import './style.css'; // Global stiller için

function CartPopup({
  showCartPopup,
  setShowCartPopup,
  cartItems,
  removeFromCart,
  updateQuantity,
  calculateTotalCartPrice,
  handleCheckout
}) {
  if (!showCartPopup) return null; // Eğer gösterilmeyecekse hiçbir şey render etme

  return (
    <div className="form-container" style={{ display: 'flex' }}>
      <div className="form-content">
        <span className="form-kapat" onClick={() => setShowCartPopup(false)}>&times;</span>
        <h2>Sepetim</h2>
        <div id="sepetUrunleri" className="sepet-urun-listesi">
          {cartItems.length > 0 ? (
            cartItems.map(item => (
              <div className="sepet-urun-item" key={item.id}>
                <img src={item.imageUrl} alt={item.name} />
                <div className="sepet-urun-info">
                  <h4>{item.name}</h4>
                  <p>{item.price.toFixed(2)} TL</p>
                </div>
                <div className="sepet-urun-miktar-kontrol">
                  <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                </div>
                <button className="sepet-urun-cikar" onClick={() => removeFromCart(item.id)}>X</button>
              </div>
            ))
          ) : (
            <p className="sepet-bos-mesaj" style={{ display: 'block' }}>Sepetinizde ürün bulunmamaktadır.</p>
          )}
        </div>
        <div className="sepet-ozet" style={{ display: cartItems.length > 0 ? 'block' : 'none' }}>
          <p>Toplam Tutar: <span id="sepetToplamFiyat">{calculateTotalCartPrice()}</span> TL</p>
          <button id="alisveriseDevamBtn" className="alisverise-devam-btn" onClick={() => setShowCartPopup(false)}>Alışverişe Devam Et</button>
          <button id="odemeyiTamamlaBtn" className="odemeyi-tamamla-btn" onClick={handleCheckout}>Ödemeyi Tamamla</button>
        </div>
      </div>
    </div>
  );
}

export default CartPopup;