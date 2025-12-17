export async function GET(req: Request) {
  const url = new URL(req.url)
  const base = `${url.protocol}//${url.host}`

  const spec = {
    openapi: "3.0.3",
    info: {
      title: "Foboh Challenge API",
      version: "0.1.0",
      description: "CRUD endpoints for Products and Pricing Profiles.",
    },
    servers: [{ url: base }],
    components: {
      securitySchemes: {
        UserEmailHeader: {
          type: "apiKey",
          in: "header",
          name: "x-user-email",
          description: "Optional. If omitted, defaults to demo user.",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            ok: { type: "boolean", example: false },
            message: { type: "string" },
          },
        },
        Product: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            sku: { type: "string" },
            brand: { type: "string" },
            userId: { type: "string", format: "uuid" },
            categoryId: { type: "string", format: "uuid" },
            subcategoryId: { type: "string", format: "uuid" },
            segmentId: { type: "string", format: "uuid" },
            globalWholesalePrice: { type: "string", example: "12.50" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        ProductCreate: {
          type: "object",
          required: [
            "title",
            "sku",
            "brand",
            "categoryId",
            "subcategoryId",
            "segmentId",
            "globalWholesalePrice",
          ],
          properties: {
            title: { type: "string" },
            sku: { type: "string" },
            brand: { type: "string" },
            categoryId: { type: "string", format: "uuid" },
            subcategoryId: { type: "string", format: "uuid" },
            segmentId: { type: "string", format: "uuid" },
            globalWholesalePrice: { type: "string", example: "12.50" },
          },
        },
        PricingProfile: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            description: { type: "string" },
            basedOn: { type: "string" },
            priceAdjustMode: { type: "string", enum: ["FIXED", "DYNAMIC"] },
            incrementMode: { type: "string", enum: ["INCREASE", "DECREASE"] },
            status: { type: "string", enum: ["DRAFT", "COMPLETED", "ARCHIVED"] },
            userId: { type: "string", format: "uuid" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        PricingProfileCreate: {
          type: "object",
          required: ["name", "description", "basedOn", "priceAdjustMode", "incrementMode"],
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            basedOn: { type: "string" },
            priceAdjustMode: { type: "string", enum: ["FIXED", "DYNAMIC"] },
            incrementMode: { type: "string", enum: ["INCREASE", "DECREASE"] },
            status: { type: "string", enum: ["DRAFT", "COMPLETED", "ARCHIVED"] },
            items: {
              type: "array",
              items: {
                type: "object",
                required: ["productId", "adjustment"],
                properties: {
                  productId: { type: "string", format: "uuid" },
                  adjustment: { type: "string", example: "1.25" },
                },
              },
            },
          },
        },
      },
    },
    security: [{ UserEmailHeader: [] }],
    paths: {
      "/api/products": {
        get: {
          summary: "List products",
          parameters: [
            {
              name: "userEmail",
              in: "query",
              required: false,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      items: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: "Create product",
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ProductCreate" } },
            },
          },
          responses: {
            "201": { description: "Created" },
            "400": { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/api/products/{id}": {
        get: {
          summary: "Get product",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
        },
        patch: {
          summary: "Update product",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" }, "400": { description: "Bad request" }, "404": { description: "Not found" } },
        },
        delete: {
          summary: "Delete product",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
        },
      },
      "/api/pricing-profiles": {
        get: {
          summary: "List pricing profiles",
          responses: { "200": { description: "OK" } },
        },
        post: {
          summary: "Create pricing profile",
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/PricingProfileCreate" } },
            },
          },
          responses: { "201": { description: "Created" }, "400": { description: "Bad request" } },
        },
      },
      "/api/pricing-profiles/{id}": {
        get: {
          summary: "Get pricing profile",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
        },
        patch: {
          summary: "Update pricing profile",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" }, "400": { description: "Bad request" }, "404": { description: "Not found" } },
        },
        delete: {
          summary: "Delete pricing profile",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
        },
      },
    },
  } as const

  return Response.json(spec)
}


