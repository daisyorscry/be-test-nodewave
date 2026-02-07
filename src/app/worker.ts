import Logger from "$pkg/logger";
import { startCallCenterWorker } from "$queues/callCenterQueue";

const startWorkerApp = () => {
  Logger.info("Starting App : worker");
  startCallCenterWorker();
};

export default startWorkerApp;
