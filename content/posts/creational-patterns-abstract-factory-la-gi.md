---
author: "Le Van Dong"
title: "Abstract Factory là gì"
date: "2024-11-08 02:19:32"
tags: ["CSharp", "Creational Pattern"]
categories: ["Programming"]
ShowToc: false
TocOpen: false
---

Khi áp dụng một design pattern tốt sẽ giúp bạn tiết kiệm thời gian và công sức sau này. Bạn có thể tái sử dụng code, mở rộng khi cần thiết. Bạn có từng nhớ lần đọc code cuối cùng không? Bạn có thấy code của bạn dễ dàng chỉnh sửa mở rộng không? Nếu không, cùng tôi tìm hiểu về design pattern và cách áp dụng nó vào trong dự án của bạn.

Design Pattern được chia ra làm 3 loại chính, bao gồm:

1.  **[Creational Patterns](/tags/creational-pattern/)**: giúp bạn có thể tạo ra object để sử dụng trong ứng dụng. Mục tiêu là giúp code trở nên ít phụ thuộc, không phụ thuộc vào từ khoá new quá nhiều.
2.  **[Structural Patterns](/tags/structural-pattern/)**: giúp bạn tổ chức các class và struct sao cho dễ dàng mở rộng mà không ảnh hưởng đến hệ thống. Mục tiêu là đơn giản hoá các mối liên hệ giữa các class, giúp tạo hệ thống linh hoạt và dễ quản lý hơn.
3.  **[Behavioral Patterns](/tags/behavioral-pattern/)**: giúp bạn quản lý hành vi của class hay struct. Tối ưu hoá mối liên hệ giữa các class bằng cách đưa ra các quy tắc giao tiếp giữa các class.

Trong chủ đề bài viết hôm nay chúng ta sẽ tìm hiểu về **Abstract Factory** thuộc nhóm [Creational Patterns](/tags/creational-pattern/). Chúng ta sẽ đi qua các ý chính sau

Vấn đề
------

Giả sử bạn đang phát triển ứng dụng quản lý phương tiện giao thông gồm xe hơi, xe tải và xe máy với các đặc điểm sau:

*   Xe hơi: 4 chỗ ngồi, bánh xe lớn, xăng.
*   Xe tải: 2 chỗ ngồi, bánh xe lớn, dầu.
*   Xe máy: 2 chỗ ngồi, bánh xe nhỏ, xăng.

![](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhzpZ3gK5d8INlppROhp9P1w83bHUOkmsW-R1DuP3SegcLsUnPWuFQa3XXNp7kyu1Nv8buWLs0xT5IgwT-XZXdhVzD8WrIxJBRIrsnWh6kLE4KQ8BsujBSYzXacePF8AC3Qg3FjXF9mTeFmQKFRncmGS5iosHtWoGCEsv_fUJ3BfI0CvaTkfs3Ws5Ectak/s1366/description.png)

Vấn đề bây giờ của bạn sẽ là làm thế nào để xây dựng một hệ thống quản lý sao cho khi tạo ra một phương tiện thì sẽ tự động tạo ra số lượng chỗ ngồi, bánh xe, nhiên liệu tương ứng?

Abstract Factory là gì
----------------------

> Abstract Factory is a creational design pattern that lets you produce families of related objects without specifying their concrete classes.

Abstract Factory là một design pattern với mục tiêu cung cấp một interface để tạo ra các đối tượng liên quan mà không cần chỉ rõ lớp cụ thể. Tức là: Bạn sẽ giao tiếp thông qua interface để khởi tạo các đối tượng liên quan. Chúng ta cùng lấy ví dụ ở trên, giả sử bạn tạo interface là `VehicleFactory` thì nó có các phương thức để tạo ra các đối tượng liên quan cho một loại xe cụ thể (chỗ ngồi, bánh xe, nhiên liệu). Khi bạn chọn `CarFactory` thì nó tạo ra 4 chỗ ngồi, bánh xe lớn, xăng, tương tự cho `TruckFactory`, `BikeFactory`.

Cấu trúc của Abstract Factory
-----------------------------

Đầu tiên, chúng ta tạo ra interface của các đối tượng liên quan như chỗ ngồi, bánh xe và nhiên liệu. Và sau đó triển khai các đối tượng đó.  

![](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj6ZmiNMa4lkK_8ecq3iea3o1BWeQOCF98soQ2ZJLV70KmDlHMfiBG1AcLvqn9s2_IVwaUzjRHtH5-rvjyL67PFOC8ODQCxBhZWaVc4hSvsRDB7nigEiIUTjoMdItyJLur6j4datsFXxC_fA-1y1D0lI-hHtkC-s2dH_bdsFRcSMhaAP0vIZ3Rr_-q4hfg/s2048/doi-tuong-lien-quan.png)

Sau đó, ta sẽ tạo factory với từng loại xe và interface Abstract Factory. 

Ở đây, với mục đích tăng sự dễ hiểu, tránh rối khi vẽ nhiều class cho nên tôi vẽ `CarFactory` dùng với kiểu dữ liệu là interface `Seat` nhưng khi khởi tạo nó sẽ khởi tạo `CarSeat`, tương tự cho những lớp khác.  

![](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh4nHix2arvLhBMM-T6KGQbQrFpayXGrJy3GHVzIq1PdS7D3LKD_pUVO4hwjkpF7WCZ2Ft-EjS_Rqk2WLG4LcMqPNkXpaa4d1Fg9JW4YU4W4RV-AHPxjdDHwBoJlU2jU6mG3bTba0Hgxs_nQ4hamZSAYr7OKhYejQ5TcvK8jCROcoaHzZVVMwA0gww4KDs/s668/tao-factory.png)

Để có một cái nhìn tổng quan hơn, chúng ta hãy tham khảo cấu trúc chung như sau:

![](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgycX9cfUwBlxVQvFxqBNp9fCG4b1AWx9pq80m_O5RHWropeCQAKVDhkk1KFHQuUPKETLSoMudEDVRABqJpO1ML5yptIzj408ipNVQtMCBFXxUNnTcoMwG97RZyFWjqxH_naMvI1cJhM1EI-zHczk3bvqNuu_WqnDyntsW1VHC60tv5K_dzbAsUynTD3MY/s951/cau-truc-chung.png)

Cách triển khai Abstract Factory
--------------------------------

### Khởi tạo interface cho Product
```c#
    public interface ISeat
    {
        string GetDescription();
    }
    
    public interface IWheel
    {
        string GetDescription();
    }
    
    public interface IEngine
    {
        string GetDescription();
    }
```
### Triển khai các interface product
```c#
    public class CarSeat : ISeat
    {
        public string GetDescription() => "Car seat with 4 seats.";
    }
    
    public class TruckSeat : ISeat
    {
        public string GetDescription() => "Truck seat with 2 seats.";
    }
    
    public class BikeSeat : ISeat
    {
        public string GetDescription() => "Bike seat with 2 seats.";
    }
    
    public class CarWheel : IWheel
    {
        public string GetDescription() => "Car wheel with large size.";
    }
    
    public class TruckWheel : IWheel
    {
        public string GetDescription() => "Truck wheel with large size.";
    }
    
    public class BikeWheel : IWheel
    {
        public string GetDescription() => "Bike wheel with small size.";
    }
    
    public class CarEngine : IEngine
    {
        public string GetDescription() => "Car engine using gasoline.";
    }
    
    public class TruckEngine : IEngine
    {
        public string GetDescription() => "Truck engine using diesel.";
    }
    
    public class BikeEngine : IEngine
    {
        public string GetDescription() => "Bike engine using gasoline.";
    }
```
### Tạo Abstract Factory
```c#
    public interface IVehicleFactory
    {
        ISeat CreateSeat();
        IWheel CreateWheel();
        IEngine CreateEngine();
    }
```
### Viết các factory cho interface Abstract Factory cụ thể
```c#
    public class CarFactory : IVehicleFactory
    {
        public ISeat CreateSeat() => new CarSeat();
        public IWheel CreateWheel() => new CarWheel();
        public IEngine CreateEngine() => new CarEngine();
    }
    
    public class TruckFactory : IVehicleFactory
    {
        public ISeat CreateSeat() => new TruckSeat();
        public IWheel CreateWheel() => new TruckWheel();
        public IEngine CreateEngine() => new TruckEngine();
    }
    
    public class BikeFactory : IVehicleFactory
    {
        public ISeat CreateSeat() => new BikeSeat();
        public IWheel CreateWheel() => new BikeWheel();
        public IEngine CreateEngine() => new BikeEngine();
    }
```
### Sử dụng
```c#
    IVehicleFactory carFactory = new CarFactory();
    IVehicleFactory truckFactory = new TruckFactory();
    IVehicleFactory bikeFactory = new BikeFactory();
    
    // Tạo các sản phẩm cho xe hơi
    Console.WriteLine("Car Factory:");
    Console.WriteLine(carFactory.CreateSeat().GetDescription());
    Console.WriteLine(carFactory.CreateWheel().GetDescription());
    Console.WriteLine(carFactory.CreateEngine().GetDescription());
    
    Console.WriteLine();
    
    // Tạo các sản phẩm cho xe tải
    Console.WriteLine("Truck Factory:");
    Console.WriteLine(truckFactory.CreateSeat().GetDescription());
    Console.WriteLine(truckFactory.CreateWheel().GetDescription());
    Console.WriteLine(truckFactory.CreateEngine().GetDescription());
    
    Console.WriteLine();
    
    // Tạo các sản phẩm cho xe máy
    Console.WriteLine("Bike Factory:");
    Console.WriteLine(bikeFactory.CreateSeat().GetDescription());
    Console.WriteLine(bikeFactory.CreateWheel().GetDescription());
    Console.WriteLine(bikeFactory.CreateEngine().GetDescription());
```
### Kết quả
```txt
    Car Factory:
    Car seat with 4 seats.
    Car wheel with large size.
    Car engine using gasoline.
    
    Truck Factory:
    Truck seat with 2 seats.
    Truck wheel with large size.
    Truck engine using diesel.
    
    Bike Factory:
    Bike seat with 2 seats.
    Bike wheel with small size.
    Bike engine using gasoline.
```
[OnlineGDB](https://www.onlinegdb.com/VQX7DQD3_)

Ưu và nhược điểm
----------------

### Ưu điểm

1.  Làm việc qua interface giúp code trở nên lỏng lẽo và dễ dàng mở rộng hay bảo trì hơn. 
2.  Dễ dàng thêm một Factory mới.

### Nhược điểm

1.  Khó khăn trong việc thay đổi hay sửa chữa Product.
2.  Tăng độ phức tạp của code và số lượng class và interface.

So sánh với Factory Method
--------------------------

Chúng ta có thể thấy, Abstract Factory là phiên bản mở rộng của [Factory Method](/creational-patterns-factory-method-la-gi/). Chúng khá tương đồng với nhau, và sự khác nhau rõ ràng nhất là [Factory Method](/creational-patterns-factory-method-la-gi/) chỉ tạo một đối tượng còn Abstract Factory tạo ra một nhóm các đối tượng liên quan.

Nếu các bạn muốn so sánh kỹ hơn, tôi có cung cấp code triển khai của [Factory Method ở bài trước](/creational-patterns-factory-method-la-gi/) với thêm một đối tượng là chất liệu.

[OnlineGDB](https://www.onlinegdb.com/td8MROdk3)

Kết luận
--------

Đây một design pattern được dùng khá thường xuyên trong việc lập trình. Nó sẽ giúp các bạn khởi tạo đối tượng dễ dàng hơn cũng như việc sửa đổi trong tương lai cũng nhẹ nhàng hơn. Tuy nhiên, nó cũng tăng độ phức tạp của code lên.  

Tham khảo:  
[Abstract Factory - Refactoring Guru](https://refactoring.guru/design-patterns/abstract-factory)  
[Bài 2. Sử dụng Abstract Factory trong Design Pattern - Youtube](https://www.youtube.com/watch?v=TaaZk1OKwNs)