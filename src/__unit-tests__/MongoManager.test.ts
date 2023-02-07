import { AggregationCursor, Collection, Db, Server } from "mongodb";
import MongoManager, {
  LOCATION_UPDATES_COLLECTION_NAME
} from "../MongoManager";

import { when } from "jest-when";

import config = require("config");
import mongo = require("mongodb");

jest.mock("mongodb");

const MockMongoClient = mongo.MongoClient as jest.Mocked<
  typeof mongo.MongoClient
>;

describe("mongoManager", () => {
  describe("initializeDbConnection", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe("happy path", () => {
      it("should assign configured MongoClient to this.database", async () => {
        // Arrange
        const expectedDatabase = {};
        const expectedDbConnectionStatus = "Connection to database successful";
        const mockConnect = () =>
          new Promise(resolve => resolve(expectedDatabase));
        MockMongoClient.connect.mockImplementation(mockConnect);
        const mongoManager = new MongoManager();

        // Act
        const actualDbConnectionStatus = await mongoManager.initializeDbConnection();

        // Assert
        expect(actualDbConnectionStatus).toEqual(expectedDbConnectionStatus);
        expect(mongoManager.database).toEqual(expectedDatabase);
      });
    });

    describe("failed to connect", () => {
      it("should throw an error", async () => {
        // Arrange
        const expectedError = new Error("oops");
        const mockConnect = () =>
          new Promise((resolve, reject) => reject(expectedError));
        MockMongoClient.connect.mockImplementation(mockConnect);

        const mongoManager = new MongoManager();

        // Act
        try {
          await mongoManager.initializeDbConnection();
        } catch (actualError) {
          // Assert
          expect(actualError).toBe(expectedError);
        }
      });
    });
  });

  describe("queryLocationUpdates", () => {
    it("should call locationUpdateHandler for every location update", async () => {
      // Arrange
      const expectedLocationUpdate1 = {
        _id: "im21",
        longitude: -73.93587335,
        latitude: 41.69434459,
        hospital: {
          longitude: -73.935616,
          latitude: 41.694549
        }
      };
      const expectedLocationUpdate2 = {
        _id: "im22",
        longitude: -73.93587335,
        latitude: 41.69434459,
        hospital: {
          longitude: -73.935616,
          latitude: 41.694549
        }
      };

      const mockLocationUpdateHandler = jest.fn();
      const mongoManager = new MongoManager();
      mongoManager.database = new Db("twiage", new Server("localhost", 1234));
      const mockCollection: Collection = {} as Collection;
      const mockAggregationCursor: AggregationCursor = {} as AggregationCursor;
      mockAggregationCursor.toArray = (): Promise<object[]> =>
        new Promise((resolve): void =>
          resolve([expectedLocationUpdate1, expectedLocationUpdate2])
        );
      mockCollection.aggregate = (): AggregationCursor => mockAggregationCursor;
      mongoManager.database.collection = jest.fn(
        (): Collection => mockCollection
      );
      mongoManager.database.close = jest.fn();

      // Act
      await mongoManager.queryLocationUpdates(mockLocationUpdateHandler);

      // Assert
      expect(mockLocationUpdateHandler.mock.calls[0][0]).toBe(
        expectedLocationUpdate1
      );
      expect(mockLocationUpdateHandler.mock.calls[1][0]).toBe(
        expectedLocationUpdate2
      );
      expect(mongoManager.database.close).toHaveBeenCalled();
    });
  });

  describe("getLocationUpdate", () => {
    it("should return undefined since the location was not found", async () => {
      // Arrange
      const notFoundLocationId = "not-found-location-id";
      const expectedQuery = { _id: notFoundLocationId };
      const expectedLocation = undefined;

      const mongoManager = new MongoManager();
      mongoManager.database = new Db("twiage", new Server("localhost", 1234));
      mongoManager.database.collection = jest.fn();
      const mockLocationCollection: Collection = {} as Collection;
      when(mongoManager.database.collection)
        .calledWith(LOCATION_UPDATES_COLLECTION_NAME)
        .mockReturnValue(mockLocationCollection);

      mockLocationCollection.findOne = jest.fn();
      when(mockLocationCollection.findOne)
        .calledWith(expectedQuery)
        .mockResolvedValue(expectedLocation);

      // Act
      const actualLocation = await mongoManager.getLocation(notFoundLocationId);

      // Assert
      expect(actualLocation).toBeUndefined();
      expect(mongoManager.database.collection).toBeCalledWith(
        LOCATION_UPDATES_COLLECTION_NAME
      );
      expect(mockLocationCollection.findOne).toBeCalledWith(expectedQuery);
    });

    it("should throw an error if MongoManager throws an error", async () => {
      // Arrange
      const notFoundLocationId = "not-found-location-id";
      const expectedQuery = { _id: notFoundLocationId };

      const mongoManager = new MongoManager();
      mongoManager.database = new Db("twiage", new Server("localhost", 1234));
      mongoManager.database.collection = jest.fn();
      const mockLocationCollection: Collection = {} as Collection;
      when(mongoManager.database.collection)
        .calledWith(LOCATION_UPDATES_COLLECTION_NAME)
        .mockReturnValue(mockLocationCollection);

      const expectedError = new Error("oops");
      const mockConnect = () =>
        new Promise((resolve, reject) => reject(expectedError));

      mockLocationCollection.findOne = jest.fn();
      when(mockLocationCollection.findOne)
        .calledWith(expectedQuery)
        .mockImplementationOnce(mockConnect);

      let err;

      // Act
      try {
        await mongoManager.getLocation(notFoundLocationId);
      } catch (error) {
        err = error;
      }

      // Assert
      expect(err).toBeInstanceOf(Error);
      expect(mongoManager.database.collection).toBeCalledWith(
        LOCATION_UPDATES_COLLECTION_NAME
      );
      expect(mockLocationCollection.findOne).toBeCalledWith(expectedQuery);
    });

    it("should return omitted case object aka locationUpdate", async () => {
      // Arrange
      const expectedLocationId = "location-id";
      const expectedQuery = { _id: expectedLocationId };
      const expectedLocation = {
        _id: expectedLocationId,
        longitude: -73.93587335,
        latitude: 41.69434459,
        hospital: {
          longitude: -73.935616,
          latitude: 41.694549
        }
      };

      const mongoManager = new MongoManager();
      mongoManager.database = new Db("twiage", new Server("localhost", 1234));
      mongoManager.database.collection = jest.fn();
      const mockLocationCollection: Collection = {} as Collection;
      when(mongoManager.database.collection)
        .calledWith(LOCATION_UPDATES_COLLECTION_NAME)
        .mockReturnValue(mockLocationCollection);

      mockLocationCollection.findOne = jest.fn();
      when(mockLocationCollection.findOne)
        .calledWith(expectedQuery)
        .mockResolvedValue(expectedLocation);

      // Act
      const actualLocation = await mongoManager.getLocation(expectedLocationId);

      // Assert
      expect(actualLocation).toEqual(expectedLocation);
      expect(mongoManager.database.collection).toBeCalledWith(
        LOCATION_UPDATES_COLLECTION_NAME
      );
      expect(mockLocationCollection.findOne).toBeCalledWith(expectedQuery);
    });
  });

  describe("addLocationUpdate", () => {
    it("it should update database with updated locationUpdate information", async () => {
      // Arrange
      const expectedEta = 30;
      const expectedCaseId = "im21";
      const expectedLocationUpdate = {
        _id: expectedCaseId,
        longitude: -73.93587335,
        latitude: 41.69434459,
        hospital: {
          longitude: -73.935616,
          latitude: 41.694549
        }
      };
      const expectedCollection = config.get("mongo.collection.cases");
      const expectedQuery = { _id: expectedCaseId };
      const expectedUpdateQuery = { $set: { eta: expectedEta } };

      const mockDatabase = {
        collection: jest.fn(() => mockDatabase),
        updateOne: jest.fn(() => new Promise(resolve => resolve()))
      };
      const mongoManager = new MongoManager();
      mongoManager.database = mockDatabase;

      // Act
      await mongoManager.addLocationUpdate(expectedEta, expectedLocationUpdate);

      // Assert
      expect(mockDatabase.collection).toHaveBeenCalledWith(expectedCollection);
      expect(mockDatabase.updateOne).toHaveBeenCalledWith(
        expectedQuery,
        expectedUpdateQuery
      );
    });
  });
});
