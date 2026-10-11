# Genera icons/icon-192.png, icon-512.png y apple-touch-icon.png (sin dependencias). Dibujo en el 80% central (maskable).
import zlib, struct
def make(n, path):
    bg, wh, dk = (79,70,229), (255,255,255), (40,36,120)
    a, b, t0, t1 = int(n*.28), int(n*.72), int(n*.2), int(n*.8)
    d0, d1 = int(n*.26), int(n*.38)
    dots = [(a+(b-a)*(i+1)//4, int(n*.5)+int(n*.1)*j) for i in range(3) for j in range(3)]
    r2 = (n*.03)**2
    rows = bytearray()
    for y in range(n):
        rows.append(0)
        for x in range(n):
            c = bg
            if a <= x < b and t0 <= y < t1:
                c = dk if d0 <= y < d1 and a+int(n*.03) <= x < b-int(n*.03) else wh
                if c == wh and y > int(n*.44) and any((x-dx)**2+(y-dy)**2 < r2 for dx, dy in dots): c = bg
            rows += bytes(c)
    ch = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t+d) & 0xffffffff)
    open(path, 'wb').write(b'\x89PNG\r\n\x1a\n' + ch(b'IHDR', struct.pack('>IIBBBBB', n, n, 8, 2, 0, 0, 0)) + ch(b'IDAT', zlib.compress(bytes(rows))) + ch(b'IEND', b''))
for n, p in [(192,'icons/icon-192.png'), (512,'icons/icon-512.png'), (180,'icons/apple-touch-icon.png')]: make(n, p)
