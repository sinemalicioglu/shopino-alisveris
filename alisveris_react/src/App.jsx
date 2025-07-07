// src/App.jsx
import React, { useState, useEffect } from 'react';
// Link, useNavigate, Routes, Route, useParams import'larına useLocation eklendi
import { Link, useNavigate, Routes, Route, useParams, useLocation } from 'react-router-dom';
import './style.css'; // Global stiller için

// Ayrılmış bileşenleri import ediyoruz
import Header from './Header';
import ProfilePage from './ProfilePage';
import CartPopup from './CartPopup';
import RecommendationPopup from './RecommendationPopup';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import HomePage from './HomePage';
import CustomAlertModal from './CustomAlertModal';
import CategoryProductsPage from './CategoryProductsPage'; // Ayrı dosyadan import ediyoruz


function App() {
  // --- Durum Değişkenleri (State Variables) ---
  const [currentUser, setCurrentUser] = useState(sessionStorage.getItem('currentUser'));
  const [userEmail, setUserEmail] = useState(sessionStorage.getItem('userEmail'));

  const [cartItems, setCartItems] = useState(() => {
    try {
      const storedCartItems = localStorage.getItem('cartItems');
      return storedCartItems ? JSON.parse(storedCartItems) : [];
    } catch (error) {
      console.error("Sepet verisi okunurken hata oluştu:", error);
      return [];
    }
  });

  // Pop-up'ların görünürlük durumları
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showCartPopup, setShowCartPopup] = useState(false);
  const [showRecommendationPopup, setShowRecommendationPopup] = useState(false);

  // Custom Alert Modal için state'ler
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Profil bilgileri ve siparişler için state'ler
  const [userProfile, setUserProfile] = useState(null);
  const [userOrders, setUserOrders] = useState([]);

  // Kategori ve ürün listeleme durumu
  const [activeCategoryKey, setActiveCategoryKey] = useState('anasayfa');
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  // Hata mesajları
  const [loginErrorMessage, setLoginErrorMessage] = useState('');
  const [registerErrorMessage, setRegisterErrorMessage] = useState('');

  const navigate = useNavigate();
  const location = useLocation(); // Mevcut URL konumunu almak için useLocation hook'u

  // Giriş/Kayıt formları açılmadan önceki yolu saklamak için yeni state
  const [previousPath, setPreviousPath] = useState('/');

  const productsFrontendCategories = {
    'anasayfa': { displayName: 'Ana Sayfa', subcategories: [] },
    'atistirmalik': { displayName: 'Atıştırmalık', subcategories: ['Tümü', 'Cips', 'Çikolata', 'Kek', 'Bisküvi', 'Kraker & Kurabiye', 'Sakız & Şekerleme', 'Kuruyemiş'] },
    'icecek': { displayName: 'İçecek', subcategories: ['Tümü', 'Gazlı İçecekler', 'Meyve Suları', 'Su & Maden Suyu', 'Kahve & Çay'] },
    'meyve-sebze': { displayName: 'Meyve & Sebze', subcategories: ['Tümü', 'Meyveler', 'Sebzeler', 'Yeşillikler'] },
    'sut-urunleri': { displayName: 'Süt Ürünleri', subcategories: ['Tümü', 'Sütler', 'Yoğurtlar', 'Peynirler', 'Tereyağı & Margarin'] },
    'temel-gida': { displayName: 'Temel Gıda', subcategories: ['Tümü', 'Bakliyat', 'Makarna & Pirinç', 'Yağlar', 'Un & Şeker', 'Baharatlar'] },
    'et-urunleri': { displayName: 'Et Ürünleri', subcategories: ['Tümü', 'Kırmızı Et', 'Beyaz Et', 'Şarküteri', 'Deniz Ürünleri'] },
    'kisisel-bakim': { displayName: 'Kişisel Bakım', subcategories: ['Tümü', 'Saç Bakımı', 'Cilt Bakımı', 'Ağız Bakımı', 'Deodorantlar', 'Tıraş Ürünleri'] },
    'ev-yasam': { displayName: 'Ev ve Yaşam', subcategories: ['Tümü', 'Temizlik Ürünleri', 'Kağıt Ürünleri', 'Çamaşır Bakımı', 'Mutfak Malzemeleri'] }
  };

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  const handleShowAlert = (message) => {
    setAlertMessage(message);
    setShowAlertModal(true);
  };

  const handleCloseAlert = () => {
    setShowAlertModal(false);
    setAlertMessage('');
  };

  const getCartItemCount = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const addToCart = async (product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.price }
            : item
        );
      } else {
        return [...prevItems, { ...product, quantity: 1, totalPrice: product.price }];
      }
    });
    await getRecommendations(product.id);
  };

  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, change) => {
    setCartItems(prevItems => {
      const updatedItems = prevItems.map(item => {
        if (item.id === productId) {
          const newQuantity = item.quantity + change;
          if (newQuantity <= 0) {
            return null;
          }
          return { ...item, quantity: newQuantity, totalPrice: newQuantity * item.price };
        }
        return item;
      }).filter(Boolean);
      return updatedItems;
    });
  };

  const getRecommendations = async (boughtProductId) => {
    setRecommendedProducts([]);
    setShowRecommendationPopup(false);

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/recommendations/${boughtProductId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const recommendedProductsData = await response.json();

      if (recommendedProductsData.length > 0) {
        setRecommendedProducts(recommendedProductsData);
        setShowRecommendationPopup(true);
      } else {
        setShowRecommendationPopup(false);
      }
    } catch (error) {
      console.error("Öneriler alınırken hata oluştu:", error);
      setShowRecommendationPopup(false);
    }
  };

  const fetchProducts = async (categoryKey, subcategory = 'Tümü') => {
    let categoryDisplayNameForApi = productsFrontendCategories[categoryKey]
      ? productsFrontendCategories[categoryKey].displayName
      : null;

    if (!categoryDisplayNameForApi || categoryKey === 'anasayfa') {
      return [];
    }

    try {
      let url = `http://127.0.0.1:5000/api/products?category=${encodeURIComponent(categoryDisplayNameForApi)}`;
      if (subcategory !== 'Tümü') {
          url += `&subcategory=${encodeURIComponent(subcategory)}`;
      }
      return await (await fetch(url)).json();
    } catch (error) {
      console.error("Ürünler yüklenirken hata oluştu:", error);
      return [];
    }
  };


  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      handleShowAlert('Sepetiniz boş, lütfen önce ürün ekleyin.');
      return;
    }

    const currentLoggedUserEmail = sessionStorage.getItem('userEmail');

    if (!currentLoggedUserEmail) {
        handleShowAlert('Sipariş vermek için lütfen giriş yapın.');
        setShowLoginForm(true);
        setShowCartPopup(false);
        return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: currentLoggedUserEmail,
          cartItems: cartItems,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        handleShowAlert(data.message + ` Sipariş ID: ${data.orderId}`);
        setCartItems([]);
        setShowCartPopup(false);
        navigate('/profile');
      } else {
        handleShowAlert('Sipariş oluşturulurken bir hata oluştu: ' + (data.message || 'Bilinmeyen Hata'));
      }
    } catch (error) {
      console.error("Ödeme yapılırken bir hata oluştu:", error);
      handleShowAlert('Ödeme yapılırken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.');
    }
  };

  const fetchUserProfileAndOrders = async () => {
    const currentLoggedUserEmail = sessionStorage.getItem('userEmail');
    if (!currentLoggedUserEmail) {
      return { userProfile: null, userOrders: [] };
    }

    try {
      const userResponse = await fetch(`http://127.0.0.1:5000/api/user/${currentLoggedUserEmail}`);
      if (!userResponse.ok) {
        throw new Error('Kullanıcı bilgileri çekilemedi.');
      }
      const userData = await userResponse.json();

      const ordersResponse = await fetch(`http://127.0.0.1:5000/api/user/${userData.id}/orders`);
      if (!ordersResponse.ok) {
        throw new Error('Sipariş geçmişi çekilemedi.');
      }
      const ordersData = await ordersResponse.json();

      return { userProfile: userData, userOrders: ordersData };
    } catch (error) {
      console.error("Profil veya sipariş geçmişi çekilirken hata oluştu:", error);
      handleShowAlert('Profil bilgileri veya sipariş geçmişi yüklenemedi.');
      return { userProfile: null, userOrders: [] };
    }
  };

  // --- Event Handler'lar ---

  // Yeni yardımcı fonksiyonlar: Giriş/Kayıt modalını açarken mevcut yolu kaydet
  const openLoginForm = () => {
    setPreviousPath(location.pathname); // Mevcut yolu kaydet
    setShowLoginForm(true);
  };

  const openRegisterForm = () => {
    setPreviousPath(location.pathname); // Mevcut yolu kaydet
    setShowRegisterForm(true);
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    const emailInput = event.target.girisEmail.value;
    const passwordInput = event.target.girisSifre.value;

    try {
      const response = await fetch('http://127.0.0.1:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, password: passwordInput }),
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentUser(data.username);
        setUserEmail(data.user_email);
        sessionStorage.setItem('currentUser', data.username);
        sessionStorage.setItem('userEmail', data.user_email);
        setShowLoginForm(false);
        setLoginErrorMessage('');
        navigate(previousPath); // Kaydedilen yola geri dön
      } else {
        setLoginErrorMessage(data.message || 'Giriş başarısız oldu. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error("Giriş yapılırken bir hata oluştu:", error);
      setLoginErrorMessage('Giriş yapılamadı. Sunucuya bağlanılamıyor.');
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    const firstName = event.target.firstName.value;
    const lastName = event.target.lastName.value;
    const emailInput = event.target.email.value;
    const passwordInput = event.target.sifre.value;
    const passwordRepeatInput = event.target.sifreTekrar.value;

    if (passwordInput !== passwordRepeatInput) {
      setRegisterErrorMessage('Şifreler eşleşmiyor.');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email: emailInput, password: passwordInput }),
      });

      const data = await response.json();

      if (response.ok) {
        handleShowAlert('Kayıt başarılı! Giriş yapabilirsiniz.');
        setShowRegisterForm(false);
        setRegisterErrorMessage('');
        navigate(previousPath); // Kaydedilen yola geri dön
      } else {
        setRegisterErrorMessage(data.message || 'Kayıt başarısız oldu. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error("Kayıt olunurken bir hata oluştu:", error);
      setRegisterErrorMessage('Kayıt yapılamadı. Sunucuya bağlanılamıyor.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserEmail(null);
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('userEmail');
    setActiveCategoryKey('anasayfa');
    navigate('/'); // Çıkış sonrası anasayfaya dön
  };

  const handleAddRecommendedToCart = async () => {
    if (recommendedProducts.length > 0) {
      for (const product of recommendedProducts) {
        await addToCart(product);
      }
      setRecommendedProducts([]);
      setShowRecommendationPopup(false);
    } else {
      handleShowAlert("Önerilen ürün bulunmamaktadır.");
    }
  };

  const calculateTotalCartPrice = () => {
    return cartItems.reduce((total, item) => total + item.totalPrice, 0).toFixed(2);
};

  return (
    <>
      <Header
        currentUser={currentUser}
        getCartItemCount={getCartItemCount}
        handleLogout={handleLogout}
        setShowLoginForm={openLoginForm} // Yeni fonksiyonu gönderiyoruz
        setShowRegisterForm={openRegisterForm} // Yeni fonksiyonu gönderiyoruz
        setShowCartPopup={setShowCartPopup}
        activeCategoryKey={activeCategoryKey}
        productsFrontendCategories={productsFrontendCategories}
        setActiveCategoryKey={setActiveCategoryKey}
      />

      <CustomAlertModal
        show={showAlertModal}
        message={alertMessage}
        onClose={handleCloseAlert}
      />

      <RecommendationPopup
        showRecommendationPopup={showRecommendationPopup}
        setShowRecommendationPopup={setShowRecommendationPopup}
        recommendedProducts={recommendedProducts}
        addToCart={addToCart}
        handleAddRecommendedToCart={handleAddRecommendedToCart}
      />

      <CartPopup
        showCartPopup={showCartPopup}
        setShowCartPopup={setShowCartPopup}
        cartItems={cartItems}
        removeFromCart={removeFromCart}
        updateQuantity={updateQuantity}
        calculateTotalCartPrice={calculateTotalCartPrice}
        handleCheckout={handleCheckout}
      />

      <LoginForm
        showLoginForm={showLoginForm}
        setShowLoginForm={setShowLoginForm}
        handleLoginSubmit={handleLoginSubmit}
        loginErrorMessage={loginErrorMessage}
      />

      <RegisterForm
        showRegisterForm={showRegisterForm}
        setShowRegisterForm={setShowRegisterForm}
        handleRegisterSubmit={handleRegisterSubmit}
        registerErrorMessage={registerErrorMessage}
      />

      <main>
        <Routes>
          <Route path="/" element={
            <HomePage
              currentUser={currentUser}
              setShowLoginForm={openLoginForm} // Yeni fonksiyonu gönderiyoruz
              setShowRegisterForm={openRegisterForm} // Yeni fonksiyonu gönderiyoruz
            />
          } />

          <Route path="/category/:categoryKey" element={
            <CategoryProductsPage
              productsFrontendCategories={productsFrontendCategories}
              fetchProducts={fetchProducts}
              addToCart={addToCart}
            />
          } />

          <Route path="/profile" element={
            <ProfilePage
              userEmail={userEmail}
              currentUser={currentUser}
              fetchUserProfileAndOrders={fetchUserProfileAndOrders}
              showLoginForm={openLoginForm} // Yeni fonksiyonu gönderiyoruz
            />
          } />

          <Route path="*" element={<section className="anasayfa"><h1>404 - Sayfa Bulunamadı</h1><p>Aradığınız sayfa mevcut değil.</p></section>} />

        </Routes>
      </main>
    </>
  );
}

export default App;
