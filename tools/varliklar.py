"""Evil Eye on Mars varlık üretici: Mars dokuları ve MOLA rakım ızgarası.
Gereksinim: Python 3.9+ ve Pillow (pip install pillow). İnternet gerekir (~70 MB indirme).
Çıktı: public/assets/mars-konumlama/{mars-4k.jpg, mars-kabartma.jpg, mars-mini.jpg, mola-4ppd.bin.gz}
Kaynaklar (kamu malı): NASA/USGS Viking MDIM 2.1 renkli mozaik (Wikimedia Commons), MGS MOLA MEGDR 16 piksel/derece (NASA PDS).
"""
import array, gzip, os, sys, urllib.request
from PIL import Image, ImageOps

Image.MAX_IMAGE_PIXELS = None
CIKTI = os.path.join('public', 'assets', 'mars-konumlama')
os.makedirs(CIKTI, exist_ok=True)
VIKING_URL = 'https://upload.wikimedia.org/wikipedia/commons/1/1f/Mars_Viking_MDIM21_ClrMosaic_1km.jpg'
MOLA_URL = 'https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg016/megt90n000eb.img'


def indir(url, hedef):
    if os.path.exists(hedef):
        print('var:', hedef)
        return
    print('indiriliyor:', url)
    istek = urllib.request.Request(url, headers={'User-Agent': 'ares-dss-varlik/1.0 (egitim amacli)'})
    with urllib.request.urlopen(istek) as y, open(hedef, 'wb') as d:
        while True:
            parca = y.read(1 << 20)
            if not parca:
                break
            d.write(parca)


# 1) Dokular: 21339x10670 eşdikdörtgen (boylam 0 merkezde, -180..180; Olympus Mons ≈ -134°, Hellas ≈ +70°)
indir(VIKING_URL, 'viking.jpg')
im = Image.open('viking.jpg')
im.resize((4096, 2048), Image.LANCZOS).save(os.path.join(CIKTI, 'mars-4k.jpg'), quality=82, optimize=True, progressive=True)
ImageOps.autocontrast(ImageOps.grayscale(im.resize((2048, 1024), Image.LANCZOS)), cutoff=1).save(
    os.path.join(CIKTI, 'mars-kabartma.jpg'), quality=80, optimize=True)  # yalnızca görsel gölgelendirme, veri değil
im.resize((1024, 512), Image.LANCZOS).save(os.path.join(CIKTI, 'mars-mini.jpg'), quality=82, optimize=True)

# 2) MOLA rakım: 5760x2880 int16 (MSB), satır 0 = 90°K, sütun 0 = 0°D. 4x4 ortalamayla 1440x720'ye indir.
indir(MOLA_URL, 'mola16.img')
ham = array.array('h')
with open('mola16.img', 'rb') as f:
    ham.frombytes(f.read())
if sys.byteorder == 'little':
    ham.byteswap()  # MSB tamsayı
W, H, F = 5760, 2880, 4
w, h = W // F, H // F
u = []
for y in range(h):
    for x in range(w):
        s = 0
        for dy in range(F):
            taban = (y * F + dy) * W + x * F
            for dx in range(F):
                s += ham[taban + dx]
        u.append(int(round(s / (F * F))) + 8500)  # 0..65535 aralığına kaydır
assert min(u) >= 0 and max(u) < 65536
yuksek = bytes((v >> 8) & 255 for v in u)  # bayt düzlemleri: gzip çok daha iyi sıkıştırır
dusuk = bytes(v & 255 for v in u)
with open(os.path.join(CIKTI, 'mola-4ppd.bin.gz'), 'wb') as f:
    f.write(gzip.compress(yuksek + dusuk, 9))

# 3) Doğrulama: Jezero ≈ -2,6 km, Olympus Mons ≈ +20 km
def rakim(enlem, boylam):
    x = int(((boylam % 360) / 360) * w) % w
    y = min(h - 1, max(0, int((90 - enlem) / 180 * h)))
    return (u[y * w + x] - 8500) / 1000
print('Jezero  (beklenen ≈ -2,6 km):', rakim(18.38, 77.58))
print('Olympus (beklenen ≈ +20 km):', rakim(18.65, -133.8))
print('Hazır:', os.listdir(CIKTI))
