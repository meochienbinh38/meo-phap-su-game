# Kỷ Nguyên Thủ Thành 🏰

Game thủ thành (tower defense) chiến thuật chạy ngay trên trình duyệt — **cài được trên điện thoại như một ứng dụng thật (PWA)**.

Xây quân, nâng cấp, dùng nội tại vĩnh viễn và chặn đứng các đợt tấn công của quái vật qua nhiều chiến dịch.

## 🎮 Chơi
Mở `index.html` bằng trình duyệt (hoặc truy cập bản đã deploy). Chơi tốt nhất ở chế độ **nằm ngang**.

## 📱 Cài đặt lên điện thoại
Game là một **Progressive Web App**:

- **Android (Chrome):** mở trang → nhấn nút **"📥 Cài đặt vào màn hình chính"** ở menu, hoặc menu trình duyệt → *Cài đặt ứng dụng / Thêm vào màn hình chính*.
- **iPhone (Safari):** nút Chia sẻ → *Thêm vào màn hình chính*.

Sau khi cài, game **chạy offline** và mở toàn màn hình như app native.

## ✨ Tính năng
- 8 loại quân khác nhau (Mỏ vàng, Giáp sĩ, Xạ thủ, Pháo thủ, Tháp độc, Thần Sét, Băng Thần, Thánh Sứ), mỗi loại có kỹ năng đặc biệt khi đạt cấp 3.
- 3 chiến dịch với thời tiết riêng (Rừng Mưa, Núi Lửa, Hầm Ngục) và 7 loại quái (kể cả Trùm).
- **Âm thanh tổng hợp** (hiệu ứng + nhạc nền), bật/tắt tùy chọn.
- **Lưu tiến trình tự động**: nội tại vĩnh viễn, điểm SP và kỷ lục mỗi chiến dịch (localStorage).
- Tạm dừng, **tăng tốc x2**, toàn màn hình, rung phản hồi (haptic).
- Tối ưu cảm ứng cho điện thoại.

## 🛠️ Cấu trúc
- `index.html` — toàn bộ game (canvas + UI).
- `manifest.json` — khai báo PWA.
- `sw.js` — service worker (chạy offline, cache app shell).
- `icon-192.png`, `icon-512.png`, `icon-maskable.png` — biểu tượng ứng dụng.
- `docs/` — **tài liệu thiết kế game** (xem bên dưới).

## 📐 Tài liệu thiết kế
Game đã có bộ thiết kế hoàn chỉnh để phát triển tiếp:
- **[docs/GAME_DESIGN.md](./docs/GAME_DESIGN.md)** — thiết kế tổng thể: nội dung, đồ hoạ, kinh tế, kiến trúc, lộ trình.
- **[docs/PHYSICS.md](./docs/PHYSICS.md)** — đặc tả **logic vật lý & mô phỏng** (bước thời gian cố định, vật lý đạn, va chạm, hiệu ứng trạng thái…).
- **[docs/BALANCE.md](./docs/BALANCE.md)** — công thức số & bảng cân bằng.

> Lưu ý: PWA cần chạy qua **HTTPS** (hoặc `localhost`) để cài đặt và service worker hoạt động.
