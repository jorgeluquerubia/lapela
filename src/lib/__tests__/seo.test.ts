import {privatePageMetadata} from '../seo';

describe('private page metadata', () => {
  it('prevents indexing and link following', () => {
    expect(privatePageMetadata.robots).toEqual({index: false, follow: false});
  });
});
