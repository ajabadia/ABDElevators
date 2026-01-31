import { generatePDFReport } from "@/lib/pdf-export";

// Mock jsPDF
jest.mock("jspdf", () => {
    return class {
        internal = {
            pageSize: {
                getWidth: () => 210,
                getHeight: () => 297
            }
        };
        setFillColor = jest.fn();
        rect = jest.fn();
        setTextColor = jest.fn();
        setFontSize = jest.fn();
        setFont = jest.fn();
        text = jest.fn();
        addPage = jest.fn();
        splitTextToSize = jest.fn().mockReturnValue(["line1", "line2"]);
        getNumberOfPages = jest.fn().mockReturnValue(1);
        setPage = jest.fn();
        output = jest.fn().mockReturnValue(new Blob(["mock_pdf_content"]));
    };
});

describe('PDF Export Service (English Ontology)', () => {
    it('should generate PDF blob using correct English keys', async () => {
        const mockData = {
            identifier: "TEST-1234", // Was "numeroPedido"
            analysisDate: new Date(), // Was "fechaAnalisis"
            correlationId: "mock-correlation-id", // Was "correlacionId"
            models: [
                {
                    type: "INVERTER",
                    model: "VF-55",
                    ragContext: [
                        { source: "manual.pdf", text: "Some text", score: 0.95 }
                    ]
                }
            ]
        };

        const result = await generatePDFReport(mockData);
        expect(result).toBeInstanceOf(Blob);
    });
});
