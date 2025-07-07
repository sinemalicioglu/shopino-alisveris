// src/ProductCard.jsx
import React from 'react';
import './style.css'; // Global stiller için

function ProductCard({ product, addToCart }) {
  return (
    <div className="urun-karti">
      <img src={product.imageUrl} alt={product.name} />
      <h3>{product.name}</h3>
      <p className="fiyat">{product.price.toFixed(2)} TL</p>
      <button onClick={() => addToCart(product)}>Sepete Ekle</button>
    </div>
  );
}

export default ProductCard;