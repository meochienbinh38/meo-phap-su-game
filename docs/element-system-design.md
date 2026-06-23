# Hệ thống Ngũ Hành dùng Kim Cương

## Mục tiêu

Hệ Ngũ Hành dùng để giải quyết 2 vấn đề cân bằng:

1. Kim cương cuối game đang dư quá nhiều nếu chỉ dùng để mở tướng.
2. Người chơi bị phụ thuộc vào EXP/SP để mở Hóa Thần, dẫn đến phải cày nhiều màn lặp lại.

Cơ chế mới: dùng kim cương để luyện hệ cho từng tướng. Khi tướng được cho ăn ngọc hệ, đòn đánh hoặc kỹ năng của tướng đó nhận thêm hiệu ứng theo hệ.

## Luật nền

- Mỗi tướng lưu cấp hệ riêng.
- Mỗi tướng có thể học cả 5 hệ, nhưng chỉ kích hoạt 1 hệ chính trong trận.
- Khi tướng đã Hóa Thần, có thể kích hoạt thêm 1 hệ phụ ở 40% hiệu lực.
- Cấp hệ tối đa ban đầu: 5.
- Cấp hệ dùng kim cương, không dùng SP.
- SP vẫn dùng để mở kỹ năng tướng và Hóa Thần.

## Giá đề xuất

| Cấp hệ | Giá kim cương |
|---:|---:|
| 1 | 60 |
| 2 | 100 |
| 3 | 160 |
| 4 | 260 |
| 5 | 420 |

Tổng một hệ cấp 5: 1000 kim cương.

Lý do: nếu người chơi cuối game còn khoảng 2500-2700 kim cương, chỉ cần nâng 2 hệ chính lên gần tối đa đã tiêu phần lớn lượng dư. Điều này biến kim cương thành tài nguyên late-game có giá trị.

## 5 hệ

### Kim

Vai trò: chí mạng, xuyên giáp, bóc khiên.

Hiệu ứng mỗi cấp:

- +3% tỉ lệ chí mạng.
- +8% sát thương chí mạng.
- Cấp 3: crit có 25% bóc thêm 1 lớp khiên.
- Cấp 5: crit bỏ qua 15% kháng vật lý/phép của mục tiêu.

Phù hợp: Xạ Thủ, Thần Sét, Phong Linh, Pháo Thủ.

### Mộc

Vai trò: độc, sát thương duy trì, lan nhiễm, hồi phục nhẹ.

Hiệu ứng mỗi cấp:

- Đòn đánh/kỹ năng gắn độc bằng 8% sát thương chính trong 3 giây.
- Cấp 3: quái chết khi đang trúng Mộc Độc sẽ lan 35% độc sang quái gần đó.
- Cấp 5: quái bị Mộc Độc nhận thêm 12% sát thương từ Cổ Mộc/Tháp Độc.

Phù hợp: Tháp Độc, Cổ Mộc, Mỏ Vàng, Thánh Sứ.

### Thủy

Vai trò: làm chậm, đóng băng nhẹ, kéo dài khống chế.

Hiệu ứng mỗi cấp:

- +5% hiệu quả làm chậm hoặc thêm 3% slow nếu tướng vốn không có slow.
- Cấp 3: 8% xác suất đóng băng 0.35 giây với mục tiêu đã bị slow.
- Cấp 5: mục tiêu bị đóng băng nhận thêm 10% sát thương từ kỹ năng.

Phù hợp: Băng Thần, Phong Linh, Thánh Sứ, Tháp Độc.

### Hỏa

Vai trò: sát thương lan, cháy, dọn bầy.

Hiệu ứng mỗi cấp:

- Đòn đánh/kỹ năng gây thêm cháy bằng 6% sát thương chính trong 2 giây.
- Cấp 3: kỹ năng đơn mục tiêu có 20% tạo nổ nhỏ quanh mục tiêu.
- Cấp 5: nếu mục tiêu chết khi đang cháy, gây nổ lan nhỏ.

Phù hợp: Pháo Thủ, Thần Sét, Xạ Thủ, Giáp Sĩ.

### Thổ

Vai trò: phòng thủ, khiên, chống burst, chống xuyên tuyến.

Hiệu ứng mỗi cấp:

- +5% máu tối đa hoặc +3% giảm sát thương nếu tướng không dùng máu nhiều.
- Cấp 3: khi nhận sát thương lớn, tạo khiên nhỏ trong 2 giây.
- Cấp 5: khiên nổ khi vỡ, làm choáng quái gần 0.35 giây.

Phù hợp: Giáp Sĩ, Thánh Sứ, Cổ Mộc, Mỏ Vàng.

## Gợi ý hệ theo tướng

| Tướng | Hệ chính nên dùng | Hệ phụ khi Hóa Thần | Lý do |
|---|---|---|---|
| Mỏ Vàng | Thổ | Mộc | sống lâu hơn, có cơ hội tạo lộc phụ |
| Giáp Sĩ | Thổ | Hỏa | tank chính, phản công bằng cháy/nổ |
| Xạ Thủ | Kim | Hỏa | crit xuyên phá, phụ nổ lan |
| Pháo Thủ | Hỏa | Kim | dọn bầy, crit đại pháo |
| Tháp Độc | Mộc | Thủy | độc lan, slow giữ quái trong độc |
| Thần Sét | Kim | Hỏa | crit sét, phụ nổ lan khi Thiên Lôi |
| Băng Thần | Thủy | Kim | khống chế chính, crit khi đóng băng |
| Thánh Sứ | Thổ | Thủy | bảo kê đội hình, kéo dài sống sót |
| Cổ Mộc | Mộc | Thổ | trói đất, độc thiên nhiên, chống golem |
| Phong Linh | Thủy | Kim | đẩy/làm chậm, crit khi xuyên hàng |

## Ảnh hưởng tới cổng màn 6

Màn 6 không nhất thiết phải yêu cầu Thần Sét Hóa Thần hoàn chỉnh mới qua. Có thể cho 2 đường:

1. Thần Sét Hóa Thần.
2. Thần Sét kỹ năng 2/3 + Kim cấp 2 hoặc Hỏa cấp 1.

Như vậy kim cương có tác dụng giảm số lần cày EXP/SP. Người chơi có lựa chọn: cày EXP để lên Hóa Thần, hoặc dùng kim cương luyện hệ để vượt cổng sớm hơn.

## Ảnh hưởng tới kinh tế cuối game

Kim cương không còn chỉ dùng để mở tướng. Vòng tiêu kim cương mới:

1. Mở tướng.
2. Luyện hệ chính cho tướng chủ lực.
3. Khi tướng Hóa Thần, mở hệ phụ.
4. Late-game nâng hệ cấp 4-5 cho đội hình chính.

Mục tiêu cân bằng cuối campaign:

| Nhóm người chơi | Kim cương dư mục tiêu |
|---|---:|
| Xui | 100-300 |
| Bình thường | 300-700 |
| May mắn | 700-1200 |

Nếu giả lập cho thấy người chơi bình thường vẫn dư trên 1500 kim cương, cần tăng giá cấp 4-5 hoặc thêm rương hệ.

## Quy tắc đưa vào game thật

Không đưa trực tiếp vào gameplay khi chưa qua giả lập. Trình tự đúng:

1. Đưa hệ Ngũ Hành vào giả lập campaign.
2. Chạy nhóm xui / bình thường / may mắn.
3. Kiểm tra số lần cày giảm hay không.
4. Kiểm tra kim cương cuối game còn bao nhiêu.
5. Chỉ khi đạt ngưỡng mới triển khai vào bản 3.11.0.
