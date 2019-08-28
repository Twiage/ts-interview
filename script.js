import config from "config";
import packageJson from "./package.json";
import Controller from "./src/controller.ts";

// eslint-disable-next-line import/prefer-default-export
export const calculate = () => {
  console.info(`ETA calc ${packageJson.version} started`, config.mongo);

  const controller = new Controller();

  controller.beginScript().then(() => console.info("script has finished"));
};
