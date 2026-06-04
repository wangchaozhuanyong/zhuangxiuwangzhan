import { describe, expect, it } from "vitest";
import { formatSourcePath, formatUserFacingError, isTechnicalFieldLeak } from "@/lib/userFacingText";

describe("userFacingText", () => {
  it("does not expose technical database errors to Chinese admin UI", () => {
    expect(formatUserFacingError(new Error("permission denied for table admin_users"), "zh")).toBe(
      "当前账号没有这个操作权限。",
    );
    expect(formatUserFacingError(new Error("permission_denied: public.admin_users policy rejected"), "zh")).toBe(
      "当前账号没有这个操作权限。",
    );
  });

  it("keeps already friendly messages", () => {
    expect(formatUserFacingError("保存失败：这条数据已经不存在，请刷新列表。", "zh")).toBe(
      "保存失败：这条数据已经不存在，请刷新列表。",
    );
  });

  it("detects code-like text leaks", () => {
    expect(isTechnicalFieldLeak("system_health_check", "zh")).toBe(true);
    expect(isTechnicalFieldLeak("健康检查", "zh")).toBe(false);
  });

  it("turns source paths into readable labels", () => {
    expect(formatSourcePath("/zh/contact", "zh")).toBe("联系页");
    expect(formatSourcePath("/zh/quote?source=project&title=Mont%20Kiara%20Condo", "zh")).toBe(
      "案例详情页：Mont Kiara Condo",
    );
  });
});
