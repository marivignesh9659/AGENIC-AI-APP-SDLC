import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const figmaCreateTool = createTool({
  id: 'figma-create-spec',
  description: 'Creates a Figma design specification and returns the file URL',
  inputSchema: z.object({
    featureName: z.string(),
    screens: z.array(z.string()),
    components: z.array(z.string()),
  }),
  outputSchema: z.object({
    figmaFileId: z.string(),
    wireframeUrl: z.string(),
    designUrl: z.string(),
    prototypeUrl: z.string(),
  }),
  execute: async ({ context }) => {
    const fileId = `FIG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    console.log(`🎨 Figma spec created: ${fileId} for ${context.featureName}`);
    return {
      figmaFileId: fileId,
      wireframeUrl: `https://figma.com/file/${fileId}/wireframe`,
      designUrl: `https://figma.com/file/${fileId}/design`,
      prototypeUrl: `https://figma.com/proto/${fileId}`,
    };
  },
});

export const figmaComponentTool = createTool({
  id: 'figma-get-component-library',
  description: 'Fetches existing design system components from Figma',
  inputSchema: z.object({
    teamId: z.string().optional(),
  }),
  outputSchema: z.object({
    components: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    console.log(`📦 Fetching component library for team: ${context.teamId ?? 'default'}`);
    return {
      components: [
        'Button', 'TextInput', 'Modal', 'Table', 'Card',
        'Navbar', 'Sidebar', 'Badge', 'Alert', 'Spinner',
        'Dropdown', 'Checkbox', 'RadioButton', 'Tabs', 'Accordion',
      ],
    };
  },
});