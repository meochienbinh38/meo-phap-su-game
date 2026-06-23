# 📊 Cân bằng & Công thức số học — Kỷ Nguyên Thủ Thành

> Các bảng dưới đây tính **trực tiếp từ dữ liệu trong `index.html`** (`UNITS_DB`, `ENEMIES_DB`, công thức scaling). Mục tiêu: nhìn ra "tường độ khó", chỗ lệch giá trị, và các *đòn bẩy tinh chỉnh*.
> Liên quan: [GAME_DESIGN.md](./GAME_DESIGN.md) · [PHYSICS.md](./PHYSICS.md).

---

## 1. Mô hình sát thương

**Hiện tại (đơn giản):**
```
finalDmg = baseDmg · lvMul · dmgMul · critMul
```
**Đề xuất (thêm giáp/kháng để có khắc chế — GDD §8):**
```
finalDmg = max( baseDmg · lvMul · dmgMul · critMul · (1 − resist[type]) − armor ,  baseDmg · 0.05 )
```

**Các hệ số nhân:**
| Hệ số | Công thức | Nguồn |
|---|---|---|
| Cấp đơn vị `lvMul` | `1.4^(level−1)` → L1=1.00, L2=1.40, L3=1.96; L4 Hoá Thần thêm `×1.12` | nâng cấp trong ván |
| Sát thương `dmgMul` | `1 + 0.10·talentD (+ aura 0.15)` | nội tại + hào quang |
| Tốc đánh `spdMul` | `1 + 0.05·talentS (+ aura 0.15)` → `aspd_eff = aspd/spdMul` | nội tại + hào quang |
| Bạo kích | `pCrit = 0.10 + 0.05·talentC`, `critMul = 2.0` | nội tại |

**DPS hiệu dụng:** `DPS = finalDmg / aspd_eff`. Với đơn vị AoE/đa mục tiêu: `DPS_thực = DPS_đơn × số_mục_tiêu_trung_bình`.

---

## 2. Bảng DPS theo cấp (nội tại = 0, chưa tính bạo kích)

| Đơn vị | Vai trò | DPS L1 | DPS L2 | DPS L3 | Ghi chú |
|---|---|---:|---:|---:|---|
| Xạ Thủ | đơn mục tiêu | 32.0 | 44.8 | 62.7 | L3 xuyên thấu ⇒ DPS_thực ×(số địch trên làn) |
| Pháo Thủ | AoE | 33.3 | 46.7 | 65.3 | L3 nổ chùm ⇒ nhân theo cụm |
| Thần Sét | xuyên làn | 25.0 | 35.0 | 49.0 | đánh **mọi làn**; L3 nảy 2 mục tiêu |
| Băng Thần | AoE + slow | 17.5 | 24.5 | 34.3 | giá trị thật ở **khống chế**, không ở DPS |
| Giáp Sĩ | chắn | 12.5 | 17.5 | 24.5 | giá trị ở **máu/chặn làn**, L3 phản đòn |
| Tháp Độc | vùng | 12.5 | 17.5 | 24.5 | đánh tất cả trong vùng + L3 mở rộng/làm chậm |
| Thánh Sứ | hỗ trợ | 15.0 HPS | 21.0 | 29.4 | hồi máu, không phải DPS |
| Cổ Mộc | vùng/khống chế | 14.5 | 20.4 | 28.5 | sát thương nature, L3 trói/chậm nhóm đá |
| Phong Linh | tuyến/đẩy lùi | 32.9 | 46.1 | 64.6 | sát thương wind, L3 xuyên hàng + đẩy lùi |

> **Nhận xét cân bằng:** Xạ Thủ vẫn là đơn vị đơn mục tiêu hiệu quả nhất theo vàng, nhưng không còn phủ toàn bản đồ. Các đơn vị AoE/khống chế nhìn "yếu" trên bảng 1 mục tiêu; giá trị thật của chúng là **nhân theo số mục tiêu** và **kiểm soát**.

---

## 3. Hiệu quả chi phí (DPS đơn / vàng) — chỉ tham khảo

| Đơn vị | Chi phí | DPS L1 | DPS/vàng |
|---|---:|---:|---:|
| Xạ Thủ | 90 | 32.0 | **0.356** |
| Pháo Thủ | 130 | 33.3 | 0.256 |
| Giáp Sĩ | 60 | 12.5 | 0.208 (đổi lấy **máu/chặn**) |
| Thần Sét | 180 | 25.0 | 0.139 (đổi lấy **xuyên làn**) |
| Băng Thần | 160 | 17.5 | 0.109 (đổi lấy **slow**) |
| Tháp Độc | 120 | 12.5 | 0.104 (đổi lấy **vùng + slow**) |
| Thánh Sứ | 150 | 15.0 | 0.100 (hồi máu) |

> Chỉ số này **chỉ đo sát thương đơn/vàng** nên thiên vị đơn mục tiêu. Đừng "cân bằng" chỉ theo cột này — nếu không sẽ giết chết các đơn vị tiện ích. Dùng kèm "giá trị tình huống".

---

## 4. Độ khó campaign v3.8

Game hiện là campaign 16 màn. Máu quái trong một màn:

```
enemyHp = baseHp · 1.16^(wave−1) · STAGES[stage].mul
```

Hệ số trong màn dịu hơn bản endless cũ, còn độ khó dài hạn nằm ở `STAGES[].mul`.

| Đợt trong màn | Hệ số `1.16^(w-1)` | Tiểu Quỷ (70) | Orc (420) | Trùm (5200) |
|---:|---:|---:|---:|---:|
| 1 | ×1.00 | 70 | 420 | 5 200 |
| 3 | ×1.35 | 94 | 565 | 6 997 |
| 5 | ×1.81 | 127 | 760 | 9 415 |
| 8 | ×2.83 | 198 | 1 187 | 14 696 |
| 10 | ×3.80 | 266 | 1 597 | 19 775 |
| 12 | ×5.12 | 358 | 2 149 | 26 610 |

### 4.1 Hệ số màn hiện tại

| Màn | `mul` | Vai trò nhịp độ |
|---:|---:|---|
| 1 | 1.0 | nhập môn |
| 2 | 1.25 | mở nhịp bầy đàn |
| 3 | 1.5 | cổng Băng |
| 4 | 1.85 | ép giữ lane nhanh |
| 5 | 2.2 | cổng Thần Sét, mốc căng đầu |
| 6 | 2.6 | boss núi lửa |
| 7 | 3.5 | cổng hầm ngục, mốc căng nhất theo sim |
| 8 | 4.6 | hồi phục có áp lực |
| 9 | 5.7 | ép phối hợp slow/độc/sét |
| 10 | 6.3 | boss giữa-cuối campaign |
| 11 | 8.1 | chuẩn bị chung kết |
| 12 | 10.2 | boss cuối |
| 13 | 11.5 | mở cổng Cổ Mộc/Golem |
| 14 | 7.8 | Hồn Ma nhanh/né, hệ số thấp hơn vì quái nguy hiểm hơn |
| 15 | 13.2 | phối hợp Thạch Mộc + Hồn Ma |
| 16 | 15.8 | Thiên Môn, Hỗn Mang + trùm cuối |

### 4.2 Mốc cân bằng theo sim v3.8

`node tools/balance-sim.js` hiện PASS 16/16. Màn 14 cần khoảng 3 lượt farm/thử lại trong sim để mở đủ Phong Linh/Hoá Thần; các màn 15-16 qua ngay sau đó.

| Màn | HP còn |
|---:|---:|
| 5 | 47 |
| 6 | 67 |
| 7 | 23 |
| 10 | 84 |
| 13 | 311 |
| 14 | 255 |
| 15 | 291 |
| 16 | 278 |

Các màn 8/9/11 là nhịp hồi phục cũ; màn 14 là điểm kiểm tra Phong Linh/Hoá Thần mới. Sim chơi đều tay hơn người thật, nên các màn HP thấp hoặc phải farm cần playtest trước khi tăng tiếp.

---

## 5. Kinh tế (Economy)

| Nguồn vàng | Công thức | Ghi chú |
|---|---|---|
| Vàng đầu | 280 | đủ dựng hàng chắn + vài nguồn sát thương |
| Giết địch | `enemy.gold` cố định | talent Vũ Khí chỉ tăng sát thương, không tăng vàng |
| Dọn đợt | `20 + wave·8` | thưởng tăng tuyến tính vừa phải |
| Gọi sớm | `floor(timer · 4)` | đánh đổi an toàn lấy vàng |
| Mỏ Vàng | `14/4 = 3.5` vàng/s (L1); **7.0/s** (L3, ×2) | tài sản trả dần |
| Giá mua thêm | `base · 1.11^(số con cùng loại)` | bỏ cap cứng, tự chống spam |

**Điểm hoà vốn Mỏ Vàng:** chi phí con đầu 50 ÷ 3.5 ≈ **14.3 giây** (L1). Sau đó là lãi ròng.
Mỏ mua sớm vẫn mạnh, nhưng giá lũy tiến khiến spam mỏ chiếm nhiều nhịp phòng thủ.

**XP & SP (meta):** lên cấp cần `100 · 1.5^(level−1)` XP (L2:150, L3:225, L5:506, L8:1708). Mỗi cấp +1 SP vĩnh viễn ⇒ nguồn tăng tiến dài hạn, độc lập kết quả ván.

---

## 6. Nội tại (Talents) — trần giá trị

| Nội tại | Hiệu ứng/cấp | Max | Tổng tối đa |
|---|---|---:|---|
| Vũ Khí (d) | +10% dmg | 10 | **+100% dmg** |
| Cuồng Nộ (s) | +5% tốc đánh | 10 | **+50% tốc đánh** |
| Gia Cố (h) | +100 máu nhà | 5 | **+500 máu nhà** (150→650) |
| Chí Mạng (c) | +5% bạo kích | 5 | **+25%** (nền 10% → 35%) |

Cộng hưởng tối đa lý thuyết: `dmgMul=2.0`, `spdMul=1.5`, crit `35%×2×` ⇒ DPS nền **×~3.5**. Đây là sức mạnh cố định: đủ đẩy người chơi qua các mốc căng, nhưng không tự xoá nhu cầu dùng đúng khắc chế.

---

## 7. Bảng đòn bẩy tinh chỉnh (Tuning Levers)

| Muốn… | Vặn… | Ở đâu |
|---|---|---|
| Game dễ/khó hơn tổng thể | `STAGES[].mul`, mũ `1.16`, `count = 4 + 1.5w + 0.12w²` | `STAGES`, `buildWave` |
| Kéo dài/rút ngắn màn | `waves`, `STAGES[].mul`, thưởng dọn đợt | `STAGES`, dọn đợt |
| Vàng dư/thiếu | vàng đầu 280, income Mỏ 14/4s, thưởng `20+8w`, `buyRamp` 1.11 | `CFG`, `UNITS_DB.miner` |
| Đơn vị mạnh/yếu | `dmg`, `aspd`, `range`, `cost` | `UNITS_DB` |
| Nhịp đợt nhanh/chậm | `interval = max(0.45, 1.9 - 0.09w)`, prep 8s | `buildWave`, `spawn.timer` |
| Sức mạnh meta | hệ số nội tại, `tp` mỗi cấp | `TALENTS_DB`, `gainXp` |
| Cổng khắc chế | `WAVE_THEMES`, `ENEMIES_DB.resist`, `HERO_COST` | `WAVE_THEMES`, `ENEMIES_DB`, `HERO_COST` |
| Sức mạnh ult | dmg 500, `ultMax` 25s | `castUlt`, `State.ultMax` |

> **Quy tắc vàng:** chỉ đổi **một biến mỗi lần playtest**, ghi lại đợt-thua trung bình, rồi mới đổi tiếp. Đưa các số này ra **file dữ liệu** (GDD §11.2) để tinh chỉnh không cần sửa logic.

---

## 8. Quy trình playtest & mục tiêu số

**Mục tiêu cân bằng v3.8 (campaign):**
- Màn 1-2: học hệ thống, có rò rỉ nhẹ nhưng không phạt gắt.
- Màn 3-4: người chơi thấy rõ cần Băng/Pháo.
- Màn 5-7: cổng khắc chế thật sự, HP còn theo sim thấp nhưng vẫn PASS.
- Màn 8-9: hồi phục và mở đủ Poison/Priest/kỹ năng.
- Màn 10-12: boss và màn cuối cũ có áp lực, không thành cuộc dạo chơi sau khi đã có nhiều SP.
- Màn 13-16: giới thiệu Golem/Hồn Ma, buộc dùng Cổ Mộc/Phong Linh và cho người chơi cảm nhận mục tiêu Hoá Thần cấp 4.
- Mỗi map nên có ít nhất 2 lối build khả thi, nhưng vẫn cần tôn trọng khắc chế.

**Vòng lặp tinh chỉnh:**
```
Chơi 5–10 ván → ghi: đợt thua, vàng dư/thiếu, đơn vị dùng, "khoảnh khắc khó chịu"
→ đặt giả thuyết (1 biến) → vặn 1 lever §7 → lặp lại → so sánh
```

**Số liệu nên log (cục bộ, riêng tư):** histogram đợt-thua theo map; tần suất dùng từng đơn vị; số lần dùng ult/ván; tỉ lệ "Gọi sớm".

---

*Quay lại [GAME_DESIGN.md](./GAME_DESIGN.md) · [PHYSICS.md](./PHYSICS.md).*
