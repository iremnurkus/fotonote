# Fotonote

Fotoğraflı not uygulaması.

- `web/` — Next.js + React + TypeScript + Tailwind (Firebase Auth/Firestore/Storage istemcisi)
- `api/` — .NET 9 Web API (Firebase ID token doğrulaması)
- `firebase.json`, `firestore.rules`, `storage.rules` — Firebase kuralları

## Çalıştırma

```powershell
# Web
cd web; copy .env.example .env.local   # Firebase değerlerini doldur
npm run dev                            # http://localhost:3000

# API
cd api; dotnet run                     # http://localhost:5077 (/health)
```

`api/appsettings.Development.json` içindeki `Firebase:ProjectId` değerini kendi Firebase projenle değiştir.
