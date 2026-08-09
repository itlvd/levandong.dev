---
author: "Le Van Dong"
title: "Go Memory Allocation là gì? Cách Go quản lý bộ nhớ và tối ưu RAM"
date: "2026-03-22"
description: "Go quản lý stack/heap thế nào, và cách tối ưu để giảm GC, tiết kiệm RAM."
tags: ["Go"]
categories: ["Golang", "Programming"]
---

Khám phá cách Go quản lý bộ nhớ và các kỹ thuật tối ưu hóa giúp tiết kiệm RAM, tăng hiệu năng.

---

Trong việc lập trình, đặc biệt là Go, thông thường ta sẽ không để ý quá nhiều khi khởi tạo biến, do Go đã có trình thu gom rác tự động rồi. Dần dà, ta không còn quan tâm đến việc liệu khởi tạo biến có gây áp lực lên trình dọn rác của Go hay không? Biến nào sẽ được lưu trên **stack**? Biến nào thì lưu trên **heap**? Liệu sự vô tâm của ta có làm lãng phí tài nguyên hệ thống hay không?

## Cách bộ nhớ hoạt động

Trên máy tính, địa chỉ bộ nhớ mà chúng ta dùng là trên một bộ nhớ RAM ảo (vitual memory). Còn việc truy xuất như thế nào trên RAM vật lý (physical memory) sẽ do MMU đảm nhận. Việc này giúp cho chúng ta khi làm việc với bộ nhớ sẽ có cảm giác như đang thao tác với các vùng nhớ liên tục thay vì rời rạc như trên RAM vật lý.

Trong bộ nhớ ảo đó, chúng sẽ được chia thành nhiều phân vùng khác nhau như:

{{< rawhtml >}}
<style>
/* ===== RESET ===== */
.mlw * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* ===== ROOT WRAPPER ===== */
.mlw {
  font-family: 'DM Sans', sans-serif;
  color: #1a1a2e;
  margin: 24px 0;
  width: 100%;
}

/* ===== MOBILE: stack dọc ===== */
.mlw-layout {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ===== DESKTOP: 2 cột ===== */
@media (min-width: 680px) {
  .mlw-layout {
    flex-direction: row;
    align-items: flex-start;
    gap: 18px;
  }
}

/* ===========================
   LEFT: DIAGRAM
=========================== */
.mlw-diagram {
  background: #f8f7f4;
  border: 1.5px solid #ddd8d0;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.09);
  width: 100%;
}

@media (min-width: 680px) {
  .mlw-diagram {
    flex: 0 0 240px;
    width: 240px;
    position: sticky;
    top: 20px;
    align-self: flex-start;
  }
}

/* Header */
.mlw-dg-header {
  background: #1a1a2e;
  color: #f8f7f4;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  padding: 8px 12px;
  text-align: center;
  font-size: 10px;
}

/* Địa chỉ */
.mlw-dg-addr {
  font-family: 'JetBrains Mono', monospace;
  color: #999;
  font-size: 9px;
  padding: 5px 10px 2px;
  text-align: right;
  background: #f8f7f4;
  line-height: 1.4;
}

/* Segment block */
.mlw-seg {
  padding: 16px 16px;
  text-align: center;
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  font-size: 13px;
  transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
  border-bottom: 1px solid rgba(255,255,255,0.3);
  color: #1a1a2e;
  position: relative;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.mlw-seg:last-of-type {
  border-bottom: none;
}

.mlw-seg::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
  background: rgba(0,0,0,0.22);
  opacity: 0;
  transition: opacity 0.15s;
}

.mlw-seg:hover,
.mlw-seg.mlw-active {
  filter: brightness(0.91) saturate(1.2);
  transform: translateX(3px);
}

.mlw-seg:hover::before,
.mlw-seg.mlw-active::before {
  opacity: 1;
}

/* Màu segment */
.mlw-stack { background-color: #FFDBB5; }
.mlw-heap  { background-color: #B7EFC5; }
.mlw-bss   { background-color: #BAE0FD; }
.mlw-data  { background-color: #BDB8FB; }
.mlw-code  { background-color: #F0BAF5; }

/* Free memory zone */
.mlw-free {
  padding: 10px 8px;
  text-align: center;
  background: #eeebe5;
  border-bottom: 1px solid #ddd8d0;
  border-top: 1px dashed #cdc7bc;
}

.mlw-free-arrows {
  font-family: 'JetBrains Mono', monospace;
  color: #999;
  font-size: 10px;
  line-height: 1.9;
}

.mlw-free-label {
  color: #bbb;
  font-size: 9px;
  font-style: italic;
  display: block;
  margin-top: 2px;
}

/* ===========================
   RIGHT: INFO PANEL
=========================== */
.mlw-info {
  flex: 1;
  background: #ffffff;
  border: 1.5px solid #e0dbd3;
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  min-height: 200px;
  transition: border-color 0.3s;
  color: #1a1a2e;
  width: 100%;
}

/* Heading row */
.mlw-info-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0ede8;
}

.mlw-info-dot {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #ddd;
  transition: background 0.3s;
}

.mlw-info-title {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  font-size: 15px;
  color: #1a1a2e;
  letter-spacing: -0.01em;
}

/* Body */
.mlw-info-body {
  font-size: 14px;
  line-height: 1.75;
  color: #2e2e3a;
}

.mlw-info-body p {
  margin-bottom: 10px;
}

.mlw-info-body ul {
  padding-left: 18px;
  margin-top: 8px;
}

.mlw-info-body ul li {
  margin-bottom: 5px;
  color: #2e2e3a;
}

.mlw-info-body b,
.mlw-info-body strong {
  color: #1a1a2e;
  font-weight: 600;
}

.mlw .mlw-info-body code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  background: #eaf3ff !important;
  color: #1a4a8a !important;
  border: 1px solid #bfdbfe;
  padding: 1px 6px;
  border-radius: 4px;
}

/* Code block */
.mlw-codeblock {
  background: #1a1a2e;
  color: #a9d7f0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.7;
  padding: 10px 14px;
  border-radius: 6px;
  display: block;
  margin: 10px 0;
  border-left: 3px solid #5c9ece;
  white-space: pre;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* Badge */
.mlw-badge {
  display: inline-block;
  background: #eaf3ff;
  color: #2563eb;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  margin-bottom: 10px;
  border: 1px solid #bfdbfe;
}

/* Placeholder */
.mlw-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 160px;
  color: #b5b0a8;
  text-align: center;
}

.mlw-placeholder-icon {
  opacity: 0.5;
  line-height: 1;
}

.mlw-placeholder p {
  font-size: 13px;
  max-width: 200px;
  line-height: 1.5;
}
.mlw-tabs {
  display: flex;
  gap: 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1.5px solid #ddd8d0;
}

@media (min-width: 680px) {
  .mlw-tabs {
    display: none;
  }
}

.mlw-tab {
  flex: 1;
  padding: 9px 4px;
  text-align: center;
  cursor: pointer;
  background: #f8f7f4;
  border: none;
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  color: #888;
  transition: background 0.15s, color 0.15s;
  border-right: 1px solid #ddd8d0;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.mlw-tab:last-child {
  border-right: none;
}

.mlw-tab.mlw-tab-active {
  color: #1a1a2e;
}

/* Dark mode */
.dark .mlw-diagram {
  background: #161b22;
  border-color: #3d4454;
  box-shadow: 0 2px 12px rgba(0,0,0,0.35);
}
.dark .mlw-dg-header {
  background: #0d1117;
  color: #e6edf3;
}
.dark .mlw-dg-addr {
  background: #161b22;
  color: #9aa4af;
}
.dark .mlw-seg,
.dark .mlw .mlw-seg-label,
.dark .mlw .mlw-seg p {
  color: #1a1a2e;
}
.dark .mlw-free {
  background: #1c1f26;
  border-color: #3d4454;
}
.dark .mlw-free-arrows { color: #9aa4af; }
.dark .mlw-free-label { color: #6e7681; }
.dark .mlw-info {
  background: #161b22;
  border-color: #3d4454;
  color: #e6edf3;
}
.dark .mlw-info-heading { border-bottom-color: #3d4454; }
.dark .mlw-info-title { color: #e6edf3; }
.dark .mlw .mlw-info-body p,
.dark .mlw .mlw-info-body li { color: #c9d1d9; }
.dark .mlw .mlw-info-body b,
.dark .mlw .mlw-info-body strong { color: #e6edf3; }
.dark .mlw .mlw-info-body code {
  background: #1a2a4a !important;
  color: #93c5fd !important;
  border-color: #2d4a7a !important;
}
.dark .mlw-badge {
  background: #1a2a4a;
  color: #93c5fd;
  border-color: #2d4a7a;
}
.dark .mlw-placeholder,
.dark .mlw .mlw-placeholder p { color: #6e7681; }
.dark .mlw-tabs { border-color: #3d4454; }
.dark .mlw-tab {
  background: #161b22;
  color: #9aa4af;
  border-right-color: #3d4454;
}
.dark .mlw-tab.mlw-tab-active {
  background: #1c1f26;
  color: #e6edf3;
}

/* Ẩn diagram trên mobile khi đang xem info và ngược lại */
@media (max-width: 679px) {
  .mlw-diagram { display: none; }
  .mlw-diagram.mlw-mobile-show { display: block; }
  .mlw-info { display: none; }
  .mlw-info.mlw-mobile-show { display: block; }
}
</style>

<div class="mlw" id="mlw-root">

  <div class="mlw-tabs" id="mlw-tabs">
    <div class="mlw-tab mlw-tab-active" data-panel="diagram" id="mlw-tab-diagram">🗺 Sơ đồ</div>
    <div class="mlw-tab" data-panel="info" id="mlw-tab-info">📖 Chi tiết</div>
  </div>

  <div class="mlw-layout">

    <div class="mlw-diagram mlw-mobile-show" id="mlw-diagram">
      <div class="mlw-dg-header">Virtual Memory Layout</div>
      <div class="mlw-dg-addr">0xFFFF…</div>

      <div class="mlw-seg mlw-stack"
           data-seg="stack"
           data-color="#FF8C42"
           data-title="Stack Segment"
           data-badge="Go: Goroutine Stack"
           data-body="<p>Mỗi <b>Goroutine</b> có Stack riêng, khởi đầu nhỏ (~2KB) và tự động co giãn khi cần (segmented/copy stack).</p><p>Dùng để cấp phát cho <b>tham số hàm</b> và <b>biến cục bộ</b> không bị escape ra ngoài phạm vi hàm.</p><ul><li>Cấp phát cực nhanh - chỉ cần dịch chuyển con trỏ stack.</li><li>GC không cần quản lý - biến tự giải phóng khi hàm return.</li><li>Mỗi Goroutine có stack độc lập, không chia sẻ với nhau.</li></ul>">
        Stack Segment
      </div>

      <div class="mlw-free">
        <div class="mlw-free-arrows">↓ Stack grows down ↓<br>↑ Heap grows up ↑</div>
        <span class="mlw-free-label">Free Memory</span>
      </div>

      <div class="mlw-seg mlw-heap"
           data-seg="heap"
           data-color="#22c55e"
           data-title="Heap Segment"
           data-badge="Go: GC Managed"
           data-body='<p>Nơi chứa dữ liệu động - biến bị <b>escape</b> khỏi stack (theo kết quả Escape Analysis của compiler).</p><div class="mlw-codeblock">ptr   := new(MyStruct)&#10;slice := make([]int, 1024)&#10;m     := make(map[string]int)</div><ul><li><b>Garbage Collector</b> tự động dọn dẹp - không cần <code>free()</code>.</li><li>Cấp phát chậm hơn Stack do GC phải theo dõi.</li><li>Dùng <code>go build -gcflags=&quot;-m&quot;</code> để xem escape analysis.</li></ul>'>
        Heap Segment
      </div>

      <div class="mlw-seg mlw-bss"
           data-seg="bss"
           data-color="#3b82f6"
           data-title="BSS Segment"
           data-badge="Zero-initialized"
           data-body='<p>Chứa <b>biến toàn cục</b> và <b>biến package-level</b> chưa được gán giá trị rõ ràng.</p><p>Go tự động gán <b>zero value</b> cho các biến này khi program khởi động:</p><ul><li><code>int</code>, <code>float64</code> → <b>0</b></li><li><code>bool</code> → <b>false</b></li><li><code>string</code> → <b>""</b></li><li><code>pointer</code>, <code>slice</code>, <code>map</code>, <code>chan</code> → <b>nil</b></li></ul>'>
        BSS Segment
      </div>

      <div class="mlw-seg mlw-data"
           data-seg="data"
           data-color="#8b5cf6"
           data-title="Data Segment"
           data-badge="Explicitly initialized"
           data-body='<p>Chứa <b>biến toàn cục</b> và <b>hằng số (const)</b> đã được gán giá trị cụ thể trong mã nguồn.</p><div class="mlw-codeblock">var maxConn = 100&#10;var appName = &quot;my-service&quot;&#10;const version = &quot;1.0.0&quot;</div><p>Dữ liệu này được nhúng trực tiếp vào file binary khi biên dịch.</p>'>
        Data Segment
      </div>

      <div class="mlw-seg mlw-code"
           data-seg="code"
           data-color="#d946ef"
           data-title="Code Segment"
           data-badge="Text / Read-only"
           data-body="<p>Lưu trữ <b>mã máy (machine code)</b> của chương trình Go sau khi được <code>go build</code> biên dịch thành binary.</p><ul><li><b>Read-only</b> - OS bảo vệ, không thể ghi đè lúc runtime.</li><li>Có thể được nhiều process chia sẻ (shared library).</li><li>Bao gồm cả mã của Go runtime và GC.</li></ul>">
        Code Segment
      </div>

      <div class="mlw-dg-addr" style="padding-bottom:6px;">0x0000…</div>
    </div>

    <div class="mlw-info" id="mlw-info" style="display:none">
      <div id="mlw-info-inner">
        <div class="mlw-placeholder">
          <div class="mlw-placeholder-icon" style="font-size:2em">🧠</div>
          <p>Chọn một phân vùng để xem giải thích chi tiết.</p>
        </div>
      </div>
    </div>

  </div>
</div>

<script>
(function() {
  var segs       = document.querySelectorAll('#mlw-root .mlw-seg');
  var infoInner  = document.getElementById('mlw-info-inner');
  var infoPanel  = document.getElementById('mlw-info');
  var diagram    = document.getElementById('mlw-diagram');
  var tabDiagram = document.getElementById('mlw-tab-diagram');
  var tabInfo    = document.getElementById('mlw-tab-info');
  var isMobile   = function() { return window.innerWidth < 680; };

  /* ---------- render info ---------- */
  function renderInfo(seg) {
    var color = seg.dataset.color;
    var title = seg.dataset.title;
    var badge = seg.dataset.badge;
    var body  = seg.dataset.body;

    infoPanel.style.borderColor = color + '66';
    infoInner.innerHTML =
      '<div class="mlw-info-heading">' +
        '<div class="mlw-info-dot" style="background:' + color + '"></div>' +
        '<div class="mlw-info-title">' + title + '</div>' +
      '</div>' +
      '<div class="mlw-info-body">' +
        '<span class="mlw-badge">' + badge + '</span>' +
        body +
      '</div>';
  }

  /* ---------- switch active seg ---------- */
  function activateSeg(seg) {
    segs.forEach(function(s) { s.classList.remove('mlw-active'); });
    seg.classList.add('mlw-active');
    renderInfo(seg);
  }

  /* ---------- mobile tab switch ---------- */
  function showPanel(panel) {
    if (panel === 'diagram') {
      diagram.classList.add('mlw-mobile-show');
      infoPanel.style.display = 'none';
      tabDiagram.classList.add('mlw-tab-active');
      tabInfo.classList.remove('mlw-tab-active');
      // Sync tab bg màu
      var active = document.querySelector('#mlw-root .mlw-seg.mlw-active');
      tabDiagram.style.background = active ? active.style.backgroundColor || '' : '';
    } else {
      diagram.classList.remove('mlw-mobile-show');
      infoPanel.style.display = 'block';
      tabInfo.classList.add('mlw-tab-active');
      tabDiagram.classList.remove('mlw-tab-active');
    }
  }

  /* ---------- bind seg events ---------- */
  segs.forEach(function(seg) {
    seg.addEventListener('click', function() {
      activateSeg(seg);
      if (isMobile()) {
        showPanel('info');
        /* Tô màu tab info theo màu segment */
        tabInfo.style.background = seg.dataset.color + '33';
        tabInfo.style.color = '#1a1a2e';
      }
    });
    /* hover chỉ desktop */
    seg.addEventListener('mouseenter', function() {
      if (!isMobile()) {
        activateSeg(seg);
      }
    });
  });

  /* ---------- bind tab events ---------- */
  if (tabDiagram) {
    tabDiagram.addEventListener('click', function() { showPanel('diagram'); });
  }
  if (tabInfo) {
    tabInfo.addEventListener('click', function() { showPanel('info'); });
  }

  /* ---------- init ---------- */
  var firstSeg = segs[0];
  if (firstSeg) {
    activateSeg(firstSeg);
    if (isMobile()) {
      /* mobile: mặc định hiện diagram, info ẩn */
      diagram.classList.add('mlw-mobile-show');
      infoPanel.style.display = 'none';
    } else {
      /* desktop: hiện cả hai */
      diagram.style.display = '';
      infoPanel.style.display = '';
    }
  }

  /* resize: reset display nếu đổi breakpoint */
  window.addEventListener('resize', function() {
    if (!isMobile()) {
      diagram.classList.add('mlw-mobile-show');
      infoPanel.style.display = '';
    }
  });
})();
</script>
{{< /rawhtml >}}

Khi một biến được lưu trên **stack**, nó sẽ được tự động giải phóng khi thoát khỏi hàm. Vậy, nếu ta có một biến (ví dụ như slice) cần sử dụng ở một hàm khác với hàm đã tạo ra chính nó thì sao? Nó cần được lưu ở một vùng nhớ mà ở đó nó có vòng đời sống lâu hơn thay vì sẽ tự động giải phóng khi thoát khỏi hàm, đó chính là **heap**.

Khi ở **heap**, vấn đề dọn dẹp bắt đầu khó khăn hơn. Vùng nhớ ở **heap** có thể sẽ được tham chiếu bởi các biến khác nhau, ta có thể giải phóng vùng nhớ **heap** của biến `varA`, nhưng biến `varB` vẫn còn sử dụng vùng nhớ đó thì sao? Khi nào thì dọn dẹp? Lúc đó, GC sẽ là cứu tinh của ta.

{{< callout type="warning" >}}
Lưu ý `ref count` chỉ dùng để trực quan hóa.
{{< /callout >}}

{{< rawhtml >}}
<style>
.hr-isolate {
    color: inherit;
    background: transparent;
    border-radius: 4px;
    padding: 4px 0;
    font-family: inherit;

    /* Semantic state accents - giữ nhất quán giữa light/dark */
    --hr-accent:  #7c3aed;  /* purple - active references */
    --hr-success: #15803d;  /* green  - protected/safe */
    --hr-danger:  #dc2626;  /* red    - dangling/danger */
    --hr-warning: #d97706;  /* amber  - pending */

    /* Neutrals theo theme cha */
    --hr-text-muted:     color-mix(in srgb, currentColor 60%, transparent);
    --hr-border:         color-mix(in srgb, currentColor 18%, transparent);
    --hr-border-strong:  color-mix(in srgb, currentColor 30%, transparent);
    --hr-surface:        color-mix(in srgb, currentColor 4%, transparent);
    --hr-surface-2:      color-mix(in srgb, currentColor 7%, transparent);
}
.hr-isolate *, .hr-isolate *::before, .hr-isolate *::after { box-sizing: border-box; }
.hr-wrap { margin: 24px 0; color: inherit; }

/* ── Mode bar ── */
.hr-mode-bar {
    display: flex; border: 1.5px solid var(--hr-border);
    border-radius: 8px; overflow: hidden; margin-bottom: 20px; width: fit-content;
}
.hr-mode-btn {
    padding: 8px 20px; background: transparent; border: none; cursor: pointer;
    font-family: inherit; color: var(--hr-text-muted); font-weight: 500;
    transition: background .15s, color .15s; white-space: nowrap;
}
.hr-mode-btn.hr-on { background: var(--hr-accent); color: #fff; }
.hr-mode-btn:not(.hr-on):hover { background: var(--hr-surface-2); color: inherit; }

/* ── Outer card ── */
.hr-outer-card { border: 1.5px solid var(--hr-border); border-radius: 12px; overflow: hidden; }
.hr-card-head {
    padding: 10px 16px; background: var(--hr-surface);
    border-bottom: 1px solid var(--hr-border);
    display: flex; align-items: center; gap: 10px;
}
.hr-head-dot {
    width: 10px; height: 10px; border-radius: 50%;
    background: var(--hr-border-strong); transition: background .3s;
}
.hr-head-dot.hr-head-dot--gc     { background: var(--hr-success); }
.hr-head-dot.hr-head-dot--manual { background: var(--hr-text-muted); }
.hr-head-label { font-weight: 500; color: inherit; }

/* ── Board layout ── */
.hr-board { display: flex; flex-direction: column; }
@media (min-width: 600px) { .hr-board { flex-direction: row; align-items: stretch; } }
.hr-col { flex: 1; padding: 16px; min-width: 0; }
.hr-col-title {
    font-weight: 500; color: var(--hr-text-muted); margin-bottom: 14px;
    padding-bottom: 8px; border-bottom: 1.5px solid var(--hr-border);
    display: flex; align-items: center; gap: 8px;
}
.hr-col-title-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.hr-divider { width: 100%; height: 1px; background: var(--hr-border); }
@media (min-width: 600px) { .hr-divider { width: 1px; height: auto; } }

/* ── Stack variables ── */
.hr-var {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 8px;
    border: 1.5px solid var(--hr-border); background: var(--hr-surface);
    margin-bottom: 10px;
    transition: border-color .3s, background .3s, opacity .3s;
}
.hr-var.hr-v-pointing {
    border-color: color-mix(in srgb, var(--hr-accent) 55%, transparent);
    background:   color-mix(in srgb, var(--hr-accent) 8%, transparent);
}
.hr-var.hr-v-dangling {
    border-color: var(--hr-danger);
    background:   color-mix(in srgb, var(--hr-danger) 10%, transparent);
    animation: hr-shake .4s ease;
}
.hr-var.hr-v-nil { border-color: var(--hr-border); background: var(--hr-surface); opacity: .5; }
@keyframes hr-shake {
    0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)}
    40%{transform:translateX(5px)}   60%{transform:translateX(-4px)} 80%{transform:translateX(4px)}
}
.hr-var-name { font-weight: 600; color: inherit; min-width: 28px; }
.hr-var-addr {
    font-family: monospace; color: var(--hr-accent);
    background: color-mix(in srgb, var(--hr-accent) 14%, transparent);
    padding: 2px 7px; border-radius: 4px; transition: color .3s, background .3s;
}
.hr-var-addr.hr-a-nil {
    color: var(--hr-text-muted); background: var(--hr-surface-2); text-decoration: line-through;
}
.hr-var-addr.hr-a-err {
    color: var(--hr-danger);
    background: color-mix(in srgb, var(--hr-danger) 14%, transparent);
}
.hr-var-status { margin-left: auto; padding: 2px 8px; border-radius: 4px; font-weight: 500; white-space: nowrap; }
.hr-s-ok     { background: color-mix(in srgb, var(--hr-success) 16%, transparent); color: var(--hr-success); }
.hr-s-nil    { background: var(--hr-surface-2); color: var(--hr-text-muted); }
.hr-s-danger { background: color-mix(in srgb, var(--hr-danger) 18%, transparent); color: var(--hr-danger); }

/* ── Stack note ── */
.hr-stack-note {
    padding: 8px 10px; background: var(--hr-surface);
    border-radius: 6px; border: 1px solid var(--hr-border);
    color: var(--hr-text-muted);
}

/* ── Heap object ── */
.hr-heap-obj {
    border-radius: 10px; border: 2px solid var(--hr-border);
    background: var(--hr-surface); overflow: hidden; margin-bottom: 10px;
    transition: border-color .35s, box-shadow .35s, opacity .4s, filter .4s, outline .2s;
}
.hr-heap-obj.hr-h-alive     { border-color: color-mix(in srgb, var(--hr-accent) 55%, transparent); }
.hr-heap-obj.hr-h-freed     { border-color: var(--hr-border); opacity: .32; filter: grayscale(.7); }
.hr-heap-obj.hr-h-danger    { border-color: var(--hr-danger); animation: hr-pulse 1s ease infinite; }
.hr-heap-obj.hr-h-protected { border-color: var(--hr-success); }
.hr-heap-obj.hr-h-pending   { border-color: var(--hr-warning); }
.hr-heap-obj.hr-flash       { outline: 3px solid var(--hr-accent); outline-offset: 0; }
@keyframes hr-pulse {
    0%,100%{ box-shadow: 0 0 0 3px color-mix(in srgb, var(--hr-danger) 18%, transparent); }
    50%{     box-shadow: 0 0 0 7px color-mix(in srgb, var(--hr-danger) 28%, transparent); }
}
.hr-heap-header {
    padding: 8px 12px; font-weight: 600;
    background: color-mix(in srgb, var(--hr-accent) 12%, transparent);
    color: var(--hr-accent);
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 1px solid color-mix(in srgb, var(--hr-accent) 20%, transparent);
    transition: background .3s, color .3s;
}
.hr-heap-obj.hr-h-freed     .hr-heap-header { background: var(--hr-surface-2); color: var(--hr-text-muted); }
.hr-heap-obj.hr-h-danger    .hr-heap-header { background: color-mix(in srgb, var(--hr-danger) 14%, transparent);  color: var(--hr-danger); }
.hr-heap-obj.hr-h-protected .hr-heap-header { background: color-mix(in srgb, var(--hr-success) 14%, transparent); color: var(--hr-success); }
.hr-heap-obj.hr-h-pending   .hr-heap-header { background: color-mix(in srgb, var(--hr-warning) 14%, transparent); color: var(--hr-warning); }
.hr-heap-addr { font-family: monospace; opacity: .7; }
.hr-heap-body { padding: 8px 12px; color: var(--hr-text-muted); }
.hr-heap-field { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid var(--hr-border); }
.hr-heap-field:last-child { border-bottom: none; }
.hr-field-key { color: var(--hr-text-muted); }
.hr-field-val { font-family: monospace; color: var(--hr-accent); font-weight: 500; }

/* ── Ref count ── */
.hr-rc-area { margin-left: auto; color: var(--hr-text-muted); font-weight: 400; display: flex; align-items: center; gap: 5px; }
.hr-refcount {
    display: inline-flex; align-items: center; justify-content: center;
    width: 22px; height: 22px; border-radius: 50%;
    font-weight: 600; border: 2px solid;
    transition: background .3s, color .3s, border-color .3s;
}
.hr-rc-two  { background: color-mix(in srgb, var(--hr-accent) 18%, transparent);  color: var(--hr-accent);  border-color: color-mix(in srgb, var(--hr-accent) 55%, transparent); }
.hr-rc-one  { background: color-mix(in srgb, var(--hr-warning) 18%, transparent); color: var(--hr-warning); border-color: color-mix(in srgb, var(--hr-warning) 55%, transparent); }
.hr-rc-zero { background: var(--hr-surface-2); color: var(--hr-text-muted); border-color: var(--hr-border); }

/* ── Dangle warning ── */
.hr-dangle {
    display: none; padding: 10px 12px; border-radius: 8px;
    border: 1.5px solid var(--hr-danger);
    background: color-mix(in srgb, var(--hr-danger) 7%, transparent);
}
.hr-dangle-title { font-weight: 500; color: var(--hr-danger); margin-bottom: 6px; }
.hr-dangle-code {
    font-family: monospace; color: var(--hr-danger);
    background: color-mix(in srgb, var(--hr-danger) 13%, transparent);
    padding: 8px 10px; border-radius: 6px; line-height: 1.7;
}
.hr-dangle-emph { color: var(--hr-danger); font-weight: 700; }

/* ── Buttons ── */
.hr-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.hr-btn {
    padding: 8px 16px; border-radius: 6px;
    border: 1.5px solid var(--hr-border); background: var(--hr-surface);
    color: inherit; font-family: inherit; font-weight: 500; cursor: pointer;
    transition: background .15s, border-color .15s, color .15s; white-space: nowrap;
}
.hr-btn:hover:not(:disabled) { background: var(--hr-surface-2); border-color: var(--hr-border-strong); }
.hr-btn:disabled { opacity: .4; cursor: default; }
.hr-btn-danger {
    border-color: color-mix(in srgb, var(--hr-danger) 55%, transparent);
    color: var(--hr-danger);
    background: color-mix(in srgb, var(--hr-danger) 6%, transparent);
}
.hr-btn-danger:hover:not(:disabled) { background: color-mix(in srgb, var(--hr-danger) 14%, transparent); }
.hr-btn-gc {
    border-color: color-mix(in srgb, var(--hr-success) 55%, transparent);
    color: var(--hr-success);
    background: color-mix(in srgb, var(--hr-success) 6%, transparent);
}
.hr-btn-gc:hover:not(:disabled) { background: color-mix(in srgb, var(--hr-success) 14%, transparent); }
.hr-btn-reset { border-color: var(--hr-border-strong); color: var(--hr-text-muted); }

/* ── Log ── */
.hr-log {
    margin-top: 14px; padding: 12px 14px; border-radius: 8px;
    border: 1.5px solid var(--hr-border); background: var(--hr-surface);
    transition: border-color .3s, background .3s;
}
.hr-log.hr-log-err  { border-color: color-mix(in srgb, var(--hr-danger) 55%, transparent);  background: color-mix(in srgb, var(--hr-danger) 6%, transparent); }
.hr-log.hr-log-gc   { border-color: color-mix(in srgb, var(--hr-accent) 55%, transparent);  background: color-mix(in srgb, var(--hr-accent) 6%, transparent); }
.hr-log.hr-log-warn { border-color: color-mix(in srgb, var(--hr-warning) 55%, transparent); background: color-mix(in srgb, var(--hr-warning) 6%, transparent); }
.hr-log.hr-log-ok   { border-color: color-mix(in srgb, var(--hr-success) 55%, transparent); background: color-mix(in srgb, var(--hr-success) 6%, transparent); }
.hr-log-line { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 5px; line-height: 1.55; }
.hr-log-line:last-child { margin-bottom: 0; }
.hr-log-icon { flex-shrink: 0; }
.hr-log-text { color: inherit; }
.hr-log-text code {
    font-family: monospace;
    background: color-mix(in srgb, var(--hr-accent) 18%, transparent);
    padding: 1px 5px; border-radius: 3px; color: var(--hr-accent);
}
.hr-t-err  { color: var(--hr-danger); }
.hr-t-err  code { background: color-mix(in srgb, var(--hr-danger) 18%, transparent);  color: var(--hr-danger); }
.hr-t-gc   { color: var(--hr-success); }
.hr-t-gc   code { background: color-mix(in srgb, var(--hr-success) 18%, transparent); color: var(--hr-success); }
.hr-t-warn { color: var(--hr-warning); }
.hr-t-warn code { background: color-mix(in srgb, var(--hr-warning) 18%, transparent); color: var(--hr-warning); }

/* ── GC note ── */
.hr-gc-note {
    margin-top: 8px; padding: 10px 12px; border-radius: 8px;
    border: 1.5px solid var(--hr-success);
    background: color-mix(in srgb, var(--hr-success) 6%, transparent);
    color: var(--hr-success);
    transition: border-color .3s, background .3s, color .3s;
}
.hr-gc-note.hr-gn-warn { border-color: var(--hr-warning); background: color-mix(in srgb, var(--hr-warning) 6%, transparent); color: var(--hr-warning); }
.hr-gc-note.hr-gn-done { border-color: var(--hr-border);  background: var(--hr-surface); color: var(--hr-text-muted); }
.hr-gc-note.hr-gn-skip { border-color: var(--hr-accent);  background: color-mix(in srgb, var(--hr-accent) 6%, transparent); color: var(--hr-accent); }
.hr-gc-note-title { font-weight: 500; margin-bottom: 4px; }

/* ── Inline text helpers (cho innerHTML từ JS) ── */
.hr-text-danger  { color: var(--hr-danger); font-weight: 600; }
.hr-text-success { color: var(--hr-success); }
.hr-text-muted   { color: var(--hr-text-muted); }
</style>

<div class="hr-isolate">
<div class="hr-wrap">

    <div class="hr-mode-bar">
        <button class="hr-mode-btn hr-on" id="hrModeManual" onclick="hrSetMode('manual')">Tự quản lý (C/C++)</button>
        <button class="hr-mode-btn"       id="hrModeGC"     onclick="hrSetMode('gc')">Có GC (Go)</button>
    </div>

    <div class="hr-outer-card">

        <div class="hr-card-head">
            <div id="hrHeaderDot" class="hr-head-dot"></div>
            <span id="hrHeaderLabel" class="hr-head-label"></span>
        </div>

        <div class="hr-board">

            <div class="hr-col">
                <div class="hr-col-title">
                    <div class="hr-col-title-dot" style="background: var(--hr-warning);"></div>
                    Stack (biến cục bộ)
                </div>

                <div class="hr-var hr-v-pointing" id="hrVarA">
                    <span class="hr-var-name">varA</span>
                    <span class="hr-var-addr" id="hrVarAAddr">0xC0001</span>
                    <span class="hr-var-status hr-s-ok" id="hrVarAStatus">dùng được</span>
                </div>
                <div class="hr-var hr-v-pointing" id="hrVarB">
                    <span class="hr-var-name">varB</span>
                    <span class="hr-var-addr" id="hrVarBAddr">0xC0001</span>
                    <span class="hr-var-status hr-s-ok" id="hrVarBStatus">dùng được</span>
                </div>

                <div class="hr-stack-note" id="hrStackNote">
                    Cả hai biến cùng trỏ đến <strong>một</strong> vùng nhớ trên heap.
                </div>

                <div class="hr-actions" id="hrActManual">
                    <button class="hr-btn hr-btn-danger" id="hrBtnFree" onclick="mFreeA()">free(varA)</button>
                    <button class="hr-btn hr-btn-reset"                 onclick="hrReset()">↺ Reset</button>
                </div>

                <div class="hr-actions" id="hrActGC" style="display:none;">
                    <button class="hr-btn hr-btn-danger" id="hrBtnNilA"  onclick="gcNilA()">varA = nil</button>
                    <button class="hr-btn hr-btn-danger" id="hrBtnNilB"  onclick="gcNilB()">varB = nil</button>
                    <button class="hr-btn hr-btn-gc"     id="hrBtnRunGC" onclick="gcRun()">Chạy GC</button>
                    <button class="hr-btn hr-btn-reset"                  onclick="hrReset()">↺ Reset</button>
                </div>

                <div class="hr-log" id="hrLog">
                    <div class="hr-log-line">
                        <span class="hr-log-icon">💡</span>
                        <span class="hr-log-text">-</span>
                    </div>
                </div>
            </div>

            <div class="hr-divider"></div>

            <div class="hr-col">
                <div class="hr-col-title">
                    <div class="hr-col-title-dot" style="background: var(--hr-accent);"></div>
                    Heap
                    <span class="hr-rc-area">
                        ref count: <span class="hr-refcount hr-rc-two" id="hrRefCount">2</span>
                    </span>
                </div>

                <div class="hr-heap-obj hr-h-alive" id="hrHeapObj">
                    <div class="hr-heap-header">
                        <span id="hrHeapLabel">struct User</span>
                        <span class="hr-heap-addr">0xC0001</span>
                    </div>
                    <div class="hr-heap-body">
                        <div class="hr-heap-field"><span class="hr-field-key">Name</span><span class="hr-field-val">"Alice"</span></div>
                        <div class="hr-heap-field"><span class="hr-field-key">Age</span><span class="hr-field-val">30</span></div>
                        <div class="hr-heap-field"><span class="hr-field-key">Email</span><span class="hr-field-val">"alice@..."</span></div>
                    </div>
                </div>

                <div id="hrDangle" class="hr-dangle">
                    <div class="hr-dangle-title">varB vẫn trỏ vào vùng nhớ đã free:</div>
                    <div class="hr-dangle-code">
                        varB.Name<br>
                        <span class="hr-dangle-emph">→ ??? undefined behavior</span>
                    </div>
                </div>

                <div class="hr-gc-note" id="hrGcNote" style="display:none;">
                    <div class="hr-gc-note-title" id="hrGcNoteTitle"></div>
                    <div id="hrGcNoteBody"></div>
                </div>
            </div>

        </div>
    </div>
</div>
</div>

<script>
(function(){
    var mode  = 'manual';
    var nilA  = false;
    var nilB  = false;
    var freed = false;

    function setVar(name, addr, varCls, addrCls, sTxt, sCls) {
        document.getElementById('hrVar'  + name).className              = 'hr-var ' + varCls;
        document.getElementById('hrVar'  + name + 'Addr').textContent   = addr;
        document.getElementById('hrVar'  + name + 'Addr').className     = 'hr-var-addr' + (addrCls ? ' ' + addrCls : '');
        document.getElementById('hrVar'  + name + 'Status').textContent = sTxt;
        document.getElementById('hrVar'  + name + 'Status').className   = 'hr-var-status ' + sCls;
    }

    function setHeap(cls, label) {
        document.getElementById('hrHeapObj').className = 'hr-heap-obj ' + cls;
        if (label !== undefined) document.getElementById('hrHeapLabel').textContent = label;
    }

    function setRC(n) {
        var el = document.getElementById('hrRefCount');
        el.textContent = n;
        el.className   = 'hr-refcount ' + (n >= 2 ? 'hr-rc-two' : n === 1 ? 'hr-rc-one' : 'hr-rc-zero');
    }

    function setLog(type, rows) {
        var log = document.getElementById('hrLog');
        log.className = 'hr-log' + (type ? ' hr-log-' + type : '');
        log.innerHTML = rows.map(function(r) {
            return '<div class="hr-log-line"><span class="hr-log-icon">' + r.icon +
                   '</span><span class="hr-log-text' + (r.cls ? ' hr-t-' + r.cls : '') + '">' +
                   r.text + '</span></div>';
        }).join('');
    }

    function note(show, cls, title, body) {
        var el = document.getElementById('hrGcNote');
        if (!show) { el.style.display = 'none'; return; }
        el.style.display = 'block';
        el.className     = 'hr-gc-note' + (cls ? ' ' + cls : '');
        document.getElementById('hrGcNoteTitle').textContent = title;
        document.getElementById('hrGcNoteBody').innerHTML    = body;
    }

    function refCount() { return (nilA ? 0 : 1) + (nilB ? 0 : 1); }

    function refreshNilBtns() {
        document.getElementById('hrBtnNilA').disabled = nilA;
        document.getElementById('hrBtnNilB').disabled = nilB;
    }

    window.hrSetMode = function(m) {
        mode = m;
        document.getElementById('hrModeManual').classList.toggle('hr-on', m === 'manual');
        document.getElementById('hrModeGC').classList.toggle('hr-on',     m === 'gc');
        document.getElementById('hrActManual').style.display = m === 'manual' ? 'flex' : 'none';
        document.getElementById('hrActGC').style.display     = m === 'gc'     ? 'flex' : 'none';

        var dot = document.getElementById('hrHeaderDot');
        var lbl = document.getElementById('hrHeaderLabel');
        if (m === 'gc') {
            dot.className   = 'hr-head-dot hr-head-dot--gc';
            lbl.textContent = 'Go - GC theo dõi references, tự thu hồi khi không còn ai dùng';
        } else {
            dot.className   = 'hr-head-dot hr-head-dot--manual';
            lbl.textContent = 'C/C++ - lập trình viên tự gọi free(), không có lưới an toàn';
        }
        hrReset(true);
    };

    window.hrReset = function() {
        nilA = nilB = freed = false;
        setVar('A', '0xC0001', 'hr-v-pointing', '', 'dùng được', 'hr-s-ok');
        setVar('B', '0xC0001', 'hr-v-pointing', '', 'dùng được', 'hr-s-ok');
        setHeap('hr-h-alive', 'struct User');
        setRC(2);
        document.getElementById('hrDangle').style.display = 'none';
        document.getElementById('hrStackNote').innerHTML =
            'Cả hai biến cùng trỏ đến <strong>một</strong> vùng nhớ trên heap.';
        var fb = document.getElementById('hrBtnFree');
        if (fb) fb.disabled = false;

        if (mode === 'gc') {
            refreshNilBtns();
            note(true, '', 'GC đang theo dõi', 'varA và varB đều tham chiếu → GC giữ object.');
            setLog('gc', [{icon:'💡', text:'Bỏ tham chiếu từng biến rồi nhấn "Chạy GC" để quan sát.'}]);
        } else {
            note(false);
            setLog('', [{icon:'💡', text:'Nhấn <code>free(varA)</code> để xem điều gì xảy ra.'}]);
        }
    };

    window.mFreeA = function() {
        document.getElementById('hrBtnFree').disabled = true;
        setVar('A', 'NULL',    'hr-v-nil',      'hr-a-nil', 'đã free()', 'hr-s-nil');
        setVar('B', '0xC0001', 'hr-v-dangling', 'hr-a-err', 'dangling!', 'hr-s-danger');
        setHeap('hr-h-danger', 'struct User');
        setRC(0);
        document.getElementById('hrDangle').style.display = 'block';
        document.getElementById('hrStackNote').innerHTML =
            '<strong class="hr-text-danger">varB vẫn giữ địa chỉ vùng nhớ đã bị giải phóng!</strong>';
        setLog('err', [
            {icon:'⚠️', text:'<code>free(varA)</code> đã giải phóng vùng nhớ <code>0xC0001</code>.', cls:'err'},
            {icon:'💥', text:'<code>varB</code> vẫn trỏ đến đó - <strong>dangling pointer</strong>. Truy cập <code>varB.Name</code> là undefined behavior: crash, đọc rác, hoặc lỗ hổng bảo mật.', cls:'err'}
        ]);
    };

    window.gcNilA = function() {
        nilA = true;
        setVar('A', 'nil', 'hr-v-nil', 'hr-a-nil', 'nil', 'hr-s-nil');
        var rc = refCount();
        setRC(rc);
        refreshNilBtns();

        if (!freed) setHeap(rc === 0 ? 'hr-h-pending' : 'hr-h-protected',
                            rc === 0 ? 'struct User - chờ GC' : 'struct User');

        document.getElementById('hrStackNote').innerHTML = rc > 0
            ? '<span class="hr-text-success">varB vẫn tham chiếu - GC sẽ không xóa object.</span>'
            : 'Không còn biến nào tham chiếu. Sẵn sàng để GC thu hồi.';

        if (rc > 0) {
            note(true, '', 'GC đang theo dõi',
                '<code>varA = nil</code> - varA bỏ tham chiếu.<br><strong>varB vẫn còn</strong> (ref count = ' + rc + ') → GC giữ nguyên object.');
            setLog('gc', [
                {icon:'✓',  text:'<code>varA = nil</code> - varA không còn giữ reference.', cls:'gc'},
                {icon:'🛡', text:'<code>varB</code> vẫn tham chiếu → GC <strong>giữ nguyên</strong> object. Nhấn "Chạy GC" để xác nhận.', cls:'gc'}
            ]);
        } else {
            note(true, 'hr-gn-warn', 'Chờ GC',
                'Ref count = 0. Không ai tham chiếu nữa → object sẽ bị thu hồi lần tới GC chạy. Nhấn "Chạy GC".');
            setLog('warn', [
                {icon:'🟡', text:'<code>varA = nil</code> - ref count giảm về 0.', cls:'warn'},
                {icon:'⏳', text:'Object vẫn còn trên heap cho đến khi GC chạy. Nhấn "Chạy GC".', cls:'warn'}
            ]);
        }
    };

    window.gcNilB = function() {
        nilB = true;
        setVar('B', 'nil', 'hr-v-nil', 'hr-a-nil', 'nil', 'hr-s-nil');
        var rc = refCount();
        setRC(rc);
        refreshNilBtns();

        if (!freed) setHeap(rc === 0 ? 'hr-h-pending' : 'hr-h-protected',
                            rc === 0 ? 'struct User - chờ GC' : 'struct User');

        document.getElementById('hrStackNote').innerHTML = rc > 0
            ? '<span class="hr-text-success">varA vẫn tham chiếu - GC sẽ không xóa object.</span>'
            : 'Không còn biến nào tham chiếu. Sẵn sàng để GC thu hồi.';

        if (rc > 0) {
            note(true, '', 'GC đang theo dõi',
                '<code>varB = nil</code> - varB bỏ tham chiếu.<br><strong>varA vẫn còn</strong> (ref count = ' + rc + ') → GC giữ nguyên object.');
            setLog('gc', [
                {icon:'✓',  text:'<code>varB = nil</code> - varB không còn giữ reference.', cls:'gc'},
                {icon:'🛡', text:'<code>varA</code> vẫn tham chiếu → GC <strong>giữ nguyên</strong> object. Nhấn "Chạy GC" để xác nhận.', cls:'gc'}
            ]);
        } else {
            note(true, 'hr-gn-warn', 'Chờ GC',
                'Ref count = 0. Không ai tham chiếu nữa → object sẽ bị thu hồi lần tới GC chạy. Nhấn "Chạy GC".');
            setLog('warn', [
                {icon:'🟡', text:'<code>varB = nil</code> - ref count giảm về 0.', cls:'warn'},
                {icon:'⏳', text:'Object vẫn còn trên heap cho đến khi GC chạy. Nhấn "Chạy GC".', cls:'warn'}
            ]);
        }
    };

    window.gcRun = function() {
        var rc = refCount();

        if (rc > 0) {
            var refs = [];
            if (!nilA) refs.push('<code>varA</code>');
            if (!nilB) refs.push('<code>varB</code>');
            note(true, 'hr-gn-skip', 'GC chạy xong - không xóa',
                refs.join(' và ') + ' vẫn còn tham chiếu (ref count = ' + rc + ') → GC <strong>bỏ qua</strong> object này.');
            setLog('gc', [
                {icon:'🔍', text:'GC quét heap... phát hiện ' + refs.join(' và ') + ' vẫn trỏ đến <code>0xC0001</code>.', cls:'gc'},
                {icon:'⏭',  text:'Ref count = ' + rc + ' → GC <strong>giữ nguyên</strong> object. Chưa có gì bị xóa.', cls:'gc'}
            ]);
            var obj = document.getElementById('hrHeapObj');
            obj.classList.add('hr-flash');
            setTimeout(function(){ obj.classList.remove('hr-flash'); }, 600);
        } else {
            freed = true;
            setHeap('hr-h-freed', 'struct User');
            note(true, 'hr-gn-done', 'GC hoàn tất - đã thu hồi',
                'Ref count = 0. Không còn ai tham chiếu → GC giải phóng <code>0xC0001</code> và trả bộ nhớ cho allocator.');
            document.getElementById('hrStackNote').innerHTML =
                '<span class="hr-text-muted">Vùng nhớ đã được thu hồi an toàn.</span>';
            setLog('ok', [
                {icon:'🔍', text:'GC quét heap... <code>0xC0001</code> - ref count = 0, không ai tham chiếu.', cls:'gc'},
                {icon:'♻️', text:'Vùng nhớ thu hồi <strong>an toàn</strong>. Không dangling pointer, không undefined behavior.', cls:'gc'}
            ]);
        }
    };

    hrSetMode('manual');
})();
</script>
{{< /rawhtml >}}

Mỗi process sẽ tách biệt nhau về bộ nhớ. Do đó, địa chỉ bộ nhớ process A có thể trùng với địa chỉ bộ nhớ của process B, nhưng đó là 2 vùng nhớ khác nhau trong RAM vật lý.

{{< rawhtml >}}
<style>
.vm-svg-wrap {
    width: 100%;
    box-sizing: border-box;
    margin: 20px 0;
    background: transparent;
}
.vm-svg-wrap svg {
    width: 100%;
    height: auto;
    display: block;
}

.vm-box { fill: #f1efe8; stroke: #5f5e5a; }
.vm-box-teal-outer { fill: rgba(225,245,238,0.85); stroke: #0f6e56; }
.vm-box-teal-inner { fill: rgba(159,225,203,0.70); stroke: #0f6e56; }
.vm-box-purple-outer { fill: rgba(238,237,254,0.85); stroke: #534ab7; }
.vm-box-purple-inner { fill: rgba(206,203,246,0.70); stroke: #534ab7; }
.vm-box-coral-outer { fill: rgba(250,236,231,0.85); stroke: #993c1d; }
.vm-box-coral-inner { fill: rgba(245,196,179,0.70); stroke: #993c1d; }
.vm-box-gray-outer { fill: rgba(241,239,232,0.85); stroke: #5f5e5a; }

.vm-th { font-family: inherit; font-weight: 500; fill: #2c2c2a; }
.vm-ts { font-family: inherit; font-weight: 400; fill: #5f5e5a; }
.vm-ts-teal { font-family: inherit; font-weight: 400; fill: #085041; }
.vm-ts-purple { font-family: inherit; font-weight: 400; fill: #3c3489; }
.vm-ts-coral { font-family: inherit; font-weight: 400; fill: #712b13; }
.vm-th-teal { font-family: inherit; font-weight: 500; fill: #085041; }
.vm-th-purple { font-family: inherit; font-weight: 500; fill: #3c3489; }
.vm-th-coral { font-family: inherit; font-weight: 500; fill: #712b13; }
.vm-th-gray { font-family: inherit; font-weight: 500; fill: #2c2c2a; }
.vm-ts-gray { font-family: inherit; font-weight: 400; fill: #5f5e5a; }
</style>

<div class="vm-svg-wrap">
<svg viewBox="0 0 680 420" xmlns="http://www.w3.org/2000/svg">

  <rect x="30" y="30" width="620" height="360" rx="16" stroke-width="0.5" class="vm-box-gray-outer"/>
  <text class="vm-th-gray" x="340" y="58" text-anchor="middle" dominant-baseline="central" font-size="14">Physical RAM</text>
  <text class="vm-ts-gray" x="340" y="76" text-anchor="middle" dominant-baseline="central" font-size="12">quản lý bởi OS kernel</text>

  <rect x="60" y="100" width="175" height="260" rx="10" stroke-width="0.5" class="vm-box-teal-outer"/>
  <text class="vm-th-teal" x="147" y="126" text-anchor="middle" dominant-baseline="central" font-size="14">Process A</text>
  <text class="vm-ts-teal" x="147" y="144" text-anchor="middle" dominant-baseline="central" font-size="12">go run server.go</text>

  <rect x="72" y="162" width="151" height="30" rx="6" stroke-width="0.5" class="vm-box-teal-inner"/>
  <text class="vm-ts-teal" x="147" y="177" text-anchor="middle" dominant-baseline="central" font-size="12">stack (goroutine)</text>

  <rect x="72" y="198" width="151" height="30" rx="6" stroke-width="0.5" class="vm-box-teal-inner"/>
  <text class="vm-ts-teal" x="147" y="213" text-anchor="middle" dominant-baseline="central" font-size="12">heap (GC managed)</text>

  <rect x="72" y="234" width="151" height="30" rx="6" stroke-width="0.5" class="vm-box-teal-inner"/>
  <text class="vm-ts-teal" x="147" y="249" text-anchor="middle" dominant-baseline="central" font-size="12">BSS / Data</text>

  <rect x="72" y="270" width="151" height="30" rx="6" stroke-width="0.5" class="vm-box-teal-inner"/>
  <text class="vm-ts-teal" x="147" y="285" text-anchor="middle" dominant-baseline="central" font-size="12">code segment</text>

  <rect x="72" y="310" width="151" height="36" rx="6" stroke-width="0.5" class="vm-box-teal-inner"/>
  <text class="vm-ts-teal" x="147" y="322" text-anchor="middle" dominant-baseline="central" font-size="12">virtual addr space</text>
  <text class="vm-ts-teal" x="147" y="338" text-anchor="middle" dominant-baseline="central" font-size="12">0x00 → 0xFF…</text>

  <rect x="253" y="100" width="175" height="260" rx="10" stroke-width="0.5" class="vm-box-purple-outer"/>
  <text class="vm-th-purple" x="340" y="126" text-anchor="middle" dominant-baseline="central" font-size="14">Process B</text>
  <text class="vm-ts-purple" x="340" y="144" text-anchor="middle" dominant-baseline="central" font-size="12">go run worker.go</text>

  <rect x="265" y="162" width="151" height="30" rx="6" stroke-width="0.5" class="vm-box-purple-inner"/>
  <text class="vm-ts-purple" x="340" y="177" text-anchor="middle" dominant-baseline="central" font-size="12">stack (goroutine)</text>

  <rect x="265" y="198" width="151" height="30" rx="6" stroke-width="0.5" class="vm-box-purple-inner"/>
  <text class="vm-ts-purple" x="340" y="213" text-anchor="middle" dominant-baseline="central" font-size="12">heap (GC managed)</text>

  <rect x="265" y="234" width="151" height="30" rx="6" stroke-width="0.5" class="vm-box-purple-inner"/>
  <text class="vm-ts-purple" x="340" y="249" text-anchor="middle" dominant-baseline="central" font-size="12">BSS / Data</text>

  <rect x="265" y="270" width="151" height="30" rx="6" stroke-width="0.5" class="vm-box-purple-inner"/>
  <text class="vm-ts-purple" x="340" y="285" text-anchor="middle" dominant-baseline="central" font-size="12">code segment</text>

  <rect x="265" y="310" width="151" height="36" rx="6" stroke-width="0.5" class="vm-box-purple-inner"/>
  <text class="vm-ts-purple" x="340" y="322" text-anchor="middle" dominant-baseline="central" font-size="12">virtual addr space</text>
  <text class="vm-ts-purple" x="340" y="338" text-anchor="middle" dominant-baseline="central" font-size="12">0x00 → 0xFF…</text>

  <rect x="446" y="100" width="175" height="260" rx="10" stroke-width="0.5" class="vm-box-coral-outer"/>
  <text class="vm-th-coral" x="533" y="126" text-anchor="middle" dominant-baseline="central" font-size="14">Process C</text>
  <text class="vm-ts-coral" x="533" y="144" text-anchor="middle" dominant-baseline="central" font-size="12">go run api.go</text>

  <rect x="458" y="162" width="151" height="30" rx="6" stroke-width="0.5" class="vm-box-coral-inner"/>
  <text class="vm-ts-coral" x="533" y="177" text-anchor="middle" dominant-baseline="central" font-size="12">stack (goroutine)</text>

  <rect x="458" y="198" width="151" height="30" rx="6" stroke-width="0.5" class="vm-box-coral-inner"/>
  <text class="vm-ts-coral" x="533" y="213" text-anchor="middle" dominant-baseline="central" font-size="12">heap (GC managed)</text>

  <rect x="458" y="234" width="151" height="30" rx="6" stroke-width="0.5" class="vm-box-coral-inner"/>
  <text class="vm-ts-coral" x="533" y="249" text-anchor="middle" dominant-baseline="central" font-size="12">BSS / Data</text>

  <rect x="458" y="270" width="151" height="30" rx="6" stroke-width="0.5" class="vm-box-coral-inner"/>
  <text class="vm-ts-coral" x="533" y="285" text-anchor="middle" dominant-baseline="central" font-size="12">code segment</text>

  <rect x="458" y="310" width="151" height="36" rx="6" stroke-width="0.5" class="vm-box-coral-inner"/>
  <text class="vm-ts-coral" x="533" y="322" text-anchor="middle" dominant-baseline="central" font-size="12">virtual addr space</text>
  <text class="vm-ts-coral" x="533" y="338" text-anchor="middle" dominant-baseline="central" font-size="12">0x00 → 0xFF…</text>

  <line x1="235" y1="110" x2="253" y2="110" stroke="#b4b2a9" stroke-width="0.5" stroke-dasharray="4 3"/>
  <line x1="235" y1="350" x2="253" y2="350" stroke="#b4b2a9" stroke-width="0.5" stroke-dasharray="4 3"/>
  <line x1="428" y1="110" x2="446" y2="110" stroke="#b4b2a9" stroke-width="0.5" stroke-dasharray="4 3"/>
  <line x1="428" y1="350" x2="446" y2="350" stroke="#b4b2a9" stroke-width="0.5" stroke-dasharray="4 3"/>

</svg>
</div>
{{< /rawhtml >}}

## Go Memory Allocation là gì?

Memory allocation trong Go là quá trình runtime cấp phát vùng nhớ để lưu trữ dữ liệu khi chương trình chạy. Dù Go có Garbage Collector (GC) tự động dọn rác, điều đó không có nghĩa là ta có thể hoàn toàn bỏ qua việc cấp phát bộ nhớ.

Mỗi biến được tạo ra đều cần một nơi để tồn tại. Có biến sống ngắn và chỉ phục vụ trong phạm vi hàm, có biến lại cần tồn tại lâu hơn để được dùng ở nơi khác. Tùy vào cách sử dụng, Go sẽ quyết định đặt dữ liệu đó trên **stack** hoặc **heap**.

## Stack và Heap

Có một sự thật rằng, trong phần lớn trường hợp, chi phí việc tìm kiếm memory trên **stack** sẽ rẻ hơn tìm kiếm trên **heap**. Cũng tương tự như thế, chi phí cho việc dọn dẹp rác trên **stack** cũng rẻ hơn trên **heap**.

Dù sao thì **stack** cũng sẽ được tự động dọn dẹp sau khi thoát hàm. Còn trên **heap** thì nó chỉ bị dọn dẹp khi không có 1 vùng nhớ nào đang tham chiếu vào nó nữa, và công việc dọn dẹp đó là việc của GC.

{{< callout >}}
Do đó, nếu ta sinh ra quá nhiều bộ nhớ trên **heap** mà không có mục đích dùng lâu dài trong chương trình, thì sẽ gây áp lực lên GC để dọn dẹp trên **heap**.
{{< /callout >}}

## Escape Analysis hoạt động như thế nào?

Escape analysis là cơ chế compiler dùng để quyết định một giá trị nên nằm trên **stack** hay **heap**.

Ý tưởng rất đơn giản:

- Nếu dữ liệu chỉ sống trong phạm vi hàm và không thoát ra ngoài, nó có thể nằm trên **stack**

- Nếu dữ liệu “escape” khỏi phạm vi hàm, nó sẽ phải nằm trên **heap.**

```go
func createUser() *User {
	u := User{Name: "Alice"}
	return &u
}
```

Ở đây, `u` được tạo trong hàm nhưng lại được trả về ra ngoài qua con trỏ. Vì vậy, nó không thể an toàn nếu chỉ nằm trên **stack** của hàm `createUser`, nên compiler sẽ cấp phát nó trên **heap**.

## Go Heap và block size classes

**Heap** là vùng nhớ có dung lượng khá lớn. **Heap** sẽ lưu trữ các vùng nhớ được cấp phát vào các *block size classes*.

Mỗi lần bạn khởi tạo một biến, Go sẽ không nói OS rằng: "Hey, cấp giúp tôi vùng nhớ cho biến này đi!", bởi vì việc đó rất tốn kém bởi chi phí switching giữa kernel và Go runtime. Thay vào đó, Go sẽ yêu cầu OS cấp một vùng địa chỉ bộ nhớ có kích thước khoảng 64MB (trong hệ 64 bit) gọi là Arena. Lưu ý đây chỉ là vùng nhớ địa chỉ giành chỗ của Go và chưa được sử dụng, cho nên sẽ không tốn RAM. Vùng địa chỉ bộ nhớ đó sẽ thuộc Go quản lý, khi bạn khởi tạo một biến nào đó, Go sẽ tìm kiếm vùng nhớ trống và cắt phần bộ nhớ đó cho bạn.

Để quản lý hiệu quả, tăng tốc độ truy xuất cũng như cấp phát nhanh hơn. Go tổ chức bộ nhớ thành nhiều vùng khác nhau, nhỏ nhất là block size classes.

- Với các biến `<= 32KB`, chúng sẽ được phân bổ vào các block size do Go định nghĩa, với kích thước nhỏ nhất là 8, 16, 32, 48, 64, 80 và 96 bytes.

- Đối với các biến `> 32KB`, chúng sẽ được phân bổ vào nhiều page có kích thước 8KB mỗi page (page là vùng nhớ lớn hơn block size classes).

Do đó, nếu bạn yêu cầu cấp vùng nhớ cho biến có kích thước 24 bytes, bản chất Go sẽ không cắt cho bạn 24 bytes, mà nó sẽ cấp cho bạn một block size classes có kích thước là 32 bytes, bạn sẽ bị lãng phí 8 bytes. Tương tự như thế, nếu bạn yêu cầu Go cấp vùng nhớ nằm trong khoảng [33, 48] thì Go cũng sẽ cấp cho bạn vùng nhớ 48 bytes.

Vậy khi bạn yêu cầu cấp vùng nhớ có slice có kích thước 32769 phần tử (`> 32 KB`), Go sẽ cấp cho bạn vùng nhớ (32768 + 8192, tương đương là 5 pages). Vì vậy, bạn đang lãng phí mất 8191 bytes bộ nhớ rồi.

{{< callout >}}
Đọc thêm bài [Memory Alignment là gì?](/memory-alignment/) để biết thêm cách tránh lãng phí bộ nhớ trong Golang.
{{< /callout >}}

{{< callout type="note" >}}
Nếu bạn đọc muốn hiểu rõ hơn về cơ chế chia cũng như cấp phát, bạn đọc có thể đọc bài [Understanding the Go Runtime: The Memory Allocator](https://internals-for-interns.com/posts/go-memory-allocator/). Tôi sẽ không đi sâu đến phần thiết kế bên dưới của Go vì không phải mục đích tôi muốn nói đến ở đây. Bên dưới tôi sẽ vẽ một bản tóm tắt.
{{< /callout >}}

{{< rawhtml >}}
<style>
  .alloc-widget * { box-sizing: border-box; margin: 0; padding: 0; }

  .alloc-widget {
    font-family: 'DM Sans', sans-serif;
    background: #f8f7f4;
    border: 1.5px solid #ddd8d0;
    border-radius: 12px;
    overflow: hidden;
    margin: 24px 0;
    box-shadow: 0 2px 12px rgba(0,0,0,0.09);
    color: #1a1a2e;
  }

  .alloc-header {
    background: #1a1a2e;
    color: #f0ede8;
    padding: 10px 18px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .alloc-header-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #5c9ece; display: inline-block;
  }

  .alloc-body {
    display: flex;
    flex-direction: column;
  }

  @media (min-width: 680px) {
    .alloc-body { flex-direction: row; }
  }

  .alloc-ladder {
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    flex: 0 0 230px;
    border-right: 1.5px solid #ddd8d0;
    background: #f8f7f4;
  }

  .alloc-level {
    position: relative;
    cursor: pointer;
    user-select: none;
  }

  .alloc-level:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: -16px;
    width: 2px;
    height: 16px;
    background: #c5bfb5;
    transform: translateX(-50%);
  }

  .alloc-level + .alloc-level { margin-top: 16px; }

  .alloc-box {
    border-radius: 8px;
    padding: 10px 14px;
    border: 1.5px solid transparent;
    transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .alloc-level:hover .alloc-box,
  .alloc-level.active .alloc-box {
    transform: translateX(4px);
    box-shadow: 0 2px 10px rgba(0,0,0,0.12);
  }

  .alloc-level.active .alloc-box { border-color: rgba(0,0,0,0.18); }

  .alloc-box-icon {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 700;
    width: 28px; height: 28px;
    border-radius: 6px;
    background: rgba(0,0,0,0.12);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    color: #1a1a2e;
  }

  .alloc-box-text { flex: 1; }

  .alloc-box-name {
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    font-size: 13px;
    color: #1a1a2e;
    line-height: 1.2;
  }

  .alloc-box-size {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #5a5650;
    margin-top: 2px;
  }

  .lvl-arena  .alloc-box { background: #FFDBB5; }
  .lvl-page   .alloc-box { background: #B7EFC5; }
  .lvl-span   .alloc-box { background: #BAE0FD; }
  .lvl-szcls  .alloc-box { background: #BDB8FB; }
  .lvl-obj    .alloc-box { background: #F0BAF5; }

  .lvl-page  { padding-left: 14px; }
  .lvl-span  { padding-left: 28px; }
  .lvl-szcls { padding-left: 42px; }
  .lvl-obj   { padding-left: 56px; }

  .alloc-info {
    flex: 1;
    padding: 20px 22px;
    background: #ffffff;
    color: #1a1a2e;
    display: flex;
    flex-direction: column;
    min-height: 320px;
  }

  .alloc-info-top {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
    padding-bottom: 12px;
    border-bottom: 2px solid #f0ede8;
  }

  .alloc-info-dot {
    width: 12px; height: 12px; border-radius: 50%;
    background: #ddd; transition: background 0.25s; flex-shrink: 0;
  }

  .alloc-info-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    font-weight: 700;
    color: #1a1a2e;
  }

  .alloc-info-badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 999px;
    background: #eaf3ff;
    color: #1a4a8a;
    border: 1px solid #bfdbfe;
    white-space: nowrap;
  }

  .alloc-info-body {
    font-size: 13.5px;
    line-height: 1.75;
    color: #2e2e3a;
    flex: 1;
  }

  .alloc-info-body p { margin-bottom: 10px; }
  .alloc-info-body b { color: #1a1a2e; font-weight: 600; }
  .alloc-info-body ul { padding-left: 18px; margin-top: 6px; }
  .alloc-info-body ul li { margin-bottom: 4px; }
  .alloc-info-body ol { padding-left: 18px; margin: 8px 0; }

  .alloc-info-body code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11.5px;
    line-height: 1.5;
    background: #eaf3ff !important;
    color: #1a4a8a !important;
    border: 1px solid #bfdbfe;
    padding: 1px 5px;
    border-radius: 4px;
  }

  .alloc-code {
    background: #1a1a2e;
    color: #a9d7f0;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11.5px;
    line-height: 1.8;
    padding: 10px 14px;
    border-radius: 6px;
    border-left: 3px solid #5c9ece;
    margin: 10px 0;
    white-space: pre;
    overflow-x: auto;
  }

  .alloc-slot-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    margin: 10px 0;
  }

  .alloc-slot {
    width: 14px; height: 14px; border-radius: 2px;
    background: #BAE0FD;
    border: 1px solid #70b5e8;
  }

  .alloc-slot.used {
    background: #1a6ab0;
    border-color: #0d4a82;
  }

  .alloc-slot-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #5a5650;
    margin-top: 4px;
  }

  .alloc-table {
    width: 100%;
    border-collapse: collapse;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11.5px;
    margin: 10px 0;
    background: #ffffff !important;
    border: 1.5px solid #ddd8d0 !important;
  }

  .alloc-table th {
    background: #f0ede8 !important;
    color: #5a5650 !important;
    font-weight: 600;
    padding: 6px 10px;
    text-align: left;
    border-bottom: 1.5px solid #c5bfb5 !important;
    border-right: 1px solid #ddd8d0 !important;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .alloc-table th:last-child { border-right: none !important; }

  .alloc-table td {
    padding: 5px 10px;
    border-bottom: 1px solid #e8e4de !important;
    border-right: 1px solid #f0ede8 !important;
    color: #2e2e3a !important;
    background: #ffffff !important;
  }

  .alloc-table td:last-child { border-right: none !important; }
  .alloc-table tr:last-child td { border-bottom: none !important; }
  .alloc-table tr:hover td { background: #f8f7f4 !important; }

  .alloc-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 100%;
    min-height: 200px;
    color: #b5b0a8;
    text-align: center;
    font-size: 13px;
  }

  /* Dark mode */
  .dark .alloc-widget {
    background: #1c1f26;
    border-color: #2d3340;
    color: #e6edf3;
  }
  .dark .alloc-ladder {
    background: #1c1f26;
    border-right-color: #2d3340;
  }
  .dark .alloc-level:not(:last-child)::after {
    background: #3d4454;
  }
  .dark .alloc-box-name { color: #e6edf3; }
  .dark .alloc-box-size { color: #b0bac4; }
  .dark .alloc-box-icon {
    background: rgba(255,255,255,0.10);
    color: #e6edf3;
  }
  .dark .lvl-arena  .alloc-box { background: #5c3a1e; }
  .dark .lvl-page   .alloc-box { background: #1e4d2e; }
  .dark .lvl-span   .alloc-box { background: #1e3d5c; }
  .dark .lvl-szcls  .alloc-box { background: #2e2860; }
  .dark .lvl-obj    .alloc-box { background: #4a1e48; }
  .dark .alloc-info {
    background: #161b22;
    color: #e6edf3;
  }
  .dark .alloc-info-top { border-bottom-color: #2d3340; }
  .dark .alloc-info-title { color: #e6edf3; }
  .dark .alloc-info-badge {
    background: #1a2a4a;
    color: #93c5fd;
    border-color: #2d4a7a;
  }
  .dark .alloc-info-body { color: #c9d1d9; }
  .dark .alloc-info-body b { color: #e6edf3; }
  .dark .alloc-info-body code {
    background: #1a2a4a !important;
    color: #93c5fd !important;
    border-color: #2d4a7a !important;
  }
  .dark .alloc-table {
    background: #161b22 !important;
    border-color: #2d3340 !important;
  }
  .dark .alloc-table th {
    background: #1c2330 !important;
    color: #8b949e !important;
    border-bottom-color: #2d3340 !important;
    border-right-color: #2d3340 !important;
  }
  .dark .alloc-table td {
    color: #c9d1d9 !important;
    background: #161b22 !important;
    border-bottom-color: #21262d !important;
    border-right-color: #21262d !important;
  }
  .dark .alloc-table tr:hover td { background: #1c2330 !important; }
  .dark .alloc-placeholder { color: #484f58; }
</style>

<div class="alloc-widget">
  <div class="alloc-header">
    <span class="alloc-header-dot"></span>
    Go Runtime Memory Allocator
  </div>
  <div class="alloc-body">

    <div class="alloc-ladder">
      <div class="alloc-level lvl-arena" data-key="arena">
        <div class="alloc-box">
          <div class="alloc-box-icon">A</div>
          <div class="alloc-box-text">
            <div class="alloc-box-name">Arena</div>
            <div class="alloc-box-size">64 MB / arena</div>
          </div>
        </div>
      </div>
      <div class="alloc-level lvl-page" data-key="page">
        <div class="alloc-box">
          <div class="alloc-box-icon">P</div>
          <div class="alloc-box-text">
            <div class="alloc-box-name">Page</div>
            <div class="alloc-box-size">8 KB · 8192 pages/arena</div>
          </div>
        </div>
      </div>
      <div class="alloc-level lvl-span" data-key="span">
        <div class="alloc-box">
          <div class="alloc-box-icon">S</div>
          <div class="alloc-box-text">
            <div class="alloc-box-name">Span</div>
            <div class="alloc-box-size">1–N pages, 1 size class</div>
          </div>
        </div>
      </div>
      <div class="alloc-level lvl-szcls" data-key="szcls">
        <div class="alloc-box">
          <div class="alloc-box-icon">C</div>
          <div class="alloc-box-text">
            <div class="alloc-box-name">Size Class</div>
            <div class="alloc-box-size">68 classes · 8B → 32KB</div>
          </div>
        </div>
      </div>
      <div class="alloc-level lvl-obj" data-key="obj">
        <div class="alloc-box">
          <div class="alloc-box-icon">O</div>
          <div class="alloc-box-text">
            <div class="alloc-box-name">Object Slot</div>
            <div class="alloc-box-size">allocBits bitmap</div>
          </div>
        </div>
      </div>
    </div>

    <div class="alloc-info" id="alloc-info-panel">
      <div class="alloc-placeholder">
        <p>Chọn một tầng bên trái để xem chi tiết.</p>
      </div>
    </div>

  </div>
</div>

<script>
(function() {
  var DATA = {
    arena: {
      title: 'Arena',
      badge: '64 MB · OS-level',
      color: '#FF8C42',
      html: '<p>Runtime yêu cầu OS cấp phát bộ nhớ theo từng khối lớn gọi là <b>Arena</b>. Trên hầu hết hệ thống 64-bit, mỗi arena có kích thước <b>64 MB</b>.</p><p><b>Cơ chế 3 bước - chi phí tăng dần:</b></p><ul><li><b>Reserve</b> - đặt chỗ 64 MB address space. Không tốn RAM vật lý.</li><li><b>Commit</b> - báo OS dùng từng vùng ~4 MB khi cần. Mỗi lần = 1 syscall.</li><li><b>Fault-in</b> - OS ánh xạ physical page (4 KB) khi chương trình ghi thực sự.</li></ul><p>Các arena <b>không cần liền kề</b> trong address space. Runtime theo dõi qua bản đồ nội bộ (<code>heapArenas</code>).</p><div class="alloc-code">// Kích thước arena theo nền tảng\n64 MB  - Linux/macOS 64-bit\n 4 MB  - Windows, 32-bit\n512 KB - WebAssembly</div>'
    },
    page: {
      title: 'Page',
      badge: '8 KB · Go internal',
      color: '#22c55e',
      html: '<p>Mỗi arena được chia thành <b>8192 page</b>, mỗi page 8 KB. Đây là đơn vị làm việc nội bộ của allocator - <b>không phải</b> OS page (thường 4 KB).</p><ul><li>1 arena = <b>64 MB ÷ 8 KB = 8192 pages</b></li><li>Runtime theo dõi trạng thái mỗi page qua <code>heapBits</code>.</li><li>Page là đơn vị gộp khi tạo Span.</li></ul><div class="alloc-code">Arena (64 MB)\n├─ Page 0    (8 KB)\n├─ Page 1    (8 KB)  ←─ span chiếm N page liên tiếp\n├─ Page 2    (8 KB) ╱\n│   ...\n└─ Page 8191 (8 KB)</div>'
    },
    span: {
      title: 'Span',
      badge: '1–N pages · mSpan',
      color: '#3b82f6',
      html: '<p>Một <b>Span</b> là tập hợp N page liên tiếp, dành riêng để chứa các object cùng <b>một kích thước duy nhất</b>. Đây là nơi allocator thực sự trao bộ nhớ cho chương trình.</p><p><b>Ví dụ:</b> Span cho object 32 byte = 1 page (8 KB) → 256 slot.</p><div id="alloc-slot-demo"></div><ul><li><b>allocBits</b> - bitmap 1 bit/slot: <code>1</code> = đang dùng, <code>0</code> = trống.</li><li><b>gcmarkBits</b> - GC dùng trong mark phase.</li><li>Metadata: start address, số page, số slot, đã alloc bao nhiêu.</li></ul><p>Tìm slot trống = scan bitmap → cực nhanh. Không cần merge, không fragmentation.</p>',
      afterRender: function() {
        var el = document.getElementById('alloc-slot-demo');
        if (!el) return;
        var used = [0,1,3,5,6,7,10,12,13,14,15,18,20,22];
        var html = '<div class="alloc-slot-grid">';
        for (var i = 0; i < 32; i++) {
          html += '<div class="alloc-slot' + (used.indexOf(i) >= 0 ? ' used' : '') + '" title="slot ' + i + ': ' + (used.indexOf(i) >= 0 ? 'used' : 'free') + '"></div>';
        }
        html += '</div><div class="alloc-slot-label">allocBits (256 slots, hiển thị 32 đầu) &nbsp;&#9632; used &nbsp;&#9633; free</div>';
        el.innerHTML = html;
      }
    },
    szcls: {
      title: 'Size Class',
      badge: '68 classes · 8B→32KB',
      color: '#8b5cf6',
      html: '<p>Allocator định nghĩa <b>68 size class</b> từ 8 B đến 32 KB. Object 20 byte → làm tròn lên class gần nhất (24 B). Mỗi class có span riêng với số page tối ưu.</p><p>Nguyên tắc chọn số page: tăng dần đến khi <b>waste &lt; 12.5%</b> span size.</p><table class="alloc-table"><tr><th>Class</th><th>Obj size</th><th>Span</th><th>Slots</th><th>Waste</th></tr><tr><td>1</td><td>8 B</td><td>8 KB (1p)</td><td>1024</td><td>0%</td></tr><tr><td>4</td><td>32 B</td><td>8 KB (1p)</td><td>256</td><td>0%</td></tr><tr><td>10</td><td>128 B</td><td>8 KB (1p)</td><td>64</td><td>0%</td></tr><tr><td>32</td><td>1024 B</td><td>8 KB (1p)</td><td>8</td><td>0%</td></tr><tr><td>41</td><td>3072 B</td><td>24 KB (3p)</td><td>8</td><td>0%</td></tr><tr><td>46</td><td>5376 B</td><td>16 KB (2p)</td><td>3</td><td>1.6%</td></tr><tr><td>60</td><td>18432 B</td><td>72 KB (9p)</td><td>4</td><td>0%</td></tr><tr><td>67</td><td>32768 B</td><td>32 KB (4p)</td><td>1</td><td>0%</td></tr></table><p>Object &gt; 32 KB → cấp phát thẳng từ heap, không qua size class.</p>'
    },
    obj: {
      title: 'Object Slot',
      badge: 'allocBits · zero-cost free',
      color: '#d946ef',
      html: '<p>Tầng nhỏ nhất - một <b>slot</b> trong span. Khi code Go alloc một object, runtime chỉ cần:</p><ol style="padding-left:18px;margin:8px 0"><li>Tìm span đúng size class.</li><li>Scan <code>allocBits</code> tìm bit <code>0</code> đầu tiên.</li><li>Flip bit → <code>1</code>. Trả về con trỏ.</li></ol><p><b>Không syscall, không lock toàn cục</b> - mỗi P (processor) có cache span riêng (<code>mcache</code>), cấp phát hoàn toàn local.</p><div class="alloc-code">// Escape analysis quyết định Stack vs Heap\nfunc foo() *MyStruct {\n    s := &MyStruct{} // escapes → Heap slot\n    return s\n}\n\nfunc bar() {\n    s := MyStruct{}  // no escape → Stack\n    _ = s\n}</div><p>Khi GC thu hồi: chỉ cần flip bit <code>allocBits</code> về <code>0</code>. Slot sẵn sàng dùng lại ngay.</p>'
    }
  };

  var levels = document.querySelectorAll('.alloc-level');
  var panel  = document.getElementById('alloc-info-panel');

  levels.forEach(function(lvl) {
    lvl.addEventListener('click', function() {
      levels.forEach(function(l) { l.classList.remove('active'); });
      lvl.classList.add('active');

      var data = DATA[lvl.dataset.key];
      panel.innerHTML =
        '<div class="alloc-info-top">' +
          '<div class="alloc-info-dot" style="background:' + data.color + '"></div>' +
          '<div class="alloc-info-title">' + data.title + '</div>' +
          '<div class="alloc-info-badge">' + data.badge + '</div>' +
        '</div>' +
        '<div class="alloc-info-body">' + data.html + '</div>';

      if (data.afterRender) data.afterRender();
    });
  });

  document.querySelector('.alloc-level[data-key="arena"]').click();
})();
</script>
{{< /rawhtml >}}

## Cách giảm memory allocation trong Go

Tôi không nghĩ là mình sẽ cố gắng làm sao để Go giảm bộ nhớ RAM đến mức tối thiểu bằng cách đi đếm size, đếm bytes từng biến. Như vậy thì thật là điên, mà tôi sẽ cố gắng nhớ pattern nào nên tối ưu để giảm memory allocation không cần thiết.

### Tối ưu string

Bạn hãy thử xem xét đoạn code sau

```go
var s = []byte{32: 'b'} // len(s) == 33

temp1 := string(s)   // alloc 48
temp2 := string(s)   // alloc 48
result := temp1 + temp2 // alloc 80
```

Trong đó, với biểu thức này thật chất có 3 lần cấp phát:

```go
string(s) + string(s)
```

Mỗi `string(s)` sẽ cấp 33 bytes dữ liệu, nhưng vì không có block size classes nào phù hợp nên Go sẽ cấp phát vùng nhớ kích thước 48 bytes. Vì vậy, chúng ta đã lãng phí 15 bytes cho mỗi `string(s)`.

Sau khi có 2 string tạm, Go sẽ cấp bộ nhớ cho kết quả của phép ghép chuỗi `string(s) + string(s)` là `33 + 33 = 66 bytes` và nó thuộc classes 80 bytes. Ta đã lãng phí mất 14 bytes.

Do đó, tổng số lượng lãng phí là `15 + 15 + 14 = 44 bytes`.

Ta có 2 string tạm, và GC sẽ phải dọn dẹp nó, với một phép nối chuỗi đơn giản, ta đã vô tình gây áp lực lên GC.

Một phép cộng chuỗi, thì rác sẽ không nhiều, nhưng việc gì xảy ra nếu nó nằm trong một vòng `for`? Hay nằm trong request được query nhiều liên tục?

{{< callout >}}
Thay vì sử dụng phép cộng chuỗi, ta có thể dùng strings.Builder để giảm allocation trong Go.
{{< /callout >}}

### Tối ưu slice

Khi xưa tôi còn học ở đại học, tôi có một bài tập nhỏ với C++ như sau:

> Tự triển khai vector từ đầu

Một cách triển khai đơn giản như sau:

- Tôi khởi tạo một mảng có kích thước cố định nhưng đủ lớn, ví dụ như `int[100]`.

- Tôi cho user push_back thoải mái.

- Đến khi nào đến phần tử 100, thì tôi cấp phát một vùng nhớ mới có kích thước `int[120]`.

- Sau đó, tôi copy các phần tử từ array ban đầu vào array mới.

- Xóa vùng nhớ array cũ. Và lặp lại các bước trên.

Sau này gặp slice trong Go, tôi hiểu ngay lý do tại sao make slice lại có 3 tham số:

```go
slicesInt := make([]int, size, capacity)
```

Phần quan trọng nhất không phải `type`, hay `size` mà là `capacity`. nếu ta có thể ước lượng được `capacity` nhất định, ta có thể cấp ngay 1 slice đủ để dùng mà không phải tạo ra nhiều slice rác không còn sử dụng nữa.

### Tối ưu for loop

Ta nên cấp phát sao cho vùng nhớ cùng kiểu nằm chung với nhau và trong 1 lần cấp phát duy nhất.

Cấp phát bộ nhớ cùng kiểu nằm gần nhau, biến `books`:

```go
//go:noinline
func CreateBooksOnOneLargeBlock(n int) []*Book {
	books := make([]Book, n)
	pbooks := make([]*Book, n)
	for i := range pbooks {
		pbooks[i] = &books[i]
	}
	return pbooks
}
```

{{< rawhtml >}}
<style>
.go-mem-widget {
  padding: 1.5rem 0 2rem;
  font-family: 'IBM Plex Mono', monospace;

  --gm-cell-free:        #c8c6be;
  --gm-cell-free-border: #a8a69e;
  --gm-cell-free-text:   #5a5a56;

  --gm-cell-used:        #185FA5;
  --gm-cell-used-border: #0C447C;
  --gm-cell-used-text:   #e8f2ff;
  --gm-cell-used-bg:     rgba(24,95,165,0.10);

  --gm-cell-ptr:        #3B6D11;
  --gm-cell-ptr-border: #27500A;
  --gm-cell-ptr-text:   #dff0c8;
  --gm-cell-ptr-bg:     rgba(59,109,17,0.10);

  --gm-cell-meta:        #BA7517;
  --gm-cell-meta-border: #7A4D0A;
  --gm-cell-meta-text:   #fff3d6;
  --gm-cell-meta-bg:     rgba(186,117,23,0.10);

  --gm-text-primary:   #1a1a18;
  --gm-border:         rgba(0,0,0,0.12);
  --gm-border-md:      rgba(0,0,0,0.24);
  --gm-badge-color:    #185FA5;
  --gm-badge-bg:       rgba(24,95,165,0.08);
  --gm-badge-border:   #0C447C;
  --gm-code-bg:        rgba(186,117,23,0.08);
}

@media (prefers-color-scheme: dark) {
  .go-mem-widget {
    --gm-cell-free:        #4a4a46;
    --gm-cell-free-border: #666660;
    --gm-cell-free-text:   #a8a6a0;

    --gm-cell-used:        #2a7fd4;
    --gm-cell-used-border: #5aaaf0;
    --gm-cell-used-text:   #ddeeff;
    --gm-cell-used-bg:     rgba(90,170,240,0.12);

    --gm-cell-ptr:        #4e8f1a;
    --gm-cell-ptr-border: #80c040;
    --gm-cell-ptr-text:   #dff0c8;
    --gm-cell-ptr-bg:     rgba(128,192,64,0.12);

    --gm-cell-meta:        #d48a20;
    --gm-cell-meta-border: #f0b050;
    --gm-cell-meta-text:   #fff3d6;
    --gm-cell-meta-bg:     rgba(240,176,80,0.12);

    --gm-text-primary:   #e8e6df;
    --gm-border:         rgba(255,255,255,0.1);
    --gm-border-md:      rgba(255,255,255,0.2);
    --gm-badge-color:    #5aaaf0;
    --gm-badge-bg:       rgba(90,170,240,0.1);
    --gm-badge-border:   #5aaaf0;
    --gm-code-bg:        rgba(240,176,80,0.10);
  }
}

.dark .go-mem-widget {
  --gm-cell-free:        #4a4a46;
  --gm-cell-free-border: #666660;
  --gm-cell-free-text:   #a8a6a0;

  --gm-cell-used:        #2a7fd4;
  --gm-cell-used-border: #5aaaf0;
  --gm-cell-used-text:   #ddeeff;
  --gm-cell-used-bg:     rgba(90,170,240,0.12);

  --gm-cell-ptr:        #4e8f1a;
  --gm-cell-ptr-border: #80c040;
  --gm-cell-ptr-text:   #dff0c8;
  --gm-cell-ptr-bg:     rgba(128,192,64,0.12);

  --gm-cell-meta:        #d48a20;
  --gm-cell-meta-border: #f0b050;
  --gm-cell-meta-text:   #fff3d6;
  --gm-cell-meta-bg:     rgba(240,176,80,0.12);

  --gm-text-primary:   #e8e6df;
  --gm-border:         rgba(255,255,255,0.1);
  --gm-border-md:      rgba(255,255,255,0.2);
  --gm-badge-color:    #5aaaf0;
  --gm-badge-bg:       rgba(90,170,240,0.1);
  --gm-badge-border:   #5aaaf0;
  --gm-code-bg:        rgba(240,176,80,0.10);
}

.dark .go-mem-widget .gm-legend-item.gm-li-free {
  background: rgba(255,255,255,0.04);
}

.go-mem-widget .gm-section {
  margin-bottom: 1.75rem;
  padding: 1.25rem;
  border: 0.5px solid var(--gm-border);
  border-radius: 12px;
}

.go-mem-widget .gm-sec-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 1rem;
}

.go-mem-widget .gm-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  border: 0.5px solid var(--gm-badge-border);
  color: var(--gm-badge-color);
  background: var(--gm-badge-bg);
  font-weight: 600;
}

.go-mem-widget .gm-code {
  background: var(--gm-code-bg);
  border: 1px solid var(--gm-cell-meta-border);
  border-radius: 6px;
  padding: 3px 10px;
  color: var(--gm-cell-meta);
  font-weight: 600;
}

.go-mem-widget .gm-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.go-mem-widget .gm-sep { height: 8px; }

.go-mem-widget .gm-cell {
  width: 34px;
  height: 34px;
  border-radius: 4px;
  border: 0.5px solid var(--gm-cell-free-border);
  background: var(--gm-cell-free);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

@media (max-width: 540px) {
  .go-mem-widget .gm-cell { width: 26px; height: 26px; }
  .go-mem-widget .gm-cell-lbl { font-size: 7px !important; }
}

.go-mem-widget .gm-cell-lbl {
  font-size: 9px;
  line-height: 1;
  text-align: center;
  pointer-events: none;
  user-select: none;
}

.go-mem-widget .gm-cell.gm-used {
  background: var(--gm-cell-used);
  border-color: var(--gm-cell-used-border);
}
.go-mem-widget .gm-cell.gm-used .gm-cell-lbl { color: var(--gm-cell-used-text); }

.go-mem-widget .gm-cell.gm-ptr {
  background: var(--gm-cell-ptr);
  border-color: var(--gm-cell-ptr-border);
}
.go-mem-widget .gm-cell.gm-ptr .gm-cell-lbl { color: var(--gm-cell-ptr-text); }

/* legend */
.go-mem-widget .gm-legend {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 0.5px solid var(--gm-border-md);
}

.go-mem-widget .gm-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px 3px 6px;
  border-radius: 6px;
  font-size: 11px;
  border: 1px solid;
}

.go-mem-widget .gm-legend-item.gm-li-ptr {
  color: var(--gm-cell-ptr);
  background: var(--gm-cell-ptr-bg);
  border-color: var(--gm-cell-ptr-border);
}
.go-mem-widget .gm-legend-item.gm-li-used {
  color: var(--gm-cell-used);
  background: var(--gm-cell-used-bg);
  border-color: var(--gm-cell-used-border);
}
.go-mem-widget .gm-legend-item.gm-li-free {
  color: var(--gm-cell-free-text);
  background: rgba(0,0,0,0.04);
  border-color: var(--gm-cell-free-border);
}

.go-mem-widget .gm-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
}
.go-mem-widget .gm-li-ptr  .gm-dot { background: var(--gm-cell-ptr); }
.go-mem-widget .gm-li-used .gm-dot { background: var(--gm-cell-used); }
.go-mem-widget .gm-li-free .gm-dot { background: var(--gm-cell-free); border: 0.5px solid var(--gm-cell-free-border); }
</style>

<div class="go-mem-widget">

  <div class="gm-section">
    <div class="gm-sec-header">
      <span class="gm-badge">A</span>
      <span class="gm-code">CreateBooksOnOneLargeBlock</span>
    </div>
    <div class="gm-grid" id="gm-ptrs-a"></div>
    <div class="gm-sep"></div>
    <div class="gm-grid" id="gm-grid-a"></div>
    <div class="gm-legend">
      <div class="gm-legend-item gm-li-ptr"><div class="gm-dot"></div> con trỏ pbooks[i]</div>
      <div class="gm-legend-item gm-li-used"><div class="gm-dot"></div> books[i] - liên tục</div>
      <div class="gm-legend-item gm-li-free"><div class="gm-dot"></div> chưa dùng</div>
    </div>
  </div>

</div>

{{< /rawhtml >}}

Cấp phát rời rạc:

```go
//go:noinline
func CreateBooksOnManySmallBlocks(n int) []*Book {
	books := make([]*Book, n)
	for i := range books {
		books[i] = new(Book)
	}
	return books
}
```

{{< rawhtml >}}
<div class="go-mem-widget">
  <div class="gm-section">
    <div class="gm-sec-header">
      <span class="gm-badge">B</span>
      <span class="gm-code">CreateBooksOnManySmallBlocks</span>
    </div>
    <div class="gm-grid" id="gm-ptrs-b"></div>
    <div class="gm-sep"></div>
    <div class="gm-grid" id="gm-grid-b"></div>
    <div class="gm-legend">
      <div class="gm-legend-item gm-li-ptr"><div class="gm-dot"></div> con trỏ books[i]</div>
      <div class="gm-legend-item gm-li-used"><div class="gm-dot"></div> book - rời rạc</div>
      <div class="gm-legend-item gm-li-free"><div class="gm-dot"></div> chưa dùng</div>
    </div>
  </div>
</div>

<script>
(function() {
  var N = 8, TOTAL = 64;

  function cell(cls, label) {
    var d = document.createElement('div');
    d.className = 'gm-cell' + (cls ? ' ' + cls : '');
    if (label) {
      var s = document.createElement('span');
      s.className = 'gm-cell-lbl';
      s.textContent = label;
      d.appendChild(s);
    }
    return d;
  }

  function fillGrid(container, count, labelPrefix) {
    if (!container) return;
    container.textContent = '';
    for (var i = 0; i < count; i++) {
      container.appendChild(cell('gm-used', labelPrefix + i));
    }
    for (var j = 0; j < 4; j++) {
      container.appendChild(cell(''));
    }
  }

  function fillPtrs(container, count) {
    if (!container) return;
    container.textContent = '';
    for (var i = 0; i < count; i++) {
      container.appendChild(cell('gm-ptr', 'p' + i));
    }
    for (var j = 0; j < 4; j++) {
      container.appendChild(cell(''));
    }
  }

  fillPtrs(document.getElementById('gm-ptrs-a'), N);
  fillGrid(document.getElementById('gm-grid-a'), N, 'B');

  fillPtrs(document.getElementById('gm-ptrs-b'), N);

  var gridB = document.getElementById('gm-grid-b');
  if (gridB) {
    gridB.textContent = '';
    var scattered = [1, 6, 13, 20, 29, 37, 46, 55];
    for (var i = 0; i < TOTAL; i++) {
      var bi = scattered.indexOf(i);
      if (bi >= 0) gridB.appendChild(cell('gm-used', 'B' + bi));
      else           gridB.appendChild(cell(''));
    }
  }
})();
</script>
{{< /rawhtml >}}
### Tạo pool

Với cùng kiểu dữ liệu, ta có thể tái sử dụng biến đó cho các giá trị khác. Ví dụ:

```go
type Farm struct {
	Name   string
	Area   int
	HasCow bool
}

func main() {
	farm := Farm{
		Name:   "Green Valley",
		Area:   120,
		HasCow: true,
	}

	farm = Farm{}
}
```

Để nâng cấp hơn thì ta có thể tạo pool để tăng tính tái sử dụng

```go
package main

import "sync"

type RequestContext struct {
	UserID  int64
	TraceID string
	Tags    []string
	Body    []byte
	IsAdmin bool
}

var requestContextPool = sync.Pool{
	New: func() any {
		return new(RequestContext)
	},
}

func acquireRequestContext() *RequestContext {
	ctx := requestContextPool.Get().(*RequestContext)
	*ctx = RequestContext{} // zero lại toàn bộ
	return ctx
}

func releaseRequestContext(ctx *RequestContext) {
	*ctx = RequestContext{} // dọn dữ liệu cũ
	requestContextPool.Put(ctx)
}
```

Dùng:

```go
func handleRequest() {
	ctx := acquireRequestContext()
	defer releaseRequestContext(ctx)

	ctx.UserID = 101
	ctx.TraceID = "trace-xyz"
	ctx.Tags = append(ctx.Tags, "api", "v1")
}
```

Pool sẽ phù hợp cho các kiểu kiểu dữ liệu mang các tính chất sau:

- Khởi tạo nhiều.

- Kích thước object vừa hoặc lớn.

- Thời gian sống ngắn.

- Benchmark cho kết quả alloc nhiều.

## QUIZ

<div id="go-memory-quiz-root"></div>

<style>
#go-memory-quiz-root {
  --quiz-accent: #0ea5a4;
  --quiz-accent-2: #7c3aed;
  --quiz-success: #15803d;
  --quiz-danger: #dc2626;
  --quiz-radius: 12px;
  --quiz-text-muted: color-mix(in srgb, currentColor 68%, transparent);
  --quiz-border: color-mix(in srgb, currentColor 16%, transparent);
  --quiz-surface: color-mix(in srgb, currentColor 4%, transparent);
  --quiz-surface-2: color-mix(in srgb, currentColor 6%, transparent);
  --quiz-code-bg: color-mix(in srgb, currentColor 8%, transparent);

  color: inherit;
  background: transparent;
  font-family: 'Be Vietnam Pro', sans-serif;
  padding: 24px 16px 48px;
}

#go-memory-quiz-root * {
  box-sizing: border-box;
}

#go-memory-quiz-root .quiz-wrap {
  width: 100%;
  max-width: 740px;
  margin: 0 auto;
}

#go-memory-quiz-root .quiz-header {
  text-align: center;
  margin-bottom: 36px;
  position: relative;
}

#go-memory-quiz-root .quiz-header::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 320px;
  height: 120px;
  background: radial-gradient(
    ellipse,
    color-mix(in srgb, var(--quiz-accent) 18%, transparent) 0%,
    transparent 70%
  );
  pointer-events: none;
}

#go-memory-quiz-root .badge {
  display: inline-block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  color: var(--quiz-accent);
  background: color-mix(in srgb, var(--quiz-accent) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--quiz-accent) 28%, transparent);
  border-radius: 999px;
  padding: 4px 14px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 14px;
}

#go-memory-quiz-root h1 {
  font-size: clamp(20px, 4vw, 26px);
  font-weight: 700;
  line-height: 1.3;
  color: inherit;
  margin-bottom: 8px;
}

#go-memory-quiz-root h1 span {
  color: var(--quiz-accent);
}

#go-memory-quiz-root .subtitle {
  font-size: 14px;
  color: var(--quiz-text-muted);
}

#go-memory-quiz-root .progress-bar-wrap {
  background: var(--quiz-surface-2);
  border: 1px solid var(--quiz-border);
  border-radius: 999px;
  height: 6px;
  margin-bottom: 8px;
  overflow: hidden;
}

#go-memory-quiz-root .progress-bar-fill {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, var(--quiz-accent), #2dd4bf);
  border-radius: 999px;
  transition: width 0.35s ease;
}

#go-memory-quiz-root .progress-label {
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--quiz-text-muted);
  text-align: right;
  margin-bottom: 24px;
}

#go-memory-quiz-root .progress-label span {
  color: var(--quiz-accent);
}

#go-memory-quiz-root .card {
  background: var(--quiz-surface);
  border: 1px solid var(--quiz-border);
  border-radius: 14px;
  padding: 28px 28px 24px;
  margin-bottom: 16px;
  animation: quizSlideIn 0.28s ease;
}

@keyframes quizSlideIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

#go-memory-quiz-root .q-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

#go-memory-quiz-root .q-num {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  color: var(--quiz-accent);
  background: color-mix(in srgb, var(--quiz-accent) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--quiz-accent) 22%, transparent);
  border-radius: 6px;
  padding: 3px 10px;
  white-space: nowrap;
}

#go-memory-quiz-root .q-tag {
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--quiz-text-muted);
  background: var(--quiz-surface-2);
  border: 1px solid var(--quiz-border);
  border-radius: 6px;
  padding: 3px 10px;
}

#go-memory-quiz-root .q-text {
  font-size: 15.5px;
  font-weight: 500;
  line-height: 1.65;
  color: inherit;
  margin-bottom: 20px;
}

#go-memory-quiz-root .q-text code,
#go-memory-quiz-root .opt-text code,
#go-memory-quiz-root .explanation code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12.5px;
  background: var(--quiz-code-bg);
  border: 1px solid var(--quiz-border);
  border-radius: 5px;
  padding: 1px 6px;
  color: inherit;
}

#go-memory-quiz-root .code-block {
  margin: 10px 0;
  padding: 12px 14px;
  background: var(--quiz-surface-2);
  border: 1px solid var(--quiz-border);
  border-radius: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12.5px;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre;
}

#go-memory-quiz-root .options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

#go-memory-quiz-root .option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: var(--quiz-surface-2);
  border: 1.5px solid var(--quiz-border);
  border-radius: var(--quiz-radius);
  padding: 13px 16px;
  cursor: pointer;
  transition: all 0.18s ease;
  user-select: none;
}

#go-memory-quiz-root .option:hover:not(.disabled) {
  border-color: color-mix(in srgb, var(--quiz-accent) 40%, transparent);
  background: color-mix(in srgb, var(--quiz-accent) 8%, transparent);
}

#go-memory-quiz-root .option.disabled {
  cursor: default;
}

#go-memory-quiz-root .opt-letter {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: var(--quiz-surface);
  border: 1.5px solid var(--quiz-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  color: var(--quiz-text-muted);
  transition: all 0.18s ease;
}

#go-memory-quiz-root .opt-text {
  font-size: 14.5px;
  line-height: 1.55;
  color: inherit;
  padding-top: 2px;
}

#go-memory-quiz-root .option.selected {
  border-color: color-mix(in srgb, var(--quiz-accent) 45%, transparent);
  background: color-mix(in srgb, var(--quiz-accent) 9%, transparent);
}

#go-memory-quiz-root .option.selected .opt-letter {
  color: var(--quiz-accent);
  border-color: color-mix(in srgb, var(--quiz-accent) 45%, transparent);
  background: color-mix(in srgb, var(--quiz-accent) 14%, transparent);
}

#go-memory-quiz-root .option.correct {
  border-color: color-mix(in srgb, var(--quiz-success) 58%, transparent);
  background: color-mix(in srgb, var(--quiz-success) 10%, transparent);
}

#go-memory-quiz-root .option.correct .opt-letter {
  color: var(--quiz-success);
  border-color: color-mix(in srgb, var(--quiz-success) 58%, transparent);
  background: color-mix(in srgb, var(--quiz-success) 15%, transparent);
}

#go-memory-quiz-root .option.wrong {
  border-color: color-mix(in srgb, var(--quiz-danger) 58%, transparent);
  background: color-mix(in srgb, var(--quiz-danger) 10%, transparent);
}

#go-memory-quiz-root .option.wrong .opt-letter {
  color: var(--quiz-danger);
  border-color: color-mix(in srgb, var(--quiz-danger) 58%, transparent);
  background: color-mix(in srgb, var(--quiz-danger) 15%, transparent);
}

#go-memory-quiz-root .explanation {
  display: none;
  margin-top: 16px;
  padding: 14px 16px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--quiz-accent) 6%, transparent),
    color-mix(in srgb, var(--quiz-accent-2) 5%, transparent)
  );
  border: 1px solid color-mix(in srgb, var(--quiz-accent) 24%, transparent);
  border-radius: var(--quiz-radius);
  font-size: 13.5px;
  line-height: 1.65;
  color: inherit;
  animation: quizFadeIn 0.22s ease;
}

@keyframes quizFadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

#go-memory-quiz-root .explanation.show {
  display: block;
}

#go-memory-quiz-root .exp-state {
  margin-right: 6px;
}

#go-memory-quiz-root .exp-state--correct {
  color: var(--quiz-success);
}

#go-memory-quiz-root .exp-state--wrong {
  color: var(--quiz-danger);
}

#go-memory-quiz-root .btn-submit,
#go-memory-quiz-root .btn-next,
#go-memory-quiz-root .btn-restart {
  width: 100%;
  border-radius: var(--quiz-radius);
  font-family: 'Be Vietnam Pro', sans-serif;
  transition: all 0.18s ease;
}

#go-memory-quiz-root .btn-submit,
#go-memory-quiz-root .btn-restart {
  display: block;
  margin-top: 16px;
  padding: 13px;
  background: linear-gradient(135deg, var(--quiz-accent), #2dd4bf);
  border: none;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 0.3px;
}

#go-memory-quiz-root .btn-submit:hover:not(:disabled),
#go-memory-quiz-root .btn-restart:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 24px color-mix(in srgb, var(--quiz-accent) 28%, transparent);
}

#go-memory-quiz-root .btn-submit:disabled {
  opacity: 0.45;
  cursor: default;
}

#go-memory-quiz-root .btn-next {
  display: none;
  margin-top: 10px;
  padding: 12px;
  background: var(--quiz-surface-2);
  border: 1.5px solid var(--quiz-border);
  color: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

#go-memory-quiz-root .btn-next:hover {
  border-color: color-mix(in srgb, var(--quiz-accent) 45%, transparent);
  color: var(--quiz-accent);
}

#go-memory-quiz-root .btn-next.show {
  display: block;
}

#go-memory-quiz-root .result-card {
  display: none;
  background: var(--quiz-surface);
  border: 1px solid var(--quiz-border);
  border-radius: 14px;
  padding: 40px 28px;
  text-align: center;
  animation: quizSlideIn 0.3s ease;
}

#go-memory-quiz-root .result-card.show {
  display: block;
}

#go-memory-quiz-root .result-emoji {
  font-size: 52px;
  margin-bottom: 16px;
}

#go-memory-quiz-root .result-score {
  font-family: 'JetBrains Mono', monospace;
  font-size: 48px;
  font-weight: 700;
  color: var(--quiz-accent);
  line-height: 1;
  margin-bottom: 6px;
}

#go-memory-quiz-root .result-total,
#go-memory-quiz-root .result-sub,
#go-memory-quiz-root .result-stat-label {
  color: var(--quiz-text-muted);
}

#go-memory-quiz-root .result-total {
  font-size: 14px;
  margin-bottom: 20px;
}

#go-memory-quiz-root .result-msg {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: inherit;
}

#go-memory-quiz-root .result-sub {
  font-size: 14px;
  margin-bottom: 28px;
  line-height: 1.6;
}

#go-memory-quiz-root .result-bars {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 28px;
}

#go-memory-quiz-root .result-stat {
  background: var(--quiz-surface-2);
  border: 1px solid var(--quiz-border);
  border-radius: var(--quiz-radius);
  padding: 14px;
}

#go-memory-quiz-root .result-stat-num {
  font-family: 'JetBrains Mono', monospace;
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 4px;
}

#go-memory-quiz-root .result-stat-num.green {
  color: var(--quiz-success);
}

#go-memory-quiz-root .result-stat-num.red {
  color: var(--quiz-danger);
}

@media (max-width: 640px) {
  #go-memory-quiz-root {
    padding: 18px 10px 32px;
  }

  #go-memory-quiz-root .card,
  #go-memory-quiz-root .result-card {
    padding: 20px 16px;
  }

  #go-memory-quiz-root .result-bars {
    grid-template-columns: 1fr;
  }
}
</style>

{{< rawhtml >}}
<script>
(() => {
  const root = document.getElementById('go-memory-quiz-root');

  root.innerHTML = `
    <div class="quiz-wrap">
      <div class="quiz-header">
        <div class="badge">Go · Memory</div>
        <h1>Go <span>Memory Allocation</span> Quiz</h1>
        <p class="subtitle">Kiểm tra hiểu biết về cách Go quản lý bộ nhớ & tối ưu RAM</p>
      </div>

      <div class="progress-bar-wrap">
        <div class="progress-bar-fill" data-role="progressBar"></div>
      </div>

      <div class="progress-label" data-role="progressLabel">Câu <span>0</span> / 10</div>

      <div data-role="questionArea"></div>
      <div class="result-card" data-role="resultCard"></div>
    </div>
  `;

  const questions = [
    {
      tag: "Stack & Heap",
      text: "Điều gì xảy ra với một biến được lưu trên <code>stack</code> khi hàm chứa nó kết thúc?",
      options: [
        "Biến được chuyển sang heap để dùng tiếp",
        "Biến được tự động giải phóng",
        "Biến vẫn tồn tại cho đến khi GC dọn",
        "Biến được lưu vào BSS segment"
      ],
      answer: 1,
      explanation: "Biến trên <code>stack</code> được <strong>tự động giải phóng</strong> khi thoát khỏi hàm. Đây là lý do stack rẻ hơn heap về chi phí quản lý - không cần GC dọn dẹp."
    },
    {
      tag: "Escape Analysis",
      text: "Trong đoạn code sau, biến <code>u</code> sẽ được cấp phát ở đâu?<div class='code-block'>func createUser() *User {\n    u := User{Name: \"Alice\"}\n    return &u\n}</div>",
      options: [
        "Stack - vì được khai báo trong hàm",
        "Heap - vì con trỏ được trả ra ngoài",
        "BSS Segment - vì là struct",
        "Data Segment - vì có giá trị khởi tạo"
      ],
      answer: 1,
      explanation: "Compiler phân tích thấy <code>&u</code> bị <em>escape</em> ra ngoài phạm vi hàm qua return value. Do đó Go sẽ cấp phát <code>u</code> trên <strong>heap</strong> thay vì stack."
    },
    {
      tag: "Block Size Classes",
      text: "Nếu bạn cần cấp phát biến kích thước <strong>24 bytes</strong>, Go thực sự sẽ cấp cho bạn bao nhiêu bytes?",
      options: [
        "24 bytes - đúng bằng yêu cầu",
        "32 bytes - block size class gần nhất",
        "16 bytes - làm tròn xuống",
        "48 bytes - gộp với block kế tiếp"
      ],
      answer: 1,
      explanation: "Go không cấp phát theo đúng kích thước yêu cầu. Các block size classes nhỏ là <strong>8, 16, 32, 48, 64...</strong> bytes. Với 24 bytes, Go sẽ cấp block <strong>32 bytes</strong>, lãng phí <strong>8 bytes</strong>."
    },
    {
      tag: "GC Pressure",
      text: "Tại sao việc sinh ra quá nhiều biến ngắn hạn trên <code>heap</code> lại gây vấn đề trong Go?",
      options: [
        "Vì heap có giới hạn kích thước cứng",
        "Vì stack không thể truy cập được heap",
        "Vì GC phải tốn CPU để quét và dọn dẹp chúng",
        "Vì virtual memory sẽ bị tràn"
      ],
      answer: 2,
      explanation: "Heap chỉ được dọn khi không còn vùng nhớ nào tham chiếu vào. GC phải <strong>quét toàn bộ heap</strong> để tìm rác, tốn CPU và tăng áp lực dọn dẹp."
    },
    {
      tag: "Arena",
      text: "Go yêu cầu OS cấp bộ nhớ theo đơn vị <strong>Arena</strong> kích thước bao nhiêu trên hệ 64-bit?",
      options: [
        "8 KB",
        "1 MB",
        "64 MB",
        "256 MB"
      ],
      answer: 2,
      explanation: "Go yêu cầu OS cấp vùng địa chỉ <strong>64 MB</strong> cho Arena. Sau đó runtime chia nhỏ tiếp thành page, span và size class để quản lý."
    },
    {
      tag: "Strings Builder",
      text: "Đoạn code <code>string(s) + string(s)</code> trong Go thực hiện bao nhiêu lần cấp phát bộ nhớ?",
      options: [
        "1 lần - kết quả cuối cùng",
        "2 lần - mỗi string(s) một lần",
        "3 lần - hai string tạm + kết quả phép cộng",
        "0 lần - Go tối ưu bằng SSO"
      ],
      answer: 2,
      explanation: "Có <strong>3 lần cấp phát</strong>: mỗi <code>string(s)</code> tạo ra một string tạm, rồi phép <code>+</code> tạo thêm vùng nhớ mới cho kết quả."
    },
    {
      tag: "Slice Optimization",
      text: "Khi dùng <code>make([]int, size, capacity)</code>, tham số nào quan trọng nhất để giảm memory allocation?",
      options: [
        "Kiểu dữ liệu int",
        "size - kích thước hiện tại",
        "capacity - sức chứa tối đa",
        "Cả size và capacity đều quan trọng như nhau"
      ],
      answer: 2,
      explanation: "Nếu ước lượng được <code>capacity</code> trước, Go có thể cấp phát một lần đủ dùng. Nếu không, slice phải tăng kích thước và copy lại dữ liệu."
    },
    {
      tag: "Memory Layout",
      text: "Trong Virtual Memory Layout, chiều phát triển của Stack và Heap như thế nào?",
      options: [
        "Cả hai cùng phát triển từ trên xuống",
        "Stack phát triển lên trên, Heap phát triển xuống dưới",
        "Stack phát triển xuống dưới, Heap phát triển lên trên",
        "Cả hai phát triển từ giữa ra hai phía"
      ],
      answer: 2,
      explanation: "Thông thường <strong>Stack</strong> phát triển xuống dưới và <strong>Heap</strong> phát triển lên trên, giúp tận dụng phần trống ở giữa không gian nhớ."
    },
    {
      tag: "sync.Pool",
      text: "Trường hợp nào phù hợp nhất để dùng <code>sync.Pool</code> tối ưu memory allocation?",
      options: [
        "Biến được tạo 1 lần, sống suốt vòng đời chương trình",
        "Object khởi tạo nhiều, kích thước vừa hoặc lớn, vòng đời ngắn",
        "Dữ liệu cần chia sẻ an toàn giữa các goroutine",
        "Slice cần tăng capacity liên tục"
      ],
      answer: 1,
      explanation: "<code>sync.Pool</code> phù hợp khi object được tạo lặp lại nhiều lần, tương đối tốn chi phí, và có vòng đời ngắn."
    },
    {
      tag: "Large Objects",
      text: "Biến có kích thước <strong>lớn hơn 32KB</strong> sẽ được quản lý như thế nào trong Go heap?",
      options: [
        "Cấp phát vào block size classes đặc biệt 64KB",
        "Cấp phát vào nhiều page liên tiếp",
        "Cấp phát thẳng từ OS, không qua Arena",
        "Lưu trực tiếp vào Data Segment"
      ],
      answer: 1,
      explanation: "Với object <strong>lớn hơn 32KB</strong>, Go không dùng size class nhỏ nữa mà cấp phát theo nhiều page liên tiếp."
    }
  ];

  const els = {
    progressBar: root.querySelector('[data-role="progressBar"]'),
    progressLabel: root.querySelector('[data-role="progressLabel"]'),
    questionArea: root.querySelector('[data-role="questionArea"]'),
    resultCard: root.querySelector('[data-role="resultCard"]')
  };

  let current = 0;
  let score = 0;
  let selected = null;
  let answered = false;

  function getExplanationHTML(q, isCorrect) {
    const stateHTML = isCorrect
      ? '<strong class="exp-state exp-state--correct">✓ Đúng.</strong>'
      : '<strong class="exp-state exp-state--wrong">✗ Sai rồi.</strong>';

    return `${stateHTML} ${q.explanation}`;
  }

  function render() {
    if (current >= questions.length) {
      showResult();
      return;
    }

    const q = questions[current];
    const pct = (current / questions.length) * 100;
    const letters = ['A', 'B', 'C', 'D'];

    els.progressBar.style.width = pct + '%';
    els.progressLabel.innerHTML = `Câu <span>${current + 1}</span> / ${questions.length}`;

    const optionsHTML = q.options.map((option, index) => `
      <div class="option" data-index="${index}">
        <div class="opt-letter">${letters[index]}</div>
        <div class="opt-text">${option}</div>
      </div>
    `).join('');

    els.questionArea.innerHTML = `
      <div class="card">
        <div class="q-meta">
          <div class="q-num">Q${current + 1}</div>
          <div class="q-tag">${q.tag}</div>
        </div>

        <div class="q-text">${q.text}</div>

        <div class="options">${optionsHTML}</div>

        <div class="explanation" data-role="explanation"></div>
      </div>

      <button class="btn-submit" data-role="submitBtn" disabled>Kiểm tra đáp án</button>
      <button class="btn-next" data-role="nextBtn">
        ${current < questions.length - 1 ? 'Câu tiếp theo →' : 'Xem kết quả'}
      </button>
    `;

    selected = null;
    answered = false;

    const optionEls = els.questionArea.querySelectorAll('.option');
    const submitBtn = els.questionArea.querySelector('[data-role="submitBtn"]');
    const nextBtn = els.questionArea.querySelector('[data-role="nextBtn"]');

    optionEls.forEach((optionEl, index) => {
      optionEl.addEventListener('click', () => {
        if (answered) return;

        selected = index;
        optionEls.forEach((el, i) => {
          el.classList.toggle('selected', i === index);
        });
        submitBtn.disabled = false;
      });
    });

    submitBtn.addEventListener('click', submit);
    nextBtn.addEventListener('click', next);
  }

  function submit() {
    if (selected === null || answered) return;

    answered = true;

    const q = questions[current];
    const isCorrect = selected === q.answer;
    const optionEls = els.questionArea.querySelectorAll('.option');
    const explanationEl = els.questionArea.querySelector('[data-role="explanation"]');
    const submitBtn = els.questionArea.querySelector('[data-role="submitBtn"]');
    const nextBtn = els.questionArea.querySelector('[data-role="nextBtn"]');

    optionEls.forEach((el, index) => {
      el.classList.add('disabled');

      if (index === q.answer) {
        el.classList.add('correct');
      } else if (index === selected && !isCorrect) {
        el.classList.add('wrong');
      }
    });

    if (isCorrect) score++;

    explanationEl.innerHTML = getExplanationHTML(q, isCorrect);
    explanationEl.classList.add('show');

    submitBtn.disabled = true;
    nextBtn.classList.add('show');
  }

  function next() {
    current += 1;
    render();
  }

  function showResult() {
    els.questionArea.innerHTML = '';
    els.progressBar.style.width = '100%';
    els.progressLabel.innerHTML = `Câu <span>${questions.length}</span> / ${questions.length}`;

    const pct = Math.round((score / questions.length) * 100);

    let emoji = '😔';
    let msg = 'Cần ôn lại!';
    let sub = 'Đọc lại bài viết và thử lại nhé.';

    if (pct >= 90) {
      emoji = '🏆';
      msg = 'Xuất sắc!';
      sub = 'Bạn nắm vững Go Memory Allocation. Tiếp tục tối ưu code nào!';
    } else if (pct >= 70) {
      emoji = '🚀';
      msg = 'Rất tốt!';
      sub = 'Bạn nắm được phần lớn kiến thức. Xem lại những câu sai để hoàn thiện thêm.';
    } else if (pct >= 50) {
      emoji = '📖';
      msg = 'Khá ổn!';
      sub = 'Bạn đã hiểu cơ bản, nhưng vẫn còn vài điểm cần củng cố thêm.';
    }

    els.resultCard.className = 'result-card show';
    els.resultCard.innerHTML = `
      <div class="result-emoji">${emoji}</div>
      <div class="result-score">${score}/${questions.length}</div>
      <div class="result-total">${pct}% chính xác</div>
      <div class="result-msg">${msg}</div>
      <div class="result-sub">${sub}</div>

      <div class="result-bars">
        <div class="result-stat">
          <div class="result-stat-num green">${score}</div>
          <div class="result-stat-label">Đúng ✓</div>
        </div>
        <div class="result-stat">
          <div class="result-stat-num red">${questions.length - score}</div>
          <div class="result-stat-label">Sai ✗</div>
        </div>
      </div>

      <button class="btn-restart" data-role="restartBtn">🔄 Làm lại từ đầu</button>
    `;

    els.resultCard.querySelector('[data-role="restartBtn"]').addEventListener('click', restart);
  }

  function restart() {
    current = 0;
    score = 0;
    selected = null;
    answered = false;
    els.resultCard.className = 'result-card';
    els.resultCard.innerHTML = '';
    render();
  }

  render();
})();
</script>
{{< /rawhtml >}}

## Kết luận

Việc ta để ý tới memory allocations cho ta được ít nhất hai lợi ích. Một là tiết kiệm được bộ nhớ RAM - bộ phận khá đắt đỏ khi mua VPS hoặc Cloud. Hai là giảm bớt gánh nặng cho GC, giảm thời gian delay cũng như giảm công việc CPU xuống đáng kể.

## Tham khảo

- [Go Optimizations 101 - Tapir Liu](https://go101.org/optimizations/0.3-memory-allocations.html)

- [Understanding the Go Runtime: The Memory Allocator - Internals for Interns](https://internals-for-interns.com/posts/go-memory-allocator/)

- [8.10 Phân loại các vùng nhớ (stack & heap ...) - Dạy nhau học](https://cpp.daynhauhoc.com/8/10-phan-loai-cac-vung-nho-stack-va-heap/)