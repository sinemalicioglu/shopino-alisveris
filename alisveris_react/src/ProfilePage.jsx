// src/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import './style.css';

function ProfilePage({ userEmail, currentUser, fetchUserProfileAndOrders, showLoginForm }) { 
    const [profileData, setProfileData] = useState(null);
    const [ordersData, setOrdersData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadData = async () => {
            if (!userEmail) {
                setError('Profil bilgilerini görmek için lütfen giriş yapın.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError('');
                const { userProfile: fetchedProfile, userOrders: fetchedOrders } = await fetchUserProfileAndOrders();

                if (fetchedProfile) {
                    setProfileData(fetchedProfile);
                    setOrdersData(fetchedOrders);
                } else {
                    setError('Profil bilgileri bulunamadı.');
                }
                setLoading(false);
            } catch (err) {
                console.error("ProfilePage: Profil veya sipariş geçmişi çekilirken hata oluştu:", err);
                setError('Profil bilgileri veya sipariş geçmişi yüklenemedi.');
                setLoading(false);
            }
        };

        loadData();
    }, [userEmail, fetchUserProfileAndOrders]);

    if (loading) {
        return (
            <section className="profile-page">
                <div className="form-content" style={{ textAlign: 'center' }}>
                    <h2>Yükleniyor...</h2>
                    <p>Profil bilgileriniz ve sipariş geçmişiniz getiriliyor.</p>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="profile-page">
                <div className="form-content" style={{ textAlign: 'center' }}>
                    <h2>Hata</h2>
                    <p>{error}</p>
                    {!userEmail && <button className="anasayfa-account-buttons button" onClick={showLoginForm}>Giriş Yap</button>}
                </div>
            </section>
        );
    }

    if (!profileData) {
        return (
            <section className="profile-page">
                <div className="form-content" style={{ textAlign: 'center' }}>
                    <h2>Profil Bilgileri Bulunamadı</h2>
                    <p>Giriş yapmamış olabilirsiniz veya bir sorun oluştu.</p>
                    <button className="anasayfa-account-buttons button" onClick={showLoginForm}>Giriş Yap</button> 
                </div>
            </section>
        );
    }

    return (
        <section className="profile-page" style={{display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '20px'}}>
            <div className="form-content profile-layout-container" style={{ position: 'relative', width: '900px', maxWidth: '95%', margin: 'auto' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#096B68', fontSize: '1.8em' }}>Hesap Bilgilerim</h2>

                <div className="profile-content-wrapper">
                    <div className="profile-info-section">
                        <div className="profile-info" style={{ marginBottom: '20px' }}>
                            <p><strong>Ad:</strong> <span id="profileFirstName">{profileData.first_name}</span></p>
                            <p><strong>Soyad:</strong> <span id="profileLastName">{profileData.last_name}</span></p>
                            <p><strong>E-posta:</strong> <span id="profileEmail">{profileData.email}</span></p>
                        </div>
                        <button onClick={fetchUserProfileAndOrders} style={{
                            backgroundColor: '#096B68',
                            color: '#fff',
                            border: 'none',
                            padding: '8px 15px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '0.9em',
                            fontWeight: '600',
                            transition: 'background-color 0.3s ease, transform 0.1s ease',
                            marginTop: '10px'
                        }}>Sipariş Geçmişimi Yenile</button>
                    </div>

                    <div className="previous-orders-section">
                        <h3>Önceki Siparişlerim</h3>
                        <div className="siparis-listesi" style={{ maxHeight: '350px', overflowY: 'auto', marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                            {ordersData.length > 0 ? (
                                ordersData.map(order => (
                                    <div key={order.id} style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px dotted #ccc' }}>
                                        <p><strong>Sipariş ID:</strong> {order.id}</p>
                                        <p><strong>Tarih:</strong> {new Date(order.orderDate).toLocaleString()}</p>
                                        <p><strong>Toplam Tutar:</strong> {order.totalAmount.toFixed(2)} TL</p>
                                        <p><strong>Durum:</strong> {order.status}</p>
                                        <h4>Ürünler:</h4>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                            {order.items.map(item => (
                                                <li key={item.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                                                    <img src={item.imageUrl} alt={item.productName} style={{ width: '40px', height: '40px', marginRight: '10px', borderRadius: '3px', objectFit: 'contain' }} />
                                                    <span>{item.productName} ({item.quantity} adet) - {item.priceAtPurchase.toFixed(2)} TL/adet</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))
                            ) : (
                                <p style={{ textAlign: 'center', color: '#6c757d' }}>Henüz siparişiniz bulunmamaktadır.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default ProfilePage;
