// Exact original five-field candidate inputs for the existing protected publisher.
// No full native records, credentials or runtime dependency on the company package.
import { createHash } from "node:crypto";

const bindings = {
  "paid-three-page-builtin-exact-fields-v1": {
    "taskId": "fc-20261010-paid-three-page-exact-publication-followthrough-v1",
    "candidateVersion": "paid-three-page-exact-native-diff-v1-20261010",
    "qaEvidenceVersion": "paid-three-page-exact-native-diff-v1-20261010",
    "actionId": "paid-three-page-builtin-exact-fields-v1",
    "actionClass": "cms_write",
    "scope": "flashcast.com.my:services/b401a610-a4dc-4a0b-a7e0-efcac6c81d71:content_zh",
    "recordId": "b401a610-a4dc-4a0b-a7e0-efcac6c81d71",
    "slug": "builtin",
    "contentType": "service",
    "table": "services",
    "keyField": "id",
    "exactPatchOnly": true,
    "rollbackAllowed": true,
    "requiresParentRun": true,
    "expectedUpdatedAt": "2026-10-09T07:24:19.422726+00:00",
    "status": "published",
    "baselineProjectionFields": [
      "id",
      "slug",
      "title_zh",
      "title_en",
      "excerpt_zh",
      "excerpt_en",
      "content_zh",
      "content_en",
      "image_url",
      "alt_zh",
      "alt_en",
      "suitable_for_zh",
      "suitable_for_en",
      "common_projects_zh",
      "common_projects_en",
      "process_steps_zh",
      "process_steps_en",
      "scope_items_zh",
      "scope_items_en",
      "faqs_zh",
      "faqs_en",
      "seo_title_zh",
      "seo_title_en",
      "seo_description_zh",
      "seo_description_en",
      "status",
      "sort_order",
      "created_at",
      "updated_at",
      "version"
    ],
    "baselineFieldsSha256": "e2cd27f93add1d5a645cef5aae717e792be11c991330d7907714365fada93b62",
    "desiredFieldsSha256": "1d40ca43cd2b1e0ccfaee66a6c75e762c0e5c24e89c964839a38e20b2f4b1af2",
    "rollbackFieldsSha256": "0d49b604fb61ef0409c50b0c89492a5cf1313969b3dddd3a030e956bb29483e8",
    "changedFields": [
      "content_zh"
    ],
    "retainedProjectionFields": [
      "id",
      "slug",
      "title_zh",
      "title_en",
      "excerpt_zh",
      "excerpt_en",
      "content_en",
      "image_url",
      "alt_zh",
      "alt_en",
      "suitable_for_zh",
      "suitable_for_en",
      "common_projects_zh",
      "common_projects_en",
      "process_steps_zh",
      "process_steps_en",
      "scope_items_zh",
      "scope_items_en",
      "faqs_zh",
      "faqs_en",
      "seo_title_zh",
      "seo_title_en",
      "seo_description_zh",
      "seo_description_en",
      "status",
      "sort_order",
      "created_at"
    ],
    "retainedFieldsSha256": "42ee3bc14506f6ddc0c4268edf560b1b447c12390c07a3a1c4c2197fa422a478",
    "sourceCandidatePath": "drafts/publishing/fc-20261010-paid-three-page-exact-publication-followthrough-v1/builtin.typed-preview-input.json",
    "sourceCandidateSha256": "98b09cb2981f20faf67cd2b00328c30fd8d0ac9755ea3c41c4717349656a91a3",
    "publicPaths": [
      {
        "path": "/zh/services/builtin",
        "expected": "全屋定制与定制家具｜衣柜、电视柜、收纳柜｜FLASH CAST",
        "requiredPhrases": [
          "若主要需求是厨房橱柜与厨房整体动线，可查看",
          "，了解橱柜、台面、家电点位和报价范围。"
        ],
        "forbidden": [
          "若需求属于厨房橱柜与厨房整体动线，应进入独立的",
          "，避免两个页面争夺同一搜索意图。"
        ],
        "strictMetadataTitle": true
      },
      {
        "path": "/en/services/builtin",
        "expected": "Custom Built-In Furniture & Wardrobes | FLASH CAST",
        "strictMetadataTitle": true
      }
    ],
    "desiredFields": {
      "content_zh": "<p><strong>直接答案：</strong>FLASH CAST 为吉隆坡、雪兰莪与巴生谷的住宅及商业空间规划全屋定制、定制家具与定制衣柜。方案会按现场尺寸、日常使用、收纳分类、材料、五金、搬运和安装条件整理，而不是套用一个固定套餐。</p>\n<h2>按空间和使用方式规划</h2>\n<p>可讨论的范围包括定制衣柜、walk-in wardrobe、电视柜、鞋柜、餐边柜、展示柜、书柜、工作区与其他嵌入式收纳。若主要需求是厨房橱柜与厨房整体动线，可查看 <a href=\"/zh/services/kitchen\">定制厨房与厨房装修服务</a>，了解橱柜、台面、家电点位和报价范围。</p>\n<h2>报价前先确认的项目</h2>\n<p>报价会根据现场量度、柜体尺寸与分区、板材和饰面、门板、台面、五金、内部配件、灯光衔接、搬运、电梯、安装通道及其他工种配合范围评估。可讨论的材料方向包括 Melamine、Acrylic 与 Solid Wood，最终规格应以样板、现场条件和书面报价为准。</p>\n<h2>从参考到咨询</h2>\n<p>可先查看 <a href=\"/zh/materials/category/whole-house-custom/wardrobes\">衣柜材料</a>、<a href=\"/zh/materials/category/whole-house-custom/storage-cabinets\">收纳柜材料</a>、<a href=\"/zh/projects/bangsar-walk-in-wardrobe-system\">Bangsar walk-in wardrobe 参考</a> 和 <a href=\"/zh/blog/built-in-cabinet-cost-malaysia\">马来西亚定制柜报价影响因素</a>。准备地点、平面图或现场照片及主要收纳需求后，可前往 <a href=\"/zh/quote\">获取免费报价</a>。距离公司或服务点 30 公里以内可免费上门量房；超过 30 公里会收费，具体费用需先确认。</p>\n\n<h2>确认方案时，需要把哪些选择记录下来？</h2>\n<p>可把柜体位置与尺寸、内部划分、门板与饰面、把手或开门方式、五金及配件整理到同一份确认清单，并标注哪些仍待现场核对。衣柜应按实际衣物、抽屉和取用习惯讨论，而不是只比较外观或总长度；详细问项可参考 <a href=\"/zh/blog/custom-wardrobe-price-malaysia\">定制衣柜报价比较指南</a>。图纸、样板、修改与安装由谁提供，以及包含哪些交付，应在书面范围中分别确认。</p>\n<h2>安装交付时怎样保留可跟进的记录？</h2>\n<p>与负责方对照已确认清单，记录可见饰面、门和抽屉操作、配件及待调整项。每个问题写明柜体位置、照片、需确认的处理方式和跟进人，再保留复查结果；具体检查方法与责任按项目约定。可参考 <a href=\"/zh/blog/renovation-handover-defect-checklist-malaysia\">装修交付记录清单</a>，并询问所选材料与五金的保养说明、适用售后条款和联系方法。这不新增固定保修范围或未经确认的材料性能承诺。</p>"
    },
    "rollbackPublicPaths": [
      {
        "path": "/zh/services/builtin",
        "expected": "全屋定制与定制家具｜衣柜、电视柜、收纳柜｜FLASH CAST",
        "requiredPhrases": [
          "若需求属于厨房橱柜与厨房整体动线，应进入独立的",
          "，避免两个页面争夺同一搜索意图。"
        ],
        "forbidden": [
          "若主要需求是厨房橱柜与厨房整体动线，可查看",
          "，了解橱柜、台面、家电点位和报价范围。"
        ],
        "strictMetadataTitle": true
      },
      {
        "path": "/en/services/builtin",
        "expected": "Custom Built-In Furniture & Wardrobes | FLASH CAST",
        "strictMetadataTitle": true
      }
    ]
  },
  "paid-three-page-kitchen-exact-fields-v1": {
    "taskId": "fc-20261010-paid-three-page-exact-publication-followthrough-v1",
    "candidateVersion": "paid-three-page-exact-native-diff-v1-20261010",
    "qaEvidenceVersion": "paid-three-page-exact-native-diff-v1-20261010",
    "actionId": "paid-three-page-kitchen-exact-fields-v1",
    "actionClass": "cms_write",
    "scope": "flashcast.com.my:services/ce4156db-9034-42c8-ba29-b35724ea7d6d:title_zh,excerpt_zh",
    "recordId": "ce4156db-9034-42c8-ba29-b35724ea7d6d",
    "slug": "kitchen",
    "contentType": "service",
    "table": "services",
    "keyField": "id",
    "exactPatchOnly": true,
    "rollbackAllowed": true,
    "requiresParentRun": true,
    "expectedUpdatedAt": "2026-10-09T07:23:28.638474+00:00",
    "status": "published",
    "baselineProjectionFields": [
      "id",
      "slug",
      "title_zh",
      "title_en",
      "excerpt_zh",
      "excerpt_en",
      "content_zh",
      "content_en",
      "image_url",
      "alt_zh",
      "alt_en",
      "suitable_for_zh",
      "suitable_for_en",
      "common_projects_zh",
      "common_projects_en",
      "process_steps_zh",
      "process_steps_en",
      "scope_items_zh",
      "scope_items_en",
      "faqs_zh",
      "faqs_en",
      "seo_title_zh",
      "seo_title_en",
      "seo_description_zh",
      "seo_description_en",
      "status",
      "sort_order",
      "created_at",
      "updated_at",
      "version"
    ],
    "baselineFieldsSha256": "42a11419d1527f31462f5bd2cccde8dfb6295497caf7158f70e5d3185eaf852c",
    "desiredFieldsSha256": "608d3c262b518bbac3085e5b36d159e4e2a158c6e182c85ff43d32507ced34b2",
    "rollbackFieldsSha256": "40d306e1bec501f7ec851f24061120e2a0aa79e828b3bbcfde6bf330746f7b49",
    "changedFields": [
      "title_zh",
      "excerpt_zh"
    ],
    "retainedProjectionFields": [
      "id",
      "slug",
      "title_en",
      "excerpt_en",
      "content_zh",
      "content_en",
      "image_url",
      "alt_zh",
      "alt_en",
      "suitable_for_zh",
      "suitable_for_en",
      "common_projects_zh",
      "common_projects_en",
      "process_steps_zh",
      "process_steps_en",
      "scope_items_zh",
      "scope_items_en",
      "faqs_zh",
      "faqs_en",
      "seo_title_zh",
      "seo_title_en",
      "seo_description_zh",
      "seo_description_en",
      "status",
      "sort_order",
      "created_at"
    ],
    "retainedFieldsSha256": "d02ca01b0fc4e4182b79261509c32d9f3c7bee2d9467305e3f2e0eff7c1a0b14",
    "sourceCandidatePath": "drafts/publishing/fc-20261010-paid-three-page-exact-publication-followthrough-v1/kitchen.typed-preview-input.json",
    "sourceCandidateSha256": "61ff6006cbd3b6611860fff662a99e420b499c2dd3dd6bbb590844b069016625",
    "publicPaths": [
      {
        "path": "/zh/services/kitchen",
        "expected": "吉隆坡与雪兰莪厨房装修｜橱柜、台面与干湿厨房规划 | FLASH CAST",
        "requiredPhrases": [
          "吉隆坡与雪兰莪定制橱柜及厨房装修",
          "根据真实现场规划定制橱柜、台面、厨房收纳与干湿厨房动线；再核对家电点位、给排水、材料、五金、安装条件及书面报价范围。"
        ],
        "forbidden": [
          "吉隆坡与雪兰莪厨房装修服务",
          "根据真实现场规划厨房动线、收纳、橱柜、台面、家电点位、给排水、湿作状况与书面报价范围。"
        ],
        "strictMetadataTitle": true
      },
      {
        "path": "/en/services/kitchen",
        "expected": "Kitchen Renovation Kuala Lumpur & Selangor | FLASH CAST",
        "strictMetadataTitle": true
      }
    ],
    "desiredFields": {
      "title_zh": "吉隆坡与雪兰莪定制橱柜及厨房装修",
      "excerpt_zh": "根据真实现场规划定制橱柜、台面、厨房收纳与干湿厨房动线；再核对家电点位、给排水、材料、五金、安装条件及书面报价范围。"
    },
    "rollbackPublicPaths": [
      {
        "path": "/zh/services/kitchen",
        "expected": "吉隆坡与雪兰莪厨房装修｜橱柜、台面与干湿厨房规划 | FLASH CAST",
        "requiredPhrases": [
          "吉隆坡与雪兰莪厨房装修服务",
          "根据真实现场规划厨房动线、收纳、橱柜、台面、家电点位、给排水、湿作状况与书面报价范围。"
        ],
        "forbidden": [
          "吉隆坡与雪兰莪定制橱柜及厨房装修",
          "根据真实现场规划定制橱柜、台面、厨房收纳与干湿厨房动线；再核对家电点位、给排水、材料、五金、安装条件及书面报价范围。"
        ],
        "strictMetadataTitle": true
      },
      {
        "path": "/en/services/kitchen",
        "expected": "Kitchen Renovation Kuala Lumpur & Selangor | FLASH CAST",
        "strictMetadataTitle": true
      }
    ]
  },
  "paid-three-page-renovation-exact-fields-v1": {
    "taskId": "fc-20261010-paid-three-page-exact-publication-followthrough-v1",
    "candidateVersion": "paid-three-page-exact-native-diff-v1-20261010",
    "qaEvidenceVersion": "paid-three-page-exact-native-diff-v1-20261010",
    "actionId": "paid-three-page-renovation-exact-fields-v1",
    "actionClass": "cms_write",
    "scope": "flashcast.com.my:services/0d947129-0595-43ef-baa1-0fd9d8b870e6:title_zh,excerpt_zh",
    "recordId": "0d947129-0595-43ef-baa1-0fd9d8b870e6",
    "slug": "renovation",
    "contentType": "service",
    "table": "services",
    "keyField": "id",
    "exactPatchOnly": true,
    "rollbackAllowed": true,
    "requiresParentRun": true,
    "expectedUpdatedAt": "2026-09-26T18:10:33.566853+00:00",
    "status": "published",
    "baselineProjectionFields": [
      "id",
      "slug",
      "title_zh",
      "title_en",
      "excerpt_zh",
      "excerpt_en",
      "content_zh",
      "content_en",
      "image_url",
      "alt_zh",
      "alt_en",
      "suitable_for_zh",
      "suitable_for_en",
      "common_projects_zh",
      "common_projects_en",
      "process_steps_zh",
      "process_steps_en",
      "scope_items_zh",
      "scope_items_en",
      "faqs_zh",
      "faqs_en",
      "seo_title_zh",
      "seo_title_en",
      "seo_description_zh",
      "seo_description_en",
      "status",
      "sort_order",
      "created_at",
      "updated_at",
      "version"
    ],
    "baselineFieldsSha256": "539359c220e67c890ea3d7b8782af817b9b3be09e4551cb4b8ee2b3e1b850ef0",
    "desiredFieldsSha256": "a4ad4f05fea8755af0d23e4f83b37ec406af181c8e113ecb7d6f155955c291b3",
    "rollbackFieldsSha256": "475391da36c20006e22446d954f8082bad8987c9fea74390feeb03bed4cd9765",
    "changedFields": [
      "title_zh",
      "excerpt_zh"
    ],
    "retainedProjectionFields": [
      "id",
      "slug",
      "title_en",
      "excerpt_en",
      "content_zh",
      "content_en",
      "image_url",
      "alt_zh",
      "alt_en",
      "suitable_for_zh",
      "suitable_for_en",
      "common_projects_zh",
      "common_projects_en",
      "process_steps_zh",
      "process_steps_en",
      "scope_items_zh",
      "scope_items_en",
      "faqs_zh",
      "faqs_en",
      "seo_title_zh",
      "seo_title_en",
      "seo_description_zh",
      "seo_description_en",
      "status",
      "sort_order",
      "created_at"
    ],
    "retainedFieldsSha256": "bced5ffb8776c48b564578af07c6fd1cdc29bb3236b8e92d713c6df8a47ac3fc",
    "sourceCandidatePath": "drafts/publishing/fc-20261010-paid-three-page-exact-publication-followthrough-v1/renovation.typed-preview-input.json",
    "sourceCandidateSha256": "af3473381df63661aca227b6ee94de4f873682b4290e6d6bf52b46d8949d06b5",
    "publicPaths": [
      {
        "path": "/zh/services/renovation",
        "expected": "吉隆坡住宅装修与旧屋翻新 | FLASH CAST",
        "requiredPhrases": [
          "吉隆坡公寓装修、住宅翻新与旧屋装修",
          "为吉隆坡、雪兰莪与巴生谷业主规划公寓装修、有地住宅及旧屋翻新，整理空间、材料与施工协调范围。先准备照片、面积、屋况、管理处要求和装修目标，再确认范围与报价方向。"
        ],
        "forbidden": [
          "吉隆坡住宅装修与旧屋翻新规划",
          "FLASH CAST 为吉隆坡、雪兰莪与巴生谷业主提供住宅装修、旧屋翻新、空间规划、材料建议与施工协调支持。先整理照片、面积、屋况和装修目标，再确认范围与报价方向。"
        ],
        "strictMetadataTitle": true
      },
      {
        "path": "/en/services/renovation",
        "expected": "Residential Renovation Kuala Lumpur & Selangor | FLASH CAST",
        "strictMetadataTitle": true
      }
    ],
    "desiredFields": {
      "title_zh": "吉隆坡公寓装修、住宅翻新与旧屋装修",
      "excerpt_zh": "为吉隆坡、雪兰莪与巴生谷业主规划公寓装修、有地住宅及旧屋翻新，整理空间、材料与施工协调范围。先准备照片、面积、屋况、管理处要求和装修目标，再确认范围与报价方向。"
    },
    "rollbackPublicPaths": [
      {
        "path": "/zh/services/renovation",
        "expected": "吉隆坡住宅装修与旧屋翻新 | FLASH CAST",
        "requiredPhrases": [
          "吉隆坡住宅装修与旧屋翻新规划",
          "FLASH CAST 为吉隆坡、雪兰莪与巴生谷业主提供住宅装修、旧屋翻新、空间规划、材料建议与施工协调支持。先整理照片、面积、屋况和装修目标，再确认范围与报价方向。"
        ],
        "forbidden": [
          "吉隆坡公寓装修、住宅翻新与旧屋装修",
          "为吉隆坡、雪兰莪与巴生谷业主规划公寓装修、有地住宅及旧屋翻新，整理空间、材料与施工协调范围。先准备照片、面积、屋况、管理处要求和装修目标，再确认范围与报价方向。"
        ],
        "strictMetadataTitle": true
      },
      {
        "path": "/en/services/renovation",
        "expected": "Residential Renovation Kuala Lumpur & Selangor | FLASH CAST",
        "strictMetadataTitle": true
      }
    ]
  }
};

const stableValue = (value) => Array.isArray(value) ? value.map(stableValue)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])])) : value ?? null;
const freeze = (value) => {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
for (const [name, binding] of Object.entries(bindings)) {
  const fields = Object.keys(binding.desiredFields).sort();
  const hash = createHash("sha256").update(JSON.stringify(stableValue(binding.desiredFields))).digest("hex");
  if (name !== binding.actionId || JSON.stringify(fields) !== JSON.stringify([...binding.changedFields].sort())
      || hash !== binding.desiredFieldsSha256) throw new Error("Exact three-page publisher binding differs.");
}

export const lockedPaidThreePageCandidates = freeze(bindings);
