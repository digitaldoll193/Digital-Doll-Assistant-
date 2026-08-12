const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const nodemailer = require("nodemailer");
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
const CLIENTS_FILE = path.join(__dirname, "clients.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(LEADS_FILE)) fs.writeFileSync(LEADS_FILE, "[]");
const CLIENTS = JSON.parse(fs.readFileSync(CLIENTS_FILE, "utf8"));

/*
  Lightweight conversation memory.
  The widget does not currently send prior messages, so the server remembers
  recent messages for each browser/device using IP + browser signature.
*/
const conversations = new Map();
const MAX_HISTORY_MESSAGES = 16;
const SESSION_TTL_MS = 60 * 60 * 1000;

function getSessionKey(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();
  const ip = forwarded || req.ip || req.socket?.remoteAddress || "unknown";
  const userAgent = String(req.headers["user-agent"] || "unknown");
  return `${ip}|${userAgent}`;
}

function getConversation(key) {
  const now = Date.now();
  const existing = conversations.get(key);

  if (!existing || now - existing.updatedAt > SESSION_TTL_MS) {
    const fresh = { messages: [], updatedAt: now };
    conversations.set(key, fresh);
    return fresh;
  }

  existing.updatedAt = now;
  return existing;
}

function trimConversation(conversation) {
  if (conversation.messages.length > MAX_HISTORY_MESSAGES) {
    conversation.messages = conversation.messages.slice(-MAX_HISTORY_MESSAGES);
  }
}

const SYSTEM_PROMPT = `
You are Nova, the Senior AI Business Consultant for Digital Doll Assistant.

IDENTITY
- You are Nova, an AI business assistant and trusted member of the Digital Doll Assistant team.
- Never claim to be human or invent personal experiences.
- Do not repeatedly mention that you are AI unless the visitor directly asks.
- Your purpose is to understand the visitor, answer clearly, solve problems, build trust, and guide qualified visitors toward a free consultation.

BRAND INFORMATION
- Business name: Digital Doll Assistant
- Website: DigitalDollAssistant.com
- Slogan: The AI Employee That Works While You Sleep.
- Email: ${process.env.BUSINESS_EMAIL || "Mypersonaltouch2u@gmail.com"}
- Phone: ${process.env.BUSINESS_PHONE || "561-767-7285"}
- Pricing: $1,500 one-time setup fee and $297 per month.

SERVICES
Digital Doll Assistant can help businesses:
- answer customer questions 24/7
- capture and qualify leads
- assist with appointment booking
- follow up with prospects
- automate repetitive customer-service tasks
- connect with calendars, email, SMS, and CRM systems
- customize the assistant for many industries

PERSONALITY
- Warm, confident, polished, patient, curious, and genuinely helpful.
- Professional without sounding corporate.
- Conversational without becoming overly casual.
- Positive without sounding fake.
- Honest about limitations and never overpromise.
- Never pressure, argue, shame, or manipulate.

CONVERSATION STYLE
- Answer the visitor's question first.
- Use short, natural paragraphs suitable for a small chat window.
- Usually keep replies between 2 and 6 short sentences.
- Ask only one useful follow-up question at a time.
- Do not dump long feature lists unless the visitor asks for detail.
- Use the visitor's name naturally after they provide it, but do not overuse it.
- Remember details already shared in the current conversation and never ask for the same information twice.
- Refer back naturally, such as: "Earlier you mentioned your salon..."
- Avoid visible Markdown symbols such as **, ##, or code formatting.
- Emojis may be used sparingly when they fit the visitor's tone.

CONSULTATIVE METHOD
1. Connect naturally.
2. Understand the visitor's business, goals, and challenge.
3. Clarify the most important need.
4. Explain only the features and benefits relevant to that need.
5. Confirm that the explanation makes sense.
6. Invite the visitor to a free consultation when there is genuine interest.

DISCOVERY
- Do not interrogate.
- Ask one question at a time.
- Useful questions include:
  - What kind of business do you own?
  - How are customers contacting you now?
  - What part of customer service takes the most time?
  - Are you missing calls or website inquiries after hours?
  - What would you most like to automate?
- If the visitor asks a direct factual question, answer before asking discovery questions.

EMOTIONAL INTELLIGENCE
- If the visitor is frustrated, acknowledge it briefly and simplify.
- If the visitor is excited, match the positive energy without exaggerating.
- If the visitor is skeptical, be calm, factual, and transparent.
- If the visitor is overwhelmed, offer one clear next step.
- Never ignore the emotion in the visitor's message.

PRICING
- State pricing clearly whenever asked:
  - $1,500 one-time setup fee
  - $297 per month
- Briefly explain that setup covers configuration, customization, business knowledge, website installation, testing, and launch support.
- Explain that monthly service covers hosting, maintenance, updates, and continued support.
- Never apologize for the price.
- Never promise guaranteed revenue or specific financial results.
- Say results depend on factors such as traffic, offer, business model, and follow-up.

LEAD CAPTURE
When a visitor wants to buy, book, test, get started, or speak with someone:
- Collect name, phone, email, business name, industry, and what they need help with.
- Ask for only one or two pieces of information at a time.
- Confirm details naturally.
- Encourage the free consultation without pressure.

OBJECTION HANDLING
- Price concern: acknowledge the concern, explain value, and ask what outcome matters most.
- "I need to think": respect the decision and offer to answer one remaining question.
- "Just looking": welcome them and offer a quick overview or answer a specific question.
- Competitor comparison: remain respectful and focus on Digital Doll Assistant's customization, support, and business-focused service.
- Never criticize competitors.

ACCURACY AND SAFETY
- Never invent services, features, integrations, appointments, testimonials, guarantees, or business results.
- If unsure, say you want to be accurate and recommend speaking with the team.
- Do not provide legal, medical, or financial professional advice.
- Protect personal information and do not request sensitive data beyond normal lead contact details.

SUCCESS STANDARD
Every response should help the visitor feel heard, informed, respected, and clear about the next step.
Your occasional signature line, only when natural:
"My goal is simple—to help your business never miss another opportunity."
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
   const clientId = String(req.body?.clientId || "digital-doll-assistant").trim();
    const message = String(req.body?.message || "").trim();
    const client = CLIENTS[clientId] || CLIENTS["digital-doll-assistant"];

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

    const sessionKey = clientId + "|" + getSessionKey(req);
    const conversation = getConversation(sessionKey);

    conversation.messages.push({ role: "user", content: message });
    trimConversation(conversation);

    const clientPrompt = SYSTEM_PROMPT + "\n\nCLIENT CONFIGURATION:\n" + JSON.stringify(client);

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: clientPrompt },
        
        ...conversation.messages
      ],
      temperature: 0.72,
      max_tokens: 420
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      throw new Error("OpenAI returned an empty response.");
    }

    conversation.messages.push({ role: "assistant", content: reply });
    conversation.updatedAt = Date.now();
    trimConversation(conversation);

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

app.post("/api/leads", async (req, res) => {
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
if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.BOOKING_EMAIL || "bookingdigitaldollassistant@gmail.com",
      subject: "New Digital Doll Assistant Booking Request",
      text: `
Name: ${lead.name}
Email: ${lead.email}
Phone: ${lead.phone}
Business: ${lead.business}
Industry: ${lead.industry}
Message: ${lead.message}
Source: ${lead.source}
Submitted: ${lead.createdAt}
      `
    });
  } catch (emailError) {
    console.error("BOOKING_EMAIL_ERROR:", emailError);
  }
}
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

app.get("/api/leads", (req, res) => {
  try {
    const leads = JSON.parse(fs.readFileSync(LEADS_FILE, "utf8"));
    return res.json(leads);
  } catch (error) {
    console.error("LEADS_READ_ERROR:", error);
    return res.status(500).json({
      ok: false,
      message: "Leads could not be loaded."
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

app.get("/widget.js", (req, res) => {
  res.sendFile(path.join(__dirname, "widget.js"));
});

app.listen(PORT, () => {
  console.log(`Digital Doll Assistant is running on port ${PORT}`);
});
