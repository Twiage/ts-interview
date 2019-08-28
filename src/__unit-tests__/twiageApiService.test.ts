import axios from "axios";
import twiageApiService, {
  ETA_UPDATE_PATH,
  LOCATION_UPDATES_PATH,
  V4_TWIAGE_CASE_PATH
} from "../twiageApiService";

import config = require("config");
import path = require("path");

jest.mock("axios");

const mockAxios = axios as jest.Mocked<typeof axios>;

describe("twiageApiService", () => {
  it("postEtaUpdate", async () => {
    // Arrange
    const expectedCaseId = 2346;
    const expectedLocationUpdate = {
      _id: expectedCaseId
    };

    const mockPost = async (): Promise<void> => {};
    mockAxios.post.mockImplementation(mockPost);

    const expectedUrl =
      config.get("api.baseUrl") +
      path.join(
        V4_TWIAGE_CASE_PATH,
        expectedCaseId.toString(),
        LOCATION_UPDATES_PATH,
        ETA_UPDATE_PATH
      );

    // Act
    await twiageApiService.postEtaUpdate(expectedLocationUpdate);

    // Assert
    expect(mockAxios.post).toHaveBeenCalledWith(expectedUrl);
  });
});
