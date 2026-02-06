import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { createUserSchema, updateUserSchema } from "$validations/UserValidation";

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

// Schemas
const RoleSchema = registry.register(
  "Role",
  z.object({
    id: z.number().int(),
    name: z.string()
  })
);

const UserSchema = registry.register(
  "User",
  z.object({
    id: z.number().int(),
    email: z.string().email(),
    name: z.string().nullable(),
    role: RoleSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
  })
);

const UserListResponseSchema = registry.register(
  "UserListResponse",
  z.object({
    users: z.array(UserSchema)
  })
);

const UserDetailResponseSchema = registry.register(
  "UserDetailResponse",
  z.object({
    user: UserSchema
  })
);

const UserWriteResponseSchema = registry.register(
  "UserWriteResponse",
  z.object({
    user: UserSchema
  })
);

// Paths
registry.registerPath({
  method: "get",
  path: "/users",
  tags: ["Users"],
  responses: {
    200: {
      description: "List users",
      content: {
        "application/json": {
          schema: UserListResponseSchema
        }
      }
    }
  }
});

registry.registerPath({
  method: "get",
  path: "/users/{id}",
  tags: ["Users"],
  request: {
    params: z.object({
      id: z.number().int().positive()
    })
  },
  responses: {
    200: {
      description: "Get user by id",
      content: {
        "application/json": {
          schema: UserDetailResponseSchema
        }
      }
    },
    404: {
      description: "User not found"
    }
  }
});

registry.registerPath({
  method: "post",
  path: "/users",
  tags: ["Users"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createUserSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: "Create user",
      content: {
        "application/json": {
          schema: UserWriteResponseSchema
        }
      }
    }
  }
});

registry.registerPath({
  method: "patch",
  path: "/users/{id}",
  tags: ["Users"],
  request: {
    params: z.object({
      id: z.number().int().positive()
    }),
    body: {
      content: {
        "application/json": {
          schema: updateUserSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: "Update user",
      content: {
        "application/json": {
          schema: UserWriteResponseSchema
        }
      }
    },
    404: {
      description: "User not found"
    }
  }
});

registry.registerPath({
  method: "delete",
  path: "/users/{id}",
  tags: ["Users"],
  request: {
    params: z.object({
      id: z.number().int().positive()
    })
  },
  responses: {
    200: {
      description: "Delete user",
      content: {
        "application/json": {
          schema: UserWriteResponseSchema
        }
      }
    },
    404: {
      description: "User not found"
    }
  }
});

export function getOpenAPIDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "NodeWave API",
      version: "1.0.0",
      description: "Auto-generated Swagger docs from Zod"
    },
    servers: [
      {
        url: "http://localhost:3010"
      }
    ]
  });
}
