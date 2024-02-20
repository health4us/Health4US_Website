// This class is not injected to the DOM anywhere, it's only here for the autocomplete.
// The selector .page is implemented here: https://github.com/wix-private/css-editing-utils/blob/master/packages/css-processor/src/cssProcessor.ts#L29
const semanticClassNames = {
  root: 'page',
} as const;

export default semanticClassNames;
