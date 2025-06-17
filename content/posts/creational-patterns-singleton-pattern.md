---
author: "Le Van Dong"
title: "Singleton Pattern là gì?"
date: "2024-09-27 02:19:32"
tags: ["Creational Pattern", "CSharp"]
categories: ["Programming"]
ShowToc: false
TocOpen: false
---

Khi áp dụng một design pattern tốt sẽ giúp bạn tiết kiệm thời gian và công sức sau này. Bạn có thể tái sử dụng code, mở rộng khi cần thiết. Bạn có từng nhớ lần đọc code cuối cùng không? Bạn có thấy code của bạn dễ dàng chỉnh sửa mở rộng không? Nếu không, cùng tôi tìm hiểu về design pattern và cách áp dụng nó vào trong dự án của bạn.

Design Pattern được chia ra làm 3 loại chính, bao gồm:

1.  **[Creational Patterns](/tags/creational-pattern/)**: giúp bạn có thể tạo ra object để sử dụng trong ứng dụng. Mục tiêu là giúp code trở nên ít phụ thuộc, không phụ thuộc vào từ khoá new quá nhiều.
2.  **[Structural Patterns](/tags/structural-pattern/)**: giúp bạn tổ chức các class và struct sao cho dễ dàng mở rộng mà không ảnh hưởng đến hệ thống. Mục tiêu là đơn giản hoá các mối liên hệ giữa các class, giúp tạo hệ thống linh hoạt và dễ quản lý hơn.
3.  **[Behavioral Patterns](/tags/behavioral-pattern/)**: giúp bạn quản lý hành vi của class hay struct. Tối ưu hoá mối liên hệ giữa các class bằng cách đưa ra các quy tắc giao tiếp giữa các class.

Trong chủ đề bài viết hôm nay chúng ta sẽ tìm hiểu về **Singleton Pattern** thuộc nhóm [Creational Patterns](/tags/creational-pattern). Chúng ta sẽ đi qua các ý chính sau

## Vấn đề

Giả sử bạn đang làm việc tại một nhà hàng ăn uống. Bạn thuê 2 bạn nhân viên khác nhau để phục vụ khách. Các bạn nhân viên sẽ có nhiệm vụ là phục vụ khách hàng và tính hoá đơn. Tuấn là một người sành ăn, hôm nay Tuấn ghé đến nhà hàng gọi bạn phục vụ A với 3 món tổng cộng hết 300k. Nhưng đến lúc thanh toán, Tuấn lại gọi bạn B để thực hiện thanh toán, bạn B thì nghĩ rằng Tuấn chưa ăn gì cả và trả bill là 0 đồng. Một thời gian sau, nhà hàng đó đóng cửa vì lỗ quá nhiều.

Bạn có thấy vấn đề ở đây là gì không? Vấn đề là Tuấn không gọi đúng bạn mà Tuấn đã order mà Tuấn gọi bạn khác để thực hiện thanh toán. Vậy có cách nào để khi Tuấn gọi một bạn phục vụ bất kỳ mà vẫn có thể ra hoá đơn chính xác không? Hmm, tôi nghĩ là nên có 1 hệ thống quản lý chung như là thu ngân, dù cho Tuấn gọi bạn phục vụ nào thì cũng có thể ra bill cho Tuấn.

Trong code cũng vậy, nếu bạn tạo một đối tượng là Hoá đơn. Bạn A đã tạo đối tượng Hoá đơn với bill là 300k, nhưng bạn B cũng tạo một đối tượng Hoá đơn khác nhưng lúc này là 0 đồng. Vậy giờ chúng ta mới nghĩ đến là gom đối tượng Hoá đơn đó chung thành một người quản lý là thu ngân. Vậy thì giờ đây dù là A gọi hay B gọi thì đều cho một hoá đơn giống nhau là 300k.

## Singleton Pattern là gì?

Bạn chỉ cần nắm rõ 2 ý chính:

- Bạn chỉ muốn tạo một đối tượng duy nhất trong chương trình. Dù class A thay đổi giá trị thì class B vẫn lấy ra đúng giá trị mà A đã thay đổi.
- Đối tượng không được tạo thông qua từ khoá `new` mà sẽ được tạo thông qua lần gọi đầu tiên.

## Cấu trúc của Singleton Pattern

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1732413313699/2880f7bf-d7c1-447f-81c0-8c330aec5258.png)

- Tạo một biến private `instance`, lưu trữ instance duy nhất của lớp.
- Vì bạn không cho phép người dùng tạo đối tượng khác, nên `constructor` cũng phải là private.
- Hàm `get Instance` để lấy instance ra và sử dụng.

## Cách triển khai Singleton Pattern

### Eager initialization

Đây là cách dễ cài đặt nhất. Tuy nhiên, instance sẽ được khởi tạo dù cho có dùng hay không.

```csharp
public class Singleton
{
    private static readonly Singleton _instance = new Singleton()
    private Singleton()
    
    
    public static Singleton Instance
    {
        get
        {
            return _instance;
        }
    }
}
```

### Lazy initialization

Khởi tạo đối tượng ngay từ lần đầu tiên gọi, nhưng khi gặp đa luồng thì sẽ xảy ra trường hợp khởi tạo cả 2 instance cùng lúc.

```csharp
public class Singleton
{
    private static Singleton _instance
    private Singleton() {
    public static Singleton Instance
    {
        get
        {
            if (_instance == null)
            {
                _instance = new Singleton();
            }
            return _instance;
        }
    }
}
```

### Thread-safe initialization với lock

Đảm bảo Thread-safety sử dụng `lock` để đồng bộ quá trình khởi tạo tránh việc nhiều luồng cùng tạo một lúc. Nhưng performance có thể giảm vì nếu gọi hàm `get Instance` quá nhiều thì hàm `lock` sẽ thực thi nhiều lần.

```csharp
public class Singleton
{
    private static Singleton _instance;
    private static readonly object _lock = new object()
    private Singleton() {
    public static Singleton Instance
    {
        get
        {
            lock (_lock)
            {
                if (_instance == null)
                {
                    _instance = new Singleton();
                }
            }
            return _instance;
        }
    }
}
```

### Double-check Locking

Trước khi gọi hàm lock, ta nên check xem `instance` hiện tại có `null` hay chưa trước khi tạo. Bằng cách này sẽ giúp chúng ta tránh gọi hàm `lock` thường xuyên.

```csharp
public class Singleton
{
    private static Singleton _instance;
    private static readonly object _lock = new object()
    private Singleton() {
    public static Singleton Instance
    {
        get
        {
            if (_instance == null)
            {
                lock (_lock)
                {
                    if (_instance == null)
                    {
                        _instance = new Singleton();
                    }
                }
            }
            return _instance;
        }
    }
}
```

### Lazy<T> implementation

Sử dụng [class `Lazy<T>`](/lazy-initialization) được cung cấp sẵn trong thư viện dotNet. Lưu ý chỉ sử dụng từ phiên bản .Net Framework 4 và .Net Core. Bằng cách này thì chúng ta không cần dùng đến hàm `lock`.

```csharp
public class Singleton
{
    private static readonly Lazy<Singleton> _instance = new Lazy<Singleton>(() => new Singleton())
    private Singleton() {
    public static Singleton Instance
    {
        get
        {
            return _instance.Value;
        }
    }
}
```

## Ưu và nhược điểm khi sử dụng Singleton Pattern

### Ưu điểm

**Kiểm soát số lượng instance**: Singleton đảm bảo tại mọi thời điểm khi gọi class thì chỉ có một thể hiện của class được gọi. Do đó, rất hữu ích nếu bạn cần quản lý tài nguyên chung ở global.

**Tiết kiệm tài nguyên**: Vì chỉ có một thể hiện tại mọi thời điểm cho nên Singleton sẽ tiết kiệm tài nguyên hơn class thông thường.

**Truy cập toàn cục**: Vì chỉ có một đối tượng được khởi tạo. Cho nên bạn có thể truy cập bất kỳ đâu, mọi thay đổi sẽ lập tức áp dụng ở mọi chỗ mà bạn sử dụng.

### Nhược điểm

**Vi phạm nguyên tắc Single Responsibility**: Singleton vừa quản lý việc tạo ra instance, vừa cung cấp logic nghiệp vụ của nó, điều này có thể vi phạm nguyên tắc Single Responsibility trong SOLID.

**Khó Testing**: Do tính chất đặc biệt của nó mà bạn phải lưu ý trong quá trình viết unit testing.

**Khởi tạo chậm**: Ở lần gọi đầu tiên, bạn phải đợi cho nó khởi tạo.

**Có khả năng gây lỗi toàn cục**: vì nếu bạn thay đổi trạng thái của thuộc tính trong Singleton thì khả năng code của bạn sẽ thay đổi tất cả chỗ khác.

## Các trường hợp áp dụng Singleton Pattern

- Bạn nên sử dụng Singleton Pattern khi cần tạo đối tượng để quản lý tài nguyên chung cho cả chương trình. Ví dụ như logging, config,..
- Khi quản lý tài nguyên có hạn nên không muốn lãng phí tài nguyên.

## Các trường hợp không nên sử dụng Singleton Pattern

- Khi đối tượng bạn cần tính linh hoạt và mở rộng.
- Khi bạn muốn viết unit testing dễ hơn.

## Kết luận

Singleton là một design pattern thường xuyên sử dụng trong thực tế. Tuy nhiên, khi sử dụng thì chúng ta cần phải cân nhắc những vấn đề có thể gặp phải như vấn đề xử lý đa luồng hay truy cập global, testing,...

Tham khảo:  
[Học Singleton Pattern trong 5 phút. - VIBLO](https://viblo.asia/p/hoc-singleton-pattern-trong-5-phut-4P856goOKY3)  
[Thread-Safe Singleton Design Pattern in C# - Dot Net Tutorials](https://dotnettutorials.net/lesson/thread-safe-singleton-design-pattern/)