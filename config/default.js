module.exports = {
  mapbox: {
    accessToken: process.env.MAPBOX_API_KEY
  },
  mongo: {
    url: process.env.MONGO_URL || "mongodb://mongourl/twiage",
    collection: {
      cases: "twiagecases",
      locationUpdates: "locationupdates"
    }
  },
  api: {
    baseUrl: "http://localhost:3000/"
  }
};
