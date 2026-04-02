# FICC Platform — اللغات المعتمدة

## 🌐 اللغات الرسمية للمنصة

### اللغة الأساسية الحالية:
- **العربية (ar)** — الاتجاه: RTL — الخط: Cairo, Tahoma, sans-serif

---

## 📋 اللغات المخطط دعمها مستقبلاً:

| الكود | اللغة | الاتجاه | الخط المقترح |
|-------|-------|---------|-------------|
| `ar` | العربية | RTL | Cairo, Tahoma |
| `ku` | الكردية | RTL | Cairo, Tahoma |
| `en` | الإنجليزية | LTR | Segoe UI, Arial |

---

## 🗂️ الترجمات الأساسية

### التنقل (Navbar):
| المفتاح | العربية | الكردية | الإنجليزية |
|---------|---------|---------|------------|
| home | الرئيسية | سەرەکی | Home |
| chambers | الغرف | ئۆتاقەکان | Chambers |
| members | الأعضاء | ئەندامان | Members |
| news | الأخبار | هەواڵەکان | News |
| directory | دليل التجار | ڕێنمای بازرگانان | Directory |
| shipping | شركات الشحن | کۆمپانیاکانی گواستنەوە | Shipping |
| lawyers | المحامون | پارێزەران | Lawyers |
| agents | وكلاء الإخراج | ئەندازیارانی دەرکردن | Agents |
| startups | ريادة الأعمال | کارئافرێنی | Startups |
| register | سجّل | تۆمارکردن | Register |
| login | دخول | چوونەژوورەوە | Login |

### الأزرار العامة:
| المفتاح | العربية | الكردية | الإنجليزية |
|---------|---------|---------|------------|
| save | حفظ | پاشەکەوتکردن | Save |
| cancel | إلغاء | هەڵوەشاندنەوە | Cancel |
| submit | إرسال | ناردن | Submit |
| edit | تعديل | دەستکاریکردن | Edit |
| delete | حذف | سڕینەوە | Delete |
| close | إغلاق | داخستن | Close |
| back | رجوع | گەڕانەوە | Back |
| search | بحث | گەڕان | Search |
| filter | فلترة | پاڵاوتن | Filter |
| loading | جاري التحميل... | بارکردن... | Loading... |
| success | تم بنجاح | سەرکەوتوو بوو | Success |
| error | حدث خطأ | هەڵەیەک ڕوویدا | Error |
| confirm | تأكيد | دڵنیاکردنەوە | Confirm |

### التحقق والأمان:
| المفتاح | العربية | الكردية | الإنجليزية |
|---------|---------|---------|------------|
| otp_sent_sms | تم إرسال رمز التحقق عبر SMS | کۆدی پشتڕاستکردنەوه بۆ SMS نێردرا | OTP sent via SMS |
| otp_sent_email | تم الإرسال عبر البريد الإلكتروني | بۆ ئیمەیڵ نێردرا | Sent via email |
| otp_invalid | الرمز غير صحيح أو منتهي الصلاحية | کۆد هەڵەیە یان کاتی بەسەرچووە | Invalid or expired OTP |
| otp_blocked | تم تعليق الإرسال مؤقتاً | ناردن بەکاتی ڕاگیراوە | Sending temporarily suspended |
| verify_success | تم التحقق بنجاح | بە سەرکەوتوویی پشتڕاستکراوەتەوە | Verified successfully |

### الاستمارات:
| المفتاح | العربية | الكردية | الإنجليزية |
|---------|---------|---------|------------|
| full_name | الاسم الكامل | ناوی تەواو | Full Name |
| phone | الهاتف | تەلەفۆن | Phone |
| email | البريد الإلكتروني | ئیمەیڵ | Email |
| address | العنوان | ناونیشان | Address |
| description | الوصف | وەسف | Description |
| required | مطلوب | پێویستە | Required |
| optional | اختياري | ئارەزووی | Optional |

### ريادة الأعمال:
| المفتاح | العربية | الكردية | الإنجليزية |
|---------|---------|---------|------------|
| startups_title | ريادة الأعمال | کارئافرێنی | Entrepreneurship |
| startup_name | اسم المشروع | ناوی پرۆژە | Project Name |
| startup_desc | وصف الفكرة | وەسفی بیر | Idea Description |
| startup_sector | القطاع | بواری کار | Sector |
| startup_stage | مرحلة المشروع | قۆناغی پرۆژە | Project Stage |
| funding_needed | التمويل المطلوب | دارایی پێویست | Funding Needed |

---

## 🔧 تنفيذ اللغات (مستقبلاً)

### الطريقة المقترحة:
```javascript
// i18n/ar.js
export const ar = { home: 'الرئيسية', ... }

// i18n/ku.js  
export const ku = { home: 'سەرەکی', ... }

// i18n/en.js
export const en = { home: 'Home', ... }

// استخدام
import { useTranslation } from './i18n'
const { t } = useTranslation()
<span>{t('home')}</span>
```

### الحزم المقترحة:
- `react-i18next` — الأكثر شيوعاً
- `i18next` — المكتبة الأساسية

---

## 📌 ملاحظات
- الكردية المستخدمة: **السورانية** (الكردية الجنوبية)
- الخط المقترح للكردية: **Rudaw**, **NRT**, أو **Cairo** (يدعم الكردية)
- الأولوية: العربية → الكردية → الإنجليزية
- تاريخ آخر تحديث: 2026-04-01
