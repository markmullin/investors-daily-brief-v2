# Fix Missing Dependencies and Exports

## Issue 1: Install Missing Package

The `idb` package is required for IndexedDB caching but not installed.

Run this command in the frontend directory:

```cmd
cd c:\users\win10user\documents\financial-software\investors-daily-brief\frontend
npm install idb@8.0.0
```

## Issue 2: Add Missing Export

The `fetchWithConfig` function is missing from api.js. This will be added in the next file update.

## Quick Fix Steps:

1. **Stop the frontend server** (Ctrl+C in the terminal)

2. **Install the missing package**:
   ```cmd
   npm install idb@8.0.0
   ```

3. **Restart the frontend** after the fix is applied:
   ```cmd
   npm run dev
   ```

The fetchWithConfig export will be added to api.js automatically.
