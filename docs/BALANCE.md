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
| Cấp đơn vị `lvMul` | `1.4^(level−1)` → L1=1.00, L2=1.40, L3=1.96 | nâng cấp trong ván |
| Sát thương `dmgMul` | `1 + 0.10·talentD (+ aura 0.15)` | nội tại + hào quang |
| Tốc đánh `spdMul` | `1 + 0.05·talentS (+ aura 0.15)` → `aspd_eff = aspd/spdMul` | nội tại + hào quang |
| Bạo kích | `pCrit = 0.10 + 0.05·talentC`, `critMul = 2.0` | nội tại |

**DPS hiệu dụng:** `DPS = finalDmg / aspd_eff`. Với đơn vị AoE/đa mục tiêu: `DPS_thực = DPS_đơn × số_mục_tiêu_trung_bình`.

---

## 2. Bảng DPS theo cấp (nội tại = 0, chưa tính bạo kích)

| Đơn vị | Vai trò | DPS L1 | DPS L2 | DPS L3 | Ghi chú |
|---|---|---:|---:|---:|---|
| Xạ Thủ | đơn mục tiêu | 37.5 | 52.5 | 73.5 | L3 xuyên thấu ⇒ DPS_thực ×(số địch trên làn) |
| Pháo Thủ | AoE | 33.3 | 46.7 | 65.3 | L3 nổ chùm ⇒ nhân theo cụm |
| Thần Sét | xuyên làn | 26.7 | 37.3 | 52.3 | đánh **mọi làn**; L3 nảy 2 mục tiêu (+1.4×) |
| Băng Thần | AoE + slow | 17.5 | 24.5 | 34.3 | giá trị thật ở **khống chế**, không ở DPS |
| Giáp Sĩ | chắn | 12.5 | 17.5 | 24.5 | giá trị ở **máu/chặn làn**, L3 phản đòn |
| Tháp Độc | vùng | 6.7 | 9.3 | 13.1 | DPS_đơn thấp nhưng **đánh tất cả** trong vùng + L3 slow |
| Thánh Sứ | hỗ trợ | 15.0 HPS | 21.0 | 29.4 | hồi máu, không phải DPS |

> **Nhận xét cân bằng:** DPS đơn mục tiêu của Xạ Thủ vượt trội. Các đơn vị AoE/khống chế nhìn "yếu" trên bảng này vì *bảng chỉ đo 1 mục tiêu* — giá trị thật của chúng là **nhân theo số mục tiêu** và **kiểm soát**. Khi thêm địch đông + tank (GDD §6.2), giá trị của chúng tự nổi lên. Cần playtest để bảo đảm không đơn vị nào "thống trị mọi tình huống".

---

## 3. Hiệu quả chi phí (DPS đơn / vàng) — chỉ tham khảo

| Đơn vị | Chi phí | DPS L1 | DPS/vàng |
|---|---:|---:|---:|
| Xạ Thủ | 80 | 37.5 | **0.469** |
| Pháo Thủ | 130 | 33.3 | 0.256 |
| Giáp Sĩ | 60 | 12.5 | 0.208 (đổi lấy **máu/chặn**) |
| Thần Sét | 180 | 26.7 | 0.148 (đổi lấy **xuyên làn**) |
| Băng Thần | 160 | 17.5 | 0.109 (đổi lấy **slow**) |
| Thánh Sứ | 150 | 15.0 | 0.100 (hồi máu) |
| Tháp Độc | 120 | 6.7 | 0.056 (đổi lấy **vùng + slow**) |

> Chỉ số này **chỉ đo sát thương đơn/vàng** nên thiên vị đơn mục tiêu. Đừng "cân bằng" chỉ theo cột này — nếu không sẽ giết chết các đơn vị tiện ích. Dùng kèm "giá trị tình huống".

---

## 4. Máu kẻ địch theo đợt — **phát hiện quan trọng**

Máu nhân theo `hpMul = 1.22^(wave−1)` (cấp số nhân ~+22%/đợt):

| Đợt | Hệ số | Tiểu Quỷ (80) | Orc (350) | Trùm (4500) |
|---:|---:|---:|---:|---:|
| 1 | ×1.00 | 80 | 350 | 4 500 |
| 3 | ×1.49 | 119 | 521 | 6 698 |
| 5 | ×2.22 | 177 | 775 | 9 969 |
| 8 | ×4.02 | 322 | 1 408 | 18 102 |
| 10 | ×5.99 | 479 | 2 096 | 26 943 |
| 15 | ×16.18 | 1 295 | 5 664 | 72 820 |
| 20 | ×43.74 | 3 499 | 15 308 | 196 811 |
| 25 | ×118.21 | 9 456 | 41 372 | 531 923 |

### 4.1 "Tường độ khó" (difficulty wall)
- **Máu địch tăng theo cấp số nhân** (`1.22^w`), nhưng **sức mạnh người chơi tăng gần tuyến tính**: mua thêm quân tỉ lệ với *vàng tích luỹ*, cộng số nhân *cố định* từ cấp đơn vị (trần L3 = ×1.96) và nội tại (trần +100% dmg).
- Hệ quả: trước ~đợt 12–15, kinh tế (Mỏ Vàng + vàng dồn đợt) còn theo kịp; sau đó **mũ thắng tuyến tính** ⇒ xuất hiện *tường*. Đây là lý do hầu hết ván kết thúc trong khoảng này (khớp thiết kế "ván 5–10 phút").

### 4.2 Khuyến nghị tinh chỉnh
Chọn **một** hướng (đo bằng playtest, không đổi nhiều thứ cùng lúc):
1. **Hạ mũ máu** `1.22 → 1.18` để đường cong dịu hơn (đợt 25: ×118 → ×~46) ⇒ kéo dài "vùng chơi vui".
2. **Cho người chơi số nhân cộng hưởng** (synergy/nội tại nhân, GDD §5.2) để theo kịp mũ — *giữ* mũ máu nhưng tăng trần sức mạnh.
3. **Tách "máu" và "số lượng":** thay vì mỗi con dày hơn mãi, tăng *mật độ* và *loại* địch ⇒ đề cao AoE/kiểm soát thay vì chỉ "đập số to".

> **Bài học thiết kế:** khi một bên là *cấp số nhân* còn bên kia *tuyến tính*, luôn có giao điểm tạo tường. Quyết định **có chủ đích** vị trí bức tường (đây là tính năng, không phải lỗi) thay vì để nó tự xảy ra.

---

## 5. Kinh tế (Economy)

| Nguồn vàng | Công thức | Ghi chú |
|---|---|---|
| Vàng đầu | 250 | đủ ~3–4 đơn vị mở màn |
| Giết địch | `gold · (1 + 0.10·talentD)` | nội tại Vũ Khí cũng tăng vàng |
| Dọn đợt | `50 + wave·20` | thưởng tăng tuyến tính theo đợt |
| Gọi sớm | `floor(timer · 4)` | đánh đổi an toàn lấy vàng |
| Mỏ Vàng | `income/cd` = `15/4 = 3.75` vàng/s (L1); **7.5/s** (L3, ×2) | tài sản trả dần |

**Điểm hoà vốn Mỏ Vàng:** chi phí 50 ÷ 3.75 ≈ **13.3 giây** (L1). Sau đó là lãi ròng. ⇒ Mua sớm = snowball; mua muộn (đợt cao) ít giá trị. Giới hạn **5 mỏ** chặn snowball vô hạn. *Cân bằng tốt, giữ.*

**XP & SP (meta):** lên cấp cần `100 · 1.5^(level−1)` XP (L2:150, L3:225, L5:506, L8:1708). Mỗi cấp +1 SP vĩnh viễn ⇒ nguồn tăng tiến dài hạn, độc lập kết quả ván.

---

## 6. Nội tại (Talents) — trần giá trị

| Nội tại | Hiệu ứng/cấp | Max | Tổng tối đa |
|---|---|---:|---|
| Vũ Khí (d) | +10% dmg (và +10% vàng/đòn) | 10 | **+100% dmg** |
| Cuồng Nộ (s) | +5% tốc đánh | 10 | **+50% tốc đánh** |
| Gia Cố (h) | +100 máu nhà | 5 | **+500 máu nhà** (100→600) |
| Chí Mạng (c) | +5% bạo kích | 5 | **+25%** (nền 10% → 35%) |

Cộng hưởng tối đa lý thuyết: `dmgMul=2.0`, `spdMul=1.5`, crit `35%×2×` ⇒ DPS nền **×~3.5**. Đây chính là "số nhân cố định" ở §4.1 — đủ đẩy *vài đợt* xa hơn nhưng **không phải cấp số nhân** nên không phá được tường vô hạn (đúng ý đồ meta tăng dần, không phá vỡ thử thách).

---

## 7. Bảng đòn bẩy tinh chỉnh (Tuning Levers)

| Muốn… | Vặn… | Ở đâu |
|---|---|---|
| Game dễ/khó hơn tổng thể | mũ `hpMul` (1.22), `count = 10 + w·2` | `buildWave` |
| Kéo dài/rút ngắn ván | mũ máu + thưởng dọn đợt | `buildWave`, dọn đợt |
| Vàng dư/thiếu | vàng đầu (250), income Mỏ (15/4s), thưởng | `CFG`, `UNITS_DB.miner` |
| Đơn vị mạnh/yếu | `dmg`, `aspd`, `range`, `cost` | `UNITS_DB` |
| Nhịp đợt nhanh/chậm | `d = i·(1.5 − min(0.8, w·0.04))`, prep 8–10s | `buildWave`, `spawn.timer` |
| Sức mạnh meta | hệ số nội tại, `tp` mỗi cấp | `TALENTS_DB`, `gainXp` |
| Tần suất loại địch | ngưỡng xác suất theo `w` | `buildWave` |
| Sức mạnh ult | dmg 500, `ultMax` 25s | `castUlt`, `State.ultMax` |

> **Quy tắc vàng:** chỉ đổi **một biến mỗi lần playtest**, ghi lại đợt-thua trung bình, rồi mới đổi tiếp. Đưa các số này ra **file dữ liệu** (GDD §11.2) để tinh chỉnh không cần sửa logic.

---

## 8. Quy trình playtest & mục tiêu số

**Mục tiêu cân bằng (định cỡ):**
- Người mới (nội tại 0): thua quanh **đợt 8–12**.
- Người thạo (nội tại ~nửa): **đợt 18–25**.
- Tối đa nội tại + chơi tốt: **đợt 30+** (vùng "đua kỷ lục").
- **Không đơn vị nào** xuất hiện > ~60% số ván thắng (tránh "một quân thống trị").
- Mỗi map có ≥ 2 lối build khả thi.

**Vòng lặp tinh chỉnh:**
```
Chơi 5–10 ván → ghi: đợt thua, vàng dư/thiếu, đơn vị dùng, "khoảnh khắc khó chịu"
→ đặt giả thuyết (1 biến) → vặn 1 lever §7 → lặp lại → so sánh
```

**Số liệu nên log (cục bộ, riêng tư):** histogram đợt-thua theo map; tần suất dùng từng đơn vị; số lần dùng ult/ván; tỉ lệ "Gọi sớm".

---

*Quay lại [GAME_DESIGN.md](./GAME_DESIGN.md) · [PHYSICS.md](./PHYSICS.md).*
