import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TimelineScrubber } from "./TimelineScrubber";

describe("TimelineScrubber", () => {
  it("lets the user clear and re-enter preview days without keeping a leading zero", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <TimelineScrubber
        previewDays={0}
        actualDays={0}
        maxDays={365}
        quitDateISO="2026-03-01"
        onChange={handleChange}
      />,
    );

    const input = screen.getByLabelText(/go to day number/i);

    await user.clear(input);
    expect(input).toHaveValue(null);

    await user.type(input, "08");

    expect(input).toHaveValue(8);
    expect(handleChange).toHaveBeenLastCalledWith(8);
  });
});
