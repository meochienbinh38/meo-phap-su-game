# Mô phỏng cân bằng Campaign

File chính: `tools/balance-sim.js`. Bản hiện tại: **v3.8**.

## Chạy nhanh

```bash
node tools/balance-sim.js
```

Kết quả sẽ in bảng 16 màn với các cột:

- `KQ`: PASS/FAIL theo mô phỏng.
- `Đợt`: đợt đã qua hoặc đợt bị vỡ.
- `HP`: máu thành còn lại cuối màn.
- `Gems`: Tinh Thạch còn lại sau khi mua/mở khoá.
- `Farm`: số lần phải chơi lại màn trước để lấy 30% Tinh Thạch.
- `Mua`: tướng được mở khoá trước màn và các gói SP được sim tự nâng (`SP:...@attempt`).

## Test riêng một màn

```bash
node tools/balance-sim.js --stage=5 --unlocked=ice,gunner,mage
```

`--unlocked` luôn có sẵn `miner,knight,archer`; chỉ cần truyền thêm tướng đã mở.

Lưu ý: test riêng một màn chưa mô phỏng toàn bộ tiến trình SP/Tinh Thạch trước đó; dùng để soi combat thô.
Muốn xem đường campaign thật hơn, chạy lệnh nhanh không tham số.

## Mục tiêu của sim

Sim này dùng để kiểm tra việc đang làm dở của campaign:

1. Người chơi mới có bị kẹt ở cổng khắc chế quá sớm không.
2. Tinh Thạch thưởng mỗi màn có đủ để mở đúng tướng cần thiết không.
3. Màn nào bắt buộc phải farm lại màn trước quá nhiều.
4. Boss có tạo tường độ khó bất thường không.
5. SP/nội tại/kỹ năng tướng làm nửa sau campaign dễ quá hay vẫn còn áp lực.

## Mốc cân bằng v3.8

Sau khi thêm Cổ Mộc/Phong Linh, Golem/Hồn Ma, Hoá Thần cấp 4 và 4 màn mới, các mốc cuối campaign hiện là:

| Màn | `mul` |
|---:|---:|
| 7 | 3.5 |
| 8 | 4.6 |
| 9 | 5.7 |
| 10 | 6.3 |
| 11 | 8.1 |
| 12 | 10.2 |
| 13 | 11.5 |
| 14 | 7.8 |
| 15 | 13.2 |
| 16 | 15.8 |

Kết quả chuẩn hiện tại của `node tools/balance-sim.js`: 16/16 màn PASS. Màn 14 cần 3 lượt farm/thử lại trong sim để mở đủ nhịp Phong Linh/Hoá Thần; các màn 15-16 PASS ngay sau đó. Mốc HP cuối đáng chú ý: màn 13 còn 311, màn 14 còn 255, màn 15 còn 291, màn 16 còn 278. Đây là cận trên vì sim chơi đều tay hơn người thật.

## Giới hạn

Sim hơi lạc quan vì không mô phỏng đầy đủ thao tác người chơi, animation canvas và độ trễ đạn thật.
Nếu sim đã FAIL, gần như chắc chắn cần nới độ khó hoặc tăng tài nguyên. Nếu sim PASS sát nút, vẫn cần
playtest trên mobile. Khi chỉnh số, đổi từng biến nhỏ một lần rồi chạy lại sim.
