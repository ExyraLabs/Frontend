import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import Modal from "../components/Modal";

describe("Modal", () => {
  test("does not render when isOpen is false", () => {
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}}>
        <div>Content</div>
      </Modal>
    );
    expect(container.firstChild).toBeNull();
  });

  test("renders children when open", () => {
    render(
      <Modal isOpen onClose={() => {}}>
        <div>Inner Content</div>
      </Modal>
    );
    expect(screen.getByText("Inner Content")).toBeInTheDocument();
  });

  test("calls onClose on Escape key", () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <div>Inner</div>
      </Modal>
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  test("calls onClose on backdrop click but not on content click", () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <button>Click me</button>
      </Modal>
    );
    // Click content should NOT close
    fireEvent.click(screen.getByText("Click me"));
    expect(onClose).not.toHaveBeenCalled();

    // Click backdrop should close
    const backdrop = screen.getByLabelText("Close modal");
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
