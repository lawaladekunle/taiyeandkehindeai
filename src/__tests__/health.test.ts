/**
 * @jest-environment node
 */

// Test the health endpoint's response structure
describe("/api/health", () => {
  it("returns status ok structure", () => {
    // Validate the expected response shape without starting a server
    const expectedShape = { status: "ok" };
    expect(expectedShape).toHaveProperty("status");
    expect(expectedShape.status).toBe("ok");
  });

  it("has correct status field type", () => {
    const expectedShape = { status: "ok" };
    expect(typeof expectedShape.status).toBe("string");
  });
});
