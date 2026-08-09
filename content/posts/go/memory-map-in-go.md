---
author: "Le Van Dong"
title: "Memory lãng phí của map trong Golang"
date: "2026-06-28"
description: "Map trong Go không trả RAM sau khi xóa phần tử - hiểu cơ chế để tránh lãng phí."
tags: ["Go"]
categories: ["Golang", "Programming"]
math: true
---

Trong Golang, map là một kiểu dữ liệu built-in và rất thường xuyên được sử dụng, đặc biệt là trong caching in memory. Tuy nhiên, nếu chúng ta không để ý trong việc sử dụng map thì chúng ta rất dễ làm tăng RAM khi ứng dụng của chúng ta chạy một khoảng thời gian dài. Vậy lý do là gì?

## Tình huống

Giả sử chúng ta có một map với key là int và value là một mảng byte có kích thước là 128.

```go
m := make(map[int][128]byte)
```

Lúc này, map `m` sẽ có kích thước là `0MB` vì chúng ta chưa khởi tạo vùng nhớ cho nó. Sau đó, chúng ta sẽ thêm `1_000_000` phần tử vào trong map `m`.

```go
n := 1_000_000
for i := 0; i < n; i++ {
    m[i] = [128]byte{}
}
```

Khi này, `m` sẽ có kích thước là `291 MB`. Vậy khi thêm 1 triệu phần tử thì kích thước của `m` đã tăng lên đáng kể. 

Tiếp theo, chúng ta sẽ thực hiện xóa tất cả các phần tử trong `m`. Sau đó cho GC dọn dẹp bộ nhớ.

```go
for i := 0; i < n; i++ {
    delete(m, i)
}

runtime.GC()
```

Khi này, ta đo kích thước heap allocation thì vẫn chiếm khoảng `287 MB`. 

Vậy tại sao lại có hiện tượng lạ như vậy, tôi đã xóa hết tất cả các phần tử trong map rồi, nhưng tại sao kích thước lại không giảm về khoảng `0 MB`?

## Giải thích

### Cách Go tổ chức map

Bản chất map trong Golang là kiểu dữ liệu hashmap, được lưu dưới biến `hmap` và nằm trên heap. Bên trong `hmap` sẽ chứa một mảng bucket liên tiếp nhau, ứng với mỗi bucket là 8 cặp khóa/giá trị. 

Đặc biệt, trong `hmap` còn chứa biến `B` tức là $2^B$ số lượng bucket được tạo ra.

```go
type hmap struct {
	count     int 
	flags     uint8
	B         uint8  
	noverflow uint16
	hash0     uint32

	buckets    unsafe.Pointer 
	oldbuckets unsafe.Pointer
	nevacuate  uintptr

	extra *mapextra
}
```
Xem thêm tại: [Go](https://github.com/golang/go/blob/f89d05eb7ba1885474d03bb62f0a36a2d3cf56ea/src/runtime/map.go#L115-L129) - Github

Mỗi khi số lượng item trong map đạt đến giới hạn nhất định thì Go sẽ tăng thêm gấp đôi số lượng bucket hiện tại bằng cách tăng `B` lên 1 đơn vị.

### Cách Go tăng số lượng item với Go trước version 1.24

`buckets` trong `hmap` là một pointer trỏ đến 1 mảng buckets (tên là `bmap`). Như bạn đọc đã biết, bản chất của mảng không phải muốn tăng thế nào thì tăng, mà nó phải thực hiện việc cấp phát vùng nhớ mới lớn hơn và thực hiện quá trình copy dữ liệu. 

`bmap` cũng thế, khi tăng số lượng buckets thì bắt buộc Go phải thực hiện quá trình xin cấp vùng nhớ mới và copy dữ liệu từ mảng `bmap` cũ sang `bmap` mới.

Tuy nhiên, quá trình copy không thực hiện ngay lúc cấp phát vùng mới mà nó sẽ thực hiện quá trình từ từ copy qua. Đó là lý do trong `hmap` có 2 biến là `buckets` và `oldbuckets` nhằm mục đích 'lazy copy'. 

Các thao tác tương tác với map (trừ việc get) sẽ từ từ thực hiện quá trình copy từ `oldbuckets` sang `buckets`. Lưu ý là vị trí các item trong bucket cũng sẽ thay đổi, giả sử `item A` trong bucket cũ có index là 1, nhưng khi sang bucket mới thì có thể là 1, 2 hoặc 3 - tùy thuộc vào hash function và số lượng bucket.

=> Go thực hiện quá trình lazy copy này để có thể tăng tốc độ insert, nếu không có quá trình lazy copy này thì mỗi lần tăng số lượng buckets có thể sẽ tốn rất nhiều thời gian để thực hiện lại toàn bộ việc hash và insert vào mảng `buckets` mới. Nhược điểm của cách này là map có thể  tốn bộ nhớ lúc mới vừa tăng số lượng bucket và 1 khoảng thời gian để move từ `oldbuckets` sang `buckets`.

{{< rawhtml >}}
<section class="go-map-widget" aria-labelledby="go-map-widget-title">
  <div class="gmw-card">
    <header class="gmw-header">
      <div>
        <p class="gmw-eyebrow">Go runtime · map lookup</p>
        <h3 id="go-map-widget-title" class="gmw-title">Go Map — Key Lookup</h3>
        <p class="gmw-subtitle">
          Mô phỏng cách Go tìm key trong map: lấy <span class="gmw-inline-code">B=2 bit thấp</span>
          để chọn bucket, rồi dùng <span class="gmw-inline-code">tophash</span> để lọc nhanh trước khi so sánh key thật.
        </p>
      </div>
    </header>

    <div class="gmw-controls" aria-label="Map lookup controls">
      <label class="gmw-field">
        <span class="gmw-field-label">Key</span>
        <input class="gmw-key-input" type="text" value="hello" maxlength="20" autocomplete="off" spellcheck="false" />
      </label>
      <button class="gmw-button gmw-button-primary gmw-lookup-button" type="button">Tìm key</button>
      <button class="gmw-button gmw-random-button" type="button">Thêm key mẫu</button>
    </div>

    <div class="gmw-hash-summary" aria-live="polite">
      <div class="gmw-hash-label">Nhập key rồi nhấn “Tìm key”.</div>
    </div>

    <div class="gmw-legend" aria-label="Chú thích màu">
      <span class="gmw-legend-item"><i class="gmw-dot gmw-dot-low"></i> Bit thấp → bucket index</span>
      <span class="gmw-legend-item"><i class="gmw-dot gmw-dot-high"></i> Bit cao → tophash</span>
    </div>

    <div class="gmw-panel">
      <div class="gmw-panel-head">
        <span>Hash 32-bit</span>
        <span class="gmw-panel-note">high bits · middle bits · low bits</span>
      </div>
      <div class="gmw-bit-row gmw-full-hash-row" aria-label="32 bit của hash"></div>
    </div>

    <div class="gmw-panel gmw-panel-compact">
      <div class="gmw-panel-head">
        <span>Tophash fingerprint</span>
        <span class="gmw-panel-note">8 bit cao nhất</span>
      </div>
      <div class="gmw-bit-row gmw-tophash-row" aria-label="8 bit cao của hash"></div>
    </div>

    <div class="gmw-split"></div>

    <div class="gmw-section-head">
      <span>Bucket array</span>
      <span>B=2 → 4 buckets · mỗi bucket có 8 slot</span>
    </div>
    <div class="gmw-buckets-row" aria-label="Bucket array"></div>

    <div class="gmw-section-head gmw-result-title">
      <span>Kết quả lookup</span>
    </div>
    <div class="gmw-result-box" aria-live="polite">Nhập key và nhấn “Tìm key”.</div>

    <div class="gmw-steps-grid" aria-label="Các bước lookup">
      <div class="gmw-step-item">
        <span class="gmw-step-num">1</span>
        <span>Hash key, lấy <span class="gmw-inline-code">B=2 bit thấp</span> để chọn bucket <span class="gmw-muted">0–3</span>.</span>
      </div>
      <div class="gmw-step-item">
        <span class="gmw-step-num">2</span>
        <span>Lấy <span class="gmw-inline-code">8 bit cao nhất</span> làm tophash fingerprint.</span>
      </div>
      <div class="gmw-step-item">
        <span class="gmw-step-num">3</span>
        <span>Scan <span class="gmw-inline-code">tophash[8]</span>; chỉ khi fingerprint khớp mới so sánh key thật.</span>
      </div>
    </div>
  </div>
</section>

<style>
  .go-map-widget,
  .go-map-widget *,
  .go-map-widget *::before,
  .go-map-widget *::after {
    box-sizing: border-box;
  }

  .go-map-widget {
    color: inherit;
    background: transparent;
    font-family: inherit;
    line-height: 1.5;

    --gmw-accent: #0f766e;
    --gmw-accent-strong: #0d9488;
    --gmw-warning: #d97706;
    --gmw-danger: #dc2626;
    --gmw-success: #15803d;

    --gmw-radius-sm: 8px;
    --gmw-radius-md: 12px;
    --gmw-radius-lg: 18px;
    --gmw-shadow: 0 18px 55px color-mix(in srgb, currentColor 10%, transparent);

    --gmw-text-muted: color-mix(in srgb, currentColor 62%, transparent);
    --gmw-text-faint: color-mix(in srgb, currentColor 42%, transparent);
    --gmw-border: color-mix(in srgb, currentColor 16%, transparent);
    --gmw-border-strong: color-mix(in srgb, currentColor 28%, transparent);
    --gmw-surface: color-mix(in srgb, currentColor 4%, transparent);
    --gmw-surface-2: color-mix(in srgb, currentColor 7%, transparent);
    --gmw-surface-3: color-mix(in srgb, currentColor 11%, transparent);
    --gmw-code-bg: color-mix(in srgb, currentColor 10%, transparent);

    --gmw-low-bg: color-mix(in srgb, var(--gmw-accent) 12%, transparent);
    --gmw-low-border: color-mix(in srgb, var(--gmw-accent) 48%, transparent);
    --gmw-high-bg: color-mix(in srgb, var(--gmw-warning) 13%, transparent);
    --gmw-high-border: color-mix(in srgb, var(--gmw-warning) 48%, transparent);
    --gmw-danger-bg: color-mix(in srgb, var(--gmw-danger) 10%, transparent);
    --gmw-danger-border: color-mix(in srgb, var(--gmw-danger) 52%, transparent);
    --gmw-success-bg: color-mix(in srgb, var(--gmw-success) 10%, transparent);
    --gmw-success-border: color-mix(in srgb, var(--gmw-success) 52%, transparent);

    width: 100%;
    max-width: 860px;
    margin: 1.75rem auto;
  }

  .go-map-widget .gmw-card {
    width: 100%;
    padding: clamp(18px, 3vw, 30px);
    color: inherit;
    background:
      radial-gradient(circle at top right, color-mix(in srgb, var(--gmw-accent) 10%, transparent), transparent 34%),
      var(--gmw-surface);
    border: 1px solid var(--gmw-border);
    border-radius: var(--gmw-radius-lg);
    box-shadow: var(--gmw-shadow);
  }

  .go-map-widget .gmw-header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }

  .go-map-widget .gmw-eyebrow {
    margin: 0 0 6px;
    color: var(--gmw-accent-strong);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.72rem;
    font-weight: 750;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .go-map-widget .gmw-title {
    margin: 0;
    color: inherit;
    font-size: clamp(1.12rem, 2vw, 1.45rem);
    font-weight: 760;
    letter-spacing: -0.025em;
    line-height: 1.2;
  }

  .go-map-widget .gmw-subtitle {
    max-width: 66ch;
    margin: 8px 0 0;
    color: var(--gmw-text-muted);
    font-size: 0.92rem;
  }

  .go-map-widget .gmw-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 10px;
    margin: 0 0 18px;
  }

  .go-map-widget .gmw-field {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-width: min(100%, 240px);
    color: inherit;
  }

  .go-map-widget .gmw-field-label {
    color: var(--gmw-text-muted);
    font-size: 0.82rem;
    font-weight: 650;
  }

  .go-map-widget .gmw-key-input {
    width: 170px;
    min-width: 0;
    padding: 9px 11px;
    color: inherit;
    background: var(--gmw-surface-2);
    border: 1px solid var(--gmw-border);
    border-radius: var(--gmw-radius-sm);
    outline: none;
    font: inherit;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.9rem;
    transition: border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
  }

  .go-map-widget .gmw-key-input:focus {
    border-color: var(--gmw-accent-strong);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--gmw-accent) 16%, transparent);
  }

  .go-map-widget .gmw-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 38px;
    padding: 9px 14px;
    color: inherit;
    background: var(--gmw-surface-2);
    border: 1px solid var(--gmw-border);
    border-radius: var(--gmw-radius-sm);
    cursor: pointer;
    font: inherit;
    font-size: 0.88rem;
    font-weight: 650;
    transition: transform 0.08s ease, background 0.16s ease, border-color 0.16s ease;
  }

  .go-map-widget .gmw-button:hover {
    background: var(--gmw-surface-3);
    border-color: var(--gmw-border-strong);
  }

  .go-map-widget .gmw-button:active {
    transform: translateY(1px) scale(0.99);
  }

  .go-map-widget .gmw-button-primary {
    color: #fff;
    background: var(--gmw-accent);
    border-color: var(--gmw-accent);
  }

  .go-map-widget .gmw-button-primary:hover {
    background: var(--gmw-accent-strong);
    border-color: var(--gmw-accent-strong);
  }

  .go-map-widget .gmw-hash-summary {
    margin: 0 0 10px;
    padding: 10px 12px;
    color: var(--gmw-text-muted);
    background: var(--gmw-surface-2);
    border: 1px solid var(--gmw-border);
    border-radius: var(--gmw-radius-md);
    font-size: 0.82rem;
  }

  .go-map-widget .gmw-hash-label {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
  }

  .go-map-widget .gmw-hash-key,
  .go-map-widget .gmw-hash-value,
  .go-map-widget .gmw-hash-val,
  .go-map-widget .gmw-inline-code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  }

  .go-map-widget .gmw-hash-key {
    color: inherit;
    font-weight: 760;
  }

  .go-map-widget .gmw-hash-value,
  .go-map-widget .gmw-hash-val {
    color: inherit;
    font-size: 0.84rem;
    font-weight: 680;
  }

  .go-map-widget .gmw-note-low { color: var(--gmw-accent-strong); }
  .go-map-widget .gmw-note-high { color: var(--gmw-warning); }

  .go-map-widget .gmw-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 16px;
    margin: 0 0 12px;
  }

  .go-map-widget .gmw-legend-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--gmw-text-muted);
    font-size: 0.78rem;
  }

  .go-map-widget .gmw-dot {
    width: 11px;
    height: 11px;
    border-radius: 3px;
    flex: 0 0 auto;
  }

  .go-map-widget .gmw-dot-low {
    background: var(--gmw-low-bg);
    border: 1px solid var(--gmw-low-border);
  }

  .go-map-widget .gmw-dot-high {
    background: var(--gmw-high-bg);
    border: 1px solid var(--gmw-high-border);
  }

  .go-map-widget .gmw-panel {
    margin-top: 10px;
    padding: 12px;
    background: var(--gmw-surface-2);
    border: 1px solid var(--gmw-border);
    border-radius: var(--gmw-radius-md);
  }

  .go-map-widget .gmw-panel-compact {
    margin-top: 8px;
  }

  .go-map-widget .gmw-panel-head,
  .go-map-widget .gmw-section-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 8px;
    color: var(--gmw-text-muted);
    font-size: 0.78rem;
    font-weight: 700;
  }

  .go-map-widget .gmw-panel-note,
  .go-map-widget .gmw-section-head span:last-child {
    color: var(--gmw-text-faint);
    font-weight: 520;
  }

  .go-map-widget .gmw-bit-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
  }

  .go-map-widget .gmw-bit {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 23px;
    height: 23px;
    color: var(--gmw-text-muted);
    background: var(--gmw-surface);
    border: 1px solid var(--gmw-border);
    border-radius: 6px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.72rem;
    font-weight: 760;
    transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
  }

  .go-map-widget .gmw-bit-low {
    color: var(--gmw-accent-strong);
    background: var(--gmw-low-bg);
    border-color: var(--gmw-low-border);
  }

  .go-map-widget .gmw-bit-high {
    color: var(--gmw-warning);
    background: var(--gmw-high-bg);
    border-color: var(--gmw-high-border);
  }

  .go-map-widget .gmw-eq {
    margin: 0 4px;
    color: var(--gmw-text-faint);
    font-size: 0.82rem;
  }

  .go-map-widget .gmw-split {
    height: 1px;
    margin: 18px 0;
    background: var(--gmw-border);
  }

  .go-map-widget .gmw-buckets-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
    margin-bottom: 14px;
  }

  .go-map-widget .gmw-bucket-card {
    min-width: 0;
    overflow: hidden;
    background: var(--gmw-surface-2);
    border: 1px solid var(--gmw-border);
    border-radius: var(--gmw-radius-md);
    transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
  }

  .go-map-widget .gmw-bucket-card.gmw-active {
    border-color: var(--gmw-accent-strong);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--gmw-accent) 12%, transparent);
    transform: translateY(-1px);
  }

  .go-map-widget .gmw-bucket-head {
    padding: 7px 8px;
    color: var(--gmw-text-muted);
    background: var(--gmw-surface);
    border-bottom: 1px solid var(--gmw-border);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.72rem;
    font-weight: 760;
    text-align: center;
  }

  .go-map-widget .gmw-bucket-card.gmw-active .gmw-bucket-head {
    color: var(--gmw-accent-strong);
    background: var(--gmw-low-bg);
  }

  .go-map-widget .gmw-slot-row {
    display: flex;
    align-items: center;
    gap: 5px;
    min-height: 27px;
    padding: 4px 6px;
    border-bottom: 1px solid var(--gmw-border);
  }

  .go-map-widget .gmw-slot-row:last-child {
    border-bottom: 0;
  }

  .go-map-widget .gmw-tophash {
    width: 32px;
    flex: 0 0 auto;
    padding: 2px 3px;
    color: var(--gmw-text-faint);
    background: var(--gmw-surface);
    border: 1px solid var(--gmw-border);
    border-radius: 5px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.62rem;
    font-weight: 700;
    text-align: center;
  }

  .go-map-widget .gmw-tophash.gmw-match {
    color: var(--gmw-warning);
    background: var(--gmw-high-bg);
    border-color: var(--gmw-high-border);
  }

  .go-map-widget .gmw-tophash.gmw-empty {
    opacity: 0.45;
  }

  .go-map-widget .gmw-key-chip {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    color: var(--gmw-text-muted);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.68rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .go-map-widget .gmw-key-chip.gmw-found {
    color: var(--gmw-accent-strong);
    font-weight: 800;
  }

  .go-map-widget .gmw-result-title {
    margin-top: 14px;
  }

  .go-map-widget .gmw-result-box {
    min-height: 44px;
    padding: 11px 13px;
    color: var(--gmw-text-muted);
    background: var(--gmw-surface-2);
    border: 1px solid var(--gmw-border);
    border-radius: var(--gmw-radius-md);
    font-size: 0.88rem;
    transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
  }

  .go-map-widget .gmw-result-box.gmw-found {
    color: var(--gmw-success);
    background: var(--gmw-success-bg);
    border-color: var(--gmw-success-border);
  }

  .go-map-widget .gmw-result-box.gmw-notfound {
    color: var(--gmw-danger);
    background: var(--gmw-danger-bg);
    border-color: var(--gmw-danger-border);
  }

  .go-map-widget .gmw-steps-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin-top: 16px;
  }

  .go-map-widget .gmw-step-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    min-width: 0;
    padding: 11px;
    color: var(--gmw-text-muted);
    background: var(--gmw-surface-2);
    border: 1px solid var(--gmw-border);
    border-radius: var(--gmw-radius-md);
    font-size: 0.8rem;
  }

  .go-map-widget .gmw-step-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    margin-top: 1px;
    flex: 0 0 auto;
    color: var(--gmw-accent-strong);
    background: var(--gmw-low-bg);
    border: 1px solid var(--gmw-low-border);
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 800;
  }

  .go-map-widget .gmw-inline-code {
    padding: 0.08em 0.38em;
    color: var(--gmw-accent-strong);
    background: var(--gmw-code-bg);
    border: 1px solid var(--gmw-border);
    border-radius: 5px;
    font-size: 0.92em;
  }

  .go-map-widget .gmw-muted {
    color: var(--gmw-text-faint);
  }

  @media (max-width: 760px) {
    .go-map-widget .gmw-buckets-row,
    .go-map-widget .gmw-steps-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 520px) {
    .go-map-widget {
      margin: 1.25rem auto;
    }

    .go-map-widget .gmw-card {
      border-radius: 14px;
    }

    .go-map-widget .gmw-controls,
    .go-map-widget .gmw-field {
      align-items: stretch;
      flex-direction: column;
    }

    .go-map-widget .gmw-field,
    .go-map-widget .gmw-key-input,
    .go-map-widget .gmw-button {
      width: 100%;
    }

    .go-map-widget .gmw-buckets-row,
    .go-map-widget .gmw-steps-grid {
      grid-template-columns: 1fr;
    }

    .go-map-widget .gmw-panel-head,
    .go-map-widget .gmw-section-head {
      align-items: flex-start;
      flex-direction: column;
      gap: 3px;
    }
  }
</style>

<script>
  (() => {
    const B = 2;
    const NUM_BUCKETS = 1 << B;
    const SLOTS = 8;
    const INITIAL_KEYS = ['go', 'map', 'bucket', 'hash', 'world', 'foo', 'bar'];
    const RANDOM_WORDS = [
      'golang', 'runtime', 'slice', 'chan', 'goroutine', 'sync',
      'defer', 'panic', 'recover', 'interface', 'struct', 'pointer'
    ];

    function hash32(str) {
      let h = 5381;
      for (let i = 0; i < str.length; i++) {
        h = Math.imul(h, 33) ^ str.charCodeAt(i);
      }
      return h >>> 0;
    }

    function toBinary(n, bits) {
      return (n >>> 0).toString(2).padStart(bits, '0').slice(-bits);
    }

    function createStore() {
      const store = {};
      for (let i = 0; i < NUM_BUCKETS; i++) store[i] = [];
      return store;
    }

    function insertKey(store, key) {
      const h = hash32(key);
      const bi = h & (NUM_BUCKETS - 1);
      const th = (h >>> 24) & 0xff;
      const bucket = store[bi];

      if (bucket.some((entry) => entry.key === key)) return;
      if (bucket.length < SLOTS) bucket.push({ key, h32: h, tophash: th });
    }

    function el(tagName, className, text) {
      const node = document.createElement(tagName);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    }

    function initWidget(root) {
      if (root.dataset.gmwInitialized === 'true') return;
      root.dataset.gmwInitialized = 'true';

      const store = createStore();
      INITIAL_KEYS.forEach((key) => insertKey(store, key));

      const keyInput = root.querySelector('.gmw-key-input');
      const lookupButton = root.querySelector('.gmw-lookup-button');
      const randomButton = root.querySelector('.gmw-random-button');
      const hashLabel = root.querySelector('.gmw-hash-label');
      const fullHashRow = root.querySelector('.gmw-full-hash-row');
      const tophashRow = root.querySelector('.gmw-tophash-row');
      const bucketsRow = root.querySelector('.gmw-buckets-row');
      const resultBox = root.querySelector('.gmw-result-box');

      function renderHashLabel(key, h, bi, th) {
        hashLabel.replaceChildren(
          document.createTextNode('hash('),
          el('strong', 'gmw-hash-key', key),
          document.createTextNode(') = '),
          el('span', 'gmw-hash-value', `0x${h.toString(16).padStart(8, '0')}`),
          document.createTextNode(' · '),
          el('span', 'gmw-note-low', `bit thấp → bucket ${bi}`),
          document.createTextNode(' · '),
          el('span', 'gmw-note-high', `bit cao → tophash 0x${th.toString(16).padStart(2, '0')}`)
        );
      }

      function renderBitRows(h, th) {
        const hBin = toBinary(h, 32);
        const hiBin = toBinary(th, 8);

        fullHashRow.replaceChildren();
        for (let i = 0; i < 32; i++) {
          const bit = el('span', 'gmw-bit', hBin[i]);
          if (i < 8) bit.classList.add('gmw-bit-high');
          if (i >= 32 - B) bit.classList.add('gmw-bit-low');
          fullHashRow.appendChild(bit);
        }

        tophashRow.replaceChildren();
        for (let i = 0; i < 8; i++) {
          tophashRow.appendChild(el('span', 'gmw-bit gmw-bit-high', hiBin[i]));
        }
        tophashRow.appendChild(el('span', 'gmw-eq', '='));
        tophashRow.appendChild(el('span', 'gmw-hash-val', `0x${th.toString(16).padStart(2, '0')} (${th})`));
      }

      function renderBuckets(targetBucketIndex, targetTophash, targetKey) {
        bucketsRow.replaceChildren();

        for (let i = 0; i < NUM_BUCKETS; i++) {
          const card = el('div', 'gmw-bucket-card');
          if (i === targetBucketIndex) card.classList.add('gmw-active');

          card.appendChild(el('div', 'gmw-bucket-head', `bucket[${i}]`));

          for (let slot = 0; slot < SLOTS; slot++) {
            const entry = store[i][slot];
            const row = el('div', 'gmw-slot-row');
            const thCell = el('span', 'gmw-tophash');
            const keyChip = el('span', 'gmw-key-chip');

            if (!entry) {
              thCell.classList.add('gmw-empty');
              thCell.textContent = '--';
            } else {
              thCell.textContent = `0x${entry.tophash.toString(16).padStart(2, '0')}`;
              keyChip.textContent = entry.key;

              if (i === targetBucketIndex && entry.tophash === targetTophash) {
                thCell.classList.add('gmw-match');
              }
              if (i === targetBucketIndex && entry.key === targetKey) {
                keyChip.classList.add('gmw-found');
              }
            }

            row.append(thCell, keyChip);
            card.appendChild(row);
          }

          bucketsRow.appendChild(card);
        }
      }

      function renderResult(key, bi, th) {
        const bucket = store[bi];
        const found = bucket.find((entry) => entry.key === key);
        const thHex = th.toString(16).padStart(2, '0');

        resultBox.className = 'gmw-result-box';

        if (found) {
          resultBox.classList.add('gmw-found');
          resultBox.textContent = `✓ Tìm thấy “${key}” trong bucket[${bi}] · tophash khớp 0x${thHex}`;
          return;
        }

        const thMatches = bucket
          .filter((entry) => entry.tophash === th)
          .map((entry) => entry.key);

        resultBox.classList.add('gmw-notfound');
        if (thMatches.length) {
          resultBox.textContent = `✗ Không tìm thấy “${key}” · tophash 0x${thHex} khớp với [${thMatches.join(', ')}], nhưng key thật khác.`;
        } else {
          resultBox.textContent = `✗ Không tìm thấy “${key}” trong bucket[${bi}] · không có tophash nào khớp nên dừng sớm.`;
        }
      }

      function lookup() {
        const key = keyInput.value.trim();
        if (!key) return;

        const h = hash32(key);
        const bi = h & (NUM_BUCKETS - 1);
        const th = (h >>> 24) & 0xff;

        renderHashLabel(key, h, bi, th);
        renderBitRows(h, th);
        renderBuckets(bi, th, key);
        renderResult(key, bi, th);
      }

      function addRandom() {
        const word = RANDOM_WORDS[Math.floor(Math.random() * RANDOM_WORDS.length)];
        keyInput.value = word;
        insertKey(store, word);
        lookup();
      }

      lookupButton.addEventListener('click', lookup);
      randomButton.addEventListener('click', addRandom);
      keyInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') lookup();
      });

      lookup();
    }

    function initAllWidgets() {
      document.querySelectorAll('.go-map-widget').forEach(initWidget);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAllWidgets, { once: true });
    } else {
      initAllWidgets();
    }
  })();
</script>

{{< /rawhtml >}}

### Cách Go giảm số lượng item với Go trước version 1.24

Có phải bạn sẽ thấy việc tăng số lượng item rất phiền phức không? Vì để tăng tốc độ xử lý nên Go chọn cách đi như thế. Tuy nhiên, việc Go xóa 1 item thì rất đơn giản. Khi bạn xóa 1 item, Go chỉ đơn giản đánh chỉ mục - giá trị đã xử lý của hash function thành `empty` là xong. Như vậy, việc xóa tốn rất ít thời gian.

=> Với cách làm này, bạn có thấy một nhược điểm là khi xóa một số item thì chúng ta đâu thể nào giảm số lượng bucket tương ứng được vì trường hợp tệ nhất là mỗi bucket chứa 1 item thì sao, đúng chứ? Ngoài ra, khi map hiện tại của bạn đã đạt được 1_000_000 buckets rồi, thì đâu có gì đảm bảo rằng trong tương lai map của bạn không tăng lên 1_000_000 buckets lần thứ hai. Do đó, Go sẽ giữ nguyên số lượng bucket dù cho bạn có clear hết map rồi. Go đã đánh đổi bộ nhớ lấy tốc độ ở bước này.

### Go 1.24

Từ version Go 1.24 trở đi, Go không còn dùng khái niệm `hmap` nữa, Go chuyển sang dùng `Swiss Table` và map bây giờ không còn giữ mảng các buckets nữa mà thay vào đó giữ các `table`, trong `table` thì lại có các `group`, trong `group` lại có `8 slot` cho key và value tương tự như trên.

Dù có thay đổi thuật toán thì việc memory vẫn giữ nguyên sau khi delete tất cả các phần tử Vấn đề không tự shrink sau delete vẫn còn, nhưng con số memory có thể khác Go <=1.23.

Bạn có thể đọc thêm tại [Blog của Golang](https://go.dev/blog/swisstable).

## Giải pháp

### Khởi tạo map mới

Bạn có thể khởi tạo lại map mới định kỳ để biến map cũ thành map không còn sử dụng thì GC sẽ thực hiện dọn dẹp bộ nhớ của map cũ, từ đó mà chương trình cũng sẽ giảm bộ nhớ sử dụng.

### Dùng con trỏ

Nếu việc lưu value của map tốn quá nhiều bộ nhớ thì bạn có thể thay bằng con trỏ, khi đó value của map lúc này sẽ chỉ tốn 4 bytes để lưu địa chỉ ô nhớ, còn giá trị thật sự trên heap sẽ được GC xóa sau.

## Kết luận

Thông thường, khi ta sử dụng map, ta thường nghĩ việc xóa 1 item trong map cũng sẽ xóa bộ nhớ của item đó và giảm số lượng bộ nhớ. Tuy nhiên, sự thật không phải vậy, việc chúng ta tìm hiểu sâu về cách vận hành của một thứ gì đó, chúng ta sẽ hiểu được lý do tại sao, khi nào áp dụng và những trường hợp nào tránh nó tốt nhất. Ở đây, bạn sẽ hiểu được lý do tại sao map một khi đã tăng thì sẽ không giảm bộ nhớ sử dụng được, chúng ta có thể gán lại để GC thực hiện dọn dẹp bộ nhớ hoặc sử dụng con trỏ để giảm bộ nhớ xuống ít nhất có thể.

## Tham khảo
- [100 Go Mistakes and How to Avoid Them](https://www.oreilly.com/library/view/100-go-mistakes/9781617299599/) - Teiva Harsanyi
- [Leak memory do sử dụng map sai cách trong Golang?](https://viblo.asia/p/leak-memory-do-su-dung-map-sai-cach-trong-golang-W13VMgwxJY7) - DuongPT (Viblo)