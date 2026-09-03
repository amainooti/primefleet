This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Import TruckPaper inventory

The importer reads public TruckPaper listing pages and defaults to a dry run. It only saves data when `--write` is supplied:

```bash
npm run import:truckpaper -- --url https://www.truckpaper.com/listings/for-sale/box-trucks/16004 --limit 25
npm run import:truckpaper -- --url https://www.truckpaper.com/listings/for-sale/box-trucks/16004 --pages 2 --delay 2000 --write
npm run import:truckpaper -- --url https://www.truckpaper.com/listings/for-sale/box-trucks/16004 --limit 25 --cdp --write
npm run import:truckpaper -- --url https://www.truckpaper.com/listings/for-sale/box-trucks/16004 --pages 10 --delay 2500 --cdp --write
```

Use it only where your TruckPaper agreement permits automated retrieval. The importer stays within public listing URLs, skips auction links, waits between pages, and does not bypass CAPTCHA or access controls. If the site returns `403`, use an approved TruckPaper data feed/export or an authorized browser session.

For `--cdp`, close all Chrome windows and launch a separate debugging profile, then rerun the command:

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="$env:TEMP\primefleet-chrome"
```
