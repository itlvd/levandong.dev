---
author: "Le Van Dong"
title: "Hiểu về từ khoá this trong Javascript"
date: "2024-04-29 03:34:55"
tags: ["Javascript", "Tips"]
categories: ["Programming", "Tips"]
ShowToc: false
TocOpen: false
---

Với các bạn từng học các ngôn ngữ hướng đối tượng khác ví dụ như C#, Java,.. thì chắc hẳn bạn đã rất quen với khái niệm `this` . Và khi mình tìm hiểu một chút về từ khoá này thì mỗi ngôn ngữ sẽ có cách sử dụng khá khác nhau. Nhưng nhìn chung, mọi ngôn ngữ đều chung một mục đích hay sử dụng là phân biệt parameter của function và properties của class, ngoài ra còn một số cách sử dụng khác. Tuy nhiên, trong bài viết này, tôi sẽ trình bày với các bạn từ khoá this trong Javascript.

## This là gì?

Đây là một khái niệm khá dễ nhầm lẫn cho các bạn mới tìm hiểu. Các bạn có thể hiểu đơn giản, this là một biến được tạo tự động khi tạo một hàm, object. `this` sẽ mang giá trị tới đối tượng mà nó thuộc về.

Đọc hơi khó hiểu đúng không? Chúng ta sẽ đi tìm hiểu qua một số ví dụ bên dưới

## This trong Object

Không có gì dễ hiểu hơn khi lấy object làm ví dụ khi chúng ta tìm hiểu về this.

```javascript
const Car = {
  name: "Maybach",
  getCar: function () {
    console.log(this);
  },
};

Car.getCar(); // return: Object { name: "Maybach", getName: getName() }
```

Đầu tiên, chúng ta định nghĩa một Object là Car, bên trong Car chúng ta có thuộc tính là `name` và một function là `getCar()` để in ra xem giá trị của `this` lúc này là gì. Sau đó, ta gọi hàm `getCar()`.

Vậy khi đó từ khoá `this` lúc này được tạo và nó sẽ trỏ vào Car. Vì sao, vì lúc này hàm `getCar()` được gọi thông qua Car nên context của nó hiện tại là của Car và nó sẽ đại diện cho object Car đó.

Nếu vẫn thấy mang máng khó hiểu, hãy đọc lại câu thần chú này:

> `this` sẽ mang giá trị tới đối tượng mà nó thuộc về.

## This không nằm trong object hay function nào

Giả sự chúng ta lại bật console của trình duyệt lên và chạy dòng lệnh

```javascript
console.log(this); // Return : Window [...]
```

Lệnh trên nó trả về Window, tại sao như vậy? Thật ra khi ta chạy chương trình dưới local thì sẽ có object `global` hoặc với trình duyệt là `Window` được tạo ra và chương trình của bạn sẽ chạy dưới object này. Do đó, khi bạn sử dụng từ khoá this mà không thuộc một đối tượng nào thì nó hiển nhiên sẽ là đối tượng lớn nhất là `Window`.

Để chứng minh điều này bạn có thể chạy hàm bên dưới để xem thử kết quả

```javascript
function testGlobal() {
  console.log(this);
}

window.testGlobal();
```

Bạn cứ nghĩ là `this` nó sẽ thuộc về một đối tượng mà chứa nó là xong.

## Một số trường hợp dễ nhầm lẫn

Sau khi ta đi qua 2 ví dụ dễ hình dung, thì giờ ta sẽ tới phần dễ nhầm lẫn. Bên dưới sẽ cung cấp cho các bạn một số cách định nghĩa và các bạn đoán xem đáp án là gì trước khi xem câu trả lời để xem các bạn nắm chắc bao nhiêu nhé.

### Object trong một hàm

```javascript
function run() {
  console.log(this); // this số 1

  const obj = {
    name: "obj",
    run: function () {
      console.log(this); // this số 2
    },
  };

  obj.run();
}

run();
```

Nhắc lại câu thần chú:

> `this` sẽ mang giá trị tới đối tượng mà nó thuộc về.

Với `this` số 1, nó sẽ được chạy khi hàm `run()` được gọi, khi này hàm `run()` thật chất đang là `window.run()` nên `this` số 1 sẽ trả về kết quả là đối tượng window `Window [...]` . Và theo đó, `this` số 2, lúc này được gọi từ `obj.run()` nên nó sẽ trả về object `obj` `Object { name: "obj", run: run() }` .

### Gán lại hàm cho một biến khác ở global

```javascript
const obj = {
  name: "Object",
  print: function () {
    console.log(this);
  },
};

const printer = obj.print;

printer();
```

Nếu như các bạn nghĩ `this` lúc này là `obj`? Thì các bạn đã có một sự nhầm lẫn rồi. Kết quả lúc này sẽ trả về là `window`, tại sao? Đúng là hàm `print` được gọi từ `obj`. Tuy nhiên, `printer` lúc này được gọi từ `window` tương tự như `window.printer`. Vậy nên, kết quả lúc này từ khoá `this` sẽ trỏ vào `window`.

### Nested function trong javascript

Thêm một trường hợp nữa là khi chúng ta tạo một function trong một function thì như thế nào?

```javascript
console.log(this);

const obj = {
  name: "Object",
  print: function () {
    console.log(this);

    function print2() {
      console.log(this);
    }

    print2();
  },
};

obj.print();
```

Kết quả lúc này sẽ trả về 3 object lần lượt là: `window`, `obj`, `window`. Khoan đã, tại sao cái `this` cuối cùng lại là `window`. 2 console đầu, các bạn chắc hẳn đã quen thuộc rồi, còn cái cuối các bạn để ý hàm `print2()` không được gọi bởi một object cụ thể nào nên nó sẽ mang giá trị this mặc định là `window`.

## Kết luận

Từ khoá `this` trong javascript sẽ tham chiếu đến đối tượng mà nó được gọi, chỉ cần chúng ta xác định được đâu là đối tượng gọi hàm hoặc phương thức thì ta có thể xác định được `this` đang mang giá trị gì.

## Tham khảo

[Almighty this, Demystified](https://dillionmegida.com/p/this-demystified/)

[Từ khóa "this" trong Javascript? Dễ hiểu cùng F8 nào!](https://youtu.be/ii1Ra_zLDIo?si=ORvqrJhcrkufF0Cb)