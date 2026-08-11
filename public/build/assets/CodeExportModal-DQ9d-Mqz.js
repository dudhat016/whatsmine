import{r as $,j as d}from"./app-CK4xNp3q.js";import{b as k,e as S,s as q}from"./cssCompiler-CLbkFpcE.js";import{C as z}from"./code-BkCpXffx.js";import{C}from"./check-NQ5dKctq.js";import{C as E}from"./copy-D1A-JH4q.js";import"./createLucideIcon-Bgercu_k.js";const c=s=>{if(!s)return"";const r=q(s),e=`el-${r.id.replace(/[^a-zA-Z0-9-_]/g,"-")}`;if(r.type==="section"){const t=(r.elements||[]).map(a=>c(a)).join(`
`);return`<section id="${e}">
${t}
</section>`}if(["col_1","col_2","col_3","col_4","col_sidebar"].includes(r.type)){const t=(r.columns||[]).map((a,n)=>`<div class="funnel-col">
${(a||[]).map(i=>c(i)).join(`
`)}
</div>`).join(`
`);return`<div id="${e}" class="funnel-row funnel-row-${r.type}">
${t}
</div>`}if(r.type==="flex_container"){const t=(r.elements||[]).map(a=>c(a)).join(`
`);return`<div id="${e}" class="funnel-flex-container">
${t}
</div>`}if(r.type==="grid_container"){const t=(r.columns||[]).map((a,n)=>`<div class="funnel-col">
${(a||[]).map(i=>c(i)).join(`
`)}
</div>`).join(`
`);return`<div id="${e}" class="funnel-row funnel-row-grid_container">
${t}
</div>`}if(r.type==="headline"){const t=r.headingTag||"h2";return`<${t} id="${e}">${r.content||r.text||"Headline Text"}</${t}>`}if(r.type==="subheadline"){const t=r.headingTag||"h3";return`<${t} id="${e}">${r.content||r.text||"Subheadline Text"}</${t}>`}if(r.type==="paragraph")return`<p id="${e}">${r.content||r.text||"Paragraph content goes here..."}</p>`;if(r.type==="bullets"){const t=(r.items||["Bullet point 1","Bullet point 2","Bullet point 3"]).map(a=>`<li>${a}</li>`).join(`
`);return`<ul id="${e}" class="funnel-bullets">
${t}
</ul>`}if(r.type==="quote")return`<blockquote id="${e}" class="funnel-quote"><p>“${r.quote||r.content||r.text||"Quote snippet here"}”</p><cite>— ${r.author||"Author"}</cite></blockquote>`;if(r.type==="image"){const t=r.maxWidth?`${r.maxWidth}%`:"100%",a=`<img src="${r.url||""}" alt="${r.alt||""}" style="max-width:${t};" />`,n=r.linkUrl?`<a href="${r.linkUrl}" target="_blank" rel="noopener">${a}</a>`:a;return`<div id="${e}" class="funnel-image-wrap">${n}</div>`}if(r.type==="video")return`<div id="${e}" class="funnel-video-wrap"><iframe src="${r.videoUrl||""}" frameborder="0" allowfullscreen></iframe></div>`;if(r.type==="submit_button"){const t={arrow:"→",lock:"🔒",lightning:"⚡",cart:"🛒",download:"📥",star:"⭐",sparkles:"✨",check:"✓"},a=r.btnIcon&&r.btnIcon!=="none"&&t[r.btnIcon]||"",n=r.btnIconPosition||"right",o=a?n==="left"?`${a} ${r.text||"Submit"}`:`${r.text||"Submit"} ${a}`:r.text||"Submit →";(r.targetUrl||"#").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/</g,"&lt;").replace(/>/g,"&gt;");const i=r.subtext?`<span style="display:block;font-size:${r.subtextFontSize||11}px;color:${r.subtextColor||"rgba(255,255,255,0.85)"};font-weight:400;margin-top:2px;">${r.subtext}</span>`:"";return`<div class="funnel-btn-wrap"><button id="${e}" ${btnTypeAttr}><span>${o}</span>${i}</button></div>`}if(r.type==="input_email")return`<div class="funnel-input-wrap"><input type="email" id="${e}" placeholder="${r.placeholder||"Enter your email..."}" /></div>`;if(r.type==="input_name")return`<div class="funnel-input-wrap"><input type="text" id="${e}" placeholder="${r.placeholder||"Enter your name..."}" /></div>`;if(r.type==="input_phone")return`<div class="funnel-input-wrap"><input type="tel" id="${e}" placeholder="${r.placeholder||"Enter phone..."}" /></div>`;if(r.type==="checkbox")return`<div class="funnel-input-wrap"><label style="display:flex;align-items:center;gap:8px;"><input type="checkbox" id="${e}" /> <span>${r.text||"I agree"}</span></label></div>`;if(r.type==="audio")return`<div id="${e}" class="funnel-audio-wrap"><p style="margin:0 0 8px 0;font-weight:600;">${r.title||"Audio Track"}</p><audio controls style="width:100%;" src="${r.url||""}"></audio></div>`;if(r.type==="icon_box")return`<div id="${e}" class="funnel-icon-box"><h3>${r.title||"Feature"}</h3><p>${r.desc||""}</p></div>`;if(r.type==="progress_bar"){const t=r.percent||80,a=r.barColor||"var(--color-primary, #467235)";return`<div id="${e}" class="funnel-progress-wrap">${r.label?`<p style="margin:0 0 4px 0;font-size:12px;font-weight:600;">${r.label}</p>`:""}<div class="funnel-progress-bar"><div style="width:${t}%;height:100%;background:${a};transition:width 0.5s;"></div></div></div>`}if(r.type==="social"){const t=encodeURIComponent(r.shareUrl||"");return`<div id="${e}" class="funnel-social-wrap">
            <a href="https://www.facebook.com/sharer/sharer.php?u=${t}" target="_blank" rel="noopener" class="funnel-social-fb">f Share</a>
            <a href="https://twitter.com/intent/tweet?url=${t}" target="_blank" rel="noopener" class="funnel-social-tw">𝕏 Tweet</a>
            <a href="https://api.whatsapp.com/send?text=${t}" target="_blank" rel="noopener" class="funnel-social-wa">✉ Share</a>
        </div>`}if(r.type==="star_rating"){const a=r.stars||5,o=`<span style="color:${r.starColor||"#f59e0b"};font-size:20px;letter-spacing:2px;">${"★".repeat(a)}</span>`,i=r.ratingText?`<p style="margin:4px 0 0 0;font-size:12px;color:#6b7280;font-weight:600;">${r.ratingText}</p>`:"";return`<div id="${e}" class="funnel-star-rating">${o}${i}</div>`}if(r.type==="custom_code")return`<div id="${e}" class="funnel-custom-code">${r.code||""}</div>`;if(r.type==="rich_text")return`<div id="${e}" class="funnel-rich-text">${r.htmlContent||r.content||""}</div>`;if(r.type==="order_bump"){const t=r.badgeText||"YES! ADD THIS TO MY ORDER",a=r.title||"ONE TIME OFFER: Add Checklist",n=r.desc||"Check this box to instantly include this offer.",o=r.price||17;return`<div id="${e}" class="funnel-order-bump">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <span class="bump-badge">${t}</span>
                <span class="bump-price">$${o}</span>
            </div>
            <label>
                <input type="checkbox" />
                <div>
                    <h4 style="margin:0;font-size:14px;font-weight:700;color:#111827;">${a}</h4>
                    <p style="margin:4px 0 0 0;font-size:12px;color:#4b5563;">${n}</p>
                </div>
            </label>
        </div>`}if(r.type==="faq_accordion"){const a=(r.items||[]).map((n,o)=>`
            <div class="faq-item">
                <button type="button" class="faq-toggle">
                    <span>${n.q||"Question?"}</span>
                    <span class="faq-icon">▼</span>
                </button>
                <div class="faq-answer">
                    ${n.a||""}
                </div>
            </div>
        `).join("");return`<div id="${e}" class="funnel-faq-accordion">${a}</div>`}if(r.type==="testimonial_slider"){const t=r.items||[],a=t.map((i,l)=>`
            <div class="testimonial-card" style="display:${l===0?"block":"none"};">
                <div style="color:#f59e0b;font-size:16px;margin-bottom:8px;">★★★★★</div>
                <blockquote style="font-style:italic;font-size:14px;color:#1f2937;margin:0 0 12px 0;line-height:1.6;">"${i.quote||""}"</blockquote>
                <p style="margin:0;font-weight:700;font-size:13px;color:#111827;">${i.author||""} <span style="font-weight:400;color:#6b7280;">(${i.role||""})</span></p>
            </div>
        `).join(""),n=t.map((i,l)=>`
            <button type="button" class="slider-dot" data-idx="${l}" style="width:${l===0?"20px":"8px"};background:${l===0?"var(--color-primary, #467235)":"#e5e7eb"};"></button>
        `).join(""),o=t.length>1?`
            <button type="button" class="slider-prev">‹</button>
            <button type="button" class="slider-next">›</button>
        `:"";return`<div id="${e}" class="funnel-testimonial-slider">
            <div class="slider-slides-wrap">${a}</div>
            ${o}
            ${t.length>1?`<div class="slider-dots">${n}</div>`:""}
        </div>`}if(r.type==="divider")return`<hr id="${e}" class="funnel-divider" />`;if(r.type==="spacer"){const t=r.spacerHeight!==void 0?r.spacerHeight:(r.paddingY||20)*2;return`<div id="${e}" class="funnel-spacer" style="height:${t}px;"></div>`}if(r.type==="timer"){const t=r.days!==void 0?r.days:0,a=r.hours!==void 0?r.hours:2,n=r.minutes!==void 0?r.minutes:15,o=r.seconds!==void 0?r.seconds:0,i=r.timerAction||"show_message",l=(r.redirectUrl||"#").replace(/"/g,"&quot;"),b=(r.expireMessage||"OFFER EXPIRED!").replace(/"/g,"&quot;"),f=r.timerTheme||"red_urgent",p={red_urgent:"background:#fef2f2;border:1px solid #fca5a5;color:#dc2626;",brand:"background:rgba(99,102,241,0.08);border:1px solid var(--color-primary, #6EC1E4);color:var(--color-primary, #467235);",dark:"background:#111827;border:1px solid #374151;color:#ffffff;",light:"background:#ffffff;border:1px solid #e5e7eb;color:#111827;box-shadow:0 1px 3px rgba(0,0,0,0.05);",minimal:"background:transparent;border:none;color:var(--color-primary, #111827);padding:0;"},u=p[f]||p.red_urgent,h=(t>0?`${String(t).padStart(2,"0")}d : `:"")+`${String(a).padStart(2,"0")} : ${String(n).padStart(2,"0")} : ${String(o).padStart(2,"0")}`;return`<div id="${e}" class="funnel-timer" style="padding:14px;border-radius:12px;text-align:center;font-weight:700;font-family:monospace;font-size:18px;margin-bottom:16px;letter-spacing:1px;${u}" data-days="${t}" data-hours="${a}" data-minutes="${n}" data-seconds="${o}" data-action="${i}" data-redirect="${l}" data-message="${b}">⏰ <span class="timer-display">${h}</span></div>`}return""},_=(s,r,e,t,a="Live Funnel Page")=>{const n=[],o=[],i=[],l=(r==null?void 0:r.bgColor)||"#ffffff";n.push(`:root { ${k(r)} }`),n.push("*, *::before, *::after { box-sizing: border-box; }"),n.push(`body { margin:0; padding:0; font-family:var(--brand-body-font-family); background-color:${l}; color:var(--brand-body-color); font-size:var(--brand-body-font-size); line-height:var(--brand-body-line-height); min-height:100vh; }`),n.push("h1 { margin:var(--brand-h1-margin-top) var(--brand-h1-margin-right) var(--brand-h1-margin-bottom) var(--brand-h1-margin-left); padding:var(--brand-h1-padding-top) var(--brand-h1-padding-right) var(--brand-h1-padding-bottom) var(--brand-h1-padding-left); font-family:var(--brand-h1-font-family); font-size:var(--brand-h1-font-size); font-weight:var(--brand-h1-font-weight); line-height:var(--brand-h1-line-height); color:var(--brand-h1-color); text-transform:var(--brand-h1-text-transform); font-style:var(--brand-h1-font-style); text-decoration:var(--brand-h1-text-decoration); }"),n.push("h2 { margin:var(--brand-h2-margin-top) var(--brand-h2-margin-right) var(--brand-h2-margin-bottom) var(--brand-h2-margin-left); padding:var(--brand-h2-padding-top) var(--brand-h2-padding-right) var(--brand-h2-padding-bottom) var(--brand-h2-padding-left); font-family:var(--brand-h2-font-family); font-size:var(--brand-h2-font-size); font-weight:var(--brand-h2-font-weight); line-height:var(--brand-h2-line-height); color:var(--brand-h2-color); text-transform:var(--brand-h2-text-transform); font-style:var(--brand-h2-font-style); text-decoration:var(--brand-h2-text-decoration); }"),n.push("h3 { margin:var(--brand-h3-margin-top) var(--brand-h3-margin-right) var(--brand-h3-margin-bottom) var(--brand-h3-margin-left); padding:var(--brand-h3-padding-top) var(--brand-h3-padding-right) var(--brand-h3-padding-bottom) var(--brand-h3-padding-left); font-family:var(--brand-h3-font-family); font-size:var(--brand-h3-font-size); font-weight:var(--brand-h3-font-weight); line-height:var(--brand-h3-line-height); color:var(--brand-h3-color); text-transform:var(--brand-h3-text-transform); font-style:var(--brand-h3-font-style); text-decoration:var(--brand-h3-text-decoration); }"),n.push("h4 { margin:var(--brand-h4-margin-top) var(--brand-h4-margin-right) var(--brand-h4-margin-bottom) var(--brand-h4-margin-left); padding:var(--brand-h4-padding-top) var(--brand-h4-padding-right) var(--brand-h4-padding-bottom) var(--brand-h4-padding-left); font-family:var(--brand-h4-font-family); font-size:var(--brand-h4-font-size); font-weight:var(--brand-h4-font-weight); line-height:var(--brand-h4-line-height); color:var(--brand-h4-color); text-transform:var(--brand-h4-text-transform); font-style:var(--brand-h4-font-style); text-decoration:var(--brand-h4-text-decoration); }"),n.push("h5 { margin:var(--brand-h5-margin-top) var(--brand-h5-margin-right) var(--brand-h5-margin-bottom) var(--brand-h5-margin-left); padding:var(--brand-h5-padding-top) var(--brand-h5-padding-right) var(--brand-h5-padding-bottom) var(--brand-h5-padding-left); font-family:var(--brand-h5-font-family); font-size:var(--brand-h5-font-size); font-weight:var(--brand-h5-font-weight); line-height:var(--brand-h5-line-height); color:var(--brand-h5-color); text-transform:var(--brand-h5-text-transform); font-style:var(--brand-h5-font-style); text-decoration:var(--brand-h5-text-decoration); }"),n.push("h6 { margin:var(--brand-h6-margin-top) var(--brand-h6-margin-right) var(--brand-h6-margin-bottom) var(--brand-h6-margin-left); padding:var(--brand-h6-padding-top) var(--brand-h6-padding-right) var(--brand-h6-padding-bottom) var(--brand-h6-padding-left); font-family:var(--brand-h6-font-family); font-size:var(--brand-h6-font-size); font-weight:var(--brand-h6-font-weight); line-height:var(--brand-h6-line-height); color:var(--brand-h6-color); text-transform:var(--brand-h6-text-transform); font-style:var(--brand-h6-font-style); text-decoration:var(--brand-h6-text-decoration); }"),n.push("p { margin:var(--brand-body-margin-top) var(--brand-body-margin-right) var(--brand-body-margin-bottom) var(--brand-body-margin-left); padding:var(--brand-body-padding-top) var(--brand-body-padding-right) var(--brand-body-padding-bottom) var(--brand-body-padding-left); font-family:var(--brand-body-font-family); font-size:var(--brand-body-font-size); font-weight:var(--brand-body-font-weight); line-height:var(--brand-body-line-height); color:var(--brand-body-color); }"),n.push(".funnel-container { width:100%; margin:0 auto; padding:0; }"),n.push("section { width:100%; max-width:var(--brand-container-width); padding-top:var(--brand-container-padding-top); padding-right:var(--brand-container-padding-right); padding-bottom:var(--brand-container-padding-bottom); padding-left:var(--brand-container-padding-left); margin-top:var(--brand-container-margin-top); margin-right:auto; margin-bottom:var(--brand-container-margin-bottom); margin-left:auto; }"),n.push(".funnel-row { display:grid; row-gap:var(--brand-element-gap-y); column-gap:var(--brand-element-gap-x); width:100%; }"),n.push(".funnel-flex-container { display:flex; gap:var(--brand-element-gap-y) var(--brand-element-gap-x); }"),n.push(".funnel-row-grid_container { grid-template-columns:repeat(2, minmax(0, 1fr)); }"),n.push(".funnel-row-col_1 { grid-template-columns:1fr; }"),n.push(".funnel-row-col_2 { grid-template-columns:repeat(2, minmax(0, 1fr)); }"),n.push(".funnel-row-col_3 { grid-template-columns:repeat(3, minmax(0, 1fr)); }"),n.push(".funnel-row-col_4 { grid-template-columns:repeat(4, minmax(0, 1fr)); }"),n.push(".funnel-row-col_sidebar { grid-template-columns:minmax(0, 7fr) minmax(0, 3fr); }"),n.push(".funnel-col { width:100%; min-width:0; padding:var(--brand-col-padding-top, 0) var(--brand-col-padding-right, 0) var(--brand-col-padding-bottom, 0) var(--brand-col-padding-left, 0); margin:var(--brand-col-margin-top, 0) var(--brand-col-margin-right, 0) var(--brand-col-margin-bottom, 0) var(--brand-col-margin-left, 0); }"),n.push(".funnel-bullets { list-style:none; padding:0; margin:var(--brand-body-margin-top, 0) var(--brand-body-margin-right, 0) var(--brand-body-margin-bottom, 16px) var(--brand-body-margin-left, 0); }"),n.push(".funnel-bullets li { margin-bottom:var(--brand-bullet-gap, 8px); display:flex; align-items:center; gap:var(--brand-bullet-gap, 8px); font-weight:var(--brand-body-font-weight, 500); color:var(--brand-body-color); }"),n.push('.funnel-bullets li::before { content:"✓"; color:var(--brand-bullet-icon-color, var(--color-primary, #16a34a)); font-weight:700; }'),n.push(".funnel-quote { padding:var(--brand-quote-padding-top, 16px) var(--brand-quote-padding-right, 20px) var(--brand-quote-padding-bottom, 16px) var(--brand-quote-padding-left, 20px); border-left:var(--brand-quote-border-width, 4px) solid var(--brand-quote-border-color, var(--color-primary, #6EC1E4)); background:var(--brand-quote-bg-color, rgba(99,102,241,0.06)); margin:var(--brand-body-margin-top, 0) var(--brand-body-margin-right, 0) var(--brand-body-margin-bottom, 16px) var(--brand-body-margin-left, 0); border-radius:var(--brand-quote-border-radius, 0 8px 8px 0); }"),n.push(".funnel-quote p { font-style:var(--brand-quote-font-style, italic); font-weight:var(--brand-quote-font-weight, 400); margin:0 0 8px 0; color:var(--brand-quote-text-color, var(--brand-body-color)); }"),n.push(".funnel-quote cite { font-weight:var(--brand-quote-cite-weight, 700); font-style:var(--brand-quote-cite-style, normal); color:var(--brand-quote-border-color, var(--color-primary, #6EC1E4)); }"),n.push(".funnel-image-wrap { margin:var(--brand-body-margin-top, 0) var(--brand-body-margin-right, 0) var(--brand-body-margin-bottom, 16px) var(--brand-body-margin-left, 0); }"),n.push(".funnel-image-wrap img { display:block; width:100%; height:auto; border-radius:var(--brand-img-border-radius, 8px); box-shadow:var(--brand-img-shadow, 0 4px 12px rgba(0,0,0,0.1)); transition:transform 0.3s ease; }"),n.push(".funnel-image-wrap img:hover { transform:scale(1.02); }"),n.push(".funnel-video-wrap { position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:var(--brand-video-border-radius, 12px); box-shadow:var(--brand-video-shadow, 0 10px 25px rgba(0,0,0,0.2)); margin:var(--brand-body-margin-top, 0) var(--brand-body-margin-right, 0) var(--brand-body-margin-bottom, 16px) var(--brand-body-margin-left, 0); }"),n.push(".funnel-video-wrap iframe { position:absolute; top:0; left:0; width:100%; height:100%; border:0; }"),n.push(".funnel-btn-wrap { margin:0 0 16px 0; }"),n.push(".funnel-btn-wrap button { width:100%; margin:var(--brand-btn-margin-top, 0) var(--brand-btn-margin-right, 0) var(--brand-btn-margin-bottom, 16px) var(--brand-btn-margin-left, 0); padding:var(--brand-btn-padding-top, 14px) var(--brand-btn-padding-right, 28px) var(--brand-btn-padding-bottom, 14px) var(--brand-btn-padding-left, 28px); font-family:var(--brand-btn-font-family); font-size:var(--brand-btn-font-size); font-weight:var(--brand-btn-font-weight); cursor:pointer; border:none; border-radius:var(--brand-btn-border-radius); background:var(--brand-btn-bg-color); color:var(--brand-btn-text-color); transition:all 0.2s ease; }"),n.push(".funnel-btn-wrap button:hover { background:var(--brand-btn-hover-bg-color); color:var(--brand-btn-hover-text-color); filter:brightness(1.05); transform:translateY(-2px); box-shadow:0 8px 20px rgba(0,0,0,0.15); }"),n.push(".funnel-input-wrap { margin:0 0 12px 0; }"),n.push(".funnel-input-wrap input { width:100%; margin:var(--brand-field-margin-top, 0) var(--brand-field-margin-right, 0) var(--brand-field-margin-bottom, 12px) var(--brand-field-margin-left, 0); padding:var(--brand-field-padding-top, 12px) var(--brand-field-padding-right, 16px) var(--brand-field-padding-bottom, 12px) var(--brand-field-padding-left, 16px); font-family:var(--brand-field-font-family); font-size:var(--brand-field-font-size); background:var(--brand-field-bg-color); color:var(--brand-field-text-color); border:1px solid var(--brand-field-border-color); border-radius:var(--brand-field-border-radius); outline:none; transition:border-color 0.2s; }"),n.push(".funnel-input-wrap input:focus { border-color:var(--color-primary); box-shadow:0 0 0 3px var(--color-primary)22; }"),n.push(".funnel-divider { border:none; border-top:var(--brand-divider-width, 1px) var(--brand-divider-style, solid) var(--brand-divider-color, #e5e7eb); margin:var(--brand-divider-margin-top, 24px) 0 var(--brand-divider-margin-bottom, 24px) 0; }"),n.push(".funnel-spacer { height:var(--brand-spacer-height, 40px); }"),n.push(".funnel-timer { padding:var(--brand-timer-padding, 16px); background:var(--brand-timer-bg-color, #fef2f2); border:1px solid var(--brand-timer-border-color, #fca5a5); border-radius:var(--brand-timer-border-radius, 12px); text-align:center; font-weight:var(--brand-timer-font-weight, 700); color:var(--brand-timer-text-color, #dc2626); font-family:monospace; font-size:var(--brand-timer-font-size, 24px); margin:0 0 16px 0; letter-spacing:2px; }"),n.push(".funnel-audio-wrap { padding:14px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:var(--brand-field-border-radius, 8px); margin:0 0 16px 0; }"),n.push(".funnel-icon-box { padding:20px; text-align:center; background:#ffffff; border:1px solid #f3f4f6; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.05); margin:0 0 16px 0; }"),n.push(".funnel-icon-box h3 { margin:0 0 8px 0; font-size:16px; color:var(--brand-body-color, #111827); }"),n.push(".funnel-icon-box p { margin:0; color:#6b7280; font-size:14px; }"),n.push(".funnel-progress-wrap { margin:0 0 16px 0; }"),n.push(".funnel-progress-bar { width:100%; height:14px; background:#e5e7eb; border-radius:9999px; overflow:hidden; }"),n.push(".funnel-social-wrap { display:flex; gap:8px; justify-content:center; margin:0 0 16px 0; }"),n.push(".funnel-social-wrap a { padding:8px 14px; color:#ffffff; border-radius:6px; text-decoration:none; font-size:12px; font-weight:700; display:inline-flex; align-items:center; }"),n.push(".funnel-social-fb { background:#1877F2; }"),n.push(".funnel-social-tw { background:#000000; }"),n.push(".funnel-social-wa { background:#25D366; }"),n.push(".funnel-star-rating { text-align:center; margin:0 0 16px 0; }"),n.push(".funnel-custom-code { margin:0 0 16px 0; }"),n.push(".funnel-rich-text { margin:0 0 16px 0; }"),n.push(".funnel-order-bump { border:2px dashed #f87171; background:#fef2f2; padding:16px; border-radius:12px; margin:0 0 16px 0; }"),n.push(".funnel-order-bump .bump-badge { background:#dc2626; color:#ffffff; font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px; text-transform:uppercase; }"),n.push(".funnel-order-bump .bump-price { font-weight:800; color:#991b1b; font-size:14px; }"),n.push(".funnel-order-bump label { display:flex; gap:10px; cursor:pointer; align-items:flex-start; }"),n.push('.funnel-order-bump input[type="checkbox"] { margin-top:3px; width:18px; height:18px; }'),n.push(".funnel-faq-accordion { margin:0 0 16px 0; }"),n.push(".funnel-faq-accordion .faq-item { border:1px solid #e5e7eb; border-radius:8px; margin-bottom:8px; overflow:hidden; background:#ffffff; }"),n.push(".funnel-faq-accordion .faq-toggle { width:100%; padding:14px 16px; text-align:left; background:none; border:none; font-weight:700; font-size:14px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; color:var(--brand-body-color, #111827); }"),n.push(".funnel-faq-accordion .faq-answer { display:none; padding:0 16px 14px 16px; font-size:13px; color:#4b5563; line-height:1.6; border-top:1px solid #f3f4f6; }"),n.push(".funnel-testimonial-slider { position:relative; margin:0 0 24px 0; }"),n.push(".funnel-testimonial-slider .testimonial-card { padding:28px 24px; background:#ffffff; border:1px solid #e5e7eb; border-radius:16px; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.05); transition:all 0.3s ease; }"),n.push(".funnel-testimonial-slider .slider-prev, .funnel-testimonial-slider .slider-next { position:absolute; top:45%; transform:translateY(-50%); width:32px; height:32px; border-radius:50%; background:#ffffff; border:1px solid #e5e7eb; box-shadow:0 2px 8px rgba(0,0,0,0.1); cursor:pointer; display:flex; align-items:center; justify-content:center; font-weight:700; z-index:2; color:#374151; }"),n.push(".funnel-testimonial-slider .slider-prev { left:-14px; }"),n.push(".funnel-testimonial-slider .slider-next { right:-14px; }"),n.push(".funnel-testimonial-slider .slider-dots { display:flex; justify-content:center; gap:6px; margin-top:12px; }"),n.push(".funnel-testimonial-slider .slider-dot { height:8px; border-radius:9999px; border:none; padding:0; cursor:pointer; transition:all 0.3s; }"),n.push("img { max-width:100%; height:auto; }"),i.push(".funnel-row { grid-template-columns:1fr !important; }"),(s||[]).forEach(g=>S(g,n,o,i));const b=(s||[]).map(g=>c(g)).join(`
`),f=(r==null?void 0:r.tabletBreakpoint)||1024,p=(r==null?void 0:r.mobileBreakpoint)||768,u=p+1,h=n.join(`
`)+(o.length>0?`
@media (max-width: ${f}px) and (min-width: ${u}px) {
${o.join(`
`)}
}`:"")+(i.length>0?`
@media (max-width: ${p}px) {
${i.join(`
`)}
}`:""),m=(e==null?void 0:e.metaTitle)||a,v=e!=null&&e.metaDescription?`<meta name="description" content="${e.metaDescription}">`:"",x=e!=null&&e.ogImage?`<meta property="og:image" content="${e.ogImage}">`:"",y=(t==null?void 0:t.headerCode)||"",w=(t==null?void 0:t.footerCode)||"";return`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${m}</title>
${v}
${x}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,600;0,700&family=Montserrat:wght@400;600;700&family=Outfit:wght@400;600;800&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
<style>
${h}
</style>
${y}
</head>
<body>
<main class="funnel-container">
${b}
</main>
${w}
<script>
// Bug 8 Fix: Live countdown script for timer elements
(function(){
  document.querySelectorAll('.funnel-timer').forEach(function(el){
    var days = parseInt(el.getAttribute('data-days')||'0', 10);
    var hrs = parseInt(el.getAttribute('data-hours')||'2', 10);
    var mins = parseInt(el.getAttribute('data-minutes')||'15', 10);
    var secs = parseInt(el.getAttribute('data-seconds')||'0', 10);
    var action = el.getAttribute('data-action')||'show_message';
    var redirect = el.getAttribute('data-redirect')||'#';
    var message = el.getAttribute('data-message')||'OFFER EXPIRED!';
    var totalSecs = (days * 86400) + (hrs * 3600) + (mins * 60) + secs;
    var disp = el.querySelector('.timer-display') || el;
    function updateTimer(){
      if(totalSecs <= 0){
        if(action === 'hide') { el.style.display = 'none'; }
        else if(action === 'redirect' && redirect !== '#') { window.location.href = redirect; }
        else { disp.textContent = message; }
        return;
      }
      totalSecs--;
      var d = Math.floor(totalSecs / 86400);
      var h = Math.floor((totalSecs % 86400) / 3600);
      var m = Math.floor((totalSecs % 3600) / 60);
      var s = totalSecs % 60;
      var str = (d > 0 ? String(d).padStart(2,'0') + 'd : ' : '') + String(h).padStart(2,'0') + ' : ' + String(m).padStart(2,'0') + ' : ' + String(s).padStart(2,'0');
      disp.textContent = str;
    }
    setInterval(updateTimer, 1000);
  });
  // Live FAQ Accordion toggle script
  document.querySelectorAll('.funnel-faq-accordion .faq-toggle').forEach(function(btn){
    btn.addEventListener('click', function(){
      var ans = this.nextElementSibling;
      var icon = this.querySelector('.faq-icon');
      var isOpen = ans.style.display === 'block';
      ans.style.display = isOpen ? 'none' : 'block';
      if(icon) icon.textContent = isOpen ? '▼' : '▲';
    });
  });
  // Live Testimonial Slider script
  document.querySelectorAll('.funnel-testimonial-slider').forEach(function(slider){
    var slides = slider.querySelectorAll('.testimonial-card');
    var dots = slider.querySelectorAll('.slider-dot');
    var prevBtn = slider.querySelector('.slider-prev');
    var nextBtn = slider.querySelector('.slider-next');
    if (!slides.length) return;
    var current = 0;
    function showSlide(idx){
      current = (idx + slides.length) % slides.length;
      slides.forEach(function(s, i){ s.style.display = (i === current) ? 'block' : 'none'; });
      dots.forEach(function(d, i){
        d.style.background = (i === current) ? 'var(--color-primary, #467235)' : '#e5e7eb';
        d.style.width = (i === current) ? '20px' : '8px';
      });
    }
    if (prevBtn) prevBtn.addEventListener('click', function(e){ e.preventDefault(); showSlide(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function(e){ e.preventDefault(); showSlide(current + 1); });
    dots.forEach(function(d, i){ d.addEventListener('click', function(e){ e.preventDefault(); showSlide(i); }); });
    showSlide(0);
    if (slides.length > 1) {
      setInterval(function(){ showSlide(current + 1); }, 5000);
    }
  });
})();
<\/script>
</body>
</html>`};function F({showCodeModal:s,setShowCodeModal:r,sections:e,styleGuide:t,funnelName:a}){const[n,o]=$.useState(!1);if(!s)return null;const i=_(e,t,{},{},a),l=()=>{navigator.clipboard.writeText(i),o(!0),setTimeout(()=>o(!1),2e3)};return d.jsx("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4",children:d.jsxs("div",{className:"bg-white rounded-2xl p-6 w-full max-w-3xl shadow-2xl border border-neutral-100 animate-in fade-in zoom-in duration-150 flex flex-col max-h-[85vh]",children:[d.jsxs("div",{className:"flex items-center justify-between pb-4 border-b border-neutral-100 shrink-0",children:[d.jsxs("div",{className:"flex items-center gap-3",children:[d.jsx("div",{className:"h-10 w-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600",children:d.jsx(z,{className:"h-5 w-5"})}),d.jsxs("div",{children:[d.jsx("h3",{className:"font-bold text-sm text-neutral-900",children:"Export Page HTML & CSS"}),d.jsx("p",{className:"text-xs text-neutral-500",children:"Standalone production HTML bundle with embedded brand tokens"})]})]}),d.jsxs("button",{type:"button",onClick:l,className:"px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md",children:[n?d.jsx(C,{className:"h-4 w-4"}):d.jsx(E,{className:"h-4 w-4"}),n?"Copied HTML!":"Copy Code"]})]}),d.jsx("div",{className:"mt-4 flex-1 overflow-auto bg-neutral-900 rounded-xl p-4 font-mono text-xs text-neutral-200 leading-relaxed border border-neutral-800",children:d.jsx("pre",{className:"whitespace-pre-wrap break-all",children:i})}),d.jsx("div",{className:"flex items-center justify-end pt-4 shrink-0",children:d.jsx("button",{type:"button",onClick:()=>r(!1),className:"px-4 py-1.5 rounded-lg border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition",children:"Close"})})]})})}export{F as default};
