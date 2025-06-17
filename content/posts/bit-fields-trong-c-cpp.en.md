---
author: "Le Van Dong"
title: "Bit Fields in C++ devide many variable with one byte"
date: "2021-04-12 17:00:00"
tags: ["C/C++", "Tips"]
categories: ["Programming"]
ShowToc: false
TocOpen: false
---

Structs are essential in C/C++ for creating new data types that simplify variable management. However, a lesser-known feature of C/C++ structs is Bit Fields, which allow you to allocate a specific number of bits for a variable, optimizing memory usage.

## Introduction

> Bit Fields allocate adjacent memory positions to hold a series of bits.

For example, instead of using 8 bytes to store 8 flags (which would waste 54 bits), you can store them in a single byte by dividing the byte into different bit regions.

## Common Use Cases

- Memory-constrained hardware.
- Bit manipulation tasks.

## Implementation

You use the ':' operator to indicate how many bits a variable should use. Here’s a simple example:

```cpp
#include <iostream>

using namespace std;

struct t {
  unsigned char x1:1;
  unsigned char x2:1;
  unsigned char x3:1;
  unsigned char x4:1;
  unsigned char x5:1;
  unsigned char x6:1;
  unsigned char xx:2;
};

int main(){
  struct t a;
  cout << "Size of struct t: " << sizeof(a) << " bytes" << endl;

  a.x1 = 0;
  cout << "Value of x1 when a.x1 = 0: " << (int)a.x1 << endl;

  a.x1 = 1;
  cout << "Value of x1 when a.x1 = 1: " << (int)a.x1 << endl;

  a.x1 = 2;
  cout << "Value of x1 when a.x1 = 2: " << (int)a.x1 << endl;

  a.x2 = 1;
  cout << "Value of x2 when a.x2 = 1: " << (int)a.x2 << endl;

  cout << endl;

  a.xx = 0;
  cout << "Value of xx when a.xx = 0: " << (int)a.xx << endl;

  a.xx = 1;
  cout << "Value of xx when a.xx = 1: " << (int)a.xx << endl;

  a.xx = 2;
  cout << "Value of xx when a.xx = 2: " << (int)a.xx << endl;

  a.xx = 3;
  cout << "Value of xx when a.xx = 3: " << (int)a.xx << endl;

  a.xx = 4;
  cout << "Value of xx when a.xx = 4: " << (int)a.xx << endl;

  return 0;
}
```

Output:

```
Size of struct t: 1 byte
Value of x1 when a.x1 = 0: 0
Value of x1 when a.x1 = 1: 1
Value of x1 when a.x1 = 2: 0
Value of x2 when a.x2 = 1: 1

Value of xx when a.xx = 0: 0
Value of xx when a.xx = 1: 1
Value of xx when a.xx = 2: 2
Value of xx when a.xx = 3: 3
Value of xx when a.xx = 4: 0
```

In the above example, the `xx` variable can only represent values between 0 and 3 since it’s limited to 2 bits. When assigning a value like 4, the stored value wraps around due to the bit length limitation.

## Conclusion

This post covers the concept and implementation of Bit Fields in C/C++. It's useful in scenarios with limited memory, although for typical practice on powerful machines, optimizing memory usage might not be necessary.