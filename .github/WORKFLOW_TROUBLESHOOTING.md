# GitHub Actions Workflow Troubleshooting Guide

## Overview

This repository uses two GitHub Actions workflows to keep the topic feeds updated:

1. **`build-feeds.yml`** - Main automated workflow (runs every 6 hours)
2. **`feeds-pr.yml`** - Manual fallback workflow

## Main Workflow (`build-feeds.yml`)

### How it works

1. **Retry Logic**: Attempts to push directly to main with up to 5 retry attempts
2. **Smart Rebasing**: If the remote branch has new commits, it rebases and regenerates feeds
3. **Fallback to PR**: If all direct push attempts fail, creates a Pull Request
4. **Auto-merge**: Attempts to auto-merge the fallback PR if no conflicts exist

### Key Features

- ✅ **Exponential backoff** between retry attempts (10s, 20s, 40s, 80s, 160s)
- ✅ **Smart conflict resolution** by regenerating feeds with latest data
- ✅ **Concurrency control** to prevent multiple workflows from running simultaneously
- ✅ **Automatic PR creation** when direct push fails
- ✅ **Cache optimization** for faster npm installs

## Troubleshooting

### If the workflow still fails:

#### 1. Check Workflow Status

```bash
# Go to Actions tab in GitHub and check latest run
# Look for specific error messages in the logs
```

#### 2. Manual Fallback

Run the manual fallback workflow:

- Go to **Actions** → **Feed Update via PR (Manual Fallback)**
- Click **Run workflow**
- This will create a PR that you can merge manually

#### 3. Local Development Fix

```bash
# Pull latest changes
git pull origin main

# Regenerate feeds locally
npm run build:feeds

# Commit and push manually
git add public/feeds/*.json
git commit -m "chore(feeds): manual refresh topic feeds"
git push origin main
```

#### 4. Check Repository Settings

Ensure your repository has:

- ✅ **Actions enabled** (Settings → Actions → General)
- ✅ **Workflow permissions** set to "Read and write permissions" (Settings → Actions → General → Workflow permissions)
- ✅ **Allow auto-merge** enabled (Settings → General → Pull Requests)

#### 5. Branch Protection Rules

If you have branch protection rules on `main`:

- Ensure the workflow has bypass permissions, OR
- The workflow will automatically use the PR fallback method

## Workflow Permissions

The workflows require these permissions:

```yaml
permissions:
  contents: write # To push commits and create branches
  pull-requests: write # To create and merge PRs
```

## Monitoring

### Success Indicators

- ✅ Workflow completes without errors
- ✅ Feed files in `public/feeds/*.json` are updated
- ✅ Commit appears in git history with message "chore(feeds): refresh topic feeds"

### Failure Indicators

- ❌ Workflow fails after 5 retry attempts
- ❌ Fallback PR creation fails
- ❌ No new commits for more than 24 hours

## Advanced Debugging

### Check Concurrency Issues

```bash
# Check if multiple workflows are running
# Go to Actions tab and look for queued/running workflows
```

### Verify Repository State

```bash
# Clone repo and check current state
git clone <your-repo-url>
cd safehaven-feed
git log --oneline -10
git status
```

### Test Feed Generation Locally

```bash
# Ensure feed generation works
npm ci
npm run build:feeds
git status  # Should show changes in public/feeds/
```

## Emergency Procedures

### If Feeds Stop Updating Completely

1. **Disable the scheduled workflow** temporarily:

   ```bash
   # Rename the workflow file to disable it
   git mv .github/workflows/build-feeds.yml .github/workflows/build-feeds.yml.disabled
   git commit -m "temp: disable automated feeds"
   git push
   ```

2. **Run manual updates** until fixed:

   ```bash
   # Use the manual workflow or local generation
   npm run build:feeds
   git add public/feeds/*.json
   git commit -m "chore(feeds): manual update"
   git push
   ```

3. **Re-enable when fixed**:
   ```bash
   git mv .github/workflows/build-feeds.yml.disabled .github/workflows/build-feeds.yml
   git commit -m "fix: re-enable automated feeds"
   git push
   ```

## Contact

If issues persist after trying all troubleshooting steps:

1. Create an issue in this repository
2. Include the workflow run URL that failed
3. Include any error messages from the logs
4. Mention what troubleshooting steps you've already tried
