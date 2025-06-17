---
author: "Le Van Dong"
title: "Adapter Pattern là gì?"
date: "2024-11-11"
tags: ["CSharp", "Structural Pattern"]
categories: ["Programming"]
ShowToc: false
TocOpen: false
---

Khi áp dụng một design pattern tốt sẽ giúp bạn tiết kiệm thời gian và công sức sau này. Bạn có thể tái sử dụng code, mở rộng khi cần thiết. Bạn có từng nhớ lần đọc code cuối cùng không? Bạn có thấy code của bạn dễ dàng chỉnh sửa mở rộng không? Nếu không, cùng tôi tìm hiểu về design pattern và cách áp dụng nó vào trong dự án của bạn.

Design Pattern được chia ra làm 3 loại chính, bao gồm:

1.  **[Creational Patterns](/tags/creational-pattern/)**: giúp bạn có thể tạo ra object để sử dụng trong ứng dụng. Mục tiêu là giúp code trở nên ít phụ thuộc, không phụ thuộc vào từ khoá new quá nhiều.
2.  **[Structural Patterns](/tags/structural-pattern/)**: giúp bạn tổ chức các class và struct sao cho dễ dàng mở rộng mà không ảnh hưởng đến hệ thống. Mục tiêu là đơn giản hoá các mối liên hệ giữa các class, giúp tạo hệ thống linh hoạt và dễ quản lý hơn.
3.  **[Behavioral Patterns](/tags/behavioral-pattern/)**: giúp bạn quản lý hành vi của class hay struct. Tối ưu hoá mối liên hệ giữa các class bằng cách đưa ra các quy tắc giao tiếp giữa các class.

Trong chủ đề bài viết hôm nay chúng ta sẽ tìm hiểu về **Adapter** thuộc nhóm Structural Patterns. Chúng ta sẽ đi qua các ý chính sau:

Vấn đề
------

Giả sử bạn mới mua máy ảnh Nikon và bạn biết đấy máy ảnh thì phải kèm theo lens mới có thể chụp được. Nikon thì có rất nhiều ngàm khác nhau, nói một cách nôm na ngàm là cái khớp để nối lens với máy ảnh với nhau, giả sử máy ảnh của bạn mua sử dụng ngàm Z. Tuy nhiên, trớ trêu thay là bạn vừa được tặng cho lens ngàm F. Hmmm, không lẽ như thế thì chúng ta không thể gắn lens F vào máy ảnh ngàm Z được hay sao, vì nó không cùng ngàm với nhau mà. Đừng lo, Nikon đã có giải pháp cho bạn, họ cung cấp một Adapter để chuyển ngàm F thành ngàm Z. Do đó, bạn có thể sử dụng máy ảnh ngàm Z với lens ngàm F một cách thoải mái.

Trong lập trình cũng thế, giả sử bạn có data ở máy chủ và mặc định khi bạn lấy data trả về cho client là ở định dạng JSON. Vậy client giờ muốn lấy ở định dạng XML thì phải làm sao? Bạn phải convert từ JSON sang XML. Vậy lúc này sẽ có 1 cái Adapter ở giữa để làm công việc đó, đúng chứ?

Adapter là gì?
--------------

Với cách đặt vấn đề bên trên, chắc hẳn chúng ta cũng đã có thể hình dung Adapter là gì rồi đúng không. Adapter là pattern giúp kết nối các object không tương thích nhau có thể connect với nhau được.

Cấu trúc của Adapter Pattern  

-------------------------------

Chúng ta hãy thử xem qua sơ đồ cấu trúc của Adapter Pattenr như thế nào.  

![](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh06j7CXBbOm6qmFoWhPPQxt_vTpoq4oat6qTVPGQneJvIk6aSlVjUKbqnjhS0IDeyRXRUpBz61V49PZk2MrV4poVLCznKkBzj_baCqG54phq-wbG4hfJhDGd214Cu3kgvBlIjU_nVvaiYYK2Wfj8LldIHTf7Te9nuU0v0QBy5QwsAzRHfp-rh0azEDNzw/s466/cau-truc-adapter-pattern.png)

  
Trong đó:

*   **Client**: là class chứa business logic. Ví dụ như máy ảnh ngàm Z.
*   **Target**: là interface để cho các thằng khác thiết kế sao cho để tương thích với Client sử dụng. Ví dụ như bản thiết kế ngàm Z để cho Nikon thiết kế ngàm Z (native) và Adapter từ Z sang F dùng để chuyển cho ngàm F.
*   **Adapter**: là class kế thừa từ thiết kế của Target. Ví dụ từ thiết kế ngàm Z thì người ta mới biết ngàm Z thế nào để tạo ra Adapter.
*   **Adaptee**: là class không tương thích mà mình cần phải làm cho nó tương thích. Ví dụ là lens ngàm F.  
    

Do đó, chúng ta có thể tổng hợp lại sơ đồ mới như sau:

![](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjVXciUJ5BPcIDklJB46GDh8CPDBpldhcAhMgE8E6smKsJeUWhqnUOAKZTsuZXwEVwW3a_0Tz6PbchQ8qmFJXttfXBFyrrJoivq6gHtgNvMPXqnnEzBXD_0oKHiIHMBRKB1qPHPEv-MbByLeiHLNP3uXLbpieLCgoa65unOGNTP0ycxODeAzTuMAmxwWjU/s651/nikonztof-adapter-pattern.png)

Cách triển khai Adapter Pattern  

----------------------------------

Cách triển khai như chúng ta lắp lens vào máy ảnh vậy. Đầu tiên, chúng ta cần có máy ảnh và lens trước, đúng chứ?

### Triển khai máy ảnh (Client)  
```csharp
// Client (Nikon Z-Mount Camera)
public class NikonZMountCamera
{
    private readonly INikonZMount _lens;

    public NikonZMountCamera(INikonZMount lens)
    {
        _lens = lens;
    }

    public void Mount()
    {
        Console.WriteLine("Mounting lens to Nikon Z-Mount camera.");
        _lens.AttachLens();
    }

    public void Shoot()
    {
        Console.WriteLine("Nikon Z-Mount camera is taking a picture.");
        _lens.TakePicture();
    }
}
```
### Triển khai lens Z (native)

Khi đã có máy ảnh lens Z thì chúng ta cũng cần phải có lens Z tương ứng.
```c#
// Native Z-Mount Lens
public class NikonZMountLens : INikonZMount
{
    public void AttachLens()
    {
        Console.WriteLine("Z-Mount lens is attached directly.");
    }

    public void TakePicture()
    {
        Console.WriteLine("Picture taken with Z-Mount lens.");
    }
}
```
### Triển khai lens F

Giờ có một người bạn tặng ta một cái lens F.
```c#
// Adaptee (Existing lens with F-mount)
public class NikonFMountLens
{
    public void Connect()
    {
        Console.WriteLine("F-Mount lens is connected.");
    }

    public void Capture()
    {
        Console.WriteLine("Picture taken with F-Mount lens.");
    }
}
```
### Tạo Interface cho tất cả lens ngàm Z

Hiện tại đã xong xuôi. Giờ đến bước giải quyết vấn đề là làm sao để gắn lens F vào máy ảnh lens Z đây. Vậy ta nên tạo một Interface để mọi lens Z đều tương thích với máy ảnh. Và đương nhiên là điều này bạn nên xác định ở bước đầu tiên thay vì đến bước cuối nhận ra vấn đề và tạo thì có thể trong project lớn sẽ làm phức tạp hóa lên rất nhiều.
```c#
// Target Interface
public interface INikonZMount
{
    void AttachLens();
    void TakePicture();
}
```
### Tạo Adapter  

Cuối cùng, ta tạo Adapter chuyển từ lens F sang lens Z.
```c#
public class FMountToZMountAdapter : INikonZMount
{
    private readonly NikonFMountLens _fMountLens;

    public FMountToZMountAdapter(NikonFMountLens fMountLens)
    {
        _fMountLens = fMountLens;
    }

    public void AttachLens()
    {
        Console.WriteLine("Adapter: Connecting F-Mount lens to Z-Mount camera.");
        _fMountLens.Connect();
    }

    public void TakePicture()
    {
        Console.WriteLine("Adapter: Taking picture using F-Mount lens on Z-Mount camera.");
        _fMountLens.Capture();
    }
}
```
### Sử dụng

Cách đơn giản nhất để sử dụng là bạn biến mọi lens thành lens ngàm Z sau đó gắn vào máy ảnh sẽ dễ dàng hơn đúng không.

Vậy ta gắn lens F vào ngàm chuyển trước. Sau đó thì ta mới nên gắn vào máy ảnh.
```c#
public class AdapterPatternDemo
{
    public static void Main(string[] args)
    {
        // Using a native Z-Mount lens
        Console.WriteLine("Using native Z-Mount lens:");
        NikonZMountCamera zMountCamera = new NikonZMountCamera(new NikonZMountLens());
        zMountCamera.Mount();
        zMountCamera.Shoot();

        Console.WriteLine("\n--------------------\n");

        // Using an F-Mount lens with adapter
        Console.WriteLine("Using F-Mount lens with adapter:");
        NikonFMountLens fMountLens = new NikonFMountLens();
        INikonZMount adapter = new FMountToZMountAdapter(fMountLens);
        NikonZMountCamera adaptedCamera = new NikonZMountCamera(adapter);
        adaptedCamera.Mount();
        adaptedCamera.Shoot();
    }
}
```
[OnlineGDB](https://onlinegdb.com/l5JIadcxG)

### Kết quả
<div id="terminal-container" style="background-color: black; color: lime; font-family: &quot;Courier New&quot;, monospace; line-height: 1.6; margin-bottom: 20px; padding: 20px;">
  <button id="run-button" style="background-color: lime; border: medium; color: black; cursor: pointer; font-size: 16px; margin-bottom: 10px; padding: 10px 20px;">Run</button>
  <div id="terminal" style="overflow-wrap: break-word; white-space: pre-wrap; word-wrap: break-word;"></div>
  <div id="input-container" style="display: none;">
    <span id="cursor" style="animation: 0.7s infinite blink; background-color: lime; display: inline-block; height: 20px; width: 10px;"></span>
    <input autofocus="" data-ddg-inputtype="unknown" id="input" style="background-color: transparent; border: medium; color: lime; font-family: &quot;Courier New&quot;, monospace; font-size: inherit; outline: none; width: 100%;" type="text" />
  </div>
</div>

<style>
  @keyframes blink {
    0% { opacity: 0; }
    50% { opacity: 1; }
    100% { opacity: 0; }
  }
</style>
<script>
  const terminal = document.getElementById('terminal');
  const input = document.getElementById('input');
  const inputContainer = document.getElementById('input-container');
  const runButton = document.getElementById('run-button');
  const text = `Using native Z-Mount lens:
Mounting lens to Nikon Z-Mount camera.
Z-Mount lens is attached directly.
Nikon Z-Mount camera is taking a picture.
Picture taken with Z-Mount lens.

--------------------

Using F-Mount lens with adapter:
Mounting lens to Nikon Z-Mount camera.
Adapter: Connecting F-Mount lens to Z-Mount camera.
F-Mount lens is connected.
Nikon Z-Mount camera is taking a picture.
Adapter: Taking picture using F-Mount lens on Z-Mount camera.
Picture taken with F-Mount lens.


...Program finished with exit code 0
Press ENTER to exit console.`;

  function typeText(text, index = 0) {
    if (index < text.length) {
      terminal.textContent += text[index];
      setTimeout(() => typeText(text, index + 1), 10);
    } else {
      inputContainer.style.display = 'block';
    }
  }

  runButton.addEventListener('click', function() {
    runButton.style.display = 'none';
    terminal.textContent = '';
    typeText(text);
  });

  input.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      alert('Console exited');
      runButton.style.display = 'block';
      terminal.textContent = '';
      inputContainer.style.display = 'none';
    }
  });
</script>

Ưu và nhược điểm
----------------

### Ưu điểm

*   Tính linh hoạt cao, dễ dàng tích hợp các đối tượng ban đầu không tương thích trở nên tương thích. Dễ dàng thêm Adapter mớ.
*   Tuân thủ nguyên tắc Open/Closed trong SOLID. Cho phép mở rộng mà không cần phải sửa đổi code hiện đang có. 
*   Tách biệt Client code với Interface. Client cứ sử dụng mà không cần quan tâm phía interface implement thế nào.

### Nhược điểm 

*   Tăng độ phức tạp: tạo ra nhiều interface và class nếu có nhiều Adapter.
*   Hiệu suất: phụ thuộc vào cách code. Nếu trong Adapter code quá phức tạp thì sẽ làm giảm hiệu suất khi chuyển đổi.
*   Không đảm bảo mô phỏng 100% hành vi của interface.

Kết luận
--------

Bạn có thể thấy đây là một desgin pattern mạnh mẽ giúp bạn kết nối các đối tượng không tương thích với nhau. Và đương nhiên, nó hay hơn là bạn chỉ viết hàm convert vì khi các bạn viết hàm thì sẽ làm tăng độ phức tạp code thông qua việc code convert của bạn bị phân tán ở nhiều hàm, chức năng khác nhau. Nó sẽ khiến cho việc sau này bạn debug hay thay đổi business sẽ trở nên khó khăn hơn.