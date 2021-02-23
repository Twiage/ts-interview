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

  async distanceMatrixRequest(caseId, origin, destination): Promise<unknown> {
    if (!destination.longitude || !destination.latitude) {
      console.error(
        `${new Date().toISOString()} No Destination for case ${destination._id}`
      );
      return null;
    }

    const response = await this.matrixClient
      .getMatrix({
        points: [
          {
            coordinates: [origin.longitude, origin.latitude]
          },
          {
            coordinates: [destination.longitude, destination.latitude],
            approach: APPROACH
          }
        ],
        profile: PROFILE,
        annotations: ANNOTATION
      })
      .send();

    if (response.body.code.toUpperCase() === "OK") {
      const eta = response.body.durations[0][1];
      return this.mongoManager.addLocationUpdate(eta, { _id: caseId });
    }

    return null;
  }
}

export default DistanceMatrixService;
