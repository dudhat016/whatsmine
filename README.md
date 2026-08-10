# WhatsMine

* **Production URL:** `https://whatsmine.techworldproduct.com`

## Login Credentials

## 1. Super Admin User
* **Access URL:** `http://localhost:8005/admin` (or click Admin Login)
* **Email:** `admin@example.com`
* **Password:** `admin123`

---

## 2. Clients

### Demo Client (SpaGreen Wellness)
* **Access URL:** `http://localhost:8005/login`
* **Email:** `client@spagreen.net`
* **Password:** `12345678`

### Seed Client
* **Access URL:** `http://localhost:8005/login`
* **Email:** `client@example.com`
* **Password:** `client123`

App ID
1833175468120386


App secret
66436b7fbb03a46a94a6242eca7d6096


ID below to continue setting up this configuration
1598242678547816


+1 (555) 197-0533
Phone Number ID 1323436730842037
WhatsApp Business Account ID  1385036243571499
Access token   EAAaDQ2yWmUIBSJumPJHwG4huY8ZBu2gJFJ6s4v8mMuD5hsUHln5vjZCcd4utfufqZAjZCGycACyyaTOZB1ulsupyNRUC6nuhiwUuZBivjIxREjkhMB6afNJWo3t0bsHrbiWtj2zUUiJ3Bo6KQOqARLdOC0s3zIwsOeBaxS8lqUuRj4R9ZBbomBqj2TCXieQqjCyvjVjjZBzdxQWzN2I2Wyconx1ZB5j4DeTUBKAeVapQhBHFtBA53w2ZCejrBAfI3ZAOYBEQIIlbdOqjvggLANFNSWjLSZAICTIJCFtCtgZDZD

Instagram Access Token
IGAATLbQ3LtzZABZAGF0Q3UtVVJYWnBFYzRyY3hjdlZA5aHRPQTNYTEZATOU9JR1dFRlVsa1pVNm9GMzE4NGpEajh4V0pIQXlrem83eXZASb3d5QU5xVWhsR3g3NjZAIZAU9iTUxIMURxOUQyRGpmUWlUenBPV2ZAVSklOckRVN3ktb1daZAwZDZD

curl -i -X POST `
     https://graph.facebook.com/v25.0/1323436730842037/messages `
     -H 'Authorization: Bearer ' `
     -H 'Content-Type: application/json' `
     -d '{ \"messaging_product\": \"whatsapp\",
     \"to\": \"\",
     \"type\": \"template\",
     \"template\": { \"name\": \"jaspers_market_order_confirmation_v1\",
     \"language\": { \"code\": \"en_US\" },
     \"components\": [{ \"type\": \"body\", \"parameters\": [{ \"type\": \"text\", \"text\": \"John Doe\" }, { \"type\": \"text\", \"text\": \"123456\" }, { \"type\": \"text\", \"text\": \"Aug 8, 2026\" }] }] } }'
