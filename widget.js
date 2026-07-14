(function () {
  const script = document.currentScript;
  const apiBase = script.getAttribute("data-api") || "http://localhost:3000";

  const css = `
    #dda-widget{position:fixed;right:22px;bottom:22px;z-index:999999;font-family:Arial,Helvetica,sans-serif}
    .dda-bubble{width:76px;height:76px;border-radius:50%;background:radial-gradient(circle at 35% 25%,#70dcff,#0877ff 45%,#111827 78%);box-shadow:0 0 25px #178bff,0 0 60px rgba(124,49,255,.55);border:2px solid rgba(255,255,255,.35);cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:22px}
    .dda-panel{width:390px;max-width:calc(100vw - 28px);height:620px;max-height:calc(100vh - 120px);border-radius:26px;overflow:hidden;background:#070b14;border:1px solid rgba(80,166,255,.55);box-shadow:0 0 35px rgba(0,115,255,.35),0 20px 70px rgba(0,0,0,.7);display:none;flex-direction:column}
    .dda-header{background:linear-gradient(135deg,#05070d,#0e1b35 55%,#23104a);padding:18px;border-bottom:1px solid rgba(80,166,255,.35);color:#fff;position:relative}
    .dda-brand{font-size:22px;font-weight:800}.dda-sub{color:#b7cdfb;font-size:12px;margin-top:4px;text-transform:uppercase;letter-spacing:1.8px}.dda-status{margin-top:10px;color:#28ff7e;font-size:13px}.dda-close{position:absolute;top:17px;right:17px;background:transparent;color:white;border:none;font-size:25px;cursor:pointer}
    .dda-body{padding:16px;flex:1;overflow-y:auto;background:radial-gradient(circle at top right,rgba(0,118,255,.16),transparent 38%),radial-gradient(circle at bottom left,rgba(142,45,255,.16),transparent 35%),#070b14}
    .dda-msg{padding:12px 14px;border-radius:18px;margin:10px 0;line-height:1.45;font-size:14px}.dda-ai{background:rgba(255,255,255,.08);border:1px solid rgba(91,168,255,.25);color:#fff;border-top-left-radius:5px}.dda-user{background:linear-gradient(135deg,#0877ff,#7438ff);color:#fff;margin-left:45px;border-top-right-radius:5px}
    .dda-actions{display:grid;gap:9px;margin-top:12px}.dda-action{width:100%;padding:13px 14px;border-radius:14px;border:1px solid rgba(38,145,255,.65);background:rgba(11,25,48,.86);color:#fff;cursor:pointer;text-align:left;font-size:14px}
    .dda-form{display:grid;gap:9px;margin-top:12px}.dda-input,.dda-select,.dda-textarea{width:100%;box-sizing:border-box;background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(100,174,255,.35);border-radius:12px;padding:12px;outline:none}.dda-input::placeholder,.dda-textarea::placeholder{color:#9bb2d6}.dda-select option{color:#000}.dda-submit{background:linear-gradient(135deg,#0877ff,#7b37ff);color:white;border:none;border-radius:14px;padding:13px;font-weight:800;cursor:pointer}
    .dda-footer{border-top:1px solid rgba(80,166,255,.25);padding:12px;background:#05070d}.dda-row{display:flex;gap:8px}.dda-type{flex:1;background:rgba(255,255,255,.08);color:white;border:1px solid rgba(100,174,255,.35);border-radius:14px;padding:12px;outline:none}.dda-send{width:52px;border:none;border-radius:14px;background:#0877ff;color:white;font-size:18px;cursor:pointer}.dda-powered{color:#8299c5;text-align:center;font-size:11px;padding-top:8px}
  `;

  const style = document.createElement("style");
  style.innerHTML = css;
  document.head.appendChild(style);

  const root = document.createElement("div");
  root.id = "dda-widget";
  root.innerHTML = `
    <div class="dda-panel" id="ddaPanel">
      <div class="dda-header">
        <button class="dda-close" id="ddaClose">×</button>
        <div class="dda-brand">Digital Doll Assistant</div>
        <div class="dda-sub">The AI Employee That Works While You Sleep</div>
        <div class="dda-status">● Online • 24/7 AI Business Assistant</div>
      </div>
      <div class="dda-body" id="ddaBody"></div>
      <div class="dda-footer">
        <div class="dda-row">
          <input class="dda-type" id="ddaInput" placeholder="Type your message..." />
          <button class="dda-send" id="ddaSend">➤</button>
        </div>
        <div class="dda-powered">Powered by Digital Doll Assistant</div>
      </div>
    </div>
    <div class="dda-bubble" id="ddaBubble">DDA</div>
  `;
  document.body.appendChild(root);

  const panel = document.getElementById("ddaPanel");
  const bubble = document.getElementById("ddaBubble");
  const close = document.getElementById("ddaClose");
  const body = document.getElementById("ddaBody");
  const input = document.getElementById("ddaInput");
  const send = document.getElementById("ddaSend");

  function scrollBottom(){ body.scrollTop = body.scrollHeight; }
  function ai(text){ const m=document.createElement("div"); m.className="dda-msg dda-ai"; m.innerHTML=text; body.appendChild(m); scrollBottom(); }
  function user(text){ const m=document.createElement("div"); m.className="dda-msg dda-user"; m.textContent=text; body.appendChild(m); scrollBottom(); }
  function actions(buttons){
    const wrap=document.createElement("div"); wrap.className="dda-actions";
    buttons.forEach(b=>{ const btn=document.createElement("button"); btn.className="dda-action"; btn.textContent=b.label; btn.onclick=b.onClick; wrap.appendChild(btn); });
    body.appendChild(wrap); scrollBottom();
  }

  function mainMenu(){
    ai(`👋 Welcome to <strong>Digital Doll Assistant</strong>.<br><br>I work while you sleep. I answer questions, capture leads, book appointments, and help businesses grow 24/7.<br><br>How can I help you today?`);
    actions([
      {label:"💎 Set Up Fee", onClick: setupFee},
      {label:"📅 Book Free Consultation", onClick: showLeadForm},
      {label:"💰 View Pricing", onClick: pricing},
      {label:"🤖 What Does The AI Do?", onClick: features},
      {label:"🏡 Real Estate AI Assistant", onClick: realEstate}
    ]);
  }

  function setupFee(){
    user("Set Up Fee");
    ai(`Our professional setup fee is <strong>$1,500</strong>.<br><br>This includes custom AI setup, business knowledge training, website installation, lead capture setup, appointment flow, CRM setup, testing, and launch support.<br><br>Monthly service is <strong>$297/month</strong>.`);
  }

  function pricing(){
    user("View Pricing");
    ai(`Digital Doll Assistant pricing:<br><br>✅ <strong>$1,500 setup fee</strong><br>✅ <strong>$297/month</strong><br><br>This gives your business a 24/7 AI assistant for lead capture, customer questions, appointments, CRM support, follow-ups, and automation.`);
  }

  function features(){
    user("What Does The AI Do?");
    ai(`<strong>Digital Doll Assistant includes:</strong><br><br>🤖 AI chat<br>📅 Appointment booking<br>🔄 Reschedule/cancel flows<br>📈 Lead capture<br>📧 Email support<br>📱 SMS follow-up<br>👥 CRM support<br>📊 Analytics<br>🔗 Integrations<br>🔒 Security`);
  }

  function realEstate(){
    user("Real Estate AI Assistant");
    ai(`For real estate, Digital Doll Assistant captures buyer and seller leads, qualifies prospects, answers listing questions, books consultations, schedules showings, and follows up automatically.`);
  }

  function showLeadForm(){
    user("Book Free Consultation");
    ai("Perfect. Fill this out and we’ll follow up about your AI assistant setup.");
    const form=document.createElement("form");
    form.className="dda-form";
    form.innerHTML=`
      <input class="dda-input" name="name" placeholder="Full Name" required />
      <input class="dda-input" name="phone" placeholder="Phone Number" required />
      <input class="dda-input" name="email" placeholder="Email Address" required />
      <input class="dda-input" name="business" placeholder="Business Name" />
      <select class="dda-select" name="industry">
        <option value="">Select Industry</option>
        <option>Real Estate</option><option>Medical</option><option>Legal</option><option>Beauty / Salon</option><option>Contractor / Home Services</option><option>Restaurant</option><option>Retail</option><option>Other</option>
      </select>
      <textarea class="dda-textarea" name="message" rows="3" placeholder="What do you want your AI assistant to help with?"></textarea>
      <button class="dda-submit" type="submit">Send My Request</button>
    `;
    form.onsubmit=async function(e){
      e.preventDefault();
      const data=Object.fromEntries(new FormData(form).entries());
      await fetch(apiBase + "/api/leads", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({...data, source:"Digital Doll Website Chat"})
      });
      form.remove();
      ai(`✅ Thank you, <strong>${data.name}</strong>! Your request has been captured. Our team will follow up soon.`);
    };
    body.appendChild(form);
    scrollBottom();
  }

  async function sendMessage(){
    const text=input.value.trim();
    if(!text) return;
    user(text);
    input.value="";
    try{
      const res=await fetch(apiBase + "/api/chat", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({message:text})
      });
      const data=await res.json();
      ai(data.reply);
    } catch(e){
      ai("I can help with pricing, setup fee, free consultation, features, and appointment booking. Would you like to book a free consultation?");
    }
  }

  bubble.onclick=()=>{ bubble.style.display="none"; panel.style.display="flex"; if(!body.dataset.started){ body.dataset.started="true"; mainMenu(); } };
  close.onclick=()=>{ panel.style.display="none"; bubble.style.display="flex"; };
  send.onclick=sendMessage;
  input.addEventListener("keydown", e=>{ if(e.key==="Enter") sendMessage(); });
})();
