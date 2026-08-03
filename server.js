require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const DATA_DIR = path.join(__dirname, "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");
const CUSTOMERS_FILE = path.join(DATA_DIR, "customers.json");

function ensureJsonFile(filePath) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "[]", "utf8");
}

function readJsonArray(filePath) {
  ensureJsonFile(filePath);
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Could not read ${filePath}:`, error);
    return [];
  }
}

function writeJsonArray(filePath, records) {
  ensureJsonFile(filePath);
  fs.writeFileSync(filePath, JSON.stringify(records, null, 2), "utf8");
}

function cleanText(value, maxLength = 5000) {
  return String(value || "").trim().slice(0, maxLength);
}

function createCustomerId(businessName) {
  const slug = cleanText(businessName, 80)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 35) || "customer";
  return `${slug}-${Date.now().toString(36)}`;
}

function findCustomer(customerId) {
  if (!customerId) return null;
  return readJsonArray(CUSTOMERS_FILE).find(
    (customer) => customer.id === String(customerId)
  ) || null;
}

ensureJsonFile(LEADS_FILE);
ensureJsonFile(CUSTOMERS_FILE);

const DDA_SYSTEM_PROMPT = `
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
- Explain benefits including 24/7 replies, lead capture, appointment booking,
  CRM, email, SMS, automation, analytics, calendar integration, and industry customization.
- Be professional, friendly, confident, and sales-focused.
- Do not promise guaranteed revenue.
- If someone wants to buy, book, test, or get started, collect their name,
  phone number, email, business name, industry, and what they need help with.
`;

function buildCustomerPrompt(customer) {
  if (!customer) return DDA_SYSTEM_PROMPT;

  return `
You are the AI business assistant for ${customer.businessName}.

Business details:
- Industry: ${customer.industry || "Not provided"}
- Owner/contact: ${customer.ownerName || "Not provided"}
- Phone: ${customer.phone || "Not provided"}
- Website: ${customer.website || "Not provided"}
- Business hours: ${customer.businessHours || "Not provided"}
- Booking link: ${customer.calendarUrl || "Not provided"}

Services and pricing:
${customer.services || "No services have been entered yet."}

Frequently asked questions:
${customer.faqs || "No FAQs have been entered yet."}

Instructions:
- Answer only from the business information above.
- Be professional, helpful, concise, and friendly.
- Never invent prices, policies, availability, guarantees, or services.
- When information is missing, offer to collect the visitor's contact details.
- Encourage appointment booking when relevant.
- Do not promise guaranteed results or revenue.
`;
}

app.get("/health", (req, res) => {
  res.json({ ok: true, product: "Digital Doll Assistant", customerDashboard: true });
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/api/customers", (req, res) => {
  try {
    res.json(readJsonArray(CUSTOMERS_FILE));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Customers could not be loaded." });
  }
});

app.post("/api/customers", (req, res) => {
  try {
    const businessName = cleanText(req.body.businessName, 150);
    const industry = cleanText(req.body.industry, 100);
    const ownerName = cleanText(req.body.ownerName, 150);
    const leadEmail = cleanText(req.body.leadEmail, 250);

    if (!businessName || !industry || !ownerName || !leadEmail) {
      return res.status(400).json({
        message: "Business name, industry, owner/contact name, and lead email are required."
      });
    }

    const customers = readJsonArray(CUSTOMERS_FILE);
    const customer = {
      id: createCustomerId(businessName),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      businessName,
      industry,
      ownerName,
      leadEmail,
      phone: cleanText(req.body.phone, 80),
      website: cleanText(req.body.website, 500),
      businessHours: cleanText(req.body.businessHours, 500),
      calendarUrl: cleanText(req.body.calendarUrl, 500),
      services: cleanText(req.body.services, 10000),
      faqs: cleanText(req.body.faqs, 10000),
      greeting: cleanText(req.body.greeting, 1000) ||
        "Hello! I’m your AI business assistant. How can I help you today?",
      status: "active"
    };

    customers.push(customer);
    writeJsonArray(CUSTOMERS_FILE, customers);

    res.status(201).json({ ok: true, message: "Customer saved successfully.", customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Customer could not be saved." });
  }
});

app.delete("/api/customers/:id", (req, res) => {
  try {
    const customerId = cleanText(req.params.id, 150);
    const customers = readJsonArray(CUSTOMERS_FILE);
    const remaining = customers.filter((customer) => customer.id !== customerId);

    if (remaining.length === customers.length) {
      return res.status(404).json({ message: "Customer not found." });
    }

    writeJsonArray(CUSTOMERS_FILE, remaining);
    res.json({ ok: true, message: "Customer deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Customer could not be deleted." });
  }
});

app.get("/api/customers/:id/widget-config", (req, res) => {
  const customer = findCustomer(req.params.id);
  if (!customer) return res.status(404).json({ message: "Customer not found." });

  res.json({
    customerId: customer.id,
    businessName: customer.businessName,
    greeting: customer.greeting,
    calendarUrl: customer.calendarUrl,
    phone: customer.phone,
    website: customer.website,
    businessHours: customer.businessHours
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = cleanText(req.body.message, 4000);
    const customerId = cleanText(req.body.customerId, 150);
    const customer = findCustomer(customerId);

    if (!message) {
      return res.status(400).json({ reply: "Please type a message so I can help you." });
    }

    if (customerId && !customer) {
      return res.status(404).json({
        reply: "This business assistant is not configured yet. Please contact the business directly."
      });
    }

    if (!openai) {
      return res.json({
        reply: customer
          ? `${customer.greeting} Please leave your name, phone number, and email, and the team will follow up.`
          : "I can help with Digital Doll Assistant pricing, setup, lead capture, appointment booking, CRM, email/SMS automation, and free consultations. Our setup fee is $1,500 and monthly service is $297/month. Would you like to book a free consultation?"
      });
    }

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: buildCustomerPrompt(customer) },
        { role: "user", content: message }
      ],
      temperature: 0.4
    });

    res.json({
      reply: completion.choices?.[0]?.message?.content ||
        "Please leave your contact information and the team will follow up."
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      reply: "I had trouble answering that. Please leave your name, phone number, and email, and our team will follow up."
    });
  }
});

app.post("/api/leads", (req, res) => {
  try {
    const customerId = cleanText(req.body.customerId, 150);
    const customer = findCustomer(customerId);

    if (customerId && !customer) {
      return res.status(404).json({ ok: false, message: "Customer configuration was not found." });
    }

    const lead = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      customerId: customer ? customer.id : "",
      customerBusinessName: customer ? customer.businessName : "Digital Doll Assistant",
      leadNotificationEmail: customer
        ? customer.leadEmail
        : process.env.BUSINESS_EMAIL || "Mypersonaltouch2u@gmail.com",
      name: cleanText(req.body.name, 150),
      phone: cleanText(req.body.phone, 80),
      email: cleanText(req.body.email, 250),
      business: cleanText(req.body.business, 150),
      industry: cleanText(req.body.industry, 100),
      message: cleanText(req.body.message, 5000),
      source: cleanText(req.body.source, 150) || "Website Chat"
    };

    const leads = readJsonArray(LEADS_FILE);
    leads.push(lead);
    writeJsonArray(LEADS_FILE, leads);

    res.json({ ok: true, message: "Lead captured successfully.", lead });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Lead could not be saved." });
  }
});

app.get("/api/leads", (req, res) => {
  try {
    const customerId = cleanText(req.query.customerId, 150);
    const leads = readJsonArray(LEADS_FILE);
    res.json(customerId ? leads.filter((lead) => lead.customerId === customerId) : leads);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Leads could not be loaded." });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/widget.js", (req, res) => {
  res.sendFile(path.join(__dirname, "widget.js"));
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Digital Doll Assistant running on http://localhost:${port}`);
});
