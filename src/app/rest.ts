
import server from "$server/instance";
import Logger from '$pkg/logger';
import { startCallCenterWorker } from "$queues/callCenterQueue";

const startRestApp =  () => {
  Logger.info("Starting App : rest")
  startCallCenterWorker();
  const app = server.restServer();
  const PORT: number = Number(process.env.NODE_LOCAL_PORT) || 3010;
  return app.listen(PORT, () => {
    Logger.info(`Rest App is Running at Port ${PORT}`)
  });
};


export default startRestApp;
