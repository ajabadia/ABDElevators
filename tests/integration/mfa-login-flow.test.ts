/**
 * @jest-environment node
 */
import { authorizeCredentials } from "@/lib/auth-utils";
import { connectAuthDB } from "@/lib/db";
import { MfaService } from "@/lib/mfa-service";
import { SessionService } from "@/lib/session-service";
import { logEvento } from "@/lib/logger";
import { CredentialsSignin } from "next-auth";
import { ObjectId } from "mongodb";
import { headers } from "next/headers";

// Standard require for bcrypt to avoid ES module issues in tests
const bcrypt = require("bcryptjs");

// Mocking dependencies
jest.mock("@/lib/db", () => ({
    connectDB: jest.fn(),
    connectAuthDB: jest.fn(),
}));

jest.mock("@/lib/mfa-service", () => ({
    MfaService: {
        isEnabled: jest.fn(),
        verify: jest.fn(),
    },
}));

jest.mock("@/lib/session-service", () => ({
    SessionService: {
        createSession: jest.fn(),
    },
}));

jest.mock("@/lib/logger", () => ({
    logEvento: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("next/headers", () => ({
    headers: jest.fn().mockResolvedValue({
        get: jest.fn().mockReturnValue("127.0.0.1"),
    }),
}));

jest.mock("bcryptjs", () => ({
    compare: jest.fn(),
}));

// Mock next-auth to provide CredentialsSignin
jest.mock("next-auth", () => ({
    __esModule: true,
    CredentialsSignin: class extends Error {
        code: string;
        constructor(code: string) {
            super(code);
            this.code = code;
        }
    }
}));

describe("MFA Login Flow Integration (via AuthUtils)", () => {
    const mockUser = {
        _id: new ObjectId(),
        email: "admin@example.com",
        password: "hashed_password",
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN",
        tenantId: "tenant_1",
        industry: "ELEVATORS",
        activeModules: ["MFA"],
    };

    const mockDb = {
        collection: jest.fn().mockReturnThis(),
        findOne: jest.fn(),
        findOneAndUpdate: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (connectAuthDB as any).mockResolvedValue(mockDb);
        mockDb.findOne.mockResolvedValue(mockUser);
        (bcrypt.compare as any).mockResolvedValue(true);
    });

    it("should return complete session if MFA is disabled", async () => {
        (MfaService.isEnabled as any).mockResolvedValue(false);
        (SessionService.createSession as any).mockResolvedValue("session_123");

        const result = await authorizeCredentials({
            email: mockUser.email,
            password: "password123"
        });

        expect(result).toMatchObject({
            email: mockUser.email,
            mfaPending: false,
            mfaVerified: false,
            sessionId: "session_123"
        });
    });

    it("should throw CredentialsSignin('MFA_REQUIRED') if MFA is enabled but code is missing", async () => {
        (MfaService.isEnabled as any).mockResolvedValue(true);

        await expect(authorizeCredentials({
            email: mockUser.email,
            password: "password123"
        })).rejects.toThrow(CredentialsSignin);

        // Optional: verify it is specifically MFA_REQUIRED if your test mock supports it
        // Depending on how CredentialsSignin is mocked, we might need to check .code
        try {
            await authorizeCredentials({
                email: mockUser.email,
                password: "password123"
            });
        } catch (e: any) {
            expect(e.message).toBe("MFA_REQUIRED");
        }

        expect(logEvento).toHaveBeenCalledWith(expect.objectContaining({
            action: "MFA_REQUIRED"
        }));
    });

    it("should throw CredentialsSignin if MFA code is invalid", async () => {
        (MfaService.isEnabled as any).mockResolvedValue(true);
        (MfaService.verify as any).mockResolvedValue(false);

        await expect(authorizeCredentials({
            email: mockUser.email,
            password: "password123",
            mfaCode: "000000"
        })).rejects.toThrow(CredentialsSignin);

        expect(logEvento).toHaveBeenCalledWith(expect.objectContaining({
            action: "MFA_INVALID"
        }));
    });

    it("should return complete session if MFA code is valid", async () => {
        (MfaService.isEnabled as any).mockResolvedValue(true);
        (MfaService.verify as any).mockResolvedValue(true);
        (SessionService.createSession as any).mockResolvedValue("session_456");

        const result = await authorizeCredentials({
            email: mockUser.email,
            password: "password123",
            mfaCode: "654321"
        });

        expect(result).toMatchObject({
            email: mockUser.email,
            mfaPending: false,
            mfaVerified: true,
            sessionId: "session_456"
        });
        expect(logEvento).toHaveBeenCalledWith(expect.objectContaining({
            action: "MFA_VERIFIED"
        }));
    });
});
