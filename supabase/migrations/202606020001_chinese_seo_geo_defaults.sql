-- Strengthen Chinese SEO/GEO defaults without overwriting manually edited copy.

update public.site_settings
set
  default_seo_title_zh = '吉隆坡装修公司 | 住宅商业装修与定制家具 | FLASH CAST',
  default_seo_description_zh = 'FLASH CAST 服务吉隆坡、雪兰莪与巴生谷，提供住宅装修、商业空间装修、厨房翻新、旧屋翻新、定制家具、材料建议与项目管理。'
where id = 'default'
  and (
    nullif(btrim(default_seo_title_zh), '') is null
    or default_seo_title_zh = '吉隆坡装修公司 | FLASH CAST'
    or default_seo_title_zh = '吉隆坡装修公司 | 住宅、商业空间与定制家具 | FLASH CAST'
    or nullif(btrim(default_seo_description_zh), '') is null
    or default_seo_description_zh = 'FLASH CAST 提供吉隆坡与雪兰莪住宅、商业空间、厨房、旧屋翻新和定制家具装修服务。'
    or default_seo_description_zh = 'FLASH CAST SDN. BHD. 提供吉隆坡与雪兰莪住宅装修、室内设计、定制家具、厨房浴室翻新和商业空间装修服务。'
  );

update public.cms_pages
set
  seo_title_zh = '吉隆坡装修公司 | 住宅商业装修与定制家具 | FLASH CAST',
  seo_description_zh = 'FLASH CAST 服务吉隆坡、雪兰莪与巴生谷，提供住宅装修、商业空间装修、厨房翻新、旧屋翻新、定制家具、材料建议与项目管理。'
where page_key = 'home'
  and (
    nullif(btrim(seo_title_zh), '') is null
    or seo_title_zh = '吉隆坡装修公司 | FLASH CAST'
    or seo_title_zh = '吉隆坡装修公司 | 住宅、商业空间与定制家具 | FLASH CAST'
    or nullif(btrim(seo_description_zh), '') is null
    or seo_description_zh = 'FLASH CAST 提供吉隆坡与雪兰莪住宅装修、商业空间、定制家具、材料建议和项目管理服务。'
    or seo_description_zh = 'FLASH CAST SDN. BHD. 提供吉隆坡与雪兰莪住宅装修、室内设计、定制家具、厨房浴室翻新和商业空间装修服务。'
  );
