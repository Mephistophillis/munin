import { describe, it, expect } from "bun:test";
import { createError } from "../../src/utils/errors.js";
import { ExitCode } from "../../src/types/errors.js";

describe("error-scenarios", () => {
  it("should correctly serialize AGENTS_MD_NOT_FOUND code", () => {
     const err = createError(ExitCode.AGENTS_MD_NOT_FOUND);
     expect(err.code).toBe(10);
     expect(err.constant).toBe("AGENTS_MD_NOT_FOUND");
     expect(err.message).toContain("not found");
  });

  it("should fallback to general error if unknown exitcode is passed", () => {
     // @ts-ignore testing fallback
     const err = createError(999); 
     expect(err.code).toBe(999);
     expect(err.constant).toBe("GENERAL_ERROR");
  });

  it("should include custom suggestion if defined", () => {
     const err = createError(ExitCode.GIT_PUSH_FAILED);
     expect(err.suggestion).toContain("network");
  });
});
