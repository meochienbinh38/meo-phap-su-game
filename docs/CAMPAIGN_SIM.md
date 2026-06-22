# Mô phỏng cân bằng Campaign

File chính: `tools/balance-sim.js`.

## Chạy nhanh

```bash
node tools/balance-sim.js
```

Kết quả sẽ in bảng 12 màn với các cột:

- `KQ`: PASS/FAIL theo mô phỏng.
- `Đợt`: đợt đã qua hoặc đợt bị vỡ.
- `HP`: máu thành còn lại cuối màn.
- `Gems`: Tinh Thạch còn lại sau khi mua/mở khoá.
- `Farm`: số lần phải chơi lại màn trước để lấy 30% Tinh Thạch.
- `Mua`: tướng được mở khoá trước màn.

## Test riêng một màn

```bash
node tools/balance-sim.js --stage=5 --unlocked=ice,gunner,mage
```

`--unlocked` luôn có sẵn `miner,knight,archer`; chỉ cần truyền thêm tướng đã mở.

## Mục tiêu của sim

Sim này dùng để kiểm tra việc đang làm dở của campaign:

1. Người chơi mới có bị kẹt ở cổng khắc chế quá sớm không.
2. Tinh Thạch thưởng mỗi màn có đủ để mở đúng tướng cần thiết không.
3. Màn nào bắt buộc phải farm lại màn trước quá nhiều.
4. Boss có tạo tường độ khó bất thường không.

## Giới hạn

Sim hơi lạc quan vì không mô phỏng đầy đủ thao tác người chơi, animation canvas và độ trễ đạn thật. Nếu sim đã FAIL, gần như chắc chắn cần nới độ khó hoặc tăng tài nguyên. Nếu sim PASS sát nút, vẫn cần playtest trên mobile.
