# TripShare App

TripShare is a full-stack mobile application built with Expo (React Native) and NestJS. It allows users to create or join groups and upload high-quality images and videos during trips. These media files are automatically uploaded to the cloud and are accessible by all group members. The app aims to solve the problem of collecting and sharing trip media efficiently without compromising on quality.

---

## 🌟 Features

### User

* Authentication (Sign up / Login)
* Join or create groups
* Add members to groups via invitation code

### Media

* Capture high-quality photos and videos using in-app camera
* Upload media instantly to cloud storage (no quality loss)
* Browse and download group-shared media

### Group

* Create groups
* View members in a group
* Group-based media organization

### Performance

* Background upload handling
* Offline media queueing
* Cloud storage with CDN delivery

---

## 🧱 Tech Stack

### Frontend (Mobile)

* React Native with Expo
* React Navigation
* Zustand (or Redux) for state management
* Axios for API calls
* NativeWind / Tailwind for styling
* react-native-vision-camera for high-quality capture

### Backend (API)

* NestJS
* PostgreSQL
* Prisma ORM
* JWT-based authentication
* Cloudinary / AWS S3 for media storage

---

## 📁 Folder Structure

```
/tripshare-app
├── /apps
│   ├── /mobile           # Expo frontend
│   └── /server           # NestJS backend
├── /packages             # Shared types/utils (optional)
├── /docs                 # Architecture and usage docs
├── README.md
```

### apps/mobile

```
/components
/screens
/navigation
/services
/store
/utils
App.tsx
```

### apps/server

```
/src
  ├── auth
  ├── user
  ├── group
  ├── media
  └── prisma
/prisma/schema.prisma
```

---

## 🧪 Getting Started (Development)

### Prerequisites

* Node.js v18+
* Expo CLI
* PostgreSQL instance (local or cloud)

### Mobile

```bash
cd apps/mobile
npm install
npx expo start
```

### Server

```bash
cd apps/server
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

---

## 🔐 Environment Variables

### apps/server/.env

```
DATABASE_URL=postgresql://user:password@localhost:5432/tripshare
JWT_SECRET=your_jwt_secret
CLOUD_STORAGE_URL=https://...
```

### apps/mobile/.env (optional)

```
API_BASE_URL=http://localhost:3000
CLOUD_UPLOAD_KEY=your_key_here
```

---

## 📚 Documentation

Documentation is available in the `/docs` folder.

### /docs includes:

* `api-spec.md` - API contract
* `architecture.md` - Project architecture overview
* `upload-flow.md` - Media upload flow
* `data-model.md` - Database schema
* `permissions.md` - Group/user access control rules

---

## 🚀 Deployment

### Backend

* Use Docker or deploy to services like Heroku, Railway, Render, or Fly.io

### Mobile

* Publish using Expo
* Setup OTA updates and EAS builds for production

---

## 🤝 Contributing

1. Fork the repo
2. Create a new branch (`feat/your-feature`)
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## 📄 License

MIT License

---

## ✨ Credits

Created with ❤️ by the TripShare team.

---

## 🧠 Future Improvements

* Group chat support
* Live location sharing during trips
* Media reactions/comments
* AI-based photo sorting by people/events

---
