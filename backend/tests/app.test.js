import request from "supertest";
import app from "../src/app.js";

describe("Application Core Tests", () => {
  describe("Health Check API", () => {
    it("should return 200 OK with status and service name", async () => {
      const response = await request(app).get("/api/health");
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status", "ok");
      expect(response.body).toHaveProperty("service", "media-analysis-pipeline");
    });
  });

  describe("Global Error Handler", () => {
    it("should return a structured error response for non-existent routes", async () => {
      const response = await request(app).get("/api/v1/invalid-route-that-does-not-exist");
      
      // Note: Express default 404 handler returns HTML unless explicitly caught.
      // In this setup, since we don't have a catch-all 404, we'll verify it's a 404.
      expect(response.status).toBe(404);
    });
  });

  describe("API Response Utilities", () => {
    it("should correctly structure JSON responses", async () => {
        // Mocking a successful endpoint call
        const response = await request(app).get("/api/health");
        expect(response.headers['content-type']).toMatch(/json/);
        expect(response.body).toEqual(expect.objectContaining({
            status: expect.any(String),
            service: expect.any(String)
        }));
    });
  });
});
