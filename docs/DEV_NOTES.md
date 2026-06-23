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

## 2026-06-23 — Batch 1.1: Refresh nút Nâng cấp trong modal tướng

### Đã làm

- Sửa `v312-polish.js` để modal tướng tự cập nhật trạng thái nút `Nâng cấp` mỗi khi `UI.updateDisplay()` chạy.
- Khi vàng tăng trong lúc modal đang mở, nút nâng cấp sẽ tự chuyển từ trạng thái xám sang sáng nếu đã đủ vàng.
- Đồng bộ lại các nhãn trong modal đang mở:
  - cấp hiện tại;
  - giá nâng cấp;
  - tiền bán theo `knttInvestedGold`;
  - trạng thái sáng/tắt của nút nâng cấp.
- Tăng `version.json` lên `3.12.1`.

### Lý do sửa

- Trước đó `UI.openUnitModal()` chỉ tính trạng thái nút nâng cấp tại thời điểm ấn vào tướng.
- Khi vàng tăng sau đó, HUD/shop được cập nhật nhưng modal tướng không được refresh, nên người chơi phải ấn lại tướng thì nút mới sáng.

### Cần test thủ công

1. Vào trận và mở chi tiết một tướng chưa đủ tiền nâng cấp.
2. Giữ modal mở, đợi vàng tăng từ Mỏ Vàng hoặc giết quái.
3. Khi đủ vàng, nút `Nâng cấp` phải tự sáng, không cần ấn lại tướng.
4. Bấm nâng cấp ngay khi nút sáng để kiểm tra vẫn trừ đúng vàng và cập nhật cấp.

## 2026-06-23 — Batch 1.2: Watcher cho nút Nâng cấp

### Đã làm

- Sửa mạnh `v312-polish.js` bằng watcher 200ms khi modal tướng đang mở.
- Watcher kiểm tra trực tiếp `State.gold`, tướng đang chọn và giá nâng cấp.
- Set style trực tiếp cho nút `Nâng cấp`, không chỉ đổi class Tailwind:
  - đủ vàng: nền xanh sáng, viền xanh, glow nhẹ;
  - chưa đủ vàng: nền xám, mờ.
- Tăng `version.json` lên `3.12.2`.

### Lý do sửa

- Bản 3.12.1 chỉ dựa vào `UI.updateDisplay()`, nhưng thực tế có luồng vàng/animation không làm modal đổi trạng thái đúng lúc.
- Watcher giúp nút tự sáng dù vàng tăng từ bất kỳ nguồn nào trong khi bảng chi tiết tướng đang mở.

### Cần test thủ công

1. Cập nhật lên `3.12.2`.
2. Vào trận, mở chi tiết một tướng chưa đủ tiền nâng cấp.
3. Giữ modal mở, đợi vàng tăng.
4. Khi đủ tiền, nút `Nâng cấp` phải tự sáng trong tối đa khoảng 0.2 giây.

## 2026-06-23 — Batch 1.3: Inline refresh cho nút Nâng cấp

### Đã làm

- Sửa `sw.js` để chèn trực tiếp script `kntt-inline-upgrade-refresh` vào HTML trả về cho game.
- Script inline này chạy trong trang game, kiểm tra `State.gold`, `State.ui.selUnit`, `upgradeCost()` và cập nhật nút `b-up` mỗi 120ms.
- Không còn phụ thuộc riêng vào `v312-polish.js` cho lỗi nút nâng cấp.
- Tăng `version.json` lên `3.12.3`.

### Lý do sửa

- Ảnh test bản `3.12.2` cho thấy version đã lên nhưng nút vẫn không sáng, nghĩa là bản vá ngoài chưa chạm đúng DOM/luồng đang chạy.
- Dòng xử lý được chèn thẳng vào HTML do service worker trả về, cùng cơ chế đã cập nhật đúng nhãn phiên bản.

### Cần test thủ công

1. Cập nhật lên `3.12.3`.
2. Vào trận, mở chi tiết một tướng chưa đủ tiền nâng cấp.
3. Giữ modal mở, đợi vàng tăng vượt giá nâng cấp.
4. Nút `Nâng cấp` phải sáng ngay; nếu không sáng, cần sửa trực tiếp `index.html` thay vì vá qua service worker.

## Việc nên làm tiếp

1. Cố định logic lưới 11 cột để cân bằng không lệch giữa điện thoại/tablet/desktop.
2. Dọn source-of-truth version thật sự: bỏ hardcode version khỏi `index.html`, `v311-runtime.js`, `v311-profile.js` nếu có thể chỉnh trực tiếp lõi.
3. Sửa vật lý đạn thẳng sang swept collision để tránh xuyên quái khi FPS thấp.
4. Chuyển ultimate khỏi `setTimeout` sang bộ đếm theo thời gian mô phỏng.
5. Thêm onboarding màn 1 cho người chơi mới.
