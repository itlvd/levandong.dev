---
author: "Le Van Dong"
title: "Tối ưu hiệu suất .NET Core In-Process và Out-of-Process"
date: "2024-11-10"
tags: ["CSharp", "Tips"]
categories: ["Programming"]
ShowToc: false
TocOpen: false
---

Trong quá trình phát triển phần mềm, việc tối ưu hiệu suất luôn là vấn đề được quan tâm khi triển khai, đặc biệt trong .Net Core. Việc bạn lựa chọn các hosting model nào để chạy sẽ ảnh hưởng quan trọng đến hiệu suất của ứng dụng. Trong .Net có 2 phương pháp để hosting là In Process và Out Of Process.

Với từng model sẽ có những ưu và nhược điểm riêng để phù hợp cho nhiều trường hợp khác nhau. Nhưng trước hết, ta hãy thử nghiên cứu về các khái niệm liên quan đến hosting model nhé.

Vậy thì hosting là gì?
----------------------

Hosting là một môi trường cung cấp tài nguyên để triển khai web của bạn ra ngoài internet. Tuy nhiên, để có thể tạo môi trường triển khai thì cần có phần mềm máy chủ (web server) và máy chủ vật lý để triển khai.

Trong .Net Core sẽ có hai khái niệm để triển khai ứng dụng web.  

In Process Hosting Model
------------------------

### Khái niệm

Cho phép ứng dụng ASP. NET Core chạy trực tiếp trong trong tiến trình (worker process) của IIS (Internet Information Services). Giúp bỏ đi thời gian truyền message từ proxy đến application. Để dễ dàng hình dung hơn, bạn có thể đọc ví dụ dưới đây.  

Hãy tưởng tượng bạn vào một quán cà phê nhỏ, nơi mà nhân viên pha chế (ứng dụng) và khách hàng (người dùng) giao tiếp trực tiếp với nhau. Khi bạn gọi món, nhân viên sẽ nghe và phục vụ ngay lập tức mà không cần phải chuyển thông tin qua một bên thứ ba nào khác.

### Điều kiện

In Process sẽ chỉ có thể chạy trên IIS, do đó để chạy mô hình hosting này thì bạn phải chạy trên Windows. Khi ứng dụng chạy trên IIS hoặc IIS Express thì bạn có thể chọn chế độ In Process hoặc Out of Process.  

### Luồng hoạt động  

Trong .Net Core sẽ hoạt động theo sơ đồ sau.

![](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiBoyskIdFZliKLZEchUjrT-iVxdJWSiLsMreHNr0_6aiVXSjlu5w60mnmBnMWZ1zN6eGZNNAd8ykffxXYL9yXqsXiSILbTnxLwuS6P332zSyyj3sFZPvEhZh3vzKCsC-oU_87ehchWDI41LrbJvH4Qm8Ka1czbYSrONbI8j3YSLtJNuA2vg3cPVB2ok5Y/s1511/In%20Process%20Flow.png)

In Process Workflow

**Bước 1**: Client sẽ gửi request tới IIS.

**Bước 2**: Khi request đầu tiên tới IIS thì IIS sẽ kiểm tra xem Application của bạn đã chạy chưa. Nếu:  
\- Ứng dụng của bạn chưa chạy thì IIS sẽ chuyển request tới ASP.NET Core Module (ANCM).  
\- Ứng dụng của bạn đã chạy thì request của bạn sẽ truyền thẳng tới IIS HTTP Server.

**Bước 3**: ANCM sẽ đảm nhận trách nhiệm load và start ứng dụng của bạn trong IIS worker process (w3wp.exe) nếu ứng dụng chưa chạy. Lưu ý: ANCM chỉ chạy trong lần query đầu tiên của client. Vì khi ứng dụng đã chạy, thì các lần sau đó sẽ không cần qua ANCM để khởi tạo nữa mà đến thẳng IIS HTTP Server.

**Bước 4**: Khi request đến IIS HTTP Server thì nó sẽ decode và xử lý các thông tin HTTP như phương thức (Get, Post, Put, Patch,...), URL, Header,... Và sau đó, chuyển tiếp request đến ứng dụng của chúng ta.

**Bước 5**: Khi đến đây thì ứng dụng của bạn mới xử lý request. Sau đó trả về response cho IIS HTTP Server.

**Bước 6**: IIS HTTP Server nhận response sẽ trả về cho IIS, bỏ qua ANCM.

**Bước 7**: IIS trả response về cho client.

### Cách bật In Process

Các bạn chỉ cần thêm dòng này vào Project properties.
```xml
<AspNetCoreHostingModel>InProcess</AspNetCoreHostingModel>
```
### Ưu điểm

**Hiệu suất cao**: Vì không cần phải qua network hop. Xử lý request trong cùng process sẽ nhanh chóng và giảm độ trễ.

**Tiết kiệm tài nguyên**: Vì chung một process cho nên không cần phải tốn thêm tài nguyên cho external web server như Out of Process.

**Triển khai đơn giản**: Gộp chung cho nên việc triển khai cũng đơn giản hơn.  

### Nhược điểm

**Chỉ chạy trên Windows**: Vì IIS chỉ hỗ trợ Windows cho nên bạn chỉ có thể áp dụng In Process Model khi sử dụng Windows mà thôi. Nếu bạn muốn chạy trên Linux hay Mac thì chỉ có một lựa chọn duy nhất là Out of Process.

**Không tối ưu khi sử dụng Reverse Proxy**: Liệu có cần thiết khi mà chính nó đã đóng vai trò là một Reverse Proxy?  

**Out of Process Hosting Model**
--------------------------------

### Khái niệm 

Ngược lại với In Process Hosting Model, Out of Process sẽ tách biệt giữa 2 tiến trình. Tiến trình chính sẽ là Kestrel trong application. Và lúc này IIS chỉ đóng vai trò là proxy giữa người dùng và application.

Bây giờ hãy tưởng tượng bạn đến một quán cà phê lớn hơn, nơi có một người tiếp tân (web server) đứng ở cửa. Khi bạn gọi món, người tiếp tân sẽ ghi lại đơn hàng và gửi nó đến một nhân viên pha chế ở một khu vực khác của quán (ứng dụng). Nhân viên pha chế sẽ làm món và người tiếp tân sẽ mang món đến cho bạn.

### Điều kiện

Bạn có thể thiết lập Out of Process ở trên Windows, Linux, Mac hay là IIS, Kestrel.

### Luồng hoạt động

Trước khi tìm hiểu luồng hoạt động của Out of Process. Mình muốn tóm tắt sơ lược về Kestrel để bạn dễ hình dung hơn.

Kestrel là một web server có thể hoạt động đa nền tảng, nhẹ và nhanh hơn IIS, có thể sử dụng trong môi trường Production hay Developerment. Tuy nhiên, vì Kestrel đã lược bỏ một số tính năng nên nó nhẹ. Do đó, thường người ta sẽ sử dụng thêm Reverse Proxy để thêm lớp bảo mật hay là xác thực ở đó.

Khi chúng ta nhắc đến Out of Process trong ASP.NET Core thì ta nên nghĩ về Kestrel. Còn Reverse Proxy, có hay không thì tuỳ vào project của bạn có cần hay không.

![](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjRySnbnDfzh7rWtArVGAGurnISRcxngQvMY77ZfYNzxKXZRUtujfZQAd8G3JHVLOnO5QvnLX-kjgX8nNdY8-VMqHEXQV3cx1vcKaq_IhvOAH8hIdH_7XKDm8HjyVWTv28EXB7LsOWHBdWNzIp2eRlOEQ-otHl43Qb-AOS89p5au29obL83aRTQfHHKtfM/s1574/Out%20of%20Process%20Flow.png)

Out of Process Workflow  

**Bước 1**: Client gửi request tới IIS. Lúc này IIS đóng vai trò là một Reverse proxy server. Ngoài IIS, thì chúng ta cũng có thể sử dụng Apache hoặc Nginx. Hay còn gọi là External web server.

**Bước 2**: IIS sẽ gửi tới ANCM để đảm bảo rằng Kestrel web server đã chạy. Nếu chưa chạy thì khởi động Kestrel. Khi Kestrel sẵn sàng thì chuyển tiếp request tới Kestrel.

**Bước 3**: Khi Kestrel nhận request từ ANCM thì sẽ xử lý các thông tin HTTP và chuyển tiếp đến Application.

**Bước 4**: Ở Application, xử lý business logic và trả về kết quả cho Kestrel.

**Bước 5**: Kestrel trả về cho ANCM.

**Bước 6**: ANCM trả về cho IIS.

**Bước 7**: Và cuối cùng IIS sẽ trả về client.

Lưu ý, không nhất thiết phải có Reverse proxy. Cũng như, nên sử dụng IIS vì trong IIS có ANCM sẽ giúp tích hợp với Application một cách mượt mà và tận dụng tối đa tính năng của IIS và ASP.NET Core.

### Cách bật Out of Process

Các bạn chỉ cần thêm dòng này vào Project properties:
```xml
<AspNetCoreHostingModel>OutOfProcess</AspNetCoreHostingModel>
```
### Ưu điểm

**Hỗ trợ đa nền tảng**: Có thể chạy trên Windows, Linux, Mac.

**Process Isolation tốt**: Vì ứng dụng chạy process khác với extenal web server nên khi ứng dụng chết thì web server vẫn hoạt động để sử dụng cho các ứng dụng khác.

**Flexibility cao**: Có thể chạy nhiều phiên bản Net Core khác nhau, dễ dàng update hơn.

### Nhược điểm

**Performance Overhead**: Latency cao hơn so với In-Process. Tiêu tốn nhiều tài nguyên hơn. Có network hop giữa IIS và Kestrel

**Phức tạp**: Cấu hình reverse proxy. Xử lý security. Monitoring phức tạp hơn.

Cách chọn model phù hợp
-----------------------

### Chọn In Process khi

1.  Cần hiệu suất cao nhất có thể.
2.  Ứng dụng đơn giản, ít risk.
3.  Resource giới hạn.
4.  Không cần process isolation.

### Chọn Out of Process khi

1.  Cần độ ổn định và isolation cao.
2.  Microservices architecture.
3.  Frequent updates và deployments.
4.  Scale-out requirements.

Kết luận
--------

Việc lựa chọn giữa In-Process và Out-of-Process hosting model phụ thuộc vào nhiều yếu tố:  

*   Requirements của dự án.
*   Resource constraints.
*   Security requirements.
*   Scalability needs.

Không có một giải pháp "one-size-fits-all". Mỗi dự án cần được đánh giá kỹ lưỡng để chọn mô hình phù hợp nhất.  

Tham khảo:  
[ASP.NET Core InProcess Hosting - DotNetTutorials](https://dotnettutorials.net/lesson/asp-net-core-inprocess-hosting/)  
[ASP.NET Core Out Of Process Hosting - DotNetTutorials](https://dotnettutorials.net/lesson/asp-net-core-outofprocess-hosting/)  
[In-process hosting with IIS and ASP.NET Core - Microsoft Learn](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/iis/in-process-hosting?view=aspnetcore-8.0)  
[Out-of-process hosting with IIS and ASP.NET Core - Microsoft Learn](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/iis/out-of-process-hosting?view=aspnetcore-8.0)