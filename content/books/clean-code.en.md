---
title: "Clean Code"
date: "2026-03-07"
description: "How to write code that is clean, easy to understand, and easy to maintain."
bookCover: "https://m.media-amazon.com/images/I/71nj3JM-igL._SY342_.jpg"
bookAuthor: "Robert C. Martin"
status: "reading"
rating: 4
tags: ["Programming"]
ShowToc: true
---

Every programmer understands what Clean Code is and aspires to reach a level where they write code that is not only understood by machines but also by other people. As projects grow larger, maintaining and evolving code becomes increasingly complex, and writing clean code helps minimize risks and improve team productivity.

It would be a major oversight if we didn't systematize coding conventions and concepts in one place. Fortunately, this is not a new topic — it has existed for as long as programming itself.

There are two books you can refer to: Code Complete 2 and Clean Code. I chose to read Clean Code first because it's easy to read, explains concepts clearly, and is widely recommended by many other developers.

If I had to summarize what Clean Code is, it can be boiled down to these five points:

- **Readable and understandable**: Code should be written so that others can read and understand it quickly without needing excessive explanation.
- **Simple and consistent**: Code should be written in a way that is easy to understand and follows consistent conventions throughout the entire project.
- **Easy to maintain**: Code should be written so that it can be easily modified, extended, and tested without introducing bugs.
- **No redundancy**: Code should be written without unnecessary parts, avoiding repetition.
- **Testable**: Code should be written so that it is easy to test, ensuring that features work correctly and bugs are easy to detect. This is the safety net against bugs in software.

For each of these points, you'll find detailed reasoning and concrete examples in the chapters of the book — covering topics like naming, function conventions, comments, and more.

## Reading Progress

So far, I've finished two chapters — Naming and Functions — and I'm currently reading the Formatting chapter. This section discusses how to standardize code organization to keep things clean and tidy.

## What I've Learned

### Naming

- Names should be clear and accurately describe the purpose or function of a variable, function, or class.
- Names should be concise yet meaningful — avoid using unclear abbreviations.
- Names should follow the project's naming conventions to ensure consistency.
- Every variable name should answer the questions: why does it exist, what does it do, and how is it used.
- Avoid vague or ambiguous names.
- Names should be pronounceable.
- Each word should carry only one meaning, and each concept should be represented by only one word.
- Names should be searchable.

### Functions

- Functions should be around 20–40 lines, small enough to fit on a single editor screen.
- A function should have a single responsibility, and its name should clearly reflect that responsibility.
- Function names should be simple and descriptive — a long function name is better than a long comment.
- Functions should avoid using global variables and depending on external state.
- Functions should read like a paragraph of prose — easy to understand and follow.
- If you need to use a switch statement, consider using an Abstract Factory or other data structures to reduce complexity and improve extensibility.
- Prefer functions with a single input parameter. If multiple parameters are needed, consider using an object to encapsulate them.
- Don't pass boolean flags into a function — instead, split it into two separate functions.
- Functions should have clear return values. Rather than modifying a reference parameter, return a new value instead.
- Avoid side effects. Hidden changes within a function are easy to forget and force the reader to dig into the implementation rather than simply reading the function name.
- Clearly distinguish between commands and queries when writing and naming functions.
- Don't repeat code. Reuse code through functions or classes to reduce duplication and improve maintainability.

## Initial Thoughts

This is a must-read book for any programmer looking to improve their coding skills. Instead of constantly chasing the latest technology trends, we should start with the simplest thing — writing clean and understandable code. As you read the book, you'll understand the reasoning behind each common problem that programmers face, along with the conventions proposed to solve them. The book doesn't just answer *How* — it also answers *Why*.
