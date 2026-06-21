# 📚 Tài liệu thiết kế — Kỷ Nguyên Thủ Thành

Bộ tài liệu biến game thành một **dự án phát triển** có định hướng rõ ràng.

| Tài liệu | Nội dung |
|---|---|
| **[GAME_DESIGN.md](./GAME_DESIGN.md)** | Tầm nhìn & trụ cột, bối cảnh, vòng lặp chơi, cơ chế, nội dung (quân/địch/đợt/map), tiến trình & kinh tế, **hướng nghệ thuật & đồ hoạ**, âm thanh, kiến trúc kỹ thuật, lộ trình, rủi ro. |
| **[CONTENT.md](./CONTENT.md)** | 🐾 **Kinh thánh nội dung.** Hệ chiến đấu nền tảng (6 hệ + giáp/kháng + **phản ứng nguyên tố**), **danh bạ đơn vị & kẻ địch**, hệ cộng hưởng lân cận, thiết kế đợt + **kịch bản 15 đợt đầu**, 3 Trùm theo map, cơ chế bản đồ, nhịp mở khoá. |
| **[PHYSICS.md](./PHYSICS.md)** | ⚙️ **Phần trọng tâm kỹ thuật.** Hệ toạ độ/đơn vị, **fixed timestep**, chuyển động địch, **vật lý đạn** (thẳng/vòng cung đạn đạo/dò tìm/sét), va chạm & **spatial hash**, AoE falloff, **hệ trạng thái**, targeting, RNG xác định, ổn định số học, hiệu năng, và **ánh xạ việc cần sửa trong code**. |
| **[BALANCE.md](./BALANCE.md)** | Mô hình sát thương, hệ số scaling, **bảng DPS thực tế**, hiệu quả chi phí, **máu địch theo đợt + phân tích "tường độ khó"**, kinh tế, đòn bẩy tinh chỉnh, quy trình playtest. |

## Trạng thái dự án (làm từng bước, chắc từng bước)
- ✅ **M0:** chơi được + **PWA cài trên điện thoại** + âm thanh + lưu tiến trình.
- ✅ **Thiết kế tổng thể & nội dung cốt lõi:** GAME_DESIGN + CONTENT + PHYSICS + BALANCE.
- ⏭️ **Đang ở khâu thiết kế:** chốt bảng số giáp/kháng & 4 đơn vị mới; storyboard onboarding; cheat-sheet hệ↔kháng (xem [CONTENT.md §10](./CONTENT.md)).
- 🔜 **M1 (sau khi chốt nội dung):** fixed timestep, swept collision, spatial hash, object pool — xem [PHYSICS.md §14](./PHYSICS.md).

## Cách đọc
- **Muốn hiểu game & định hướng:** `GAME_DESIGN.md`.
- **Muốn biết nội dung cốt (quân/địch/hệ/đợt):** `CONTENT.md`.
- **Muốn code phần lõi mô phỏng:** `PHYSICS.md` (mã giả & danh sách việc cần sửa).
- **Muốn chỉnh độ khó/giá trị:** `BALANCE.md` (bảng đòn bẩy §7).
