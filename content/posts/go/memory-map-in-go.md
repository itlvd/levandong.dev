---
author: "Le Van Dong"
title: "Go - Memory của map trong Golang"
date: "2026-06-28"
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

### Cách Go tăng số lượng item

`buckets` trong `hmap` là một pointer trỏ đến 1 mảng buckets (tên là `bmap`). Như bạn đọc đã biết, bản chất của mảng không phải muốn tăng thế nào thì tăng, mà nó phải thực hiện việc cấp phát vùng nhớ mới lớn hơn và thực hiện quá trình copy dữ liệu. 

`bmap` cũng thế, khi tăng số lượng buckets thì bắt buộc Go phải thực hiện quá trình xin cấp vùng nhớ mới và copy dữ liệu từ mảng `bmap` cũ sang `bmap` mới.

Tuy nhiên, quá trình copy không thực hiện ngay lúc cấp phát vùng mới mà nó sẽ thực hiện quá trình từ từ copy qua. Đó là lý do trong `hmap` có 2 biến là `buckets` và `oldbuckets` nhằm mục đích 'lazy copy'. 

Các thao tác tương tác với map (trừ việc get) sẽ từ từ thực hiện quá trình copy từ `oldbuckets` sang `buckets`. Lưu ý là vị trí các item trong bucket cũng sẽ thay đổi, giả sử `item A` trong bucket cũ có index là 1, nhưng khi sang bucket mới thì có thể là 1, 2 hoặc 3 - tùy thuộc vào hash function và số lượng bucket.

=> Go thực hiện quá trình lazy copy này để có thể tăng tốc độ insert, nếu không có quá trình lazy copy này thì mỗi lần tăng số lượng buckets có thể sẽ tốn rất nhiều thời gian để thực hiện lại toàn bộ việc hash và insert vào mảng `buckets` mới. Nhược điểm của cách này là map có thể  tốn bộ nhớ lúc mới vừa tăng số lượng bucket và 1 khoảng thời gian để move từ `oldbuckets` sang `buckets`.

### Cách Go giảm số lượng item

Có phải bạn sẽ thấy việc tăng số lượng item rất phiền phức không? Vì để tăng tốc độ xử lý nên Go chọn cách đi như thế. Tuy nhiên, việc Go xóa 1 item thì rất đơn giản. Khi bạn xóa 1 item, Go chỉ đơn giản đánh chỉ mục - giá trị đã xử lý của hash function thành `empty` là xong. Như vậy, việc xóa tốn rất ít thời gian.

=> Với cách làm này, bạn có thấy một nhược điểm là khi xóa một số item thì chúng ta đâu thể nào giảm số lượng bucket tương ứng được vì trường hợp tệ nhất là mỗi bucket chứa 1 item thì sao, đúng chứ? Ngoài ra, khi map hiện tại của bạn đã đạt được 1_000_000 buckets rồi, thì đâu có gì đảm bảo rằng trong tương lai map của bạn không tăng lên 1_000_000 buckets lần thứ hai. Do đó, Go sẽ giữ nguyên số lượng bucket dù cho bạn có clear hết map rồi. Go đã đánh đổi bộ nhớ lấy tốc độ ở bước này.

### Go 1.24

Từ version Go 1.24 trở đi, Go không còn dùng khái niệm `hmap` nữa, Go chuyển sang dùng `Swiss Table` và map bây giờ không còn giữ mảng các buckets nữa mà thay vào đó giữ các `table`, trong `table` thì lại có các `group`, trong `group` lại có `8 slot` cho key và value tương tự như trên.

Dù có thay đổi thuật toán thì việc memory vẫn giữ nguyên sau khi delete tất cả các phần tử vẫn sẽ còn tồn tại.

Bạn có thể đọc thêm tại [Blog của Golang](https://go.dev/blog/swisstable).

## Giải pháp

### Khởi tạo map mới

Bạn có thể khởi tạo lại map mới định kỳ để biến map cũ thành map không còn sử dụng thì GC sẽ thực hiện dọn dẹp bộ nhớ của map cũ, từ đó mà chương trình cũng sẽ giảm bộ nhớ sử dụng.

### Dùng con trỏ

Nếu việc lưu value của map tốn quá nhiều bộ nhớ thì bạn có thể thay bằng con trỏ, khi đó value của map lúc này sẽ chỉ tốn 4 bytes để lưu địa chỉ ô nhớ, còn giá trị thật sự trên heap sẽ được GC xóa sau.

## Kết luận

Thông thường, khi ta sử dụng map, ta thường nghĩ việc xóa 1 item trong map cũng sẽ xóa bộ nhớ của item đó và giảm số lượng bộ nhớ. Tuy nhiên, sự thật không phải vậy, việc chúng ta tìm hiểu sâu về cách vận hành của một thứ gì đó, chúng ta sẽ hiểu được lý do tại sao, khi nào áp dụng và những trường hợp nào tránh nó tốt nhất. Ở đây, bạn sẽ hiểu được lý do tại sao map một khi đã tăng thì sẽ không giảm bộ nhớ sử dụng được, chúng ta có thể gán lại để GC thực hiện dọn dẹp bộ nhớ hoặc sử dụng con trỏ để giảm bộ nhớ xuống ít nhất có thể.
