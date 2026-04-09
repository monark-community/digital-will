import swaggerJsdoc from "swagger-jsdoc";
import { config } from "./config";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Digital Will API",
      version: "0.1.0",
      description:
        "REST API for the Digital Will platform — manage wills, wallets, contacts, and notifications.",
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api`,
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        // ── Auth ────────────────────────────────────────────────────────────
        WalletCheckRequest: {
          type: "object",
          required: ["walletAddress"],
          properties: {
            walletAddress: { type: "string", example: "0xAbCd..." },
          },
        },
        WalletSignInRequest: {
          type: "object",
          required: ["walletAddress", "signature", "message"],
          properties: {
            walletAddress: { type: "string", example: "0xAbCd..." },
            signature: { type: "string" },
            message: { type: "string" },
          },
        },
        WalletCreateAccountRequest: {
          type: "object",
          required: ["firstName", "lastName", "email", "walletAddress", "signature", "message"],
          properties: {
            firstName: { type: "string", example: "Alice" },
            lastName: { type: "string", example: "Smith" },
            email: { type: "string", format: "email" },
            phoneNo: { type: "string" },
            walletAddress: { type: "string" },
            signature: { type: "string" },
            message: { type: "string" },
            wantToReceiveMails: { type: "boolean", default: false },
          },
        },
        AuthResult: {
          type: "object",
          properties: {
            token: { type: "string" },
            user: { $ref: "#/components/schemas/UserProfile" },
          },
        },
        UserProfile: {
          type: "object",
          properties: {
            userId: { type: "string", format: "uuid" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            email: { type: "string", format: "email" },
            phoneNo: { type: "string", nullable: true },
            wantToReceiveMails: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        // ── Wallets ─────────────────────────────────────────────────────────
        Wallet: {
          type: "object",
          properties: {
            walletId: { type: "string", format: "uuid" },
            address: { type: "string" },
            label: { type: "string", nullable: true },
            userId: { type: "string", format: "uuid" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        AddWalletRequest: {
          type: "object",
          required: ["walletAddress", "signature", "message"],
          properties: {
            walletAddress: { type: "string" },
            signature: { type: "string" },
            message: { type: "string" },
            label: { type: "string" },
          },
        },
        UpdateWalletLabelRequest: {
          type: "object",
          required: ["label"],
          properties: {
            label: { type: "string" },
          },
        },

        // ── Contacts ────────────────────────────────────────────────────────
        Contact: {
          type: "object",
          properties: {
            contactId: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            email: { type: "string", format: "email" },
            phoneNumber: { type: "string", nullable: true },
            walletAddress: { type: "string" },
            relationship: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        ContactRequest: {
          type: "object",
          required: ["firstName", "lastName", "email", "walletAddress"],
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            email: { type: "string", format: "email" },
            walletAddress: { type: "string" },
            phoneNumber: { type: "string" },
            relationship: { type: "string" },
          },
        },

        // ── Secondary Members ────────────────────────────────────────────────
        SecondaryMemberRequest: {
          type: "object",
          required: ["firstName", "lastName", "email", "votingPower"],
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            email: { type: "string", format: "email" },
            phoneNumber: { type: "string" },
            walletAddress: { type: "string" },
            tempWalletAddress: { type: "string" },
            votingPower: { type: "integer", minimum: 1 },
            relationship: { type: "string" },
          },
        },

        // ── Wills ───────────────────────────────────────────────────────────
        DraftWillRequest: {
          type: "object",
          required: ["walletAddress"],
          properties: {
            walletAddress: { type: "string" },
            willName: { type: "string" },
            secondaryMembers: {
              type: "array",
              items: { $ref: "#/components/schemas/SecondaryMemberRequest" },
            },
            minSecurityPeriod: { type: "integer" },
            maxSecurityPeriod: { type: "integer" },
          },
        },
        DraftWillUpdateRequest: {
          type: "object",
          properties: {
            willName: { type: "string" },
            secondaryMembers: {
              type: "array",
              items: { $ref: "#/components/schemas/SecondaryMemberRequest" },
            },
            minSecurityPeriod: { type: "integer" },
            maxSecurityPeriod: { type: "integer" },
          },
        },
        DeployWillRequest: {
          type: "object",
          required: ["contractAddressInBlockchain", "chainId"],
          properties: {
            contractAddressInBlockchain: { type: "string" },
            chainId: { type: "integer" },
          },
        },
        CancelWillRequest: {
          type: "object",
          required: ["minSecurityPeriod", "maxSecurityPeriod", "secondaryMembersVotingPowers"],
          properties: {
            minSecurityPeriod: { type: "integer" },
            maxSecurityPeriod: { type: "integer" },
            secondaryMembersVotingPowers: {
              type: "object",
              additionalProperties: { type: "integer" },
              description: "Map of wallet address to voting power",
            },
          },
        },
        UpdateDeployedWillRequest: {
          type: "object",
          properties: {
            updatedMembers: {
              type: "array",
              items: { $ref: "#/components/schemas/SecondaryMemberRequest" },
            },
            addedMembers: {
              type: "array",
              items: { $ref: "#/components/schemas/SecondaryMemberRequest" },
            },
            deletedMemberIds: { type: "array", items: { type: "string" } },
          },
        },

        // ── Notifications ────────────────────────────────────────────────────
        Notification: {
          type: "object",
          properties: {
            notifId: { type: "string", format: "uuid" },
            notifType: {
              type: "string",
              enum: [
                "SIGNATURE_REQUEST",
                "WILL_ACTIVATED",
                "WILL_CANCELED",
                "WILL_CANCELED_ALL_SM_LEFT",
                "SM_ADDED",
                "SM_UPDATED",
                "SM_REMOVED",
                "SM_DESISTED",
                "SECURITY_PERIOD_UPDATED",
                "DEATH_DECLARED",
                "DEATH_CONFIRMED",
                "VETO_EXERCISED",
                "ASSETS_SWAPPED",
                "EXECUTE_WILL",
                "SM_SIGNATURE_REFUSED",
                "PROTECTION_PERIOD_REMINDER",
              ],
            },
            willId: { type: "string", format: "uuid", nullable: true },
            userId: { type: "string", format: "uuid" },
            smName: { type: "string", nullable: true },
            amount: { type: "number", nullable: true },
            readStatus: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },

        // ── Common ───────────────────────────────────────────────────────────
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
