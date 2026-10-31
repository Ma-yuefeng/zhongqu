import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { describeModule, describePart } from "./catalog.js";

const ASM_NAME = "X300 for Rendering";
const MODULE_COLORS = ["#0e6e8a", "#c4552a", "#2f6f4e", "#8a5a12", "#3d4f8a", "#8a3d55", "#3f6b3a"];

const view = document.getElementById("view");
const amountEl = document.getElementById("amount");
const pctEl = document.getElementById("pct");
const summaryEl = document.getElementById("summary");
const modsEl = document.getElementById("mods");
const loadingEl = document.getElementById("loading");
const loadTitle = document.getElementById("loadtitle");
const loadText = document.getElementById("loadtext");
const barFill = document.getElementById("barfill");
const infoEmpty = document.getElementById("infoEmpty");
const infoBody = document.getElementById("infoBody");

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
view.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.id = "labels";
view.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color("#e6ebf1");

const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 100);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;

scene.add(new THREE.HemisphereLight(0xffffff, 0xd5dde6, 0.55));
const sun = new THREE.DirectionalLight(0xffffff, 1.15);
sun.position.set(1.6, 2.4, 1.2);
scene.add(sun);
const fill = new THREE.DirectionalLight(0xdbe7f2, 0.35);
fill.position.set(-1.4, 0.6, -1.1);
scene.add(fill);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
pmrem.dispose();

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const modelUrl = new URL("./PWR2000_摘盖.pack.glb", import.meta.url);
const modules = [];
const parts = [];
let asmRoot = null;
let travel = { module: 0.2, part: 0.08, screw: 0.035 };
let amount = 0;
let mode = "part";
let screwsOn = true;
let playing = false;
let playFrom = 0;
let playStart = 0;
let selection = null;
let isolated = false;
let savedView = null;
const PLAY_MS = 3200;
const highlighted = [];

const _inv = new THREE.Matrix4();
const _origin = new THREE.Vector3();
const _end = new THREE.Vector3();
const _world = new THREE.Vector3();

function originalName(obj) {
  return (obj.userData && obj.userData.name) || obj.name || "";
}

function isFastener(name) {
  const n = name || "";
  if (/^M\d/i.test(n)) return true;
  if (/^ST/i.test(n)) return true;
  if (/^\d+_\d+_\d+/.test(n)) return true;
  return false;
}

function countTris(obj) {
  let count = 0;
  obj.traverse((node) => {
    if (!node.isMesh || !node.geometry) return;
    const geo = node.geometry;
    if (geo.index) count += geo.index.count / 3;
    else if (geo.attributes.position) count += geo.attributes.position.count / 3;
  });
  return Math.round(count);
}

function formatSize(box) {
  const size = box.getSize(new THREE.Vector3());
  const mm = (value) => Math.max(1, Math.round(value * 1000));
  return `${mm(size.x)} × ${mm(size.y)} × ${mm(size.z)} mm`;
}

function worldOffsetToLocal(parent, worldVec, target) {
  parent.updateWorldMatrix(true, false);
  _inv.copy(parent.matrixWorld).invert();
  _origin.set(0, 0, 0).applyMatrix4(_inv);
  _end.copy(worldVec).applyMatrix4(_inv);
  return target.copy(_end).sub(_origin);
}

function outward(from, to, minLen) {
  const dir = to.clone().sub(from);
  if (dir.length() < minLen) return new THREE.Vector3();
  return dir.normalize();
}

function makeTag(text, className, color) {
  const el = document.createElement("div");
  el.className = "tag " + className;
  el.textContent = text;
  if (color) el.style.borderLeftColor = color;
  const obj = new CSS2DObject(el);
  obj.center.set(0.5, 1);
  return obj;
}

function placeTag(obj, box, dir) {
  const center = box.getCenter(new THREE.Vector3());
  const local = obj.worldToLocal(center.clone());
  if (dir && dir.lengthSq() > 0) {
    const pushed = center.clone().addScaledVector(dir, 0.025);
    obj.worldToLocal(pushed);
    return pushed;
  }
  local.y += 0.02;
  return local;
}

function bindExplode(root) {
  root.updateWorldMatrix(true, true);
  const modelBox = new THREE.Box3().setFromObject(root);
  const modelCenter = modelBox.getCenter(new THREE.Vector3());
  const diag = modelBox.getSize(new THREE.Vector3()).length();
  travel = {
    module: diag * 0.55,
    part: diag * 0.22,
    screw: diag * 0.09,
  };

  const groups = root.children.filter((child) => child.children.length || child.isMesh);
  groups.forEach((group, index) => {
    const box = new THREE.Box3().setFromObject(group);
    if (box.isEmpty()) return;
    const code = originalName(group);
    const meta = describeModule(code);
    const center = box.getCenter(new THREE.Vector3());
    const dir = outward(modelCenter, center, 0.004);
    const color = MODULE_COLORS[index % MODULE_COLORS.length];
    const tag = makeTag(meta.name, "module", color);
    tag.position.copy(placeTag(group, box, dir));
    group.add(tag);

    const moduleItem = {
      object: group,
      base: group.position.clone(),
      dir,
      tag,
      color,
      code,
      meta,
      sizeText: formatSize(box),
      tris: countTris(group),
      listItem: null,
    };
    modules.push(moduleItem);

    const li = document.createElement("li");
    li.innerHTML = `<i style="background:${color}"></i><span></span>`;
    li.querySelector("span").textContent = meta.name;
    li.addEventListener("click", () => selectEntry("module", moduleItem));
    modsEl.appendChild(li);
    moduleItem.listItem = li;

    const seen = new Map();
    group.children.forEach((child) => {
      if (child.isCSS2DObject) return;
      const childBox = new THREE.Box3().setFromObject(child);
      if (childBox.isEmpty()) return;
      const partCode = originalName(child);
      const occurrence = seen.get(partCode) || 0;
      seen.set(partCode, occurrence + 1);
      const partMeta = describePart(code, partCode, occurrence);
      const childCenter = childBox.getCenter(new THREE.Vector3());
      const childDir = outward(center, childCenter, 0.008);
      const fastener = isFastener(partCode);
      const tagPart = makeTag(partMeta.name, "part", color);
      tagPart.position.copy(placeTag(child, childBox, childDir));
      child.add(tagPart);
      parts.push({
        object: child,
        base: child.position.clone(),
        dir: childDir,
        fastener,
        tag: tagPart,
        code: partCode,
        meta: partMeta,
        module: moduleItem,
        sizeText: formatSize(childBox),
        tris: countTris(child),
      });
    });
  });
}

function applyExplode() {
  const t = amount;
  const partScale = mode === "part" ? 1 : 0;
  modules.forEach((item) => {
    _world.copy(item.dir).multiplyScalar(t * travel.module);
    const local = worldOffsetToLocal(item.object.parent, _world, new THREE.Vector3());
    item.object.position.copy(item.base).add(local);
  });
  if (asmRoot) asmRoot.updateWorldMatrix(true, true);
  parts.forEach((item) => {
    const dist = item.fastener ? (screwsOn ? travel.screw : 0) : travel.part;
    _world.copy(item.dir).multiplyScalar(t * dist * partScale);
    const local = worldOffsetToLocal(item.object.parent, _world, new THREE.Vector3());
    item.object.position.copy(item.base).add(local);
  });
}

function setAmount(next) {
  amount = THREE.MathUtils.clamp(next, 0, 1);
  amountEl.value = String(Math.round(amount * 100));
  pctEl.textContent = `${Math.round(amount * 100)}%`;
  applyExplode();
}

function frameObject(obj) {
  obj.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(obj);
  const center = box.getCenter(new THREE.Vector3());
  const radius = Math.max(box.getSize(new THREE.Vector3()).length() * 0.5, 0.05);
  camera.near = radius / 80;
  camera.far = radius * 40;
  camera.updateProjectionMatrix();
  const viewDir = new THREE.Vector3(0.9, 0.62, 1.05).normalize();
  camera.position.copy(center).addScaledVector(viewDir, radius * 2.7);
  controls.target.copy(center);
  controls.minDistance = radius * 0.15;
  controls.maxDistance = radius * 12;
  controls.update();
}

function frameAssembly() {
  if (asmRoot) frameObject(asmRoot);
}

function resize() {
  const w = view.clientWidth || window.innerWidth;
  const h = view.clientHeight || window.innerHeight;
  camera.aspect = w / Math.max(h, 1);
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  labelRenderer.setSize(w, h);
}

function setBusy(disabled) {
  [amountEl, document.getElementById("play"), document.getElementById("reset"), document.getElementById("fit"),
    document.getElementById("screws"), document.getElementById("names"),
    document.getElementById("spin"), document.getElementById("clearSel"), document.getElementById("solo")].forEach((el) => {
    el.disabled = disabled;
  });
  document.querySelectorAll('input[name="mode"]').forEach((el) => { el.disabled = disabled; });
}

function namesOn() {
  return document.getElementById("names").checked;
}

function isUnder(obj, root) {
  let node = obj;
  while (node) {
    if (node === root) return true;
    node = node.parent;
  }
  return false;
}

function showNames() {
  const on = namesOn();
  const soloRoot = isolated && selection ? selection.item.object : null;
  modules.forEach((item) => {
    const picked = selection && selection.type === "module" && selection.item === item;
    const allowed = !soloRoot || item.object === soloRoot;
    item.tag.visible = allowed && (picked || (on && mode === "module"));
    item.tag.element.classList.toggle("on", picked);
  });
  parts.forEach((item) => {
    const picked = selection && selection.type === "part" && selection.item === item;
    const allowed = !soloRoot || item.object === soloRoot;
    item.tag.visible = allowed && (picked || (on && mode === "part" && !item.fastener));
    item.tag.element.classList.toggle("on", picked);
  });
  modules.forEach((item) => {
    const picked = selection && (
      (selection.type === "module" && selection.item === item) ||
      (selection.type === "part" && selection.item.module === item)
    );
    item.listItem.classList.toggle("on", Boolean(picked));
  });
}

function clearHighlight() {
  highlighted.forEach(({ mat, emissive, intensity }) => {
    if (!mat.emissive) return;
    mat.emissive.copy(emissive);
    mat.emissiveIntensity = intensity;
  });
  highlighted.length = 0;
}

function highlightObject(obj) {
  clearHighlight();
  obj.traverse((node) => {
    if (!node.isMesh) return;
    const mats = Array.isArray(node.material) ? node.material : [node.material];
    mats.forEach((mat) => {
      if (!mat || !mat.emissive) return;
      highlighted.push({
        mat,
        emissive: mat.emissive.clone(),
        intensity: mat.emissiveIntensity,
      });
      mat.emissive.set("#1490b0");
      mat.emissiveIntensity = 0.85;
    });
  });
}

function fillInfo(meta, extra) {
  infoEmpty.hidden = true;
  infoBody.hidden = false;
  document.getElementById("infoName").textContent = meta.name;
  document.getElementById("infoKind").textContent = meta.category;
  document.getElementById("infoBelong").textContent = extra.belong;
  document.getElementById("infoText").textContent = meta.intro;
  document.getElementById("infoSize").textContent = extra.sizeText;
  document.getElementById("infoTris").textContent = extra.tris.toLocaleString("zh-CN");
  document.getElementById("infoCode").textContent = extra.code;
}

function applyIsolation() {
  if (!asmRoot) return;
  const root = isolated && selection ? selection.item.object : null;
  asmRoot.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.visible = !root || isUnder(obj, root);
  });
  const solo = document.getElementById("solo");
  if (solo) solo.textContent = isolated ? "显示全部" : "单独展示";
  showNames();
}

function enterIsolation() {
  if (!selection) return;
  if (!isolated) {
    savedView = {
      position: camera.position.clone(),
      target: controls.target.clone(),
    };
    isolated = true;
  }
  clearHighlight();
  applyIsolation();
  frameObject(selection.item.object);
}

function exitIsolation(restoreCamera) {
  isolated = false;
  applyIsolation();
  if (selection) highlightObject(selection.item.object);
  if (restoreCamera && savedView) {
    camera.position.copy(savedView.position);
    controls.target.copy(savedView.target);
    controls.update();
  }
  savedView = null;
}

function selectEntry(type, item) {
  selection = { type, item };
  if (isolated) clearHighlight();
  else highlightObject(item.object);
  if (type === "module") {
    fillInfo(item.meta, {
      belong: "整机",
      sizeText: item.sizeText,
      tris: item.tris,
      code: item.code,
    });
  } else {
    fillInfo(item.meta, {
      belong: item.module.meta.name,
      sizeText: item.sizeText,
      tris: item.tris,
      code: item.code,
    });
  }
  if (isolated) enterIsolation();
  else showNames();
}

function clearSelection() {
  const wasIsolated = isolated;
  selection = null;
  clearHighlight();
  infoBody.hidden = true;
  infoEmpty.hidden = false;
  if (wasIsolated) exitIsolation(true);
  else showNames();
}

function pick(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObject(asmRoot, true);
  const meshHit = hits.find((hit) => hit.object.isMesh);
  if (!meshHit) {
    clearSelection();
    return;
  }
  let node = meshHit.object;
  let found = null;
  while (node) {
    found = parts.find((item) => item.object === node);
    if (found) break;
    node = node.parent;
  }
  if (!found) {
    clearSelection();
    return;
  }
  selectEntry("part", found);
}

function resizeAndListen() {
  resize();
}

let pointerDown = null;
renderer.domElement.addEventListener("pointerdown", (event) => {
  pointerDown = { x: event.clientX, y: event.clientY, button: event.button };
});
renderer.domElement.addEventListener("pointerup", (event) => {
  if (!pointerDown || !asmRoot || event.button !== 0) return;
  const dx = event.clientX - pointerDown.x;
  const dy = event.clientY - pointerDown.y;
  pointerDown = null;
  if (dx * dx + dy * dy > 16) return;
  pick(event);
});

function play() {
  playing = true;
  playFrom = amount > 0.98 ? 0 : amount;
  playStart = performance.now();
  if (playFrom === 0) setAmount(0);
}

function stopPlay() {
  playing = false;
}

amountEl.addEventListener("input", () => {
  stopPlay();
  setAmount(Number(amountEl.value) / 100);
});
document.querySelectorAll('input[name="mode"]').forEach((el) => {
  el.addEventListener("change", () => {
    if (!el.checked) return;
    mode = el.value;
    applyExplode();
    showNames();
  });
});
document.getElementById("screws").addEventListener("change", (e) => {
  screwsOn = e.target.checked;
  applyExplode();
});
document.getElementById("names").addEventListener("change", showNames);
document.getElementById("spin").addEventListener("change", (e) => {
  controls.autoRotate = e.target.checked;
  controls.autoRotateSpeed = 1.1;
});
document.getElementById("play").addEventListener("click", play);
document.getElementById("reset").addEventListener("click", () => {
  stopPlay();
  setAmount(0);
});
document.getElementById("fit").addEventListener("click", () => {
  if (isolated && selection) frameObject(selection.item.object);
  else frameAssembly();
});
document.getElementById("clearSel").addEventListener("click", clearSelection);
document.getElementById("solo").addEventListener("click", () => {
  if (!selection) return;
  if (isolated) exitIsolation(true);
  else enterIsolation();
});
window.addEventListener("keydown", (e) => {
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
  if (e.code === "Escape") {
    clearSelection();
    return;
  }
  if (e.code !== "Space" || e.repeat) return;
  if (e.target && e.target.tagName === "BUTTON") return;
  e.preventDefault();
  play();
});
window.addEventListener("resize", resizeAndListen);
resize();

function fail(message) {
  loadingEl.classList.add("error");
  loadTitle.textContent = "模型没有打开";
  loadText.textContent = message;
  barFill.style.width = "0";
}

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
loader.load(modelUrl.href, (gltf) => {
  gltf.scene.traverse((obj) => {
    if (!obj.isMesh) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    const cloned = mats.map((mat) => {
      if (!mat) return mat;
      const copy = mat.clone();
      copy.side = THREE.DoubleSide;
      return copy;
    });
    obj.material = Array.isArray(obj.material) ? cloned : cloned[0];
  });
  scene.add(gltf.scene);
  asmRoot = null;
  gltf.scene.traverse((obj) => {
    if (asmRoot) return;
    const name = originalName(obj);
    if (name === ASM_NAME || obj.name === "X300_for_Rendering") asmRoot = obj;
  });
  if (!asmRoot) {
    fail("文件里没有找到装配根节点。");
    return;
  }
  bindExplode(asmRoot);
  const screwCount = parts.filter((item) => item.fastener).length;
  summaryEl.textContent = `${modules.length} 个总成 · ${parts.length} 个零件 · ${screwCount} 个紧固件`;
  showNames();
  setAmount(0);
  frameAssembly();
  setBusy(false);
  loadingEl.remove();
}, (event) => {
  if (!event.lengthComputable) {
    loadText.textContent = "正在读取…";
    return;
  }
  const ratio = event.loaded / event.total;
  barFill.style.width = `${Math.round(ratio * 100)}%`;
  const mb = event.total / (1024 * 1024);
  loadText.textContent = ratio < 1
    ? `下载 ${Math.round(ratio * 100)}%  ·  ${mb.toFixed(0)} MB`
    : "正在解析网格和贴图…";
}, (error) => {
  console.error(error);
  fail("请用启动脚本打开本页，不要直接双击 html。");
});

renderer.setAnimationLoop((now) => {
  if (playing) {
    const u = Math.min(1, (now - playStart) / PLAY_MS);
    const eased = u < 0.5 ? 2 * u * u : 1 - ((-2 * u + 2) ** 2) / 2;
    setAmount(playFrom + (1 - playFrom) * eased);
    if (u >= 1) playing = false;
  }
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
});
