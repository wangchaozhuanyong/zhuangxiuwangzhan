# -*- coding: utf-8 -*-
"""Build the FLASH CAST 3-language SEO keyword matrix.

Output: docs/seo/flashcast-keyword-matrix-3lang.xlsx
Run: python docs/seo/build_keyword_matrix.py
"""

from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

OUT = Path(__file__).with_name("flashcast-keyword-matrix-3lang.xlsx")

# URL shorthands that actually exist in src/routes/publicRoutes.tsx
REN = "/{L}/services/renovation"
DES = "/{L}/services/design"
BLT = "/{L}/services/builtin"
KIT = "/{L}/services/kitchen"
BAT = "/{L}/services/bathroom"
OFF = "/{L}/services/office-renovation"
SHP = "/{L}/services/shop-renovation"
ART = "/{L}/services/artistic-coating"
OLD = "/{L}/services/old-house"
WHS = "/{L}/services/warehouse"
APR = "/{L}/services/approval"
CAB = "/{L}/custom-cabinets"
PRJ = "/{L}/projects"
FAQ = "/{L}/faq"
LOC_KL = "/{L}/locations/kuala-lumpur"
LOC_SEL = "/{L}/locations/selangor"
LOC_PJ = "/{L}/locations/petaling-jaya"
LOC_CH = "/{L}/locations/cheras"
LOC_SJ = "/{L}/locations/subang-jaya"
LOC_MK = "/{L}/locations/mont-kiara"
LOC_BS = "/{L}/locations/bangsar"
LOC_PC = "/{L}/locations/puchong"

NEED_CROSS = "新建交叉页"
NEED_PAGE = "缺页待建"

# (keyword, cn_gloss, intent, volume, difficulty, target, priority, format, note)
EN = [
    ("renovation contractor kuala lumpur", "吉隆坡装修承包商", "本地交易", "中", "中", REN, "P0", "现有服务页", "GBP 主词，落地页 H1 必占"),
    ("renovation company kl", "吉隆坡装修公司", "本地交易", "中", "中", REN, "P0", "现有服务页", ""),
    ("interior design kuala lumpur", "吉隆坡室内设计", "本地交易", "高", "高", DES, "P0", "现有服务页", "设计页主词，需案例支撑"),
    ("interior designer kl", "吉隆坡室内设计师", "本地交易", "中", "高", DES, "P0", "现有服务页", ""),
    ("house renovation kl", "吉隆坡房屋装修", "本地交易", "高", "中", REN, "P0", "现有服务页", ""),
    ("condo renovation kuala lumpur", "吉隆坡公寓装修", "本地交易", "中", "中", REN, "P0", "现有服务页", "公寓是高转化细分，建议独立段"),
    ("apartment renovation kl", "吉隆坡公寓翻新", "本地交易", "中", "中", REN, "P1", "现有服务页", ""),
    ("landed house renovation selangor", "雪兰莪有地住宅装修", "本地交易", "中", "中", LOC_SEL, "P0", "区域页", "方案指定 5 页之一"),
    ("bungalow renovation kl", "吉隆坡洋房装修", "本地交易", "低", "中", REN, "P1", "现有服务页", "别墅装修线，需案例"),
    ("whole house renovation malaysia", "马来西亚全屋装修", "商业调研", "中", "中", REN, "P0", "现有服务页", ""),
    ("full house renovation kl", "全屋翻新 吉隆坡", "本地交易", "中", "中", REN, "P0", "现有服务页", ""),
    ("one stop renovation kl", "一站式装修 吉隆坡", "本地交易", "低", "低", REN, "P1", "现有服务页", "强差异点，可做卖点段"),
    ("renovation design kl", "装修设计 吉隆坡", "本地交易", "中", "中", DES, "P0", "现有服务页", ""),
    ("3d design renovation malaysia", "3D 装修效果图", "商业调研", "低", "低", DES, "P1", "现有服务页", "效果图是成交杠杆"),
    ("kitchen renovation kuala lumpur", "吉隆坡厨房装修", "本地交易", "中", "中", KIT, "P0", "现有服务页", "方案指定 5 页之一"),
    ("kitchen cabinet kl", "吉隆坡厨房橱柜", "本地交易", "高", "中", CAB, "P0", "现有页", "家具 SKU 需与装修主线区隔"),
    ("custom kitchen cabinet malaysia", "马来西亚定制橱柜", "本地交易", "中", "中", CAB, "P0", "现有页", ""),
    ("wardrobe design kl", "吉隆坡衣柜设计", "本地交易", "中", "中", BLT, "P1", "现有服务页", ""),
    ("built in wardrobe kuala lumpur", "吉隆坡入墙衣柜", "本地交易", "中", "中", BLT, "P1", "现有服务页", ""),
    ("bathroom renovation kl", "吉隆坡浴室装修", "本地交易", "中", "中", BAT, "P0", "现有服务页", "方案指定 5 页之一"),
    ("toilet renovation kuala lumpur", "吉隆坡厕所翻新", "本地交易", "中", "低", BAT, "P0", "现有服务页", "本地口语词，必占"),
    ("office renovation kl", "吉隆坡办公室装修", "本地交易", "中", "中", OFF, "P0", "现有服务页", "方案指定 5 页之一"),
    ("office fit out kuala lumpur", "吉隆坡办公室精装", "本地交易", "中", "中", OFF, "P0", "现有服务页", ""),
    ("office interior design kl", "吉隆坡办公室室内设计", "本地交易", "低", "中", OFF, "P1", "现有服务页", ""),
    ("shoplot renovation kl", "吉隆坡店铺装修", "本地交易", "低", "低", SHP, "P0", "现有服务页", ""),
    ("retail shop renovation malaysia", "马来西亚零售店面装修", "本地交易", "低", "低", SHP, "P1", "现有服务页", ""),
    ("restaurant renovation kl", "吉隆坡餐厅装修", "本地交易", "低", "低", SHP, "P1", "现有服务页", "餐饮是高频细分"),
    ("cafe renovation malaysia", "马来西亚咖啡馆装修", "本地交易", "低", "低", SHP, "P2", "现有服务页", ""),
    ("factory renovation malaysia", "马来西亚工厂装修", "本地交易", "低", "低", NEED_PAGE, "P1", NEED_PAGE, "用户补充业务，当前无独立页"),
    ("warehouse renovation selangor", "雪兰莪仓库装修", "本地交易", "低", "低", WHS, "P1", "现有服务页", ""),
    ("commercial renovation kl", "吉隆坡商业装修", "本地交易", "低", "中", SHP, "P1", "现有服务页", "用户补充业务主线"),
    ("artistic wall coating malaysia", "马来西亚艺术涂料", "本地交易", "低", "低", ART, "P1", "现有服务页", "Remmers 品牌词可搭"),
    ("feature wall design kl", "吉隆坡电视墙设计", "本地交易", "中", "中", ART, "P1", "现有服务页", ""),
    ("painting service kl", "吉隆坡油漆服务", "本地交易", "中", "低", NEED_PAGE, "P1", NEED_PAGE, "刷漆是补充业务，无独立页"),
    ("house painting kuala lumpur", "吉隆坡房屋油漆", "本地交易", "中", "中", NEED_PAGE, "P1", NEED_PAGE, ""),
    ("floor tiling kl", "吉隆坡地砖铺贴", "本地交易", "中", "低", NEED_PAGE, "P1", NEED_PAGE, "地砖是补充业务"),
    ("tile installation kuala lumpur", "吉隆坡瓷砖安装", "本地交易", "中", "低", NEED_PAGE, "P2", NEED_PAGE, ""),
    ("wood flooring kl", "吉隆坡木地板", "本地交易", "中", "低", "/{L}/landing/flooring", "P0", "现有 landing 页", "landing 页有重定向到服务页逻辑，需核对"),
    ("spc vinyl flooring malaysia", "马来西亚 SPC 石塑地板", "本地交易", "中", "低", "/{L}/landing/flooring", "P0", "现有 landing 页", ""),
    ("laminate flooring kl", "吉隆坡复合地板", "本地交易", "中", "低", "/{L}/landing/flooring", "P1", "现有 landing 页", ""),
    ("plaster ceiling kl", "吉隆坡石膏天花板", "本地交易", "中", "低", NEED_PAGE, "P1", NEED_PAGE, "吊顶是补充业务"),
    ("ceiling partition malaysia", "马来西亚天花板与隔断", "本地交易", "低", "低", NEED_PAGE, "P2", NEED_PAGE, ""),
    ("partition wall kl", "吉隆坡隔墙", "本地交易", "中", "低", NEED_PAGE, "P1", NEED_PAGE, "隔墙是补充业务"),
    ("electrical wiring renovation kl", "吉隆坡装修拉电", "本地交易", "低", "低", NEED_PAGE, "P1", NEED_PAGE, "水电是补充业务"),
    ("plumbing renovation kl", "吉隆坡装修水喉", "本地交易", "低", "低", NEED_PAGE, "P1", NEED_PAGE, ""),
    ("waterproofing malaysia", "马来西亚防水工程", "本地交易", "中", "中", NEED_PAGE, "P1", NEED_PAGE, ""),
    ("hacking and demolition kl", "吉隆坡拆除工程", "本地交易", "低", "低", REN, "P2", "现有服务页", ""),
    ("digital lock installation kl", "吉隆坡电子锁安装", "本地交易", "中", "低", NEED_PAGE, "P0", NEED_PAGE, "用户补充业务，最高性价比补页"),
    ("smart lock malaysia", "马来西亚智能门锁", "本地交易", "中", "中", NEED_PAGE, "P0", NEED_PAGE, ""),
    ("custom furniture kl", "吉隆坡定制家具", "本地交易", "中", "中", CAB, "P0", "现有页", ""),
    ("cabinet maker kl", "吉隆坡橱柜厂", "本地交易", "中", "中", CAB, "P1", "现有页", ""),
    ("renovation cost malaysia", "马来西亚装修费用", "商业调研", "高", "高", "/{L}/blog/renovation-cost-malaysia-2025", "P0", "现有博客", "转化率最高的成本词，需独立深度页"),
    ("kitchen cabinet price malaysia", "马来西亚橱柜价格", "商业调研", "中", "中", CAB, "P0", "现有页", ""),
    ("bathroom renovation cost malaysia", "马来西亚浴室装修费用", "商业调研", "低", "低", BAT, "P1", "现有服务页", ""),
    ("renovation quotation kl", "吉隆坡装修报价", "本地交易", "中", "中", "/{L}/quote", "P0", "报价页", ""),
    ("renovation permit dbkl", "DBKL 装修许可证", "信息", "中", "低", "/{L}/blog/renovation-permit-dbkl-guide", "P1", "现有博客", "合规信任点"),
    ("cidb registered contractor kl", "CIDB 注册承包商", "本地交易", "低", "低", "/{L}/about", "P1", "关于页", "资质信任信号，GBP 也要对齐"),
    ("best renovation contractor kl", "吉隆坡最佳装修承包商", "本地交易", "中", "高", REN, "P1", "现有服务页", "靠评价与案例抢，不靠堆词"),
    ("old house renovation kl", "吉隆坡老屋翻新", "本地交易", "低", "低", OLD, "P0", "现有服务页", ""),
    ("subsale renovation malaysia", "二手房屋翻新", "商业调研", "低", "低", REN, "P1", "现有服务页", ""),
    ("kitchen extension malaysia", "厨房扩建", "本地交易", "低", "低", KIT, "P2", "现有服务页", ""),
    ("balcony renovation condo kl", "公寓阳台改造", "本地交易", "低", "低", REN, "P2", "现有服务页", ""),
    ("small condo renovation ideas", "小户型装修灵感", "信息", "中", "中", "/{L}/blog/small-condo-storage-design-ideas", "P1", "现有博客", ""),
    ("renovation before after malaysia", "装修前后对比", "信息", "中", "中", "/{L}/before-after", "P1", "现有页", "最强信任资产"),
    ("renovation timeline malaysia", "装修工期", "信息", "低", "低", "/{L}/process", "P1", "流程页", ""),
    ("renovation checklist malaysia", "装修清单", "信息", "中", "中", "/{L}/blog/office-renovation-checklist-malaysia", "P1", "现有博客", ""),
    ("how to choose renovation contractor", "如何选装修承包商", "信息", "中", "中", "/{L}/blog/how-to-choose-renovation-contractor-kl", "P1", "现有博客", ""),
    ("renovation contract malaysia", "马来西亚装修合同", "信息", "低", "低", "/{L}/process", "P2", "流程页", ""),
    ("renovation contractor petaling jaya", "八打灵再也装修承包商", "本地交易", "中", "中", LOC_PJ, "P0", "区域页", ""),
    ("renovation contractor cheras", "蕉赖装修承包商", "本地交易", "中", "低", LOC_CH, "P0", "区域页", ""),
    ("renovation contractor subang jaya", "梳邦再也装修承包商", "本地交易", "中", "低", LOC_SJ, "P0", "区域页", ""),
    ("condo renovation mont kiara", "满家乐公寓装修", "本地交易", "中", "低", LOC_MK, "P0", "区域页", "高客单区域"),
    ("renovation bangsar", "孟沙装修", "本地交易", "低", "低", LOC_BS, "P1", "区域页", ""),
    ("house renovation puchong", "蒲种房屋装修", "本地交易", "中", "低", LOC_PC, "P0", "区域页", ""),
    ("renovation klang", "巴生装修", "本地交易", "中", "低", NEED_CROSS, "P1", NEED_CROSS, "区域页缺失"),
    ("renovation shah alam", "莎阿南装修", "本地交易", "中", "低", NEED_CROSS, "P1", NEED_CROSS, "区域页缺失"),
    ("renovation ampang", "安邦装修", "本地交易", "中", "低", NEED_CROSS, "P2", NEED_CROSS, "区域页缺失"),
    ("renovation damansara", "白沙罗装修", "本地交易", "中", "低", NEED_CROSS, "P2", NEED_CROSS, "区域页缺失"),
    ("kitchen renovation petaling jaya", "八打灵再也厨房装修", "本地交易", "低", "低", NEED_CROSS, "P1", NEED_CROSS, "服务×区域交叉，方案核心"),
    ("office renovation selangor", "雪兰莪办公室装修", "本地交易", "中", "中", NEED_CROSS, "P1", NEED_CROSS, ""),
    ("condo renovation petaling jaya", "八打灵再也公寓装修", "本地交易", "中", "低", NEED_CROSS, "P0", NEED_CROSS, "方案指定 5 页之一"),
]

MS = [
    ("kontraktor pengubahsuaian kuala lumpur", "吉隆坡装修承包商", "本地交易", "中", "低", REN, "P0", "现有服务页", "马来语竞争远低于英文，性价比最高"),
    ("syarikat pengubahsuaian kl", "吉隆坡装修公司", "本地交易", "中", "低", REN, "P0", "现有服务页", ""),
    ("reka bentuk dalaman kuala lumpur", "吉隆坡室内设计", "本地交易", "中", "中", DES, "P0", "现有服务页", ""),
    ("pereka dalaman kl", "吉隆坡室内设计师", "本地交易", "低", "中", DES, "P1", "现有服务页", ""),
    ("pengubahsuaian rumah kl", "吉隆坡房屋装修", "本地交易", "中", "低", REN, "P0", "现有服务页", ""),
    ("pengubahsuaian kondominium kl", "吉隆坡公寓装修", "本地交易", "中", "低", REN, "P0", "现有服务页", ""),
    ("pengubahsuaian apartment kl", "吉隆坡公寓翻新", "本地交易", "低", "低", REN, "P1", "现有服务页", ""),
    ("pengubahsuaian rumah teres selangor", "雪兰莪排屋装修", "本地交易", "中", "低", LOC_SEL, "P0", "区域页", "注意：ms 路由需完整翻译才进 sitemap"),
    ("pengubahsuaian banglo kl", "吉隆坡洋房装修", "本地交易", "低", "低", REN, "P1", "现有服务页", ""),
    ("pengubahsuaian seluruh rumah", "全屋装修", "商业调研", "中", "低", REN, "P0", "现有服务页", ""),
    ("pengubahsuaian rumah sepenuhnya kl", "全屋翻新 吉隆坡", "本地交易", "低", "低", REN, "P1", "现有服务页", ""),
    ("pengubahsuaian one stop kl", "一站式装修 吉隆坡", "本地交易", "低", "低", REN, "P1", "现有服务页", ""),
    ("reka bentuk pengubahsuaian kl", "装修设计 吉隆坡", "本地交易", "低", "低", DES, "P1", "现有服务页", ""),
    ("reka bentuk 3d pengubahsuaian", "3D 装修效果图", "商业调研", "低", "低", DES, "P2", "现有服务页", ""),
    ("pengubahsuaian dapur kuala lumpur", "吉隆坡厨房装修", "本地交易", "中", "低", KIT, "P0", "现有服务页", ""),
    ("kabinet dapur kl", "吉隆坡厨房橱柜", "本地交易", "中", "低", CAB, "P0", "现有页", ""),
    ("kabinet dapur custom malaysia", "马来西亚定制橱柜", "本地交易", "中", "低", CAB, "P0", "现有页", ""),
    ("almari pakaian built in kl", "吉隆坡入墙衣柜", "本地交易", "中", "低", BLT, "P1", "现有服务页", ""),
    ("reka bentuk almari pakaian", "衣柜设计", "本地交易", "低", "低", BLT, "P2", "现有服务页", ""),
    ("pengubahsuaian bilik air kl", "吉隆坡浴室装修", "本地交易", "中", "低", BAT, "P0", "现有服务页", ""),
    ("pengubahsuaian tandas kuala lumpur", "吉隆坡厕所翻新", "本地交易", "中", "低", BAT, "P0", "现有服务页", "本地口语强词"),
    ("pengubahsuaian pejabat kl", "吉隆坡办公室装修", "本地交易", "低", "低", OFF, "P0", "现有服务页", ""),
    ("fit out pejabat kuala lumpur", "吉隆坡办公室精装", "本地交易", "低", "低", OFF, "P1", "现有服务页", ""),
    ("pengubahsuaian kedai kl", "吉隆坡店铺装修", "本地交易", "低", "低", SHP, "P1", "现有服务页", ""),
    ("pengubahsuaian kedai runcit malaysia", "杂货店装修", "本地交易", "低", "低", SHP, "P2", "现有服务页", ""),
    ("pengubahsuaian kilang malaysia", "马来西亚工厂装修", "本地交易", "低", "低", NEED_PAGE, "P1", NEED_PAGE, "缺页"),
    ("pengubahsuaian gudang selangor", "雪兰莪仓库装修", "本地交易", "低", "低", WHS, "P2", "现有服务页", ""),
    ("pengubahsuaian komersial kl", "吉隆坡商业装修", "本地交易", "低", "低", SHP, "P1", "现有服务页", ""),
    ("salutan dinding artistik malaysia", "马来西亚艺术涂料", "本地交易", "低", "低", ART, "P2", "现有服务页", ""),
    ("reka bentuk dinding hiasan kl", "装饰墙设计", "本地交易", "低", "低", ART, "P2", "现有服务页", ""),
    ("servis mengecat kl", "吉隆坡油漆服务", "本地交易", "中", "低", NEED_PAGE, "P1", NEED_PAGE, "缺页"),
    ("mengecat rumah kuala lumpur", "吉隆坡房屋油漆", "本地交易", "中", "低", NEED_PAGE, "P1", NEED_PAGE, ""),
    ("pemasangan jubin kl", "吉隆坡地砖铺贴", "本地交易", "中", "低", NEED_PAGE, "P1", NEED_PAGE, ""),
    ("kerja jubin kuala lumpur", "吉隆坡瓷砖工程", "本地交易", "低", "低", NEED_PAGE, "P2", NEED_PAGE, ""),
    ("lantai kayu kl", "吉隆坡木地板", "本地交易", "中", "低", "/{L}/landing/flooring", "P1", "现有 landing 页", ""),
    ("lantai vinil spc malaysia", "马来西亚 SPC 石塑地板", "本地交易", "中", "低", "/{L}/landing/flooring", "P1", "现有 landing 页", ""),
    ("lantai laminat kl", "吉隆坡复合地板", "本地交易", "低", "低", "/{L}/landing/flooring", "P2", "现有 landing 页", ""),
    ("siling plaster kl", "吉隆坡石膏天花板", "本地交易", "中", "低", NEED_PAGE, "P1", NEED_PAGE, ""),
    ("partition siling malaysia", "天花板隔断", "本地交易", "低", "低", NEED_PAGE, "P2", NEED_PAGE, ""),
    ("dinding partition kl", "吉隆坡隔墙", "本地交易", "中", "低", NEED_PAGE, "P1", NEED_PAGE, ""),
    ("pendawaian elektrik pengubahsuaian kl", "装修拉电工程", "本地交易", "低", "低", NEED_PAGE, "P1", NEED_PAGE, ""),
    ("kerja paip pengubahsuaian kl", "装修水喉工程", "本地交易", "低", "低", NEED_PAGE, "P1", NEED_PAGE, ""),
    ("kalis air malaysia", "防水工程", "本地交易", "中", "低", NEED_PAGE, "P1", NEED_PAGE, ""),
    ("kerja perobohan kl", "拆除工程", "本地交易", "低", "低", REN, "P2", "现有服务页", ""),
    ("pemasangan kunci digital kl", "吉隆坡电子锁安装", "本地交易", "中", "低", NEED_PAGE, "P0", NEED_PAGE, "缺页，马来语竞争极低"),
    ("kunci pintar malaysia", "马来西亚智能门锁", "本地交易", "中", "低", NEED_PAGE, "P0", NEED_PAGE, ""),
    ("perabot custom kl", "吉隆坡定制家具", "本地交易", "中", "低", CAB, "P0", "现有页", ""),
    ("pembuat kabinet kl", "吉隆坡橱柜制造", "本地交易", "低", "低", CAB, "P1", "现有页", ""),
    ("kos pengubahsuaian rumah malaysia", "马来西亚装修费用", "商业调研", "中", "低", "/{L}/blog/renovation-cost-malaysia-2025", "P0", "现有博客", "成本词马来语缺口最大"),
    ("harga kabinet dapur malaysia", "马来西亚橱柜价格", "商业调研", "中", "低", CAB, "P0", "现有页", ""),
    ("kos pengubahsuaian bilik air", "浴室装修费用", "商业调研", "低", "低", BAT, "P1", "现有服务页", ""),
    ("sebut harga pengubahsuaian kl", "装修报价 吉隆坡", "本地交易", "中", "低", "/{L}/quote", "P0", "报价页", ""),
    ("permit pengubahsuaian dbkl", "DBKL 装修许可", "信息", "低", "低", "/{L}/blog/renovation-permit-dbkl-guide", "P1", "现有博客", ""),
    ("kontraktor berdaftar cidb kl", "CIDB 注册承包商", "本地交易", "低", "低", "/{L}/about", "P1", "关于页", ""),
    ("kontraktor pengubahsuaian terbaik kl", "最佳装修承包商", "本地交易", "低", "中", REN, "P2", "现有服务页", ""),
    ("kontraktor pengubahsuaian petaling jaya", "八打灵再也装修承包商", "本地交易", "中", "低", LOC_PJ, "P0", "区域页", ""),
    ("kontraktor pengubahsuaian cheras", "蕉赖装修承包商", "本地交易", "中", "低", LOC_CH, "P0", "区域页", ""),
    ("kontraktor pengubahsuaian subang jaya", "梳邦再也装修承包商", "本地交易", "中", "低", LOC_SJ, "P0", "区域页", ""),
    ("pengubahsuaian kondominium mont kiara", "满家乐公寓装修", "本地交易", "低", "低", LOC_MK, "P1", "区域页", ""),
    ("pengubahsuaian bangsar", "孟沙装修", "本地交易", "低", "低", LOC_BS, "P2", "区域页", ""),
    ("pengubahsuaian rumah puchong", "蒲种房屋装修", "本地交易", "中", "低", LOC_PC, "P1", "区域页", ""),
    ("pengubahsuaian klang", "巴生装修", "本地交易", "中", "低", NEED_CROSS, "P1", NEED_CROSS, "区域页缺失"),
    ("pengubahsuaian rumah shah alam", "莎阿南装修", "本地交易", "中", "低", NEED_CROSS, "P1", NEED_CROSS, ""),
]

ZH = [
    ("吉隆坡装修公司", "KL renovation company", "本地交易", "中", "低", REN, "P0", "现有服务页", "中文竞争小，转化直接"),
    ("吉隆坡装修承包商", "KL renovation contractor", "本地交易", "中", "低", REN, "P0", "现有服务页", ""),
    ("吉隆坡室内设计", "KL interior design", "本地交易", "中", "中", DES, "P0", "现有服务页", ""),
    ("吉隆坡室内设计师", "KL interior designer", "本地交易", "低", "中", DES, "P1", "现有服务页", ""),
    ("雪兰莪装修公司", "Selangor renovation company", "本地交易", "中", "低", LOC_SEL, "P0", "区域页", ""),
    ("公寓装修 吉隆坡", "condo renovation KL", "本地交易", "中", "低", REN, "P0", "现有服务页", ""),
    ("排屋装修 雪兰莪", "terrace house renovation", "本地交易", "中", "低", LOC_SEL, "P0", "区域页", ""),
    ("半独立式装修", "semi-D renovation", "本地交易", "低", "低", REN, "P1", "现有服务页", ""),
    ("独立式洋房装修", "bungalow renovation", "本地交易", "低", "低", REN, "P1", "现有服务页", "别墅装修线"),
    ("全屋装修", "whole house renovation", "商业调研", "中", "低", REN, "P0", "现有服务页", ""),
    ("一站式装修服务", "one stop renovation", "本地交易", "低", "低", REN, "P1", "现有服务页", ""),
    ("装修设计 吉隆坡", "renovation design KL", "本地交易", "中", "低", DES, "P0", "现有服务页", ""),
    ("3D 效果图 装修", "3D renovation rendering", "商业调研", "低", "低", DES, "P2", "现有服务页", ""),
    ("厨房装修 吉隆坡", "kitchen renovation KL", "本地交易", "中", "低", KIT, "P0", "现有服务页", ""),
    ("厨房橱柜定制", "custom kitchen cabinet", "本地交易", "中", "低", CAB, "P0", "现有页", ""),
    ("全屋定制 马来西亚", "whole house custom furniture", "本地交易", "中", "中", CAB, "P0", "现有页", "用户核心业务线"),
    ("衣柜定制 吉隆坡", "custom wardrobe KL", "本地交易", "中", "低", BLT, "P1", "现有服务页", ""),
    ("入墙衣柜", "built-in wardrobe", "本地交易", "中", "低", BLT, "P1", "现有服务页", "马来西亚华人口语"),
    ("浴室装修 吉隆坡", "bathroom renovation KL", "本地交易", "中", "低", BAT, "P0", "现有服务页", ""),
    ("厕所翻新", "toilet renovation", "本地交易", "中", "低", BAT, "P0", "现有服务页", "本地口语强词"),
    ("办公室装修 吉隆坡", "office renovation KL", "本地交易", "中", "低", OFF, "P0", "现有服务页", ""),
    ("办公室设计装修", "office design and build", "本地交易", "低", "低", OFF, "P1", "现有服务页", ""),
    ("店铺装修 吉隆坡", "shoplot renovation KL", "本地交易", "中", "低", SHP, "P0", "现有服务页", ""),
    ("店面装修", "retail shop renovation", "本地交易", "低", "低", SHP, "P1", "现有服务页", ""),
    ("工厂装修 马来西亚", "factory renovation", "本地交易", "低", "低", NEED_PAGE, "P1", NEED_PAGE, "用户补充业务，缺页"),
    ("仓库装修 雪兰莪", "warehouse renovation", "本地交易", "低", "低", WHS, "P2", "现有服务页", ""),
    ("商业空间装修", "commercial space renovation", "本地交易", "低", "低", SHP, "P1", "现有服务页", ""),
    ("艺术涂料 马来西亚", "artistic wall coating", "本地交易", "低", "低", ART, "P1", "现有服务页", "Remmers 品牌"),
    ("电视背景墙设计", "feature wall design", "本地交易", "中", "低", ART, "P1", "现有服务页", ""),
    ("油漆工程 吉隆坡", "painting works KL", "本地交易", "中", "低", NEED_PAGE, "P1", NEED_PAGE, "刷漆业务缺页"),
    ("刷新油漆", "repainting service", "本地交易", "中", "低", NEED_PAGE, "P1", NEED_PAGE, ""),
    ("地砖铺贴", "tiling works", "本地交易", "中", "低", NEED_PAGE, "P1", NEED_PAGE, "地砖业务缺页"),
    ("木地板安装", "wood flooring installation", "本地交易", "中", "低", "/{L}/landing/flooring", "P1", "现有 landing 页", ""),
    ("SPC 石塑地板", "SPC vinyl flooring", "本地交易", "中", "低", "/{L}/landing/flooring", "P1", "现有 landing 页", ""),
    ("复合地板", "laminate flooring", "本地交易", "低", "低", "/{L}/landing/flooring", "P2", "现有 landing 页", ""),
    ("石膏天花板", "plaster ceiling", "本地交易", "中", "低", NEED_PAGE, "P1", NEED_PAGE, "吊顶业务缺页"),
    ("石膏板隔墙", "plasterboard partition", "本地交易", "中", "低", NEED_PAGE, "P1", NEED_PAGE, "隔墙业务缺页"),
    ("隔墙工程", "partition works", "本地交易", "低", "低", NEED_PAGE, "P2", NEED_PAGE, ""),
    ("水电工程", "electrical and plumbing works", "本地交易", "中", "低", NEED_PAGE, "P1", NEED_PAGE, "水电业务缺页"),
    ("拉电工程", "electrical rewiring", "本地交易", "中", "低", NEED_PAGE, "P1", NEED_PAGE, ""),
    ("水喉工程", "plumbing works", "本地交易", "中", "低", NEED_PAGE, "P1", NEED_PAGE, ""),
    ("防水工程", "waterproofing works", "本地交易", "中", "低", NEED_PAGE, "P1", NEED_PAGE, ""),
    ("拆除工程", "hacking and demolition", "本地交易", "低", "低", REN, "P2", "现有服务页", ""),
    ("电子锁安装", "digital lock installation", "本地交易", "中", "低", NEED_PAGE, "P0", NEED_PAGE, "用户补充业务，转化快"),
    ("智能门锁", "smart door lock", "本地交易", "中", "低", NEED_PAGE, "P0", NEED_PAGE, ""),
    ("定制家具", "custom furniture", "本地交易", "中", "低", CAB, "P0", "现有页", ""),
    ("家具定制 吉隆坡", "furniture customisation KL", "本地交易", "中", "低", CAB, "P0", "现有页", ""),
    ("装修费用 马来西亚", "renovation cost Malaysia", "商业调研", "高", "低", "/{L}/blog/renovation-cost-malaysia-2025", "P0", "现有博客", "中文成本词搜索量大、竞争低"),
    ("橱柜价格", "kitchen cabinet price", "商业调研", "中", "低", CAB, "P0", "现有页", ""),
    ("厕所装修费用", "bathroom renovation cost", "商业调研", "低", "低", BAT, "P1", "现有服务页", ""),
    ("装修报价", "renovation quotation", "本地交易", "中", "低", "/{L}/quote", "P0", "报价页", ""),
    ("装修许可证 DBKL", "DBKL renovation permit", "信息", "低", "低", "/{L}/blog/renovation-permit-dbkl-guide", "P1", "现有博客", ""),
    ("CIDB 注册承包商", "CIDB registered contractor", "本地交易", "低", "低", "/{L}/about", "P1", "关于页", ""),
    ("装修公司推荐", "recommended renovation company", "本地交易", "中", "低", REN, "P1", "现有服务页", "靠评价抢，不靠堆词"),
    ("装修公司 蒲种", "renovation company Puchong", "本地交易", "中", "低", LOC_PC, "P0", "区域页", ""),
    ("装修公司 蕉赖", "renovation company Cheras", "本地交易", "中", "低", LOC_CH, "P0", "区域页", ""),
    ("装修公司 八打灵再也", "renovation company PJ", "本地交易", "中", "低", LOC_PJ, "P0", "区域页", ""),
    ("装修公司 满家乐", "renovation company Mont Kiara", "本地交易", "低", "低", LOC_MK, "P1", "区域页", "高客单区域"),
    ("装修公司 孟沙", "renovation company Bangsar", "本地交易", "低", "低", LOC_BS, "P2", "区域页", ""),
    ("装修公司 巴生", "renovation company Klang", "本地交易", "中", "低", NEED_CROSS, "P1", NEED_CROSS, "区域页缺失"),
    ("装修公司 梳邦", "renovation company Subang", "本地交易", "中", "低", LOC_SJ, "P0", "区域页", ""),
    ("厨房装修 八打灵再也", "kitchen renovation PJ", "本地交易", "低", "低", NEED_CROSS, "P1", NEED_CROSS, "服务×区域交叉"),
    ("公寓装修 满家乐", "condo renovation Mont Kiara", "本地交易", "低", "低", NEED_CROSS, "P1", NEED_CROSS, ""),
]

SHEETS = [("EN", EN, "en"), ("BM-Malay", MS, "ms"), ("ZH-CN", ZH, "zh")]

HEADERS = ["ID", "关键词", "中文释义", "搜索意图", "月搜索量(估)", "竞争度", "建议承接页", "优先级", "承接形式", "备注"]
WIDTHS = [7, 42, 30, 12, 14, 10, 46, 10, 16, 42]

FILL_LANG = {
    "EN": PatternFill("solid", fgColor="DCE6F1"),
    "BM-Malay": PatternFill("solid", fgColor="E2EFDA"),
    "ZH-CN": PatternFill("solid", fgColor="FCE4D6"),
}
FILL_HEAD = PatternFill("solid", fgColor="1F3864")
FILL_P0 = PatternFill("solid", fgColor="FFF2CC")
THIN = Side(style="thin", color="BFBFBF")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)


def build_sheet(ws, rows, lang, start_id):
    ws.append(HEADERS)
    for cell in ws[1]:
        cell.font = Font(bold=True, color="FFFFFF", size=11)
        cell.fill = FILL_HEAD
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = BORDER
    ws.row_dimensions[1].height = 24

    for i, row in enumerate(rows, start=start_id):
        kw, gloss, intent, vol, diff, target, prio, form, note = row
        url = target.format(L=lang) if "{L}" in target else target
        ws.append([f"K{i:03d}", kw, gloss, intent, vol, diff, url, prio, form, note])
        r = ws.max_row
        for c in range(1, len(HEADERS) + 1):
            cell = ws.cell(row=r, column=c)
            cell.border = BORDER
            cell.alignment = Alignment(vertical="top", wrap_text=(c in (2, 3, 7, 10)))
        if prio == "P0":
            for c in (8,):
                ws.cell(row=r, column=c).fill = FILL_P0
        ws.cell(row=r, column=1).fill = FILL_LANG[ws.title if ws.title in FILL_LANG else "EN"]

    for idx, w in enumerate(WIDTHS, start=1):
        ws.column_dimensions[get_column_letter(idx)].width = w
    ws.freeze_panes = "C2"
    ws.auto_filter.ref = f"A1:{get_column_letter(len(HEADERS))}{ws.max_row}"


def build_summary(wb, totals):
    ws = wb.create_sheet("说明", 0)
    ws["A1"] = "FLASH CAST 吉隆坡装修 · 三语关键词矩阵"
    ws["A1"].font = Font(bold=True, size=16, color="1F3864")
    ws["A2"] = "生成日期：2026-11-14 ｜ 数据来源：站点现有路由 + 本地意图词库 ｜ 月搜索量为区间估计，非精确值"
    ws["A2"].font = Font(size=10, color="595959")

    ws["A4"] = "总量"
    ws["B4"] = totals["total"]
    ws["A5"] = "EN"
    ws["B5"] = totals["EN"]
    ws["A6"] = "BM / Malay"
    ws["B6"] = totals["MS"]
    ws["A7"] = "ZH"
    ws["B7"] = totals["ZH"]
    ws["A8"] = "P0 优先级"
    ws["B8"] = totals["P0"]

    notes = [
        "",
        "字段说明",
        "搜索意图：本地交易 = 有明确找人做的意图；商业调研 = 比价/看方案阶段；信息 = 求知阶段。",
        "月搜索量(估)：高 > 1,000 / 中 200-1,000 / 低 < 200，仅作排序参考，必须用 Search Console 真实数据替换。",
        "优先级：P0 = 本月必须占住（现有页可直接承接）；P1 = 需新建页或补内容；P2 = 长尾，第二批。",
        "",
        "承接页标记含义",
        "路径带 /{L}/ = 项目现有真实路由，可直接优化（其中 {L} 为 en / zh / ms）。",
        "新建交叉页 = 服务×区域交叉页，当前项目没有该路由，需新建。",
        "缺页待建 = 你补充的业务线（工厂装修、电子锁、刷漆、地砖、吊顶、隔墙、水电）目前没有独立页。",
        "",
        "使用顺序",
        "1. 先做 P0 里承接形式为「现有服务页 / 现有页 / 区域页」的词，不用改代码，只改 seoTitle / seoDescription / H1。",
        "2. 再做「缺页待建」的电子锁、刷漆、地砖、吊顶、隔墙、水电、工厂装修，这 7 个是最便宜的新流量入口。",
        "3. 最后做「新建交叉页」，服务×区域交叉页是本地包之外的第二战场。",
        "",
        "重要提示",
        "马来语页只有在翻译完整时才会进 sitemap（scripts/generate-seo-manifest.mjs 的 hasCompleteMalayContent 判定）。",
        "所以 ms 关键词排名能不能起来，先取决于 ms 内容是否真翻译，不是取决于词表。",
    ]
    for i, line in enumerate(notes, start=10):
        ws.cell(row=i, column=1, value=line)
        if line in ("字段说明", "承接页标记含义", "使用顺序", "重要提示"):
            ws.cell(row=i, column=1).font = Font(bold=True, size=11, color="1F3864")
    ws.column_dimensions["A"].width = 110
    ws.column_dimensions["B"].width = 14


def main():
    wb = Workbook()
    wb.remove(wb.active)

    totals = {"EN": len(EN), "MS": len(MS), "ZH": len(ZH)}
    totals["total"] = sum(totals.values())
    totals["P0"] = sum(1 for group in (EN, MS, ZH) for r in group if r[6] == "P0")

    for title, rows, lang in SHEETS:
        ws = wb.create_sheet(title)
        build_sheet(ws, rows, lang, 1)

    build_summary(wb, totals)
    wb.active = 0
    wb.save(OUT)
    print(f"saved: {OUT}")
    print(f"total={totals['total']} en={totals['EN']} ms={totals['MS']} zh={totals['ZH']} p0={totals['P0']}")


if __name__ == "__main__":
    main()
