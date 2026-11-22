import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { createContext, runInContext } from "node:vm";
import { JSDOM } from "jsdom";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
const showroom = join(root, "public/anzhe-showroom");
const origin = "https://locks.flashcast.com.my";
const locales = {
  zh: { tag: "zh-CN", alternate: "zh-Hans", label: "简体中文", short: "中文", og: "zh_MY" },
  en: { tag: "en", alternate: "en", label: "English", short: "EN", og: "en_MY" },
  ms: { tag: "ms-MY", alternate: "ms-MY", label: "Bahasa Melayu", short: "BM", og: "ms_MY" },
};
const languages = Object.keys(locales);
const groups = ["entrance", "room", "slim"]; // Catalogue groups for entrance, interior and aluminium doors.
const minimumVisibleChars = 6000;
const { values: args } = parseArgs({ options: { check: { type: "boolean" }, copy: { type: "string" } } });

const escape = text => String(text).replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
})[char]);
const lf = text => text.replace(/\r\n/g, "\n");
const finish = text => /[.!?。！？]$/.test(text) ? text : text + ".";
const pagePath = (lang, slug) => slug ? `/${lang}/lock/${slug}/` : `/${lang}/`;
const absolute = path => origin + path;

function alternates(slug) {
  return [
    ...languages.map(lang => [locales[lang].alternate, absolute(pagePath(lang, slug))]),
    ["x-default", absolute(slug ? pagePath("en", slug) : "/")],
  ];
}

async function readShowroomSources() {
  const source = createContext({});
  source.window = source;
  for (const filename of ["catalog.js", "features.js", "strings.js"]) {
    const text = await readFile(join(showroom, filename), "utf8");
    runInContext(text, source, { filename, timeout: 1000 });
  }
  return source;
}

async function readCopy() {
  const file = args.copy ? resolve(args.copy) : join(root, "docs/seo/anzhe-lock-page-copy.json");
  try {
    return JSON.parse((await readFile(file, "utf8")).replace(/^\uFEFF/, ""));
  } catch (error) {
    if (error.code === "ENOENT" && !args.copy) return {};
    throw error;
  }
}

async function readCategoryBodyExtra() {
  const file = join(root, "docs/seo/anzhe-lock-category-body.json");
  try {
    return JSON.parse((await readFile(file, "utf8")).replace(/^\uFEFF/, ""));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

function getCategoryPointExtra(categoryExtra, slug, heading) {
  const extra = categoryExtra?.zh?.[slug];
  if (!extra) return "";
  if (slug === "type/entrance-door") {
    if (heading === "先量门厚与锁体位置") return extra.doorCheck || "";
    if (heading === "按家人习惯选开锁方式") return extra.accessChoice || "";
    if (heading === "比较把手与上锁方式") return extra.handleStyle || "";
  } else if (slug === "type/interior-door") {
    if (heading === "确认室内反锁的操作") return extra.whatSkip || "";
    if (heading === "安排出租房间的权限") return extra.privacyUse || "";
    if (heading === "核对原有把手孔与门边") return extra.doorCheck || "";
  } else if (slug === "type/aluminium-door") {
    if (heading === "量锁具所在的平面宽度") return extra.doorCheck || "";
    if (heading === "确认锁体能放进铝型材") return extra.cutoutAndSwing || "";
    if (heading === "确认开门后有没有干涉") return extra.glassFrame || "";
  } else if (slug === "feature/face-recognition") {
    if (heading === "确认平时站在哪里") return extra.doorCheck || "";
    if (heading === "比较门口白天和晚上的光线") {
      return (extra.whoFits || "") + (extra.privacyNote || "");
    }
    if (heading === "留一个常用的备用开锁方式") {
      let text = extra.accessChoice || "";
      if (text.startsWith("undefined")) text = text.slice(9);
      return text;
    }
  } else if (slug === "feature/palm-vein") {
    if (heading === "看手掌能否自然伸到感应区") return extra.doorCheck || "";
    if (heading === "按家人的实际情况试用") return extra.whoFits || "";
    if (heading === "区分识别方式与其他配置") return extra.enrolNote || "";
  } else if (slug === "feature/video-intercom") {
    if (heading === "先选室内查看还是远程接听") return extra.screenAndCamera || "";
    if (heading === "在关门状态测试 Wi-Fi") return extra.remoteNote || "";
    if (heading === "让镜头看得到访客站位") return extra.doorCheck || "";
  }
  return "";
}

function prices(model, formatPrice) {
  const amount = String(model.price);
  if (typeof model.price !== "number" || !/^\d+(?:\.\d{1,2})?$/.test(amount) || model.price <= 0) {
    throw new Error(`${model.id}: expected a catalogue price in MYR with at most two decimal places`);
  }
  const [ringgit, sen] = amount.split(".");
  // JavaScript numbers omit a trailing zero. Pad the sen without rounding the amount.
  const offer = sen === undefined ? ringgit : `${ringgit}.${sen.padEnd(2, "0")}`;
  const display = formatPrice(model.price);
  if (display.slice(2).replaceAll(",", "") !== offer) throw new Error(`${model.id}: display and offer prices differ`);
  return { offer, display };
}

async function imageInfo(file) {
  if (!/^assets\/[a-z\d][a-z\d-]*\.webp$/.test(file)) throw new Error(`Unexpected showroom image: ${file}`);
  const { width, height } = await sharp(join(showroom, file)).metadata();
  if (!width || !height) throw new Error(`Missing dimensions for ${file}`);
  return { path: "/" + file, width, height };
}

async function versionedAsset(path, source) {
  const contents = lf(await readFile(source, "utf8"));
  const hash = createHash("sha256").update(contents).digest("hex").slice(0, 12);
  return `${path}?v=${hash}`;
}

const copyTemplates = {
  zh: {
    pending: "待确认",
    photo: "产品图",
    specs: "型号规格",
    mechanism: "锁体类型",
    materials: "材质",
    fit: "门型兼容与安装",
    faq: "常见问题",
    compare: "同类对比",
    guide: "从确认门型到安装交接",
    ask: "WhatsApp 咨询这款锁",
    home: "返回电子锁展厅",
    comparisonIntro: "先看同门型的型号，再查看其他门型的选择。下列价格都含安装。规格中未列明的项目请按型号核实，不能仅凭价格或相似外观判断可否互换。",
    singleModel: "目前只有这一款窄框铝门锁。其余型号供对照使用场景和规格，不能直接当作替代。",
    message: ({ name, price }) => `你好，我想咨询 ANZHE ${name}（含安装 ${price}）。我可以发门的正面和门边照片，请帮我确认能否安装。`,
    templates: ({ name, group, price, access, words }) => {
      const kind = { entrance: "电子锁", room: "室内门锁", slim: "窄框铝门电子锁" }[group];
      const title = `${name} ${kind}｜含安装 ${price}｜吉隆坡 雪兰莪`;
      const fit = {
        entrance: "适用于有足够面板安装空间、锁体位置相合的入户门。配标准锁体的公寓防火木门可先核对门厚和门框，再确认消防认证及管理处要求。窄框铝门或门框间隙不足的门不应直接选用。",
        room: "面向卧室、书房和出租单位的室内门。要核对门厚、锁舌位置及原有开孔。用于入户、防火或露天门前必须另选并确认相应用途的门锁。",
        slim: "适用于锁位与面板宽度相容的窄框铝门。面板宽 38.6 mm，仍需量门框可用平面、型材深度与现有锁孔。可用平面不足或锁体位置不合时不能直接安装。",
      }[group];
      return {
        title,
        h1: title,
        description: group === "slim"
          ? `${name} 面板宽 38.6 mm，适合窄框铝门。含安装价 ${price}，安装前核对门框可用宽度与现有锁孔。`
          : `${name} 含安装价 ${price}。${access.replace(/[。.]$/, "")}。吉隆坡与雪兰莪上门安装，安装前核对门厚、锁体与门框宽度。`,
        answer: {
          entrance: `${name} 是 ANZHE 入户门电子锁，含安装 ${price}。先量门厚、核对锁体和门框，确认适配后再施工。`,
          room: `${name} 是 ANZHE 室内门电子锁，含安装 ${price}。适合卧室、书房与出租单位内门，安装前会核对原锁孔。`,
          slim: `${name} 是 ANZHE 窄框铝门电子锁，面板宽 38.6 mm，含安装 ${price}，需先量门框可用宽度。`,
        }[group],
        doorFit: fit,
        faqs: [
          { q: `${name} 多少钱？`, a: `含安装价为 ${price}。${words.costCopy}` },
          { q: { entrance: "我家公寓门能装吗？", room: "卧室或出租房的门能装吗？", slim: "窄框铝门能装吗？" }[group], a: fit },
          { q: "保修涵盖什么？", a: "以确认订单时提供的书面条款为准。请核对锁具本身、安装工艺、电池或耗材分别由谁处理，有哪些例外。若出现故障，可带上型号、订单和问题照片请顾问判断。" },
        ],
      };
    },
  },
  en: {
    pending: "To be confirmed",
    photo: "Product photo",
    specs: "Model specifications",
    mechanism: "Lock mechanism",
    materials: "Materials",
    fit: "Door fit and installation",
    faq: "Frequently asked questions",
    compare: "Compare by door type",
    guide: "From the door check to handover",
    ask: "Ask about this lock on WhatsApp",
    home: "Back to the lock showroom",
    comparisonIntro: "Start with locks intended for the same door type, then check the other groups if you are buying for several doors. All prices include installation. Confirm any unlisted specification for the exact model before assuming one lock can replace another.",
    singleModel: "This is the only slim aluminium model in the range. Models in the other groups are here for reference and should be checked separately against the door.",
    message: ({ name, price }) => `Hi, I’m interested in the ANZHE ${name} at ${price} including installation. I can share photos of the front and edge of my door. Could you check whether this model fits?`,
    templates: ({ name, group, price, access, words }) => {
      const kind = { entrance: "Digital Lock", room: "Interior Door Lock", slim: "Narrow Frame Digital Lock" }[group];
      const fit = {
        entrance: "Consider this model for an entrance door with space for the panel and a compatible lock body position. A condominium timber fire door with a standard lock body can be assessed once its thickness, frame and approval requirements are known. Narrow frames or doors with insufficient clearance need a different assessment.",
        room: "This lock is intended for interior doors such as bedrooms, studies and rooms in rental units. Check thickness, latch position and the existing cut-out. For an outside, entrance or fire door, choose a lock approved for that use after a fit check.",
        slim: "The panel is 38.6 mm wide for narrow-frame aluminium doors. Check the usable flat surface, depth of the frame and the existing lock cut-out. A frame with too little surface or an incompatible lock body position cannot take the lock as it stands.",
      }[group];
      const description = group === "slim"
        ? `${name} has a 38.6 mm slim panel for narrow-frame aluminium doors. ${price} including installation, with frame width checked first.`
        : `${name} at ${price} including installation. ${finish(access)} Supplied and installed across Kuala Lumpur and Selangor, with door thickness and lock body checked first.`;
      const installed = `${name} ${kind} with Installation — ${price}`;
      return {
        title: `${name} ${kind}｜${price} with Installation｜KL & Selangor`,
        h1: installed + "｜KL & Selangor",
        description,
        answer: {
          entrance: `The ${name} is an ANZHE entrance door lock at ${price} including installation. It supports ${finish(access)} We check door thickness, frame width and the existing lock body before drilling so you can confirm the fit before booking.`,
          room: `The ${name} is an ANZHE interior door lock at ${price} including installation, with ${finish(access)} It is intended for bedrooms, studies and rooms in rental units. We check the existing cut-out and latch position before fitting it.`,
          slim: `The ${name} is an ANZHE lock for narrow-frame aluminium doors with a 38.6 mm panel, at ${price} including installation. We measure the flat part of the frame and check the existing lock opening before you choose it for your door.`,
        }[group],
        doorFit: fit,
        faqs: [
          { q: `How much does the ${name} cost?`, a: `${price} including installation. ${words.costCopy}` },
          { q: { entrance: "Will it fit my condominium door?", room: "Will it fit a bedroom or a rental room?", slim: "Will it fit a narrow aluminium door?" }[group], a: fit },
          { q: "What does the warranty cover?", a: "Ask for the written terms for your order. Check who covers the lock, the installation and any consumables, and which situations are excluded. If something fails, share the model, order details and photos so the advisor can review it." },
        ],
      };
    },
  },
  ms: {
    pending: "Perlu disahkan",
    photo: "Gambar produk",
    specs: "Spesifikasi model",
    mechanism: "Jenis mekanisme kunci",
    materials: "Bahan",
    fit: "Kesesuaian pintu dan pemasangan",
    faq: "Soalan lazim",
    compare: "Bandingkan mengikut jenis pintu",
    guide: "Daripada semakan pintu hingga serahan",
    ask: "Tanya tentang model ini di WhatsApp",
    home: "Kembali ke ruang pameran kunci",
    comparisonIntro: "Mulakan dengan model untuk jenis pintu yang sama. Jika anda membeli kunci untuk beberapa pintu, rujuk kumpulan lain di bawah. Harga yang tertera termasuk pemasangan. Semak spesifikasi yang belum dinyatakan sebelum memilih model ganti.",
    singleModel: "Ini satu-satunya model untuk bingkai aluminium sempit dalam katalog. Model kumpulan lain disenaraikan sebagai rujukan dan perlu disemak mengikut jenis pintu.",
    message: ({ name, price }) => `Hai, saya berminat dengan ANZHE ${name} pada harga ${price} termasuk pemasangan. Saya boleh kongsi gambar muka dan tepi pintu. Boleh semak sama ada model ini sesuai?`,
    templates: ({ name, group, price, words }) => {
      const fit = {
        entrance: "Model ini untuk pintu utama yang mempunyai ruang panel dan kedudukan badan kunci yang sesuai. Bagi pintu kayu kalis api di kondominium, semak ketebalan, lebar bingkai serta kelulusan pengurusan. Bingkai sempit atau ruang panel yang tidak mencukupi perlu dinilai secara berasingan.",
        room: "Model ini untuk pintu dalaman seperti pintu bilik tidur, bilik kerja atau bilik sewa. Semak ketebalan pintu, kedudukan selak dan bukaan sedia ada. Untuk pintu utama, pintu luar atau pintu kalis api, pilih model yang sesuai dengan kegunaan tersebut.",
        slim: "Panel selebar 38.6 mm direka untuk pintu aluminium berbingkai sempit. Semak lebar permukaan rata, kedalaman bingkai dan bukaan kunci sedia ada. Jika ruang tidak cukup atau kedudukan badan kunci tidak sepadan, pemasangan terus tidak sesuai.",
      }[group];
      return {
        title: `${name} Kunci Digital｜${price} Termasuk Pemasangan｜KL & Selangor`,
        h1: `${name} Kunci Digital Termasuk Pemasangan — ${price}｜KL & Selangor`,
        description: `${name} pada ${price} termasuk pemasangan. Ketebalan pintu dan badan kunci diperiksa sebelum kerja penggerudian. Semak kesesuaian untuk ${words[group].toLowerCase()} di Kuala Lumpur dan Selangor.`,
        answer: `${name} ialah kunci pintu ANZHE pada ${price} termasuk pemasangan untuk kategori ${words[group].toLowerCase()}. Kami akan menyemak ketebalan pintu, ruang bingkai dan bukaan kunci sedia ada sebelum membuat sebarang kerja penggerudian. Hantar gambar muka dan tepi pintu untuk semakan sebelum membuat tempahan.`,
        doorFit: fit,
        faqs: [
          { q: `Berapakah harga ${name}?`, a: `${price} termasuk pemasangan. ${words.costCopy}` },
          { q: { entrance: "Bolehkah ia dipasang pada pintu kondominium?", room: "Bolehkah ia dipasang pada pintu bilik?", slim: "Bolehkah ia dipasang pada pintu aluminium sempit?" }[group], a: fit },
          { q: "Apakah yang dilindungi oleh jaminan?", a: "Rujuk syarat bertulis semasa mengesahkan pesanan. Semak pihak yang mengurus kunci, kerja pemasangan dan barang guna habis serta pengecualiannya. Jika berlaku masalah, sertakan model, butiran pesanan dan gambar untuk semakan." },
        ],
      };
    },
  },
};

const fittingGuides = {
  zh: [
    ["先确定要换哪一扇门", "咨询时先说清是家门、卧室门还是窄框铝门，并说明门外有没有铁闸。一个单位可能同时有几种门。同一款锁可以用于哪一扇，要看实际用途、门框和锁位，不能按屋内另一扇门的尺寸估算。"],
    ["拍出门内外的空间", "正面照片要拍到整扇门和两侧门框，也拍一下门打开后的状态。门外有铁闸就补一张两扇门打开及关合时的相对位置。这样顾问可以先看面板、把手或门铃会不会碰到框边、其他把手或前面的闸门。"],
    ["保留原锁与门边的照片", "门边近照应能看清锁舌、面板和门框上的锁扣。若知道原锁的型号，可同时注明。门在未更换前已经难以关紧或需要抬门才能反锁，也请先说明，方便分清是选锁尺寸的问题还是门扇本身需要检查。"],
    ["区分外观尺寸与安装空间", "规格表列出的长、宽、厚可帮助比较面板大小。门厚、可用平面、锁体位置和原有开孔仍需单独核对。如果门面有线板、凸条或斜边，照片上请指明可用的平面。面板标注宽度不能直接当作最小门框宽度。"],
    ["提前确认公寓和出租单位的规定", "如门有防火标识、属于管理处统一规定的外观，或房屋为租用，请先向相关管理方确认能否换锁、开孔或改动门框。把书面要求和门型资料一起交给顾问，待确认允许的安装方式后再安排施工。"],
    ["按实际使用者选开锁方式", "列出每天用门的人，再看本型号的开锁方式。家人、访客或房客可能需要不同的进入方式。有手机应用或遥控器的配置请逐款确认。交接时可请安装人员按所选配置演示常用方式和备用方式。"],
    ["提前准备停电或低电量时的用法", "先看规格表的日常供电和应急供电两行，确认属于可充电电池还是需要另备电池。请在交接时核对应急接口、备用钥匙及低电量提示。不同型号的接口可能不同，应按本型号说明准备外接电源。"],
    ["让报价对应到准确的型号和门", "咨询时把型号全名和上方含安装价一起发给顾问。相近的型号后缀可能对应不同配置。若现有门需要额外开孔、修整或配合其他工程，请在施工前核对范围、可行性和报价的书面说明。"],
    ["安装完成后按日常动线试用", "可以先在门打开的状态下，由安装人员演示锁舌运作，再检查门内外常用的开门方式及正常关合。门前有铁闸的话一起试关，确认两个把手和面板有空间。只有选定型号列出的功能才列入交接确认。"],
    ["留好交接资料和售后凭据", "保留订单、确切型号、交接说明以及书面保修条款。要询问问题时可附现象和必要的门锁照片。照片可避开住址、门牌、密码或可辨识的钥匙细节，便于说明问题也保护住户资料。"],
  ],
  en: [
    ["Identify the door you want to change", "Start with the door you actually use: an entrance door, a bedroom door or a door with a narrow aluminium frame. A single unit can have more than one of these. Use its own measurements and opening rather than the measurements of a similar door elsewhere in the unit."],
    ["Photograph the whole door and surrounding space", "Show the whole door and both sides of its frame. Take another picture with the door open. If there is a security grille, show how the two leaves sit when open and closed. The photos let an advisor check for possible clashes between panels, handles, the grille and the frame."],
    ["Show the existing lock and door edge", "Send a close-up of the latch, faceplate and the strike on the frame. Include the current lock model if you know it. Mention if the door already sticks or needs to be lifted before it latches. That helps the installer separate a fit question from a problem with the door itself."],
    ["Separate panel dimensions from fitting space", "The dimensions above help you compare the size of one panel with another. Measure door thickness, the available flat surface and the existing opening separately. Point out raised trim, mouldings and sloping edges. A panel width by itself does not establish the minimum frame width for installation."],
    ["Check building and tenancy conditions", "If the door has a fire label, a standard external appearance or rules set by the building owner, confirm what may be replaced or altered before agreeing to any work. Share the relevant written rules with the advisor together with the door photos."],
    ["Choose access methods for the people using the door", "List who uses this door day to day and which access methods suit them. Residents and visitors can have different needs. Check the configuration if you need app access or a remote. At handover, ask to see how the chosen methods and backup access work."],
    ["Prepare for low batteries", "Use the power and emergency supply rows to check whether this model takes replaceable cells or a rechargeable battery. Ask the installer to point out the low-battery alert, emergency port and backup key. Prepare a power source for the port used by the exact model."],
    ["Check that the quote names the model and the door", "Send the complete model name and the installed price on this page when you enquire. Similar suffixes can refer to different configurations. If the existing door needs a cut-out, other alterations or work by someone else, ask for the scope and pricing in writing before work begins."],
    ["Check everyday operation at handover", "Ask the installer to demonstrate the latch with the door open, then check that the door closes and the access methods you use work from both sides as intended. If a grille is fitted, check clearance before closing both. Only test functions listed for the installed configuration."],
    ["Keep the handover and warranty paperwork", "Keep the order details, exact model and written warranty. If you need help later, send a short description of the problem with relevant photos. Leave addresses, access codes and identifiable details of mechanical keys out of the photos."],
  ],
  ms: [
    ["Tentukan pintu yang hendak ditukar kunci", "Nyatakan sama ada ia pintu utama, pintu bilik atau pintu dengan bingkai aluminium sempit. Satu unit boleh mempunyai beberapa jenis pintu. Gunakan ukuran dan bukaan pada pintu berkenaan, bukan ukuran pintu lain yang kelihatan serupa."],
    ["Ambil gambar ruang di sekeliling pintu", "Ambil gambar keseluruhan pintu bersama kedua-dua sisi bingkai, kemudian ambil satu lagi gambar semasa pintu dibuka. Jika ada jeriji keselamatan, tunjukkan kedudukan pintu dan jeriji ketika dibuka dan ditutup supaya ruang untuk panel dan pemegang dapat diperiksa."],
    ["Tunjukkan kunci dan tepi pintu sedia ada", "Ambil gambar dekat selak, plat tepi dan plat penerima pada bingkai. Sertakan model kunci asal jika diketahui. Beritahu jika pintu sudah tersekat atau perlu diangkat untuk dikunci. Ini membantu pemasang membezakan isu kesesuaian kunci daripada keadaan pintu."],
    ["Bezakan dimensi panel daripada ruang pemasangan", "Ukuran panel membantu anda membandingkan saiz model. Semak ketebalan pintu, permukaan rata dan bukaan sedia ada secara berasingan. Tunjukkan sebarang hiasan timbul atau bahagian serong. Lebar panel sahaja tidak menentukan lebar minimum bingkai untuk pemasangan."],
    ["Semak peraturan bangunan dan sewaan", "Jika pintu berlabel kalis api, perlu mengekalkan rupa tertentu atau tertakluk pada syarat pengurusan, dapatkan pengesahan sebelum bersetuju dengan perubahan. Kongsi syarat bertulis yang berkaitan bersama gambar pintu."],
    ["Pilih kaedah akses mengikut pengguna", "Senaraikan siapa yang menggunakan pintu setiap hari dan kaedah yang sesuai untuk mereka. Penghuni dan tetamu mungkin mempunyai keperluan berbeza. Semak konfigurasi jika perlukan aplikasi atau alat kawalan jauh. Minta pemasang tunjukkan kaedah utama dan pilihan sandaran."],
    ["Bersedia jika bateri lemah", "Semak bahagian bekalan kuasa untuk mengetahui sama ada model menggunakan bateri boleh dicas semula atau bateri yang perlu diganti. Minta pemasang menunjukkan amaran bateri, port kuasa kecemasan dan kunci sandaran. Sediakan sumber kuasa yang sesuai dengan port model tersebut."],
    ["Pastikan sebut harga menyatakan model dan pintu", "Berikan nama model penuh dan harga pemasangan yang tertera di halaman ini. Akhiran nama yang hampir sama boleh merujuk konfigurasi berbeza. Jika pintu perlu ditebuk atau diubah suai, semak skop kerja serta harga secara bertulis sebelum kerja dimulakan."],
    ["Uji penggunaan harian semasa serahan", "Minta pemasang menunjukkan pergerakan selak semasa pintu dibuka. Semak pintu boleh ditutup seperti biasa dan uji kaedah buka kunci yang akan digunakan. Jika ada jeriji, semak jarak antara pemegang dan panel sebelum kedua-duanya ditutup."],
    ["Simpan dokumen pemasangan dan jaminan", "Simpan butiran pesanan, nama model dan syarat jaminan bertulis. Jika perlukan bantuan kemudian, terangkan keadaan kunci dan sertakan gambar yang berkaitan. Elakkan menyertakan alamat, kod akses atau gambar terperinci kunci mekanikal."],
  ],
};

const doorChecks = {
  zh: {
    entrance: ["入户门重点看锁位和门前空间", "记录开门方向、常走的是哪一侧及室外是否还有另一扇门。要换推拉或下压把手时，请核对人站的位置和开门时的手部空间。若更换后可能影响入户门关合、防火功能或原有锁扣，先确认可行方案。"],
    room: ["室内门重点核对原锁孔和反锁需求", "卧室、书房和分租房间对从里面上锁的要求可能不同。先确认房间用途、现有的把手位置、开门方向和门内使用习惯。确认型号列出的功能适合房间，也确认需要用到备用开门方式时由谁保管钥匙。"],
    slim: ["窄框门重点看型材和可用平面", "铝型材不同位置的宽度可能不同。请拍锁位附近的正面、门边和型材接缝，并让顾问确认量的是面板实际接触的平面。也要检查原锁孔周围的开槽、螺丝位置、开门后是否会碰到相邻门框。"],
  },
  en: {
    entrance: ["Check the lock position and space around the entrance", "Record which way the door swings and whether another door sits in front of it. Check the hand space around the handle position for a push-pull or lever lock. Confirm the approach if fitting could affect closing, fire performance or the existing strike."],
    room: ["Check the cut-out and how the room is used", "A bedroom, study or rental room can have different privacy needs. Note the door swing, handle position and how people need to lock it from inside. Confirm the features listed for the chosen model and decide who will keep backup access."],
    slim: ["Check the profile and the flat part of the aluminium frame", "The available width can change near a joint or a raised profile. Photograph the face, the edge and any joints near the lock. Ask the advisor which part of the surface to measure, and include photos of the existing cut-out and nearby frame."],
  },
  ms: {
    entrance: ["Semak kedudukan kunci dan ruang di pintu masuk", "Nyatakan arah pintu dibuka dan sama ada ada pintu atau jeriji di hadapannya. Semak ruang tangan di sekeliling pemegang. Jika pemasangan boleh menjejaskan cara pintu ditutup, ciri kalis api atau kedudukan plat penerima, dapatkan pengesahan terlebih dahulu."],
    room: ["Semak bukaan dan kegunaan bilik", "Bilik tidur, bilik kerja dan bilik sewa mungkin memerlukan tahap privasi yang berbeza. Nyatakan arah bukaan, kedudukan pemegang dan cara pintu dikunci dari dalam. Semak fungsi model dan tentukan siapa yang akan menyimpan kunci sandaran."],
    slim: ["Semak profil dan permukaan rata pada bingkai aluminium", "Lebar yang boleh digunakan mungkin berbeza berhampiran sambungan atau bahagian timbul. Ambil gambar muka pintu, tepi dan sambungan berhampiran kunci. Minta perunding mengesahkan bahagian yang perlu diukur dan sertakan gambar bukaan lama."],
  },
};

const answerHeadings = {
  zh: name => `${name} 含安装多少钱，适合哪种门？`,
  en: name => `What is the installed price of the ${name}, and which door is it for?`,
  ms: name => `Berapakah harga ${name} termasuk pemasangan, dan untuk pintu jenis apa?`,
};

// Prices and counts in the approved copy come from each category's catalogue results.
const categoryDefinitions = [
  {
    slug: "type/entrance-door",
    matches: model => model.group === "entrance",
    zh: {
      title: "入户门电子锁｜含安装 {min} 起｜吉隆坡 雪兰莪",
      h1: "入户门电子锁",
      answer: "ANZHE 入户门电子锁共 {count} 款，含安装 {min} 至 {max}。按开锁方式分为指纹、人脸、掌静脉三类，全系列在吉隆坡与雪兰莪上门安装，装前先核对门厚与锁体。",
      points: [
        ["先量门厚与锁体位置", "从门边量门厚，并拍下原有锁体和门框上的锁扣。门外有铁闸时，也量一下两扇门之间的间距，确认面板和把手可以正常活动。"],
        ["按家人习惯选开锁方式", "愿意伸手按感应区可以比较指纹款，经常提着东西进门可以比较人脸款。家人常用门卡或密码时，先看型号页列出的开锁方式。"],
        ["比较把手与上锁方式", "入户门型号有把手式与推拉式。确认开门方向、关门后的上锁方式，以及从室内能否按自己的习惯开门。"],
      ],
    },
    en: {
      title: "Entrance Door Digital Locks from {min} Installed｜KL & Selangor",
      h1: "Entrance Door Digital Locks",
      answer: "ANZHE carries {count} entrance door digital locks from {min} to {max} including installation, split by fingerprint, face recognition and palm vein access. Supplied and installed across Kuala Lumpur and Selangor after door thickness and lock body are checked.",
      points: [
        ["Measure the door and check the lock body", "Measure the door at its edge and photograph the existing lock body and strike plate. If there is a grille, measure the space between the doors so the panel and handle have room to move."],
        ["Choose entry methods for the household", "Compare fingerprint models if users are comfortable touching a reader, or face recognition if they often arrive with their hands full. Check the model specifications for cards or PINs that other household members use."],
        ["Compare handle and locking styles", "Look at lever and push-pull designs. Check the door swing, how the door locks after closing and how you would normally open it from inside."],
      ],
    },
    ms: {
      title: "Kunci Digital Pintu Utama dari {min} Termasuk Pemasangan",
      h1: "Kunci Digital Pintu Utama",
      answer: "ANZHE menawarkan {count} model kunci digital pintu utama dari {min} hingga {max} termasuk pemasangan, dengan pilihan cap jari, pengecaman wajah dan vena tapak tangan. Pemasangan di Kuala Lumpur dan Selangor dibuat selepas ketebalan pintu dan badan kunci diperiksa.",
      points: [
        ["Ukur pintu dan periksa badan kunci", "Ukur ketebalan di tepi pintu dan ambil gambar badan kunci serta plat pada bingkai. Jika ada jeriji, ukur jarak antara kedua-dua pintu supaya panel dan pemegang boleh bergerak."],
        ["Pilih kaedah buka kunci untuk seisi rumah", "Bandingkan model cap jari jika pengguna selesa menyentuh pengimbas, atau pengecaman wajah jika mereka kerap membawa barang. Periksa pilihan kad atau PIN dalam spesifikasi setiap model."],
        ["Bandingkan pemegang dan cara mengunci", "Lihat model tuil dan tolak-tarik. Semak arah bukaan pintu, cara ia dikunci selepas ditutup dan cara membukanya dari dalam."],
      ],
    },
  },
  {
    slug: "type/interior-door",
    matches: model => model.group === "room",
    zh: {
      title: "室内门电子锁｜含安装 {min} 起",
      h1: "室内门电子锁",
      answer: "室内门电子锁共 {count} 款，含安装 {min} 至 {max}。主要解决房内反锁与分租单位的进出管理，适合卧室、书房与出租房间。",
      points: [
        ["确认室内反锁的操作", "卧室或书房要从室内上锁时，先确认反锁怎么开启，以及哪些开锁方式在反锁后仍可使用。"],
        ["安排出租房间的权限", "房间换租客时，需要知道怎样注销旧密码、门卡或指纹，再为新住户设置权限。先看具体型号支持哪些方式。"],
        ["核对原有把手孔与门边", "拍下现有把手和门边锁舌，并量门厚。让安装人员确认原有开孔能否复用，以及新面板能否盖住留下的孔位。"],
      ],
    },
    en: {
      title: "Interior Door Digital Locks from {min} Installed",
      h1: "Interior Door Digital Locks",
      answer: "{wordCount} interior door models from {min} to {max} including installation, built around in-room privacy and sublet access control for bedrooms, studies and rental rooms.",
      points: [
        ["Check how inside privacy works", "For a bedroom or study, check how the privacy setting is engaged from the room and which access methods work while it is active."],
        ["Plan access when tenants change", "Check how to remove an old PIN, card or fingerprint and register a new occupant. Compare the methods shown on each model page."],
        ["Check the existing handle holes and door edge", "Photograph the handle and latch and measure the thickness. Ask the installer whether the holes can be reused and whether the new panel will cover them."],
      ],
    },
    ms: {
      title: "Kunci Digital Pintu Dalaman dari {min} Termasuk Pemasangan",
      h1: "Kunci Digital Pintu Dalaman",
      answer: "Terdapat {count} model kunci digital pintu dalaman dari {min} hingga {max} termasuk pemasangan. Pilihan ini membantu mengurus privasi dari dalam dan akses bilik sewa, bilik tidur atau bilik kerja.",
      points: [
        ["Semak cara menggunakan mod privasi", "Untuk bilik tidur atau bilik kerja, semak cara mengaktifkan mod privasi dari dalam dan kaedah akses yang masih berfungsi apabila mod itu aktif."],
        ["Urus akses apabila penyewa bertukar", "Semak cara memadam PIN, kad atau cap jari lama dan mendaftarkan penghuni baharu. Bandingkan pilihan pada halaman setiap model."],
        ["Periksa lubang pemegang dan tepi pintu", "Ambil gambar pemegang dan selak, kemudian ukur ketebalan pintu. Tanya pemasang sama ada lubang sedia ada boleh digunakan semula dan ditutup oleh panel baharu."],
      ],
    },
  },
  {
    slug: "type/aluminium-door",
    matches: model => model.group === "slim",
    zh: {
      title: "窄框铝门电子锁｜38.6mm 窄面板｜含安装 {min}",
      h1: "窄框铝门电子锁",
      answer: "窄框铝门目前 {count} 款，面板宽 38.6 毫米，含安装 {min}。铝门框边比木门窄，常规面板装不下，选购前必须量门框可用宽度。",
      points: [
        ["量锁具所在的平面宽度", "在现有把手周围量铝型材的可用平面宽度，留意压条或玻璃边占用的空间。给安装人员一张带尺子的照片。"],
        ["确认锁体能放进铝型材", "面板宽度和锁体需要分别检查。拍清楚门边和门框上的锁扣，让安装人员核对锁体空间和锁舌位置。"],
        ["确认开门后有没有干涉", "正面和侧面各拍一张，把拉手、玻璃压条和附近的铁闸拍进去。现场核对把手转动和开门时的空间。"],
      ],
    },
    en: {
      title: "Narrow Frame Aluminium Door Lock｜38.6mm Panel｜{min}",
      h1: "Narrow Frame Aluminium Door Locks",
      answer: "{wordCount} narrow-frame model with a 38.6 mm panel at {min} including installation. Aluminium stiles are narrower than timber, so the available frame width is measured before anything is ordered.",
      points: [
        ["Measure the flat area around the lock", "Measure the usable flat width of the aluminium stile around the existing handle, allowing for trim and glazing beads. Send the installer a photo with a ruler in place."],
        ["Check the space for the lock body", "Check the panel width and the lock body separately. Photograph the door edge and strike so the installer can check the space inside the stile and the latch position."],
        ["Check clearance as the door opens", "Take front and side photos that show the handle, glazing bead and any nearby grille. Confirm there is room for the handle and the door to move."],
      ],
    },
    ms: {
      title: "Kunci Pintu Aluminium Bingkai Sempit｜Panel 38.6mm",
      h1: "Kunci Pintu Aluminium Bingkai Sempit",
      answer: "Terdapat {count} model untuk bingkai sempit, dengan panel 38.6 mm pada harga {min} termasuk pemasangan. Ukur lebar permukaan profil aluminium yang tersedia sebelum membuat pesanan.",
      points: [
        ["Ukur permukaan rata di sekeliling kunci", "Ukur lebar permukaan rata profil aluminium di sekeliling pemegang sedia ada. Ambil kira jalur tepi kaca dan hantar gambar yang menunjukkan ukuran kepada pemasang."],
        ["Semak ruang untuk badan kunci", "Semak lebar panel dan ruang badan kunci secara berasingan. Ambil gambar tepi pintu dan plat selak supaya pemasang boleh memeriksa ruang serta kedudukan selak."],
        ["Periksa ruang ketika pintu dibuka", "Ambil gambar dari depan dan sisi yang menunjukkan pemegang, jalur tepi kaca dan jeriji berdekatan. Pastikan pemegang dan pintu boleh bergerak."],
      ],
    },
  },
  {
    slug: "feature/face-recognition",
    matches: model => model.access.zh.includes("人脸"),
    zh: {
      title: "人脸识别电子锁｜3D 结构光｜吉隆坡 雪兰莪",
      h1: "人脸识别电子锁",
      answer: "支持人脸识别的型号含安装 {min} 起。3D 结构光判断面部深度，照片与屏幕翻拍难以通过，需要门口有足够站立距离与一定光线。",
      points: [
        ["确认平时站在哪里", "按家人日常进门的站位来看门口空间。铁闸、对面墙或狭窄走廊可能让人只能站得很近，安装前一起确认感应位置。"],
        ["比较门口白天和晚上的光线", "从平时开门的位置看门外照明。背光明显或夜间光线弱时，可以把门口照片和开门时段告诉安装人员。"],
        ["留一个常用的备用开锁方式", "为不方便使用人脸识别的成员选好备用方式。查看每个型号的规格，确认它是否支持自己习惯的指纹、密码或门卡。"],
      ],
    },
    en: {
      title: "Face Recognition Door Locks｜3D Structured Light｜KL & Selangor",
      h1: "Face Recognition Door Locks",
      answer: "Face recognition models start at {min} including installation. Structured-light 3D judges facial depth, so photos and screen replays are hard to pass, provided the doorway has standing distance and some light.",
      points: [
        ["Check where people will stand", "Consider where household members normally stand when they unlock the door. Show the installer any grille, opposite wall or narrow corridor that limits the standing distance."],
        ["Check the doorway by day and by night", "Look at the lighting from the usual standing point. Share a photo and tell the installer when the entrance is strongly backlit or dim."],
        ["Choose a backup entry method", "Pick a method for household members who may have difficulty using face recognition. The individual specifications show which models support fingerprints, PINs or cards."],
      ],
    },
    ms: {
      title: "Kunci Digital Pengecaman Wajah｜Cahaya Berstruktur 3D",
      h1: "Kunci Digital Pengecaman Wajah",
      answer: "Model pengecaman wajah bermula dari {min} termasuk pemasangan. Cahaya berstruktur 3D mengesan kedalaman wajah supaya gambar atau paparan skrin sukar melepasi semakan. Ruang berdiri dan cahaya di pintu masuk perlu mencukupi.",
      points: [
        ["Semak kedudukan pengguna ketika membuka pintu", "Perhatikan tempat ahli rumah biasa berdiri. Tunjukkan kepada pemasang jika jeriji, dinding bertentangan atau koridor sempit menghadkan jarak berdiri."],
        ["Periksa pencahayaan siang dan malam", "Lihat pencahayaan dari kedudukan biasa pengguna. Kongsi gambar dan beritahu pemasang jika kawasan itu malap atau menerima cahaya kuat dari belakang."],
        ["Pilih cara buka kunci sandaran", "Pilih kaedah sandaran untuk pengguna yang sukar menggunakan pengecaman wajah. Semak model yang menawarkan cap jari, PIN atau kad."],
      ],
    },
  },
  {
    slug: "feature/palm-vein",
    matches: model => model.access.zh.includes("掌静脉"),
    zh: {
      title: "掌静脉电子锁｜手湿也能开｜吉隆坡 雪兰莪",
      h1: "掌静脉电子锁",
      answer: "支持掌静脉的型号含安装 {min} 起。读取皮下血管分布，不受手指干湿、脱皮与磨损影响，手湿或指纹磨损明显时比指纹稳。",
      points: [
        ["看手掌能否自然伸到感应区", "按家人平日的开门姿势试一下。把手旁有铁闸或门框突出时，先确认手掌可以放到感应区前。"],
        ["按家人的实际情况试用", "经常做家务、接触水或指纹磨损明显的人，可以在展厅比较掌静脉和指纹的操作手势，看看哪种更顺手。"],
        ["区分识别方式与其他配置", "掌静脉是开锁方式。室内屏、门铃与远程功能按型号分别确认，也为访客预留合适的密码或门卡方式。"],
      ],
    },
    en: {
      title: "Palm Vein Door Locks｜Works With Wet Hands｜KL & Selangor",
      h1: "Palm Vein Door Locks",
      answer: "Palm vein models start at {min} including installation. Reading the vein pattern under the skin means wet hands, peeling skin and worn fingertips do not interfere.",
      points: [
        ["Check that the reader is easy to reach", "Use the position in which you normally open the door. If a grille or raised frame sits beside the handle, check whether a palm can comfortably reach the reader area."],
        ["Try both gestures at the showroom", "People who often work with water or have worn fingerprints can compare the hand positions for palm vein and fingerprint entry at the showroom."],
        ["Compare the other features separately", "Check the model page for an indoor screen, doorbell or remote features. Check whether its PIN or card options suit the way you give visitors access."],
      ],
    },
    ms: {
      title: "Kunci Digital Vena Tapak Tangan｜Tangan Basah Pun Boleh",
      h1: "Kunci Digital Vena Tapak Tangan",
      answer: "Model vena tapak tangan bermula dari {min} termasuk pemasangan. Pengimbas membaca corak salur darah di bawah kulit, jadi tangan basah, kulit mengelupas dan hujung jari haus tidak mengganggu bacaan.",
      points: [
        ["Pastikan pengimbas mudah dicapai", "Berdiri seperti biasa ketika membuka pintu. Jika ada jeriji atau bingkai yang timbul di sisi pemegang, pastikan tapak tangan boleh dihalakan ke kawasan pengimbas."],
        ["Cuba kedua-dua cara di bilik pameran", "Jika tangan kerap terkena air atau cap jari sudah haus, bandingkan gerakan tangan bagi akses vena tapak tangan dan cap jari."],
        ["Bandingkan ciri lain pada setiap model", "Semak spesifikasi skrin dalaman, loceng dan fungsi jarak jauh secara berasingan. Pilih kaedah PIN atau kad yang sesuai untuk tetamu."],
      ],
    },
  },
  {
    slug: "feature/video-intercom",
    matches: model => model.screen !== null && /对讲|门铃/.test(model.copy.zh),
    zh: {
      title: "可视对讲电子锁｜门铃与室内屏｜吉隆坡 雪兰莪",
      h1: "可视对讲电子锁",
      answer: "带门铃与室内屏的型号含安装 {min} 起。访客按铃可在室内屏查看，部分型号支持远程对讲与远程开锁，依赖门口稳定 Wi-Fi。",
      points: [
        ["先选室内查看还是远程接听", "只需在屋内看访客时，先看室内屏的位置和大小。需要外出时接听，则逐款核对远程对讲和远程开锁功能。"],
        ["在关门状态测试 Wi-Fi", "站在锁具安装点附近，用手机检查家中 Wi-Fi。关上大门与外侧铁闸再测一次，确认日常关门时的连接情况。"],
        ["让镜头看得到访客站位", "在实际按铃位置拍一张照片。安装前确认铁闸横杆、门框或狭窄走廊是否会挡住镜头视线。"],
      ],
    },
    en: {
      title: "Video Intercom Door Locks｜Doorbell and Indoor Screen",
      h1: "Video Intercom Door Locks",
      answer: "Models with a doorbell and indoor screen start at {min} including installation. Visitors can be seen on the indoor display, and some models add remote talk and remote unlock over stable Wi-Fi.",
      points: [
        ["Decide where you need to answer the door", "Compare the indoor screen position and size for viewing from home. If you also need to answer while away, check remote talk and remote unlock on the individual model."],
        ["Test Wi-Fi with the doors shut", "Check your home Wi-Fi on a phone beside the lock position. Repeat with the door and any outer grille shut to see how the connection behaves during normal use."],
        ["Check the camera view at the usual standing point", "Take a photo from where a visitor presses the bell. Ask the installer whether grille bars, the frame or a narrow corridor will block the view."],
      ],
    },
    ms: {
      title: "Kunci Digital Interkom Video｜Loceng dan Skrin Dalaman",
      h1: "Kunci Digital Interkom Video",
      answer: "Model dengan loceng dan skrin dalaman bermula dari {min} termasuk pemasangan. Pelawat dapat dilihat pada skrin dalaman. Sesetengah model menawarkan interkom dan buka kunci jarak jauh melalui Wi-Fi yang stabil.",
      points: [
        ["Tentukan dari mana anda mahu menjawab loceng", "Bandingkan kedudukan dan saiz skrin untuk melihat pelawat dari dalam. Jika perlu menjawab ketika di luar, semak fungsi interkom dan buka kunci jarak jauh bagi setiap model."],
        ["Uji Wi-Fi ketika pintu ditutup", "Periksa Wi-Fi rumah dengan telefon di tempat kunci akan dipasang. Ulangi ujian apabila pintu dan jeriji luar ditutup seperti biasa."],
        ["Semak pandangan kamera di tempat pelawat berdiri", "Ambil gambar dari tempat pelawat menekan loceng. Tanya pemasang sama ada palang jeriji, bingkai atau laluan sempit menghalang pandangan kamera."],
      ],
    },
  },
];

const categoryUi = {
  zh: {
    models: "本品类型号",
    selection: "选购要点",
    related: "相关电子锁品类",
    membership: "所属品类",
    ask: "WhatsApp 咨询选锁",
    message: name => "你好，我想咨询 ANZHE " + name + "和安装。",
    fitQuestion: "安装前需要确认什么？",
    priceQuestion: "这个品类的含安装价是多少？",
    priceAnswer: (count, min, max) => "本页共 " + count + " 款，含安装价" + (min === max ? "为 " + min : "从 " + min + " 到 " + max) + "。",
  },
  en: {
    models: "Models in this category",
    selection: "What to check",
    related: "Related lock categories",
    membership: "Lock categories",
    ask: "Ask about lock selection on WhatsApp",
    message: name => "Hi, I'd like help choosing and installing an ANZHE lock from the " + name + " range.",
    fitQuestion: "What should I check before installation?",
    priceQuestion: "How much do these locks cost including installation?",
    priceAnswer: (count, min, max) => (count === 1 ? "This model costs " + min : "The " + count + " models cost from " + min + " to " + max) + " including installation.",
  },
  ms: {
    models: "Model dalam kategori ini",
    selection: "Perkara yang perlu disemak",
    related: "Kategori kunci berkaitan",
    membership: "Kategori kunci",
    ask: "Tanya tentang pilihan kunci di WhatsApp",
    message: name => "Helo, saya ingin bertanya tentang pilihan " + name + " ANZHE dan pemasangan.",
    fitQuestion: "Apakah yang perlu diperiksa sebelum pemasangan?",
    priceQuestion: "Berapakah harga kunci ini termasuk pemasangan?",
    priceAnswer: (count, min, max) => "Terdapat " + count + " model " + (min === max ? "pada harga " + min : "dari " + min + " hingga " + max) + " termasuk pemasangan.",
  },
};

function categoryCopy(category, lang, words) {
  const { h1, title, answer, points } = category[lang];
  const sorted = category.models.toSorted((left, right) => left.price - right.price);
  const count = sorted.length;
  const min = sorted[0].prices.display;
  const max = sorted.at(-1).prices.display;
  const wordCount = { 1: "One", 2: "Two" }[count] ?? String(count);
  const fill = text => text.replaceAll("{min}", min).replaceAll("{max}", max)
    .replaceAll("{count}", String(count)).replaceAll("{wordCount}", wordCount);
  const ui = categoryUi[lang];
  return {
    h1, title: fill(title), answer: fill(answer), points,
    faqs: [
      { q: ui.priceQuestion, a: ui.priceAnswer(count, min, max) },
      { q: ui.fitQuestion, a: points[0][1] },
      { q: words.costTitle, a: words.costCopy },
    ],
  };
}

function pageCopy(model, lang, words, overrides) {
  const { name, group } = model;
  const price = model.prices.display;
  const access = model.access[lang];
  const text = copyTemplates[lang].templates({ name, group, price, access, words });
  const override = overrides[model.id]?.[lang] ?? {};
  const fill = value => value.replaceAll("{model}", name).replaceAll("{price}", price.slice(2)).replaceAll("{access}", access);
  const copyFields = ["title", "description", "h1", "answer", "doorFit"];
  for (const key of copyFields) {
    if (override[key]?.trim()) text[key] = fill(override[key]);
  }
  if (override.faqs != null) {
    text.faqs = override.faqs.map(({ q, a }) => ({ q: fill(q), a: fill(a) }));
  }
  if (text.faqs.length !== 3 || text.faqs.some(({ q, a }) => !q.trim() || !a.trim())) {
    throw new Error(`${model.id}/${lang}: expected three complete FAQs`);
  }
  if (!text.h1.includes(name) || !text.h1.includes(price)) {
    throw new Error(`${model.id}/${lang}: the H1 must contain the model name and the current catalogue price`);
  }
  const answerLength = lang === "zh"
    ? Array.from(text.answer.replace(/\s/g, "")).length
    : text.answer.trim().split(/\s+/).length;
  if (!override.answer?.trim() && (answerLength < 40 || answerLength > 60)) {
    throw new Error(`${model.id}/${lang}: the fallback answer must be 40–60 ${lang === "zh" ? "characters" : "words"}`);
  }
  // Published FAQs can compare other models or mention price differences explicitly.
  for (const value of copyFields.map(key => text[key])) {
    if (!value.trim()) throw new Error(`${model.id}/${lang}: empty page copy`);
    for (const [, amount] of value.matchAll(/\bRM\s*(\d[\d,]*(?:\.\d+)?)/g)) {
      if (amount.replaceAll(",", "") !== model.prices.offer) {
        throw new Error(`${model.id}/${lang}: a price in the page copy disagrees with the catalogue`);
      }
    }
  }
  return text;
}

const coreFields = ["dimensions", "type", "material", "access", "power", "emergency", "temperature"];
const comparisonFields = ["dimensions", "type", "material", "access", "power", "emergency", "temperature", "screen",
  "connection", "appPlatform", "cardType", "camera", "lens", "video", "lowBattery", "privacy", "peephole", "color", "cylinder",
  "weight", "application"];

function specRows(model, lang, labels) {
  const ui = copyTemplates[lang];
  const feature = model.feature;
  const specs = feature?.specs ?? {};
  const known = {
    ...Object.fromEntries(Object.entries(specs).map(([key, texts]) => [key, texts[lang]])),
    access: model.access[lang],
    material: feature?.material?.[lang] || specs.material?.[lang] || specs.finish?.[lang],
  };
  const fields = [...coreFields, ...Object.keys(specs).filter(key => !coreFields.includes(key) && key !== "finish")];
  return fields.map(key => ({
    key,
    label: { type: ui.mechanism, material: ui.materials }[key] || labels[key][lang],
    value: known[key] || ui.pending,
  }));
}

function renderComparison(model, lang, catalog, words, labels) {
  const ui = copyTemplates[lang];
  const groupOrder = [model.group, ...groups.filter(group => group !== model.group)];
  return groupOrder.map(group => {
    const peers = catalog.filter(item => item.group === group);
    const entries = peers.map(peer => {
      const rows = specRows(peer, lang, labels);
      const summary = comparisonFields.map(key => rows.find(row => row.key === key)).filter(Boolean);
      const factList = items => items.map(({ label, value }) => `${escape(label)} · ${escape(value)}`).join(lang === "zh" ? "；" : " · ");
      const current = peer.id === model.id ? ' aria-current="page"' : "";
      return `<li>
          <article>
            <h4><a href="${pagePath(lang, peer.id)}"${current}>${escape(peer.name)}</a> · ${escape(peer.prices.display)} · ${escape(words.included)}</h4>
            <p>${escape(peer.copy[lang])}</p>
            <p>${factList(summary.slice(0, coreFields.length))}</p>
            <p>${factList(summary.slice(coreFields.length))}</p>
          </article>
        </li>`;
    }).join("\n        ");
    const singleModelNote = group === model.group && peers.length === 1
      ? `      <p>${escape(ui.singleModel)}</p>\n` : "";
    return `<section aria-label="${escape(words[group])}">
      <h3>${escape(words[group])}</h3>
${singleModelNote}      <ul>
        ${entries}
      </ul>
    </section>`;
  }).join("\n    ");
}

const logoSizes = "(max-width: 700px) 128px, 148px";
const guideSizes = "(max-width: 700px) calc(45vw - 8px), (max-width: 1536px) 24vw, 360px";
const categoryCardSizes = "(max-width: 700px) calc(45vw - 22px), (max-width: 1536px) calc(45vw - 16px), 670px";

function panelSizes(image) {
  const ratio = image.width / image.height;
  const scaled = (value, unit = "px") => (value * ratio).toFixed(2) + unit;
  return [
    `(orientation: landscape) and (max-height: 500px) and (min-width: 600px) ${scaled(140)}`,
    `(max-width: 700px) min(76vw, clamp(${scaled(152)}, ${scaled(40, "vw")}, ${scaled(205)}))`,
    `min(42vw, clamp(${scaled(245)}, ${scaled(22.5, "vw")}, ${scaled(356)}))`,
  ].join(", ");
}

function img(image, alt, { sizes, loading = "lazy", priority = "low", smaller = image }) {
  const variants = smaller.width < image.width ? [smaller, image] : [smaller];
  const srcset = variants.map(({ path, width }) => `${path} ${width}w`).join(", ");
  return `<img src="${escape(image.path)}" srcset="${escape(srcset)}" sizes="${escape(sizes)}" width="${image.width}" height="${image.height}" alt="${escape(alt)}" loading="${loading}" decoding="async" fetchpriority="${priority}">`;
}

function pageLanguageLinks(slug, lang) {
  return languages.map(code => {
    const { alternate, label, short } = locales[code];
    return `<a class="studio-button light-button" href="${pagePath(code, slug)}" lang="${alternate}" aria-label="${label}"${code === lang ? ' aria-current="page"' : ""}>${code === "zh" ? short : label}</a>`;
  });
}

function categoryLink(category, lang) {
  return `<a class="studio-link" href="${pagePath(lang, category.slug)}"><span>${escape(category[lang].h1)}</span></a>`;
}

function breadcrumbSchema(lang, homeLabel, name, url) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: homeLabel, item: absolute(pagePath(lang)) },
      { "@type": "ListItem", position: 2, name, item: url },
    ],
  };
}

function faqSchema(lang, faqs) {
  return {
    "@type": "FAQPage",
    inLanguage: locales[lang].alternate,
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

function jsonLd(nodes) {
  // This is a JSON data block, not executable JavaScript.
  return JSON.stringify({ "@context": "https://schema.org", "@graph": nodes }, null, 2).replace(/</g, "\\u003c");
}

function renderSchema(model, copy, lang, homeLabel) {
  const url = absolute(pagePath(lang, model.id));
  return jsonLd([
    {
      "@type": "Product",
      "@id": url + "#product",
      name: "ANZHE " + model.name,
      model: model.name,
      description: copy.description,
      image: absolute(model.imageInfo.path),
      url,
      brand: { "@type": "Brand", name: "ANZHE" },
      offers: { "@type": "Offer", url, price: model.prices.offer, priceCurrency: "MYR" },
    },
    breadcrumbSchema(lang, homeLabel, model.name, url),
    faqSchema(lang, copy.faqs),
  ]);
}

const whatsappLink = message => "https://wa.me/601128853888?text=" + encodeURIComponent(message);

function renderPage(model, lang, sources, catalog, shared, overrides, categories) {
  const words = sources.showroomWords[lang];
  const labels = sources.lockSpecLabels;
  const ui = copyTemplates[lang];
  const copy = pageCopy(model, lang, words, overrides);
  const locale = locales[lang];
  const url = absolute(pagePath(lang, model.id));
  const home = pagePath(lang);
  const imageAlt = `ANZHE ${model.name} · ${ui.photo}`;
  const contact = whatsappLink(ui.message({ name: model.name, price: model.prices.display }));
  const altLinks = alternates(model.id).map(([tag, href]) => `<link rel="alternate" hreflang="${tag}" href="${href}">`);
  const langLinks = pageLanguageLinks(model.id, lang);
  const membership = categories.filter(category => category.models.includes(model)).map(category => categoryLink(category, lang));
  const rows = specRows(model, lang, labels).map(({ key, label, value }) =>
    `<tr data-spec="${key}"><th scope="row" class="dir-spec-model">${escape(label)}</th><td>${escape(value)}</td></tr>`);
  const faq = copy.faqs.map(({ q, a }) => `<article><h3>${escape(q)}</h3><p>${escape(a)}</p></article>`);
  const guide = [doorChecks[lang][model.group], ...fittingGuides[lang]].map(([heading, text]) =>
    `<article><h3>${escape(heading)}</h3><p>${escape(text)}</p></article>`);
  // Malay fallback copy remains crawlable for review, with indexing withheld until native review.
  const robots = lang === "ms" ? '\n  <meta name="robots" content="noindex">' : "";
  return `<!doctype html>
<!-- Generated by scripts/generate-anzhe-lock-pages.mjs. -->
<html lang="${locale.tag}" data-anzhe-showroom data-lock-detail>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#f7f6eb">
  <link rel="icon" href="data:,">
  <title>${escape(copy.title)}</title>
  <meta name="description" content="${escape(copy.description)}">${robots}
  <link rel="canonical" href="${url}">
  ${altLinks.join("\n  ")}
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="FLASH CAST">
  <meta property="og:locale" content="${locale.og}">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${escape(copy.title)}">
  <meta property="og:description" content="${escape(copy.description)}">
  <meta property="og:image" content="${absolute(model.imageInfo.path)}">
  <meta property="og:image:alt" content="${escape(imageAlt)}">
  ${shared.styles.map(href => `<link rel="stylesheet" href="${href}">`).join("\n  ")}
  <script defer src="${shared.updates}"></script>
  <script type="application/ld+json">
${renderSchema(model, copy, lang, words.title)}
  </script>
</head>
<body id="top">
  <a class="skip" href="#main-content">${escape(words.skip)}</a>
  <header class="mast">
    <div class="wrap mast-inner">
      <div class="mast-brand-group">
        <a href="${home}" class="brand" aria-label="${escape(ui.home)}">${img(shared.logo, "ANZHE", { sizes: logoSizes, loading: "eager", priority: "auto" })}</a>
      </div>
      <nav class="site-nav" aria-label="${escape(words.navigation)}">
        <a href="${home}#collection">${escape(words.catalog)}</a>
        <a href="#specifications">${escape(ui.specs)}</a>
        <a href="#comparison">${escape(ui.compare)}</a>
        <a href="#installation">${escape(words.install)}</a>
      </nav>
      <nav class="lang-switch" aria-label="${escape(words.language)}">
        ${langLinks.join("\n        ")}
      </nav>
    </div>
  </header>
  <main id="main-content" tabindex="-1">
    <section class="compare-section" aria-labelledby="model-title">
      <div class="wrap hero-inner">
        <div class="hero-copy">
          <p class="kicker">${escape(words[model.group])}</p>
          <h1 id="model-title" class="hero-headline">${escape(copy.h1)}</h1>
          <p class="hero-summary">${escape(model.copy[lang])}</p>
          <div class="hero-actions">
            <a href="${escape(contact)}" class="studio-button" target="_blank" rel="noopener noreferrer">${escape(ui.ask)}</a>
            <a href="#specifications" class="studio-link"><span>${escape(ui.specs)}</span></a>
          </div>
        </div>
        <figure class="hero-board">
          <div class="panel-view">${img(model.imageInfo, imageAlt, { sizes: panelSizes(model.imageInfo), loading: "eager", priority: "high", smaller: model.cardImage })}</div>
          <figcaption><strong>ANZHE / ${escape(model.name)}</strong><span>${escape(ui.photo)}</span></figcaption>
        </figure>
      </div>
    </section>
    <section class="wrap collection" aria-labelledby="answer-title">
      <h2 id="answer-title">${escape(answerHeadings[lang](model.name))}</h2>
      <p>${escape(copy.answer)}</p>
      <p><strong>${escape(labels.access[lang])}</strong> · ${escape(model.access[lang])}</p>
    </section>
    <section class="wrap collection" id="specifications" aria-labelledby="specifications-title">
      <h2 id="specifications-title">${escape(ui.specs)}</h2>
      <div class="ct-office">
        <table aria-labelledby="specifications-title">
          <tbody>
            ${rows.join("\n            ")}
          </tbody>
        </table>
      </div>
    </section>
    <section class="fit-section" id="installation" aria-labelledby="installation-title">
      <div class="wrap fit-layout">
        <div class="fit-copy">
          <h2 id="installation-title">${escape(ui.fit)}</h2>
          <p>${escape(copy.doorFit)}</p>
          <p>${escape(words.installCopy)}</p>
          <p class="fit-included">${escape(words.serviceArea)} · ${escape(words.location)}</p>
        </div>
        <div class="guide-pair">
          <figure><div class="model-guide-photo">${img(shared.face, words.frontGuide, { sizes: guideSizes })}</div><figcaption><div><strong>${escape(words.fullDoor)}</strong><p>${escape(words.frontGuide)}</p></div></figcaption></figure>
          <figure><div class="model-guide-photo">${img(shared.edge, words.edgeGuide, { sizes: guideSizes })}</div><figcaption><div><strong>${escape(words.doorEdge)}</strong><p>${escape(words.edgeGuide)}</p></div></figcaption></figure>
        </div>
      </div>
    </section>
    <section class="wrap collection" id="faq" aria-labelledby="faq-title">
      <h2 id="faq-title">${escape(ui.faq)}</h2>
      ${faq.join("\n      ")}
    </section>
    <section class="wrap collection" aria-labelledby="guide-title">
      <h2 id="guide-title">${escape(ui.guide)}</h2>
      ${guide.join("\n      ")}
    </section>
    <section class="wrap collection" id="comparison" aria-labelledby="comparison-title">
      <h2 id="comparison-title">${escape(ui.compare)}</h2>
      <p>${escape(ui.comparisonIntro)}</p>
      ${renderComparison(model, lang, catalog, words, labels)}
    </section>
    <section class="wrap collection" aria-labelledby="model-categories-title">
      <h2 id="model-categories-title">${escape(categoryUi[lang].membership)}</h2>
      <nav class="section-actions" data-model-categories aria-labelledby="model-categories-title">
        ${membership.join("\n        ")}
      </nav>
    </section>
  </main>
  <footer class="site-footer">
    <div class="wrap">
      <a href="${home}">${escape(ui.home)}</a>
      <a href="#top">${escape(words.back)}</a>
    </div>
  </footer>
</body>
</html>
`;
}

function renderCategoryPage(category, lang, sources, shared, categories, categoryExtra) {
  const { slug, models } = category;
  const words = sources.showroomWords[lang];
  const ui = categoryUi[lang];
  const homeLabel = copyTemplates[lang].home;
  const copy = categoryCopy(category, lang, words);
  const locale = locales[lang];
  const home = pagePath(lang);
  const url = absolute(pagePath(lang, slug));
  const image = absolute(models[0].imageInfo.path);
  const altLinks = alternates(slug).map(([tag, href]) => `<link rel="alternate" hreflang="${tag}" href="${href}">`);
  const robots = lang === "ms" ? '\n  <meta name="robots" content="noindex">' : "";
  const cards = models.map((model, index) => {
    const highlight = model.feature?.highlights[0]?.[lang] ?? model.copy[lang];
    const label = `${model.name} ${highlight} ${model.prices.display} ${words.included}`;
    return `<a href="${pagePath(lang, model.id)}" data-category-model="${model.id}" aria-label="${escape(label)}">
          <figure>
            <div class="category-card-photo">${img(model.cardImage, `${model.name} · ${copyTemplates[lang].photo}`, {
              sizes: categoryCardSizes, loading: index < 2 ? "eager" : "lazy", priority: index < 2 ? "high" : "low",
            })}</div>
            <figcaption>
              <strong>${escape(model.name)}</strong>
              <span>${escape(highlight)}</span>
              <b>${escape(model.prices.display)} <small>${escape(words.included)}</small></b>
            </figcaption>
          </figure>
        </a>`;
  });
  const points = copy.points.map(([heading, detail]) => {
    const extra = lang === "zh" ? getCategoryPointExtra(categoryExtra, slug, heading) : "";
    return `<h2>${escape(heading)}</h2>\n      <p>${escape(detail)}</p>${extra ? "\n      " + extra : ""}`;
  });
  const faqs = copy.faqs.map(({ q, a }) => `<article><h3>${escape(q)}</h3><p>${escape(a)}</p></article>`);
  const related = categories.filter(entry => entry !== category).map(entry => categoryLink(entry, lang));
  const schema = jsonLd([
    {
      "@type": "CollectionPage",
      "@id": url,
      name: copy.h1,
      description: copy.answer,
      url,
      inLanguage: locale.alternate,
      mainEntity: { "@id": url + "#models" },
    },
    {
      "@type": "ItemList",
      "@id": url + "#models",
      numberOfItems: models.length,
      itemListElement: models.map((model, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: model.name,
        url: absolute(pagePath(lang, model.id)),
      })),
    },
    breadcrumbSchema(lang, homeLabel, copy.h1, url),
    faqSchema(lang, copy.faqs),
  ]);
  return `<!doctype html>
<!-- Generated by scripts/generate-anzhe-lock-pages.mjs. -->
<html lang="${locale.tag}" data-anzhe-showroom data-lock-category>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#f7f6eb">
  <link rel="icon" href="data:,">
  <title>${escape(copy.title)}</title>
  <meta name="description" content="${escape(copy.answer)}">${robots}
  <link rel="canonical" href="${url}">
  ${altLinks.join("\n  ")}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="FLASH CAST">
  <meta property="og:locale" content="${locale.og}">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${escape(copy.title)}">
  <meta property="og:description" content="${escape(copy.answer)}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:alt" content="ANZHE ${escape(models[0].name)}">
  ${shared.categoryStyles.map(href => `<link rel="stylesheet" href="${href}">`).join("\n  ")}
  <script defer src="${shared.updates}"></script>
  <script type="application/ld+json">
${schema}
  </script>
</head>
<body id="top">
  <a class="skip" href="#main-content">${escape(words.skip)}</a>
  <header class="mast">
    <div class="wrap mast-inner">
      <div class="mast-brand-group">
        <a href="${home}" class="brand" aria-label="${escape(homeLabel)}">${img(shared.logo, "ANZHE", { sizes: logoSizes, loading: "eager", priority: "auto" })}</a>
      </div>
      <nav class="site-nav" aria-label="${escape(words.navigation)}">
        <a href="#models">${escape(ui.models)}</a>
        <a href="#selection">${escape(ui.selection)}</a>
        <a href="#faq">${escape(copyTemplates[lang].faq)}</a>
      </nav>
      <nav class="lang-switch" aria-label="${escape(words.language)}">
        ${pageLanguageLinks(slug, lang).join("\n        ")}
      </nav>
    </div>
  </header>
  <main id="main-content" tabindex="-1">
    <section class="compare-section" aria-labelledby="category-title">
      <div class="wrap collection">
        <h1 class="hero-headline" id="category-title">${escape(copy.h1)}</h1>
        <p data-category-answer>${escape(copy.answer)}</p>
        <div class="hero-actions">
          <a class="studio-button" href="${escape(whatsappLink(ui.message(copy.h1)))}" target="_blank" rel="noopener noreferrer">${escape(ui.ask)}</a>
        </div>
      </div>
    </section>
    <section class="wrap collection" id="models" aria-labelledby="category-models-title">
      <h2 id="category-models-title">${escape(ui.models)}</h2>
      <div class="compare-samples">
        ${cards.join("\n        ")}
      </div>
    </section>
    <div class="wrap collection" id="selection">
      ${points.join("\n      ")}
    </div>
    <section class="wrap collection" id="faq" aria-labelledby="faq-title">
      <h2 id="faq-title">${escape(copyTemplates[lang].faq)}</h2>
      ${faqs.join("\n      ")}
    </section>
    <section class="wrap collection" aria-labelledby="related-title">
      <h2 id="related-title">${escape(ui.related)}</h2>
      <nav class="section-actions" aria-labelledby="related-title">
        ${related.join("\n        ")}
      </nav>
    </section>
  </main>
  <footer class="site-footer">
    <div class="wrap">
      <a href="${home}">${escape(homeLabel)}</a>
      <a href="#top">${escape(words.back)}</a>
    </div>
  </footer>
</body>
</html>
`;
}

const indexedCategoryLanguages = ["zh", "en"];

function renderSitemap(catalog, categories) {
  const entriesFor = (slugs, includedLanguages) => slugs.flatMap(slug =>
    includedLanguages.map(lang => {
      const links = alternates(slug)
        .filter(([tag]) => tag === "x-default" || includedLanguages.some(code => locales[code].alternate === tag))
        .map(([tag, href]) => `<xhtml:link rel="alternate" hreflang="${tag}" href="${href}"/>`);
      return `  <url>
    <loc>${absolute(pagePath(lang, slug))}</loc>
    ${links.join("\n    ")}
  </url>`;
    }));
  const entries = [
    ...entriesFor([undefined, ...catalog.map(model => model.id)], languages),
    ...entriesFor(categories.map(category => category.slug), indexedCategoryLanguages),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>
`;
}

function visibleChars(html) {
  const { window } = new JSDOM(html);
  try {
    window.document.body.querySelectorAll("script,style,template,[hidden]").forEach(node => node.remove());
    return Array.from(window.document.body.textContent.trim().replace(/\s+/g, " ")).length;
  } finally {
    window.close();
  }
}

async function syncOutputs(outputs) {
  const stale = [];
  for (const { target, html } of outputs) {
    const current = await readFile(target, "utf8").catch(error => {
      if (error.code === "ENOENT") return "";
      throw error;
    });
    if (lf(current) === html) continue;
    if (args.check) {
      stale.push(target);
    } else {
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, html);
    }
  }
  if (stale.length) throw new Error("Regenerate outdated showroom files:\n" + stale.join("\n"));
}

const sources = await readShowroomSources();
const overrides = await readCopy();
const categoryExtra = await readCategoryBodyExtra();
const ids = sources.lockCatalog.map(model => model.id);
if (ids.length !== 17 || new Set(ids).size !== 17 || ids.some(id => !/^[a-z\d]+(?:-[a-z\d]+)*$/.test(id))) {
  throw new Error("Expected the 17 distinct, URL-safe slugs in the showroom catalogue");
}
const catalog = await Promise.all(sources.lockCatalog.map(async model => {
  if (!groups.includes(model.group)) throw new Error(`Unknown door group: ${model.group}`);
  for (const lang of languages) {
    if (!model.access[lang] || !model.copy[lang]) throw new Error(`Missing ${lang} catalogue copy for ${model.id}`);
  }
  return {
    ...model,
    prices: prices(model, sources.formatShowroomPrice),
    feature: sources.lockFeatures[model.id],
    imageInfo: await imageInfo(model.image),
    cardImage: await imageInfo(`assets/card-${model.id}.webp`),
  };
}));
const categories = categoryDefinitions.map(definition => {
  const models = catalog.filter(definition.matches);
  if (models.length === 0) throw new Error(`${definition.slug}: no models match the catalogue filter`);
  return { ...definition, models };
});
const categoryStyles = await Promise.all([
  versionedAsset("/public-section-spacing.css", join(root, "public/public-section-spacing.css")),
  versionedAsset("/studio.css", join(showroom, "studio.css")),
]);
const shared = {
  updates: await versionedAsset("/showroom-updates.js", join(showroom, "showroom-updates.js")),
  categoryStyles,
  styles: [...categoryStyles, ...await Promise.all(["directory.css", "contact.css"]
    .map(file => versionedAsset("/" + file, join(showroom, file))))],
  logo: await imageInfo("assets/anzhe-logo.webp"),
  face: await imageInfo("assets/guide-face.webp"),
  edge: await imageInfo("assets/guide-edge.webp"),
};
const pages = catalog.flatMap(model => languages.map(lang => {
  const path = pagePath(lang, model.id);
  const html = renderPage(model, lang, sources, catalog, shared, overrides, categories);
  return { path, target: join(showroom, "." + path, "index.html"), html, length: visibleChars(html) };
}));
const short = pages.filter(page => page.length < minimumVisibleChars);
if (short.length) throw new Error(`Expected ${minimumVisibleChars} visible characters per page:\n`
  + short.map(page => `${page.path} ${page.length}`).join("\n"));
const categoryPages = categories.flatMap(category => languages.map(lang => ({
  target: join(showroom, "." + pagePath(lang, category.slug), "index.html"),
  html: renderCategoryPage(category, lang, sources, shared, categories, categoryExtra),
})));
await syncOutputs([...pages, ...categoryPages, { target: join(showroom, "sitemap.xml"), html: renderSitemap(catalog, categories) }]);
const sitemapCount = pages.length + languages.length + categories.length * indexedCategoryLanguages.length;
console.log(`${args.check ? "Checked" : "Generated"} ${pages.length} model pages (${Math.min(...pages.map(page => page.length))}+ visible characters), ${categoryPages.length} category pages and ${sitemapCount} sitemap URLs.`);
