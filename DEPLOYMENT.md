# Deployment Setup Guide

This project uses GitHub Actions to automatically deploy to Vercel when code is pushed to the main branch.

## GitHub Actions Secrets Setup

To enable successful deployments, you need to configure the following secrets in your GitHub repository:

### Required Secrets

1. **VERCEL_TOKEN** (Required)
   - Generate a token at: https://vercel.com/account/tokens
   - Go to your Vercel dashboard → Settings → Tokens
   - Create a new token with appropriate permissions
   - Copy the generated token

2. **VERCEL_ORG_ID** (Required)
   - Found in your Vercel project settings
   - Go to your Vercel project → Settings → General
   - Look for "Organization ID" or check your Vercel team settings
   - Alternatively, run `vercel whoami` and check your team configuration

3. **VERCEL_PROJECT_ID** (Required)
   - Found in your Vercel project settings
   - Go to your Vercel project → Settings → General
   - Look for "Project ID"

### How to Add Secrets to GitHub

1. Navigate to your GitHub repository
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each secret
4. Add the three secrets:
   - Name: `VERCEL_TOKEN`, Value: [your token]
   - Name: `VERCEL_ORG_ID`, Value: [your org ID]
   - Name: `VERCEL_PROJECT_ID`, Value: [your project ID]

### Alternative: Get IDs from Vercel CLI

If you have the Vercel CLI installed:

```bash
# Install Vercel CLI if you haven't
npm install -g vercel

# Login to Vercel
1

# Link your project
vercel link

# Check your project details
vercel whoami
```

After linking, check the `.vercel/project.json` file for your `orgId` and `projectId`.

### Verifying Setup

Once all secrets are configured:

1. Push a commit to the `main` branch
2. Check the Actions tab in your GitHub repository
3. The workflow should now complete successfully

## Workflow Overview

The deployment workflow (`.github/workflows/deploy.yml`) includes:

- **Build Job**: Runs tests and builds the application
- **Preview Job**: Deploys a preview on pull requests
- **Deploy Job**: Deploys to production on main branch pushes

## Troubleshooting

If deployments still fail:

1. Verify all three secrets are correctly set in GitHub
2. Check that your Vercel token has not expired
3. Ensure the project ID matches your Vercel project
4. Review the GitHub Actions logs for specific error messages

