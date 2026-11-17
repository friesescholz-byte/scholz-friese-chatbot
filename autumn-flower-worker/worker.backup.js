var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
var MODEL_ID = "@cf/meta/llama-3.1-8b-instruct-fast";
function safeJsonParse(s, fallback = {}) {
  try {
    return JSON.parse(s || "{}");
  } catch {
    return fallback;
  }
}
__name(safeJsonParse, "safeJsonParse");
function nowTs() {
  return Date.now();
}
__name(nowTs, "nowTs");
var ANALYTICS_SCRIPT_PATH = "/track.js";
var ANALYTICS_COLLECT_PATH = "/collect";
var ANALYTICS_STATS_PATH = "/stats";
var SID_COOKIE = "chat_sid";
var SID_MAX_AGE = 60 * 60 * 24 * 14;
var HISTORY_MAX = 40;
var RESEND_ENDPOINT = "https://api.resend.com/emails";
var TENANT_PROFILE_PREFIX = "tenant_profile:";
var DEFAULT_AVATAR_URL = "/default-avatar";
var DEFAULT_AVATAR_R2_KEY = "Chatbot_profil.png";
var LOGO_KV_PREFIX = "logo:";
var AVATAR_KV_PREFIX = "avatar:";
function isoDay(ts = Date.now()) {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
__name(isoDay, "isoDay");
function isoMonth(ts = Date.now()) {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
__name(isoMonth, "isoMonth");
function getRefDomain(ref) {
  try {
    return ref ? new URL(ref).hostname.replace(/^www\./, "") : "";
  } catch {
    return "";
  }
}
__name(getRefDomain, "getRefDomain");
function detectDevice(ua = "") {
  const s = ua.toLowerCase();
  if (/ipad|tablet/.test(s)) return "tablet";
  if (/mobi|android|iphone|ipod/.test(s)) return "mobile";
  return "desktop";
}
__name(detectDevice, "detectDevice");
function detectBrowser(ua = "") {
  const s = ua.toLowerCase();
  if (s.includes("edg/")) return "edge";
  if (s.includes("chrome/") && !s.includes("edg/")) return "chrome";
  if (s.includes("safari/") && !s.includes("chrome/")) return "safari";
  if (s.includes("firefox/")) return "firefox";
  return "other";
}
__name(detectBrowser, "detectBrowser");
function detectOS(ua = "") {
  const s = ua.toLowerCase();
  if (s.includes("windows")) return "windows";
  if (s.includes("mac os x") || s.includes("macintosh")) return "mac";
  if (s.includes("android")) return "android";
  if (s.includes("iphone") || s.includes("ipad") || s.includes("ios")) return "ios";
  if (s.includes("linux")) return "linux";
  return "other";
}
__name(detectOS, "detectOS");
function getGeo(request) {
  const cf = request.cf || {};
  return {
    country: (cf.country || "").toString(),
    region: (cf.region || cf.regionCode || "").toString()
  };
}
__name(getGeo, "getGeo");
function getKV(env) {
  return env.CHAT_KV || env.KB || env.TENANT_KV;
}
__name(getKV, "getKV");
function cors(request) {
  const origin = request.headers.get("Origin") || "";
  const base = {
    "Access-Control-Allow-Headers": "Content-Type, X-Chat-Sid, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    // <-- DELETE hinzugefügt!
    "Vary": "Origin"
  };
  if (!origin) return { ...base, "Access-Control-Allow-Origin": "*" };
  return { ...base, "Access-Control-Allow-Origin": origin };
}
__name(cors, "cors");
function json(d, s = 200, extraHeaders, request) {
  return new Response(JSON.stringify(d), {
    status: s,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors(request), ...extraHeaders || {} }
  });
}
__name(json, "json");
function parseCookies(h) {
  const out = {};
  if (!h) return out;
  h.split(";").forEach((c) => {
    const [k, v] = (c || "").split("=").map((s) => s?.trim());
    if (k && v) out[k] = v;
  });
  return out;
}
__name(parseCookies, "parseCookies");
function cryptoRandomId(len = 8) {
  const a = new Uint8Array(len);
  (globalThis.crypto || self.crypto).getRandomValues(a);
  return [...a].map((x) => x.toString(16).padStart(2, "0")).join("");
}
__name(cryptoRandomId, "cryptoRandomId");
function slugify(str = "") {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "tenant";
}
__name(slugify, "slugify");
function escapeHtml(s = "") {
  return s.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m]);
}
__name(escapeHtml, "escapeHtml");
function escapeForScript(s = "") {
  return s.replace(/<\/script/gi, "<\\/script");
}
__name(escapeForScript, "escapeForScript");
function getOrCreateSidFrom(request) {
  const headerSid = (request.headers.get("X-Chat-Sid") || "").trim();
  if (headerSid) return { sid: headerSid, setCookieHeader: null };
  const url = new URL(request.url);
  const querySid = (url.searchParams.get("sid") || "").trim();
  if (querySid) return { sid: querySid, setCookieHeader: null };
  const cookies = parseCookies(request.headers.get("Cookie") || "");
  const existing = cookies[SID_COOKIE];
  if (existing) return { sid: existing, setCookieHeader: null };
  const sid = cryptoRandomId(16);
  const setCookie = `${SID_COOKIE}=${sid}; Max-Age=${SID_MAX_AGE}; Path=/; SameSite=None; Secure`;
  return { sid, setCookieHeader: setCookie };
}
__name(getOrCreateSidFrom, "getOrCreateSidFrom");
async function serveDefaultAvatar(env, request) {
  if (!env.CHATBOT_R2) {
    return new Response("default avatar missing", { status: 404, headers: cors(request) });
  }
  const obj = await env.CHATBOT_R2.get(DEFAULT_AVATAR_R2_KEY);
  if (!obj) {
    return new Response("default avatar not found", { status: 404, headers: cors(request) });
  }
  return new Response(obj.body, {
    status: 200,
    headers: {
      "Content-Type": obj.httpMetadata?.contentType || "image/png",
      // ✅ Browser darf cachen (sehr wichtig!)
      "Cache-Control": "public, max-age=2592000, immutable",
      // 30 Tage
      ...cors(request)
    }
  });
}
__name(serveDefaultAvatar, "serveDefaultAvatar");
async function loadTenant(env, tenantId) {
  if (!tenantId) throw new Error("missing tenantId");
  const KV = env.TENANT_KV || getKV(env);
  if (!KV) throw new Error("TENANT_KV missing");
  const raw = await KV.get("tenant:" + tenantId);
  if (!raw) throw new Error("tenant not found");
  return JSON.parse(raw);
}
__name(loadTenant, "loadTenant");
function fallbackHtmlExtract(html) {
  if (!html) return "";
  let cleaned = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
  const titleMatch = cleaned.match(/<title[^>]*>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";
  const descMatch = cleaned.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i);
  const desc = descMatch ? descMatch[1].trim() : "";
  const pMatches = cleaned.match(/<p[^>]*>(.*?)<\/p>/gi) || [];
  const pTexts = pMatches.map((m) => m.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
  let bodyText = pTexts.join("\n");
  if (bodyText.length > 8e3) bodyText = bodyText.slice(0, 8e3);
  return "Titel: " + title + "\nDesc: " + desc + "\nText:\n" + bodyText;
}
__name(fallbackHtmlExtract, "fallbackHtmlExtract");
async function fetchMarkdownViaJina(env, url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1e4);
    const jinaKey = env.JINA_API_KEY || "";
    let safeUrl = url.trim();
    if (!safeUrl.startsWith("http")) {
      safeUrl = "https://" + safeUrl;
    }
    const apiPrefix = "https://r.jina.ai/";
    const targetUrl = apiPrefix + safeUrl;
    const res = await fetch(targetUrl, {
      headers: {
        "Accept": "text/plain",
        "X-Return-Format": "markdown",
        "Authorization": "Bearer " + jinaKey,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36"
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const text = await res.text();
      if (text && text.length > 50) return text;
    }
  } catch (e) {
    console.log("[SCAN] Jina Fehler bei URL: " + url);
  }
  return "";
}
__name(fetchMarkdownViaJina, "fetchMarkdownViaJina");
async function getUrlsFromSitemap(baseUrl, maxUrls = 4) {
  try {
    let safeBase = baseUrl.trim();
    if (!safeBase.startsWith("http")) safeBase = "https://" + safeBase;
    const urlObj = new URL(safeBase);
    const sitemapUrl = urlObj.origin + "/sitemap.xml";
    let urls = [safeBase];
    const res = await fetch(sitemapUrl);
    if (res.ok) {
      const text = await res.text();
      const matches = [...text.matchAll(/<loc>(.*?)<\/loc>/gi)];
      for (let i = 0; i < matches.length; i++) {
        const foundUrl = matches[i][1];
        if (!urls.includes(foundUrl) && !foundUrl.match(/\.(png|jpg|jpeg|pdf|xml|gif)$/i)) {
          urls.push(foundUrl);
        }
        if (urls.length >= maxUrls) break;
      }
    }
    return urls;
  } catch (e) {
    let fallback = baseUrl.trim();
    if (!fallback.startsWith("http")) fallback = "https://" + fallback;
    return [fallback];
  }
}
__name(getUrlsFromSitemap, "getUrlsFromSitemap");
async function generateTenantProfileWithAI(env, tenant) {
  if (!env.AI) throw new Error("AI binding missing");
  let websiteSnippet = "";
  if (tenant.websiteUrl) {
    try {
      let urlsToScan = await getUrlsFromSitemap(tenant.websiteUrl, 4);
      if (tenant.productLinks && tenant.productLinks.length > 0) {
        urlsToScan = [...urlsToScan, ...tenant.productLinks].slice(0, 10);
      }
      const scanPromises = urlsToScan.map((url) => fetchMarkdownViaJina(env, url));
      const results = await Promise.all(scanPromises);
      websiteSnippet = results.filter(Boolean).join("\n\n--- N\xC4CHSTE SEITE ---\n\n");
      if (websiteSnippet.trim().length < 50) {
        console.log("[SCAN] Jina hat versagt, nutze schnellen HTML-Fallback...");
        const fbRes = await fetch(tenant.websiteUrl, { method: "GET" });
        if (fbRes.ok) {
          const html = await fbRes.text();
          websiteSnippet = fallbackHtmlExtract(html);
        }
      }
      if (websiteSnippet.length > 12e3) {
        websiteSnippet = websiteSnippet.slice(0, 12e3);
      }
    } catch (_) {
    }
  }
  const lang = tenant.language || "de";
  const systemPrompt = lang === "en" ? "You are a SaaS assistant that creates structured chatbot + SEO knowledge for a company. Your outputs must be compact, structured and safe for a mid-sized LLM (no huge walls of text)." : "Du bist ein SaaS-Assistent, der strukturiertes Chatbot- und SEO-Wissen f\xFCr ein Unternehmen erzeugt. Deine Antworten sollen kompakt, klar strukturiert und f\xFCr ein mittelgro\xDFes LLM geeignet sein (keine Monstertexte).";
  const socials = tenant.socialLinks || {};
  const address = tenant.address || {};
  const shortDescription = (tenant.knowledgeText || "").toString().trim();
  const companyInfo = [
    "Name: " + (tenant.companyName || "-"),
    "Branche: " + (tenant.industry || "-"),
    "Website: " + (tenant.websiteUrl || "-"),
    "Bot-Name: " + (tenant.botName || "-"),
    // --- NEU: Wir geben der KI hier die Logo-URL mit ---
    "Logo-URL: " + (tenant.logoUrl || tenant.avatarUrl || "-"),
    "",
    "\xD6ffentliche Telefonnummer: " + (tenant.phone || "-"),
    "\xD6ffentliche E-Mail: " + (tenant.publicEmail || tenant.notifyEmail || "-"),
    "",
    "Adresse:",
    "  Stra\xDFe: " + (address.street || "-"),
    "  PLZ: " + (address.postalCode || "-"),
    "  Ort: " + (address.city || "-"),
    "  Land: " + (address.country || "-"),
    "",
    "\xD6ffnungszeiten (Rohtext): " + (tenant.openingHours || "-"),
    "",
    "Social Links (nur vom Nutzer, nichts erfinden):",
    Object.keys(socials).length ? Object.entries(socials).map((pair) => "  " + pair[0] + ": " + (pair[1] || "-")).join("\n") : "  (keine angegeben)",
    "",
    "KURZBESCHREIBUNG DES UNTERNEHMENS (vom Nutzer):",
    shortDescription || "-",
    "",
    "WEBSITE-INHALT (aus HTML extrahiert):",
    websiteSnippet || "-"
  ].join("\n");
  let userPrompt;
  if (lang === "en") {
    userPrompt = `From the following information (SHORT_DESCRIPTION + WEBSITE_CONTENT + contact data), create a JSON object with this shape:

{
     "knowledgeText": string,
     "services": [ { "key": string, "title": string, "aliases": [string], "followups": [string] } ],
     "faqs": [ { "id": string, "patterns": [string], "answer": string } ],
     "companyTerms": [string],
     "greetingMessage": string,
     "seo": {
       "pageTitle": string,
       "metaDescription": string,
       "ogTitle": string,
       "ogDescription": string,
       "canonicalUrl": string,
       "structuredData": object
     }
   }
   
Rules:
- knowledgeText: 8\u201320 short sentences... (max 4000 chars).
- services & faqs: extract real offerings and typical questions.
- companyTerms: extract the 5-8 most important SEO keywords.
- businessType: Identify the most specific Schema.org type (e.g. 'Restaurant', 'Hotel', 'Dentist', 'HVACBusiness', 'LegalService', 'FinancialService', 'DaySpa', 'Store', 'Organization', or fallback 'LocalBusiness').
- seo.pageTitle: Max 60 characters. Put the most important keyword at the beginning, company name at the end.
- seo.metaDescription: Max 155 characters. Must be engaging and end with a Call-to-Action (e.g. 'Contact us today').
- seo.ogTitle/ogDescription: Catchy variants for social media sharing.
- seo.canonicalUrl: use the main websiteUrl if valid.
- seo.structuredData: A valid Schema.org JSON object (NOT a string). Set @type to the specific businessType. Include name, url, address, contactPoint, telephone (MUST be at the root level, use public phone number), image (absolute Logo-URL), priceRange (e.g. '\u20AC\u20AC' or '$$'), description (Write a detailed and engaging SEO description of 2 to 3 sentences, roughly 150-300 characters. Explicitly describe the company, its expertise, and its main services), and sameAs (ONLY provided social links).
- Answer ONLY with valid JSON. No markdown wrappers, no explanations.

INFO:
` + companyInfo;
  } else {
    userPrompt = `Erzeuge aus den folgenden Informationen (KURZBESCHREIBUNG + WEBSITE-INHALT + Kontaktdaten) ein JSON-Objekt mit dieser Struktur:

{
     "knowledgeText": string,
     "services": [ { "key": string, "title": string, "aliases": [string], "followups": [string] } ],
     "faqs": [ { "id": string, "patterns": [string], "answer": string } ],
     "companyTerms": [string],
     "greetingMessage": string,
     "businessType": string,
     "seo": {
       "pageTitle": string,
       "metaDescription": string,
       "ogTitle": string,
       "ogDescription": string,
       "canonicalUrl": string,
       "structuredData": object
     }
   }
   
Regeln:
- knowledgeText: 8\u201320 kurze S\xE4tze... (max 4000 Zeichen).
- services & faqs: Echte Leistungen und Fragen extrahieren.
- companyTerms: Extrahiere die 5-8 wichtigsten SEO-Keywords der Seite.
- businessType: Bestimme den spezifischsten Schema.org-Typ (z.B. 'Restaurant', 'Hotel', 'Dentist', 'HVACBusiness', 'LegalService', 'FinancialService', 'DaySpa', 'Store', 'Organization' oder Fallback 'LocalBusiness').
- seo.pageTitle: Max 60 Zeichen. Wichtigstes Keyword an den Anfang, Firmenname ans Ende (z.B. 'Keyword | Firmenname').
- seo.metaDescription: Max 155 Zeichen. Klickstark formulieren und zwingend mit einem Call-to-Action beenden (z.B. 'Jetzt informieren!').
- seo.ogTitle/ogDescription: Leicht abgewandelte, ansprechende Varianten f\xFCr Social Media.
- seo.canonicalUrl: M\xF6glichst die Haupt-Website-URL.
- seo.structuredData: Ein g\xFCltiges Schema.org JSON-Objekt (KEIN String!). Setze den @type auf den ermittelten businessType. Inkludiere name, url, address, contactPoint, telephone (muss zwingend auf oberster Ebene liegen, nutze die \xF6ffentliche Nummer), image (absolute Logo-URL), priceRange (z.B. '\u20AC\u20AC'), description (Schreibe eine ausf\xFChrliche, aussagekr\xE4ftige SEO-Beschreibung aus 2 bis 3 zusammenh\xE4ngenden S\xE4tzen, ca. 150-300 Zeichen. Erkl\xE4re detailliert das Unternehmen, die Expertise und nenne zwingend die Hauptdienstleistungen) und sameAs (NUR \xFCbergebene Social-Links).
- Antworte NUR mit g\xFCltigem JSON. Keine Erkl\xE4rungen, keine Markdown-Bl\xF6cke.

INFO:
` + companyInfo;
  }
  const res = await env.AI.run(MODEL_ID, {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    max_tokens: 2500,
    // <-- ERHÖHT! Gemma braucht mehr Tokens für viele Infos
    temperature: 0.35,
    top_p: 0.9
  });
  let raw = (res && (res.response || res.output_text || res.choices && res.choices[0] && res.choices[0].message && res.choices[0].message.content) || "").toString().trim();
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    raw = raw.substring(firstBrace, lastBrace + 1);
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.log("[AI-JSON-PARSING-ERROR] Output war:", raw);
    return {
      knowledgeText: shortDescription || "",
      services: [],
      faqs: [],
      companyTerms: [],
      greetingMessage: "",
      businessType: "LocalBusiness",
      seo: {
        pageTitle: tenant.companyName || "",
        metaDescription: "",
        ogTitle: "",
        ogDescription: "",
        canonicalUrl: tenant.websiteUrl || "",
        structuredData: ""
      }
    };
  }
}
__name(generateTenantProfileWithAI, "generateTenantProfileWithAI");
function fixProductOffers(obj, defaultUrl) {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => fixProductOffers(item, defaultUrl));
  }
  let type = obj["@type"] || obj.type || "";
  if (type === "Product" || Array.isArray(type) && type.includes("Product")) {
    if (!obj.offers && !obj.review && !obj.aggregateRating) {
      let itemUrl = obj.url || defaultUrl || "";
      if (itemUrl && typeof itemUrl === "string" && !itemUrl.startsWith("http")) itemUrl = "https://" + itemUrl;
      obj.offers = {
        "@type": "Offer",
        "priceCurrency": "EUR",
        "price": "Auf Anfrage",
        "availability": "https://schema.org/InStock"
      };
      if (itemUrl) obj.offers["url"] = itemUrl;
    }
  }
  for (let k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k) && typeof obj[k] === "object" && obj[k] !== null) {
      obj[k] = fixProductOffers(obj[k], defaultUrl);
    }
  }
  return obj;
}
__name(fixProductOffers, "fixProductOffers");
function normalizeTenantProfile(profile, tenant) {
  const p = profile || {};
  const services = Array.isArray(p.services) ? p.services : [];
  const faqs = Array.isArray(p.faqs) ? p.faqs : [];
  const terms = Array.isArray(p.companyTerms) ? p.companyTerms : [];
  const seo = p.seo || {};
  let k = String(p.knowledgeText || tenant.knowledgeText || "");
  if (k.length > 4e3) k = k.slice(0, 4e3);
  let rawSchema = typeof seo.structuredData === "object" && seo.structuredData !== null ? seo.structuredData : {};
  let schemaType = String(p.businessType || rawSchema["@type"] || "LocalBusiness").trim();
  if (!schemaType || schemaType === "object" || schemaType === "undefined") schemaType = "LocalBusiness";
  let mainWebUrl = tenant.websiteUrl || "";
  if (mainWebUrl && !mainWebUrl.startsWith("http")) mainWebUrl = "https://" + mainWebUrl;
  let businessNode = {
    "@type": schemaType,
    "@id": (mainWebUrl || "https://scholz-friese-chatbot.de") + "#organization",
    "name": tenant.companyName || "",
    "url": mainWebUrl,
    "inLanguage": tenant.language === "en" ? "en-US" : "de-DE"
  };
  businessNode["description"] = String(rawSchema.description || seo.metaDescription || tenant.knowledgeText || "Dienstleistungen & Beratung").slice(0, 300);
  if (tenant.phone) businessNode["telephone"] = tenant.phone;
  businessNode["priceRange"] = rawSchema.priceRange || "\u20AC\u20AC";
  if (tenant.logoUrl || tenant.avatarUrl) {
    let img = tenant.logoUrl || tenant.avatarUrl;
    if (img.startsWith("/")) img = "https://scholz-friese-chatbot.de" + img;
    businessNode["image"] = img;
  }
  if (tenant.address || rawSchema.address) {
    let addr = typeof rawSchema.address === "object" ? rawSchema.address : {};
    let countryCode = tenant.address?.country || addr.addressCountry || "DE";
    if (typeof countryCode === "object" && countryCode.name) countryCode = countryCode.name;
    if (String(countryCode).toLowerCase().includes("deutschland") || String(countryCode).toLowerCase().includes("germany")) {
      countryCode = "DE";
    }
    businessNode["address"] = {
      "@type": "PostalAddress",
      "streetAddress": tenant.address?.street || addr.streetAddress || "",
      "postalCode": tenant.address?.postalCode || addr.postalCode || "",
      "addressLocality": tenant.address?.city || addr.addressLocality || "",
      "addressCountry": countryCode || "DE"
    };
  }
  let sameAs = [];
  if (tenant.socialLinks && typeof tenant.socialLinks === "object") {
    Object.values(tenant.socialLinks).forEach((v) => {
      if (v && typeof v === "string" && v.startsWith("http")) sameAs.push(v);
    });
  }
  if (sameAs.length > 0) businessNode["sameAs"] = sameAs;
  let graphItems = [businessNode];
  if (rawSchema && typeof rawSchema === "object") {
    let extraNodes = Array.isArray(rawSchema["@graph"]) ? rawSchema["@graph"] : Array.isArray(rawSchema) ? rawSchema : [];
    extraNodes.forEach(function(node) {
      if (node && typeof node === "object" && node["@type"] !== "LocalBusiness" && node["@type"] !== "FAQPage" && node["@type"] !== schemaType) {
        graphItems.push(node);
      }
    });
  }
  if (faqs.length > 0) {
    let faqEntities = faqs.map(function(f, idx) {
      let q = Array.isArray(f.patterns) && f.patterns.length > 0 && f.patterns[0] ? f.patterns[0] : f.id || "Frage " + (idx + 1);
      let a = f.answer || "";
      if (!q || !a) return null;
      return {
        "@type": "Question",
        "name": String(q).trim(),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": String(a).trim()
        }
      };
    }).filter(Boolean);
    if (faqEntities.length > 0) {
      graphItems.push({
        "@type": "FAQPage",
        "mainEntity": faqEntities
      });
    }
  }
  graphItems = fixProductOffers(graphItems, mainWebUrl);
  let safeGraphSchema = {
    "@context": "https://schema.org",
    "@graph": graphItems
  };
  let schemaString = JSON.stringify(safeGraphSchema);
  return {
    knowledgeText: k,
    services: services.map(function(s, i) {
      return {
        key: String(s.key || "service_" + i),
        title: String(s.title || "Service " + (i + 1)),
        aliases: Array.isArray(s.aliases) ? s.aliases.map(String) : [],
        followups: Array.isArray(s.followups) ? s.followups.map(String) : []
      };
    }),
    faqs: faqs.map(function(f, i) {
      return {
        id: String(f.id || "faq_" + i),
        patterns: Array.isArray(f.patterns) ? f.patterns.map(String) : [],
        answer: String(f.answer || "")
      };
    }),
    companyTerms: terms.map(String),
    greetingMessage: String(p.greetingMessage || ""),
    seo: {
      pageTitle: String(seo.pageTitle || tenant.companyName || "").slice(0, 70),
      metaDescription: String(seo.metaDescription || "").slice(0, 160),
      ogTitle: String(seo.ogTitle || seo.pageTitle || tenant.companyName || "").slice(0, 70),
      ogDescription: String(seo.ogDescription || seo.metaDescription || "").slice(0, 160),
      canonicalUrl: String(seo.canonicalUrl || tenant.websiteUrl || ""),
      structuredData: schemaString
    }
  };
}
__name(normalizeTenantProfile, "normalizeTenantProfile");
async function ensureTenantProfile(env, tenant) {
  const KV = env.TENANT_KV || getKV(env);
  const key = TENANT_PROFILE_PREFIX + tenant.id;
  const cached = await KV.get(key);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (_) {
    }
  }
  const profile = await generateTenantProfileWithAI(env, tenant);
  const safeProfile = normalizeTenantProfile(profile, tenant);
  await KV.put(key, JSON.stringify(safeProfile));
  return safeProfile;
}
__name(ensureTenantProfile, "ensureTenantProfile");
async function regenerateTenantProfile(env, tenant) {
  const KV = env.TENANT_KV || getKV(env);
  if (!KV) throw new Error("TENANT_KV missing");
  const profile = await generateTenantProfileWithAI(env, tenant);
  const safeProfile = normalizeTenantProfile(profile, tenant);
  await KV.put(TENANT_PROFILE_PREFIX + tenant.id, JSON.stringify(safeProfile));
  return safeProfile;
}
__name(regenerateTenantProfile, "regenerateTenantProfile");
function stateKey(tenantId, sid) {
  return "sess:" + (tenantId || "default") + ":" + sid;
}
__name(stateKey, "stateKey");
async function loadState(env, tenantId, sid) {
  const KV = getKV(env);
  const def = { history: [], lang: "de", updatedAt: Date.now() };
  if (!KV) return def;
  const raw = await KV.get(stateKey(tenantId, sid));
  if (!raw) return def;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.history) parsed.history = [];
    if (!parsed.lang) parsed.lang = "de";
    return parsed;
  } catch {
    return def;
  }
}
__name(loadState, "loadState");
async function saveState(env, tenantId, sid, state) {
  const KV = getKV(env);
  if (!KV) return;
  await KV.put(stateKey(tenantId, sid), JSON.stringify(state), { expirationTtl: SID_MAX_AGE });
}
__name(saveState, "saveState");
function pushHistory(state, role, text) {
  state.history.push({ role, text: String(text || "") });
  if (state.history.length > HISTORY_MAX) {
    state.history = state.history.slice(-HISTORY_MAX);
  }
  state.updatedAt = Date.now();
}
__name(pushHistory, "pushHistory");
function renderTranscript(history) {
  return (history || []).map(function(h) {
    return (h.role === "assistant" ? "Assistent" : "User") + ": " + h.text;
  }).join("\n");
}
__name(renderTranscript, "renderTranscript");
function parseFields(s) {
  if (!s) return {};
  const text = String(s);
  const email = (text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [])[0] || "";
  const phone = (text.match(/\+?\d[\d\s\-\/()]{7,}\d/) || [])[0] || "";
  let name = "";
  let m = text.match(/(?:ich\s*(?:bin|hei(?:s|ß)e)|mein\s*name\s*ist|name\s*[:\-]?)\s*([A-Za-zÄÖÜäöüß'`\- ]{2,80})/i);
  if (m) name = (m[1] || "").trim();
  let wishes = text.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig, "");
  wishes = wishes.replace(/\b(email|e-?mail)\s*(ist|:)?\s*[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/ig, "");
  wishes = wishes.trim();
  if (wishes.length < 6) wishes = "";
  let contact = "";
  if (email) contact = email;
  if (phone) contact = contact ? contact + " | " + phone : phone;
  const consent = /(ja\b|ja\s*bitte|passt|klingt\s*gut|mach\s*das|bitte\s*(senden|schicken|übermitteln|weiterleiten)|schick\s*das|ok(ay)?\b|in\s*ordnung|go|los|übermitteln|weiterleiten|absenden|abschicken)/i.test(text);
  return { name, email, phone, wishes, contact, consent };
}
__name(parseFields, "parseFields");
async function classifyAndSummarize(env, tenant, history, parsed) {
  const transcript = renderTranscript(history || []);
  const fallback = { type: "lead", urgency: "Normal", summary: parsed.wishes || "-" };
  if (!env.AI || !transcript || transcript.length < 10) return fallback;
  const systemPrompt = `Du bist ein Router-System f\xFCr E-Mail-Benachrichtigungen.
Analysiere den Chat-Verlauf und antworte AUSSCHLIESSLICH mit einem g\xFCltigen JSON-Objekt.
Kategorisiere die Anfrage des Kunden.

Struktur:
{
  "type": "support" | "table_reservation" | "room_reservation" | "lead",
  "urgency": "Normal" | "Mittel" | "Dringend",
  "summary": "Zusammenfassung des Wunsches (inkl. Daten wie Zeit/Personen)"
}
Regel: Antworte NUR mit dem JSON, kein Text davor oder danach!`;
  try {
    const res = await env.AI.run(MODEL_ID, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "TRANSKRIPT:\n" + transcript }
      ],
      max_tokens: 300,
      temperature: 0.1
    });
    let raw = (res && (res.response || res.output_text || res.choices && res.choices[0] && res.choices[0].message && res.choices[0].message.content) || "").toString().trim();
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      raw = raw.substring(firstBrace, lastBrace + 1);
      return JSON.parse(raw);
    }
    return fallback;
  } catch (e) {
    console.error("[CLASSIFY-ERROR]", e);
    return fallback;
  }
}
__name(classifyAndSummarize, "classifyAndSummarize");
function RESEND_API_KEY_FROM(env) {
  return env.RESEND_API_KEY;
}
__name(RESEND_API_KEY_FROM, "RESEND_API_KEY_FROM");
async function submitContact(env, tenant, parsed, page, history, origin) {
  const to = tenant.notifyEmail;
  if (!to) return "no_notify_email";
  const apiKey = env.RESEND_API_KEY || RESEND_API_KEY_FROM(env);
  if (!apiKey) return "no_api_key";
  let classified = { type: "lead", urgency: "Normal", summary: parsed.wishes || "-" };
  try {
    const aiResult = await classifyAndSummarize(env, tenant, history, parsed);
    if (aiResult && typeof aiResult === "object") {
      classified = {
        type: String(aiResult.type || aiResult.Type || "lead").toLowerCase(),
        urgency: String(aiResult.urgency || aiResult.Urgency || "Normal"),
        summary: String(aiResult.summary || aiResult.Summary || parsed.wishes || "-").trim()
      };
    }
  } catch (e) {
    console.error("Klassifizierung fehlgeschlagen, nutze Fallback", e);
  }
  let subject = `[Anfrage] ${parsed.name || parsed.email || "Unbekannt"}`;
  let htmlButtons = "";
  if (classified.type === "support") {
    subject = `[Support - ${classified.urgency}] ${parsed.name || parsed.email || "Unbekannt"}`;
  } else if (classified.type === "table_reservation" || classified.type === "room_reservation") {
    subject = `[${classified.type === "table_reservation" ? "Tisch" : "Zimmer"}] Reservierung von ${parsed.name || parsed.email || "Unbekannt"}`;
    const KV = env.TENANT_KV || env.CHAT_KV || env.KB;
    if (KV) {
      try {
        const resId = cryptoRandomId(16);
        const safeOrigin2 = origin || "https://scholz-friese-chatbot.de";
        await KV.put("res:" + resId, JSON.stringify({
          tenantId: tenant.id,
          customerEmail: parsed.email,
          customerName: parsed.name,
          type: classified.type,
          summary: classified.summary
        }), { expirationTtl: 604800 });
        htmlButtons = `
          <div style="margin:20px 0; padding:15px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; text-align:center;">
            <p><b>Aktion erforderlich:</b></p>
            <a href="${safeOrigin2}/reservation/action?id=${resId}&action=accept" style="display:inline-block; padding:10px 20px; background:#10b981; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold; margin-right:10px;">\u2705 Annehmen</a>
            <a href="${safeOrigin2}/reservation/action?id=${resId}&action=reject" style="display:inline-block; padding:10px 20px; background:#ef4444; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold;">\u274C Ablehnen</a>
          </div>`;
      } catch (kvErr) {
        console.error("KV Error:", kvErr);
      }
    }
  }
  const from = `${tenant.botName || "Chatbot"} <chatbot@scholz-friese-webdesign.de>`;
  const safeOrigin = origin || "https://scholz-friese-chatbot.de";
  const avatar = tenant.avatarUrl && tenant.avatarUrl.startsWith("http") ? tenant.avatarUrl : safeOrigin + "/avatar/" + encodeURIComponent(tenant.id);
  const htmlBody = `
     <div style="font-family:sans-serif; max-width:600px; margin:auto;">
        <div style="text-align:center; margin-bottom:20px;">
          <img src="${avatar}" style="width:70px; height:70px; border-radius:50%; object-fit:cover; border:2px solid #eee;">
        </div>
        <h2 style="text-align:center;">Neue Nachricht</h2>
        <p><b>Typ:</b> ${classified.type.toUpperCase()}<br>
           <b>Dringlichkeit:</b> ${classified.urgency}<br>
           <b>Name:</b> ${parsed.name || "-"}<br>
           <b>Kontakt:</b> ${parsed.contact || "-"}</p>
        <div style="background:#f1f5f9; padding:15px; border-radius:8px; margin:20px 0;">
          <b>Zusammenfassung:</b><br>${escapeHtml(classified.summary)}
        </div>
        ${htmlButtons}
        <hr style="border:0; border-top:1px solid #eee; margin:20px 0;">
        <small style="color:#64748b;"><b>Chat-Verlauf:</b><br>${escapeHtml(renderTranscript(history)).replace(/\n/g, "<br>")}</small>
     </div>
  `;
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html: htmlBody,
        text: renderTranscript(history)
      })
    });
    return res.ok ? "ok" : "error_resend";
  } catch (e) {
    return "network_error";
  }
}
__name(submitContact, "submitContact");
function matchFaqAnswer(profile, userMsg) {
  const s = (userMsg || "").toLowerCase();
  const faqs = profile.faqs || [];
  for (let i = 0; i < faqs.length; i++) {
    const faq = faqs[i];
    const patterns = faq.patterns || [];
    for (let j = 0; j < patterns.length; j++) {
      const p = String(patterns[j] || "").toLowerCase();
      if (p && s.indexOf(p) !== -1) {
        return faq.answer || "";
      }
    }
  }
  return null;
}
__name(matchFaqAnswer, "matchFaqAnswer");
async function chatAnswerWithAI(env, tenant, profile, state, userMsg, page) {
  const lang = tenant.language || "de";
  if (!env.AI) {
    return lang === "en" ? "I am the assistant of this company. Ask me anything about services, opening hours or contact options." : "Ich bin der Chat-Assistent dieses Unternehmens. Stell mir gern deine Frage.";
  }
  const botModules = tenant.botModules || ["lead"];
  let modeInstructions = [];
  if (botModules.includes("lead")) {
    modeInstructions.push("- ALLGEMEINE ANFRAGEN: Beantworte Fragen freundlich und biete proaktiv an, Kontaktdaten f\xFCr einen R\xFCckruf oder ein Angebot aufzunehmen.");
  }
  if (botModules.includes("product")) {
    modeInstructions.push("- PRODUKTWISSEN & VERKAUF: Du bist ein Produktexperte. Erkl\xE4re die Produkte nicht nur, sondern mache sie dem Kunden aktiv schmackhaft! Hebe die gr\xF6\xDFten Vorteile und Alleinstellungsmerkmale hervor, wecke Begeisterung und \xFCberzeuge den Kunden von einem Kauf.");
  }
  if (botModules.includes("consultant")) {
    modeInstructions.push("- VERKAUFSBERATER: Agiere wie ein exzellenter Top-Verk\xE4ufer. Argumentiere stark f\xFCr die Vorteile der Produkte/Dienstleistungen. Nutze verkaufspsychologische Ans\xE4tze, zeige, wie das Angebot das Leben des Kunden verbessert, und dr\xE4nge sanft aber zielstrebig auf einen Abschluss oder eine Anfrage.");
  }
  if (botModules.includes("support")) {
    modeInstructions.push("- SUPPORT: Wenn der Kunde ein Problem hat, zeige Empathie. Frage nach einer genauen Fehlerbeschreibung und der Dringlichkeit (Normal, Mittel, Dringend).");
  }
  if (botModules.includes("table")) {
    modeInstructions.push("- TISCHRESERVIERUNG: Wenn der Kunde essen kommen will, frage zwingend nach: Datum, Uhrzeit, Personenanzahl und eventuellen Zusatzw\xFCnschen.");
  }
  if (botModules.includes("room")) {
    const rooms = JSON.stringify(tenant.roomCategories || {});
    modeInstructions.push(`- ZIMMERRESERVIERUNG: Biete f\xFCr \xDCbernachtungen diese Kategorien & Preise an: ${rooms}. Frage nach Anreisedatum, Anzahl der N\xE4chte und Zimmerkategorie. WICHTIGE REGEL: Wenn der Kunde reservieren m\xF6chte, frage ihn ZWINGEND nach seiner E-Mail-Adresse, um die Reservierung best\xE4tigen zu k\xF6nnen!`);
  }
  if (botModules.includes("table") || botModules.includes("room") || botModules.includes("support") || botModules.includes("lead") || botModules.includes("consultant")) {
    modeInstructions.push("- ABSCHLUSS & KONTAKTDATEN (H\xD6CHSTE PRIORIT\xC4T): Wenn alle Infos gesammelt sind oder der Kunde kaufen/reservieren will, beende das Gespr\xE4ch niemals, ohne nach seiner E-Mail-Adresse zu fragen, damit die Anfrage ins System \xFCbertragen werden kann!");
  }
  const system = [
    `Du bist der Chatbot f\xFCr "${tenant.companyName || "dieses Unternehmen"}" (${tenant.industry || "-"}).`,
    "DEINE VERHALTENSREGELN (Reagiere flexibel auf den Kontext des Kunden):",
    ...modeInstructions,
    "",
    "WICHTIGE GRENZEN:",
    "- Erfinde niemals Fakten oder Kontaktdaten. Nutze NUR das folgende Unternehmens-Wissen.",
    "- Halte deine Antworten kurz und freundlich (2-4 S\xE4tze)."
  ].join("\n");
  const knowledge = profile && profile.knowledgeText ? profile.knowledgeText : "";
  let knowledgeShort = knowledge.length > 3500 ? knowledge.slice(0, 3500) : knowledge;
  const userContent = [
    "UNTERNEHMENS-WISSEN:",
    knowledgeShort || "(leer)",
    "",
    "FRAGE DES NUTZERS:",
    userMsg,
    page ? "\n[Kontext: " + page + "]" : ""
  ].join("\n");
  try {
    const res = await env.AI.run(MODEL_ID, {
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent }
      ],
      max_tokens: 350,
      temperature: 0.35,
      top_p: 0.9
    });
    const raw = (res && (res.response || res.output_text || res.choices && res.choices[0] && res.choices[0].message && res.choices[0].message.content) || "").toString().trim();
    if (!raw) return "Ich habe dich nicht ganz verstanden \u2013 magst du es anders formulieren?";
    return raw;
  } catch (err) {
    console.error("AI error:", err);
    return "Gerade habe ich Probleme bei der Antwortgenerierung. Hinterlass gerne deine E-Mail, damit wir uns melden k\xF6nnen.";
  }
}
__name(chatAnswerWithAI, "chatAnswerWithAI");
var WIDGET_JS = `;(function(){
     var urlParams = new URLSearchParams(location.search);
     var cfg = window.__CHATBOT_CONFIG__ || {};
   
     var TENANT_ID    = cfg.tenantId    || urlParams.get("tenantId") || "";
     var BOT_NAME     = cfg.botName     || "Chatbot";
     var COMPANY_NAME = cfg.companyName || "";
     var AVATAR_URL   = cfg.avatarUrl   || "";
     var CHAT_ENDPOINT = cfg.chatEndpoint || "/chat";
     var LANG         = (cfg.lang || "de").toLowerCase();
     var IS_EN        = LANG === "en";
   
     // Welcome-Text: zuerst AI-generate greetingMessage, sonst Fallback je Sprache
     var WELCOME_TEXT = cfg.welcomeMessage && String(cfg.welcomeMessage).trim();
     if (!WELCOME_TEXT) {
       if (IS_EN) {
         WELCOME_TEXT = COMPANY_NAME
           ? "Hi, I'm " + BOT_NAME + " from " + COMPANY_NAME + ". How can I help you?"
           : "Hi, I'm " + BOT_NAME + ". How can I help you?";
       } else {
         WELCOME_TEXT = COMPANY_NAME
           ? "Hi, ich bin " + BOT_NAME + " von " + COMPANY_NAME + ". Wie kann ich dir helfen?"
           : "Hi, ich bin " + BOT_NAME + ". Wie kann ich dir helfen?";
       }
     }
   
     var STRINGS = {
       placeholder: IS_EN
         ? "Ask " + BOT_NAME + " something\u2026"
         : "Frag " + BOT_NAME + " etwas \u2026",
       send: IS_EN ? "Send" : "Senden",
       errorGeneric: IS_EN
         ? "Something went wrong. Please try again in a moment."
         : "Da ist gerade etwas schiefgelaufen. Versuch es bitte gleich nochmal.",
       initialBotLabel: IS_EN ? "Assistant" : "Assistent",
       companyPrefix: IS_EN ? "from " : "von ",
       widgetErrorMissing: IS_EN
         ? "Error: tenantId is missing."
         : "Fehler: tenantId fehlt."
     };
   
     if (!TENANT_ID) {
       document.body.innerHTML = "<p style='padding:16px;font-family:system-ui'>" +
         STRINGS.widgetErrorMissing +
         "</p>";
       return;
     }
   
     function ready(fn){
       if (document.readyState === "complete" || document.readyState === "interactive") fn();
       else document.addEventListener("DOMContentLoaded", fn);
     }
   
     function newSidPerLoad(){
       var bytes = new Uint8Array(16);
       (self.crypto || window.crypto).getRandomValues(bytes);
       return Array.prototype.map.call(bytes, function(x){
         return x.toString(16).padStart(2,"0");
       }).join("");
     }
     var PAGE_SID = newSidPerLoad();
   
     function viewportHeightPx(){
       var vv = window.visualViewport;
       if (vv && typeof vv.height === "number") return Math.round(vv.height);
       return Math.round(window.innerHeight);
     }
   
     function sanitizeAssistantText(txt){
       if (!txt) return IS_EN ? "All right." : "Alles klar.";
       var out = String(txt);
       out = out.replace(/^\\s*(?:\\*\\*|\\*)?\\s*(?:<[^>]*>)?\\s*(Assistent|Assistant|Bot)\\s*[:\\-\\u2013]\\s*/i, "");
       var ban = [
         /^hallo!?\\s*wie\\s*kann\\s*(ich|man)\\s*(dir|ihnen)\\s*heute\\s*helfen\\??\\s*$/i,
         /^wie\\s*kann\\s*(ich|man)\\s*(dir|ihnen)\\s*helfen\\??\\s*$/i
       ];
       for (var i=0;i<ban.length;i++) out = out.replace(ban[i], "");
       out = out.replace(/\\n{3,}/g, "\\n\\n").trim();
       return out || (IS_EN ? "All right." : "Alles klar.");
     }
   
     ready(function(){
       var root = document.getElementById("ai-chat-root-inline");
       if (!root) return;
   
       var supportsDvh = typeof CSS !== "undefined" && CSS.supports && CSS.supports("height: 100dvh");
       var supportsSvh = typeof CSS !== "undefined" && CSS.supports && CSS.supports("height: 100svh");
   
       var panel = document.createElement("div");
       Object.assign(panel.style, {
         position: "fixed",
         inset: "0",
         display: "flex",
         flexDirection: "column",
         padding: "8px",
         gap: "8px",
         background: "#f7f7f8",
         boxSizing: "border-box",
         opacity: "0",
         transform: "translateY(6px)",
         transition: "opacity 0.18s ease-out, transform 0.18s ease-out"
       });
   
       requestAnimationFrame(function(){
         panel.style.opacity = "1";
         panel.style.transform = "translateY(0)";
       });
   
       var header = document.createElement("div");
       Object.assign(header.style, {
         flex: "0 0 auto",
         display: "flex",
         alignItems: "center",
         gap: "8px",
         padding: "8px 10px",
         borderRadius: "12px",
         background: "#ffffff",
         boxShadow: "0 6px 18px rgba(0,0,0,.08)",
         border: "1px solid #ececec"
       });
   
       var avatarWrap = document.createElement("div");
       Object.assign(avatarWrap.style, {
         width: "32px",
         height: "32px",
         borderRadius: "999px",
         overflow: "hidden",
         display: "flex",
         alignItems: "center",
         justifyContent: "center",
         background: "#111",
         flexShrink: "0"
       });
   
       if (AVATAR_URL) {
         var img = document.createElement("img");
         img.src = AVATAR_URL;
         img.alt = BOT_NAME;
         Object.assign(img.style, {
           width: "100%",
           height: "100%",
           objectFit: "cover"
         });
         avatarWrap.appendChild(img);
       } else {
         var span = document.createElement("span");
         span.textContent = BOT_NAME.slice(0,1).toUpperCase();
         Object.assign(span.style, {
           color: "#fff",
           fontWeight: "600",
           fontSize: "16px"
         });
         avatarWrap.appendChild(span);
       }
   
       var titleWrap = document.createElement("div");
       titleWrap.style.display = "flex";
       titleWrap.style.flexDirection = "column";
   
       var titleLine = document.createElement("div");
       titleLine.textContent = BOT_NAME;
       Object.assign(titleLine.style, {
         fontSize: "14px",
         fontWeight: "600"
       });
   
       var aiLabel = IS_EN ? "AI" : "KI";
       var connector = IS_EN ? "from" : "von";
       
       var subText = COMPANY_NAME
         ? aiLabel + " " + connector + " " + COMPANY_NAME
         : aiLabel;
       
       var subLine = document.createElement("div");
       subLine.textContent = subText;
       
       Object.assign(subLine.style, {
         fontSize: "11px",
         color: "#666"
       });
       
   
       titleWrap.appendChild(titleLine);
       titleWrap.appendChild(subLine);
       header.appendChild(avatarWrap);
       header.appendChild(titleWrap);

       // ================== CLOSE BUTTON (X) ==================
var closeBtn = document.createElement("button");
closeBtn.type = "button";
closeBtn.setAttribute("aria-label", IS_EN ? "Close chat" : "Chat schlie\xDFen");
closeBtn.textContent = "\xD7";

Object.assign(closeBtn.style, {
  marginLeft: "auto",
  width: "34px",
  height: "34px",
  borderRadius: "10px",
  border: "1px solid #ececec",
  background: "#fff",
  color: "#111",
  fontSize: "22px",
  lineHeight: "1",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center"
});

closeBtn.addEventListener("click", function () {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage(
      { type: "SF_CHAT_CLOSE", tenantId: TENANT_ID },
      "*"
    );
  }
});

header.appendChild(closeBtn);
// =====================================================

   
       var log = document.createElement("div");
       Object.assign(log.style, {
         flex: "1 1 auto",
         overflow: "auto",
         padding: "8px 4px",
         borderRadius: "12px",
         background: "#ffffff",
         boxShadow: "0 6px 18px rgba(0,0,0,.04)",
         border: "1px solid #ececec",
         fontSize: "14px",
         lineHeight: "1.5"
       });
   
       var form = document.createElement("form");
       Object.assign(form.style, {
         flex: "0 0 auto",
         display: "flex",
         alignItems: "center",
         gap: "8px",
         padding: "8px 6px",
         borderRadius: "999px",
         background: "#ffffff",
         boxShadow: "0 5px 16px rgba(0,0,0,.05)",
         border: "1px solid #ececec",
         marginBottom: "env(safe-area-inset-bottom)"
       });
   
       var input = document.createElement("input");
       input.type = "text";
       input.required = true;
       input.placeholder = STRINGS.placeholder;
       Object.assign(input.style, {
         flex: "1",
         border: "none",
         outline: "none",
         fontSize: "15px",
         padding: "8px 10px",
         background: "transparent"
       });
   
       var send = document.createElement("button");
       send.type = "submit";
       send.textContent = STRINGS.send;
       Object.assign(send.style, {
         border: "none",
         borderRadius: "999px",
         padding: "9px 16px",
         background: "#111",
         color: "#fff",
         fontSize: "14px",
         cursor: "pointer",
         flexShrink: "0",
         transition: "transform 0.12s ease-out, box-shadow 0.12s ease-out"
       });
       send.addEventListener("mousedown", function(){
         send.style.transform = "translateY(1px)";
         send.style.boxShadow = "0 3px 8px rgba(0,0,0,.15)";
       });
       send.addEventListener("mouseup", function(){
         send.style.transform = "translateY(0)";
         send.style.boxShadow = "0 5px 16px rgba(0,0,0,.18)";
       });
       send.addEventListener("mouseleave", function(){
         send.style.transform = "translateY(0)";
         send.style.boxShadow = "0 5px 16px rgba(0,0,0,.18)";
       });
   
       form.appendChild(input);
       form.appendChild(send);
       panel.appendChild(header);
       panel.appendChild(log);
       panel.appendChild(form);
       root.appendChild(panel);
   
       function layoutPanel(){
         var vh = viewportHeightPx();
         if (supportsDvh || supportsSvh) panel.style.height = "100dvh";
         else panel.style.height = vh + "px";
       }
       layoutPanel();
       window.addEventListener("resize", layoutPanel);
       if (window.visualViewport) window.visualViewport.addEventListener("resize", layoutPanel);
   
       function addBubble(role, text){
         var wrap = document.createElement("div");
         wrap.style.margin = "6px 0";
         wrap.style.display = "flex";
   
         var bubble = document.createElement("div");
         bubble.textContent = text;
         bubble.style.whiteSpace = "pre-wrap";
         bubble.style.maxWidth = "90%";
         bubble.style.padding = "8px 10px";
         bubble.style.borderRadius = "12px";
         bubble.style.opacity = "0";
         bubble.style.transform = role === "user"
           ? "translateY(4px) translateX(4px)"
           : "translateY(4px) translateX(-4px)";
         bubble.style.transition = "opacity 0.18s ease-out, transform 0.18s ease-out";
   
         if (role === "user") {
           wrap.style.justifyContent = "flex-end";
           bubble.style.background = "#111";
           bubble.style.color = "#fff";
         } else {
           wrap.style.justifyContent = "flex-start";
           bubble.style.background = "#f2f2f4";
           bubble.style.color = "#111";
         }
   
         wrap.appendChild(bubble);
         log.appendChild(wrap);
         log.scrollTop = log.scrollHeight;
   
         requestAnimationFrame(function(){
           bubble.style.opacity = "1";
           bubble.style.transform = "translateY(0) translateX(0)";
         });
   
         return {wrap: wrap, bubble: bubble};
       }
   
       var typingState = { el: null };
       function typingOn(){
         if (typingState.el) return;
         var wrap = document.createElement("div");
         wrap.style.margin = "6px 0";
         wrap.style.display = "flex";
         wrap.style.justifyContent = "flex-start";
         var bubble = document.createElement("div");
         bubble.textContent = "\u2026";
         Object.assign(bubble.style, {
           display: "inline-flex",
           padding: "6px 10px",
           borderRadius: "12px",
           background: "#f2f2f4",
           color: "#111",
           fontSize: "14px"
         });
         wrap.appendChild(bubble);
         log.appendChild(wrap);
         log.scrollTop = log.scrollHeight;
         typingState.el = wrap;
       }
       function typingOff(){
         if (!typingState.el) return;
         typingState.el.remove();
         typingState.el = null;
       }
   
       async function callChatApi(text){
         var payload = {
           tenantId: TENANT_ID,
           message: text,
           page: location.href
         };
         var res = await fetch(CHAT_ENDPOINT, {
           method: "POST",
           headers: {
             "Content-Type": "application/json",
             "X-Chat-Sid": PAGE_SID
           },
           body: JSON.stringify(payload),
           credentials: "omit",
           cache: "no-store"
         });
         return res.json().catch(function(){ return {}; });
       }
   
       addBubble("bot", WELCOME_TEXT);
   
       var sending = false;
   
       function unlock(){
         sending = false;
         input.disabled = false;
         send.disabled = false;
         input.focus();
       }
   
       form.addEventListener("submit", function(e){
         e.preventDefault();
         if (sending) return;
         var q = (input.value || "").trim();
         if (!q) return;
   
         addBubble("user", q);
         input.value = "";
         input.disabled = true;
         send.disabled = true;
         sending = true;
         typingOn();
   
         (async function(){
           try {
             var data = await callChatApi(q);
             typingOff();
             var answer = data && data.answer || "";
             var clean = sanitizeAssistantText(answer);
             addBubble("bot", clean);
           } catch (err) {
             typingOff();
             addBubble("bot", STRINGS.errorGeneric);
           } finally {
             unlock();
           }
         })();
       });
     });
   })();`;
function requireAuthDb(env) {
  if (!env.AUTH_DB) throw new Error("AUTH_DB binding missing (sf_auth)");
  return env.AUTH_DB;
}
__name(requireAuthDb, "requireAuthDb");
function normEmail(e = "") {
  return String(e || "").trim().toLowerCase();
}
__name(normEmail, "normEmail");
function isEmail(s = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim());
}
__name(isEmail, "isEmail");
var PBKDF2_PREFERRED = 12e4;
var PBKDF2_MAX = 1e5;
var PBKDF2_FALLBACKS = [1e5, 8e4, 6e4, 4e4];
async function pbkdf2HashWithIterations(password, saltHex, iterations) {
  const enc = new TextEncoder();
  const salt = hexToBytes(saltHex);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}
__name(pbkdf2HashWithIterations, "pbkdf2HashWithIterations");
async function pbkdf2HashSafe(password, saltHex) {
  const preferred = Math.min(PBKDF2_PREFERRED, PBKDF2_MAX);
  const candidates = [preferred, ...PBKDF2_FALLBACKS].filter((v, i, a) => a.indexOf(v) === i);
  let lastErr = null;
  for (const iterations of candidates) {
    try {
      const hash = await pbkdf2HashWithIterations(password, saltHex, iterations);
      return { iterations, hash };
    } catch (e) {
      lastErr = e;
      const msg = String(e && (e.message || e));
      if (!/iteration|iterations|NotSupportedError/i.test(msg)) throw e;
    }
  }
  throw lastErr || new Error("pbkdf2_failed");
}
__name(pbkdf2HashSafe, "pbkdf2HashSafe");
function bytesToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(bytesToHex, "bytesToHex");
function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return out;
}
__name(hexToBytes, "hexToBytes");
function randomHex(lenBytes) {
  const a = new Uint8Array(lenBytes);
  crypto.getRandomValues(a);
  return bytesToHex(a);
}
__name(randomHex, "randomHex");
function base64UrlEncode(bytes) {
  let s = btoa(String.fromCharCode.apply(null, Array.from(bytes)));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
__name(base64UrlEncode, "base64UrlEncode");
function base64UrlEncodeStr(str) {
  return base64UrlEncode(new TextEncoder().encode(str));
}
__name(base64UrlEncodeStr, "base64UrlEncodeStr");
function base64UrlDecodeToBytes(b64url) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((b64url.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
__name(base64UrlDecodeToBytes, "base64UrlDecodeToBytes");
async function hmacSha256(secret, data) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return new Uint8Array(sig);
}
__name(hmacSha256, "hmacSha256");
async function signJwt(env, payloadObj, expSeconds = 60 * 60 * 24 * 7) {
  const secret = env.JWT_SIGNING_KEY;
  if (!secret) throw new Error("JWT_SIGNING_KEY missing");
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1e3);
  const payload = {
    ...payloadObj,
    iat: now,
    exp: now + expSeconds
  };
  const h = base64UrlEncodeStr(JSON.stringify(header));
  const p = base64UrlEncodeStr(JSON.stringify(payload));
  const data = `${h}.${p}`;
  const sigBytes = await hmacSha256(secret, data);
  const s = base64UrlEncode(sigBytes);
  return `${data}.${s}`;
}
__name(signJwt, "signJwt");
async function verifyJwt(env, token) {
  const secret = env.JWT_SIGNING_KEY;
  if (!secret) throw new Error("JWT_SIGNING_KEY missing");
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const data = `${h}.${p}`;
  const sigBytes = base64UrlDecodeToBytes(s);
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const ok = await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(data));
  if (!ok) return null;
  const payloadJson = new TextDecoder().decode(base64UrlDecodeToBytes(p));
  let payload;
  try {
    payload = JSON.parse(payloadJson);
  } catch {
    return null;
  }
  const now = Math.floor(Date.now() / 1e3);
  if (payload.exp && now > payload.exp) return null;
  return payload;
}
__name(verifyJwt, "verifyJwt");
function getBearer(request) {
  const h = request.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : "";
}
__name(getBearer, "getBearer");
async function sendVerifyEmail(env, toEmail, verifyUrl) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY missing");
  const payload = {
    from: "Scholz-Friese Webdesign <chatbot@scholz-friese-webdesign.de>",
    to: [toEmail],
    subject: "Bitte best\xE4tige deine E-Mail",
    html: `
      <div style="font-family:system-ui,Segoe UI,Roboto,sans-serif;line-height:1.5">
        <h2>E-Mail best\xE4tigen</h2>
        <p>Klicke bitte auf den Button, um deine E-Mail zu best\xE4tigen:</p>
        <p>
          <a href="${verifyUrl}" style="display:inline-block;padding:10px 14px;border-radius:10px;background:#111;color:#fff;text-decoration:none">
            E-Mail best\xE4tigen
          </a>
        </p>
        <p style="color:#666;font-size:12px">Wenn du das nicht warst, ignoriere diese Mail.</p>
      </div>
    `
  };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const t = await res.text().catch(() => "");
  if (!res.ok) throw new Error("resend_failed_" + res.status + ": " + t);
}
__name(sendVerifyEmail, "sendVerifyEmail");
async function sendResetEmail(env, toEmail, resetUrl) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY missing");
  const payload = {
    from: "Scholz-Friese Webdesign <chatbot@scholz-friese-webdesign.de>",
    to: [toEmail],
    subject: "Dein Passwort zur\xFCcksetzen",
    html: `
      <div style="font-family:system-ui,Segoe UI,Roboto,sans-serif;line-height:1.5">
        <h2>Passwort zur\xFCcksetzen</h2>
        <p>Klicke bitte auf den Button, um dein neues Passwort zu vergeben:</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:10px 14px;border-radius:10px;background:#38bdf8;color:#000;text-decoration:none;font-weight:bold;">
            Neues Passwort vergeben
          </a>
        </p>
        <p style="color:#666;font-size:12px">Der Link ist 1 Stunde g\xFCltig. Wenn du diese Anfrage nicht gestellt hast, kannst du diese E-Mail einfach ignorieren.</p>
      </div>
    `
  };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const t = await res.text().catch(() => "");
  if (!res.ok) throw new Error("resend_failed_" + res.status + ": " + t);
}
__name(sendResetEmail, "sendResetEmail");
async function send2FAEmail(env, toEmail, code, deviceName, clientIp) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY missing");
  const payload = {
    from: "Scholz-Friese Webdesign <chatbot@scholz-friese-webdesign.de>",
    to: [toEmail],
    subject: "Dein Best\xE4tigungscode: " + code,
    html: `
      <div style="background-color:#f8fafc;padding:36px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
        <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:36px 28px;box-shadow:0 4px 16px rgba(0,0,0,0.04);">
          <div style="margin-bottom:20px;">
            <span style="font-weight:800;font-size:16px;letter-spacing:-0.5px;color:#0f172a;">Scholz &amp; Friese</span>
            <span style="color:#64748b;font-size:13px;margin-left:6px;">\xB7 Sicherheit</span>
          </div>
          <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 10px;letter-spacing:-0.4px;">Sicherheitscode f\xFCr neues Ger\xE4t</h2>
          <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
            Es wurde ein Login-Versuch von einem bisher nicht erkannten Ger\xE4t registriert. Bitte best\xE4tige deine Identit\xE4t mit folgendem 6-stelligen Code:
          </p>
          <div style="background:#f1f5f9;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;border:1px solid #e2e8f0;">
            <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:8px;">Dein Best\xE4tigungscode</div>
            <div style="font-family:'SF Mono',Monaco,Menlo,Consolas,monospace;font-size:34px;font-weight:800;letter-spacing:8px;color:#0284c7;">${code}</div>
          </div>
          <p style="font-size:13px;color:#64748b;line-height:1.5;margin:0 0 20px;">
            Dieser Code ist <strong>10 Minuten</strong> g\xFCltig. Nach erfolgreicher Best\xE4tigung wird dieses Ger\xE4t gespeichert, sodass du diesen Schritt in Zukunft nicht mehr wiederholen musst.
          </p>
          <div style="border-top:1px solid #f1f5f9;padding-top:16px;font-size:12px;color:#94a3b8;line-height:1.6;">
            <strong>Details zur Anmeldung:</strong><br>
            Ger\xE4t: ${escapeHtml(deviceName || "Unbekanntes Ger\xE4t")}<br>
            ${clientIp ? `IP-Adresse: ${escapeHtml(clientIp)}<br>` : ""}
            <span style="display:inline-block;margin-top:6px;color:#94a3b8;">Falls du diesen Login nicht selbst angefordert hast, \xE4ndere bitte umgehend dein Passwort.</span>
          </div>
        </div>
      </div>
    `
  };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const t = await res.text().catch(() => "");
  if (!res.ok) throw new Error("resend_failed_" + res.status + ": " + t);
}
__name(send2FAEmail, "send2FAEmail");

async function assertTenantOwner(env, tenantId, userId) {
  const KV = env.TENANT_KV || getKV(env);
  const raw = await KV.get("tenant:" + tenantId);
  if (!raw) throw new Error("tenant_not_found");
  let t;
  try {
    t = JSON.parse(raw);
  } catch {
    throw new Error("tenant_parse_failed");
  }
  if (t.ownerUserId && t.ownerUserId !== userId) {
    throw new Error("forbidden_not_owner");
  }
  return t;
}
__name(assertTenantOwner, "assertTenantOwner");
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(request) });
    }
    if (url.pathname === "/bots" && request.method === "GET") {
      try {
        if (!env.DB) {
          return json({ ok: false, error: "DB binding missing" }, 500, void 0, request);
        }
        let payload;
        try {
          payload = await requireUser(request, env);
        } catch {
          return json({ ok: false, error: "unauthorized" }, 401, void 0, request);
        }
        const userId = payload.sub;
        if (!userId) {
          return json({ ok: false, error: "missing_userId" }, 400, void 0, request);
        }
        const rows = await env.DB.prepare(`
      SELECT
        id,
        tenant_id,
        label,
        iframe_code,
        values_json,
        created_at,
        updated_at
      FROM bots
      WHERE user_id = ?
      ORDER BY updated_at DESC
      LIMIT 200
    `).bind(userId).all();
        const bots = (rows.results || []).map((r) => ({
          id: r.id,
          tenantId: r.tenant_id || null,
          label: r.label || "",
          iframeCode: r.iframe_code || "",
          values: safeJsonParse(r.values_json || "{}", {})
        }));
        return json({ ok: true, bots }, 200, void 0, request);
      } catch (e) {
        console.error("bots_get_failed", e);
        return json({ ok: false, error: "bots_get_failed", details: String(e) }, 500, void 0, request);
      }
    }
    if (url.pathname === "/bots" && request.method === "POST") {
      if (!env.DB) {
        return json({ error: "DB binding missing" }, 500, void 0, request);
      }
      let payload;
      try {
        payload = await requireUser(request, env);
      } catch {
        return json({ ok: false, error: "unauthorized" }, 401, void 0, request);
      }
      const userId = payload.sub;
      if (!userId) {
        return json({ error: "missing_userId" }, 400, void 0, request);
      }
      let body = {};
      try {
        body = await request.json();
      } catch {
      }
      const id = body.id || cryptoRandomId(16);
      const ts = nowTs();
      const existingBot = await env.DB.prepare("SELECT id FROM bots WHERE id=?").bind(id).first();
      if (!existingBot) {
        let planType = "free";
        if (env.AUTH_DB) {
          try {
            const uRow = await env.AUTH_DB.prepare("SELECT plan_type, email FROM users WHERE id=?").bind(userId).first();
            if (uRow) {
              planType = uRow.plan_type || "free";
              if (uRow.email === "friese.scholz@gmail.com") planType = "admin";
            }
          } catch (e) {
          }
        }
        let maxBots = 1;
        if (planType === "pro") maxBots = 1;
        if (planType === "unlimited") maxBots = 10;
        if (planType === "admin") maxBots = 99999;
        const countRow = await env.DB.prepare("SELECT COUNT(*) as c FROM bots WHERE user_id=?").bind(userId).first();
        const currentCount = countRow ? Number(countRow.c) : 0;
        if (currentCount >= maxBots) {
          return json({
            ok: false,
            error: "limit_reached",
            message: `Limit erreicht: Im ${planType.toUpperCase()}-Plan sind max. ${maxBots} Projekt(e) erlaubt.`
          }, 403, void 0, request);
        }
      }
      await env.DB.prepare(`
    INSERT INTO bots (
      id, user_id, tenant_id, label, iframe_code, values_json,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      tenant_id=excluded.tenant_id,
      label=excluded.label,
      iframe_code=excluded.iframe_code,
      values_json=excluded.values_json,
      updated_at=excluded.updated_at
  `).bind(
        id,
        userId,
        body.tenantId || null,
        body.label || "",
        body.iframeCode || "",
        JSON.stringify(body.values || {}),
        ts,
        ts
      ).run();
      return json({ ok: true, id }, 200, void 0, request);
    }
    if (url.pathname === "/bots/create" && request.method === "POST") {
      if (!env.DB) return json({ ok: false, error: "DB binding missing" }, 500, null, request);
      let payload;
      try {
        payload = await requireUser(request, env);
      } catch {
        return json({ ok: false, error: "unauthorized" }, 401, null, request);
      }
      const userId = payload.sub;
      let body = {};
      try {
        body = await request.json();
      } catch {
      }
      const id = cryptoRandomId(16);
      const ts = nowTs();
      await env.DB.prepare(`
    INSERT INTO bots (id, user_id, tenant_id, label, iframe_code, values_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
        id,
        userId,
        body.tenantId || null,
        body.label || "",
        body.embedCode || body.iframeCode || "",
        // abwärtskompatibel
        JSON.stringify(body.values || {}),
        ts,
        ts
      ).run();
      return json({ ok: true, id }, 200, null, request);
    }
    if (url.pathname === "/bots" && request.method === "DELETE") {
      if (!env.DB) {
        return json({ error: "DB binding missing" }, 500, void 0, request);
      }
      let payload;
      try {
        payload = await requireUser(request, env);
      } catch {
        return json({ ok: false, error: "unauthorized" }, 401, void 0, request);
      }
      const userId = payload.sub;
      let body = {};
      try {
        body = await request.json();
      } catch {
      }
      const botId = body.id;
      if (!botId) {
        return json({ ok: false, error: "missing_id" }, 400, void 0, request);
      }
      try {
        await env.DB.prepare(`
      DELETE FROM bots 
      WHERE id = ? AND user_id = ?
    `).bind(botId, userId).run();
        return json({ ok: true }, 200, void 0, request);
      } catch (e) {
        console.error("delete_bot_error", e);
        return json({ ok: false, error: "delete_failed", details: String(e) }, 500, void 0, request);
      }
    }
    if (url.pathname === "/reservation/action" && request.method === "GET") {
      try {
        const resId = url.searchParams.get("id");
        const action = url.searchParams.get("action");
        if (!resId || !action) return new Response("Fehlende Parameter", { status: 400 });
        const KV = env.TENANT_KV || getKV(env);
        const rawRes = await KV.get("res:" + resId);
        if (!rawRes) {
          return new Response("<html><body style='font-family:sans-serif; text-align:center; padding:50px;'><h2>Fehler</h2><p>Diese Reservierung wurde bereits bearbeitet oder ist abgelaufen.</p></body></html>", { headers: { "Content-Type": "text/html; charset=utf-8" } });
        }
        const resData = JSON.parse(rawRes);
        const tenant = await loadTenant(env, resData.tenantId);
        const apiKey = env.RESEND_API_KEY;
        const customerEmail = resData.customerEmail;
        if (apiKey && customerEmail && isEmail(customerEmail)) {
          let subjectCustomer = "";
          let htmlCustomer = "";
          const typeText = resData.type === "table_reservation" ? "Tischreservierung" : "Zimmerreservierung";
          const contactEmail = tenant.publicEmail || tenant.notifyEmail || "";
          const contactPhone = tenant.phone || "";
          let contactHtml = `<hr style="border:0; border-top:1px solid #eee; margin:20px 0;">
                           <p style="font-size: 14px; color: #555;">
                             <b>R\xFCckfragen oder Stornierung?</b><br>
                             Sie erreichen uns jederzeit hier:<br>`;
          if (contactPhone) contactHtml += `\u{1F4DE} ${escapeHtml(contactPhone)}<br>`;
          if (contactEmail) contactHtml += `\u2709\uFE0F <a href="mailto:${escapeHtml(contactEmail)}" style="color:#10b981;">${escapeHtml(contactEmail)}</a><br>`;
          contactHtml += `</p>`;
          if (action === "accept") {
            subjectCustomer = `Ihre ${typeText} bei ${tenant.companyName} wurde best\xE4tigt!`;
            htmlCustomer = `<h3>Hallo ${resData.customerName || ""},</h3>
                            <p>Ihre ${typeText} wurde soeben <b>best\xE4tigt</b>!</p>
                            <p><b>Ihre Details:</b><br/>${resData.summary}</p>
                            <p>Wir freuen uns auf Ihren Besuch!</p>
                            ${contactHtml}`;
          } else {
            subjectCustomer = `Ihre ${typeText} bei ${tenant.companyName} konnte leider nicht angenommen werden`;
            htmlCustomer = `<h3>Hallo ${resData.customerName || ""},</h3>
                            <p>Ihre Anfrage konnte leider <b>nicht</b> angenommen werden (z.B. aufgrund fehlender Kapazit\xE4ten).</p>
                            <p>Bitte kontaktieren Sie uns f\xFCr einen Alternativtermin.</p>
                            <p><b>Ihre Anfrage:</b><br/>${resData.summary}</p>
                            ${contactHtml}`;
          }
          await fetch(RESEND_ENDPOINT, {
            method: "POST",
            headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: `${tenant.companyName} <chatbot@scholz-friese-webdesign.de>`,
              to: [customerEmail],
              subject: subjectCustomer,
              html: htmlCustomer
            })
          });
        }
        await KV.delete("res:" + resId);
        const color = action === "accept" ? "green" : "red";
        const text = action === "accept" ? "erfolgreich best\xE4tigt" : "abgelehnt";
        return new Response(`<html><body style='font-family:sans-serif; text-align:center; padding:50px;'>
      <h2 style='color:${color};'>Aktion erfolgreich: Reservierung wurde ${text}.</h2>
      <p>Der Kunde wurde per E-Mail benachrichtigt.</p>
      </body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
      } catch (e) {
        return new Response("Systemfehler bei der Verarbeitung.", { status: 500 });
      }
    }
    if (url.pathname === "/webhook/lemon-squeezy" && request.method === "POST") {
      try {
        const secret = env.LEMON_SQUEEZY_SECRET || "dein_geheimes_passwort";
        const signature = request.headers.get("x-signature") || "";
        const bodyText = await request.text();
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(bodyText));
        const expectedSignature = Array.from(new Uint8Array(signatureBytes)).map((b) => b.toString(16).padStart(2, "0")).join("");
        if (signature !== expectedSignature) {
          return new Response("Invalid signature", { status: 401 });
        }
        const payload = JSON.parse(bodyText);
        const eventName = payload.meta.event_name;
        const userId = payload.meta.custom_data ? payload.meta.custom_data.user_id : null;
        if (!userId) return new Response("No custom_data.user_id found", { status: 200 });
        if (eventName === "subscription_created" || eventName === "subscription_updated") {
          const variantId = String(payload.data.attributes.variant_id);
          const billingUrl = payload.data.attributes.urls.customer_portal || "";
          let newPlan = "free";
          if (variantId === "1388046") newPlan = "pro";
          if (variantId === "1388059") newPlan = "unlimited";
          await env.AUTH_DB.prepare("UPDATE users SET plan_type = ?, billing_url = ? WHERE id = ?").bind(newPlan, billingUrl, userId).run();
        } else if (eventName === "subscription_cancelled" || eventName === "subscription_expired") {
          await env.AUTH_DB.prepare("UPDATE users SET plan_type = 'free', billing_url = NULL WHERE id = ?").bind(userId).run();
        }
        return new Response("Webhook received", { status: 200 });
      } catch (err) {
        console.error("Webhook error", err);
        return new Response("Error", { status: 500 });
      }
    }
    if (url.pathname === ANALYTICS_SCRIPT_PATH && request.method === "GET") {
      const origin = url.origin;
      const js = `;(function(){
    try {
      var s = document.currentScript;
      var tenantId = (s && (s.getAttribute("data-tenant-id") || s.getAttribute("data-site-id"))) || "";
      if (!tenantId) return;

      function getUtm(){
        var u = new URL(location.href);
        var p = u.searchParams;
        return {
          utm_source: p.get("utm_source")||"",
          utm_medium: p.get("utm_medium")||"",
          utm_campaign: p.get("utm_campaign")||"",
          utm_term: p.get("utm_term")||"",
          utm_content: p.get("utm_content")||""
        };
      }

      var endpoint = ${JSON.stringify(origin + ANALYTICS_COLLECT_PATH)};
      var lastKey = "";

      function send(){
        var payload = {
          tenantId: tenantId,
          url: location.href,
          path: location.pathname + location.search,
          title: document.title || "",
          referrer: document.referrer || "",
          utm: getUtm()
        };

        var body = JSON.stringify(payload);

        // optional debug:
        // console.log("[SF-TRACK] send", payload);

        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type":"application/json" },
          body: body,
          keepalive: true,
          mode: "cors",
          credentials: "omit",
          cache: "no-store"
        }).catch(function(){});
      }

      function track(){
        var key = location.pathname + location.search;
        if (key === lastKey) return;
        lastKey = key;
        send();
      }

      // initial
      track();

      // SPA Navigation erkennen
      var _push = history.pushState;
      history.pushState = function(){
        _push.apply(this, arguments);
        setTimeout(track, 0);
      };
      window.addEventListener("popstate", function(){
        setTimeout(track, 0);
      });

    } catch(e){}
  })();`;
      return new Response(js, {
        status: 200,
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "public, max-age=60",
          ...cors(request)
        }
      });
    }
    if (url.pathname === ANALYTICS_COLLECT_PATH && request.method === "POST") {
      try {
        if (!env.ANALYTICS_DB) throw new Error("ANALYTICS_DB missing");
        const body = await request.json().catch(() => null);
        if (!body) return new Response(null, { status: 204, headers: cors(request) });
        const tenantId = (body.tenantId || "").toString().trim();
        if (!tenantId) return new Response(null, { status: 204, headers: cors(request) });
        const tenant = await loadTenant(env, tenantId);
        if (!tenant.trackingEnabled) {
          return new Response(null, { status: 204, headers: cors(request) });
        }
        const urlStr = (body.url || "").toString();
        let u;
        try {
          u = new URL(urlStr);
        } catch {
          return new Response(null, { status: 204, headers: cors(request) });
        }
        const now = Date.now();
        const id = cryptoRandomId(16) + "-" + now;
        const path = (body.path || u.pathname + u.search).toString().slice(0, 500);
        const title = (body.title || "").toString().slice(0, 200);
        const ref = (body.referrer || "").toString().slice(0, 500);
        const refDomain = getRefDomain(ref);
        const utm = body.utm || {};
        const ua = request.headers.get("User-Agent") || "";
        const geo = getGeo(request);
        await env.ANALYTICS_DB.prepare(
          `INSERT INTO pageviews
            (id, tenant_id, ts, day, month, url, path, title, referrer, ref_domain,
             utm_source, utm_medium, utm_campaign, utm_term, utm_content,
             device, browser, os, country, region)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id,
          tenantId,
          now,
          isoDay(now),
          isoMonth(now),
          u.toString(),
          path,
          title,
          ref,
          refDomain,
          (utm.utm_source || "").toString().slice(0, 100),
          (utm.utm_medium || "").toString().slice(0, 100),
          (utm.utm_campaign || "").toString().slice(0, 150),
          (utm.utm_term || "").toString().slice(0, 150),
          (utm.utm_content || "").toString().slice(0, 150),
          detectDevice(ua),
          detectBrowser(ua),
          detectOS(ua),
          (geo.country || "").slice(0, 10),
          (geo.region || "").slice(0, 40)
        ).run();
        return new Response(null, { status: 204, headers: cors(request) });
      } catch (e) {
        console.error("collect_error", e);
        return new Response(null, { status: 204, headers: cors(request) });
      }
    }
    if (url.pathname === ANALYTICS_STATS_PATH && request.method === "GET") {
      try {
        if (!env.ANALYTICS_DB) throw new Error("ANALYTICS_DB missing");
        const tenantId = (url.searchParams.get("tenantId") || "").trim();
        if (!tenantId) return json({ error: "missing_tenantId" }, 400, void 0, request);
        await loadTenant(env, tenantId);
        const range = (url.searchParams.get("range") || "30d").toLowerCase();
        const now = Date.now();
        const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
        const since = now - days * 864e5;
        const daily = await env.ANALYTICS_DB.prepare(
          `SELECT day, COUNT(*) as views
             FROM pageviews
             WHERE tenant_id = ? AND ts >= ?
             GROUP BY day
             ORDER BY day ASC`
        ).bind(tenantId, since).all();
        const monthly = await env.ANALYTICS_DB.prepare(
          `SELECT month, COUNT(*) as views
             FROM pageviews
             WHERE tenant_id = ? AND ts >= ?
             GROUP BY month
             ORDER BY month ASC`
        ).bind(tenantId, since).all();
        const topPages = await env.ANALYTICS_DB.prepare(
          `SELECT path, COUNT(*) as views
             FROM pageviews
             WHERE tenant_id = ? AND ts >= ?
             GROUP BY path
             ORDER BY views DESC
             LIMIT 20`
        ).bind(tenantId, since).all();
        const topReferrers = await env.ANALYTICS_DB.prepare(
          `SELECT ref_domain as domain, COUNT(*) as views
             FROM pageviews
             WHERE tenant_id = ? AND ts >= ? AND ref_domain != ""
             GROUP BY ref_domain
             ORDER BY views DESC
             LIMIT 20`
        ).bind(tenantId, since).all();
        const chatDaily = await env.ANALYTICS_DB.prepare(
          `SELECT day, role, COUNT(*) as count
             FROM chat_events
             WHERE tenant_id = ? AND ts >= ?
             GROUP BY day, role
             ORDER BY day ASC`
        ).bind(tenantId, since).all();
        const chatStats = await env.ANALYTICS_DB.prepare(
          `SELECT role, COUNT(*) as count
             FROM chat_events
             WHERE tenant_id = ? AND ts >= ?
             GROUP BY role`
        ).bind(tenantId, since).all();
        return json({
          ok: true,
          tenantId,
          range,
          daily: daily.results || [],
          monthly: monthly.results || [],
          topPages: topPages.results || [],
          topReferrers: topReferrers.results || [],
          // --- NEU: Die Daten ans Dashboard übergeben ---
          chatDaily: chatDaily.results || [],
          chatStats: chatStats.results || []
        }, 200, void 0, request);
      } catch (e) {
        console.error("stats_error", e);
        return json({ ok: false, error: "stats_failed", details: String(e) }, 500, void 0, request);
      }
    }
    if (url.pathname === "/selftest" && request.method === "GET") {
      let aiOk = false;
      let aiText = null;
      let error = null;
      if (env.AI) {
        try {
          const res = await env.AI.run(MODEL_ID, {
            messages: [
              { role: "system", content: "You are a diagnostic helper. Answer with a very short OK." },
              { role: "user", content: "Say only: OK." }
            ],
            max_tokens: 10,
            temperature: 0
          });
          aiText = (res && (res.response || res.output_text) || "").toString().trim();
          aiOk = /^ok\.?$/i.test(aiText);
        } catch (e) {
          error = String(e);
        }
      }
      const base = {
        ok: !!aiOk,
        aiResponse: aiText,
        model: MODEL_ID,
        aiBinding: !!env.AI,
        tenantKv: !!env.TENANT_KV,
        chatKv: !!env.CHAT_KV,
        resendKey: !!env.RESEND_API_KEY,
        error
      };
      return json(base, 200, void 0, request);
    }
    if (url.pathname === "/debug" && request.method === "GET") {
      const tenantId = (url.searchParams.get("tenant") || "").toString();
      const sidInfo = getOrCreateSidFrom(request);
      const state = await loadState(env, tenantId, sidInfo.sid);
      return json({ tenantId, sid: sidInfo.sid, state }, 200, void 0, request);
    }
    if (url.pathname === "/default-avatar" && request.method === "GET") {
      try {
        if (!env.CHATBOT_R2) throw new Error("CHATBOT_R2 binding missing");
        const obj = await env.CHATBOT_R2.get(DEFAULT_AVATAR_R2_KEY);
        if (!obj) {
          return new Response("default avatar not found", {
            status: 404,
            headers: cors(request)
          });
        }
        return new Response(obj.body, {
          status: 200,
          headers: {
            "Content-Type": obj.httpMetadata?.contentType || "image/png",
            "Cache-Control": "public, max-age=2592000, immutable",
            // ✅ statt no-store
            ...cors(request)
          }
        });
      } catch (e) {
        console.error("default_avatar_error", e);
        return new Response("default_avatar_error", {
          status: 500,
          headers: cors(request)
        });
      }
    }
    if (url.pathname.startsWith("/avatar/") && request.method === "GET") {
      try {
        const tenantId = decodeURIComponent(
          url.pathname.replace("/avatar/", "") || ""
        ).trim();
        if (!tenantId) {
          return new Response("missing tenantId", {
            status: 400,
            headers: cors(request)
          });
        }
        const KV = env.TENANT_KV || getKV(env);
        if (!KV) throw new Error("TENANT_KV missing");
        const stored = await KV.get(AVATAR_KV_PREFIX + tenantId);
        if (!stored) {
          return await serveDefaultAvatar(env, request);
        }
        let meta;
        try {
          meta = JSON.parse(stored);
        } catch (_) {
          meta = null;
        }
        if (!meta || !meta.r2Key) {
          return await serveDefaultAvatar(env, request);
        }
        if (!env.CHATBOT_R2) throw new Error("CHATBOT_R2 binding missing");
        const obj = await env.CHATBOT_R2.get(meta.r2Key);
        if (!obj) {
          return await serveDefaultAvatar(env, request);
        }
        return new Response(obj.body, {
          status: 200,
          headers: {
            "Content-Type": meta.contentType || obj.httpMetadata?.contentType || "image/png",
            "Cache-Control": "public, max-age=2592000, immutable",
            ...cors(request)
          }
        });
      } catch (e) {
        console.error("avatar_serve_error", e);
        return await serveDefaultAvatar(env, request);
      }
    }
    if (url.pathname === "/widget.js" && request.method === "GET") {
      return new Response(WIDGET_JS, {
        status: 200,
        headers: { "Content-Type": "application/javascript; charset=utf-8", ...cors(request) }
      });
    }
    if (url.pathname === "/widget.html" && request.method === "GET") {
      try {
        const tenantId = (url.searchParams.get("tenantId") || "").toString().trim();
        if (!tenantId) return new Response("missing tenantId", { status: 400, headers: cors(request) });
        const tenant = await loadTenant(env, tenantId);
        const profile = await ensureTenantProfile(env, tenant);
        const config = {
          tenantId,
          botName: tenant.botName || "Chatbot",
          companyName: tenant.companyName || "",
          avatarUrl: tenant.avatarUrl || "/avatar/" + tenantId,
          welcomeMessage: profile.greetingMessage || "",
          chatEndpoint: "/chat",
          lang: tenant.language || "de"
        };
        const seo = profile.seo || {};
        const seoTitle = seo.pageTitle || tenant.companyName || "Chatbot";
        const seoDesc = seo.metaDescription || "Chatbot von " + (tenant.companyName || "");
        const canonical = seo.canonicalUrl || tenant.websiteUrl || "";
        const structured = seo.structuredData || "";
        const seoHead = "<title>" + escapeHtml(seoTitle) + '</title>\n<meta name="description" content="' + escapeHtml(seoDesc) + '">\n' + (canonical ? '<link rel="canonical" href="' + escapeHtml(canonical) + '">\n' : "") + (structured ? '<script type="application/ld+json">' + escapeForScript(structured) + "<\/script>\n" : "");
        const html = '<!doctype html>\n<html lang="' + escapeHtml(tenant.language || "de") + '">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n  ' + seoHead + "\n  <style>\n    :root { color-scheme: light; }\n    html, body {\n      margin:0; padding:0; height:100%;\n      font-family: system-ui,-apple-system,Segoe UI,Roboto,sans-serif;\n      background:#f7f7f8;\n    }\n    * { box-sizing:border-box; }\n  </style>\n  <script>\n    window.__CHATBOT_CONFIG__ = " + JSON.stringify(config) + ';\n  <\/script>\n</head>\n<body>\n  <div id="ai-chat-root-inline"></div>\n  <script src="/widget.js"><\/script>\n</body>\n</html>';
        return new Response(html, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8", ...cors(request) }
        });
      } catch (e) {
        console.error("widget_error", e);
        return new Response("widget_error", { status: 500, headers: cors(request) });
      }
    }
    if (url.pathname === "/upload-avatar" && request.method === "POST") {
      try {
        const tenantId = (url.searchParams.get("tenantId") || "").toString().trim();
        if (!tenantId) return json({ error: "missing tenantId" }, 400, void 0, request);
        const KV = env.TENANT_KV || getKV(env);
        if (!KV) throw new Error("TENANT_KV missing");
        if (!env.CHATBOT_R2) throw new Error("CHATBOT_R2 binding missing");
        const existing = await KV.get(AVATAR_KV_PREFIX + tenantId);
        if (existing) {
          return json({ error: "delete_existing_first" }, 409, void 0, request);
        }
        const ct = request.headers.get("Content-Type") || "";
        if (!ct.toLowerCase().includes("multipart/form-data")) {
          return json({ error: "expected_multipart_formdata" }, 400, void 0, request);
        }
        const form = await request.formData();
        const file = form.get("file");
        if (!file || typeof file === "string") {
          return json({ error: "missing_file" }, 400, void 0, request);
        }
        const fileType = (file.type || "").toString();
        if (!/^image\/(png|jpe?g|webp|gif|svg\+xml)$/i.test(fileType)) {
          return json({ error: "unsupported_type", contentType: fileType }, 400, void 0, request);
        }
        const buf = await file.arrayBuffer();
        if (buf.byteLength > 2 * 1024 * 1024) {
          return json({ error: "file_too_large" }, 400, void 0, request);
        }
        const ext = fileType.includes("png") ? "png" : fileType.includes("jpeg") ? "jpg" : fileType.includes("webp") ? "webp" : fileType.includes("gif") ? "gif" : fileType.includes("svg") ? "svg" : "img";
        const r2Key = `avatars/${tenantId}.${ext}`;
        await env.CHATBOT_R2.put(r2Key, buf, {
          httpMetadata: { contentType: fileType }
        });
        const version = Date.now();
        await KV.put(AVATAR_KV_PREFIX + tenantId, JSON.stringify({
          r2Key,
          contentType: fileType,
          v: version
        }));
        const rawTenant = await KV.get("tenant:" + tenantId);
        if (rawTenant) {
          let tenant;
          try {
            tenant = JSON.parse(rawTenant);
          } catch (_) {
            tenant = { id: tenantId };
          }
          tenant.avatarUrl = "/avatar/" + tenantId + "?v=" + version;
          await KV.put("tenant:" + tenantId, JSON.stringify(tenant));
        }
        return json({ ok: true, avatarUrl: "/avatar/" + tenantId + "?v=" + version }, 200, void 0, request);
      } catch (e) {
        console.error("upload_avatar_error", e);
        return json({ error: "upload_failed", details: String(e) }, 500, void 0, request);
      }
    }
    if (url.pathname === "/delete-avatar" && request.method === "POST") {
      try {
        const tenantId = (url.searchParams.get("tenantId") || "").toString().trim();
        if (!tenantId) return json({ error: "missing tenantId" }, 400, void 0, request);
        const KV = env.TENANT_KV || getKV(env);
        if (!KV) throw new Error("TENANT_KV missing");
        if (!env.CHATBOT_R2) throw new Error("CHATBOT_R2 binding missing");
        const stored = await KV.get(AVATAR_KV_PREFIX + tenantId);
        if (!stored) {
          return json({ ok: true, avatarUrl: DEFAULT_AVATAR_URL }, 200, void 0, request);
        }
        let meta;
        try {
          meta = JSON.parse(stored);
        } catch (_) {
          meta = null;
        }
        if (meta?.r2Key) {
          await env.CHATBOT_R2.delete(meta.r2Key);
        }
        await KV.delete(AVATAR_KV_PREFIX + tenantId);
        const rawTenant = await KV.get("tenant:" + tenantId);
        if (rawTenant) {
          let tenant;
          try {
            tenant = JSON.parse(rawTenant);
          } catch (_) {
            tenant = { id: tenantId };
          }
          tenant.avatarUrl = "";
          await KV.put("tenant:" + tenantId, JSON.stringify(tenant));
        }
        return json({ ok: true, avatarUrl: DEFAULT_AVATAR_URL }, 200, void 0, request);
      } catch (e) {
        console.error("delete_avatar_error", e);
        return json({ error: "delete_failed", details: String(e) }, 500, void 0, request);
      }
    }
    if (url.pathname === "/upload-logo" && request.method === "POST") {
      try {
        const tenantId = (url.searchParams.get("tenantId") || "").toString().trim();
        if (!tenantId) return json({ error: "missing tenantId" }, 400, void 0, request);
        const KV = env.TENANT_KV || getKV(env);
        if (!KV) throw new Error("TENANT_KV missing");
        if (!env.CHATBOT_R2) throw new Error("CHATBOT_R2 binding missing");
        const existing = await KV.get(LOGO_KV_PREFIX + tenantId);
        if (existing) return json({ error: "delete_existing_first" }, 409, void 0, request);
        const ct = request.headers.get("Content-Type") || "";
        if (!ct.toLowerCase().includes("multipart/form-data")) {
          return json({ error: "expected_multipart_formdata" }, 400, void 0, request);
        }
        const form = await request.formData();
        const file = form.get("file");
        if (!file || typeof file === "string") return json({ error: "missing_file" }, 400, void 0, request);
        const fileType = (file.type || "").toString();
        if (!/^image\/(png|jpe?g|webp|gif|svg\+xml)$/i.test(fileType)) {
          return json({ error: "unsupported_type", contentType: fileType }, 400, void 0, request);
        }
        const buf = await file.arrayBuffer();
        if (buf.byteLength > 2 * 1024 * 1024) return json({ error: "file_too_large" }, 400, void 0, request);
        const ext = fileType.includes("png") ? "png" : fileType.includes("jpeg") ? "jpg" : fileType.includes("webp") ? "webp" : fileType.includes("gif") ? "gif" : fileType.includes("svg") ? "svg" : "img";
        const r2Key = `logos/${tenantId}.${ext}`;
        await env.CHATBOT_R2.put(r2Key, buf, { httpMetadata: { contentType: fileType } });
        await KV.put(LOGO_KV_PREFIX + tenantId, JSON.stringify({ r2Key, contentType: fileType }));
        const rawTenant = await KV.get("tenant:" + tenantId);
        if (rawTenant) {
          let tenant;
          try {
            tenant = JSON.parse(rawTenant);
          } catch (_) {
            tenant = { id: tenantId };
          }
          tenant.logoUrl = "/logo/" + tenantId;
          await KV.put("tenant:" + tenantId, JSON.stringify(tenant));
        }
        return json({ ok: true, logoUrl: "/logo/" + tenantId }, 200, void 0, request);
      } catch (e) {
        console.error("upload_logo_error", e);
        return json({ error: "upload_failed", details: String(e) }, 500, void 0, request);
      }
    }
    if (url.pathname === "/delete-logo" && request.method === "POST") {
      try {
        const tenantId = (url.searchParams.get("tenantId") || "").toString().trim();
        if (!tenantId) return json({ error: "missing tenantId" }, 400, void 0, request);
        const KV = env.TENANT_KV || getKV(env);
        if (!KV) throw new Error("TENANT_KV missing");
        if (!env.CHATBOT_R2) throw new Error("CHATBOT_R2 binding missing");
        const stored = await KV.get(LOGO_KV_PREFIX + tenantId);
        if (stored) {
          let meta;
          try {
            meta = JSON.parse(stored);
          } catch (_) {
            meta = null;
          }
          if (meta?.r2Key) await env.CHATBOT_R2.delete(meta.r2Key);
          await KV.delete(LOGO_KV_PREFIX + tenantId);
        }
        const rawTenant = await KV.get("tenant:" + tenantId);
        if (rawTenant) {
          let tenant;
          try {
            tenant = JSON.parse(rawTenant);
          } catch (_) {
            tenant = { id: tenantId };
          }
          tenant.logoUrl = "";
          await KV.put("tenant:" + tenantId, JSON.stringify(tenant));
        }
        return json({ ok: true }, 200, void 0, request);
      } catch (e) {
        console.error("delete_logo_error", e);
        return json({ error: "delete_failed", details: String(e) }, 500, void 0, request);
      }
    }
    if (url.pathname.startsWith("/logo/") && request.method === "GET") {
      try {
        const tenantId = decodeURIComponent(url.pathname.replace("/logo/", "") || "").trim();
        if (!tenantId) return new Response("missing tenantId", { status: 400, headers: cors(request) });
        const KV = env.TENANT_KV || getKV(env);
        const stored = await KV.get(LOGO_KV_PREFIX + tenantId);
        if (!stored) return new Response("", { status: 404, headers: cors(request) });
        let meta;
        try {
          meta = JSON.parse(stored);
        } catch (_) {
          meta = null;
        }
        if (!meta?.r2Key) return new Response("", { status: 404, headers: cors(request) });
        const obj = await env.CHATBOT_R2.get(meta.r2Key);
        if (!obj) return new Response("", { status: 404, headers: cors(request) });
        return new Response(obj.body, {
          status: 200,
          headers: {
            "Content-Type": meta.contentType || obj.httpMetadata?.contentType || "image/png",
            "Cache-Control": "public, max-age=31536000, immutable",
            ...cors(request)
          }
        });
      } catch (e) {
        console.error("logo_serve_error", e);
        return new Response("logo_serve_error", { status: 500, headers: cors(request) });
      }
    }
    if (url.pathname === "/auth/signup" && request.method === "POST") {
      try {
        const AUTH_DB = requireAuthDb(env);
        const body = await request.json().catch(() => ({}));
        const email = normEmail(body.email || "");
        const password = String(body.password || "");
        if (!isEmail(email)) return json({ ok: false, error: "invalid_email" }, 400, null, request);
        if (password.length < 8) return json({ ok: false, error: "password_too_short" }, 400, null, request);
        const existing = await AUTH_DB.prepare("SELECT id, verified FROM users WHERE email=?").bind(email).first();
        if (existing && Number(existing.verified) === 1) {
          return json({ ok: false, error: "email_already_registered" }, 409, null, request);
        }
        const userId = existing?.id || cryptoRandomId(16);
        const salt = randomHex(16);
        const { iterations, hash } = await pbkdf2HashSafe(password, salt);
        const ts = Date.now();
        await AUTH_DB.prepare(`
  INSERT INTO users (id, email, pw_hash, pw_salt, pw_iter, verified, created_at)
  VALUES (?, ?, ?, ?, ?, 0, ?)
  ON CONFLICT(email) DO UPDATE SET
    pw_hash=excluded.pw_hash,
    pw_salt=excluded.pw_salt,
    pw_iter=excluded.pw_iter
`).bind(userId, email, hash, salt, iterations, ts).run();
        const token = cryptoRandomId(24);
        const expiresAt = Date.now() + 1e3 * 60 * 60 * 24;
        await AUTH_DB.prepare(`
      INSERT INTO email_tokens (token, user_id, purpose, expires_at, created_at)
      VALUES (?, ?, 'verify', ?, ?)
    `).bind(token, userId, expiresAt, Date.now()).run();
        const verifyUrl = `${url.origin}/auth/verify?token=${encodeURIComponent(token)}`;
        await sendVerifyEmail(env, email, verifyUrl);
        return json({ ok: true, message: "verify_email_sent" }, 200, null, request);
      } catch (e) {
        console.error("auth_signup_failed", e);
        return json({
          ok: false,
          error: "signup_failed",
          details: String(e)
        }, 500, null, request);
      }
    }
    if (url.pathname === "/auth/verify" && request.method === "GET") {
      try {
        const AUTH_DB = requireAuthDb(env);
        const token = (url.searchParams.get("token") || "").trim();
        if (!token) return new Response("Missing token", { status: 400 });
        const row = await AUTH_DB.prepare(`
      SELECT token, user_id, expires_at
      FROM email_tokens
      WHERE token=? AND purpose='verify'
      LIMIT 1
    `).bind(token).first();
        if (!row) return new Response("Invalid token", { status: 400 });
        if (Date.now() > Number(row.expires_at || 0)) return new Response("Token expired", { status: 400 });
        await AUTH_DB.prepare("UPDATE users SET verified=1 WHERE id=?").bind(row.user_id).run();
        await AUTH_DB.prepare("DELETE FROM email_tokens WHERE token=?").bind(token).run();
        return Response.redirect(`https://scholz-friese-chatbot.de/?verified=1#login`, 302);
      } catch (e) {
        console.error("auth_verify_failed", e);
        return new Response("Verify failed", { status: 500 });
      }
    }
    if (url.pathname === "/auth/login" && request.method === "POST") {
      try {
        const AUTH_DB = requireAuthDb(env);
        const KV = env.TENANT_KV || getKV(env);
        const body = await request.json().catch(() => ({}));
        const email = normEmail(body.email || "");
        const password = String(body.password || "");
        const deviceId = (body.deviceId || "").trim();
        const deviceName = (body.deviceName || "").trim().slice(0, 100) || "Browser";

        if (!isEmail(email)) return json({ ok: false, error: "invalid_email" }, 400, null, request);
        if (!password) return json({ ok: false, error: "missing_password" }, 400, null, request);
        const user = await AUTH_DB.prepare(
          "SELECT id, email, pw_hash, pw_salt, pw_iter, verified FROM users WHERE email=?"
        ).bind(email).first();
        if (!user) return json({ ok: false, error: "invalid_credentials" }, 401, null, request);
        if (Number(user.verified) !== 1) return json({ ok: false, error: "email_not_verified" }, 403, null, request);
        let iterations = Number(user.pw_iter || 1e5);
        if (!Number.isFinite(iterations) || iterations < 1e3) iterations = 1e5;
        if (iterations > 1e5) iterations = 1e5;
        const salt = String(user.pw_salt || "");
        const hash = String(user.pw_hash || "");
        if (!salt || !hash) return json({ ok: false, error: "invalid_credentials" }, 401, null, request);
        const testHash = await pbkdf2HashWithIterations(password, salt, iterations);
        if (testHash !== hash) return json({ ok: false, error: "invalid_credentials" }, 401, null, request);

        // Prüfen, ob das Gerät bereits als vertrauenswürdig hinterlegt ist
        const clientIp = request.headers.get("CF-Connecting-IP") || "";
        let isDeviceTrusted = false;

        if (deviceId && KV) {
          try {
            const devRaw = await KV.get("trusted_device:" + user.id + ":" + deviceId);
            if (devRaw) {
              const dev = JSON.parse(devRaw);
              if (dev && dev.trusted) {
                isDeviceTrusted = true;
                // TTL um weitere 90 Tage verlängern bei erfolgreichem Login
                await KV.put("trusted_device:" + user.id + ":" + deviceId, JSON.stringify({
                  ...dev,
                  lastLoginAt: Date.now(),
                  lastIp: clientIp,
                  deviceName: deviceName || dev.deviceName || "Browser"
                }), { expirationTtl: 90 * 86400 });
              }
            }
          } catch (e) {
            console.error("trusted_device_check_err", e);
          }
        }

        if (isDeviceTrusted) {
          // Bekanntes Gerät -> Sofortiger Login ohne 2FA!
          const token = await signJwt(env, { sub: user.id, email: user.email });
          return json({ ok: true, token, trustedDevice: true }, 200, null, request);
        }

        // Neues / Unbekanntes Gerät -> 2FA Code generieren & versenden
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const tempToken = cryptoRandomId(32);
        const fallbackDeviceId = deviceId || cryptoRandomId(20);

        if (KV) {
          await KV.put("2fa_otp:" + tempToken, JSON.stringify({
            userId: user.id,
            email: user.email,
            code: otpCode,
            deviceId: fallbackDeviceId,
            deviceName,
            attempts: 0,
            createdAt: Date.now()
          }), { expirationTtl: 600 });
        }

        // E-Mail per Resend senden
        await send2FAEmail(env, user.email, otpCode, deviceName, clientIp);

        // Maskierte E-Mail für das Frontend erstellen
        const parts = user.email.split("@");
        const uName = parts[0];
        const maskedU = uName.length <= 2 ? uName[0] + "***" : uName[0] + "***" + uName[uName.length - 1];
        const maskedEmail = maskedU + "@" + (parts[1] || "");

        return json({
          ok: true,
          requires2FA: true,
          tempToken,
          emailMasked: maskedEmail,
          deviceId: fallbackDeviceId
        }, 200, null, request);
      } catch (e) {
        console.error("auth_login_failed", e);
        return json({ ok: false, error: "login_failed" }, 500, null, request);
      }
    }
    if (url.pathname === "/auth/verify-2fa" && request.method === "POST") {
      try {
        const KV = env.TENANT_KV || getKV(env);
        if (!KV) return json({ ok: false, error: "storage_unavailable" }, 500, null, request);

        const body = await request.json().catch(() => ({}));
        const tempToken = String(body.tempToken || "").trim();
        const code = String(body.code || "").trim();
        const trustDevice = body.trustDevice !== false;
        const deviceId = (body.deviceId || "").trim();
        const deviceName = (body.deviceName || "").trim().slice(0, 100) || "Browser";

        if (!tempToken || !code) {
          return json({ ok: false, error: "missing_code", message: "Bitte gib den 6-stelligen Code ein." }, 400, null, request);
        }

        const otpKey = "2fa_otp:" + tempToken;
        const otpRaw = await KV.get(otpKey);
        if (!otpRaw) {
          return json({ ok: false, error: "code_expired_or_invalid", message: "Der Code ist abgelaufen oder ungültig. Bitte fordere einen neuen an." }, 400, null, request);
        }

        let otpData;
        try {
          otpData = JSON.parse(otpRaw);
        } catch {
          return json({ ok: false, error: "invalid_session", message: "Sitzung ungültig." }, 400, null, request);
        }

        if (!otpData || !otpData.code) {
          return json({ ok: false, error: "invalid_session", message: "Sitzung ungültig." }, 400, null, request);
        }

        if ((otpData.attempts || 0) >= 5) {
          await KV.delete(otpKey);
          return json({ ok: false, error: "too_many_attempts", message: "Zu viele Fehlversuche. Bitte fordere einen neuen Code an." }, 429, null, request);
        }

        if (otpData.code !== code) {
          otpData.attempts = (otpData.attempts || 0) + 1;
          await KV.put(otpKey, JSON.stringify(otpData), { expirationTtl: 600 });
          const remaining = 5 - otpData.attempts;
          return json({ ok: false, error: "invalid_code", message: "Falscher Code. Noch " + remaining + " Versuch" + (remaining === 1 ? "" : "e") + "." }, 400, null, request);
        }

        // Code korrekt! Einmalcode sofort löschen
        await KV.delete(otpKey);

        const activeDeviceId = deviceId || otpData.deviceId;
        const clientIp = request.headers.get("CF-Connecting-IP") || "";

        if (trustDevice && activeDeviceId) {
          const devKey = "trusted_device:" + otpData.userId + ":" + activeDeviceId;
          await KV.put(devKey, JSON.stringify({
            trusted: true,
            trustedAt: Date.now(),
            lastLoginAt: Date.now(),
            deviceName: deviceName || otpData.deviceName || "Browser",
            lastIp: clientIp
          }), { expirationTtl: 90 * 86400 }); // 90 Tage
        }

        const token = await signJwt(env, { sub: otpData.userId, email: otpData.email });
        return json({ ok: true, token, deviceId: activeDeviceId }, 200, null, request);
      } catch (e) {
        console.error("auth_verify_2fa_failed", e);
        return json({ ok: false, error: "verify_failed", message: "Verifizierung fehlgeschlagen: " + e.message }, 500, null, request);
      }
    }
    if (url.pathname === "/auth/resend-2fa" && request.method === "POST") {
      try {
        const KV = env.TENANT_KV || getKV(env);
        if (!KV) return json({ ok: false, error: "storage_unavailable" }, 500, null, request);

        const body = await request.json().catch(() => ({}));
        const tempToken = String(body.tempToken || "").trim();
        if (!tempToken) return json({ ok: false, error: "missing_token" }, 400, null, request);

        const otpKey = "2fa_otp:" + tempToken;
        const otpRaw = await KV.get(otpKey);
        if (!otpRaw) {
          return json({ ok: false, error: "session_expired", message: "Sitzung abgelaufen. Bitte erneut einloggen." }, 400, null, request);
        }

        const otpData = JSON.parse(otpRaw);
        const now = Date.now();
        if (otpData.lastResentAt && (now - otpData.lastResentAt < 30000)) {
          const waitSec = Math.ceil((30000 - (now - otpData.lastResentAt)) / 1000);
          return json({ ok: false, error: "please_wait", message: "Bitte warte noch " + waitSec + " Sekunden." }, 429, null, request);
        }

        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        otpData.code = newCode;
        otpData.attempts = 0;
        otpData.lastResentAt = now;

        await KV.put(otpKey, JSON.stringify(otpData), { expirationTtl: 600 });

        const clientIp = request.headers.get("CF-Connecting-IP") || "";
        await send2FAEmail(env, otpData.email, newCode, otpData.deviceName, clientIp);

        return json({ ok: true, message: "Neuer Code wurde per E-Mail versendet." }, 200, null, request);
      } catch (e) {
        console.error("auth_resend_2fa_failed", e);
        return json({ ok: false, error: "resend_failed", message: "Fehler beim erneuten Senden: " + e.message }, 500, null, request);
      }
    }
    if (url.pathname === "/auth/me" && request.method === "GET") {
      try {
        const AUTH_DB = requireAuthDb(env);
        const token = getBearer(request);
        if (!token) return json({ ok: false, error: "missing_token" }, 401, null, request);
        const payload = await verifyJwt(env, token);
        if (!payload || !payload.sub) return json({ ok: false, error: "invalid_token" }, 401, null, request);
        const user = await AUTH_DB.prepare("SELECT id, email, verified, plan_type, billing_url, created_at FROM users WHERE id=?").bind(payload.sub).first();
        if (!user) return json({ ok: false, error: "user_not_found" }, 404, null, request);
        return json({ ok: true, user: {
          id: user.id,
          email: user.email,
          verified: !!Number(user.verified),
          planType: user.plan_type || "free",
          billingUrl: user.billing_url || ""
          // NEU: Ans Frontend schicken
        } }, 200, null, request);
      } catch (e) {
        console.error("auth_me_failed", e);
        return json({ ok: false, error: "me_failed" }, 500, null, request);
      }
    }
    async function requireUser(request2, env2) {
      const token = getBearer(request2);
      if (!token) throw new Error("missing_token");
      const payload = await verifyJwt(env2, token);
      if (!payload || !payload.sub) throw new Error("invalid_token");
      return payload;
    }
    __name(requireUser, "requireUser");
    if (url.pathname === "/auth/forgot-password" && request.method === "POST") {
      try {
        const AUTH_DB = requireAuthDb(env);
        const body = await request.json().catch(() => ({}));
        const email = normEmail(body.email || "");
        if (!isEmail(email)) return json({ ok: false, error: "Ung\xFCltige E-Mail" }, 400, null, request);
        const user = await AUTH_DB.prepare("SELECT id FROM users WHERE email=?").bind(email).first();
        if (user) {
          const token = crypto.randomUUID().replace(/-/g, "");
          const expiresAt = Date.now() + 1e3 * 60 * 60;
          await AUTH_DB.prepare(`
        INSERT INTO email_tokens (token, user_id, expires_at, created_at, purpose)
        VALUES (?, ?, ?, ?, 'reset')
      `).bind(token, user.id, expiresAt, Date.now()).run();
          const resetUrl = `https://scholz-friese-chatbot.de/?reset_token=${encodeURIComponent(token)}#login`;
          await sendResetEmail(env, email, resetUrl);
        }
        return json({ ok: true, message: "Falls die E-Mail existiert, wurde ein Link versendet." }, 200, null, request);
      } catch (e) {
        console.error("forgot_password_failed", e);
        return json({ ok: false, error: "Fehler: " + e.message }, 500, null, request);
      }
    }
    if (url.pathname === "/auth/reset-password" && request.method === "POST") {
      try {
        const AUTH_DB = requireAuthDb(env);
        const body = await request.json().catch(() => ({}));
        const token = (body.token || "").trim();
        const newPassword = String(body.password || "").trim();
        if (!token) return json({ ok: false, error: "Fehlendes Token" }, 400, null, request);
        if (newPassword.length < 8) return json({ ok: false, error: "Passwort muss mind. 8 Zeichen lang sein." }, 400, null, request);
        const row = await AUTH_DB.prepare(`
      SELECT user_id, expires_at FROM email_tokens WHERE token=? AND purpose='reset' LIMIT 1
    `).bind(token).first();
        if (!row) return json({ ok: false, error: "Der Link ist ung\xFCltig oder wurde bereits benutzt." }, 400, null, request);
        if (Date.now() > Number(row.expires_at || 0)) return json({ ok: false, error: "Der Link ist abgelaufen." }, 400, null, request);
        const newIterations = 1e5;
        const newSaltArray = new Uint8Array(16);
        crypto.getRandomValues(newSaltArray);
        const newSaltHex = [...newSaltArray].map((b) => b.toString(16).padStart(2, "0")).join("");
        const newHash = await pbkdf2HashWithIterations(newPassword, newSaltHex, newIterations);
        await AUTH_DB.prepare("UPDATE users SET pw_hash=?, pw_salt=?, pw_iter=? WHERE id=?").bind(newHash, newSaltHex, newIterations, row.user_id).run();
        await AUTH_DB.prepare("DELETE FROM email_tokens WHERE token=?").bind(token).run();
        return json({ ok: true, message: "Passwort erfolgreich ge\xE4ndert." }, 200, null, request);
      } catch (e) {
        console.error("forgot_password_failed", e);
        return json({ ok: false, error: "Fehler: " + e.message }, 500, null, request);
      }
    }
    if (url.pathname === "/auth/change-password" && request.method === "POST") {
      try {
        const AUTH_DB = requireAuthDb(env);
        const payload = await requireUser(request, env);
        const userId = payload.sub;
        const body = await request.json().catch(() => ({}));
        const currentPassword = String(body.currentPassword || "").trim();
        const newPassword = String(body.newPassword || "").trim();
        if (!currentPassword || !newPassword) {
          return json({ ok: false, error: "Bitte f\xFClle beide Felder aus." }, 400, null, request);
        }
        if (newPassword.length < 8) {
          return json({ ok: false, error: "Das neue Passwort muss mindestens 8 Zeichen lang sein." }, 400, null, request);
        }
        const user = await AUTH_DB.prepare(
          "SELECT id, email, pw_hash, pw_salt, pw_iter FROM users WHERE id=?"
        ).bind(userId).first();
        if (!user) return json({ ok: false, error: "Benutzer nicht gefunden." }, 404, null, request);
        let iterations = Number(user.pw_iter || 1e5);
        if (!Number.isFinite(iterations) || iterations < 1e3) iterations = 1e5;
        if (iterations > 1e5) iterations = 1e5;
        const salt = String(user.pw_salt || "");
        const hash = String(user.pw_hash || "");
        const testHash = await pbkdf2HashWithIterations(currentPassword, salt, iterations);
        if (testHash !== hash) {
          return json({ ok: false, error: "Das aktuelle Passwort ist falsch." }, 400, null, request);
        }
        const newIterations = 1e5;
        const newSaltArray = new Uint8Array(16);
        crypto.getRandomValues(newSaltArray);
        const newSaltHex = [...newSaltArray].map((b) => b.toString(16).padStart(2, "0")).join("");
        const newHash = await pbkdf2HashWithIterations(newPassword, newSaltHex, newIterations);
        await AUTH_DB.prepare(
          "UPDATE users SET pw_hash=?, pw_salt=?, pw_iter=? WHERE id=?"
        ).bind(newHash, newSaltHex, newIterations, userId).run();
        return json({ ok: true, message: "Passwort erfolgreich ge\xE4ndert" }, 200, null, request);
      } catch (err) {
        console.error("auth_change_password_failed", err);
        const errorMessage = err.message === "invalid_token" || err.message === "missing_token" ? "Sitzung abgelaufen. Bitte neu einloggen." : err.message;
        return json({ ok: false, error: errorMessage }, err.message.includes("token") ? 401 : 500, null, request);
      }
    }
    if (url.pathname === "/register" && request.method === "POST") {
      try {
        let user;
        try {
          user = await requireUser(request, env);
        } catch {
          return json({ ok: false, error: "unauthorized" }, 401, null, request);
        }
        const userId = user.sub;
        if (!userId) return json({ ok: false, error: "missing_user" }, 401, null, request);
        let body = {};
        try {
          body = await request.json();
        } catch {
          const t = await request.text().catch(() => "");
          try {
            body = JSON.parse(t || "{}");
          } catch {
            body = {};
          }
        }
        const KV = env.TENANT_KV || getKV(env);
        if (!KV) throw new Error("TENANT_KV missing");
        const tenantIdFromBody = (body.tenantId || "").toString().trim();
        const companyName = (body.companyName || "").toString().trim();
        const websiteUrl = (body.websiteUrl || "").toString().trim();
        const notifyEmail = (body.notifyEmail || "").toString().trim();
        const notifyName = (body.notifyName || companyName || "").toString().trim();
        const industry = (body.industry || "").toString().trim();
        const language = (body.language || "de").toString().trim().toLowerCase();
        const knowledgeText = (body.knowledgeText || "").toString().trim();
        const botName = (body.botName || "").toString().trim();
        const botModules = Array.isArray(body.botModules) ? body.botModules : ["lead"];
        const productLinks = Array.isArray(body.productLinks) ? body.productLinks : [];
        const roomCategories = typeof body.roomCategories === "object" ? body.roomCategories : {};
        const trackingEnabled = !!body.trackingEnabled;
        const chatEnabled = body.chatEnabled !== false;
        const cookieBannerEnabled = !!body.cookieBannerEnabled;
        const googleAnalyticsId = (body.googleAnalyticsId || "").toString().trim();
        const metaPixelId = (body.metaPixelId || "").toString().trim();
        const phone = (body.phone || "").toString().trim();
        const publicEmail = (body.publicEmail || "").toString().trim();
        const openingHours = (body.openingHours || "").toString().trim();
        const address = {
          street: (body.address && body.address.street || "").toString().trim(),
          postalCode: (body.address && body.address.postalCode || "").toString().trim(),
          city: (body.address && body.address.city || "").toString().trim(),
          country: (body.address && body.address.country || "").toString().trim()
        };
        const mapsUrl = (body.mapsUrl || body.googleMapsUrl || "").toString().trim();
        const areaServed = Array.isArray(body.areaServed) ? body.areaServed : (typeof body.areaServed === "string" ? body.areaServed.split(",").map(s => s.trim()).filter(Boolean) : []);
        const geo = (body.geo && typeof body.geo === "object") ? body.geo : {};
        const socialLinks = {
          facebook: (body.socialLinks && body.socialLinks.facebook || "").toString().trim(),
          instagram: (body.socialLinks && body.socialLinks.instagram || "").toString().trim(),
          tiktok: (body.socialLinks && body.socialLinks.tiktok || "").toString().trim(),
          youtube: (body.socialLinks && body.socialLinks.youtube || "").toString().trim(),
          linkedin: (body.socialLinks && body.socialLinks.linkedin || "").toString().trim(),
          x: (body.socialLinks && body.socialLinks.x || "").toString().trim(),
          other: (body.socialLinks && body.socialLinks.other || "").toString().trim()
        };
        if (!companyName || !notifyEmail) {
          return json({ ok: false, error: "companyName_and_notifyEmail_required" }, 400, null, request);
        }
        let tenantId = tenantIdFromBody;
        let existingTenant = null;
        if (tenantId) {
          try {
            existingTenant = await assertTenantOwner(env, tenantId, userId);
          } catch (err) {
            if (err.message === "tenant_not_found") {
              existingTenant = null;
            } else {
              throw err;
            }
          }
        } else {
          const baseId = slugify(companyName || "bot");
          tenantId = baseId + "-" + cryptoRandomId(4);
        }
        const avatarMeta = await KV.get(AVATAR_KV_PREFIX + tenantId);
        const effectiveAvatarUrl = avatarMeta ? "/avatar/" + tenantId : "";
        const effectiveLogoUrl = "/logo/" + tenantId;
        const tenant = {
          id: tenantId,
          ownerUserId: userId,
          companyName,
          websiteUrl,
          notifyEmail,
          notifyName,
          industry,
          language,
          knowledgeText,
          botName,
          avatarUrl: effectiveAvatarUrl,
          logoUrl: effectiveLogoUrl,
          phone,
          publicEmail,
          openingHours,
          address,
          socialLinks,
          mapsUrl,
          areaServed,
          geo,
          chatEnabled,
          trackingEnabled,
          cookieBannerEnabled,
          googleAnalyticsId,
          metaPixelId,
          // === NEU: Mit abspeichern ===
          botModules,
          productLinks,
          roomCategories
        };
        await KV.put("tenant:" + tenantId, JSON.stringify(tenant));
        ctx.waitUntil(regenerateTenantProfile(env, tenant));
        const origin = url.origin;
        const iframeCode = `<script src="${origin}/embed.js" data-tenant-id="${tenantId}" defer><\/script>`;
        return json({
          ok: true,
          mode: existingTenant ? "updated" : "created",
          tenantId,
          iframeCode,
          // ✅ Dashboard erwartet das
          embedCode: iframeCode,
          // ✅ optional: alias (falls du es woanders nutzt)
          trackingEnabled
        }, 200, null, request);
      } catch (e) {
        console.error("register_failed", e);
        const msg = String(e && (e.message || e));
        if (/forbidden_not_owner/.test(msg)) {
          return json({ ok: false, error: "forbidden" }, 403, null, request);
        }
        return json({ ok: false, error: "register_failed", details: msg }, 500, null, request);
      }
    }
    if (url.pathname === "/chat" && request.method === "POST") {
      try {
        let body = {};
        try {
          body = await request.json();
        } catch {
          const t = await request.text().catch(() => "");
          try {
            body = JSON.parse(t || "{}");
          } catch {
            body = {};
          }
        }
        const tenantId = (body.tenantId || body.tenant || "").toString().trim();
        const userMsg = (body.message || "").toString().trim();
        const page = (body.page || "").toString().slice(0, 512);
        if (!tenantId) return json({ error: "missing tenantId" }, 400, void 0, request);
        if (!userMsg) return json({ error: "missing message" }, 400, void 0, request);
        const tenant = await loadTenant(env, tenantId);
        const profile = await ensureTenantProfile(env, tenant);
        const sidInfo = getOrCreateSidFrom(request);
        const sid = sidInfo.sid;
        const setCookieHeader = sidInfo.setCookieHeader;
        const state = await loadState(env, tenantId, sid);
        state.lang = tenant.language || state.lang || "de";
        let planType = "free";
        if (env.AUTH_DB && tenant.ownerUserId) {
          try {
            const uRow = await env.AUTH_DB.prepare("SELECT plan_type, email FROM users WHERE id=?").bind(tenant.ownerUserId).first();
            if (uRow) {
              planType = uRow.plan_type || "free";
              if (uRow.email === "friese.scholz@gmail.com") planType = "admin";
            }
          } catch (e) {
          }
        }
        if (planType === "free") {
          return json({ answer: "Dieser Chatbot ist aktuell inaktiv (Free Plan)." }, 200, void 0, request);
        }
        if (planType === "pro" && env.ANALYTICS_DB) {
          try {
            const currentMonth = isoMonth(Date.now());
            const countRow = await env.ANALYTICS_DB.prepare(
              "SELECT COUNT(*) as c FROM chat_events WHERE tenant_id=? AND role='assistant' AND day LIKE ?"
            ).bind(tenantId, currentMonth + "%").first();
            const msgCount = countRow ? Number(countRow.c) : 0;
            if (msgCount >= 1e4) {
              return json({ answer: "Das monatliche Nachrichten-Limit f\xFCr diesen Chatbot wurde erreicht." }, 200, void 0, request);
            }
          } catch (e) {
          }
        }
        pushHistory(state, "user", userMsg);
        const parsed = parseFields(userMsg);
        const modules = tenant.botModules || [];
        const isReservation = modules.includes("table") || modules.includes("room");
        const hasEmail = !!parsed.email;
        const hasPhone = !!parsed.phone;
        if (hasEmail || hasPhone && !isReservation) {
          const status = await submitContact(env, tenant, parsed, page, state.history, url.origin);
          const answer = state.lang === "en" ? status === "ok" ? "Thank you! I have received your details and passed them on. We will contact you at " + (parsed.email || parsed.phone) + "." : "I've noted your details. Please contact us if you don't hear back soon." : status === "ok" ? "Perfekt, danke! Ich habe deine Daten (Kontakt: " + (parsed.email || parsed.phone) + ") aufgenommen und soeben weitergeleitet. Wir melden uns zeitnah bei dir!" : "Ich habe deine Angaben aufgenommen. Falls etwas nicht ankommt, melde dich bitte direkt \xFCber die Website bei uns.";
          pushHistory(state, "assistant", answer);
          await saveState(env, tenantId, sid, state);
          return json({ answer }, 200, setCookieHeader ? { "Set-Cookie": setCookieHeader } : void 0, request);
        }
        let answerText = matchFaqAnswer(profile, userMsg);
        if (!answerText) {
          answerText = await chatAnswerWithAI(env, tenant, profile, state, userMsg, page);
        }
        pushHistory(state, "assistant", answerText);
        await saveState(env, tenantId, sid, state);
        if (env.ANALYTICS_DB) {
          try {
            const nowMs = Date.now();
            const todayStr = isoDay(nowMs);
            await env.ANALYTICS_DB.prepare(
              `INSERT INTO chat_events (id, tenant_id, ts, role, day) VALUES (?, ?, ?, ?, ?)`
            ).bind(cryptoRandomId(16), tenantId, nowMs, "user", todayStr).run();
            await env.ANALYTICS_DB.prepare(
              `INSERT INTO chat_events (id, tenant_id, ts, role, day) VALUES (?, ?, ?, ?, ?)`
            ).bind(cryptoRandomId(16) + "b", tenantId, nowMs + 1, "assistant", todayStr).run();
          } catch (err) {
            console.error("db_chat_track_error", err);
          }
        }
        return json(
          { answer: answerText },
          200,
          setCookieHeader ? { "Set-Cookie": setCookieHeader } : void 0,
          request
        );
      } catch (e) {
        console.error("chat_error", e);
        const fallback = "Da ist gerade etwas schiefgelaufen. Bitte formuliere deine Frage kurz neu oder versuche es gleich noch einmal.";
        return json({ answer: fallback }, 200, void 0, request);
      }
    }
    if (url.pathname === "/public-config" && request.method === "GET") {
      try {
        const tenantId = (url.searchParams.get("tenantId") || "").trim();
        if (!tenantId) {
          return json({ ok: false, error: "missing_tenantId" }, 400, null, request);
        }
        const tenant = await loadTenant(env, tenantId);
        const profile = await ensureTenantProfile(env, tenant);
        let planType = "free";
        let isPremium = false;
        if (env.AUTH_DB && tenant.ownerUserId) {
          try {
            const userRow = await env.AUTH_DB.prepare("SELECT plan_type, email FROM users WHERE id=?").bind(tenant.ownerUserId).first();
            if (userRow) {
              planType = userRow.plan_type || "free";
              if (userRow.email === "friese.scholz@gmail.com") {
                planType = "admin";
              }
            }
            if (planType === "pro" || planType === "unlimited" || planType === "admin") {
              isPremium = true;
            }
          } catch (e) {
            console.error("Premium check failed", e);
          }
        }
        const effectiveChatEnabled = isPremium ? tenant.chatEnabled !== false : false;
        const origin = url.origin;
        let avatarPath = tenant.avatarUrl || "";
        if (!avatarPath) avatarPath = "/avatar/" + tenantId;
        try {
          const KV = env.TENANT_KV || getKV(env);
          const metaRaw = await KV.get(AVATAR_KV_PREFIX + tenantId);
          const meta = metaRaw ? JSON.parse(metaRaw) : null;
          if (meta && meta.v && avatarPath.startsWith("/avatar/") && !avatarPath.includes("?v=")) {
            avatarPath += "?v=" + meta.v;
          }
        } catch (e) {
        }
        const avatarAbs = avatarPath.startsWith("http") ? avatarPath : origin + avatarPath;
        let dynamicStructuredData = profile.seo?.structuredData || "";
        try {
          if (dynamicStructuredData) {
            let parsed = JSON.parse(dynamicStructuredData);
            let graph = parsed["@graph"] || (Array.isArray(parsed) ? parsed : [parsed]);
            let bNode = graph.find(n => n && typeof n === "object" && (n["@type"] === "LocalBusiness" || (typeof n["@type"] === "string" && n["@type"].endsWith("Business")) || (n["@id"] && n["@id"].includes("#organization"))));
            if (!bNode && graph.length > 0 && typeof graph[0] === "object") bNode = graph[0];
            if (bNode) {
              let changed = false;
              let mapL = (tenant.mapsUrl || tenant.googleMapsUrl || "").toString().trim();
              if (mapL && !bNode.hasMap) {
                bNode.hasMap = mapL;
                bNode.sameAs = bNode.sameAs || [];
                if (!bNode.sameAs.includes(mapL)) bNode.sameAs.push(mapL);
                changed = true;
              }
              let lat = tenant.geo?.latitude || tenant.latitude;
              let lng = tenant.geo?.longitude || tenant.longitude;
              if (lat && lng && !bNode.geo && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
                bNode.geo = {
                  "@type": "GeoCoordinates",
                  "latitude": Number(lat),
                  "longitude": Number(lng)
                };
                changed = true;
              }
              if (!bNode.areaServed) {
                let areas = [];
                if (Array.isArray(tenant.areaServed) && tenant.areaServed.length > 0) {
                  areas = tenant.areaServed;
                } else if (typeof tenant.areaServed === "string" && tenant.areaServed.trim()) {
                  areas = tenant.areaServed.split(",").map(s => s.trim()).filter(Boolean);
                } else if (tenant.address?.city) {
                  areas = [tenant.address.city.trim()];
                }
                if (areas.length > 0) {
                  bNode.areaServed = areas.map(name => ({
                    "@type": "AdministrativeArea",
                    "name": String(name).trim()
                  }));
                  changed = true;
                }
              }
              if (changed) {
                dynamicStructuredData = JSON.stringify(parsed);
              }
            }
          }
        } catch(e) {}

        if (!dynamicStructuredData && tenant.companyName) {
          try {
            let areas = [];
            if (Array.isArray(tenant.areaServed) && tenant.areaServed.length > 0) {
              areas = tenant.areaServed;
            } else if (typeof tenant.areaServed === "string" && tenant.areaServed.trim()) {
              areas = tenant.areaServed.split(",").map(s => s.trim()).filter(Boolean);
            } else if (tenant.address?.city) {
              areas = [tenant.address.city.trim()];
            }
            let mapL = (tenant.mapsUrl || tenant.googleMapsUrl || "").toString().trim();
            let lat = tenant.geo?.latitude || tenant.latitude;
            let lng = tenant.geo?.longitude || tenant.longitude;
            let siteUrl = tenant.websiteUrl ? tenant.websiteUrl.replace(/\/+$/, "") : "";

            let lb = {
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "@id": (siteUrl || origin) + "/#organization",
              "name": tenant.companyName,
              "url": siteUrl || "",
              "inLanguage": "de-DE",
              "telephone": tenant.phone || "",
              "image": avatarAbs,
              "address": {
                "@type": "PostalAddress",
                "streetAddress": tenant.address?.street || "",
                "postalCode": tenant.address?.postalCode || "",
                "addressLocality": tenant.address?.city || "",
                "addressCountry": tenant.address?.country || "DE"
              }
            };
            if (mapL) {
              lb.hasMap = mapL;
              lb.sameAs = [mapL];
            }
            if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
              lb.geo = {
                "@type": "GeoCoordinates",
                "latitude": Number(lat),
                "longitude": Number(lng)
              };
            }
            if (areas.length > 0) {
              lb.areaServed = areas.map(name => ({
                "@type": "AdministrativeArea",
                "name": String(name).trim()
              }));
            }
            dynamicStructuredData = JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [lb]
            });
          } catch(e) {}
        }

        return json({
          ok: true,
          tenantId: tenant.id,
          botName: tenant.botName || "Chatbot",
          companyName: tenant.companyName || "",
          avatarUrl: avatarAbs,
          chatEnabled: tenant.chatEnabled !== false,
          trackingEnabled: !!tenant.trackingEnabled,
          cookieBannerEnabled: !!tenant.cookieBannerEnabled,
          googleAnalyticsId: tenant.googleAnalyticsId || "",
          metaPixelId: tenant.metaPixelId || "",
          pageTitle: profile.seo?.pageTitle || "",
          metaDescription: profile.seo?.metaDescription || "",
          ogTitle: profile.seo?.ogTitle || profile.seo?.pageTitle || "",
          ogDescription: profile.seo?.ogDescription || profile.seo?.metaDescription || "",
          canonicalUrl: profile.seo?.canonicalUrl || tenant.websiteUrl || "",
          structuredData: dynamicStructuredData,
          mapsUrl: tenant.mapsUrl || tenant.googleMapsUrl || "",
          areaServed: tenant.areaServed || (tenant.address?.city ? [tenant.address.city] : []),
          geo: tenant.geo || {},
          addressLocality: tenant.address?.city || ""
        }, 200, null, request);
      } catch (e) {
        console.error("public_config_error", e);
        return json({ ok: false, error: "public_config_failed" }, 500, null, request);
      }
    }
    if (url.pathname === "/dashboard" || url.pathname === "/dashboard/") {
      return Response.redirect("https://scholz-friese-chatbot.de/dashboard/", 302);
    }
    if (url.pathname === "/embed.js" && request.method === "GET") {
      const js = `;(function(){
    var s = document.currentScript;
    var TENANT_ID = (s && (s.getAttribute("data-tenant-id") || s.getAttribute("data-tenant"))) || "";
    if (!TENANT_ID) return;

    // Safe localStorage helpers (Top-Level Scope)
    function getConsent() {
      try {
        return localStorage.getItem("sf_cookie_consent_" + TENANT_ID);
      } catch(e) {
        return null;
      }
    }
    function setConsent(val) {
      try {
        localStorage.setItem("sf_cookie_consent_" + TENANT_ID, val);
      } catch(e) {}
    }

    var ORIGIN = ${JSON.stringify(url.origin)};
    function el(t){ return document.createElement(t); }

    // Hilfsfunktion: Wartet sicher, bis der Body vom Browser geladen wurde
    function withBody(fn) {
      if (document.body) return fn();
      var iter = 0;
      var inv = setInterval(function() {
        if (document.body || iter > 100) {
          clearInterval(inv);
          if (document.body) fn();
        }
        iter++;
      }, 50);
    }

    async function fetchCfg(){
      try {
        var r = await fetch(ORIGIN + "/public-config?tenantId=" + encodeURIComponent(TENANT_ID), { cache:"no-store" });
        var j = await r.json();
        if (j && j.ok) return j;
      } catch(e){}
      return { ok:false };
    }

    // --- MAIN INIT ---
    (async function init(){
      if (window.__SF_CHAT_LOADED__) return;
      window.__SF_CHAT_LOADED__ = true;

      var cfg = await fetchCfg();
      if (!cfg.ok) return;

      // 1. Dein eigenes Tracking definieren
      var loadTracking = function() {
        if (!cfg.trackingEnabled) return;
        var sc = el("script");
        sc.src = ORIGIN + "/track.js";
        sc.defer = true;
        sc.setAttribute("data-tenant-id", TENANT_ID);
        (document.head||document.documentElement).appendChild(sc);
      };
      loadTracking();

      // --- NEUE FUNKTION: Google Analytics Injector ---
      // Google Consent Mode v2 Initialisierung (VOR GTAG)
      function initConsentMode() {
        window.dataLayer = window.dataLayer || [];
        function gtag(){ dataLayer.push(arguments); }
        window.gtag = window.gtag || gtag;

        var consent = getConsent();
        var isAccepted = (consent === "accepted");

        gtag("consent", "default", {
          "ad_storage": isAccepted ? "granted" : "denied",
          "analytics_storage": isAccepted ? "granted" : "denied",
          "ad_user_data": isAccepted ? "granted" : "denied",
          "ad_personalization": isAccepted ? "granted" : "denied"
        });
      }
      initConsentMode();

      function injectGoogleAnalytics(gaId) {
        if (!gaId || window.__GA_LOADED__) return;
        window.__GA_LOADED__ = true;
        
        // Google Tag Manager Script einf\xFCgen
        var s1 = el("script");
        s1.async = true;
        s1.src = "https://www.googletagmanager.com/gtag/js?id=" + gaId;
        document.head.appendChild(s1);

        // Google Analytics Config initialisieren
        var s2 = el("script");
        var cleanGaId = String(gaId).trim().replace(/[^a-zA-Z0-9\-_]/g, '');
        s2.textContent = "window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '" + cleanGaId + "', { 'anonymize_ip': true });";
        document.head.appendChild(s2);
      }

      function injectMetaPixel(pixelId) {
  if (!pixelId || window.__META_PIXEL_LOADED__) return;
  window.__META_PIXEL_LOADED__ = true;

  var cleanId = String(pixelId).trim();

  var s = el("script");
  s.textContent =
    "!function(f,b,e,v,n,t,s){" +
    "if(f.fbq)return;n=f.fbq=function(){n.callMethod?" +
    "n.callMethod.apply(n,arguments):n.queue.push(arguments)};" +
    "if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';" +
    "n.queue=[];t=b.createElement(e);t.async=!0;" +
    "t.src=v;s=b.getElementsByTagName(e)[0];" +
    "s.parentNode.insertBefore(t,s)" +
    "}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');" +
    "fbq('init', '" + cleanId.replace(/[^0-9]/g, "") + "');" +
    "fbq('track', 'PageView');";

  document.head.appendChild(s);

  var noscript = el("noscript");
  noscript.innerHTML =
    '<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=' +
    cleanId.replace(/[^0-9]/g, "") +
    '&ev=PageView&noscript=1" />';
  document.body.appendChild(noscript);
}

// 2. Cookie Banner prüfen & Marketing Scripte
if (cfg.cookieBannerEnabled) {
    var consent = getConsent();

    function loadMarketingScripts() {
        if (cfg.googleAnalyticsId) injectGoogleAnalytics(cfg.googleAnalyticsId);
        if (cfg.metaPixelId) injectMetaPixel(cfg.metaPixelId);
    }

    window.sfOpenCookieBanner = function() {
        renderCookieBanner(cfg, loadMarketingScripts);
    };

    if (!consent) {
        withBody(function() {
            renderCookieBanner(cfg, loadMarketingScripts);
        });
    } else {
        if (consent === "accepted") {
            loadMarketingScripts();
        }
        withBody(function() {
            renderLockBtn(cfg, loadMarketingScripts);
        });
    }
} else {
    // Wenn kein Cookie-Banner aktiv ist, Skripte sofort laden
    if (cfg.googleAnalyticsId) injectGoogleAnalytics(cfg.googleAnalyticsId);
    if (cfg.metaPixelId) injectMetaPixel(cfg.metaPixelId);
}
      function repairLdJsonScript(scriptEl, defaultUrl) {
        if (!scriptEl || scriptEl.type !== "application/ld+json" || !scriptEl.textContent) return;
        try {
          var data = JSON.parse(scriptEl.textContent);
          if (!data) return;
          var modified = false;

          function fixNode(node) {
            if (!node || typeof node !== "object") return;
            if (Array.isArray(node)) {
              for (var i = 0; i < node.length; i++) fixNode(node[i]);
              return;
            }
            var t = node["@type"] || node.type || "";
            if (t === "Product" || (Array.isArray(t) && t.indexOf("Product") !== -1)) {
              // 1. Auto-repair missing or empty image property
              if (!node.image || (Array.isArray(node.image) && (node.image.length === 0 || !node.image[0])) || node.image === "") {
                var defaultImg = (cfg && (cfg.avatarUrl || cfg.logoUrl)) ? (cfg.avatarUrl || cfg.logoUrl) : "";
                if (defaultImg) {
                  node.image = [defaultImg];
                  modified = true;
                }
              }

              // 2. Auto-repair missing or incomplete offers property
              if (!node.offers || typeof node.offers !== "object") {
                node.offers = {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "EUR",
                  "availability": "https://schema.org/InStock",
                  "itemCondition": "https://schema.org/NewCondition"
                };
                if (node.url) node.offers.url = node.url;
                else if (defaultUrl) node.offers.url = defaultUrl;
                modified = true;
              } else {
                if (node.offers && typeof node.offers === "object" && !node.offers.price && !node.offers.priceSpecification && !node.offers.highPrice) {
                  node.offers.price = "0";
                  modified = true;
                }
              }
            }
            for (var k in node) {
              if (Object.prototype.hasOwnProperty.call(node, k) && typeof node[k] === "object" && node[k] !== null) {
                fixNode(node[k]);
              }
            }
          }

          fixNode(data);

          if (modified) {
            scriptEl.textContent = JSON.stringify(data);
          }
        } catch(e){}
      }

      function scanAndFixAllLdJson() {
        if (typeof document === "undefined") return;
        var scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (var i = 0; i < scripts.length; i++) {
          repairLdJsonScript(scripts[i], location.href);
        }
      }

      scanAndFixAllLdJson();

      if (typeof MutationObserver !== "undefined" && typeof document !== "undefined" && document.head) {
        try {
          var ldObserver = new MutationObserver(function(mutations) {
            for (var m = 0; m < mutations.length; m++) {
              var added = mutations[m].addedNodes;
              if (!added) continue;
              for (var n = 0; n < added.length; n++) {
                var node = added[n];
                if (node.nodeType === 1) {
                  if (node.tagName === "SCRIPT" && node.type === "application/ld+json") {
                    repairLdJsonScript(node, location.href);
                  } else if (node.querySelectorAll) {
                    var sub = node.querySelectorAll('script[type="application/ld+json"]');
                    for (var s = 0; s < sub.length; s++) repairLdJsonScript(sub[s], location.href);
                  }
                }
              }
            }
          });
          ldObserver.observe(document.head, { childList: true, subtree: true });
          if (document.body) ldObserver.observe(document.body, { childList: true, subtree: true });
        } catch(e){}
      }

      // 3. SEO Injektion (Title, Description, Canonical, OG Tags & Structured Data)
      if (typeof document !== "undefined" && document.head) {
        try {
          // a) Structured Data (Schema.org JSON-LD)
          if (cfg.structuredData && !document.getElementById("sf-structured-data")) {
            var rawLd = cfg.structuredData;
            try {
              var parsedLd = JSON.parse(rawLd);
              if (parsedLd) {
                repairLdJsonScript({ textContent: rawLd, type: "application/ld+json" }, location.href);
              }
            } catch(err){}

            var ld = el("script");
            ld.id = "sf-structured-data";
            ld.type = "application/ld+json";
            ld.textContent = rawLd;
            document.head.appendChild(ld);
          }

          // b) Title (nur wenn auf der Elternseite komplett leer)
          if (cfg.pageTitle && (!document.title || document.title.trim() === "")) {
            document.title = cfg.pageTitle;
          }

          // c) Meta Description (nur wenn auf der Elternseite noch KEINE vorhanden ist)
          if (cfg.metaDescription && !document.querySelector('meta[name="description"]')) {
            var mDesc = el("meta");
            mDesc.name = "description";
            mDesc.content = cfg.metaDescription;
            document.head.appendChild(mDesc);
          }

          // d) Canonical Link (nur wenn auf der Elternseite noch KEIN canonical existiert)
          if (cfg.canonicalUrl && !document.querySelector('link[rel="canonical"]')) {
            var cLink = el("link");
            cLink.rel = "canonical";
            cLink.href = cfg.canonicalUrl;
            document.head.appendChild(cLink);
          }

          // e) Open Graph (og:title, og:description, og:image)
          if (cfg.ogTitle && !document.querySelector('meta[property="og:title"]')) {
            var ogT = el("meta");
            ogT.setAttribute("property", "og:title");
            ogT.content = cfg.ogTitle;
            document.head.appendChild(ogT);
          }
          if (cfg.ogDescription && !document.querySelector('meta[property="og:description"]')) {
            var ogD = el("meta");
            ogD.setAttribute("property", "og:description");
            ogD.content = cfg.ogDescription;
            document.head.appendChild(ogD);
          }
          if (cfg.avatarUrl && !document.querySelector('meta[property="og:image"]')) {
            var ogI = el("meta");
            ogI.setAttribute("property", "og:image");
            ogI.content = cfg.avatarUrl;
            document.head.appendChild(ogI);
          }

          // Geo Meta Tags (falls Koordinaten / Ort vorhanden)
          if (cfg.geo && cfg.geo.latitude && cfg.geo.longitude) {
            if (!document.querySelector('meta[name="geo.position"]')) {
              var mPos = el("meta");
              mPos.name = "geo.position";
              mPos.content = cfg.geo.latitude + ";" + cfg.geo.longitude;
              document.head.appendChild(mPos);
            }
            if (!document.querySelector('meta[name="ICBM"]')) {
              var mIcbm = el("meta");
              mIcbm.name = "ICBM";
              mIcbm.content = cfg.geo.latitude + ", " + cfg.geo.longitude;
              document.head.appendChild(mIcbm);
            }
          }
          if (cfg.addressLocality && !document.querySelector('meta[name="geo.placename"]')) {
            var mPlace = el("meta");
            mPlace.name = "geo.placename";
            mPlace.content = cfg.addressLocality;
            document.head.appendChild(mPlace);
          }
        } catch(e){}
      }

      // 4. Chatbot laden (nur wenn aktiviert)
      if (cfg.chatEnabled !== false) {
        withBody(function() { initChatbot(cfg); });
      }
    })();


    // --- SUB-FUNKTIONEN ---

    function ensureCookieStyle() {
      if (document.getElementById("sf-cookie-style")) return;
      var style = el("style");
      style.id = "sf-cookie-style";
      style.textContent = 
        "#sf-cookie-banner { box-sizing: border-box; position: fixed; z-index: 2147483647; background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); box-shadow: 0 20px 40px -8px rgba(0,0,0,0.18), 0 0 1px rgba(0,0,0,0.12); font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; transform: translateY(120%); opacity: 0; transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease; }" +
        "#sf-cookie-banner * { box-sizing: border-box; }" +
        "#sf-cookie-banner.sf-cb-show { transform: translateY(0); opacity: 1; }" +
        ".sf-cb-header { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 15px; color: #0f172a; margin-bottom: 8px; letter-spacing: -0.01em; }" +
        ".sf-cb-text { font-size: 13px; line-height: 1.5; color: #475569; margin-bottom: 18px; }" +
        ".sf-cb-buttons { display: flex; gap: 10px; }" +
        ".sf-cb-btn { flex: 1; display: flex; align-items: center; justify-content: center; padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); outline: none; margin: 0; border: none; font-family: inherit; }" +
        ".sf-cb-btn-accept { background: #0f172a; color: #ffffff; border: 1px solid #020617; box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.12); }" +
        ".sf-cb-btn-accept:hover { background: #1e293b; transform: translateY(-1px); box-shadow: 0 8px 16px -4px rgba(15, 23, 42, 0.35); }" +
        ".sf-cb-btn-accept:active { transform: translateY(0); }" +
        ".sf-cb-btn-decline { background: #ffffff; color: #475569; border: 1px solid #cbd5e1; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }" +
        ".sf-cb-btn-decline:hover { background: #f8fafc; color: #0f172a; border-color: #94a3b8; transform: translateY(-1px); box-shadow: 0 4px 10px -2px rgba(0,0,0,0.08); }" +
        ".sf-cb-btn-decline:active { transform: translateY(0); }" +
        "@media (min-width: 600px) { #sf-cookie-banner { bottom: 24px; left: 24px; width: 360px; border-radius: 16px; border: 1px solid rgba(0,0,0,0.08); padding: 22px; } }" +
        "@media (max-width: 599px) { #sf-cookie-banner { bottom: 0; left: 0; right: 0; width: auto; border-radius: 20px 20px 0 0; padding: 22px 18px calc(20px + env(safe-area-inset-bottom)); border-top: 1px solid #e2e8f0; } .sf-cb-buttons { flex-direction: column; gap: 8px; } }" +
        /* Diskreter Schloss-Button unten links */
        "#sf-cookie-lock-btn { position: fixed; bottom: 20px; left: 20px; z-index: 2147483646; width: 38px; height: 38px; border-radius: 50%; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid rgba(15, 23, 42, 0.12); box-shadow: 0 4px 12px rgba(0,0,0,0.08); display: flex; align-items: center; justify-content: center; cursor: pointer; color: #0f172a; transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); outline: none; padding: 0; }" +
        "#sf-cookie-lock-btn:hover { transform: scale(1.08); box-shadow: 0 6px 18px rgba(0,0,0,0.12); border-color: rgba(15, 23, 42, 0.25); background: #ffffff; color: #020617; }" +
        "#sf-cookie-lock-btn:active { transform: scale(0.95); }" +
        "#sf-cookie-lock-btn.sf-lock-hidden { display: none !important; }";
      document.head.appendChild(style);
    }

    function renderLockBtn(cfg, injectGAFn) {
      if (!cfg || !cfg.cookieBannerEnabled) return;
      ensureCookieStyle();
      var btn = document.getElementById("sf-cookie-lock-btn");
      if (!btn) {
        btn = el("button");
        btn.id = "sf-cookie-lock-btn";
        btn.setAttribute("type", "button");
        btn.setAttribute("aria-label", "Cookie-Einstellungen anpassen");
        btn.setAttribute("title", "Cookie-Einstellungen");
        btn.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>';
        btn.onclick = function() {
          renderCookieBanner(cfg, injectGAFn);
        };
        document.body.appendChild(btn);
      } else {
        btn.classList.remove("sf-lock-hidden");
      }
    }

    function renderCookieBanner(cfg, injectGAFn) {
      if (!cfg || !cfg.cookieBannerEnabled) return;
      ensureCookieStyle();

      var lockBtn = document.getElementById("sf-cookie-lock-btn");
      if (lockBtn) lockBtn.classList.add("sf-lock-hidden");

      var existing = document.getElementById("sf-cookie-banner");
      if (existing) {
        existing.classList.add("sf-cb-show");
        return;
      }

      var cb = el("div");
      cb.id = "sf-cookie-banner";
      cb.innerHTML = 
        "<div class='sf-cb-header'><span style='font-size:18px;'>🍪</span> Datenschutz & Cookies</div>" +
        "<div class='sf-cb-text'>Wir verwenden Cookies, um die Nutzererfahrung zu verbessern, Zugriffe zu analysieren und unseren Service optimal bereitzustellen.</div>" +
        "<div class='sf-cb-buttons'>" +
          "<button id='sf-cb-accept' class='sf-cb-btn sf-cb-btn-accept'>Alle akzeptieren</button>" +
          "<button id='sf-cb-decline' class='sf-cb-btn sf-cb-btn-decline'>Ablehnen</button>" +
        "</div>";
      document.body.appendChild(cb);

      setTimeout(function(){
        cb.classList.add("sf-cb-show");
      }, 50);

      function dismissBanner() {
        try {
          cb.classList.remove("sf-cb-show");
        } catch(e) {}
        setTimeout(function(){
          try {
            if (cb.parentNode) {
              cb.parentNode.removeChild(cb);
            } else if (typeof cb.remove === "function") {
              cb.remove();
            }
          } catch(e) {}
          try {
            renderLockBtn(cfg, injectGAFn);
          } catch(e) {}
        }, 500);
      }

      var btnAccept = cb.querySelector("#sf-cb-accept") || document.getElementById("sf-cb-accept");
      if (btnAccept) {
        btnAccept.onclick = function(e) {
          if (e && e.preventDefault) e.preventDefault();
          try {
            setConsent("accepted");
          } catch(err) {}
          try {
            if (window.gtag) {
              window.gtag("consent", "update", {
                "ad_storage": "granted",
                "analytics_storage": "granted",
                "ad_user_data": "granted",
                "ad_personalization": "granted"
              });
            }
          } catch(err) {}
          try {
            if (typeof injectGAFn === "function") injectGAFn();
          } catch(err) {}
          dismissBanner();
        };
      }

      var btnDecline = cb.querySelector("#sf-cb-decline") || document.getElementById("sf-cb-decline");
      if (btnDecline) {
        btnDecline.onclick = function(e) {
          if (e && e.preventDefault) e.preventDefault();
          try {
            setConsent("declined");
          } catch(err) {}
          try {
            if (window.gtag) {
              window.gtag("consent", "update", {
                "ad_storage": "denied",
                "analytics_storage": "denied",
                "ad_user_data": "denied",
                "ad_personalization": "denied"
              });
            }
          } catch(err) {}
          dismissBanner();
        };
      }
    }

    function initChatbot(cfg) {
      var root = el("div");
      root.id = "sf-chat-root";
      document.body.appendChild(root);

      var isMobileView = window.matchMedia("(max-width: 520px)").matches;
      var bubbleSize = isMobileView ? 56 : 75;

      var style = el("style");
      style.textContent = 
        /* 1. Die weiche, federnde Eingangs-Animation (Spring Physics) */
        "@keyframes sfChatEntry { " +
          "0% { opacity: 0; transform: scale(0.4) translateY(30px); } " +
          "60% { opacity: 1; transform: scale(1.08) translateY(-5px); } " +
          "100% { opacity: 1; transform: scale(1) translateY(0); } " +
        "} " +
        
        /* 2. Sanftes, unendliches Schweben (Idle Animation), damit er lebendig wirkt */
        "@keyframes sfChatFloat { " +
          "0% { transform: translateY(0px); } " +
          "50% { transform: translateY(-6px); } " +
          "100% { transform: translateY(0px); } " +
        "} " +

        /* Der Avatar-Button */
        ".sf-chat-btn { " +
          "position: fixed; right: 16px; bottom: 16px; " +
          "width: " + bubbleSize + "px; height: " + bubbleSize + "px; " +
          "z-index: 2147483647; display: flex; align-items: center; justify-content: center; " +
          "padding: 0; overflow: hidden; border: none; cursor: pointer; " +
          "background: #111; color: #fff; border-radius: 999px; " +
          "opacity: 0; /* Unsichtbar vor Start */ " +
          "box-shadow: 0 10px 25px rgba(0,0,0,0.15); " +
          "transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); " + 
        "} " +

        /* Wenn die Animation startet */
        ".sf-chat-btn.sf-enter { " +
          "animation: sfChatEntry 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; " +
        "} " +

        /* Nach dem Eintritt: Das Schweben aktivieren UND direkt sichtbar machen */
        ".sf-chat-btn.sf-float { " +
          "opacity: 1 !important; transform: scale(1) !important; " +
          "animation: sfChatFloat 4s ease-in-out infinite; " +
        "} " +

        /* Professioneller Hover: Hebt sich an, wird minimal gr\xF6\xDFer, tieferer weicher Schatten */
        "@media (min-width: 521px) { " +
          ".sf-chat-btn:hover { " +
            "animation: none !important; /* Float stoppen, damit CSS Transition \xFCbernimmt */ " +
            "transform: scale(1.06) translateY(-8px) !important; " +
            "box-shadow: 0 20px 40px rgba(0,0,0,0.22), 0 8px 16px rgba(0,0,0,0.1) !important; " +
          "} " +
          ".sf-chat-btn:active { " +
            "transform: scale(0.96) translateY(0px) !important; " +
            "box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important; " +
          "} " +
        "} " +

        /* Die Sprechblase (SaaS Style) */
        ".sf-chat-tooltip { " +
          "position: fixed; bottom: " + (isMobileView ? "26px" : "34px") + "; right: " + (bubbleSize + 28) + "px; " +
          "background: #fff; color: #111; padding: 14px 20px; border-radius: 16px 16px 0 16px; " +
          "box-shadow: 0 12px 30px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.04); " +
          "border: 1px solid rgba(0,0,0,0.05); font-family: system-ui, sans-serif; " +
          "font-size: 14px; line-height: 1.4; font-weight: 500; " +
          "opacity: 0; transform: translateX(20px) scale(0.9); transform-origin: bottom right; " +
          "transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); " +
          "pointer-events: none; z-index: 2147483646; white-space: nowrap; " +
        "} " +
        ".sf-chat-tooltip.sf-show { " +
          "opacity: 1; transform: translateX(0) scale(1); " +
          "pointer-events: auto; cursor: pointer; " +
        "}";
      document.head.appendChild(style);

      var bubble = el("button");
      bubble.type = "button";
      bubble.setAttribute("aria-label","Chat \xF6ffnen");
      bubble.className = "sf-chat-btn"; 

      if (cfg.avatarUrl) {
        var img = el("img");
        img.src = cfg.avatarUrl;
        img.alt = cfg.botName || "Chatbot";
        Object.assign(img.style,{ width:"100%", height:"100%", objectFit:"cover" });
        bubble.appendChild(img);
      } else {
        bubble.textContent = "\u{1F4AC}";
        bubble.style.fontSize = "22px";
      }

      var safeName = (cfg.botName || "hier").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      var tooltip = el("div");
      tooltip.className = "sf-chat-tooltip";
      tooltip.innerHTML = "\u{1F44B} Hi! Ich bin <b>" + safeName + "</b>.<br>Brauchst du Hilfe?";
      root.appendChild(tooltip);

      var panel = el("div");
      Object.assign(panel.style,{
        position:"fixed", right:"16px", bottom:"80px",
        width:"360px", maxWidth:"100%", height:"520px", maxHeight:"calc(100vh - 120px)",
        borderRadius:"16px", boxShadow:"0 18px 60px rgba(0,0,0,.25)",
        background:"#fff", border:"1px solid #eee", overflow:"hidden",
        zIndex:2147483647, display:"none"
      });

      var iframe = el("iframe");
      iframe.src = ORIGIN + "/widget.html?tenantId=" + encodeURIComponent(TENANT_ID);
      iframe.setAttribute("title","Chat");
      Object.assign(iframe.style,{ width:"100%", height:"100%", border:"none" });
      panel.appendChild(iframe);

      root.appendChild(bubble);
      root.appendChild(panel);

      var isOpen = false;

      function applyPanelLayout() {
        if (window.matchMedia("(max-width: 520px)").matches) {
          panel.style.inset = ""; panel.style.top = "0"; panel.style.left = "0";
          panel.style.right = "0"; panel.style.bottom = "0"; panel.style.width = "100vw";
          panel.style.height = "100dvh"; panel.style.maxHeight = "none"; panel.style.borderRadius = "0";
        } else {
          panel.style.inset = ""; panel.style.top = ""; panel.style.left = "";
          panel.style.right = "16px"; panel.style.bottom = "88px"; panel.style.width = "468px";
          panel.style.height = "676px"; panel.style.maxHeight = "calc(100vh - 140px)"; panel.style.borderRadius = "16px";
        }
      }

      function openPanel() {
        applyPanelLayout();
        panel.style.display = "block";
        isOpen = true;
        tooltip.classList.remove("sf-show"); 
      }

      function closePanel() {
        panel.style.display = "none";
        isOpen = false;
      }

      bubble.addEventListener("click", function () {
        if (isOpen) closePanel(); else openPanel();
      });

      tooltip.addEventListener("click", function () {
        openPanel();
      });

      window.addEventListener("resize", function () {
        if (isOpen) applyPanelLayout();
      });

      window.addEventListener("message", function (ev) {
        if (!ev || !ev.data) return;
        if (ev.data.type === "SF_CHAT_CLOSE") closePanel();
      });

      var sessionKey = "sf_chat_intro_" + TENANT_ID;
      var hasSeenIntro = sessionStorage.getItem(sessionKey);

      if (hasSeenIntro) {
        bubble.classList.add("sf-float");
      } else {
        sessionStorage.setItem(sessionKey, "true");

        setTimeout(function() {
          if (isOpen) return;
          bubble.classList.add("sf-enter"); 
          
          setTimeout(function() {
            bubble.classList.remove("sf-enter");
            bubble.classList.add("sf-float");
            
            if (isOpen) return;
            tooltip.classList.add("sf-show"); 
            
            setTimeout(function() {
              tooltip.classList.remove("sf-show"); 
            }, 4500); 
          }, 800); 
        }, 1500); 
      }
    }
  })();`;
      return new Response(js, {
        status: 200,
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
          ...cors(request)
        }
      });
    }
    return new Response("OK", { headers: cors(request) });
  }
};
export {
  worker_default as default
};
