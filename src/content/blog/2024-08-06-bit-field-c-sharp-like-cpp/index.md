---
title: 'Lưu trữ dữ liệu tốn ít tài nguyên hơn dựa vào bit trong CSharp'
slug: 'bit-field-c-sharp-like-cpp'
description: 'Bên C#, chúng ta định nghĩa thì struct `Status` gồm 3 biến kiểu `uint` cho nên sẽ trả ra kết quả là 12 bytes khi runtime. Nhưng về mặt lưu trữ thì ta sẽ nén thành kiểu dữ liệu long nên sẽ tiết kiệm về mặt bộ nhớ hơn so với runtime.'
pubDate: 'Aug 06 2024'
tags: ["Memory", "Tips"]
# coverImage: ''
---

Việc [sử dụng bit trong C/C++](https://www.levandong.com/bit-fields-trong-c-cpp) có lẽ các bạn đã quá quen thuộc rồi. Trong C/C++ có 1 phần khá hay là bit fields, bạn có thể tạo được nhiều biến chỉ với 1 byte, đương nhiên là trong khuôn khổ số bit đó thể hiện. Nay mình lên thêm một bài dành cho C#. Nói 1 cách chính xác thì nó không giống như bit fields trong C/C++. Nó không tối ưu size của biến trong quá trình runtime, nó dùng để tối ưu khi sử dụng để lưu trữ dữ liệu. Do đó, bài viết này không mô tả khái niệm bit fields mà là thủ thuật sử dụng bit để tối ưu dữ liệu để lưu trữ. Chúng ta sẽ đi xuyên suốt bài viết này và cùng so sánh điểm khác biệt giữa C/C++ và C#.

## Lý thuyết

Thủ thuật rất đơn giản. Chúng ta sẽ tạo 1 struct để lưu trữ dữ liệu, biến trong struct bạn tự định nghĩa, ở bài viết này mình sẽ dùng kiểu `uint`. Ta sẽ chuyển đổi kiểu dữ liệu `struct` thành `long` để lưu dữ liệu. Cũng như phải có cách để chuyển từ `long` sang `struct` nếu cần.

## Thực hành

Khi đã có ý tưởng thì ta bắt tay vào nghiên cứu và thực hành. Đầu tiên, chúng ta cần có 1 cách nào đó để đánh dấu số bit cần sử dụng, như trong C/C++ thì mặc định sử dụng dấu `:` để đánh dấu. C# thì không có nên chúng ta sẽ dùng `Attribute` để đánh dấu số bit cần sử dụng.

Mình tạo một Attribute chứa thông tin về độ dài bit cần biểu diễn.

```c#
public class BitFieldsAttribute : Attribute
{
  uint length;
  public BitFieldsAttribute(uint length) 
  {
    this.length = length;
  }

  public uint Length
  {
    get { return length; }
  }
}
```
Bây giờ chúng ta có thể tạo 1 struct nào đó để thử nghiệm.

```c#
struct Status
{
  [BitFields(1)]
  public uint IsOn;

  [BitFields(3)]
  public uint IsRunning;

  [BitFields(4)]
  public uint IsFinish;
};
```

Ở struct trên, biến `IsOn` được đánh dấu là chỉ dùng 1 bit của kiểu dữ liệu uint, `IsRunning` sử dụng 3 bit của uint và `IsFinish` sử dụng 4 bit.

Hiện tại, chúng ta đã tìm ra cách đánh dấu để biết một biết đó chỉ sử dụng bao nhiêu bit. Bây giờ còn một bước cuối là làm sao để chuyển từ struct `Status` thành biến có kiểu dữ liệu `long`.

Để làm được việc đó, chúng ta tạo 1 class là Convertion chuyên dùng để chuyển từ `Status` sang `long` và ngược lại.

```c#
public static class Convertion{
    public static long ToLong<T>(T t) where T : struct
    {
      long r = 0; // kết quả
      int offset = 0; // vị trí đang xét

      // f là field trong struct. Ví dụ như `IsOn` trong struct `Status`

      // Với mỗi field chúng ta chỉ lấy đúng số fieldLength bit mà thôi.
      foreach (System.Reflection.FieldInfo f in t.GetType().GetFields())
      {
        object[] attrs = f.GetCustomAttributes(typeof(BitFieldsAttribute), false);
        if (attrs.Length == 1)
        {
          // Lấy ra số lượng bit mà đã cài đặt
          uint fieldLength = ((BitFieldsAttribute)attrs[0]).Length; 

          // Tạo ra bitmask để biểu diễn độ dài của số bit đã cài đặt - tức là fieldLength;
          long mask = 0;
          for (int i = 0; i < fieldLength; i++)
            mask |= (uint)(1 << i);

          // Gán đúng số fieldLength bit đó vào đúng vị trí của nó
          r |= ((UInt32)f.GetValue(t)! & mask) << offset;

          // Tăng vị trí cần gán lên. Giả sử đá gán 1 bit cho `IsOn` rồi thì tăng lên 1 để gán tiếp cho bit tiếp theo
          offset += (int)fieldLength;
        }
      }

      //Trả về kết quả kiểu dữ liệu `long` thể hiện cho `struct`
      return r;
    }
```

Bạn đã có cách để convert từ struct sang long rồi tiếp theo ta làm quá trình ngược lại để từ `long` sang `struct`.

```c#
public static class Convertion{
  public static T FromLong<T>(long l) where T : struct
    {
      T t = new T(); // kết quả
      Object boxed = t; // Convert struct thành Object
      int offset = 0; // vị trí đang xét

      // f là field trong struct. Ví dụ như `IsOn` trong struct `Status`

      // Với mỗi field chúng ta chỉ lấy đúng số fieldLength bit mà thôi.
      foreach (System.Reflection.FieldInfo f in t.GetType().GetFields())
      {
        object[] attrs = f.GetCustomAttributes(typeof(BitFieldsAttribute), false);
        if (attrs.Length == 1)
        {
          // Lấy ra số lượng bit mà đã cài đặt
          uint fieldLength = ((BitFieldsAttribute)attrs[0]).Length;

          // Tạo ra bitmask để biểu diễn độ dài của số bit đã cài đặt - tức là fieldLength;
          long mask = 0;
          for (int i = 0; i < fieldLength; i++)
            mask |= (uint)(1 << i);

          // Gán đúng số fieldLength bit đó vào đúng biến trong struct
          var value = Convert.ChangeType((l >> offset) & mask, f.FieldType);

          var fieldAttribute = typeof(T).GetField(f.Name, BindingFlags.Instance | BindingFlags.Public);

          fieldAttribute!.SetValue(boxed, value);

          t = (T)boxed;

          // Tăng vị trí cần gán lên. Giả sử đá gán 1 bit cho `IsOn` rồi thì tăng lên 1 để gán tiếp cho bit tiếp theo
          offset += (int)fieldLength;
        }
      }
      // Trà về kết quả.
      return t;
    }
}
```

Sau đó chúng ta có thể viết trong hàm main để test như sau

```c#
    Status s = new();
    s.IsOn = 1;
    s.IsRunning = 5;
    s.IsFinish = 7;

    int size = System.Runtime.InteropServices.Marshal.SizeOf(typeof(Status));
    Console.WriteLine("Bytes:" + size);

    long l = BitFieldsAttribute.Convertion.ToLong(s);
    Console.WriteLine("Convert to long:" + l);

    Status s2 = BitFieldsAttribute.Convertion.FromLong<Status>(l);
    Console.WriteLine("Convert from long:" + string.Format("IsOn:{0}, IsRunning:{1}, IsFinish:{2}", s2.IsOn, s2.IsRunning, s2.IsFinish));
```

Kết quả sẽ trả về

```bash
Bytes:12
Convert to long:123
Convert from long:IsOn:1, IsRunning:5, IsFinish:7
```

Tổng hợp code sẽ như thế này

{{< link href="https://www.onlinegdb.com/yL-1H1woP" content=OnlineGDB title="Truy cập code mẫu!" >}}

## Thảo luận

Bạn có thấy điều kỳ lạ không? Bit fields bên C/C++ khi in size ra thì sẽ là 1 byte thể hiện. Nhưng ở đây tới tận 12 bytes?

Vì bên C/C++ nó thực sự là Bit fields, khi bạn định nghĩa nó chỉ chiếm đúng từng đó bit trong struct thôi. Còn bên C#, chúng ta định nghĩa thì struct `Status` gồm 3 biến kiểu `uint` cho nên sẽ trả ra kết quả là 12 bytes khi runtime. Nhưng về mặt lưu trữ thì ta sẽ nén thành kiểu dữ liệu long nên sẽ tiết kiệm về mặt bộ nhớ hơn so với runtime.

Ngoài ra, nếu bạn có cách nào khác thì có thể nói mình tìm hiểu thêm về cách này sao cho tối ưu nhất nhé. Cảm ơn các bạn.

## Tham khảo
[Stackoverflow](https://stackoverflow.com/a/14591)