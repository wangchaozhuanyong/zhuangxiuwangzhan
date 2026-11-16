# 马来语翻译交稿包（7 个服务页）

> 用途：直接发给翻译方。每个字段下面是英文原文，译稿填在 `MS:` 后面。
> 翻译完成后按字段名回填到 Supabase `services` 表，或在后台逐项录入。

## 交稿要求

1. 每个字段都必须有值。`hasCompleteMalayContent` 会检查完整性：英文有内容的字段，马来语必须有对应内容，否则该页不会进入 sitemap。
2. `seo_title_ms` 控制在 60 字符内，`seo_description_ms` 约 150 字符。
3. 术语请统一使用第 2 节的对照表，不要各自发挥。
4. 不要保留英文原文，也不要中英马混排。
5. 保留原文里的数字、尺寸、单位，不要改写。

## 1. 术语对照表

| 英文 | 马来语 |
|---|---|
| renovation | pengubahsuaian |
| waterproofing | kalis air |
| plaster ceiling | siling plaster |
| partition wall | dinding partition |
| wet and dry kitchen | dapur basah dan kering |
| custom cabinet | kabinet custom |
| built-in wardrobe | almari pakaian built-in |
| worktop / countertop | permukaan meja / countertop |
| downlight | lampu siling |
| access panel | panel akses |
| quotation | sebut harga |
| itemised quotation | sebut harga terperinci |
| site visit | lawatan tapak |
| handover | serahan |
| handover testing | ujian serahan |
| defect | kecacatan |
| after-sales | selepas jualan |
| warranty | jaminan |
| scope of work | skop kerja |
| exclusion | pengecualian |
| substrate | lapisan asas |
| grouting | kerja grout |
| hollow tile | jubin berongga |
| screed | lapisan simen |
| rewiring | pendawaian semula |
| concealed pipe | paip tersembunyi |
| consumer unit | papan suis utama |
| point (electrical) | titik (elektrik) |
| mechanical key override | kunci mekanikal manual |
| power failure | gangguan bekalan elektrik |
| floor loading | beban lantai |
| ventilation | pengudaraan |
| fire compartmentation | pembahagian kalis api |
| production downtime | masa henti pengeluaran |
| industrial unit | unit industri |
| condo / condominium | kondominium |
| landed house / terrace house | rumah teres |
| management office / JMB | pejabat pengurusan / JMB |
| deposit | deposit |

## 2. 待译内容

---

### `/services/digital-lock`（电子锁）

**`title_ms`** — 服务标题（列表与 H1 用）

```
EN: Digital Lock Supply & Installation
MS: 
```

**`seo_title_ms`** — SEO 标题（≤ 60 字符）

```
EN: Digital Lock Installation KL | Supply & Install | FLASH CAST
MS: 
```

**`seo_description_ms`** — SEO 描述（约 150 字符）

```
EN: Digital lock supply and installation for condos and landed homes in Kuala Lumpur and Selangor. Door compatibility check, existing lock replacement, user enrolment and handover testing.
MS: 
```

**`excerpt_ms`** — 摘要（列表卡片用）

```
EN: Digital lock supply and installation for condos and landed homes across Kuala Lumpur and Selangor, including door compatibility checks, replacement of the existing lock and handover testing with every user enrolled.
MS: 
```

**`content_ms`** — 正文描述

```
EN: A digital lock is only reliable when the door suits it. Before recommending a model, we check the door thickness, the existing mortise or rim lock type, the door material, whether the door closes squarely and whether a gate or grille interferes with the handle side. Condo main doors, landed-house timber doors, glass doors and metal gates each need a different fixing and wiring approach. Installation covers removing the old lock, preparing the door if the cut-out needs adjustment, mounting the new lock, wiring any external keypad or camera, and configuring fingerprints, PINs, cards or app access for each user. At handover we test locking and unlocking from both sides, check the mechanical key override and the emergency power option, and confirm what happens during a power failure. After-sales terms are stated on the quotation.
MS: 
```

**`scope_items_ms`** — 施工范围清单（逐条）

```
EN 1: Door thickness and lock body compatibility check
MS 1: 
```
```
EN 2: Removal of the existing mechanical or digital lock
MS 2: 
```
```
EN 3: Fingerprint, PIN, card and app access configuration
MS 3: 
```
```
EN 4: External keypad or camera wiring where applicable
MS 4: 
```
```
EN 5: Mechanical key override and emergency power check
MS 5: 
```
```
EN 6: User enrolment for every household member
MS 6: 
```
```
EN 7: Handover test from both sides of the door
MS 7: 
```

**`faqs_ms`** — 常见问题（Q + A 逐条）

```
EN Q1: Will the lock fit my existing door?
EN A1: It depends on door thickness, the existing lock body and whether the cut-out can be adjusted. We check these on site before recommending a model, and confirm the approach in writing before any drilling.
MS Q1: 
MS A1: 
```
```
EN Q2: Can I keep using a mechanical key?
EN A2: Most models we install keep a mechanical override. We test it at handover and show you where it is stored.
MS Q2: 
MS A2: 
```
```
EN Q3: What happens during a power failure?
EN A3: Behaviour differs by model — some keep the last state, others fail open or fail locked. We confirm the specific behaviour of the installed unit at handover.
MS Q3: 
MS A3: 
```

**`process_steps_ms`** — 施工流程（步骤 + 说明逐条）

```
EN title1: Door Check
EN desc1: Confirm door thickness, lock type, material, closing alignment and any gate or grille interference.
MS title1: 
MS desc1: 
```
```
EN title2: Model Matching
EN desc2: Match a lock to the door and to how the household actually uses it — fingerprint, PIN, card or app.
MS title2: 
MS desc2: 
```
```
EN title3: Removal and Preparation
EN desc3: Remove the old lock and adjust the cut-out only where the door allows it.
MS title3: 
MS desc3: 
```
```
EN title4: Installation and Wiring
EN desc4: Mount the lock, wire external keypad or camera, and confirm the mechanical override still works.
MS title4: 
MS desc4: 
```
```
EN title5: Enrolment and Handover
EN desc5: Enrol every user, test both sides, explain power-failure behaviour and record the after-sales terms.
MS title5: 
MS desc5: 
```

**`suitable_for_ms`** — 适合对象（逐条）

```
EN 1: Condo owners replacing the original mechanical lock
MS 1: 
```
```
EN 2: Landed-house owners who want keyless entry for family members
MS 2: 
```
```
EN 3: Owners who need temporary access codes for contractors or tenants
MS 3: 
```
```
EN 4: Households that want an audit trail of who opened the door and when
MS 4: 
```

**`common_projects_ms`** — 常见项目类型（逐条）

```
EN 1: Condo main door lock replacement
MS 1: 
```
```
EN 2: Landed-house main door and side gate
MS 2: 
```
```
EN 3: Digital lock for a rented unit with tenant turnover
MS 3: 
```
```
EN 4: Office or shoplot entry with staff access control
MS 4: 
```
```
EN 5: Replacement of a failed lock installed by another party
MS 5: 
```

---

### `/services/painting`（油漆）

**`title_ms`** — 服务标题（列表与 H1 用）

```
EN: Painting Works
MS: 
```

**`seo_title_ms`** — SEO 标题（≤ 60 字符）

```
EN: Painting Service KL | Interior & Exterior | FLASH CAST
MS: 
```

**`seo_description_ms`** — SEO 描述（约 150 字符）

```
EN: Interior and exterior painting in Kuala Lumpur and Selangor. Surface preparation, crack repair, primer and finish coats, with protection for floors and fittings.
MS: 
```

**`excerpt_ms`** — 摘要（列表卡片用）

```
EN: Interior and exterior painting across Kuala Lumpur and Selangor, covering surface preparation, crack and patch repair, priming, finish coats and protection of floors, fittings and furniture.
MS: 
```

**`content_ms`** — 正文描述

```
EN: Paint work lasts as long as the preparation underneath it. We start by checking the wall condition: hairline cracks, damp patches, peeling or chalky old paint, and any area that has been patched before. Cracked or hollow plaster is cut back and filled, damp areas are identified before painting rather than painted over, and old glossy or chalky surfaces are sanded so the new coat can bond. The sequence is typically putty or skim coat where needed, primer, then two finish coats, with drying time between each. Floors, door frames, switches, built-in cabinets and furniture are masked or covered before work starts. Exterior work depends on weather, so we plan around the rainy periods rather than promising a fixed completion date.
MS: 
```

**`scope_items_ms`** — 施工范围清单（逐条）

```
EN 1: Wall and ceiling surface inspection
MS 1: 
```
```
EN 2: Crack cutting, filling and patching
MS 2: 
```
```
EN 3: Putty or skim coat where required
MS 3: 
```
```
EN 4: Primer application
MS 4: 
```
```
EN 5: Two finish coats in the selected colour
MS 5: 
```
```
EN 6: Masking and protection of floors and fittings
MS 6: 
```
```
EN 7: Post-work cleaning of the painted area
MS 7: 
```

**`faqs_ms`** — 常见问题（Q + A 逐条）

```
EN Q1: How many coats are included?
EN A1: The standard scope is primer plus two finish coats. Where the existing colour is much darker or the surface is porous, an additional coat may be needed and will be listed separately.
MS Q1: 
MS A1: 
```
```
EN Q2: Can you match my existing colour?
EN A2: We can match to a colour code or a physical sample. Slight variation is normal between different paint batches, so we recommend confirming the reference before the order is placed.
MS Q2: 
MS A2: 
```
```
EN Q3: Can painting be done while we live in the unit?
EN A3: Yes for most interior work, if the rooms are done in sequence. We agree which rooms are out of use each day and cover furniture accordingly.
MS Q3: 
MS A3: 
```

**`process_steps_ms`** — 施工流程（步骤 + 说明逐条）

```
EN title1: Surface Inspection
EN desc1: Check cracks, damp, peeling and previous patches before quoting the preparation work.
MS title1: 
MS desc1: 
```
```
EN title2: Protection
EN desc2: Cover floors, mask frames, switches and built-ins before any sanding starts.
MS title2: 
MS desc2: 
```
```
EN title3: Preparation
EN desc3: Cut back and fill hollow plaster, sand glossy or chalky surfaces, apply putty where needed.
MS title3: 
MS desc3: 
```
```
EN title4: Primer and Finish
EN desc4: Apply primer then two finish coats, keeping the specified drying time between coats.
MS title4: 
MS desc4: 
```
```
EN title5: Touch-up and Handover
EN desc5: Walk the area under daylight, touch up marks and confirm the colour reference used.
MS title5: 
MS desc5: 
```

**`suitable_for_ms`** — 适合对象（逐条）

```
EN 1: Owners repainting before moving in or before renting out
MS 1: 
```
```
EN 2: Households refreshing walls after years without repainting
MS 2: 
```
```
EN 3: Offices and shops that need painting outside business hours
MS 3: 
```
```
EN 4: Owners preparing a unit for sale or handover
MS 4: 
```

**`common_projects_ms`** — 常见项目类型（逐条）

```
EN 1: Whole-unit interior repainting
MS 1: 
```
```
EN 2: Feature wall and colour change
MS 2: 
```
```
EN 3: Exterior wall repainting for landed homes
MS 3: 
```
```
EN 4: Office and shoplot repainting at night
MS 4: 
```
```
EN 5: Ceiling repainting after water damage repair
MS 5: 
```

---

### `/services/tiling`（铺砖）

**`title_ms`** — 服务标题（列表与 H1 用）

```
EN: Tiling Works
MS: 
```

**`seo_title_ms`** — SEO 标题（≤ 60 字符）

```
EN: Tiling Works KL | Floor & Wall Tiles | FLASH CAST
MS: 
```

**`seo_description_ms`** — SEO 描述（约 150 字符）

```
EN: Floor and wall tiling in Kuala Lumpur and Selangor. Substrate check, levelling, waterproofing coordination, cutting, laying and grouting with hollow-tile inspection.
MS: 
```

**`excerpt_ms`** — 摘要（列表卡片用）

```
EN: Floor and wall tiling across Kuala Lumpur and Selangor, covering substrate inspection, levelling, waterproofing coordination, cutting, laying, grouting and hollow-tile checks at handover.
MS: 
```

**`content_ms`** — 正文描述

```
EN: Tiling fails at the substrate, not at the tile. Before laying, we check whether the existing floor is level, whether the old tile or screed needs removal, and whether the area is wet enough to require waterproofing underneath. Hollow or drummy existing tiles are removed rather than tiled over, because they will loosen the new layer. Layout is set out from a datum line so cuts land where they are least visible, and large-format tiles need a flatter substrate and a different adhesive than standard sizes. Grout joints are kept consistent, expansion joints are allowed at the perimeter, and after laying we check for hollow spots by tapping. Tile supply can be owner-supplied or arranged by us, but the tile size, batch and shade should be confirmed before work starts.
MS: 
```

**`scope_items_ms`** — 施工范围清单（逐条）

```
EN 1: Substrate level and hollow-tile inspection
MS 1: 
```
```
EN 2: Removal of existing tiles and screed
MS 2: 
```
```
EN 3: Floor levelling and surface preparation
MS 3: 
```
```
EN 4: Waterproofing coordination in wet areas
MS 4: 
```
```
EN 5: Tile layout setting and cutting
MS 5: 
```
```
EN 6: Laying with size-appropriate adhesive
MS 6: 
```
```
EN 7: Grouting, cleaning and hollow-tile check
MS 7: 
```

**`faqs_ms`** — 常见问题（Q + A 逐条）

```
EN Q1: Can you tile over existing tiles?
EN A1: Only where the existing tile is solid, level and the added height does not affect doors or thresholds. Hollow or drummy tiles are removed first, because tiling over them transfers the problem to the new layer.
MS Q1: 
MS A1: 
```
```
EN Q2: Do I need waterproofing before tiling?
EN A2: Wet areas such as bathrooms, kitchens and balconies normally do. We check the area and confirm whether waterproofing is part of the scope before quoting.
MS Q2: 
MS A2: 
```
```
EN Q3: Can I supply my own tiles?
EN A3: Yes. Confirm the size, batch and shade before the order, and allow spare pieces for cuts and future repairs.
MS Q3: 
MS A3: 
```

**`process_steps_ms`** — 施工流程（步骤 + 说明逐条）

```
EN title1: Site and Substrate Check
EN desc1: Check level, existing tile condition, hollow spots and whether the area needs waterproofing.
MS title1: 
MS desc1: 
```
```
EN title2: Removal
EN desc2: Hack out old tiles and screed where required, then clear and level the base.
MS title2: 
MS desc2: 
```
```
EN title3: Layout Setting
EN desc3: Set out from a datum so cuts fall in the least visible positions and joints stay consistent.
MS title3: 
MS desc3: 
```
```
EN title4: Laying
EN desc4: Apply the correct adhesive for the tile size, lay, level and keep expansion joints at the perimeter.
MS title4: 
MS desc4: 
```
```
EN title5: Grouting and Inspection
EN desc5: Grout, clean, then tap-check for hollow tiles and record any replacement needed.
MS title5: 
MS desc5: 
```

**`suitable_for_ms`** — 适合对象（逐条）

```
EN 1: Owners replacing worn or hollow floor tiles
MS 1: 
```
```
EN 2: Renovations where the wet area needs re-waterproofing
MS 2: 
```
```
EN 3: Shops and offices that need a durable floor before opening
MS 3: 
```
```
EN 4: Owners changing from carpet or vinyl to tile
MS 4: 
```

**`common_projects_ms`** — 常见项目类型（逐条）

```
EN 1: Living and dining floor tiling
MS 1: 
```
```
EN 2: Bathroom and kitchen wall and floor tiling
MS 2: 
```
```
EN 3: Balcony and outdoor area tiling
MS 3: 
```
```
EN 4: Shoplot and office floor tiling
MS 4: 
```
```
EN 5: Replacement of hollow or cracked tiles
MS 5: 
```

---

### `/services/ceiling`（吊顶）

**`title_ms`** — 服务标题（列表与 H1 用）

```
EN: Plaster Ceiling and Partition
MS: 
```

**`seo_title_ms`** — SEO 标题（≤ 60 字符）

```
EN: Plaster Ceiling KL | Ceiling & Light Trough | FLASH CAST
MS: 
```

**`seo_description_ms`** — SEO 描述（约 150 字符）

```
EN: Plaster ceiling installation in Kuala Lumpur and Selangor. Flat and cove ceilings, light troughs, access panels and coordination with air-conditioning and downlights.
MS: 
```

**`excerpt_ms`** — 摘要（列表卡片用）

```
EN: Plaster ceiling works across Kuala Lumpur and Selangor, covering flat and cove ceilings, light troughs, access panels and coordination with air-conditioning, wiring and downlight positions.
MS: 
```

**`content_ms`** — 正文描述

```
EN: A plaster ceiling hides the services above it, which is exactly why its layout has to be agreed before the frame goes up. We mark the finished ceiling height first, then locate the air-conditioner units, the fan coil access panels, the downlight positions and any light trough. Units that cannot be serviced after the ceiling closes are the most common regret, so every concealed item gets an access panel. Metal framing is fixed to the slab or to the wall with the correct spacing, and the plasterboard is screwed and jointed before skimming. Corners and shadow gaps need a straight datum, otherwise the lines read crooked from across the room. If the room has a beam or a structural drop, the ceiling design usually works around it rather than hiding it.
MS: 
```

**`scope_items_ms`** — 施工范围清单（逐条）

```
EN 1: Finished ceiling height setting
MS 1: 
```
```
EN 2: Metal framing installation
MS 2: 
```
```
EN 3: Plasterboard fixing and jointing
MS 3: 
```
```
EN 4: Cove and light trough construction
MS 4: 
```
```
EN 5: Access panel for air-conditioning units
MS 5: 
```
```
EN 6: Skim coat, sanding and painting
MS 6: 
```
```
EN 7: Downlight and wiring coordination
MS 7: 
```

**`faqs_ms`** — 常见问题（Q + A 逐条）

```
EN Q1: How much height will the ceiling lose?
EN A1: It depends on what has to be concealed above it. We measure the air-conditioning and pipe positions first, then confirm the achievable finished height before framing.
MS Q1: 
MS A1: 
```
```
EN Q2: Will I be able to service the air-conditioner?
EN A2: Yes, provided an access panel is included. We mark every concealed unit that needs servicing and confirm the panel positions with you.
MS Q2: 
MS A2: 
```
```
EN Q3: Can the existing ceiling be repaired instead of replaced?
EN A3: Local damage such as a water stain or a small sag can sometimes be cut out and patched. Where the framing has failed or the board is soft across a large area, replacement is usually the more reliable option.
MS Q3: 
MS A3: 
```

**`process_steps_ms`** — 施工流程（步骤 + 说明逐条）

```
EN title1: Height and Layout Marking
EN desc1: Fix the finished ceiling height and mark services, downlights and access panels.
MS title1: 
MS desc1: 
```
```
EN title2: Framing
EN desc2: Install metal framing at the correct spacing, anchored to slab or wall.
MS title2: 
MS desc2: 
```
```
EN title3: Board and Jointing
EN desc3: Fix plasterboard, tape and joint the seams, and prepare for skimming.
MS title3: 
MS desc3: 
```
```
EN title4: Skim and Sand
EN desc4: Apply skim coat, sand flat and check the lines under light.
MS title4: 
MS desc4: 
```
```
EN title5: Paint and Handover
EN desc5: Prime and paint, then confirm access panels open and lights sit as agreed.
MS title5: 
MS desc5: 
```

**`suitable_for_ms`** — 适合对象（逐条）

```
EN 1: Renovations that need to conceal new wiring or air-conditioning
MS 1: 
```
```
EN 2: Owners who want cove lighting or a feature ceiling
MS 2: 
```
```
EN 3: Offices that need a clean ceiling before fit-out
MS 3: 
```
```
EN 4: Owners replacing a sagging or water-stained ceiling
MS 4: 
```

**`common_projects_ms`** — 常见项目类型（逐条）

```
EN 1: Whole-unit flat plaster ceiling
MS 1: 
```
```
EN 2: Cove ceiling with concealed lighting
MS 2: 
```
```
EN 3: Ceiling replacement after a water leak
MS 3: 
```
```
EN 4: Office ceiling with access panels
MS 4: 
```
```
EN 5: Ceiling and light trough for a feature living area
MS 5: 
```

---

### `/services/partition`（隔断）

**`title_ms`** — 服务标题（列表与 H1 用）

```
EN: Partition Works
MS: 
```

**`seo_title_ms`** — SEO 标题（≤ 60 字符）

```
EN: Partition Works KL | Plasterboard & Glass | FLASH CAST
MS: 
```

**`seo_description_ms`** — SEO 描述（约 150 字符）

```
EN: Partition walls and dividers in Kuala Lumpur and Selangor. Plasterboard, glass and aluminium options with acoustic, fire and service coordination considered.
MS: 
```

**`excerpt_ms`** — 摘要（列表卡片用）

```
EN: Partition walls and dividers across Kuala Lumpur and Selangor, in plasterboard, glass and aluminium, with acoustic performance, fire requirements and concealed services considered before the frame is fixed.
MS: 
```

**`content_ms`** — 正文描述

```
EN: A partition is a decision about sound, privacy and services as much as about walls. Before fixing the frame, we confirm what the room is used for — a meeting room, a bedroom, a consultation room or a store — because that decides whether a single plasterboard layer is enough or whether insulation and a double layer are needed. Glass partitions give light and visibility but carry different acoustic and privacy behaviour, and they need framing that can take the weight. Any concealed wiring, network cable or plumbing inside the wall has to be routed and marked before the boards go on, because reopening a finished partition is expensive. Doors, access panels and any wall-mounted equipment also have to be located at this stage. Fire-rated construction, where the building requires it, changes the board specification and must be confirmed with the building management.
MS: 
```

**`scope_items_ms`** — 施工范围清单（逐条）

```
EN 1: Partition layout and door position setting
MS 1: 
```
```
EN 2: Metal stud framing
MS 2: 
```
```
EN 3: Insulation where specified
MS 3: 
```
```
EN 4: Single or double layer plasterboard
MS 4: 
```
```
EN 5: Tape, joint and skim finish
MS 5: 
```
```
EN 6: Glass or aluminium partition options
MS 6: 
```
```
EN 7: Concealed wiring and plumbing coordination
MS 7: 
```

**`faqs_ms`** — 常见问题（Q + A 逐条）

```
EN Q1: How much sound will it block?
EN A1: It depends on the construction — a single board layer, insulation and a double layer all behave differently. Tell us what the room is used for and we will propose a build-up rather than quote a wall type blindly.
MS Q1: 
MS A1: 
```
```
EN Q2: Can I hang things on the partition?
EN A2: Yes, if the fixing points are planned before boarding. Heavy items need backing or additional framing, which is much easier to add before the boards go on.
MS Q2: 
MS A2: 
```
```
EN Q3: Do I need approval for a partition?
EN A3: For condo and office units, check with the management office first — partitions on or near structural elements and any fire-rated requirement usually need approval.
MS Q3: 
MS A3: 
```

**`process_steps_ms`** — 施工流程（步骤 + 说明逐条）

```
EN title1: Purpose and Requirement Check
EN desc1: Confirm the room use, acoustic need and any fire requirement from the building.
MS title1: 
MS desc1: 
```
```
EN title2: Layout and Service Routing
EN desc2: Mark the partition line, door position and route any concealed wiring or plumbing.
MS title2: 
MS desc2: 
```
```
EN title3: Framing
EN desc3: Install the frame with the correct stud spacing and fixing for the wall type.
MS title3: 
MS desc3: 
```
```
EN title4: Boarding and Insulation
EN desc4: Add insulation where agreed, then board, tape and joint.
MS title4: 
MS desc4: 
```
```
EN title5: Finishing and Handover
EN desc5: Skim, sand, paint or fix glass, then check doors, panels and acoustic result.
MS title5: 
MS desc5: 
```

**`suitable_for_ms`** — 适合对象（逐条）

```
EN 1: Offices adding meeting rooms or private cabins
MS 1: 
```
```
EN 2: Owners splitting a large room into two usable spaces
MS 2: 
```
```
EN 3: Clinics and studios that need acoustic separation
MS 3: 
```
```
EN 4: Shops that need a stockroom or staff area
MS 4: 
```

**`common_projects_ms`** — 常见项目类型（逐条）

```
EN 1: Office meeting room partition
MS 1: 
```
```
EN 2: Bedroom or study partition in a condo
MS 2: 
```
```
EN 3: Glass partition for a reception area
MS 3: 
```
```
EN 4: Stockroom partition in a shoplot
MS 4: 
```
```
EN 5: Partition with a concealed sliding door
MS 5: 
```

---

### `/services/electrical-plumbing`（水电）

**`title_ms`** — 服务标题（列表与 H1 用）

```
EN: Electrical and Plumbing Works
MS: 
```

**`seo_title_ms`** — SEO 标题（≤ 60 字符）

```
EN: Electrical & Plumbing Works KL | FLASH CAST
MS: 
```

**`seo_description_ms`** — SEO 描述（约 150 字符）

```
EN: Electrical and plumbing works in Kuala Lumpur and Selangor. Rewiring, point additions, pipe replacement, leak repair and coordination with renovation trades.
MS: 
```

**`excerpt_ms`** — 摘要（列表卡片用）

```
EN: Electrical and plumbing works across Kuala Lumpur and Selangor, covering rewiring, additional points, pipe replacement, leak repair and coordination with the rest of the renovation sequence.
MS: 
```

**`content_ms`** — 正文描述

```
EN: Electrical and plumbing are the trades that are hardest to correct after the finishes go on. We start by mapping what exists: the incoming supply capacity, the consumer unit, which circuits serve which rooms, the water pressure, and where the stop valve and floor traps are. Additions are then priced per point so the scope is countable rather than estimated. Older properties frequently need more than new points — aluminium wiring, an undersized incoming supply, corroded galvanised pipes or a bathroom without a proper trap all surface during the check. Work is sequenced with the other trades: first fix before the plaster and tiles, second fix after painting. Any concealed route is photographed before it is closed up, so a future repair does not require guesswork.
MS: 
```

**`scope_items_ms`** — 施工范围清单（逐条）

```
EN 1: Supply capacity and circuit check
MS 1: 
```
```
EN 2: Rewiring and new circuit installation
MS 2: 
```
```
EN 3: Additional power, lighting and data points
MS 3: 
```
```
EN 4: Pipe replacement and re-routing
MS 4: 
```
```
EN 5: Leak detection and repair
MS 5: 
```
```
EN 6: Water pressure and trap inspection
MS 6: 
```
```
EN 7: Concealed route photography before closing
MS 7: 
```

**`faqs_ms`** — 常见问题（Q + A 逐条）

```
EN Q1: How are electrical works priced?
EN A1: Per point, so the scope is countable. The quotation lists each point type separately; concealed route length and any consumer unit upgrade are listed as their own items.
MS Q1: 
MS A1: 
```
```
EN Q2: Do you do partial work only?
EN A2: We can take a defined scope, such as a bathroom re-pipe or a single circuit addition, provided the existing installation is safe to connect to. If the check finds an unsafe condition, that has to be resolved first.
MS Q2: 
MS A2: 
```
```
EN Q3: Will you break the walls?
EN A3: Some routing needs chasing, and that is agreed before work starts. Where a route can avoid chasing, we will propose it, but it may change the point positions.
MS Q3: 
MS A3: 
```

**`process_steps_ms`** — 施工流程（步骤 + 说明逐条）

```
EN title1: Existing Condition Check
EN desc1: Check supply capacity, circuits, water pressure, pipe material and trap condition.
MS title1: 
MS desc1: 
```
```
EN title2: Point Listing
EN desc2: List every new or relocated point so the scope is countable and priced per point.
MS title2: 
MS desc2: 
```
```
EN title3: First Fix
EN desc3: Route and fix conduits and pipes before plaster, tiles or ceiling go on.
MS title3: 
MS desc3: 
```
```
EN title4: Testing Before Closing
EN desc4: Pressure-test plumbing and test circuits, photograph concealed routes.
MS title4: 
MS desc4: 
```
```
EN title5: Second Fix and Handover
EN desc5: Fit accessories after finishes, test everything and hand over the record.
MS title5: 
MS desc5: 
```

**`suitable_for_ms`** — 适合对象（逐条）

```
EN 1: Older properties with aluminium wiring or low supply capacity
MS 1: 
```
```
EN 2: Renovations adding sockets, lighting circuits or water points
MS 2: 
```
```
EN 3: Owners with recurring leaks or low water pressure
MS 3: 
```
```
EN 4: Kitchen and bathroom upgrades that need pipe relocation
MS 4: 
```

**`common_projects_ms`** — 常见项目类型（逐条）

```
EN 1: Whole-unit rewiring
MS 1: 
```
```
EN 2: Additional power and lighting points
MS 2: 
```
```
EN 3: Bathroom and kitchen pipe replacement
MS 3: 
```
```
EN 4: Leak detection and repair
MS 4: 
```
```
EN 5: Consumer unit upgrade
MS 5: 
```

---

### `/services/factory-renovation`（厂房装修）

**`title_ms`** — 服务标题（列表与 H1 用）

```
EN: Factory and Industrial Renovation
MS: 
```

**`seo_title_ms`** — SEO 标题（≤ 60 字符）

```
EN: Factory Renovation Malaysia | FLASH CAST
MS: 
```

**`seo_description_ms`** — SEO 描述（约 150 字符）

```
EN: Factory and industrial unit renovation in Malaysia. Floor loading, ventilation, electrical capacity, fire requirements and phasing around production downtime.
MS: 
```

**`excerpt_ms`** — 摘要（列表卡片用）

```
EN: Factory and industrial unit renovation in Malaysia, covering floor loading, ventilation, electrical capacity, fire requirements and phasing planned around production downtime.
MS: 
```

**`content_ms`** — 正文描述

```
EN: Industrial work is judged on whether production can restart, not on how the space looks. We begin with the operational facts: what the floor has to carry, whether forklifts or heavy racks will run on it, how much air has to move and where it goes, what electrical capacity the machinery needs, and which areas cannot be shut down at all. Floor systems, coatings and hardstanding are selected against that load and traffic rather than by appearance. Ventilation and extraction are sized for the process, not for comfort. Where the building has fire requirements, the compartmentation, detection and escape routes constrain the layout before any finish is discussed. Because most factories cannot stop for weeks, work is phased by zone so production continues in the unaffected bays, and each zone is handed back in a usable state before the next one starts.
MS: 
```

**`scope_items_ms`** — 施工范围清单（逐条）

```
EN 1: Floor loading and traffic assessment
MS 1: 
```
```
EN 2: Floor coating, hardstanding and repair
MS 2: 
```
```
EN 3: Ventilation and extraction sizing
MS 3: 
```
```
EN 4: Electrical capacity review and upgrade
MS 4: 
```
```
EN 5: Fire compartmentation and escape coordination
MS 5: 
```
```
EN 6: Internal office and welfare area construction
MS 6: 
```
```
EN 7: Zone phasing plan for live production
MS 7: 
```

**`faqs_ms`** — 常见问题（Q + A 逐条）

```
EN Q1: Can work be done without stopping production?
EN A1: In most cases yes, if the work is phased by zone and the services can be isolated per zone. We plan the sequence around your production schedule and confirm which areas can be released.
MS Q1: 
MS A1: 
```
```
EN Q2: Do you handle fire and authority requirements?
EN A2: We coordinate with the building and the relevant parties, and the scope states clearly which submissions are included. Anything requiring professional certification is identified before work starts, not after.
MS Q2: 
MS A2: 
```
```
EN Q3: How is industrial work priced?
EN A3: By measured area and by item, not as a single lump sum. Floor area, coating system, racking, services and phasing each appear separately so you can compare and phase the budget.
MS Q3: 
MS A3: 
```

**`process_steps_ms`** — 施工流程（步骤 + 说明逐条）

```
EN title1: Operational Review
EN desc1: Confirm loads, traffic, ventilation needs, electrical capacity and areas that cannot stop.
MS title1: 
MS desc1: 
```
```
EN title2: Compliance Check
EN desc2: Check fire compartmentation, detection and escape requirements with the building before layout.
MS title2: 
MS desc2: 
```
```
EN title3: Phasing Plan
EN desc3: Split the work into zones so production continues and each zone is handed back usable.
MS title3: 
MS desc3: 
```
```
EN title4: Execution
EN desc4: Carry out floor, structure, services and finishes zone by zone against the agreed sequence.
MS title4: 
MS desc4: 
```
```
EN title5: Zone Handover
EN desc5: Test and hand back each zone before moving on, with the record for the next stage.
MS title5: 
MS desc5: 
```

**`suitable_for_ms`** — 适合对象（逐条）

```
EN 1: Factories expanding or re-laying a production floor
MS 1: 
```
```
EN 2: Warehouses adding racking and hardstanding
MS 2: 
```
```
EN 3: Units converting from one production process to another
MS 3: 
```
```
EN 4: Operators who need work phased around live production
MS 4: 
```

**`common_projects_ms`** — 常见项目类型（逐条）

```
EN 1: Production floor coating and hardstanding
MS 1: 
```
```
EN 2: Warehouse racking and floor marking
MS 2: 
```
```
EN 3: Office and welfare area within a factory
MS 3: 
```
```
EN 4: Ventilation and extraction upgrade
MS 4: 
```
```
EN 5: Zone-by-zone refurbishment during live production
MS 5: 
```

