# Paradise Desk / میز پردیس — Frontend v2

فرانت‌اند بازطراحی‌شده با استراکچر پروژه‌های Ali:

- **Next.js 16** (App Router)
- **HeroUI v3** + **Tailwind CSS v4**
- **Redux Toolkit** + **axios**
- **iconsax-reactjs** + **moment-jalali**
- RTL فارسی، تم روشن/تاریک

## اجرا

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

پورت dev: **7711**

API پیش‌فرض: `https://api.pdesk.ir/v1` (دامنه legacy `api.pbudget.ir` همچنان به همان بک‌اند اشاره می‌کند)

## مسیرها

| مسیر | توضیح |
|------|--------|
| `/get-started` | ورود / ثبت‌نام |
| `/` | داشبورد |
| `/create-budget` | ثبت تراکنش |
| `/budgets/[id]` | ویرایش تراکنش |
| `/boxes` | صندوق‌ها |
| `/profile/categories` | دسته‌بندی‌ها |
| `/profile` | پروفایل |

## ساختار

```
src/
├── app/                 # روت‌های نازک
├── components/
│   ├── pages/           # UI اصلی
│   ├── common/          # layout، form، branding
│   └── providers/
├── common/              # api، axios، constants، utils
└── stores/              # Redux slices
```

## دیپلوی (Vercel)

1. قبل از push (اگر لوگو یا OG عوض شده):

```bash
pnpm brand    # og-landing.png + favicon/PWA
pnpm build
```

2. Push به `main` → Vercel خودکار deploy می‌کند.

3. بک‌اند روی سرور جدا deploy می‌شود — راهنمای کامل:  
   `Paradise-Desk-Business/docs/SERVER-SETUP.md` (بخش **به‌روزرسانی روتین**).

```bash
# روی سرور
cd /var/www/Paradise-Desk-Business
./scripts/deploy-update.sh
```

برندینگ: `Paradise-Desk-Business/docs/BRAND.md`

## نکته

این پروژه جایگزین `pbudget-front` قدیمی (Chakra UI + Pages Router) است. کوکی `userAuthorization` برای سازگاری با sesion‌های قبلی حفظ شده.
