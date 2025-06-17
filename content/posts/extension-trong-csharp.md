---
author: "Le Van Dong"
title: "Extension trong C#?"
date: "2024-09-24 02:19:32"
tags: ["Dotnet", "CSharp"]
categories: ["Programming"]
ShowToc: false
TocOpen: false
---

Trong bài viết này, chúng ta sẽ cùng tìm hiểu về phương thức Extension trong C#. Đây là một phương thức rất hiệu quả trong việc thể hiện code một cách gọn gàng và dễ đọc hơn. Do đó, bạn có thể mở rộng class một cách thoải mái mà không cần lo ngại về việc thay đổi logic hay ảnh hưởng tới các class cũ.

## Phương thức Extension là gì?

Phương thức này bắt đầu được thêm vào từ C# 3.0 và nó đã trở thành công cụ đắc lực giúp lập trình viên có được những đoạn code ngắn gọn và hiệu quả hơn. Trước đó, để mở rộng một class, developer phải kế thừa từ class cũ.

Hay nói cách khác, phương thức Extension là cách bạn có thể "Thêm" vào trong một class hoặc một kiểu dữ liệu nào đó mà bạn không cần phải tạo class mới.

## Cách sử dụng Extension method

Extension method là một phương thức static (tĩnh) để có thể được gọi mà không cần phải khởi tạo một đối tượng. Tham số đầu tiên đại diện cho chính variable mà gọi phương thức đó thông qua từ khóa `this`. Tham số đầu vào này là bắt buộc và các tham số sau bạn có thể tùy ý truyền vào.

Đầu tiên, ta tạo một Extension để in ra màn hình cụm `Xin chào: {name}` với class mà có thể gọi Extension này là `string`.

```csharp
public static class  StringExtension {
    public static void PrintToConsole(this string text) {
        Console.WriteLine("Xin chào: {0}", text);
    }

    public static void EatWith(this string text, string name) {
        Console.WriteLine("Xin chào: {0}, bạn đang ăn với {1}", text, name);
    }
}
```

Tiếp theo, ta có thể gọi hàm `PrintToConsole` ở bất kỳ biến `string` nào.

```csharp
using System;

public static class  StringExtension {
    public static void PrintToConsole(this string text) {
        Console.WriteLine("Xin chào: {0}", text);
    }

    public static void EatWith(this string text, string name) {
        Console.WriteLine("Xin chào: {0}, bạn đang ăn với {1}", text, name);
    }
}

class HelloWorld {
  static void Main() {
    var myName = "CSharp Tourist";
    myName.PrintToConsole();
    myName.EatWith("Đông");
  }
}
```

Kết quả sẽ cho kết quả là

```csharp
Xin chào: CSharp Tourist
Xin chào: CSharp Tourist, bạn đang ăn với Đông
```

Bạn đọc có thể thấy rằng bạn có thể gọi phương thức `PrintToConsole` mà không cần phải kế thừa lại class String hay là sửa đổi class String trực tiếp. Với lệnh `this string text` thì bạn có thể sử dụng Extension ở mọi `string`. Nếu bạn muốn sử dụng nó với mọi kiểu dữ liệu khác. Hãy cân nhắc sử dụng Generic.

[OnlineGDB](https://www.onlinegdb.com/taDlUATn21)

## Những điểm cần lưu ý khi sử dụng Extension method

> 1. Mọi phương thức extension phải là static.
> 2. Các phương thức extension phải nằm trong một class static.
> 3. Tham số đầu tiên trong extension method là biến mà nó gọi và cần phải có từ khoá `this`.
> 4. Bạn có thể định nghĩa thêm tham số kể từ tham số thứ hai trở đi.
> 5. Nếu extension method cùng tên và tham số với class của bạn thì extension sẽ không được thực thi, mà method trong class đó sẽ được thực thi. Tức là bạn không thể thực hiện việc ghi đè phương thức thông qua extension được.
> 6. Không nên sử dụng extension method trong chính library mà bạn code. Vì nó sẽ không đồng bộ version giữa code trong thư viện và code sử dụng thư viện.

## Ứng dụng trong thực tế

Với cách sử dụng như thế này. Bạn có thể viết nhiều hàm thường xuyên sử dụng như tính tuổi hay rút gọn code trùng lắp trong [builder.Services] ở Program.cs

### Cách tính tuổi

```csharp
public static class DateTimeExtensions
{
    public static int CalculateAge(this DateTime birthDate)
    {
        DateTime today = DateTime.Today;
        int age = today.Year - birthDate.Year;

        // Nếu ngày sinh chưa đến trong năm hiện tại, trừ 1 tuổi
        if (birthDate.Date > today.AddYears(-age)) age--;

        return age;
    }
}
```

[OnlineGDB](https://onlinegdb.com/lDKjVKW2Z)

### Rút gọn code

Nếu bạn làm hệ thống Microservices, bạn cần tích hợp các Services với nhau tại APIGateway thì sẽ có nhiều code trùng lắp trong file Program.cs.

```csharp
public static class GrpcServiceExtension
    {
        public static IServiceCollection ConfigureGrpcServices<TClient, TImplementation, TGrpcClient>(this IServiceCollection services, IConfiguration configuration, string configKey)
            where TClient: class
            where TImplementation : class, TClient
            where TGrpcClient : class
        {
            services.AddSingleton<TClient, TImplementation>();
            services.AddGrpcClient<TGrpcClient>(options =>
            {
                options.Address = new Uri( configuration[configKey] ?? "https://localhost:7100");
            });

            return services;
        }
    }
```

Khi sử dụng, bạn đơn giản chỉ cần sử dụng extension ConfigureGrpcServices như sau

```csharp
builder.Services.ConfigureGrpcServices<IAuthService, AuthService, GrpcAuthService.GrpcAuthServiceClient>(builder.Configuration, "AuthService");
```

## Kết luận

Khi đã sử dụng thành thạo thì bạn sẽ code ngắn hơn và trông gọn hơn rất nhiều.Mặc dù việc sửa code của class hay kế thừa class vẫn có vẻ dễ dàng hơn với đa số người dùng. Nhưng extension sẽ giúp bạn có thể mở rộng các class ngoài tầm kiểm soát của bạn như các thư viện của .Net,... Đây là con dao hai lưỡi, nó sẽ giúp cho code của bạn ngắn gọn hơn, nhưng việc bạn thay đổi các class ngoài tầm kiểm soát của bạn thì sẽ có khả năng xảy ra lỗi vì có thể phá vỡ logic bên trong class đó.

Tham khảo:  
[Extension Methods (C# Programming Guide) - Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/extension-methods)  
[Extension Methods in C# - Dot Net Tutorials](https://dotnettutorials.net/lesson/extension-methods-csharp/)