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
  app.get("/docs/postman.json", (req, res) => {
    res.setHeader("Content-Disposition", "attachment; filename=\"nodewave.postman.json\"");
    res.json(swaggerDocument);
  });
  app.get("/docs/postman.js", (req, res) => {
    res.type("application/javascript").send(`
      window.addEventListener("load", function () {
        const topbar = document.querySelector(".topbar");
        if (!topbar) return;
        const link = document.createElement("a");
        link.href = "/docs/postman.json";
        link.textContent = "Download Postman";
        link.style.marginLeft = "12px";
        link.style.color = "#ffffff";
        link.style.background = "#ff6c37";
        link.style.padding = "6px 12px";
        link.style.borderRadius = "4px";
        link.style.textDecoration = "none";
        topbar.appendChild(link);
      });
    `);
  });
  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      customSiteTitle: "NodeWave API Docs",
      customCss: ".topbar-wrapper .link { display:none }",
      customfavIcon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>",
      customJs: "/docs/postman.js"
    })
  );
  app.get("/docs/postman", (req, res) => res.redirect("/docs/postman.json"));
  app.use(routes);

  return app;
}
