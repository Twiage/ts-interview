export const APPROACH = "curb";
export const PROFILE = "driving";
export const ANNOTATION = ["duration", "distance"];

class DistanceMatrixService {
  matrixClient;

  mongoManager;

  constructor(mongoManager, matrixClient) {
    this.matrixClient = matrixClient;
    this.mongoManager = mongoManager;
  }

  async distanceMatrixRequest(locationUpdate): Promise<unknown> {
    if (
      !locationUpdate.hospital.longitude ||
      !locationUpdate.hospital.latitude
    ) {
      console.error(
        `${new Date().toISOString()} No Destination for case ${
          locationUpdate._id
        }`
      );
      return null;
    }

    const response = await this.matrixClient
      .getMatrix({
        points: [
          {
            coordinates: [locationUpdate.longitude, locationUpdate.latitude]
          },
          {
            coordinates: [
              locationUpdate.hospital.longitude,
              locationUpdate.hospital.latitude
            ],
            approach: APPROACH
          }
        ],
        profile: PROFILE,
        annotations: ANNOTATION
      })
      .send();

    if (response.body.code.toUpperCase() === "OK") {
      const eta = response.body.durations[0][1];
      return this.mongoManager.addLocationUpdate(eta, locationUpdate);
    }

    return null;
  }
}

export default DistanceMatrixService;
