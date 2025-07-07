// src/SubcategoryButtons.jsx
import React from 'react';
import './style.css'; // Global stiller için

function SubcategoryButtons({ subcategories, currentSubcategory, onSubcategoryClick }) {
  return (
    <div className="alt-kategori-listesi">
      {subcategories.map(sub => (
        <button
          key={sub}
          onClick={() => onSubcategoryClick(sub)}
          className={currentSubcategory === sub ? 'active' : ''}
        >
          {sub}
        </button>
      ))}
    </div>
  );
}

export default SubcategoryButtons;