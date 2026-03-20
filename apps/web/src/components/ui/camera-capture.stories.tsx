import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { CameraCapture } from "./camera-capture";

const meta = {
  title: "UI/CameraCapture",
  component: CameraCapture,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-90">
        <Story />
      </div>
    ),
  ],
  args: {
    onCapture: fn(),
  },
} satisfies Meta<typeof CameraCapture>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The component will try to access the device camera. Allow camera permission when prompted.",
      },
    },
  },
};

export const WithCapture: Story = {
  args: {
    value: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg==",
    onCapture: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Shows the captured preview state when the form already has a selfie saved.",
      },
    },
  },
};
