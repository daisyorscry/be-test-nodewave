import { excelDateToJS } from "$utils/excel.utils";

describe("excelDateToJS", () => {
  it("returns null for non-number input", () => {
    expect(excelDateToJS("abc")).toBeNull();
    expect(excelDateToJS(null)).toBeNull();
  });

  it("converts Excel serial date to JS Date", () => {
    // 1 Jan 1900 in Excel serial is 1
    const date = excelDateToJS(1);
    expect(date).toBeInstanceOf(Date);
  });
});
