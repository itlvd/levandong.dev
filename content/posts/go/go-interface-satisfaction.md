---
author: "Le Van Dong"
title: "Go - Interface Satisfaction"
date: "2025-06-20"
description: "Go implement interface ngầm định - kiểm tra lúc compile, không đợi runtime."
tags: ["Go", "Tips"]
categories: ["Golang", "Programming"]
---

Trong Golang, việc implement interface không phải là bắt buộc và không cần phải chỉ rõ là một struct đang thực hiện implement interface nào, mà việc đó được **thực hiện ngầm định**. Khi struct của bạn đủ các method của interface thì nó sẽ được coi là implement interface đó.

---

Chính điều này giúp Go có khả năng flexible cách chúng ta implement một interface cũng như gây khó khăn khi chúng ta muốn tìm ra các struct nào implement interface đó. Vì vậy, bài viết này sẽ đi qua hai phần, phần đầu là tìm hiểu về cách tìm ra các struct nào implement interface đó, phần hai là một thủ thuật nhỏ để bạn có thể truyền implement interface vào một function của thư viện mà bạn viết.

## A. Tìm ra các struct implement interface

Do tính chất flexible của việc implement interface trong Go, việc bạn đang code một dự án lớn, nơi mà có nhiều struct implement cùng một interface, thì việc tìm ra các struct implement interface đó có thể gây khó khăn. Khi bạn thêm hoặc method thì có thể quên implement method đó vào struct nào, dẫn đến runtime error.

Thông thường ở runtime, Go sẽ thông báo error nếu struct không implement đủ method của interface. Việc đó là quá chậm, tới lúc runtime thì mới biết lỗi. Nếu bạn muốn biết lỗi này sớm hơn thì bạn có thể thử khởi tạo một biến với kiểu dữ liệu là interface và gán giá trị là struct của bạn đã implement. Nếu struct của bạn không implement đủ method của interface thì sẽ thông báo error ngay lúc compile. Thậm chí ở nhiều editor hay IDE sẽ hiện thông báo lỗi để bạn có thể sửa được.

Ví dụ:

```go
type MyInterface interface {
	Method1()
	Method2()
}

type MyStruct struct {
	Field1 int
	Field2 string
}

func main() {
	// Báo error ngay lúc compile hoặc ngay lúc code
	var _ MyInterface = MyStruct{} 
}
```

Ở ví dụ trên, vì MyStruct chưa implement đủ method `Method1()` và `Method2()` nên khi compile sẽ báo lỗi ngay lập tức.

```go
package main

type MyInterface interface {
	Method1()
	Method2()
}

type MyStruct struct {
	Field1 int
	Field2 string
}

func (m MyStruct) Method1() {

}

func (m MyStruct) Method2() {

}

func main() {
	var _ MyInterface = MyStruct{} // Thỏa mãn interface
}

``` 

Với ví dụ trên thì sẽ không có lỗi xảy ra vì bạn đã implement interface rồi.

Từ 2 ví dụ trên, ta có thể thấy là để đảm bảo struct của bạn đã implement interface thì chỉ việc tạo một biến với kiểu dữ liệu là interface và gán giá trị là struct của bạn đã implement là được.

Ngoài cách sử dụng kiểu khởi tạo giá trị thì bạn cũng có thể khởi tạo kiểu pointer `var _ MyInterface = (*MyStruct)(nil)` nếu như struct của bạn là value receiver.

Nhưng nếu struct của bạn là pointer receiver thì bắt buộc bạn phải khởi tạo kiểu pointer `var _ MyInterface = (*MyStruct)(nil)`

```go
type MyInterface interface {
	Method1()
	Method2()
}

type MyStruct struct {
	Field1 int
	Field2 string
}

func (m *MyStruct) Method1() {

}

func (m *MyStruct) Method2() {

}

func main() {
	var _ MyInterface = (*MyStruct)(nil)
}
```


## B. Truyền implement vào trong thư viện

Mặc dù hiếm khi sử dụng nhưng chúng ta có thể lợi dụng đặc tính flexible này của Go để sử dụng 1 trick đơn giản cho project cá nhân. 

Giả sử bạn đang code 1 project và bạn cũng code 1 thư viện.
Bạn có vài hàm cần chạy trong project và cũng cần chạy trong thư viện.
Nhưng bạn không muốn implement trong thư viện mà muốn implement trong project chính và truyền variable implement vào trong thư viện để sử dụng.

Với Go bạn có thể làm được việc đó. Bạn chỉ cần tạo một interface + implement interface đó trong project chính và trong thư viện thì bạn cũng tạo 1 interface mới (Không cần implement trong thư viện) và truyền variable implement vào trong thư viện là được.

**Project chính**

```go
package main

import "fmt"

type MyInterface interface {
	Method1()
	Method2()
}

type MyStruct struct {
	Field1 int
	Field2 string
}

func (m MyStruct) Method1() {
	fmt.Println("Method1")
}

func (m MyStruct) Method2() {
	fmt.Println("Method2")
}

func main() {
	var _ MyInterface = MyStruct{}
}
```

**Thư viện**

```go
package lib

import "fmt"

type MyInterface interface {
	Method1()
	Method2()
}

func Run(myInterface MyInterface) {
	myInterface.Method1()
	myInterface.Method2()
}
```

Vậy là trong thư viện có thể thực thi được implement của project chính bình thường.

Hy vọng bạn có thể áp dụng được trong dự án của mình.

## C. Tham khảo

[Dev.to - Checking if a Type Satisfies an Interface in Go](https://dev.to/kittipat1413/checking-if-a-type-satisfies-an-interface-in-go-432n)