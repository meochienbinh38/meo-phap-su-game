# 📒 GHI CHÚ TIẾN ĐỘ — Game "Kỷ Nguyên Thủ Thành" (Mèo Pháp Sư)

> File này ghi lại **làm tới đâu, làm gì, ở đâu** để bất kỳ ai (hoặc AI) tiếp nhận
> sau này đều biết tình trạng dự án. **Cập nhật file này mỗi khi làm xong một việc.**

Cập nhật lần cuối: **2026-06-22**

---

## 1. TỔNG QUAN DỰ ÁN

- **Loại game:** Thủ thành (tower-defense) chơi trên web/điện thoại, là **PWA cài được**.
- **Toàn bộ game nằm trong 1 file:** `index.html` (HTML + CSS + JS gộp chung).
  - `manifest.json`, `sw.js` (service worker), `version.json`, các `icon-*.png`: phục vụ PWA.
- **Đồ hoạ:** vẽ hoàn toàn bằng code trên `<canvas>` (procedural), **không dùng ảnh nhân vật**.
  - Nhân vật "Mèo" (8 quân ta) và 7 quái "Hắc Thú" đều vẽ + animate bằng code.

## 2. ⚠️ NHÁNH & DEPLOY (RẤT QUAN TRỌNG)

- **Trang web đang chạy thật (GitHub Pages):** https://meochienbinh38.github.io/meo-phap-su-game/
- **Pages deploy từ nhánh:** **`claude/mobile-game-quality-hkrihf`** — KHÔNG phải `main`.
  - ⛔ `main` là một dòng code **CŨ, KHÁC HẲN** (nhân vật bằng emoji, nền phẳng). Đừng nhầm.
  - ✅ Mọi thay đổi muốn lên web **phải commit vào `claude/mobile-game-quality-hkrihf`**.
- Sau khi push, Pages tự build lại ~1–2 phút. PWA đã cài sẽ báo "Đã có bản mới" nhờ
  cơ chế version (xem mục 5).

## 3. CẤU TRÚC CODE TRONG `index.html` (mốc tìm nhanh)

| Phần | Nội dung |
|------|----------|
| `<style>` | Design system (CSS tokens: màu, nút, panel...), giao diện menu/HUD/modal |
| `CFG` | Cấu hình chung: số hàng/cột, vàng, máu nhà, **CFG.colors** (màu theo loại quân) |
| `MAPS` | 3 map: rừng/núi lửa/hầm ngục. Mỗi map có `grade` (ám màu), `vig` (vignette), `key` (ánh sáng phòng thủ), `weather` |
| `UNIT_ART` | Cấu hình **vẽ từng quân**: fur/robe/accent/**evo** (màu tiến hoá cấp 3)/hat/style |
| `CharArt` | **Bộ vẽ nhân vật**: `drawUnit`, `drawWeapon`, `drawSkillFx`, `drawHat`, `drawEnemy` |
| `UNITS_DB` / `ENEMIES_DB` | Chỉ số quân & quái |
| `class Unit` | Logic quân: `getStats()` (chỉ số theo cấp), bắn/đánh, **kỹ năng cấp 3** |
| `class Enemy` | Logic quái |
| `ProjLin/ProjLob/FCoin` | Đạn thẳng / đạn vòng cung / đồng xu bay (đều có `draw` + glow) |
| `Engine.draw()` | Vòng vẽ mỗi khung: nền → lưới → ánh sáng phòng thủ → quân/quái → đạn → **lớp ánh sáng & vignette cuối khung** |
| `Engine.drawBackdrop` | Nền cảnh vẽ tay theo map (`_bgForest`, `_bgVolcano`, `_bgDungeon`) |
| `UI` / `Control` | Giao diện, mở/đóng modal, nâng cấp quân, game over... |
| `GAME_VERSION` + auto-update | Kiểm tra `version.json` để báo bản mới |

## 4. ✅ ĐÃ LÀM XONG

### a) Tinh chỉnh màu sắc & ánh sáng trong trận (xong 2026-06-22)
- Mỗi map có **color grade** (ám màu tạo tâm trạng) + **vignette** thống nhất (trước chỉ hầm ngục có).
- **Ánh sáng chủ** hắt từ vùng phòng thủ (mép trái) → chiến trường có chiều sâu.
- **Glow phát sáng** cho đạn thẳng, đạn vòng cung, tia sét, đồng xu vàng.
- Thông số chỉnh nhanh ở `MAPS[]`: `grade`, `vig`, `key`.

### b) Thiết kế tướng — biến đổi theo cấp (XONG 2026-06-22)
Quân có **3 cấp** (level 1→3, nâng ở modal khi chạm vào quân). Trước đây nâng cấp **không
đổi hình dạng**. Nay đã thêm (trong `CharArt`):
- **Cấp 2:** áo sáng hơn, **mọc giáp vai**, **viên đá quý** trên đầu, **hào quang nhẹ dưới chân**, vũ khí dài thêm.
- **Cấp 3:** áo sáng rõ + **vạch năng lượng** giữa thân, **vương miện** trên đầu, **hào quang đập nhịp**
  màu `evo`, **vũ khí phát sáng** (shadow glow) đổi sang màu kỹ năng tối thượng,
  **3 đốm năng lượng** bay quanh, hiệu ứng kỹ năng (sét/tuyết/độc/hào quang...) to & nhiều hơn.
- Màu `evo` của mỗi quân ăn theo **kỹ năng cấp 3** của nó (định nghĩa trong `UNIT_ART`).

> Lưu ý: **Cách tấn công (gameplay)** ở cấp 3 vốn ĐÃ có sẵn trong `class Unit`
> (xuyên thấu, nổ chùm, sét chuỗi, đóng băng, lan độc, phản đòn, đào x2 vàng, hào quang buff).
> Phần vừa làm chủ yếu là **biến đổi HÌNH DẠNG + hiệu ứng hình ảnh** cho khớp với cấp.

## 5. PHIÊN BẢN / CACHE (nhớ bump khi sửa)
Khi sửa code muốn người chơi nhận bản mới, **đổi 3 chỗ**:
1. `sw.js` → `const CACHE = 'kntt-vXX-...'` (tăng số).
2. `index.html` → `const GAME_VERSION = 'X.Y.Z'`.
3. `version.json` → cùng version + ghi `notes`.
- Hiện tại: **CACHE `kntt-v21-hero`**, **GAME_VERSION `1.4.0`**.

## 6. 📋 VIỆC NÊN LÀM TIẾP (TODO)
- [ ] Playtest phần biến đổi tướng theo cấp trên mobile thật (cân chỉnh kích thước vương miện/giáp cho dễ nhìn).
- [ ] Có thể thêm thay đổi **cách tấn công cảm nhận được ở cấp 2** (hiện gameplay chỉ đổi mạnh ở cấp 3).
- [ ] Cân nhắc hiệu ứng "vụ nổ ánh sáng" khi quân lên cấp (hiện chỉ có chữ + hạt vàng).
- [ ] Xem lại hiệu năng glow (shadowBlur) trên máy yếu nếu có nhiều đạn cùng lúc.

## 7. CÁCH CHẠY THỬ
- Mở `index.html` bằng trình duyệt (hoặc chạy server tĩnh để service worker hoạt động).
- Kiểm tra cú pháp JS nhanh: trích khối `<script>` rồi `new Function(...)` bằng Node.
