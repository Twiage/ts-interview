import { Db, MongoClient } from "mongodb";

import config = require("config");
import moment = require("moment");

export const LOCATION_UPDATES_COLLECTION_NAME: string = config.get(
  "mongo.collection.locationUpdates"
);
const CASES_COLLECTION_NAME: string = config.get("mongo.collection.cases");

class MongoManager {
  static locationUpdateFrequency = 3;

  static agOpts = [
    {
      $match: {
        createdAt: {
          $gte: moment()
            .subtract(MongoManager.locationUpdateFrequency, "minutes")
            .toDate()
        },
        hospital: { $exists: true }
      }
    },
    {
      $lookup: {
        from: CASES_COLLECTION_NAME,
        localField: "twiageCase",
        foreignField: "_id",
        as: "case"
      }
    },
    { $unwind: "$case" },
    {
      $match: {
        "case.markedArrivedAt": null,
        "case.events.0.type": { $ne: "CLOSED BY EMS" }
      }
    },
    {
      $sort: { twiageCase: 1, createdAt: -1 }
    },
    {
      $group: {
        _id: "$twiageCase",
        latitude: { $first: "$latitude" },
        longitude: { $first: "$longitude" },
        hospital: { $first: "$hospital" }
      }
    }
  ];

  database: Db;

  async initializeDbConnection(): Promise<string> {
    console.log("connecting to db");
    try {
      this.database = await MongoClient.connect(config.get("mongo.url"));
      console.info("Connection to database successful");
      return "Connection to database successful";
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  queryLocationUpdates(locationUpdateHandler): Promise<unknown> {
    console.log("quering location updates");
    let aggregateCursor;
    console.info("Beginning aggregation");
    try {
      aggregateCursor = this.database
        .collection(LOCATION_UPDATES_COLLECTION_NAME)
        .aggregate(MongoManager.agOpts, { cursor: { batchSize: 1 } });
    } catch (ex) {
      console.error(ex);
    }
    return aggregateCursor
      .toArray()
      .then(updates => {
        console.info(
          "aggregation successful, number of updates found: ",
          updates.length,
          updates[0]
        );
        return Promise.all(updates.map(u => locationUpdateHandler(u)));
      })
      .then(() => this.database.close())
      .then(() =>
        console.info(`${new Date().toISOString()} End of script run`)
      );
  }

  async getLocationUpdate(id: string) {
    throw new Error("Not implemented");
  }

  async addLocationUpdate(eta, locationUpdate): Promise<void> {
    console.log("New ETA", eta);

    try {
      await this.database
        .collection(CASES_COLLECTION_NAME)
        .updateOne({ _id: locationUpdate._id }, { $set: { eta } });
      console.info(
        `${new Date().toISOString()} Added ETA ${eta} for case ${
          locationUpdate._id
        } to db`
      );
    } catch (err) {
      console.error(`Error updating eta for case ${locationUpdate._id}`, err);
    }
  }
}

export default MongoManager;
