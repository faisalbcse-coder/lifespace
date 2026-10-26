import { describe, it, expect } from "vitest";
import {
  RegisterSchema,
  LoginSchema,
  CreateSectionSchema,
  UpdateSectionSchema,
  ReorderSectionsSchema,
  CreateItemSchema,
  UpdateItemSchema,
  UserPreferenceSchema,
  UpdateProfileSchema,
  ChangePasswordSchema,
} from "../../lib/validators";

describe("Validation Schemas (Unit Tests)", () => {
  describe("RegisterSchema", () => {
    it("should accept valid registration data", () => {
      const result = RegisterSchema.safeParse({
        email: "test@example.com",
        password: "securepassword123",
        name: "Test User",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("test@example.com");
      }
    });

    it("should normalize email to lowercase", () => {
      const result = RegisterSchema.safeParse({
        email: "USER@DOMAIN.COM",
        password: "password123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("user@domain.com");
      }
    });

    it("should reject invalid email", () => {
      const result = RegisterSchema.safeParse({
        email: "invalid-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject password shorter than 8 characters", () => {
      const result = RegisterSchema.safeParse({
        email: "test@example.com",
        password: "short",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("LoginSchema", () => {
    it("should accept valid login credentials", () => {
      const result = LoginSchema.safeParse({
        email: "valid@example.com",
        password: "mypassword",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty password", () => {
      const result = LoginSchema.safeParse({
        email: "valid@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("CreateSectionSchema", () => {
    it("should accept valid section name and default color", () => {
      const result = CreateSectionSchema.safeParse({
        name: "New Sprint",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.color).toBe("indigo");
      }
    });

    it("should reject empty section name", () => {
      const result = CreateSectionSchema.safeParse({
        name: "   ",
      });
      expect(result.success).toBe(false);
    });

    it("should accept valid accent color", () => {
      const result = CreateSectionSchema.safeParse({
        name: "Sprint",
        color: "emerald",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.color).toBe("emerald");
      }
    });
  });

  describe("ReorderSectionsSchema", () => {
    it("should accept non-empty array of section IDs", () => {
      const result = ReorderSectionsSchema.safeParse({
        sectionIds: ["sec_1", "sec_2", "sec_3"],
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty array", () => {
      const result = ReorderSectionsSchema.safeParse({
        sectionIds: [],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("CreateItemSchema", () => {
    it("should accept valid item", () => {
      const result = CreateItemSchema.safeParse({
        sectionId: "sec_123",
        title: "Test Task",
        priority: "HIGH",
        status: "TODO",
      });
      expect(result.success).toBe(true);
    });

    it("should reject item missing title", () => {
      const result = CreateItemSchema.safeParse({
        sectionId: "sec_123",
        title: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid priority", () => {
      const result = CreateItemSchema.safeParse({
        sectionId: "sec_123",
        title: "Task",
        priority: "NON_EXISTENT",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("UserPreferenceSchema", () => {
    it("should accept valid theme and density", () => {
      const result = UserPreferenceSchema.safeParse({
        theme: "dark",
        density: "comfortable",
        seeMoreExpanded: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("UpdateProfileSchema", () => {
    it("should accept full valid profile data", () => {
      const result = UpdateProfileSchema.safeParse({
        name: "Md Faisal Islam",
        fatherName: "Father Name",
        motherName: "Mother Name",
        phone: "+8801700000000",
        address: "Dhaka, Bangladesh",
        permanentAddress: "Barishal, Bangladesh",
        dateOfBirth: "1998-05-15",
        gender: "Male",
        bloodGroup: "B+",
        occupation: "Software Engineer",
        bio: "Passionate about full-stack web development",
        emergencyContact: "Brother: +8801800000000",
      });
      expect(result.success).toBe(true);
    });

    it("should accept partial profile data with optional nullables", () => {
      const result = UpdateProfileSchema.safeParse({
        name: "Faisal",
        fatherName: null,
        phone: "",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("ChangePasswordSchema", () => {
    it("should accept matching new passwords with minimum 8 characters", () => {
      const result = ChangePasswordSchema.safeParse({
        currentPassword: "oldpassword123",
        newPassword: "newsecretpassword88",
        confirmPassword: "newsecretpassword88",
      });
      expect(result.success).toBe(true);
    });

    it("should reject when new password is under 8 characters", () => {
      const result = ChangePasswordSchema.safeParse({
        currentPassword: "oldpassword123",
        newPassword: "short",
        confirmPassword: "short",
      });
      expect(result.success).toBe(false);
    });

    it("should reject when confirm password does not match", () => {
      const result = ChangePasswordSchema.safeParse({
        currentPassword: "oldpassword123",
        newPassword: "password12345",
        confirmPassword: "differentpassword12345",
      });
      expect(result.success).toBe(false);
    });
  });
});
