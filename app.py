# app.py

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import pymysql # MySQL adapter'ı olarak kullanılır
from datetime import datetime # Sipariş tarihi için eklendi
import pandas as pd
from mlxtend.frequent_patterns import apriori, association_rules

app = Flask(__name__)
CORS(app) # CORS ayarı, frontend'den gelen istekler için gerekli

# MySQL Veritabanı Yapılandırması
# Aşağıdaki bilgileri kendi MySQL sunucunuza ve oluşturduğunuz veritabanına göre DÜZENLEYİN:
# 'mysql+pymysql://KULLANICI_ADINIZ:SIFRENIZ@HOST_ADRESINIZ:PORT_NUMARASI/VERITABANI_ADINIZ'
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:sinem@localhost:3306/shopino_db' # <-- BURAYI KENDİ BİLGİLERİNİZLE DÜZENLEYİN!
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # Gereksiz uyarıları kapatır
db = SQLAlchemy(app) # db objesinin tanımı burada, tüm modellerden önce gelmelidir!

# --- Veritabanı Modelleri ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(80), nullable=False)
    last_name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False) # Boyut Text olarak değiştirildi

    def __repr__(self):
        return f'<User {self.email}>'

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)

    def __repr__(self):
        return f'<Category {self.name}>'

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    price = db.Column(db.Float, nullable=False)
    image_url = db.Column(db.String(200), nullable=True)
    subcategory = db.Column(db.String(80), nullable=True)
    recommends_ids = db.Column(db.Text, nullable=True) # Text türü MySQL'de VARCHAR(L) veya TEXT'e eşleşir

    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    category = db.relationship('Category', backref=db.backref('products', lazy=True))

    def __repr__(self):
        return f'<Product {self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'price': self.price,
            'imageUrl': self.image_url,
            'subcategory': self.subcategory,
            'recommends': [int(x) for x in self.recommends_ids.split(',')] if self.recommends_ids else []
        }

# Yeni Eklenecek Modeller: Order ve OrderItem
class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    order_date = db.Column(db.DateTime, nullable=False, default=datetime.now) # datetime.now kullanıldı
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), nullable=False, default='beklemede')

    user = db.relationship('User', backref=db.backref('orders', lazy=True))
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'orderDate': self.order_date.isoformat(),
            'totalAmount': self.total_amount,
            'status': self.status,
            'items': [item.to_dict() for item in self.items]
        }

class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price_at_purchase = db.Column(db.Float, nullable=False)

    product = db.relationship('Product', backref=db.backref('order_items', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'orderId': self.order_id,
            'productId': self.product_id,
            'productName': self.product.name, # Ürün ismini de ekledik
            'imageUrl': self.product.image_url, # Ürün resmini de ekledik
            'quantity': self.quantity,
            'priceAtPurchase': self.price_at_purchase
        }

# --- API Rotaları (Endpoints) ---

@app.route('/')
def home():
    return "Shopino Backend is running with MySQL!"

@app.route('/api/products', methods=['GET'])
def get_products():
    category_name = request.args.get('category')
    subcategory_name = request.args.get('subcategory')

    print(f"Backend: Received request for category: {category_name}, subcategory: {subcategory_name}")

    products_query = Product.query
    if category_name:
        category = Category.query.filter_by(name=category_name).first()
        if category:
            products_query = products_query.filter_by(category_id=category.id)
        else:
            return jsonify({"message": "Category not found"}), 404

    # Alt kategoriye göre filtreleme ekliyoruz
    # subcategory_name 'Tümü' ise veya hiç gönderilmediyse filtreleme yapmıyoruz
    if subcategory_name and subcategory_name != 'Tümü':
        products_query = products_query.filter_by(subcategory=subcategory_name)

    products_data = [product.to_dict() for product in products_query.all()]
    print(f"Backend: Returning {len(products_data)} products.")
    return jsonify(products_data)

@app.route('/api/categories', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    categories_data = [{"id": cat.id, "name": cat.name} for cat in categories]
    return jsonify(categories_data)

# --- Kullanıcı Yönetimi ---
@app.route('/api/register', methods=['POST'])
def register_user():
    data = request.get_json()
    first_name = data.get('firstName')
    last_name = data.get('lastName')
    email = data.get('email')
    password = data.get('password')

    if not first_name or not last_name or not email or not password:
        return jsonify({"message": "Tüm alanlar zorunludur."}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Bu e-posta adresi zaten kayıtlı."}), 409

    hashed_password = generate_password_hash(password)
    new_user = User(first_name=first_name, last_name=last_name, email=email, password_hash=hashed_password)

    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "Kayıt başarılı!", "user_id": new_user.id}), 201
    except Exception as e:
        db.session.rollback()
        if '1062' in str(e): # MySQL hatası kodu duplicate entry
            return jsonify({"message": "Bu e-posta adresi zaten kayıtlı."}), 409
        return jsonify({"message": f"Kayıt olurken bir hata oluştu: {str(e)}"}), 400

@app.route('/api/login', methods=['POST'])
def login_user():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"message": "Kullanıcı adı veya şifre hatalı."}), 401

    return jsonify({
        "message": "Giriş başarılı!",
        "user_email": user.email,
        "username": user.first_name.capitalize(),
        "full_name": f"{user.first_name.capitalize()} {user.last_name.capitalize()}",
        "first_name": user.first_name.capitalize(),
        "last_name": user.last_name.capitalize()
    }), 200

# Yeni API: Kullanıcı bilgilerini çekme
@app.route('/api/user/<string:email>', methods=['GET'])
def get_user_info(email):
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "Kullanıcı bulunamadı."}), 404

    # Şifre hash'ini güvenlik nedeniyle göndermiyoruz!
    return jsonify({
        "id": user.id, # <-- BU SATIRI EKLEYİN!
        "first_name": user.first_name.capitalize(),
        "last_name": user.last_name.capitalize(),
        "email": user.email
    }), 200


# Yeni API Rotaları: Sepet/Sipariş Yönetimi
@app.route('/api/checkout', methods=['POST'])
def checkout():
    data = request.get_json()
    user_email = data.get('userEmail')
    cart_items_data = data.get('cartItems')

    user = User.query.filter_by(email=user_email).first()
    if not user:
        return jsonify({"message": "Kullanıcı bulunamadı."}), 404

    if not cart_items_data:
        return jsonify({"message": "Sepet boş."}), 400

    total_amount = 0
    for item in cart_items_data:
        # Frontend'den gelen totalPrice'ı kullanıyoruz
        # Ancak frontend'den gelen fiyatın float olduğundan emin olalım
        try:
            total_amount += float(item.get('totalPrice', 0))
        except ValueError:
            return jsonify({"message": "Geçersiz ürün fiyatı formatı."}), 400


    # Yeni sipariş objesini oluştururken user_id, total_amount ve order_date'i doğru atayalım
    new_order = Order(
        user_id=user.id, # Kullanıcının id'si artık atanıyor
        total_amount=total_amount, # Hesaplanan toplam tutar atanıyor
        status='tamamlandı',
        order_date=datetime.now() # datetime import'unu da kullandığınızdan emin olun
    )

    try:
        db.session.add(new_order)
        db.session.flush() # new_order.id'ye erişmek için flush (Auto-increment ID'yi alır)

        for item_data in cart_items_data:
            # Ürün ID'sinin varlığını kontrol et
            product_exists = Product.query.get(item_data['id'])
            if not product_exists:
                # Eğer ürün bulunamazsa bir uyarı veya hata döndürebilirsiniz
                # Şimdilik hata fırlatalım ve işlemi geri alalım
                raise ValueError(f"Product with ID {item_data['id']} not found.")

            order_item = OrderItem(
                order_id=new_order.id,
                product_id=item_data['id'],
                quantity=item_data['quantity'],
                price_at_purchase=item_data['price'] # Ürünün o anki birim fiyatı
            )
            db.session.add(order_item)

        db.session.commit()
        return jsonify({"message": "Siparişiniz başarıyla oluşturuldu!", "orderId": new_order.id}), 201
    except ValueError as ve:
        db.session.rollback()
        print(f"Sipariş oluşturulurken veri hatası: {ve}")
        return jsonify({"message": str(ve)}), 400
    except Exception as e:
        db.session.rollback()
        print(f"Sipariş oluşturulurken genel hata: {e}")
        return jsonify({"message": f"Sipariş oluşturulurken bir hata oluştu: {str(e)}"}), 500


@app.route('/api/user/<int:user_id>/orders', methods=['GET'])
def get_user_orders(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "Kullanıcı bulunamadı."}), 404

    orders = Order.query.filter_by(user_id=user_id).order_by(Order.order_date.desc()).all()

    # Her bir siparişi ve içindeki kalemleri to_dict metoduyla döndür
    orders_data = [order.to_dict() for order in orders]

    return jsonify(orders_data), 200


# --- ML Öneri Sistemi Simülasyonu ---
@app.route('/api/recommendations/<int:product_id>', methods=['GET'])
def get_product_recommendations(product_id):
    bought_product = Product.query.get(product_id)
    if not bought_product:
        return jsonify([]), 200

    recommended_ids_str = bought_product.recommends_ids
    if not recommended_ids_str:
        return jsonify([]), 200

    recommended_ids = [int(x) for x in recommended_ids_str.split(',') if x.strip()]

    # Sepete eklenmiş olanları önermemek için ek kontrol (opsiyonel)
    # Bu kısmı frontend'de de yönetebilirsiniz
    # in_cart_product_ids = request.args.get('in_cart_product_ids')
    # if in_cart_product_ids:
    #     in_cart_product_ids_list = [int(x) for x in in_cart_product_ids.split(',')]
    #     recommended_ids = [id for id in recommended_ids if id not in in_cart_product_ids_list]

    recommended_products = Product.query.filter(Product.id.in_(recommended_ids)).all()

    return jsonify([product.to_dict() for product in recommended_products]), 200

# --- Veritabanı Oluşturma ve Başlangıç Verileri İçin Flask CLI Komutu ---
@app.cli.command('create-db')
def create_db_command():
    """Veritabanı tablolarını oluşturur ve başlangıç verilerini ekler."""
    with app.app_context(): # Uygulama bağlamını oluştur
        try:
            db.create_all() # MySQL'de tabloları oluştur
            print("Veritabanı tabloları oluşturuldu.")

            # Kategori tablosunda veri olup olmadığını kontrol et
            if Category.query.first() is None:
                add_initial_data()
                print("Başlangıç verileri eklendi.")
            else:
                print("Veritabanında zaten veri var, ekleme atlandı.")
        except Exception as e:
            print(f"Veritabanı oluşturulurken veya veri eklenirken hata oluştu: {str(e)}")
            print("MySQL bağlantı ayarlarınızı ve veritabanı adınızı kontrol edin.")
            print("Veritabanının (shopino_db gibi) MySQL Workbench'te oluşturulduğundan emin olun.")

def add_initial_data():
    # Mevcut veriyi temizle (opsiyonel, dikkatli kullanın)
    # db.session.query(OrderItem).delete()
    # db.session.query(Order).delete()
    # db.session.query(Product).delete()
    # db.session.query(Category).delete()
    # db.session.query(User).delete()
    # db.session.commit()

    cat_atistirmalik = Category(id=1, name='Atıştırmalık')
    cat_icecek = Category(id=2, name='İçecek')
    cat_meyve_sebze = Category(id=3, name='Meyve & Sebze')
    cat_sut_urunleri = Category(id=4, name='Süt Ürünleri')
    cat_temel_gida = Category(id=5, name='Temel Gıda')
    cat_et_urunleri = Category(id=6, name='Et Ürünleri')
    cat_kisisel_bakim = Category(id=7, name='Kişisel Bakım')
    cat_ev_yasam = Category(id=8, name='Ev ve Yaşam')

    if not Category.query.first():
        db.session.add_all([cat_atistirmalik, cat_icecek, cat_meyve_sebze, cat_sut_urunleri, cat_temel_gida, cat_et_urunleri, cat_kisisel_bakim, cat_ev_yasam])
        db.session.commit()
    else:
        # Eğer kategoriler zaten varsa, mevcut objeleri çekiyoruz
        cat_atistirmalik = Category.query.get(1)
        cat_icecek = Category.query.get(2)
        cat_meyve_sebze = Category.query.get(3)
        cat_sut_urunleri = Category.query.get(4)
        cat_temel_gida = Category.query.get(5)
        cat_et_urunleri = Category.query.get(6)
        cat_kisisel_bakim = Category.query.get(7)
        cat_ev_yasam = Category.query.get(8)

    products_list = [
        # Atıştırmalıklar
        Product(id=1, name='Doritos Taco Baharatlı Mısır Cipsi', price=64.50, image_url='https://i.imgur.com/bYrQVzY.jpeg', subcategory='Cips', recommends_ids='9,25', category=cat_atistirmalik),
        Product(id=2, name='Lay\'s Klasik Patates Cipsi', price=68.75, image_url='https://i.imgur.com/7ZO9vJv.jpeg', subcategory='Cips', recommends_ids='9,25', category=cat_atistirmalik),
        Product(id=3, name='Doritos Nacho Peynirli Mısır Cipsi', price=64.50, image_url='https://i.imgur.com/eBqSaNe.jpeg', subcategory='Cips', recommends_ids='9,25', category=cat_atistirmalik),
        Product(id=4, name='Ruffles Originals Patates Cipsi', price=68.75, image_url='https://i.imgur.com/7cskoKO.jpeg', subcategory='Cips', recommends_ids='9,25', category=cat_atistirmalik),
        Product(id=5, name='Çerezza Popcorn Patlamış Mısır', price=35.00, image_url='https://i.imgur.com/vWlY3dB.jpeg', subcategory='Cips', recommends_ids='9,25', category=cat_atistirmalik),
        Product(id=6, name='Nestle Damak Antep Fıstıklı Sütlü Kare Çikolata', price=83.95, image_url='https://i.imgur.com/fnsZ1sx.jpeg', subcategory='Çikolata', recommends_ids='3,15', category=cat_atistirmalik),
        Product(id=7, name='Ülker Bitter Kare Çikolata %80 Kakaolu', price=54.95, image_url='https://i.imgur.com/yAgMaNa.jpeg', subcategory='Çikolata', recommends_ids='3,15', category=cat_atistirmalik),
        Product(id=8, name='Eti Sütlü Kare Çikolata', price=52.95, image_url='https://i.imgur.com/0Vk9uEh.png', subcategory='Çikolata', recommends_ids='3,15', category=cat_atistirmalik),
        Product(id=9, name='Ülker Bütün Antep Fıstıklı Sütlü Kare Çikolata', price=84.00, image_url='https://i.imgur.com/Zsih3Hm.jpeg', subcategory='Çikolata', recommends_ids='3,15', category=cat_atistirmalik),
        Product(id=10, name='Ülker Fındıklı Sütlü Kare Çikolata', price=56.95, image_url='https://i.imgur.com/uuYAHPI.jpeg', subcategory='Çikolata', recommends_ids='3,15', category=cat_atistirmalik),
        Product(id=11, name='Kinder Joy 3\'lü Paket', price=79.95, image_url='https://i.imgur.com/G6JkIyh.jpeg', subcategory='Çikolata', recommends_ids='3,15', category=cat_atistirmalik),
        Product(id=12, name='Eti Topkek Fındıklı Kakaolu Kek', price=8.95, image_url='https://i.imgur.com/94U0hh9.jpeg', subcategory='Kek', recommends_ids='11,28', category=cat_atistirmalik),
        Product(id=13, name='Eti Topkek Meyveli Kek', price=8.95, image_url='https://i.imgur.com/F5Z8NN4.jpeg', subcategory='Kek', recommends_ids='11,28', category=cat_atistirmalik),
        Product(id=14, name='Eti Browni Gold Çikolatalı Kek', price=9.95, image_url='https://i.imgur.com/k4lR4Tv.jpeg', subcategory='Kek', recommends_ids='11,28', category=cat_atistirmalik),
        Product(id=15, name='Eti Browni Gold Vişneli Çikolatalı Kek', price=10.95, image_url='https://i.imgur.com/kTpHGNR.jpeg', subcategory='Kek', recommends_ids='11,28', category=cat_atistirmalik),
        Product(id=16, name='Ülker Kekstra Mini Çilekli', price=32.95, image_url='https://i.imgur.com/hjbyEcd.jpeg', subcategory='Kek', recommends_ids='11,28', category=cat_atistirmalik),
        Product(id=17, name='Eti Browni Intense Mini Çikolatalı Kek', price=60.00, image_url='https://i.imgur.com/ZOTAihq.jpeg', subcategory='Kek', recommends_ids='11,28', category=cat_atistirmalik),
        Product(id=18, name='Ülker Çokoprens 10\'lu Paket', price=49.95, image_url='https://i.imgur.com/NDEftJT.jpeg', subcategory='Bisküvi', recommends_ids='15,27', category=cat_atistirmalik),
        Product(id=19, name='Ülker Pötibör Bisküvi', price=53.00, image_url='https://i.imgur.com/u68Qjny.jpeg', subcategory='Bisküvi', recommends_ids='15,27', category=cat_atistirmalik),
        Product(id=20, name='Hanımeller Çokodamla Rulo', price=12.00, image_url='https://i.imgur.com/DPdrpgF.jpeg', subcategory='Bisküvi', recommends_ids='15,27', category=cat_atistirmalik),
        Product(id=21, name='Ülker Hanımeller Fındıklı Rulo', price=12.00, image_url='https://i.imgur.com/g3UKQkZ.jpeg', subcategory='Bisküvi', recommends_ids='15,27', category=cat_atistirmalik),
        Product(id=22, name='Biskrem Kakaolu', price=15.95, image_url='https://i.imgur.com/bIOLiDx.jpeg', subcategory='Bisküvi', recommends_ids='15,27', category=cat_atistirmalik),
        Product(id=23, name='Oreo Original', price=41.55, image_url='https://i.imgur.com/J3Gzokh.jpeg', subcategory='Bisküvi', recommends_ids='15,27', category=cat_atistirmalik),
        Product(id=24, name='Ülker Tuzlu Çubuk Kraker', price=5.00, image_url='https://i.imgur.com/SV0xeTZ.jpeg', subcategory='Kraker & Kurabiye', recommends_ids='10', category=cat_atistirmalik),
        Product(id=25, name='Eti Susamlı Çubuk Kraker', price=22.50, image_url='https://i.imgur.com/gyMShXb.jpeg', subcategory='Kraker & Kurabiye', recommends_ids='10', category=cat_atistirmalik),
        Product(id=26, name='Eti Balık Kraker', price=8.50, image_url='https://i.imgur.com/U07K9ex.jpeg', subcategory='Kraker & Kurabiye', recommends_ids='10', category=cat_atistirmalik),
        Product(id=27, name='Eti Crax Baharatlı Çubuk Kraker', price=12.50, image_url='https://i.imgur.com/4iIC8Lk.jpeg', subcategory='Kraker & Kurabiye', recommends_ids='10', category=cat_atistirmalik),
        Product(id=28, name='Eti Crax Peynirli Çubuk Kraker', price=12.50, image_url='https://i.imgur.com/iThZ3oW.jpeg', subcategory='Kraker & Kurabiye', recommends_ids='10', category=cat_atistirmalik),
        Product(id=29, name='Haribo Starmix', price=29.95, image_url='https://i.imgur.com/BLZCHOL.jpeg', subcategory='Sakız & Şekerleme', recommends_ids='2', category=cat_atistirmalik),
        Product(id=30, name='Haribo Altın Ayıcık', price=29.95, image_url='https://i.imgur.com/DVVAWLv.jpeg', subcategory='Sakız & Şekerleme', recommends_ids='2', category=cat_atistirmalik),
        Product(id=31, name='Olips Mentol Stick', price=16.45, image_url='https://i.imgur.com/F67h7Ex.jpeg', subcategory='Sakız & Şekerleme', recommends_ids='2', category=cat_atistirmalik),
        Product(id=32, name='Olips C Vitaminli Stick', price=16.45, image_url='https://i.imgur.com/McrHdkf.jpeg', subcategory='Sakız & Şekerleme', recommends_ids='2', category=cat_atistirmalik),
        Product(id=33, name='Falım 5\'li Nane Aromalı Şekersiz Sakız', price=32.50, image_url='https://i.imgur.com/IdFDjB6.jpeg', subcategory='Sakız & Şekerleme', recommends_ids='2', category=cat_atistirmalik),
        Product(id=34, name='Tadım Bol Tuzlu Kavrulmuş Siyah Ayçekirdek', price=50.00, image_url='https://i.imgur.com/Ezdivrg.jpeg', subcategory='Kuruyemiş', recommends_ids='9,10', category=cat_atistirmalik),
        Product(id=35, name='Tadım Kavrulmuş Fındık İçi', price=199.95, image_url='https://i.imgur.com/rbPmOUm.jpeg', subcategory='Kuruyemiş', recommends_ids='9,10', category=cat_atistirmalik),
        Product(id=36, name='Tadım Çifte Kavrulmuş Sarı Leblebi', price=51.95, image_url='https://i.imgur.com/gQvNOLh.jpeg', subcategory='Kuruyemiş', recommends_ids='9,10', category=cat_atistirmalik),
        Product(id=37, name='Tadım Kavrulmuş Kuruyemiş Klasik', price=101.95, image_url='https://i.imgur.com/ltWIhXk.jpeg', subcategory='Kuruyemiş', recommends_ids='9,10', category=cat_atistirmalik),
        Product(id=38, name='Tadım Tuzlu Yer Fıstığı', price=45.95, image_url='https://i.imgur.com/47O1bYt.jpeg', subcategory='Kuruyemiş', recommends_ids='9,10', category=cat_atistirmalik),
        
        # İçecekler
        Product(id=39, name='Coca Cola 1 L', price=45.00, image_url='https://i.imgur.com/v7psulZ.jpeg', subcategory='Gazlı İçecekler', recommends_ids='1,8,25', category=cat_icecek),
        Product(id=40, name='Fanta Portakal Pet 1 L', price=40.00, image_url='https://i.imgur.com/P8BANL3.jpeg', subcategory='Gazlı İçecekler', recommends_ids='1,8,25', category=cat_icecek),
        Product(id=41, name='Sprite 1 L', price=45.00, image_url='https://i.imgur.com/Wl6sLRA.jpeg', subcategory='Gazlı İçecekler', recommends_ids='1,8,25', category=cat_icecek),
        Product(id=42, name='Nestle Pure Life Suyu 10 L', price=59.50, image_url='https://i.imgur.com/4p6sgnp.jpeg', subcategory='Su & Maden Suyu', recommends_ids='6', category=cat_icecek),
        Product(id=43, name='Erikli Su 5 L', price=32.50, image_url='https://i.imgur.com/nrjUCnS.jpeg', subcategory='Su & Maden Suyu', recommends_ids='6', category=cat_icecek),
        Product(id=44, name='Beypazarı Sade Maden Suyu 6\'lı', price=35.50, image_url='https://i.imgur.com/W0GuOyK.jpeg', subcategory='Su & Maden Suyu', recommends_ids='6', category=cat_icecek),
        Product(id=45, name='Dimes Şeftali Nektarı 1 L', price=50.95, image_url='https://i.imgur.com/v0oiQEh.jpeg', subcategory='Meyve Suları', recommends_ids='4,12', category=cat_icecek),
        Product(id=46, name='Dimes Vişne Nektarı 1 L', price=55.95, image_url='https://i.imgur.com/oQ2UBhg.jpeg', subcategory='Meyve Suları', recommends_ids='4,12', category=cat_icecek),
        Product(id=47, name='Kurukahveci Mehmet Efendi Türk Kahvesi', price=72.75, image_url='https://i.imgur.com/bMhhq4i.jpeg', subcategory='Kahve & Çay', recommends_ids='5,15', category=cat_icecek),
        Product(id=48, name='Lipton Tiryaki Çay 1 Kg', price=179.95, image_url='https://i.imgur.com/CQ70sx4.jpeg', subcategory='Kahve & Çay', recommends_ids='4,26', category=cat_icecek),
        
        # Meyve & Sebze
        Product(id=49, name='Elma Starking Kg', price=79.95, image_url='https://i.imgur.com/eVhO9W7.jpeg', subcategory='Meyveler', recommends_ids='11,30', category=cat_meyve_sebze),
        Product(id=50, name='Patates Yeni Mahsul Kg', price=19.95, image_url='https://i.imgur.com/OkOA2sG.jpeg', subcategory='Sebzeler', recommends_ids='17,34', category=cat_meyve_sebze),
        Product(id=51, name='Soğan Kuru Kg', price=11.95, image_url='https://i.imgur.com/dzrVZiI.jpeg', subcategory='Sebzeler', recommends_ids='19,29', category=cat_meyve_sebze),
        Product(id=52, name='Maydanoz Adet', price=17.95, image_url='https://i.imgur.com/rR33gPu.jpeg', subcategory='Yeşillikler', recommends_ids='14,20', category=cat_meyve_sebze),
        Product(id=53, name='Marul Adet', price=39.50, image_url='https://i.imgur.com/PCKGdNM.jpeg', subcategory='Yeşillikler', recommends_ids='14,20', category=cat_meyve_sebze),
        Product(id=54, name='Muz İthal Kg', price=119.95, image_url='https://i.imgur.com/xhYsLfD.jpeg', subcategory='Meyveler', recommends_ids='4,16', category=cat_meyve_sebze),

        # Süt Ürünleri
        Product(id=55, name='Sek Süt 1 L', price=33.90, image_url='https://i.imgur.com/gfqA9XB.jpeg', subcategory='Sütler', recommends_ids='2,4,26,27,28', category=cat_sut_urunleri),
        Product(id=56, name='İçim Rahat Laktozsuz Süt 1 L', price=49.75, image_url='https://i.imgur.com/petg0b9.jpeg', subcategory='Sütler', recommends_ids='2,4,26,27,28', category=cat_sut_urunleri),
        Product(id=57, name='Sütaş Kaymaksız Yoğurt 1000 G', price=57.50, image_url='https://i.imgur.com/N8O9TWr.jpeg', subcategory='Yoğurtlar', recommends_ids='5,30', category=cat_sut_urunleri),
        Product(id=58, name='İçim Yoğurt Süzme 900 G', price=67.50, image_url='https://i.imgur.com/YyaEBla.jpeg', subcategory='Yoğurtlar', recommends_ids='5,30', category=cat_sut_urunleri),
        Product(id=59, name='Pınar Labne 180 G', price=59.00, image_url='https://i.imgur.com/z8beQVh.jpeg', subcategory='Peynirler', recommends_ids='13,35', category=cat_sut_urunleri),
        Product(id=60, name='Sütaş Süzme Peynir 250 G', price=65.50, image_url='https://i.imgur.com/J0zzWfV.jpeg', subcategory='Peynirler', recommends_ids='13,35', category=cat_sut_urunleri),
        Product(id=61, name='Sütaş Tereyağı 125 G', price=69.95, image_url='https://i.imgur.com/EOnCXmv.jpeg', subcategory='Tereyağı & Margarin', recommends_ids='28', category=cat_sut_urunleri),
        Product(id=62, name='Teremyağ Paket Margarin 250 G', price=41.75, image_url='https://i.imgur.com/5jDNpgC.jpeg', subcategory='Tereyağı & Margarin', recommends_ids='28', category=cat_sut_urunleri),
        Product(id=63, name='Bizim Paket Margarin 250 G', price=35.50, image_url='https://i.imgur.com/BqhGnrx.jpeg', subcategory='Tereyağı & Margarin', recommends_ids='28', category=cat_sut_urunleri),

        # Temel Gıda
        Product(id=64, name='Filiz Burgu Makarna 500 G', price=27.95, image_url='https://i.imgur.com/6kAXCgh.jpeg', subcategory='Makarna & Pirinç', recommends_ids='13,19', category=cat_temel_gida),
        Product(id=65, name='Filiz Spagetti (Çubuk) Makarna 500 G', price=27.95, image_url='https://i.imgur.com/uZCReFB.jpeg', subcategory='Makarna & Pirinç', recommends_ids='19', category=cat_temel_gida),
        Product(id=66, name='Tat Basmati Pirinç 1 Kg', price=85.95, image_url='https://i.imgur.com/eL55Gi3.jpeg', subcategory='Makarna & Pirinç', recommends_ids='19', category=cat_temel_gida),
        Product(id=67, name='Yayla Kırmızı Mercimek 1 Kg', price=77.95, image_url='https://i.imgur.com/bY4QtWk.jpeg', subcategory='Bakliyat', recommends_ids='', category=cat_temel_gida),
        Product(id=68, name='Yudum Ayçiçek Yağı 4 L', price=650.00, image_url='https://i.imgur.com/owvRBXd.jpeg', subcategory='Yağlar', recommends_ids='13', category=cat_temel_gida),
        Product(id=69, name='Komili Naturel Sızma Zeytinyağı Yumuşak Lezzet 2 L', price=656.95, image_url='https://i.imgur.com/qAo79VW.jpeg', subcategory='Yağlar', recommends_ids='13', category=cat_temel_gida),
        Product(id=70, name='Reis Yeşil Mercimek 1 Kg', price=191.95, image_url='https://i.imgur.com/lPYQVGp.jpeg', subcategory='Bakliyat', recommends_ids='19', category=cat_temel_gida),
        Product(id=71, name='Torku Toz Şeker 5 Kg', price=199.95, image_url='https://i.imgur.com/VmROpxN.jpeg', subcategory='Un & Şeker', recommends_ids='13,19', category=cat_temel_gida),
        Product(id=72, name='Söke Un 5 Kg', price=66.25, image_url='https://i.imgur.com/KlavbKW.png', subcategory='Un & Şeker', recommends_ids='13,19', category=cat_temel_gida),
        Product(id=73, name='Söke Tam Buğday Unu 1 Kg', price=54.95, image_url='https://i.imgur.com/BmF7Lob.jpeg', subcategory='Un & Şeker', recommends_ids='13,19', category=cat_temel_gida),
        Product(id=74, name='Billur Tuz Rafine İyotlu Sofra Tuzu 750 G', price=27.95, image_url='https://i.imgur.com/uy7fPYz.jpeg', subcategory='Baharatlar', recommends_ids='13,19', category=cat_temel_gida),
        Product(id=75, name='Knorr Karabiber 60 G', price=65.95, image_url='https://i.imgur.com/EupWDst.jpeg', subcategory='Baharatlar', recommends_ids='13,19', category=cat_temel_gida),
        Product(id=76, name='Knorr Pul Biber 65 G', price=49.95, image_url='https://i.imgur.com/kfq3Qcb.jpeg', subcategory='Baharatlar', recommends_ids='13,19', category=cat_temel_gida),
        Product(id=77, name='Knorr Sumak 70 G', price=49.95, image_url='https://i.imgur.com/vzPZlBi.jpeg', subcategory='Baharatlar', recommends_ids='13,19', category=cat_temel_gida),


        # Et Ürünleri
        Product(id=78, name='Dana Kıymalık Kg', price=599.95, image_url='https://i.imgur.com/gIgzl2l.jpeg', subcategory='Kırmızı Et', recommends_ids='18,17', category=cat_et_urunleri),
        Product(id=79, name='Dana Kuşbaşı Kg', price=739.95, image_url='https://i.imgur.com/mfOE17d.jpeg', subcategory='Kırmızı Et', recommends_ids='18,17', category=cat_et_urunleri),
        Product(id=80, name='Banvit Piliç Bonfile Kg', price=189.95, image_url='https://i.imgur.com/9Gyu9mD.jpeg', subcategory='Beyaz Et', recommends_ids='14,29', category=cat_et_urunleri),
        Product(id=81, name='Banvit Piliç Kanat Kg', price=334.95, image_url='https://i.imgur.com/KZee5Dl.jpeg', subcategory='Beyaz Et', recommends_ids='14,29', category=cat_et_urunleri),
        Product(id=82, name='Namet Hindi Füme 7/24 60 G', price=25.25, image_url='https://i.imgur.com/C3Zvk70.jpeg', subcategory='Şarküteri', recommends_ids='31', category=cat_et_urunleri),
        Product(id=83, name='Namet Kangal Sucuk 240 G', price=355.95, image_url='https://i.imgur.com/uSdJad0.jpeg', subcategory='Şarküteri', recommends_ids='31', category=cat_et_urunleri),
        Product(id=84, name='Çipura Kg', price=299.90, image_url='https://i.imgur.com/kcUV5xi.jpeg', subcategory='Deniz Ürünleri', recommends_ids='13', category=cat_et_urunleri),
        Product(id=85, name='Levrek Kg', price=549.90, image_url='https://i.imgur.com/73yEgLF.jpeg', subcategory='Deniz Ürünleri', recommends_ids='13', category=cat_et_urunleri),

        # Kişisel Bakım
        Product(id=86, name='Elseve Hydra Hyaluronic Nem Dolduran Şampuan 360ml', price=135.50, image_url='https://i.imgur.com/E81wdU8.jpeg', subcategory='Saç Bakımı', recommends_ids='36', category=cat_kisisel_bakim),
        Product(id=87, name='Elseve Hydra Hyaluronik 390 ml Saç Bakım Kremi', price=153.90, image_url='https://i.imgur.com/nAZlrHz.jpeg', subcategory='Saç Bakımı', recommends_ids='36', category=cat_kisisel_bakim),
        Product(id=88, name='Pantene 3\'ü 1 Arada Şampuan, Saç Bakım Kremi, Bakım Kürü Doğal Sentez Güç ve Parlaklık', price=129.00, image_url='https://i.imgur.com/jslRrCK.jpeg', subcategory='Saç Bakımı', recommends_ids='36', category=cat_kisisel_bakim),
        Product(id=89, name='Pantene Pro-V Koruyucu ve Onarıcı - Saç Bakım Kremi 275ml', price=102.50, image_url='https://i.imgur.com/Zo2D87e.jpeg', subcategory='Saç Bakımı', recommends_ids='21', category=cat_kisisel_bakim),
        Product(id=90, name='Colgate Diş Macunu Max White Kalıcı Beyazlık 75 Ml', price=120.00, image_url='https://i.imgur.com/7hGw5Wt.jpeg', subcategory='Ağız Bakımı', recommends_ids='37', category=cat_kisisel_bakim),
        Product(id=91, name='Listerine Cool Mint Ağız Bakım Suyu', price=114.99, image_url='https://i.imgur.com/rGtSiXD.jpeg', subcategory='Ağız Bakımı', recommends_ids='22', category=cat_kisisel_bakim),
        Product(id=92, name='Nivea Sun Koruma ve Nem Güneş Spreyi 200 ml', price=329.90, image_url='https://i.imgur.com/fKMeAZJ.jpeg', subcategory='Cilt Bakımı', recommends_ids='', category=cat_kisisel_bakim),
        Product(id=93, name='Garnier Micellar Water Hassas Cilt Temizleyici 200 ml', price=176.00, image_url='https://i.imgur.com/OQGhk0v.jpeg', subcategory='Cilt Bakımı', recommends_ids='', category=cat_kisisel_bakim),
        Product(id=94, name='Emotion Ocean Fresh Kadın Deodorant 150 ml', price=125.00, image_url='https://i.imgur.com/RaUuLiJ.jpeg', subcategory='Deodorantlar', recommends_ids='', category=cat_kisisel_bakim),
        Product(id=95, name='Nivea Men Dry Fresh Anti-Perspirant Deodorant 150ml', price=109.65, image_url='https://i.imgur.com/SFvR0gj.jpeg', subcategory='Deodorantlar', recommends_ids='', category=cat_kisisel_bakim),
        Product(id=96, name='Gilette Permatik Kullan At Tıraş Bıçağı 10\'lu', price=140.00, image_url='https://i.imgur.com/nAgcH5m.jpeg', subcategory='Tıraş Ürünleri', recommends_ids='', category=cat_kisisel_bakim),
        Product(id=97, name='Gillette Series Moisturizing Nemlendirici Tıraş Jeli 200 ml', price=225.00, image_url='https://i.imgur.com/dV8LhF7.jpeg', subcategory='Tıraş Ürünleri', recommends_ids='', category=cat_kisisel_bakim),

        # Ev ve Yaşam
        Product(id=98, name='Asperox Sarı Güç Sprey 1 L', price=74.95, image_url='https://i.imgur.com/tefKiWC.jpeg', subcategory='Temizlik Ürünleri', recommends_ids='17', category=cat_ev_yasam),
        Product(id=99, name='Sleepy Easy Clean Beyaz Sabun Katkılı Yüzey Temizlik Havlusu', price=85.65, image_url='https://i.imgur.com/29hFE6j.jpeg', subcategory='Kağıt Ürünleri', recommends_ids='38', category=cat_ev_yasam),
        Product(id=100, name='Selpak Kağıt Havlu 12\'li', price=60.00, image_url='https://i.imgur.com/GINn9Sr.jpeg', subcategory='Kağıt Ürünleri', recommends_ids='24', category=cat_ev_yasam),
        Product(id=101, name='Selpak 32 Rulo Tuvalet Kağıdı', price=289.90, image_url='https://i.imgur.com/weH7Rdn.jpeg', subcategory='Kağıt Ürünleri', recommends_ids='24', category=cat_ev_yasam),
        Product(id=102, name='Cif Zemin Temizleyici Lotus 1.5 L', price=75.95, image_url='https://i.imgur.com/rLMGuG0.jpeg', subcategory='Temizlik Ürünleri', recommends_ids='23', category=cat_ev_yasam),
        Product(id=103, name='Omo Active Oxygen Etkisi Sıvı Çamaşır Deterjanı Beyazlar İçin', price=305.95, image_url='https://i.imgur.com/wVn1JnJ.jpeg', subcategory='Çamaşır Bakımı', recommends_ids='24', category=cat_ev_yasam),
        Product(id=104, name='Ariel Matik Dağ Esintisi Toz Deterjan 6 Kg', price=625.00, image_url='https://i.imgur.com/jg7DXCv.jpeg', subcategory='Çamaşır Bakımı', recommends_ids='24', category=cat_ev_yasam),
        Product(id=105, name='Pril Elde Yıkama Sıvı Bulaşık Deterjanı 750ml', price=79.95, image_url='https://i.imgur.com/dR053wR.jpeg', subcategory='Mutfak Malzemeleri', recommends_ids='24', category=cat_ev_yasam),
        Product(id=106, name='Fairy Platinum Bulaşık Makinesi Tablet 60 Adet', price=577.95, image_url='https://i.imgur.com/AMc1mQQ.jpeg', subcategory='Mutfak Malzemeleri', recommends_ids='24', category=cat_ev_yasam),
    ]
    
    for product_data in products_list:
        existing_product = Product.query.get(product_data.id)
        if existing_product:
            # Ürün zaten varsa güncelle
            existing_product.name = product_data.name
            existing_product.price = product_data.price
            existing_product.image_url = product_data.image_url
            existing_product.subcategory = product_data.subcategory
            existing_product.recommends_ids = product_data.recommends_ids
            existing_product.category = product_data.category
            db.session.add(existing_product) # Güncellenen objeyi session'a ekle
        else:
            # Ürün yoksa ekle
            db.session.add(product_data)
    
    db.session.commit()

@app.cli.command('generate-recommendations')
def generate_recommendations_command():
    """Geçmiş sipariş verilerine göre ürün önerilerini (birliktelik kuralları) oluşturur ve veritabanını günceller."""
    with app.app_context():
        print("Ürün önerileri oluşturuluyor...")
        try:
            # 1. Sipariş verilerini çekme
            orders = Order.query.all()
            if not orders:
                print("Veritabanında hiç sipariş bulunamadı. Öneri oluşturulamıyor.")
                return

            # Her sipariş için ürün ID'lerini içeren bir liste oluşturma
            transactions = []
            for order in orders:
                product_ids_in_order = [item.product_id for item in order.items]
                if product_ids_in_order:
                    transactions.append(product_ids_in_order)

            if not transactions:
                print("Siparişlerde ürün bilgisi bulunamadı. Öneri oluşturulamıyor.")
                return

            # Tüm benzersiz ürün ID'lerini al
            all_product_ids = sorted(list(set(pid for sublist in transactions for pid in sublist)))

            # 2. One-Hot Encoding formatına dönüştürme (Apriori için gerekli)
            oht = []
            for transaction in transactions:
                row = [1 if product_id in transaction else 0 for product_id in all_product_ids]
                oht.append(row)

            df = pd.DataFrame(oht, columns=[f'product_{pid}' for pid in all_product_ids])

            # 3. Apriori algoritmasını çalıştırma
            frequent_itemsets = apriori(df, min_support=0.01, use_colnames=True)
            if frequent_itemsets.empty:
                print("Belirtilen destek seviyesinde sık öğe kümesi bulunamadı. min_support değerini düşürmeyi deneyin.")
                return

            # 4. Birliktelik kurallarını oluşturma
            # min_confidence yerine metric="confidence" ve min_threshold=0.5 kullanıyoruz
            rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=0.5) # <-- BU SATIRI GÜNCELLEYİN!

            # 5. Ürünlerin recommends_ids alanını güncelleme
            product_recommendations = {}
            for product_id in all_product_ids:
                product_recommendations[product_id] = []

            for index, row in rules.iterrows():
                antecedents = list(row['antecedents'])
                consequents = list(row['consequents'])

                if len(antecedents) == 1:
                    antecedent_product_id_str = antecedents[0].replace('product_', '')
                    antecedent_product_id = int(antecedent_product_id_str)

                    for consequent_product_id_str in consequents:
                        consequent_product_id = int(consequent_product_id_str.replace('product_', ''))
                        if antecedent_product_id != consequent_product_id:
                            if consequent_product_id not in product_recommendations[antecedent_product_id]:
                                product_recommendations[antecedent_product_id].append(consequent_product_id)

            # Veritabanındaki Product modellerini güncelle
            for product_id, rec_ids in product_recommendations.items():
                product = Product.query.get(product_id)
                if product:
                    product.recommends_ids = ','.join(map(str, rec_ids))
                    db.session.add(product)

            db.session.commit()
            print("Ürün önerileri başarıyla oluşturuldu ve veritabanı güncellendi.")

        except Exception as e:
            db.session.rollback()
            print(f"Öneri oluşturulurken hata oluştu: {str(e)}")
            print("Veritabanında yeterli ve çeşitli sipariş verisi olduğundan emin olun.")


# ... (Uygulamayı Çalıştırma kısmı) ...
if __name__ == '__main__':
    app.run(debug=True, port=5000)