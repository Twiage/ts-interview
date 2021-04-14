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

  async distanceMatrixRequest(origin, destination): Promise<unknown> {
    if (!destination.longitude || !destination.latitude) {
      console.error(
        `${new Date().toISOString()} No Destination for case ${destination}`
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

    return null;
  }
}

export default DistanceMatrixService;
