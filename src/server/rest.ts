import express from "express";
import routes from "$routes/index";
import cors from "cors";
import morganMiddleware from "$middlewares/morganMiddleware";
import swaggerUi from "swagger-ui-express";
import { getOpenAPIDocument } from "$swagger/openapi";
import * as expressOasGenerator from "express-oas-generator";
import { env } from "$config/env";

const swaggerDocument = getOpenAPIDocument();

export default function createRestServer() {
  let allowedOrigins: string[] = ["*"];
  const corsOptions: cors.CorsOptions = {};
  if (env.environment !== "dev") {
    allowedOrigins = env.allowedOrigins;
    corsOptions.origin = allowedOrigins;
  }

  const app = express();
  // Express OAS Generator: basic init (auto-registers /api-docs and /api-spec)
  expressOasGenerator.init(app, {}, "./src/swagger/express-oas.json", 10000, "api-docs");
  app.use(cors(corsOptions));
  app.use(morganMiddleware);
  app.use(express.json());
  app.get("/swagger.json", (req, res) => res.json(swaggerDocument));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.use(routes);

  return app;
}
