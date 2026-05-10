// Global test setup — runs before every unit test file
import { expect } from "vitest";

// Make expect available globally (already handled by globals:true in vitest.config)
// Add any global mocks here as the project grows

// Silence console.error in tests unless explicitly tested
const originalError = console.error;
beforeEach(() => {
  console.error = (...args: unknown[]) => {
    // Re-throw only unexpected errors, not intentional ones tested below
    if (
      typeof args[0] === "string" &&
      args[0].includes("Warning: ReactDOM.render")
    )
      return;
    originalError(...args);
  };
});

afterEach(() => {
  console.error = originalError;
});
