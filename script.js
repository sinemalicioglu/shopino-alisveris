document.addEventListener('DOMContentLoaded', function() {
    // ----------------------------------------------------
    // 1. DOM ELEMENTLERİNİ SEÇME
    // ----------------------------------------------------
    // HEADER VE POP-UP ELEMENTLERİ
    const anasayfaGirisYapBtn = document.getElementById('anasayfaGirisYapBtn');
    const anasayfaKayitOlBtn = document.getElementById('anasayfaKayitOlBtn');
    const girisFormuContainer = document.getElementById('girisFormuContainer');
    const kayitFormuContainer = document.getElementById('kayitFormuContainer');
    const girisFormuKapat = document.getElementById('girisFormuKapat');
    const kayitFormuKapat = document.getElementById('kayitFormuKapat');
    const girisForm = document.getElementById('girisForm');
    const kayitForm = document.getElementById('kayitForm');

    // Kayıt formundaki yeni input alanları
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');

    // Hata Mesajı Elementleri
    const loginErrorMessage = document.getElementById('loginErrorMessage');
    const registerErrorMessage = document.getElementById('registerErrorMessage');

    // KULLANICI DURUMU VE SEPET ELEMENTLERİ (Header için)
    const headerAccount = document.getElementById('headerAccount');
    const loggedInContent = document.getElementById('loggedInContent');
    const userNameSpan = document.getElementById('userName');
    const sepetBtn = document.getElementById('sepetBtn');
    const cikisYapBtn = document.getElementById('cikisYapBtn');
    const cartItemCount = document.getElementById('cartItemCount');
    
    // SEPET POP-UP ELEMENTLERİ
    const sepetContainer = document.getElementById('sepetContainer');
    const sepetKapatBtn = document.getElementById('sepetKapatBtn');
    const sepetUrunleriDiv = document.getElementById('sepetUrunleri');
    const sepetToplamFiyatSpan = document.getElementById('sepetToplamFiyat');
    const alisveriseDevamBtn = document.getElementById('alisveriseDevamBtn');
    const odemeyiTamamlaBtn = document.getElementById('odemeyiTamamlaBtn');
    const sepetBosMesaj = document.getElementById('sepetBosMesaj');

    // KATEGORİ VE ÜRÜN LİSTELEME ELEMENTLERİ
    const anasayfaSection = document.getElementById('anasayfaSection');
    const urunSayfasiSection = document.getElementById('urunSayfasiSection');
    const solMenuKategoriBaslik = document.getElementById('solMenuKategoriBaslik');
    const altKategoriListesi = document.getElementById('altKategoriListesi');
    const urunIcerikBaslik = document.getElementById('urunIcerikBaslik');
    const urunGrid = document.getElementById('urunGrid');
    const kategoriLinkleri = document.querySelectorAll('nav ul li a');

    // ÖNERİ SİSTEMİ ELEMENTLERİ (Pop-up için)
    const onerilenUrunlerContainer = document.getElementById('onerilenUrunlerContainer');
    const onerilenUrunlerKapatBtn = document.getElementById('onerilenUrunlerKapatBtn');
    const onerilenUrunGridPopUp = document.getElementById('onerilenUrunGridPopUp');
    const oneriyiKapatBtn = document.getElementById('oneriyiKapatBtn');
    const onerilenleriSepeteEkleBtn = document.getElementById('onerilenleriSepeteEkleBtn');
    let currentRecommendations = [];


    // ----------------------------------------------------
    // 2. ÜRÜN VERİSİ (PRODUCTS OBJESİ)
    //    Frontend'in navigasyon ve alt kategori butonları için kategori bilgilerini tutar.
    //    Ürün detayları API'den çekilecektir.
    // ----------------------------------------------------
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

    // Global activeCategoryKey, ürün detayını bulmak için kullanılabilir
    let activeCategoryKey = null;


    // ----------------------------------------------------
    // 3. FONKSİYON TANIMLARI
    // ----------------------------------------------------

    // Kullanıcının giriş yapıp yapmadığına göre header'daki içeriği günceller
    function updateAccountUI(loggedInUser = null) {
        if (loggedInUser) {
            loggedInContent.style.display = 'flex';
            headerAccount.style.display = 'flex';
            userNameSpan.textContent = `Merhaba, ${loggedInUser}!`; // Artık doğrudan ismi kullanıyoruz
            const anasayfaAccountButtonsDiv = document.getElementById('anasayfaAccountButtons');
            if (anasayfaAccountButtonsDiv) { // Anasayfa butonları varsa gizle
                anasayfaAccountButtonsDiv.style.display = 'none';
            }
        } else {
            loggedInContent.style.display = 'none';
            userNameSpan.textContent = '';
            const anasayfaAccountButtonsDiv = document.getElementById('anasayfaAccountButtons');
            if (anasayfaSection.style.display !== 'none') { // Anasayfada mıyız kontrolü
                if (anasayfaAccountButtonsDiv) { // Anasayfa butonları varsa göster
                    anasayfaAccountButtonsDiv.style.display = 'flex';
                }
                headerAccount.style.display = 'flex'; // Header'daki account kısmını her zaman flex tutalım, içeriğini gizleyelim
            } else {
                headerAccount.style.display = 'flex'; // Ürün sayfasındayken de giriş yapılmamışsa headerAccount'ı görünür tutalım
            }
        }
    }

    // Sepet verisini localStorage'a kaydet
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || []; // Sepet verisi burada başlatılır
    function saveCartItems() {
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }

    // Sepet ikonundaki ürün sayısını güncelle
    function updateCartCount() {
        const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        cartItemCount.textContent = totalCount;
        if (totalCount > 0) {
            cartItemCount.style.display = 'inline-block';
        } else {
            cartItemCount.style.display = 'none';
        }
    }

    // Ürünü sepete ekle veya miktarını artır
    function addToCart(product) {
        const existingItem = cartItems.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity++;
            existingItem.totalPrice = existingItem.quantity * existingItem.price;
        } else {
            cartItems.push({ ...product, quantity: 1, totalPrice: product.price });
        }
        saveCartItems();
        updateCartCount();
        getRecommendations(product.id); // Ürün sepete eklendiğinde öneri getir ve pop-up olarak göster
    }

    // Ürünü sepetten çıkar
    function removeFromCart(productId) {
        cartItems = cartItems.filter(item => item.id !== productId);
        saveCartItems();
        updateCartCount();
        renderCartItems();
    }

    // Sepetteki ürün miktarını güncelle
    function updateQuantity(productId, change) {
        const item = cartItems.find(item => item.id === productId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                removeFromCart(productId);
            } else {
                item.totalPrice = item.quantity * item.price;
                saveCartItems();
                updateCartCount();
                renderCartItems();
            }
        }
    }

    // Sepet içeriğini HTML'de oluştur ve güncelle
    function renderCartItems() {
        sepetUrunleriDiv.innerHTML = '';
        let totalCartPrice = 0;

        if (cartItems.length === 0) {
            sepetBosMesaj.style.display = 'block';
            sepetUrunleriDiv.style.display = 'none';
            sepetToplamFiyatSpan.textContent = '0.00';
            document.querySelector('.sepet-ozet').style.display = 'none';
        } else {
            sepetBosMesaj.style.display = 'none';
            sepetUrunleriDiv.style.display = 'block';
            document.querySelector('.sepet-ozet').style.display = 'block';

            cartItems.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('sepet-urun-item');
                itemDiv.innerHTML = `
                    <img src="${item.imageUrl}" alt="${item.name}">
                    <div class="sepet-urun-info">
                        <h4>${item.name}</h4>
                        <p>${item.price.toFixed(2)} TL</p>
                    </div>
                    <div class="sepet-urun-miktar-kontrol">
                        <button data-id="${item.id}" data-action="increase">+</button> 
                        <span>${item.quantity}</span>
                        <button data-id="${item.id}" data-action="decrease">-</button> 
                    </div>
                    <button class="sepet-urun-cikar" data-id="${item.id}" data-action="remove">X</button>
                `;
                sepetUrunleriDiv.appendChild(itemDiv);

                totalCartPrice += item.totalPrice;
            });
            sepetToplamFiyatSpan.textContent = totalCartPrice.toFixed(2);
        }
    }

    // Öneri sistemi fonksiyonları (Şimdi Backend API'sine bağlanacak)
    async function getRecommendations(boughtProductId) { // async keyword'ünü ekledik
        currentRecommendations = [];
        onerilenUrunGridPopUp.innerHTML = '';
        onerilenUrunlerContainer.style.display = 'none'; // Öneri bölümünü önce gizle

        try {
            // Backend'den önerileri çek
            // LÜTFEN PORT NUMARASINI KENDİ FLASK BACKEND PORTUNUZA GÖRE AYARLAYIN (örn: 5000 veya 5001)
            const response = await fetch(`http://127.0.0.1:5000/api/recommendations/${boughtProductId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const recommendedProductsData = await response.json();

            // Öneri kısmında sepette olup olmaması fark etmeden her ürünü göster
            if (recommendedProductsData.length > 0) {
                recommendedProductsData.forEach(product => {
                    currentRecommendations.push(product); // Sepet kontrolü kaldırıldı
                });
            }

            if (currentRecommendations.length > 0) {
                currentRecommendations.forEach(product => {
                    const card = createProductCard(product); // Ürün kartı oluştur
                    onerilenUrunGridPopUp.appendChild(card);
                });
                onerilenUrunlerContainer.style.display = 'flex'; // Öneri pop-up'ını göster
            } else {
                onerilenUrunlerContainer.style.display = 'none';
            }

        } catch (error) {
            console.error("Öneriler alınırken hata oluştu:", error);
            onerilenUrunlerContainer.style.display = 'none'; // Hata durumunda pop-up'ı gizle
        }
    }

    // Sayfa görünümü yönetimi
    function showSection(sectionId) {
        anasayfaSection.style.display = 'none';
        urunSayfasiSection.style.display = 'none';
        
        document.getElementById(sectionId).style.display = (sectionId === 'anasayfaSection') ? 'block' : 'flex';
    }

    function displayAnasayfa() {
        showSection('anasayfaSection');
        const currentUser = localStorage.getItem('currentUser');
        updateAccountUI(currentUser); // Header'daki account'ı ve anasayfa butonlarını ayarlar

        // Navigasyon menüsündeki aktif sınıfı güncelle
        kategoriLinkleri.forEach(link => link.classList.remove('active-category'));
        document.querySelector('a[data-category="anasayfa"]').classList.add('active-category');
    }

    // displayProductsPage fonksiyonu (API'den ürün çekecek şekilde değişecek)
    async function displayProductsPage(categoryKey, categoryDisplayName) { // async keyword'ünü ekledik
        showSection('urunSayfasiSection');
        activeCategoryKey = categoryKey; // Global activeCategoryKey'i güncelledik

        solMenuKategoriBaslik.textContent = categoryDisplayName;
        urunIcerikBaslik.textContent = categoryDisplayName + " Ürünleri";
        
        try {
            // Alt kategoriler hala statik, isterseniz backend'den de çekebiliriz
            displaySubcategories(categoryKey);

            // API'den ürünleri çek
            // LÜTFEN PORT NUMARASINI KENDİ FLASK BACKEND PORTUNUZA GÖRE AYARLAYIN (örn: 5000 veya 5001)
            const response = await fetch(`http://127.0.0.1:5000/api/products?category=${encodeURIComponent(categoryDisplayName)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const productsFromApi = await response.json(); // JSON yanıtını al

            urunGrid.innerHTML = ''; // Önceki ürünleri temizle
            if (productsFromApi.length > 0) {
                productsFromApi.forEach(product => {
                    const card = createProductCard(product);
                    urunGrid.appendChild(card);
                });
            } else {
                urunGrid.innerHTML = '<p>Bu kategoride ürün bulunmamaktadır.</p>';
            }

        } catch (error) {
            console.error("Ürünler yüklenirken hata oluştu:", error);
            urunGrid.innerHTML = '<p>Ürünler yüklenemedi. Lütfen daha sonra tekrar deneyin.</p>';
        }

        const currentUser = localStorage.getItem('currentUser');
        updateAccountUI(currentUser); 

        kategoriLinkleri.forEach(link => link.classList.remove('active-category'));
        document.querySelector(`a[data-category="${categoryKey}"]`).classList.add('active-category');

        onerilenUrunlerContainer.style.display = 'none';
    }

    // Ürün kartı oluşturma
    function createProductCard(product) {
        const productCard = document.createElement('div');
        productCard.classList.add('urun-karti');
        productCard.innerHTML = `
            <img src="${product.imageUrl}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p class="fiyat">${product.price.toFixed(2)} TL</p>
            <button data-product-id="${product.id}">Sepete Ekle</button>
        `;
        return productCard;
    }

    // Alt kategori butonlarını görselleştirme
    function displaySubcategories(categoryKey) {
        altKategoriListesi.innerHTML = '';
        const currentCategoryData = productsFrontendCategories[categoryKey]; // Statik objeden alt kategorileri çekiyoruz

        if (currentCategoryData && currentCategoryData.subcategories) {
            currentCategoryData.subcategories.forEach(sub => {
                const subCategoryButton = document.createElement('button');
                subCategoryButton.textContent = sub;
                subCategoryButton.dataset.subcategory = sub;
                altKategoriListesi.appendChild(subCategoryButton);

                subCategoryButton.addEventListener('click', async function() { // async ekledik
                    document.querySelectorAll('.alt-kategori-listesi button').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    this.classList.add('active');

                    await filterProductsBySubcategory(categoryKey, this.dataset.subcategory); // await ekledik
                });
            });
            const tumuButton = altKategoriListesi.querySelector('button');
            if (tumuButton) {
                tumuButton.classList.add('active');
            }
        }
    }

    // Ürünleri alt kategoriye göre filtreleme (API'den çekecek şekilde değişecek)
    async function filterProductsBySubcategory(categoryKey, selectedSubcategory) { // async ekledik
        urunGrid.innerHTML = ''; // Önceki ürünleri temizle
        
        let apiUrl = `http://127.0.0.1:5000/api/products`; // Tüm ürünler için başlangıç URL'si
        // LÜTFEN PORT NUMARASINI KENDİ FLASK BACKEND PORTUNUZA GÖRE AYARLAYIN (örn: 5000 veya 5001)

        let categoryDisplayNameForApi = productsFrontendCategories[categoryKey] ? productsFrontendCategories[categoryKey].displayName : null;

        if (categoryKey !== 'anasayfa' && categoryDisplayNameForApi) { // Anasayfa için ürün çekmiyoruz ve kategori adı varsa
            apiUrl += `?category=${encodeURIComponent(categoryDisplayNameForApi)}`;
        }

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const allProductsFromApi = await response.json();

            let filteredItems = [];
            if (selectedSubcategory === 'Tümü') {
                filteredItems = allProductsFromApi;
            } else {
                filteredItems = allProductsFromApi.filter(item => item.subcategory === selectedSubcategory);
            }
            
            if (filteredItems.length > 0) {
                filteredItems.forEach(product => {
                    const card = createProductCard(product);
                    urunGrid.appendChild(card);
                });
            } else {
                urunGrid.innerHTML = '<p>Bu alt kategoride ürün bulunmamaktadır.</p>';
            }

        } catch (error) {
            console.error("Ürünler alt kategoriye göre filtrelenirken hata oluştu:", error);
            urunGrid.innerHTML = '<p>Ürünler yüklenemedi. Lütfen daha sonra tekrar deneyin.</p>';
        }
    }


    // ----------------------------------------------------
    // 4. OLAY DİNLEYİCİLERİ (EVENT LISTENERS)
    // ----------------------------------------------------

    // Sayfa ilk yüklendiğinde kullanıcı durumunu ve sepet sayacını güncelle
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        updateAccountUI(storedUser);
    } else {
        updateAccountUI(null);
    }
    updateCartCount();


    // Anasayfa butonları için olay dinleyiciler
    if (anasayfaGirisYapBtn) {
        anasayfaGirisYapBtn.addEventListener('click', function() {
            girisFormuContainer.style.display = 'flex';
            loginErrorMessage.style.display = 'none'; // Form açıldığında hata mesajını gizle
            girisForm.reset(); // Formu açarken temizle
        });
    }

    if (anasayfaKayitOlBtn) {
        anasayfaKayitOlBtn.addEventListener('click', function() {
            kayitFormuContainer.style.display = 'flex';
            registerErrorMessage.style.display = 'none'; // Form açıldığında hata mesajını gizle
            kayitForm.reset(); // Formu açarken temizle
        });
    }

    // Ortak Pop-up'ları kapatma butonları
    girisFormuKapat.addEventListener('click', function() {
        girisFormuContainer.style.display = 'none';
        loginErrorMessage.style.display = 'none'; // Kapatınca hata mesajını gizle
        girisForm.reset(); // Kapatınca formu temizle
    });

    kayitFormuKapat.addEventListener('click', function() {
        kayitFormuContainer.style.display = 'none';
        registerErrorMessage.style.display = 'none'; // Kapatınca hata mesajını gizle
        kayitForm.reset(); // Kapatınca formu temizle
    });

    sepetBtn.addEventListener('click', function() {
        renderCartItems();
        sepetContainer.style.display = 'flex';
    });

    sepetKapatBtn.addEventListener('click', function() {
        sepetContainer.style.display = 'none';
    });

    alisveriseDevamBtn.addEventListener('click', function() {
        sepetContainer.style.display = 'none';
    });

    odemeyiTamamlaBtn.addEventListener('click', function() {
        if (cartItems.length === 0) {
            alert('Sepetiniz boş, lütfen önce ürün ekleyin.');
            return;
        }
        alert('Ödeme akışı başlatılıyor (şimdilik simülasyon)! Toplam: ' + sepetToplamFiyatSpan.textContent + ' TL');
        cartItems = [];
        saveCartItems();
        updateCartCount();
        renderCartItems();
        sepetContainer.style.display = 'none';
    });

    // Giriş Formu Submit Olayı (API ile iletişim)
    girisForm.addEventListener('submit', async function(event) { // async ekledik
        event.preventDefault();
        const emailInput = document.getElementById('girisEmail').value;
        const passwordInput = document.getElementById('girisSifre').value;

        try {
            // LÜTFEN PORT NUMARASINI KENDİ FLASK BACKEND PORTUNUZA GÖRE AYARLAYIN (örn: 5000 veya 5001)
            const response = await fetch('http://127.0.0.1:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: emailInput, password: passwordInput }),
            });

            const data = await response.json();

            if (response.ok) { // HTTP durumu 200-299 arasındaysa
                const username = data.username;
                localStorage.setItem('currentUser', username);
                updateAccountUI(username);
                girisFormuContainer.style.display = 'none';
                girisForm.reset();
                loginErrorMessage.style.display = 'none';
                displayAnasayfa();
            } else {
                // Hata durumu: Backend'den gelen mesajı kullan, yoksa varsayılan mesaj
                loginErrorMessage.textContent = data.message || 'Giriş başarısız oldu. Lütfen tekrar deneyin.';
                loginErrorMessage.style.display = 'block';
                girisForm.reset(); // Hatalı girişte formu temizle
            }
        } catch (error) {
            console.error("Giriş yapılırken bir hata oluştu:", error);
            loginErrorMessage.textContent = 'Giriş yapılamadı. Sunucuya bağlanılamıyor.';
            loginErrorMessage.style.display = 'block';
            girisForm.reset();
        }
    });

    // Kayıt Formu Submit Olayı (API ile iletişim)
    kayitForm.addEventListener('submit', async function(event) { // async ekledik
        event.preventDefault();
        const firstName = document.getElementById('firstName').value; // Yeni: İsim al
        const lastName = document.getElementById('lastName').value;   // Yeni: Soyisim al
        const emailInput = document.getElementById('email').value;
        const passwordInput = document.getElementById('sifre').value;
        const passwordRepeatInput = document.getElementById('sifreTekrar').value;

        if (passwordInput !== passwordRepeatInput) {
            registerErrorMessage.textContent = 'Şifreler eşleşmiyor.';
            registerErrorMessage.style.display = 'block';
            kayitForm.reset();
            return;
        }

        try {
            // LÜTFEN PORT NUMARASINI KENDİ FLASK BACKEND PORTUNUZA GÖRE AYARLAYIN (örn: 5000 veya 5001)
            const response = await fetch('http://127.0.0.1:5000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ firstName: firstName, lastName: lastName, email: emailInput, password: passwordInput }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Kayıt başarılı! Giriş yapabilirsiniz.');
                kayitFormuContainer.style.display = 'none';
                kayitForm.reset();
                registerErrorMessage.style.display = 'none';
                displayAnasayfa();
            } else {
                // Hata durumu: Backend'den gelen mesajı kullan, yoksa varsayılan mesaj
                registerErrorMessage.textContent = data.message || 'Kayıt başarısız oldu. Lütfen tekrar deneyin.';
                registerErrorMessage.style.display = 'block';
                kayitForm.reset();
            }
        } catch (error) {
            console.error("Kayıt olunurken bir hata oluştu:", error);
            registerErrorMessage.textContent = 'Kayıt yapılamadı. Sunucuya bağlanılamıyor.';
            registerErrorMessage.style.display = 'block';
            kayitForm.reset();
        }
    });

    cikisYapBtn.addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        updateAccountUI(null);
        displayAnasayfa(); // Çıkış sonrası ana sayfaya dön
    });

    // Öneri Pop-up'ı kapatma butonları
    if (oneriyiKapatBtn) {
        oneriyiKapatBtn.addEventListener('click', function() {
            onerilenUrunlerContainer.style.display = 'none';
        });
    }

    if (onerilenUrunlerKapatBtn) {
        onerilenUrunlerKapatBtn.addEventListener('click', function() {
            onerilenUrunlerContainer.style.display = 'none';
        });
    }

    // Önerilenleri Sepete Ekle butonu
    if (onerilenleriSepeteEkleBtn) {
        onerilenleriSepeteEkleBtn.addEventListener('click', async function() {
            if (currentRecommendations.length > 0) {
                for (const product of currentRecommendations) {
                    await addToCart(product); 
                }
                currentRecommendations = []; 
                onerilenUrunlerContainer.style.display = 'none'; 
            } else {
                alert("Önerilen ürün bulunmamaktadır.");
            }
        });
    }

    // Kategori linklerine tıklama olayı (API ile iletişim)
    kategoriLinkleri.forEach(link => {
        link.addEventListener('click', async function(event) {
            event.preventDefault();

            const categoryKey = this.dataset.category;
            // API'ye gönderilecek kategori adı, productsFrontendCategories objesindeki displayName ile eşleşmeli
            const categoryDisplayNameForApi = productsFrontendCategories[categoryKey] ? productsFrontendCategories[categoryKey].displayName : null;
            
            if (categoryKey === 'anasayfa') {
                displayAnasayfa();
            } else if (productsFrontendCategories[categoryKey] && categoryDisplayNameForApi) { 
                await displayProductsPage(categoryKey, categoryDisplayNameForApi); // displayName'i gönder
            } else {
                showSection('urunSayfasiSection');
                solMenuKategoriBaslik.textContent = categoryDisplayNameForApi || categoryKey; // Fallback
                urunIcerikBaslik.textContent = (categoryDisplayNameForApi || categoryKey) + " Ürünleri";
                altKategoriListesi.innerHTML = '';
                urunGrid.innerHTML = '<p>Bu kategoride ürün bulunmamaktadır.</p>';
                onerilenUrunlerContainer.style.display = 'none';
            }
        });
    });


    // Sepete Ekle butonları için Event Delegation
    document.addEventListener('click', async function(event) {
        const target = event.target;

        // Ürün kartı üzerindeki "Sepete Ekle" butonu (hem ana grid hem öneri popup grid içinde)
        if (target.matches('.urun-karti button[data-product-id]')) {
            const productId = parseInt(target.dataset.productId);
            
            // Backend'den çekilen ürünlerin bir kopyasını tutmak daha performanslı olurdu
            // Bu yöntem için backend'e yeni bir route eklemek gerekir.
            // Basitlik için, ürünün sadece temel bilgilerini (ID, isim, fiyat, resim) kullanarak sepete ekleyelim:
            const productCard = event.target.closest('.urun-karti');
            const productName = productCard.querySelector('h3').textContent;
            const productPrice = parseFloat(productCard.querySelector('.fiyat').textContent.replace(' TL', ''));
            const productImage = productCard.querySelector('img').src;

            const productToAdd = {
                id: productId, // Backend ID'si
                name: productName,
                price: productPrice,
                imageUrl: productImage
            };
            
            await addToCart(productToAdd);
        } 
        // Sepet içindeki miktar kontrol veya çıkar butonları
        else if (target.matches('.sepet-urun-miktar-kontrol button') || target.matches('.sepet-urun-cikar')) {
            const productId = parseInt(target.dataset.id);
            const action = target.dataset.action;
            if (action === 'increase') { 
                updateQuantity(productId, 1);
            } else if (action === 'decrease') { 
                updateQuantity(productId, -1);
            } else if (action === 'remove') {
                removeFromCart(productId);
            }
        }
    });

    // Form alanlarına her odaklanıldığında veya değer değiştiğinde hata mesajını gizle (UX iyileştirmesi)
    if (girisForm) {
        girisForm.querySelectorAll('input').forEach(input => {
            input.addEventListener('focus', () => { loginErrorMessage.style.display = 'none'; });
            input.addEventListener('input', () => { loginErrorMessage.style.display = 'none'; });
        });
    }
    if (kayitForm) {
        kayitForm.querySelectorAll('input').forEach(input => {
            input.addEventListener('focus', () => { registerErrorMessage.style.display = 'none'; });
            input.addEventListener('input', () => { registerErrorMessage.style.display = 'none'; });
        });
    }

    // Sayfa ilk yüklendiğinde varsayılan olarak Anasayfayı göster
    // ve kullanıcı durumunu güncelle
    displayAnasayfa();

});