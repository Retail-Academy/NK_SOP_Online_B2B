/* NK Online B2B Copilot
   - Option-first, deterministic
   - First screen: bilingual language selection
   - Then conversation locks to selected language (vi/en)

   FIX:
   - Do NOT stringify interactive DOM into innerHTML.
   - Append option buttons as real DOM nodes so event listeners work.
*/

const STATE = {
  lang: null,           // "vi" | "en"
  nodeId: "lang_select",
  history: [],          // stack of { lang, nodeId }
};

const DOM = {
  chat: document.getElementById("chat"),
  hint: document.getElementById("hint"),
  langPill: document.getElementById("langPill"),
  btnReset: document.getElementById("btnReset"),
  btnBack: document.getElementById("btnBack"),
};

// ---------- Decision Tree ----------
const TREE = {
  startNodeId: "lang_select",
  nodes: {
    // Language selection (BILINGUAL question + bilingual options)
    lang_select: {
      type: "question",
      title: {
        vi: "Choose your language / Chọn ngôn ngữ bạn muốn sử dụng",
        en: "Choose your language / Chọn ngôn ngữ bạn muốn sử dụng",
      },
      subtitle: {
        vi: "Once selected, the conversation continues in one language only.",
        en: "Once selected, the conversation continues in one language only.",
      },
      options: [
        { label: { vi: "Tiếng Việt", en: "Vietnamese (Tiếng Việt)" }, setLang: "vi", next: "n0" },
        { label: { vi: "English", en: "English" }, setLang: "en", next: "n0" },
      ],
    },

    // Main step selection
    n0: {
      type: "question",
      title: {
        vi: "Bạn đang xử lý phần nào của quy trình?",
        en: "Which part of the process are you handling?",
      },
      options: [
        { label: { vi: "Lead: tìm khách, tư vấn, tổng hợp nhu cầu", en: "Lead: prospecting, consulting, demand summary" }, next: "lead_1" },
        { label: { vi: "Pricing: kiểm tra giá, CTKM, điều kiện, xin duyệt", en: "Pricing: price/promo/conditions, approvals" }, next: "pricing_1" },
        { label: { vi: "Order: tạo đơn (Cs Cart → PDW)", en: "Order: create order (Cs Cart → PDW)" }, next: "order_1" },
        { label: { vi: "Fulfillment: SO/Bill + SAP + giao lắp", en: "Fulfillment: SO/Bill + SAP + delivery/installation" }, next: "fulfill_1" },
        { label: { vi: "Exception: đổi trả", en: "Exception: return/exchange" }, next: "return_1" },
        { label: { vi: "Exception: đơn quá hạn (chưa giao/chưa thu tiền)", en: "Exception: overdue order (not delivered / not collected)" }, next: "overdue_1" },
        { label: { vi: "Close: đóng giao dịch & lưu info CSKH", en: "Close: close deal & save info for customer care" }, next: "close_1" },
      ],
    },

    // LEAD
    lead_1: {
      type: "result",
      title: { vi: "Lead & tư vấn", en: "Lead & consulting" },
      cards: [
        {
          title: { vi: "Checklist (Online B2B)", en: "Checklist (Online B2B)" },
          bullets: {
            vi: [
              "Tìm kiếm khách hàng (hotline/phone/email).",
              "Tư vấn giải pháp và tổng hợp nhu cầu; trao đổi tồn kho và giá.",
              "Nếu khách đã rõ nhu cầu: chuyển sang Pricing để kiểm tra giá/CTKM/điều kiện.",
            ],
            en: [
              "Prospect customers (hotline/phone/email).",
              "Consult solutions and summarize demand; discuss stock availability and price.",
              "If demand is clear: go to Pricing to validate price/promo/conditions.",
            ],
          },
        },
      ],
      links: [{ label: { vi: "Quay lại chọn bước", en: "Back to step selection" }, next: "n0" }],
    },

    // PRICING
    pricing_1: {
      type: "question",
      title: { vi: "Ngành hàng của đơn này là gì?", en: "Which category is this order under?" },
      options: [
        { label: { vi: "AV", en: "AV" }, next: "gp_check" },
        { label: { vi: "MDA", en: "MDA" }, next: "gp_check" },
        { label: { vi: "SDA", en: "SDA" }, next: "gp_check" },
        { label: { vi: "ENT", en: "ENT" }, next: "gp_check" },
        { label: { vi: "TEL", en: "TEL" }, next: "tel_always_approve" },
        { label: { vi: "IT", en: "IT" }, next: "it_always_approve" },
        { label: { vi: "Khác / Chưa rõ", en: "Other / Not sure" }, next: "pricing_need_category" },
      ],
    },

    pricing_need_category: {
      type: "result",
      title: { vi: "Cần xác định ngành hàng", en: "Category required" },
      cards: [
        {
          title: { vi: "Bạn cần làm", en: "What to do" },
          bullets: {
            vi: [
              "Xác định ngành hàng (AV/MDA/SDA/ENT/TEL/IT) trước khi quyết định luồng duyệt giá.",
              "Sau khi xác định: quay lại Pricing và chọn đúng ngành hàng.",
            ],
            en: [
              "Identify the category (AV/MDA/SDA/ENT/TEL/IT) before deciding the approval path.",
              "Then return to Pricing and select the correct category.",
            ],
          },
        },
      ],
      links: [
        { label: { vi: "Quay lại Pricing", en: "Back to Pricing" }, next: "pricing_1" },
        { label: { vi: "Quay lại chọn bước", en: "Back to step selection" }, next: "n0" },
      ],
    },

    tel_always_approve: {
      type: "result",
      title: { vi: "TEL: luôn cần Merchandise xác nhận giá", en: "TEL: Merchandise validation required for all prices" },
      cards: [
        {
          title: { vi: "Việc cần làm ngay", en: "Do this now" },
          bullets: {
            vi: [
              "Chuẩn bị SKU list + giá đề xuất.",
              "Gửi Merchandise TEL xác nhận giá (TEL: mọi giá phải được xác nhận).",
              "Chỉ gửi quotation cho khách sau khi được xác nhận.",
            ],
            en: [
              "Prepare SKU list + proposed price.",
              "Send to TEL Merchandise for price validation (TEL: all selling prices must be validated).",
              "Send quotation to customer only after validation.",
            ],
          },
        },
        {
          title: { vi: "Sau khi được duyệt", en: "After approval" },
          bullets: {
            vi: ["Gửi quotation.", "Tạo order Cs Cart và đẩy xuống PDW."],
            en: ["Send quotation.", "Create order in Cs Cart and push to PDW."],
          },
        },
      ],
      links: [
        { label: { vi: "Tiếp tục: tạo đơn (Order)", en: "Continue: Order" }, next: "order_1" },
        { label: { vi: "Quay lại chọn bước", en: "Back to step selection" }, next: "n0" },
      ],
    },

    it_always_approve: {
      type: "result",
      title: { vi: "IT: luôn cần Merchandise xác nhận giá", en: "IT: Merchandise validation required for all prices" },
      cards: [
        {
          title: { vi: "Việc cần làm ngay", en: "Do this now" },
          bullets: {
            vi: [
              "Chuẩn bị SKU list + giá đề xuất.",
              "Gửi Merchandise IT xác nhận giá (IT: mọi giá phải được xác nhận).",
              "Chỉ gửi quotation cho khách sau khi được xác nhận.",
            ],
            en: [
              "Prepare SKU list + proposed price.",
              "Send to IT Merchandise for price validation (IT: all selling prices must be validated).",
              "Send quotation to customer only after validation.",
            ],
          },
        },
        {
          title: { vi: "Sau khi được duyệt", en: "After approval" },
          bullets: {
            vi: ["Gửi quotation.", "Tạo order Cs Cart và đẩy xuống PDW."],
            en: ["Send quotation.", "Create order in Cs Cart and push to PDW."],
          },
        },
      ],
      links: [
        { label: { vi: "Tiếp tục: tạo đơn (Order)", en: "Continue: Order" }, next: "order_1" },
        { label: { vi: "Quay lại chọn bước", en: "Back to step selection" }, next: "n0" },
      ],
    },

    gp_check: {
      type: "question",
      title: { vi: "GP dự kiến của đơn này dưới 5% không?", en: "Is the expected gross margin (GP) below 5%?" },
      options: [
        { label: { vi: "Dưới 5%", en: "Below 5%" }, next: "gp_below" },
        { label: { vi: "Từ 5% trở lên", en: "5% or above" }, next: "gp_ok" },
        { label: { vi: "Chưa biết", en: "Not sure yet" }, next: "gp_unknown" },
      ],
    },

    gp_unknown: {
      type: "result",
      title: { vi: "Cần xác định GP trước", en: "GP needed" },
      cards: [
        {
          title: { vi: "Bạn cần làm", en: "What to do" },
          bullets: {
            vi: [
              "Kiểm tra GP theo dữ liệu nội bộ (ví dụ M53 Power BI hoặc dữ liệu Merchandise).",
              "Sau đó quay lại chọn: <5% hay >=5% để đi đúng nhánh duyệt.",
            ],
            en: [
              "Check GP using internal data (e.g., M53 Power BI or data from Merchandise).",
              "Then come back and select <5% or >=5% to follow the correct approval route.",
            ],
          },
        },
      ],
      links: [
        { label: { vi: "Quay lại câu hỏi GP", en: "Back to GP question" }, next: "gp_check" },
        { label: { vi: "Quay lại chọn bước", en: "Back to step selection" }, next: "n0" },
      ],
    },

    gp_below: {
      type: "result",
      title: { vi: "GP < 5%: cần Merchandise xác nhận giá", en: "GP < 5%: Merchandise validation required" },
      cards: [
        {
          title: { vi: "Việc cần làm ngay", en: "Do this now" },
          bullets: {
            vi: [
              "Chuẩn bị SKU list + giá đề xuất + lý do/benchmark (nếu có).",
              "Gửi Merchandise xác nhận giá trước khi gửi quotation.",
            ],
            en: [
              "Prepare SKU list + proposed price + rationale/benchmark (if any).",
              "Request Merchandise validation before sending quotation.",
            ],
          },
        },
        {
          title: { vi: "Sau khi được duyệt", en: "After approval" },
          bullets: {
            vi: ["Gửi quotation cho khách.", "Chuyển sang Order: Cs Cart → PDW."],
            en: ["Send quotation to customer.", "Proceed to Order: Cs Cart → PDW."],
          },
        },
      ],
      links: [
        { label: { vi: "Tiếp tục: tạo đơn (Order)", en: "Continue: Order" }, next: "order_1" },
        { label: { vi: "Quay lại Pricing", en: "Back to Pricing" }, next: "pricing_1" },
      ],
    },

    gp_ok: {
      type: "result",
      title: { vi: "GP >= 5%: có thể gửi quotation & tạo đơn", en: "GP >= 5%: OK to quote & create order" },
      cards: [
        {
          title: { vi: "Next step", en: "Next step" },
          bullets: {
            vi: ["Gửi quotation cho khách.", "Tạo order trên Cs Cart và đẩy xuống PDW."],
            en: ["Send quotation to customer.", "Create order on Cs Cart and push to PDW."],
          },
        },
      ],
      links: [
        { label: { vi: "Tiếp tục: tạo đơn (Order)", en: "Continue: Order" }, next: "order_1" },
        { label: { vi: "Quay lại chọn bước", en: "Back to step selection" }, next: "n0" },
      ],
    },

    // ORDER
    order_1: {
      type: "result",
      title: { vi: "Tạo đơn (Cs Cart → PDW)", en: "Create order (Cs Cart → PDW)" },
      cards: [
        {
          title: { vi: "Checklist", en: "Checklist" },
          bullets: {
            vi: [
              "Tạo đơn hàng trên Cs Cart.",
              "Đẩy đơn xuống PDW.",
              "Xác định VAT để chuyển Fulfillment đúng lane (VAT cá nhân → Store; VAT công ty → B2B Center).",
            ],
            en: [
              "Create order on Cs Cart.",
              "Push order to PDW.",
              "Confirm VAT type to route fulfillment correctly (Individual VAT → Store; Company VAT → B2B Center).",
            ],
          },
        },
      ],
      links: [
        { label: { vi: "Tiếp tục: Fulfillment", en: "Continue: Fulfillment" }, next: "fulfill_1" },
        { label: { vi: "Quay lại chọn bước", en: "Back to step selection" }, next: "n0" },
      ],
    },

    // FULFILLMENT
    fulfill_1: {
      type: "question",
      title: { vi: "Khách xuất VAT loại nào?", en: "What VAT type does the customer need?" },
      options: [
        { label: { vi: "VAT cá nhân", en: "Individual VAT" }, next: "fulfill_individual" },
        { label: { vi: "VAT công ty", en: "Company VAT" }, next: "fulfill_company" },
      ],
    },

    fulfill_individual: {
      type: "result",
      title: { vi: "VAT cá nhân → Store xử lý SO/Bill & giao lắp", en: "Individual VAT → Store handles SO/Bill & delivery" },
      cards: [
        {
          title: { vi: "Owner luồng", en: "Flow owner" },
          bullets: {
            vi: ["Store tạo SO (từ Pre SO), chuẩn bị xuất hàng, giao lắp (nếu có)."],
            en: ["Store creates SO (from Pre SO), prepares goods issue, delivery/installation (if any)."],
          },
        },
        {
          title: { vi: "DC / Logistics", en: "DC / Logistics" },
          bullets: {
            vi: ["Xác nhận goods issue trên SAP, scan IMEI/serial, in hóa đơn, giao lắp."],
            en: ["Confirm goods issue in SAP, scan IMEI/serial, print invoice, deliver/install."],
          },
        },
      ],
      links: [
        { label: { vi: "Nếu có đổi trả", en: "If return/exchange" }, next: "return_1" },
        { label: { vi: "Đóng giao dịch", en: "Close the deal" }, next: "close_1" },
        { label: { vi: "Quay lại chọn bước", en: "Back to step selection" }, next: "n0" },
      ],
    },

    fulfill_company: {
      type: "result",
      title: { vi: "VAT công ty → B2B Center xử lý SO/Bill & giao lắp", en: "Company VAT → B2B Center handles SO/Bill & delivery" },
      cards: [
        {
          title: { vi: "Owner luồng", en: "Flow owner" },
          bullets: {
            vi: ["B2B Center tạo SO (từ Pre SO), chuẩn bị xuất hàng, giao lắp (nếu có)."],
            en: ["B2B Center creates SO (from Pre SO), prepares goods issue, delivery/installation (if any)."],
          },
        },
        {
          title: { vi: "DC / Logistics", en: "DC / Logistics" },
          bullets: {
            vi: ["Xác nhận goods issue trên SAP, scan IMEI/serial, in hóa đơn, giao lắp."],
            en: ["Confirm goods issue in SAP, scan IMEI/serial, print invoice, deliver/install."],
          },
        },
      ],
      links: [
        { label: { vi: "Nếu có đổi trả", en: "If return/exchange" }, next: "return_1" },
        { label: { vi: "Đóng giao dịch", en: "Close the deal" }, next: "close_1" },
        { label: { vi: "Quay lại chọn bước", en: "Back to step selection" }, next: "n0" },
      ],
    },

    // RETURN
    return_1: {
      type: "result",
      title: { vi: "Đổi/Trả", en: "Return/Exchange" },
      cards: [
        {
          title: { vi: "Luồng xử lý", en: "Handling flow" },
          bullets: {
            vi: [
              "DC thu thập yêu cầu đổi/trả của khách.",
              "Gửi thông tin cho Store/B2B và Online Sales.",
              "Xử lý chứng từ đổi/trả theo quy trình trả hàng.",
            ],
            en: [
              "DC collects return/exchange request.",
              "Send info to Store/B2B and Online Sales.",
              "Process return documents per return procedure.",
            ],
          },
        },
      ],
      links: [
        { label: { vi: "Quay lại Fulfillment", en: "Back to Fulfillment" }, next: "fulfill_1" },
        { label: { vi: "Quay lại chọn bước", en: "Back to step selection" }, next: "n0" },
      ],
    },

    // OVERDUE
    overdue_1: {
      type: "result",
      title: { vi: "Đơn quá hạn (chưa giao/chưa thu tiền)", en: "Overdue orders (not delivered / not collected)" },
      cards: [
        {
          title: { vi: "Bạn cần làm (Online Sales)", en: "What you do (Online Sales)" },
          bullets: {
            vi: [
              "Theo dõi và kiểm soát đơn quá hạn trên PDW/Cs Cart.",
              "Xác định nguyên nhân: chưa giao hay chưa thu tiền.",
              "Phối hợp Store/Accounting để ghi nhận thu tiền vào đơn, tránh quá hạn kéo dài.",
            ],
            en: [
              "Monitor overdue orders on PDW/Cs Cart.",
              "Identify root cause: not delivered vs not collected.",
              "Coordinate with Store/Accounting to record payment against the order.",
            ],
          },
        },
      ],
      links: [
        { label: { vi: "Kiểm tra giao nhận (bước 12)", en: "Check delivery schedule (step 12)" }, next: "step12" },
        { label: { vi: "Quay lại chọn bước", en: "Back to step selection" }, next: "n0" },
      ],
    },

    step12: {
      type: "result",
      title: { vi: "Bước 12: kiểm tra giao nhận & tránh quá hạn", en: "Step 12: delivery check & avoid overdue" },
      cards: [
        {
          title: { vi: "Checklist", en: "Checklist" },
          bullets: {
            vi: [
              "Kiểm tra lịch giao nhận, khu vực giao nhận, địa chỉ giao của khách hàng.",
              "Nếu giao tại quầy: liên hệ khách lên trung tâm thanh toán.",
              "Liên hệ kế toán báo thu tiền vào đơn hàng tránh quá hạn.",
            ],
            en: [
              "Check delivery schedule, delivery area, and customer address.",
              "If pickup at counter: ask customer to come to payment center.",
              "Contact Accounting to record payment against the order to avoid overdue status.",
            ],
          },
        },
      ],
      links: [
        { label: { vi: "Quay lại Overdue", en: "Back to Overdue" }, next: "overdue_1" },
        { label: { vi: "Quay lại chọn bước", en: "Back to step selection" }, next: "n0" },
      ],
    },

    // CLOSE
    close_1: {
      type: "result",
      title: { vi: "Đóng giao dịch & lưu info CSKH", en: "Close deal & save info for customer care" },
      cards: [
        {
          title: { vi: "Checklist", en: "Checklist" },
          bullets: {
            vi: [
              "Xác nhận đơn đã hoàn tất (giao thành công và/hoặc thu tiền theo điều kiện).",
              "Lưu thông tin giao dịch để chăm sóc khách hàng.",
              "Nếu phát sinh đổi trả: chuyển sang nhánh Return.",
            ],
            en: [
              "Confirm the order is completed (successful delivery and/or payment per terms).",
              "Save transaction info for customer care.",
              "If return happens: switch to Return path.",
            ],
          },
        },
      ],
      links: [{ label: { vi: "Quay lại chọn bước", en: "Back to step selection" }, next: "n0" }],
    },
  },
};

// ---------- i18n ----------
function tr(obj) {
  const lang = STATE.lang || "vi";
  if (typeof obj === "string") return obj;
  if (!obj) return "";
  return obj[lang] ?? obj.vi ?? obj.en ?? "";
}

function setLang(lang) {
  STATE.lang = lang;
  document.documentElement.lang = lang === "vi" ? "vi" : "en";
  DOM.langPill.textContent = lang === "vi" ? "Tiếng Việt" : "English";
  DOM.hint.textContent = lang === "vi"
    ? "Hãy chọn một lựa chọn để tiếp tục."
    : "Select an option to continue.";
}

// ---------- UI primitives ----------
function scrollToBottom() {
  DOM.chat.scrollTop = DOM.chat.scrollHeight;
}

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined && text !== null) e.textContent = text;
  return e;
}

function addMessage(role, text, extraNode = null) {
  const msg = el("div", `msg ${role}`);
  const bubble = el("div", "bubble");

  // Put text with line breaks without innerHTML
  const lines = String(text || "").split("\n");
  lines.forEach((line, idx) => {
    bubble.appendChild(document.createTextNode(line));
    if (idx < lines.length - 1) bubble.appendChild(document.createElement("br"));
  });

  if (extraNode) bubble.appendChild(extraNode);

  msg.appendChild(bubble);
  DOM.chat.appendChild(msg);
  scrollToBottom();
}

function buildOptions(options) {
  const wrap = el("div", "options");
  (options || []).forEach((opt) => {
    const btn = el("button", "opt", tr(opt.label));
    btn.type = "button";
    btn.addEventListener("click", () => onOptionSelected(opt));
    wrap.appendChild(btn);
  });
  return wrap;
}

function buildLinks(links) {
  const container = document.createElement("div");
  container.appendChild(el("div", "divider"));
  container.appendChild(buildOptions(links.map(lk => ({
    label: lk.label,
    next: lk.next,
    _isLink: true,
  }))));
  return container;
}

function buildCards(cards) {
  const container = el("div", "cards");
  (cards || []).forEach((c) => {
    const card = el("div", "card");
    card.appendChild(el("h3", null, tr(c.title)));

    const ul = document.createElement("ul");
    const bullets = c.bullets ? tr(c.bullets) : [];
    (bullets || []).forEach((b) => {
      const li = document.createElement("li");
      li.textContent = b;
      ul.appendChild(li);
    });

    card.appendChild(ul);
    container.appendChild(card);
  });
  return container;
}

// ---------- Render ----------
function renderNode(nodeId) {
  const node = TREE.nodes[nodeId];

  if (!node) {
    addMessage("bot", STATE.lang === "vi"
      ? "Có lỗi xảy ra (không tìm thấy node). Vui lòng bấm Reset."
      : "Something went wrong (node not found). Please press Reset."
    );
    return;
  }

  // If language not set but node isn't language selector, force back.
  if (!STATE.lang && nodeId !== "lang_select") {
    STATE.nodeId = "lang_select";
    renderNode("lang_select");
    return;
  }

  let header = tr(node.title);
  if (node.subtitle) header += `\n${tr(node.subtitle)}`;

  if (node.type === "question") {
    const optionsNode = buildOptions(node.options || []);
    addMessage("bot", header, optionsNode);
    return;
  }

  if (node.type === "result") {
    const wrapper = document.createElement("div");
    wrapper.appendChild(buildCards(node.cards || []));
    if (node.links && node.links.length) wrapper.appendChild(buildLinks(node.links));
    addMessage("bot", header, wrapper);
    return;
  }

  addMessage("bot", STATE.lang === "vi"
    ? "Node cấu hình sai. Vui lòng Reset."
    : "Node misconfigured. Please Reset."
  );
}

// ---------- Navigation ----------
function gotoNode(nextId, { asUser = true, userText = "" } = {}) {
  STATE.history.push({ lang: STATE.lang, nodeId: STATE.nodeId });

  if (asUser && userText) addMessage("user", userText);

  STATE.nodeId = nextId;
  renderNode(nextId);
}

function onOptionSelected(opt) {
  // LINK buttons (from result) behave like goto without user bubble
  if (opt._isLink) {
    gotoNode(opt.next, { asUser: false });
    return;
  }

  // Language selection
  if (opt.setLang) {
    const chosenLabel = opt.setLang === "vi" ? "Tiếng Việt" : "English";
    addMessage("user", chosenLabel);

    setLang(opt.setLang);

    // Move to next node
    gotoNode(opt.next, { asUser: false });
    return;
  }

  // Normal option
  const userText = tr(opt.label);
  gotoNode(opt.next, { asUser: true, userText });
}

// ---------- Controls ----------
function resetAll() {
  DOM.chat.innerHTML = "";
  STATE.lang = null;
  STATE.nodeId = TREE.startNodeId;
  STATE.history = [];
  DOM.langPill.textContent = "Not set";
  DOM.hint.textContent = "Select an option to continue. / Hãy chọn một lựa chọn để tiếp tục.";
  renderNode(STATE.nodeId);
}

function goBack() {
  const prev = STATE.history.pop();
  if (!prev) return;

  DOM.chat.innerHTML = "";
  STATE.lang = prev.lang;
  STATE.nodeId = prev.nodeId;

  if (STATE.lang) setLang(STATE.lang);
  else {
    DOM.langPill.textContent = "Not set";
    DOM.hint.textContent = "Select an option to continue. / Hãy chọn một lựa chọn để tiếp tục.";
  }

  renderNode(STATE.nodeId);
}

DOM.btnReset.addEventListener("click", resetAll);
DOM.btnBack.addEventListener("click", goBack);

// ---------- Start ----------
resetAll();
