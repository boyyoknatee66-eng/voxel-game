# Voxel Game

เกมโลกบล็อก (voxel) สไตล์ Minecraft เล่นในเบราว์เซอร์ได้เลย สร้างด้วย [Three.js](https://threejs.org/) ล้วนๆ ไม่มี backend — เป็น static site เอาขึ้น GitHub Pages ได้ทันที

## ฟีเจอร์

- โลกแบบ chunk (16×64×16) โหลด/ปลดโหลดรอบตัวผู้เล่นอัตโนมัติ
- สร้างภูมิประเทศด้วย simplex noise (เนิน หุบเขา ชายหาด น้ำ หิมะบนยอดเขา ต้นไม้)
- เดินมุมมองบุคคลที่หนึ่ง (pointer lock) เดิน/วิ่ง/กระโดด ชนกำแพง/พื้นได้จริง (AABB collision)
- ทุบบล็อก (คลิกซ้าย) / วางบล็อก (คลิกขวา) พร้อม raycast แบบ voxel
- Hotbar เลือกชนิดบล็อก (กด 1-7 หรือเลื่อนสกรอลล์)
- กล่องไฮไลต์บล็อกที่มอง, เงา, หมอกระยะไกล, HUD แสดง FPS/ตำแหน่ง

## โครงสร้างโปรเจกต์

```
src/
  main.js              จุดเริ่มเกม: ตั้ง renderer/scene/camera, game loop
  world/
    blocks.js          นิยามชนิดบล็อกและสี
    chunk.js           โครงสร้างข้อมูล chunk + สร้าง mesh (culled-face meshing)
    terrain.js         สร้างภูมิประเทศด้วย simplex noise
    world.js           จัดการ chunk ทั้งหมด, สตรีมเข้า/ออก, raycast, get/set block
  player/
    player.js          ควบคุมผู้เล่น (การเคลื่อนที่, แรงโน้มถ่วง, การชน)
    interaction.js      ทุบ/วางบล็อก, hotbar UI, ไฮไลต์บล็อก
```

## เริ่มพัฒนา

ต้องมี [Node.js](https://nodejs.org/) (แนะนำ v18 ขึ้นไป) ติดตั้งไว้ก่อน

```bash
npm install
npm run dev
```

เปิด `http://localhost:5173` แล้วคลิกที่หน้าจอเพื่อล็อกเมาส์แล้วเริ่มเล่น

**บังคับเลี้ยว:**
- `W A S D` หรือลูกศร — เดิน
- `Shift` — วิ่ง
- `Space` — กระโดด
- คลิกซ้าย — ทุบบล็อก
- คลิกขวา — วางบล็อก
- `1-7` หรือสกรอลล์ — เลือกชนิดบล็อกใน hotbar
- `Esc` — ปลดล็อกเมาส์

## Build สำหรับ production

```bash
npm run build
npm run preview   # ลองดูผลลัพธ์ build ก่อนเอาขึ้นจริง
```
ไฟล์ที่ build แล้วจะอยู่ใน `dist/`

## เอาขึ้น GitHub Pages

โปรเจกต์นี้มี workflow (`.github/workflows/deploy.yml`) ที่ build และ deploy ขึ้น GitHub Pages อัตโนมัติทุกครั้งที่ push เข้า branch `main` ให้ทำตามนี้ครั้งแรก:

1. สร้าง repo บน GitHub แล้ว push โค้ดนี้ขึ้นไป (ดูคำสั่งด้านล่าง)
2. ไปที่ repo → **Settings → Pages**
3. ในหัวข้อ **Build and deployment** เลือก **Source: GitHub Actions**
4. push ขึ้น `main` อีกครั้ง (หรือรัน workflow เองที่แท็บ **Actions**) รอสักครู่แล้วเว็บจะขึ้นที่ `https://<username>.github.io/<repo-name>/`

```bash
git init
git add .
git commit -m "Initial voxel game"
git branch -M main
git remote add origin https://github.com/<username>/<repo-name>.git
git push -u origin main
```

## ปรับแต่งต่อยอด

- เพิ่มชนิดบล็อกใหม่: แก้ `src/world/blocks.js`
- เปลี่ยนรูปแบบภูมิประเทศ (ภูเขาสูงขึ้น/ทะเลทราย ฯลฯ): แก้ `src/world/terrain.js`
- เพิ่ม inventory เก็บบล็อกที่ทุบได้จริง, การเซฟโลกลง localStorage, มัลติเพลเยอร์ (ต้องมี backend/websocket เพิ่ม) ฯลฯ

## License

MIT — เอาไปแก้ ต่อยอด หรือใช้เรียนรู้ได้อิสระ
