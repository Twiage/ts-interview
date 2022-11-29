import DistanceMatrixService, {
  APPROACH,
  ANNOTATION,
  PROFILE
} from "../distanceMatrixService";

import MongoManager from "../MongoManager";

jest.mock("@mapbox/mapbox-sdk/services/matrix");
jest.mock("../MongoManager");

describe("DistanceMatrixService", () => {
  describe("constructor", () => {
    it("should construct an object", () => {
      // Arrange
      const expectedMatrixClient = { getMatrix: () => {} };
      const expectedMongoManager = new MongoManager();

      // Act
      const distanceMatrixService = new DistanceMatrixService(
        expectedMongoManager,
        expectedMatrixClient
      );

      // Assert
      expect(distanceMatrixService.matrixClient).toEqual(expectedMatrixClient);
      expect(distanceMatrixService.mongoManager).toBeInstanceOf(MongoManager);
    });
  });

  describe("distanceMatrixRequest", () => {
    it("happy path", async () => {
      // Arrange
      const expectedId = "im21";
      const expectedOriginLongitude = -73.93587335;
      const expectedOriginLatitude = 41.69434459;
      const expectedDestinationLongitude = -73.935616;
      const expectedDestinationLatitude = 41.694549;

      const expectedLocationUpdate = {
        _id: expectedId,
        longitude: expectedOriginLongitude,
        latitude: expectedOriginLatitude,
        hospital: {
          longitude: expectedDestinationLongitude,
          latitude: expectedDestinationLatitude
        }
      };

      const expectedEtaInSeconds = 65.6;

      const expectedMapboxMatrixData = {
        body: {
          code: "Ok",
          distances: [
            [0, 139.9],
            [49, 0]
          ],
          durations: [
            [0, expectedEtaInSeconds],
            [25.5, 0]
          ],
          destinations: [
            { distance: 2.713771455, name: "", location: [] },
            { distance: 1.453423572, name: "", location: [] }
          ],
          sources: [
            { distance: 2.713771455, name: "", location: [] },
            { distance: 1.453423572, name: "", location: [] }
          ]
        }
      };

      const expectedOptions = {
        points: [
          {
            coordinates: [expectedOriginLongitude, expectedOriginLatitude]
          },
          {
            coordinates: [
              expectedDestinationLongitude,
              expectedDestinationLatitude
            ],
            approach: APPROACH
          }
        ],
        profile: PROFILE,
        annotations: ANNOTATION
      };

      const mockMapboxMatrixClient = {
        getMatrix: jest.fn(() => ({
          send: async (): Promise<object> => expectedMapboxMatrixData
        }))
      };

      const mockMongoManager = new MongoManager();
      mockMongoManager.addLocationUpdate = jest.fn(async () => {});
      const distanceMatrixService = new DistanceMatrixService(
        mockMongoManager,
        mockMapboxMatrixClient
      );

      // Act
      await distanceMatrixService.distanceMatrixRequest(expectedLocationUpdate);

      // Assert
      expect(mockMapboxMatrixClient.getMatrix).toHaveBeenCalledWith(
        expectedOptions
      );
      expect(mockMongoManager.addLocationUpdate).toHaveBeenCalledWith(
        expectedEtaInSeconds,
        expectedLocationUpdate
      );
    });

    it("invalid hospital location", async () => {
      // Arrange
      const expectedDistanceMatrixRequestResult = null;
      const expectedLocationUpdate = {
        hospital: {}
      };
      const expectedMongoManager = {};
      const expectedMatrixClient = {};

      const distanceMatrixService = new DistanceMatrixService(
        expectedMongoManager,
        expectedMatrixClient
      );

      // Act
      const actualDistanceMatrixRequestResult = await distanceMatrixService.distanceMatrixRequest(
        expectedLocationUpdate
      );

      // Assert
      expect(actualDistanceMatrixRequestResult).toEqual(
        expectedDistanceMatrixRequestResult
      );
    });

    describe("not OK response from matrix client", () => {
      it("should not call addLocationUpdate", async () => {
        // Arrange
        const expectedLocationUpdate = {
          _id: "im21",
          longitude: -73.93587335,
          latitude: 41.69434459,
          hospital: {
            longitude: -73.935616,
            latitude: 41.694549
          }
        };

        const expectedMapboxMatrixData = {
          body: {
            code: "not Ok"
          }
        };

        const mockMapboxMatrixClient = {
          getMatrix: jest.fn(() => ({
            send: () =>
              new Promise(resolve => resolve(expectedMapboxMatrixData))
          }))
        };
        const mockMongoManager = new MongoManager();
        mockMongoManager.addLocationUpdate = jest.fn();
        const distanceMatrixService = new DistanceMatrixService(
          mockMongoManager,
          mockMapboxMatrixClient
        );

        // Act
        await distanceMatrixService.distanceMatrixRequest(
          expectedLocationUpdate
        );

        // Assert
        expect(mockMongoManager.addLocationUpdate).not.toHaveBeenCalled();
      });
    });
  });
});
