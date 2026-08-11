const T=l=>{if(l.type==="section"){const{id:t,...i}=l;return{...i,id:"sec_"+Date.now()+"_"+Math.random().toString(36).substr(2,6),elements:l.elements||[],columns:l.columns||[[],[],[],[]]}}if(["col_1","col_2","col_3","col_4","col_sidebar"].includes(l.type)){const{id:t,...i}=l,c={...i,id:"row_"+Date.now()+"_"+Math.random().toString(36).substr(2,6),columns:l.columns||[[],[],[],[]],elements:[]};return{id:"sec_"+Date.now()+"_"+Math.random().toString(36).substr(2,6),type:"section",name:"Layout Section",title:"Page Section",bgColor:"#ffffff",elements:[c],columns:[[],[],[],[]]}}const n=JSON.parse(JSON.stringify(l));delete n.id;const a={...n,id:"el_"+Date.now()+"_"+Math.random().toString(36).substr(2,6),elements:n.elements||[],columns:n.columns||[[],[],[],[]]};if(["flex_container","grid_container"].includes(l.type))return{id:"sec_"+Date.now()+"_"+Math.random().toString(36).substr(2,6),type:"section",name:"Layout Section",title:"Page Section",containerWidth:"1200",paddingY:48,paddingX:24,elements:[a],columns:[[],[],[],[]],mobile:{paddingY:32,paddingX:16}};const r={id:"row_"+Date.now()+"_"+Math.random().toString(36).substr(2,6),type:"col_1",name:"1 Column (Full Width)",colsCount:1,columns:[[a],[],[],[]],elements:[]};return{id:"sec_"+Date.now()+"_"+Math.random().toString(36).substr(2,6),type:"section",name:"Layout Section",title:"Page Section",containerWidth:"1200",paddingY:48,paddingX:24,elements:[r],columns:[[],[],[],[]],mobile:{paddingY:32,paddingX:16}}},w=(l,n,a,r)=>l.map(t=>{if(t.id===n){if(a!==null){const d=[...t.columns||[[],[],[],[]]];return d[a]=[...d[a]||[],r],{...t,columns:d}}else if(t.type==="section"||t.type==="flex_container"){const d=[...t.elements||[],r];return{...t,elements:d}}else if(["grid_container","col_1","col_2","col_3","col_4","col_sidebar"].includes(t.type)){const d=[...t.columns||[[],[],[],[]]],o=0;return d[o]=[...d[o]||[],r],{...t,columns:d}}else if(t.elements!==void 0){const d=[...t.elements||[],r];return{...t,elements:d}}}let i={...t},c=!1;if(t.elements&&t.elements.length>0){const d=t.elements.findIndex(e=>e.id===n);if(d!==-1){const e=[...t.elements];return e.splice(d+1,0,r),{...t,elements:e}}const o=w(t.elements,n,a,r);o!==t.elements&&(i.elements=o,c=!0)}if(t.columns&&t.columns.length>0){const d=t.columns.map(o=>{if(!o)return o;const e=o.findIndex(f=>f.id===n);if(e!==-1){const f=[...o];return f.splice(e+1,0,r),f}return w(o,n,a,r)});i.columns=d,c=!0}return c?i:t}),B=(l,n,a,r)=>l.map(t=>{if(t.id===n){if(a!==null){const d=[...t.columns||[[],[],[],[]]];return d[a]=[...d[a]||[],r],{...t,columns:d}}else if(t.type==="section"||t.type==="flex_container"){const d=[...t.elements||[],r];return{...t,elements:d}}else if(["grid_container","col_1","col_2","col_3","col_4","col_sidebar"].includes(t.type)){const d=[...t.columns||[[],[],[],[]]],o=0;return d[o]=[...d[o]||[],r],{...t,columns:d}}else if(t.elements!==void 0){const d=[...t.elements||[],r];return{...t,elements:d}}}let i={...t},c=!1;if(t.elements&&t.elements.length>0){const d=t.elements.findIndex(e=>e.id===n);if(d!==-1){const e=[...t.elements];return e.splice(d+1,0,r),{...t,elements:e}}const o=B(t.elements,n,a,r);o!==t.elements&&(i.elements=o,c=!0)}if(t.columns&&t.columns.length>0){const d=t.columns.map(o=>{if(!o)return o;const e=o.findIndex(f=>f.id===n);if(e!==-1){const f=[...o];return f.splice(e+1,0,r),f}return B(o,n,a,r)});i.columns=d,c=!0}return c?i:t}),P=(l,n)=>l.filter(a=>a.id!==n).map(a=>{let r={...a};return a.elements&&a.elements.length>0&&(r.elements=P(a.elements,n)),a.columns&&a.columns.length>0&&(r.columns=a.columns.map(t=>t&&P(t,n))),r}),_=(l,n,a)=>l.map(r=>{if(r.id===n)return a(r);let t={...r},i=!1;if(r.elements&&r.elements.length>0){const c=_(r.elements,n,a);c!==r.elements&&(t.elements=c,i=!0)}if(r.columns&&r.columns.length>0){const c=r.columns.map(d=>d&&_(d,n,a));c!==r.columns&&(t.columns=c,i=!0)}return i?t:r}),U=l=>{if(!l)return l;const a=`${l.type==="section"?"sec":["col_1","col_2","col_3","col_4","col_sidebar","flex_container","grid_container"].includes(l.type)?"row":"el"}_${Date.now()}_${Math.random().toString(36).substr(2,7)}`,r={...l,id:a};return l.elements&&l.elements.length>0&&(r.elements=l.elements.map(t=>U(t))),l.columns&&l.columns.length>0&&(r.columns=l.columns.map(t=>Array.isArray(t)?t.map(i=>U(i)):t)),r},M=l=>{if(!l)return l;let n={...l};if(!n.isLocallyOverridden){const a=["fontSize","lineHeight","fontWeight","textColor","fontFamily","marginTop","marginRight","marginBottom","marginLeft","paddingTop","paddingRight","paddingBottom","paddingLeft","paddingY","paddingX"],r=["paddingY","paddingX","paddingTop","paddingRight","paddingBottom","paddingLeft","borderRadius","fontSize","fontFamily","bgColor","textColor","borderColor","marginBottom","marginTop","marginRight","marginLeft"],t=["bgColor","textColor","fontSize","fontWeight","fontFamily","borderRadius","paddingY","paddingX","paddingTop","paddingRight","paddingBottom","paddingLeft","marginBottom","marginTop","marginRight","marginLeft"],i=["containerWidth","gap","gapX","gapY","flexDirection","flexWrap","justifyContent","alignItems"],d={headline:a,subheadline:a,paragraph:a,bullets:a,quote:a,rich_text:a,icon_box:a,star_rating:a,custom_code:a,order_bump:r,faq_accordion:r,testimonial_slider:r,timer:r,progress_bar:r,social:r,audio:r,input_email:r,input_name:r,input_phone:r,submit_button:t,section:i,flex_container:i,grid_container:i,col_1:i,col_2:i,col_3:i,col_4:i,col_sidebar:i}[n.type];d&&d.forEach(o=>delete n[o])}return n},L=l=>{const n=l||{},a=n.systemColors||{},r=(n.customColors||[]).map(g=>`--color-${g.id}: ${g.value||"#3B82F6"};`).join(`
`),t=["h1","h2","h3","h4","h5","h6"].map(g=>{const $=n[`${g}Typography`]||{},y=n[`${g}Color`]||n.headingColor||"#111827",s=g==="h1"||g==="h2"||g==="h3"?12:g==="h4"?10:8,p=n[`${g}MarginUnit`]||n.headingMarginBottomUnit||"px",u=n[`${g}PaddingUnit`]||"px";return`--brand-${g}-font-family: ${$.family||n.headingFontName||n.defaultFont||"'Inter', sans-serif"};
        --brand-${g}-font-size: ${$.size||(g==="h1"?32:g==="h2"?24:g==="h3"?20:18)}px;
        --brand-${g}-font-weight: ${$.weight||"700"};
        --brand-${g}-line-height: ${$.lineHeight||36}px;
        --brand-${g}-color: ${y};
        --brand-${g}-text-transform: ${$.transform==="Default"?"none":$.transform||"none"};
        --brand-${g}-font-style: ${$.style==="Default"?"normal":$.style||"normal"};
        --brand-${g}-text-decoration: ${$.decoration==="Default"?"none":$.decoration||"none"};
        --brand-${g}-margin-top: ${n[`${g}MarginTop`]??0}${p};
        --brand-${g}-margin-right: ${n[`${g}MarginRight`]??0}${p};
        --brand-${g}-margin-bottom: ${n[`${g}MarginBottom`]??n.headingMarginBottom??s}${p};
        --brand-${g}-margin-left: ${n[`${g}MarginLeft`]??0}${p};
        --brand-${g}-padding-top: ${n[`${g}PaddingTop`]??0}${u};
        --brand-${g}-padding-right: ${n[`${g}PaddingRight`]??0}${u};
        --brand-${g}-padding-bottom: ${n[`${g}PaddingBottom`]??0}${u};
        --brand-${g}-padding-left: ${n[`${g}PaddingLeft`]??0}${u};`}).join(`
`),i=n.bodyTypography||{},c=n.btnTypography||{},d=n.fieldTypography||{},o=n.fieldBorder||{},e=n.quotePaddingTop??16,f=n.quotePaddingRight??20,m=n.quotePaddingBottom??16,b=n.quotePaddingLeft??20;return`
        --color-primary: ${a.primary||"#6EC1E4"};
        --color-secondary: ${a.secondary||"#54595F"};
        --color-text: ${a.text||"#7A7A7A"};
        --color-accent: ${a.accent||"#61CE70"};
        ${r}
        ${t}
        --brand-body-font-family: ${i.family||n.defaultFont||"'Inter', sans-serif"};
        --brand-body-font-size: ${i.size||n.fontSize||16}px;
        --brand-body-font-weight: ${i.weight||"400"};
        --brand-body-line-height: ${i.lineHeight||n.lineHeight||24}px;
        --brand-body-color: ${n.textColor||"#1f2937"};
        --brand-body-margin-top: ${n.bodyMarginTop??0}${n.bodyMarginUnit||"px"};
        --brand-body-margin-right: ${n.bodyMarginRight??0}${n.bodyMarginUnit||"px"};
        --brand-body-margin-bottom: ${n.bodyMarginBottom??n.paragraphMarginBottom??16}${n.bodyMarginUnit||n.paragraphMarginBottomUnit||"px"};
        --brand-body-margin-left: ${n.bodyMarginLeft??0}${n.bodyMarginUnit||"px"};
        --brand-body-padding-top: ${n.bodyPaddingTop??0}${n.bodyPaddingUnit||"px"};
        --brand-body-padding-right: ${n.bodyPaddingRight??0}${n.bodyPaddingUnit||"px"};
        --brand-body-padding-bottom: ${n.bodyPaddingBottom??0}${n.bodyPaddingUnit||"px"};
        --brand-body-padding-left: ${n.bodyPaddingLeft??0}${n.bodyPaddingUnit||"px"};

        --brand-btn-font-family: ${c.family||n.defaultFont||"'Inter', sans-serif"};
        --brand-btn-font-size: ${c.size||16}px;
        --brand-btn-font-weight: ${c.weight||"700"};
        --brand-btn-bg-color: ${n.btnBgColor||n.linkColor||"#c87a57"};
        --brand-btn-text-color: ${n.btnTextColor||"#ffffff"};
        --brand-btn-border-radius: ${n.btnRadiusTop??12}px;
        --brand-btn-hover-bg-color: ${n.btnHoverBgColor||"#b36443"};
        --brand-btn-hover-text-color: ${n.btnHoverTextColor||"#ffffff"};
        --brand-btn-margin-top: ${n.btnMarginTop??0}${n.btnMarginUnit||"px"};
        --brand-btn-margin-right: ${n.btnMarginRight??0}${n.btnMarginUnit||"px"};
        --brand-btn-margin-bottom: ${n.btnMarginBottom??16}${n.btnMarginUnit||"px"};
        --brand-btn-margin-left: ${n.btnMarginLeft??0}${n.btnMarginUnit||"px"};
        --brand-btn-padding-top: ${n.btnPaddingTop??14}${n.btnPaddingUnit||"px"};
        --brand-btn-padding-right: ${n.btnPaddingRight??28}${n.btnPaddingUnit||"px"};
        --brand-btn-padding-bottom: ${n.btnPaddingBottom??14}${n.btnPaddingUnit||"px"};
        --brand-btn-padding-left: ${n.btnPaddingLeft??28}${n.btnPaddingUnit||"px"};

        --brand-field-font-family: ${d.family||n.defaultFont||"'Inter', sans-serif"};
        --brand-field-font-size: ${d.size||14}px;
        --brand-field-bg-color: ${n.fieldBgColor||"#ffffff"};
        --brand-field-text-color: ${n.fieldTextColor||"#111827"};
        --brand-field-border-color: ${o.color||"#d1d5db"};
        --brand-field-border-radius: ${n.fieldRadiusTop??8}px;
        --brand-field-margin-top: ${n.fieldMarginTop??0}${n.fieldMarginUnit||"px"};
        --brand-field-margin-right: ${n.fieldMarginRight??0}${n.fieldMarginUnit||"px"};
        --brand-field-margin-bottom: ${n.fieldMarginBottom??12}${n.fieldMarginUnit||"px"};
        --brand-field-margin-left: ${n.fieldMarginLeft??0}${n.fieldMarginUnit||"px"};
        --brand-field-padding-top: ${n.fieldPaddingTop??12}${n.fieldPaddingUnit||"px"};
        --brand-field-padding-right: ${n.fieldPaddingRight??16}${n.fieldPaddingUnit||"px"};
        --brand-field-padding-bottom: ${n.fieldPaddingBottom??12}${n.fieldPaddingUnit||"px"};
        --brand-field-padding-left: ${n.fieldPaddingLeft??16}${n.fieldPaddingUnit||"px"};

        --brand-container-width: ${n.containerWidth==="100%"||String(n.containerWidth).endsWith("%")?"100%":`${n.containerWidth??1200}${n.containerWidthUnit||"px"}`};
        --brand-container-margin-top: ${n.containerMarginTop??0}${n.containerMarginUnit||"px"};
        --brand-container-margin-right: ${n.containerMarginRight??"auto"};
        --brand-container-margin-bottom: ${n.containerMarginBottom??0}${n.containerMarginUnit||"px"};
        --brand-container-margin-left: ${n.containerMarginLeft??"auto"};
        --brand-container-padding-top: ${n.containerPaddingTop??48}${n.containerPaddingUnit||"px"};
        --brand-container-padding-right: ${n.containerPaddingRight??24}${n.containerPaddingUnit||"px"};
        --brand-container-padding-bottom: ${n.containerPaddingBottom??48}${n.containerPaddingUnit||"px"};
        --brand-container-padding-left: ${n.containerPaddingLeft??24}${n.containerPaddingUnit||"px"};

        --brand-element-gap-x: ${n.elementGapX??24}${n.elementGapUnit||"px"};
        --brand-element-gap-y: ${n.elementGapY??24}${n.elementGapUnit||"px"};

        --brand-quote-padding-top: ${e}${n.quotePaddingUnit||"px"};
        --brand-quote-padding-right: ${f}${n.quotePaddingUnit||"px"};
        --brand-quote-padding-bottom: ${m}${n.quotePaddingUnit||"px"};
        --brand-quote-padding-left: ${b}${n.quotePaddingUnit||"px"};
        --brand-quote-border-width: ${n.quoteBorderWidth??4}px;
        --brand-quote-border-color: ${n.quoteBorderColor||n.linkColor||"#6EC1E4"};
        --brand-quote-bg-color: ${n.quoteBgColor||"rgba(99,102,241,0.06)"};
        --brand-quote-text-color: ${n.quoteTextColor||n.textColor||"#1f2937"};
        --brand-quote-border-radius: ${n.quoteBorderRadius||"0 8px 8px 0"};
        --brand-quote-font-style: ${n.quoteFontStyle||"italic"};
        --brand-quote-font-weight: ${n.quoteFontWeight||"400"};
        --brand-quote-cite-weight: ${n.quoteCiteWeight||"700"};
        --brand-quote-cite-style: ${n.quoteCiteStyle||"normal"};

        --brand-bullet-gap: ${n.bulletGap??8}px;
        --brand-bullet-icon-color: ${n.bulletIconColor||n.linkColor||"#16a34a"};

        --brand-img-border-radius: ${n.imgBorderRadius??8}px;
        --brand-img-shadow: ${n.imgShadow||"0 4px 12px rgba(0,0,0,0.1)"};

        --brand-video-border-radius: ${n.videoBorderRadius??12}px;
        --brand-video-shadow: ${n.videoShadow||"0 10px 25px rgba(0,0,0,0.2)"};

        --brand-divider-width: ${n.dividerWidth??1}px;
        --brand-divider-style: ${n.dividerStyle||"solid"};
        --brand-divider-color: ${n.dividerColor||"#e5e7eb"};
        --brand-divider-margin-top: ${n.dividerMarginTop??24}px;
        --brand-divider-margin-bottom: ${n.dividerMarginBottom??24}px;

        --brand-spacer-height: ${n.spacerHeight??40}px;

        --brand-timer-padding: ${n.timerPadding??16}px;
        --brand-timer-border-radius: ${n.timerBorderRadius??12}px;
        --brand-timer-font-size: ${n.timerFontSize??24}px;
        --brand-timer-font-weight: ${n.timerFontWeight??700};
        --brand-timer-bg-color: ${n.timerBgColor||"#fef2f2"};
        --brand-timer-border-color: ${n.timerBorderColor||"#fca5a5"};
        --brand-timer-text-color: ${n.timerTextColor||"#dc2626"};

        --brand-col-padding-top: ${n.colPaddingTop??0}${n.colPaddingUnit||"px"};
        --brand-col-padding-right: ${n.colPaddingRight??0}${n.colPaddingUnit||"px"};
        --brand-col-padding-bottom: ${n.colPaddingBottom??0}${n.colPaddingUnit||"px"};
        --brand-col-padding-left: ${n.colPaddingLeft??0}${n.colPaddingUnit||"px"};
        --brand-col-margin-top: ${n.colMarginTop??0}${n.colMarginUnit||"px"};
        --brand-col-margin-right: ${n.colMarginRight??0}${n.colMarginUnit||"px"};
        --brand-col-margin-bottom: ${n.colMarginBottom??0}${n.colMarginUnit||"px"};
        --brand-col-margin-left: ${n.colMarginLeft??0}${n.colMarginUnit||"px"};
    `},q=(l,n,a,r)=>{if(!l||!l.id)return;const t=M(l),i=`el-${t.id.replace(/[^a-zA-Z0-9-_]/g,"-")}`,c=o=>{if(!o)return[];const e=[];if(o.containerWidth){const s=o.containerWidthUnit||"px",p=o.containerWidth,u=p==="100%"||String(p).endsWith("%")?"100%":`${p}${s}`;e.push(`max-width:${u}`),e.push("margin-left:auto"),e.push("margin-right:auto")}const f=(s,p="px")=>o[`${s}Unit`]||p,m=f("padding","px"),b=f("margin","px");if(o.paddingTop!==void 0||o.paddingRight!==void 0||o.paddingBottom!==void 0||o.paddingLeft!==void 0||o.paddingY!==void 0||o.paddingX!==void 0){const s=o.paddingTop!==void 0?`${o.paddingTop}${f("paddingTop",m)}`:o.paddingY!==void 0?`${o.paddingY}${m}`:"0px",p=o.paddingRight!==void 0?`${o.paddingRight}${f("paddingRight",m)}`:o.paddingX!==void 0?`${o.paddingX}${m}`:"0px",u=o.paddingBottom!==void 0?`${o.paddingBottom}${f("paddingBottom",m)}`:o.paddingY!==void 0?`${o.paddingY}${m}`:"0px",h=o.paddingLeft!==void 0?`${o.paddingLeft}${f("paddingLeft",m)}`:o.paddingX!==void 0?`${o.paddingX}${m}`:"0px";e.push(`padding:${s} ${p} ${u} ${h}`)}if(o.marginTop!==void 0||o.marginRight!==void 0||o.marginBottom!==void 0||o.marginLeft!==void 0){const s=o.marginTop!==void 0?`${o.marginTop}${f("marginTop",b)}`:"0px",p=o.marginRight!==void 0?`${o.marginRight}${f("marginRight",b)}`:"0px",u=o.marginBottom!==void 0?`${o.marginBottom}${f("marginBottom",b)}`:"0px",h=o.marginLeft!==void 0?`${o.marginLeft}${f("marginLeft",b)}`:"0px";e.push(`margin:${s} ${p} ${u} ${h}`)}o.fontSize&&e.push(`font-size:${o.fontSize}${f("fontSize","px")}`),o.lineHeight&&e.push(`line-height:${o.lineHeight}${f("lineHeight","px")}`),o.fontFamily&&e.push(`font-family:${o.fontFamily}`),o.fontWeight&&e.push(`font-weight:${o.fontWeight}`),o.letterSpacing!==void 0&&e.push(`letter-spacing:${o.letterSpacing}${f("letterSpacing","px")}`),o.wordSpacing!==void 0&&e.push(`word-spacing:${o.wordSpacing}${f("wordSpacing","px")}`),o.textTransform&&e.push(`text-transform:${o.textTransform}`),o.fontStyle&&e.push(`font-style:${o.fontStyle}`),o.textDecoration&&e.push(`text-decoration:${o.textDecoration}`),o.textColor&&e.push(`color:${o.textColor}`);const y=o.bgType||"solid";if(y==="gradient"){const s=o.gradientType||"linear",p=o.gradientAngle!==void 0?o.gradientAngle:135,h=[...o.gradientStops||[{color:o.gradientColor1||"#6366f1",pos:0},{color:o.gradientColor2||"#ec4899",pos:100}]].sort((x,S)=>x.pos-S.pos).map(x=>`${x.color} ${x.pos}%`).join(", "),C=s==="radial"?`radial-gradient(circle, ${h})`:`linear-gradient(${p}deg, ${h})`;e.push(`background-image:${C}`)}else if(y==="image"){if(o.bgImage){const s=o.bgOverlay,p=s?`linear-gradient(${s}, ${s}), url(${o.bgImage})`:`url(${o.bgImage})`;e.push(`background-image:${p}`),e.push(`background-size:${o.bgSize||"cover"}`),e.push(`background-position:${o.bgPosition||"center center"}`),e.push(`background-repeat:${o.bgRepeat||"no-repeat"}`)}}else o.bgColor&&e.push(`background-color:${o.bgColor}`);if(o.alignment&&e.push(`text-align:${o.alignment}`),o.borderRadiusTL!==void 0||o.borderRadiusTR!==void 0||o.borderRadiusBL!==void 0||o.borderRadiusBR!==void 0){const s=o.borderRadiusTL!==void 0?o.borderRadiusTL:o.borderRadius||0,p=o.borderRadiusTR!==void 0?o.borderRadiusTR:o.borderRadius||0,u=o.borderRadiusBL!==void 0?o.borderRadiusBL:o.borderRadius||0,h=o.borderRadiusBR!==void 0?o.borderRadiusBR:o.borderRadius||0;e.push(`border-radius:${s}px ${p}px ${h}px ${u}px`)}else o.borderRadius!==void 0&&e.push(`border-radius:${o.borderRadius}px`);if(o.borderStyle&&o.borderStyle!=="none"){const s=o.borderWidth!==void 0?o.borderWidth:1,p=o.borderColor||"#d1d5db";e.push(`border:${s}px ${o.borderStyle} ${p}`)}else o.borderStyle==="none"&&e.push("border:none");if(o.shadowColor||o.shadowH!==void 0||o.shadowV!==void 0||o.shadowBlur!==void 0){const s=o.shadowPosition==="inset"?"inset ":"",p=o.shadowColor||"rgba(0,0,0,0.1)",u=o.shadowH!==void 0?o.shadowH:0,h=o.shadowV!==void 0?o.shadowV:4,C=o.shadowBlur!==void 0?o.shadowBlur:8,x=o.shadowSpread!==void 0?o.shadowSpread:0;e.push(`box-shadow:${s}${u}px ${h}px ${C}px ${x}px ${p}`)}else o.shadow&&(o.shadow==="none"&&e.push("box-shadow:none"),o.shadow==="sm"&&e.push("box-shadow:0 1px 3px rgba(0,0,0,0.1)"),o.shadow==="md"&&e.push("box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)"),o.shadow==="lg"&&e.push("box-shadow:0 10px 15px -3px rgba(0,0,0,0.1)"),o.shadow==="glow"&&e.push("box-shadow:0 0 15px rgba(200,122,87,0.5)"));if(o.width!==void 0&&e.push(`width:${o.width}${o.widthUnit||"%"}`),o.minHeight!==void 0&&o.minHeight!==""&&e.push(`min-height:${o.minHeight}${o.minHeightUnit||"px"}`),o.layoutMode==="grid"){if(e.push("display:grid"),o.gridColumns!==void 0){const s=o.gridColumnsUnit||"1fr",p=s==="fr"?"1fr":s,u=typeof o.gridColumns=="number"?`repeat(${o.gridColumns}, ${p})`:o.gridColumns;e.push(`grid-template-columns:${u}`)}else{const s=o.gridPreset==="custom"?o.gridTemplateColumns||"repeat(2, 1fr)":o.gridPreset||"repeat(2, 1fr)";e.push(`grid-template-columns:${s}`)}if(o.gridRows!==void 0){const s=o.gridRowsUnit||"1fr",p=s==="fr"?"1fr":s,u=typeof o.gridRows=="number"?`repeat(${o.gridRows}, ${p})`:o.gridRows;e.push(`grid-template-rows:${u}`)}o.justifyItems&&e.push(`justify-items:${o.justifyItems}`),o.alignItems&&e.push(`align-items:${o.alignItems}`),o.gridAutoFlow&&e.push(`grid-auto-flow:${o.gridAutoFlow}`)}else o.layoutMode==="flex"?(e.push("display:flex"),o.flexDirection&&e.push(`flex-direction:${o.flexDirection}`),o.flexWrap&&e.push(`flex-wrap:${o.flexWrap}`),o.justifyContent&&e.push(`justify-content:${o.justifyContent}`),o.alignItems&&e.push(`align-items:${o.alignItems}`),o.gap!==void 0&&e.push(`gap:${o.gap}px`)):o.layoutMode==="block"&&e.push("display:block");return e},d=c(t);if(d.length>0&&n.push(`#${i} { ${d.join("; ")}; }`),t.type==="faq_accordion"&&(t.itemBorderColor&&n.push(`#${i} .faq-item { border-color: ${t.itemBorderColor}; }`),t.qColor&&n.push(`#${i} .faq-toggle { color: ${t.qColor}; }`),t.qBgColor&&n.push(`#${i} .faq-toggle { background: ${t.qBgColor}; }`),t.qFontSize&&n.push(`#${i} .faq-toggle { font-size: ${t.qFontSize}px; }`),t.qFontWeight&&n.push(`#${i} .faq-toggle { font-weight: ${t.qFontWeight}; }`),t.aColor&&n.push(`#${i} .faq-answer { color: ${t.aColor}; }`),t.aBgColor&&n.push(`#${i} .faq-answer { background: ${t.aBgColor}; }`),t.aFontSize&&n.push(`#${i} .faq-answer { font-size: ${t.aFontSize}px; }`),t.aLineHeight&&n.push(`#${i} .faq-answer { line-height: ${t.aLineHeight}; }`),t.iconColor&&n.push(`#${i} .faq-icon { color: ${t.iconColor}; }`)),t.type==="testimonial_slider"&&(t.cardBgColor&&n.push(`#${i} .testimonial-card { background: ${t.cardBgColor}; }`),t.cardBorderColor&&n.push(`#${i} .testimonial-card { border-color: ${t.cardBorderColor}; }`),t.quoteColor&&n.push(`#${i} blockquote { color: ${t.quoteColor}; }`),t.quoteFontSize&&n.push(`#${i} blockquote { font-size: ${t.quoteFontSize}px; }`),t.authorColor&&n.push(`#${i} p { color: ${t.authorColor}; }`),t.authorFontSize&&n.push(`#${i} p { font-size: ${t.authorFontSize}px; }`),t.arrowBgColor&&n.push(`#${i} .slider-prev, #${i} .slider-next { background: ${t.arrowBgColor}; }`)),t.type==="order_bump"&&(t.boxBgColor&&n.push(`#${i}.funnel-order-bump { background: ${t.boxBgColor}; }`),t.boxBorderColor&&n.push(`#${i}.funnel-order-bump { border-color: ${t.boxBorderColor}; }`),t.badgeBgColor&&n.push(`#${i} .bump-badge { background: ${t.badgeBgColor}; }`),t.badgeTextColor&&n.push(`#${i} .bump-badge { color: ${t.badgeTextColor}; }`),t.titleColor&&n.push(`#${i} h4 { color: ${t.titleColor}; }`),t.priceColor&&n.push(`#${i} .bump-price { color: ${t.priceColor}; }`)),t.type==="icon_box"&&(t.boxBgColor&&n.push(`#${i}.funnel-icon-box { background: ${t.boxBgColor}; }`),t.boxBorderColor&&n.push(`#${i}.funnel-icon-box { border-color: ${t.boxBorderColor}; }`),t.titleColor&&n.push(`#${i} h3 { color: ${t.titleColor}; }`),t.descColor&&n.push(`#${i} p { color: ${t.descColor}; }`)),t.tablet){const o=c(t.tablet);o.length>0&&a.push(`#${i} { ${o.join("; ")}; }`)}if(t.mobile){const o=c(t.mobile);o.length>0&&r.push(`#${i} { ${o.join("; ")}; }`)}t.elements&&t.elements.length>0&&t.elements.forEach(o=>q(o,n,a,r)),t.columns&&t.columns.length>0&&t.columns.forEach(o=>{o&&o.length>0&&o.forEach(e=>q(e,n,a,r))})};export{w as a,L as b,U as c,P as d,q as e,B as i,M as s,_ as u,T as w};
