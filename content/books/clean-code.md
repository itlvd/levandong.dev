---
title: "Review sách: Clean Code"
date: "2026-03-07"
description: "Viết như thế nào cho Clean là một vấn đề gây tranh cãi. Code của bạn đối với bạn có thể clean, nhưng với người khác là code bẩn. Vậy làm sao để có thể code clean hơn?"
bookCover: "https://m.media-amazon.com/images/I/71nj3JM-igL._SY342_.jpg"
bookAuthor: "Robert C. Martin"
status: "reading"
rating: 4
tags: ["Programming"]
ShowToc: true
---

Clean Code là gì thì với một người lập trình viên thì ai cũng hiểu và mong muốn đạt tới trình độ mà viết code không chỉ máy hiểu mà cả cho người khác cũng hiểu. Bởi khi dự án lớn lên, việc duy trì và phát triển code trở nên phức tạp hơn, việc viết code sạch sẽ giúp giảm thiểu rủi ro và tăng hiệu quả làm việc nhóm.

Thật thiếu sót lớn nếu như chúng ta không hệ thống các quy ước và khái niệm lại một chỗ. Rất may mắn khi đây không phải là một chủ đề mới, chủ đề này đã tồn tại rất lâu kể từ lúc lập trình xuất hiện.

Có hai cuốn mà các bạn có thể tham khảo gồm The Complete Code 2 và Clean Code. Tôi chọn cuốn Clean Code để đọc và tham khảo trước vì nó dễ đọc, giải thích lý do dễ hiểu và cũng được rất nhiều lập trình viên khác khuyên đọc.

Nếu như phải tóm gọn lại khái niệm Clean Code là gì, chúng ta có thể tóm tắt bằng 5 dòng sau:

- Dễ đọc và dễ hiểu: Code nên được viết sao cho người khác có thể đọc và hiểu nhanh chóng mà không cần phải giải thích quá nhiều.
- Đơn giản và có tính nhất quán: Code nên được viết sao cho dễ hiểu và tuân thủ các quy tắc nhất quán trong toàn bộ dự án.
- Dễ bảo trì: Code nên được viết sao cho dễ dàng sửa đổi, mở rộng và kiểm tra mà không gây ra lỗi.
- Không dư thừa: Code nên được viết sao cho không có phần thừa, tránh lặp lại.
- Kiểm thử: Code nên được viết sao cho dễ dàng kiểm thử, đảm bảo rằng các chức năng hoạt động đúng và dễ dàng phát hiện lỗi. Đây là lớp bảo vệ lỗi trong phần mềm.

Với mỗi gạch đầu dòng, bạn sẽ tìm thấy lý do và ví dụ minh họa cụ thể trong các chương trong sách. Ví dụ như cách đặt tên, quy ước viết hàm, comment,...

## Đang đọc đến đâu

Hiện tại tôi đã đọc được 2 chương là Name và Function và đang đọc tiếp chương Formatting. Phần này đang nói về vấn đề chuẩn hóa việc tổ chức code sao cho gọn gàng.

## Những gì đã học được

### Tên

- Tên nên rõ ràng, mô tả chính xác chức năng hoặc mục đích của biến, hàm, lớp.
- Tên nên ngắn gọn nhưng đủ ý nghĩa, tránh sử dụng từ viết tắt không rõ ràng.
- Tên nên tuân thủ quy tắc đặt tên trong dự án để đảm bảo tính nhất quán.
- Mọi tên biến nên cần trả lời được câu hỏi: tại sao tồn tại, làm gì, và làm thế nào.
- Tránh tên mơ hồ hoặc không rõ ràng.
- Đặt tên sao cho có thể đọc thành tiếng được.
- Mỗi từ chỉ mang 1 nghĩa và mỗi nghĩa chỉ nên 1 từ thể hiện thôi.
- Đặt tên sao có thể search được.

### Hàm

- Hàm nên khoảng 20-40 dòng sao cho vừa đủ hiện 1 hàm trên giao diện editor.
- Hàm nên có một nhiệm vụ duy nhất và tên hàm nên phản ánh rõ ràng nhiệm vụ đó.
- Hàm nên đặt tên đơn giản và dễ hiểu, tên hàm dài tốt hơn comment dài.
- Hàm nên tránh sử dụng các biến toàn cục và phụ thuộc vào trạng thái bên ngoài.
- Nên viết hàm sao cho có thể đọc như một đoạn văn, dễ hiểu và dễ theo dõi.
- Nếu cần sử dụng switch, hãy cân nhắc sử dụng ABSTRACT FACTORY hoặc các cấu trúc dữ liệu khác để giảm sự phức tạp và tăng tính mở rộng.
- Nên sử dụng hàm với 1 tham số input, nếu cần nhiều tham số, hãy cân nhắc sử dụng đối tượng để đóng gói các tham số.
- Không nên truyền flag vào trong một hàm nào đó, thay vào đó nên tách ra làm 2 hàm.
- Hàm nên có return rõ ràng, thay vì trả về dựa trên tham số tham chiếu thì hãy chọn trả về giá trị mới.
- Tránh side effect. Tránh thay đổi ẩn trong hàm vì khi dùng dễ quên, không nhớ, phải đọc kỹ nội dung hàm thay vì chỉ cần đọc tên hàm.
- Nên phân biệt rõ giữa command và query khi viết hàm và đặt tên đúng.
- Không nên lặp lại code. Hãy tái sử dụng code thông qua các hàm hoặc lớp để giảm sự trùng lặp và tăng tính bảo trì.

## Nhận xét ban đầu

Đây là cuốn sách nên đọc cho bất kỳ lập trình viên nào muốn nâng cao kỹ năng viết code. Thay vì cứ chạy theo trend công nghệ mới, thì ta nên bắt đầu từ những thứ đơn giản nhất là viết code sạch và dễ hiểu. Khi đọc sách, bạn sẽ hiểu rõ lý do của từng vấn đề mà các lập trình viên hay mắc phải và đưa ra các quy ước để giải quyết các vấn đề đó. Cuốn sách không chỉ **How** mà còn trả lời câu hỏi **Why**.
