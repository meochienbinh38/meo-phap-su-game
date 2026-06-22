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

### c) Cử động tấn công chi tiết + vùng tấn công theo đặc tính (XONG 2026-06-22)
**Cử động tấn công** (trong `CharArt.drawUnit` + `drawWeapon`): mỗi kiểu vũ khí có chuyển động riêng
ngoài việc vung vũ khí — lao tới/nhảy/chúi người (kiếm), nhún (cuốc), ngả ra sau (cung), giật lùi & rung
(pháo), thọc gậy lên-tới (pháp sư). Kiếm có **vệt chém kép** (1 đậm + 1 mờ). Biến `atk = sin(p·π)`,
`lungeX`/`hopY`/`lean` điều khiển thân; vũ khí dùng `p` (tiến trình đòn).

**Vùng tấn công** (sửa `range` trong `UNITS_DB`, lưới rộng 11 cột) — chia tầng rõ ràng:
| Quân | Vai trò | range (ô) | Phạm vi |
|------|---------|-----------|---------|
| Giáp Sĩ | Cận chiến (tank) | 1.2 | ô kề trước |
| Tháp Độc | Quầng độc quanh mình | 2.6 | mọi hàng trong bán kính |
| Thánh Sứ | Hỗ trợ/hồi máu | 3.0 | đồng minh quanh mình |
| Băng Thần | Tầm trung (đạn vòng) | 6.0 | theo hàng |
| Pháo Thủ | Tầm trung-xa (nổ) | 6.5 | theo hàng |
| Thần Sét | **Toàn bản đồ, MỌI hàng** | 12 | bất kỳ địch nào (pháp sư) |
| Xạ Thủ | **Toàn hàng ngang map** | 13 | sniper theo hàng |
> Đạn (Xạ Thủ/Pháo/Băng) chỉ bắn **cùng hàng**; Thần Sét (laser) bắn **mọi hàng**; Tháp Độc là
> vòng tròn quanh mình. Vòng tầm đánh hiện ra khi chạm chọn quân.

### d) Làm rõ động tác tấn công + cân bằng lại độ khó (XONG 2026-06-22)
**Động tác tấn công** (`CharArt.drawUnit`/`drawWeapon`): viết lại theo nhịp 3 pha rõ ràng
**LẤY ĐÀ → GIÁNG ĐÒN → THU VỀ**. Hai biến điều khiển:
- `draw`  = pha lấy đà (đầu nhịp): kiếm nhổng cao, cung kéo căng dây, pháp sư lùi niệm chú.
- `strike`= đỉnh giáng đòn (giữa nhịp, p≈0.55): kiếm bổ xuống + lao tới, cung buông tên, pháo giật nòng,
  pháp sư thọc gậy tới. Vệt chém/khói/chớp sáng nhất đúng lúc `strike` đạt đỉnh.
- Nhịp đánh kéo dài ~0.28s (đổi `this.anim -= dt*3.6`) để mắt kịp thấy.

**Cân bằng lại (game trước quá dễ)** — chỉnh ở `Engine.buildWave`, vòng `update`, và nút nâng cấp:
| Hạng mục | Cũ | Mới |
|----------|----|-----|
| Máu quái theo đợt | `1.22^(w-1)` | **`1.27^(w-1)`** (quái dày máu hơn rõ) |
| Số quái mỗi đợt | `10 + w*2` | `10 + round(w*2.3)` |
| Sát thương quái vào thành | cố định | **× `(1 + (w-1)*0.12)`** (rò rỉ cuối game rất đau) |
| Thưởng dọn đợt | `50 + w*20` | `25 + w*9` (bớt tiền chùa) |
| Giá nâng cấp quân | `cost × 1.5^lv` | **`cost × 1.7^lv`** (nâng cấp là lựa chọn thật sự) |
> Vàng rơi mỗi quái vẫn cố định → quái trâu hơn nghĩa là vàng/giây giảm tự nhiên, kinh tế chặt hơn.
> ⚠️ **Cần playtest**: nếu đến đợt ~15-20 thấy quá khó (máu 1.27^w tăng nhanh) thì hạ về 1.25.

### e) Cân bằng lại bằng MÔ PHỎNG (XONG 2026-06-22)
Viết `tools/balance-sim.js` — "chơi" game tự động bằng đúng cơ chế (di chuyển/chặn/đánh, AoE,
xuyên, chuỗi, làm chậm, đạn bay + overkill, kinh tế). Chạy: `node tools/balance-sim.js`.
**Phát hiện**: đường cong cũ là "phẳng lì rồi vách đứng" — dễ tới ~đợt 14 (0 rò rỉ, ôm **12.000 vàng**
thừa, quân max từ đợt 8) rồi chết ngay 1 đợt. Gốc rễ: kinh tế quá rộng + **Xạ Thủ rẻ bắn toàn map + xuyên**
phủ mọi lane + sức mạnh người chơi có TRẦN trong khi máu quái tăng mũ 1.27^w.

**Đã chỉnh (giá trị do sim tinh chỉnh):**
| Thông số | Cũ | Mới |
|----------|----|-----|
| Máu quái/đợt | `1.27^w` | **`1.18^w`** (bỏ vách đứng) |
| Tốc độ quái | cố định | **× `(1+(w-1)*0.05)`** (nhanh dần → rò rỉ tăng từ từ) |
| Số quái/đợt | `10+round(2.3w)` | `10+round(2.5w)` |
| ST vào thành | `×(1+(w-1)*0.12)` | `×(1+(w-1)*0.09)` |
| Thưởng dọn đợt | `25+9w` | `15+6w` |
| Mỏ vàng | 15/lần, trần 5 | **12/lần, trần 4** |
| Vàng rơi | × talent Vũ Khí (lỗi) | **cố định** (đã sửa lỗi) |
| **Xạ Thủ** | tầm 13 (toàn map), 80đ | **tầm 7, 90đ** (sniper 1 lane) |
| Thần Sét | tầm 12 mọi hàng | giữ — **DUY NHẤT** bắn toàn map |
> Kết quả sim (chơi tối ưu = cận trên): đầu game căng, vàng luôn < ~400 (mỗi mua là quyết định thật),
> đuôi giảm dần, thua ~đợt 19. Người thật (không hoàn hảo) sẽ gặp thử thách sớm hơn ~đợt 12-16.
> ⚠️ Sim **lạc quan** (đạn trúng tức thì, nhắm/xây hoàn hảo) → đừng chỉnh khó hơn nữa nếu chưa playtest thật.

### f) HỆ KHẮC CHẾ — chọn đúng tướng + kết hợp mới qua ải (XONG 2026-06-22)
Biến độ khó thành "dùng đúng tướng khắc từng loại quái, kết hợp mới qua". Kiểm chứng bằng sim:
**spam Xạ Thủ chết đợt 14, kết hợp đủ loại tới đợt 21** (+7 đợt).

**Cơ chế (trong `Enemy.takeDmg(amt, dtype, proj)`):**
- Mỗi tướng có `dtype`: phys (Giáp Sĩ/Xạ Thủ/Pháo), magic (Thần Sét), frost (Băng), pois (Tháp Độc).
- Mỗi quái có `resist{dtype:hệ số}` (<1 = KHÁNG, >1 = YẾU/khắc tinh). Hiện chữ "KHÁNG" khi đánh sai loại.
- `proj=true` (đạn phys/frost) mới bị **NÉ** (Sát Thủ); magic/độc/cận chiến **không bị né**.
- Khiên (Bộ Xương) chặn theo **số đòn** → đòn nhanh (Xạ Thủ/Độc) bóc tốt, đòn to chậm phí.

**Khắc tinh từng quái** (xem `ENEMIES_DB.resist`):
| Quái | Kháng | Khắc tinh (nên dùng) |
|------|-------|----------------------|
| 👺 Imp (bầy đàn) | — | AoE: Pháo/Băng/Độc |
| 👹 Orc (giáp dày) | phys/frost/độc | **THẦN SÉT** (magic ×1.4) |
| 🐺 Sói (siêu nhanh) | phys | **BĂNG** (frost ×1.6 + làm chậm) |
| 💀 Bộ Xương (khiên) | frost | **Xạ Thủ/Độc** (đòn nhanh bóc khiên) |
| 🧙 Triệu Hồi | phys | **THẦN SÉT** (magic ×1.5) |
| 🥷 Sát Thủ (né+nhảy) | phys | **ĐỘC/SÉT** (không bị né) |
| 👿 Trùm | tất cả (nhẹ) | **KẾT HỢP** nhiều loại |

**Đợt theo CHỦ ĐỀ** (`WAVE_THEMES` + `waveTheme(w)`): nhập môn → BẦY ĐÀN → GIÁP DÀY → TỐC ĐỘ →
HỖN HỢP, TRÙM mỗi 5 đợt. HUD hiện tag chủ đề khi chuẩn bị + câu gợi ý khắc tinh khi đợt bắt đầu
→ người chơi biết nên mang tướng gì.
> Cân chỉnh resist/chủ đề trong `tools/balance-sim.js` (UNITS/ENEMIES/waveTheme) rồi chép sang game.

### g) ĐỘ KHÓ SCALE THEO NỘI TẠI — vá lỗ hổng "người chơi max talent" (XONG 2026-06-22)
Phát hiện (qua ảnh người chơi): **Nội Tại Vĩnh Viễn** (talent lưu vĩnh viễn) khi MAX cho +100% sát thương,
+50% tốc đánh, +25% bạo kích, +500 máu nhà → mạnh **~×3.7**. Sim trước giả định talent khiêm tốn nên
chưa thấy: với tài khoản max, game vẫn quá dễ + dư vàng (2699). **KHÔNG phải do màn nhỏ.**

**Sửa:** `metaPow()` = 1 + 0.10·d + 0.06·s + 0.06·c (max ≈ ×2.9). Quái mạnh theo:
- máu quái `hm *= metaPow()`, số quái `×(1+(mp-1)*0.25)`, sát thương vào thành `×(1+(mp-1)*0.5)`.
- => Max Nội Tại = đi XA hơn (vẫn thắng người mới ~+4 đợt) chứ KHÔNG dễ hơn. HUD hiện "ĐỘ KHÓ ×2.9".

Sim v2 nay mô phỏng cả 2 hồ sơ (`run(strat, profile)` với profile 'fresh'/'maxed'):
| | spam 1 loại | kết hợp khắc chế |
|--|--|--|
| Nội Tại fresh | sụp đợt ~13 | ~15 |
| Nội Tại maxed | sụp đợt ~13 | ~17-19 |
> Vàng giờ chặt cho cả người max (38-412, hết cảnh dư 2699).

### h) NHỊP ĐỘ chậm→bùng nổ + GIÁ LŨY TIẾN (bỏ cap) (XONG 2026-06-22)
Phản hồi người chơi: chờ tiền mòn mỏi, đợt 1 quái đã tràn cả map, mua được 4 Mỏ Vàng ngay. Sửa:
- **Giá mua lũy tiến** `unitCost(typeId) = base × 1.11^(số con cùng loại)`: BỎ giới hạn Mỏ Vàng;
  mỗi con mua thêm đắt hơn con trước → tự chống snowball + khuyến khích đa dạng (hợp hệ khắc chế).
  Shop hiện giá kế tiếp động.
- **Nâng cấp đắt hơn**: `base × 1.8^level` (trước 1.7).
- **Nhịp độ**: số quái `4 + 1.4w + 0.13w²` (đợt1≈9, đợt10≈31, đợt20≈84, cuối >150);
  giãn cách ra quái `max(0.35, 1.9 - 0.08w)` (đầu ~1.8s rỉ rả → cuối 0.35s lũ lượt).
- **Thu nhập rộng tay hơn** (bù cho giá lũy tiến, để luôn có cái mua, mạch mượt):
  vàng đầu 250→**280**, máu thành gốc 100→**150** (người mới sống lâu hơn để học),
  thưởng đợt `20+8w`, Mỏ Vàng 12→**14**/lần. Máu quái `1.16^w` (đồng bộ sim).

**Sim (node tools/balance-sim.js) — điểm sụp trung bình:**
| | spam 1 loại | kết hợp khắc chế |
|--|--|--|
| Nội Tại mới | ~6-7 | ~10-13 |
| Nội Tại MAX | ~6 | ~17-23 |
> Đường cong maxed: đợt 1-3 rò vài con (học), 4-9 ổn định, 10+ căng dần, 17-23 BÙNG NỔ (124-155 quái/đợt).
> ⚠️ Còn tồn: cuối game (đợt ~17+) khi bàn đầy & full nâng cấp thì vàng lại dư (thiếu chỗ tiêu) — TODO.

### i) Làm lại CHIẾN ĐẤU QUÁI & TRÙM — footprint 2 hàng + kỹ năng Trùm (XONG 2026-06-22)
Sửa lỗi: Trùm to chiếm 2 ô nhưng chỉ 1 hàng bắn được, và "đi xuyên" qua tướng không đánh.
- Quái lớn (`size>=1.2`, Trùm) có `rowSpan=2` → `occRow(row)` cho biết nó che hàng nào.
  - Bắn được từ MỌI hàng nó che (Unit targeting + dải trúng đạn ProjLin theo `rowSpan`).
  - Chặn & ĐÁNH tướng ở cả 2 hàng (Trùm quật mọi tướng kề trước mặt trên 2 hàng).
  - `y` đặt ở TÂM footprint (giữa 2 hàng).
- **Kỹ năng Trùm** (`bossSkills`): GIẬM ĐẤT (AoE quanh mình + choáng 0.6s), TRIỆU HỒI (gọi 2 Sói),
  CUỒNG NỘ (máu <40% → nhanh hơn + đánh dồn). Đếm `skillCd` ~5s (cuồng nộ 3s).
> Lưu ý: sim chưa mô phỏng footprint/kỹ năng Trùm (đó là cơ chế, không phải đường cong kinh tế).
> Trùm giờ MẠNH hơn nhiều ở đợt boss (mỗi 5 đợt) → cần playtest xem có quá gắt không.

## 5. PHIÊN BẢN / CACHE (nhớ bump khi sửa)
Khi sửa code muốn người chơi nhận bản mới, **đổi 3 chỗ**:
1. `sw.js` → `const CACHE = 'kntt-vXX-...'` (tăng số).
2. `index.html` → `const GAME_VERSION = 'X.Y.Z'`.
3. `version.json` → cùng version + ghi `notes`.
- Hiện tại: **CACHE `kntt-v28-boss`**, **GAME_VERSION `2.1.0`**.

## 6. 📋 VIỆC NÊN LÀM TIẾP (TODO)
- [ ] Sink vàng cuối game (đợt ~17+ bàn đầy thì dư vàng): vd bán/đổi, lính tinh nhuệ giá cao, hoặc nâng cấp cấp 4.
- [ ] **Playtest thật** hệ khắc chế: đợt GIÁP DÀY/TỐC ĐỘ đầu tiên (đợt ~6-9) có dễ mua kịp Thần Sét/Băng không?
      Nếu wall người mới → nới resist (vd orc phys 0.45→0.55) hoặc dời chủ đề khó ra sau.
- [ ] Cân nhắc hiện bảng "khắc tinh" nhỏ trong cửa hàng (icon loại sát thương từng tướng) để người mới học nhanh.
- [ ] Số damage nổi hiện đang là trước-kháng; có thể đổi sang sau-kháng để phản hồi rõ hơn.
- [ ] Có thể hiện nhãn "tầm đánh" ngay trong cửa hàng để người chơi biết trước khi mua.
- [ ] Playtest phần biến đổi tướng theo cấp trên mobile thật (cân chỉnh kích thước vương miện/giáp cho dễ nhìn).
- [ ] Có thể thêm thay đổi **cách tấn công cảm nhận được ở cấp 2** (hiện gameplay chỉ đổi mạnh ở cấp 3).
- [ ] Cân nhắc hiệu ứng "vụ nổ ánh sáng" khi quân lên cấp (hiện chỉ có chữ + hạt vàng).
- [ ] Xem lại hiệu năng glow (shadowBlur) trên máy yếu nếu có nhiều đạn cùng lúc.

## 7. CÁCH CHẠY THỬ
- Mở `index.html` bằng trình duyệt (hoặc chạy server tĩnh để service worker hoạt động).
- Kiểm tra cú pháp JS nhanh: trích khối `<script>` rồi `new Function(...)` bằng Node.
