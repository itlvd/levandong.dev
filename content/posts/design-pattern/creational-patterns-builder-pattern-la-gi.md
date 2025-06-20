---
author: "Le Van Dong"
title: "Builder Pattern là gì"
date: "2024-11-09"
tags: ["CSharp", "Creational Pattern"]
categories: ["Programming"]
---

Khi áp dụng một design pattern tốt sẽ giúp bạn tiết kiệm thời gian và công sức sau này. Bạn có thể tái sử dụng code, mở rộng khi cần thiết. Bạn có từng nhớ lần đọc code cuối cùng không? Bạn có thấy code của bạn dễ dàng chỉnh sửa mở rộng không? Nếu không, cùng tôi tìm hiểu về design pattern và cách áp dụng nó vào trong dự án của bạn.

Design Pattern được chia ra làm 3 loại chính, bao gồm:

1.  **[Creational Patterns](/tags/creational-pattern/)**: giúp bạn có thể tạo ra object để sử dụng trong ứng dụng. Mục tiêu là giúp code trở nên ít phụ thuộc, không phụ thuộc vào từ khoá new quá nhiều.
2.  **[Structural Patterns](/tags/structural-pattern/)**: giúp bạn tổ chức các class và struct sao cho dễ dàng mở rộng mà không ảnh hưởng đến hệ thống. Mục tiêu là đơn giản hoá các mối liên hệ giữa các class, giúp tạo hệ thống linh hoạt và dễ quản lý hơn.
3.  **[Behavioral Patterns](/tags/behavioral-pattern/)**: giúp bạn quản lý hành vi của class hay struct. Tối ưu hoá mối liên hệ giữa các class bằng cách đưa ra các quy tắc giao tiếp giữa các class.

Trong chủ đề bài viết hôm nay chúng ta sẽ tìm hiểu về **Builder** thuộc nhóm [Creational Patterns](/tags/creational-pattern/). Chúng ta sẽ đi qua các ý chính sau:

Vấn đề
------

Giả sử bạn đang phát triển phần mềm về quản lý nhà ở mà công ty xây dựng nên. Một ngôi nhà xây dựng có rất nhiều thành phần và cấu tạo, có những thành phần bắt buộc có cũng như có những thành phần có thể tuỳ chọn theo ý thích. Một ngôi nhà cơ bản thường có cổng, mái, tường,... và các khách hàng có nhiều ngân sách hơn sẽ chọn thêm ngôi nhà có garage, hồ bơi, có sân vườn,..

![](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiP_SKUgqlhxISsg1_qaJKI37EwvYogAI6oicLZQKAq_PVFvTiobLiuJh_OEp0yHmPTNTbv0JKFyLOVKpoE_ZTOTlwfTaJZ8gTwfVsIsWTgTy2m75KxJQ2A9vf1WmuJm_y64SAJJ4T4Xh0bddaDGQz6ssByVpqdpfcZGyHp1AxLEEa73fZG1NsUla0pWjs/s1920/House.png)

Khi đó, việc tạo đối tượng nhà sẽ có vẻ hơi phức tạp. Bạn có thể tạo thông qua việc kế thừa class House. Tuy nhiên, bạn sẽ tạo ra khá nhiều class con và việc quản lý nhiều class là việc tốn nhiều chi phí.

Builder Pattern là gì
---------------------

Builder Pattern cho phép bạn tạo ra đối tượng theo từng bước. Cho phép bạn tạo ra nhiều cách biểu diễn đối tượng khác nhau. Tức là thay vì khi khởi tạo đối tượng bằng constructor, bạn phải truyền tất cả các tham số mà không cần biết các các tham số đó liệu có cần thiết hay không. Thì giờ đây, khi áp dụng design pattern này, bạn có thể khởi tạo từng bộ phận của đối tượng thông qua method thay vì constructor như thông thường.

![](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgSuj2h1CY8MRj12NR0246axnDLEzOiKYUSvUK6fb_WUJuOxVyLKjBosRjrJzJtOo-k4QQbeZlSoINSUtseMXosNohhreZHeLG9oiEzdilHlq7hzw8BzV2C-Q9AmQGFNfw2ZiAlcClxHvw_x-Yc4huCot5c9x98GOOrB0Lq7052oupJH9KdCLdiMPQOat8/s1920/builder.png)

Director trong Builder Pattern
------------------------------

Khi chúng ta đã biết về ý tưởng Builder hoạt động, thì có một vấn đề xảy ra. Không lẽ với mỗi căn nhà được tạo ra, thì chúng ta sẽ phải thêm thủ công từng chi tiết của căn nhà rất tốn thời gian. Do đó, người ta tạo thêm một Director để giảm thiểu việc này. Director là phần không bắt buộc phải có, bạn có thể sử dụng hoặc không.  

Cấu trúc của Builder
--------------------

![](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgXMB_QfM7DYJjS0_8D1cyUty1A-eBRjD3seu6p0mYi3bZ6_7ZvoMJhM3VIoAWGuSWGJoz1KS38_ji_x4_JTHmS0o15JCd9H2kgJ27W-F0VEctBS-qGZg15OR_n9f6YMJdLWHBnurnVk5fNoeL5zmp8ZUEuxfr3DTwWNu3OxM4dIv5Qz30IJA2MeKGW-4M/s730/plantuml.png)

*   **House (Product)**: đại diện cho đối tượng phức tạp cần khởi tạo, ở đây cho ngôi nhà với các thuộc tính và phương thức cụ thể.
*   **HouseBuilder (Abstract Class)**: Có thể là abstract class hoặc interface. Vì các phương thức như xây cửa, xây mái nhà, xây tường là điều bắt buộc ngôi nhà nào cũng phải có cho nên các phương thức này là abstract. Các phương thức còn lại là tuỳ chọn.  
    
*   **BasicHouseBuilder (Concrete Class)**: implement các phương thức để xây được căn nhà cơ bản.
*   **LuxuryHouseBuilder (Concrete Class)**: implement các phương thức để xây được căn nhà luxury.
*   **Director (Director Class)**: Dùng để gọi tới builder tạo ngôi nhà hoàn chỉnh.

Cách triển khai Builder Pattern
-------------------------------

### Tạo Product

Đầu tiên chúng ta cần tạo product với các thuộc tính và phương thức cần có.
```c#
public class House
{
    public string Gate { get; set; }
    public string Roof { get; set; }
    public string Walls { get; set; }
    public string Garage { get; set; }
    public string Pool { get; set; }
    public string Garden { get; set; }

    public override string ToString()
    {
        StringBuilder sb = new StringBuilder();
        sb.AppendLine("House specifications:");
        sb.AppendLine($"Gate: {Gate}");
        sb.AppendLine($"Roof: {Roof}");
        sb.AppendLine($"Walls: {Walls}");
        if (!string.IsNullOrEmpty(Garage)) sb.AppendLine($"Garage: {Garage}");
        if (!string.IsNullOrEmpty(Pool)) sb.AppendLine($"Pool: {Pool}");
        if (!string.IsNullOrEmpty(Garden)) sb.AppendLine($"Garden: {Garden}");
        return sb.ToString();
    }
}
```
### Tạo Builder

Ở đây chúng ta tạo abstract class để custom việc ngôi nhà có thể có hồ bơi, vườn,... hoặc không
```c#
public abstract class HouseBuilder
{
    protected House house = new House();

    public House Build() => house;

    public abstract HouseBuilder BuildGate();
    public abstract HouseBuilder BuildRoof();
    public abstract HouseBuilder BuildWalls();

    public virtual HouseBuilder BuildGarage()
    {
        return this;
    }

    public virtual HouseBuilder BuildPool()
    {
        return this;
    }

    public virtual HouseBuilder BuildGarden()
    {
        return this;
    }
}
```
### Implement Builder

#### Basic House
```c#
public class BasicHouseBuilder : HouseBuilder
{
    public override HouseBuilder BuildGate()
    {
        house.Gate = "Basic Gate";
        return this;
    }

    public override HouseBuilder BuildRoof()
    {
        house.Roof = "Basic Roof";
        return this;
    }

    public override HouseBuilder BuildWalls()
    {
        house.Walls = "Basic Walls";
        return this;
    }
}
```
#### Luxury House
```c#
public class LuxuryHouseBuilder : HouseBuilder
{
    public override HouseBuilder BuildGate()
    {
        house.Gate = "Fancy Gate";
        return this;
    }

    public override HouseBuilder BuildRoof()
    {
        house.Roof = "Luxury Roof";
        return this;
    }

    public override HouseBuilder BuildWalls()
    {
        house.Walls = "Marble Walls";
        return this;
    }

    public override HouseBuilder BuildGarage()
    {
        house.Garage = "2-Car Garage";
        return this;
    }

    public override HouseBuilder BuildPool()
    {
        house.Pool = "Infinity Pool";
        return this;
    }

    public override HouseBuilder BuildGarden()
    {
        house.Garden = "Landscaped Garden";
        return this;
    }
}
```
### Tạo Director

Cuối cùng, tạo director để tạo được các loại nhà khác nhau
```c#
public class Director
{
    private HouseBuilder builder;

    public Director(HouseBuilder builder)
    {
        this.builder = builder;
    }

    public void ChangeBuilder(HouseBuilder builder)
    {
        this.builder = builder;
    }

    public House ConstructBasicHouse()
    {
        return builder.BuildGate()
                       .BuildRoof()
                       .BuildWalls()
                       .Build();
    }

    public House ConstructLuxuryHouse()
    {
        return builder.BuildGate()
                       .BuildRoof()
                       .BuildWalls()
                       .BuildGarage()
                       .BuildPool()
                       .BuildGarden()
                       .Build();
    }
}
```
### Sử dụng
```c#
public static void Main(string[] args)
{
    Director director = new Director(new BasicHouseBuilder());
    
    Console.WriteLine("Basic House:");
    House basicHouse = director.ConstructBasicHouse();
    Console.WriteLine(basicHouse)
    director.ChangeBuilder(new LuxuryHouseBuilder());
    
    Console.WriteLine("Luxury House:");
    House luxuryHouse = director.ConstructLuxuryHouse();
    Console.WriteLine(luxuryHouse);
}
```
### Kết quả
```txt
Basic House:
House specifications:
Gate: Basic Gate
Roof: Basic Roof
Walls: Basic Walls

Luxury House:
House specifications:
Gate: Fancy Gate
Roof: Luxury Roof
Walls: Marble Walls
Garage: 2-Car Garage
Pool: Infinity Pool
Garden: Landscaped Garden
```
[OnlineGDB](https://onlinegdb.com/hARmKlPK_)

Ưu và nhược điểm
----------------

### Ưu điểm

*   Việc khởi tạo các đối tượng phức tạp trở nên đơn giản hơn khi đối tượng có nhiều thuộc tính hoặc quá trình khởi tạo phức tạp.
*   Có thể sử dụng tái sử dụng code nhiều nơi.
*   Tuân thủ nguyên tắc SOLID.

### Nhược điểm

*   Việc tạo nhiều class và interface có thể khiến cho code trở nên phức tạp hơn.
*   Phải tạo nhiều ConcreteBuilder cho từng loại đối tượng khác nhau.
*   Việc áp dụng design pattern này vào các đối tượng đơn giản sẽ làm tăng chi phí và lãng phí.

Kết luận
--------

Đây là một design pattern mạnh mẽ, giúp ích trong quá trình khởi tạo đối tượng phức tạp trở nên đơn giản hơn. Tuy nhiên, với các đối tượng đơn giản thì điều này có thể gây ra sự lãng phí.  

Tham khảo:  
[Builder - Refactoring Guru](https://refactoring.guru/design-patterns/builder)  
[Design Pattern: Builder Pattern - Viblo](https://viblo.asia/p/design-pattern-builder-pattern-1Je5EdQmlnL)  
[Builder Design Pattern - Viblo](https://viblo.asia/p/builder-design-pattern-6J3ZgjwgKmB)
