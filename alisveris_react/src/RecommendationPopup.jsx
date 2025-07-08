// src/RecommendationPopup.jsx
import React from 'react';
import './style.css'; 

function RecommendationPopup({
  showRecommendationPopup,
  setShowRecommendationPopup,
  recommendedProducts,
  addToCart,
  handleAddRecommendedToCart
}) {
  if (!showRecommendationPopup) return null; 

  return (
    <div className="form-container" style={{ display: 'flex' }}>
      <div className="form-content">
        <span className="form-kapat" onClick={() => setShowRecommendationPopup(false)}>&times;</span>
        <h2>Sizin İçin Önerilen Ürünler</h2>
        <div className="onerilen-urun-grid urun-grid" id="onerilenUrunGridPopUp">
          {recommendedProducts.length > 0 ? (
            recommendedProducts.map(product => (
              <div className="urun-karti" key={product.id}>
                <img src={product.imageUrl} alt={product.name} />
                <h3>{product.name}</h3>
                <p className="fiyat">{product.price.toFixed(2)} TL</p>
                <button onClick={() => addToCart(product)}>Sepete Ekle</button>
              </div>
            ))
          ) : (
            <p>Önerilen ürün bulunmamaktadır.</p>
          )}
        </div>
        <div className="öneri-popup-alt-butonlar">
          <button id="oneriyiKapatBtn" className="alisverise-devam-btn" onClick={() => setShowRecommendationPopup(false)}>Kapat</button>
          <button id="onerilenleriSepeteEkleBtn" className="odemeyi-tamamla-btn" onClick={handleAddRecommendedToCart}>Önerilenleri Sepete Ekle</button>
        </div>
      </div>
    </div>
  );
}

export default RecommendationPopup;