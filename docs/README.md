# 📚 Tài liệu thiết kế — Kỷ Nguyên Thủ Thành

Bộ tài liệu biến game thành một **dự án phát triển** có định hướng rõ ràng.

| Tài liệu | Nội dung |
|---|---|
| **[GAME_DESIGN.md](./GAME_DESIGN.md)** | Tầm nhìn & trụ cột, bối cảnh, vòng lặp chơi, cơ chế, nội dung (quân/địch/đợt/map), tiến trình & kinh tế, **hướng nghệ thuật & đồ hoạ**, âm thanh, kiến trúc kỹ thuật, lộ trình, rủi ro. |
| **[PHYSICS.md](./PHYSICS.md)** | ⚙️ **Phần trọng tâm.** Hệ toạ độ/đơn vị, **fixed timestep**, chuyển động địch, **vật lý đạn** (thẳng/vòng cung đạn đạo/dò tìm/sét), va chạm & **spatial hash**, AoE falloff, **hệ trạng thái**, targeting, RNG xác định, ổn định số học, hiệu năng, và **ánh xạ việc cần sửa trong code**. |
| **[BALANCE.md](./BALANCE.md)** | Mô hình sát thương, hệ số scaling, **bảng DPS thực tế**, hiệu quả chi phí, **máu địch theo đợt + phân tích "tường độ khó"**, kinh tế, đòn bẩy tinh chỉnh, quy trình playtest. |

## Trạng thái dự án
- ✅ **M0:** chơi được + **PWA cài trên điện thoại** + âm thanh + lưu tiến trình (đã xong).
- ⏭️ **M1 (kế tiếp):** fixed timestep, swept collision, spatial hash, object pool, onboarding — xem [PHYSICS.md §14](./PHYSICS.md#14--phụ-lục--ánh-xạ-sang-code-hiện-tại--việc-cần-làm).

## Cách đọc
- **Muốn hiểu game & định hướng:** đọc `GAME_DESIGN.md`.
- **Muốn code phần lõi mô phỏng:** đọc `PHYSICS.md` (có mã giả & danh sách việc cần sửa).
- **Muốn chỉnh độ khó/giá trị:** đọc `BALANCE.md` (bảng đòn bẩy §7).
