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
import { AppError } from "../../src/lib/errors";

// Mocking BEFORE imports to ensure they take effect
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

    // Mock Session & Transaction
    const mockSession = {
        withTransaction: jest.fn((callback) => callback()),
        endSession: jest.fn().mockResolvedValue(undefined),
    };

    const mockDb = {
        collection: jest.fn().mockReturnThis(),
        findOne: jest.fn(),
        updateOne: jest.fn(),
        deleteOne: jest.fn(),
        client: {
            startSession: jest.fn().mockReturnValue(mockSession),
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (connectAuthDB as any).mockResolvedValue(mockDb);
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
        it("should throw AppError if userId is invalid", async () => {
            await expect(MfaService.enable("invalid-id", mockSecret, mockToken))
                .rejects.toThrow(AppError);
        });

        it("should return failure if TOTP token is invalid", async () => {
            (verify as any).mockReturnValue({ valid: false });
            const result = await MfaService.enable(mockUserId, mockSecret, mockToken);
            expect(result.success).toBe(false);
        });

        it("should enable MFA using a transaction if token and user are valid", async () => {
            (verify as any).mockReturnValue({ valid: true });
            (bcrypt.hash as any).mockResolvedValue("hashed_code");

            mockDb.findOne.mockResolvedValue({ _id: new ObjectId(mockUserId) }); // User exists
            mockDb.updateOne.mockResolvedValue({ modifiedCount: 1 });

            const result = await MfaService.enable(mockUserId, mockSecret, mockToken);

            expect(result.success).toBe(true);
            expect(result.recoveryCodes).toHaveLength(8);
            expect(mockSession.withTransaction).toHaveBeenCalled();
            expect(mockDb.updateOne).toHaveBeenCalledTimes(2); // mfa_configs and users
            expect(logEvento).toHaveBeenCalledWith(expect.objectContaining({
                action: "MFA_ENABLED"
            }));
        });

        it("should throw AppError if user is not found during enable", async () => {
            (verify as any).mockReturnValue({ valid: true });
            mockDb.findOne.mockResolvedValue(null); // User not found

            await expect(MfaService.enable(mockUserId, mockSecret, mockToken))
                .rejects.toThrow(AppError);
        });
    });

    describe("verify", () => {
        it("should return true if MFA is not enabled (config missing, user mfaEnabled=false)", async () => {
            mockDb.findOne
                .mockResolvedValueOnce(null) // config missing
                .mockResolvedValueOnce({ mfaEnabled: false }); // user mfaEnabled=false

            const result = await MfaService.verify(mockUserId, mockToken);

            expect(result).toBe(true);
        });

        it("should return false (fail-closed) if config is missing but user has mfaEnabled=true", async () => {
            mockDb.findOne
                .mockResolvedValueOnce(null) // config missing
                .mockResolvedValueOnce({ mfaEnabled: true }); // user mfaEnabled=true (INCONSISTENCY)

            const result = await MfaService.verify(mockUserId, mockToken);

            expect(result).toBe(false);
            expect(logEvento).toHaveBeenCalledWith(expect.objectContaining({
                action: "MFA_CONFIG_MISSING"
            }));
        });

        it("should verify token if MFA config exists and is enabled", async () => {
            mockDb.findOne
                .mockResolvedValueOnce({ enabled: true, secret: mockSecret }) // config
                .mockResolvedValueOnce({ mfaEnabled: true }); // user

            (verify as any).mockReturnValue({ valid: true });

            const result = await MfaService.verify(mockUserId, mockToken);

            expect(result).toBe(true);
            expect(logEvento).toHaveBeenCalledWith(expect.objectContaining({
                action: "MFA_VERIFICATION_SUCCESS"
            }));
        });
    });

    describe("disable", () => {
        it("should disable MFA using a transaction", async () => {
            mockDb.deleteOne.mockResolvedValue({ deletedCount: 1 });
            mockDb.updateOne.mockResolvedValue({ matchedCount: 1 });

            await MfaService.disable(mockUserId);

            expect(mockSession.withTransaction).toHaveBeenCalled();
            expect(mockDb.deleteOne).toHaveBeenCalledWith({ userId: mockUserId }, expect.anything());
            expect(mockDb.updateOne).toHaveBeenCalledWith(
                { _id: new ObjectId(mockUserId) },
                expect.anything(),
                expect.anything()
            );
            expect(logEvento).toHaveBeenCalledWith(expect.objectContaining({
                action: "MFA_DISABLED"
            }));
        });

        it("should throw AppError if user not found during disable", async () => {
            mockDb.updateOne.mockResolvedValue({ matchedCount: 0 });

            await expect(MfaService.disable(mockUserId))
                .rejects.toThrow(AppError);
        });
    });

    describe("isEnabled", () => {
        it("should return true if config exists and is enabled", async () => {
            mockDb.findOne.mockResolvedValue({ enabled: true });
            const result = await MfaService.isEnabled(mockUserId);
            expect(result).toBe(true);
        });

        it("should return false if no config exists", async () => {
            mockDb.findOne.mockResolvedValue(null);
            const result = await MfaService.isEnabled(mockUserId);
            expect(result).toBe(false);
        });
    });
});
