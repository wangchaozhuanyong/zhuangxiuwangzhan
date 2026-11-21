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

function img(image, alt, eager = false) {
  return `<img src="${escape(image.path)}" width="${image.width}" height="${image.height}" alt="${escape(alt)}" loading="${eager ? "eager" : "lazy"}" decoding="async"${eager ? ' fetchpriority="high"' : ""}>`;
}

function renderSchema(model, copy, lang, homeLabel) {
  const url = absolute(pagePath(lang, model.id));
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
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
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: homeLabel, item: absolute(pagePath(lang)) },
          { "@type": "ListItem", position: 2, name: model.name, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        inLanguage: locales[lang].alternate,
        mainEntity: copy.faqs.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  };
  // This is a JSON data block, not executable JavaScript.
  return JSON.stringify(schema, null, 2).replace(/</g, "\\u003c");
}

function renderPage(model, lang, sources, catalog, shared, overrides) {
  const words = sources.showroomWords[lang];
  const labels = sources.lockSpecLabels;
  const ui = copyTemplates[lang];
  const copy = pageCopy(model, lang, words, overrides);
  const locale = locales[lang];
  const url = absolute(pagePath(lang, model.id));
  const home = pagePath(lang);
  const imageAlt = `ANZHE ${model.name} · ${ui.photo}`;
  const contact = "https://wa.me/601128853888?text=" + encodeURIComponent(ui.message({ name: model.name, price: model.prices.display }));
  const altLinks = alternates(model.id).map(([tag, href]) => `<link rel="alternate" hreflang="${tag}" href="${href}">`);
  const langLinks = languages.map(code => {
    const { alternate, label, short } = locales[code];
    return `<a class="studio-button light-button" href="${pagePath(code, model.id)}" lang="${alternate}" aria-label="${label}"${code === lang ? ' aria-current="page"' : ""}>${short}</a>`;
  });
  const rows = specRows(model, lang, labels).map(({ key, label, value }) =>
    `<tr data-spec="${key}"><th scope="row" class="dir-spec-model">${escape(label)}</th><td>${escape(value)}</td></tr>`);
  const faq = copy.faqs.map(({ q, a }) => `<article><h3>${escape(q)}</h3><p>${escape(a)}</p></article>`);
  const guide = [doorChecks[lang][model.group], ...fittingGuides[lang]].map(([heading, text]) =>
    `<article><h3>${escape(heading)}</h3><p>${escape(text)}</p></article>`);
  // Malay fallback copy remains crawlable for review, with indexing withheld until native review.
  const robots = lang === "ms" ? '\n  <meta name="robots" content="noindex">' : "";
  return `<!doctype html>
<!-- Generated by scripts/generate-anzhe-lock-pages.mjs. -->
<html lang="${locale.tag}" data-anzhe-showroom>
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
        <a href="${home}" class="brand" aria-label="${escape(ui.home)}">${img(shared.logo, "ANZHE", true)}</a>
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
          <div class="panel-view">${img(model.imageInfo, imageAlt, true)}</div>
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
          <figure>${img(shared.face, "")}<figcaption><div><strong>${escape(words.fullDoor)}</strong><p>${escape(words.frontGuide)}</p></div></figcaption></figure>
          <figure>${img(shared.edge, "")}<figcaption><div><strong>${escape(words.doorEdge)}</strong><p>${escape(words.edgeGuide)}</p></div></figcaption></figure>
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

function renderSitemap(catalog) {
  const entries = [undefined, ...catalog.map(model => model.id)].flatMap(slug =>
    languages.map(lang => {
      const links = alternates(slug).map(([tag, href]) => `<xhtml:link rel="alternate" hreflang="${tag}" href="${href}"/>`);
      return `  <url>
    <loc>${absolute(pagePath(lang, slug))}</loc>
    ${links.join("\n    ")}
  </url>`;
    }));
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
  };
}));
const shared = {
  updates: await versionedAsset("/showroom-updates.js", join(showroom, "showroom-updates.js")),
  styles: await Promise.all([
    versionedAsset("/public-section-spacing.css", join(root, "public/public-section-spacing.css")),
    ...["studio.css", "directory.css", "contact.css"].map(file => versionedAsset("/" + file, join(showroom, file))),
  ]),
  logo: await imageInfo("assets/anzhe-logo.webp"),
  face: await imageInfo("assets/guide-face.webp"),
  edge: await imageInfo("assets/guide-edge.webp"),
};
const pages = catalog.flatMap(model => languages.map(lang => {
  const path = pagePath(lang, model.id);
  const html = renderPage(model, lang, sources, catalog, shared, overrides);
  return { path, target: join(showroom, "." + path, "index.html"), html, length: visibleChars(html) };
}));
const short = pages.filter(page => page.length < minimumVisibleChars);
if (short.length) throw new Error(`Expected ${minimumVisibleChars} visible characters per page:\n`
  + short.map(page => `${page.path} ${page.length}`).join("\n"));
await syncOutputs([...pages, { target: join(showroom, "sitemap.xml"), html: renderSitemap(catalog) }]);
console.log(`${args.check ? "Checked" : "Generated"} ${pages.length} lock pages and ${pages.length + languages.length} sitemap URLs (${Math.min(...pages.map(page => page.length))} or more visible characters per page).`);
