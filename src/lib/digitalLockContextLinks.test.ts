import { describe, expect, it } from 'vitest';
import { getServiceContextLinks } from '@/i18n/serviceContextLinks';
import { loadMalayContent } from '@/i18n/malayContentRuntime';
import { digitalLockLandingText } from '@/i18n/serviceDetailPageText';
import { buildExpandedReadableBody } from '../../functions/expandedReadableBody';

describe('digital-lock service context links and readable body', () => {
  it.each(['zh', 'en', 'ms'] as const)('provides all 16 links for %s', (lang) => {
    const links = getServiceContextLinks('digital-lock', lang);
    expect(links).toHaveLength(16);

    // 6 showroom categories
    const showroom = links.slice(0, 6);
    expect(showroom[0].href).toBe(`https://locks.flashcast.com.my/${lang}/lock/type/entrance-door/`);
    expect(showroom[1].href).toBe(`https://locks.flashcast.com.my/${lang}/lock/type/interior-door/`);
    expect(showroom[2].href).toBe(`https://locks.flashcast.com.my/${lang}/lock/type/aluminium-door/`);
    expect(showroom[3].href).toBe(`https://locks.flashcast.com.my/${lang}/lock/feature/face-recognition/`);
    expect(showroom[4].href).toBe(`https://locks.flashcast.com.my/${lang}/lock/feature/palm-vein/`);
    expect(showroom[5].href).toBe(`https://locks.flashcast.com.my/${lang}/lock/feature/video-intercom/`);

    // 10 area links
    const areas = links.slice(6);
    expect(areas[0].href).toBe('/locations/kuala-lumpur/digital-lock');
    expect(areas[1].href).toBe('/locations/petaling-jaya/digital-lock');
    expect(areas[2].href).toBe('/locations/cheras/digital-lock');
    expect(areas[3].href).toBe('/locations/subang-jaya/digital-lock');
    expect(areas[4].href).toBe('/locations/mont-kiara/digital-lock');
    expect(areas[5].href).toBe('/locations/bangsar/digital-lock');
    expect(areas[6].href).toBe('/locations/puchong/digital-lock');
    expect(areas[7].href).toBe('/locations/selangor/digital-lock');
    expect(areas[8].href).toBe('/locations/shah-alam/digital-lock');
    expect(areas[9].href).toBe('/locations/kajang/digital-lock');
  });

  it.each(['zh', 'en', 'ms'] as const)('generates readable edge body with all 16 links for %s', async (lang) => {
    if (lang === 'ms') await loadMalayContent();
    const mockRow = {
      id: '01c632e5-4057-479e-93e3-303c17d6ad31',
      slug: 'digital-lock',
      status: 'published',
      [`title_${lang}`]: 'Digital Lock',
      [`excerpt_${lang}`]: 'Summary',
      [`content_${lang}`]: '<p>Content</p>',
    };
    const body = buildExpandedReadableBody(`/${lang}/services/digital-lock`, { row: mockRow });
    expect(body).toContain('data-flashcast-readable-body');
    expect(body).toContain(`<p>${digitalLockLandingText[lang].offer}</p>`);
    expect(body).toContain(`https://locks.flashcast.com.my/${lang}/lock/type/entrance-door/`);
    expect(body).toContain(`/${lang}/locations/kuala-lumpur/digital-lock`);
    expect(body).toContain(`/${lang}/locations/cheras/digital-lock`);
  });
});
