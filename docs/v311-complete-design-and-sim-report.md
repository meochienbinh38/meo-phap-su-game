# V3.11 — Thiết kế hoàn chỉnh: Tướng, Hóa Thần, Ngũ Hành, Quái và Wave

## 1. Mục tiêu thiết kế

Bản 3.11 không chỉ thêm chỉ số. Mục tiêu là dựng lại trục chiến thuật:

1. Mỗi tướng có bản sắc rõ.
2. Mỗi tướng có đòn đánh, kỹ năng chữ ký, Hóa Thần khác nhau.
3. Hệ Ngũ Hành dùng kim cương để nâng, giúp giảm phụ thuộc vào EXP/SP.
4. Mọi tướng đều có thể học mọi hệ, nhưng đúng hệ thì mạnh hơn rõ.
5. Quái và wave phải có lúc đông, lúc ít, lúc nhanh, lúc trâu, lúc né, lúc có khiên để từng tướng có đất diễn.
6. Chưa đưa vào game thật nếu chưa qua giả lập.

## 2. Công thức hiệu lực hệ

| Mức ghép hệ | Hiệu lực | Ghi chú |
|---|---:|---|
| Đúng hệ chính | 100% | Mở thêm hiệu ứng riêng theo tướng |
| Hệ phụ hợp | 70% | Hỗ trợ build phụ, không lấn hệ chính |
| Hệ lệch | 45% | Vẫn có tác dụng nhưng không tối ưu |
| Hệ phụ sau Hóa Thần | 40% | Chỉ mở khi tướng đã Hóa Thần |

## 3. Giá luyện hệ đề xuất

| Cấp hệ | Giá kim cương |
|---:|---:|
| 1 | 30 |
| 2 | 80 |
| 3 | 180 |
| 4 | 320 |
| 5 | 500 |

Lý do: cấp 1 phải rẻ để người chơi sớm cảm nhận hệ. Cấp 4-5 đắt để hút kim cương cuối game.

## 4. Thiết kế tướng

| Tướng | Chất lõi | Đòn/kỹ năng chính | Hóa Thần | Hệ chính | Hệ phụ |
|---|---|---|---|---|---|
| Mỏ Vàng | kinh tế / tài nguyên | đào vàng theo chu kỳ | Thần Mạch Kim Sơn: đào vàng lớn, cơ hội lộc tài nguyên | Thổ | Mộc |
| Giáp Sĩ | tank / phản đòn | cận chiến, chặn tuyến | Thần Thuẫn Bất Diệt: khiên lớn, choáng, phản sát thương | Thổ | Hỏa |
| Xạ Thủ | đơn mục tiêu / xuyên / crit | bắn theo hàng, xuyên khi mở kỹ năng | Thần Tiễn Xuyên Tâm: mũi tên thần, crit/xuyên/kết liễu | Kim | Hỏa |
| Pháo Thủ | AoE / nổ / dọn bầy | đạn nổ chùm | Thiên Pháo Diệt Quân: nổ lớn, cháy vùng, nổ phụ | Hỏa | Kim |
| Tháp Độc | độc / ăn mòn / chống né | pulse độc quanh thân | Dịch Thần Ăn Mòn: độc cộng dồn, lan dịch, giảm né | Mộc | Thủy |
| Thần Sét | sét chuỗi / khắc giáp | đánh toàn bản đồ, nảy chuỗi | Thiên Lôi Phán Quyết: đánh dấu boss/giáp, xuyên kháng | Kim | Hỏa |
| Băng Thần | slow / đóng băng | cầu băng nổ vùng | Cực Hàn Lĩnh Vực: vùng băng, slow sâu, đóng băng ngắn | Thủy | Kim |
| Thánh Sứ | hồi máu / buff | hồi máu, hào quang buff | Thần Quang Hộ Mệnh: cứu chết, hồi theo thời gian | Thổ | Thủy |
| Cổ Mộc | trói / thiên nhiên | pulse rễ, slow/root | Thần Lâm Trói Đất: rễ lan, khắc golem, độc thiên nhiên | Mộc | Thổ |
| Phong Linh | xuyên hàng / đẩy lùi | gió xuyên hàng, knockback | Thiên Phong Phá Trận: đẩy cụm, lộ hồn ma, gom quái | Thủy | Kim |

## 5. Hiệu ứng hệ theo tướng

### Kim

Hợp nhất với Xạ Thủ và Thần Sét.

- Hiệu ứng chung: tăng chí mạng, tăng sát thương chí mạng.
- Trên Xạ Thủ: crit bóc khiên, xuyên giáp, Thần Tiễn dễ kích hoạt hơn.
- Trên Thần Sét: sét crit, đánh dấu Phán Quyết, tăng sát thương lên Orc/Golem/Boss.
- Trên tướng lệch: chỉ được crit cơ bản, không có hiệu ứng riêng.

### Mộc

Hợp nhất với Tháp Độc và Cổ Mộc.

- Hiệu ứng chung: thêm độc nhẹ.
- Trên Tháp Độc: độc cộng dồn, chết lan độc.
- Trên Cổ Mộc: rễ mang độc thiên nhiên, golem bị ăn mòn.
- Trên tướng lệch: chỉ thêm sát thương độc nhỏ.

### Thủy

Hợp nhất với Băng Thần và Phong Linh.

- Hiệu ứng chung: slow nhẹ.
- Trên Băng Thần: kéo dài đóng băng, tạo Cực Hàn.
- Trên Phong Linh: gió đẩy chậm hơn, hồn ma bị lộ hình lâu hơn.
- Trên tướng lệch: chỉ slow rất ngắn.

### Hỏa

Hợp nhất với Pháo Thủ.

- Hiệu ứng chung: gây cháy.
- Trên Pháo Thủ: nổ để lại vùng cháy, chết gây nổ phụ.
- Trên Giáp Sĩ: phản đòn gây cháy.
- Trên tướng lệch: chỉ thêm burn nhỏ.

### Thổ

Hợp nhất với Giáp Sĩ và Thánh Sứ.

- Hiệu ứng chung: tăng sống sót.
- Trên Giáp Sĩ: khiên dày hơn, khiên vỡ làm choáng.
- Trên Thánh Sứ: hào quang hộ mệnh tốt hơn.
- Trên tướng lệch: chỉ tăng máu/giảm sát thương nhỏ.

## 6. Thiết kế quái và wave

| Kiểu wave | Mục tiêu thiết kế | Tướng phát huy |
|---|---|---|
| Bầy đông máu thấp | kiểm tra AoE | Pháo Thủ Hỏa, Băng Thủy, Độc Mộc |
| Ít nhưng trâu | kiểm tra single target / xuyên kháng | Xạ Thủ Kim, Thần Sét Kim, Cổ Mộc Mộc |
| Quái nhanh | kiểm tra slow/đẩy | Băng Thủy, Phong Linh Thủy |
| Khiên nhiều lớp | kiểm tra bóc khiên | Xạ Thủ Kim, Độc Mộc |
| Né cao | kiểm tra khắc né | Độc Mộc, Sét Kim, Phong Linh Thủy |
| Giáp đá / golem | kiểm tra khắc giáp thiên nhiên | Cổ Mộc Mộc, Sét Kim |
| Hồn ma | kiểm tra phát hiện/đẩy lùi | Phong Linh Thủy, Cổ Mộc |
| Boss nhiều pha | kiểm tra đội hình phối hợp | nhiều tướng, không cho một tướng solo |

## 7. Nhịp campaign đề xuất

| Giai đoạn | Màn | Mục tiêu |
|---|---:|---|
| Học cơ bản | 1-2 | ít hệ, quái đơn giản |
| Mở khắc chế đầu | 3-5 | Băng, Pháo, Thần Sét bắt đầu có đất diễn |
| Cổng boss đầu | 6 | Thần Sét kỹ năng 1 + Kim 1 có thể vượt; không bắt buộc Hóa Thần |
| Mid-game | 7-10 | Độc/Mộc và Băng/Thủy bắt đầu quan trọng |
| Cổng boss giữa | 11-12 | cần ít nhất một Hóa Thần hoặc combo hệ tốt |
| Late-game | 13-16 | Cổ Mộc, Phong Linh, nhiều wave hỗn hợp, boss nhiều pha |

## 8. Giả lập thử nghiệm

Mô phỏng đã chạy nội bộ với 500 seed cho mỗi nhóm:

- Xui: luck bias -0.35
- Bình thường: luck bias 0
- May mắn: luck bias +0.35

### Tham số chính dùng trong giả lập

- Mở tướng: tổng 585 kim cương.
- Luyện hệ: 30 / 80 / 180 / 320 / 500 kim cương.
- Cổng màn 6: có thể qua bằng Thần Sét kỹ năng 1 + Kim cấp 1, không bắt buộc Hóa Thần.
- Late-game yêu cầu Cổ Mộc Mộc, Phong Linh Thủy, và ít nhất một vài Hóa Thần hoặc hệ cấp cao.

### Kết quả

| Nhóm | Tỉ lệ phá đảo | Replay min / p50 / p75 / max | Kim cương cuối min / p25 / p50 / p75 / max | Kim cương tiêu vào hệ p50 | Hóa Thần p50 |
|---|---:|---|---|---:|---:|
| Xui | 100% | 4 / 29 / 37 / 51 | 250 / 292 / 308 / 320 / 381 | 1460 | 2 |
| Bình thường | 100% | 2 / 26 / 31 / 49 | 250 / 282 / 307 / 321 / 397 | 1320 | 3 |
| May mắn | 100% | 1 / 25 / 30 / 48 | 250 / 288 / 308 / 322 / 398 | 1460 | 3 |

## 9. Nhận xét sau giả lập

### Điểm đạt

- Kim cương không còn dư 2500-2700 như trước.
- Người chơi bình thường cuối game còn khoảng 300 kim cương, đúng vùng mục tiêu thấp-trung.
- Số lần replay giảm mạnh so với mô hình cũ phụ thuộc EXP/SP.
- Hệ Ngũ Hành tạo đường vượt ải khác, không bắt người chơi luôn phải chờ đủ Hóa Thần.
- Mỗi nhóm tướng có màn để phát huy: AoE, single target, slow, độc, chống né, chống giáp, chống hồn ma.

### Điểm cần chỉnh tiếp

- Stage 16 vẫn có thể tạo spike farm ở một số seed xui.
- Phong Linh và Cổ Mộc cần được mở sớm hơn một chút hoặc có màn farm riêng trước late-game.
- Nếu muốn người chơi bình thường còn 500-700 kim cương cuối game, cần giảm cap nâng hệ tự động hoặc tăng reserve cuối game.

## 10. Kết luận triển khai

Trạng thái thiết kế: đạt để làm prototype.

Không đưa thẳng vào game thật toàn bộ một lần. Trình tự nên là:

1. Đưa bảng Hero Identity + Hóa Thần vào giả lập chính.
2. Đưa hệ Ngũ Hành vào gameplay theo dữ liệu, không hard-code rời rạc.
3. Đưa bảng tổng kết trận: EXP quái, EXP trận, kim cương quái, boss drop, crit.
4. Tạo UI luyện hệ bằng kim cương.
5. Test lại stage 6, 10, 12, 16 trước khi phát hành bản 3.11.0.
