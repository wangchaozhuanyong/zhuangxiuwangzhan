export type FloatingBounds = Pick<DOMRect, "left" | "right" | "top" | "bottom" | "width" | "height">;

/** Find the nearest free position above the corner, with extra room before returning. */
export function findFloatingContactLift(box: FloatingBounds, actions: FloatingBounds[], current: number, top: number) {
  const clear = (lift: number, gap = 8) => actions.every((action) =>
    box.right + gap <= action.left || box.left - gap >= action.right
    || box.bottom - lift + gap <= action.top || box.top - lift - gap >= action.bottom);
  const maximum = Math.max(0, box.top - top);
  if (clear(0, current ? 16 : 8)) return 0;
  if (current > 0 && current <= maximum && clear(current)) return current;
  return [0, ...actions.map((action) => box.bottom - action.top + 8)]
    .filter((lift) => lift >= 0 && lift <= maximum).sort((a, b) => a - b)
    .find((lift) => clear(lift));
}
