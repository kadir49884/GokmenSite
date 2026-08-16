# Bayram İş Kıyafetleri

İş kıyafeti kataloğu ve yönetim paneli. Müşteriler ürünleri görüntüler, seçeneklerini işaretleyip
**ürün talebi** oluşturur; yönetici ürünleri, talepleri ve site bilgilerini panelden yönetir.

## Kurulum

```bash
npm install
copy .env.example .env   # ADMIN_PASSWORD değerini değiştirin
npm run seed             # örnek ürünleri ekler (isteğe bağlı)
npm start
```

- Site: http://localhost:3000
- Yönetim paneli: http://localhost:3000/admin.html (varsayılan şifre: `admin123`)

İlk iş olarak panelde **Site Bilgileri** sekmesini doldurun. Telefon ve WhatsApp numarası boş olduğu
sürece iletişim butonları sitede görünmez.

## Sayfalar

| Sayfa | Adres | İçerik |
| --- | --- | --- |
| Ürünler | `/` | Tanıtım bölümü, arama, kategori ve stok filtresi, ürün kartları |
| Ürün detayı | `/urun.html?id=1` | Fotoğraf galerisi, özellikler, WhatsApp bağlantısı, talep formu |
| İletişim | `/iletisim.html` | Hakkımızda metni ve iletişim bilgileri |
| Yönetim | `/admin.html` | Ürünler, Talepler ve Site Bilgileri sekmeleri |

## Ürün alanları

| Alan | Örnek |
| --- | --- |
| Ürün Kodu | 201 |
| Ürün Bilgisi | Erkek İş Önlüğü |
| Kategori | Önlük |
| Açıklama | Yaka ve cep ağzı garnili, çıtçıtlı iş önlüğü. |
| Kumaş Tipi | Alpaka, Gabardin |
| Mevcut Bedenler | S, M, L, XL, XXL |
| Mevcut Renkler | Siyah, Beyaz |
| Kol Tipi | Uzun Kol, Kısa Kol |
| Kapanma Şekli | Düğmeli, Çıtçıtlı |
| Fiyat | 250 TL |
| Stok Durumu | Mevcut / Mevcut Değil |
| Görseller | /images/onluk-beyaz.png, /images/onluk-lacivert.png |

Çok değerli alanlar panelde **virgülle** ayrılarak girilir. Boş bırakılan alan ürün sayfasında hiç
gösterilmez; örneğin pantolonda kol tipi sorulmaz. Görselleri panelden yükleyebilirsiniz
(png, jpg, webp; en fazla 5 MB) veya `public/images/` klasörüne kopyalayıp
`/images/dosya-adi.png` şeklinde yazabilirsiniz.

## Klasörler

```
server/         Express API, SQLite erişimi, doğrulama ve dosya yükleme
public/         Statik site (vitrin + yönetim paneli)
public/images/  Ürün fotoğrafları
data/           SQLite veritabanı (otomatik oluşur)
```

## API

| Yöntem | Adres | Yetki | Açıklama |
| --- | --- | --- | --- |
| GET | /api/products?search=&category=&inStock=1 | – | Ürün listesi |
| GET | /api/products/:id | – | Ürün detayı |
| GET | /api/categories | – | Kullanılan kategoriler |
| POST | /api/products | Yönetici | Ürün ekle |
| PUT | /api/products/:id | Yönetici | Ürün güncelle |
| DELETE | /api/products/:id | Yönetici | Ürün sil |
| POST | /api/uploads | Yönetici | Görsel yükle, adresini döner |
| POST | /api/requests | – | Ürün talebi oluştur |
| GET | /api/requests?status= | Yönetici | Talep listesi |
| PATCH | /api/requests/:id | Yönetici | Talep durumu güncelle |
| DELETE | /api/requests/:id | Yönetici | Talep sil |
| GET | /api/settings | – | Site bilgileri |
| PUT | /api/settings | Yönetici | Site bilgilerini güncelle |
| POST | /api/admin/login | – | Giriş, token döner |
| POST | /api/admin/logout | Yönetici | Çıkış |

Yönetici istekleri `Authorization: Bearer <token>` başlığı ile gönderilir. Talep durumları:
`yeni`, `islemde`, `tamamlandi`.
