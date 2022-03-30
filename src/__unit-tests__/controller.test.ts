import Controller from "../controller";

import MongoManager from "../MongoManager";
import twiageApiService from "../twiageApiService";
import MockDistanceMatrixService from "../distanceMatrixService";

import sinon = require("sinon");
import config = require("config");
import mbxMatrix = require("@mapbox/mapbox-sdk/services/matrix");

jest.mock("@mapbox/mapbox-sdk/services/matrix");
jest.mock("../MongoManager");
jest.mock("../distanceMatrixService");
jest.mock("../twiageApiService");

const mockTwiageApiService = twiageApiService as jest.Mocked<
  typeof twiageApiService
>;

describe("controller", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("beginScript", async () => {
    // Arrange
    const mockMongoManager = new MongoManager();
    mockMongoManager.initializeDbConnection = jest.fn(
      async () => "Db initialized"
    );
    mockMongoManager.queryLocationUpdates = jest.fn(
      async (): Promise<void> => {}
    );
    const expectedBoundHandleLocationUpdate = () => {};
    const mockBind = sinon.stub();
    const controller = new Controller();
    mockBind.withArgs(controller).returns(expectedBoundHandleLocationUpdate);
    controller.handleLocationUpdate = async (): Promise<void> => {};
    controller.handleLocationUpdate.bind = mockBind;
    controller.mongoManager = mockMongoManager;

    // Act
    await controller.beginScript();

    // Assert
    expect(mockMongoManager.initializeDbConnection).toHaveBeenCalled();
    expect(mockMongoManager.queryLocationUpdates).toHaveBeenCalledWith(
      expectedBoundHandleLocationUpdate
    );
  });

  describe("Controller", () => {
    describe("constructor", () => {
      it("should construct a DistanceMatrixService", () => {
        // Arrange
        const expectedMatrixClient = { getMatrix: () => {} };
        const mockMbxMatrix = sinon.stub();
        mockMbxMatrix
          .withArgs(config.get("mapbox"))
          .returns(expectedMatrixClient);

        mbxMatrix.mockImplementation(mockMbxMatrix);

        // Act
        const actualController = new Controller();

        // Assert
        expect(actualController.distanceMatrixService).toBeInstanceOf(
          MockDistanceMatrixService
        );
        expect(actualController.mongoManager).toBeInstanceOf(MongoManager);
        expect(
          MockDistanceMatrixService.prototype.constructor
        ).toHaveBeenCalledWith(
          actualController.mongoManager,
          expectedMatrixClient
        );
      });
    });

    describe("handleLocationUpdate", () => {
      it("happy path - should call postEtaUpdate", async () => {
        // Arrange
        const expectedLocationUpdate = {
          eta: 1,
          latitude: 10,
          longitude: 1,
          hospital: {
            latitude: 12,
            longitude: 21
          }
        };

        const mockPostEtaUpdate = async (): Promise<void> => {};

        const mockMongoManager = new MongoManager();
        mockMongoManager.initializeDbConnection = jest.fn(
          async () => "Db initialized"
        );
        mockTwiageApiService.postEtaUpdate.mockImplementation(
          mockPostEtaUpdate
        );

        const mockDistanceMatrixService = {
          distanceMatrixRequest: jest.fn(
            () => new Promise(resolve => resolve())
          )
        };

        const controller = new Controller();
        controller.distanceMatrixService = mockDistanceMatrixService;

        // Act
        await controller.handleLocationUpdate(expectedLocationUpdate);

        // Assert
        expect(mockDistanceMatrixService.distanceMatrixRequest).toBeCalledWith(
          expectedLocationUpdate
        );
        expect(mockTwiageApiService.postEtaUpdate).toBeCalledWith(
          expectedLocationUpdate
        );
      });
    });
  });
});
