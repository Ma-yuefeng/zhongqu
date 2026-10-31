/** 由装配树和零件代号整理的名称。图号只在说明里作对照，场景标签用这里的名称。 */

const MODULES = {
  "_X3000001_ASM": {
    name: "底座总成",
    category: "总成",
    intro: "整机最下方的支撑与回转部分，放在三脚架上。内部有转盘、轴承和旋转主体。",
  },
  "_X3000002_ASM": {
    name: "传感器总成",
    category: "总成",
    intro: "机身一侧的采集总成，包含激光雷达、定位天线、传感器和图像处理板。",
  },
  "_X3000004_ASM": {
    name: "主控总成",
    category: "总成",
    intro: "侧向的电气总成，包含主控电路板、相机立柱和电机组件。",
  },
  "_X3000005_ASM": {
    name: "前壳总成",
    category: "总成",
    intro: "朝向镜头一侧的外壳，遮住机身正面，前部有一圈压圈。",
  },
  "_X3000007_ASM": {
    name: "后壳总成",
    category: "总成",
    intro: "机身背面的外壳，四角有机脚和脚垫。",
  },
  "_X3000008_ASM": {
    name: "上壳总成",
    category: "总成",
    intro: "机身上部，左右侧板围成框架，顶部是提手，一侧带头部光学组件。",
  },
  "X3000030": {
    name: "底部挡片",
    category: "结构件",
    intro: "贴在底部的小薄片，单独一件，不在其他总成里面。",
  },
};

const PARTS = {
  "_X3000001_ASM": {
    X30000: { name: "底座底板", category: "结构件", intro: "底座最底层的承板，面积盖住整机底面，用来坐在三脚架上。" },
    _0001_ASM: { name: "底座传动组件", category: "总成", intro: "底座内部的传动部分，里面还有轴承座和转盘。" },
    D_65X90X180001: { name: "转盘轴承", category: "结构件", intro: "装在转盘上的轴承，零件代号按 65×90×18 轴承规格命名。" },
    X3000008: { name: "轴承压盖", category: "结构件", intro: "压在转盘轴承上方的环形盖，把轴承限位在底座里。" },
    MP55000: { name: "旋转驱动件", category: "结构件", intro: "扁圆形零件，紧挨旋转主体，随底座一起做回转。" },
    X300MP550001: { name: "旋转主体", category: "结构件", intro: "底座里体积最大的回转件，扫描时整机绕它转动。" },
    D0005: { name: "轴承垫圈", category: "结构件", intro: "轴承旁边的薄垫圈，用来调整间隙。" },
    "0001": { name: "底座盖板", category: "结构件", intro: "盖在底座表面的薄板。" },
    _0002_ASM: { name: "底座侧部组件", category: "总成", intro: "底座侧面的一组零件，里面有一对对称件和支架。" },
    "000": { name: "转盘外壳", category: "结构件", intro: "底座中部的圆形壳体，包住转盘。" },
    X3000011: { name: "底座支架", category: "结构件", intro: "底座侧面的条形支架，用来撑住相邻零件。" },
    X300_0001: { name: "底座垫片", category: "结构件", intro: "贴在底座上的薄片。" },
    X300_0002: { name: "底部贴片", category: "结构件", intro: "面积较大的薄片，贴在底座表面。" },
    X300_0003: { name: "底座侧盖", category: "结构件", intro: "挡住底座侧面的小盖板。" },
  },
  "_X3000002_ASM": {
    X30000: { name: "雷达安装座", category: "结构件", intro: "激光雷达背后的安装座，雷达固定在这一侧。" },
    SENSOR000: { name: "传感器", category: "电子", intro: "安装座旁的小型传感器。" },
    X300001: { name: "传感器支架", category: "结构件", intro: "这个总成里最高的结构件，把雷达、天线和电路撑在机身上。" },
    ISP000: { name: "图像处理板", category: "电子", intro: "图像信号处理板，靠近相机模组。" },
    ISP0002: { name: "图像处理小板", category: "电子", intro: "贴在图像处理板旁边的小电路板。" },
    "00": { name: "接插件", category: "电子", intro: "传感器总成上的小型接插件。" },
    _0003_ASM: { name: "相机模组", category: "光学", intro: "一组小型相机零件，内部代号里有 CM4000。" },
    "0005": { name: "天线支架", category: "结构件", intro: "托住 GNSS 天线的小支架。" },
    GNSS000: { name: "GNSS 天线", category: "电子", intro: "卫星定位天线，装在传感器总成顶部。" },
    "MID-360S_ASM": { name: "激光雷达", category: "光学", intro: "型号 MID-360 的激光雷达，蓝色球形窗口朝外，负责扫描点云。" },
  },
  "_X3000004_ASM": {
    GS2054HH0001: { name: "相机立柱", category: "光学", intro: "细长立柱，零件代号 GS2054HH，竖在主控板外侧。" },
    X300_0004: { name: "主控侧板", category: "结构件", intro: "主控总成外侧的立板，挡住电路板。" },
    X300_0005: { name: "主控内衬", category: "结构件", intro: "贴在主控侧板内侧的衬板。" },
    "0006_ASM": { name: "微型电机", category: "电子", intro: "主控总成顶部的小电机，内部代号 GSC550M18010D。" },
    _X300_PCBA00_ASM: { name: "主控电路板", category: "电子", intro: "整机主控 PCBA，竖着固定在侧板和相机立柱之间。" },
    "00": { name: "接口模块", category: "电子", intro: "主控板端部的接口模块，左右各一件。" },
  },
  "_X3000005_ASM": {
    X30000: { name: "前外壳", category: "结构件", intro: "机身正面的外壳，罩住镜头一侧。" },
    X3000016: { name: "前窗压圈", category: "结构件", intro: "前壳上的方形压圈，压住前窗。" },
  },
  "_X3000007_ASM": {
    X30000: [
      { name: "后外壳", category: "结构件", intro: "机身背面的大外壳，是后壳总成的主体。" },
      { name: "后壳上沿", category: "结构件", intro: "后外壳顶部的一条沿口。" },
    ],
    N6000001: { name: "角垫", category: "结构件", intro: "后壳四个角上的小垫块，上下各两件。" },
    X300002: { name: "后壳饰条", category: "结构件", intro: "后壳表面的细长饰条。" },
    "00": { name: "脚垫", category: "结构件", intro: "贴在后壳底部的方形脚垫，左右各一件。" },
  },
  "_X3000008_ASM": {
    X300_000: [
      { name: "左侧板", category: "结构件", intro: "上壳左侧的高大侧板，和右侧板一起围住机身。" },
      { name: "右侧板", category: "结构件", intro: "上壳右侧的高大侧板。" },
    ],
    X3000024: { name: "提手", category: "结构件", intro: "机身最上方的提手，用来搬动设备。" },
    X300_0008: { name: "左侧压条", category: "结构件", intro: "左侧板下沿的窄压条。" },
    X300_0009: { name: "右侧压条", category: "结构件", intro: "右侧板下沿的窄压条。" },
    X300_0010: { name: "上沿压条", category: "结构件", intro: "侧板顶部的窄压条，左右各一件。" },
    _0004_ASM: { name: "头部光学组件", category: "光学", intro: "上壳侧面的光学部分，里面有镜头壳体和 LED。" },
  },
  X3000030: {
    X3000030: { name: "底部挡片", category: "结构件", intro: "底部单独的小薄片。" },
  },
};

function screwLength(raw) {
  if (raw.length <= 2) return raw;
  const stripped = raw.replace(/000\d$/, "");
  return stripped || raw;
}

function fastener(code) {
  const screw = String(code || "").match(/^M(\d+)X(\d+)/i);
  if (screw) {
    const len = screwLength(screw[2]);
    return {
      name: `M${screw[1]}×${len} 螺钉`,
      category: "紧固件",
      intro: `公制螺钉，螺纹 M${screw[1]}，长度 ${len} mm，用来把相邻零件锁在一起。`,
    };
  }
  if (/^ST1_4_6/i.test(code)) {
    return { name: "ST1.4×6 自攻钉", category: "紧固件", intro: "自攻螺钉，规格 ST1.4×6，拧在塑料壳体上。" };
  }
  if (/^3_10_/.test(code)) {
    return { name: "M3×10 铜柱", category: "紧固件", intro: "六角铜柱，规格约 3×10 mm，用来垫高电路板。" };
  }
  if (/^3_6_/.test(code)) {
    return { name: "M3×6 铜柱", category: "紧固件", intro: "较短的铜柱，规格约 3×6 mm。" };
  }
  if (/^10_2_/.test(code)) {
    return { name: "销轴", category: "紧固件", intro: "细销轴，用来给零件限位。" };
  }
  return null;
}

function fallback(code) {
  return {
    name: "结构件",
    category: "结构件",
    intro: `模型里的独立零件，代号 ${code}。`,
  };
}

export function describeModule(code) {
  return MODULES[code] || { name: "总成", category: "总成", intro: "装配中的一个总成。" };
}

export function describePart(moduleCode, partCode, index) {
  const fast = fastener(partCode);
  if (fast) return fast;
  const entry = (PARTS[moduleCode] || {})[partCode];
  if (Array.isArray(entry)) return entry[Math.min(index, entry.length - 1)] || fallback(partCode);
  if (entry) return entry;
  return fallback(partCode);
}
