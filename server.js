require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const DATA_DIR = path.join(__dirname, "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(LEADS_FILE)) fs.writeFileSync(LEADS_FILE, "[]");

const SYSTEM_PROMPT = `
You are Digital Doll Assistant, a premium AI business assistant.
Brand slogan: The AI Employee That Works While You Sleep.
Business website: DigitalDollAssistant.com.
Business email: ${process.env.BUSINESS_EMAIL || "Mypersonaltouch2u@gmail.com"}.
Business phone: ${process.env.BUSINESS_PHONE || "561-767-7285"}.
Pricing: $1,500 setup fee and $297 per month.

Your job:
- Answer questions about Digital Doll Assistant.
- Explain pricing clearly.
- Capture leads.
- Encourage visitors to book a free consultation.
- Explain benefits: 24/7 replies, lead capture, appointment booking, CRM, email, SMS, automation, analytics, calendar integration, and industry customization.
- Be professional, friendly, confident, and sales-focused.
- Do not promise guaranteed revenue. Say results depend on the business, traffic, offer, and follow-up.
- If someone wants to buy, book, test, or get started, collect name, phone, email, business name, industry, and what they need help with.
`;

app.get("/health", (req, res) => {
  res.json({ ok: true, product: "Digital Doll Assistant" });
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();

    if (!message) {
      return res.status(400).json({ reply: "Please type a message so I can help you." });
    }

    if (!openai) {
      return res.json({
        reply:
          "I can help with Digital Doll Assistant pricing, setup, lead capture, appointment booking, CRM, email/SMS automation, and free consultations. Our setup fee is $1,500 and monthly service is $297/month. Would you like to book a free consultation?"
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message }
      ],
      temperature: 0.5
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      reply: "I had trouble answering that. Please leave your name, phone number, and email, and our team will follow up."
    });
  }
});

app.post("/api/leads", (req, res) => {
  try {
    const lead = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      name: req.body.name || "",
      phone: req.body.phone || "",
      email: req.body.email || "",
      business: req.body.business || "",
      industry: req.body.industry || "",
      message: req.body.message || "",
      source: req.body.source || "Website Chat"
    };

    const leads = JSON.parse(fs.readFileSync(LEADS_FILE, "utf8"));
    leads.push(lead);
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));

    res.json({
      ok: true,
      message: "Lead captured successfully.",
      lead
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Lead could not be saved." });
  }
});

app.get("/api/leads", (req, res) => {
  const leads = JSON.parse(fs.readFileSync(LEADS_FILE, "utf8"));
  res.json(leads);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Digital Doll Assistant running on http://localhost:${port}`);
});
