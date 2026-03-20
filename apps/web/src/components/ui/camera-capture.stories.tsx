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
    onCapture: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Triggers onCapture with a base64 string when the user clicks the capture button.",
      },
    },
  },
};
