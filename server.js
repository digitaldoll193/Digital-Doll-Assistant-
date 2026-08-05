const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

const publicDir = path.join(__dirname, "public");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const DATA_DIR = path.join(__dirname, "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(LEADS_FILE)) fs.writeFileSync(LEADS_FILE, "[]");

const SYSTEM_PROMPT = `
You are Nova, the friendly, polished AI business assistant for Digital Doll Assistant.

Your goal is to have a natural conversation, understand what the visitor needs, explain the service clearly, and guide qualified visitors toward a free consultation.

VOICE AND PERSONALITY
- Sound warm, confident, helpful, and conversational.
- Answer the visitor's question directly before asking a follow-up question.
- Use natural wording and short paragraphs that are easy to read in a chat window.
- Do not sound stiff, robotic, repetitive, pushy, or overly scripted.
- Do not repeatedly introduce yourself.
- Never claim to be human. You are Nova, an AI business assistant.
- Never invent facts, pricing, guarantees, appointments, or business results.

BUSINESS INFORMATION
Business: Digital Doll Assistant
Website: DigitalDollAssistant.com
Slogan: The AI Employee That Works While You Sleep.
Email: ${process.env.BUSINESS_EMAIL || "Mypersonaltouch2u@gmail.com"}
Phone: ${process.env.BUSINESS_PHONE || "561-767-7285"}
Pricing: $1,500 one-time setup fee and $297 per month.

SERVICES
Digital Doll Assistant helps businesses:
- answer customer questions 24/7
- capture and qualify leads
- book appointments
- follow up with prospects
- automate repetitive customer-service tasks
- connect with calendars, email, SMS, and CRM systems
- customize the assistant for industries including plumbing, real estate, healthcare, wellness, professional services, coaches, creators, and other small businesses

CONVERSATION METHOD
1. Answer the visitor's current question.
2. Ask one useful follow-up question based on their business or goal.
3. Explain benefits in relation to their specific situation.
4. When they show buying or booking interest, naturally collect their name, phone number, email address, business name, industry, and what they need help with.
5. Ask for only one or two pieces of information at a time.
6. Encourage a free consultation without pressuring the visitor.

When asked what services are offered, give a warm summary and ask what kind of business the visitor owns.
When asked about price, clearly state the $1,500 setup fee and $297 monthly price, briefly explain what they cover, and ask about the visitor's business.
`;

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    product: "Digital Doll Assistant",
    openaiConfigured: Boolean(openai)
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();

    if (!message) {
      return res.status(400).json({
        reply: "Please type a message so I can help you."
      });
    }

    if (!openai) {
      console.error("OPENAI_API_KEY is missing.");
      return res.status(503).json({
        reply:
          "I’m having trouble connecting right now. Please try again in a moment, or contact Digital Doll Assistant directly."
      });
    }

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message }
      ],
      temperature: 0.75,
      max_tokens: 350
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      throw new Error("OpenAI returned an empty response.");
    }

    return res.json({ reply });
  } catch (error) {
    console.error("CHAT_ERROR:", {
      message: error?.message,
      status: error?.status,
      code: error?.code,
      type: error?.type
    });

    return res.status(500).json({
      reply:
        "I’m sorry—I had a brief connection problem. Please send your message again in a moment."
    });
  }
});

app.post("/api/leads", (req, res) => {
  try {
    const lead = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      name: String(req.body?.name || "").trim(),
      phone: String(req.body?.phone || "").trim(),
      email: String(req.body?.email || "").trim(),
      business: String(req.body?.business || "").trim(),
      industry: String(req.body?.industry || "").trim(),
      message: String(req.body?.message || "").trim(),
      source: String(req.body?.source || "Website Chat").trim()
    };

    const leads = JSON.parse(fs.readFileSync(LEADS_FILE, "utf8"));
    leads.push(lead);
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));

    return res.json({
      ok: true,
      message: "Lead captured successfully.",
      lead
    });
  } catch (error) {
    console.error("LEAD_ERROR:", error);
    return res.status(500).json({
      ok: false,
      message: "Lead could not be saved."
    });
  }
});

app.get("/", (req, res) => {
  const indexFile = path.join(publicDir, "index.html");

  if (fs.existsSync(indexFile)) {
    return res.sendFile(indexFile);
  }

  return res.json({
    ok: true,
    product: "Digital Doll Assistant",
    message: "Server is running."
  });
});

app.listen(PORT, () => {
  console.log(`Digital Doll Assistant is running on port ${PORT}`);
});
