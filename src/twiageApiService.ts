import request from "axios";

import config = require("config");
import path = require("path");

export const V4_TWIAGE_CASE_PATH = "v4/twiagecases";
export const ETA_UPDATE_PATH = "etaupdate";
export const LOCATION_UPDATES_PATH = "locationUpdates";

const postEtaUpdate = async (locationUpdate): Promise<void> => {
  const uri =
    config.get("api.baseUrl") +
    path.join(
      V4_TWIAGE_CASE_PATH,
      locationUpdate._id.toString(),
      LOCATION_UPDATES_PATH,
      ETA_UPDATE_PATH
    );

  console.log(`About to call ${uri}`);
  try {
    const httpBody = await request.post(uri);
    console.info("Successful ETA Update post request", httpBody);
  } catch (error) {
    console.error("Error with ETA Update post request", error);
  }
};

export default { postEtaUpdate };
