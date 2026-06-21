# 🐾 Kinh Thánh Nội Dung — Vương Quốc Mèo Pháp Sư

> Thiết kế **nội dung cốt lõi** của game: hệ chiến đấu nền tảng, danh bạ đơn vị & kẻ địch, hệ cộng hưởng (synergy), thiết kế đợt/trùm, bản đồ và nhịp mở khoá.
> Tài liệu này biến khung sườn ở [GAME_DESIGN.md](./GAME_DESIGN.md) thành **nội dung cụ thể, nhất quán, triển khai được**. Số liệu bám [BALANCE.md](./BALANCE.md); nội dung mới được đánh dấu 🆕 (mốc M2/M3).

---

## 0. Nguyên tắc thiết kế nội dung

Ba quy tắc chi phối **mọi** đơn vị, kẻ địch và đợt:

1. **"Mỗi kẻ địch đặt một câu hỏi — mỗi đơn vị là một câu trả lời."**
   Không có địch nào "chỉ là cục máu". Khiên Xương hỏi *"bạn có dồn được sát thương không?"*; Thích Khách hỏi *"bạn có nguồn sát thương không-né-được không?"*. Người chơi thắng bằng cách **nhận diện câu hỏi và đáp đúng**.

2. **Không có lựa chọn thống trị (no dominant pick).**
   Mọi đơn vị mạnh trong *tình huống của nó* và yếu ở chỗ khác. Cân bằng theo **giá trị tình huống**, không theo "DPS thuần" (xem BALANCE §3 — lý do không cân bằng theo DPS/vàng).

3. **Đọc được trong nửa giây (readability).**
   Nhìn là biết: hệ gì (màu glow), nguy hiểm cỡ nào (kích thước/thanh máu), đang dính hiệu ứng gì (icon trạng thái). Địch luôn tông ấm/tối; quân nhà luôn tông lạnh/sáng.

Một **tam giác giá trị** giữ thế cân bằng động:
```
        Số đông (swarm) ── bị khắc bởi ─► AoE / Kiểm soát
              ▲                                   │
   bị khắc bởi│                                   │bị khắc bởi
              │                                   ▼
   Sát thương đơn ◄── bị khắc bởi ──────── Tank / Giáp dày
```

---

## 1. Hệ chiến đấu nền tảng

### 1.1 Loại sát thương (Damage Types)
Sáu hệ. Mỗi đòn đánh thuộc **đúng một hệ**:

| Hệ | Màu glow | Tính cách | Đơn vị tiêu biểu |
|---|---|---|---|
| ⚔️ Vật lý (Physical) | trắng/xanh thép | ổn định, bị **Giáp** cản | Giáp Sĩ, Xạ Thủ |
| 🔥 Lửa (Fire) | cam | sát thương + **Cháy** (DoT) | Pháo Thủ |
| ❄️ Băng (Ice) | xanh nhạt | yếu sát thương, mạnh **khống chế** | Băng Thần |
| ☠️ Độc (Poison) | tím | **DoT** cộng dồn, không sợ giáp | Tháp Độc |
| ⚡ Sét (Lightning) | chàm sáng | **dây chuyền**, mạnh khi địch **Ướt** | Thần Sét |
| ✨ Thần (Holy) | vàng | khắc **Bất Tử (undead)**, hồi máu | Thánh Sứ |

### 1.2 Giáp & Kháng (Armor & Resist) 🆕
Đây là chiều sâu còn thiếu trong bản hiện tại (BALANCE §1):

- **Giáp (armor):** giảm **phẳng** mỗi đòn. Mạnh trước nhiều đòn nhỏ (swarm-shooter), yếu trước đòn to thưa. Chủ yếu chặn **Vật lý**.
- **Kháng (resist[type]):** giảm **theo %** một hệ, khoảng `[−0.5, +0.9]`. Âm = **dính nặng (vulnerable)**.
- **Sàn sát thương:** luôn `≥ 5%` sát thương gốc (không miễn nhiễm tuyệt đối) → tránh bế tắc.
```
finalDmg = max( base · lvMul · dmgMul · critMul · (1 − resist[type]) − armor ,  base · 0.05 )
```

### 1.3 Hiệu ứng trạng thái (Status) — bộ chuẩn
Khớp hệ thống thống nhất ở [PHYSICS.md §8](./PHYSICS.md):

| Trạng thái | Hiệu ứng | Nguồn |
|---|---|---|
| 🐌 Chậm (Slow) | giảm tốc di chuyển | Băng, Tháp Độc L3 |
| 🧊 Đóng băng (Freeze) | đứng im, không đánh | Băng Thần L3 |
| ☠️ Độc/🔥 Cháy (DoT) | mất máu mỗi tick (0.5s) | Tháp Độc / Pháo Thủ |
| 💧 Ướt (Wet) | tăng dmg Sét nhận vào | Băng Thần (tan băng), mưa (map Rừng) |
| 🩸 Hở Giáp (Vulnerable) | tăng % dmg nhận | 🆕 Mèo Khoan Giáp |
| 🛡️ Khiên (Shield) | chặn N đòn đầu | Khiên Xương |

### 1.4 Phản ứng nguyên tố (Elemental Reactions) 🆕 — *trái tim của chiều sâu*
**Ba** phản ứng sạch, nảy sinh tự nhiên từ bộ 8 đơn vị hiện có ⇒ thưởng cho người chơi biết **kết hợp hệ**:

| Phản ứng | Điều kiện | Hiệu quả | Cặp đơn vị |
|---|---|---|---|
| 💥 **Vỡ Băng (Shatter)** | mục tiêu **Đóng băng** + dính đòn **nặng** (Vật lý/Lửa, hoặc bạo kích) | tiêu trạng thái băng, **nổ sát thương bùng** (×2 đòn đó) | Băng Thần → Pháo Thủ / Giáp Sĩ |
| 🔥 **Bùng Độc (Ignite)** | mục tiêu có **stack Độc** + dính đòn **Lửa** | tiêu hết stack độc, **bùng cháy diện rộng** theo số stack | Tháp Độc → Pháo Thủ |
| ⚡ **Dẫn Điện (Conduct)** | mục tiêu **Ướt** + dính **Sét** | sét **lan tới mọi địch Ướt** lân cận, dmg tăng | Băng Thần → Thần Sét |

> **Vì sao đây là cốt lõi:** ba phản ứng biến "đặt 8 quân rời rạc" thành "**dệt** một dàn cộng hưởng". Đó chính là chiều sâu *khó thạo* (Trụ cột P3) — và nó dùng đúng các đơn vị đã có, không cần thêm gì để bắt đầu.

---

## 2. Phân loại vai trò (Role Taxonomy)

Một dàn quân "đủ sức" cần phủ các vai trò sau. Bảng này là **lưới kiểm tra thiết kế**: nếu một vai trò không có đơn vị, đó là khoảng trống nội dung cần lấp.

| Vai trò | Nhiệm vụ | Hiện có | Khoảng trống 🆕 |
|---|---|---|---|
| 💰 Kinh tế | sinh vàng | Mỏ Vàng | — |
| 🧱 Chắn tuyến (Blocker/Tank) | giữ làn, hút đòn | Giáp Sĩ | — |
| 🎯 Sát thương đơn | diệt tank/đơn lẻ | Xạ Thủ | — |
| 💣 Sát thương diện (AoE) | dọn số đông | Pháo Thủ, Băng Thần | — |
| 🕸️ Kiểm soát (Control) | chậm/đóng băng | Băng Thần, Tháp Độc | — |
| ⚡ Xuyên làn | đánh nhiều làn | Thần Sét | — |
| ✨ Hỗ trợ | hồi/buff | Thánh Sứ | — |
| 🔩 Phá giáp (Anti-armor) | hạ địch giáp dày | *thiếu* | **Mèo Khoan Giáp** |
| 🪤 Chống swarm tức thời | bùng nổ vùng đặt | *thiếu* | **Mèo Đặt Bẫy** |
| 🏹 Đa làn cận | bắn lan vài làn | *thiếu* | **Mèo Tiễn Bão** |

---

## 3. Danh bạ Đơn vị (Unit Codex)

Định dạng mỗi đơn vị: **vai trò · hệ · mục tiêu · ý đồ thiết kế · L1/L2/L3 · điểm yếu**.
Chỉ số gốc xem BALANCE §2; ở đây mô tả *cơ chế & lý do tồn tại*.

### Bộ 8 đơn vị nền (đã có — chuẩn hoá)

**⛺→🐟 Mèo Thợ Mỏ** · *Kinh tế · —* 
- **Ý đồ:** quyết định đầu tư vs phòng thủ; hoà vốn ~13s (BALANCE §5). Trần 5 con chặn snowball.
- L1 sinh vàng đều · L2 nhanh hơn · **L3 năng suất ×2**.
- **Yếu:** không phòng thủ; mua muộn vô nghĩa.

**🛡️ Mèo Hiệp Sĩ** · *Chắn tuyến · Vật lý · cận chiến cùng làn*
- **Ý đồ:** "con đê" giữ làn cho xạ thủ phía sau bắn. Trụ cột của mọi tuyến phòng thủ.
- L1 máu cao, chặn · L2 dày hơn · **L3 phản 30% sát thương** (đổi vai sang sát thương khi bị vây).
- **Yếu:** Thích Khách *nhảy xuyên*; bị bào mòn nếu không có Thánh Sứ.

**🏹 Mèo Cung Thủ** · *Sát thương đơn · Vật lý · bắn thẳng theo làn (mục tiêu đầu tuyến)*
- **Ý đồ:** DPS đơn rẻ & cao nhất; xương sống sát thương.
- L1 bắn thẳng · L2 mạnh hơn · **L3 đạn xuyên thấu** (xuyên cả hàng, hệ **True** — bỏ qua giáp/kháng).
- **Yếu:** chỉ một làn; vô dụng nếu địch chưa vào làn nó.

**💣 Mèo Pháo** · *AoE · 🔥 Lửa · bắn cụm đông nhất*
- **Ý đồ:** dọn swarm; **mồi phản ứng Lửa** (Bùng Độc, Vỡ Băng).
- L1 đạn vòng cung nổ · L2 mạnh hơn · **L3 nổ chùm** (bán kính lớn + Cháy DoT).
- **Yếu:** tốc đánh chậm; phí phạm vào mục tiêu đơn lẻ.

**☠️ Mèo Luyện Đan** · *Kiểm soát/DoT · Độc · vùng quanh tháp (không chặn làn)*
- **Ý đồ:** sát thương bền không sợ giáp; **mồi Bùng Độc**.
- L1 sương độc vùng nhỏ · L2 rộng hơn · **L3 vùng to + Chậm**.
- **Yếu:** DPS tức thời thấp; không cản được đòn dồn nhanh.

**⚡ Mèo Pháp Sư Sấm** · *Xuyên làn · Sét · mọi làn trong tầm*
- **Ý đồ:** giải quyết "địch ở làn khác"; **kích Dẫn Điện** khi địch Ướt.
- L1 đánh đơn xuyên làn · L2 mạnh hơn · **L3 sét nảy 2 mục tiêu**.
- **Yếu:** đắt; máu giấy; kém khi địch dàn mỏng.

**❄️ Mèo Băng Giá** · *AoE + Kiểm soát · Băng · bắn vòng cung nổ*
- **Ý đồ:** "phanh thời gian" — làm chậm/đóng băng để các quân khác kịp xử lý; **mồi Vỡ Băng & gây Ướt**.
- L1 nổ chậm vùng · L2 mạnh hơn · **L3 bão tuyết** (vùng ×2, gần như đóng băng).
- **Yếu:** sát thương thấp nhất; cần đồng đội "ăn theo".

**🕊️ Mèo Tăng Lữ** · *Hỗ trợ · Thần · hồi đồng minh yếu nhất trong tầm*
- **Ý đồ:** kéo dài tuyến chắn; **hào quang** thưởng cho bố cục cụm.
- L1 hồi máu · L2 mạnh hơn · **L3 hào quang +15% dmg & tốc đánh** cho 4 ô kề.
- **Yếu:** không gây áp lực sát thương; là mục tiêu ưu tiên cần được bảo vệ.

### 🆕 Bốn đơn vị mở rộng (lấp khoảng trống vai trò — M2/M3)

**🔩 Mèo Khoan Giáp** · *Phá giáp · Vật lý · bắn thẳng, tốc chậm/đòn nặng*
- **Ý đồ:** câu trả lời cho **Giáp Trùng** & địch giáp dày. Mỗi đòn gây **Hở Giáp** (Vulnerable) → cả dàn đánh mạnh hơn vào mục tiêu đó.
- L3: Hở Giáp lan sang địch lân cận.

**🪤 Mèo Đặt Bẫy** · *Chống swarm · Vật lý (thuần va chạm)*
- **Ý đồ:** đặt **trên ô địch đi qua**; tích nổ khi đủ địch giẫm → bùng vùng. Phòng thủ "đặt trước", thưởng cho đọc đường đi.
- L3: đặt được 2 bẫy / hồi nhanh.

**🏹 Mèo Tiễn Bão** · *Đa làn cận · Vật lý · bắn loạt 3 làn (làn nó + 2 làn kề), tầm ngắn*
- **Ý đồ:** lấp giữa "đơn làn (Cung Thủ)" và "mọi làn (Sấm)". Mạnh khi địch tràn nhiều làn gần nhau.
- L3: +1 mũi mỗi loạt / xuyên 1 lớp.

**🐟 Mèo Đầu Bếp** · *Kinh tế–hỗ trợ · —*
- **Ý đồ:** biến thể kinh tế *chủ động*: tạo "khẩu phần" hồi máu vùng + vàng ít hơn Mỏ. Cho lối chơi "trường kỳ" thiên thủ.
- L3: khẩu phần cũng +tốc đánh tạm thời.

> **Lưu ý cân bằng khi thêm:** mỗi đơn vị mới phải *lấp một câu hỏi địch chưa được trả lời tốt*, không chỉ "thêm DPS". Khoan Giáp ↔ Giáp Trùng; Tiễn Bão ↔ swarm đa làn; Bẫy ↔ đợt số đông bùng nhanh.

---

## 4. Danh bạ Kẻ địch (Enemy Codex)

Định dạng: **hành vi · hồ sơ kháng · "câu hỏi" → "đáp án" · biến thể**.

### Bộ 7 kẻ địch nền (đã có — gán hệ kháng)

| Địch | Hành vi | Kháng | Câu hỏi → Đáp án |
|---|---|---|---|
| 👺 Tiểu Quỷ | cơ bản, số đông | — | *swarm?* → AoE (Pháo/Băng/Bẫy) |
| 👹 Orc | chậm, máu cao | **+Giáp** (chặn Vật lý) | *giáp dày?* → Khoan Giáp / phép (Sét/Lửa) |
| 🐺 Sói | rất nhanh | — | *áp lực thời gian?* → Chậm (Băng/Độc) + chặn |
| 💀 Khiên Xương | chặn N đòn đầu | Bất tử: **−Holy (yếu)**, +Vật lý khi còn khiên | *khiên?* → đòn nhiều nhịp / Thần (Tăng Lữ) |
| 🧙 Triệu Hồi Sư | đẻ lính định kỳ | Bất tử: **−Holy** | *sinh sản?* → diệt nhanh (đơn mục tiêu/Sấm) |
| 🥷 Thích Khách | nhanh, **né đạn**, nhảy xuyên | né **Vật lý** | *né & xuyên tuyến?* → AoE/phép không-né (Băng/Sét/Độc) |
| 👿 Trùm | máu khủng, đánh mạnh | **+mọi hệ nhẹ**, **kháng khống chế (DR)** | *bài kiểm tra tổng hợp* → kinh tế + dồn sát thương + Hở Giáp |

### 🆕 Năm kẻ địch mở rộng (đa dạng "câu hỏi" — M2/M3)

| Địch | Hành vi | Kháng | Câu hỏi → Đáp án |
|---|---|---|---|
| 🦇 Dơi Bóng (bay) | **bay** — bỏ qua quân chắn, chỉ trúng đòn xa/AoE/xuyên làn | — | *bay vượt tuyến?* → Cung/Sấm/Pháo (không phụ thuộc chặn) |
| 🪲 Giáp Trùng | rất chậm, **giáp & kháng Vật lý cực cao** | **+0.7 Vật lý**, **−0.3 Lửa** | *miễn vật lý?* → **Khoan Giáp** + Lửa |
| 🟢 Nhớt Phân Thân | trúng chết → **tách 2 con nhỏ** | −Lửa (cháy chặn tách) | *càng đánh càng đông?* → Lửa (thiêu) / dồn 1 phát to |
| 🩹 Pháp Sư Hắc Ám | **hồi máu** địch quanh nó | Bất tử: **−Holy** | *cả đám hồi máu?* → diệt nó trước (ưu tiên mục tiêu) |
| 🧟 Trùng Sĩ (mini-boss) | máu cao + **kháng băng** | **+0.6 Băng** | *miễn làm chậm?* → đổi sang DoT/đơn mục tiêu |

### Affix tinh hoa (Elite) 🆕 — gắn vào địch thường ở đợt cao
`Nhanh` (+spd) · `Giáp Dày` (+armor) · `Tái Sinh` (hồi máu) · `Băng Miễn` (kháng băng) · `Nổ Tử Vong` (chết phát nổ) · `Khiên Phép` (chặn đòn phép đầu). Mỗi elite gắn 1–2 affix, viền sáng đặc trưng để **đọc được ngay** (Nguyên tắc 3).

---

## 5. Hệ Cộng hưởng theo lân cận (Adjacency Synergy) 🆕

Mở rộng ý tưởng hào quang Thánh Sứ thành **bàn cờ bố cục**: đặt đúng cạnh nhau → thưởng. Khuyến khích quyết định không gian (Trụ cột P1).

| Cộng hưởng | Bố cục | Hiệu quả |
|---|---|---|
| 🛡️➡️🏹 **Tuyến Vững** | Hiệp Sĩ đứng *trước* quân bắn cùng làn | quân bắn +10% dmg (yên tâm dồn hoả lực) |
| ❄️+💣 **Bộ Đôi Vỡ Băng** | Băng Thần & Pháo cùng phủ một vùng | kích **Shatter** thường xuyên (xem §1.4) |
| ☠️+💣 **Lò Thiêu Độc** | Tháp Độc & Pháo gần nhau | kích **Ignite** liên hoàn |
| ❄️+⚡ **Dòng Dẫn** | Băng (gây Ướt) & Sấm phủ chung | kích **Conduct** — sét quét diện |
| 🕊️ **Hào Quang** | Tăng Lữ L3 ở giữa cụm | +15% dmg & tốc đánh cho 4 ô kề |
| 🐟 **Bếp Ấm** | Đầu Bếp cạnh tuyến chắn | hồi máu nền nhẹ cho lân cận |

> Hiển thị bằng **đường nối phát sáng** giữa các ô cộng hưởng → người chơi *thấy* được dàn của mình đang "dệt" đúng.

---

## 6. Thiết kế Đợt & Trùm (Encounter Design)

### 6.1 Nguyên mẫu thành phần đợt (Composition Archetypes)
| Nguyên mẫu | Thành phần | Kiểm tra điều gì |
|---|---|---|
| **Swarm** | nhiều Tiểu Quỷ/Sói | có AoE/kiểm soát không |
| **Đẩy Tank** | Orc/Giáp Trùng dẫn đầu | có phá giáp/đơn mục tiêu không |
| **Hỗn hợp** | tank + swarm + 1 đặc biệt | có cân bằng dàn không |
| **Áp lực tốc độ** | Sói + Thích Khách | có Chậm + đòn không-né không |
| **Vây hãm** | Khiên Xương + Triệu Hồi + Hắc Ám | có ưu tiên mục tiêu & dồn sát thương không |
| **Trùm** | 1 Trùm + tuỳ tùng | tổng hợp tất cả |

### 6.2 Kịch bản 15 đợt đầu (đường cong dạy & áp lực)
| Đợt | Nguyên mẫu | Giới thiệu | Dạy người chơi |
|---:|---|---|---|
| 1 | Swarm nhẹ | Tiểu Quỷ | đặt quân, bắn theo làn |
| 2 | Swarm + 1 Orc | Orc | giáp ⇒ cần sát thương dồn |
| 3 | Áp lực tốc độ | Sói | tốc độ ⇒ cần Chậm/chặn |
| 4 | Hỗn hợp | — | quản nhiều làn |
| 5 | **TRÙM (Lang)** | Trùm map | dồn sát thương vào 1 mục tiêu |
| 6 | Vây hãm nhẹ | Khiên Xương | đòn nhiều nhịp / Thần |
| 7 | Đẩy Tank | — | kinh tế để mua đủ |
| 8 | Hỗn hợp + Triệu Hồi | Triệu Hồi Sư | ưu tiên diệt nguồn đẻ |
| 9 | Áp lực + Thích Khách | Thích Khách | đòn **không-né** (phép/AoE) |
| 10 | **TRÙM (Hoả Nhân)** | — | dàn AoE + chịu sát thương lửa |
| 11 | Swarm dày + 🦇 Dơi | Dơi Bóng | địch **bay** ⇒ cần đòn xa |
| 12 | Đẩy Tank + 🪲 Giáp Trùng | Giáp Trùng | **phá giáp** + Lửa |
| 13 | Hỗn hợp + 🟢 Phân Thân | Nhớt | Lửa/đòn to chặn tách |
| 14 | Vây hãm + 🩹 Hắc Ám | Pháp Sư Hắc Ám | cắt nguồn hồi máu |
| 15 | **TRÙM (Lich)** | — | tổng hợp: phép + Holy + kiểm soát |

> Sau đợt 15: vòng lặp các nguyên mẫu với **mật độ & affix elite** tăng dần, Trùm xen kẽ mỗi 5 đợt — vùng "đua kỷ lục" (BALANCE §8).

### 6.3 Ba Trùm theo bản đồ 🆕 (thay slot Trùm đơn hiện tại)
| Trùm | Bản đồ | Cơ chế đặc trưng | Điểm yếu |
|---|---|---|---|
| 🐺 **Lang Vương** | Rừng Mưa | hú **triệu Sói** + nổi giận tăng tốc khi mất máu | dồn sát thương sớm, kiểm soát bầy |
| 🔥 **Hoả Nhân** | Núi Lửa | **hào quang thiêu** quân kề; **miễn Lửa**; để lại vũng dung nham | đánh từ xa, dùng Băng/Vật lý |
| ☠️ **Lich Vương** | Hầm Ngục | **hồi sinh** xác địch đã chết; triệu Khiên Xương | **Holy** (Tăng Lữ), dọn xác nhanh, Hở Giáp |

---

## 7. Bản đồ & Cơ chế môi trường 🆕

Biến nền (đã có `weather`) thành **biến số chiến thuật**, không chỉ trang trí:

| Bản đồ | Cơ chế môi trường | Hệ quả chiến thuật |
|---|---|---|
| 🌲 **Rừng Mưa** | mưa khiến **mọi địch Ướt nhẹ** | **Sét mạnh hơn** sẵn ⇒ thưởng lối chơi Sấm/Dẫn Điện |
| 🌋 **Núi Lửa** | vài ô thành **ô nóng** theo chu kỳ (đặt quân lên bị thiêu nhẹ); địch thiên về kháng Lửa | tránh đặt ô nóng; ưu tiên Băng/Vật lý/Sét |
| 🪦 **Hầm Ngục** | **tối** (đã có vignette) ⇒ **giảm tầm đánh xa ~15%**; nhiều địch Bất Tử | đề cao cận chiến/tháp vùng & **Holy**; bố trí gần hơn |

> Mỗi map vì thế *ưu ái một số lối build* nhưng không cấm các lối khác ⇒ tạo lý do chơi lại cả 3 map với dàn khác nhau.

---

## 8. Nhịp mở khoá nội dung (Unlock Cadence) 🆕

Luôn cho người chơi **mục tiêu kế tiếp gần** (kéo dài tuổi thọ — GAME_DESIGN §7):

| Mốc đạt được | Mở khoá |
|---|---|
| Bắt đầu | 8 đơn vị nền + 4 nội tại + map Rừng Mưa |
| Thắng Trùm đợt 5 | Map Núi Lửa |
| Đạt đợt 10 | 🆕 **Mèo Khoan Giáp** (sau khi gặp Giáp Trùng) |
| Thắng Trùm đợt 10 | Map Hầm Ngục |
| Đạt đợt 12 | 🆕 **Mèo Tiễn Bão** |
| Đạt đợt 15 | 🆕 **Mèo Đặt Bẫy** + cây nội tại mở rộng |
| Kỷ lục 20+ | 🆕 skin/màu + chế độ Thử Thách (seed hằng ngày, PHYSICS §10) |

> Đơn vị mới mở **ngay sau khi gặp câu hỏi mà nó trả lời** (gặp Giáp Trùng → mở Khoan Giáp) ⇒ người chơi hiểu *vì sao* nó tồn tại, học khắc chế một cách tự nhiên.

---

## 9. Tóm tắt — vì sao bộ nội dung này "chắc"

- **Khép kín & nhất quán:** 6 hệ + giáp/kháng + 3 phản ứng + bộ trạng thái khớp với [PHYSICS.md](./PHYSICS.md); mọi con số treo vào [BALANCE.md](./BALANCE.md).
- **Bắt đầu được ngay:** chiều sâu (3 phản ứng, synergy) **dùng đúng 8 đơn vị đã có** — không phải chờ nội dung mới.
- **Đường phát triển rõ:** mỗi đơn vị/địch/affix mới đều lấp một *câu hỏi/đáp án* cụ thể, có mốc mở khoá gắn với trải nghiệm.
- **Tôn trọng 3 nguyên tắc:** mỗi địch đặt câu hỏi; không lựa chọn thống trị; đọc được trong nửa giây.

---

## 10. Bước tiếp theo (đề xuất, vẫn ở khâu thiết kế/nội dung)

Làm chắc từng bước theo thứ tự:
1. **Chốt bảng số chi tiết** cho giáp/kháng từng địch & 4 đơn vị mới → đưa vào BALANCE.md dưới dạng bảng dữ liệu (data-driven, sẵn sàng để code đọc).
2. **Storyboard onboarding** đợt 1–3 (kịch bản chỉ dẫn theo bước) — nội dung dạy người mới.
3. **Bảng tra cứu hệ ↔ kháng** một trang (cheat-sheet trong game) để người chơi học khắc chế.

Sau khi nội dung được chốt, mới chuyển sang **M1 (code lõi mô phỏng)** theo [PHYSICS.md §14](./PHYSICS.md).

*Quay lại [docs/README.md](./README.md) · [GAME_DESIGN.md](./GAME_DESIGN.md) · [PHYSICS.md](./PHYSICS.md) · [BALANCE.md](./BALANCE.md).*
