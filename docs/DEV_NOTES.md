# Ghi chú phát triển — Kỷ Nguyên Thủ Thành

File này dùng để ghi lại từng batch sửa game, tránh sửa rải rác rồi quên nguồn thay đổi.

## 2026-06-23 — Batch 1: Dọn lỗi version và sửa bán quân

### Đã làm

- Thêm `v312-polish.js` như một lớp vá nhỏ, nạp sau runtime/profile.
- `v312-polish.js` đọc `version.json` và ép đồng bộ các nhãn phiên bản:
  - `ver-num`
  - `ver-num-2`
  - nút `b-update`
  - nút `b-update-2`
- Sửa hướng lỗi cũ: `v311-runtime.js` từng tự ghi đè UI về `GAME_VER = 3.11.5`; batch này có thêm lớp canh version để không bị kéo ngược lại.
- Bắt đầu sửa logic bán quân:
  - khi mua quân, lưu `unit.knttInvestedGold` theo giá mua thực tế có tính `CFG.buyRamp`;
  - khi nâng cấp, cộng chi phí nâng cấp vào `unit.knttInvestedGold`;
  - khi bán, hoàn `50%` tổng vàng đã đầu tư thay vì chỉ tính gần đúng theo `base cost` và `level`.
- Cập nhật `sw.js` để cache/nạp `v312-polish.js`.
- Tăng `version.json` lên `3.12.0`.

### Lý do sửa

- Trước đó version bị hardcode ở nhiều nơi (`index.html`, `v311-runtime.js`, `v311-profile.js`, `version.json`) nên dễ bị một file ghi đè file khác.
- Logic bán quân trong `index.html` chưa đúng thiết kế vì chưa tính tổng vàng thật đã đầu tư, nhất là khi giá mua có tăng theo số lượng quân cùng loại.

### Cần test thủ công

1. Mở web/app, cập nhật lên `3.12.0`.
2. Kiểm tra dòng dưới nút Xuất quân phải hiện `Phiên bản 3.12.0`.
3. Vào trận, mua nhiều quân cùng loại để giá tăng dần.
4. Mở chi tiết quân, kiểm tra tiền bán có hợp lý hơn.
5. Nâng cấp quân rồi bán, tiền bán phải tăng theo tổng đầu tư.
6. Qua/thua trận, kiểm tra lưu tiến trình không bị mất.

### Việc nên làm tiếp

1. Cố định logic lưới 11 cột để cân bằng không lệch giữa điện thoại/tablet/desktop.
2. Dọn source-of-truth version thật sự: bỏ hardcode version khỏi `index.html`, `v311-runtime.js`, `v311-profile.js` nếu có thể chỉnh trực tiếp lõi.
3. Sửa vật lý đạn thẳng sang swept collision để tránh xuyên quái khi FPS thấp.
4. Chuyển ultimate khỏi `setTimeout` sang bộ đếm theo thời gian mô phỏng.
5. Thêm onboarding màn 1 cho người chơi mới.
