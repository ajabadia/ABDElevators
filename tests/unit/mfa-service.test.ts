/**
 * @jest-environment node
 */
import { MfaService } from "../../src/lib/mfa-service";
import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";
import { connectAuthDB } from "../../src/lib/db";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { logEvento } from "../../src/lib/logger";

// Mocking BEFORE imports to ensure they take effect (following vector-search pattern)
jest.mock("otplib", () => ({
    generateSecret: jest.fn(),
    generateURI: jest.fn(),
    verify: jest.fn(),
}));

jest.mock("qrcode", () => ({
    toDataURL: jest.fn(),
}));

jest.mock("../../src/lib/db", () => ({
    connectAuthDB: jest.fn(),
}));

jest.mock("../../src/lib/logger", () => ({
    logEvento: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("bcryptjs", () => ({
    hash: jest.fn(),
}));

describe("MfaService", () => {
    const mockUserId = new ObjectId().toString();
    const mockEmail = "test@example.com";
    const mockSecret = "KVKFKR37PZHE6";
    const mockToken = "123456";

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("setup", () => {
        it("should generate a secret and a QR code", async () => {
            (generateSecret as any).mockReturnValue(mockSecret);
            (generateURI as any).mockReturnValue("otpauth://totp/ABD");
            (QRCode.toDataURL as any).mockResolvedValue("data:image/png;base64,...");

            const result = await MfaService.setup(mockUserId, mockEmail);

            expect(result).toEqual({
                secret: mockSecret,
                qrCode: "data:image/png;base64,..."
            });
            expect(logEvento).toHaveBeenCalledWith(expect.objectContaining({
                action: "MFA_SETUP_INITIATED"
            }));
        });
    });

    describe("enable", () => {
        it("should enable MFA and return recovery codes if token is valid", async () => {
            (verify as any).mockResolvedValue({ valid: true });

            const mockUpdateOne = jest.fn().mockResolvedValue({ acknowledged: true });
            const mockDb = {
                collection: jest.fn().mockReturnValue({
                    updateOne: mockUpdateOne
                })
            };
            (connectAuthDB as any).mockResolvedValue(mockDb);
            (bcrypt.hash as any).mockResolvedValue("hashed_code");

            const result = await MfaService.enable(mockUserId, mockSecret, mockToken);

            expect(result.success).toBe(true);
            expect(result.recoveryCodes).toHaveLength(8);
            expect(mockUpdateOne).toHaveBeenCalledTimes(2);
            expect(logEvento).toHaveBeenCalledWith(expect.objectContaining({
                action: "MFA_ENABLED"
            }));
        });

        it("should return failure if token is invalid", async () => {
            (verify as any).mockResolvedValue({ valid: false });

            const result = await MfaService.enable(mockUserId, mockSecret, mockToken);

            expect(result.success).toBe(false);
            expect(logEvento).toHaveBeenCalledWith(expect.objectContaining({
                action: "MFA_ENABLE_FAILED"
            }));
        });
    });

    describe("verify", () => {
        it("should return true if MFA is not enabled", async () => {
            const mockDb = {
                collection: jest.fn().mockReturnValue({
                    findOne: jest.fn().mockResolvedValue(null)
                })
            };
            (connectAuthDB as any).mockResolvedValue(mockDb);

            const result = await MfaService.verify(mockUserId, mockToken);

            expect(result).toBe(true);
        });

        it("should verify token if MFA is enabled", async () => {
            const mockDb = {
                collection: jest.fn().mockReturnValue({
                    findOne: jest.fn().mockResolvedValue({ enabled: true, secret: mockSecret })
                })
            };
            (connectAuthDB as any).mockResolvedValue(mockDb);
            (verify as any).mockResolvedValue({ valid: true });

            const result = await MfaService.verify(mockUserId, mockToken);

            expect(result).toBe(true);
            expect(logEvento).toHaveBeenCalledWith(expect.objectContaining({
                action: "MFA_VERIFICATION_SUCCESS"
            }));
        });
    });
});
