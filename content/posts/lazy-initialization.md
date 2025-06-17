---
author: "Le Van Dong"
title: "Lazy giúp khởi tạo trong multithread"
date: "2024-08-11"
tags: ["CSharp", "Tips"]
categories: ["Programming"]
---

Ở bài viết [Singleton Pattern](/singleton-pattern/), tôi có trình bày về một cách đơn giản để tạo Singleton Pattern trong môi trường thread-safe bằng cách sử dụng Lazy<T>. Trong .Net, đây là một class được dùng để khởi tạo an toàn trong môi trường đa luồng.

Lazy<T> là gì?
--------------

`Lazy<T>` là một lớp giúp bạn trì hoãn việc tạo đối tượng cho đến khi sử dụng đối tượng đó lần đầu tiên, chúng ta có thể gọi là Lazy Initialization hay là khởi tạo chậm đều được.

Ta có thể thấy nó khá giống với [Singleton Pattern](/singleton-pattern/), nó sẽ giúp chúng ta khởi tạo đối tượng mà không cần quan tâm đến thread-safe trong quá trình khởi tạo.

Khi nào thì dùng Lazy<T>
------------------------

`Lazy<T>` dùng để giảm chi phí khởi tạo của đối tượng, nhất là khi tạo một đối tượng tốn kém tài nguyên. Thay vì chúng ta khởi tạo lập tức ngay khi khai báo. Nó chỉ khởi tạo khi truy cập tới đối tượng lần đầu tiên giúp chúng ta tiết kiệm tài nguyên và cải thiện hiệu suất nếu đối tượng không phải lúc nào cũng cần sử dụng.

Cách sử dụng Lazy<T>
--------------------

Chúng ta có rất nhiều cách để khởi tạo `Lazy<T>` và sử dụng nó trong dự án của mình.

### Khởi tạo mặc định - Lazy<T>()

Bạn có thể khởi tạo mặc định mà không cần truyền tham số. Khi khởi tạo, lớp Lazy sẽ sử dụng `constructor mặc định` của T được truyền vào.
```csharp
Lazy<MyClass> lazyObject = new Lazy<MyClass>();

// Khi truy cập `Value`, `MyClass` sẽ được khởi tạo bằng constructor mặc định.
MyClass instance = lazyObject.Value;
```
Khi bạn chọn khởi tạo mặc định thì `constructor` của `T` bắt buộc phải public và không có tham số. Quá trình này mặc định là thread-safe.

### Khởi tạo thông qua delegate Func<T> - Lazy<T>(Func<T>) 

Ngoài cách khởi tạo mặc định, nếu bạn có tham số cần truyền vào hoặc tinh chỉnh trước khi khởi tạo thì bạn có thể truyền một `delegate` hoặc `lambda function` để khởi tạo.
```csharp
Lazy<MyClass> lazyObject = new Lazy<MyClass>(() => new MyClass("Hello"));

MyClass instance = lazyObject.Value;
```
### Khởi tạo thông qua LazyThreadSafetyMode - Lazy<T>(Func<T>, LazyThreadSafetyMode)

Qua hai cách khởi tạo trên, ta có thể thấy cách khởi tạo là như nhau, chỉ khác ở chỗ một hàm khởi tạo dùng `constructor` mặc định không tham số, một hàm khởi tạo có thể tuỳ chỉnh theo ý muốn. Như vậy, với các cách khởi tạo tiếp theo, tôi sẽ sử dụng khởi tạo có sử dụng `delegate` để minh hoạ.

Khi sử dụng `LazyThreadSafetyMode` để khởi tạo, chúng ta có thể kiểm soát được mức độ thread-safe.

[LazyThreadSafetyMode](https://learn.microsoft.com/en-us/dotnet/api/system.threading.lazythreadsafetymode?view=net-8.0#system-threading-lazythreadsafetymode-executionandpublication) có 3 giá trị:

*   **None**: tắt chế độ thread-safe. Tức là nếu có nhiều luồng can thiệp vào quá trình khởi tạo thì có thể xảy ra tranh chấp và khó để xác định đối tượng. Chế độ này sẽ hữu ích nếu như bạn muốn tăng performance nhưng không cần quan tâm đến chế độ thread-safe và class của bạn đã có chế độ thread-safe sẵn.
*   **PublicationOnly**: cho phép nhiều luồng cùng tham gia khởi tạo `instance`, nhưng chỉ có duy nhất một `instance` hoàn thành việc khởi tạo sớm nhất được sử dụng. Nếu có lỗi xảy ra trên một luồng, thì các luồng khác sẽ tiếp tục chạy để thử tạo lại. Cách này sẽ hữu ích nếu như bài toán yêu cầu tăng tốc độ mà không quan tâm đến chi phí khởi tạo dư thừa.
*   **ExecutionAndPublication**: đây là chế độ mặc định. Nó sẽ đảm bảo chỉ một luồng duy nhất được phép khởi tạo đối tượng. Đây là lựa chọn an toàn nhất. Tuy nhiên, bạn sẽ không có được performace tăng như 2 chế độ trên.
```c#
Lazy<MyClass> lazyObject = new Lazy<MyClass>(() => new MyClass(), LazyThreadSafetyModExecutionAndPublication);

MyClass instance = lazyObject.Value;
```
### Khởi tạo thông qua isThreadSafe - Lazy<T>(Func<T>, Boolean)  

Đây là một cách đơn giản để định nghĩa `Lazy<T>` có bật chế độ thread-safe hay không. Nếu `isThreadSafe`:

*   **true**: nó sẽ tương tự như `LazyThreadSafetyMode.ExecutionAndPublication`
*   **false**: nó sẽ tương tự như `LazyThreadSafetyMode.None`
```c#
Lazy<MyClass> lazyObject = new Lazy<MyClass>(() => new MyClass(), true);

MyClass instance = lazyObject.Value;
```
Những điểm cần lưu ý
--------------------

`Lazy<T>` chỉ đảm bảo việc khởi tạo đối tượng `T` được an toàn trong môi trường multithread. Nhưng không có nghĩa các phương thức trong `T` sẽ thread-safe sau khi khởi tạo hoàn tất. Bạn cần tự quản lý phần này trong code bằng cách sử dụng `lock`.

Kết luận
--------

`Lazy<T>` là một class trong .Net giúp chúng ta có thể quản lý dễ dàng việc khởi tạo một đối tượng trong môi trường multithread. Nó sẽ giúp chúng ta tăng performance, tiết kiệm thời gian khởi tạo và giúp code của chúng ta trông gọn gàng hơn.

Tham khảo:  
[Lazy<T> Class - Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/api/system.lazy-1?view=net-8.0)  
[Lazy<T> Constructors - Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/api/system.lazy-1.-ctor?view=net-8.0)  
[LazyThreadSafetyMode Enum - Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/api/system.threading.lazythreadsafetymode?view=net-8.0)
