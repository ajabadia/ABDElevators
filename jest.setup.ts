import "@testing-library/jest-dom";
import { toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

// Mock Next.js Link
jest.mock("next/link", () => {
    const React = require("react");
    return ({ children, href }: { children: React.ReactNode; href: string }) => {
        return React.createElement("a", { href }, children);
    };
});

// Mock Lucide Icons globally
jest.mock("lucide-react", () => {
    const React = require("react");
    const icons = [
        "Shield", "Keyboard", "Eye", "Accessibility", "Info", "Mail",
        "Globe", "Lock", "Scale", "FileText", "AlertTriangle",
        "CheckCircle", "XCircle", "Clock", "ShieldCheck"
    ];
    const mockIcons: any = {};
    icons.forEach(icon => {
        mockIcons[icon] = () => React.createElement("div", { "data-testid": `${icon.toLowerCase()}-icon` });
    });
    return mockIcons;
});
