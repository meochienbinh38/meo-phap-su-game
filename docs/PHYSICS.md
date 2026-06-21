# ⚙️ Đặc tả Vật lý & Mô phỏng — Kỷ Nguyên Thủ Thành

> Phần trọng tâm kỹ thuật. Mục tiêu: một mô hình mô phỏng **xác định (deterministic), ổn định, hiệu năng cao** và **dễ kiểm thử**, đủ "đã tay" mà không cần engine vật lý bên ngoài.
>
> Tài liệu vừa **mô tả mô hình mục tiêu** vừa **chỉ ra chỗ code hiện tại cần sửa** (phụ lục §14). Mã giả dùng cú pháp JS.

---

## 1. Triết lý mô phỏng

Đây là game thủ thành arcade, **không phải** mô phỏng vật lý thực. Ta theo **"arcade-deterministic"**:

- **Đủ thực để cảm thấy có lực** (đạn bay vòng cung, văng địch, nổ lan) nhưng **đơn giản để cân bằng và dự đoán**.
- **Xác định:** cùng đầu vào + cùng seed → cùng kết quả. Cho phép replay, kiểm thử tự động, công bằng.
- **Không dùng thư viện vật lý** (Box2D…): chi phí thừa cho lane-defense. Ta tự cài chuyển động + va chạm tối giản.
- **Mô phỏng tách rời render:** logic chạy ở bước thời gian cố định; render nội suy để mượt (xem §3.4).

**Bốn bất biến (invariants) phải luôn đúng:**
1. Không có toạ độ/HP nào là `NaN`/`Infinity` (§11).
2. Mô phỏng không phụ thuộc tốc độ khung hình (§3).
3. Đạn không "xuyên" mục tiêu do bước lớn (no tunneling, §5–6).
4. Mọi hiệu ứng trạng thái đều có thời gian hữu hạn và hội tụ (§8).

---

## 2. Hệ toạ độ, đơn vị & lưới

### 2.1 Ba hệ toạ độ
| Hệ | Đơn vị | Dùng cho |
|---|---|---|
| **Lưới (grid)** | ô (col, row) | đặt quân, vật cản, logic làn |
| **Thế giới (world)** | pixel-CSS | vị trí thực thể, vật lý, va chạm |
| **Màn hình (screen)** | pixel-thiết bị | chỉ ở khâu vẽ (nhân `devicePixelRatio`) |

### 2.2 Lưới & ánh xạ
- Lưới cố định **`rows = 6`, `cols = 11`** (logic). Số cột *vẽ* (`grid.cols`) co theo bề rộng thực.
- Kích thước ô `S = grid.size` = `min(viewportW/cols, viewportH/rows)`, kẹp trần 78px (giữ tỉ lệ trên màn lớn).
- Lề căn giữa: `offsetX`, `offsetY`. Tâm ô `(c, r)`:
  ```
  worldX = offsetX + c·S + S/2
  worldY = offsetY + r·S + S/2
  ```
- Chuyển chạm → ô:
  ```
  c = floor((touchX − offsetX) / S)
  r = floor((touchY − offsetY) / S)
  ```
- **Mọi khoảng cách/tầm đánh tính bằng bội số của `S`** (ví dụ `range: 6.0` ⇒ `6·S` pixel). Nhờ đó game *tự co giãn* theo màn hình mà cân bằng không đổi. Đây là một quyết định vật lý quan trọng: **đơn vị độ dài chuẩn hoá theo ô, không theo pixel tuyệt đối.**

### 2.3 Làn (lane)
- Địch di chuyển **theo trục X** trong một **hàng cố định** (`row`). Trục Y gần như bất biến cho địch ⇒ bài toán va chạm rút về **1 chiều theo từng làn** (rất rẻ).
- Ngoại lệ: Thần Sét (`laser`) nhắm **xuyên làn**; Tháp Độc (`pulse`) tác động **theo bán kính** (2D thật trong vùng nhỏ).

---

## 3. Vòng lặp & Bước thời gian (Time-step) — *nền móng*

### 3.1 Vấn đề của hiện tại
Code hiện dùng **dt biến thiên** (`dt = min(realΔt, 0.05)`) và mô phỏng tốc độ x2 bằng cách **gọi `update(dt)` hai lần**. Hệ quả:
- **Không xác định:** kết quả phụ thuộc FPS máy.
- **Tunneling:** đạn nhanh (`pSpeed=700`) trong một bước `dt=0.05` đi `35px`; nếu mục tiêu mỏng hơn → xuyên qua không trúng.
- **Bất ổn:** khi giật khung (tab nền), `dt` nhảy → vật lý "nhảy cóc".

### 3.2 Giải pháp: Fixed timestep + accumulator
Cố định bước mô phỏng **`FIXED_DT = 1/60 s`**. Tích luỹ thời gian thực rồi tiêu thụ theo từng bước cố định:

```js
const FIXED_DT = 1 / 60;          // bước mô phỏng cố định
const MAX_STEPS = 5;              // chống "spiral of death"
let acc = 0;

function frame(now) {
  let real = (now - last) / 1000; last = now;
  real = Math.min(real, 0.25);    // kẹp khi tab vừa quay lại
  acc += real * State.speed;      // x2 = đổ thời gian nhanh gấp đôi (KHÔNG đổi FIXED_DT)

  let steps = 0;
  while (acc >= FIXED_DT && steps < MAX_STEPS) {
    savePrevState();              // cho nội suy render
    simulate(FIXED_DT);           // <-- toàn bộ vật lý ở đây, dt là HẰNG SỐ
    acc -= FIXED_DT; steps++;
  }
  if (steps === MAX_STEPS) acc = 0; // bỏ nợ thời gian, tránh xoắn ốc tử thần

  const alpha = acc / FIXED_DT;   // 0..1
  render(alpha);                  // nội suy giữa prev và current
  requestAnimationFrame(frame);
}
```

**Lợi ích:** xác định, ổn định; *tăng tốc x2 = đổ thời gian nhanh hơn* (đúng nghĩa) chứ không phải "bước to hơn" → **không gây tunneling**.

### 3.3 Vì sao `FIXED_DT` là hằng số lại quan trọng cho cân bằng
Mọi công thức `value × dt` (DoT, hồi chiêu, di chuyển) trở nên **độc lập máy**. Bảng cân bằng (BALANCE.md) tính một lần là đúng trên mọi thiết bị.

### 3.4 Nội suy render (Render interpolation)
Lưu `prevX/prevY` mỗi thực thể trước mỗi bước. Khi vẽ:
```
drawX = lerp(prevX, x, alpha)   // lerp(a,b,t) = a + (b−a)·t
```
⇒ hình ảnh mượt 60–120Hz dù mô phỏng chạy 60Hz. (Hiện tại render trực tiếp `x`, sẽ hơi giật khi FPS ≠ 60.)

### 3.5 Trạng thái tạm dừng
Tạm dừng ⇒ **không tích luỹ `acc`**, vẫn `render(alpha=1)` (đứng yên). Sự kiện hồi chiêu/`setTimeout` (ví dụ ult delay 300ms) nên chuyển sang **đếm theo thời gian mô phỏng**, không dùng `setTimeout` (vốn chạy cả khi pause). Đây là một sửa đổi cần làm: thay `setTimeout` trong `castUlt` bằng một *scheduler theo simTime*.

---

## 4. Chuyển động kẻ địch

### 4.1 Vận tốc cơ bản (theo làn, hướng −X)
```
speed_eff = spd · slowFactor          // slowFactor = (1 − slowAmt) nếu đang chậm, ngược lại 1
x += −speed_eff · dt                   // địch tiến về thành trì bên trái
```
`spd` tính bằng **pixel/giây** ở mức cơ bản; nên đổi sang **ô/giây** (`spd_ô · S`) để chuẩn hoá theo lưới như §2.2 (việc cần làm).

### 4.2 Chặn làn (blocking) & va chạm cận chiến
Một đơn vị *chặn* (không phải `pulse`) đứng cùng làn sẽ chặn địch khi khoảng cách X đủ gần:
```
if (u.row === e.row && type(u) ≠ pulse && 0 < (e.x − u.x) < 0.6·S)  → e bị chặn bởi u
```
Khi bị chặn: địch **dừng tiến**, đánh đơn vị theo nhịp `aspd`:
```
if (atkCd ≤ 0) { u.takeDamage(e.dmg); e.atkCd = e.aspd; applyKnockback(e, +5) }
```

### 4.3 Đẩy lùi (Knockback) như **xung lực giảm dần**
Mô hình impulse 1 chiều, giảm tuyến tính:
```
e.kb += impulse                        // ví dụ +5 (đơn vị px/frame-scale)
mỗi bước:  e.x += e.kb · dt
           e.kb −= KB_DECAY · dt        // KB_DECAY ≈ 120
           e.kb = max(0, e.kb)
```
- **Miễn knockback:** Trùm/`isHeavy` (khối lượng lớn) bỏ qua `kb` → tạo cảm giác "nặng".
- Khi đang `kb`, địch *không tự đi* (xung lực thắng vận tốc) — đã đúng trong code, giữ.

### 4.4 Hành vi đặc biệt (state machine nhỏ)
- **Nhảy xuyên (Thích Khách):** khi gặp lính chặn lần đầu (`!jp`), dịch `x −= 1.2·S`, đặt `jp=true` (chỉ nhảy 1 lần) → vượt qua tuyến đầu. Mô hình *dịch chuyển tức thời có điều kiện*.
- **Triệu hồi:** đếm `summonTimer`; chạm 0 → spawn lính con ngay sau lưng (`x − S`). 
- **Né (evade):** xác suất `evade` khi *trúng đạn* (xử lý ở va chạm đạn, không phải di chuyển), §5.1.

---

## 5. Vật lý đạn (Projectiles) — *nơi cần đầu tư nhất*

Bốn mô hình đạn, mỗi loại một bài toán vật lý riêng.

### 5.1 Đạn thẳng (Linear) — cần **collision quét (swept)** chống tunneling
**Hiện tại:** đạn nhích `x += pSpeed·dt`, rồi kiểm tra trúng bằng cửa sổ `|e.x − x| < 20`. Bước lớn → có thể *nhảy qua* địch mỏng.

**Mục tiêu — quét đoạn di chuyển trong từng bước:**
```
x0 = x;  x1 = x + pSpeed · dt          // đoạn [x0, x1] đã đi trong bước này
với mỗi địch e cùng băng làn (|e.y − projY| < R_hit):
   // địch như AABB bề rộng wE quanh e.x
   if  overlap1D([x0 − R, x1 + R], [e.x − wE/2, e.x + wE/2])  → trúng
```
- Lấy **mục tiêu trúng đầu tiên theo hướng bay** (x nhỏ nhất với đạn của quân nhà bay sang phải) để công bằng.
- **Né:** nếu `random() < e.evade` → hiện "Né!", đạn *vẫn tiếp tục* (với đạn thường) hoặc tính là trượt mục tiêu đó.
- **Xuyên thấu (Xạ Thủ Lv3):** không dừng, ghi `e` vào `hitSet`, tiếp tục quét các mục tiêu còn lại trong đoạn.
- **Đạn nổ (Pháo Thủ Lv3):** khi trúng → chuyển sang **AoE** tại điểm chạm (§7) thay vì sát thương đơn.

> Vì làn ràng buộc Y, "swept" rút về **kiểm tra chồng lấp 1 chiều trên X** — cực rẻ và chính xác tuyệt đối (không bao giờ tunneling).

### 5.2 Đạn vòng cung (Lobbed) — **đạn đạo thật (ballistic)**
**Hiện tại:** vị trí nội suy thẳng tới đích + độ cao giả `ar = sin(progress·π)·100`. Đẹp nhưng *không phải vật lý*: không có trọng lực, không dự đoán mục tiêu di chuyển.

**Mục tiêu — chuyển động ném xiên có trọng lực `g`:**
Cho điểm bắn `(x0, y0)`, đích `(xT, yT)`, chọn **thời gian bay `T`** theo khoảng cách (`T = clamp(dist/throwSpeed, Tmin, Tmax)`). Vận tốc đầu:
```
vx = (xT − x0) / T
vy = (yT − y0 − 0.5 · g · T²) / T        // g > 0 hướng xuống (+Y)
```
Cập nhật mỗi bước:
```
vy += g · dt
x  += vx · dt
y  += vy · dt
nổ khi  t ≥ T  hoặc  chạm đất đích
```
- **Độ cao cung** sinh ra *tự nhiên* từ `g` và `T` (không cần `sin` giả). Đỉnh cung: `h = vy²/(2g)`.
- Đổ bóng = vẽ ellipse tại `(x, yGround)` với `yGround` = đường đất của đích; thân đạn vẽ tại `(x, y)`.

**Dự đoán điểm chạm mục tiêu đang chạy (intercept):**
Địch chạy với vận tốc `vE` (theo −X). Giải thời điểm gặp cho đạn tốc độ vô hướng `s`:
```
// |P_target(t) − P_shooter| = s·t , với P_target(t) = T0 + vE·t
a = vE·vE − s²
b = 2 · (T0 − S0)·vE
c = (T0 − S0)·(T0 − S0)
t* = nghiệm dương nhỏ nhất của a·t² + b·t + c = 0
điểm ngắm = T0 + vE·t*
```
Dùng `điểm ngắm` làm đích `(xT,yT)` cho công thức ballistic ở trên ⇒ đạn vòng cung **đón đầu** mục tiêu (cảm giác thông minh, ăn tiền). Nếu vô nghiệm (mục tiêu chạy nhanh hơn đạn) → bắn vào vị trí hiện tại.

### 5.3 Đạn dò tìm (Homing) — *đề xuất cho đơn vị mới*
Lái theo mục tiêu với **giới hạn tốc độ quay** (turn rate) để không "bẻ lái" phi lý:
```
desired = normalize(target − pos)
vel = rotateTowards(vel, desired, maxTurn · dt)   // giới hạn góc quay/giây
pos += vel · speed · dt
```
- Có thể mất mục tiêu (bay quá đà) → tạo *khoảnh khắc đẹp* và cân bằng (không phải lúc nào cũng trúng).

### 5.4 Sét dây chuyền (Chain) & Tia tức thời (hitscan)
Không có "bay" — là **truy vấn đồ thị mục tiêu**:
```
target = mục tiêu trong tầm (theo policy §9)
gây dmg, vẽ tia (beam) tại frame đó
chain (Lv3): từ target, lặp k lần:
   next = địch gần nhất CHƯA trúng trong bán kính R_chain
   nếu có → dmg · falloff^hop, thêm vào hitSet, nhảy tiếp
```
- Tia là hiệu ứng tức thời (`beam.l` giảm dần để vẽ), **không có va chạm vật lý** — sát thương áp ngay khi bắn. Đúng bản chất "tia sét".

---

## 6. Va chạm & Truy vấn không gian (Collision & Spatial Queries)

### 6.1 Hình va chạm
- **Địch/Quân:** hình **tròn** bán kính `r = 0.3·S·size` (đủ tốt cho cảm giác; rẻ hơn AABB xoay).
- **Đạn thẳng:** đoạn thẳng theo X (swept, §5.1) với bán dày `R_hit ≈ 0.18·S`.
- **AoE:** hình tròn bán kính `R` (so sánh bình phương khoảng cách, tránh `sqrt`).

Kiểm tra tròn-tròn (luôn dùng **bình phương**, không `hypot`, để nhanh & ổn định):
```
dx = a.x−b.x; dy = a.y−b.y
hit = (dx·dx + dy·dy) ≤ (ra+rb)²
```

### 6.2 Broad-phase: **Spatial hash theo làn** (thay O(n²) hiện tại)
Hiện mỗi đơn vị quét **toàn bộ** `State.enemies` mỗi đòn ⇒ `O(units × enemies)`. Khi đông sẽ tụt FPS.

**Cấu trúc đề xuất (xây lại mỗi bước, rất rẻ):**
```
laneBuckets[row] = danh sách địch ở hàng đó, GIỮ SẮP XẾP theo x tăng dần
```
- **Quân theo làn** (đa số) chỉ quét `laneBuckets[u.row]` → giảm bậc độ phức tạp về gần `O(n)`.
- Vì đã sắp theo x, tìm "mục tiêu đầu tiên trong tầm" = **chặn nhị phân/duyệt sớm-dừng**.
- **Truy vấn bán kính (AoE/pulse/laser):** quét các làn `row ∈ [r−Δ, r+Δ]` với `Δ = ceil(R/S)`, trong mỗi làn chỉ xét dải `x ∈ [cx−R, cx+R]`.
- Thần Sét (xuyên làn) quét tất cả làn nhưng vẫn giới hạn theo dải X.

> Lựa chọn "bucket theo hàng + sort theo x" tận dụng đặc thù lane-defense ⇒ **đơn giản hơn uniform grid 2D** mà vẫn nhanh.

### 6.3 Thứ tự cập nhật trong một bước (deterministic order)
Để xác định và tránh lỗi phụ thuộc thứ tự:
```
1. spawn (đẻ địch theo hàng đợi)        4. cập nhật đạn + va chạm (swept)
2. cập nhật trạng thái (status tick)     5. áp sát thương, đánh dấu chết
3. cập nhật di chuyển (địch, quân)       6. dọn xác (filter), rơi vàng/XP
                                         7. cập nhật hạt/chữ nổi/beam (chỉ hình ảnh)
```
Luôn duyệt mảng **theo chỉ số tăng**; xoá bằng cách *đánh dấu rồi filter cuối bước* (không splice giữa vòng lặp gây lệch chỉ số).

---

## 7. Sát thương diện rộng (AoE) & Suy giảm theo khoảng cách (Falloff)

**Hiện tại:** AoE là *nhị phân* — trong bán kính ăn full, ngoài thì không. Thiếu chiều sâu & cảm giác.

**Mục tiêu — suy giảm theo khoảng cách** (tâm nổ đau nhất):
```
d = distance(center, e)
if d ≤ R:
    falloff = 1 − (d / R)            // tuyến tính; hoặc 1 − (d/R)²  (mượt hơn)
    dmg_e = dmg · clamp(falloff, FLOOR, 1)     // FLOOR ≈ 0.3 để rìa vẫn có tác dụng
```
- **Knockback hướng tâm:** vật văng ra xa tâm nổ → `impulse = K · falloff` theo hướng `(e − center)`.
- **Sàn sát thương (FLOOR):** tránh "trúng mà như không" ở rìa.
- Băng Thần áp **slow** trong vùng; Băng Thần Lv3 (bão tuyết) tăng `R×2` và `slowAmt` gần như đóng băng.

---

## 8. Hiệu ứng trạng thái (Status Effects) — mô hình thống nhất

Thay vì các biến rời rạc (`slowTimer/slowAmt`, `flash`, `stun`…), đề xuất **một hệ trạng thái chung**:

```js
// mỗi thực thể: e.status = { slow:[], poison:[], stun:0, burn:[], freeze:0, ... }
applyStatus(e, type, { amount, duration, stacks }) { ... }
tickStatus(e, dt) { ... }   // gọi ở bước 2 của vòng cập nhật
```

| Trạng thái | Hiệu ứng | Quy tắc chồng (stacking) |
|---|---|---|
| **Slow** (làm chậm) | `speed ×= (1 − amount)` | Lấy **mạnh nhất** (không cộng dồn) để tránh đứng im; gia hạn thời gian |
| **Stun/Freeze** (choáng/đóng băng) | không đi, không đánh | Lấy **dài nhất**; có *kháng choáng* tăng dần (DR) chống khoá cứng |
| **Poison/Burn** (DoT) | mất máu mỗi *tick* | **Cộng dồn theo stack**, mỗi stack có timer riêng |
| **Armor break** (giảm giáp) | tăng dmg nhận | Lấy mạnh nhất |

**DoT theo tick cố định** (độc lập FPS nhờ FIXED_DT):
```
poison.tickAcc += dt
while (poison.tickAcc ≥ TICK):           // TICK = 0.5s
    e.takeDamage(poison.dps · TICK)
    poison.tickAcc −= TICK
poison.duration −= dt   // hết hạn thì gỡ stack
```

**Giảm hiệu lực khống chế (Diminishing Returns)** cho stun/freeze để Trùm không bị "khoá chết":
```
hiệu_lực = base · DR,  với DR giảm dần mỗi lần dính trong cửa sổ thời gian ngắn
(ví dụ 100% → 50% → 25% → miễn nhiễm tạm thời)
```

---

## 9. Chính sách chọn mục tiêu (Targeting Policies)

Tách thành chiến lược cắm được (pluggable), mặc định theo vai trò; mở cho người chơi chọn ở M2:

| Policy | Mô tả | Hợp với |
|---|---|---|
| **First** | Địch gần thành trì nhất (x nhỏ nhất trong tầm) | Mặc định phòng thủ |
| **Nearest** | Gần tháp nhất | Cận chiến, pulse |
| **Strongest** | HP tối đa lớn nhất | Sát thương đơn diệt tank |
| **Lowest HP** | Dọn nốt để lấy vàng/giảm số lượng | Hỗ trợ |
| **Most clustered** | Tâm cụm đông nhất | AoE (Pháo/Băng) |

Hiện code lấy *gần nhất trong tầm cùng làn*. Chuẩn hoá thành interface `pickTarget(unit, candidates) → enemy|null`.

---

## 10. RNG xác định (Deterministic RNG)

`Math.random()` không seed được ⇒ không tái lập. Dùng PRNG seed (mulberry32):
```js
function mulberry32(seed){ return function(){
  seed|=0; seed=(seed+0x6D2B79F5)|0;
  let t=Math.imul(seed^seed>>>15,1|seed);
  t=(t+Math.imul(t^t>>>7,61|t))^t;
  return ((t^t>>>14)>>>0)/4294967296;
};}
const rng = mulberry32(runSeed);   // seed lưu theo ván
```
Dùng `rng()` cho **mọi** quyết định ảnh hưởng mô phỏng: bạo kích, né, loại địch trong đợt, vị trí spawn. Hạt/hiệu ứng *hình ảnh* có thể dùng `Math.random()` (không ảnh hưởng kết quả). Lợi ích: **replay, gỡ lỗi tái hiện, chế độ "seed thử thách hằng ngày"**.

---

## 11. Ổn định số học & chống NaN

Bản gốc từng có ghi chú lo ngại `NaN` toạ độ. Quy tắc cứng:

1. **Không bao giờ chia cho khoảng cách 0.** Trước khi `dx/dl`: `if (dl < ε) dl = ε` (ε ≈ 1e-4) hoặc bỏ qua.
2. **Kẹp `dt`** đầu vào mô phỏng (đã có FIXED_DT cố định ⇒ tự an toàn).
3. **Kẹp giá trị giao diện:** thanh máu `p = clamp(p, 0, 1)` (đã làm trong `bar()`).
4. **Bảo vệ `normalize`:** vector 0 → trả `(0,0)`, không `(NaN,NaN)`.
5. **Kẹp HP:** `hp = clamp(hp, 0, maxHp)`.
6. **Assert khi dev:** ở chế độ debug, kiểm tra `Number.isFinite(x,y,hp)` mỗi bước; log thực thể lỗi thay vì để lan ra.
7. **Không nuốt lỗi im lặng:** bỏ `try/catch` bao trùm `update()` (che bug như `this.xp` đã từng xảy ra); thay bằng xử lý lỗi có log rõ ràng + cờ "đã cảnh báo" để khỏi spam.

---

## 12. Hiệu năng (Performance Budget)

| Hạng mục | Ngân sách | Kỹ thuật |
|---|---|---|
| Thực thể động | ~300 | spatial hash §6.2 |
| Đạn | ~150 | **object pool** (tái dùng, không `new` mỗi phát) |
| Hạt (particles) | ~600, tự co theo FPS | pool + giảm khi FPS thấp |
| Cấp phát/khung | ~0 trong vòng nóng | tránh tạo mảng/đối tượng tạm trong `simulate` |
| Vẽ | 1 pass, theo lớp | gom theo loại, ít đổi `ctx.filter`/font |

**Object pool (mẫu):**
```js
const pool = []; 
function spawnProj(...) { const p = pool.pop() || new Proj(); p.init(...); active.push(p); }
function freeProj(p)   { p.active=false; pool.push(p); }   // không cấp phát lại
```
**Culling:** thực thể ra ngoài biên màn (đạn `x > W+margin`) → free ngay (đã có cho ProjLin, mở rộng cho mọi loại).
**Chế độ tiết kiệm:** tuỳ chọn giảm số hạt/tắt shake (đồng bộ với mục Khả năng tiếp cận ở GDD §9.5).

---

## 13. Bảng hằng số vật lý (đề xuất, tinh chỉnh ở BALANCE.md)

| Hằng số | Ký hiệu | Giá trị khởi điểm | Ghi chú |
|---|---|---|---|
| Bước mô phỏng | `FIXED_DT` | `1/60 s` | cố định |
| Trần bước/ khung | `MAX_STEPS` | `5` | chống spiral |
| Trọng lực đạn vòng cung | `g` | `1400 px/s²` (≈ `21·S/s²`) | quy theo ô để co giãn |
| Thời gian bay lob | `T` | `clamp(dist/throwSpeed, 0.35, 1.1) s` | quyết định độ cong |
| Suy giảm knockback | `KB_DECAY` | `120` | impulse → 0 |
| Bán kính va chạm | `r` | `0.30·S·size` | tròn |
| Bán dày đạn thẳng | `R_hit` | `0.18·S` | băng làn |
| Tick DoT | `TICK` | `0.5 s` | độc/cháy |
| Sàn sát thương AoE | `FLOOR` | `0.30` | rìa vụ nổ |
| Sàn sát thương sau giáp | — | `5% base` | tránh miễn nhiễm |
| Epsilon khoảng cách | `ε` | `1e-4` | chống chia 0 |

---

## 14. Phụ lục — Ánh xạ sang code hiện tại & việc cần làm

| Khu vực code hiện tại | Trạng thái | Hành động (mốc) |
|---|---|---|
| `Control.loop` dùng dt biến thiên + lặp `update` theo `speed` | ⚠️ tunneling/không xác định | Thay bằng **fixed timestep accumulator** §3 (M1) |
| `ProjLin.update` cửa sổ `|e.x−x|<20` | ⚠️ có thể xuyên | **Swept 1D** §5.1 (M1) |
| `ProjLob` độ cao `sin` giả, bay vào tâm | ⚠️ không phải vật lý | **Ballistic + intercept** §5.2 (M2) |
| Quét `State.enemies` mỗi đòn (O(n²)) | ⚠️ chậm khi đông | **Lane spatial hash** §6.2 (M1) |
| AoE nhị phân (ProjLob/gunner/ult) | ➕ thiếu chiều sâu | **Falloff + knockback hướng tâm** §7 (M2) |
| `slowTimer/slowAmt`, `stun`, `flash` rời rạc | ➕ khó mở rộng | **Hệ status thống nhất** §8 (M2) |
| `Math.random()` khắp nơi | ➕ không tái lập | **Seeded RNG** §10 (M1) cho nhánh ảnh hưởng mô phỏng |
| `try/catch` bao `update` nuốt lỗi | ⚠️ giấu bug | Bỏ, thay bằng log có kiểm soát §11 (M1) |
| `setTimeout` trong `castUlt` | ⚠️ chạy cả khi pause | **Scheduler theo simTime** §3.5 (M1) |
| Tạo `new Proj/particle` liên tục | ➕ GC giật | **Object pool** §12 (M1) |
| Khoảng cách bằng `Math.hypot` trong vòng nóng | ➕ chậm | So sánh **bình phương** §6.1 (M1) |
| `spd` theo pixel | ➕ không chuẩn hoá | Đổi sang **ô/giây** §4.1 (M2) |

**Thứ tự triển khai khuyến nghị (M1):**
`1` fixed timestep → `2` bỏ try/catch + seeded RNG → `3` swept collision → `4` spatial hash → `5` object pool. Bốn cái đầu *gỡ rủi ro* và mở đường cho AoE-falloff/status (M2).

---

*Quay lại [GAME_DESIGN.md](./GAME_DESIGN.md) · Xem công thức & bảng số ở [BALANCE.md](./BALANCE.md).*
