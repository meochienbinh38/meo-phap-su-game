# 📒 GHI CHÚ TIẾN ĐỘ — Game "Kỷ Nguyên Thủ Thành" (Mèo Pháp Sư)

> File này ghi lại **làm tới đâu, làm gì, ở đâu** để bất kỳ ai (hoặc AI) tiếp nhận
> sau này đều biết tình trạng dự án. **Cập nhật file này mỗi khi làm xong một việc.**

Cập nhật lần cuối: **2026-06-23**

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

### j) HỆ KỸ NĂNG 2 BẢNG: Nội Tại chung + Kỹ năng từng tướng (XONG 2026-06-22)
Màn "Nội Tại Vĩnh Viễn" giờ có **2 tab** (`openTalents`, biến `UI._talTab`):
- **🌐 CHUNG**: 4 talent toàn cục cũ (`TALENTS_DB`: Vũ Khí/Cuồng Nộ/Gia Cố/Chí Mạng).
- **🐱 TỪNG TƯỚNG**: 10 tướng × **3 bậc kỹ năng** (`UNIT_SKILLS`), dồn đủ SP mở khoá từng bậc.
  Bậc 1-2 cộng số (dmg/máu/tốc/tầm/thu nhập/nổ...), **bậc 3 = kỹ năng "chữ ký"** mở đặc tính cấp 3 ngay từ cấp 1
  (Xuyên Sớm/Nổ Sớm/Sét Chẻ/Đóng Băng/Độc Tố/Thánh Quang/Rễ Thiêng/Cuồng Phong) hoặc buff mạnh (Khiên Gai phản đòn, Khẩn Trương -25% cd đào).
  Từ v3.8, đủ 3 bậc kỹ năng cũng mở **Hoá Thần cấp 4** cho tướng đó trong trận.
- Hiệu ứng gom trong `unitSkillBonus(type)` → áp ở `getStats()` + các nhánh combat (ProjLin pierce/expl/splash,
  ProjLob freeze/slow, laser chain, pulse slow, support aura, melee reflect). Lưu ở `State.unitSkills` (Storage).
- **SP**: vẫn từ lên cấp (`gainXp` +1 SP/cấp, vĩnh viễn). Bậc kỹ năng giá 2/4/7 SP.
- Ghi chú lịch sử: `diffScale()` từng dùng để scale độ khó theo kỹ năng. Từ campaign đi màn, độ khó dùng `STAGES[].mul`; kỹ năng là sức mạnh người chơi và có thể mở Hoá Thần.

**Sim (đã thêm hồ sơ `godlike` = max hết):** spam<kết-hợp ở mọi mức; kết hợp: mới ~13, cày max ~28 đợt.
> Núm chỉnh: `0.02` (độ khó/bậc kỹ năng) trong `diffScale`, và giá SP từng bậc trong `UNIT_SKILLS`.

### k) CHUYỂN SANG CAMPAIGN ĐI MÀN (Phần A — XONG 2026-06-22)
Đổi từ "thủ thành vô tận" sang **game đi màn + cày Tinh Thạch + mở khoá tướng**.
- **STAGES[]** (16 màn): mỗi màn có `waves` (số đợt phải qua), `mul` (hệ số máu quái — ĐỘ KHÓ THEO MÀN,
  KHÔNG theo kỹ năng nữa), `themes` (chủ đề từng đợt), `rec` (tướng khắc tinh nên có), `reward` (Tinh Thạch),
  `boss`. Thắng đợt cuối → `Control.stageWin()` → +Tinh Thạch (lần đầu nhiều, chơi lại 30% để cày) + mở màn sau.
- **Tinh Thạch** (`Storage.data.gems`) = tiền vĩnh viễn từ thưởng màn. **Cửa Hàng Tướng** (`UI.openShop`, modal `#hmod`)
  dùng Tinh Thạch MỞ KHOÁ tướng (`HERO_COST`, `Storage.data.unlocked`). Shop trong trận chỉ hiện tướng đã mở.
- **Khắc chế = cổng qua màn**: ban đầu chỉ mở Mỏ Vàng/Giáp Sĩ/Xạ Thủ (phys). Băng/Thần Sét/Độc/Pháo/Thánh Sứ
  phải mua. Màn 3 (Sói nhanh)→cần Băng; màn 5 (Orc giáp)→cần Thần Sét... không có khắc tinh thì gần như không qua → buộc cày & mua.
- **Màn hình chính** = chọn màn (`UI.renderStages` vào `#maps`) + ô Tinh Thạch + nút Cửa Hàng. `Control.start(idx)` chơi màn.
- **Độ khó KHÔNG còn theo kỹ năng**: bỏ `diffScale()` khỏi `buildWave`/rò rỉ; dùng `State.stage.mul`.
  Kỹ năng/Nội Tại vẫn tăng sức mạnh người chơi → cày lại màn cũ dễ (farm). `metaPow/diffScale` còn định nghĩa nhưng không dùng cho độ khó.
> ✅ **Phần B đã làm ở v3.8:** thêm Cổ Mộc/Phong Linh, Golem/Hồn Ma, 4 màn mới, chủ đề Thạch Mộc/Hồn Ma/Hỗn Mang và Hoá Thần cấp 4.

### l) CÂN BẰNG CAMPAIGN TOÀN GAME v3.6 (XONG 2026-06-23)
Mục tiêu: đầu game vẫn học được, giữa game có cổng khắc chế rõ, nửa sau không bị "dễ thở" sau khi người chơi
đã tích SP/nội tại/kỹ năng tướng.

**Sửa công cụ đo (`tools/balance-sim.js`):**
- Nâng sim lên **v3.6**, mô phỏng thêm SP vĩnh viễn: XP trong mỗi màn → lên cấp → +SP, rồi tự nâng Nội Tại/kỹ năng tướng theo thứ tự hợp lý.
- Mô phỏng các bonus quan trọng: talent damage/speed/HP/crit kỳ vọng, kỹ năng tướng bậc 1-2, early chain/freeze/slow/explode/pierce.
- Sửa AI mua hero: nếu màn cần tướng khắc tinh mà chưa đủ Tinh Thạch thì **giữ tiền**, không mua tướng phụ làm chậm unlock.
- Sửa priest trong sim: ưu tiên hồi máu đồng minh trong tầm thay vì bị ràng buộc phải có mục tiêu địch.

**Sửa số trong game (`STAGES[].mul`) — chỉ tăng nửa sau để không phá nhịp mở đầu:**
| Màn | Cũ | Mới | Ý đồ |
|---|---:|---:|---|
| 7 Cổng Ngục | 3.1 | **3.5** | cổng armor/fast đầu hầm ngục phải căng |
| 8 Hành Lang Xương | 3.7 | **4.6** | hỗn hợp + giáp không còn nhẹ |
| 9 Hầm Sâu | 4.4 | **5.7** | ép dùng slow/độc/sét thay vì spam phys |
| 10 Ngai Hắc Ám | 5.2 | **6.3** | boss giữa-cuối campaign là mốc kiểm tra build |
| 11 Vực Thẳm I | 6.2 | **8.1** | màn áp lực trước chung kết |
| 12 Vực Thẳm II | 7.6 | **10.2** | boss cuối vẫn qua được nhưng không nhạt |

**Kết quả `node tools/balance-sim.js` sau cân bằng:**
| Màn | KQ | HP còn | Farm |
|---:|---|---:|---:|
| 1 | PASS | 124 | 0 |
| 2 | PASS | 237 | 0 |
| 3 | PASS | 122 | 0 |
| 4 | PASS | 145 | 0 |
| 5 | PASS | **47** | 0 |
| 6 | PASS | **67** | 0 |
| 7 | PASS | **23** | 0 |
| 8 | PASS | 300 | 0 |
| 9 | PASS | 337 | 0 |
| 10 | PASS | **84** | 0 |
| 11 | PASS | 302 | 0 |
| 12 | PASS | 325 | 0 |

Đọc kết quả: màn 5/6/7/10 là các "đỉnh căng"; màn 8/9/11 là nhịp hồi phục, mở hero/kỹ năng và chuẩn bị cho boss.
Sim vẫn lạc quan hơn người chơi thật (đặt quân/nhắm/đạn bay hoàn hảo), nên chưa tăng tiếp khi chưa playtest tay.

### m) MỞ RỘNG TƯỚNG/QUÁI/MÀN + HOÁ THẦN v3.8 (XONG 2026-06-23)
Mục tiêu: thêm một cụm nội dung mới sau Vực Thẳm II và tạo đích SP rõ ràng cho từng tướng.

**Nội dung mới trong game:**
- Thêm tướng **Cổ Mộc** (`druid`, sát thương `nature`, pulse): khắc Golem/đám đông chậm, bậc 3 Rễ Thiêng mở trói chân từ cấp 1.
- Thêm tướng **Phong Linh** (`wind`, sát thương `wind`, linear): khắc Hồn Ma/quái nhanh, bậc 3 Cuồng Phong mở xuyên hàng + đẩy lùi từ cấp 1.
- Thêm quái **Golem** (`golem`): máu cao, khiên, kháng phys/magic/frost/pois, yếu `nature`.
- Thêm quái **Hồn Ma** (`wraith`): nhanh, né đạn, kháng phys/magic, yếu `wind`; máu đã hạ xuống 190 để không thành tường quá sớm.
- Thêm chủ đề đợt **THẠCH MỘC**, **HỒN MA**, **HỖN MANG** (`WAVE_THEMES.root/spirit/apex`).
- Thêm 4 màn: 13 Rừng Cổ Thụ, 14 Đền Gió Lộng, 15 Cấm Thành Xương, 16 Thiên Môn ⚔TRÙM.

**Hoá Thần cấp 4:**
- Điều kiện: `State.unitSkills[type] >= 3` → `maxUnitLevel(type) = 4`.
- Nâng từ cấp 3 lên cấp 4 tốn `upgradeCost()` cao hơn (`×1.15` ở bậc này) và hiện nhãn **Hoá Thần** trong modal.
- Cấp 4 tăng hệ số chỉ số thêm `×1.12` sau mũ `1.4^(level-1)`, đồng thời cường hoá kỹ năng đặc trưng:
  - Mỏ Vàng: thu nhập mạnh hơn, đào nhanh hơn.
  - Giáp Sĩ: phản đòn 55%.
  - Thần Sét: nảy 3 mục tiêu, chuỗi xa hơn, sát thương chuỗi 85%.
  - Băng Thần: vùng bão lớn hơn, slow mạnh hơn.
  - Tháp Độc/Cổ Mộc: vùng rộng hơn, slow/trói mạnh hơn.
  - Thánh Sứ: hào quang 25%.
  - Phong Linh: đẩy lùi/slow mạnh hơn, xuyên nhiều mục tiêu trên hàng.

**Cân bằng v3.8 theo sim:**
| Màn | `mul` | KQ sim | HP còn | Farm |
|---:|---:|---|---:|---:|
| 13 Rừng Cổ Thụ | 11.5 | PASS | 311 | 1 |
| 14 Đền Gió Lộng | 7.8 | PASS | 255 | 3 |
| 15 Cấm Thành Xương | 13.2 | PASS | 291 | 0 |
| 16 Thiên Môn | 15.8 | PASS | 278 | 0 |

Lý do màn 14 có `mul` thấp hơn màn 13: Hồn Ma đã có tốc độ + né + kháng nhiều hệ, nên độ khó đến từ áp lực đường chạy chứ không phải máu dày.

## 5. PHIÊN BẢN / CACHE (nhớ bump khi sửa)
Khi sửa code muốn người chơi nhận bản mới, **đổi 3 chỗ**:
1. `sw.js` → `const CACHE = 'kntt-vXX-...'` (tăng số).
2. `index.html` → `const GAME_VERSION = 'X.Y.Z'`.
3. `version.json` → cùng version + ghi `notes`.
- Hiện tại: **CACHE `kntt-v38-godform`**, **GAME_VERSION `3.8.0`**, `version.json` **3.8.0**.

## 6. 📋 VIỆC NÊN LÀM TIẾP (TODO)
- [ ] **Playtest thật v3.8 trên mobile**: đặc biệt màn 13-16; ghi HP còn, tướng dùng, thời điểm mở Hoá Thần và thời điểm thiếu vàng.
- [ ] Nếu màn 14 vẫn cần quá nhiều farm với người thật: hạ `mul` 7.8 → 7.2 hoặc giảm tỷ lệ Hồn Ma trong `WAVE_THEMES.spirit`.
- [ ] Nếu Thiên Môn quá nhẹ sau playtest: tăng `mul` 15.8 thêm 5% trước, không đổi đồng thời quái/tướng.
- [ ] Nếu màn 7/10 quá gắt với người thật: hạ `mul` màn đó khoảng 5-8% trước, không đổi nhiều biến cùng lúc.
- [ ] Nếu màn 8/9/11 quá nhẹ sau playtest: tăng `mul` từng màn khoảng 5%, nhưng tránh tạo farm sớm vì farm sinh thêm SP.
- [ ] Sink vàng cuối game nếu bàn đầy & full nâng cấp vẫn dư: vd bán/đổi, lính tinh nhuệ giá cao, hoặc nâng cấp cấp 4.
- [ ] **Playtest thật** hệ khắc chế: GIÁP DÀY/TỐC ĐỘ có khiến người chơi hiểu cần Thần Sét/Băng/Độc không?
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
