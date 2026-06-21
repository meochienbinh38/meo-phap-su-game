# 🏰 Kỷ Nguyên Thủ Thành — Tài Liệu Thiết Kế Game (GDD)

> Phiên bản 1.0 · Tài liệu sống (cập nhật liên tục theo quá trình phát triển)
> Nền tảng: HTML5 Canvas + PWA (đã cài được trên điện thoại). Một file → tiến tới kiến trúc module.

Bộ tài liệu gồm 3 phần:
1. **GAME_DESIGN.md** (file này) — tầm nhìn, nội dung, kinh tế, đồ hoạ, âm thanh, kiến trúc, lộ trình.
2. **[PHYSICS.md](./PHYSICS.md)** — đặc tả chi tiết logic vật lý & mô phỏng (phần trọng tâm).
3. **[BALANCE.md](./BALANCE.md)** — công thức số học, bảng cân bằng, đường cong độ khó.

---

## 1. Tầm nhìn & Trụ cột thiết kế

**Câu một dòng (pitch):**
> Một game thủ thành theo *làn ngang* (lane defense) chiến thuật, nhịp nhanh, chơi gọn trong 5–10 phút mỗi ván, *cài được offline trên điện thoại*, với chiều sâu đến từ **kết hợp kỹ năng (synergy)** và **tiến trình vĩnh viễn (meta-progression)**.

**Trụ cột thiết kế (Design Pillars)** — mọi quyết định phải phục vụ ít nhất một trụ cột:

| # | Trụ cột | Ý nghĩa | Hệ quả thiết kế |
|---|---------|---------|-----------------|
| P1 | **Quyết định, không phải bấm loạn** | Người chơi thắng nhờ *đặt đúng quân, đúng làn, đúng lúc* | Tạm dừng được; thời gian chuẩn bị; thông tin rõ ràng |
| P2 | **Phản hồi đã tay (Game Feel/Juice)** | Mỗi hành động có âm thanh, rung, hạt, screen-shake | Đầu tư mạnh vào VFX/SFX, camera shake, hit-stop |
| P3 | **Dễ học, khó thạo** | 30 giây hiểu luật; hàng chục giờ để tối ưu synergy | Onboarding ngắn; chiều sâu ở meta + combo |
| P4 | **Tôn trọng thời gian & pin** | Ván ngắn, offline, nhẹ | Fixed timestep, object pool, giới hạn hạt |

**Cảm xúc mục tiêu:** *"Phòng tuyến sắp vỡ… mình kịp dựng Băng Thần + Tháp Độc và quét sạch!"* — khoảnh khắc xoay chuyển tình thế nhờ kết hợp đúng.

---

## 2. Đối tượng & Nền tảng

- **Người chơi:** game thủ casual–midcore trên điện thoại, thích thủ thành/auto-battler, phiên chơi ngắn.
- **Nền tảng chính:** PWA (Android Chrome, iOS Safari), chơi **ngang màn hình**, hoạt động **offline**.
- **Đầu vào:** chạm 1 ngón (tap để chọn/đặt/nâng cấp). Không cần kéo-thả phức tạp.
- **Hiệu năng mục tiêu:** 60 FPS trên máy tầm trung 4 năm tuổi; ≤ ~300 thực thể động đồng thời.

---

## 3. Bối cảnh & Hướng sáng tạo (Narrative)

Repo mang tên **"Mèo Pháp Sư"** trong khi nội dung hiện tại là thủ thành fantasy chung. Đề xuất **hợp nhất bản sắc** (khuyến nghị, nhưng có thể đổi skin mà không ảnh hưởng cơ chế):

> **Vương Quốc Mèo Pháp Sư.** Các bộ tộc Mèo gìn giữ *Lò Ma Pháp* — nguồn phép thuật của thế giới. Bóng tối (Hắc Thú) tràn từ phương Đông theo từng đợt để cướp Lò. Người chơi là *Đại Pháp Sư Mèo*, triệu hồi và nâng cấp các đơn vị phòng thủ qua 3 vùng đất, cản phá từng đợt cho tới khi đánh bại Trùm Hắc Ám.

**Vì sao nên theo hướng này:**
- Khớp tên repo, tạo IP dễ thương → dễ marketing, dễ làm icon/skin.
- "Pháp sư" giải thích tự nhiên cho cơ chế phép thuật (sét, băng, độc, triệu hồi).
- Tông màu *dễ thương + huyền bí* tương phản tốt với kẻ địch tối → dễ đọc trên màn hình nhỏ.

**Tái chủ đề đơn vị (re-skin, giữ nguyên cơ chế):**

| Cơ chế hiện tại | Skin "Mèo Pháp Sư" |
|---|---|
| Mỏ Vàng ⛺ | Mèo Thợ Mỏ / Cối giã cá khô 🐟 |
| Giáp Sĩ 🛡️ | Mèo Hiệp Sĩ khiên |
| Xạ Thủ 🏹 | Mèo Cung Thủ |
| Pháo Thủ 💣 | Mèo Pháo (ném cá hộp nổ) |
| Tháp Độc ☠️ | Mèo Luyện Đan (sương độc) |
| Thần Sét ⚡ | Mèo Pháp Sư Sấm |
| Băng Thần ❄️ | Mèo Băng Giá |
| Thánh Sứ 🕊️ | Mèo Tăng Lữ (hồi máu) |

> **Quyết định triển khai:** giữ *cơ chế* như thiết kế dưới đây; phần đồ hoạ làm theo skin Mèo. Tài liệu này dùng tên cơ chế trung tính để khỏi ràng buộc.

---

## 4. Vòng lặp chơi (Game Loops)

**Vòng cốt lõi (mỗi vài giây):**
```
Quan sát đợt địch → Quyết định (đặt/nâng cấp/bán/ult) → Tiêu vàng
   → Thấy phản hồi (sát thương, vàng rơi) → Nhận vàng/XP → lặp lại
```

**Vòng phiên chơi (một ván 5–10 phút):**
```
Chọn map → Chuẩn bị (8s) → Đợt 1..N (xen kẽ pha chuẩn bị) → Trùm mỗi 5 đợt
   → Thua/Dừng → Nhận SP theo cấp đã lên → Cập nhật kỷ lục
```

**Vòng meta (qua nhiều ván):**
```
Tích SP → Mở/nâng Nội Tại vĩnh viễn → Vào ván sau mạnh hơn
   → Đạt đợt xa hơn → Mở nội dung mới (map/quân/skin)
```

Cả ba vòng đã tồn tại ở mức cơ bản trong code. GDD này chuẩn hoá và mở rộng chúng.

---

## 5. Cơ chế cốt lõi (đang có) & mở rộng

### 5.1 Sân chơi
- Lưới **6 hàng × 11 cột** (xem PHYSICS §2). Địch đi **từ phải sang trái** theo *làn = hàng*.
- "Thành trì" ở mép trái. Địch chạm mép trái → trừ máu nhà theo `dmg` của địch.
- **Vật cản** (đá/cây/bia mộ) chiếm ô, không đặt quân được — tạo biến hoá bố cục theo map.

### 5.2 Đơn vị (Units) — vai trò
8 đơn vị hiện có, phân theo **archetype** rõ ràng (xem bảng số ở BALANCE.md):

| Vai trò | Đơn vị | Chức năng chiến thuật |
|---|---|---|
| Kinh tế | Mỏ Vàng | Tạo vàng định kỳ; nền tảng "snowball". Giới hạn 5. |
| Chắn (Tank/Block) | Giáp Sĩ | Máu cao, **chặn làn**, cận chiến; Lv3 phản đòn. |
| Sát thương đơn (single-target) | Xạ Thủ | Bắn thẳng theo làn; Lv3 **xuyên thấu**. |
| Sát thương diện (AoE) | Pháo Thủ | Đạn nổ; Lv3 **nổ chùm**. |
| Kiểm soát (Control) | Tháp Độc | Xung quanh theo vùng; Lv3 **làm chậm**. |
| Sát thương xuyên làn | Thần Sét | Đánh **mọi làn** trong tầm; Lv3 **sét dây chuyền**. |
| Làm chậm/AoE | Băng Thần | Đạn vòng cung nổ + đóng băng; Lv3 **bão tuyết**. |
| Hỗ trợ (Support) | Thánh Sứ | Hồi máu đồng minh yếu nhất; Lv3 **hào quang buff**. |

**Hệ thống cấp đơn vị:** mỗi đơn vị nâng tối đa **Lv3**. Lv3 mở **kỹ năng đặc tả** (định tính, tạo "wow"). Chi phí nâng: `cost × 1.5^level`.

**Đề xuất mở rộng nội dung (lộ trình M2+):**
- **Hệ nguyên tố & khắc chế:** Lửa / Băng / Độc / Sét / Vật lý + giáp/kháng (xem §8 và BALANCE). Hiện game chưa có giáp/kháng → thêm chiều sâu.
- **Synergy theo lân cận:** mở rộng ý tưởng hào quang Thánh Sứ thành *bàn cờ synergy* (đặt cạnh nhau để cộng hưởng), tạo quyết định bố cục sâu hơn (P1, P3).
- **Đơn vị mới gợi ý:** *Cung Thủ Đa Mục Tiêu* (multi-shot), *Bẫy* (đặt trên ô địch đi qua, kích nổ vật lý), *Lá Chắn Năng Lượng* (tường tạm thời chặn làn — thuần vật lý va chạm).

### 5.3 Tài nguyên & hành động người chơi
- **Vàng (🪙):** đặt/nâng cấp/bán. Nguồn: giết địch, Mỏ Vàng, thưởng dọn đợt, **"Gọi Sớm"** (bỏ thời gian chuẩn bị để lấy vàng thưởng — đánh đổi rủi ro/phần thưởng, P1).
- **Bán:** hoàn 50% tổng đầu tư.
- **Tối thượng (Ultimate) ☄️ Thiên Thạch:** sát thương diện toàn màn, hồi chiêu 25s. Là "nút cứu nguy".
- **XP & Cấp người chơi:** giết địch → XP → lên cấp → **+1 SP** (điểm nội tại). Đây là cầu nối in-run ↔ meta.

### 5.4 Nội tại vĩnh viễn (Meta)
4 nhánh hiện có: Vũ Khí (+dmg), Cuồng Nộ (+tốc đánh), Gia Cố (+máu nhà), Chí Mạng (+bạo kích). **Lưu vĩnh viễn** (localStorage).
- **Đề xuất:** chuyển thành **cây nội tại** có nhánh & điều kiện mở khoá; thêm nội tại theo *hệ* và theo *vai trò* để khuyến khích nhiều lối chơi.

---

## 6. Thiết kế đợt & kẻ địch (Waves & Enemies)

### 6.1 Kẻ địch hiện có (hành vi)
| Địch | Đặc tính cơ chế |
|---|---|
| Tiểu Quỷ 👺 | Cơ bản, số đông |
| Orc 👹 | Máu cao, chậm (tank) |
| Sói 🐺 | Rất nhanh (gây áp lực thời gian) |
| Khiên Xương 💀 | **Chặn N đòn đầu** (shieldHits) — buộc dồn sát thương |
| Triệu Hồi Sư 🧙 | **Đẻ lính** định kỳ — ưu tiên diệt sớm |
| Thích Khách 🥷 | Nhanh + **né đòn** + **nhảy xuyên** qua lính chặn |
| Trùm 👿 | Máu khủng, đánh mạnh; xuất hiện mỗi 5 đợt |

### 6.2 Nguyên tắc thiết kế đợt
- **Đường cong áp lực:** mỗi đợt là một "nhịp"; xen kẽ đợt *số đông* (cần AoE) và đợt *tank* (cần dồn sát thương) để xoay vòng giá trị các đơn vị (P1, P3).
- **Giới thiệu dần:** loại địch mới xuất hiện theo ngưỡng đợt (đang có: `w<3`, `w<6`, `w≥6`). Mỗi loại mới nên đi kèm gợi ý đối phó.
- **Trùm = bài kiểm tra tổng hợp:** buộc người chơi đã chuẩn bị kinh tế + sát thương + kiểm soát.
- **Hệ số máu theo đợt:** `hpMul = 1.22^(wave-1)` (cấp số nhân) — xem BALANCE để cân với đường cong sát thương người chơi nhằm tránh "tường độ khó".

### 6.3 Mở rộng (M2+)
- **Đợt tinh hoa (Elite)** với *từ khoá* (Affix): nhanh hơn, hồi máu, kháng băng… như roguelite.
- **Sự kiện giữa đợt:** chọn 1 trong 3 phần thưởng (vàng / giảm giá / buff tạm) → quyết định, đa dạng ván chơi.
- **Map có cơ chế riêng:** Núi Lửa gây sát thương lan; Hầm Ngục giảm tầm nhìn (đã có nền `weather`), biến môi trường thành biến số chiến thuật.

---

## 7. Tiến trình, Kinh tế & Mở khoá

**Kinh tế in-run** (snowball có kiểm soát):
- Vàng đầu: 250. Mỏ Vàng là khoản *đầu tư* (trả dần) ↔ phòng thủ ngay. Đánh đổi cổ điển của thể loại.
- Thưởng dọn đợt: `50 + wave×20`. "Gọi sớm": `floor(timer×4)`.

**Tiến trình dài hạn:**
- **Kỷ lục theo map** (đã lưu) → mục tiêu tự thân ("đẩy xa hơn").
- **SP → Nội tại** → sức mạnh nền tăng dần (meta power).
- **Mở khoá đề xuất:** quân/skin/map mở theo cột mốc đợt hoặc thành tựu (không trả phí — đạo đức, tôn trọng người chơi).

**Định cỡ độ khó (xem BALANCE.md):** giữ "điểm thua trung bình" của người mới quanh đợt 8–12, người thạo 25+. Tinh chỉnh bằng `hpMul`, mật độ đợt, và sức mạnh nội tại.

---

## 8. Hệ thống số & Cân bằng (tóm tắt — chi tiết ở BALANCE.md)

- **Công thức sát thương đề xuất** (thêm giáp/kháng để có chiều sâu):
  ```
  finalDmg = baseDmg × dmgMul × critMul × (1 - resist[type]) − armor
  finalDmg = max(finalDmg, baseDmg × 0.05)   // sàn 5% tránh "miễn nhiễm"
  ```
  Hiện tại chưa có `armor/resist` → đây là hướng mở rộng quan trọng để tạo khắc chế.
- **Nhân theo cấp đơn vị:** `lvMul = 1.4^(level-1)`.
- **Nhân nội tại:** dmg `+10%/cấp`, tốc đánh `+5%/cấp`, bạo kích nền `10% + 5%/cấp`.
- **DPS hiệu dụng:** `DPS = finalDmg / aspd` (aspd = giây/đòn). BALANCE.md có bảng DPS từng đơn vị theo cấp để so trực quan.

---

## 9. Hướng nghệ thuật & Đồ hoạ (Art Direction)

### 9.1 Phong cách
- **"Flat + Glow chibi":** hình khối phẳng, bo tròn, viền mềm, **phát sáng (bloom giả)** cho phép thuật. Nhân vật *đầu to thân nhỏ* (chibi) → dễ thương + dễ đọc ở kích thước nhỏ (khớp P3 và bản sắc Mèo).
- Hiện game vẽ bằng **emoji + canvas primitives**. Đây là *lựa chọn tốt cho prototype* (nhẹ, không cần asset), nhưng để đạt "10/10" cần **bộ sprite riêng**.

### 9.2 Lộ trình tài sản đồ hoạ
1. **Giai đoạn prototype (hiện tại):** emoji + hình vẽ canvas. Giữ để chơi được ngay.
2. **Giai đoạn art pass:** thay bằng **sprite sheet** (PNG/WebP) cho đơn vị/địch, mỗi thực thể 2–4 khung (idle, attack, hit, die). Vẽ vector (SVG) → xuất PNG @1x/@2x.
3. **VFX:** giữ hệ hạt canvas (đã có) + thêm *sprite VFX* cho nổ/sét/băng. Tách "lớp VFX" riêng để bật/tắt theo cấu hình hiệu năng.

### 9.3 Bảng màu theo vùng (đảm bảo độ tương phản địch ↔ nền)
| Vùng | Nền | Tông chủ đạo | Nhấn |
|---|---|---|---|
| Rừng Mưa 🌲 | `#022c22` xanh thẫm | xanh lá/teal | giọt mưa xám sáng |
| Núi Lửa 🌋 | `#2a0404` đỏ thẫm | cam/đỏ | tàn lửa cam |
| Hầm Ngục 🪦 | `#170836` tím thẫm | tím/chàm | vignette tối + đốm sáng |

- **Quy tắc đọc nhanh (readability):** địch luôn **ấm/đỏ**, quân nhà luôn **lạnh/sáng**, phép thuật có **glow màu hệ**. Thanh máu địch đỏ, máu quân xanh. Không bao giờ để địch lẫn vào nền.

### 9.4 Animation & "Game Feel"
- **Squash & stretch** khi tấn công/lên cấp (đang có `anim`, `bounce`, `lunge` — giữ và mở rộng).
- **Hit-stop** (đóng băng 30–60ms khi đòn mạnh trúng) → tăng "lực".
- **Screen shake** theo cường độ sự kiện (đã có `State.shake`).
- **Tween UI** cho mọi panel (đã có `floatIn`).
- **Number juice:** số sát thương bay, bạo kích to & đỏ (đã có).

### 9.5 UI/UX trên màn hình nhỏ
- Vùng chạm tối thiểu **44×44px** (chuẩn cảm ứng). Nút điều khiển nổi (pause/speed/sound/full) đã đạt.
- HUD 3 cụm: tài nguyên (trái) / trạng thái đợt (giữa) / cấp (phải) — giữ.
- **An toàn lề (safe-area)** đã xử lý cho tai thỏ/đáy. 
- **Onboarding:** ván đầu có *chỉ dẫn theo bước* (highlight nút Quân → ô đặt → đợt đầu chậm hơn). Hiện chưa có → ưu tiên M1.
- **Khả năng tiếp cận:** chế độ *giảm hiệu ứng* (tắt shake/hạt), *mù màu* (đổi cặp màu địch/quân sang xanh/cam thay đỏ/lục).

---

## 10. Âm thanh (Audio)

- **Hiện trạng:** hiệu ứng tổng hợp Web Audio + nhạc nền arpeggio (đã có, bật/tắt được). Ưu điểm: 0 byte tải thêm, offline tốt.
- **Lộ trình:**
  - **Nhạc thích ứng:** lớp nhạc tăng cường độ khi đợt cao điểm / khi Trùm xuất hiện.
  - **Thư viện SFX có chủ đích:** nhóm theo *hệ* (sét/băng/độc) để nhận diện bằng tai.
  - **Mixing:** ducking nhạc khi có sự kiện lớn; giới hạn số voice đồng thời tránh chói.

---

## 11. Kiến trúc kỹ thuật (Technical Design)

### 11.1 Hiện trạng
- **Một file `index.html`** (~1000 dòng): HTML + CSS (Tailwind CDN) + JS. PWA hoàn chỉnh (`manifest.json`, `sw.js`, icon).
- Vòng lặp: `requestAnimationFrame` với **dt biến thiên** (cap 0.05), nhân `speed` bằng cách *lặp update*.
- Trạng thái tập trung trong object `State`; thực thể là class `Unit/Enemy/ProjLin/ProjLob/FCoin`.

### 11.2 Vấn đề & hướng tái cấu trúc
| Vấn đề | Rủi ro | Giải pháp |
|---|---|---|
| dt biến thiên + nhân tốc độ | **Tunneling**, mô phỏng không xác định | **Fixed timestep + accumulator** (xem PHYSICS §3) |
| Va chạm O(n²) quét toàn bộ địch | Tụt FPS khi đông | **Spatial hash theo làn** (PHYSICS §6) |
| Tạo/huỷ object liên tục (đạn, hạt) | GC giật hình | **Object pooling** |
| Một file khổng lồ | Khó mở rộng/test | Tách **module ES**: `core/`, `entities/`, `systems/`, `render/`, `ui/`, `audio/`, `data/` |
| Logic lẫn render | Khó tối ưu/đổi skin | Tách **mô phỏng** ↔ **render** (render nội suy giữa 2 bước, PHYSICS §3.4) |

**Cấu trúc thư mục đề xuất:**
```
src/
  core/      loop.js (fixed timestep), rng.js (seeded), math.js
  data/      units.js, enemies.js, waves.js, maps.js, talents.js  (data-driven)
  systems/   movement.js, combat.js, projectiles.js, status.js, spawn.js, economy.js
  entities/  unit.js, enemy.js, projectile.js
  render/    renderer.js, vfx.js, camera.js
  ui/        hud.js, shop.js, modals.js
  audio/     sound.js, music.js
  state.js, save.js, pwa.js, main.js
docs/        (tài liệu này)
assets/      sprites/, audio/  (giai đoạn art pass)
```
> **Data-driven:** đưa chỉ số đơn vị/địch/đợt ra file dữ liệu thuần → cân bằng game không cần sửa logic; dễ thêm nội dung.

### 11.3 Lưu trữ & cập nhật
- **Save versioning:** khoá `kntt_v17` → thêm `schemaVersion` + hàm *migrate* khi đổi cấu trúc (tránh hỏng save người chơi).
- **PWA update flow:** khi `sw.js` đổi cache version, hiện *toast "Có bản mới — chạm để cập nhật"* thay vì cập nhật âm thầm.
- **Telemetry (tuỳ chọn, tôn trọng riêng tư):** đếm cục bộ đợt thua/đơn vị hay dùng → tinh chỉnh cân bằng. Không gửi đi nếu không có đồng ý.

---

## 12. Lộ trình phát triển (Roadmap)

| Mốc | Mục tiêu | Hạng mục chính | Tiêu chí hoàn thành |
|---|---|---|---|
| **M0 ✅** | Nền tảng chơi được + PWA | (đã xong) sửa bug, âm thanh, lưu, cài điện thoại | Cài được trên điện thoại, 0 lỗi runtime |
| **M1** | Cốt lõi vững & "đã tay" | Fixed timestep, object pool, **onboarding**, hit-stop, polish | 60 FPS ổn định; người mới hiểu luật < 60s |
| **M2** | Chiều sâu chiến thuật | Hệ nguyên tố + giáp/kháng, synergy lân cận, affix đợt | Có khắc chế rõ; ≥ 3 lối build khả thi |
| **M3** | Nội dung & bản sắc | Skin "Mèo Pháp Sư", sprite riêng, map cơ chế, nhạc thích ứng | Bộ art nhất quán; 3 map có cơ chế riêng |
| **M4** | Giữ chân & mở rộng | Cây nội tại, mở khoá, thành tựu, chế độ vô tận/thử thách | Vòng meta hấp dẫn; lý do quay lại hằng ngày |

**Việc làm ngay sau tài liệu này (đề xuất M1, ưu tiên giảm dần):**
1. Tách mô phỏng sang **fixed timestep** (xem PHYSICS §3) — *nền móng cho mọi thứ sau*.
2. **Object pool** cho đạn/hạt + **spatial hash** cho va chạm.
3. **Onboarding** 3 bước ở ván đầu.
4. **Hit-stop + AoE falloff** (PHYSICS §7–8) để combat "đã" và công bằng hơn.

---

## 13. Rủi ro & Giảm thiểu

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Phình tính năng (scope creep) | Cao | Bám 4 trụ cột; mọi tính năng phải phục vụ ≥1 trụ cột |
| Cân bằng vỡ khi thêm hệ/giáp | Trung | Data-driven + bảng DPS + playtest theo mốc |
| Hiệu năng trên máy yếu | Trung | Pool + spatial hash + giới hạn hạt + chế độ giảm hiệu ứng |
| Phụ thuộc Tailwind CDN khi offline | Thấp | SW đã cache; cân nhắc build CSS tĩnh ở M3 |
| Hỏng save khi đổi cấu trúc | Trung | schemaVersion + migrate |

---

## 14. Chỉ số thành công (KPIs)

- **Kỹ thuật:** ≥ 60 FPS p95; thời gian tải lần đầu < 2s; chạy offline 100%.
- **Trải nghiệm:** tỉ lệ hoàn thành ván đầu (FTUE) cao; thời lượng phiên 5–10 phút; quay lại ngày-2.
- **Chiều sâu:** ≥ 3 lối build khả thi ở M2; người chơi dùng đa dạng đơn vị (không "một quân thống trị").

---

*Xem [PHYSICS.md](./PHYSICS.md) cho đặc tả vật lý/mô phỏng và [BALANCE.md](./BALANCE.md) cho công thức & bảng cân bằng.*
