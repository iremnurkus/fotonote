# Fotonote

Fotoğraflı not uygulaması.

- `web/` — Next.js + React + TypeScript + Tailwind (Firebase Auth/Firestore/Storage istemcisi)
- `api/` — .NET 9 Web API (Firebase ID token doğrulaması)
- `firebase.json`, `firestore.rules`, `storage.rules` — Firebase kuralları

Hesapla kullanılan defterler Firestore'da `users/{uid}` altında, fotoğraflar
Firebase Storage'da `users/{uid}/notes/` altında saklanır. Firebase kuralları
yalnızca oturum açmış kullanıcının kendi UID'sindeki verilere erişmesine izin
verir. Kuralları Firebase projesine dağıtmadan hesaplı kullanımı açmayın.
Misafir defteri yalnızca o tarayıcıda saklanır ve hesaplar arasında paylaşılmaz.

## Çalıştırma

```powershell
# Web
cd web; copy .env.example .env.local   # Firebase değerlerini doldur
npm run dev                            # http://localhost:3000

# API
cd api; dotnet run                     # http://localhost:5077 (/health)
```

API'deki `Firebase:ProjectId` değeri, `web/.env.local` içindeki `NEXT_PUBLIC_FIREBASE_PROJECT_ID` ile aynı olmalıdır.
#