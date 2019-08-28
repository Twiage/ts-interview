import axios from "axios";

import { MongoClient } from "mongodb";
import {
  V4_TWIAGE_CASE_PATH,
  LOCATION_UPDATES_PATH,
  ETA_UPDATE_PATH
} from "../twiageApiService";

import Controller from "../controller";

jest.mock("axios");
jest.mock("mongodb");
jest.mock("@mapbox/mapbox-sdk/services/matrix");

import sinon = require("sinon");
import config = require("config");
import path = require("path");
import mbxMatrix = require("@mapbox/mapbox-sdk/services/matrix");

const mockAxios = axios as jest.Mocked<typeof axios>;

const MockMongoClient = MongoClient as jest.Mocked<typeof MongoClient>;

describe("script system test", () => {
  it("script", async () => {
    // Arrange
    const expectedCaseId = "some-case-hash";
    const expectedEtaInSeconds = 720;
    const expectedLocationUpdate = {
      _id: expectedCaseId,
      latitude: 142,
      longitude: 41,
      hospital: {
        latitude: 124,
        longitude: 104
      }
    };
    const expectedFindCaseParams = {
      _id: expectedCaseId
    };
    const expectedSetEtaParams = {
      $set: { eta: expectedEtaInSeconds }
    };

    const mockAggregateCursor = {
      toArray: () => new Promise(resolve => resolve([expectedLocationUpdate]))
    };
    const mockCollection = {
      updateOne: jest.fn(() => new Promise(resolve => resolve())),
      aggregate: () => mockAggregateCursor
    };
    const mockDb = {
      close: () => new Promise(resolve => resolve()),
      collection: () => mockCollection
    };

    const expectedMapboxMatrixData = {
      body: { durations: [[0, expectedEtaInSeconds]], code: "Ok" }
    };
    const mockMapboxMatrixClient = {
      getMatrix: () => ({
        send: () => new Promise(resolve => resolve(expectedMapboxMatrixData))
      })
    };

    const mockConnect = async () => mockDb;

    mockAxios.post.mockImplementation(() => new Promise(resolve => resolve()));
    MockMongoClient.connect.mockImplementation(mockConnect);

    const mockMbxMatrix = sinon.stub();
    mockMbxMatrix
      .withArgs(config.get("mapbox"))
      .returns(mockMapboxMatrixClient);

    mbxMatrix.mockImplementation(mockMbxMatrix);

    const expectedEtaUpdateUrl =
      config.get("api.baseUrl") +
      path.join(
        V4_TWIAGE_CASE_PATH,
        expectedLocationUpdate._id.toString(),
        LOCATION_UPDATES_PATH,
        ETA_UPDATE_PATH
      );
    const controller = new Controller();

    // Act
    await controller.beginScript();

    // Assert
    expect(mockCollection.updateOne).toHaveBeenCalledWith(
      expectedFindCaseParams,
      expectedSetEtaParams
    );
    expect(mockAxios.post).toHaveBeenCalledWith(expectedEtaUpdateUrl);
  });
});
