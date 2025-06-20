---
author: "Le Van Dong"
title: "Factory Method là gì"
date: "2024-11-08"
tags: ["CSharp", "Creational Pattern"]
categories: ["Programming"]
---

Khi áp dụng một design pattern tốt sẽ giúp bạn tiết kiệm thời gian và công sức sau này. Bạn có thể tái sử dụng code, mở rộng khi cần thiết. Bạn có từng nhớ lần đọc code cuối cùng không? Bạn có thấy code của bạn dễ dàng chỉnh sửa mở rộng không? Nếu không, cùng tôi tìm hiểu về design pattern và cách áp dụng nó vào trong dự án của bạn.

Design Pattern được chia ra làm 3 loại chính, bao gồm:

1.  **[Creational Patterns](/tags/creational-pattern/)**: giúp bạn có thể tạo ra object để sử dụng trong ứng dụng. Mục tiêu là giúp code trở nên ít phụ thuộc, không phụ thuộc vào từ khoá new quá nhiều.
2.  **[Structural Patterns](/tags/structural-pattern/)**: giúp bạn tổ chức các class và struct sao cho dễ dàng mở rộng mà không ảnh hưởng đến hệ thống. Mục tiêu là đơn giản hoá các mối liên hệ giữa các class, giúp tạo hệ thống linh hoạt và dễ quản lý hơn.
3.  **[Behavioral Patterns](/tags/behavioral-pattern/)**: giúp bạn quản lý hành vi của class hay struct. Tối ưu hoá mối liên hệ giữa các class bằng cách đưa ra các quy tắc giao tiếp giữa các class.

Trong chủ đề bài viết hôm nay chúng ta sẽ tìm hiểu về **Factory Method** thuộc nhóm [Creational Patterns](/tags/creational-pattern/). Chúng ta sẽ đi qua các ý chính sau

Vấn đề
------

Giả sử bạn là chủ của một công ty sản xuất sơn. Mới đầu, bạn chỉ tập trung thị trường châu Á, mà châu Á chuộng sơn màu trắng, màu vàng. Nên, dây chuyền sản xuất của bạn bây giờ để tạo sơn màu trắng và màu vàng. Mọi thứ đều diễn ra tốt đẹp. Sau đó, công ty của bạn muốn đánh vào thị trường châu Âu nhưng bạn không thể dùng dây chuyền sản xuất màu trắng và vàng được, bạn phải tạo dây chuyền mới là màu xám và cam. Nhìn chung, công nghệ sản xuất vẫn vậy, chỉ khác là màu mà thôi.

Sau đó, vì sơn của bạn rất tốt nên bạn muốn đánh vào thị trường châu Mỹ, châu Phi,... Bạn bắt đầu thấy đau đầu vì phải quản lý quá nhiều dây chuyền. Bạn tự hỏi:

Liệu có hệ thống nào có thể giúp tôi tối ưu việc phải tạo ra dây chuyền không? Nhỡ, thị trường châu Á không còn chuộng nữa thì tôi có đang lãng phí không?  

Câu trà lời là có: Bạn nên gom tất cả dây chuyền lại thành một dây chuyền trong nhà máy duy nhất. Vì tất cả công nghệ đều giống nhau, chỉ khác mỗi thị trường thôi mà. Khi đó, bạn muốn sản xuất cho thị trường nào thì bạn bảo với nhà máy của bạn là sản xuất cho thị trường ấy.

Factory Method là gì?
---------------------

> Define an interface for creating an object, but let subclasses decide which class to instantiate. Factory Method lets a class defer instantiation to subclasses. 

Factory Method là một Design Pattern cho phép bạn định nghĩa một interface cho việc khởi tạo. Nhưng để khởi tạo thì class con mới đảm nhận việc khởi tạo.

Cấu trúc của Factory Pattern
----------------------------

Đầu tiên, chúng ta sẽ tạo `ColorFactory` trước, đây là `interface` quản lý việc khởi tạo. Tuy nhiên, việc khởi tạo sẽ phụ thuộc vào class `AsianColorFactory` và `EuropeColorFactory`. Các lớp như `AsianColorFactory` sẽ có nhiệm vụ khởi tạo `WhiteColor`, `YellowColor` tương ứng theo yêu cầu của công ty của bạn.

Cách triển khai Factory Method
------------------------------

Đầu tiên, chúng ta sẽ tạo interface `Color` và các implement của nó
```c#
public interface Color
{
    string GetNameColor();
}

public class WhiteColor : Color
{
    public string GetNameColor() => "White";
}

public class YellowColor : Color
{
    public string GetNameColor() => "Yellow";
}

public class GreyColor : Color
{
    public string GetNameColor() => "Grey";
}

public class OrangeColor : Color
{
    public string GetNameColor() => "Orange";
}
```
Tiếp sau đó, chúng ta sẽ tạo interface `ColorFactory` để sản xuất màu và các implement của nó đề tạo các màu theo yêu cầu của business. Giả sử như yêu cầu của công ty là random màu.  
```c#
public interface ColorFactory
{
    Color GetColor();
}

public class AsianColorFactory : ColorFactory
{
    public Color GetColor()
    {
        if (new Random().Next(0, 2) == 0)
        {
            return new WhiteColor();
        }
        else
        {
            return new YellowColor();
        }
    }
}

public class EuropeColorFactory : ColorFactory
{
    public Color GetColor()
    {
        if (new Random().Next(0, 2) == 0)
        {
            return new GreyColor();
        }
        else
        {
            return new OrangeColor();
        }
    }
}
```
Cuối cùng, ta có thể sử dụng chúng như sau. 
```c#
public class PaintProduction
{
    private static void ProducePaint(ColorFactory factory)
    {
        Color color = factory.GetColor();
        Console.WriteLine($"Producing paint of color: {color.GetNameColor()}");
    }

    public static void Main(string[] args)
    {
        // Sản xuất sơn cho thị trường châu Á
        ColorFactory asianFactory = new AsianColorFactory();
        ProducePaint(asianFactory);

        // Sản xuất sơn cho thị trường châu Âu
        ColorFactory europeFactory = new EuropeColorFactory();
        ProducePaint(europeFactory);
    }
}
```
Kết quả trả về:
```txt
Producing paint of color: White
Producing paint of color: Orange
```
[OnlineGDB](https://www.onlinegdb.com/T_99WIUI1)

Ưu và nhược điểm
----------------

### Ưu điểm

*   Giúp cho code trở nên lỏng lẽo nên sẽ dễ dàng mở rộng hơn và dễ tái sử dụng hơn.
*   Dễ dàng quản lý thêm, sửa, xoá sản phẩm hơn, như trong ví dụ là Color.
*   Dễ tạo đối tượng theo ngữ cảnh hơn. Ví dụ dễ quản lý việc tạo màu ở châu Á hay châu Âu.

### Nhược điểm

*   Tăng độ phức tạp của code.như tăng số lượng lớp, tốn nhiều chi phí để thiết kế interface hay class ban đầu.

Các trường hợp nên sử dụng
--------------------------

*   Khi bạn muốn tuân thủ đúng nguyên tắc SOLID.
*   Khi bạn có logic business để tạo ra các class cùng dạng với nhau.
*   Khi việc tạo đối tượng mới có thể thay đổi theo thời gian. Tức là bạn có khả năng thêm, xoá Color trong tương lai.

Các trường hợp không nên sử dụng
--------------------------------

* Khi dự án nhỏ, độ phức tạp không lớn.

Kết luận
--------

Đây là một Design Pattern mà tôi hay sử dụng trong các dự án của mình vì nó sẽ giúp tôi có thể thêm xoá sửa các đối tượng nhanh chóng mà không cần phải lo ngại quá nhiều về việc thêm sửa đó có thể có lỗi trong tương lai.

Tham khảo:  
[Factory Method - University of Minnesota Duluth](https://www.d.umn.edu/~gshute/cs5741/patterns/factory-method.xhtml)  
[Factory Method - Refactoring Guru](https://dotnettutorials.net/lesson/thread-safe-singleton-design-pattern/)  
[Factory Method Pattern Giải Quyết Bài Toán Nào? - CodeLearn](https://codelearn.io/sharing/factory-method-pattern-trong-java/)
