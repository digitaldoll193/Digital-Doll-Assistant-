(() => {
  if (window.__DDA_WIDGET_LOADED__) return;
  window.__DDA_WIDGET_LOADED__ = true;

  const script = document.currentScript;
  const scriptUrl = new URL(script.src);
  const assetBase = scriptUrl.origin;
  const apiBase = (script.getAttribute("data-api") || assetBase).replace(/\/$/, "");
  const NOVA_AVATAR = `${assetBase}/file_0000000007b4822f934f6ab3109ef00f.png`;

  const css = `
    :root{--dda-blue:#1188ff;--dda-blue-dark:#075ed1;--dda-bg:#07111f;--dda-card:#13243c;--dda-text:#fff;--dda-muted:#b8c5d8;--dda-border:rgba(255,255,255,.14);--dda-success:#36d98a}
    #dda-root{position:fixed;right:22px;bottom:22px;z-index:2147483000;font-family:Arial,Helvetica,sans-serif;color:var(--dda-text)}
    #dda-launcher{width:64px;height:64px;border-radius:50%;border:2px solid rgba(255,255,255,.3);padding:0;overflow:hidden;cursor:pointer;background:linear-gradient(145deg,var(--dda-blue),var(--dda-blue-dark));box-shadow:0 14px 36px rgba(0,77,180,.45)}
    #dda-launcher img{width:100%;height:100%;object-fit:cover;display:block}
    #dda-panel{display:none;flex-direction:column;width:min(390px,calc(100vw - 24px));height:min(640px,calc(100vh - 100px));margin-bottom:14px;border:1px solid var(--dda-border);border-radius:22px;overflow:hidden;background:var(--dda-bg);box-shadow:0 20px 65px rgba(0,0,0,.5)}
    #dda-panel.dda-open{display:flex}
    .dda-header{display:grid;grid-template-columns:54px 1fr 36px;align-items:center;gap:12px;padding:14px;background:radial-gradient(circle at 15% 0%,rgba(17,136,255,.35),transparent 42%),linear-gradient(135deg,#0d2c57,#081523 72%);border-bottom:1px solid var(--dda-border)}
    .dda-avatar{width:54px;height:54px;border-radius:50%;object-fit:cover;border:2px solid #67b7ff;box-shadow:0 0 18px rgba(17,136,255,.45);background:#0b2039}
    .dda-brand{font-size:18px;font-weight:800;line-height:1.1}.dda-sub{font-size:12px;color:var(--dda-muted);margin-top:3px}.dda-status{font-size:11px;color:var(--dda-success);margin-top:4px}
    .dda-close{align-self:start;width:34px;height:34px;border:0;border-radius:10px;background:rgba(255,255,255,.08);color:#fff;font-size:22px;cursor:pointer}
    .dda-messages{flex:1;overflow-y:auto;padding:16px;background:radial-gradient(circle at 100% 0%,rgba(17,136,255,.08),transparent 35%),var(--dda-bg)}
    .dda-row{display:flex;gap:9px;margin:0 0 12px;align-items:flex-end}.dda-row.user{justify-content:flex-end}
    .dda-mini-avatar{width:30px;height:30px;border-radius:50%;object-fit:cover;border:1px solid rgba(255,255,255,.25);flex:0 0 30px}
    .dda-bubble{max-width:78%;padding:11px 13px;border-radius:15px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}
    .dda-row.bot .dda-bubble{background:var(--dda-card);border:1px solid var(--dda-border);border-bottom-left-radius:5px}.dda-row.user .dda-bubble{background:linear-gradient(135deg,var(--dda-blue),var(--dda-blue-dark));border-bottom-right-radius:5px}
    .dda-quick{display:flex;gap:8px;flex-wrap:wrap;padding:0 14px 12px;background:var(--dda-bg)}.dda-quick button{border:1px solid rgba(103,183,255,.5);background:#0c2038;color:#dcebff;border-radius:999px;padding:8px 11px;font-size:12px;cursor:pointer}
    .dda-composer{display:grid;grid-template-columns:1fr 44px;gap:8px;padding:12px;border-top:1px solid var(--dda-border);background:#091625}.dda-input{width:100%;min-width:0;border:1px solid var(--dda-border);border-radius:12px;padding:12px;background:#0d1b2f;color:#fff;outline:none}.dda-send{border:0;border-radius:12px;background:linear-gradient(135deg,var(--dda-blue),var(--dda-blue-dark));color:#fff;font-size:20px;cursor:pointer}
    .dda-lead-card{margin:10px 0 4px 39px;padding:13px;border:1px solid var(--dda-border);border-radius:15px;background:#0d1b2f}.dda-lead-card input{width:100%;box-sizing:border-box;margin:0 0 8px;padding:10px;border-radius:9px;border:1px solid var(--dda-border);background:#07111f;color:#fff}.dda-lead-card button{width:100%;border:0;border-radius:10px;padding:11px;font-weight:800;background:linear-gradient(135deg,var(--dda-blue),var(--dda-blue-dark));color:#fff;cursor:pointer}.dda-note{font-size:11px;color:var(--dda-muted);margin-top:8px}.dda-typing{opacity:.8;font-style:italic}
    @media(max-width:520px){#dda-root{right:12px;bottom:12px}#dda-panel{width:calc(100vw - 24px);height:calc(100vh - 90px)}}
  `;

  const root = document.createElement("div");
  root.id = "dda-root";
  root.innerHTML = `
    <div id="dda-panel" aria-live="polite">
      <header class="dda-header">
        <img class="dda-avatar" src="${NOVA_AVATAR}" alt="Nova">
        <div><div class="dda-brand">Nova</div><div class="dda-sub">Digital Doll Assistant</div><div class="dda-status">● Online • 24/7 AI Business Assistant</div></div>
        <button class="dda-close" type="button" aria-label="Close chat">×</button>
      </header>
      <div class="dda-messages"></div>
      <div class="dda-quick">
        <button type="button" data-message="What services do you offer?">Services</button>
        <button type="button" data-message="What is your setup fee and monthly price?">Pricing</button>
        <button type="button" data-message="I want to book a free consultation.">Book Free Demo</button>
      </div>
      <form class="dda-composer"><input class="dda-input" type="text" placeholder="Ask Nova a question..." autocomplete="off"><button class="dda-send" type="submit" aria-label="Send message">➤</button></form>
    </div>
    <button id="dda-launcher" type="button" aria-label="Open Nova chat"><img src="${NOVA_AVATAR}" alt="Chat with Nova"></button>`;

  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
  document.body.appendChild(root);

  const panel = root.querySelector("#dda-panel");
  const launcher = root.querySelector("#dda-launcher");
  const closeButton = root.querySelector(".dda-close");
  const messages = root.querySelector(".dda-messages");
  const composer = root.querySelector(".dda-composer");
  const input = root.querySelector(".dda-input");
  const quickButtons = root.querySelectorAll(".dda-quick button");
  let sending = false;
  let leadFormShown = false;

  function scrollToBottom(){messages.scrollTop = messages.scrollHeight}
  function addMessage(text, role="bot"){
    const row=document.createElement("div");row.className=`dda-row ${role}`;
    if(role==="bot"){const avatar=document.createElement("img");avatar.className="dda-mini-avatar";avatar.src=NOVA_AVATAR;avatar.alt="Nova";row.appendChild(avatar)}
    const bubble=document.createElement("div");bubble.className="dda-bubble";bubble.textContent=text;row.appendChild(bubble);messages.appendChild(row);scrollToBottom();return row
  }
  function showTyping(){const row=addMessage("Nova is typing…","bot");row.classList.add("dda-typing");return row}
  function showLeadForm(){
    if(leadFormShown)return;leadFormShown=true;
    const card=document.createElement("form");card.className="dda-lead-card";card.innerHTML=`<input name="name" placeholder="Full name" required><input name="business" placeholder="Business name"><input name="email" type="email" placeholder="Email address" required><input name="phone" placeholder="Phone number"><button type="submit">Request My Free Demo</button><div class="dda-note">Your information will be sent to the Digital Doll Assistant team.</div>`;
    card.addEventListener("submit",async(e)=>{e.preventDefault();const button=card.querySelector("button");button.disabled=true;button.textContent="Sending…";const formData=Object.fromEntries(new FormData(card).entries());try{const response=await fetch(`${apiBase}/api/leads`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...formData,source:"Website Chat",message:"Requested a free Digital Doll Assistant demo."})});if(!response.ok)throw new Error("Lead request failed");card.remove();addMessage("Thank you! Your demo request has been received. The Digital Doll Assistant team will follow up with you.","bot")}catch(error){console.error("DDA lead error:",error);button.disabled=false;button.textContent="Request My Free Demo";addMessage("I couldn't submit the form just now. Please use the Book a Free Demo page or contact the Digital Doll Assistant team directly.","bot")}});
    messages.appendChild(card);scrollToBottom();
  }
  async function sendMessage(rawText){
    const text=String(rawText||"").trim();if(!text||sending)return;sending=true;input.value="";addMessage(text,"user");const typing=showTyping();
    try{const response=await fetch(`${apiBase}/api/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:text})});if(!response.ok)throw new Error(`Chat request failed: ${response.status}`);const data=await response.json();typing.remove();const reply=data.reply||data.message||"I can help with pricing, services, and booking a free consultation.";addMessage(reply,"bot");const lower=`${text} ${reply}`.toLowerCase();if(lower.includes("free consultation")||lower.includes("free demo")||lower.includes("book")||lower.includes("schedule"))showLeadForm()}
    catch(error){console.error("DDA chat error:",error);typing.remove();addMessage("I'm having trouble connecting right now. Please try again in a moment or use the Book a Free Demo form on this website.","bot")}
    finally{sending=false;input.focus()}
  }
  launcher.addEventListener("click",()=>{panel.classList.add("dda-open");launcher.style.display="none";input.focus()});
  closeButton.addEventListener("click",()=>{panel.classList.remove("dda-open");launcher.style.display="block"});
  composer.addEventListener("submit",e=>{e.preventDefault();sendMessage(input.value)});
  quickButtons.forEach(button=>button.addEventListener("click",()=>sendMessage(button.dataset.message)));
  addMessage("Hi! I'm Nova, your Digital Doll Assistant. I can explain our services, pricing, and help you request a free demo. How can I help you today?","bot");
})();
