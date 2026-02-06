
import server from "$server/instance";
import Logger from "$pkg/logger";
import { startCallCenterWorker } from "$queues/callCenterQueue";
import { env } from "$config/env";

const startRestApp =  () => {
  Logger.info("Starting App : rest")
  startCallCenterWorker();
  const app = server.restServer();
  const PORT: number = env.nodeLocalPort;
  return app.listen(PORT, () => {
    Logger.info(`Rest App is Running at Port ${PORT}`)
  });
};


export default startRestApp;
