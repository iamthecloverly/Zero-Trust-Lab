# ZeroTrustLab Deployment Guide

## ⚠️ Important: This is NOT a Streamlit App

This is a **full-stack web application** built with:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Neon)

**Streamlit Cloud only supports Python Streamlit apps**, so you cannot deploy this there.

## 🚀 Free Deployment Options

### Option 1: Render (Recommended - Easiest)

**Render offers free hosting for web services with PostgreSQL support.**

1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `zerotrust-lab`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: `Free`

5. Add Environment Variables (see CREDENTIALS.md for values):
   ```
   DATABASE_URL = <your-neon-database-url>
   OPENAI_API_KEY = <your-openai-api-key>
   NODE_ENV = production
   PORT = 10000
   ```

6. Click "Create Web Service"

7. After deployment, open Shell and run: `npm run db:push`

---

### Option 2: Railway

**Railway offers $5 free credit monthly.**

1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect Node.js
5. Add Environment Variables (see CREDENTIALS.md)
6. Set Build Command: `npm run build && npm run db:push`
7. Set Start Command: `npm run start`
8. Deploy!

---

### Option 3: Vercel (Frontend-focused, may need adapter for backend)

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow prompts
4. Add environment variables in Vercel dashboard

⚠️ **Note**: Vercel is optimized for serverless/edge functions. Your Express server may need modifications.

---

### Option 4: Heroku (Requires Credit Card for Free Tier)

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create zerotrust-lab`
4. Add environment variables:
   ```bash
   heroku config:set DATABASE_URL="<your-db-url>"
   heroku config:set OPENAI_API_KEY="<your-api-key>"
   heroku config:set NODE_ENV=production
   ```
5. Deploy: `git push heroku master`
6. Run migrations: `heroku run npm run db:push`

---

## 🔧 Pre-Deployment Checklist

- [x] Environment variables configured (.env file created)
- [x] .gitignore updated (don't commit .env)
- [x] Database connection string valid
- [x] Code pushed to GitHub
- [ ] Choose a deployment platform
- [ ] Configure environment variables on platform
- [ ] Deploy!
- [ ] Run database migrations

## 📝 Quick Deploy

See [QUICKSTART_RENDER.md](QUICKSTART_RENDER.md) for a 5-minute deployment guide.

## 🆘 Troubleshooting

### Build Fails
- Check build logs in platform dashboard
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility (18+)

### Database Connection Error
- Verify DATABASE_URL is correctly set
- Ensure database is accessible from deployment platform
- Check SSL/TLS requirements
- Run `npm run db:push` to create tables

### App Not Responding
- Free tier apps may sleep after inactivity
- First request after sleep takes 30-60 seconds
- Check platform logs for errors

### Environment Variables Not Working
- Ensure variables are set in platform dashboard, not just .env
- Restart the service after adding variables
- Check variable names match exactly (case-sensitive)

## 🔐 Security Best Practices

1. **Never commit `.env` file** - It's already in .gitignore
2. **Use environment variables** on deployment platforms
3. **Rotate API keys** if they're exposed
4. **Enable HTTPS** (most platforms do this automatically)
5. **Keep dependencies updated** - Run `npm audit fix` regularly

## 📊 Platform Comparison

| Platform | Free Tier | Auto-Deploy | Database | Difficulty |
|----------|-----------|-------------|----------|------------|
| **Render** | ✅ 750hrs/mo | ✅ Yes | ✅ PostgreSQL | ⭐ Easy |
| **Railway** | 💰 $5 credit | ✅ Yes | ✅ PostgreSQL | ⭐⭐ Medium |
| **Vercel** | ✅ Unlimited | ✅ Yes | ⚠️ External | ⭐⭐⭐ Hard* |
| **Heroku** | ⚠️ Card needed | ✅ Yes | ✅ PostgreSQL | ⭐⭐ Medium |

*Vercel requires serverless adaptation for the Express backend

## 🎯 Recommended: Render

For this full-stack app, **Render** is the best choice because:
- ✅ Truly free (no credit card required)
- ✅ Supports Node.js natively
- ✅ Auto-deploys from GitHub
- ✅ Built-in PostgreSQL support
- ✅ Simple configuration
- ✅ Good free tier limits (750 hours/month)

Follow [QUICKSTART_RENDER.md](QUICKSTART_RENDER.md) to deploy in 5 minutes!