import {getCenteredImagePlacement} from '../image-processing';

describe('getCenteredImagePlacement', () => {
  it('fits a landscape image without cropping and centers it vertically', () => {
    expect(getCenteredImagePlacement(1600, 900)).toEqual({
      canvasWidth: 1400,
      canvasHeight: 1050,
      width: 1400,
      height: 788,
      x: 0,
      y: 131,
    });
  });

  it('fits a portrait image without cropping and centers it horizontally', () => {
    expect(getCenteredImagePlacement(900, 1600)).toEqual({
      canvasWidth: 1400,
      canvasHeight: 1050,
      width: 591,
      height: 1050,
      x: 405,
      y: 0,
    });
  });

  it('does not upscale a small image', () => {
    expect(getCenteredImagePlacement(400, 400)).toEqual({
      canvasWidth: 534,
      canvasHeight: 401,
      width: 400,
      height: 400,
      x: 67,
      y: 1,
    });
  });
});
