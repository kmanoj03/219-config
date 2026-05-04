# Deployment Guide for ConfigGuardian

This guide covers deploying ConfigGuardian to production. The application consists of a React frontend (Vite) and an Express backend.

## Deployment Options

### Option 1: Railway (Recommended - Full Stack)

Railway is the easiest option for deploying the full-stack application. It automatically handles building and deployment.

#### Prerequisites
- A Railway account (sign up at [railway.app](https://railway.app))
- A Gemini API key from Google AI Studio

#### Steps

1. **Install Railway CLI** (optional, or use web interface):
   ```bash
   npm i -g @railway/cli
   railway login
   ```

2. **Create a New Project**:
   - Go to [railway.app](https://railway.app) and create a new project
   - Connect your GitHub repository

3. **Set Environment Variables**:
   In Railway dashboard, go to your service → Variables, and add:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   NODE_ENV=production
   PORT=4000
   ALLOWED_ORIGINS=*
   ```
   
   Optional variables:
   ```
   GEMINI_MODEL_ANALYZE=gemini-2.5-pro
   GEMINI_MODEL_OCR=gemini-2.5-flash
   GEMINI_TIMEOUT_MS=60000
   ```

4. **Deploy**:
   - Railway will automatically detect the `nixpacks.toml` configuration
   - It will build both frontend and backend
   - The deployment will start automatically

5. **Access Your App**:
   - Railway provides a public URL (e.g., `your-app.railway.app`)
   - Your app will be live at this URL

#### Railway Configuration Files
- `nixpacks.toml` - Defines the build process
- `railway.json` - Railway-specific configuration (optional)

---

### Option 2: Vercel (Frontend) + Railway/Render (Backend)

If you prefer Vercel for the frontend (which you've used before), you can deploy the frontend to Vercel and backend separately.

#### Frontend on Vercel

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   cd client
   vercel
   ```

3. **Set Environment Variables**:
   In Vercel dashboard → Settings → Environment Variables:
   ```
   VITE_API_BASE_URL=https://your-backend-url.com
   ```

4. **Configure Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

#### Backend on Railway or Render

**Railway Backend:**
1. Create a new Railway project for the backend only
2. Set root directory to `server/`
3. Set environment variables (same as Option 1)
4. Update start command: `npm start`

**Render Backend:**
1. Go to [render.com](https://render.com)
2. Create a new Web Service
3. Connect your repository
4. Set:
   - Root Directory: `server`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: Node
5. Add environment variables (same as Railway)

**Update CORS:**
In your backend environment variables, set:
```
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

---

### Option 3: Render (Full Stack)

Render also supports full-stack deployments.

1. **Create a Web Service** on Render
2. **Connect your repository**
3. **Configure**:
   - Root Directory: `.` (root)
   - Build Command: `cd server && npm install && npm run build && cd ../client && npm install && npm run build`
   - Start Command: `cd server && NODE_ENV=production npm start`
   - Environment: Node
4. **Set Environment Variables** (same as Railway)
5. **Deploy**

---

## Environment Variables Reference

### Required
- `GEMINI_API_KEY` - Your Google Gemini API key (get it from [Google AI Studio](https://makersuite.google.com/app/apikey))

### Optional
- `NODE_ENV` - Set to `production` for production builds
- `PORT` - Server port (default: 4000)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins (default: `*`)
- `GEMINI_MODEL_ANALYZE` - Model for analysis (default: `gemini-2.5-pro`)
- `GEMINI_MODEL_OCR` - Model for OCR (default: `gemini-2.5-flash`)
- `GEMINI_TIMEOUT_MS` - Timeout in milliseconds (default: `60000`)

### Frontend Only (Vercel)
- `VITE_API_BASE_URL` - Backend API URL (e.g., `https://api.yourdomain.com`)

---

## Local Testing Before Deployment

1. **Build the frontend**:
   ```bash
   cd client
   npm install
   npm run build
   ```

2. **Build the backend**:
   ```bash
   cd server
   npm install
   npm run build
   ```

3. **Test production build locally**:
   ```bash
   cd server
   NODE_ENV=production npm start
   ```
   
   The server will serve the frontend at `http://localhost:4000`

---

## Troubleshooting

### Build Failures
- Ensure Node.js version is 18+ (Railway uses Node 20)
- Check that all dependencies are listed in `package.json`
- Verify TypeScript compiles without errors

### Runtime Errors
- Check environment variables are set correctly
- Verify `GEMINI_API_KEY` is valid
- Check Railway/Render logs for detailed error messages

### CORS Issues
- Set `ALLOWED_ORIGINS` to your frontend URL (if using separate deployments)
- Or set to `*` for development (not recommended for production)

### Frontend Can't Connect to Backend
- Verify `VITE_API_BASE_URL` is set correctly (for Vercel)
- Check backend is running and accessible
- Verify CORS settings allow your frontend origin

---

## Monitoring

- **Railway**: Check logs in the Railway dashboard
- **Vercel**: Check logs in Vercel dashboard → Functions
- **Render**: Check logs in Render dashboard

---

## Custom Domain

Both Railway and Vercel support custom domains:

- **Railway**: Settings → Domains → Add Domain
- **Vercel**: Settings → Domains → Add Domain

Update your `ALLOWED_ORIGINS` environment variable when using custom domains.

---

## Recommended Setup

For the simplest deployment experience, we recommend **Railway** (Option 1) because:
- ✅ Single platform for frontend + backend
- ✅ Automatic deployments on git push
- ✅ Free tier available
- ✅ Easy environment variable management
- ✅ Automatic SSL certificates


