# AI Citation & GEO Monitoring

ระบบนี้ใช้วัด 3 ระดับของ AI visibility สำหรับ Display Works Media:

1. Data ingestion: AI/Search crawler เข้ามาอ่านหน้า public ใดบ้าง
2. Output citation: AI platform อ้างอิง URL ของเว็บไซต์ในคำตอบหรือไม่
3. Referral traffic: มีผู้ใช้คลิกจาก AI platform กลับเข้าเว็บไซต์จริงหรือไม่

## Database

ให้รัน SQL ตามลำดับใน Supabase Production:

1. `supabase/ai-crawler-visits.sql`
2. `supabase/ai-citation-monitoring.sql`

## Required Environment Variables

ตั้งค่าบน Vercel Production และ Preview:

- `SUPABASE_SERVICE_ROLE_KEY`: ใช้เฉพาะฝั่ง server/proxy สำหรับบันทึก `ai_crawler_visits`

ห้ามใส่ key นี้เป็น `NEXT_PUBLIC_*` และห้ามนำไปใช้ใน client component เพราะเป็น key ที่ bypass RLS ได้
ระบบ crawler log จะไม่เปิดให้ browser หรือ Supabase anon key insert โดยตรง เพื่อลดโอกาสมีคนส่ง log ปลอมเข้าตาราง

### ai_crawler_visits

ใช้สำหรับบันทึก AI/Search crawler ที่เข้า public pages ผ่าน `src/proxy.ts`

Fields:

- `bot_name`: ชื่อ bot เช่น GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot
- `path`: public URL path ที่ bot เข้าอ่าน
- `user_agent`: user agent แบบตัดความยาวแล้ว
- `referrer`: referrer หาก bot ส่งมา
- `country`: country จาก Vercel header หากมี
- `http_status`: nullable สำหรับ log ingestion source ที่รู้ status code
- `response_size`: nullable สำหรับ log ingestion source ที่รู้ response size
- `source`: แหล่งที่มาของ log เช่น `next_proxy_request`
- `created_at`: เวลาที่บันทึก

ความปลอดภัย:

- `anon` และ `authenticated` ถูก revoke สิทธิ์ `insert`
- public insert policy เดิมถูก drop แล้ว
- การเขียน log ต้องผ่าน server/proxy ด้วย service role เท่านั้น
- รายชื่อ bot ใช้ชุดกลางจาก `src/lib/ai-bots.ts` ร่วมกับ `src/proxy.ts` และ `src/app/robots.ts`

### ai_referral_visits

ใช้สำหรับบันทึกผู้ใช้จริงที่คลิกจาก AI platform เช่น ChatGPT, Perplexity, Claude, Copilot, Gemini กลับเข้าเว็บไซต์

Fields:

- `platform`: chatgpt, openai, perplexity, claude, copilot, gemini, poe, you, phind
- `landing_page`: หน้าแรกที่ผู้ใช้เข้ามา
- `referrer`: referrer เต็มจาก browser
- `user_agent`: browser user agent
- `created_at`: เวลาที่บันทึก

หมายเหตุ: ตัว tracker ฝั่ง client จะทำงานหลังผู้ใช้ยอมรับ PDPA analytics consent เท่านั้น

### ai_citation_prompts

ใช้เก็บชุดคำถามที่ต้องการให้ worker ยิงทดสอบเป็นรอบ

Fields:

- `prompt_text`: ข้อความคำถาม
- `target_keyword`: keyword หรือกลุ่ม intent
- `platforms`: platform ที่ต้องการทดสอบ
- `active`: เปิด/ปิด prompt
- `frequency`: daily, weekly หรือ custom

### ai_citation_logs

ใช้เก็บผลจาก synthetic prompt monitor

Fields:

- `platform`: chatgpt, perplexity, gemini, google_aio หรือ platform อื่น
- `prompt_text`: prompt ที่ใช้ทดสอบ
- `is_cited`: เว็บถูกอ้างอิงหรือไม่
- `cited_urls`: URL ของ displayworksmedia.com ที่พบใน citation/source
- `competitor_urls`: URL คู่แข่งที่พบในคำตอบเดียวกัน
- `brand_mentions`: คำที่พบเกี่ยวกับ Display Works Media หรือแบรนด์
- `raw_response`: คำตอบดิบสำหรับตรวจย้อนหลัง
- `source`: manual_or_worker, cron, api หรือชื่อ worker

## API

### POST `/api/marketing/ai-referral`

ใช้โดย `AIReferralTracker` เพื่อบันทึก referral จาก AI platform

Payload:

```json
{
  "platform": "chatgpt",
  "landing_page": "/services/vinyl-banner",
  "referrer": "https://chatgpt.com/"
}
```

ระบบ validate ว่า referrer ตรงกับ platform และไม่เก็บ URL หลังบ้าน เช่น `/admin`, `/api`, `/doc`

### GET `/api/marketing/ai-crawlers`

ใช้ใน Marketing dashboard เพื่อสรุป crawler visits

Query:

- `startDate=YYYY-MM-DD`
- `endDate=YYYY-MM-DD`

### GET `/api/marketing/ai-citations`

ใช้ใน Marketing dashboard เพื่อสรุป citation/referral metrics

Query:

- `startDate=YYYY-MM-DD`
- `endDate=YYYY-MM-DD`

Metrics:

- `citationRate`
- `promptsChecked`
- `referralVisits`
- `byCitedPage`
- `competitors`
- `referralsByPlatform`
- `daily`
- `recent`

## Phase 2: Synthetic Prompt Worker

ต้องเพิ่ม environment variables ก่อน:

- `OPENAI_API_KEY`
- `PERPLEXITY_API_KEY`
- `GEMINI_API_KEY`
- `SERPAPI_API_KEY` หรือ provider สำหรับ Google AI Overview result
- `CRON_SECRET`

แนวทาง worker:

1. อ่าน `ai_citation_prompts` ที่ `active = true`
2. ยิง prompt ไปยัง platform ที่เลือก
3. แยก URL ของ `displayworksmedia.com` จาก citation/source/raw response
4. แยก competitor domains จาก source list
5. บันทึกผลลง `ai_citation_logs`

ข้อจำกัด:

- AI ส่วนใหญ่ไม่ส่ง prompt/search query จริงมาใน crawler request
- Crawler log จึงบอกได้ว่า bot เข้า URL ไหน จากประเทศ/เวลา/ผู้ส่งต่อใดเท่านั้น ไม่สามารถรู้ prompt ที่ผู้ใช้ถามจริงได้
- ช่อง `Likely AI Intent` ใน dashboard เป็นการอนุมานจาก URL, referrer และ UTM ไม่ใช่ prompt จริง
- ChatGPT consumer browsing result ไม่เท่ากับ OpenAI API โดยตรง จึงควรใช้ Perplexity citations และ Gemini grounding เป็นแหล่งที่ตรวจ citation ได้ชัดกว่า
- Google AI Overview มักต้องใช้ SERP provider ที่รองรับผลลัพธ์ AIO
