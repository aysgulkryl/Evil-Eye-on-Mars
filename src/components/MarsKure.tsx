import * as THREE from 'three';
import { Stars, OrbitControls, useTexture, useProgress } from '@react-three/drei';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode, type RefObject, type MutableRefObject } from 'react';

import { INIS_RENKLERI } from '../data/inisler';
import { OZELLIK_GRUBU, OZELLIK_RENGI } from '../data/ozellikler';
import { konumVektoru, skorRengi, sutunYuksekligi, vektordenKonum } from '../utils/mcda';

import type { Aday } from '../data/adaylar';
import type { Inis } from '../data/inisler';
import type { Ozellik, OzellikGrup } from '../data/ozellikler';

// Dokular: NASA/USGS Viking MDIM 2.1 renkli mozaik (kamu malı), uygulamayla birlikte sunulur.
const DOKU_URL = '/assets/mars-konumlama/mars-4k.jpg';
const KABARTMA_URL = '/assets/mars-konumlama/mars-kabartma.jpg';

export type Odak = { enlem: number; boylam: number; mesafe: number; anahtar: number };
export type Sonda = { enlem: number; boylam: number; ozellikId?: string };
export type Isaret = { tip: 'aday' | 'inis'; id: string };
export type AdayDurum = { skor: number; sira: number; elendi: boolean };

type EtiketKutusu = { tip: 'aday' | 'ozellik'; id: string; sol: number; ust: number; sag: number; alt: number };

type KureProps = {
  adaylar: Aday[];
  durum: Record<string, AdayDurum>;
  inisler: Inis[];
  ozellikler: Ozellik[];
  adayGoster: boolean;
  inisGoster: boolean;
  adGoster: boolean;
  adGruplari: Record<OzellikGrup, boolean>;
  secili: Isaret | null;
  sonda: Sonda | null;
  odak: Odak | null;
  otoDonus: boolean;
  hareketAz: boolean;
  kart: ReactNode;
  ipucu: { metin: string; hedef: Isaret } | null;
  bakisIsaretiRef: RefObject<HTMLDivElement | null>;
  onIsaretSec: (i: Isaret) => void;
  onYuzeyTikla: (enlem: number, boylam: number, ozellikId?: string) => void;
  onBosTikla: () => void;
  onHover: (i: Isaret | null) => void;
};

const kisaAd = (ad: string) => ad.split(' ')[0];
const Y_EKSEN = new THREE.Vector3(0, 1, 0);
const GRI = new THREE.Color('#64748b');
const KIRMIZI = new THREE.Color('#f43f5e');

// Başlangıç bakışı: kuzey-orta enlemler (Jezero, Oxia, Mawrth) görünür olsun
const BASLANGIC_KAMERA = konumVektoru(16, 20).map((v) => v * 3.3) as [number, number, number];

// ---------------------------------------------------------------- zemin küre

function Graticule() {
  const geometri = useMemo(() => {
    const noktalar: number[] = [];
    const R = 1.0025;
    const ekle = (e: number, b: number) => noktalar.push(...konumVektoru(e, b).map((v) => v * R));
    for (let enlem = -60; enlem <= 60; enlem += 30) {
      for (let b = -180; b < 180; b += 4) {
        ekle(enlem, b);
        ekle(enlem, b + 4);
      }
    }
    for (let boylam = -180; boylam < 180; boylam += 30) {
      for (let e = -88; e < 88; e += 4) {
        ekle(e, boylam);
        ekle(e + 4, boylam);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(noktalar, 3));
    return g;
  }, []);
  useEffect(() => () => geometri.dispose(), [geometri]);
  return (
    <lineSegments geometry={geometri}>
      <lineBasicMaterial color="#9fd8ff" transparent opacity={0.1} depthWrite={false} />
    </lineSegments>
  );
}

function Atmosfer() {
  const materyal = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { renk: { value: new THREE.Color('#c95b42') } },
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          uniform vec3 renk;
          varying vec3 vNormal;
          void main() {
            float yogunluk = pow(max(0.0, 0.66 - dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
            gl_FragColor = vec4(renk, 1.0) * yogunluk * 1.25;
          }`,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    []
  );
  useEffect(() => () => materyal.dispose(), [materyal]);
  return (
    <mesh scale={1.09} material={materyal}>
      <sphereGeometry args={[1, 64, 64]} />
    </mesh>
  );
}

function Gezegen({ onTikla }: { onTikla: (e: ThreeEvent<MouseEvent>, enlem: number, boylam: number) => void }) {
  const [renk, kabartma] = useTexture([DOKU_URL, KABARTMA_URL]);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    renk.colorSpace = THREE.SRGBColorSpace;
    renk.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    renk.needsUpdate = true;
    kabartma.anisotropy = 4;
  }, [renk, kabartma, gl]);

  return (
    <mesh
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (e.delta > 6) return; // sürükleme tıklama sayılmasın
        e.stopPropagation();
        const k = vektordenKonum(e.point.x, e.point.y, e.point.z);
        onTikla(e, k.enlem, k.boylam);
      }}
    >
      <sphereGeometry args={[1, 128, 128]} />
      <meshStandardMaterial map={renk} bumpMap={kabartma} bumpScale={0.012} roughness={1} metalness={0} />
    </mesh>
  );
}

// ---------------------------------------------------------------- işaretler (örneklemeli: az sayıda çizim çağrısıyla tüm işaretler)

const yonleri = (liste: { enlem: number; boylam: number }[]) =>
  liste.map((o) => {
    const n = new THREE.Vector3(...konumVektoru(o.enlem, o.boylam));
    return { n, q: new THREE.Quaternion().setFromUnitVectors(Y_EKSEN, n) };
  });

/**
 * Aday bölge işaretleri: ince, uca doğru daralan gövde + küçük elmas baş + yüzeye oturan taban halkası.
 * Yükseklik bileşik skorla orantılıdır; kısıtlara takılan bölgede kısa, gri gövde ve ince kırmızı çarpı çıkar.
 */
function AdayDirekleri({
  adaylar,
  durum,
  seciliId,
  yukseklikler,
  onSec,
  onHover,
}: {
  adaylar: Aday[];
  durum: Record<string, AdayDurum>;
  seciliId: string | null;
  yukseklikler: MutableRefObject<Float32Array>;
  onSec: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const govde = useRef<THREE.InstancedMesh>(null);
  const tepe = useRef<THREE.InstancedMesh>(null);
  const taban = useRef<THREE.InstancedMesh>(null);
  const hit = useRef<THREE.InstancedMesh>(null);
  const kolA = useRef<THREE.InstancedMesh>(null);
  const kolB = useRef<THREE.InstancedMesh>(null);
  const kirli = useRef(true);
  const yon = useMemo(() => yonleri(adaylar), [adaylar]);
  const gecici = useMemo(
    () => ({ m: new THREE.Matrix4(), p: new THREE.Vector3(), s: new THREE.Vector3(), q: new THREE.Quaternion(), qa: new THREE.Quaternion(), c: new THREE.Color() }),
    []
  );
  const tabanGeometri = useMemo(() => new THREE.RingGeometry(0.016, 0.021, 40).rotateX(-Math.PI / 2), []);
  useEffect(() => () => tabanGeometri.dispose(), [tabanGeometri]);

  useEffect(() => {
    if (yukseklikler.current.length !== adaylar.length) yukseklikler.current = new Float32Array(adaylar.length).fill(0.002);
    kirli.current = true;
  }, [adaylar, yukseklikler]);

  // renkler ve tıklama alanları: yalnızca skor/seçim değişince
  useEffect(() => {
    adaylar.forEach((a, i) => {
      const d = durum[a.id];
      const renk = d?.elendi ? GRI : gecici.c.set(skorRengi(d?.skor ?? 0));
      govde.current?.setColorAt(i, renk);
      tepe.current?.setColorAt(i, renk);
      taban.current?.setColorAt(i, renk);
      gecici.p.copy(yon[i].n).multiplyScalar(1.13);
      gecici.s.set(1, 1, 1);
      gecici.m.compose(gecici.p, yon[i].q, gecici.s);
      hit.current?.setMatrixAt(i, gecici.m);
      gecici.p.copy(yon[i].n).multiplyScalar(1.003);
      gecici.m.compose(gecici.p, yon[i].q, gecici.s);
      taban.current?.setMatrixAt(i, gecici.m);
    });
    [govde, tepe, taban].forEach((r) => {
      if (r.current?.instanceColor) r.current.instanceColor.needsUpdate = true;
    });
    if (taban.current) taban.current.instanceMatrix.needsUpdate = true;
    if (hit.current) {
      hit.current.instanceMatrix.needsUpdate = true;
      hit.current.computeBoundingSphere();
    }
    kirli.current = true;
  }, [adaylar, durum, yon, gecici]);

  useEffect(() => {
    kirli.current = true;
  }, [seciliId]);

  useFrame((_, dt) => {
    const h = yukseklikler.current;
    let hareket = kirli.current;
    adaylar.forEach((a, i) => {
      const d = durum[a.id];
      const hedef = d?.elendi ? 0.04 : sutunYuksekligi(d?.skor ?? 0);
      const fark = hedef - h[i];
      if (Math.abs(fark) > 1e-4) {
        h[i] += fark * Math.min(1, dt * 7);
        hareket = true;
      }
    });
    if (!hareket) return;
    kirli.current = false;
    adaylar.forEach((a, i) => {
      const { n, q } = yon[i];
      const yuk = h[i];
      const elendi = durum[a.id]?.elendi;
      const secili = a.id === seciliId;
      // gövde: yüzeyden başlar, uca doğru incelir
      gecici.p.copy(n).multiplyScalar(1 + yuk / 2);
      gecici.s.set(secili ? 1.5 : 1, yuk, secili ? 1.5 : 1);
      gecici.m.compose(gecici.p, q, gecici.s);
      govde.current?.setMatrixAt(i, gecici.m);
      // baş: küçük elmas
      const r = secili ? 1.45 : 1;
      gecici.p.copy(n).multiplyScalar(1 + yuk);
      gecici.s.set(r, r * 1.5, r);
      gecici.m.compose(gecici.p, q, gecici.s);
      tepe.current?.setMatrixAt(i, gecici.m);
      // No-Go çarpısı: yalnızca elenenlerde görünür
      const olcek = elendi ? 1 : 0;
      gecici.p.copy(n).multiplyScalar(1 + yuk + 0.04);
      gecici.s.set(olcek, olcek, olcek);
      gecici.qa.setFromAxisAngle(Y_EKSEN, Math.PI / 4);
      gecici.m.compose(gecici.p, gecici.q.copy(q).multiply(gecici.qa), gecici.s);
      kolA.current?.setMatrixAt(i, gecici.m);
      gecici.qa.setFromAxisAngle(Y_EKSEN, -Math.PI / 4);
      gecici.m.compose(gecici.p, gecici.q.copy(q).multiply(gecici.qa), gecici.s);
      kolB.current?.setMatrixAt(i, gecici.m);
    });
    [govde, tepe, kolA, kolB].forEach((r) => {
      if (r.current) r.current.instanceMatrix.needsUpdate = true;
    });
  });

  const n = adaylar.length;
  return (
    <>
      <instancedMesh ref={taban} args={[tabanGeometri, undefined, n]} frustumCulled={false}>
        <meshBasicMaterial toneMapped={false} transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={govde} args={[undefined, undefined, n]} frustumCulled={false}>
        <cylinderGeometry args={[0.0022, 0.0055, 1, 12]} />
        <meshBasicMaterial toneMapped={false} transparent opacity={0.9} />
      </instancedMesh>
      <instancedMesh ref={tepe} args={[undefined, undefined, n]} frustumCulled={false}>
        <octahedronGeometry args={[0.0105, 0]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={kolA} args={[undefined, undefined, n]} frustumCulled={false}>
        <boxGeometry args={[0.05, 0.007, 0.007]} />
        <meshBasicMaterial color={KIRMIZI} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={kolB} args={[undefined, undefined, n]} frustumCulled={false}>
        <boxGeometry args={[0.05, 0.007, 0.007]} />
        <meshBasicMaterial color={KIRMIZI} toneMapped={false} />
      </instancedMesh>
      {/* görünmez, geniş tıklama alanları */}
      <instancedMesh
        ref={hit}
        args={[undefined, undefined, n]}
        frustumCulled={false}
        onClick={(e) => {
          if (e.delta > 6 || e.instanceId === undefined) return;
          e.stopPropagation();
          onSec(adaylar[e.instanceId].id);
        }}
        onPointerMove={(e) => {
          if (e.instanceId === undefined) return;
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          onHover(adaylar[e.instanceId].id);
        }}
        onPointerOut={() => {
          document.body.style.cursor = '';
          onHover(null);
        }}
      >
        <cylinderGeometry args={[0.03, 0.03, 0.26, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </instancedMesh>
    </>
  );
}

function InisIsaretleri({
  inisler,
  onSec,
  onHover,
}: {
  inisler: Inis[];
  onSec: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const govde = useRef<THREE.InstancedMesh>(null);
  const hit = useRef<THREE.InstancedMesh>(null);
  const yon = useMemo(() => yonleri(inisler), [inisler]);
  useEffect(() => {
    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3(1, 1.5, 1);
    const c = new THREE.Color();
    inisler.forEach((o, i) => {
      p.copy(yon[i].n).multiplyScalar(1.012);
      m.compose(p, yon[i].q, s);
      govde.current?.setMatrixAt(i, m);
      hit.current?.setMatrixAt(i, m);
      govde.current?.setColorAt(i, c.set(INIS_RENKLERI[o.durum]));
    });
    [govde, hit].forEach((r) => {
      if (r.current) r.current.instanceMatrix.needsUpdate = true;
    });
    if (govde.current?.instanceColor) govde.current.instanceColor.needsUpdate = true;
    hit.current?.computeBoundingSphere();
  }, [inisler, yon]);
  const n = inisler.length;
  return (
    <>
      <instancedMesh ref={govde} args={[undefined, undefined, n]} frustumCulled={false}>
        <octahedronGeometry args={[0.011, 0]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh
        ref={hit}
        args={[undefined, undefined, n]}
        frustumCulled={false}
        onClick={(e) => {
          if (e.delta > 6 || e.instanceId === undefined) return;
          e.stopPropagation();
          onSec(inisler[e.instanceId].id);
        }}
        onPointerMove={(e) => {
          if (e.instanceId === undefined) return;
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          onHover(inisler[e.instanceId].id);
        }}
        onPointerOut={() => {
          document.body.style.cursor = '';
          onHover(null);
        }}
      >
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </instancedMesh>
    </>
  );
}

/** Seçili işaretin yüzeye oturan nabız halkası. */
function SecimHalkasi({ enlem, boylam, renk }: { enlem: number; boylam: number; renk: string }) {
  const halka = useRef<THREE.Mesh>(null);
  const yon = useMemo(() => yonleri([{ enlem, boylam }])[0], [enlem, boylam]);
  useFrame(({ clock }) => {
    if (halka.current) halka.current.scale.setScalar(1 + 0.3 * Math.sin(clock.elapsedTime * 3));
  });
  return (
    <group position={yon.n} quaternion={yon.q}>
      <mesh ref={halka} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <ringGeometry args={[0.04, 0.047, 48]} />
        <meshBasicMaterial color={renk} toneMapped={false} transparent opacity={0.9} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

function SondaIsareti({ sonda }: { sonda: Sonda }) {
  const yon = useMemo(() => yonleri([sonda])[0], [sonda]);
  return (
    <group position={yon.n} quaternion={yon.q}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <ringGeometry args={[0.018, 0.024, 32]} />
        <meshBasicMaterial color="#22d3ee" toneMapped={false} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.026, 0]}>
        <octahedronGeometry args={[0.008, 0]} />
        <meshBasicMaterial color="#22d3ee" toneMapped={false} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------- ekran katmanı: etiketler, kart, ipucu, bakış işareti (React'i yeniden çizdirmeden)

type EkranKatmaniProps = {
  adaylar: Aday[];
  durum: Record<string, AdayDurum>;
  ozellikler: Ozellik[];
  yukseklikler: MutableRefObject<Float32Array>;
  adayGoster: boolean;
  adGoster: boolean;
  adGruplari: Record<OzellikGrup, boolean>;
  seciliId: string | null;
  hoverId: string | null;
  etiketRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
  kutular: MutableRefObject<EtiketKutusu[]>;
  kartRef: RefObject<HTMLDivElement | null>;
  ipucuRef: RefObject<HTMLDivElement | null>;
  bakisIsaretiRef: RefObject<HTMLDivElement | null>;
  kartHedef: MutableRefObject<THREE.Vector3 | null>;
  ipucuHedef: MutableRefObject<THREE.Vector3 | null>;
};

const ETIKET_OLCUSU = new WeakMap<HTMLElement, { w: number; h: number; kare: number }>();

function EkranKatmani(p: EkranKatmaniProps) {
  const { camera, size } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);
  const yon = useMemo(() => p.adaylar.map((a) => new THREE.Vector3(...konumVektoru(a.enlem, a.boylam))), [p.adaylar]);
  const ozYon = useMemo(() => p.ozellikler.map((o) => new THREE.Vector3(...konumVektoru(o.enlem, o.boylam))), [p.ozellikler]);
  const kare = useRef(0);
  const sonBakis = useRef({ x: -1, y: -1 });

  useFrame(() => {
    kare.current += 1;
    const dist = camera.position.length();
    const camDir = camera.position.clone().normalize();

    // 3B nokta → ekran (piksel); arkada kalan ya da kadraj dışı ise null
    const ekran = (nokta: THREE.Vector3, onEsik: number) => {
      if (nokta.clone().normalize().dot(camDir) < onEsik) return null;
      v.copy(nokta).project(camera);
      if (v.z > 1 || Math.abs(v.x) > 1.15 || Math.abs(v.y) > 1.15) return null;
      return { x: (v.x * 0.5 + 0.5) * size.width, y: (-v.y * 0.5 + 0.5) * size.height };
    };

    type Adayim = { el: HTMLDivElement; x: number; y: number; oncelik: number; tip: 'aday' | 'ozellik'; id: string };
    const liste: Adayim[] = [];

    if (p.adayGoster) {
      p.adaylar.forEach((a, i) => {
        const el = p.etiketRefs.current[`a:${a.id}`];
        if (!el) return;
        const d = p.durum[a.id];
        const secili = a.id === p.seciliId;
        const hover = a.id === p.hoverId;
        if (!(secili || hover || (d && !d.elendi && d.sira <= 5) || dist < 3.2)) return;
        const yuk = p.yukseklikler.current[i] ?? 0.1;
        const nk = ekran(yon[i].clone().multiplyScalar(1 + yuk + 0.06), 0.12);
        if (!nk) return;
        liste.push({ el, ...nk, oncelik: secili ? 1000 : hover ? 900 : d && !d.elendi ? 500 - d.sira : 300, tip: 'aday', id: a.id });
      });
    }
    if (p.adGoster) {
      const esik = dist > 4.2 ? 3 : dist > 2.9 ? 2 : 1;
      p.ozellikler.forEach((o, i) => {
        const el = p.etiketRefs.current[`o:${o.id}`];
        if (!el || o.onem < esik || !p.adGruplari[OZELLIK_GRUBU[o.tur]]) return;
        const nk = ekran(ozYon[i].clone().multiplyScalar(1.004), 0.2);
        if (!nk) return;
        liste.push({ el, ...nk, oncelik: 100 * o.onem + Math.min(20, o.ad.length), tip: 'ozellik', id: o.id });
      });
    }

    // çakışma önleme: önceliğe göre yerleştir
    liste.sort((a, b) => b.oncelik - a.oncelik);
    const yerlesen: EtiketKutusu[] = [];
    const gorunen = new Set<HTMLDivElement>();
    liste.forEach((e) => {
      let boy = ETIKET_OLCUSU.get(e.el);
      if (!boy || kare.current - boy.kare > 90) {
        boy = { w: e.el.offsetWidth || 60, h: e.el.offsetHeight || 16, kare: kare.current };
        ETIKET_OLCUSU.set(e.el, boy);
      }
      const kutu: EtiketKutusu = { tip: e.tip, id: e.id, sol: e.x - boy.w / 2 - 3, sag: e.x + boy.w / 2 + 3, ust: e.y - boy.h - 3, alt: e.y + 3 };
      if (e.oncelik < 900 && yerlesen.some((k) => kutu.sol < k.sag && kutu.sag > k.sol && kutu.ust < k.alt && kutu.alt > k.ust)) return;
      yerlesen.push(kutu);
      gorunen.add(e.el);
      e.el.style.transform = `translate3d(${e.x.toFixed(1)}px, ${e.y.toFixed(1)}px, 0) translate(-50%, -100%)`;
      e.el.style.opacity = '1';
    });
    p.kutular.current = yerlesen;
    Object.values(p.etiketRefs.current).forEach((el) => {
      if (el && !gorunen.has(el) && el.style.opacity !== '0') el.style.opacity = '0';
    });

    // bilgi kartı: işarete bağlı, ekran kenarına sığdırılır; dar ekranda alt panel
    const kart = p.kartRef.current;
    if (kart) {
      const hedef = p.kartHedef.current;
      if (!hedef) {
        kart.style.display = 'none';
      } else {
        kart.style.display = 'block';
        if (size.width < 560) {
          kart.style.transform = 'none';
          kart.style.left = '8px';
          kart.style.right = '8px';
          kart.style.top = 'auto';
          kart.style.bottom = '8px';
          kart.style.width = 'auto';
          kart.style.opacity = '1';
          kart.style.pointerEvents = 'auto';
        } else {
          const nk = ekran(hedef, 0.02);
          const kw = kart.offsetWidth || 310;
          const kh = kart.offsetHeight || 260;
          kart.style.right = 'auto';
          kart.style.bottom = 'auto';
          kart.style.width = '310px';
          if (!nk) {
            kart.style.opacity = '0';
            kart.style.pointerEvents = 'none';
          } else {
            const sagaSigar = nk.x + 22 + kw < size.width - 8;
            const x = sagaSigar ? nk.x + 22 : Math.max(8, nk.x - 22 - kw);
            const y = Math.max(56, Math.min(size.height - kh - 8, nk.y - kh / 2)); // üstteki araç çubuğunun altında kal
            kart.style.left = '0px';
            kart.style.top = '0px';
            kart.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
            kart.style.opacity = '1';
            kart.style.pointerEvents = 'auto';
          }
        }
      }
    }

    // fare üstü ipucu
    const ip = p.ipucuRef.current;
    if (ip) {
      const hedef = p.ipucuHedef.current;
      const nk = hedef ? ekran(hedef, 0.1) : null;
      if (!nk) {
        ip.style.opacity = '0';
      } else {
        ip.style.opacity = '1';
        ip.style.transform = `translate3d(${nk.x.toFixed(1)}px, ${(nk.y - 14).toFixed(1)}px, 0) translate(-50%, -100%)`;
      }
    }

    // 2B haritadaki "şu an bakılan yer" işareti
    const isaret = p.bakisIsaretiRef.current;
    if (isaret) {
      const k = vektordenKonum(camDir.x, camDir.y, camDir.z);
      const x = ((k.boylam + 180) / 360) * 100;
      const y = ((90 - k.enlem) / 180) * 100;
      if (Math.abs(x - sonBakis.current.x) > 0.15 || Math.abs(y - sonBakis.current.y) > 0.15) {
        sonBakis.current = { x, y };
        isaret.style.left = `${x}%`;
        isaret.style.top = `${y}%`;
      }
    }
  });
  return null;
}

// ---------------------------------------------------------------- kamera

/** Dar (dikey) kadrajda gezegen yanlardan kesilmesin: kamera yakınlaştırması en/boy oranına göre ayarlanır. */
function EkranUyumu() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  useEffect(() => {
    const enBoy = size.width / Math.max(1, size.height);
    (camera as THREE.PerspectiveCamera).zoom = Math.min(1, 0.35 + enBoy * 0.65);
    camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

/** Kamerayı hedefe KÜRESEL yolla taşır (düz çizgi, ters yüzdeki hedefte gezegenin içinden geçerdi). Kullanıcı tutunca iptal olur. */
function KameraUcusu({ odak, hareketAz }: { odak: Odak | null; hareketAz: boolean }) {
  const { camera, controls } = useThree();
  const hedef = useRef<{ yon: THREE.Vector3; mesafe: number } | null>(null);

  useEffect(() => {
    if (!odak) return;
    hedef.current = { yon: new THREE.Vector3(...konumVektoru(odak.enlem, odak.boylam)), mesafe: odak.mesafe };
  }, [odak]);

  useEffect(() => {
    const c = controls as unknown as THREE.EventDispatcher<{ start: object }> | null;
    if (!c) return undefined;
    const durdur = () => {
      hedef.current = null;
    };
    c.addEventListener('start', durdur);
    return () => c.removeEventListener('start', durdur);
  }, [controls]);

  useFrame((_, dt) => {
    const h = hedef.current;
    if (!h) return;
    const k = hareketAz ? 1 : 1 - Math.exp(-dt * 3.4);
    const mevcutMesafe = camera.position.length();
    const mevcutYon = camera.position.clone().normalize();
    const aci = mevcutYon.angleTo(h.yon);
    if (aci > 1e-4) {
      let eksen = new THREE.Vector3().crossVectors(mevcutYon, h.yon);
      if (eksen.lengthSq() < 1e-8) eksen = new THREE.Vector3(0, 1, 0);
      eksen.normalize();
      camera.position.applyAxisAngle(eksen, aci * k);
    }
    camera.position.setLength(mevcutMesafe + (h.mesafe - mevcutMesafe) * k);
    (controls as unknown as { update?: () => void } | null)?.update?.();
    if (aci < 0.004 && Math.abs(camera.position.length() - h.mesafe) < 0.01) hedef.current = null;
  });
  return null;
}

/** Doku yükleme göstergesi. drei <Html> Suspense yedeği olarak kapanırken React 19'da hata verdiği için tuvalin DIŞINDA, düz DOM olarak çizilir. */
export function YuklemeKatmani({ metin }: { metin: string }) {
  const { progress, errors } = useProgress();
  if (progress >= 100 || errors.length > 0) return null;
  return (
    <div
      aria-live="polite"
      style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none', color: '#cbd5e1', font: '600 13px/1.3 system-ui, sans-serif' }}
    >
      {metin} %{progress.toFixed(0)}
    </div>
  );
}

// ---------------------------------------------------------------- sarmalayıcı

class KureHatasi extends Component<{ yedek: ReactNode; children: ReactNode }, { hata: boolean }> {
  state = { hata: false };

  static getDerivedStateFromError() {
    return { hata: true };
  }

  render() {
    return this.state.hata ? this.props.yedek : this.props.children;
  }
}

export const webglVarMi = (): boolean => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
};

const ETIKET_STIL = {
  position: 'absolute',
  left: 0,
  top: 0,
  opacity: 0,
  pointerEvents: 'none',
  whiteSpace: 'nowrap',
  willChange: 'transform, opacity',
  transition: 'opacity 140ms',
} as const;

export default function MarsKure(props: KureProps & { yedek: ReactNode }) {
  const {
    adaylar, durum, inisler, ozellikler, adayGoster, inisGoster, adGoster, adGruplari, secili, sonda, odak, otoDonus, hareketAz,
    kart, ipucu, bakisIsaretiRef, onIsaretSec, onYuzeyTikla, onBosTikla, onHover, yedek,
  } = props;

  const sarmal = useRef<HTMLDivElement>(null);
  const etiketRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const kutular = useRef<EtiketKutusu[]>([]);
  const kartRef = useRef<HTMLDivElement>(null);
  const ipucuRef = useRef<HTMLDivElement>(null);
  const yukseklikler = useRef<Float32Array>(new Float32Array(adaylar.length).fill(0.002));
  const kartHedef = useRef<THREE.Vector3 | null>(null);
  const ipucuHedef = useRef<THREE.Vector3 | null>(null);
  const hoverId = ipucu?.hedef.tip === 'aday' ? ipucu.hedef.id : null;

  // kartın ve ipucunun bağlandığı dünya konumları (props'tan türetilir, kare döngüsü okur)
  const hedefKonumu = (i: Isaret | null): THREE.Vector3 | null => {
    if (!i) return null;
    if (i.tip === 'aday') {
      const idx = adaylar.findIndex((a) => a.id === i.id);
      if (idx < 0) return null;
      const yuk = yukseklikler.current[idx] ?? 0.1;
      return new THREE.Vector3(...konumVektoru(adaylar[idx].enlem, adaylar[idx].boylam)).multiplyScalar(1 + yuk);
    }
    const o = inisler.find((x) => x.id === i.id);
    return o ? new THREE.Vector3(...konumVektoru(o.enlem, o.boylam)).multiplyScalar(1.02) : null;
  };
  if (secili) kartHedef.current = hedefKonumu(secili);
  else if (sonda) kartHedef.current = new THREE.Vector3(...konumVektoru(sonda.enlem, sonda.boylam)).multiplyScalar(1.01);
  else kartHedef.current = null;
  ipucuHedef.current = ipucu && !(secili && secili.tip === ipucu.hedef.tip && secili.id === ipucu.hedef.id) ? hedefKonumu(ipucu.hedef) : null;

  // kutulardaki etikete tıklandı mı (etiketler pointer-events:none olduğundan tıklama alttaki yüzeye düşer)
  const etiketVuruldu = (clientX: number, clientY: number): EtiketKutusu | null => {
    const r = sarmal.current?.getBoundingClientRect();
    if (!r) return null;
    const x = clientX - r.left;
    const y = clientY - r.top;
    return kutular.current.find((k) => x >= k.sol && x <= k.sag && y >= k.ust && y <= k.alt) ?? null;
  };

  const etiketIsle = (k: EtiketKutusu): boolean => {
    if (k.tip === 'aday') {
      onIsaretSec({ tip: 'aday', id: k.id });
      return true;
    }
    const o = ozellikler.find((x) => x.id === k.id);
    if (!o) return false;
    onYuzeyTikla(o.enlem, o.boylam, o.id);
    return true;
  };

  return (
    <KureHatasi yedek={yedek}>
      <div ref={sarmal} style={{ position: 'relative', width: '100%', height: '100%' }}>
        <Canvas
          dpr={[1, 2]}
          camera={{ position: BASLANGIC_KAMERA, fov: 42, near: 0.05, far: 400 }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          aria-label="Mars 3D globe"
          onPointerMissed={(e) => {
            if (e.type !== 'click') return;
            const k = etiketVuruldu(e.clientX, e.clientY);
            if (k && etiketIsle(k)) return;
            onBosTikla();
          }}
        >
          <color attach="background" args={['#04060b']} />
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 2.5, 4]} intensity={2.6} />
          <directionalLight position={[-4, -1, -3]} intensity={0.35} color="#7aa7ff" />
          <Stars radius={120} depth={60} count={5200} factor={4} saturation={0} fade speed={hareketAz ? 0 : 0.4} />

          <Suspense fallback={null}>
            <Gezegen
              onTikla={(e, enlem, boylam) => {
                const k = etiketVuruldu(e.nativeEvent.clientX, e.nativeEvent.clientY);
                if (k && etiketIsle(k)) return;
                onYuzeyTikla(enlem, boylam);
              }}
            />
            <Atmosfer />
            <Graticule />
            {adayGoster && (
              <AdayDirekleri
                adaylar={adaylar}
                durum={durum}
                seciliId={secili?.tip === 'aday' ? secili.id : null}
                yukseklikler={yukseklikler}
                onSec={(id) => onIsaretSec({ tip: 'aday', id })}
                onHover={(id) => onHover(id ? { tip: 'aday', id } : null)}
              />
            )}
            {inisGoster && (
              <InisIsaretleri
                inisler={inisler}
                onSec={(id) => onIsaretSec({ tip: 'inis', id })}
                onHover={(id) => onHover(id ? { tip: 'inis', id } : null)}
              />
            )}
            {secili?.tip === 'inis' &&
              (() => {
                const o = inisler.find((x) => x.id === secili.id);
                return o ? <SecimHalkasi enlem={o.enlem} boylam={o.boylam} renk={INIS_RENKLERI[o.durum]} /> : null;
              })()}
            {secili?.tip === 'aday' &&
              (() => {
                const a = adaylar.find((x) => x.id === secili.id);
                return a ? <SecimHalkasi enlem={a.enlem} boylam={a.boylam} renk={durum[a.id]?.elendi ? '#94a3b8' : skorRengi(durum[a.id]?.skor ?? 0)} /> : null;
              })()}
            {sonda && <SondaIsareti sonda={sonda} />}
          </Suspense>

          <OrbitControls
            makeDefault
            enablePan={false}
            enableDamping
            dampingFactor={0.08}
            rotateSpeed={0.55}
            zoomSpeed={0.7}
            minDistance={1.35}
            maxDistance={6}
            autoRotate={otoDonus}
            autoRotateSpeed={0.35}
          />
          <EkranUyumu />
          <KameraUcusu odak={odak} hareketAz={hareketAz} />
          <EkranKatmani
            adaylar={adaylar}
            durum={durum}
            ozellikler={ozellikler}
            yukseklikler={yukseklikler}
            adayGoster={adayGoster}
            adGoster={adGoster}
            adGruplari={adGruplari}
            seciliId={secili?.tip === 'aday' ? secili.id : null}
            hoverId={hoverId}
            etiketRefs={etiketRefs}
            kutular={kutular}
            kartRef={kartRef}
            ipucuRef={ipucuRef}
            bakisIsaretiRef={bakisIsaretiRef}
            kartHedef={kartHedef}
            ipucuHedef={ipucuHedef}
          />
        </Canvas>

        {/* ekran katmanı: etiketler (tıklamayı geçirir), bilgi kartı (tıklanabilir) */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {adaylar.map((a) => {
            const d = durum[a.id];
            const renk = d?.elendi ? '#94a3b8' : skorRengi(d?.skor ?? 0);
            return (
              <div
                key={a.id}
                ref={(el) => {
                  etiketRefs.current[`a:${a.id}`] = el;
                }}
                style={{
                  ...ETIKET_STIL,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '2px 8px',
                  borderRadius: 999,
                  border: `1px solid ${renk}99`,
                  background: 'rgba(10,14,24,0.72)',
                  color: '#fff',
                  font: '600 10.5px/1.1 system-ui, sans-serif',
                  zIndex: 3,
                }}
              >
                {d?.elendi ? <span style={{ color: '#f43f5e' }}>✕</span> : <span style={{ color: renk }}>#{d?.sira}</span>}
                <span>{kisaAd(a.ad)}</span>
                {!d?.elendi && <span style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.8 }}>{d?.skor.toFixed(1)}</span>}
              </div>
            );
          })}

          {ozellikler.map((o) => {
            const grup = OZELLIK_GRUBU[o.tur];
            const buyuk = o.onem === 3;
            return (
              <div
                key={o.id}
                ref={(el) => {
                  etiketRefs.current[`o:${o.id}`] = el;
                }}
                style={{
                  ...ETIKET_STIL,
                  color: OZELLIK_RENGI[grup],
                  font: `${buyuk ? 700 : 600} ${buyuk ? 12 : 10.5}px/1.1 system-ui, sans-serif`,
                  letterSpacing: buyuk ? '0.12em' : '0.02em',
                  textTransform: buyuk ? 'uppercase' : 'none',
                  fontStyle: o.tur === 'krater' ? 'italic' : 'normal',
                  textShadow: '0 0 3px #000, 0 0 6px #000, 1px 1px 2px #000',
                  zIndex: 2,
                }}
              >
                {o.tur === 'krater' ? '◦ ' : ''}
                {o.ad}
              </div>
            );
          })}

          <div
            ref={ipucuRef}
            style={{
              ...ETIKET_STIL,
              padding: '3px 8px',
              borderRadius: 6,
              background: 'rgba(10,14,24,0.92)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: '#fff',
              font: '600 11px/1.2 system-ui, sans-serif',
              zIndex: 6,
            }}
          >
            {ipucu?.metin}
          </div>

          <div
            ref={kartRef}
            style={{ position: 'absolute', display: 'none', width: 310, maxWidth: 'calc(100% - 16px)', zIndex: 8, pointerEvents: 'auto', willChange: 'transform' }}
          >
            {kart}
          </div>
        </div>
      </div>
    </KureHatasi>
  );
}
