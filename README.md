# Bayram İş Kıyafetleri

İş kıyafeti kataloğu ve yönetim paneli. Müşteriler ürünleri görüntüler, seçeneklerini işaretleyip
**ürün talebi** oluşturur; yönetici ürünleri, talepleri ve site bilgilerini panelden yönetir.

## Canlı yayın (Vercel)

Proje Vercel Serverless Functions, Neon Postgres ve Vercel Blob ile çalışır. Çalışan site için
yerel bilgisayarın açık kalması gerekmez.

1. GitHub deposunu Vercel'e bağlayın.
2. Projeye bir **Neon Postgres** veritabanı bağlayın (`DATABASE_URL` otomatik oluşur).
3. Projeye public bir **Vercel Blob** deposu bağlayın (`BLOB_READ_WRITE_TOKEN` otomatik oluşur).
4. Vercel ortam değişkenlerine güçlü bir `ADMIN_PASSWORD` ekleyin.
5. Production deployment başlatın.

Ürünler, talepler ve site bilgileri veritabanındaki `store` tablosunda tek bir JSON kaydı olarak
tutulur; ilk istekte örnek ürünlerle otomatik oluşur. Panelden yüklenen görseller Blob'a gider.

Canlı site açıldıktan sonra `/admin.html` adresinden giriş yapıp **Site Bilgileri** sekmesini
doldurun. Telefon ve WhatsApp numarası boş olduğu sürece iletişim butonları görünmez.

## İsteğe bağlı geliştirme ortamı

```bash
npm install
copy .env.example .env
npm start
```

`DATABASE_URL` girilmezse veriler `data/store.json`, `BLOB_READ_WRITE_TOKEN` girilmezse yüklenen
görseller `public/images/` içinde tutulur.

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
gösterilmez; örneğin pantolonda kol tipi sorulmaz. Panelden yüklenen görseller Vercel Blob'da
kalıcı olarak saklanır (png, jpg, webp; en fazla 5 MB).

## Klasörler

```
api/            Vercel Serverless Function giriş noktası
server/         Express API, veri erişimi, doğrulama ve dosya yükleme
public/         Statik site (vitrin + yönetim paneli)
public/images/  Ürün fotoğrafları
data/           Yalnızca yerel geliştirmede kullanılan store.json
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
