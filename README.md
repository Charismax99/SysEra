# SysEra website

A modern, one-page company website for SysEra, built with semantic HTML5, modern CSS and vanilla JavaScript.

## Project overview

This project is a lightweight, production-ready landing page for a software development company. It includes:

- a premium dark-tech design
- sticky navigation with mobile menu
- smooth-scrolling single-page layout
- service, process and company sections
- contact form with PHP backend
- SEO metadata and social tags
- SVG logo and favicon assets

## Folder structure

```text
/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── main.js
├── assets/
│   └── logo/
│       ├── sys-era-logo-horizontal.svg
│       └── sys-era-logo-mark.svg
├── contact/
│   └── send.php
├── favicon.svg
├── robots.txt
├── sitemap.xml
├── README.md
├── .gitignore
└── .git/
```

## How to run locally

Use a simple local PHP server in the project root:

```bash
php -S localhost:8000
```

Then open:

```text
http://localhost:8000
```

## Deploying to Hostinger

1. Upload all project files to the public_html folder of your Hostinger hosting account.
2. Make sure `contact/send.php` is uploaded with the rest of the project.
3. Ensure your hosting supports PHP mail() for the contact form.
4. Verify the site loads correctly under your domain.

## Update the contact email

Open `contact/send.php` and change the placeholder recipient:

```php
$recipient = 'YOUR_EMAIL_HERE';
```

Replace it with your real email address, for example:

```php
$recipient = 'hello@sysera.tech';
```

The form will send mail to that address when configured.

## Update social links

Social links are intentionally minimal and not hard-coded to fake profiles. If you want to add them, update the footer markup in `index.html` and replace the placeholder labels with real URL links.

## Change brand colors

Edit the design tokens in `css/style.css` at the top of the file:

```css
:root {
  --bg: #08090d;
  --bg-soft: #0d1016;
  --surface: #11151c;
  --text: #f5f7fa;
  --muted: #9aa3b2;
  --accent: #7fa8ff;
  --accent-strong: #9ddcff;
}
```

## Replace logo assets

The SVG logo files live in `assets/logo/`:

- `sys-era-logo-horizontal.svg`
- `sys-era-logo-mark.svg`

You can replace them with your own SVG files while keeping the same file names to preserve the page structure.

## Update website content

Most content is in `index.html`. Edit the text directly in the relevant sections:

- hero copy
- about section
- service descriptions
- process steps
- contact details
- footer text

## Notes

- The contact form uses JavaScript fetch() to submit to `contact/send.php`.
- The website is designed to work without external frameworks or third-party libraries.
- The project is optimized for Hostinger-compatible hosting and simple deployment.
