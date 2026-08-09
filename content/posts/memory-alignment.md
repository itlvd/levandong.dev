---
author: "Le Van Dong"
title: "Memory Alignment là gì?"
date: "2026-03-18"
description: "Thứ tự field quyết định size thực tế của struct - compiler chèn padding để alignment."
tags: ["Go"]
categories: ["Golang", "Programming"]
---

Trong Go, size thực tế của struct không chỉ là tổng size các field. Compiler sẽ chèn padding để bảo đảm memory alignment, nên thứ tự khai báo field có thể làm tổng size thay đổi. Sắp xếp field hợp lý giúp giảm lãng phí bộ nhớ và đôi khi cải thiện hiệu quả cache.

---

## Dẫn nhập

Ta có bao giờ để ý tới size của class và struct chưa? Giả dụ ta có struct **S** như sau, bạn đọc đoán xem size của struct **S** là bao nhiêu?

```go
type S struct {
  a int8
  b int64
  c int32
}
```

Nếu ta dùng theo quy chiếu thông thường về size của golang, ta có thể dễ dàng tính được size của **S** là `1 + 8 + 4 = 13 bytes`. Điều đó không hề sai về mặt lý thuyết, chỉ là compiler của các ngôn ngữ không làm thế mà thôi. Thật tế, nếu dùng lệnh `unsafe.Sizeof(S{})` thì kết quả sẽ là `24 bytes`. Tại sao lại có kết quả lạ thường như thế?

**Bảng 1: Kích thước của các kiểu dữ liệu trong [Go](https://go.dev/src/go/types/sizes.go).**

| Type | Size (bytes) |
| --- | --- |
| byte, uint8, int8 | 1 |
| uint16, int16 | 2 |
| uint32, int32, float32 | 4 |
| uint64, int64, float64, complex64 | 8 |
| complex128 | 16 |

## Memory Alignment

Trong máy tính kiến trúc 32 bit thì mỗi cycle của CPU khi load lên register thông thường sẽ là 4 bytes.

![Đọc từ địa chỉ vị trí 0x0](/images/load-from-0-1.webp)

Giả sử ta lại có kiểu dữ liệu int32 thì sẽ chiếm 2 ô nhớ trong RAM. Và máy tính vẫn hoạt động tốt nếu biến có kiểu int32 nằm trong đoạn 0x0 -> 0x2.

![Đọc biến int32 từ vị trí 0x0](/images/int32-0-1.webp)

Nhưng câu chuyện phức tạp sẽ xảy ra nếu như biến bắt đầu nằm ở vị trí 0x3. Khi đó, để load biến thì CPU tốn 2 cycle để load dữ liệu, cắt, ghép lại để được biến kiểu int32 đó.

![](/images/int32-1.webp)

Do đó, các ngôn ngữ sẽ tự thêm các bytes trống để làm sao khi đọc tốn số lượng cycle ít nhất có thể, và được gọi là padding.

<!--
  Memory Alignment Visualizer – Embed Widget (Theme-Adaptive)
  Go syntax · Auto light/dark · All classes prefixed "mav-"
  Pure HTML + CSS + JS, zero dependencies
-->
<style>
/* ── Reset scoped to widget ── */
.mav-root, .mav-root *, .mav-root *::before, .mav-root *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* ── Root: theme-adaptive ── */
.mav-root {
  color: inherit;
  background: transparent;
  font-family: inherit;
  line-height: 1.5;
  text-align: left;

  /* ── Semantic colors (FIXED - không đổi theo theme) ── */
  --mav-accent:  #2563eb;  /* blue   - CPU / primary */
  --mav-success: #15803d;  /* green  - aligned / ok */
  --mav-danger:  #dc2626;  /* red    - unaligned / warn */
  --mav-warning: #d97706;  /* amber  - highlight cell */
  --mav-info:    #0891b2;  /* cyan   - types trong Go */

  /* ── Theme-adaptive neutrals (phái sinh từ currentColor) ── */
  --mav-text-muted:    color-mix(in srgb, currentColor 62%, transparent);
  --mav-text-faint:    color-mix(in srgb, currentColor 38%, transparent);
  --mav-border:        color-mix(in srgb, currentColor 18%, transparent);
  --mav-border-strong: color-mix(in srgb, currentColor 38%, transparent);
  --mav-surface:       color-mix(in srgb, currentColor 4%,  transparent);
  --mav-surface-2:     color-mix(in srgb, currentColor 7%,  transparent);
  --mav-surface-3:     color-mix(in srgb, currentColor 12%, transparent);

  --mav-mono: 'JetBrains Mono','Fira Code','Cascadia Code','Consolas',monospace;
  --mav-r: 8px;

  border: 1.5px solid var(--mav-border);
  border-radius: 12px;
  overflow: hidden;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

/* ── Header ── */
.mav-header {
  background: var(--mav-surface);
  border-bottom: 1px solid var(--mav-border);
  padding: 20px 24px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.mav-hicon {
  width: 36px; height: 36px;
  flex-shrink: 0;
  color: var(--mav-accent);
  margin-top: 2px;
}
.mav-htitle {
  color: inherit;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.25;
  font-size: clamp(1.05rem, 2.6vw, 1.35rem);
}
.mav-hsub {
  color: var(--mav-text-muted);
  margin-top: 5px;
  line-height: 1.45;
  font-size: clamp(0.85rem, 1.9vw, 1rem);
}
.mav-hsub strong { color: var(--mav-accent); }

/* ── Toolbar ── */
.mav-toolbar {
  background: var(--mav-surface);
  border-bottom: 1px solid var(--mav-border);
  padding: 12px 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}
.mav-mode-group   { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.mav-mode-label   {
  color: var(--mav-text-muted);
  font-family: var(--mav-mono);
  font-size: 0.8rem;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  flex-shrink: 0;
}
.mav-mode-buttons { display: flex; gap: 8px; }
.mav-action-group { display: flex; gap: 8px; }

.mav-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1.5px solid var(--mav-border);
  background: var(--mav-surface-2);
  color: inherit;
  border-radius: var(--mav-r);
  padding: 9px 16px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.93rem;
  font-weight: 500;
  transition: background .13s, color .13s, border-color .13s, box-shadow .13s;
  outline: none;
  white-space: nowrap;
  line-height: 1;
}
.mav-btn:hover {
  background: var(--mav-surface-3);
  border-color: var(--mav-border-strong);
}
.mav-btn:focus-visible {
  box-shadow: 0 0 0 2.5px color-mix(in srgb, var(--mav-accent) 50%, transparent);
}

.mav-btn-danger {
  background: var(--mav-danger) !important;
  border-color: var(--mav-danger) !important;
  color: #fff !important;
  font-weight: 700 !important;
}
.mav-btn-ok {
  background: var(--mav-success) !important;
  border-color: var(--mav-success) !important;
  color: #fff !important;
  font-weight: 700 !important;
}

.mav-btn-play {
  background: var(--mav-accent);
  border-color: var(--mav-accent);
  color: #fff;
  font-weight: 700;
  padding: 9px 22px;
}
.mav-btn-play:hover {
  background: color-mix(in srgb, var(--mav-accent) 85%, black);
  border-color: color-mix(in srgb, var(--mav-accent) 85%, black);
  color: #fff;
}
.mav-btn-play:disabled       { opacity: .38; cursor: not-allowed; }
.mav-btn-play:disabled:hover { background: var(--mav-accent); border-color: var(--mav-accent); }
.mav-btn-reset { padding: 9px 13px; }

/* ── Section (memory area) ── */
.mav-section {
  padding: 20px 24px;
  border-bottom: 1px solid var(--mav-border);
  background: transparent;
}
.mav-section-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  gap: 10px;
}
.mav-section-title {
  display: flex; align-items: center; gap: 7px;
  color: var(--mav-text-muted);
  font-family: var(--mav-mono);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
}
.mav-section-title svg { color: var(--mav-accent); flex-shrink: 0; }
.mav-badge {
  background: color-mix(in srgb, var(--mav-accent) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--mav-accent) 30%, transparent);
  color: var(--mav-accent);
  border-radius: 30px;
  padding: 4px 14px;
  font-family: var(--mav-mono);
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

/* ── Memory grid ── */
.mav-grid {
  display: flex;
  width: 100%;
  border: 1.5px solid var(--mav-border);
  border-radius: var(--mav-r);
  overflow: hidden;
}
.mav-cell {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 10px 4px;
  border-right: 1px solid var(--mav-border);
  position: relative;
  transition: transform .18s, box-shadow .18s;
  min-height: 82px;
  cursor: default;
}
.mav-cell:last-child { border-right: none; }
.mav-cell-wb { border-right: 2.5px solid var(--mav-border-strong) !important; }
.mav-cell-hi {
  outline: 2.5px solid var(--mav-warning);
  outline-offset: -2px;
  transform: scaleY(1.06);
  box-shadow: 0 0 18px color-mix(in srgb, var(--mav-warning) 40%, transparent);
  z-index: 4;
}
.mav-cell-addr {
  position: absolute; top: 4px; left: 5px;
  color: var(--mav-text-muted);
  font-family: var(--mav-mono);
  font-size: 0.7rem; line-height: 1;
}
.mav-cell-lbl {
  position: absolute; bottom: 4px; left: 0; right: 0;
  text-align: center;
  font-family: var(--mav-mono);
  font-size: 0.68rem;
  line-height: 1; opacity: .8;
}
.mav-cell-val {
  font-family: var(--mav-mono);
  font-weight: 700;
  font-size: clamp(0.8rem, 2.2vw, 0.95rem);
  line-height: 1; z-index: 1;
}

/* Cell variants - semantic tints, adaptive theo theme */
.mav-c-char {
  background: color-mix(in srgb, var(--mav-accent) 14%, transparent);
  color: var(--mav-accent);
}
.mav-c-int {
  background: color-mix(in srgb, var(--mav-danger) 13%, transparent);
  color: var(--mav-danger);
}
.mav-c-intok {
  background: color-mix(in srgb, var(--mav-success) 13%, transparent);
  color: var(--mav-success);
}
.mav-c-pad {
  background: var(--mav-surface-2);
  color: var(--mav-text-muted);
}
.mav-c-empty {
  background: var(--mav-surface);
  color: var(--mav-text-faint);
}

/* Legend */
.mav-legend { display: flex; margin-top: 12px; }
.mav-legend-item {
  flex: 1; text-align: center;
  font-family: var(--mav-mono);
  font-size: 0.78rem;
  color: var(--mav-text-muted);
  line-height: 1.4; padding: 0 4px;
}
.mav-legend-item strong {
  display: block;
  color: inherit;
  font-weight: 700;
  opacity: 1.4; /* ineffective but harmless - visual via font-weight */
}

/* ── Bottom panel ── */
.mav-bottom { display: grid; grid-template-columns: 1fr 1fr; }

.mav-code-panel {
  background: var(--mav-surface-3);
  border-right: 1px solid var(--mav-border);
  padding: 18px 22px;
  overflow-x: auto;
}
.mav-log-panel {
  background: transparent;
  padding: 18px 22px;
}
.mav-panel-hd {
  display: flex; align-items: center; gap: 7px;
  font-family: var(--mav-mono);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
  margin-bottom: 14px;
  color: var(--mav-text-muted);
}

/* Go syntax - dùng semantic colors để work cả 2 theme */
.mav-code {
  font-family: var(--mav-mono);
  color: inherit;
  font-size: clamp(0.85rem, 2vw, 0.98rem);
  line-height: 1.85;
  white-space: pre;
  overflow-x: auto;
}
.mav-ck  { color: var(--mav-accent);  font-weight: 700; }  /* keywords: type, struct */
.mav-cty { color: var(--mav-info);    font-weight: 600; }  /* types: byte, int32     */
.mav-cv  { color: var(--mav-warning); font-weight: 600; }  /* field names: A, B      */
.mav-ctg { color: var(--mav-success); }                    /* struct tags            */
.mav-cmt { color: var(--mav-text-muted); font-style: italic; }
.mav-cpd { color: var(--mav-text-faint); font-style: italic; }

/* Logs */
.mav-logs {
  display: flex; flex-direction: column; gap: 9px;
  overflow-y: auto; max-height: 190px;
}
.mav-log-item {
  display: flex; gap: 9px; align-items: flex-start;
  animation: mavUp .22s ease-out both;
}
.mav-log-arrow {
  color: var(--mav-success);
  font-family: var(--mav-mono);
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 1px;
  font-size: 1rem;
}
.mav-log-msg {
  color: inherit;
  font-family: var(--mav-mono);
  font-size: clamp(0.82rem, 1.9vw, 0.93rem);
  line-height: 1.5;
}
.mav-log-empty {
  color: var(--mav-text-muted);
  font-family: var(--mav-mono);
  font-size: 0.9rem;
  font-style: italic;
}

/* Inline log accents */
.mav-tw       { color: var(--mav-danger);  font-weight: 700; }
.mav-tok      { color: var(--mav-success); font-weight: 700; }
.mav-tcy      { color: var(--mav-warning); font-weight: 600; }
.mav-text-dn  { color: var(--mav-danger);  font-weight: 700; }
.mav-text-ok  { color: var(--mav-success); font-weight: 700; }

/* Scrollbars - adaptive */
.mav-logs::-webkit-scrollbar,
.mav-code::-webkit-scrollbar { width: 4px; height: 4px; }
.mav-logs::-webkit-scrollbar-track,
.mav-code::-webkit-scrollbar-track { background: transparent; }
.mav-logs::-webkit-scrollbar-thumb,
.mav-code::-webkit-scrollbar-thumb {
  background: var(--mav-border-strong);
  border-radius: 3px;
}

@keyframes mavUp {
  from { opacity: 0; transform: translateY(5px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Responsive ── */
@media (max-width: 620px) {
  .mav-toolbar       { flex-direction: column; align-items: stretch; }
  .mav-mode-group    { flex-direction: column; align-items: stretch; }
  .mav-mode-label    { text-align: center; }
  .mav-mode-buttons .mav-btn { flex: 1; justify-content: center; }
  .mav-action-group  .mav-btn-play { flex: 1; justify-content: center; }
  .mav-bottom        { grid-template-columns: 1fr; }
  .mav-code-panel    { border-right: none; border-bottom: 1px solid var(--mav-border); }
  .mav-cell          { min-height: 64px; }
  .mav-cell-addr, .mav-cell-lbl { display: none; }
}
@media (max-width: 800px) and (min-width: 621px) {
  .mav-bottom     { grid-template-columns: 1fr; }
  .mav-code-panel { border-right: none; border-bottom: 1px solid var(--mav-border); }
}
</style>

<!-- ── HTML ── -->
<div class="mav-root" id="mav-root">

  <!-- Header -->
  <div class="mav-header">
    <svg class="mav-hicon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <rect x="9" y="9" width="6" height="6"/>
      <line x1="9"  y1="2"  x2="9"  y2="4" /><line x1="15" y1="2"  x2="15" y2="4" />
      <line x1="9"  y1="20" x2="9"  y2="22"/><line x1="15" y1="20" x2="15" y2="22"/>
      <line x1="20" y1="9"  x2="22" y2="9" /><line x1="20" y1="15" x2="22" y2="15"/>
      <line x1="2"  y1="9"  x2="4"  y2="9" /><line x1="2"  y1="15" x2="4"  y2="15"/>
    </svg>
    <div>
      <div class="mav-htitle">Mô phỏng CPU đọc bộ nhớ</div>
      <div class="mav-hsub">
        Hệ thống 32-bit &nbsp;·&nbsp; CPU đọc <strong>1 Word = 4 bytes</strong> mỗi chu kỳ qua Data Bus &nbsp;·&nbsp; Go example
      </div>
    </div>
  </div>

  <!-- Toolbar -->
  <div class="mav-toolbar">
    <div class="mav-mode-group">
      <span class="mav-mode-label">Layout</span>
      <div class="mav-mode-buttons">
        <button class="mav-btn mav-btn-danger" id="mav-btn-un">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="18" y2="18"/></svg>
          Unaligned
        </button>
        <button class="mav-btn" id="mav-btn-al">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
          Aligned
        </button>
      </div>
    </div>
    <div class="mav-action-group">
      <button class="mav-btn mav-btn-play" id="mav-btn-play">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Đọc biến B
      </button>
      <button class="mav-btn mav-btn-reset" id="mav-btn-reset" title="Đặt lại">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Memory -->
  <div class="mav-section">
    <div class="mav-section-hd">
      <div class="mav-section-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3"/>
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
        </svg>
        Bố cục RAM
      </div>
      <div class="mav-badge">Word = 4 bytes</div>
    </div>
    <div class="mav-grid" id="mav-grid"></div>
    <div class="mav-legend">
      <div class="mav-legend-item"><strong>Khối 1</strong>Bytes 0–3 · Chu kỳ 1</div>
      <div class="mav-legend-item"><strong>Khối 2</strong>Bytes 4–7 · Chu kỳ 2</div>
    </div>
  </div>

  <!-- Bottom -->
  <div class="mav-bottom">
    <div class="mav-code-panel">
      <div class="mav-panel-hd">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
        </svg>
        Go struct
      </div>
      <div class="mav-code" id="mav-code"></div>
    </div>
    <div class="mav-log-panel">
      <div class="mav-panel-hd">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
        </svg>
        CPU execution log
      </div>
      <div class="mav-logs" id="mav-logs">
        <div class="mav-log-empty">Nhấn "Đọc biến B" để bắt đầu…</div>
      </div>
    </div>
  </div>

</div>

<!-- ── JavaScript ── -->
<script>
(function () {
  'use strict';

  var s    = { mode: 'unaligned', step: 0, playing: false, logs: [] };
  var tmr  = null;
  var MEM  = 8, WORD = 4, DELAY = 1100;

  var elGrid  = document.getElementById('mav-grid');
  var elCode  = document.getElementById('mav-code');
  var elLogs  = document.getElementById('mav-logs');
  var btnUn   = document.getElementById('mav-btn-un');
  var btnAl   = document.getElementById('mav-btn-al');
  var btnPlay = document.getElementById('mav-btn-play');
  var btnRst  = document.getElementById('mav-btn-reset');

  /* ── Go code snippets ── */
  var CODE = {
    unaligned:
      '<span class="mav-cmt">// Giả lập struct ép khít – không padding</span>\n' +
      '<span class="mav-ck">type</span> Data <span class="mav-ck">struct</span> {\n' +
      '    <span class="mav-cv">A</span> <span class="mav-cty">byte</span>   <span class="mav-cmt">// 1 byte  – offset 0</span>\n' +
      '    <span class="mav-cv">B</span> <span class="mav-cty">int32</span>  <span class="mav-ctg">`packed:"true"`</span>  <span class="mav-cmt">// offset 1 ← lệch lề!</span>\n' +
      '}\n\n' +
      '<span class="mav-cmt">// unsafe.Offsetof(Data{}.B) → 1</span>',

    aligned:
      '<span class="mav-cmt">// Go mặc định – compiler tự căn lề</span>\n' +
      '<span class="mav-ck">type</span> Data <span class="mav-ck">struct</span> {\n' +
      '    <span class="mav-cv">A</span> <span class="mav-cty">byte</span>    <span class="mav-cmt">// 1 byte  – offset 0</span>\n' +
      '    <span class="mav-cpd">// _ [3]byte  ← padding ẩn</span>\n' +
      '    <span class="mav-cv">B</span> <span class="mav-cty">int32</span>   <span class="mav-cmt">// 4 bytes – offset 4 ✓</span>\n' +
      '}\n\n' +
      '<span class="mav-cmt">// unsafe.Offsetof(Data{}.B) → 4</span>'
  };

  /* ── Cell definitions ── */
  function cellDef(mode, i) {
    if (mode === 'unaligned') {
      if (i === 0) return { cls: 'mav-c-char',  val: 'A',           lbl: 'byte'  };
      if (i <= 4)  return { cls: 'mav-c-int',   val: 'B['+(i-1)+']', lbl: 'int32' };
      return               { cls: 'mav-c-empty', val: '·',           lbl: ''      };
    }
    if (i === 0) return { cls: 'mav-c-char',  val: 'A',           lbl: 'byte'  };
    if (i <= 3)  return { cls: 'mav-c-pad',   val: '▒',           lbl: 'pad'   };
    return               { cls: 'mav-c-intok', val: 'B['+(i-4)+']', lbl: 'int32' };
  }

  function isHi(mode, step, i) {
    if (mode === 'unaligned') {
      if ((step === 1 || step === 2) && i <= 3) return true;
      if ((step === 3 || step === 4) && i >= 4) return true;
    } else {
      if (step === 1 && i >= 4) return true;
    }
    return false;
  }

  /* ── Render ── */
  function renderGrid() {
    var h = '';
    for (var i = 0; i < MEM; i++) {
      var d   = cellDef(s.mode, i);
      var wb  = (i === WORD - 1);
      var hi  = isHi(s.mode, s.step, i);
      var cls = 'mav-cell ' + d.cls
              + (wb ? ' mav-cell-wb' : '')
              + (hi ? ' mav-cell-hi' : '');
      h += '<div class="' + cls + '">'
         +   '<span class="mav-cell-addr">' + i + '</span>'
         +   '<span class="mav-cell-val">'  + d.val + '</span>'
         +   '<span class="mav-cell-lbl">'  + d.lbl + '</span>'
         + '</div>';
    }
    elGrid.innerHTML = h;
  }

  function renderCode() { elCode.innerHTML = CODE[s.mode]; }

  function renderLogs() {
    if (!s.logs.length) {
      elLogs.innerHTML = '<div class="mav-log-empty">Nhấn "Đọc biến B" để bắt đầu…</div>';
      return;
    }
    elLogs.innerHTML = s.logs.map(function (m) {
      return '<div class="mav-log-item">'
           + '<span class="mav-log-arrow">›</span>'
           + '<span class="mav-log-msg">' + m + '</span>'
           + '</div>';
    }).join('');
    elLogs.scrollTop = elLogs.scrollHeight;
  }

  function renderBtns() {
    btnUn.className   = 'mav-btn' + (s.mode === 'unaligned' ? ' mav-btn-danger' : '');
    btnAl.className   = 'mav-btn' + (s.mode === 'aligned'   ? ' mav-btn-ok'     : '');
    btnPlay.disabled  = s.playing;
  }

  function render() { renderGrid(); renderCode(); renderLogs(); renderBtns(); }

  /* ── Log helper ── */
  function log(m) { s.logs.push(m); render(); }

  function adv(ns, d) {
    tmr = setTimeout(function () { s.step = ns; render(); runStep(); }, d);
  }
  function done() { s.playing = false; render(); }

  /* ── Animation steps ── */
  var STEPS_UN = [
    function () { log('Đọc <strong class="mav-text-dn">B int32</strong> tại offset 1 - bị lệch lề…'); adv(1, 600); },
    function () { log('<span class="mav-tcy">Chu kỳ 1:</span> CPU fetch Khối 1 (bytes 0–3) qua Data Bus…'); adv(2, DELAY); },
    function () { log('Tách & buffer tạm <strong>3 bytes</strong> đầu của B[0..2].'); adv(3, DELAY); },
    function () { log('<span class="mav-tcy">Chu kỳ 2:</span> CPU fetch Khối 2 (bytes 4–7) qua Data Bus…'); adv(4, DELAY); },
    function () { log('Lấy thêm <strong>1 byte</strong> cuối B[3].'); adv(5, DELAY); },
    function () { log('Shift + mask ghép 2 mảnh → <span class="mav-tw">2 chu kỳ - chậm gấp đôi! ⚠</span>'); done(); }
  ];

  var STEPS_AL = [
    function () { log('Đọc <strong class="mav-text-ok">B int32</strong> tại offset 4 - đã căn lề ✓'); adv(1, 600); },
    function () { log('<span class="mav-tcy">Chu kỳ 1:</span> CPU fetch Khối 2 (bytes 4–7) qua Data Bus…'); adv(2, DELAY); },
    function () { log('Lấy trọn 4 bytes trong 1 lần → <span class="mav-tok">1 chu kỳ - tối ưu! ✓</span>'); done(); }
  ];

  function runStep() {
    if (!s.playing) return;
    var steps = s.mode === 'unaligned' ? STEPS_UN : STEPS_AL;
    if (s.step < steps.length) steps[s.step]();
  }

  /* ── Controls ── */
  function reset() {
    clearTimeout(tmr);
    s.step = 0; s.playing = false; s.logs = [];
    render();
  }

  function play() {
    var max = s.mode === 'unaligned' ? 5 : 2;
    if (s.step >= max && !s.playing) {
      reset();
      setTimeout(function () { s.playing = true; render(); runStep(); }, 80);
      return;
    }
    if (s.playing) return;
    s.playing = true; render(); runStep();
  }

  /* ── Events ── */
  btnUn.addEventListener('click',   function () { if (s.mode === 'unaligned') return; s.mode = 'unaligned'; reset(); });
  btnAl.addEventListener('click',   function () { if (s.mode === 'aligned')   return; s.mode = 'aligned';   reset(); });
  btnPlay.addEventListener('click', play);
  btnRst.addEventListener('click',  reset);

  render();
}());
</script>

{{< callout >}}
Để tận dụng tối đa các lệnh của CPU và đạt được performance tốt nhất, thì địa chỉ (bắt đầu) của các kiểu dữ liệu T sẽ được cấp phát theo một bội số của một số nguyên N. Khi đó, **N được gọi là alignment guarantee của kiểu dữ liệu T**.
{{< /callout >}}

## Alignment guarantee

Để CPU có thể đọc được tối ưu nhất, thì Go phải sắp xếp sao cho biến nằm ở vị trí đẹp, để CPU có thể lấy giá trị trong 1 cycle thôi.

Nói đơn giản, alignment guarantee cho biết: một giá trị của type này nên bắt đầu ở địa chỉ bộ nhớ nào.

{{< callout >}}
Trong Go, alignment có thể được kiểm tra bằng `unsafe.Alignof(...)`.
{{< /callout >}}

Với kiểu dữ liệu cơ bản như `int, byte, float,...` thì alignment guarantee thường phụ thuộc vào kiến trúc máy tính như 64 bit hoặc 32 bit. Đa số là trùng với size của kiểu dữ liệu.

**Bảng 2: Size và alignment guarantee của các kiểu dữ liệu trong Go trên kiến trúc 64 bit.**

| Kiểu dữ liệu (Type) | Kích thước (Size - Bytes) | Căn chỉnh (Alignment - Bytes) |
| --- | --- | --- |
| bool, uint8, int8, byte | 1 | 1 |
| uint16, int16 | 2 | 2 |
| uint32, int32, float32 | 4 | 4 |
| string | 16 (Header) | 8 |
| slice | 24 (Header) | 8 |
| interface | 16 (Header) | 8 |
| pointer (con trỏ) | 8 | 8 |
| struct{} (struct rỗng) | 0 | 1 |

Go cũng có đưa ra một số [đặc tả](https://go.dev/ref/spec#Size_and_alignment_guarantees) như sau:

- For a variable `x` of any type: `unsafe.Alignof(x)` is at least 1.
- For a variable `x` of struct type: `unsafe.Alignof(x)` is the largest of all the values `unsafe.Alignof(x.f)` for each field `f` of `x`, but at least 1.
- For a variable `x` of array type: `unsafe.Alignof(x)` is the same as the alignment of a variable of the array's element type.

{{< callout >}}
Do đó, với struct thì alignment guarantee là alignment guarantee của field lớn nhất, nếu không có thì bằng 1.
{{< /callout >}}

## Thực nghiệm

Giả sử ta có kiểu dữ liệu `S1` như sau:

```go
type S1 struct {
  a int8
  // 7 bytes sẽ được padding tại đây
  b int64
  c int16
  // 6 bytes được padding tại đây
}
```

`S1` sẽ có size là 24:

- Đầu tiên, struct có alignment guarantee là alignment guarantee của field lớn nhất: struct `S1` sẽ có alignment guarantee của `int64` là 8 bytes. Do đó, khoảng cách của field `a` và `b` là 7 bytes.
- Size của struct phải là bội số của alignment guarantee, ở đây là 8. Do đó, biến `c` cuối cùng sẽ được thêm 6 bytes cuối.

Tuy nhiên, vẫn là struct đó, nhưng ta khéo tổ chức dữ liệu hơn như sau:

```go
type S2 struct {
  a int8
  // 1 bytes được padding tại đây
  c int16
  // 4 bytes được padding tại đây
  b int64
}
```

Bây giờ, size chỉ còn là 16 thôi và tiết kiệm được 8 bytes.

## Kết luận

Việc ta không để ý tới memory alignment có thể dẫn đến một số vấn đề sau:

- CPU có khả năng tốn nhiều ops hơn để đọc dữ liệu. Go compiler/runtime đã đảm bảo alignment bằng cách chèn padding và cấp phát ở địa chỉ phù hợp, và không tự đổi thứ tự field.
- Application chạy tốn RAM hơn. Vì phải padding nhiều hơn để có được vị trí đẹp.
- Ít phần tử fit vào cache line hơn.

{{< callout >}}
Sắp xếp field từ lớn đến nhỏ thường giúp giảm padding, nhưng đó là heuristic chứ không phải luật tuyệt đối, vẫn cần cân bằng với readability và access pattern.
{{< /callout >}}

## Tham khảo

- [Go Optimizations 101 - Tapi Liu](https://go101.org/optimizations/101.html)
- [Lý Do Tồn Tại Data Alignment (Struct Alignment, Memory Alignment) - Medium](https://medium.com/@phuong.nguyenhuucse/l%C3%BD-do-t%E1%BB%93n-t%E1%BA%A1i-data-alignment-struct-alignment-memory-alignment-1bd9dc1d1e77)
- [Memory alignment - Thanh Vu](https://thanhvu.dev/2021/08/20/memory-alignment/)
- [Data alignment: Straighten up and fly right - IBM](https://developer.ibm.com/articles/pa-dalign/)
