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

const FileSchema = registry.register(
  "FileUpload",
  z.object({
    id: z.number().int(),
    fileUrl: z.string().url(),
    status: z.string(),
    errorMessage: z.string().nullable(),
    totalRows: z.number().int().nullable(),
    processedRows: z.number().int().nullable(),
    uploadedById: z.number().int(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
  })
);

const FileListResponseSchema = registry.register(
  "FileListResponse",
  z.object({
    files: z.array(FileSchema)
  })
);

// Paths
registry.registerPath({
  method: "get",
  path: "/users",
  tags: ["Users"],
  request: {
    query: z.object({
      filters: z.string().optional(),
      searchFilters: z.string().optional(),
      rangedFilters: z.string().optional(),
      orderKey: z.string().optional(),
      orderRule: z.string().optional(),
      rows: z.number().int().optional(),
      page: z.number().int().optional()
    })
  },
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

registry.registerPath({
  method: "get",
  path: "/files",
  tags: ["Files"],
  request: {
    query: z.object({
      filters: z.string().optional(),
      searchFilters: z.string().optional(),
      rangedFilters: z.string().optional(),
      orderKey: z.string().optional(),
      orderRule: z.string().optional(),
      rows: z.number().int().optional(),
      page: z.number().int().optional()
    })
  },
  responses: {
    200: {
      description: "List files",
      content: {
        "application/json": {
          schema: FileListResponseSchema
        }
      }
    }
  }
});

registry.registerPath({
  method: "get",
  path: "/files/{id}",
  tags: ["Files"],
  request: {
    params: z.object({
      id: z.number().int().positive()
    })
  },
  responses: {
    200: {
      description: "Get file by id",
      content: {
        "application/json": {
          schema: z.object({ file: FileSchema })
        }
      }
    },
    404: {
      description: "File not found"
    }
  }
});

registry.registerPath({
  method: "get",
  path: "/files/{id}/records",
  tags: ["Files"],
  request: {
    params: z.object({
      id: z.number().int().positive()
    }),
    query: z.object({
      filters: z.string().optional(),
      searchFilters: z.string().optional(),
      rangedFilters: z.string().optional(),
      orderKey: z.string().optional(),
      orderRule: z.string().optional(),
      rows: z.number().int().optional(),
      page: z.number().int().optional(),
      q: z.string().optional()
    })
  },
  responses: {
    200: {
      description: "List records for a file",
      content: {
        "application/json": {
          schema: z.object({
            records: z.array(
              z.object({
                id: z.number().int(),
                fileId: z.number().int(),
                rowNumber: z.number().int(),
                externalId: z.string(),
                customerName: z.string(),
                sentiment: z.string(),
                csatScore: z.number().int().nullable(),
                callTimestamp: z.string().datetime().nullable(),
                reason: z.string().nullable(),
                city: z.string().nullable(),
                state: z.string().nullable(),
                channel: z.string().nullable(),
                responseTime: z.string().nullable(),
                callDurationMinutes: z.number().int().nullable(),
                callCenter: z.string().nullable(),
                createdAt: z.string().datetime()
              })
            )
          })
        }
      }
    }
  }
});

registry.registerPath({
  method: "get",
  path: "/files/{id}/summary",
  tags: ["Files"],
  request: {
    params: z.object({
      id: z.number().int().positive()
    })
  },
  responses: {
    200: {
      description: "File summary",
      content: {
        "application/json": {
          schema: z.object({
            summary: z.object({
              fileId: z.number().int(),
              totalRecords: z.number().int(),
              avgCsatScore: z.number().nullable(),
              bySentiment: z.record(z.string(), z.number())
            })
          })
        }
      }
    }
  }
});

registry.registerPath({
  method: "post",
  path: "/files",
  tags: ["Files"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            fileUrl: z.string()
          })
        },
        "multipart/form-data": {
          schema: z.object({
            file: z.string().openapi({ type: "string", format: "binary" })
          })
        }
      }
    }
  },
  responses: {
    201: {
      description: "Create file job",
      content: {
        "application/json": {
          schema: z.object({ file: FileSchema })
        }
      }
    }
  }
});

registry.registerPath({
  method: "post",
  path: "/files/{id}/retry",
  tags: ["Files"],
  request: {
    params: z.object({
      id: z.number().int().positive()
    })
  },
  responses: {
    200: {
      description: "Retry file processing",
      content: {
        "application/json": {
          schema: z.object({ file: FileSchema })
        }
      }
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
