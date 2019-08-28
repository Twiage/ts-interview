import MongoManager from "./MongoManager";
import DistanceMatrixService from "./distanceMatrixService";
import twiageApiService from "./twiageApiService";

import config = require("config");
import mbxMatrix = require("@mapbox/mapbox-sdk/services/matrix");

class Controller {
  mongoManager;

  distanceMatrixService;

  constructor() {
    const matrixClient = mbxMatrix(config.get("mapbox"));
    this.mongoManager = new MongoManager();
    this.distanceMatrixService = new DistanceMatrixService(
      this.mongoManager,
      matrixClient
    );
  }

  async handleLocationUpdate(locationUpdate): Promise<void> {
    try {
      await this.distanceMatrixService.distanceMatrixRequest(locationUpdate);
    } catch (e) {
      console.error("distanceMatrixRequest failed like a little girls", e);
    }

    console.info(`Got Mapbox Distance Matrix for ${locationUpdate._id}`);
    await twiageApiService.postEtaUpdate(locationUpdate);
  }

  async beginScript(): Promise<void> {
    await this.mongoManager.initializeDbConnection();
    console.log("db initialized");
    await this.mongoManager.queryLocationUpdates(
      this.handleLocationUpdate.bind(this)
    );
  }
}

export default Controller;
