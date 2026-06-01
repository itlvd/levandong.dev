---
author: "Le Van Dong"
title: "Save data less in database using theory of bit in C#"
date: "2024-08-06"
tags: ["CSharp", "Tips"]
categories: ["Programming"]
---

Using bit fields in C/C++ might be familiar to you. In C/C++, bit fields allow you to create multiple variables within a single byte, within the limits of the bit representation. Today, I’m sharing a similar technique for C#. It's important to note that this method doesn't exactly mirror C/C++ bit fields. Instead of optimizing variable size at runtime, it focuses on optimizing data storage. This post will guide you through this technique and compare it with C/C++.

## Theory

The technique is simple: we’ll create a `struct` to store data, with variables defined by you. In this example, I'll use the `uint` type. The goal is to convert the `struct` to a `long` for storage and back to a `struct` when needed.

## Practice

With the concept in mind, let's dive into the implementation. In C++, the `:` symbol is used to mark bit usage. Since C# lacks this, we’ll use `Attribute` to denote the required bit length.

Here's how we define an Attribute to specify bit length:

```csharp
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

Now, let’s create a `struct` for testing:

```csharp
struct Status
{
  [BitFields(1)]
  public uint IsOn;

  [BitFields(3)]
  public uint TimeToRun;

  [BitFields(4)]
  public uint TimeToEat;
};
```

In this `struct`, `IsOn` uses 1 bit, `TimeToRun` uses 3 bits, and `TimeToEat` uses 4 bits of a `uint`.

We’ve marked the bit lengths; the next step is converting the `Status` struct to a `long` and vice versa.

For this, we’ll create a `Convertion` class to handle the conversion:

```csharp
public static class Convertion{
    public static long ToLong<T>(T t) where T : struct
    {
      long r = 0;
      int offset = 0;

      foreach (System.Reflection.FieldInfo f in t.GetType().GetFields())
      {
        object[] attrs = f.GetCustomAttributes(typeof(BitFieldsAttribute), false);
        if (attrs.Length == 1)
        {
          uint fieldLength = ((BitFieldsAttribute)attrs[0]).Length;
          long mask = 0;
          for (int i = 0; i < fieldLength; i++)
            mask |= (uint)(1 << i);

          r |= ((UInt32)f.GetValue(t)! & mask) << offset;

          offset += (int)fieldLength;
        }
      }
      return r;
    }
```

Now, let's reverse the process, converting from `long` back to `struct`:

```csharp
public static class Convertion{
  public static T FromLong<T>(long l) where T : struct
    {
      T t = new T();
      Object boxed = t;
      int offset = 0;

      foreach (System.Reflection.FieldInfo f in t.GetType().GetFields())
      {
        object[] attrs = f.GetCustomAttributes(typeof(BitFieldsAttribute), false);
        if (attrs.Length == 1)
        {

          uint fieldLength = ((BitFieldsAttribute)attrs[0]).Length;


          long mask = 0;
          for (int i = 0; i < fieldLength; i++)
            mask |= (uint)(1 << i);


          var value = Convert.ChangeType((l >> offset) & mask, f.FieldType);

          var fieldAttribute = typeof(T).GetField(f.Name, BindingFlags.Instance | BindingFlags.Public);

          fieldAttribute!.SetValue(boxed, value);

          t = (T)boxed;


          offset += (int)fieldLength;
        }
      }

      return t;
    }
}
```

Here’s how you can test it in the `main` method:

```csharp
    Status s = new();
    s.IsOn = 1;
    s.TimeToRun = 5;
    s.TimeToEat = 7;

    int size = System.Runtime.InteropServices.Marshal.SizeOf(typeof(Status));
    Console.WriteLine("Bytes:" + size);

    long l = BitFieldsAttribute.Convertion.ToLong(s);
    Console.WriteLine("Convert to long:" + l);

    Status s2 = BitFieldsAttribute.Convertion.FromLong<Status>(l);
    Console.WriteLine("Convert from long:" + string.Format("IsOn:{0}, TimeToRun:{1}, TimeToEat:{2}", s2.IsOn, s2.TimeToRun, s2.TimeToEat));
```

This will output:

```plaintext
Bytes:12
Convert to long:123
Convert from long:IsOn:1, TimeToRun:5, TimeToEat:7
```

The complete code is available [here](https://www.onlinegdb.com/yL-1H1woP).

## Discussion

Notice something odd? In C/C++, bit fields take only 1 byte when printed, but here it’s 12 bytes! That’s because C++ bit fields truly occupy only the defined bits in the struct. In C#, however, the `Status` struct has three `uint` variables, so it uses 12 bytes at runtime. However, when stored, it compresses to a `long`, saving memory compared to runtime.

If you have alternative methods to optimize this further, feel free to share. Thanks!

## References

[Stackoverflow](https://stackoverflow.com/a/14591)
