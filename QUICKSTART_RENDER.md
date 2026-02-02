# 🚀 Quick Start: Deploy to Render (5 Minutes)

Render offers **free hosting** for web services - perfect for this app!

## Step 1: Prepare Your Repository

1. **Commit all changes**:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin master
   ```

2. If you don't have a GitHub repo yet:
   ```bash
   # Initialize git (if not already done)
   git init
   git add .
   git commit -m "Initial commit"
   
   # Create a new repo on GitHub, then:
   git remote add origin https://github.com/YOUR_USERNAME/Zero-Trust-Lab.git
   git push -u origin master
   ```

## Step 2: Deploy on Render

1. **Go to [render.com](https://render.com)** and sign up (free)

2. **Click "New +" → "Web Service"**

3. **Connect your GitHub repository**
   - Authorize Render to access your GitHub
   - Select the `Zero-Trust-Lab` repository

4. **Configure your service**:
   
   | Field | Value |
   |-------|-------|
   | **Name** | `zerotrust-lab` (or any name you like) |
   | **Region** | Choose closest to you |
   | **Branch** | `master` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install --include=dev && npm run build` |
   | **Start Command** | `npm run start` |
   | **Instance Type** | **Free** |

5. **Add Environment Variables** (click "Advanced"):
   
   Click "Add Environment Variable" for each:
   
   ```
   Key: DATABASE_URL
   Value: <paste your Neon PostgreSQL connection string>
   
   Key: OPENAI_API_KEY
   Value: <paste your OpenAI API key>
   
   Key: NODE_ENV
   Value: production
   ```
   
   > **Note**: Use the actual values from your .env file or the credentials you were provided.

6. **Click "Create Web Service"**

## Step 3: Initialize Database

Once your service is deployed:

1. Go to your service dashboard on Render
2. Click on "Shell" tab (or use SSH)
3. Run:
   ```bash
   npm run db:push
   ```
   Type `y` to confirm

Alternatively, you can add this to your Build Command:
```
npm install && npm run build && echo 'y' | npm run db:push
```

## Step 4: Access Your App

Your app will be live at:
```
https://zerotrust-lab.onrender.com
```
(or whatever name you chose)

## 🎉 You're Done!

Your Zero Trust Lab is now live on the internet!

## 📝 Notes

- **Free tier limitations**:
  - App sleeps after 15 minutes of inactivity
  - First request after sleep may take 30-60 seconds
  - 750 hours/month of runtime

- **Upgrades**: You can upgrade to paid plans for:
  - No sleeping
  - Faster performance
  - More resources

## 🔄 Updating Your App

After making changes:
```bash
git add .
git commit -m "Your update message"
git push origin master
```

Render will automatically redeploy! 🚀

## 🆘 Troubleshooting

**Build fails?**
- Check the build logs in Render dashboard
- Ensure all environment variables are set correctly

**Database connection error?**
- Verify DATABASE_URL is correct
- Make sure you ran `npm run db:push`

**App not responding?**
- Free tier apps sleep - first request wakes it up (takes ~30s)
- Check the logs in Render dashboard
