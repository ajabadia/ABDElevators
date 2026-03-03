import { PdfLayout } from "@/lib/pdf/PdfLayout";
import jsPDF from "jspdf";

// Mock jsPDF
jest.mock("jspdf", () => {
    return jest.fn().mockImplementation(() => ({
        setProperties: jest.fn(),
        setFont: jest.fn(),
        setFontSize: jest.fn(),
        setTextColor: jest.fn(),
        text: jest.fn(),
        line: jest.fn(),
        addPage: jest.fn(),
        setPage: jest.fn(),
        internal: {
            getNumberOfPages: jest.fn().mockReturnValue(1),
            pageSize: {
                width: 210,
                height: 297
            }
        }
    }));
});

describe("PdfLayout Unit Tests", () => {
    let doc: any;

    beforeEach(() => {
        jest.clearAllMocks();
        doc = new jsPDF();
    });

    it("should attach document metadata correctly", () => {
        PdfLayout.attachDocumentMetadata(doc, {
            tenantId: "tenant_1",
            correlationId: "cid_123",
            generatedBy: "User A"
        });
        expect(doc.setProperties).toHaveBeenCalledWith(expect.objectContaining({
            title: expect.stringContaining("ABD"),
            subject: expect.stringContaining("tenant_1")
        }));
    });

    it("should draw standard header", () => {
        PdfLayout.drawStandardHeader(doc, {
            title: "Report Title",
            subtitle: "Subtitle",
            correlationId: "cid_123"
        });
        expect(doc.text).toHaveBeenCalledWith("REPORT TITLE", expect.any(Number), expect.any(Number));
        expect(doc.text).toHaveBeenCalledWith(expect.stringContaining("cid_123"), expect.any(Number), expect.any(Number), expect.any(Object));
    });

    it("should draw standard footer", () => {
        PdfLayout.drawStandardFooter(doc, "cid_123", "es");
        expect(doc.text).toHaveBeenCalledWith(expect.stringContaining("Página 1 de 1"), expect.any(Number), expect.any(Number), expect.any(Object));
    });
});
