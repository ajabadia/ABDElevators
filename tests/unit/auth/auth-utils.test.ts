import { authorizeCredentials } from "@/lib/auth-utils";
import { connectAuthDB, connectDB } from "@/lib/db";
import { MfaService } from "@/services/auth/MfaService";
import { SessionService } from "@/services/auth/SessionService";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

// Mocking dependencies
jest.mock("@/lib/db", () => ({
    connectDB: jest.fn(),
    connectAuthDB: jest.fn(),
}));

jest.mock("@/services/auth/MfaService", () => ({
    MfaService: {
        isEnabled: jest.fn(),
        verify: jest.fn(),
    },
}));

jest.mock("@/services/auth/SessionService", () => ({
    SessionService: {
        createSession: jest.fn(),
    },
}));

jest.mock("bcryptjs", () => ({
    compare: jest.fn(),
}));

// Mock next-auth classes
jest.mock("next-auth", () => ({
    CredentialsSignin: class CredentialsSignin extends Error {
        code: string;
        constructor(code?: string) {
            super(code);
            this.code = code || "CREDENTIALS_SIGNIN";
        }
    }
}));

describe("authorizeCredentials Unit Tests", () => {
    const mockUser = {
        _id: new ObjectId(),
        email: "test@example.com",
        password: "hashed_password",
        role: "ADMIN",
        tenantId: "tenant_123"
    };

    const mockDb = {
        collection: jest.fn().mockReturnThis(),
        findOne: jest.fn(),
        findOneAndUpdate: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (connectAuthDB as jest.Mock).mockResolvedValue(mockDb);
        mockDb.findOne.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (MfaService.isEnabled as jest.Mock).mockResolvedValue(false);
    });

    it("should authorize successfully with correct credentials and no MFA", async () => {
        (SessionService.createSession as jest.Mock).mockResolvedValue("session_abc");

        const result = await authorizeCredentials({
            email: "test@example.com",
            password: "correct_password"
        });

        expect(result).not.toBeNull();
        expect(result?.email).toBe(mockUser.email);
        expect(result?.sessionId).toBe("session_abc");
    });

    it("should throw UserNotFoundError if user is not in any DB", async () => {
        mockDb.findOne.mockResolvedValue(null);
        (connectDB as jest.Mock).mockResolvedValue(mockDb);

        await expect(authorizeCredentials({
            email: "nonexistent@example.com",
            password: "any"
        })).rejects.toThrow();
    });

    it("should throw InvalidPasswordError on wrong password", async () => {
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        await expect(authorizeCredentials({
            email: "test@example.com",
            password: "wrong_password"
        })).rejects.toThrow();
    });

    it("should throw MfaRequiredError if MFA is enabled but not provided", async () => {
        (MfaService.isEnabled as jest.Mock).mockResolvedValue(true);

        await expect(authorizeCredentials({
            email: "test@example.com",
            password: "correct_password"
        })).rejects.toThrow();
    });

    it("should authorize successfully with valid MFA", async () => {
        (MfaService.isEnabled as jest.Mock).mockResolvedValue(true);
        (MfaService.verify as jest.Mock).mockResolvedValue(true);
        (SessionService.createSession as jest.Mock).mockResolvedValue("session_mfa");

        const result = await authorizeCredentials({
            email: "test@example.com",
            password: "correct_password",
            mfaCode: "123456"
        });

        expect(result?.mfaVerified).toBe(true);
        expect(result?.sessionId).toBe("session_mfa");
    });

    it("should handle magic link authorization", async () => {
        mockDb.findOneAndUpdate.mockResolvedValue({ used: true });

        const result = await authorizeCredentials({
            email: "test@example.com",
            password: "MAGIC_LINK:valid_token"
        });

        expect(result).not.toBeNull();
        expect(mockDb.findOneAndUpdate).toHaveBeenCalled();
    });
});
