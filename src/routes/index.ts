import { response_not_found, response_success } from "$utils/response.utils";
import { Request, Response, Router } from "express";
import RoutesRegistry from "./registry";


const router = Router();

router.get("/", (req: Request, res: Response) => {
  return response_success(res, "main routes!");
})

router.get('/robots.txt', function (req:Request, res:Response) {
  res.type('text/plain')
  res.send(
    `User-agent: *\nAllow: /`);
});
router.get("/ping", (req: Request, res: Response) => {
  return response_success(res, "pong!");
});


router.use("/example", RoutesRegistry.ExampleRoutes)
router.use("/users", RoutesRegistry.UserRoutes)


router.all("*", (req: Request, res: Response, next) => {
  const path = req.path || "";
  if (path.startsWith("/api-docs") || path.startsWith("/api-spec")) {
    return next();
  }
  return response_not_found(res);
});

export default router;
