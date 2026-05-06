# RideFlow

Peer-to-peer vehicle rental (cars, bikes, scooters). Built with the **MERN** stack: **MongoDB**, **Express**, **React**, and **Node**. Uses **Google OAuth**, **JWT** sessions, **Cloudinary** for images, and a **demo wallet** (USD) for payments—not production billing.

---

## Features

- Google sign-in, JWT-protected API routes  
- List/browse vehicles, filters, recommendations  
- Booking requests with owner approve/reject and overlap checks  
- Demo wallet payments and transaction history  
- Optional identity upload + admin review (trust badge only—booking and listing are not blocked by verification)  
- Profile photo upload  

---

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS)  
- [MongoDB](https://www.mongodb.com/) (Atlas URI or local `mongodb://...`)  
- [Google Cloud](https://console.cloud.google.com/) OAuth Web Client ID  
- [Cloudinary](https://cloudinary.com/) cloud name + unsigned upload preset  

---

## Quick start

**1. Install dependencies** (from repo root):

```bash
npm run install:all
```

**2. Backend — create `backend/.env`:**

```env
MONGODB_URI=mongodb://localhost:27017/rideflow
JWT_SECRET=your_long_random_secret
PORT=5000
GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com
FRONTEND_URL=http://localhost:3000
```

**3. Frontend — create `frontend/.env`:**

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
```

In Google OAuth settings, add **Authorized JavaScript origins**: `http://localhost:3000`.

**4. Run both apps:**

```bash
npm run dev
```

| URL | Purpose |
|-----|---------|
| [http://localhost:3000](http://localhost:3000) | React UI |
| [http://localhost:5000](http://localhost:5000) | API |

---

## Root npm scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Backend (nodemon) + frontend dev server |
| `npm run dev:backend` | Backend only |
| `npm run start:frontend` | Frontend only |
| `npm run install:all` | Install root + backend + frontend deps |

---

## Repo layout

```
rideflow/
├── backend/          # Express API, Mongoose models, routes
├── frontend/         # React app (Create React App)
└── Documentation/    # Detailed guides & API notes (optional reading)
```

For endpoint references and subsystem docs, see [`Documentation/`](Documentation/).

---

## Deploy on AWS (production-shaped layout)

RideFlow is designed to deploy cleanly on AWS using managed services for the UI and API, with MongoDB hosted on **MongoDB Atlas** (recommended) rather than self-hosting the database on EC2.

| Piece | AWS service | Role |
|--------|-------------|------|
| Static React build | **S3** | Host `frontend` production build (`npm run build` → `build/`) |
| HTTPS + CDN | **CloudFront** | Serve the SPA from S3 with TLS and caching |
| Node / Express API | **Elastic Beanstalk** (Node platform) or **ECS Fargate** | Run `backend` with `npm start` (uses `PORT` from the environment) |
| Custom domain (optional) | **Route 53** | DNS for app + API subdomains |
| Secrets / config | **SSM Parameter Store** or **Secrets Manager** | `JWT_SECRET`, `MONGODB_URI`, OAuth client IDs |

**Typical flow**

1. Create an Atlas cluster and whitelist Elastic Beanstalk (or NAT egress IPs); put `MONGODB_URI` in Beanstalk environment properties or SSM.  
2. Deploy **backend**: zip `backend/` with dependencies resolved (`npm ci --omit=dev` on CI), set env vars (`PORT`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `FRONTEND_URL` = your CloudFront URL).  
3. Build **frontend** with production env: `REACT_APP_API_URL=https://api.yourdomain.com` (or the Beanstalk URL), then upload `frontend/build/` to S3 and attach a CloudFront distribution (`DefaultRootObject`: `index.html`, SPA error routing to `index.html`).  
4. In **Google Cloud Console**, add the CloudFront URL (and API URL if used for redirects) under OAuth **Authorized JavaScript origins**.  
5. Swap demo-wallet flows for a real payments provider when you move beyond MVP.

Replace placeholder URLs with your real CloudFront and API endpoints everywhere (`frontend/.env.production`, `backend/.env` on the host, and OAuth).

---

## License

Project developed for coursework / demonstration; adjust licensing as needed for your use case.
