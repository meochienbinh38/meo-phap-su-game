# Chính sách phiên bản

- `version.json` là nguồn phiên bản chính của game.
- Khi sửa game, cần cập nhật `version.json` trước.
- Các file `sw.js`, `version-sync.js`, `v311-runtime.js`, `v311-profile.js` phải dùng cùng số phiên bản hoặc đọc từ `version.json`.
- Sau mỗi lần sửa, kiểm tra nhanh bằng cách tìm các số phiên bản cũ trong repo.
