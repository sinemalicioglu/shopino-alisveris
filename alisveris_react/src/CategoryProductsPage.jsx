// src/CategoryProductsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './style.css';

import ProductCard from './ProductCard';
import SubcategoryButtons from './SubcategoryButtons';

function CategoryProductsPage({ productsFrontendCategories, fetchProducts, addToCart }) {
  const { categoryKey } = useParams();
  const [currentSubcategory, setCurrentSubcategory] = useState('Tümü');
  const [componentProducts, setComponentProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  
  useEffect(() => {
    setCurrentSubcategory('Tümü');
  }, [categoryKey]);

  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true);
      console.log(`CategoryProductsPage: Fetching products for category: ${categoryKey}, subcategory: ${currentSubcategory}`);
      const data = await fetchProducts(categoryKey, currentSubcategory);
      setComponentProducts(data);
      setLoadingProducts(false);
    };

    if (categoryKey) {
      loadProducts();
    }
  }, [categoryKey, currentSubcategory, fetchProducts]);

  const handleSubcategoryClick = (sub) => {
    console.log(`CategoryProductsPage: Subcategory clicked: ${sub}`);
    setCurrentSubcategory(sub);
  };

  const categoryDisplayName = productsFrontendCategories[categoryKey]?.displayName || 'Kategori';
  const subcategories = productsFrontendCategories[categoryKey]?.subcategories || [];

  return (
    <section className="urun-sayfasi">
      <div className="sol-menu">
        <h2>{categoryDisplayName}</h2>
        <SubcategoryButtons
          subcategories={subcategories}
          currentSubcategory={currentSubcategory}
          onSubcategoryClick={handleSubcategoryClick}
        />
      </div>
      <div className="urun-icerik">
        <h2>{categoryDisplayName} Ürünleri</h2>
        {loadingProducts ? (
          <p style={{ textAlign: 'center', fontSize: '1.2em', color: '#096B68' }}>Ürünler Yükleniyor...</p>
        ) : componentProducts.length > 0 ? (
          <div className="urun-grid">
            {componentProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                addToCart={addToCart}
              />
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#6c757d' }}>Bu kategoride ürün bulunmamaktadır.</p>
        )}
      </div>
    </section>
  );
}

export default CategoryProductsPage;
